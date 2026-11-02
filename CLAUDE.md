# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Fleet dispatcher app (task: `docs/Zadanie.md`, stack: `docs/STACK.md`, API: `docs/API.md`): a vehicle table with an edit dialog, and a live map (SignalR) with a vehicle list whose selection syncs with the map. Code, comments and README are in English; the UI defaults to Polish, with a PL/EN dropdown.

## Commands

```bash
npm run dev                # needs the Fleet API on http://localhost:4000 (VITE_API_BASE_URL)
npm run build              # tsc -b + vite build
npm run lint               # ESLint incl. Prettier and FSD import rules
npm run typecheck          # tsc -b (app, node tooling, e2e projects)
npm run format             # Prettier write

npm run test:run                                         # all Vitest tests
npx vitest run src/features/edit-vehicle                 # one folder
npx vitest run src/path/File.test.tsx -t "test name"     # one test
npm run test:coverage                                    # thresholds in vite.config.ts

npm run test:e2e                                         # Playwright functional: projects e2e-desktop (1440) and e2e-mobile (390)
npx playwright test --project=e2e-desktop e2e/edit-vehicle.e2e.ts -g "deep link"
npm run test:visual                                      # projects visual-390 … visual-2560, in Docker (must be running)
npm run test:visual:update                               # re-record all baselines after an intended UI change
npm run check                                            # lint, format:check, typecheck, test:coverage, test:e2e, test:visual
```

- The first Playwright run needs `npx playwright install chromium`.
- Pre-commit hook (`.githooks/pre-commit`, enabled by `prepare` via `core.hooksPath`): exports the index to a temp dir, links `node_modules` entry by entry (not `.tmp`/`.vite`, so tsc and Vite caches stay separate) and runs `CI=1 npm run check` there. So a commit fails while tests are out of date with the code; the user decides whether to use `--no-verify`, never add it on your own. On failure the temp dir with reports is kept.
- Playwright builds `dist-e2e` with `--mode e2e` and serves it on port 4179. Locally it reuses a server that is already running there, which may still be serving an old build.
- Visual tests run only in Docker: the `visual-*` projects exist only when `VISUAL_DOCKER` is set, which `scripts/test-visual-docker.sh` does. Baselines are `e2e/__screenshots__/<project>/<name>.png`, with no platform suffix.
- The script uses the image tag matching the installed `@playwright/test`, keeps Linux `node_modules` in a Docker volume (`npm ci` reruns when `package-lock.json` changes) and mounts `e2e/support/fonts.conf`: without it the image renders `system-ui` with a CJK font that breaks Polish diacritics. The app fonts are self-hosted now, so it only matters for fallback text (e.g. before the woff2 loads).

## Architecture

**Feature-Sliced Design** under `src/`: `app → pages → widgets → features → entities → shared`.
- ESLint (`no-restricted-imports`, generated per layer in `eslint.config.js`) enforces two rules:
  - a layer imports only from lower layers;
  - other slices are imported only through their public API (`@/entities/vehicle`, not deeper paths).
- Inside a slice, imports are relative.
- `src/shared/test/**` is exempt from the layer rule (it builds fixtures from entity types).

**Routing** (TanStack Router, code-based, `src/app/router/routes.tsx`):
- Route wrapper components pass params and search to pages as props; pages do not import routes.
- Loaders only *start* fetching (`void queryClient.prefetchQuery(...)`). Pages use `useQuery` and render their own loading, error and empty states.
- The vehicle dialog is the `/vehicles/$vehicleId` route, rendered through `<Outlet/>` over the table. Its children only pick the mode: index = details (read-only), `edit` = edit. The parent route renders the dialog, so switching modes does not remount or re-animate it.
- Edit from details pushes `/edit`; Save and Cancel then call `history.back()`. Edit opened directly (table, deep link) closes the dialog. The route component decides this from the mode at mount.
- Table search and sort live in validated search params.
- `/map` is a lazy chunk because MapLibre is large.

**Data**:
- Entities own API calls and `queryOptions`.
- `vehicleQueryOptions(id, queryClient)` seeds the detail from the list cache.
- After a successful PUT, `storeSavedVehicle` writes the saved vehicle into both caches; there is no refetch.
- Errors are `ApiError` (status 0 = network error). `shouldRetryRequest` retries only network errors and 5xx; mutations never retry.
- Client state is in Zustand: selected vehicle (`features/select-vehicle`), live positions (`entities/vehicle-position`), toasts.

