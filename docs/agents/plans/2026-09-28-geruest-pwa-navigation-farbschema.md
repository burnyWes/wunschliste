---
date: 2026-09-28T07:49:53+00:00
git_commit: 03c10d66e58bc56344e1860f09b94dcdc50db6eb
branch: main
story: WL-001
topic: "Gerüst, PWA-Veröffentlichung, Navigation und Farbschema"
tags: [plan, scaffold, pwa, github-actions, navigation, color-scheme, accessibility]
status: done
---

# PLAN: WL-001 — Gerüst, PWA-Veröffentlichung, Navigation und Farbschema

Schritt 1 aus `docs/agents/research/2026-09-28-wunschliste-konzept.md`: ein lauffähiges,
auf GitHub Pages veröffentlichtes PWA-Gerüst mit Qualitäts-Gate, fixierter Navigation,
zwei Seiten und wählbarem Farbschema. Noch keine Daten, kein Firebase.

## Akzeptanzkriterien

- `npm install` und `npm test` laufen lokal grün: Architekturtest, Vitest und Playwright
  (WebKit, Profil „iPhone 15“) gegen den gebauten Stand.
- `npm run lint`, `npm run format` und `npm run build` funktionieren und stehen in
  `.claude/projekt.md`.
- Ein Import von `svelte` in eine `domain/`-Datei, ein Import von `application` in
  `domain` oder ein Import von `app` in den Kontext lässt den Architekturtest scheitern —
  durch einen Test belegt.
- Push auf `main` → GitHub Actions: Lint, Tests, Build → Deployment nach
  `https://burnywes.github.io/wunschliste/`. Rote Prüfungen verhindern das Deployment.
- Auf dem iPhone lässt sich die App über „Zum Home-Bildschirm“ als „Wunschliste“ mit
  Geschenk-Icon installieren, startet ohne Safari-Leiste und auch offline.
- Oben fixierte Navigation mit den Links „Wunschlisten“ und „⚙ Einstellungen“, die
  aktuelle Seite trägt `aria-current="page"`. Nach jedem Seitenwechsel liegt der Fokus auf
  der Überschrift der neuen Seite.
- Unbekannte Adressen landen auf „Wunschlisten“. Die Seite zeigt „Noch keine
  Wunschlisten.“
- Einstellungen: Radiogruppe „Farbschema“ mit Dunkel (Standard) / Hell / Invertiert im
  Checkbox-Look. Die Wahl bleibt nach Neustart erhalten und gilt ohne Aufblitzen ab dem
  ersten Bild.
- axe-core meldet auf beiden Seiten in allen drei Farbschemata keine Verstöße
  (WCAG 2.1 A/AA).

## Wesentliche Entscheidungen und Abwägungen

1. **Kompositionswurzel `src/app/`:** Einstieg, Router, Layout und Farbschema liegen
   außerhalb des fachlichen Kontexts.
   - Warum: Der Kontext `wishlist` bleibt rein fachlich.
   - Auswirkung: Die Grenzregel verbietet Importe aus `app` in allen Kontexten. `app`
     darf alles importieren. Das Konzept sah das Farbschema noch unter
     `wishlist/infrastructure/ui`; es wurde entsprechend nachgezogen.
2. **Volle Onion im Browser** statt der abgeschwächten Frontend-Variante aus
   `architecture/references/typescript.md`.
   - Warum: Es gibt kein Backend, die Fachregeln (geheim, schenken) leben im Client.
   - Auswirkung: `src/wishlist/{domain,application,infrastructure}`. In Schritt 1 existiert
     nur `infrastructure/ui`, leere Ordner werden nicht angelegt.
3. **Architekturtest per ESLint-Grenzregel im Testlauf** mit Whitelist-Prinzip.
   - Warum: Versteht `.svelte`, zeigt Verstöße im Editor, erfüllt die Erwartung des
     `commit`-Skills an den Testlauf.
   - Auswirkung: `eslint.architecture.config.js`, Skript `test:architecture`, ein
     Vitest-Absicherungstest über die ESLint-Node-API. In `domain` und `application` ist
     jeder nicht relative Import verboten, ausgenommen Testdateien (`vitest`).
4. **Playwright nur mit WebKit/„iPhone 15“ gegen `vite preview`.**
   - Warum: Die App läuft nur auf iOS, und getestet wird, was veröffentlicht wird,
     inklusive `base: '/wunschliste/'`.
   - Auswirkung: `npm test` enthält einen Build. Service Worker werden in Tests blockiert.
5. **Hash-Router im Eigenbau.**
   - Warum: GitHub Pages hat keine Umleitungen für Unterpfade, und es sind wenige Zeilen,
     die sich als reine Funktion testen lassen.
   - Auswirkung: `src/app/router/`. Routen `#/` (Wunschlisten) und `#/einstellungen`.
6. **TypeScript `~6.0` statt 7.**
   - Warum: typescript-eslint 8.70 verlangt `<6.1`, svelte-check 4.7 `^5 || ^6`.
   - Auswirkung: Version pinnen, Anhebung als Aufgabe in `docs/notes.txt` merken.
7. **Svelte-Warnungen sind Fehler** (`svelte-check --fail-on-warnings`).
   - Warum: Die Barrierefreiheits-Prüfungen des Svelte-Compilers waren der Grund für
     Svelte, und sie sollen das Gate auch wirklich rot machen.
   - Auswirkung: Teil von `npm run lint`.
