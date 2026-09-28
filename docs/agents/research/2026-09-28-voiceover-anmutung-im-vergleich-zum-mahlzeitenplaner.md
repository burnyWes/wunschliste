---
date: 2026-09-28T11:57:49+00:00
git_commit: 15f72d0fa59d97ffb260379c810e04a1b36db179
branch: main
topic: "Warum liest VoiceOver „Wunschliste erstellen, Link“, im Mahlzeitenplaner aber „Artikel hinzufügen, Taste“? Sind die Unterschiede Kleinigkeiten oder eine Frage des Tech-Stacks?"
tags: [research, codebase, voiceover, barrierefreiheit, navigation, router, pwa, vergleich-mahlzeitenplaner]
status: complete
---

# Untersuchung: VoiceOver-Anmutung der Wunschliste im Vergleich zum Mahlzeitenplaner

## Fragestellung

Die App fühlt sich noch nicht rund an. Beispiel: Der Knopf „Wunschliste erstellen“ wird
mit VoiceOver als „Wunschliste erstellen, Link“ vorgelesen. Im Schwesterprojekt
`..\Mahlzeitenplaner` (ebenfalls eine Webapp, die als iOS-App gedacht ist) liest VoiceOver
zum Beispiel „Artikel hinzufügen, Taste“. Welche Unterschiede gibt es zwischen beiden
Apps? Handelt es sich um Kleinigkeiten wie Benennungen und Alternativtexte, oder betrifft
es den Tech-Stack? Der Mahlzeitenplaner ist dabei der Maßstab.

Verglichen wurden die Wunschliste bei `15f72d0` und der Mahlzeitenplaner bei `5de21a6`.

## Zusammenfassung

- **Woher „Link“ bzw. „Taste“ kommt.** VoiceOver sagt die Rolle des HTML-Elements an.
  - In der Wunschliste ist „Wunschliste erstellen“ ein `<a href="#/liste/neu">` mit der
    Klasse `.button` (`src/wishlist/infrastructure/ui/WishlistsPage.svelte:20`). Das
    Element sieht aus wie ein Knopf, ist aber ein Link.
  - Im Mahlzeitenplaner ist „Artikel hinzufügen“ ein `<button type="button">`
    (`src/shopping/ui/ShoppingListPage.tsx:57-64`).
- **Beide Varianten sind bewusst so entworfen.**
  - Im Wunschliste-Plan steht die Erwartung „Wunschlisten, aktuelle Seite, **Link**“
    ausdrücklich (`docs/agents/plans/2026-09-28-geruest-pwa-navigation-farbschema.md:192-194`).
  - Im Mahlzeitenplaner-Plan steht „Artikel hinzufuegen, **Taste**“
    (`docs/agents/plans/2026-09-14-einkaufsliste-pwa-mit-firestore-sync.md:191-194`).
- **Der Unterschied hat seine Wurzel im Navigationsmodell, nicht im Framework.**
  - Die Wunschliste hat einen selbstgebauten **Hash-Router**. Jede Seite hat eine
    Adresse, der Browserverlauf wird geführt, und Seitenwechsel sind `<a href>`-Links.
  - Der Mahlzeitenplaner hat **keinen Router**. Ansichten wechseln über React-State,
    jeder Wechsel ist ein `<button onClick>`. In `src/` gibt es kein einziges `<a>`.
- **Der Tech-Stack unterscheidet sich nur beim UI-Framework.**
  - Beide: Vite, TypeScript, `vite-plugin-pwa`, `display: 'standalone'`, System-Schrift
    und eine gleichartige Handhabung der Safe Areas.
  - Svelte 5 bzw. React 19 bestimmt nicht, ob ein Element `<a>` oder `<button>` ist.
    Das legt allein das Markup fest.
  - Dasselbe gilt für alle anderen gefundenen Unterschiede (Tab-Leiste mit Icons,
    fixierte untere Leiste, Ansagen, Fokusführung, Dialoge). Keiner davon hängt an einer
    Framework-Eigenschaft.
- **Weitere Unterschiede neben dem Element-Typ.** Die Liste unten sammelt, was außerdem
  zur „nativeren“ Anmutung beitragen kann. Jeder Punkt hat seine Fundstelle.

