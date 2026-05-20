import { useTokensStore } from "@/store/tokens"
import { STRINGS, type StringKey, type Lang } from "./strings"

export type { StringKey, Lang }

/**
 * Translation hook — returns a `t(key, vars?)` function reactive to the
 * current language. Variables in strings use `{name}` syntax.
 */
export function useT() {
  const lang = useTokensStore((s) => s.language)
  return (key: StringKey, vars?: Record<string, string | number>): string => {
    let str: string = (STRINGS[lang] as Record<string, string>)[key] ?? STRINGS.en[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
      }
    }
    return str
  }
}

/** Non-reactive read of current language */
export function getLang(): Lang {
  return useTokensStore.getState().language
}
