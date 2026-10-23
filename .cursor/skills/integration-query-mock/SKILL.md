---
name: integration-query-mock
description: >-
  Implements read queries in a Next.js feature using the project's existing
  utilities, Server Actions, typed mocks, and the consumption pattern that
  fits Server Components or Client Components. Use when the user invokes
  /integration-query-mock or asks to integrate a query while the backend
  endpoint is not available yet.
disable-model-invocation: true
---

# Integration Query Mock

## 1. Goal

Implement a read-query integration in a Next.js feature when the backend endpoint is not available yet or cannot be used during development.

Leave the real integration in place and let the interface run on typed mock data while the backend is being built.

Follow the patterns, utilities, conventions, and architecture that already exist in the repository.

Expected flow:

1. Inspect the feature and the existing implementations.
2. Define the required types, reusing the ones that already exist.
3. Register the query in the feature's API folder.
4. Create or update the Server Action.
5. Define or reuse the typed mocks.
6. Decide how to consume the data based on the component type.
7. Create a hook only when it is justified.
8. Verify the implementation.

Do not implement commands, mutations, or write operations in this skill. Its only scope is read queries.

## 2. Hard rules

- Inspect before you modify.
- Follow the repository's real patterns. Do not invent conventions.
- Reuse the existing utilities for queries and request handling.
- Do not duplicate types, mocks, hooks, functions, or utilities that already exist.
- Do not change a shared utility to solve one feature's need.
- Do not change API contracts, models, or behavior outside the task.
- Do not add new dependencies.
- Do not implement features the user did not ask for.
- Do not turn a Server Component into a Client Component only to use a hook.
- Do not create a hook just because a query exists.
- Do not pretend an endpoint exists, and do not invent a response contract that contradicts existing types.
- Do not remove the real integration and replace it permanently with mock data.
- Keep mocks as a temporary development fallback.
- Do not claim the endpoint works if it was not verified.
- Do not hide typing or contract errors with `any`, unjustified casts, or assertions that skip validation.

## 3. Required phase: inspect the repository

Before implementing, orient with the codebase-memory MCP `user-codebase-memory-mcp` on project `task-log`, following `.cursor/rules/codebase-memory.mdc`. Do not use graphify. Then identify:

1. The feature and the exact scope of the requested query.
2. That feature's folder structure.
3. The `API` folder and its query files.
4. The `server` folder, or its equivalent, for Server Actions.
5. The `types` folder and the existing contracts.
6. The `constants` folder, especially mock files.
7. The `utils` folder and the feature utilities.
8. Existing hooks, if any.
9. The components and containers that need the data.
10. Equivalent implementations in other features.

Find real examples of:

- The `query` utility.
- The `handleServerRequest` utility.
- Server Actions that call queries.
- Mocks used as a fallback.
- Hooks that call Server Actions.
- Sonner and `ToasterActionsOptions`.
- Server Components that call Server Actions directly.
- Client Components that need hooks for state.
- Conventions for exporting and importing files.

If an equivalent implementation already exists, use it as the main reference.

Do not assume that utility names, parameters, or signatures are identical across every version of the project. Read their definition and their real call sites.

## 4. Contracts and types

Before writing the query, decide which data the interface needs and which contract matches the server response.

Rules:

- Reuse existing interfaces and types.
- If the contract is already defined, do not duplicate it.
- If a type is truly missing, create it where the feature already puts types.
- Separate the HTTP or API-wrapper type from the data type the interface consumes.
- Respect the parameters the endpoint requires.
- Avoid `any`.
- Do not pass a mock off as a server response when its shape does not match the expected contract.
- Do not change existing contracts just so the mock compiles.

Fallback data must satisfy the Server Action's return type.

For example, if an action returns `Promise<PlanPeriod[]>`, its fallback must be a `PlanPeriod` array.

If it returns `Promise<GroupPeriodDetail>`, its fallback must be a valid `GroupPeriodDetail` object.

Do not use an empty array as a universal fallback.

## 5. API / Queries

Find the feature's API folder and the existing queries file.

If the project follows this architecture's usual pattern, register the query with the existing `query` utility.

Representative example:

```ts
export const ListPeriodClassesQuery = query<
  PlanPeriodsResponse,
  { planId: string }
>(
  "academicmanagment",
  "list_period_classes",
);
```

This example is illustrative. Do not copy names, endpoints, or types without checking that they belong to the task.

To implement the query:

