---
name: analizar-hu
description: >-
  Reads an Azure DevOps user story, analyzes its requirements, and produces a
  phased implementation plan, expected behavior, and test cases without
  changing code or data. Use when the user invokes /analizar-hu or asks to
  analyze a user story before implementation.
disable-model-invocation: true
---

# Analyze a user story

## Goal

Analyze a real Azure DevOps user story and turn it into a clear, ordered, and verifiable plan for implementing it in the current repository.

This skill only analyzes and plans. It does not implement features.

## Hard constraints

- Do not create, edit, or delete files.
- Do not modify the user story in Azure DevOps.
- Do not implement code.
- Do not assume requirements that the user story does not support.
- Do not invent endpoints, payloads, components, routes, or business rules.
- Clearly separate explicit requirements from inferences.
- If missing information blocks a behavior, record it as an open question.
- Do not claim a field was read if the tool did not return it.
- Do not claim that something is already implemented unless you read the code that does it.
- Do not start the mockup or integration skills automatically.
- Do not plan work that rebuilds behavior the repository already satisfies.

## Phase 1: fetch the user story

1. Take the user story ID the user provided.
2. Query Azure DevOps with the available tools.
3. Collect, when available:
   - Work item ID and type.
   - Title.
   - State and assignee.
   - Full description.
   - Acceptance criteria.
   - Relevant custom fields.
   - Scenarios, edge cases, and validation rules.
   - Relevant comments.
   - Related items or dependencies.
4. If the user provides a URL instead of an ID, identify the work item from that URL.
5. Confirm that the work item found is the requested user story.

If Azure DevOps cannot be queried, stop the analysis and explain what access or information is missing. Do not pretend the read succeeded.

## Phase 2: interpret the requirements

Identify:

- The problem or need the story solves.
- The functional goal.
- The actors involved.
- The screens and routes affected.
- The actions available to the user.
- State changes or navigation.
- Data that is shown, created, read, updated, or deleted.
- Validations and error messages.
- Loading, empty, success, and error states, when they apply.
- Edge cases and dependencies.
- Existing behavior that should be reused.

Distinguish:

- An explicit requirement from the story.
- A reasonable technical inference.
- An open question that still needs a decision.

## Phase 3: inspect what is already implemented

Orient first with the codebase-memory MCP `user-codebase-memory-mcp` on project `task-log`, following `.cursor/rules/codebase-memory.mdc`. Do not use graphify. Then read only the files and symbols that graph names, to see how much of the story is already in the repository. The plan starts from that gap. It does not start from an empty product.

Review the relevant areas:

- Routes and pages.
- Shared components and feature-specific components.
- Types and data contracts.
- Existing queries and commands.
- Server Actions.
- Hooks and client state, if they exist.
- Existing mocks.
- Validation and error handling.
- Notification patterns.
- Existing tests.

Do not modify files during this inspection.

Do not propose a new architecture when the current patterns already solve the problem.

For each requirement, classify it as one of:

- Already implemented: the current code meets it. Name the files or symbols you read.
- Partially implemented: name what already exists and what is still missing.
- Not implemented: you looked in the relevant areas and did not find it. Say where you looked.

Do not mark a requirement as done from the story title, a similar name, or an unverified guess.

## Phase 4: write the implementation plan

Build the plan only from what is missing or incomplete.

- Do not add a step that recreates a screen, query, command, hook, or flow that already meets the requirement.
- A partial implementation becomes one step that finishes the gap. That step must say what already exists and what remains.
- If the story is already implemented, say so. The remaining work is verification of the real behavior, not a rebuild.

Split the remaining work into ordered phases. Include only the phases that still apply, and skip a phase whose work is already implemented:

1. Mockup: screens, components, visual states, and static mock data.
2. Query integration: queries, contracts, Server Actions, and a mock fallback if the backend is not available yet.
3. Command integration: write operations, forms, validations, submit states, errors, and confirmations.
4. Integration and adjustments: navigation, and coordination between components and state.
5. Verification: functional tests, edge cases, and relevant regressions.

For each phase, state:

- Goal.
- Scope.
- Expected functional changes.
- Components or repository areas that could be affected.
- Dependencies and prerequisites.
- The criteria for considering the phase done.

Do not assign work to a phase the story does not need.

Do not execute any phase.

## Phase 5: define the expected result

Describe the user flow from start to finish:

1. The screen where it starts.
2. The element or button the user uses.
3. The modal, form, or screen that appears.
4. The data the user enters or selects.
5. The validations that run.
6. The expected response for each outcome.
7. The later screen changes or navigation.
8. The relevant loading, success, and error states.

Include alternative scenarios and edge cases that are supported by the story or by existing behavior confirmed in the repository.

## Phase 6: build the test list

Create a test list that covers:

- The main successful flow.
- Empty required fields.
- Invalid formats and applicable limits.
- Server or operation errors.
- Loading and prevention of duplicate submits, when they apply.
- Cancel and closing modals, when they apply.
- Navigation and refreshing the information.
- Relevant edge cases and regressions.

For each test, include:

- ID.
- Scenario.
- Preconditions.
- Steps.
- Expected result.
- The requirement it verifies.

Do not invent validation rules. If the story does not define them and the repository does not confirm them, record them as pending.

## Required output format

### 1. Story summary

ID, title, goal, and scope.

### 2. Identified requirements

Functional requirements, business rules, and constraints.

### 3. What is already implemented

For each requirement: already implemented, partially implemented, or not implemented, with the files or symbols that support that classification. This is the baseline for the plan.

### 4. Open questions and assumptions

Pending questions, ambiguities, and technical inferences.

### 5. Implementation plan

Ordered steps for the remaining gap only. Each step states the existing code it builds on. Include goal, scope, dependencies, and done criteria.

### 6. Expected final result

Complete user flows, including alternatives and errors.

### 7. Test cases

A numbered list with steps and expected results.

### 8. Dependencies and risks

Backend availability, pending contracts, permissions, or other relevant blockers.

### 9. Recommended execution order

State which skill to use for each remaining step:

- /maquetar
- /integration-query-mock
- /integration-command

Do not invoke these skills or start the implementation.

### 10. Verifiable acceptance criteria

A final checklist that shows whether the story is implemented.

## Close

End with a summary of the plan and the questions that must be answered before implementation. Do not change code or Azure DevOps.
