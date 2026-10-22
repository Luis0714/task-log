---
description: Prepares open refinement questions for one Azure DevOps user story, without planning or changing code.
---

# Refine a user story

The user passes a user-story identifier and, optionally, a doubt or area to examine with extra attention.

Examples:

- `/refinar-hu 12345`
- `/refinar-hu US-12345`
- `/refinar-hu 12345 Analizar dudas sobre la selección de grupo y plan`

## Who to use

- Agent: `hu-refinement-analyst`. It is read-only. Use it for the whole refinement analysis.
- Connected Azure DevOps MCP server: `ado`.
- Project: `Plataforma Virtual - NARP`.

Do not use these agents: `hu-analyst`, `step-implementer`, `code-reviewer`, `acceptance-validator`.

Do not invoke these skills: `/analizar-hu`, `/maquetar`, `/integration-query-mock`, `/integration-command`.

## Instructions

1. Take the text the user wrote after the command. The first token is the identifier. Any text after that token is the optional focus. Do not search Azure DevOps by the focus text.
2. Pass the identifier, the optional focus, and the original text to `hu-refinement-analyst`. Let that agent query Azure DevOps and inspect the repository.
3. The agent must resolve the story with the `ado` server before analyzing it:
   - A numeric token, or a prefix plus digits such as `US-12345`, `HU-12345`, or `#12345`, is the work item id. Read it with `wit_work_item`, action `get`, `expand` `All`, on the project `Plataforma Virtual - NARP`. Do not combine `fields` with `expand`.
   - Confirm the id, work item type, and title before any analysis. In this project a user story is a `Product Backlog Item`. If the item is another type, report the id, type, title, and state, then stop and ask. Do not analyze it as the story.
   - If `get` does not find the item, search with `wit_query`, action `wiql`, in the same project. Search the identifier token. Do not limit the query to the `User Story` type. Include `Product Backlog Item`.
   - If there is no match, or more than one possible match, show the id, title, and state of each candidate, or state what was searched. Stop and ask. Do not keep the first match and do not analyze another story.
4. Once the story is identified, the agent reads the available description, acceptance criteria, comments, and relations. Comments come from `wit_work_item`, action `list_comments`. Related items come from the relations on `get`, then `wit_work_item`, action `get_batch`, only for the items needed to understand scope.
5. Deliver the agent's analysis in Spanish, in its eight sections. Keep the questions, evidence, and conclusion. Do not rewrite it as an implementation plan.

## Allowed Azure DevOps reads

- `wit_work_item` with action `get`, `list_comments`, or `get_batch`.
- `wit_query` with action `wiql`, only when `get` did not find the identifier.
- `wit_work_item_attachment` only to view an attachment the story already references. Never pass `savePath`.

## Hard constraints

- Do not call `wit_work_item_write`, `wit_work_item_comment_write`, `wit_work_item_link_write`, or `wit_backlog` with action `reorder`.
- Do not create, edit, or delete files.
- Do not modify Azure DevOps, its comments, its links, or its acceptance criteria.
- Do not write an implementation plan, test cases, or production code.
- Do not start `/iniciar-hu`, `/plan-hu`, `/implementar-paso`, `/revisar-paso`, or `/validar-hu`.
- Follow `.cursor/rules/human-controlled-workflow.mdc`.

Present the refinement analysis and stop. The user decides whether anything is still unclear.
