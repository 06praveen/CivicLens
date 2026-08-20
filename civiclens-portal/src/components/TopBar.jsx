import { useState } from 'react'

export default function TopBar() {
  const [lang, setLang] = useState('en')
  const [fontStep, setFontStep] = useState(1) // 0=A-, 1=A, 2=A+
  const [highContrast, setHighContrast] = useState(false)

  return (
    <div className="w-full bg-navy text-white text-xs">
      {/* saffron-white-green identity strip */}
      <div className="h-1 w-full bg-gradient-to-r from-saffron via-white to-indiaGreen" />

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-saffron" aria-hidden="true" />
          <span>भारत सरकार • Government of India • Public Budget Information &amp; Transparency Portal</span>
        </div>

        <div className="flex items-center gap-4">
          <a href="#main-content" className="hover:underline">
            Skip to Main Content
          </a>
          <a href="#accessibility" className="hover:underline">
            Screen Reader Access
          </a>

          <div className="flex items-center gap-1" role="group" aria-label="Language selection">
            <button
              onClick={() => setLang('en')}
              className={lang === 'en' ? 'font-semibold underline' : 'opacity-80 hover:opacity-100'}
            >
              English
            </button>
            <span aria-hidden="true">|</span>
            <button
              onClick={() => setLang('hi')}
              className={lang === 'hi' ? 'font-semibold underline' : 'opacity-80 hover:opacity-100'}
            >
              हिन्दी
            </button>
          </div>

          <div className="flex items-center gap-1" role="group" aria-label="Text size">
            <button onClick={() => setFontStep(0)} className={`px-1 ${fontStep === 0 ? 'underline font-semibold' : 'opacity-80'}`}>
              A-
            </button>
            <button onClick={() => setFontStep(1)} className={`px-1 ${fontStep === 1 ? 'underline font-semibold' : 'opacity-80'}`}>
              A
            </button>
            <button onClick={() => setFontStep(2)} className={`px-1 ${fontStep === 2 ? 'underline font-semibold' : 'opacity-80'}`}>
              A+
            </button>
          </div>

          <button
            onClick={() => setHighContrast((v) => !v)}
            aria-pressed={highContrast}
            className="hover:underline"
          >
            High Contrast
          </button>
        </div>
      </div>
    </div>
  )
}
