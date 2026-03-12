# AGENTS.md
Guidance for agentic coding assistants in this repository.

## Repository status
- Verified on 2026-03-12.
- Repository is currently empty (no app source, no package metadata, no lockfile).
- No previous AGENTS file existed before this one.
- No Cursor rules found in `.cursor/rules/`.
- No `.cursorrules` file found.
- No Copilot instructions found in `.github/copilot-instructions.md`.

If these appear later, agents must read and follow them before editing code:
- `.cursor/rules/**`
- `.cursorrules`
- `.github/copilot-instructions.md`

## Product context (MVP)
Build a productivity web app that blends journaling/notetaking with Pomodoro sessions.

Core journey:
1. User creates a new flow on a clean page.
2. Header shows current date/time and a focus timer (default 20 minutes).
3. Main area is a blank editor with basic formatting only:
   - bold
   - italic
   - hyperlink
4. When focus timer ends:
   - play a short sound cue
   - show a subtle “time is up” animation
5. Top area includes a break timer (default 10 minutes).
6. User browses past flows by time hierarchy:
   - hour
   - day
   - month
   - year

Future (not MVP): hashtag indexing across flows.
Choose architecture/storage now so tags can be added without schema rewrites.

## Default stack (until repo says otherwise)
- Frontend: TypeScript + React
- Build tool: Vite
- Tests: Vitest + Testing Library
- Lint/format: ESLint + Prettier
- Package manager: npm

If project files later define a different stack, follow repo truth.

## Build, lint, typecheck, and test commands
No runnable toolchain exists yet. Use these as target commands when scaffolding.

Target commands:
```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
npm run test -- src/path/to/file.test.ts
npm run test -- -t "renders break timer"
npm run test:watch
```

Suggested `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## Code style guidelines

### Imports
- Use ES modules only.
- Order groups: built-in -> third-party -> internal alias -> relative.
- Keep one blank line between groups.
- Prefer named exports for shared modules.
- Avoid deep relative import chains when aliasing is available.

### Formatting
- Prettier is source of truth.
- Use 2-space indentation, semicolons, trailing commas where valid.
- Keep lines around 100 chars unless formatter decides otherwise.
- Keep JSX readable; extract dense logic into helpers/components.

### Types
- Enable TypeScript strict mode.
- Avoid `any`; prefer `unknown` plus narrowing.
- Use explicit types for public APIs.
- Use discriminated unions for timer/editor state transitions.
- Validate external inputs at boundaries (storage, URL params, APIs).

### Naming
- Components/types/interfaces/enums: `PascalCase`.
- Hooks: `useXxx`.
- Variables/functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` only for true constants.
- Tests: `*.test.ts` / `*.test.tsx`.

### Error handling
- Fail fast on impossible states.
- Never swallow exceptions silently.
- Return actionable user-facing errors.
- Include context in logs (flow id, timer id, action).
- Prefer typed error/result patterns at boundaries.

### Architecture and state
- Separate UI state, domain logic, and persistence concerns.
- Keep timer logic framework-agnostic where practical.
- Model `Flow` with stable id, timestamps, content, session metadata.
- Design optional tag relations now for future hashtag indexing.
- Support derived hour/day/month/year buckets for navigation.

### Editor rules
- Start with bold, italic, and links only.
- Preserve a clean blank writing experience.
- Sanitize links and rich text payloads.
- Prefer deterministic serialization (Markdown or structured JSON).

### Timer and UX rules
- Default focus timer is 20 minutes.
- Default break timer is 10 minutes.
- On focus completion: play audio cue + subtle animation.
- Respect browser autoplay limits; degrade gracefully.
- Preserve timer state across refresh when feasible.

### Testing rules
- Unit test timer math and state transitions.
- Component test formatting controls and accessibility labels.
- Integration test flow completion -> break behavior.
- Add retrieval tests for hour/day/month/year flow browsing.
- Keep tests deterministic with fake timers.

### Accessibility and quality
- Use semantic landmarks and keyboard-first interaction patterns.
- Ensure non-pointer operability for core actions.
- Provide visible focus states and timer announcements.
- Respect reduced-motion preferences.

## Agent workflow expectations
- Prefer incremental changes with tests over large rewrites.
- Do not assume unavailable commands exist before scaffolding.
- Update this file when conventions become concrete.

## Definition of done (MVP)
- Dev/build/lint/typecheck/test commands are functional.
- Single-test execution is documented and works.
- Core flow journey works end-to-end with reliable timers.
- Past flows are navigable by hour/day/month/year.
- Architecture leaves a clear path for hashtag indexing.
