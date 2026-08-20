# Embedded PDF preview libraries — React 19 + Next.js 16 compatibility research

**Context:** Next.js 16.3.x + React 19.2.x + Tailwind v4 + shadcn/ui (base-nova, @base-ui/react) project needs an embedded PDF *preview/viewer* component.
**Method:** Primary sources only — npm registry JSON (`registry.npmjs.org`), GitHub source/raw files, official docs (react-pdf.org content lives in the repo READMEs), official example repos, shadcn registry JSON endpoints. All version numbers below are quoted exactly from the sources fetched on the day of writing (react-pdf 10.4.1, @react-pdf-viewer/core 3.12.0, pdfjs-dist 6.2.108, @react-pdf/renderer 4.6.1, next 16.3.1, react 19.2.8).

---

## 0. Quick verdict table

| Library | Latest | React 19 | Next 16 App Router | License | Verdict |
|---|---|---|---|---|---|
| **react-pdf** (wojtekmaj) | 10.4.1 | ✅ peer `^19.0.0`, official Next 16 sample | ✅ official sample runs Next 16.2.11 + React 19.2.0 | MIT | **Recommended** — actively maintained, official App Router sample |
| **@react-pdf-viewer/core** (react-pdf-viewer) | 3.12.0 (npm, Mar 2023) | ⚠️ peer `>=16.8.0` allows it, but unproven; v4 (RSC/React-ready) unreleased | ❌ no evidence; site down; npm silent since 2023 | **Commercial license required** | Avoid unless you pay + accept staleness |
| **pdfjs-dist** direct | 6.2.108 | ✅ framework-agnostic | ✅ but you build everything yourself | Apache-2.0 | Viable "raw" option; pair with react-pdf 10's pinned 5.4.296 instead |
| **`<embed>` / `<iframe>`** | n/a | ✅ trivial | ✅ trivial | n/a | Works, but zero control + iOS Safari first-page-only bug |
| **@react-pdf/renderer** | 4.6.1 | ✅ peer `^19.0.0` (open console-error issue) | n/a | MIT | **Creating** PDFs, not viewing — out of scope |

---

## 1. react-pdf (`react-pdf`, wojtekmaj/react-pdf) — RECOMMENDED

