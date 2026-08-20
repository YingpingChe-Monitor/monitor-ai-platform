# Image lightbox / gallery / zoom libraries — research notes

Date: ~Aug 2026. Context: choosing an image preview / lightbox / gallery / zoom component for a
Next.js 16.3.0 + React 19.2.8 + Tailwind v4 + shadcn/ui (base-nova style, `@base-ui/react` primitives) project.
All numbers pulled live from the npm registry, GitHub API/raw, unpkg tarballs, and official docs sites on 2026-08.
All peerDependencies quoted verbatim from the npm registry packument of the listed version.

## Hard data

| Package | Latest | Published | License | peerDependencies (exact) | React 19 | Built-in TS types |
|---|---|---|---|---|---|---|
| yet-another-react-lightbox | 3.32.2 | 2026-07-30 | MIT | `{"@types/react":"^16 \|\| ^17 \|\| ^18 \|\| ^19","@types/react-dom":"^16 \|\| ^17 \|\| ^18 \|\| ^19","react":"^16.8.0 \|\| ^17 \|\| ^18 \|\| ^19","react-dom":"^16.8.0 \|\| ^17 \|\| ^18 \|\| ^19"}` | ✅ explicit (^19) | yes (`dist/index.d.ts`) |
| lightgallery (incl. `lightgallery/react` wrapper) | 2.9.0 | 2025-10-01 | GPLv3 or commercial | none (no peerDependencies) | ✅ (no peer restriction) | yes (`index.d.ts` + `react/Lightgallery.d.ts`) |
| react-photo-view | 1.2.7 | 2025-01-05 | Apache-2.0 | `{"react":">=16.8.0","react-dom":">=16.8.0"}` | ✅ (range includes 19) | yes (`dist/index.d.ts`) |
| photoswipe | 5.4.4 | 2024-05-24 | MIT | none (framework-agnostic) | ✅ (no React peer) | yes (`dist/types/photoswipe.d.ts`) |
| react-image-lightbox | 5.1.4 | 2021-07-13 | MIT | `{"react":"16.x \|\| 17.x","react-dom":"16.x \|\| 17.x"}` | ❌ peer conflict (16/17 only) | no |
| @photoprint/react-image-lightbox | — | — | — | package does not exist on npm (404, verified twice) | — | — |

---

## 1. yet-another-react-lightbox — RECOMMENDED

