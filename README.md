# North Path

An independent student prototype for looking through public Miami Dade College program information. It is not an official college service, and it does not decide admission, transfer, or what to enroll in.

The landing page has three paths:

- **Describe** — type or speak a goal and see programs whose names match those words.
- **Discover** — answer a few questions and see programs that follow those answers.
- **Directory** — browse the indexed programs.

Plans come from the ingested catalog. Weekly hours and budget change the plan. The earlier cybersecurity example remains at `/pilot`. It is not the front door. The app does not sign anyone in.

Photographs and the college logotype are credited in [docs/ASSETS.md](docs/ASSETS.md). Showing the logotype is not an endorsement.

## Prerequisites

- Node.js 20.9 or newer (Node 22 was used to build this copy)
- npm 10 or newer, so `npm ci` can use `package-lock.json`
- A normal browser

No API key, database, account, or `.env` file is required.

## Run it

From the project directory:

```bash
npm ci
npm run dev
```

`npm run dev` starts Next.js without Turbopack, on `127.0.0.1` port 3847. Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

On WSL, use that address from Windows only if the port is forwarded. If it does not load, open it from the WSL browser, or from Windows at the address `hostname -I` shows, on port 3847.

Checks and a production build:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Catalog fields and coverage notes are in [data/DATA_DICTIONARY.md](data/DATA_DICTIONARY.md). API version 1 is under `/api/v1`; see [docs/API.md](docs/API.md). Third-party component licenses are in [THIRD_PARTY/README.md](THIRD_PARTY/README.md).
