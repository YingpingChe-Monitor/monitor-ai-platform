# shadcn-style image preview & PDF preview components — research notes

Date: ~Aug 2026. Context: choosing image-preview (lightbox/gallery/zoom) and embedded PDF-preview
components for a reusable shadcn/ui + Next.js 16.3.0 + React 19.2.8 + Tailwind v4 template.
Project is **base-nova style, base = Base UI** (`@base-ui/react@^1.7.0`, NOT Radix), lucide-react,
App Router (`rsc: true`). All facts below pulled live from registry JSONs, CLI output, GitHub source
and official docs on 2026-08. Companion deep-dives (kept separate for size):
[image-lightbox-gallery-zoom-libraries.md](./image-lightbox-gallery-zoom-libraries.md) ·
[pdf-viewer-libraries-react19-next16.md](./pdf-viewer-libraries-react19-next16.md).

## Bottom line

- **Official shadcn registry ships NO image-lightbox/gallery and NO PDF viewer/preview component or block.** The only adjacent official pieces are `carousel` (Embla-based) and `aspect-ratio`; the `preview`/`preview-02`/`preview-03` registry blocks are settings-page *template* demos, not preview components. (Verified via CLI search + item probes below.)
- **Image preview: the pragmatic shadcn-native answer is a Dialog+`<img>` lightbox**, and there are ready-made Base UI blocks for exactly this: **`@7ovr/gallery-1..4`** (Base UI deps, Dialog lightbox — installs cleanly into this project, verified with `--dry-run`). For heavier zoom features, **`@delta/cambio-image`** (zoomable image with portal popup) or **`@kibo-ui/image-zoom`** (wraps `react-medium-image-zoom`, React 19 ✓). If you'd rather own it, the official `dialog` + `aspect-ratio` components already installed are all you need.
- **PDF preview: no registry item exists anywhere (official or indexed community).** Wrap **`react-pdf` 10.4.1** (MIT, React 19 peer ✓, official Next 16 App Router sample) in a local `"use client"` component + `next/dynamic(..., { ssr: false })` + `pdfjs.GlobalWorkerOptions.workerSrc`. Avoid `@react-pdf-viewer` (commercial license, npm-frozen since 2023, pdfjs ≤3 peer cap). `<embed>`/`<iframe>` is a fine fallback but iOS Safari shows only page 1.
- **Community registries are overwhelmingly Radix-based.** Of the ones checked, only `@7ovr`, `@delta`, `@coss`, `@lumiui`, `@cubby-ui`, `@flowkit-ui`, `@kinetic` claim Base UI — everything else (magicui, bundui, tailark, hirael, shadcnblocks, kibo-ui, diceui, kokonutui, …) is Radix/motion-based and would need conversion or can't be used as-is with `@base-ui/react`.

## 1. Official shadcn registry — what exists and what doesn't

