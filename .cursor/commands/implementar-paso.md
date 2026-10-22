---
description: Implements one step of the approved user-story plan and then stops.
---

# Implement one plan step

The user names the number and scope of the only step to run.

Example:

- `/implementar-paso Step 2: integrate the groups query`

## Who to use

- Agent: `step-implementer`. It is the only agent that may edit in this command.
- One skill, and only if the approved step requires it:
  - `/maquetar` for screens, components, and visual states.
  - `/integration-query-mock` for queries, contracts, and read Server Actions.
  - `/integration-command` for writes, forms, and confirmations.
- Rules: `.cursor/rules/clean-code.mdc`, `.cursor/rules/nextjs-architecture.mdc`, `.cursor/rules/project-conventions.mdc`, and `.cursor/rules/human-controlled-workflow.mdc`.

Do not use these agents to implement or to continue afterward: `hu-analyst`, `code-reviewer`, `acceptance-validator`.

## Instructions

1. Identify the number and text of the step the user wrote after the command.
2. Check that this step exists in the approved plan of this conversation. If there is no approved plan, stop and ask for approval. Do not pick another step.
3. If the step depends on an open decision or on a previous step that is not done, stop and ask.
4. Use the skill the plan assigned to this step. Read that skill and follow it only inside this scope. If the step matches none of the three skills, do not invent another one.
5. Ask `step-implementer` to implement only that step.
6. When finished, report what was done, the files changed and why, the checks and their results, the criteria covered, and what is still pending.
7. Leave the diff for review.

## Hard constraints

- Do not implement the next step or any other step in the plan.
- Do not widen the scope or refactor outside what was approved.
- Do not invent contracts, endpoints, or business rules.
- Do not run git commit, git push, or create a pull request.
- Do not move on to `/revisar-paso` or `/validar-hu` on your own.
- If the user asks for fixes on this step, fix only those points and validate again. Do not advance.

Stop and wait for the user's review.
