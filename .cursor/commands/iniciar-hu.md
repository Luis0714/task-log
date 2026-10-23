---
description: Analyzes an Azure DevOps user story by ID or title, without changing code or data.
---

# Start a user-story analysis

The user writes an Azure DevOps user-story ID or title after this command.

Examples:

- `/iniciar-hu 274289`
- `/iniciar-hu Agregar un grupo al tablero de Clases`

## Who to use

- Agent: `hu-analyst`. It is read-only. Use it for the full analysis.
- Skill: `/analizar-hu`, file `.cursor/skills/analizar-hu/SKILL.md`. Read it and follow it. Do not copy or rewrite its procedure.
- Connected Azure DevOps MCP server: `ado`.

Do not use these agents: `step-implementer`, `code-reviewer`, `acceptance-validator`.

Do not invoke these skills: `/maquetar`, `/integration-query-mock`, `/integration-command`.

## Instructions

1. Identify the ID or title the user wrote after the command.
2. Search Azure DevOps with the `ado` server tools. Do not invent a result.
   - By ID: `wit_work_item` with action `get` on the project `Plataforma Virtual - NARP`.
   - By title: `wit_query` with action `wiql`. In this project, user stories are `Product Backlog Item` and the title usually starts with `HU-`. Search exact and similar matches. Do not filter only by the `User Story` type.
3. If the user gives a title and more than one match is possible, show the ID, title, and state of each. Stop and ask the user to choose. Do not keep the first match.
4. If there is no match, say so and state what you searched. Do not invent a story.
5. Once the story is identified, confirm the ID and title before analyzing.
6. Ask `hu-analyst` for the full analysis, following `/analizar-hu`. Before writing the plan, inspect the repository and see how much of the story is already implemented.
7. Classify each requirement as already implemented, partial, or missing, and cite the files you read. Do not mark something as done if you did not read it.
8. The plan includes only the remaining gap. Each step names the existing code it builds on. Do not add a step that rebuilds a screen, query, or command that already meets the requirement. If the story is already done, say so and leave only verification.
9. Deliver in the `/analizar-hu` format, including the already-implemented section, the expected result, the requirements, the open questions, and the test cases.
10. For each remaining step, name the skill to use later, without running it: `/maquetar`, `/integration-query-mock`, or `/integration-command`.

## Hard constraints

- Do not create, edit, or delete files.
- Do not modify Azure DevOps.
- Do not implement any part of the story.
- Do not start the mockup or integration skills.
- Do not move to the next step or to implementation without the user's explicit approval.
- Follow `.cursor/rules/human-controlled-workflow.mdc`.
- When the analysis inspects this repository, use the codebase-memory MCP `user-codebase-memory-mcp` on project `task-log`, following `.cursor/rules/codebase-memory.mdc`. Do not use graphify.

Present the analysis for review. Wait for the user's approval or corrections.
