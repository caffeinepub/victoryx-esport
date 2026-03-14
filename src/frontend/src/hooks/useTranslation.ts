import { useCallback } from "react";
import { type TranslationKeys, getTranslation } from "../i18n/translations";
import { useUserProfile } from "./useQueries";

export function useTranslation() {
  const { data: profile } = useUserProfile();
  const lang = profile?.languagePreference || "en";

  const t = useCallback(
    (key: TranslationKeys) => getTranslation(lang, key),
    [lang],
  );

  return { t, lang };
}