8. **Navigation `position: sticky` statt `fixed`.**
   - Warum: Die Leiste darf mit Dynamic Type höher werden. `sticky` braucht keinen
     gemessenen Abstand für den Inhalt, `fixed` schon.
   - Auswirkung: Die Leiste bleibt beim Scrollen oben stehen, der Inhalt schiebt sich nie
     darunter.
9. **Radiobuttons: echtes `<input type="radio">`, visuell versteckt, daneben ein
   gestaltetes Kästchen.**
   - Warum: Pseudo-Elemente auf `appearance: none`-Inputs sind in WebKit unzuverlässig.
     Das versteckte Input behält Semantik, Fokus und Tastaturbedienung.
   - Auswirkung: `input:checked + .box` / `input:focus-visible + .box` steuern die Optik.
10. **Streifen hinter der iOS-Statusleiste bleibt in allen Schemata schwarz.**
    - Warum: `black-translucent` zeichnet Uhrzeit und Akku immer weiß und ist zur
      Laufzeit nicht änderbar. In Hell und Invertiert wäre die Statusleiste sonst
      unlesbar. Der Stil `default` würde dagegen das Standardschema Dunkel mit einem
      weißen Balken verschlechtern.
    - Auswirkung: Token `--color-status-bar` (immer `#000000`) als Hintergrund des
      Safe-Area-Bereichs oben in der Navigation.
11. **Farbschema-Speicherung pro Gerät in `localStorage`**, Schlüssel
    `wunschliste.colorScheme`, und ein Inline-Skript in `index.html` setzt
    `data-color-scheme` vor dem ersten Zeichnen.
    - Warum: Kein Aufblitzen, keine Synchronisation nötig.
    - Auswirkung: Ein ungültiger gespeicherter Wert fällt auf die Dunkel-Tokens von
      `:root` zurück.

## Ausgangslage

```
 C:\MW\Projekte\privat\Wunschliste         GitHub: burnyWes/wunschliste (öffentlich, main = 03c10d6)
 ├── .claude/            Template-Skills, projekt.md (Befehle „-“)
 ├── docs/
 │   ├── notes.txt
 │   └── agents/research/2026-09-28-wunschliste-konzept.md
 ├── .gitignore          nur .claude/settings.local.json
 └── README.md           „Der Stack ist noch offen“
```

- Kein `package.json`, kein Code.
- Lokal: Node 24.19, npm 11.17, Java 21. Keine GitHub-CLI.
- Untracked `.idea/` (IDE-Ordner).

## Zielbild

```
 .
 ├── .github/workflows/deploy.yml       prüfen → bauen → GitHub Pages
 ├── e2e/                               Playwright (WebKit/iPhone 15)
 │   ├── accessibility.spec.ts
 │   ├── navigation.spec.ts
 │   └── colorScheme.spec.ts
 ├── tests/
 │   └── architecture.test.ts           sichert die Grenzregel ab
 ├── public/
 │   ├── icon.svg                       Quelle des App-Icons
 │   ├── apple-touch-icon-180x180.png   ┐
 │   ├── pwa-64x64.png                  │
 │   ├── pwa-192x192.png                │ einmalig erzeugt,
 │   ├── pwa-512x512.png                │ eingecheckt
 │   ├── maskable-icon-512x512.png      │
 │   └── favicon.ico                    ┘
 ├── src/
 │   ├── main.ts
 │   ├── app/                           Kompositionswurzel
 │   │   ├── App.svelte
 │   │   ├── global.css
 │   │   ├── layout/MainNavigation.svelte
 │   │   ├── router/routes.ts (+ .test.ts)
 │   │   ├── router/currentRoute.svelte.ts
 │   │   ├── router/focusPageHeading.ts
 │   │   ├── settings/SettingsPage.svelte
 │   │   └── theme/
 │   │       ├── colorScheme.ts (+ .test.ts)
 │   │       ├── colorSchemeStorage.ts
 │   │       ├── colorSchemes.css
 │   │       └── ColorSchemeSettings.svelte
 │   └── wishlist/
 │       └── infrastructure/ui/WishlistsPage.svelte
 ├── index.html
 ├── vite.config.ts                     inkl. Vitest und PWA
 ├── playwright.config.ts
 ├── eslint.config.js
 ├── eslint.architecture.config.js
 ├── svelte.config.js
 ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
 ├── .prettierrc.json / .prettierignore
 ├── .nvmrc
 └── package.json
```

Abhängigkeitsrichtung (maschinell geprüft):

```
 app ──► wishlist/infrastructure ──► wishlist/application ──► wishlist/domain
  ▲              ▲                           ▲                      │
  └──── ✗ ───────┴──────────── ✗ ────────────┴──────── ✗ ───────────┘
 domain, application: nur relative Importe innerhalb der erlaubten Schichten
```

Oberfläche nach Phase 4:

```
 Wunschlisten (#/)                         Einstellungen (#/einstellungen)
 ┌────────────────────────────────────┐   ┌────────────────────────────────────┐
 │▓▓▓▓▓▓▓▓▓▓ iOS-Statusleiste ▓▓▓▓▓▓▓▓│   │▓▓▓▓▓▓▓▓▓▓ iOS-Statusleiste ▓▓▓▓▓▓▓▓│
 │ [Wunschlisten]    [⚙ Einstellungen]│   │ [Wunschlisten]    [⚙ Einstellungen]│
 ├────────────────────────────────────┤   ├────────────────────────────────────┤
 │ Wunschlisten                  (h1) │   │ Einstellungen                 (h1) │
 │                                    │   │                                    │
 │ Noch keine Wunschlisten.           │   │ Farbschema              (legend)   │
 │                                    │   │ Dunkel                     │  ✓    │
 │                                    │   │                            └────── │
 │                                    │   │ Hell                       │       │
 │                                    │   │                            └────── │
 │                                    │   │ Invertiert                 │       │
 │                                    │   │                            └────── │
 └────────────────────────────────────┘   └────────────────────────────────────┘
```

