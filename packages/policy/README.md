# packages/policy

Policy derivation for the manifest-to-execution boundary.

Current responsibilities:
1. validate promoted `activation_manifest` inputs,
2. derive route and vault truth labels,
3. derive recommendation payloads from promoted manifests,
4. compile canonical qualification from shared onboarding answers into slot and user-profile truth,
5. derive activation-time `execution_plan` payloads,
6. expose smart-account review scaffolding without embedding provider execution logic.
