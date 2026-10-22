---
description: Checks the implemented step against acceptance criteria and tests, without modifying code.
---

# Validate the step against the user story

The user asks to check the implemented step against the acceptance criteria and the available tests.

Example:

- `/validar-hu Step 2`

## Who to use

- Agent: `acceptance-validator`. It is read-only. Use it for the functional check.
- If you need to reread the story, use the `ado` MCP server and `wit_work_item` with action `get` on the project `Plataforma Virtual - NARP`. Do not modify the work item.

Do not use these agents: `step-implementer`, `hu-analyst`, `code-reviewer`.

Do not invoke these skills: `/maquetar`, `/integration-query-mock`, `/integration-command`.

## Instructions

1. Identify the implemented step and the acceptance criteria that step was supposed to cover.
2. Use the expected result from the approved plan. Do not invent criteria or results.
3. Ask `acceptance-validator` to tie each criterion to evidence: verified, failed, or pending.
4. Review the tests and checks that were actually run. A successful build is not a functional test.
5. Point out edge cases, regressions, and user-story requirements this step still does not cover.
6. Close with the result of this step, the pending tests, and what is still missing from the story.

## Hard constraints

- Do not modify code or files.
- Do not mark a test as passed if it was not run or there is no evidence.
- Do not declare the user story finished while any criterion or test is still pending.
- Do not run actions that change real data or external services.
- Do not authorize the next step.
- Follow `.cursor/rules/human-controlled-workflow.mdc`.

Deliver the verification and wait for the user's decision.
