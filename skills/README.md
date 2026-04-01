# xStocks Internal Skill Surface

Use these repo-owned surfaces in order:

1. [xstocks-agent-start](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-agent-start/SKILL.md) for the internal entrypoint and public/private boundary.
2. [xstocks-qualification](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-qualification/SKILL.md) for canonical qualification.
3. [xstocks-activation-truth](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-activation-truth/SKILL.md) for route-truth and readiness verification.
4. [xstocks-operator-execution-proof](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-operator-execution-proof.md) for execution-proof capture or exact blocker reporting.

Public-safe orientation still starts at [apps/web/public/skill.md](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/public/skill.md). The internal skill surface may reference local commands and repo-owned API routes, but it must still avoid private hosts, wallet secrets, treasury details, and hidden custody internals.
