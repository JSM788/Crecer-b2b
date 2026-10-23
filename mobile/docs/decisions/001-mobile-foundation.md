# ADR 001: Independent visual mobile foundation

Status: accepted for the authorized visual implementation.

## Decision

Use Expo, React Native, TypeScript and Expo Router in an independently installed `mobile/` package. Keep the existing Next.js web app at the repository root. Use native controls and a shared token-based theme. Organize by capability and route files only compose screens.

## Reasons and alternatives

Expo provides a native development path while allowing a browser presentation. Extending the root Next.js app would make a web-only demo simpler, but would couple future mobile work to DOM components. A full monorepo migration now adds unrelated risk to the existing presentation; defer shared packages until there is a concrete shared contract.

## Consequences

Two packages have separate lockfiles and dependency lifecycles. Root TypeScript excludes `mobile/` so the web compiler does not discover native source or nested dependencies. Future shared packages should contain transport contracts and pure rules with clear ownership, not blindly share platform UI.

The visual demo has no backend or native field integrations. Future durable data and synchronization need their own decisions, tests and contracts. Do not pre-create those implementations or empty future modules.