1. Identify the correct microservice.
2. Identify the exact endpoint name from the documentation, the user story, the available contract, or a verifiable convention.
3. Define or reuse the response type.
4. Define or reuse the parameter type.
5. Register the query using the real `query` signature.
6. Keep the project's naming, export, and import conventions.

Do not write manual HTTP calls when the `query` utility already owns that responsibility.

Do not invent the microservice or the endpoint name. If there is not enough information, ask before writing a fictional contract.

## 6. Server Actions

Find the feature's Server Actions and follow their current organization.

Create an action that calls the query through `handleServerRequest`, respecting the real signature of both utilities.

The action must:

1. Receive the required parameters.
2. Call the existing query.
3. Process the response.
4. Check that the response is valid for the expected contract.
5. Return the data the interface needs.
6. Use the matching mock when this integration's fallback conditions are met.

Representative example:

```ts
export async function GetPlanPeriodsAction(
  planId: string,
): Promise<PlanPeriod[]> {
  try {
    const response = await handleServerRequest(
      () => ListPeriodClassesQuery({ planId }),
    );

    if (
      !response.success ||
      !Array.isArray(response.data?.periods)
    ) {
      return PLAN_PERIOD_MOCKS;
    }

    return response.data.periods;
  } catch {
    return PLAN_PERIOD_MOCKS;
  }
}
```

The example is not a universal template. Adapt it to the query signature, the response contract, and the project's real patterns.

### Error-handling rules

- If the response is unsuccessful and the project pattern uses a mock fallback, return the matching mock.
- If the call throws and this is a temporary integration with a mock fallback, return the mock that matches the contract.
- If the data has the wrong shape, do not return it as if it were valid.
- Validate the properties that matter for the contract, not only that a response exists.
- Do not add route or cache revalidation by default. Queries read data. They do not need to revalidate a screen after a write.
- Do not add `revalidatePath`, `revalidateTag`, or an equivalent without a concrete reason supported by the project architecture.
- Do not put command or mutation logic inside a query.

### Temporary fallback

The mock fallback is a temporary way for the interface to keep moving while the backend is unavailable.

Therefore:

- Keep the call to the real query.
- Do not replace the query with a direct mock return.
- Do not remove the real server contract.
- Do not add an invented check for whether the endpoint exists.
- Do not assume every error means the endpoint is not ready yet.
- If the project distinguishes business, authorization, validation, and availability errors, follow those conventions.
- If there is no clear error policy, follow the closest equivalent pattern and state the limitation.

The fallback must be explicit, narrow, and easy to remove when the real integration is available.

Do not introduce a global flag, a generic mock system, or a new abstraction layer unless the project already uses that pattern or the user asks for it.

## 7. Typed mocks

Find the feature's mocks before creating a new one.

If none fits, create it where the project already puts mocks. In this architecture that may be `constants`, with file names like:

`src/features/my-classes/constants/group-period-detail.mock.ts`

That name is only an example.

### Rules for building mocks

- Use the real domain types.
- Match the exact shape the interface consumes.
- Use values that fit the feature's domain.
- Include stable identifiers.
- Include enough data for the relevant visual scenarios.
- Reuse helpers when a repeated construction justifies extracting one.
- Avoid huge structures with unnecessary duplicated data.
- Keep the mock inside the feature when only that feature uses it.
- Do not create global mocks without a real need to share them.
- Do not add dependencies between features only to reuse sample data.
- Do not use `as any` or unjustified casts to force compatibility.
- Do not include real personal information in sample data.

If the response is a collection, the mock needs the items required to exercise both content and the empty state.

If the response is a detail object, the mock must satisfy its required properties and use coherent values.

When several scenarios matter, constants or a function such as `getGroupPeriodDetailMock(periodId)` are fine if that pattern fits the feature.

Do not build a complex generator when a few typed objects are enough.

## 8. Utils: local or shared

Decide whether any logic should move into a utility.

The decision depends on the scope and complexity of the logic:

- If it serves only one feature, keep it in that feature.
- If it solves a real need shared by several features, consider `shared`.
- If the logic is small, clear, and used once, do not extract it just to extract it.
- If the logic is repetitive, has one defined responsibility, or makes the component hard to read, consider extracting it.
- Do not create a global utility to wrap a single query without a real need.
- Do not duplicate existing utilities.

Follow the names and folder conventions the project already uses.

## 9. Decide how to consume the Server Action

This decision is required before creating a hook.

### Case A: Server Component

If a Server Component can load the data, call the Server Action directly from that component or container.

Representative example:

