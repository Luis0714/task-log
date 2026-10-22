---
description: Reviews and adjusts the approved user-story plan, without implementing code.
---

# Review the user-story plan

The user states what to change in the plan already analyzed. It may be a step, a resolved question, a scope change, or a correction to the expected result.

Examples:

- `/plan-hu Remove the mockup step: the screen already exists`
- `/plan-hu Step 3 depends on the list_teacher_class_groups contract`

## Who to use

- Agent: `hu-analyst`. It is read-only. Use it to review and rewrite the plan.
- Skill: `/analizar-hu`, file `.cursor/skills/analizar-hu/SKILL.md`. Use it only as the format for the plan, the steps, and the test cases. Do not analyze the story from scratch if the previous analysis is still valid.

Do not use these agents: `step-implementer`, `code-reviewer`, `acceptance-validator`.

Do not invoke these skills: `/maquetar`, `/integration-query-mock`, `/integration-command`.

## Instructions

1. Take the plan from the conversation and the change the user wrote after the command.
2. If there is no previous plan, stop and ask the user to run `/iniciar-hu`. Do not invent a new plan.
3. Check that the change does not contradict the user story or an open decision. If it does, ask before adjusting.
4. Look again at the code in the scope being changed. Remove steps whose requirement is already implemented. Turn a partial implementation into one step that names what exists and what is missing.
5. Ask `hu-analyst` for the updated plan. Keep the numbering of the steps that do not change.
6. For each remaining step, name the skill to use later, without running it: `/maquetar`, `/integration-query-mock`, or `/integration-command`.
7. Mark which steps stayed the same, which changed, which were removed because they already exist, and which existing code each remaining step builds on.
8. Leave the updated plan as the new version waiting for approval.

## Hard constraints

- Do not create, edit, or delete code files.
- Do not modify Azure DevOps.
- Do not implement any step.
- Do not start the mockup or integration skills.
- Do not treat the plan as approved. The user approves it or asks for another correction.
- Follow `.cursor/rules/human-controlled-workflow.mdc`.

Show the updated plan. Wait for the user's approval.