VoiceOver-Erwartung:
- Navigation: „Hauptnavigation, Navigation“ · „Wunschlisten, aktuelle Seite, Link“ ·
  „Einstellungen, Link“
- Radiogruppe: „Farbschema“ · „Dunkel, Optionsfeld, ausgewählt, 1 von 3“

Farbtokens (aus dem Konzept):

| Token | Dunkel | Hell | Invertiert |
|---|---|---|---|
| `--color-background` | `#000000` | `#FFFFFF` | `#FFFFFF` |
| `--color-text` | `#FFFFFF` | `#000000` | `#000000` |
| `--color-button` | `#002366` | `#002366` | `#FFDC99` |
| `--color-button-text` | `#FFFFFF` | `#FFFFFF` | `#000000` |
| `--color-button-border` | `#93C5FD` | `#000000` | `#6C3A02` |
| `--color-check` | `#22FF22` | `#15803D` | `#DD00DD` |
| `--color-outline` (Fokusrahmen, Linien der Kästchen) | `#FFFFFF` | `#000000` | `#000000` |
| `--color-status-bar` (Safe-Area-Streifen oben) | `#000000` | `#000000` | `#000000` |
| `color-scheme` (CSS) | `dark` | `light` | `light` |

## Abstraktionen und Wiederverwendung

Es gibt nichts Vorhandenes. Neu:

- `src/app/router/routes.ts`
  - `type Route = 'wishlists' | 'settings'`
  - `resolveRoute(hash: string): Route` — unbekannt → `'wishlists'`
  - `hashFor(route: Route): string` — `'#/'`, `'#/einstellungen'`
  - `pageTitleFor(route: Route): string` — „Wunschlisten“, „Einstellungen“
- `src/app/router/currentRoute.svelte.ts` — `$state` mit der aktuellen Route, hört auf
  `hashchange`, ersetzt nicht kanonische Hashes per `history.replaceState`, setzt
  `document.title` auf „<Seite> – Wunschliste“.
- `src/app/router/focusPageHeading.ts` — fokussiert nach einem Wechsel (nicht beim ersten
  Laden) das `h1` der Seite (`tabindex="-1"`).
- `src/app/theme/colorScheme.ts`
  - `type ColorScheme = 'dark' | 'light' | 'inverted'`
  - `DEFAULT_COLOR_SCHEME = 'dark'`
  - `COLOR_SCHEMES` samt deutscher Beschriftung („Dunkel“, „Hell“, „Invertiert“)
  - `parseColorScheme(stored: string | null): ColorScheme`
- `src/app/theme/colorSchemeStorage.ts` — `loadColorScheme()`, `saveColorScheme()`,
  `applyColorScheme()` (setzt `document.documentElement.dataset.colorScheme`).
  `localStorage`-Fehler fallen auf den Standard zurück.

## Logging und Beobachtbarkeit

Keine Logs. Die Beobachtbarkeit des Deployments kommt aus dem Actions-Lauf.

## Umsetzung

### Phase 1: Gerüst und Qualitäts-Gate

Abhängigkeiten: keine

Ein Svelte-5-Projekt, das „Wunschlisten“ anzeigt, und das vollständige Gate: Format,
Lint (ESLint, svelte-check), Architekturtest, Vitest, Playwright mit axe.

**Aufgaben**:
- [x] `package.json` anlegen (`"type": "module"`, `"private": true`,
      `"engines": { "node": ">=24" }`) mit Skripten:
  ```json
  {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "format": "prettier --write .",
    "lint": "eslint . && svelte-check --tsconfig ./tsconfig.app.json --fail-on-warnings && tsc -p tsconfig.node.json && prettier --check .",
    "test:architecture": "eslint --config eslint.architecture.config.js src",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test": "npm run test:architecture && npm run test:unit && npm run test:e2e"
  }
  ```
- [x] Abhängigkeiten installieren (aktuelle Versionen zum Planungszeitpunkt):
      `svelte@^5.57`, `@lucide/svelte`; dev: `vite@^8`, `@sveltejs/vite-plugin-svelte@^7`,
      `typescript@~6.0`, `svelte-check`, `vitest@^5`, `@playwright/test`,
      `@axe-core/playwright`, `eslint@^10`, `@eslint/js`, `typescript-eslint`,
      `eslint-plugin-svelte`, `globals`, `prettier`, `prettier-plugin-svelte`,
      `@types/node`
- [x] `npx playwright install webkit`
- [x] `.nvmrc` mit `24`
- [x] `.gitignore` ergänzen: `node_modules/`, `dist/`, `dev-dist/`, `test-results/`,
      `playwright-report/`, `.env.local`, `.idea/`
- [x] Getrennte TypeScript-Konfigurationen, weil TS 6 standardmäßig keine `types` mehr
      einbindet und Browser- und Node-Code verschiedene Umgebungen haben:
  - `tsconfig.json` — nur `references` auf die beiden folgenden, `files: []`
  - `tsconfig.app.json` — `src/**`; `strict`, `moduleResolution: "bundler"`,
    `module: "ESNext"`, `target: "ES2022"`, `verbatimModuleSyntax`, `noEmit`,
    `skipLibCheck`, `types: ["svelte", "vite/client"]`
  - `tsconfig.node.json` — `vite.config.ts`, `playwright.config.ts`, `svelte.config.js`,
    `eslint*.config.js`, `e2e/**`, `tests/**`; gleiche Strenge, `types: ["node"]`
  - `svelte-check` läuft mit `--tsconfig ./tsconfig.app.json`, die Node-Seite zusätzlich
    per `tsc -p tsconfig.node.json` im Lint-Skript