**Live tracking** (`features/live-tracking`):
- `createLiveTrackClient` wraps one HubConnection. It re-invokes `SubscribeLiveTrack` after every reconnect, because a subscription belongs to its connection, and goes silent after `stop()`.
- `useLiveTracking` starts the client on a `setTimeout(0)`, so StrictMode's mount/unmount/mount does not abort a negotiation.
- `mergePositions` drops reports older than the stored one, since the snapshot can arrive after a live event.
- The status thresholds (offline after 5 minutes) are in `entities/vehicle-position/model/status.ts`. `STATUS_COLORS` there duplicates the status tokens in `tokens.css`; keep them in sync.

**Map** (`widgets/vehicle-map`):
- Markers are not React-driven. `useAnimatedVehicles` runs a rAF loop that calls `source.setData()` on the GeoJSON source, interpolating between reports (`lib/interpolation.ts`). The `<Source data={EMPTY_FEATURE_COLLECTION}>` prop is constant on purpose.
- The camera follows the selected vehicle in the same rAF frames (`lib/follow.ts`): the first frame flies there and zooms in to at least `FOLLOW_ZOOM` (never out), later ones `jumpTo` the animated position, but skip while `map.isMoving()` or a pointer is down on the map: `jumpTo` resets every interaction handler, so jumping each frame stopped any ease or zoom gesture and kept a drag from ever passing its start threshold. While following, scroll and pinch zoom use `around: 'center'` (re-enabled imperatively: `enable()` ignores new options while enabled). `onDragStart` pauses following until the selection changes or the selected marker is clicked again.
- `lib/maplibre.ts` sets the MapLibre worker URL. This is required: with Vite bundling, MapLibre 6 cannot find its worker otherwise.
- Layer specs and the SDF arrow icon are in `lib/layers.ts`.
- `lib/basemap.ts` (`recolorBasemap`, called in `onLoad`) repaints the OpenFreeMap style in the app palette. It matches layers by `source-layer` (OpenMapTiles schema) and id fragments (`casing`, `motorway`, `major`, `dashline`, `park`); unknown layers keep their style. MapLibre controls are restyled with `:global(.maplibregl-…)` in `VehicleMap.module.css`.

**Map list** (`widgets/tracking-list`): the selected item's details expand by animating `grid-template-rows` from `0fr` to `1fr`. The panel is always rendered; its content mounts on selection and unmounts only after the collapse transition (`afterOwnAnimations`). Scrolling the selected item into view also waits for the expansion, so the whole panel is visible. The open card hovers as one and a click on its details collapses it too (pointer only; the button stays the keyboard/AT control, and a click that ends a text selection is ignored). The meta line (plate, speed, report time) never wraps: the report time re-renders every 10 s, and wrapping made rows jump. Only the report time shrinks (ellipsis), and relative time uses the short `Intl` style ("40 sek. temu").

**Edit form** (`features/edit-vehicle`, TanStack Form):
- Validation is one form-level `onDynamic` validator (`validateVehicleForm`) with `revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' })`. Do not switch to blur validation: errors appearing on blur moved the Save button away mid-click.
- Validators return translation keys. `serverErrors.ts` maps the API's English messages (all listed in docs/API.md) to the same keys.
- `readOnly` disables the fieldset and hides Save/Cancel; the details dialog uses it. The form is keyed by mode, so leaving edit discards changes. After a mode switch, focus moves to the new content (name field or the header Edit button), because the focused button was removed.
- Saving uses `mutate(..., { onSuccess, onError })`, so a dialog closed mid-save never navigates. Cache updates and the toast live in the `useMutation` options.

**Dialog** (`shared/ui/dialog`): built on the native `<dialog>` + `showModal()`. Its `close` handler ignores events that arrive while the dialog is open again (StrictMode remount). `actions` adds header controls before ×. Esc, the close button and `useCloseDialog()` (for content such as Save/Cancel) set `data-closing`, wait for the dialog's own animations (`afterOwnAnimations` in `shared/lib`; not its subtree: a spinner never finishes), then call `onClose`; calling the parent's `onClose` directly skips the exit animation. Durations are the `--transition-enter/exit` tokens, 0 ms with reduced motion. While open, it sets `scrollbar-gutter: stable` on `<html>` if the page had a scrollbar, because the scroll lock in `global.css` would otherwise shift the page.