- **Latest version:** `10.4.1` ([npm registry JSON](https://registry.npmjs.org/react-pdf/latest), released 2026-02-25 per [GitHub releases](https://github.com/wojtekmaj/react-pdf/releases/tag/v10.4.1))
- **License:** MIT ([npm](https://www.npmjs.com/package/react-pdf), README "The MIT License.")
- **pdfjs-dist pairing:** pinned as a **dependency**, not a peer: `"pdfjs-dist": "5.4.296"` (exact pin — do not install pdfjs-dist 6.x alongside react-pdf).
- **peerDependencies (exact, from npm registry JSON):**
  ```json
  "peerDependencies": {
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
    "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
    "@types/react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": { "@types/react": { "optional": true } }
  ```
- **React 19 status: OK.** Peer range includes `^19.0.0`; the package's own devDependencies are `react`/`react-dom`/`@types/react` `^19.2.0`; README: *"To use the latest version of React-PDF, your project needs to use React 16.8 or later."* — and crucially the **official Next.js App Router sample pins `react ^19.2.0` + `next ^16.2.11` + `react-pdf: latest`** (see below), i.e. React 19 + Next 16 is the combination the maintainer tests.
- **Documented Next.js setup pattern (official README, which is what react-pdf.org renders — "Next.js" section):**
  > "If you use Next.js prior to v15 (v15.0.0-canary.53, specifically), you may need to add the following to your `next.config.js`:
  > ```diff
  > module.exports = {
  > + swcMinify: false,
  > }
  > ```
  → **Next.js 15+/16 requires no `next.config` change.**
- **Worker setup — official docs, "Configure PDF.js worker" → "Import worker (recommended)":**
  > ```ts
  > import { pdfjs } from 'react-pdf';
  > pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  >   'pdfjs-dist/build/pdf.worker.min.mjs',
  >   import.meta.url,
  > ).toString();
  > ```
  > "The `workerSrc` must be set in the **same module** where you use React-PDF components (e.g., `<Document>`, `<Page>`)… Always configure the worker in the file where you render the PDF components."
  > "In Next.js, make sure to skip SSR when importing the module you're using this code in." ([Pages Router](https://nextjs.org/docs/pages/guides/lazy-loading#with-no-ssr) / [App Router](https://nextjs.org/docs/app/guides/lazy-loading#skipping-ssr))
  > pnpm note: hoist `pdfjs-dist` via `.npmrc` `public-hoist-pattern[]=pdfjs-dist` (pnpm <11) or `pnpm-workspace.yaml` `publicHoistPattern: [pdfjs-dist]` (pnpm 11+).
  - Alternative official patterns: [copy worker to public dir](https://github.com/wojtekmaj/react-pdf/blob/main/packages/react-pdf/README.md) (script copies `pdf.worker.mjs`), external CDN (`//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`), and legacy worker (`pdfjs-dist/legacy/build/pdf.worker.min.mjs` — "reported to support iOS 16.4 and newer").
  - Optional assets you must copy & wire up for full support (Vite/Webpack/other snippets in README): **cMaps** (`cMapUrl: '/cmaps/'`), **wasm** (`wasmUrl: '/wasm/'` — JPEG 2000), **standard fonts** (`standardFontDataUrl: '/standard_fonts/'`).
- **Official example repo — there is no `examples/` dir on `main`** (verified via [GitHub API](https://api.github.com/repos/wojtekmaj/react-pdf/contents/)); official samples live in the monorepo under [`sample/`](https://github.com/wojtekmaj/react-pdf/tree/main/sample): `next-app` (App Router), `next-pages` (Pages Router), `vite`, `webpack5`, `parcel2`.
  - [`sample/next-app/app/page.tsx`](https://github.com/wojtekmaj/react-pdf/blob/main/sample/next-app/app/page.tsx) — the canonical App Router pattern:
    ```tsx
    'use client';
    import dynamic from 'next/dynamic';
    const Sample = dynamic(() => import('./Sample'), { ssr: false });
    export default function Page() { return <Sample />; }
    ```
  - [`sample/next-app/app/Sample.tsx`](https://github.com/wojtekmaj/react-pdf/blob/main/sample/next-app/app/Sample.tsx) — `'use client'`; module-level `pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();`; imports `react-pdf/dist/Page/AnnotationLayer.css` + `react-pdf/dist/Page/TextLayer.css`; `<Document options={options}>` with `{ cMapUrl: '/cmaps/', standardFontDataUrl: '/standard_fonts/', wasmUrl: '/wasm/' }`.
  - [`sample/next-app/package.json`](https://github.com/wojtekmaj/react-pdf/blob/main/sample/next-app/package.json): `"next": "^16.2.11"`, `"react": "^19.2.0"`, `"react-dom": "^19.2.0"`, `"react-pdf": "latest"`; `next.config.ts` is empty `{}` (no App Router config needed). Renovate bumps confirm Next 16.x is actively CI-tested against this sample ([#2124](https://github.com/wojtekmaj/react-pdf/pull/2124), [#2102](https://github.com/wojtekmaj/react-pdf/pull/2102)).
  - [`sample/next-pages/next.config.ts`](https://github.com/wojtekmaj/react-pdf/blob/main/sample/next-pages/next.config.ts) (Pages Router only): `experimental: { esmExternals: 'loose' }` — *"Prevents 'ESM packages (pdfjs-dist/build/pdf.worker.min.mjs) need to be imported.' error in Webpack builds"* (skipped when `TURBOPACK` env is set).
- **Known pitfalls in Next.js 16 App Router:**
  1. **Must skip SSR** for the module importing react-pdf (`next/dynamic` with `ssr: false`) — pdf.js touches browser-only globals.
  2. **"Setting up fake worker" / "Setting up fake worker failed"** — pdf.js falls back to a main-thread fake worker when the worker can't initialize (missing/wrong `workerSrc`, CSP, network). Source, [pdf.js `src/display/api.js`](https://github.com/mozilla/pdf.js/blob/master/src/display/api.js): `warn("Setting up fake worker.")` and `new Error('Setting up fake worker failed: "<reason>".')`. Fix = set `GlobalWorkerOptions.workerSrc` in the same module that renders the components (official warning above). Community report of the Next.js case: [discussion #1688](https://github.com/wojtekmaj/react-pdf/discussions/1688).
  3. **`DOMMatrix is not defined`** — surfaced in react-pdf 10.x under Next.js Webpack builds ([#1999](https://github.com/wojtekmaj/react-pdf/issues/1999), closed). Maintainer-confirmed fix: *"wrap those imports in `next/dynamic` with `ssr: false`"*. Note an open follow-up for the Pages sample on Next 15.5.6 ([#2039](https://github.com/wojtekmaj/react-pdf/issues/2039)); the App Router sample with Turbopack + `ssr:false` is the tested path.
  4. **`Can't resolve 'pdfjs-dist/build/pdf.worker.min.mjs'`** in App Router — user-side worker misconfiguration ([#1855](https://github.com/wojtekmaj/react-pdf/issues/1855), closed); App Router does not need the `esmExternals` workaround.
  5. v10 is **ESM-only** (CJS dropped) — fine for Next 16/Turbopack, but watch Jest/unit-test setups.
- **Verdict:** ✅ **Use this.** MIT, actively maintained (releases 10.4.0/10.4.1 in Feb 2026), official sample runs the exact target stack (Next 16.2.11 + React 19.2.0 + App Router + `dynamic(..., { ssr: false })`), and it's the natural basis for a custom shadcn-styled preview component. Main cost: you assemble your own toolbar/UI around `<Document>`/`<Page>`.

---

## 2. @react-pdf-viewer/core (react-pdf-viewer/react-pdf-viewer) — feature-rich but commercial + stale

- **Latest version (npm):** `3.12.0` for the whole scope ([@react-pdf-viewer/core](https://registry.npmjs.org/@react-pdf-viewer/core/latest), [@react-pdf-viewer/default-layout](https://registry.npmjs.org/@react-pdf-viewer/default-layout/latest), …). Published **2023-03-21** — no npm release since ([registry `time` field](https://registry.npmjs.org/@react-pdf-viewer/core)). GitHub `master` carries a **v4.0.0 changelog marked `[WIP]`** ([changelogs/v4.0.0.md](https://github.com/react-pdf-viewer/react-pdf-viewer/blob/master/changelogs/v4.0.0.md)) that is **not published to npm**.
- **peerDependencies (exact, from npm registry JSON):**
  ```json
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0",
    "pdfjs-dist": "^2.16.105 || ^3.0.279"
  }
  ```
  ⚠️ **pdfjs-dist is capped at `^3.0.279`** (3.x, 2023-era). This conflicts hard with react-pdf 10's pinned `pdfjs-dist@5.4.296` and with pdfjs-dist 6.x — installing both libs in one project produces `ERESOLVE`/unsatisfied-peer warnings.
- **React 19 status: unproven.** `>=16.8.0` technically admits React 19, but there is no React 19 testing evidence for v3. The **v4.0.0 WIP changelog** is the React-19/RSC path: *"pdf-js v4 and later versions are now supported. However, the legacy build of pdf-js is no longer supported."* and *"Compatible with React Server Components"* — with a breaking change (`<Worker>` → `<Provider pdfApiProvider={...} workerUrl="...">`). Until 4.x ships to npm, React 19 support is a promise, not a fact.
- **License: commercial.** Repo [LICENSE.md](https://github.com/react-pdf-viewer/react-pdf-viewer/blob/master/LICENSE.md): *"# License — You have to purchase a Commercial License at the official website (https://react-pdf-viewer.dev)."* npm `license` field is the URL `https://react-pdf-viewer.dev/license`. HN thread (2022) reported a **$49 "one user license"** tier and the author himself discussed terms ([HN item 32547649](https://news.ycombinator.com/item?id=32547649), [32548001](https://news.ycombinator.com/item?id=32548001)). Current pricing could not be verified — **react-pdf-viewer.dev does not resolve from this environment** (DNS), matching the project's maintenance freeze. Community sentiment: open issue [#1858 "Don't use this package…"](https://github.com/react-pdf-viewer/react-pdf-viewer/issues/1858) (unmaintained/vulnerability complaints; a fork `@murasoftware/react-pdf-viewer-open@4.0.0` exists but still carries the commercial license URL).
- **Plugin architecture (official root README):** `Viewer` core + plugins — `defaultLayoutPlugin` (full layout: toolbar + sidebar), `toolbar`, `zoom`, `page-navigation`, `search`, `bookmark`, `thumbnail`, `full-screen`, etc. Official usage:
  ```js
  import { Viewer } from '@react-pdf-viewer/core';
  import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
  // Import styles (required)
  import '@react-pdf-viewer/core/lib/styles/index.css';
  import '@react-pdf-viewer/default-layout/lib/styles/index.css';
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  <Viewer fileUrl='/assets/sample.pdf' plugins={[defaultLayoutPluginInstance]} />
  ```
- **CSS requirement:** yes — you must import their `lib/styles/index.css` per package (see above); theming via CSS vars.
- **SSR/Next.js:** README feature list claims *"Support SSR"*; v3 requires wrapping in `next/dynamic(..., { ssr: false })` like any pdf.js consumer; v4 WIP adds RSC compatibility. Official [examples repo](https://github.com/react-pdf-viewer/examples) pins `@react-pdf-viewer` 3.11.0 + `pdfjs-dist` 3.2.146 (old stack).
- **Verdict:** ⚠️ **Not recommended for this project.** Commercial license required, npm-frozen since March 2023, peer-capped at pdfjs-dist 3.x (clashes with react-pdf 10 / pdfjs-dist 6), React 19 support only exists in an unreleased WIP v4. Paying for a dormant viewer on a new Next 16 + React 19 stack is a poor trade.

---

## 3. pdfjs-dist direct (mozilla/pdf.js) — the engine, if you want zero UI deps

- **Latest version:** `6.2.108` ([npm registry JSON](https://registry.npmjs.org/pdfjs-dist/latest)); **Apache-2.0**; `engines: { "node": ">=22.13.0 || >=24" }`; ESM (`main: build/pdf.mjs`).
- **React 19 relevance:** none — it is a framework-agnostic JS library (`pdfjs-dist` README: *"PDF.js is a Portable Document Format (PDF) library that is built with HTML5"*). Any React version works; you write the React wrapper.
- **Standard canvas-embedding pattern (official example, [examples/webpack/main.mjs](https://github.com/mozilla/pdf.js/blob/master/examples/webpack/main.mjs)):**
  ```js
  import * as pdfjsLib from "pdfjs-dist";
  // Setting worker path to worker bundle.
  pdfjsLib.GlobalWorkerOptions.workerSrc = "../../build/webpack/pdf.worker.bundle.js";
  const loadingTask = pdfjsLib.getDocument(pdfPath);
  const pdfDocument = await loadingTask.promise;
  const pdfPage = await pdfDocument.getPage(1);
  const viewport = pdfPage.getViewport({ scale: 1.0 });
  const canvas = document.getElementById("theCanvas");
  canvas.width = viewport.width; canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  const renderTask = pdfPage.render({ canvasContext: ctx, viewport });
  await renderTask.promise;
  ```
- **Worker setup with Vite/Next.js:** same `GlobalWorkerOptions.workerSrc` mechanism, bundler-friendly form `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()` (this is exactly the pattern the react-pdf README recommends). If `workerSrc` is missing or the worker fails, pdf.js warns *"Setting up fake worker."* and runs on the main thread ([src/display/api.js](https://github.com/mozilla/pdf.js/blob/master/src/display/api.js)); it throws `Setting up fake worker failed: "<reason>"` when even the fake worker can't be set up.
- **Version pairing:** react-pdf 10.4.1 pins `pdfjs-dist@5.4.296`; react-pdf-viewer 3.12.0 caps at `^2.16.105 || ^3.0.279`; **standalone 6.2.108 is compatible with neither library's declared range** (its peer-less install alongside react-pdf will be deduped/nested against the pin).
- **Pitfalls on Next 16:** same SSR boundary (`ssr: false` dynamic import), same fake-worker/CSP concerns; you must also implement your own loading, paging, zoom, toolbar, error states, text layer, and canvas sizing (ResizeObserver) — that's a real component project, not a one-liner.
- **Verdict:** ✅ **Viable raw engine.** Best used *through* react-pdf (which pins a compatible pdfjs-dist), or standalone if you want a fully bespoke component and are willing to build the viewer UI yourself. Apache-2.0, no licensing risk.

---

## 4. No-library option: `<embed>` / `<iframe>`

- **What works:** Chrome ships a built-in PDF viewer (plus the [official PDF viewer extension](https://chromewebstore.google.com/detail/pdf-viewer/oemmndcbldboiebfnladdacbdfmadadm)); Firefox has PDF.js built in since Firefox 19 ([pdf.js README](https://github.com/mozilla/pdf.js)); Safari desktop renders PDFs natively. `<embed src="x.pdf" type="application/pdf">` and `<iframe src="x.pdf">` display these native viewers.
- **Known downsides:**
  - **iOS Safari: only the first page** of the PDF renders in an iframe/embed ("pdf in iframe only first page on iphone/ipad view" — [Stack Overflow 75511392](https://stackoverflow.com/questions/75511392/pdf-in-iframe-only-first-page-on-iphone-ipad-view)); consistent with pdf.js's own caveat that only *legacy-worker* rendering is usable on iOS 16.4+ ([react-pdf README](https://github.com/wojtekmaj/react-pdf/blob/main/packages/react-pdf/README.md)).
  - No control over the viewer UI (toolbar, zoom, theming) — impossible to style to shadcn/base-nova.
  - Embedding can be blocked server-side via `X-Frame-Options`/`Content-Disposition: attachment`; cross-origin PDFs rely on the remote host's headers (no CORS needed for plain display, but the remote can refuse inline display).
- **Next.js handling:** for PDFs in `public/`, nothing special is needed — Next serves static files with MIME by extension. For route-served or protected PDFs, set response headers (e.g. `Content-Type: application/pdf`, permissive `X-Frame-Options`) via [`next.config.ts` `headers()`](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers). CSP: `frame-src`/`child-src` must permit the PDF origin for iframes; `'unsafe-inline'` is not specifically required for PDF display (it only matters for scripts/styles — and pdf.js-based viewers additionally need `worker-src` for the worker).
- **Verdict:** ✅ **Fine for "link-like" fallback or quick prototype; not a real preview component.** Use it as the mobile fallback behind a react-pdf primary viewer if you want zero JS cost.

---

## 5. @react-pdf/renderer — CREATES PDFs, not a viewer

- **Latest version:** `4.6.1` ([npm registry JSON](https://registry.npmjs.org/@react-pdf/renderer/latest)); **MIT**.
- **Official description (npm + repo):** *"Create PDF files on the browser and server"* — it is the **diegomura/react-pdf** project (⚠️ different from wojtekmaj/react-pdf above) and renders React components into **generated PDF documents** (`<Document><Page>…` + `<PDFViewer>`/`<BlobProvider>`). It does **not** display existing PDF files. Confirmed by its own docs/homepage: [github.com/diegomura/react-pdf](https://github.com/diegomura/react-pdf).
- **peerDependencies (exact):** `{ "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0" }` — React 19 allowed, but there is an **open** issue "[Compatibility with React 19 – TypeError: Cannot read properties of null (reading 'props') and Reconciler Incompatibility](https://github.com/diegomura/react-pdf/issues/3223)" (created 2025-10-06; users report console errors on React 19.x even at renderer 4.3.2+).
- **Verdict:** ❌ **Out of scope for a PDF *preview* component** — use it only if you also need to *generate* PDFs. For viewing, see candidates 1–4.

---

## 6. shadcn/ui registry check — no pdf component exists

Verified against the registry JSON endpoints the shadcn CLI itself uses (`REGISTRY_URL = https://ui.shadcn.com/r` from [packages/shadcn/src/registry/constants.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/constants.ts)):

- Official item index **`https://ui.shadcn.com/r/index.json`**: **0 matches for "pdf"** — no official `pdf-viewer` / `pdf-preview` registry item.
- Registries index **`https://ui.shadcn.com/r/registries.json`** (the CLI's search surface over the community registry catalog — hundreds of namespaces such as `@aceternity`, `@magicui`, `@1st-pouf`, `@agents-ui`, …): **0 matches for "pdf"**.
- Spot-checked community registry [magicuidesign/magicui `registry.json`](https://cdn.jsdelivr.net/gh/magicuidesign/magicui@main/registry.json): 0 matches for "pdf".
- Official docs only describe *running your own* registry ([registry docs index.mdx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/registry/index.mdx)).

**Conclusion:** neither the official shadcn/ui registry nor any registry indexed by the shadcn CLI ships a PDF viewer/preview component. The idiomatic approach for a base-nova/shadcn project is a **custom registry item / local component that wraps react-pdf** (a `'use client'` component + `dynamic(..., { ssr: false })` per the official sample), styled with Tailwind v4 + shadcn primitives.

---

## Sources

- react-pdf: [npm registry JSON](https://registry.npmjs.org/react-pdf/latest) · [package page](https://www.npmjs.com/package/react-pdf) · [GitHub repo](https://github.com/wojtekmaj/react-pdf) · [official README (docs incl. Next.js section)](https://github.com/wojtekmaj/react-pdf/blob/main/packages/react-pdf/README.md) · [react-pdf.org](https://react-pdf.org/) · [App Router sample `sample/next-app`](https://github.com/wojtekmaj/react-pdf/tree/main/sample/next-app) · [Pages sample `sample/next-pages`](https://github.com/wojtekmaj/react-pdf/tree/main/sample/next-pages) · [v10.0.0 release notes](https://github.com/wojtekmaj/react-pdf/releases/tag/v10.0.0) · issues [#1999](https://github.com/wojtekmaj/react-pdf/issues/1999), [#2039](https://github.com/wojtekmaj/react-pdf/issues/2039), [#1855](https://github.com/wojtekmaj/react-pdf/issues/1855) · [discussion #1688](https://github.com/wojtekmaj/react-pdf/discussions/1688)
- react-pdf-viewer: [npm @react-pdf-viewer/core](https://registry.npmjs.org/@react-pdf-viewer/core/latest) · [GitHub repo](https://github.com/react-pdf-viewer/react-pdf-viewer) · [LICENSE.md](https://github.com/react-pdf-viewer/react-pdf-viewer/blob/master/LICENSE.md) · [v4.0.0 WIP changelog](https://github.com/react-pdf-viewer/react-pdf-viewer/blob/master/changelogs/v4.0.0.md) · [examples repo (pins 3.11.0/pdfjs 3.2.146)](https://github.com/react-pdf-viewer/examples) · [issue #1858](https://github.com/react-pdf-viewer/react-pdf-viewer/issues/1858) · [HN thread](https://news.ycombinator.com/item?id=32547649)
- pdfjs-dist: [npm registry JSON](https://registry.npmjs.org/pdfjs-dist/latest) · [GitHub mozilla/pdf.js](https://github.com/mozilla/pdf.js) · [webpack example `main.mjs`](https://github.com/mozilla/pdf.js/blob/master/examples/webpack/main.mjs) · [worker fake-worker code](https://github.com/mozilla/pdf.js/blob/master/src/display/api.js) · [wiki FAQ](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions)
- No-library option: [MDN `<embed>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed) · [SO 75511392 (iOS iframe first page)](https://stackoverflow.com/questions/75511392/pdf-in-iframe-only-first-page-on-iphone-ipad-view) · [Next.js headers docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- @react-pdf/renderer: [npm registry JSON](https://registry.npmjs.org/@react-pdf/renderer/latest) · [GitHub diegomura/react-pdf](https://github.com/diegomura/react-pdf) · [issue #3223](https://github.com/diegomura/react-pdf/issues/3223)
- shadcn registry: [registry index JSON](https://ui.shadcn.com/r/index.json) · [registries index JSON](https://ui.shadcn.com/r/registries.json) · [CLI constants (REGISTRY_URL)](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/constants.ts) · [registry docs](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/registry/index.mdx)
- Stack versions verified: [next latest 16.3.1](https://registry.npmjs.org/next/latest) · [react latest 19.2.8](https://registry.npmjs.org/react/latest)