- [x] `svelte.config.js` mit `vitePreprocess()`
- [x] `vite.config.ts`: `defineConfig` aus **`vitest/config`** (sonst ist `test` unbekannt),
      `base: '/wunschliste/'`, `svelte()`, Vitest-Block
      (`include: ['src/**/*.test.ts', 'tests/**/*.test.ts']`, `environment: 'node'`)
- [x] `.prettierrc.json` (Plugin `prettier-plugin-svelte`) und `.prettierignore`:
      `dist`, `dev-dist`, `playwright-report`, `test-results`, `docs`, `.claude`,
      `*.md`, `package-lock.json`, `public/*.png`, `public/*.ico`.
      `docs/` und `.claude/` gehören dem Nutzer bzw. dem Template und werden nie
      umformatiert.
- [x] `eslint.architecture.config.js`: Parser-Einstellungen für `src/**/*.ts`
      (typescript-eslint) und `src/**/*.svelte` (eslint-plugin-svelte mit TS-Parser) sowie
      nur die Grenzregeln:
  ```js
  const nonRelativeImport = { regex: '^[^.]', message: 'Only relative imports inside this layer.' };
  const outwardTo = (...layers) => ({
    regex: `(^|/)(${layers.join('|')})(/|$)`,
    message: `Must not depend on ${layers.join(', ')}.`,
  });
  const restrictImports = (...patterns) => ({
    'no-restricted-imports': ['error', { patterns }],
  });

  export default [
    ...sourceParserSetup,
    {
      files: ['src/wishlist/**/*.{ts,svelte}'],
      rules: restrictImports(outwardTo('app')),
    },
    {
      files: ['src/**/application/**/*.{ts,svelte}'],
      rules: restrictImports(nonRelativeImport, outwardTo('infrastructure', 'app')),
    },
    {
      files: ['src/**/application/**/*.test.ts'],
      rules: restrictImports(outwardTo('infrastructure', 'app')),
    },
    {
      files: ['src/**/domain/**/*.{ts,svelte}'],
      rules: restrictImports(nonRelativeImport, outwardTo('application', 'infrastructure', 'app')),
    },
    {
      files: ['src/**/domain/**/*.test.ts'],
      rules: restrictImports(outwardTo('application', 'infrastructure', 'app')),
    },
  ];
  ```
  **Reihenfolge ist tragend:** Im Flat Config ersetzt ein späteres Objekt die Optionen
  derselben Regel vollständig, statt sie zusammenzuführen. Deshalb steht das allgemeinste
  Objekt zuerst, und jedes spezifischere wiederholt die vollständige Liste inklusive
  `'app'`. Testdateien dürfen Pakete (`vitest`) importieren, aber keine äußeren Schichten.
  `sourceParserSetup` setzt **kein** `projectService`/`project`, damit `lintText` mit
  nicht existierenden Pfaden funktioniert.
- [x] `eslint.config.js`: `@eslint/js` recommended, `typescript-eslint` recommended,
      `eslint-plugin-svelte` recommended (mit TS-Parser für `<script lang="ts">`),
      `globals.browser`, Ignores für `dist`, `dev-dist`, `playwright-report`,
      `test-results`. Die Architektur-Konfiguration wird eingebunden
      (`...architectureConfig`).
- [x] `tests/architecture.test.ts` (Vitest, ESLint-Node-API mit
      `overrideConfigFile: 'eslint.architecture.config.js'` und `lintText(code, { filePath })`).
      Ausgewertet werden nur Meldungen mit `ruleId === 'no-restricted-imports'`. Zusätzlich
      muss jedes Ergebnis `fatalErrorCount === 0` und `warningCount === 0` haben, sonst
      wären „0 Fehler“-Fälle durch ignorierte oder nicht geparste Dateien falsch grün.
  - `domain` importiert `svelte` → 1 Verstoß
  - `domain` importiert `../application/useCase` → 1 Verstoß
  - `application` importiert `../infrastructure/adapter` → 1 Verstoß
  - `wishlist/infrastructure/ui/X.svelte` importiert `../../../app/App.svelte` → 1 Verstoß
  - `wishlist/domain/wish.ts` importiert `../../app/App.svelte` → 1 Verstoß
  - `domain/wish.test.ts` importiert `../application/useCase` → 1 Verstoß
  - `domain` importiert `./wish` → 0 Verstöße
  - `infrastructure` importiert `svelte` → 0 Verstöße
  - `domain/wish.test.ts` importiert `vitest` → 0 Verstöße
- [x] `index.html`: `lang="de"`, `<title>Wunschliste</title>`,
      `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
      `<div id="app"></div>`, Skript `/src/main.ts`
- [x] `src/main.ts`: `mount(App, { target: requireAppRoot() })` mit einer benannten
      Funktion `requireAppRoot()`, die bei fehlendem `#app` einen sprechenden Fehler wirft
      (kein `!`)
- [x] `src/app/App.svelte` bindet `WishlistsPage` ein
- [x] `src/wishlist/infrastructure/ui/WishlistsPage.svelte`:
      `<h1 tabindex="-1">Wunschlisten</h1>` und `<p>Noch keine Wunschlisten.</p>`