```
Wunschliste (Svelte 5)                      Mahlzeitenplaner (React 19)
─────────────────────────                   ───────────────────────────
location.hash  ──►  CurrentRoute            useState(activeArea / page)
     ▲                   │                        ▲              │
     │ <a href="#/…">    ▼                        │ <button      ▼
     │ goBack()     {#key pageKey}                │  onClick>   if-Kaskade
     │ replaceWith  Seite mounten                 │             Area/Seite
     └── history.back / location.replace          └── setState(...)
VoiceOver: „…, Link“                        VoiceOver: „…, Taste“
Zurück-Wischen / Browserverlauf aktiv       Eine Adresse, kein Verlauf
```

### Zentrale Dateien

```
Wunschliste/
├── index.html
├── vite.config.ts
├── docs/agents/plans/2026-09-28-geruest-pwa-navigation-farbschema.md
└── src/
    ├── app/
    │   ├── App.svelte                     header / main / {#key pageKey}
    │   ├── global.css
    │   ├── layout/MainNavigation.svelte   <nav> mit zwei <a class="button">
    │   └── router/{routes.ts, currentRoute.svelte.ts}
    ├── shared/ui/
    │   ├── buttons.css                    .button für <a> und <button>
    │   ├── PageHeader.svelte              Zurück-Link, h1, actions-Snippet
    │   ├── ActionBar.svelte               sticky untere Leiste
    │   ├── ConfirmDialog.svelte           natives <dialog>
    │   ├── navigation.ts                  goBack / replaceWith / History-Marker
    │   ├── pageFocus.ts, pageTitle.ts
    └── wishlist/infrastructure/ui/*.svelte

Mahlzeitenplaner/
├── index.html
├── vite.config.ts
├── docs/agents/plans/2026-09-14-einkaufsliste-pwa-mit-firestore-sync.md   (Entscheidung 5: kein Router)
├── docs/agents/plans/2026-09-15-gerichteseite-und-navigationsleiste.md    (nav mit Knöpfen)
└── src/
    ├── App.tsx, SignedInApp.tsx           State-Weiche über Bereiche
    ├── index.css                          einzige globale CSS-Datei
    ├── shared/ui/
    │   ├── NavigationBar.tsx              <nav> mit Icon-<button>s, aria-current
    │   ├── BottomBar.tsx                  fixierte untere Leiste, weicht der Tastatur
    │   ├── useHeadingFocus.ts, useFocusAfterRemoval.ts
    │   ├── Announcer.tsx                  role="status"-Ansagen
    │   └── *Icon.tsx                      eigene Inline-SVGs
    └── shopping/ui/{ShoppingArea,ShoppingListPage,AddItemPage}.tsx
```

## Detaillierte Befunde

### 1. Element-Typen: `<a>` als Knopf vs. ausschließlich `<button>`

**Wunschliste**
- `.button` wird für `<a>` und `<button>` gleichermaßen verwendet (`src/shared/ui/buttons.css:1-19`).
  - `text-decoration: none`, Rahmen und Füllfarbe, mindestens 2.75rem breit und hoch.
- `<a>` mit Knopf-Optik:
  - `MainNavigation.svelte:19` „Wunschlisten“ und `:25` „Einstellungen“
  - `WishlistsPage.svelte:20` Icon-Link „Wunschliste erstellen“ (`aria-label`) und `:29`
    derselbe Link mit Text im Leerzustand
  - `WishlistPage.svelte:46` „Wunschliste bearbeiten“, `:53` „Wunsch erstellen“ und `:77`
    im Leerzustand
  - `WishPage.svelte:61` „Zum Angebot auf {siteName}“ (extern, `target="_blank"`) und `:71`
    „Bearbeiten“
- `<a>` ohne Knopf-Optik:
  - Zurück-Link in `PageHeader.svelte:31`. Er hat `aria-label="Zurück zu {label}"` und
    ruft im onclick `preventDefault` + `goBack` auf.
  - Listeneinträge in `WishlistsPage.svelte:37` und `WishlistPage.svelte:86`, jeweils mit
    ChevronRight.
  - `NotFound.svelte:11` „Zur Übersicht“
- Echte `<button>` gibt es nur für Aktionen, die auf der aktuellen Seite bleiben:
  - Speichern, Abbrechen, Löschen, Schenken
  - Filter mit `aria-pressed` (`WishlistPage.svelte:61`)
  - die Knöpfe im ConfirmDialog
- „Abbrechen“ ist ein `<button>`, obwohl er zurücknavigiert (`goBack`): `WishForm.svelte:145`,
  `EditWishlistPage.svelte:71`.
  - Zurück im Kopf ist dagegen ein `<a>`.
  - Dieselbe Bewegung (eine Ebene zurück) wird also einmal als „Link“ und einmal als
    „Taste“ angesagt.