- **Latest version:** `3.32.2`, published `2026-07-30T21:17:29.258Z` (registry packument, `dist-tags.latest`).
- **peerDependencies (verbatim):** `{"@types/react":"^16 || ^17 || ^18 || ^19","@types/react-dom":"^16 || ^17 || ^18 || ^19","react":"^16.8.0 || ^17 || ^18 || ^19","react-dom":"^16.8.0 || ^17 || ^18 || ^19"}`
- **React 19: OK — explicit.** The peer range includes `^19` and the README states "works with React 19, 18, 17, and 16.8.0+". No dependencies (zero runtime deps besides peers).
- **TypeScript:** built-in types (`"types": "dist/index.d.ts"`, ESM-only, `"module": "dist/index.js"`).
- **Next.js / SSR:** Client-only (uses React state + DOM). Official docs have a dedicated Next.js page
  ([/examples/nextjs](https://yet-another-react-lightbox.com/examples/nextjs)) recommending:
  *"you can extract the lightbox-related code and CSS stylesheets into a separate component and load it dynamically with the next/dynamic import"*, and `next/image` integration via a custom `render.slide` function. So: import inside a `"use client"` file and/or use `next/dynamic` (see Next.js 16 notes below — `ssr: false` still works for Client Components). CSS import required: `import "yet-another-react-lightbox/styles.css"`.
- **Features:** zoom (plugin), thumbnails track (plugin), captions/titles (plugin), video slides (plugin), counter, download button (plugin), fullscreen, inline (turns lightbox into a carousel), share, slideshow, responsive `srcset`/`sizes` generation, RTL, keyboard/touch navigation. No web worker in the shipped bundle (verified: 0 `Worker(` occurrences in `dist/index.js`).
- **License:** MIT. **Last publish:** 2026-07-30. Repo: [igordanchenko/yet-another-react-lightbox](https://github.com/igordanchenko/yet-another-react-lightbox) (main, pushed 2026-08-17, 1.3k★, not archived).
- **Verdict: ✅ usable.** Best fit for Next.js 16 + React 19: explicit React 19 peer support, zero deps, official `next/dynamic` + `next/image` guidance, MIT. Wraps nothing shadcn-specific — compose it yourself inside a `"use client"` component.

Sources: [npm registry (yet-another-react-lightbox/latest)](https://registry.npmjs.org/yet-another-react-lightbox/latest) · [GitHub repo](https://github.com/igordanchenko/yet-another-react-lightbox) · [README.md](https://github.com/igordanchenko/yet-another-react-lightbox/blob/main/README.md) · [Next.js example docs](https://yet-another-react-lightbox.com/examples/nextjs) · [documentation](https://yet-another-react-lightbox.com/documentation)

---

## 2. lightgallery (+ `lightgallery/react` wrapper)

- **Latest version:** `2.9.0`, published `2025-10-01T08:58:16.644Z` (packument, `dist-tags.latest`; also `beta: 2.8.0-beta.2`).
- **peerDependencies:** none — the package declares no peers at all (the React wrapper inside the package, `lightgallery/react`, also declares none; it `require('react')`s from the host app).
- **React 19: OK in practice.** No peer range to conflict; the React wrapper is a plain (class-based) React component shipped as `react/Lightgallery.umd.js` / `react/Lightgallery.es5.js` with `react/Lightgallery.d.ts` (verified by extracting the `lightgallery-2.9.0.tgz` tarball). It is not tested against React 19 in CI; expect it to work but it is legacy-style code (UMD + tslib).
- **TypeScript:** `"typings": "index.d.ts"` (core) + `react/Lightgallery.d.ts` (wrapper, full event types like `onAfterSlide`, `onInit`, `RotateLeftDetail`, …).
- **Next.js / SSR:** Client-only. Requires CSS imports: core `lightgallery/css/lightgallery.css` plus one CSS per plugin (e.g. `lg-zoom.css`, `lg-thumbnail.css`); README shows plugin CSS `<link>`s and `import lgZoom from 'lightgallery/plugins/zoom'`. In Next.js App Router the component must be a `"use client"` component and is normally loaded via `next/dynamic` (the wrapper needs the DOM). The official React docs live at [lightgalleryjs.com/docs/react/](https://www.lightgalleryjs.com/docs/react/) (linked from the README; this page was unreachable from this network — 404/timeout — so the wrapper facts above are verified from the published tarball instead).
- **Features:** zoom in/out + pinch zoom (plugin), animated thumbnails (plugin), captions, YouTube/Vimeo/Wistia/html5 video, inline gallery grid, touch/drag, RTL, modular plugin architecture (~30 plugins).
- **License:** ⚠️ **dual: GPLv3 or commercial** (npm license field `GPLv3`; repo LICENSE: *"If you are creating an open source application under a license compatible with the GNU GPL license v3, you may use this project under the terms of the GPLv3"*, else buy the commercial license). **Last publish:** 2025-10-01. Repo: [sachinchoolur/lightgallery](https://github.com/sachinchoolur/lightgallery) (master, pushed 2026-08-07, 7k★, not archived).
- **Verdict: ⚠️ usable only if GPLv3 is acceptable (or you buy a commercial license).** Otherwise the license alone rules it out for a commercial product. React wrapper is legacy-style; nothing shadcn-related.

Sources: [npm registry (lightgallery/latest)](https://registry.npmjs.org/lightgallery/latest) · [GitHub repo](https://github.com/sachinchoolur/lightgallery) · [README.md](https://github.com/sachinchoolur/lightgallery/blob/master/README.md) · [LICENSE](https://github.com/sachinchoolur/lightgallery/blob/master/LICENSE) · React docs link from README: [lightgalleryjs.com/docs/react/](https://www.lightgalleryjs.com/docs/react/) · tarball: [lightgallery-2.9.0.tgz](https://registry.npmjs.org/lightgallery/-/lightgallery-2.9.0.tgz) (contents verified locally)

---

## 3. react-photo-view

- **Latest version:** `1.2.7`, published `2025-01-05T09:03:41.557Z`. Repo: [MinJieLiu/react-photo-view](https://github.com/MinJieLiu/react-photo-view) (note: **MinJieLiu**, not minimal-ui-kit — that org/repo 404s; branch `master`, pushed 2026-01-30, 1.9k★, not archived).
- **peerDependencies (verbatim):** `{"react":">=16.8.0","react-dom":">=16.8.0"}`
- **React 19: OK via range.** `>=16.8.0` includes 19; no explicit 19 CI coverage. Zero runtime deps (deps: none).
- **TypeScript:** built-in (`"types": "./dist/index.d.ts"`, exports `PhotoProvider`, `PhotoView`, `PhotoSlider`).
- **Next.js / SSR:** Client-only; docs site (react-photo-view.vercel.app) was unreachable from this network, so behavior is verified from shipped source: it uses React state/DOM + `useIsomorphicLayoutEffect`, so it must be a `"use client"` component in App Router and is normally loaded with `next/dynamic` — no SSR-safe usage exists.
- **Features (verified in `dist/react-photo-view.module.js` + `src/PhotoSlider.tsx`):** zoom via scale (wheel/pinch) + pan, **rotation** (`onRotate`/rotate state), prev/next arrows, counter, mask/overlay, customizable `toolbarRender`/`overlayRender`. ⚠️ **No built-in download button** — `download` appears nowhere in the shipped 1.2.7 source (the user-facing claim of "download" is not in the code; the toolbar is `toolbarRender` + close icon only).
- **License:** Apache-2.0. **Last publish:** 2025-01-05.
- **Verdict: ✅ usable.** Clean peer range for React 19, zero deps, Apache-2.0, TS types; small bundle. Lacks built-in download and has no official Next.js docs (you wire `"use client"` + `next/dynamic` yourself).

Sources: [npm registry (react-photo-view/latest)](https://registry.npmjs.org/react-photo-view/latest) · [GitHub repo](https://github.com/MinJieLiu/react-photo-view) · [README.md](https://github.com/MinJieLiu/react-photo-view/blob/master/README.md) · source files (verified): `packages/react-photo-view/src/PhotoSlider.tsx`, `dist/react-photo-view.module.js` · docs (unreachable from this network): https://react-photo-view.vercel.app/docs/getting-started

---

## 4. photoswipe

- **Latest version:** `5.4.4`, published `2024-05-24T15:15:47.273Z`. (Docs note "PhotoSwipe v6 is under development".)
- **peerDependencies:** none — framework-agnostic vanilla JS/TS. **React 19: OK** (no React peer; integration is manual).
- **TypeScript:** built-in (`"types": "./dist/types/photoswipe.d.ts"`).
- **Next.js / SSR:** No SSR — must be instantiated client-side. The official React example page ([photoswipe.com/react-image-gallery](https://photoswipe.com/react-image-gallery)) states: *"The example uses dynamic import - PhotoSwipe JS starts loading only after the user clicks on a thumbnail"* (i.e., lazy-load the module, then `new PhotoSwipeLightbox({ pswpModule })` inside a ref/effect). CSS import required: `import 'photoswipe/style.css'` (getting-started). In Next.js: `"use client"` component + `next/dynamic` (or dynamic `import()` on click).
- **Features:** pinch/wheel zoom + pan, fullscreen, captions (title), keyboard/touch, custom content/HTML slides, native fullscreen-on-open, responsive images, transitions, filters/events API, no external icon assets. **No React wrapper is shipped** — integration is manual (useEffect/useRef + lightbox module); there is no official React wrapper package (the React/Vue/Svelte "frameworks" docs entries are demo pages: `/react-image-gallery`, `/vue-image-gallery`, `/svelte-image-gallery`).
- **License:** MIT. **Last publish:** 2024-05-24. Repo: [dimsemenov/PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) (master, pushed 2025-12-04, 25k★, not archived).
- **Verdict: ✅ usable, with the most manual integration.** Battle-tested, MIT, TS types; you write a thin `"use client"` wrapper (ref + effect + dynamic import). No video/thumbnails built in (community plugins only). Solid if you want a lightweight, framework-agnostic core.

Sources: [npm registry (photoswipe/latest)](https://registry.npmjs.org/photoswipe/latest) · [GitHub repo](https://github.com/dimsemenov/PhotoSwipe) · [Getting started](https://photoswipe.com/getting-started/) · [React example](https://photoswipe.com/react-image-gallery) · [sitemap.xml](https://photoswipe.com/sitemap.xml)

---

## 5. react-image-lightbox (legacy) + @photoprint fork — NOT viable

- **Latest version:** `5.1.4`, published `2021-07-13T22:57:17.219Z`; packument `time.modified` 2023-01-19.
- **peerDependencies (verbatim):** `{"react":"16.x || 17.x","react-dom":"16.x || 17.x"}` → **❌ React 19 (and 18) peer conflict** — `npm install` fails with ERESOLVE.
- **Maintenance:** dead. Repo [brycedorn/react-image-lightbox](https://github.com/brycedorn/react-image-lightbox) was transferred to [frontend-collective/react-image-lightbox](https://github.com/frontend-collective/react-image-lightbox), which is **archived** (last push 2023-01-19, 1.3k★).
- **TypeScript:** none shipped; `@types/react-image-lightbox` does not exist on npm (404).
- **License:** MIT.
- **@photoprint/react-image-lightbox:** does **not exist** on npm — `https://registry.npmjs.org/@photoprint%2Freact-image-lightbox` returns 404 (verified twice); GitHub search for "photoprint lightbox" finds nothing. If a fork is needed, use the archived `frontend-collective` repo, but its peer range still blocks React 19.
- **Verdict: ❌ not usable.** Peer conflict with React 19 + archived/unmaintained.

Sources: [npm registry (react-image-lightbox/latest)](https://registry.npmjs.org/react-image-lightbox/latest) · [frontend-collective/react-image-lightbox (archived)](https://github.com/frontend-collective/react-image-lightbox) · [npm registry @photoprint/react-image-lightbox (404)](https://registry.npmjs.org/@photoprint%2Freact-image-lightbox)

---

## 6. shadcn/ui official registry — no lightbox/gallery component

- Verified against the official registry endpoint used by the CLI: built-in registry URL pattern is `${REGISTRY_URL}/styles/{style}/{name}.json` with `REGISTRY_URL = "https://ui.shadcn.com/r"` and `FALLBACK_STYLE = "new-york-v4"` (from the official CLI source, [shadcn-ui/ui `packages/shadcn/src/registry/constants.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/constants.ts)).
- Item probes (2026-08): `button.json` → 200 (endpoint works), `carousel.json` → 200, `lightbox.json`, `gallery.json`, `image-viewer.json`, `photo-viewer.json`, `photo-view.json`, `image-gallery.json` → **all 404**.
- The official [components docs page](https://ui.shadcn.com/docs/components) contains **zero** occurrences of `lightbox`, `gallery`, `image-viewer`, `photo-viewer`, `photo-view`, `zoom`; `carousel` appears (the `carousel` component exists — Radix/Embla-based; availability under the `base-nova`/`@base-ui/react` base should be confirmed with `npx shadcn@latest search`).
- The official [blocks page](https://ui.shadcn.com/blocks) has **no gallery/lightbox block** ("gallery" hits are only `GalleryVerticalEnd` icon imports in login blocks).
- Conclusion: there is **no official shadcn/ui lightbox, gallery, or image-viewer component or block**. Any shadcn-style lightbox is third-party (e.g. the "Lightbox Frame Grid" block at [ui.beste.co/block/gallery2](https://ui.beste.co/block/gallery2) found via web search — community registry, not official). None of the libraries above ship an official shadcn wrapper, so you compose a thin wrapper yourself (consistent with how shadcn works: wrap a lib in your own component).

Sources: [shadcn CLI constants.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/constants.ts) · [registry endpoints](https://ui.shadcn.com/r/styles/new-york-v4/carousel.json) (probed live) · [components docs](https://ui.shadcn.com/docs/components) · [blocks](https://ui.shadcn.com/blocks)

---

## Next.js 16 SSR notes (applies to all of the above)

- All five candidates are client-only (React state/DOM) — none can be rendered server-side. In Next.js App Router (16.3.0) they must live in a `"use client"` component.
- `next/dynamic` with `ssr: false` is **still supported in Next.js 16 for Client Components**: current official docs — *"If you want to disable prerendering for a Client Component, you can use the ssr option set to false: `const ComponentC = dynamic(() => import('../components/C'), { ssr: false })`"* and *"ssr: false option is not supported in Server Components"* (i.e. put it in a client component). Source: [Next.js lazy-loading guide](https://nextjs.org/docs/app/guides/lazy-loading) (fetched live).
- The Next.js 16 upgrade guide removes `experimental.dynamicIO`/`useCache` (→ top-level `cacheComponents`); it does **not** remove `next/dynamic` or `ssr: false`. Next.js 16 pairs with React 19.2 (blog: *"The App Router in Next.js 16 uses the latest React Canary release, which includes the newly released React 19.2"*). Sources: [Upgrading to version 16](https://nextjs.org/docs/app/guides/upgrading/version-16) · [Next.js 16 blog](https://nextjs.org/blog/next-16).
- Tailwind v4: none of these libraries ship Tailwind coupling — styling is via their own CSS files (YARL `styles.css`, lightgallery plugin CSS, photoswipe `style.css`, react-photo-view bundled `.less`→CSS), which coexist fine with Tailwind v4 (import them in the client bundle; no `@config`/preflight conflicts observed).

## Bottom line

1. **yet-another-react-lightbox 3.32.2** — best fit: explicit React 19 peer support, MIT, zero deps, official Next.js `next/dynamic` + `next/image` guidance, zoom/thumbnails/captions/video/download plugins. Recommended default.
2. **photoswipe 5.4.4** — MIT, TS types, most battle-tested, but you hand-write the React wrapper and dynamic import; no video/thumbnails.
3. **react-photo-view 1.2.7** — fine and Apache-2.0, but no built-in download and no official Next.js docs.
4. **lightgallery 2.9.0** — GPLv3/commercial dual license is a hard blocker for a commercial project; legacy-style React wrapper.
5. **react-image-lightbox / @photoprint fork** — dead, React 16/17 peer range only, not usable with React 19.
6. **shadcn/ui official registry** — no lightbox/gallery component or block; you wrap the chosen library yourself.
