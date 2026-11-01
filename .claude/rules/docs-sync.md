# Keep README.md and CLAUDE.md in sync with the code

After every code change, before calling the work done, re-read `README.md` and `CLAUDE.md` and update
whatever the change made stale or incomplete. If nothing needs updating, say so in the final summary.

Update **`CLAUDE.md`** when the change affects how an agent should work in the repo:
- commands, scripts, ports, env variables, Playwright projects;
- architecture: FSD layers or slices, routing, data flow, caching, stores;
- non-obvious decisions and their reasons ("do not switch to blur validation because…");
- library versions or APIs newer than common knowledge;
- testing conventions, helpers, mocks and fixtures.

Update **`README.md`** when the change affects what a reader of the project sees:
- features, screens, behaviour, the `src/` layout;
- scripts and setup steps;
- the test summary (test count, coverage, what the Vitest and Playwright specs cover);
- Decisions, Assumptions, and What next (remove items that are now done).

Rules:
- Edit only the parts the change affects; do not rewrite unrelated sections.
- Keep each file's existing style: English, short sentences, the same heading and list structure.
- Do not copy details between the files: README is for people, CLAUDE.md is for agents.
- If a screenshot shown in README changes, re-record the baselines with `npm run test:visual:update`.