**Mahlzeitenplaner**
- In `src/` gibt es kein `<a>` und kein `href`. Das CSS hat keine Regel für Links.
- `<button>` ist global gestylt, ohne Klasse (`src/index.css:130-136`). Varianten
  entstehen über Kontext-Selektoren wie `.navigationBar button`, `.addItemButton` oder
  `.iconButton`.
- „Artikel hinzufügen“:
  - `<button type="button" className="addItemButton" aria-label="Artikel hinzufügen">+</button>`
    (`ShoppingListPage.tsx:57-64`)
  - Der Klick setzt `addingItem` in `ShoppingArea.tsx:31,51` und rendert statt der Liste
    `AddItemPage` (`:33-43`).
- Zurück ist überall ein `<button>` mit Text, z. B. „Zurück zur Liste“ (`AddItemPage.tsx:66`).
- Es gibt nur ein `role` außerhalb nativer Elemente: `role="switch"` auf einer Checkbox
  (`SettingsPage.tsx:43-45`).

### 2. Navigationsmodell

**Wunschliste: Hash-Router im Eigenbau**
- Die Entscheidung steht im Plan als Nr. 5: „GitHub Pages hat keine Umleitungen für
  Unterpfade“ (`docs/agents/plans/2026-09-28-geruest-pwa-navigation-farbschema.md:64-67`).
- Routen:
  - `#/`, `#/einstellungen` (`src/app/router/routes.ts:11,15`)
  - `#/liste/neu`, `#/liste/:id`, `#/liste/:id/erfuellt`, `#/liste/:id/bearbeiten`,
    `#/liste/:id/wunsch/neu`, `#/wunsch/:id`, `#/wunsch/:id/bearbeiten`
    (`wishlistAddresses.ts:20-47`)
- `CurrentRoute`:
  - hört auf `hashchange` (`currentRoute.svelte.ts:22`)
  - fordert bei einem Seitenwechsel den Fokus auf die Überschrift an (`:30-31`)
  - normalisiert die Adresse per `history.replaceState` (`:38`)
- `App.svelte:29` mountet die Seite bei einem neuen `pageKey` neu (`{#key}`).
- `src/shared/ui/navigation.ts`:
  - legt Marker im History-State an (`markStartEntry`, `markNewEntry`, `:31-39`)
  - `replaceWith` nutzt `location.replace` (`:41-47`)
  - `goBack` wählt je nach Herkunft `history.back()` oder `replaceWith` (`:49-55`)
- Seitenwechsel sind damit Einträge im Browserverlauf. Die Zurück-Geste des Browsers bzw.
  der WebView und `history.back()` greifen auf diesen Verlauf zu.

**Mahlzeitenplaner: kein Router**
- Die Entscheidung steht im Plan als Nr. 5 (`docs/agents/plans/2026-09-14-einkaufsliste-pwa-mit-firestore-sync.md:70-76`):
  > „Kein Router. […] "Zurück" ist ein echter Knopf. Warum: GitHub Pages kann kein
  > SPA-Rewrite […] Ausserdem wäre eine Wischgeste zum Zurückgehen bei VoiceOver belegt.
  > […] Ohne History-Einträge gibt es kein Zurück-Wischen — das ist hier erwünscht, weil
  > es sonst die App verlassen würde.“
- Bestätigt wird sie in `docs/agents/plans/2026-09-15-gerichteseite-und-navigationsleiste.md:156-159`.
- `SignedInApp.tsx:146-150` hält den State:
  - `activeArea` (shopping, weekPlan, meals, supplies, settings)
  - `settingsEntry`
  - `chosenDay`, `shownView`, `shownTime`
- Eine if-Kaskade gibt die jeweilige Area zurück (`SignedInApp.tsx:256-340`).
- Innerhalb der Areas gibt es weitere State-Unterseiten, z. B. `ShoppingArea.tsx:31`
  und `MealsArea.tsx:65`.
- Die App hat genau eine Adresse, und es entstehen keine History-Einträge.

### 3. Hauptnavigation