- CLI registry template for this project (from `npx shadcn@latest info`): `https://ui.shadcn.com/r/styles/{style}/{name}.json` with `style = base-nova` ([registry-index docs](https://ui.shadcn.com/docs/registry/registry-index) · [registry.json schema](https://ui.shadcn.com/schema/registry.json)). Per-item JSONs verified live: `.../base-nova/dialog.json` → 200, `carousel.json` → 200.
- `npx shadcn@latest search '@shadcn' -q <term>` (verified live, 2026-08): `lightbox` → **0 items**, `gallery` → **0**, `pdf` → **0**, `viewer` → **0**, `zoom` → **0**, `preview` → 3 blocks (`preview`, `preview-02`, `preview-03`), `image` → only auth blocks (`login-04`, `signup-04`, … — cover images, not previews), `carousel` → `carousel` (ui) + `carousel-example`, `aspect` → `aspect-ratio`.
- The `preview` blocks are **template showcases, not image/PDF previews**: `preview` registryDependencies pull ~26 components (dialog, chart, sidebar, …) and its file is a settings-page demo (`blocks/preview/index.tsx` importing `analytics-card`, `anomaly-alert`, `file-upload`, `invite-team`, …); `preview-02` adds `react-qr-code`; `preview-03` is a stub (`<div>Preview 03</div>`). Source: [registry items](https://ui.shadcn.com/r/styles/base-nova/preview.json) (fetched live).
- Official components list ([docs/components](https://ui.shadcn.com/docs/components)) has **no** lightbox/gallery/file/pdf/preview entry. The chat-family `attachment`/`bubble`/`message` components exist (Base UI) and render file-attachment cards with an `AttachmentTrigger`, but they are not viewers.
- Official `carousel` (base-nova) = Embla wrapper (`deps: embla-carousel-react`, regDeps `button`); official `aspect-ratio` = pure div with `--ratio` CSS var, zero deps. Both are available for `@base-ui/react` and are the building blocks of a self-built gallery.
- Conclusion: anything preview-like under `@shadcn` must be **self-built or pulled from a community registry**. This matches how shadcn works — you own the code.

Sources: [registry-index](https://ui.shadcn.com/docs/registry/registry-index) · [registry.json schema](https://ui.shadcn.com/schema/registry.json) · [components docs](https://ui.shadcn.com/docs/components) · [blocks](https://ui.shadcn.com/blocks) · live CLI `search` output (2026-08) · [carousel.json](https://ui.shadcn.com/r/styles/base-nova/carousel.json) · [aspect-ratio.json](https://ui.shadcn.com/r/styles/base-nova/aspect-ratio.json) · [preview.json](https://ui.shadcn.com/r/styles/base-nova/preview.json)

## 2. Community registries — image preview candidates (install-verified for THIS project)

All commands below were **dry-run verified** in `apps/web` (`npx shadcn@latest add <item> --dry-run`); components resolve against this project's base-nova config. Registry namespace list is the official [directory.json](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/directory.json) / [registries.json](https://ui.shadcn.com/r/registries.json).

### ✅ Works with Base UI — direct drop-in candidates

| Registry / item | Type | Install command (verified) | What it gives you | Base |
|---|---|---|---|---|
| **`@7ovr/gallery-1`** | block | `npx shadcn@latest add @7ovr/gallery-1` | Image gallery grid with tag filter; each tile opens a **Dialog lightbox** (`DialogTrigger` + `DialogContent` with `sm:max-w-2xl`, `sr-only` title/description, caption + location + avatar footer). Skips 6 already-installed deps (dialog, toggle-group, button, badge, avatar, toggle); creates only `components/blocks/gallery-1.tsx`; adds `@base-ui/react` (already present) | **Base UI** (`deps: @base-ui/react`) |
| **`@7ovr/gallery-2`** | block | `npx shadcn@latest add @7ovr/gallery-2` | Product-screenshot gallery: large browser-framed image + thumbnail strip; **Dialog lightbox** (`sm:max-w-3xl`, `object-contain`, caption bar) | **Base UI** |
| **`@7ovr/gallery-3`** | block | `npx shadcn@latest add @7ovr/gallery-3` | Masonry gallery (CSS columns) with **Dialog lightbox** | **Base UI** |
| **`@7ovr/gallery-4`** | block | `npx shadcn@latest add @7ovr/gallery-4` | Photo mosaic 4×2 grid, grayscale→color hover, **Dialog lightbox** with caption+location | **Base UI** |
| **`@7ovr/file-upload-4`** | block | `npx shadcn@latest add @7ovr/file-upload-4` | Image-gallery **uploader** with thumbnail grid + cover badge + preview (adjacent pattern; skips badge/button/card) | **Base UI** |
| **`@delta/cambio-image`** | ui | `npx shadcn@latest add @delta/cambio-image` | **Zoomable image with popup lightbox** (IntersectionObserver lazy reveal; portal popup; zoom, dismiss-on-scroll, close button, motion presets). Deps: `cambio`, `lucide-react`. Creates `components/ui/cambio-image.tsx` | React 19 + Base UI via `cambio` (see caveat) |

`@7ovr` (7ovr.com, "built on Base UI" per directory) and `@delta` (deltacomponents.dev, "zoomable images" per directory) are the two registries whose gallery/image items are Base UI-native. Sources: [directory.json](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/directory.json) · [7ovr gallery-1.json](https://7ovr.com/r/gallery-1.json) (source inspected: `"use client"` + shadcn `Dialog` + `render={<button/>}` Base UI pattern) · [delta cambio-image.json](https://deltacomponents.dev/r/cambio-image.json) (source inspected) · live `--dry-run` output (2026-08).

### ⚠️ Radix / motion-based — need conversion or skip

| Registry / item | Type | Install | Problem for this project |
|---|---|---|---|
| `@magicui/lens` | ui | `npx shadcn@latest add @magicui/lens` | Hover **magnifier lens** (not a lightbox). Deps `motion` only — no Radix, so it actually installs fine, but it's a hover-zoom effect, not a click-to-open preview. Source: [magicui lens.json](https://magicui.design/r/lens.json) |
| `@magicui/pixel-image` | ui | — | Pixelation effect, not a preview |
| `@kibo-ui/image-zoom` | ui | `npx shadcn@latest add @kibo-ui/image-zoom` | **Click-to-zoom lightbox** wrapping `react-medium-image-zoom` 5.4.9 (React 19 peer ✓, BSD-3-Clause, zero deps — [npm](https://registry.npmjs.org/react-medium-image-zoom/latest)). Installs cleanly (creates `components/kibo-ui/image-zoom/index.tsx`) because it's lib-agnostic — but its source imports `@/lib/utils` and the sibling `@kibo-ui/image-crop` is Radix (`deps: radix-ui`) with monorepo `@repo/shadcn-ui` imports. **Use image-zoom only, expect to fix one import path.** Source: [kibo-ui image-zoom.json](https://www.kibo-ui.com/r/image-zoom.json) |
| `@shadcnblocks/image-zoom-image-zoom-standard-1` | block | — | Example that just pulls `@kibo-ui/image-zoom` as a registryDependency — skip, install kibo directly |
| `@shadcnblocks/gallery43` | block | — | "8 square gallery tiles open a modal lightbox" (Dialog-based). Direct fetch 401s (paywalled/premium). Radix-era blocks repo. Source: search description |
| `@shadcnblocks/shop-the-look1` | block | — | Carousel with **PhotoSwipe lightbox** — 401 (premium), Photoswipe integration is manual |
| `@hirael/image-gallery-01` | block | — | Masonry gallery, `next/image`, Tabs filter — **no lightbox**; hirael uses Radix (e.g. `@hirael/accordion` "Radix-powered") |
| `@bundui/*` | components | — | 95 "gallery" / 28 "lightbox" search hits are fuzzy marketing-section matches (`product-quickviews-*`, `category-previews-*`, `interactive-image-slider`, `image-comparison`); none is a reusable lightbox; motion-based, not Base UI |
| `@tailark/*` | blocks | — | `gallery`/`lightbox` → 0 items; `pdf` matches are SVG logos (`core-pdf`, `document-pdf`) |

Sources: [magicui](https://magicui.design/r/lens.json) · [kibo-ui registry](https://www.kibo-ui.com/r/registry.json) + [image-zoom.json](https://www.kibo-ui.com/r/image-zoom.json) + [image-crop.json](https://www.kibo-ui.com/r/image-crop.json) · [hirael image-gallery-01.json](https://hirael.com/r/image-gallery-01.json) · [tailark registry](https://tailark.com/r/registry.json) · live CLI `search` output for `@magicui`, `@bundui`, `@tailark`, `@hirael`, `@shadcnblocks`, `@kokonutui`, `@diceui`, `@coss`, `@cubby-ui`, `@kinetic`, `@lumiui` (2026-08)

### Registries named in the brief that do NOT exist as namespaces

- `@shadcn-ui-sandbox`, `@mynaui`, `@kagimatos`, `@v0` → **"Unknown registry"** from the CLI; none is in the official [directory.json](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/directory.json). GitHub: `praveenjuge/mynaui` (2★) is an icon/Figma kit with no shadcn registry; sandbox/kagimatos repos 404 or are unrelated. Do not reference them in install commands.

## 3. Underlying image libraries (if you want a full lightbox library, not a Dialog)

Full detail in [image-lightbox-gallery-zoom-libraries.md](./image-lightbox-gallery-zoom-libraries.md); summary (exact versions, peerDeps from npm registry JSON):

| Package | Latest | React 19 | License | Notes / verdict |
|---|---|---|---|---|
| **yet-another-react-lightbox** | 3.32.2 | ✅ explicit `^19` | MIT | **Recommended if you outgrow Dialog** — zero runtime deps, TS types, official `next/dynamic` + `next/image` guidance, plugins: zoom, thumbnails, captions, video, download. CSS import required. |
| photoswipe | 5.4.4 | ✅ (no peers) | MIT | Battle-tested, but **manual React wrapper** (ref+effect+dynamic import); no video/thumbnails |
| react-photo-view | 1.2.7 | ✅ `>=16.8.0` | Apache-2.0 | Works; **no built-in download** (verified in source); repo is `MinJieLiu/react-photo-view` |
| lightgallery (+react) | 2.9.0 | ✅ (no peers) | **GPLv3 or commercial** | License is a hard blocker for commercial use; legacy-style React wrapper |
| react-image-lightbox | 5.1.4 | ❌ peer `16.x \|\| 17.x` | MIT | Dead/archived; ERESOLVE on React 19; `@photoprint/...` fork doesn't exist on npm |

All are client-only → `"use client"` + `next/dynamic({ ssr: false })` (still supported in Next.js 16 for Client Components per the [lazy-loading guide](https://nextjs.org/docs/app/guides/lazy-loading)). None has an official shadcn wrapper — consistent with the "wrap a lib in your own shadcn component" model.

Sources: [npm yet-another-react-lightbox](https://registry.npmjs.org/yet-another-react-lightbox/latest) · [YARL Next.js docs](https://yet-another-react-lightbox.com/examples/nextjs) · [npm photoswipe](https://registry.npmjs.org/photoswipe/latest) · [PhotoSwipe React example](https://photoswipe.com/react-image-gallery) · [npm react-photo-view](https://registry.npmjs.org/react-photo-view/latest) · [MinJieLiu/react-photo-view](https://github.com/MinJieLiu/react-photo-view) · [npm lightgallery](https://registry.npmjs.org/lightgallery/latest) · [lightgallery LICENSE](https://github.com/sachinchoolur/lightgallery/blob/master/LICENSE) · [react-image-lightbox (archived)](https://github.com/frontend-collective/react-image-lightbox)

## 4. PDF preview — library landscape (React 19 + Next 16)

Full detail in [pdf-viewer-libraries-react19-next16.md](./pdf-viewer-libraries-react19-next16.md); summary (exact versions/peers from npm registry JSON):

| Candidate | Latest | React 19 | Next 16 App Router | License | Verdict |
|---|---|---|---|---|---|
| **react-pdf** (wojtekmaj) | 10.4.1 | ✅ peer `^19.0.0` | ✅ **official sample runs Next ^16.2.11 + React ^19.2.0** | MIT | **Use this.** Pins `pdfjs-dist@5.4.296` as a dependency |
| **@react-pdf-viewer/core** | 3.12.0 | ⚠️ unproven (`>=16.8.0`); RSC/React-19 support only in unpublished [WIP] v4 | ❌ no evidence; npm silent since 2023-03 | **Commercial license required** | Avoid — peer caps pdfjs-dist at `^2.16 \|\| ^3.0`, clashes with react-pdf 10 |
| pdfjs-dist direct | 6.2.108 | ✅ framework-agnostic | ✅ but you build everything (canvas, paging, zoom, toolbar) | Apache-2.0 | Viable raw engine; prefer through react-pdf |
| `<embed>` / `<iframe>` | — | ✅ | ✅ trivial for `public/` PDFs | — | Works, but **iOS Safari renders only page 1** (SO 75511392) and zero styling control |
| @react-pdf/renderer (diegomura) | 4.6.1 | ✅ peer, but open React 19 issue | n/a | MIT | **Creates** PDFs — not a viewer; out of scope |

### The react-pdf pattern to copy (from the official App Router sample, `sample/next-app`)

```tsx
// page.tsx
'use client';
import dynamic from 'next/dynamic';
const Sample = dynamic(() => import('./Sample'), { ssr: false });
export default function Page() { return <Sample />; }

// Sample.tsx  ('use client')
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url,
).toString();
// <Document options={{ cMapUrl: '/cmaps/', standardFontDataUrl: '/standard_fonts/', wasmUrl: '/wasm/' }}> ...
```

- No `next.config` change needed on Next 15+/16 (the README's `swcMinify: false` note applies to Next < v15.0.0-canary.53). `esmExternals: 'loose'` workaround is for the **Pages Router** sample only.
- `workerSrc` must be set **in the same module** that renders `<Document>`/`<Page>`; otherwise pdf.js warns "Setting up fake worker." / "Setting up fake worker failed: …" (pdf.js `src/display/api.js`).
- Known Next 16 issues: `DOMMatrix is not defined` (fix = `ssr: false` dynamic import, [issue #1999](https://github.com/wojtekmaj/react-pdf/issues/1999)); `Can't resolve 'pdfjs-dist/build/pdf.worker.min.mjs'` (worker misconfig, [issue #1855](https://github.com/wojtekmaj/react-pdf/issues/1855)); v10 is **ESM-only**.
- Community shadcn-style wrapper worth copying the pattern from: **`@llamaindex/pdf-viewer`** 1.3.0 (MIT, peer React `^19`, wraps react-pdf ^9; its README documents the same `webpack alias canvas=false` + `next/dynamic ssr:false` guidance) — [npm](https://registry.npmjs.org/@llamaindex/pdf-viewer/latest) · [run-llama/pdf-viewer](https://github.com/run-llama/pdf-viewer).
- **No shadcn registry item (official or indexed community) ships a PDF viewer** — verified: `ui.shadcn.com/r/index.json` and `/r/registries.json` both have zero "pdf" matches; all "pdf" search hits in `@magicui`/`@bundui`/`@tailark`/`@hirael`/`@uiable`/`@shadcnblocks` are fuzzy text matches (logos, upload forms), not viewers. So PDF preview = local component wrapping react-pdf; optionally publish it as your own registry item later.

Sources: [npm react-pdf](https://registry.npmjs.org/react-pdf/latest) · [react-pdf repo + README](https://github.com/wojtekmaj/react-pdf) · [sample/next-app](https://github.com/wojtekmaj/react-pdf/tree/main/sample/next-app) · [npm @react-pdf-viewer/core](https://registry.npmjs.org/@react-pdf-viewer/core/latest) · [react-pdf-viewer LICENSE.md](https://github.com/react-pdf-viewer/react-pdf-viewer/blob/master/LICENSE.md) · [v4.0.0 WIP changelog](https://github.com/react-pdf-viewer/react-pdf-viewer/blob/master/changelogs/v4.0.0.md) · [npm pdfjs-dist](https://registry.npmjs.org/pdfjs-dist/latest) · [pdf.js webpack example](https://github.com/mozilla/pdf.js/blob/master/examples/webpack/main.mjs) · [SO 75511392](https://stackoverflow.com/questions/75511392/pdf-in-iframe-only-first-page-on-iphone-ipad-view) · [react-pdf issues #1999/#1855/#1688](https://github.com/wojtekmaj/react-pdf/issues/1999) · [@llamaindex/pdf-viewer](https://github.com/run-llama/pdf-viewer)

## 5. Recommendation for this template (base-nova / Base UI)

### Image preview
1. **Default: self-built shadcn lightbox (Dialog + `<img>` + `aspect-ratio`)** — official `dialog` is already installed; a gallery block like `@7ovr/gallery-1` shows the exact idiomatic pattern (tile → `DialogTrigger` → `DialogContent` with `sr-only` title/description, `object-cover`, caption). Zero new deps, fully Base UI, fully themeable.
2. **If you want the block today:** `npx shadcn@latest add @7ovr/gallery-1` (or gallery-2/3/4) — Base UI-native, verified clean install (only the block file is added; it reuses installed dialog/toggle-group/avatar/…). Caveat: blocks land in `components/blocks/` with an inline data array — adapt the data source.
3. **If you need real zoom UX (pinch/pan, motion):** `npx shadcn@latest add @delta/cambio-image` (React 19 + Base UI via `cambio`; ⚠️ `cambio` declares `@base-ui-components/react@1.0.0-beta.2` as a dependency — the pre-rename package name, separate from your `@base-ui/react@^1.7.0`; verify it doesn't conflict) or `@kibo-ui/image-zoom` (lib-agnostic wrapper of `react-medium-image-zoom` 5.4.9, React 19 ✓; fix the `@/lib/utils` import path if it lands elsewhere). `@magicui/lens` is hover-zoom only — not a lightbox.
4. If you later need a full library (video slides, thumbnails, download): **yet-another-react-lightbox 3.32.2** (MIT, React 19 peer, official Next guidance) wrapped in your own `"use client"` component.

### PDF preview
1. **`react-pdf@10` wrapped locally** — `npm i react-pdf`, then a `"use client"` `PdfViewer` component: `next/dynamic(..., { ssr: false })`, module-level `workerSrc` (pattern above), toolbar built from installed shadcn primitives (`button`, `tooltip`, `sheet`/`dialog` for fullscreen). No registry item exists; this is the shadcn-idiomatic path.
2. **Fallback for zero-JS/cost-sensitive surfaces:** `<embed type="application/pdf">` in a Dialog/Sheet — desktop OK, but document the iOS-Safari first-page-only limitation.
3. **Avoid:** `@react-pdf-viewer/*` (commercial license + frozen + pdfjs ≤3 peer cap).

### Base UI vs Radix — the standing caveat
Most community registries (magicui, bundui, tailark, hirael, shadcnblocks, kibo-ui, diceui, kokonutui, craftui, …) are **Radix or motion-based**. Their registry files import `@radix-ui/*` (or nothing Base-UI-related), so `npx shadcn@latest add` may copy them verbatim into a Base UI project where the primitives (`Dialog`, `Popover`, `Tooltip`, …) have a different API (`render` prop vs `asChild`, different data-* attrs) — expect conversion work. The Base UI-safe sources found in this sweep: **`@7ovr`** (all blocks), **`@delta`** (`cambio-image`), and the Base-UI-native registries from the directory: **`@coss`, `@lumiui`, `@cubby-ui`, `@flowkit-ui`, `@kinetic`** (none of which ships a lightbox/PDF viewer today). For this template, the self-built Dialog lightbox + react-pdf wrapper is the more durable choice: zero registry drift, no primitive mismatch, everything themeable via base-nova tokens.

## Key sources

- https://ui.shadcn.com/docs/components ; https://ui.shadcn.com/docs/registry/registry-index ; https://ui.shadcn.com/blocks ; https://ui.shadcn.com/schema/registry.json
- https://ui.shadcn.com/r/registries.json ; https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/directory.json
- https://ui.shadcn.com/r/styles/base-nova/{carousel,aspect-ratio,dialog,preview}.json (item JSONs, fetched live)
- https://7ovr.com/r/{gallery-1,gallery-2,gallery-3,gallery-4,file-upload-4}.json ; https://deltacomponents.dev/r/cambio-image.json ; https://www.kibo-ui.com/r/image-zoom.json ; https://magicui.design/r/lens.json ; https://hirael.com/r/image-gallery-01.json ; https://tailark.com/r/registry.json
- https://registry.npmjs.org/{yet-another-react-lightbox,photoswipe,react-photo-view,lightgallery,react-image-lightbox,react-medium-image-zoom,cambio}/latest
- https://yet-another-react-lightbox.com/examples/nextjs ; https://photoswipe.com/react-image-gallery ; https://github.com/frontend-collective/react-image-lightbox
- https://registry.npmjs.org/{react-pdf,pdfjs-dist,@react-pdf-viewer/core,@react-pdf/renderer,@llamaindex/pdf-viewer}/latest
- https://github.com/wojtekmaj/react-pdf (README + sample/next-app, sample/next-pages) ; https://github.com/react-pdf-viewer/react-pdf-viewer (LICENSE.md, changelogs/v4.0.0.md) ; https://github.com/mozilla/pdf.js (examples/webpack/main.mjs, src/display/api.js)
- https://github.com/wojtekmaj/react-pdf/issues/{1999,1855} ; https://github.com/wojtekmaj/react-pdf/discussions/1688 ; https://stackoverflow.com/questions/75511392/pdf-in-iframe-only-first-page-on-iphone-ipad-view
- Companion reports (local): [image-lightbox-gallery-zoom-libraries.md](./image-lightbox-gallery-zoom-libraries.md) · [pdf-viewer-libraries-react19-next16.md](./pdf-viewer-libraries-react19-next16.md)
