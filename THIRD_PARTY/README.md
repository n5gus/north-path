# Third-party code

North Path is an independent student prototype. The pathway text, career logic, visual system, and page structure were written for this project. Two interface components were adapted from external open-source libraries. Nothing in this repository is an official Miami Dade College product.

Checked November 7, 2026.

## Used in the running app

### React Bits Stepper

- Author: David Haz
- Page: https://reactbits.dev/components/stepper
- Source copied from: https://github.com/DavidHDev/react-bits/blob/main/src/ts-tailwind/Components/Stepper/Stepper.tsx
- License: MIT plus Commons Clause, not plain MIT. Full text: [react-bits-LICENSE.md](./react-bits-LICENSE.md)
- Where it lives: `src/components/ui/stepper.tsx`
- What it does here: the career and starting-point flow (Back, Continue, step buttons, reduced motion)
- Local changes: Hugeicons were replaced with inline SVG, and the light-theme muted color was darkened for contrast. Spring timing, keyboard focus rings, and reduced-motion behavior remain from the upstream component.
- Restriction that matters: the component may ship inside this application. It is not offered as a standalone library, template pack, or hosted component service.

### Magic UI Bento Grid

- Copyright: Magic UI
- Page: https://magicui.design/docs/components/bento-grid
- Source adapted from: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/bento-grid.tsx
- License: MIT. Full text: [magicui-LICENSE.md](./magicui-LICENSE.md)
- Where it lives: `src/components/ui/bento-grid.tsx`
- What it does here: the Education, Skills, Projects, and Next Action summary
- Local changes: the hover-only link was removed so the action stays visible without a pointer. Demo animations, Radix icons, and the docs-page sample content (files, calendar, cryptocurrency imagery) were not copied. Row height is automatic so the grid can sit in a sidebar.

## Reviewed and not copied

These links were on the public post https://x.com/thenowhereway/status/2116406644636864577 and were reviewed before the build. They are not dependencies.

| Resource | Why it is not in the app |
| --- | --- |
| https://21st.dev | Community registry. No component was copied. Author licenses are per component, and preview media is restricted. |
| https://uiverse.io | No specific control was selected. Galaxy is MIT, but individual posts differ, so nothing was vendored. |
| https://mobbin.com | Screenshot library used only as a reminder not to copy shipped-product screens. No screenshots, logos, or assets were embedded. Terms were not available (HTTP 403 on the terms page when checked). |

## College content

Program names, course identifiers, credit totals, and admission rules in `src/lib/roadmap.ts` are summarized from public Miami Dade College pages and PDFs. Those pages are cited on each roadmap step. They are not third-party code. MDC retains whatever rights apply to its publications. This project does not copy the college seal, sign-in screens, or site design.
