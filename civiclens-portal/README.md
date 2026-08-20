# CivicLens Budget Transparency Portal — Frontend

A React + Vite + Tailwind CSS recreation of the CivicLens government budget
transparency portal landing page.

## Structure

```
civiclens-portal/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── hero-red-fort.svg      # placeholder hero background (swap for a real photo)
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # page composition
    ├── index.css                # Tailwind directives + base styles
    ├── data/
    │   └── navLinks.js          # nav menu items
    └── components/
        ├── TopBar.jsx            # gov identity strip (language, font size, contrast)
        ├── Header.jsx             # logo, brand, search, financial year selector
        ├── Navbar.jsx             # main navigation
        ├── Hero.jsx               # hero banner with CTA
        └── AshokaChakra.jsx       # reusable Ashoka Chakra SVG icon
```

## Getting started

```bash
npm install
npm run dev       # start dev server
npm run build      # production build
```

## Notes

- Swap `public/hero-red-fort.svg` for a real high-resolution photo (name it
  the same or update the reference in `src/components/Hero.jsx`).
- Colors (`navy`, `saffron`, `indiaGreen`) and fonts are defined as design
  tokens in `tailwind.config.js` — adjust there to re-theme the whole site.
- Sections referenced in the nav (Budget at a Glance, Explore Budget,
  Departments, AI Insights, Ask CivicLens) are stubbed as anchor targets in
  `App.jsx` — build each as its own component under `src/components/` and
  import it the same way `Hero` is.
