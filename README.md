# Summerlight

Pflege-UI für das **illusion**-System. React/TypeScript/Vite SPA.

## Start

```bash
npm install
npm run dev   # http://localhost:5173
```

## Bereiche

| Route | Beschreibung |
|-------|--------------|
| `/ukeys` | UKeys erkunden — gemappt vs. ungemappt, filterbar nach SKU |
| `/configs` | Mapping-Regeln verwalten (CRUD, JSON-Import/Export, Re-Index) |
| `/editor` | Mapping-Config im Detail bearbeiten (Text, Image, Complex, Java-Code, Varianten) |
| `/templates` | HTML-Vorlagen und Seiten bearbeiten, Slot-Konfiguration, Visual Edit Mode |
| `/routing` | URL-Routing-Tabelle pflegen — Pfade auf Seiten mappen |
| `/quality` | Datenqualitäts-Dashboard — Vollständigkeit pro UKey |

## Template Editor — Visual Edit Mode

Im Edit Mode kann auf jedes gerenderte Feld geklickt werden:
- Klick öffnet UKey-Picker Modal
- UKey direkt austauschen — Vorlage wird automatisch gespeichert
- Unmapped UKeys können direkt als neues Mapping angelegt werden

## URL-Routing

Unter `/routing` lassen sich beliebige URL-Pfade auf Moonlight-Seiten mappen:

```
/ueber-uns        → CMS_PAGE     → cms-about
/produkte/{sku}   → PRODUCT_PAGE → stage-produktseite
```

Moonlight rendert die Seite unter:
```
http://localhost:8078/moonlight/{country}/{language}{url}
```

## Backends

| Service | URL | Beschreibung |
|---------|-----|--------------|
| illusion | http://localhost:8079/illusion | Mapping, Indexierung, Datenqualität |
| moonlight | http://localhost:8078/moonlight | Template-Rendering, Seiten, Vorlagen |


Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
