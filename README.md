# Wunschliste

Kürzel `WL` · Bauart `onion` (Domain-Driven Design mit Onion-Architektur)

Eine Wunschlisten-App fürs iPhone, gebaut als Progressive Web App ohne Apple-Developer-Account.
Das fachliche Konzept steht in `docs/agents/research/2026-09-28-wunschliste-konzept.md`.
Projektspezifische Einstellungen stehen in `.claude/projekt.md`, die offenen Aufgaben in
`docs/notes.txt`.

## Stack

TypeScript, Svelte 5, Vite, PWA auf GitHub Pages. Später Firebase (Firestore, Auth).

Qualitäts-Gate: Prettier, ESLint (inkl. Architektur-Grenzregeln), svelte-check, Vitest,
Playwright (WebKit, Profil „iPhone 15“) mit axe-core.

## Einmalige Einrichtung

```
npm install
npx playwright install webkit
```

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktionsbuild nach `dist/` |
| `npm run preview` | gebauten Stand lokal ausliefern |
| `npm run format` | Prettier schreibend |
| `npm run lint` | ESLint, svelte-check, Typprüfung der Konfiguration, Prettier-Prüfung |
| `npm test` | Architekturtest, Vitest, Playwright gegen den gebauten Stand |

## Veröffentlichung

Jeder Push auf `main` läuft durch `.github/workflows/deploy.yml`: Lint, Tests, Build und
danach das Deployment nach <https://burnywes.github.io/wunschliste/>. Ist eine Prüfung
rot, wird nichts veröffentlicht.

Einmalig im Repository einstellen: „Settings → Pages → Build and deployment → Source:
GitHub Actions“.

## App-Icon neu erzeugen

Quelle ist `public/icon.svg` (Lucide-Icon „gift“, ISC-Lizenz, <https://lucide.dev/icons/gift>).
Die PNG-Dateien und `favicon.ico` in `public/` werden einmalig erzeugt und eingecheckt.
Der Generator ist bewusst keine Abhängigkeit des Projekts. In einem Ordner außerhalb des
Repositorys:

```
npm init -y
npm install @vite-pwa/assets-generator@2
```

Dort eine `pwa-assets.config.mjs` anlegen. Sie ersetzt den weißen Rand des Presets für
`maskable` und `apple` durch Schwarz:

```js
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

const blackBackground = { background: '#000000' };

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: blackBackground },
    apple: { ...minimal2023Preset.apple, resizeOptions: blackBackground },
  },
  images: ['<Pfad zum Repository>/public/icon.svg'],
});
```

Dann `npx pwa-assets-generator --config pwa-assets.config.mjs`. Die Dateien landen neben
`icon.svg`.

## Architektur

```
src/
  app/          Kompositionswurzel: Einstieg, Router, Layout, Farbschema
  wishlist/     fachlicher Kontext
    domain/ application/ infrastructure/
```

Abhängigkeiten zeigen nach innen. `eslint.architecture.config.js` setzt das durch,
`tests/architecture.test.ts` sichert die Regel selbst ab.

## Arbeitsablauf

```
/rpi-research <Frage>       Bestehendes verstehen        -> docs/agents/research/
   |
/rpi-plan <Vorhaben>        Plan erstellen               -> docs/agents/plans/
   |
/rpi-implement <Plan>       Plan Phase für Phase umsetzen
   |
/commit                     Format, Lint, Tests, Architektur, Secrets -> Commit
```

Mit `/grill-me <Vorhaben>` lässt sich ein Entwurf vorher auf Herz und Nieren prüfen.

## Arbeitsweise

- **Sprache:** Gespräch und Dokumente auf Deutsch, Code und Commit-Nachrichten auf Englisch.
- **Architektur:** fachlicher Kontext vor Schicht, Abhängigkeiten zeigen nach innen.
- **Code:** so sprechend geschrieben, dass keine Kommentare nötig sind.
- **Tests:** `domain` und `application` werden test-getrieben entwickelt, ohne Framework.
- **Commits:** im Format `WL-NNN > type: subject`, nur wenn das Gate grün ist.