- [x] `playwright.config.ts`: `testDir: 'e2e'`,
      `projects: [{ name: 'iphone-webkit', use: { ...devices['iPhone 15'] } }]`,
      `use: { baseURL: 'http://localhost:4173/wunschliste/', serviceWorkers: 'block' }`,
      `webServer: { command: 'npm run build && npm run preview -- --port 4173 --strictPort', url: 'http://localhost:4173/wunschliste/', reuseExistingServer: false, timeout: 120_000 }`.
      `reuseExistingServer: false`, damit das Commit-Gate nie gegen einen veralteten Build
      eines noch laufenden Preview-Servers testet.
- [x] **Alle Specs navigieren relativ zur `baseURL`**: `page.goto('./')`,
      `page.goto('./#/einstellungen')`, `request.get('manifest.webmanifest')` — nie mit
      führendem `/`, sonst landet der Aufruf auf `http://localhost:4173/` (404).
- [x] `e2e/accessibility.spec.ts`: Startseite zeigt Überschrift „Wunschlisten“, axe
      (`withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])`) ohne Verstöße
- [x] `.claude/projekt.md` Befehle setzen (Stack und Kontext `wishlist` sind bereits
      eingetragen):
  ```
  Test:    npm test
  Lint:    npm run lint
  Format:  npm run format
  Build:   npm run build
  ```
- [x] `README.md`: Stack, Befehle, einmalige Einrichtung (`npm install`,
      `npx playwright install webkit`), Hinweis auf das Konzeptdokument
- [x] `docs/notes.txt` unter TODO anhängen:
      `- TypeScript auf 7 anheben, sobald typescript-eslint und svelte-check es unterstützen`

**Automatisierte Verifikation**:
- [x] `npm run format` ändert nichts mehr bei einem zweiten Lauf
- [x] `npm run lint` grün (ESLint, svelte-check ohne Warnungen, Prettier)
- [x] `npm run test:architecture` grün
- [x] `npm run test:unit` grün, `tests/architecture.test.ts` mit allen 9 Fällen
- [x] `npm run test:e2e` grün
- [x] `npm test` grün

### Phase 2: PWA und Veröffentlichung

Abhängigkeiten: Phase 1

Die App wird installierbar, offline startfähig und bei jedem grünen Push auf `main`
veröffentlicht.

**Aufgaben**:
- [x] `public/icon.svg`: Lucide-Icon „gift“ (ISC-Lizenz), Strich `#2563EB`, auf
      schwarzem, quadratischem Hintergrund, **ohne** eigenen Innenabstand (den setzt der
      Generator)
- [x] Icons einmalig erzeugen und einchecken. Der Preset `minimal-2023` legt für
      `maskable` und `apple` einen **weißen** Rand an (`padding: 0.3`,
      `background: 'white'`). Deshalb eine temporäre Konfiguration in der Sandbox
      (Scratchpad, nicht im Repo) mit `preset: { ...minimal2023Preset, maskable: { ..., resizeOptions: { background: '#000000' } }, apple: { ..., resizeOptions: { background: '#000000' } } }`
      und Aufruf per `npx @vite-pwa/assets-generator@2 --config <temp-config> public/icon.svg`.
      Ergebnis: `favicon.ico`, `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`,
      `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`. Das Paket wird nicht
      als Abhängigkeit aufgenommen. Der Aufruf wird im README unter „App-Icon neu
      erzeugen“ dokumentiert.
- [x] `vite-plugin-pwa` als Dev-Abhängigkeit, in `vite.config.ts`:
  ```ts
  VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
    manifest: {
      name: 'Wunschliste',
      short_name: 'Wunschliste',
      lang: 'de',
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#000000',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'] },
  })
  ```
- [x] `index.html` ergänzen:
      `<meta name="mobile-web-app-capable" content="yes">`,
      `<meta name="apple-mobile-web-app-capable" content="yes">`,
      `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
      `<meta name="apple-mobile-web-app-title" content="Wunschliste">`,
      `<link rel="apple-touch-icon" href="apple-touch-icon-180x180.png">`,
      `<link rel="icon" href="favicon.ico">`
- [x] `src/app/global.css`, Import in `main.ts`:
  - `html { font-family: system-ui, sans-serif; font: -apple-system-body; }` — die
    Kurzform nur auf `html`, damit `rem` mit Dynamic Type wächst. Alle Größen in `rem`/`em`.
  - `body` mit Safe-Area-Abständen auf **allen vier** Seiten
    (`env(safe-area-inset-*)`), weil `black-translucent` den Inhalt unter die
    Statusleiste zieht. Phase 3 verlegt den oberen Abstand in die Navigation.
  - schwarzer Hintergrund, weiße Schrift
- [x] `.github/workflows/deploy.yml`:
  ```yaml
  on:
    push: { branches: [main] }
    pull_request:
    workflow_dispatch:
  permissions: { contents: read }
  jobs:
    check:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v7
        - uses: actions/setup-node@v7
          with: { node-version-file: .nvmrc, cache: npm }
        - run: npm ci
        - run: npx playwright install --with-deps webkit
        - run: npm run lint
        - run: npm test
        - uses: actions/upload-pages-artifact@v5
          if: github.ref == 'refs/heads/main'
          with: { path: dist }
    deploy:
      needs: check
      if: github.ref == 'refs/heads/main'
      runs-on: ubuntu-latest
      permissions: { pages: write, id-token: write }
      concurrency: { group: pages, cancel-in-progress: false }
      environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
      steps:
        - id: deployment
          uses: actions/deploy-pages@v5
  ```
  `npm test` baut über den Playwright-`webServer` bereits `dist/`, es gibt keinen
  zweiten Build. `concurrency` hängt nur am `deploy`-Job, damit ein Pull-Request-Lauf
  nie einen wartenden Deploy auf `main` verdrängt.
- [x] `e2e/pwa.spec.ts`: `manifest.webmanifest` wird ausgeliefert und enthält
      `name: 'Wunschliste'`, `display: 'standalone'`; `apple-touch-icon-180x180.png`
      liefert Status 200
- [x] `README.md`: Veröffentlichungs-URL und einmalige Einstellung
      „Settings → Pages → Build and deployment → Source: GitHub Actions“

**Automatisierte Verifikation**:
- [x] `npm run build` erzeugt `dist/manifest.webmanifest` und `dist/sw.js`
- [x] `npm run lint` grün
- [x] `npm test` grün inklusive `e2e/pwa.spec.ts`

**Manuelle Verifikation**:
- [x] Nutzer stellt in GitHub „Settings → Pages → Source“ auf „GitHub Actions“
- [x] Nach ausdrücklicher Push-Anweisung: Actions-Lauf auf `main` grün, Deployment-Job
      veröffentlicht `https://burnywes.github.io/wunschliste/`
