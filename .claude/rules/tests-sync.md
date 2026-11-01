# Update tests only after the user says the feature is done

Updating Vitest specs, Playwright specs and visual baselines is slow, and a feature often changes
several times before it is finished. Do not touch tests until the user confirms the feature is done.

While a feature is in progress:
- After each code change, run only the fast checks: `npm run lint` and `npm run typecheck`.
- Do not add, edit or delete test files (`*.test.ts(x)`, `e2e/**`), and do not re-record baselines.
- Do not run `npm run test:run`, `npm run test:e2e` or `npm run test:visual`, unless the user asks.
- If you know the change breaks an existing test (for example, a role or label it queries), list it
  briefly in the summary. Do not fix it yet.

At the end of each change, ask the user once whether the feature is done (use `AskUserQuestion`).
Name the feature in the question. Do not ask again until there is a new change.

When the user confirms the feature is done:
1. Update and add Vitest and Playwright tests for everything changed since the last test update.
2. Run `npm run test:run`, `npm run test:e2e` and `npm run test:visual`.
3. If the UI changed, re-record baselines with `npx playwright test --project="visual-*" --update-snapshots=all`.
   Plain `--update-snapshots` rewrites only failing baselines, and small changes stay under the
   diff tolerance.
4. Update the README test summary (test count, coverage, what the specs cover). `docs-sync.md`
   still applies to all other docs after every change; only the test summary waits for this step.

If the user says the feature is not done, keep working without tests and ask again after the next
change.
