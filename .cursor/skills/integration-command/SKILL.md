---
name: integration-command
description: >-
  Connects a write command in a Next.js feature using the command utility, a
  Server Action, and the form that is already mocked up. Use when the user
  invokes /integration-command or asks to connect create, edit, or delete to
  the backend without mocks or fake success responses.
disable-model-invocation: true
---

# Integration Command

## 1. Goal

Connect a write operation (create, edit, or delete) to the form or control that is already mocked up.

The integration must be ready for the real backend contract. If the endpoint does not respond yet, do not fake success and do not replace the command with a mock.

Follow the patterns, utilities, and architecture that already exist in the repository.

Flow:

1. Inspect the feature and the equivalent implementations.
2. Define or reuse the payload and the result types.
3. Register the command in the feature's API folder.
4. Create or update the Server Action.
5. Connect the form and its submit.
6. Create a hook only if the Client Component needs one.
7. Implement loading, success, and error with the existing conventions.
8. Verify what can be checked without claiming the backend works.

This skill does not implement read queries and does not mock up screens.

## 2. Hard rules

- Inspect before you modify.
- Follow the repository's real patterns.
- Reuse `command`, `handleServerRequest`, and the existing error handling.
- Send exactly the payload the contract requires. Do not add or omit fields.
- Do not invent the microservice or the endpoint name. If they are not defined, ask before writing a fictional contract.
- Do not create mocks for the operation.
- Do not return `success: true` if the command did not respond with success.
- Do not use `any`, unjustified casts, or assertions that hide a contract mismatch.
- Do not duplicate types, hooks, actions, or utilities that already exist.
- Do not change shared utilities to solve one feature's need.
- Do not turn a Server Component into a Client Component only to use a hook.
- Do not create a hook if the submit can live where the form state already lives.
- Do not redesign the mockup or add fields the user did not ask for.
- Do not implement read queries in this skill.
- Do not claim the endpoint works if it was not verified against the backend.

## 3. Required inspection

Before writing code, orient with the codebase-memory MCP `user-codebase-memory-mcp` on project `task-log`, following `.cursor/rules/codebase-memory.mdc`. Do not use graphify. Then identify:

1. The feature and the exact operation (create, edit, or delete).
2. The form or control that is already mocked up, and how it stores its state.
3. The feature's `api/commands` and equivalent commands in other features.
4. The `command` utility and its real signature.
5. The feature's Server Actions and how they return `{ success, message }`.
6. The existing payload types.
7. Hooks that already call Server Actions.
8. How loading, success, and error are shown (Sonner and the project's toast options constant, for example `TOAST_ACTION_OPTIONS`).
9. Whether a successful action must revalidate a route, and which route, based on equivalent actions.
10. The microservice and endpoint name defined for this story.

Use the closest equivalent implementation as the reference. Do not copy names from another feature when they do not belong to this task.

## 4. Payload and types

- Reuse the payload type if it already exists.
- If it is missing, create it in the feature's `types`, with the fields and types the backend requires.
- The command type must be that payload, not the form's internal state, when the names or types differ.
- If the form uses strings and the contract requires numbers or different ids, transform at the boundary that sends the command. Do not change the contract to match the form.
- Do not send UI fields the backend does not ask for.
- The action result must be an explicit success or error object, aligned with the existing write actions. Do not return the raw `ApiResponse` if the rest of the feature does not.

## 5. API / Commands

Register the command with the existing `command` utility. Do not write a manual `fetch`.

Representative example from this repository:

```ts
export const AssignTeacherToGroupCommand = command<AssignTeacherToGroupPayload, string>(
  "academicmanagment",
  "assign_teacher_to_group",
);
```

Adapt it to this task's microservice, endpoint, and types. The second generic is the response `data` type, not the payload.

## 6. Server Action

The action must:

1. Receive the typed payload.
2. Call the command with `handleServerRequest`.
3. If `success` is false, return the backend message (`errors[0].message` or `message`) or a fallback message consistent with the feature.
4. If `success` is true, revalidate the route only when equivalent write actions do.
5. Return `{ success: true, message }` only after a successful response.

Representative example:

```ts
export async function AddGroupAction(payload: AssignTeacherToGroupPayload) {
  const response = await handleServerRequest(() => AssignTeacherToGroupCommand(payload));

  if (!response.success)
    return {
      success: false,
      message: response.errors?.[0]?.message || response.message || "No se pudo agregar el grupo",
    };

  revalidatePath("/my-classes");

  return {
    success: true,
    message: "El grupo se agregó correctamente",
  };
}
```

This is not a universal template. Adjust the `revalidatePath` route, the messages, and the return type to the feature's real pattern. Keep user-facing messages in the language the feature already uses.

Do not wrap a failure in a `catch` that returns success. If a `try/catch` is needed, the `catch` must report an error, never success.

Do not add a mock fallback if the command fails or throws.

## 7. Form and hook

Connect the submit control that already exists. Do not create another form.

Before creating a hook, decide:

- If the form already lives in a Client Component with local state, the submit can stay in that component or in the hook that already owns it.
- Create a new hook only when it isolates submit state, the action call, and the feedback, and that makes the view simpler.
- Do not create a hook that only calls the action and has no state or effects.
- Do not add `"use client"` to a parent Server Component if only the form needs the client.

The submit must:

1. Build the contract payload from the form values.
2. Set the loading state and disable submit while the action is in progress.
3. Call the Server Action.
4. If `success` is false, show the error with the existing toast and leave the form open.
5. If `success` is true, show the success message and run only the close, reset, or navigation that this feature already uses on other saves.
6. If the call throws, show an error. Do not treat it as success.

Do not show success before receiving `success: true`.

## 8. Limits

Do not:

- Implement read queries.
- Create mocks for the operation or a general mock system.
- Fake a successful response.
- Redesign the interface or rebuild the mockup.
- Add fields, business validations, or steps the user did not ask for.
- Introduce a new forms, state, or fetching library.
- Change the project's global architecture.

## 9. Verification

Before finishing:

1. The command uses `command` with the stated microservice and endpoint.
2. The sent payload matches the contract, with no extra or missing fields.
3. The Server Action does not return success when the response fails.
4. There are no mocks and no fake success.
5. The submit control is disabled while loading.
6. Success and error use the existing toast and options.
7. No hook or Client Component was created without a need.
8. The touched files belong to this operation.
9. Review types and obvious errors in the changed files.

If the endpoint does not exist yet, verify typing and structure. Do not call the backend to "test" a contract that is not available, and do not claim the operation works on the server.

## 10. Final response

Report:

- Which command you implemented, and with which microservice and endpoint.
- Which payload it sends.
- Which Server Action you created or changed.
- How the form was connected, and why a hook was or was not created.
- How loading, success, and error ended up.
- Which files you changed.
- What you verified and the result.
- What remains pending while the backend is unavailable.