**Toasts** (`shared/ui/toast`) use the same motion: the timeout and the × button set `data-closing` on the toast and call the store's `dismiss` only after `afterOwnAnimations`; calling `dismiss` directly skips the exit animation.

**i18n** (`shared/i18n`):
- `locales/pl.ts` is the typed source of keys (`i18next.d.ts`). Other locales must `satisfies LocaleMessages`.
- `languages.ts` is the single registry of languages (code, own name, flag, Intl locale, messages). To add a language, add `locales/<code>.ts`, a 4:3 `flags/<country>.svg` and one registry entry; the dropdown, i18next resources and formatters follow.
- The language dropdown (`features/switch-language`) is a custom select-only combobox (WAI-ARIA APG), not a native `<select>`. Focus stays on the trigger and the highlighted option is set with `aria-activedescendant`, so blur closes the list; the listbox prevents `mousedown` so clicking an option does not blur. Flags are SVG files, not emoji, because Windows shows emoji flags as letters.
- Tests check that every registered locale has the same keys as pl, and exactly the plural suffixes `Intl.PluralRules` reports for it (pl: `_one/_few/_many/_other`, en: `_one/_other`).
- Language names are not translation keys: the dropdown shows each language in its own name.
- Use `useFormatters()` for dates, relative time, km/h and locale-aware sorting.

**React Compiler is on.** Don't add manual memoization. Don't pass mutable library objects (TanStack Table header, row or column objects; the TanStack Form field API) into child components; pass the primitive values the child needs instead. Table cells render through `VehicleCell` by column id; column defs contain no JSX.

**Library versions newer than common knowledge:** TanStack Table **v9** (`tableFeatures`, `useTable`, `createColumnHelper<typeof features, T>()`; not the v8 API), MapLibre **6**, Vitest **5**, i18next 26. Check the installed `.d.ts` files; TanStack ships docs in `node_modules/@tanstack/*/skills`.

