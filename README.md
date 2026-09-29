# Wunschliste

Kürzel `WL` · Bauart `onion` (Domain-Driven Design mit Onion-Architektur)

Eine Wunschlisten-App fürs iPhone, gebaut als Progressive Web App ohne Apple-Developer-Account.
Das fachliche Konzept steht in `docs/agents/research/2026-09-28-wunschliste-konzept.md`.
Projektspezifische Einstellungen stehen in `.claude/projekt.md`, die offenen Aufgaben in
`docs/notes.txt`.

## Stack

TypeScript, Svelte 5, Vite, PWA auf GitHub Pages, Firebase (Firestore, Auth).

Qualitäts-Gate: Prettier, ESLint (inkl. Architektur-Grenzregeln), svelte-check, Vitest,
Playwright (WebKit, Profil „iPhone 15“) mit axe-core. Integrations- und E2E-Tests laufen
gegen die Firebase-Emulatoren (Projekt `demo-wunschliste`).

## Einmalige Einrichtung

```
npm install
npx playwright install webkit
```

Die Firebase-Emulatoren brauchen Java 21 (etwa Temurin oder Corretto) im `PATH`. Beim
ersten Start laden sie sich selbst nach `~/.cache/firebase/emulators`.

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run dev:emulators` | Entwicklungsserver gegen die Firebase-Emulatoren |
| `npm run build` | Produktionsbuild nach `dist/`, bricht ohne Firebase-Konfiguration ab |
| `npm run build:e2e` | Build gegen die Emulatoren nach `dist-e2e/` |
| `npm run preview` | gebauten Stand lokal ausliefern |
| `npm run format` | Prettier schreibend |
| `npm run lint` | ESLint, svelte-check, Typprüfung der Konfiguration, Prettier-Prüfung |
| `npm run test:unit` | Vitest ohne Emulatoren, schnell |
| `npm run test:integration` | Regel- und Adaptertests gegen den Firestore-Emulator |
| `npm run test:e2e` | Playwright gegen `dist-e2e/` und die Emulatoren |
| `npm test` | Architekturtest, Unit-, Integrations- und E2E-Tests |

Ein bloßes `npx vitest` bzw. der Testlauf in der IDE startet auch die Integrationstests und
scheitert ohne laufenden Emulator. Für schnelle Läufe `npm run test:unit` nehmen.

## Veröffentlichung

Jeder Push auf `main` läuft durch `.github/workflows/deploy.yml`: Lint, Tests, Build und
danach das Deployment nach <https://burnywes.github.io/wunschliste/>. Ist eine Prüfung
rot, wird nichts veröffentlicht.

Einmalig im Repository einstellen: „Settings → Pages → Build and deployment → Source:
GitHub Actions“.

## Firebase einrichten

Einmalig, bevor der erste Stand mit Firebase auf `main` landet. Ohne die Actions-Variablen
bricht der Produktionsbuild absichtlich ab, und es wird nichts veröffentlicht.

1. In der [Firebase-Konsole](https://console.firebase.google.com/) ein Projekt anlegen,
   Google Analytics aus.
2. Firestore-Datenbank anlegen: Produktionsmodus, Region `europe-west3`.
3. Authentication → Anmeldeanbieter „E-Mail/Passwort“ aktivieren.
4. Authentication → Nutzer → das Familienkonto anlegen und seine UID kopieren.
5. Die UID in `firestore.rules` statt `FAMILY_ACCOUNT_UID` eintragen und committen.
6. Die Projekt-ID in `.firebaserc` eintragen (hier `wunschliste-92c07`).
7. `npx firebase login` und `npx firebase deploy --only firestore:rules`.
8. Projekteinstellungen → Web-App hinzufügen. Die Werte `apiKey`, `authDomain`,
   `projectId` und `appId` als Actions-Variablen hinterlegen („Settings → Secrets and
   variables → Actions → Variables“): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`. Dieselben Werte lokal in
   `.env.local` eintragen, damit `npm run build` auch lokal läuft.
9. In der installierten App einmal anmelden. Sie hat einen eigenen Speicher, getrennt von
   Safari.

Die Web-Konfiguration samt API-Key ist öffentlich und steht im ausgelieferten Code.
Geschützt wird über `firestore.rules`: Lesen und Schreiben darf nur die UID des
Familienkontos. Die UID ist kein Geheimnis
(<https://firebase.google.com/docs/projects/api-keys>).

### Umstieg auf Personen (WL-005)

Der Code ab WL-005 liest die Sammlung `persons`. Ohne passende Regel landet jedes Gerät
nach dem Anmelden bei „Die Daten konnten nicht geladen werden.“ Deshalb in dieser
Reihenfolge:

1. `npx firebase deploy --only firestore:rules`
2. **erst dann** auf `main` pushen
3. In der Firebase-Konsole die alten Dokumente in `wishlists` und `wishes` löschen. Sie
   haben keine Besitzerin und werden nicht mehr angezeigt.

### Umstieg auf Geheim-Einträge (WL-006)

Die Regeln bleiben unverändert. Wunsch-Dokumente haben ab WL-006 ein neues Format.
Nach dem Push deshalb in der Firebase-Konsole die alten Dokumente in `wishes` löschen. Sie
haben das neue Format nicht und werden nicht mehr angezeigt. Wunschlisten bleiben
erhalten.

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
  shared/
    ui/         fachfreie Bausteine: Knöpfe, Seitenkopf, Leiste, Dialog, Navigation
  wishlist/     fachlicher Kontext
    domain/ application/ infrastructure/
```

Abhängigkeiten zeigen nach innen. `shared/ui` kennt weder `app` noch fachliche Kontexte,
`domain` und `application` kennen `shared/ui` nicht. `eslint.architecture.config.js` setzt
das durch, `tests/architecture.test.ts` sichert die Regel selbst ab.

## Daten

Die Daten liegen in Firestore in den Sammlungen `persons`, `wishlists` und `wishes` und
gleichen sich live zwischen den Geräten ab. Jedes Gerät hält sie zusätzlich in einem Offline-Zwischenspeicher
(IndexedDB), damit die App ohne Netz bedienbar bleibt. Abmelden löscht diesen
Zwischenspeicher.

Personen werden in den Einstellungen angelegt, umbenannt und gelöscht. Eine Person mit
Wunschlisten lässt sich nicht löschen. Jede Wunschliste gehört genau einer Person (Feld
`ownerId`). Dokumente in `wishlists`
ohne gültige `ownerId` werden ignoriert.

Ein Wunsch trägt `createdBy` (wer ihn angelegt hat), `secret` (Geheim-Eintrag),
`giverId` (wer ihn schenkt), `received` (erhalten bzw. übergeben) und `removedByOwner`
(nur für die Besitzerin gelöscht). Wunschlisten tragen ebenfalls `removedByOwner`; fehlt
das Feld, gilt es als `false`. Dokumente in `wishes` ohne diese Felder werden ignoriert.

Die Geheimhaltung ist Ehrensache: Technisch kann jede Person mit dem Familienzugang alle
Daten lesen. Die App zeigt der Besitzerin nur nicht, was für sie geheim ist.

Welche Person ein Gerät benutzt („Wer bist du?“), steht nur auf dem Gerät in
`localStorage` unter `wunschliste.profile`. Abmelden entfernt es.

Die lokalen Daten aus Schritt 2 (`wunschliste.wishlists`, `wunschliste.wishes` in
`localStorage`) werden nicht übernommen und beim Start entfernt. Das gewählte Farbschema
(`wunschliste.colorScheme`) bleibt.

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