| | Wunschliste | Mahlzeitenplaner |
|---|---|---|
| Datei | `src/app/layout/MainNavigation.svelte:18-33` | `src/shared/ui/NavigationBar.tsx:21-35` |
| Landmark | `<nav aria-label="Hauptnavigation">` | `<nav aria-label="Bereiche">` mit `<ul>/<li>` |
| Element | `<a class="button">` mit Text (+ Icon bei Einstellungen) | `<button>` nur mit Icon, `aria-label` |
| Aktiv | `aria-current` = `page` oder `true` (Unterseiten) | `aria-current="page"` |
| Aktiv-Optik | inaktiv `.button--quiet` | `button[aria-current='page']` gefüllt (`index.css:91-94`) |
| Anzahl | 2 (Wunschlisten, Einstellungen) | 5 Bereiche (`SignedInApp.tsx:64-70`) |
| Sichtbar auf | allen Seiten (in `<header>`, `App.svelte:23-26`) | nur Hauptseiten, als `navigation`-Prop |
| Layout | `flex; justify-content: space-between` | `li { flex: 1 }`, Knöpfe 100 % breit (`index.css:71-89`) |
| Position | `sticky; top: 0` im `<header>` | `sticky; top: 0` (`index.css:62-69`) |

- Im Mahlzeitenplaner ist das Muster eigens begründet: `<nav>` mit Knöpfen und
  `aria-current` statt `role="tablist"`
  (`docs/agents/plans/2026-09-15-gerichteseite-und-navigationsleiste.md:55-62`).

### 4. Seitenaufbau, Leisten und Dialoge

**Wunschliste**
- Rahmen:
  - `App.svelte:23-36` enthält ein `<header>` und ein einziges `<main>` für alle Seiten.
  - `PageHeader.svelte:29-47` enthält den Zurück-Link, `<h1 tabindex="-1">` und das
    `actions`-Snippet für Icon-Links.
- `ActionBar.svelte:7-23` ist ein `<div class="action-bar">` mit `position: sticky; bottom: 0`
  und Safe-Area-Padding.
- `ConfirmDialog.svelte:38`:
  - natives `<dialog>` mit `showModal()`, `aria-labelledby` und `aria-describedby`
  - der Fokus liegt zuerst auf „Abbrechen“ (`:24-25`) und geht beim Schließen an den
    Auslöser zurück (`:33-35`)
- Statusmeldung: `role="status"` nur in `WishPage.svelte:69`.

**Mahlzeitenplaner**
- Es gibt kein `<header>`. Jede Seite rendert ihr eigenes `<main className="page">` mit `<h1>`.
- `BottomBar.tsx`:
  - `position: fixed` (`index.css:372-383`)
  - bei offener Bildschirmtastatur `position: static` (`.bottomBarInFlow`, `index.css:385-390`),
    gesteuert über `useOnScreenKeyboard`
- Es gibt keine `<dialog>`-Elemente. Löschbestätigungen sind eigene Vollseiten
  (`Delete*Page.tsx`).
- Ansagen laufen über `Announcer.tsx:3` (`role="status"`), `useAnnouncer` und
  `useConnectionAnnouncements`. Viele Aktionen melden ihr Ergebnis gesprochen, z. B.
  `ShoppingArea.tsx:52-55` und `SignedInApp.tsx:152-158`.

### 5. Fokus und Seitentitel

| | Wunschliste | Mahlzeitenplaner |
|---|---|---|
| h1-Fokus | nur nach Seitenwechsel über Flag (`pageFocus.ts`, `PageHeader.svelte:17-21`), nicht beim ersten Laden | bei jedem Mount (`useHeadingFocus.ts`) |
| Formularseiten | h1-Fokus | Fokus direkt ins Namensfeld (z. B. `AddItemPage.tsx:32`, `MealFormPage.tsx:80`) |
| Nach Entfernen | – | Fokus auf die folgende Zeile (`useFocusAfterRemoval.ts`, `ShoppingListPage.tsx:37`) |
| `document.title` | „{Überschrift} – Wunschliste“ (`pageTitle.ts`, `PageHeader.svelte:15`) | statisch aus `index.html` |

### 6. Icons und Alternativtexte

- **Wunschliste**
  - Icons kommen aus `@lucide/svelte`. Alle Instanzen haben `aria-hidden="true"`.
  - Reine Icon-Links bekommen ihren Namen über `aria-label` am `<a>`
    (`WishlistsPage.svelte:20`, `WishlistPage.svelte:46,53`).
  - Sterne und Trennpunkt in `WishSummary.svelte:11,15` sind `aria-hidden`.
- **Mahlzeitenplaner**
  - Icons sind eigene Inline-SVGs (`src/shared/ui/*Icon.tsx`, `src/meals/ui/*Icon.tsx`)
    mit `aria-hidden="true" focusable="false"`.
  - Den Namen trägt der Button per `aria-label`.
  - Beim Hinzufügen-Knopf ist das `+` sichtbarer Text, `aria-label` überschreibt es
    (`ShoppingListPage.tsx:61-63`).