- [x] iPhone, Safari: Seite öffnen → Teilen → „Zum Home-Bildschirm“ → Name „Wunschliste“
      und Geschenk-Icon werden angeboten
- [x] Vom Home-Bildschirm gestartet: keine Safari-Leiste, die Statusleiste liegt über
      schwarzem Hintergrund, die Überschrift wird nicht von Notch/Dynamic Island verdeckt
- [x] Flugmodus an, App neu starten: „Wunschlisten“ erscheint trotzdem
- [x] VoiceOver an: „Wunschlisten, Überschrift“ und „Noch keine Wunschlisten.“ werden
      vorgelesen

### Phase 3: Navigation und Seiten

Abhängigkeiten: Phase 1

Fixierte Hauptnavigation, Hash-Router, zwei Seiten, Fokus- und Titelverwaltung.

**Aufgaben**:
- [x] `src/app/router/routes.test.ts` zuerst (TDD):
  - `resolveRoute('')` → `'wishlists'`
  - `resolveRoute('#/')` → `'wishlists'`
  - `resolveRoute('#/einstellungen')` → `'settings'`
  - `resolveRoute('#/quatsch')` → `'wishlists'`
  - `hashFor('settings')` → `'#/einstellungen'`, `hashFor('wishlists')` → `'#/'`
  - `pageTitleFor('settings')` → `'Einstellungen'`
- [x] `src/app/router/routes.ts` implementieren
- [x] `src/app/router/currentRoute.svelte.ts`: Klasse oder Modul mit `$state`, startet
      mit `resolveRoute(location.hash)`, hört auf `hashchange`. Ist
      `location.hash !== hashFor(route)`, ersetzt es den Hash per
      `history.replaceState` (kein zusätzlicher Verlaufseintrag). Setzt
      `document.title = \`${pageTitleFor(route)} – Wunschliste\``.
- [x] `src/app/router/focusPageHeading.ts`: fokussiert nach `tick()` das `main h1` —
      **nur wenn sich die Route tatsächlich geändert hat**. Nicht beim ersten Laden und
      nicht, wenn eine Umleitung (`#/quatsch` → `#/`) auf derselben Seite bleibt. Das
      `h1` erhält beim programmatischen Fokus keinen sichtbaren Rahmen
      (`h1:focus:not(:focus-visible) { outline: none }`), VoiceOver setzt seinen eigenen.
      `replaceState` löst kein `hashchange` aus, eine Umleitungsschleife ist damit
      ausgeschlossen.
- [x] `src/app/layout/MainNavigation.svelte`:
  ```svelte
  <nav aria-label="Hauptnavigation">
    <a href="#/" aria-current={route === 'wishlists' ? 'page' : undefined}>Wunschlisten</a>
    <a href="#/einstellungen" aria-current={route === 'settings' ? 'page' : undefined}>
      <Settings aria-hidden="true" /> Einstellungen
    </a>
  </nav>
  ```
  Links als Knöpfe gestaltet (mittelblau, weiße Schrift, heller Rand), aktuelle Seite
  zusätzlich deutlich hervorgehoben (nicht nur per Farbe, z. B. unterstrichen),
  Trefferfläche mindestens 44 × 44 px. Leiste `position: sticky; top: 0` mit
  `padding-top: env(safe-area-inset-top)`, darf umbrechen und mitwachsen. Der obere
  Safe-Area-Abstand wandert dafür aus `body` (Phase 2) in die Leiste.
- [x] `src/app/settings/SettingsPage.svelte`: `<h1 tabindex="-1">Einstellungen</h1>`
- [x] `src/app/App.svelte`: `<MainNavigation>` im `<header>`, darunter
      `<main>` mit der Seite zur aktuellen Route
- [x] Sichtbarer Fokusrahmen für Links und Bedienelemente (`:focus-visible`)
- [x] `e2e/navigation.spec.ts`:
  - Start → „Wunschlisten“-Link hat `aria-current="page"`, Titel „Wunschlisten – Wunschliste“,
    das h1 ist **nicht** fokussiert
  - Klick auf „Einstellungen“ → URL endet auf `#/einstellungen`, h1 „Einstellungen“ ist
    fokussiert, Link hat `aria-current="page"`
  - Zurück (`page.goBack()`) → h1 „Wunschlisten“ fokussiert
  - `#/quatsch` aufrufen → URL endet auf `#/`, h1 „Wunschlisten“
  - Nach dem Scrollen (künstlich hoher Inhalt per `page.evaluate`) ist die Navigation
    noch im Viewport
