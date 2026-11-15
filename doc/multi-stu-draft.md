# Draft: Measurements with several STUs in ICOweb

Status: implemented on the branch `feature/multi-stu` (see “Implementation
notes” at the end). Written against ICOapi with `MUTLI_STU_SUPPORT=1` (see
ICOapi `doc/sphinx/usage.md`, “Multi STU Support”).

## Goal and constraints

- One CAN network per STU. A measurement always uses **all** connected units
  (a unit = CAN network + STU + connected STH). No per-unit start/stop.
- ICOapi stays the source of truth (like for the single STH today): connected
  units, their STHs and the running measurement come from the system state, not
  from the browser's local storage.
- Without the flag ICOweb must behave exactly as today. The flag is detected
  from the API: `SystemStateModel.units` is `null` without it, a list with it.
- Several clients may use one device: everything below must work for a client
  that did not start the measurement.

## What the API offers

| Need | API |
|---|---|
| Units and their state | `state.units[]` (`unit`, `network`, `stu_connected`, `sth_connected`), also pushed on `/state` WebSocket; `GET /can/units` |
| Add / remove a unit | `PUT /can/connect` adds the network; `PUT /can/disconnect?unit=` |
| Per-unit STU/STH calls | all `/stu/*`, `/sth/*` take `?unit=`; default is the first unit |
| Readiness | `GET /measurement/preflight` → `{ready, units[{unit, ok, problems, rssi, supply_voltage, sample_rate, messages_per_second, …}]}` |
| Start | `POST /measurement/start` (devices already connected) or `/measurement/execute` with `unit_mac_addresses`; optional `units: {<unit>: {first, second, third, adc, sensor_configuration, mac_address}}` for per-unit differences |
| Failure to start | `502`, `detail.units[]` lists every unit's problems (all-or-nothing) |
| Who measures | `measurement.units[]` in status (`unit`, `source`, `tool_name`, `stu_mac_address`, `sth_mac_address`); same list in `recording/finished` and `recording/failed` events |
| Live data | `/measurement/stream` frames carry `source`; per-source `dataloss` frames (`first/second/third = null`) |
| Files | `GET /files/analyze/{name}?source=`, `…/meta/{name}?source=`; metadata has `sources[]` (`name`, MACs, `start_time`, `start_offset`); no source on a multi-source file → `422` |

Gaps in the API (see “Open questions”): single-unit measurements under the flag
have no `source` on stream frames, IFT is refused with several units, the file
list does not say how many sources a file has.

## Changes by area

### 1. Client and feature detection
- Re-run `npm run generate-client` against ICOapi (new: `UnitStateModel`,
  `MeasurementUnit`, `UnitInstructions`, `SourceInfo`, `SourcedDataValueModel`,
  `unit` query parameters).
- `useSystemState`: add `units` (from `state.units`) and `multiUnit =
  units !== null`. Reset it in `resetCANState`. Everything below checks
  `multiUnit` so the old path stays untouched.
- `api/icoapi.ts`: optional `unit` argument on the STU/STH/CAN functions;
  `getUnits()`, `getPreflight()`; `startMeasurement` accepts `units` and
  `unit_mac_addresses`.

### 2. Hardware store (`hardwareStore.ts`, `classes/`)
- Today: one `STUDeviceList`, one `STHDeviceList`, `activeSTU`, `activeSTH`,
  `applyConnectedSTH`. With several units these become per unit:
  `unitStores: Record<unit, {stu, sthList, activeSTH, holderId}>`; `activeSTU`
  / `activeSTH` stay as “first unit” for the single-unit UI.
- `applyConnectedSTH(connected)` → `applyConnectedSTHs(state.units)`: one match
  per unit, same MAC/name matching as now.
- The chosen holder configuration is a browser setting per STH; keep it keyed by
  STH MAC (it already follows the device), not by unit, so replugging a cable
  to another adapter does not lose it.
- Persisted store: bump the persisted shape or ignore unknown keys
  (`localStoreParser.ts` rebuilds classes — needs the new structure).

### 3. Connection UI (`CANConnectionPanel.vue`, `HardwareStep.vue`, device tables)
- CAN panel: list connected units (name, STU state, STH) with a disconnect
  button each; “Connect” adds a network instead of replacing it.
- Hardware step: one STH table per unit (or one table with a unit column), scan
  and connect per unit via `?unit=`.
- A unit whose STU stopped answering is shown as an error row, and blocks the
  start (the preflight says why).

### 4. Measure page (`pages/measure.vue`, 700 lines — split first)
- Extract “channel/sensor selection”, “running status” and “start/stop” into
  components before adding units; the page is already too large.
- Start button: call `GET /measurement/preflight` when the page opens and
  before start; show a per-unit checklist (STU, STH, RSSI, bus load) and
  disable start while `ready` is false. Start itself still handles `502` and
  shows `detail.units`.
- Channels/ADC: one shared form (default, sent as the top-level instructions).
  Optional “differs for this unit” override per unit, sent as `units[unit]`.
  Show the bus load estimate (`messages_per_second`) per unit.
- IFT: disable the IFT controls when `units.length > 1` (API answers `422`).
- Running view: unit list from `measurementStatus.units` (works for clients that
  did not start the measurement), with tool name, source and dataloss per unit.
- Start with `unit_mac_addresses` from the per-unit active STH (execute flow) or
  without it when the STHs are connected already.

### 5. Live streaming (`useMeasurementWebSocket.ts`, charts)
- Frames have `source`. Replace `storage: MeasurementDataFrame[]` by
  `storage: Map<source, MeasurementDataFrame[]>`; a frame without `source`
  (single unit) goes to one default key.
