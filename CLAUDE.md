# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Fleet dispatcher app (task: `Zadanie.md`, stack: `STACK.md`, API: `API.md`): a vehicle table with an edit dialog, and a live map (SignalR) with a vehicle list whose selection syncs with the map. Code, comments and README are in English; the UI defaults to Polish, with a PL/EN switch.

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
npm run test:visual                                      # projects visual-390 … visual-2560
npm run test:visual:update                               # re-record baselines after an intended UI change
```

- The first Playwright run needs `npx playwright install chromium`.
- Playwright builds `dist-e2e` with `--mode e2e` and serves it on port 4179. Locally it reuses a server that is already running there, which may still be serving an old build.
- Visual baselines (`e2e/__screenshots__/<project>/*-darwin.png`) exist only for macOS.

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
- The edit dialog is a child route of `/vehicles` (`$vehicleId/edit`), rendered through `<Outlet/>` over the table.
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
- `lib/maplibre.ts` sets the MapLibre worker URL. This is required: with Vite bundling, MapLibre 6 cannot find its worker otherwise.
- Layer specs and the SDF arrow icon are in `lib/layers.ts`.

**Edit form** (`features/edit-vehicle`, TanStack Form):
- Validation is one form-level `onDynamic` validator (`validateVehicleForm`) with `revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' })`. Do not switch to blur validation: errors appearing on blur moved the Save button away mid-click.
- Validators return translation keys. `serverErrors.ts` maps the API's English messages (all listed in API.md) to the same keys.
- Saving uses `mutate(..., { onSuccess, onError })`, so a dialog closed mid-save never navigates. Cache updates and the toast live in the `useMutation` options.

**Dialog** (`shared/ui/dialog`): built on the native `<dialog>` + `showModal()`. Its `close` handler ignores events that arrive while the dialog is open again (StrictMode remount).

**i18n** (`shared/i18n`):
- `locales/pl.ts` is the typed source of keys (`i18next.d.ts`). `en.ts` must `satisfies LocaleMessages`, and a test checks that both have the same keys.
- Plural suffixes differ per language: pl has `_one/_few/_many/_other`, en has `_one/_other`.
- Use `useFormatters()` for dates, relative time, km/h and locale-aware sorting.

**React Compiler is on.** Don't add manual memoization. Don't pass mutable library objects (TanStack Table header, row or column objects; the TanStack Form field API) into child components; pass the primitive values the child needs instead. Table cells render through `VehicleCell` by column id; column defs contain no JSX.

**Library versions newer than common knowledge:** TanStack Table **v9** (`tableFeatures`, `useTable`, `createColumnHelper<typeof features, T>()`; not the v8 API), MapLibre **6**, Vitest **5**, i18next 26. Check the installed `.d.ts` files; TanStack ships docs in `node_modules/@tanstack/*/skills`.

**Styling**:
- CSS Modules, with design tokens in `src/app/styles/tokens.css`. The app is dark only.
- Breakpoints are mobile first: 768 / 1024 / 1280 / 1536 px; the container is capped at 1440 px.
- Below 768 px is an intentional emergency mode with fewer features: vehicle cards, no sorting or "Show on map", compact map list.

## Testing conventions

- Vitest runs in jsdom. Setup (`src/shared/test/setup.ts`):
  - mocks `zustand` (`__mocks__/zustand.ts`), so every store resets after each test;
  - shims `HTMLDialogElement` (`close` fires asynchronously, as in browsers);
  - resets i18n to Polish and clears `localStorage` before each test;
  - runs with `TZ=UTC`.
- Assertions use the Polish UI text.
- Helpers in `@/shared/test`:
  - `stubApi(overrides)` replaces `fetch` with routes keyed `"METHOD /path"`; unknown routes return 404, and `routes` is mutable mid-test.
  - `renderWithProviders` uses a catch-all memory router; `renderWithQuery` has no router.
  - Typed fixtures.
  - `fakeSignalRModule` is used with `vi.mock('@microsoft/signalr', async () => (await import('@/shared/test')).fakeSignalRModule())`.
- `renderApp(path)` (`src/app/test`) renders the real route tree.
- MapLibre cannot run in jsdom: tests mock `react-map-gl/maplibre` or `@/widgets/vehicle-map`, and coverage excludes the map canvas and animation files.
- In Playwright, the auto fixture `api` (`e2e/support/mockApi.ts`) mocks REST, the SignalR negotiate call, the hub WebSocket and a tile-less map style:
  - change an endpoint with `api.override('PUT /api/vehicles/<id>', handler)`; push live updates with `api.pushPositions([...])`;
  - the clock is fixed to `FIXED_NOW` and reduced motion is on;
  - `MAP_CENTER_VEHICLE` stands in the middle of the initial view, so tests click the canvas centre to select it.
