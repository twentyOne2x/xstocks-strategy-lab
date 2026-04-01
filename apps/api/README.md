# apps/api

Backend API service for the manifest-to-execution boundary.

Current responsibilities:
1. fetch recommendations from promoted manifests,
2. qualify onboarding-style answers into canonical slot/recommendation output for agents,
3. preflight promoted manifests into `execution_plan` payloads,
4. persist activation records and related activity events,
5. expose route and vault truth labels for frontend rendering,
6. keep funding and smart-account provider wiring behind backend contracts.
