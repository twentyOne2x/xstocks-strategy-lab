# XSL-016 Auth Boundary Recheck

Date: 2026-04-01

This recheck loaded backend Privy config from the machine-local shared env plus the repo-local public app id.

Exact result:
- `POST /api/activations` without auth -> `401 Privy access token is required.`
- `GET /api/activity` without auth -> `401 Privy access token is required.`
- `GET /api/executions` without auth -> `401 Privy access token is required.`

Updated truthful claim:
- backend Privy verification config exists on this machine
- the authenticated boundary is now blocked by missing live user auth, not by missing backend config

Exact next missing input:
- one real Privy access token for the activation-owning user