- Bound the buffers: today `storage` grows for the whole measurement. With 3
  units that is ~9500 frames/s; keep only what the chart shows (drawTime ×
  rate) plus a margin.
- `dataloss`: `Map<source, number>`; show the worst one in the header and the
  value per unit in the unit list.
- Charts: one `StreamingChart` per unit, stacked, same time window. Each source
  has its own relative time (their start differs by ≤ about a second), so live
  charts use each source's own time axis; do not try to align live.
  `updateChartData` already takes channel names/units per call, so it is called
  once per source with that unit's sensors.
- Update cost: `updateChartData` runs at 10 ms intervals; with 3 charts check
  that it stays under budget (profile in the browser with 3 units at 3175 Hz).

### 6. Files and analysis (`pages/analyze.vue`, `files.vue`, `StaticChart.vue`)
- `ParsedMetadata.sources` tells if a file has several sources. If so, show a
  source selector and pass `source` to the data and metadata requests; without
  a selection the API answers `422`, so select the first source by default.
- “Overlay” mode: load all sources and shift each by `start_offset` (seconds)
  so they share one time axis. One chart per source stays the default.
- `MetadataAccordion`: one section per source (STU/STH MAC, start time,
  sensors); pre/post metadata are shared.
- File table: show the number of sources once the file list provides it (API
  change), otherwise only in the analysis page.

### 7. Events and post-measurement metadata
- `recording/finished` / `recording/failed` events carry `units` (sources). Use
  them for the notification (“3 units recorded”) and to open the file for
  analysis. A failed event does not say which unit failed (API gap).
- Post-meta modal is per file, not per unit: unchanged.

### 8. Tests (`tests/`, vitest)
- `useSystemState.spec.ts`: units in state, `multiUnit` flag, `null` without.
- `applyConnectedSTH.spec.ts` → per-unit matching, including two units with the
  same STH name.
- `measurePage.spec.ts`: preflight shown and gates start, `502` detail rendered,
  per-source buffers and trimming, a client that joins a running measurement.
- `CANConnectionPanel.spec.ts` / `HardwareStep.spec.ts`: add/remove units.
- An API simulation run (`ICOAPI_SIMULATE=only ICOAPI_SIMULATE_NETWORKS=3
  MUTLI_STU_SUPPORT=1`) works as the backend for manual checks; no hardware
  needed.

## Phases

1. **Read-only**: regenerate client, `multiUnit` detection, show the units from
   the state and the running status (`measurement.units`). Safe to ship, no
   behavior change.
2. **Connections**: units in the CAN panel, per-unit hardware step.
3. **Start**: preflight panel, start/execute with all units, shared
   instructions, error rendering.
4. **Live view**: per-source buffers, one chart per unit, per-unit dataloss.
5. **Analysis**: source selector, overlay with `start_offset`, per-source
   metadata.
6. **Per-unit instructions** (channels/ADC per unit), after real-hardware
   validation of the bus load limit.

## Open questions / API follow-ups

1. Add `source` to stream frames of single-unit measurements under the flag, or
   keep “no source = the only source”? (Draft assumes the latter.)
2. IFT for several units: out of scope for now (UI disabled). Needed?
3. File list: add the number of sources (and names) so the table can show them.
4. Failed event: add the failing unit (`failed_unit`).
5. Flag name `MUTLI_STU_SUPPORT` (typo kept for compatibility): decide before
   ICOweb or icodaq document it.
6. Real hardware is untested: bus-load limit (`ICOAPI_MAX_MESSAGES_PER_SECOND`,
   default 7000), clock drift between units, unplugging one unit mid-measurement
   (stops all units, file stays valid). The preflight UI should show these
   numbers so the limits can be tuned.
7. icodaq (Electron): needs Python 3.13 and the icoschema/linkml/h5py/PyTables
   dependencies in the bundled ICOapi, and a way to set the flag.

## Implementation notes

Done on `feature/multi-stu` (phases 1 to 5, and per-unit sensors from phase 6):

- Types: `src/client/types.gen.ts` was edited by hand. The installed
  `@hey-api/openapi-ts` (0.99) can not produce the old client layout
  (`core/`, `services.gen.ts`) and deletes it, so `npm run generate-client`
  must not be used until the client is migrated. Only the types are used.
- API gaps from the list above were closed in ICOapi: `source` on every stream
  frame under the flag (also for one unit), `sources` in `GET /files`,
  `failed_unit` in `recording/failed`.
- `useSystemState`: `units`, `multiUnit`. Everything multi-unit checks
  `multiUnit`; the single-unit path is unchanged.
- Hardware store: devices carry their `unit`; lists are loaded and replaced per
  unit (`updateSTUDeviceList(unit)`, `updateSTHDeviceList(holder, unit)`),
  `applyConnectedSTHs(units)` follows the sensor device of every unit.
  The holder of a device is kept per device object, so a device that two STUs
  see has a holder setting for each unit (not per MAC as proposed).
- Home page: one card per unit (`UnitHardware.vue`); the CAN panel adds and
  removes units.
- Measure page: split into `components/measure/*` and the composables
  `useMeasureSlots`, `useElapsed` (the page went from 700 to 565 lines, the rest
  is in the components). Preflight card, per-unit sensors (sent as `units`),
  one chart per source, per-source packet loss.
- Live data: per-source buffers that are bounded (a margin above what the chart
  shows), not deeply reactive, and drawn at most every 50 ms. Frames that only
  carry the data loss or an IFT value are no longer stored as samples.
- Analysis: source selector and overlay (start offsets), sources table, source
  count in the file list. A file with several sources opens with its first
  source.
- Events: `recording/finished` / `recording/failed` show a notice to every
  connected client.
- Not done: ADC settings per unit (the shared ADC settings are sent, the first
  unit is read), IFT with several units (disabled), real hardware.
