# North Path API version 1

Base path: `/api/v1`. Responses include `apiVersion: "1"`. This is not a degree audit, a registration system, or a promise that a section is offered.

## `GET /api/v1/programs`

Query: `q`, `award`, `coverage`, `limit` (1–100), `offset`.

```bash
curl 'http://127.0.0.1:3847/api/v1/programs?q=nursing&award=AS&limit=5'
```

## `GET /api/v1/programs/:id`

`:id` is a plan code such as `25079`, an AA pathway id such as `AA-10100`, or `CE-PUBLIC-SEARCH`.

## `GET /api/v1/continuing-education`

Query: `q`, `limit` (1–100), `offset`. Returns the November 8, 2026 noncredit snapshot. Section fees are not college-credit tuition.

## `GET /api/v1/coverage`

Counts from the last ingestion: inventory rows, award types, coverage labels, sheet fetch results, AA pathway count. These counts are parse coverage. They do not mean the catalog is fully verified.

## `POST /api/v1/plans`

```json
{
  "programId": "66061",
  "constraints": {
    "residency": "resident",
    "modality": "in-person",
    "weeklyHours": 12,
    "budgetPerTerm": null,
    "budgetTotal": null,
    "completedCourseIds": ["CTS 1134"],
    "termLengthWeeks": 16,
    "hoursPerCreditPerWeek": 3
  }
}
```

`completedCourseIds` are self-reported. They change ordering only. They do not award credit.

## `POST /api/v1/plans/compare`

Same constraints shape under `left` and `right`, plus `programId`. `why` explains which input changed the plan.

Invalid residency, negative hours, or more than 80 course ids returns 400. Unknown program ids return 404.