- In beiden Apps kommen Namen und Alternativtexte gleich zustande: Icon versteckt, Label
  am Bedienelement. Worin sich die Ansagen unterscheiden, ist allein die Rolle
  (Link oder Taste).

### 7. PWA- und iOS-Einstellungen

| | Wunschliste | Mahlzeitenplaner |
|---|---|---|
| viewport | `…, viewport-fit=cover` (`index.html:5`) | `…, viewport-fit=cover` (`index.html:5-8`) |
| apple-mobile-web-app-capable | ja (`:15`), zusätzlich `mobile-web-app-capable` (`:14`) | ja (`:11`) |
| status-bar-style | `black-translucent` (`:16`) | `default` (`:13`) |
| theme-color (Meta) | keins | `#ebacd2`, zur Laufzeit an `--accent` angepasst (`useAppearance.ts:9-25`) |
| color-scheme (Meta) | keins, `color-scheme` per CSS je Schema | `light` (`:9`) |
| Manifest display | `standalone` (`vite.config.ts:17`) | `standalone` (`vite.config.ts:23`) |
| orientation | nicht gesetzt | `portrait` (`:24`) |
| start_url / scope | nicht gesetzt | `/Mahlzeiten-Planer/` (`:21-22`) |
| background/theme_color | `#000000` / `#000000` | `#ffffff` / `#ebacd2` |
| Schrift | `system-ui, sans-serif` + `font: -apple-system-body` (`global.css:2-3`) | `system-ui, -apple-system, sans-serif`, 18px (`index.css:3-8`) |
| Safe Areas | body links/rechts, Statusleisten-Hintergrund, main/ActionBar unten | `.page` alle vier Seiten mit `max(1rem, env(...))`, NavigationBar oben, BottomBar unten |
| Service Worker | `autoUpdate`, `injectRegister: 'auto'` | `prompt`, manuell über `registerSW`, Angebot „Neue Version laden“ (`AppUpdateOffer.tsx`) |

- In **keinem** der beiden Projekte kommen vor:
  - `-webkit-tap-highlight-color`, `touch-action`, `user-select`,
    `-webkit-touch-callout`, `overscroll-behavior`
  - `:active` / `:hover`
  - Transitions und Animationen
- In beiden scrollt das Dokument selbst.

### 8. Prüfwerkzeuge für Barrierefreiheit

- **Wunschliste**
  - Die A11y-Prüfungen des Svelte-Compilers schlagen fehl, sobald es Warnungen gibt
    (`svelte-check --fail-on-warnings`, `package.json`).
  - Für die E2E-Tests ist `@axe-core/playwright` eingebunden.
  - Playwright läuft mit WebKit / „iPhone 15“ (Plan-Entscheidung 4,
    `docs/agents/plans/2026-09-28-geruest-pwa-navigation-farbschema.md:60-63`).
- **Mahlzeitenplaner**
  - `eslint-plugin-jsx-a11y` im Modus `strict` (`eslint.config.js`)
  - axe-core in den Komponententests (`src/testSupport/accessibility.ts`)
  - Die E2E-Tests bedienen die App per Rolle und Name, z. B.
    `pressButton(page, 'Artikel hinzufügen')` in `e2e/keyboard.ts:28,47`.

## Fundstellen