- [x] `e2e/accessibility.spec.ts` um die Einstellungsseite erweitern

**Automatisierte Verifikation**:
- [x] `npm run test:unit` grün inklusive `routes.test.ts`
- [x] `npm run lint` grün
- [x] `npm test` grün inklusive `navigation.spec.ts`

**Manuelle Verifikation**:
- [x] iPhone mit VoiceOver: „Hauptnavigation“, „Wunschlisten, aktuelle Seite, Link“ und
      „Einstellungen, Link“ werden vorgelesen. Nach dem Tippen auf „Einstellungen“ liest
      VoiceOver sofort „Einstellungen, Überschrift“.
- [x] iOS-Textgröße auf das Maximum (Bedienungshilfen → Größerer Text): Die Navigation
      bricht um und wird höher, nichts wird abgeschnitten oder verdeckt

### Phase 4: Farbschema

Abhängigkeiten: Phase 2 (`global.css`, Safe-Area), Phase 3 (Navigation, Einstellungsseite)

Drei Farbschemata als CSS-Variablen, auswählbar per Radiogruppe im Checkbox-Look,
gespeichert pro Gerät, ab dem ersten Bild aktiv.

**Aufgaben**:
- [x] `src/app/theme/colorScheme.test.ts` zuerst (TDD):
  - `parseColorScheme(null)` → `'dark'`
  - `parseColorScheme('light')` → `'light'`, `'inverted'` → `'inverted'`
  - `parseColorScheme('purple')` → `'dark'`
  - `COLOR_SCHEMES` enthält genau Dunkel, Hell, Invertiert in dieser Reihenfolge
- [x] `src/app/theme/colorScheme.ts` implementieren
- [x] `src/app/theme/colorSchemeStorage.ts`: `loadColorScheme`, `saveColorScheme`,
      `applyColorScheme` (Schlüssel `wunschliste.colorScheme`, Fehler beim Zugriff auf
      `localStorage` → Standard bzw. stilles Nichtspeichern)
- [x] `src/app/theme/colorSchemes.css`: Tokens laut Tabelle im Zielbild, `:root` trägt
      Dunkel, dazu `[data-color-scheme='light']` und `[data-color-scheme='inverted']`.
      `global.css` und `MainNavigation` nutzen nur noch die Tokens.
- [x] `index.html`: Inline-Skript im `<head>` vor jedem Stylesheet:
  ```html
  <script>
    try {
      document.documentElement.dataset.colorScheme =
        localStorage.getItem('wunschliste.colorScheme') ?? 'dark';
    } catch {
      document.documentElement.dataset.colorScheme = 'dark';
    }
  </script>
  ```
  Der Schlüssel ist doppelt vorhanden (Skript und `colorSchemeStorage.ts`). Ein
  Playwright-Test hält beide zusammen (siehe unten).
- [x] `src/app/theme/ColorSchemeSettings.svelte`:
  ```svelte
  <fieldset>
    <legend>Farbschema</legend>
    {#each COLOR_SCHEMES as scheme (scheme.value)}
      <label class="option">
        <span>{scheme.label}</span>
        <input class="visually-hidden" type="radio" name="color-scheme"
               value={scheme.value} bind:group={selected} />
        <span class="box" aria-hidden="true"></span>
      </label>
    {/each}
  </fieldset>
  ```
  Beschriftung links, Kästchen rechts. `.box`: nur linke und untere Linie
  (`border-left`, `border-bottom`) in `--color-outline` (21 : 1 zum Hintergrund, erfüllt
  WCAG 1.4.11, das axe nicht prüft), bei `input:checked + .box` ein großer Haken in
  `--color-check` (SVG-Haken, `aria-hidden`), bei `input:focus-visible + .box` ein
  deutlicher Fokusrahmen. Die ganze Zeile ist Trefferfläche, mindestens 44 px hoch.
  Änderung → `saveColorScheme` + `applyColorScheme`.
- [x] `SettingsPage.svelte` bindet `ColorSchemeSettings` ein
- [x] `e2e/colorScheme.spec.ts`:
  - Standard: „Dunkel“ ausgewählt, `html[data-color-scheme='dark']`, Hintergrund von
    `body` ist `rgb(0, 0, 0)`
  - „Hell“ wählen → Hintergrund `rgb(255, 255, 255)`; nach `page.reload()` weiterhin „Hell“
    ausgewählt
  - Inline-Skript wirkt ohne App: `localStorage` auf `light` setzen, das App-Bundle per
    `page.route('**/assets/*.js', route => route.abort())` blockieren, Seite laden →
    `html[data-color-scheme='light']` ist trotzdem gesetzt. Das belegt „vor dem ersten
    Zeichnen“ und hält den doppelt vorhandenen Speicherschlüssel zusammen.
  - „Invertiert“ wählen → Button-Hintergrund der Navigation ist `rgb(218, 156, 20)`
  - In „Hell“ und „Invertiert“ hat der Safe-Area-Streifen der Navigation den
    Hintergrund `rgb(0, 0, 0)` (geprüft über das Element, das `--color-status-bar` trägt)
  - Radiogruppe ist per Tastatur bedienbar (Pfeiltaste wechselt die Auswahl)