```tsx
export async function PeriodClassesContainer({
  currentPeriodId,
  institutionalPlanId,
}: Readonly<PeriodClassesContainerProps>) {
  const periods = institutionalPlanId
    ? await GetPlanPeriodsAction(institutionalPlanId)
    : [];

  const selectedPeriod = periods.find(
    (period) => period.id === currentPeriodId,
  );

  return (
    <div>
      {/* Interface composition */}
    </div>
  );
}
```

Adapt the example to the real types and components.

In a Server Component:

- Load the data on the server when that is appropriate.
- Keep data loading out of presentation when the complexity justifies it.
- Do not add `"use client"` only to run a hook.
- Do not create a client hook for a query the server can resolve.
- Respect the existing streaming, Suspense, and composition boundaries.
- Do not change the screen's loading pattern without a real need.

### Case B: Client Component

If the component needs local state, effects, interaction, or a client-side refresh, consider a hook.

The hook may:

- Call the Server Action when appropriate.
- Manage the required loading and error states.
- Expose the data and operations the component needs.
- Show notifications with the existing pattern.
- Keep state logic separate from presentation.

Do not add redundant state the component does not need.

### Case C: No hook is needed

If the action can be called directly and there is no state or effect to encapsulate, do not create a hook.

Prefer the Next.js architecture and the simpler code.

Do not turn the whole page into a Client Component because one small section needs interaction.

If the page needs both, keep data loading on the server when that is appropriate and limit client components to the parts that must run in the browser.

## 10. Hooks and notifications

When a hook is justified, inspect the feature's existing hooks and equivalent hooks in other features first.

Follow the project's conventions for names, types, structure, and exports.

If the project uses Sonner and `ToasterActionsOptions`:

- Reuse the existing imports and constants.
- Use the Sonner API that is actually in the project.
- Show error messages when they apply.
- Show a success message only when an operation can actually succeed.
- Do not show a success notification just because mock data was returned.
- Do not duplicate notifications that another layer already shows.
- Do not introduce a new notification abstraction without a need.

A read query must not automatically toast success every time it loads data.

Errors recovered through a mock fallback must follow the application's conventions. Do not claim the data came from the server when it came from the mock.

If a hook would only wrap the call and has no other responsibility, decide whether it adds value.

## 11. Organization and separation of responsibilities

Keep each layer's responsibility separate:

- API / Queries: the query definition and its contract.
- Server Actions: running the query, handling the response, and the fallback when it applies.
- Types: typed contracts.
- Constants / Mocks: fallback data.
- Utils: justified transformations or helpers.
- Hooks: client state and effects when they are needed.
- Components / Containers: consuming data and composing the interface.

This organization is a guide. It is not permission to reorganize the repository.

Adapt the implementation to the real architecture and avoid structural changes outside the task.

## 12. Limits of this skill

This skill only implements read queries with fallback mock data.

Do not:

- Implement commands.
- Implement POST, PUT, PATCH, or DELETE as part of a write flow.
- Create working forms.
- Implement create, edit, or delete logic.
- Implement mutation-style revalidation without an explicit need.
- Redesign the interface.
- Rebuild a finished mockup.
- Change the project's global architecture.
- Introduce a new state or data-fetching library.
- Create a general mock system for the whole project.
- Implement extra features because you are already editing the feature.

If the task needs a mutation, treat it as outside this skill.

## 13. Final verification

Before finishing:

1. Check that the query uses the existing utility and has the correct types.
2. Check that the Server Action calls the correct query.
3. Check that the sent parameters match the contract.
4. Check that the returned data matches the return type.
5. Check that the mock is valid and lives in the right place.
6. Check that the fallbacks match the response type.
7. Check that no unnecessary hooks were created.
8. Check that a Server Component was not turned into a Client Component without a reason.
9. Check that notifications and loading or error states follow existing patterns.
10. Check that no dependencies or out-of-scope changes were introduced.
11. Run the relevant project checks when they are reasonable and not destructive.

If the endpoint does not exist yet, do not try to verify a real integration that cannot complete. Verify the typing, the structure, and the fallback behavior you can actually check.

Do not claim a build or a test passed if you did not run it.

## 14. Final response

When finished, briefly report:

- Which query you implemented.
- Which microservice and endpoint it uses, if they could be identified.
- Which types you reused or created.
- Which Server Action you implemented or changed.
- Which mock you created or reused.
- How the data is consumed and why that approach was chosen.
- If a hook was created, why it was necessary.
- Which files you changed.
- Which checks you ran and their results.
- Which limitations remain while the backend is unavailable.

Do not implement anything outside the requested scope.
