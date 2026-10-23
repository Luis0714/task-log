---
description: Reviews the diff of the implemented step and reports findings, without fixing files.
---

# Review the implemented step

The user asks for a review of the step that was just implemented. They may name the step number.

Example:

- `/revisar-paso Step 2`

## Who to use

- Agent: `code-reviewer`. It is read-only. Use it to inspect the diff and report findings.

Do not use these agents: `step-implementer`, `hu-analyst`, `acceptance-validator`.

Do not invoke these skills: `/maquetar`, `/integration-query-mock`, `/integration-command`, `/analizar-hu`.

## Instructions

1. Identify the approved step under review. If it is unclear which diff belongs to that step, say so and limit the review to the changes you can attribute to it.
2. Compare the diff with the goal of that step, the user-story requirements it covers, and the project rules.
3. Ask `code-reviewer` for the report. Classify each finding as critical, high, medium, or low, with file, problem, consequence, broken rule, and recommended fix.
4. If there are no defects, say so and separate what you reviewed from what you could not verify.
5. Deliver the report and stop.

## Hard constraints

- Do not edit files.
- Do not apply the recommended fixes.
- Do not run git commit, git push, or create a pull request.
- Do not report a style preference that has no impact.
- Do not move on to `/implementar-paso` or `/validar-hu` on your own.
- Follow `.cursor/rules/human-controlled-workflow.mdc`.
- When the review traces code outside the diff, use the codebase-memory MCP `user-codebase-memory-mcp` on project `task-log`, following `.cursor/rules/codebase-memory.mdc`. Do not use graphify.

The user decides whether to request fixes, accept the step, or continue.
