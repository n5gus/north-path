# North Path

An independent student project for exploring Miami Dade College offerings. The landing page has three equal paths: **Describe** (type or speak a goal), **Discover** (a short set of questions), and **Directory** (a map and list of every indexed program). Plans come from the ingested catalog and the deterministic planner, and they change with weekly hours and budget. The earlier cybersecurity example remains at `/pilot`. It is not the front door.

This is not an official Miami Dade College service. The College logotype is shown from the official marketing download and is not an endorsement. Photographs are stock files from Wikimedia Commons and are not MDC people or campuses. See [docs/ASSETS.md](docs/ASSETS.md). The app does not sign anyone in, read a transcript, or decide admission.

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

`npm run dev` starts Next.js without Turbopack, on `127.0.0.1` port 3847. Open [http://127.0.0.1:3847](http://127.0.0.1:3847). The catalog planner is at [http://127.0.0.1:3847/catalog](http://127.0.0.1:3847/catalog). API version 1 is under `/api/v1`. See `docs/API.md`.

On WSL, use that address from Windows only if the port is forwarded. If the page does not load in a Windows browser, open it from the WSL shell's browser, or from Windows at the address `hostname -I` shows, on port 3847.

Other checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Manual test checklist

Do these in a desktop window, then again with a narrow window (about 390 pixels wide).

1. The landing page shows three equal paths named Describe, Discover, and Directory. The header has the Miami Dade College logotype beside a line that this is an independent student project, not an official college service. There is no sign-in.
2. Describe: type Nursing, find programs, open one, and build a plan. A second column appears when weekly hours are 8 or more. Speech starts only from Start speaking. If the browser denies the microphone, the page says so and the text box remains.
3. Discover: choose Health Professions, an associate award, and see programs with reasons. The first result is not forced to cybersecurity.
4. Directory: search, open a CIP group, and open a program. The detail shows coverage, edition, and shared-course links labeled as not transfer. Continuing education says course rows are unavailable. The searchable list has the same records.
5. `/pilot` is the earlier cybersecurity example. On that page: Cybersecurity can be selected. Networking, software, data and artificial intelligence, and business are visible and marked **Not yet available**. Continue stays unavailable until Cybersecurity is selected.
6. On `/pilot`, continue. Choose "I am admitted, and I do not have an associate degree yet" and "Bachelor of Science in Cybersecurity". Check CTS 1134. Choose **Show my path**.
7. The headline mentions the bachelor's degree and admission before an associate degree. The next action still lists CTS 1120, CTS 1111, and a scripting course, and it does not tell you to enroll in CTS 1134 again. CTS 1134 appears as a step that asks an advisor to confirm it.
8. Open **Source and why this step is here** on one education step. The link is an `mdc.edu` page or PDF, and the checked date is November 7, 2026.
9. Mark that next action done. Refresh the page. The same plan and the check are still there.
10. Choose **Edit answers**, switch the credential to the Cybersecurity Analyst certificate, and show the path again. Plan 66061 is there. CIS 3215 is not. CTS 1134 is still a confirmation rather than a new enrollment.
11. Choose **Load fictional example**. The screen names Alex R. and says that person is not real and this is not a student record.
12. **Download text** saves a `.txt` file that includes source URLs. **Print** opens the browser print view. **Reset saved progress** asks you to confirm, then returns to the first step with the checks cleared.
13. With a keyboard, Tab to Cybersecurity, press Space, Tab to Continue, and press Enter. Focus rings stay visible. Buttons and summaries work without a mouse.

## What the first version does

The steps below describe `/pilot`, the earlier cybersecurity example. The landing page is the three catalog paths.

1. Choose a career. Cybersecurity is the only researched path on that example. Networking, software, data/AI, and business stay on screen and are labeled **Not yet available**, with a link to the MDC program inventory.
2. Say whether you are not yet admitted, admitted without an associate degree, or finished with an associate degree. Pick the Cybersecurity Analyst certificate (plan 66061), the Associate in Science (plan 25079), or the Bachelor of Science (plan S9515).
3. Optionally check courses you believe you already finished, and whether you already work in technology. Those answers change the steps. They are not a transcript evaluation.
4. Read an expandable pathway. Mark steps done. The count stays in this browser. Reset clears it. Print and download a text copy with the source links.

A **Load fictional example** button fills the form with Alex R. The screen says that person is not real and that the form is not a student record.

Changing the credential or the starting point changes which plans, courses, projects, and next action appear. Reporting CTS 1134 turns that course from “enroll” into “ask an advisor to confirm it.” Reporting “a scripting course” does **not** clear CIS 1531 off the associate or the certificate, because those plans name CIS 1531 specifically, while the bachelor’s rule also accepts COP 1047C or COP 1334.

## 90-second demo

1. Open the app. Point at the line that says this is not an official MDC service.
2. Select **Cybersecurity**. Leave the other careers disabled and mention the inventory link.
3. Continue. Choose **I am admitted, and I do not have an associate degree yet** and **Bachelor of Science in Cybersecurity**. Check **CTS 1134**. Choose **Show my path**.
4. Read the next action. Expand the associate stage and show that CTS 1134 is an advisor confirmation, not a new enrollment.
5. Open one source link. It should be an `mdc.edu` page or PDF, with the checked date November 7, 2026.
6. Go back, switch the credential to the **certificate**, and show that the six-course plan 66061 replaces the bachelor’s upper-division list.
7. Mark one step done, refresh, and show the check still there. Reset if you want a clean screen for the next person.

## Data provenance and limits

Curriculum text was checked on **November 7, 2026** against public MDC pages and PDFs. Each roadmap step lists the exact links it relies on. The important ones:

- [AS in Cybersecurity](https://www.mdc.edu/cybersecurityas/)
- [AS program sheet 25079, effective Spring 2025](https://www.mdc.edu/academics/programs/ps/25079.pdf)
- [AS full-time sequence guide, effective Spring 2025](https://www.mdc.edu/academics/programs/csg/AS_Cybersecurity_csg.pdf)
- [Cybersecurity Analyst certificate](https://www.mdc.edu/cybersecurity-analyst/)
- [Certificate program sheet 66061, effective Fall 2023](https://www.mdc.edu/academics/programs/ps/66061.pdf)
- [Certificate sequence guide, effective Fall 2023](https://www.mdc.edu/academics/programs/csg/CCC_CybersecurityAnalyst_csg.pdf)
- [BS in Cybersecurity](https://www.mdc.edu/cybersecuritybs/)
- [BS admission requirements](https://www.mdc.edu/cybersecuritybs/admission-requirements.aspx)
- [BS courses page](https://www.mdc.edu/cybersecuritybs/courses.aspx)
- [BS program sheet S9515, effective Spring 2025](https://www.mdc.edu/academics/programs/ps/S9515.pdf)
- [Explore North Campus](https://www.mdc.edu/exploreNorth/)
- [Admissions](https://www3.mdc.edu/admissions-info/)
- [Procedure 4000](https://www.mdc.edu/procedures/chapter4/4000.pdf)
- [Placement criteria](https://www.mdc.edu/aet/placement-criteria/degree-and-college-credit-certificate-programs/)
- [Academic program inventory](https://www.mdc.edu/academics/documents/academic-programs-cip.pdf)
- [Catalog page, which presents a 2026–2028 catalog](https://www.mdc.edu/catalog/)

Documented college steps and recommended extras are labeled differently. Where two official documents disagree, the step says so and tells the student to ask an advisor. Examples that are printed in the app, not smoothed over:

- The certificate sequence table and its footnote disagree about whether CTS 1134 comes before CTS 1120.
- The AS sequence guide prints CompTIA Linux+ beside CGS 1700. The certificate guide prints it beside CTS 1111.
- The BS courses page and the Spring 2025 program sheet do not list the same upper-division set. CNT 3409C is on the sheet. The North Campus explore page lists CIS 4359 Ethical Hacking II; the program sheet lists CIS 4378.
- The catalog landing page presents a 2026–2028 catalog. The sheets used here print earlier effective terms. A degree audit wins if they conflict.
- Tuition, time, and some credit cells on the public program web pages were empty in the text checked. Credit totals in the app come from the program sheets (60, 24, and 120). The only dollar figure repeated is the $30 application fee on the admissions page. Procedure 4000 is linked for other fees and waivers and those other amounts are not copied here.
- Salary and workforce-shortage figures that appear on some MDC pages are omitted on purpose.
- Certificates of Professional Preparation in Cyber Defense (inventory plan PBC04) and Vulnerability Assessment (PBC07) are described only. Their course lists were not verified, so none are invented.
- This app does not promise transfer credit, a job, a section at North Campus, a personal timeline, or admission.

North Campus address used in the next-action text, 11380 NW 27th Avenue, Miami, FL 33167, is the address printed on MDC’s North Campus administration page. The Cybersecurity Center of the Americas address printed on the degree-programs page is Wolfson Campus, not North.

## Third-party code

The pathway logic and the page are original to this project. Two components are adapted and attributed:

- React Bits Stepper, MIT plus Commons Clause, by David Haz. Used for the career and starting-point flow.
- Magic UI Bento Grid, MIT. Used for the Education, Skills, Projects, and Next Action summary. The docs-page demo content was not copied.

Details, licenses, and the libraries that were reviewed and **not** copied (21st.dev, Uiverse, Mobbin) are in [THIRD_PARTY/README.md](THIRD_PARTY/README.md).

## Accessibility

The flow uses labeled radios, checkboxes, and buttons. Steps are real buttons. Focus is visible. Status is text, not color alone. `prefers-reduced-motion` shortens the stepper’s own motion and the app’s transitions. The layout is one column on a phone and a pathway plus summary on a wide screen.

## Catalog planner limits

`/catalog` and `/api/v1` read `data/catalog/catalog.json`. The September 16, 2025 inventory contributes 251 rows. Against commit `804b952`, sheet parsing now extracts course rows for 238 programs (was 233) and leaves 0 sheets unparsed (was 5). Nine sheets stay partial because the text has fewer than three course rows. Three plan codes still have no sheet (CPP01, PBC02, PBC03). The Associate in Arts region of the 2024–2026 catalog contributes 79 pathways (was 76, because right-column codes were dropped) and 0 of those titles are left unverified (was 31). Those pathways are narrative-only and are labeled previous edition, not 2026–2028. They do not include university course lists. Continuing education is one index record from the public search page, which returned no course rows. The 2026–2028 CurriQunet catalog page did not include program text in the HTML, so it is not the source of course rules. Fee totals keep the year printed on the page that supplied them. Section meeting times are unknown.

A November 8, 2026 evidence pass corrected two unit errors from the local program sheets: Commercial Class B Driving (`56016`) is 150 clock hours, and Fire Fighter Minimum Standards (`57004`) is 492 contact hours. The printed credit equivalents stay on the record and are not used as college-credit tuition. Florida Law Enforcement Academy (`57022`) still lists 25.66 vocational credits; a clock-hour total was not verified. Eight short sheets are marked complete-small, `65100` is an open choice group, and `65057` stays unresolved. Seventy-seven AA course-sequence guides are linked as candidate full-time sequences (74 Fall 2025, 3 Fall 2024). `AA-11211` and `AA-10803` have no guide. Those rows were not written into required courses. The Fall 2026 AA pathway guide’s 36 general-education plus 24 pathway-elective split is stored separately from the 2024–2026 catalog names. One hundred six FIU 2026–2027 transfer guides are destination pages, and only 11 exact name matches are candidate alignments, not transfer or admission. Continuing education is a separate snapshot of 1,097 noncredit courses and 1,778 sections. The 238 extracted sheet parses were not re-audited. There is still no 2026–2028 CurriQunet program text.

Gemini extraction is a separate server-side candidate step. It uses the Interactions API documented at `https://ai.google.dev/gemini-api/docs/text-generation` (`POST /v1beta/interactions`, header `x-goog-api-key`, `Api-Revision: 2026-05-20`). The default model is `gemini-3.8-flash`. `NORTH_PATH_GEMINI_MODEL` may be `gemini-3.8-flash` or `gemini-3.6-flash`, the ids listed on the models page checked November 7, 2026. `GEMINI_API_KEY` is read only on the server. This workspace has no key, so `POST /api/v1/enrichment` returns `blocked-no-key` and does not send a request. Tests inject a mock transport. A mock result is not a live API call. Accepted claims stay `evidence-checked` and are not written into the catalog. A model citation does not change coverage to verified. The route refuses student fields and reads only a bounded local source chunk.

## What is still open

- The stepper pilot is still the cybersecurity example. The catalog planner covers the ingested inventory, sheets, and 2024–2026 AA narratives, with the coverage counts above. That is not a verified 2026–2028 catalog.
- Section schedules, North Campus availability course by course, and the 2026–2028 catalog body were not fully extracted. Those steps say to verify.
- CPP course lists, master’s partnerships, exam vouchers, and tuition rates are not in the roadmap.
- There is no advisor login, no MyMDC connection, and no live catalog API.
- Saved progress is local to one browser. It is not a student record.
