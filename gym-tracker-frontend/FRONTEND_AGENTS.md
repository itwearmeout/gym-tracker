# Gym Tracker Frontend - Agent Instructions

The role of this file is strictly to define project-specific boundaries, anti-patterns, and architectural rules. 

**DO NOT add folder structures, component summaries, or tech stack explanations to this file.** You are fully capable of reading `package.json` and scanning the `src/` directory to orient yourself.

## 1. Strict Architectural Boundaries (Feature-Driven)
* **No Global Clutter:** Do NOT put domain-specific components (e.g., `LoginForm`, `ExerciseList`) in the global `src/components/` folder. The global folder is reserved ONLY for "dumb" reusable UI (like generic Buttons or Modals).
* **Feature Slices:** All business logic, state, and specific UI must be grouped by domain inside `src/features/` (e.g., `src/features/auth/`, `src/features/exercises/`).
* **Page Purity:** Files in `src/pages/` must remain incredibly lean. They should only act as "glue" to import and render components from the `features/` directory.

## 2. Data Fetching Rules
* **Centralized API Only:** NEVER write raw `fetch()` calls or use Axios directly inside components. You must exclusively import and use the custom wrapper from `src/utils/api.ts` so the JWT `Authorization` header is automatically applied.

## 3. Styling Mandate
* **Tailwind ONLY:** Use Tailwind CSS utility classes for all styling. 
* **Anti-Pattern:** You are strictly forbidden from writing inline styles (`style={{...}}`) or creating custom `.css` modules unless explicitly told to do so for a highly specific animation.

## 4. Agent Feedback Loop
If you ever encounter a file structure that surprises you, a component that feels overly complex, or an API response that doesn't match your expectations, **stop and alert the developer**. Indicate the confusion in your response so the developer can refactor the codebase or update this file, rather than you trying to silently hack around a bad architecture.

## 5. Development State & Phased Execution
* This is a greenfield project. You are free to aggressively refactor component names and file locations if it improves the Feature-Driven Architecture.
* Always wait for the user to explicitly say "Proceed to Phase 2" before writing complex implementations or long files.