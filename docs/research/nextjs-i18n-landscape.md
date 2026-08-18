# Next.js (App Router) i18n landscape — research notes

Date: ~Aug 2026. Context: choosing i18n for a reusable shadcn/ui + Next.js 16 + Tailwind v4 template.
All numbers pulled live from npm registry / GitHub API on 2026-08-17.

## Hard data

| Package | GitHub stars | npm downloads (last month) | Latest | Notes |
|---|---|---|---|---|
| next-intl | 4,345 | 19,950,327 | 4.13.7 | peerDeps: next ^12–^16, react ^16.8–^19 (official Next 16 + React 19) |
| i18next (core) | — | 79,486,553 | — | framework-agnostic core |
| react-i18next | 10,035 | 56,901,680 | 17.0.11 | peerDeps: react >=16.8, i18next >=26.2 |
| next-i18next | — | 2,301,692 | 16.0.10 | v16 added App Router support (`getT()`/`useT()`, proxy/middleware detection) |
| @lingui/react | 5,848 | 3,770,414 | — | Lingui 5 (Nov 2024) added RSC/App Router support |
| rosetta | — | 200,483 | 1.1.0 | ~16.8KB unpacked; framework-agnostic, no Next integration |
| next-themes | — | — | 0.4.6 | peerDeps react ^16.8–^19 |

## next-intl facts (verified)

- Official examples include `example-app-router` (structure: `src/app/[locale]/` + `src/proxy.ts` + `src/i18n/request.ts`) and `example-app-router-without-i18n-routing` (root `messages/` dir; `src/i18n/request.ts` reads the `locale` **cookie**, fallback `en`; `LocaleSwitcher.tsx` switches client-side + `router.refresh()`).
- Next.js 16 renamed middleware → proxy and made request APIs async; next-intl docs cover the proxy setup. Some upgrade friction reported (see Build with Matija blog: "Unable to find next-intl locale after upgrading to Next.js 16" — fixed by proxy config).
- React 19 support landed via feat #1597; current peerDeps include `^19.0.0` and `next ^16.0.0`.
- Known quirk in URL-less mode: with `localePrefix: 'never'`, locale can reset from Accept-Language when the cookie is lost (issue #811).
- No CSS/Tailwind coupling → no Tailwind v4 conflict found.

## What popular templates actually do

- shadcn-ui/taxonomy (19k★): **no i18n**.
- t3-oss/create-t3-app (29k★): **no i18n** in core; requested in issue #332, PR #387 not merged.
- supermemoryai/supermemory (29k★): no i18n deps.
- satnaing/shadcn-admin: no i18n deps.
- ixartz/Next-js-Boilerplate (13k★): **next-intl ^4**.
- AmuraDesign/Next.js-16-Next-Intl-Boilerplate: **next-intl** on Next 16, `/[locale]`, hreflang, sitemap.
- Some lightweight starters use **next-international** (QuiiBz).

Pattern: SEO-facing sites → `/[locale]` + proxy + hreflang; internal dashboards → skip i18n or use cookie/no-prefix mode.

## Key sources

- https://github.com/amannn/next-intl
- https://next-intl.dev/docs/getting-started/app-router
- https://next-intl.dev/docs/environments/server-client-components
- https://next-intl.dev/docs/routing/middleware
- https://github.com/amannn/next-intl/tree/main/examples/example-app-router-without-i18n-routing
- https://github.com/amannn/next-intl/discussions/1081 , /1342 , /2138 , /1096
- https://github.com/amannn/next-intl/issues/811
- https://github.com/amannn/next-intl/commit/e0ffe292a3cae8955fcd06bd8e8e2b02c525ef69
- https://www.buildwithmatija.com/blog/next-intl-nextjs-16-proxy-fix
- https://react.i18next.com/latest/ssr.md
- https://github.com/i18next/react-i18next
- https://github.com/lingui/js-lingui ; https://lingui.dev/blog/2024/11/28/announcing-lingui-5.0 ; https://github.com/lingui/js-lingui/discussions/2284
- https://github.com/chicoxyzzy/rosetta
- https://github.com/shadcn-ui/taxonomy ; https://github.com/t3-oss/create-t3-app/issues/332 ; https://github.com/ixartz/Next-js-Boilerplate ; https://github.com/AmuraDesign/Next.js-16-Next-Intl-Boilerplate ; https://github.com/supermemoryai/supermemory ; https://github.com/satnaing/shadcn-admin
- https://github.com/QuiiBz/next-international
- https://www.npmjs.com/package/next-intl ; https://www.npmjs.com/package/next-themes
- https://simplelocalize.io/blog/posts/react-i18next-vs-next-intl/ ; https://www.pkgpulse.com/guides/next-intl-vs-react-i18next-vs-lingui-react-i18n-2026
