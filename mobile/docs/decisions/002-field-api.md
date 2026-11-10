# ADR 002: Share server-backed field state while preserving native views

Status: accepted for the authorized web/mobile presentation circuit.

## Decision

Keep all five approved view compositions and replace their fixture provider with authenticated API hydration and explicit commands. The browser uses a same-origin HttpOnly BFF via a bounded loopback preview gateway. Native requests require a validated API origin and tenant hostname, with the bearer token kept in memory.

Selected image evidence uses the SDK-compatible Expo ImagePicker library. The app accepts JPEG/PNG/WebP up to 1 MiB, sends bytes atomically with visit closure and retrieves saved evidence through the authenticated visit endpoint. The illustrative map does not measure or validate GPS.

## Alternatives and consequences

Direct browser bearer calls would avoid a gateway but expose tokens to browser JavaScript and require CORS configuration. The BFF preserves the existing web session boundary and supports reload. Native secure storage would improve process-restart convenience but requires a separately designed storage policy; native restart currently requires login while server history persists.

Optimistic local completion would appear faster but could hide rejected writes. The app waits for confirmed server execution, refreshes authoritative state and reports failures explicitly. An uncertain command retains its original operation key and immutable payload; a confirmed result releases the key before refresh.

The package uses pnpm with a committed lockfile. Only the existing esbuild install script is explicitly allowed; no global tools or broad build-script permission are installed. Device gallery operation is not proven by browser or TypeScript checks.
