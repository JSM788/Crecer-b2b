const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const loopbacks = new Set(["localhost", "127.0.0.1", "[::1]"]);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};
function createPreview({
  dist = path.resolve(__dirname, "../dist"),
  frontendOrigin = process.env.FRONTEND_ORIGIN,
} = {}) {
  const target = new URL(frontendOrigin || "");
  if (
    target.protocol !== "http:" ||
    !loopbacks.has(target.hostname) ||
    target.username ||
    target.password ||
    target.pathname !== "/" ||
    target.search ||
    target.hash
  )
    throw new Error(
      "FRONTEND_ORIGIN must be an explicit loopback HTTP origin.",
    );
  const root = fs.realpathSync(dist);
  return http.createServer((req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    const reject = (status) => {
      res.writeHead(status);
      res.end(http.STATUS_CODES[status]);
    };
    try {
      const authority = new URL(`http://${req.headers.host}`);
      if (
        !loopbacks.has(authority.hostname) ||
        authority.host !== req.headers.host
      )
        throw new Error();
    } catch {
      return reject(400);
    }
    let pathname;
    try {
      pathname = decodeURIComponent((req.url || "/").split("?")[0]);
      if (
        !pathname.startsWith("/") ||
        /[\\\0:]/.test(pathname) ||
        pathname
          .split("/")
          .some((segment) => segment === ".." || segment === ".")
      )
        throw new Error();
    } catch {
      return reject(400);
    }
    if (pathname === "/api/field" || pathname.startsWith("/api/field/")) {
      if (
        !["GET", "POST"].includes(req.method) ||
        !/^\/api\/field(?:\/[A-Za-z0-9_-]+)*\/?$/.test(pathname)
      )
        return reject(400);
      if (Number(req.headers["content-length"] || 0) > 1500000)
        return reject(413);
      const headers = { host: req.headers.host };
      for (const name of [
        "accept",
        "content-type",
        "cookie",
        "origin",
        "referer",
        "idempotency-key",
      ])
        if (req.headers[name]) headers[name] = req.headers[name];
      const upstream = http.request(
        {
          hostname: target.hostname.replace(/^\[|\]$/g, ""),
          port: target.port || 80,
          path: req.url,
          method: req.method,
          headers,
        },
        (response) => {
          res.writeHead(
            response.statusCode || 502,
            Object.fromEntries(
              Object.entries(response.headers).filter(
                ([name]) => !["connection", "transfer-encoding"].includes(name),
              ),
            ),
          );
          response.pipe(res);
        },
      );
      let size = 0;
      req.on("data", (chunk) => {
        size += chunk.length;
        if (size > 1500000) {
          upstream.destroy();
          if (!res.headersSent) reject(413);
        }
      });
      req.on("aborted", () => upstream.destroy());
      upstream.setTimeout(20000, () => upstream.destroy());
      upstream.on("error", () => {
        if (!res.headersSent) reject(502);
        else res.end();
      });
      req.pipe(upstream);
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) return reject(405);
    let file = path.resolve(root, "." + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) return reject(400);
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    } catch {
      if (
        path.extname(pathname) ||
        !(req.headers.accept || "").includes("text/html")
      )
        return reject(404);
      file = path.join(root, "index.html");
    }
    try {
      file = fs.realpathSync(file);
      if (!file.startsWith(root + path.sep) || !fs.statSync(file).isFile())
        return reject(404);
      res.setHeader(
        "Content-Type",
        mime[path.extname(file).toLowerCase()] || "application/octet-stream",
      );
      if (req.method === "HEAD") return res.end();
      const stream = fs.createReadStream(file);
      stream.on("error", () => res.destroy());
      stream.pipe(res);
    } catch {
      reject(404);
    }
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT || 8081),
    host = process.env.HOST || "127.0.0.1";
  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !["127.0.0.1", "::1"].includes(host)
  )
    throw new Error("Use a valid PORT and a loopback HOST.");
  createPreview().listen(port, host, () =>
    console.log(`Mobile preview: http://${host}:${port}`),
  );
}
module.exports = { createPreview };
