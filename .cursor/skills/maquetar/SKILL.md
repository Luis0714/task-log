---
name: maquetar
description: >-
  Builds visual frontend mockups for existing or new screens using shared
  components, static sample data, and semantic HTML. Use when the user invokes
  /maquetar or asks to mock up a screen, section, card, table, modal, or
  component without implementing its behavior.
disable-model-invocation: true
---

# Frontend mockups

## 1. Goal

Your only job is to build the visual representation of the interface the user asked for.

Deliver a clean, semantic, reusable mockup that matches the project's existing design and architecture.

Use static sample content. Do not implement integrations or real behavior.

## 2. Hard constraints

- Work only on the requested mockup.
- Do not implement business behavior.
- Do not connect endpoints, APIs, services, Server Actions, or databases.
- Do not add `fetch`, Axios, or any other network request.
- Do not implement mutations, persistence, or create, edit, or delete flows.
- Do not build authentication, permissions, or business validation.
- Do not create query hooks, stores, reducers, or contexts for behavior that is not required to render the interface.
- Do not change existing contracts, models, services, or logic to make the mockup easier.
- Do not edit files outside the requested scope.
- Do not invent integrations the user did not ask for.
- Use static, representative data when content is needed.
- Buttons, links, selects, and controls must look like the interface. They must not run real actions.
- Do not add `onClick`, `onChange`, submit handlers, or real navigation unless the user explicitly asks for a visual demo interaction.
- If a shared component already has built-in behavior, reuse it. Do not change that behavior or wire it into a new flow.
- Do not replace a shared component's implementation to fit a single screen.

If the mockup reveals a functional need, note it briefly as pending. Do not implement it.

## 3. Required inspection

Before writing code, orient with the codebase-memory MCP or graphify, following `.cursor/rules/graphify.mdc`. Then inspect the project and determine:

1. The framework, stack, and existing conventions.
2. The route and file where the mockup belongs.
3. The folder structure and architecture.
4. The shared component library, especially folders such as:
   - `components/shared`
   - `components/ui`
   - `components`
   - any equivalent directory in this repository.
5. Existing components that can be reused:
   - Button
   - Input
   - Select
   - Card
   - Badge
   - Modal or Dialog
   - Table
   - Typography
   - EmptyState
   - PageHeader
   - Skeleton
   - other relevant components.
6. Design tokens, CSS variables, themes, type, spacing, radii, shadows, and icons.
7. Similar screens that show how this project implements layout and design.
8. Import conventions, file names, exports, and component organization.

Do not assume folder or component names are the same in every project. Explore the real repository.

Do not create a new shared component until you have checked that an equivalent one does not already exist.

## 4. Reuse shared components

Reuse comes first.

When a suitable shared component exists:

- Import and use it.
- Adjust appearance from the screen through props, variants, classes, or other mechanisms it already supports.
- Respect its public API and types.
- Keep its original styles and behavior.
- Do not duplicate a component that already solves the same need.
- Do not change a global shared component to solve a need that belongs to one screen.

If a shared component cannot match the required look, first use its existing customization options.

If that is not enough, create a presentational component for this screen, or state the limitation clearly. Change the shared component only when the change is generic, compatible, and strictly necessary.

## 5. Splitting large screens

Before implementing, judge the size and complexity of the interface.

If it is small, mock it up directly.

If it is medium or large:

1. Identify the main visual sections.
2. Split the screen into small, cohesive, reusable components.
3. Mark which pieces already exist and which must be created.
4. Define the composition hierarchy.
5. State a short implementation plan.
6. Implement in coherent blocks so the screen stays visually whole.

Example:

Screen: My classes

- `MyClassesPage`: page composition.
- `PageHeader`: title and description. Reuse the existing one when it fits.
- `ClassesToolbar`: visual controls at the top, when they belong.
- `ClassesGrid`: card layout.
- `ClassCard`: one class.
- `EmptyClassesState`: empty state when there are no classes.

These names are illustrative. Follow the project's real conventions.

Do not extract a component for every HTML element. Extract a component when it has a clear visual responsibility, repeats, or keeps the screen readable.

If the request is too large for a safe implementation, deliver the breakdown first and start with the first coherent part. Do not mix in behavior.

## 6. Static sample data

Use local data to show the visual state of the screen.