- `Wunschliste/src/wishlist/infrastructure/ui/WishlistsPage.svelte:20-22`: Icon-Link „Wunschliste erstellen“ (`<a class="button button--icon">`)
- `Wunschliste/src/wishlist/infrastructure/ui/WishlistsPage.svelte:29-31`: Link mit Text im Leerzustand
- `Wunschliste/src/shared/ui/buttons.css:1-19`: `.button`, das `<a>` wie einen Knopf aussehen lässt
- `Wunschliste/src/app/layout/MainNavigation.svelte:18-33`: Hauptnavigation aus Links
- `Wunschliste/src/shared/ui/PageHeader.svelte:29-47`: Zurück-Link, h1, Aktionen
- `Wunschliste/src/shared/ui/navigation.ts:31-55`: History-Marker, `replaceWith`, `goBack`
- `Wunschliste/src/app/router/currentRoute.svelte.ts:22-38`: `hashchange`, Fokusanforderung, `replaceState`
- `Wunschliste/src/app/App.svelte:23-36`: Seitengerüst mit `{#key pageKey}`
- `Wunschliste/docs/agents/plans/2026-09-28-geruest-pwa-navigation-farbschema.md:64-67,192-194`: Hash-Router-Entscheidung und erwartete Ansage „…, Link“
- `Mahlzeitenplaner/src/shopping/ui/ShoppingListPage.tsx:57-64`: `<button aria-label="Artikel hinzufügen">+</button>`
- `Mahlzeitenplaner/src/shopping/ui/ShoppingArea.tsx:31-43`: Seitenwechsel per State
- `Mahlzeitenplaner/src/SignedInApp.tsx:146-150,256-340`: Bereichs-State und if-Kaskade
- `Mahlzeitenplaner/src/shared/ui/NavigationBar.tsx:21-35`: `<nav>` mit Icon-Knöpfen
- `Mahlzeitenplaner/src/shared/ui/BottomBar.tsx`, `src/index.css:372-390`: fixierte untere Leiste, weicht der Tastatur
- `Mahlzeitenplaner/src/index.css:130-136`: globales `button`-Styling
- `Mahlzeitenplaner/docs/agents/plans/2026-09-14-einkaufsliste-pwa-mit-firestore-sync.md:70-76,191-194`: „Kein Router“ und erwartete Ansage „…, Taste“
- `Mahlzeitenplaner/docs/agents/plans/2026-09-15-gerichteseite-und-navigationsleiste.md:55-62`: `<nav>` mit Knöpfen statt Tablist

## Architektur im Bestand

- **Semantik folgt dem Navigationsmodell.**
  - Die Wunschliste modelliert Seiten als adressierbare Orte. Daraus folgt: `<a href>`
    für alles, was die Adresse ändert, `<button>` für alles, was auf der Seite wirkt.
    Die Knopf-Optik der Links kommt aus einer gemeinsamen CSS-Klasse.
  - Der Mahlzeitenplaner modelliert Seiten als Zustand. Daraus folgt: jede Bedienung ist
    ein `<button>`.
- **Die Framework-Wahl steht im Bestand nicht mit diesem Unterschied in Verbindung.**
  - Beide Projekte haben dieselbe Build-, PWA- und Hosting-Basis (Vite, vite-plugin-pwa,
    GitHub Pages).
  - Beide begründen ihr Navigationsmodell mit derselben Randbedingung: GitHub Pages
    leitet Unterpfade nicht um. Sie kommen aber zu verschiedenen Lösungen (Hash-Router
    bzw. kein Router).
  - Der Mahlzeitenplaner führt zusätzlich die belegte Zurück-Wischgeste unter VoiceOver
    als Grund an.
- **Die Onion-Schichtung liegt in beiden Projekten unterhalb der UI.**
  - Die Seitenkomponenten der Wunschliste liegen in `wishlist/infrastructure/ui/`.
  - Beim Mahlzeitenplaner liegen sie in `<kontext>/ui/`.
  - Der Wechsel von `<a>` zu `<button>` oder vom Router zu State betrifft in beiden
    Fällen nur diese Schicht sowie `src/app/router` und `src/shared/ui/navigation.ts`.
- **Maschinelle Prüfung.** Der Mahlzeitenplaner prüft die Barrierefreiheit per
  `jsx-a11y strict` und axe in Komponententests. Die Wunschliste nutzt dafür den
  Svelte-Compiler und axe in Playwright/WebKit.

## Offene Fragen

- Wie verhält sich die Zurück-Wischgeste in der als Home-Bildschirm-App installierten
  Wunschliste auf dem iPhone, mit und ohne VoiceOver, wenn History-Einträge existieren?
  Das ist im Code nicht ablesbar und nur auf dem Gerät prüfbar.
- Welche weiteren Punkte der Anmutung („fühlt sich nicht rund an“) meint der Nutzer
  außer der Link-Ansage? Kandidaten aus dem Vergleich: Tab-Leiste mit Icons, fixierte
  untere Leiste, gesprochene Rückmeldungen, Fokus ins erste Feld, Löschbestätigung als
  Seite statt Dialog, Update-Angebot statt Auto-Update. Welche davon spürbar sind, lässt
  sich nur am Gerät feststellen.
- Der Mahlzeitenplaner ist mit Firestore synchronisiert. Die Wunschliste speichert
  derzeit in `localStorage` (`App.svelte:9-15`). Dieser Unterschied wurde hier nicht
  weiter untersucht.