- [x] `e2e/accessibility.spec.ts`: beide Seiten × drei Farbschemata ohne axe-Verstöße
      (Schema per `localStorage` in `addInitScript` setzen)

**Automatisierte Verifikation**:
- [x] `npm run test:unit` grün inklusive `colorScheme.test.ts`
- [x] `npm run lint` grün
- [x] `npm test` grün inklusive `colorScheme.spec.ts` und aller sechs axe-Kombinationen

**Manuelle Verifikation**:
- [x] iPhone mit VoiceOver auf „Einstellungen“: „Farbschema“, dann „Dunkel, Optionsfeld,
      ausgewählt, 1 von 3“. Doppeltippen auf „Hell“ schaltet sofort um.
- [x] In „Hell“ und „Invertiert“: Uhrzeit und Akku in der Statusleiste sind weiß auf
      schwarzem Streifen lesbar
- [x] App schließen und vom Home-Bildschirm neu starten: Das gewählte Schema gilt sofort,
      ohne kurzes schwarzes Aufblitzen
- [x] Optik der Radiobuttons: nur linke und untere Linie, großer Haken in Leuchtgrün
      (Dunkel), Sattgrün (Hell) bzw. Magenta (Invertiert)

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: `tsconfig.app.json` braucht `allowJs`/`checkJs`. svelte-check übersetzt Komponenten ohne `<script lang="ts">` als JavaScript, sonst meldet es beim Import „implicitly has an any type“.
- Phase 1: Die Architektur-Konfiguration nutzt `defineConfig` aus `eslint/config` und schreibt die Regelobjekte je Block aus, statt sie per Hilfsfunktion zu bauen. Nur so typisiert `tsc -p tsconfig.node.json` das JS ohne JSDoc-Kommentare. Die Reihenfolge und vollständige Wiederholung der Muster bleiben wie geplant.
- Phase 1: `tests/architecture.test.ts` hüllt den Import bei `.svelte`-Pfaden in einen `<script lang="ts">`-Block, sonst wäre er Markup.
- Phase 2: Die Generator-Konfiguration übernimmt `resizeOptions` des Presets per Spread. `minimal2023Preset` bringt für `maskable`/`apple` keine eigenen `resizeOptions` mit, die Standardwerte (Innenabstand 0.3) greifen weiter, nur der Hintergrund wird schwarz.
- Phase 3: Sticky ist der `<header>` in `App.svelte`. Er enthält den Safe-Area-Streifen (`.status-bar-backdrop`) und darunter `MainNavigation`. `CurrentRoute` ruft `focusPageHeading` selbst auf, wenn ein `hashchange` die Seite wirklich wechselt. `tsconfig.node.json` bindet `DOM` ein, weil die Callbacks von `page.evaluate` im Browser laufen.
- Phase 4: `ColorSchemeSettings` nutzt `checked` + `onchange` statt `bind:group`. So ist eindeutig, dass Speichern und Anwenden erst nach der Auswahl laufen. Der Haken ist Lucide `Check` (Strichstärke 4). Die E2E-Tests wählen ein Schema durch Tippen auf die Zeile (`label`), wie ein Mensch es tut. Das visuell versteckte Input liegt unter der Beschriftung und ist nicht direkt klickbar. `saveColorScheme` trägt einen Warum-Kommentar mit MDN-Quelle, weil ESLint leere `catch`-Blöcke verbietet.
- Manuelle Prüfung auf dem iPhone bestanden. Rückmeldung: Die blaue Buttonfläche muss dunkler sein. `--color-button` in Dunkel und Hell daher `#1D4ED8` statt `#2563EB` (weiße Schrift 6,7 : 1 statt 5,2 : 1). Der Strich des App-Icons bleibt `#2563EB`.
- Auch `#1D4ED8` war auf dem iPhone zu hell. Gewünscht: Königs- bzw. Mitternachtsblau. `--color-button` in Dunkel und Hell ist jetzt `#002366` (traditionelles Königsblau, weiße Schrift 14,4 : 1). Der Buttonrand im Hell-Schema wird `#000000`, weil das bisherige `#1E3A8A` sich kaum von der neuen Fläche abhob.
- Rückmeldung nach Königsblau: Invertiert war nicht mitgezogen. Die Werte von Invertiert sind die exakte Umkehrung von Dunkel, daher `--color-button` dort `#FFDC99` (Umkehrung von `#002366`). Navigation geändert: Die aktive Seite ist mit `--color-button` gefüllt und nicht mehr unterstrichen, die nicht aktive Seite mit `--color-background` (Dunkel schwarz, Hell und Invertiert weiß) und `--color-text`. Der Rand bleibt bei beiden.
- Abnahme: Farben und Navigation auf dem iPhone vom Nutzer bestätigt. WL-001 abgeschlossen.

## Verweise

- Konzept: `docs/agents/research/2026-09-28-wunschliste-konzept.md`
- Architektur: `.claude/skills/architecture/SKILL.md`,
  `.claude/skills/architecture/references/typescript.md`
- Gate: `.claude/skills/commit/SKILL.md`
- vite-plugin-pwa: https://vite-pwa-org.netlify.app/
- @vite-pwa/assets-generator: https://vite-pwa-org.netlify.app/assets-generator/
- ESLint `no-restricted-imports` (`regex`-Option): https://eslint.org/docs/latest/rules/no-restricted-imports
- Playwright-Geräteprofile: https://playwright.dev/docs/emulation
- axe-core Playwright: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright
- GitHub Pages per Actions: https://docs.github.com/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Lucide „gift“ (ISC): https://lucide.dev/icons/gift