**Styling**:
- CSS Modules, with design tokens in `src/app/styles/tokens.css`. The app is dark only.
- Palette: `--palette-sand/ember/teal/abyss`; semantic tokens map onto it. Ember (`--color-accent`) is for fills only: as small text it fails AA, so text accents and focus use sand (`--color-highlight`, `--color-focus`).
- Corners are sharp by design: `--radius-sm/md/lg` are 0. Only status dots and map markers are round.
- The grainy gradient is for accents only (brand mark, primary button, active-nav bar, the dialog's top band): `--gradient-signature` / `--gradient-accent` plus `--noise-texture` (SVG `feTurbulence`) in an `::after` with `mix-blend-mode: overlay`, or as a second background with `background-blend-mode`. Do not put it on page backgrounds or panels.
- The active-nav bar (`AppHeader.module.css`) is one signature gradient spanning all tabs (`.nav::before`; the nav fits its tabs), with an anchor-positioned `::after` that slides to the active link and hides the rest by painting `--color-bg` through a clipped `box-shadow`. So the header background must stay a solid `--color-bg`.
- Fonts are self-hosted variable woff2 (Schibsted Grotesk, JetBrains Mono, latin + latin-ext) in `src/app/styles/fonts/`, declared in `fonts.css`. Do not set `tabular-nums` broadly: Schibsted makes punctuation tabular too (commas get gaps); it is set only on numeric columns.
- The vehicle list's loading state is `VehiclesLoader` (`widgets/vehicles-table`): a marker drives an SVG route (CSS `offset-path`; the scene is a fixed 320×120 px, so path units are pixels). It stays for a hardcoded `LOADER_DURATION_MS` (2.2 s: the marker has just reached the destination; it depends on `--loader-cycle` and the keyframe percentages, so change them together) or until the data arrives, whichever is later; `onFinish` then fires. With reduced motion it waits only for the data. jsdom has no `matchMedia`, so the timer runs there: tests use fake timers or `stubReducedMotion()` (`@/shared/test`). Until then the table stays in its loading state (`isLoading = isPending || !loaderFinished`). While loading, the heading and count are only visually hidden (the `h1` labels the section and the count is a live region that must exist before it changes); the search is not rendered. A table mounted while loading gets `.reveal`, a one-time rise of heading, search and table.
- Vehicle type icons: one SVG file per type in `entities/vehicle/ui/icons/` (viewBox 32×20, black strokes). `VehicleTypeIcon` uses the file as a CSS `mask` over `background-color: currentcolor`, so the icon takes the text colour; an `<img>` could not. It is `role="img"` labelled with the translated type, so it is part of the name cell's and the map list button's accessible name. Shown before the name in the table (incl. cards) and the map list (sand when selected).
- Registration numbers are styled as plate chips (mono, teal border with a thicker left band) in both `VehiclesTable.module.css` and `TrackingList.module.css`; keep them alike.
- Scrollbars are styled once in `global.css` (thin, `--color-scrollbar-thumb` on a transparent track); don't add per-component scrollbar styles.
- Breakpoints are mobile first: 768 / 1024 / 1280 / 1536 px; the container is capped at 2560 px.
- Below 768 px is a reduced mode: compact vehicle cards (name, plate, driver) that open details on tap, "Show on map" in the card's header row, no sorting; compact map list. Card layout is CSS only (`VehiclesTable.module.css`, grid areas): cards hide the other columns, and the name truncates before "Show on map". Rows render both a details link and Edit; on cards the details link (`.cardLink`) is stretched over the whole card (`.row` is `position: relative`) and "Show on map" sits above it (`z-index`); in the table only Edit shows. The desktop `.table .cell` selector is more specific on purpose, to undo the card hiding.
- Long API text in table cells and the map list goes through `TruncatedText` (`shared/ui`; ellipsis + `title`). The table's per-column `max-width` caps (in `ch`) are in `VehiclesTable.module.css`; on cards and in the map list the container width is the limit (the list's plate also has a 14ch cap).

## Testing conventions

- Vitest runs in jsdom. Setup (`src/shared/test/setup.ts`):
  - mocks `zustand` (`__mocks__/zustand.ts`), so every store resets after each test;
  - shims `HTMLDialogElement` (`close` fires asynchronously, as in browsers);
  - resets i18n to Polish and clears `localStorage` before each test;
  - runs with `TZ=UTC`.
- Assertions use the Polish UI text.
- The type icon's label comes first in the name cell's and the map list button's accessible name (jsdom joins it with no space: "FurgonSprinter 01…"), so match them with `/^\p{L}[\p{L} ]*?Sprinter 01/u`, not `/^Sprinter 01/`. The same holds in Playwright.
- Helpers in `@/shared/test`:
  - `stubApi(overrides)` replaces `fetch` with routes keyed `"METHOD /path"`; unknown routes return 404, and `routes` is mutable mid-test.
  - `renderWithProviders` uses a catch-all memory router; `renderWithQuery` has no router.
  - Typed fixtures.
  - `stubReducedMotion()` makes `(prefers-reduced-motion: reduce)` match (jsdom has no `matchMedia`); restored after each test.
  - `holdAnimation(element)` gives an element one running animation (jsdom has none, so `afterOwnAnimations` calls back at once) and returns `finish()`; use it to test what happens during an exit or collapse.
  - `fakeSignalRModule` is used with `vi.mock('@microsoft/signalr', async () => (await import('@/shared/test')).fakeSignalRModule())`.
- `renderApp(path)` (`src/app/test`) renders the real route tree.
- MapLibre cannot run in jsdom: tests mock `react-map-gl/maplibre` or `@/widgets/vehicle-map`, and coverage excludes the map canvas and animation files.
- In Playwright, the auto fixture `api` (`e2e/support/mockApi.ts`) mocks REST, the SignalR negotiate call, the hub WebSocket and a tile-less map style:
  - change an endpoint with `api.override('PUT /api/vehicles/<id>', handler)`; push live updates with `api.pushPositions([...])`;
  - the clock is fixed to `FIXED_NOW` and reduced motion is on;
  - `MAP_CENTER_VEHICLE` stands in the middle of the initial view, so tests click the canvas centre to select it.