```ts
const mockClasses = [
  {
    id: "class-1",
    name: "Mathematics",
    grade: "Grade 8",
    group: "A",
  },
  {
    id: "class-2",
    name: "Social studies",
    grade: "Grade 9",
    group: "B",
  },
];
```

Adapt names and values to the real domain of the interface.

Rules:

- Keep mocks next to the component, or in a local presentation-data file, following project conventions.
- Do not duplicate information without a reason.
- Use stable ids as list keys.
- Show the relevant visual states when they are in scope: content, empty, loading, or error.
- Do not simulate network requests or add timers.
- Do not invent real user data.
- Do not add data abstractions that would only exist for a future integration.

Sample data only needs to be enough to judge layout, hierarchy, and readability.

## 7. Semantic HTML and accessibility

Follow semantic HTML and accessibility practices.

In Next.js and React on the web:

- Use `main` for the page's primary content.
- Use `header`, `nav`, `section`, `article`, `aside`, and `footer` when their meaning fits.
- Use `ul` and `li` for related collections that are lists.
- Use `table`, `thead`, `tbody`, `tr`, `th`, and `td` for tabular data.
- Use `button` for actions and `a` or `Link` for navigation when that matches the existing context.
- Do not use `div` or `span` as indiscriminate substitutes for semantic elements.
- Keep a correct heading hierarchy.
- Associate labels with their controls.
- Give accessible names to icon-only controls.
- Use a meaningful `alt` on informative images and an empty `alt` on decorative images.
- Keep the design system's visible focus states and contrast.
- Do not nest interactive elements.
- Do not fake a link with a non-link element when real navigation should be represented.

In a table with actions, keep those actions semantically separate from row navigation. Do not nest buttons or links inside another link.

If the project is React Native, do not force HTML tags. Use the appropriate native components and their accessibility props.

## 8. Styles and visual fidelity

The user may attach one or more images as the visual context for a new mockup or a correction.

- Treat each attached image as the layout, hierarchy, spacing, and state to match.
- When several images are attached, use each one for the screen or state it shows. Do not merge them into a new layout.
- Do not invent extra sections that are not in the images or in the request.

Match that reference with the tokens and variables already defined in the project:

- Use the project's existing styling technology.
- Do not introduce a new style or component library.
- Colors come from the Tailwind theme in `tailwind.config.ts`. Token names such as `primary`, `surface`, and `on-surface` map to CSS variables such as `var(--color-primary)`.
- Use those token classes (`bg-primary`, `text-on-surface`) and the existing type, spacing, radii, borders, shadows, and iconography.
- Do not use raw hex, rgb, or arbitrary color values when a token already exists.
- Do not invent a token or a CSS variable to match a pixel in the image. Use the closest existing token and state the difference that remains.
- Do not duplicate styles or add unnecessary overrides.
- Do not replace the design system with generic styles of your own.
- Do not use emoji as icon substitutes when the project has an icon library.
- Keep a clear visual hierarchy.
- Make compositions work at the relevant screen sizes.

## 9. Code organization

- Split visual composition into components when that improves readability.
- Export one component per file. If another component is needed, put it in its own file next to the one that uses it.
- Keep JSX and styles organized the way this project already does.
- Avoid monolithic components.
- Avoid premature abstractions.
- Use TypeScript and existing types when they apply.
- Import modules under `src/app`, `src/features`, `src/entities`, and `src/shared` only with the aliases in `tsconfig.json`: `@app/*`, `@features/*`, `@entities/*`, and `@shared/*`. Do not reach those folders with relative paths.
- Do not use `any` to skip a typing problem.
- Do not add unnecessary dependencies.
- Do not change project configuration to make the mockup easier.
- Do not change existing contracts or behavior.
- Keep edits limited to the files the interface needs.

## 10. Final check

When you finish:

1. Review the files you changed.
2. Confirm you only built the requested mockup.
3. Check that shared components were reused.
4. Review semantics, accessibility, and JSX structure.
5. Check types and obvious compile errors.
6. Run the project's relevant checks when they are reasonable and non-destructive.
7. Do not fix pre-existing problems that are unrelated to this task.

If errors block verification, report what they are and where they appear. Do not claim the build succeeded if you did not run it.

## 11. Final response

When you finish, summarize:

- Which part of the interface you mocked up.
- Which shared components you reused.
- Which new components you created, and why.
- Which files you changed.
- Which information is represented with mocks.
- Which functional pieces were intentionally left pending.
- Which checks you ran, and their results.

Do not implement the pending behavior in this run.
