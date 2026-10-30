# Fleet API · Reference

Vehicles, drivers, fleets and dictionaries over REST, live vehicle positions over SignalR. This is the API your application talks to.

| | |
|---|---|
| **Base URL** | `http://localhost:4000` |
| **Format** | JSON (UTF-8). Errors are Problem Details (`application/problem+json`). |
| **Authentication** | None. CORS is open to every origin. |
| **Data** | Kept in memory. Restarting the server restores the original vehicles. |

## Table of Contents

- [`GET /api/vehicles`](#get-apivehicles)
- [`GET /api/vehicles/{id}`](#get-apivehiclesid)
- [`PUT /api/vehicles/{id}`](#put-apivehiclesid)
- [`GET /api/drivers`](#get-apidrivers)
- [`GET /api/fleets`](#get-apifleets)
- [`GET /api/dictionaries`](#get-apidictionaries)
- [`INVOKE SubscribeLiveTrack`](#invoke-subscribelivetrackvehicleids)
- [`EVENT LiveTrack`](#event-livetrackpositions)
- [Models](#models)
- [Simulating slow responses and errors](#simulating-slow-responses-and-errors)

---

## Vehicles

### `GET /api/vehicles`

**List vehicles**

Returns every vehicle. The list is not paged.

**Responses**

| Status | Body |
|---|---|
| `200` | `ResourceCollectionOfVehicleModel` |

`200 · application/json`

```json
{
  "items": [
    {
      "id": "c21183a2-b1aa-4e81-bf8f-46f775e00804",
      "name": "Sprinter 01",
      "registrationNumber": "GA 4K215",
      "manufacturer": { "id": "0391be87-1776-46e6-a04e-f0f3700e648d", "name": "Mercedes-Benz" },
      "model": { "id": "d2b7319d-5111-4c8f-822b-3ed08734501e", "name": "Sprinter" },
      "yearOfManufacture": 2021,
      "type": "Van",
      "fuelType": "Diesel",
      "fleet": { "id": "a6754ff2-e60e-47ee-a938-bd53927453d7", "name": "Dostawy Gdynia" },
      "driver": { "id": "5986da66-b35e-435c-a805-95945455fb1c", "name": "Anna Nowak" }
    },
    …
  ],
  "total": 15
}
```

### `GET /api/vehicles/{id}`

**Get a vehicle**

**Path parameters**

| Name | Required | Type | Description |
|---|---|---|---|
| `id` | required | `string` | Vehicle ID. |

**Responses**

| Status | Body |
|---|---|
| `200` | `VehicleModel` |
| `404` | `ProblemDetails` – no vehicle with this ID. |

### `PUT /api/vehicles/{id}`

**Update a vehicle**

Replaces every editable field of one vehicle and returns the saved vehicle. All fields are required in every request. A driver may be assigned to more than one vehicle.

**Path parameters**

| Name | Required | Type | Description |
|---|---|---|---|
| `id` | required | `string` | Vehicle ID. |

**Request body · `application/json` · `UpdateVehicleCommand`**

| Field | Required | Type | Rules |
|---|---|---|---|
| `name` | required | `string` | 2–60 characters. |
| `registrationNumber` | required | `string` | Up to 50 characters. Unique across vehicles; spaces and letter case are ignored when comparing. |
| `manufacturerId` | required | `string` | ID from `vehicleManufacturer` in `GET /api/dictionaries`. |
| `modelId` | required | `string` | ID from `vehicleModels`. The model must belong to `manufacturerId`. |
| `yearOfManufacture` | required | `integer` | From 1950 to the current year. |
| `type` | required | `VehicleType` | |
| `fuelType` | required | `FuelType` | |
| `fleetId` | required | `string` | ID from `GET /api/fleets`. |
| `driverId` | required | `string \| null` | ID from `GET /api/drivers`, or `null` for no driver. |

**Responses**

| Status | Body |
|---|---|
| `200` | `VehicleModel` – the vehicle as saved. |
| `400` | `HttpValidationProblemDetails` – the body is invalid; `errors` lists the problems per field. |
| `404` | `ProblemDetails` – no vehicle with this ID. |
| `500` | `ProblemDetails` – the save failed and nothing was changed. |

**Request · `PUT /api/vehicles/c21183a2-b1aa-4e81-bf8f-46f775e00804`**

```json
{
  "name": "Sprinter 01 – chłodnia",
  "registrationNumber": "GA 4K215",
  "manufacturerId": "0391be87-1776-46e6-a04e-f0f3700e648d",
  "modelId": "312eafee-3ecd-40c5-a711-9109b35a0034",
  "yearOfManufacture": 2024,
  "type": "Van",
  "fuelType": "Electric",
  "fleetId": "a6754ff2-e60e-47ee-a938-bd53927453d7",
  "driverId": "34530f18-2aae-44b8-b128-c2d791ab8db1"
}
```

`400 · application/problem+json`

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "registrationNumber": ["Registration number is already used by another vehicle."],
    "modelId": ["Model does not belong to the selected manufacturer."]
  }
}
```

**All validation messages**

| Field | Messages |
|---|---|
| `name` | Name is required.<br>Name must be between 2 and 60 characters long. |
| `registrationNumber` | Registration number is required.<br>Registration number must be at most 50 characters long.<br>Registration number is already used by another vehicle. |
| `manufacturerId` | Manufacturer is required.<br>Manufacturer does not exist. |
| `modelId` | Model is required.<br>Model does not exist.<br>Model does not belong to the selected manufacturer. |
| `yearOfManufacture` | Year of manufacture is required.<br>Year of manufacture must be a whole number from 1950 to 2026. *(the current year)* |
| `type` | Vehicle type is required.<br>Vehicle type must be one of: Unknown, Car, Van, SmallRigidTruck, TractorTrailer. |
| `fuelType` | Fuel type is required.<br>Fuel type must be one of: Diesel, Petrol, Electric, Hybrid, LPG, Other. |
| `fleetId` | Fleet is required.<br>Fleet does not exist. |
| `driverId` | Driver ID is required. Send null to leave the vehicle without a driver.<br>Driver does not exist. |

A body that is not valid JSON gets a plain `ProblemDetails` with status `400` and no `errors`.

`500 · application/problem+json`

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.6.1",
  "title": "An error occurred while processing your request.",
  "status": 500,
  "detail": "Simulated failure (--save-error-rate). Nothing was saved."
}
```

---

## Drivers, fleets and dictionaries

### `GET /api/drivers`

**List drivers**

Returns every driver. The list is not paged.

**Responses**

| Status | Body |
|---|---|
| `200` | `ResourceCollectionOfDriverModel` |

`200 · application/json`

```json
{
  "items": [
    {
      "id": "5986da66-b35e-435c-a805-95945455fb1c",
      "name": "Anna Nowak",
      "firstName": "Anna",
      "lastName": "Nowak"
    },
    …
  ],
  "total": 13
}
```

### `GET /api/fleets`

**List fleets**

Returns every fleet. The list is not paged.

**Responses**

| Status | Body |
|---|---|
| `200` | `ResourceCollectionOfFleetModel` |

`200 · application/json`

```json
{
  "items": [
    { "id": "a6754ff2-e60e-47ee-a938-bd53927453d7", "name": "Dostawy Gdynia" },
    { "id": "23fda502-ccda-44ef-9214-119e62f12c4b", "name": "Serwis Gdańsk" },
    { "id": "fd56b614-213e-4ac5-9ac6-0e803a4ae67f", "name": "Kurierzy Trójmiasto" }
  ],
  "total": 3
}
```

### `GET /api/dictionaries`

**Get dictionaries**

Every fixed list a vehicle field can take its value from, in one response.

**Responses**

| Status | Body |
|---|---|
| `200` | `DictionariesGetDictionariesResponse` |

`200 · application/json`

```json
{
  "vehicleType": ["Unknown", "Car", "Van", "SmallRigidTruck", "TractorTrailer"],
  "fuelType": ["Diesel", "Petrol", "Electric", "Hybrid", "LPG", "Other"],
  "vehicleManufacturer": [
    { "id": "0391be87-1776-46e6-a04e-f0f3700e648d", "key": "Mercedes-Benz" },
    …
  ],
  "vehicleModels": [
    {
      "id": "d2b7319d-5111-4c8f-822b-3ed08734501e",
      "key": "Sprinter",
      "manufacturerId": "0391be87-1776-46e6-a04e-f0f3700e648d",
      "manufacturerName": "Mercedes-Benz"
    },
    …
  ]
}
```

---

## Live tracking (SignalR)

| | |
|---|---|
| **Hub URL** | `http://localhost:4000/tracking` |
| **Client** | `@microsoft/signalr`, default settings |
| **Protocol** | JSON hub protocol over WebSockets (MessagePack is not supported) |

Connect, subscribe to the vehicles you want to follow, and the server pushes their new positions as they report:

```ts
import { HubConnectionBuilder } from "@microsoft/signalr";

const connection = new HubConnectionBuilder()
  .withUrl("http://localhost:4000/tracking")
  .build();

connection.on("LiveTrack", (positions: LiveTrackPosition[]) => {
  // new positions of subscribed vehicles
});

await connection.start();
const snapshot = await connection.invoke<LiveTrackPosition[]>("SubscribeLiveTrack", vehicleIds);
```

**Connection**

- A subscription belongs to the connection that made it.
- The server keeps no state between runs; after a restart vehicles start from new positions.
- The server sends a keep-alive ping every 15 seconds.

### `INVOKE SubscribeLiveTrack(vehicleIds)`

**Follow vehicles · client → server**

Sets which vehicles this connection receives in `LiveTrack` and returns their last known positions.

**Arguments**

| Name | Required | Type | Description |
|---|---|---|---|
| `vehicleIds` | required | `string[]` | Vehicles to follow. Replaces the previous subscription of this connection. Unknown IDs are ignored; an empty array stops all updates. |

**Returns**

| Type | Description |
|---|---|
| `LiveTrackPosition[]` | The last reported position of each known vehicle from `vehicleIds`. |

### `EVENT LiveTrack(positions)`

**New positions · server → client**

Sent about once a second while any subscribed vehicle has reported since the previous message. Contains only those vehicles, each at most once.

**Arguments**

| Name | Type | Description |
|---|---|---|
| `positions` | `LiveTrackPosition[]` | New positions of subscribed vehicles. |

`LiveTrack · arguments[0]`

```json
[
  {
    "vehicleId": "c21183a2-b1aa-4e81-bf8f-46f775e00804",
    "latitude": 54.507842,
    "longitude": 18.538114,
    "heading": 152,
    "speed": 41,
    "lastReportedTime": "2026-10-30T09:15:42.120Z"
  }
]
```

**How vehicles report**

- A driving vehicle reports every 3–5 seconds and keeps moving between reports.
- A parked vehicle reports every 60 seconds with speed 0.
- Some vehicles stopped reporting long ago; their last position can be days old.

---

## Models

### `VehicleModel`

| Field | Type | Description |
|---|---|---|
| `id` | `string (uuid)` | Vehicle ID. |
| `name` | `string` | Name shown to users, e.g. `Sprinter 01`. |
| `registrationNumber` | `string` | Number plate, e.g. `GA 4K215`. |
| `manufacturer` | `EntityReference` | An item of `vehicleManufacturer`. |
| `model` | `EntityReference` | An item of `vehicleModels`. |
| `yearOfManufacture` | `integer` | |
| `type` | `VehicleType` | |
| `fuelType` | `FuelType` | |
| `fleet` | `EntityReference` | Fleet the vehicle belongs to. |
| `driver` | `EntityReference \| null` | Assigned driver; `null` when there is none. |

### `UpdateVehicleCommand`

Body of `PUT /api/vehicles/{id}`; every field is required, rules are listed there.

| Field | Type |
|---|---|
| `name` | `string` |
| `registrationNumber` | `string` |
| `manufacturerId` | `string (uuid)` |
| `modelId` | `string (uuid)` |
| `yearOfManufacture` | `integer` |
| `type` | `VehicleType` |
| `fuelType` | `FuelType` |
| `fleetId` | `string (uuid)` |
| `driverId` | `string (uuid) \| null` |

### `DriverModel`

| Field | Type | Description |
|---|---|---|
| `id` | `string (uuid)` | Driver ID. |
| `name` | `string` | Full name, e.g. `Anna Nowak`. |
| `firstName` | `string` | |
| `lastName` | `string` | |

### `FleetModel`

| Field | Type | Description |
|---|---|---|
| `id` | `string (uuid)` | Fleet ID. |
| `name` | `string` | e.g. `Dostawy Gdynia`. |

### `DictionariesGetDictionariesResponse`

| Field | Type | Description |
|---|---|---|
| `vehicleType` | `VehicleType[]` | |
| `fuelType` | `FuelType[]` | |
| `vehicleManufacturer` | `DictionariesGuidDictionaryItem[]` | Every manufacturer. |
| `vehicleModels` | `DictionariesVehicleModelItem[]` | Every model of every manufacturer. |

### `DictionariesGuidDictionaryItem`

| Field | Type | Description |
|---|---|---|
| `id` | `string (uuid)` | |
| `key` | `string` | Display name, e.g. `Mercedes-Benz`. |

### `DictionariesVehicleModelItem`

| Field | Type | Description |
|---|---|---|
| `id` | `string (uuid)` | |
| `key` | `string` | Display name, e.g. `Sprinter`. |
| `manufacturerId` | `string (uuid)` | Manufacturer the model belongs to. |
| `manufacturerName` | `string` | |

### `LiveTrackPosition`

| Field | Type | Description |
|---|---|---|
| `vehicleId` | `string (uuid)` | Same ID as `VehicleModel.id`. |
| `latitude` | `number` | WGS 84, degrees. |
| `longitude` | `number` | WGS 84, degrees. |
| `heading` | `integer` | Direction of travel in degrees, 0–359: 0 = north, 90 = east. |
| `speed` | `integer` | km/h. |
| `lastReportedTime` | `string (date-time)` | When the vehicle sent this position. ISO 8601, UTC. |

### `EntityReference`

A short reference to another object.

| Field | Type | Description |
|---|---|---|
| `id` | `string (uuid)` | |
| `name` | `string` | Display name. |

### `ResourceCollectionOf…`

`ResourceCollectionOfVehicleModel`, `ResourceCollectionOfDriverModel` and `ResourceCollectionOfFleetModel` share one shape.

| Field | Type | Description |
|---|---|---|
| `items` | `VehicleModel[]` · `DriverModel[]` · `FleetModel[]` | |
| `total` | `integer` | Number of items. |

### `ProblemDetails`

Every error response (RFC 9457).

| Field | Type | Description |
|---|---|---|
| `type` | `string` | URI of the error kind. |
| `title` | `string` | Short summary. |
| `status` | `integer` | HTTP status code. |
| `detail` | `string` *(optional)* | More information, when there is any. |

### `HttpValidationProblemDetails`

A `ProblemDetails` with one more field. Returned with status `400`.

| Field | Type | Description |
|---|---|---|
| `errors` | `Record<string, string[]>` | Messages per field of the request body, e.g. `name`. |

### `VehicleType`

String enum.

`Unknown` · `Car` · `Van` · `SmallRigidTruck` · `TractorTrailer`

### `FuelType`

String enum.

`Diesel` · `Petrol` · `Electric` · `Hybrid` · `LPG` · `Other`

---

## Simulating slow responses and errors

Start the server in the `fleet-api` folder with one of these commands:

| Command | Effect |
|---|---|
| `npm start` | Normal mode: every `/api` response takes 300 ms. |
| `npm run start:slow` | Every `/api` response takes 3 s. |
| `npm run start:errors` | Every `PUT /api/vehicles/{id}` fails with 500. |
| `node src/index.js --delay <ms>` | Custom delay for every `/api` response. |
| `node src/index.js --save-error-rate <0..1>` | Chance that a save fails, e.g. `0.3`. |
| `node src/index.js --port <port>` | Listen on another port (default 4000). |

The server receives the whole request, waits, and only then handles it. The SignalR hub is never delayed.
