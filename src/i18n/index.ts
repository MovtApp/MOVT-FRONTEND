import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import pt from "./translations/pt.json";
import en from "./translations/en.json";

const resources = {
  pt: { translation: pt },
  en: { translation: en },
};

const LANGUAGE_KEY = "user-language";

const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      const locales = Localization.getLocales();
      const deviceLanguage = locales[0]?.languageCode || "pt";
      callback(deviceLanguage);
    } catch (error) {
      console.log("Error detecting language:", error);
      callback("pt");
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.log("Error caching language:", error);
    }
  },
};

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "pt",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
