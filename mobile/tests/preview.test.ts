import assert from "node:assert/strict";
import test from "node:test";
import http from "node:http";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const { createPreview } = require("../scripts/preview.cjs");
test("preview serves SPA safely and preserves browser cookie/authority/origin only to configured BFF", async () => {
  const dist = mkdtempSync(path.join(tmpdir(), "mobile-preview-"));
  writeFileSync(path.join(dist, "index.html"), "<html>mobile</html>");
  let received: http.IncomingHttpHeaders | undefined;
  const target = http.createServer((req, res) => {
    received = req.headers;
    res.setHeader("set-cookie", "session=server; HttpOnly; Path=/");
    res.end("{}");
  });
  await new Promise<void>((r) => target.listen(0, "127.0.0.1", r));
  const server = createPreview({
    dist,
    frontendOrigin: `http://127.0.0.1:${(target.address() as any).port}`,
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(
      await (
        await fetch(origin + "/visits/123/record", {
          headers: { accept: "text/html" },
        })
      ).text(),
      "<html>mobile</html>",
    );
    assert.equal((await fetch(origin + "/missing.js")).status, 404);
    assert.equal((await fetch(origin + "/%2e%2e%5csecret")).status, 400);
    const response = await fetch(origin + "/api/field/me/", {
      headers: { origin, cookie: "session=test" },
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie")!, /HttpOnly/);
    assert.equal(received?.host, origin.replace("http://", ""));
    assert.equal(received?.origin, origin);
    assert.equal(received?.cookie, "session=test");
    assert.throws(
      () => createPreview({ dist, frontendOrigin: "https://example.com" }),
      /loopback/,
    );
    const rejected = await new Promise<number | undefined>(
      (resolve, reject) => {
        const request = http.get(
          origin + "/api/field/me/",
          { headers: { host: "attacker.example" } },
          (response) => {
            response.resume();
            resolve(response.statusCode);
          },
        );
        request.on("error", reject);
      },
    );
    assert.equal(rejected, 400);
  } finally {
    await Promise.all([
      new Promise<void>((r) => server.close(r)),
      new Promise<void>((r) => target.close(() => r())),
    ]);
    rmSync(dist, { recursive: true });
  }
});
