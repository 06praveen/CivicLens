/**
 * AppContext.tsx
 * Single React context providing:
 *  - language (en | hi) + toggle
 *  - fontScale (0.9 | 1.0 | 1.15)
 *  - highContrast toggle
 * All preferences persist in localStorage.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "@/i18n/translations";

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  fontScale: number;
  setFontScale: (scale: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// Font steps as percentages of the default 16px root font size
const FONT_STEPS = [0.9, 1.0, 1.15];  // 90% | 100% | 115%
const DEFAULT_HTML_FONT_PX = 16;       // browser default

function closestStepIndex(value: number): number {
  let best = 0;
  let bestDist = Math.abs(FONT_STEPS[0] - value);
  for (let i = 1; i < FONT_STEPS.length; i++) {
    const d = Math.abs(FONT_STEPS[i] - value);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}

function applyRootFontSize(scale: number) {
  // Apply to <html> so that Tailwind rem-based classes scale correctly
  document.documentElement.style.fontSize = `${DEFAULT_HTML_FONT_PX * scale}px`;
}

function loadPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return JSON.parse(v) as T;
  } catch { /* ignore */ }
  return fallback;
}

function savePref<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, _setLang] = useState<Lang>(() => loadPref<Lang>("cl_lang", "en"));

  // Store step INDEX (0|1|2) so indexOf never misses due to float precision
  const [fontStepIdx, setFontStepIdx] = useState<number>(() => {
    const saved = loadPref<number>("cl_font", 1.0);
    return closestStepIndex(saved);
  });
  const fontScale = FONT_STEPS[fontStepIdx];

  const [highContrast, _setHighContrast] = useState<boolean>(() => loadPref<boolean>("cl_hc", false));

  const setLang = useCallback((l: Lang) => { _setLang(l); savePref("cl_lang", l); }, []);

  // Apply font size to <html> whenever the step index changes
  useEffect(() => {
    applyRootFontSize(fontScale);
    savePref("cl_font", fontScale);
  }, [fontScale]);

  const setFontScale = useCallback((scale: number) => {
    setFontStepIdx(closestStepIndex(scale));
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontStepIdx(prev => Math.min(prev + 1, FONT_STEPS.length - 1));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontStepIdx(prev => Math.max(prev - 1, 0));
  }, []);

  const resetFontSize = useCallback(() => {
    setFontStepIdx(1); // index 1 = 1.0 (100%)
  }, []);

  const toggleHighContrast = useCallback(() => {
    _setHighContrast(prev => { savePref("cl_hc", !prev); return !prev; });
  }, []);

  // Apply high-contrast class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  const t = useCallback((key: TranslationKey): string => {
    return (translations[lang] as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key;
  }, [lang]);

  return (
    <AppContext.Provider value={{
      lang, setLang, t,
      fontScale, setFontScale, increaseFontSize, decreaseFontSize, resetFontSize,
      highContrast, toggleHighContrast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
