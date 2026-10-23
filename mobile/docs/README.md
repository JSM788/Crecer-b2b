# Mobile project dossier

Use this index to locate implementation evidence without scanning the full repository. Documentation is a navigation aid; verify source before diagnosing a defect.

| Need                                          | Start here                                                |
| --------------------------------------------- | --------------------------------------------------------- |
| Run or verify                                 | [Package README](../README.md)                            |
| Locate a screen, rule or setting              | [Module map](module-map.md)                               |
| Understand dependencies and future growth     | [Architecture](architecture.md)                           |
| Follow arrival, visit and workday transitions | [Basic visit flow](flows/basic-visits.md)                 |
| Understand technology and scope decisions     | [Foundation decision](decisions/001-mobile-foundation.md) |
| Diagnose a failure                            | [Troubleshooting](troubleshooting/README.md)              |
| Agent contribution rules                      | [Agent entry point](../AGENTS.md)                         |

## Maintenance contract

For UI work, first read the [visual reference contract](visual-reference.md).

Each behavior change updates its flow and owning module entry. Each integration documents its contract and failure handling when implemented. Record architectural decisions with alternatives and consequences. Keep implementation status explicit: **implemented demo**, **simulated capability**, or **planned**. Avoid duplicating source-level details that change frequently.
