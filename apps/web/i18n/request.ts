import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import zh from "../messages/zh.json";
import en from "../messages/en.json";

// next-intl without i18n routing: the locale is a client-set cookie, read here
// on the server so RSC-rendered text follows the user's preference.
// Default: zh (Monitor G5 默认中文界面).
// Static imports: Turbopack (Next 16 default) can't resolve dynamic
// `import(\`../../messages/${locale}.json\`)` at build time.
export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = store.get("locale")?.value === "en" ? "en" : "zh";

  return {
    locale,
    messages: locale === "en" ? en : zh,
  };
});
