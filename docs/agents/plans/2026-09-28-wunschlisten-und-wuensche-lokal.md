---
date: 2026-09-28T09:55:38+00:00
git_commit: e7ba0f2a40f4219fd6eba2884010c8f19dac8115
branch: main
story: WL-002
topic: "Wunschlisten und Wünsche verwalten, lokal gespeichert"
tags: [plan, wishlist, domain, application, local-storage, router, shared-ui, accessibility]
status: ready
---

# PLAN: WL-002 — Wunschlisten und Wünsche verwalten, lokal gespeichert

Schritt 2 aus `docs/agents/research/2026-09-28-wunschliste-konzept.md`: Wunschlisten und
Wünsche erstellen, ansehen, bearbeiten, löschen und verschenken, mit Filter „Offene /
Erfüllte Wünsche“, Bewertung und Preis. Gespeichert wird **lokal** in `localStorage`.
Noch keine Personen, kein Firebase, keine Geheim-Einträge.

## Akzeptanzkriterien

- Eine Wunschliste lässt sich erstellen (Name), öffnen, umbenennen und löschen. Löschen
  fragt über einen eigenen Dialog nach, nennt die Anzahl der Wünsche und löscht die
  Wünsche der Liste mit.
- Ein Wunsch lässt sich erstellen, ansehen, bearbeiten und löschen. Er hat die Felder
  Name (Pflicht), Link, Beschreibung, Preis und „Wie sehr gewünscht?“, mit den Regeln und
  Fehlertexten aus der Tabelle unter *Zielbild*.
- Die Detailseite zeigt einen Link-Knopf „Zum Angebot auf <host>“, aber nur, wenn ein Link
  vorhanden ist. Unten ist eine Leiste mit [✏ Bearbeiten] und [🎁 Schenken] bzw.
  [↶ Schenken zurücknehmen] fixiert.
- Ein verschenkter Wunsch erscheint unter „Erfüllte Wünsche“, ein offener unter „Offene
  Wünsche“. Der Filter steht in der Adresse (`#/liste/<id>/erfuellt`), ein Wechsel erzeugt
  keinen Verlaufseintrag.
- Wünsche sind sortiert nach unbedingt → gern → nett → ohne Angabe, innerhalb einer Stufe
  alphabetisch (Deutsch). Die Übersicht der Wunschlisten ist alphabetisch und zeigt nur
  die Namen.
- Leere Zustände: „Noch keine Wunschlisten.“ mit [+ Wunschliste erstellen], „Noch keine
  offenen Wünsche.“ mit [+ Wunsch erstellen], „Noch keine erfüllten Wünsche.“ ohne Knopf.
- Alle Daten überstehen einen Neustart der App. Änderungen in einem anderen Tab erscheinen
  ohne Neuladen.
- Die Adressen lauten wie unter *Zielbild*. Nach „Erstellen“ ersetzt die neue Seite das
  Formular im Verlauf. Nach „Speichern“ und „Abbrechen“ geht es einen Schritt zurück
  (inklusive Filter). Wer direkt ins Formular eingestiegen ist, landet stattdessen auf der
  Elternseite, statt die App zu verlassen. Eine unbekannte ID zeigt einen Hinweis mit Link
  zur Übersicht. Nach jedem Seitenwechsel liegt der Fokus auf dem `h1`, sobald die Seite
  ihre Daten hat. Der Seitentitel folgt immer dem `h1`.
- In der Hauptnavigation bleibt „Wunschlisten“ auf allen Unterseiten hervorgehoben
  (`aria-current="true"`), auf der Übersicht selbst `aria-current="page"`.
- axe-core meldet auf allen neuen Seiten und im offenen Löschdialog in allen drei
  Farbschemata keine Verstöße.
- Der Architekturtest verbietet `src/shared` Importe aus `app` und aus fachlichen
  Kontexten sowie `domain`/`application` Importe aus `shared/ui`, jeweils durch Tests
  belegt.

## Wesentliche Entscheidungen und Abwägungen

1. **Erfüllen ohne Personen:** „Schenken“ markiert einen Wunsch als verschenkt,
   „Schenken zurücknehmen“ hebt das auf.
   - Warum: Der Filter und die gesamte Bedienung lassen sich schon auf einem Gerät prüfen.
   - Auswirkung: `Wish` trägt `gifted: boolean`. Schritt 5 ersetzt das durch den
     Schenkenden und „Erhalten“.
2. **Zwei Aggregate `Wishlist` und `Wish`,** der Wunsch verweist per `wishlistId` auf seine
   Liste.
   - Warum: Die Konsistenzgrenzen bleiben klein, und „letzte Änderung gewinnt“ gilt später
     in Firestore pro Wunsch.
   - Auswirkung: Das Löschen einer Liste mit ihren Wünschen orchestriert der Use Case
     `DeleteWishlist`.
3. **Beobachtende Ports:** `watch…` liefert eine Abmeldefunktion, `get`/`save`/`delete`
   sind `Promise`.
   - Warum: Das passt 1:1 auf Firestore `onSnapshot`/`getDoc`.
   - Auswirkung: In Schritt 3 wird nur der Adapter getauscht. Der localStorage-Adapter
     benachrichtigt seine Beobachter selbst und hört auf das `storage`-Ereignis.
4. **Ports liegen in `domain`,** wie es der Skill `architecture` vorgibt. Die Use Cases in
   `application` orchestrieren nur.
   - Auswirkung: `WishlistRepository`, `WishRepository`, `IdGenerator` in
     `src/wishlist/domain/`.
5. **Validierung in der Domäne, Texte in der Oberfläche:** Die Value Objects liefern
   benannte Probleme (`'missing'`, `'tooLong'`, …), die Oberfläche übersetzt sie in
   deutsche Sätze.
   - Warum: Die Domäne bleibt sprachfrei, ein Formular kann alle Fehler auf einmal zeigen.
   - Auswirkung: `parseWishDetails`/`parseName` geben ein Ergebnis `{ ok, … }` zurück,
     statt eine Ausnahme zu werfen. Use Cases erhalten nur bereits gültige Werte.
6. **Adressen deutsch mit Parametern:** Die Adressen des Kontexts definiert
   `wishlist/infrastructure/ui/wishlistAddresses.ts`, der Router in `app` setzt sie mit
   `#/einstellungen` zusammen.
   - Warum: Die Seiten des Kontexts müssen Links bauen, dürfen aber `app` nicht
     importieren.
   - Auswirkung: `Route` in `src/app/router/routes.ts` wird eine Union aus Objekten.
7. **Navigieren über `location`, nicht über den Router:** `replaceWith(hash)` ruft
   `location.replace(hash)` auf und löst damit `hashchange` aus, auf das `CurrentRoute`
   schon heute hört. `goBack(fallbackHash)` geht nur dann per `history.back()` zurück, wenn
   der aktuelle Verlaufseintrag innerhalb der App entstanden ist. Sonst ersetzt es die
   Seite durch `fallbackHash`.
   - Warum: Die Seiten im Kontext brauchen keine Referenz auf den Router. Ein Einstieg
     direkt ins Formular (Neuladen, Lesezeichen) darf mit „Abbrechen“ nicht die App
     verlassen.
   - Auswirkung: `src/shared/ui/navigation.ts`. `CurrentRoute` markiert den Starteintrag
     mit `history.state = { entry: 'start' }` und jeden per `hashchange` neu entstandenen
     Eintrag (`history.state === null`) mit `{ entry: 'inApp' }`. Die Kanonisierung per
     `replaceState` behält den Zustand bei.
8. **`src/shared/ui/` für fachfreie Bausteine:** globale Klasse `.button`, `PageHeader`,
   `ActionBar`, `ChoiceGroup`, `ConfirmDialog`, `navigation.ts`, `pageTitle.ts`.
   - Warum: `wishlist` darf nichts aus `app` importieren. Die Radiogruppe im Checkbox-Look
     braucht auch die Bewertung.
   - Auswirkung: neue Grenzregel. Die Farbschema-Einstellung zieht auf `ChoiceGroup` um.
9. **Link als `<a class="button" target="_blank" rel="noopener">`** mit dem Text „Zum
   Angebot auf <host>“ (ohne `www.`) und dem stummen Icon `ExternalLink`.
   - Warum: Er verlässt die App, VoiceOver sagt richtig „Link“, und der Rotor findet ihn.
   - Auswirkung: nur auf der Detailseite, nicht in der Liste.
10. **Eigener `<dialog>` mit `showModal()` für die Löschbestätigung,** Anfangsfokus auf
    „Abbrechen“. Nach dem Schließen geht der Fokus ausdrücklich an das zuvor fokussierte
    Element zurück.
    - Warum: Er übernimmt die App-Farben, und die Knöpfe haben sprechende Namen.
    - Auswirkung: `ConfirmDialog.svelte` mit `open(returnFocusTo: HTMLElement)`. Der
     Aufrufer übergibt `event.currentTarget`, weil iOS beim Antippen keinen Knopf
     fokussiert und `document.activeElement` dann `body` wäre. iPhone-Prüfung mit
     VoiceOver.
11. **IDs aus dem Port `IdGenerator`:** In der App liefert ihn `crypto.randomUUID()`, im
    Test fortlaufende IDs (`id-1`, `id-2`).
    - Warum: Use Cases bleiben deterministisch testbar.
    - Auswirkung: `crypto.randomUUID()` gibt es nur im sicheren Kontext (https,
      `localhost`). Auf dem iPhone wird deshalb nur die veröffentlichte Version geprüft,
      nicht der Dev-Server über die LAN-IP.
12. **Verdrahtung über Svelte-Context:** `createWishlistModule()` in
    `wishlist/infrastructure/` baut Adapter und Use Cases. `App.svelte` stellt das Modul
    per `provideWishlistModule()` bereit, die Seiten holen es mit `useWishlistModule()`.
13. **Fixierte Leiste unten als `position: sticky; bottom: 0`** am Ende einer Flex-Spalte,
    die mindestens so hoch ist wie der Bildschirm. Die Leiste trägt selbst den
    Safe-Area-Abstand unten.
    - Warum: Wie bei der Navigation wächst sie mit Dynamic Type und verdeckt nie Inhalt.
    - Auswirkung: Der untere Safe-Area-Abstand wandert aus `body` in `main` bzw. die Leiste.
14. **Filter als zwei `<button aria-pressed>`.** Nach „Schenken“ meldet eine Statuszeile
    (`role="status"`) „Als erfüllt markiert.“ bzw. „Wieder offen.“.
15. **Abbrechen fragt nicht nach** ungespeicherten Änderungen: `goBack(<Elternseite>)`.
16. **In-Memory-Fakes für die Ports** liegen in `src/wishlist/application/fakes/` und werden
    von allen Use-Case-Tests wiederverwendet.
    - Warum: Die Tests liegen im Projekt neben dem Code, ein eigenes Testverzeichnis je
      Kontext gibt es nicht. Unter `application/` gelten für die Fakes dieselben
      Grenzregeln wie für die Use Cases. Da nur Testdateien sie importieren, landen sie
      nicht im Bundle.
17. **Nach dem Löschen** ersetzt die Übersicht bzw. die Liste das Formular im Verlauf.
    - Auswirkung: „Zurück“ kann danach auf der gelöschten Seite landen. Sie zeigt dann den
      Hinweis „… gibt es nicht mehr“, das ist gewollt und wird getestet.
18. **Nach „Speichern“ beim Bearbeiten geht es zurück, nach „Erstellen“ wird ersetzt.**
    - Warum: Ein `replaceWith` nach dem Bearbeiten erzeugte den Verlauf „Wunsch, Wunsch“,
      und der Filter `/erfuellt` ginge verloren.
    - Auswirkung: Speichern → `goBack(<Elternseite>)`, Erstellen → `replaceWith(<neue Seite>)`.
19. **Drei Ladezustände statt `… | undefined`:** Datengetriebene Seiten unterscheiden
    `loading`, `found` und `missing`. Solange geladen wird, zeigen sie nichts. Erst danach
    erscheinen Inhalt oder `NotFound`.
    - Warum: Sonst blitzt vor der ersten Meldung des Adapters kurz „Nicht gefunden“ auf.
      Mit Firestore ist diese Meldung asynchron.
    - Auswirkung: Hilfsklasse `Watched<T>` in `src/shared/ui/watched.svelte.ts`
      (`status`, `value`).
20. **`PageHeader` besitzt Fokus und Titel:** Bei einem Seitenwechsel setzt `CurrentRoute`
    nur noch den Merker `requestHeadingFocus()`. `PageHeader` löst ihn beim Einhängen ein
    und fokussiert sein `h1`. Außerdem setzt `PageHeader` den Seitentitel per
    `$effect(() => showPageTitle(heading))`.
    - Warum: Das `h1` einer datengetriebenen Seite gibt es erst nach dem Laden. Bleibt die
      Seite bei einem Filterwechsel stehen, darf der Titel nicht auf einen Standardwert
      zurückspringen.
    - Auswirkung: `focusPageHeading.ts` und `pageTitleFor` entfallen. Alle Seiten
      (auch „Einstellungen“ und `NotFound`) nutzen `PageHeader`.
21. **Eine Definition von „dieselbe Seite“:** `pageKeyOf(route)` (Hash ohne Filter) steuert
    sowohl den Fokus in `CurrentRoute` als auch `{#key}` in `App.svelte`.

## Ausgangslage

```
 src/
 ├── main.ts
 ├── app/                                  Kompositionswurzel
 │   ├── App.svelte                        sticky Header + <main>, if/else je Route
 │   ├── global.css                        body mit Safe-Area auf allen vier Seiten
 │   ├── layout/MainNavigation.svelte      Knopf-Optik als lokales CSS
 │   ├── router/routes.ts                  Route = 'wishlists' | 'settings'
 │   ├── router/currentRoute.svelte.ts     $state, hashchange, replaceState, title
 │   ├── router/focusPageHeading.ts
 │   ├── settings/SettingsPage.svelte
 │   └── theme/ColorSchemeSettings.svelte  Radiogruppe im Checkbox-Look (lokal)
 └── wishlist/
     └── infrastructure/ui/WishlistsPage.svelte   h1 + „Noch keine Wunschlisten.“
```

- Es gibt weder `domain` noch `application` noch eine Datenhaltung.
- Der Router kennt nur feste Hashes (`src/app/router/routes.ts:5`).
- `CurrentRoute` fokussiert das `h1` nur bei einem echten Seitenwechsel
  (`src/app/router/currentRoute.svelte.ts:18`).
- Die Grenzregeln (`eslint.architecture.config.js`) kennen `shared` noch nicht.
- Vitest läuft mit `environment: 'node'`. Der Adapter bekommt seinen Speicher deshalb
  injiziert und hängt nicht vom globalen `localStorage` ab.

## Zielbild

### Adressen

| Adresse | Seite | `h1` / Titel |
|---|---|---|
| `#/` | Übersicht | „Wunschlisten“ |
| `#/liste/neu` | Wunschliste erstellen | „Wunschliste erstellen“ |
| `#/liste/<id>` | Wunschliste, Filter „Offene“ | Name der Liste |
| `#/liste/<id>/erfuellt` | Wunschliste, Filter „Erfüllte“ | Name der Liste |
| `#/liste/<id>/bearbeiten` | Wunschliste bearbeiten | „Wunschliste bearbeiten“ |
| `#/liste/<id>/wunsch/neu` | Wunsch erstellen | „Wunsch erstellen“ |
| `#/wunsch/<id>` | Wunsch-Detailseite | Name des Wunsches |
| `#/wunsch/<id>/bearbeiten` | Wunsch bearbeiten | „Wunsch bearbeiten“ |
| `#/einstellungen` | Einstellungen | „Einstellungen“ |

- Der Seitentitel ist immer `<h1-Text> – Wunschliste`, gesetzt von `PageHeader`.
- IDs in Adressen bestehen aus `[A-Za-z0-9-]+`, alles andere führt zur Übersicht.

### Seiten

```
 Übersicht (#/)                            Leer
 ┌────────────────────────────────────┐    ┌────────────────────────────────────┐
 │ [Wunschlisten]    [⚙ Einstellungen]│    │ [Wunschlisten]    [⚙ Einstellungen]│
 ├────────────────────────────────────┤    ├────────────────────────────────────┤
 │ Wunschlisten                  [+]  │    │ Wunschlisten                  [+]  │
 │ ┌────────────────────────────────┐ │    │ Noch keine Wunschlisten.           │
 │ │ Geburtstag 2027              › │ │    │ [+ Wunschliste erstellen]          │
 │ ├────────────────────────────────┤ │    └────────────────────────────────────┘
 │ │ Weihnachten                  › │ │     [+] = „Wunschliste erstellen“ (nur Icon)
 │ └────────────────────────────────┘ │
 └────────────────────────────────────┘

 Wunschliste erstellen (#/liste/neu)       Wunschliste bearbeiten
 ┌────────────────────────────────────┐    ┌────────────────────────────────────┐
 │ Wunschliste erstellen              │    │ Wunschliste bearbeiten             │
 │ Name                               │    │ Name                               │
 │ [______________________________]   │    │ [Geburtstag 2027_______________]   │
 │ Bitte einen Namen eingeben.        │    │                                    │
 │                                    │    │ [🗑 Wunschliste löschen]           │
 │                                    │    │                                    │
 ├────────────────────────────────────┤    ├────────────────────────────────────┤
 │ [+ Erstellen]                      │    │ [💾 Speichern]   [✕ Abbrechen]     │ ← sticky
 └────────────────────────────────────┘    └────────────────────────────────────┘

 Wunschliste (#/liste/<id>)                Wunsch-Detailseite (#/wunsch/<id>)
 ┌────────────────────────────────────┐    ┌────────────────────────────────────┐
 │ Geburtstag 2027          [✏] [+]   │    │ Fahrradhelm                        │
 │ [Offene Wünsche] [Erfüllte Wünsche]│    │ ★★★ unbedingt · 49,99 €            │
 │ ┌────────────────────────────────┐ │    │ Erfüllt                            │ ← nur wenn verschenkt
 │ │ Fahrradhelm                  › │ │    │ [↗ Zum Angebot auf amazon.de]      │
 │ │ ★★★ unbedingt · 49,99 €        │ │    │ Größe M, gern in Dunkelblau.       │
 │ ├────────────────────────────────┤ │    │                                    │
 │ │ Buch „Dune“                  › │ │    │ (Statuszeile, role="status")       │
 │ │ 12,00 €                        │ │    ├────────────────────────────────────┤
 │ └────────────────────────────────┘ │    │ [✏ Bearbeiten]   [🎁 Schenken]     │ ← sticky
 └────────────────────────────────────┘    └────────────────────────────────────┘
  [✏] „Wunschliste bearbeiten“, [+] „Wunsch erstellen“, nur Icon

 Wunsch erstellen / bearbeiten             Löschdialog (<dialog>, modal)
 ┌────────────────────────────────────┐    ┌────────────────────────────────────┐
 │ Wunsch erstellen                   │    │ Wunschliste löschen?          (h2) │
 │ Name          [________________]   │    │ „Geburtstag 2027“ mit 5 Wünschen   │
 │ Link          [________________]   │    │ wird gelöscht.                     │
 │ Beschreibung  [________________]   │    │                                    │
 │               [________________]   │    │ [🗑 Löschen]   [✕ Abbrechen]       │
 │ Preis in Euro [________]           │    └────────────────────────────────────┘
 │ Wie sehr gewünscht?                │     Anfangsfokus: „Abbrechen“
 │   unbedingt                │       │
 │   gern                     │       │
 │   nett                     │       │
 │   keine Angabe             │  ✓    │
 │ [🗑 Wunsch löschen]  (nur Bearbeiten)
 ├────────────────────────────────────┤
 │ [💾 Speichern]   [✕ Abbrechen]     │ ← sticky
 └────────────────────────────────────┘
```

Nicht gefunden (unbekannte oder gelöschte ID):

```
 ┌────────────────────────────────────┐
 │ Nicht gefunden                (h1) │
 │ Diese Wunschliste gibt es nicht    │   bzw. „Diesen Wunsch gibt es nicht mehr.“
 │ mehr.                              │
 │ Zur Übersicht                      │   ← Link auf #/
 └────────────────────────────────────┘
```

VoiceOver-Erwartung:
- Wunscheintrag: „Fahrradhelm, unbedingt, 49,99 €, Link“ (ein Link je Wunsch, Sterne
  stumm)
- Filter: „Offene Wünsche, Taste, ausgewählt“ bzw. „Erfüllte Wünsche, Taste“
- Kopf-Knöpfe: „Wunsch erstellen, Link“, „Wunschliste bearbeiten, Link“
- Link-Knopf: „Zum Angebot auf amazon.de, Link“
- Unterseiten: „Wunschlisten, aktuelles Element, Link“ in der Navigation

### Felder und Regeln

| Feld | Value Object | Regel | Problem → Fehlertext |
|---|---|---|---|
| Name (Liste und Wunsch) | `Name` | Leerraum am Rand entfernen, nicht leer, höchstens 100 Zeichen (Codepoints) | `missing` → „Bitte einen Namen eingeben.“ · `tooLong` → „Der Name darf höchstens 100 Zeichen lang sein.“ |
| Link | `WishLink` | Leerraum entfernen, leer = kein Link. Beginnt die Eingabe weder mit einem Schema samt `//` (`/^[a-z][a-z0-9+.-]*:\/\//i`) noch mit `javascript:`, `data:`, `vbscript:`, `mailto:`, `tel:` oder `file:` (ohne Beachtung der Groß-/Kleinschreibung), wird `https://` vorangestellt. So wird aus `amazon.de:8080/x` `https://amazon.de:8080/x`. `new URL` muss gelingen, Protokoll `http:`/`https:`, Hostname enthält einen Punkt | `invalid` → „Das ist keine gültige Webadresse.“ |
| Beschreibung | `Description` | Leerraum am Rand entfernen, leer = keine, höchstens 2000 Zeichen, Umbrüche bleiben | `tooLong` → „Die Beschreibung darf höchstens 2000 Zeichen lang sein.“ |
| Preis | `Price` (Cent) | Leerraum entfernen, leer = kein Preis. Muster `^\d+([.,]\d{1,2})?$`, größer 0, höchstens 9 999 999 Cent | `invalidFormat` → „Bitte einen Betrag wie 49,99 eingeben.“ · `notPositive` → „Der Preis muss größer als 0 sein.“ · `tooHigh` → „Der Preis darf höchstens 99.999,99 € betragen.“ |
| Wie sehr gewünscht? | `Rating` | `'essential' \| 'wanted' \| 'nice'` oder keine Angabe | – |

Anzeige: Preis per `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })`.
Bewertung: `★★★ unbedingt`, `★★ gern`, `★ nett`, die Sterne `aria-hidden`.

### Schichten

```
 src/
 ├── app/                        Kompositionswurzel, darf alles
 │   └── router/routes.ts        Route = WishlistAddress | { page: 'settings' }
 ├── shared/
 │   └── ui/                     fachfrei: button, PageHeader, ActionBar, ChoiceGroup,
 │                               ConfirmDialog, navigation, pageTitle
 └── wishlist/
     ├── domain/                 Wishlist, Wish, Name, WishLink, Description, Price,
     │                           Rating, Sortierung/Filter, Ports
     ├── application/            Use Cases, fakes/ (In-Memory-Ports für Tests)
     └── infrastructure/
         ├── createWishlistModule.ts
         ├── localStorage/       Adapter
         └── ui/                 Seiten, Adressen, Context
```

Abhängigkeitsrichtung (maschinell geprüft):

```
 app ──► wishlist/infrastructure ──► wishlist/application ──► wishlist/domain
  │              │
  └──────────────┴──► shared/ui ──✗──► app, wishlist
 domain, application ──✗──► shared/ui
```

## Abstraktionen und Wiederverwendung

Wiederverwendet:
- `CurrentRoute` (`hashchange`, Kanonisierung per `replaceState`, Fokus nur bei echtem
  Seitenwechsel) bleibt im Kern gleich. Den Fokus löst künftig `PageHeader` ein
  (Entscheidung 20), `focusPageHeading.ts` entfällt.
- `.visually-hidden` und `:focus-visible` aus `src/app/global.css`.
- Optik der Radiogruppe aus `ColorSchemeSettings.svelte` wandert nach `ChoiceGroup`.
- Die Seed-Idee `addInitScript` + `localStorage` aus `e2e/accessibility.spec.ts`.

Neu:

- `src/shared/ui/`
  - `buttons.css` — `.button` (Fläche `--color-button`, Schrift `--color-button-text`,
    Rand `--color-button-border`, mindestens 2,75 rem hoch und breit, Icon und Text mit
    Abstand), `.button--quiet` (Fläche `--color-background`, Schrift `--color-text`) für
    die nicht aktive Navigation. Import in `main.ts`.
  - `PageHeader.svelte` — `h1 tabindex="-1"` links, ein Snippet `actions` rechts, bricht
    bei großer Schrift um.
  - `ActionBar.svelte` — sticky Leiste unten mit Safe-Area-Abstand, Snippet `children`.
  - `ChoiceGroup.svelte` — `fieldset`/`legend`, Optionen `{ value, label }[]`, `name`,
    `selected`, `onselect(value)`. Optik wie heute.
  - `ConfirmDialog.svelte` — `heading`, `message`, `confirmLabel`, `onconfirm`, Methode
    `open(returnFocusTo)`. Fokus beim Öffnen auf „Abbrechen“, beim Schließen zurück auf
    `returnFocusTo`. Die Knopfzeile ist eine eigene Zeile, **nicht** `ActionBar` (kein
    sticky, keine Safe Area im Dialog). Vor `onconfirm` wird der Dialog geschlossen.
  - `navigation.ts` — `replaceWith(hash)`, `goBack(fallbackHash)`,
    `backTargetFor(historyState)` (reine Entscheidung, getestet), `markHistoryEntry(entry)`
    (von `CurrentRoute` genutzt).
  - `pageTitle.ts` — `showPageTitle(title)` setzt `document.title` auf
    `` `${title} – Wunschliste` ``.
  - `pageFocus.ts` — `requestHeadingFocus()`, `takeHeadingFocusRequest(): boolean`.
  - `watched.svelte.ts` — `Watched<T>` mit `status: 'loading' | 'found' | 'missing'` und
    `value`, dazu `show(value | undefined)`.
- `src/wishlist/domain/`
  - `ids.ts` — `WishlistId`, `WishId` (gebrandete `string`), `IdGenerator` (Port).
  - `parsed.ts` — `type Parsed<T, P extends string> = { ok: true; value: T } | { ok: false; problem: P }`.
  - `Name.ts` — `Name.parse(raw): Parsed<Name, 'missing' | 'tooLong'>`, `value`.
  - `Wishlist.ts` — `Wishlist.create(id, name)`, `Wishlist.restore(…)`, `rename(name)`,
    `sortWishlists(wishlists)` (alphabetisch, `localeCompare(…, 'de')`),
    `WishlistNotFound`.
  - `WishLink.ts` — `WishLink.parse(raw): Parsed<WishLink | undefined, 'invalid'>`,
    `href`, `siteName` (Hostname ohne `www.`).
  - `Description.ts` — `Description.parse(raw): Parsed<Description | undefined, 'tooLong'>`.
  - `Price.ts` — `Price.parse(raw): Parsed<Price | undefined, 'invalidFormat' | 'notPositive' | 'tooHigh'>`,
    `Price.ofCents(cents): Parsed<Price, 'notPositive' | 'tooHigh' | 'notWholeCents'>`,
    `cents`.
  - Alle Value Objects haben einen **privaten** Konstruktor. Auch das Wiederherstellen aus
    dem Speicher läuft über `parse`/`ofCents`, damit die Regeln nicht umgangen werden.
  - `Rating.ts` — `type Rating = 'essential' | 'wanted' | 'nice'`, `RATINGS` (absteigend).
  - `WishDetails.ts` — `type WishDetails = { name; link?; description?; price?; rating? }`,
    `WishDetailsInput` (alles `string`, `rating: Rating | undefined`),
    `parseWishDetails(input)` → `{ ok: true; details } | { ok: false; problems: WishDetailsProblems }`
    (Probleme je Feld).
  - `Wish.ts` — `Wish.create(id, wishlistId, details)`, `Wish.restore(…)`,
    `edit(details)`, `gift()`, `takeBackGift()`, `isOpen`, `WishNotFound`,
    `WishAlreadyGifted`, `WishNotGifted`. Alle Methoden liefern ein neues `Wish`.
  - `wishOrder.ts` — `sortWishes(wishes)`, `type WishFilter = 'open' | 'fulfilled'`,
    `wishesMatching(wishes, filter)`.
  - `WishlistRepository.ts` — `watchAll`, `watch`, `get`, `save`, `delete`.
  - `WishRepository.ts` — `watchByWishlist`, `watch`, `get`, `save`, `delete`,
    `deleteAllOf(wishlistId)`.
  - `Unsubscribe.ts` — `type Unsubscribe = () => void`.
- `src/wishlist/application/`
  - `CreateWishlist`, `RenameWishlist`, `DeleteWishlist`, `WatchWishlists` (sortiert),
    `WatchWishlist`, `CreateWish`, `EditWish`, `DeleteWish`, `GiftWish`, `TakeBackGift`,
    `WatchWishesOfWishlist` (sortiert), `WatchWish` — je eine Klasse mit `execute(…)`.
  - `fakes/InMemoryWishlistRepository.ts`, `fakes/InMemoryWishRepository.ts`,
    `fakes/SequentialIdGenerator.ts`.
- `src/wishlist/infrastructure/`
  - `localStorage/StoredCollection.ts` — liest und schreibt ein JSON-Array unter einem
    Schlüssel. **Vor jedem Schreiben liest es frisch aus dem Speicher**, damit ein zweiter
    Tab nichts überschreibt. Es benachrichtigt Beobachter und hört auf `storage`-Ereignisse,
    deren `key` passt oder `null` ist. Der Speicher ist als
    `Pick<Storage, 'getItem' | 'setItem'>` typisiert.
  - `localStorage/LocalStorageWishlistRepository.ts`,
    `localStorage/LocalStorageWishRepository.ts` — Abbildung Record ↔ Domäne,
    ungültige Einträge werden übersprungen.
  - `createWishlistModule.ts` — `createWishlistModule({ storage, storageEvents, idGenerator })`.
  - `ui/wishlistModuleContext.ts` — `provideWishlistModule`, `useWishlistModule`.
  - `ui/wishlistAddresses.ts` — `WishlistAddress`, `parseWishlistAddress`,
    `hashOf(address)`.
  - `ui/WishlistPages.svelte` — wählt die Seite zur Adresse.
  - `ui/WishlistsPage.svelte`, `ui/CreateWishlistPage.svelte`,
    `ui/EditWishlistPage.svelte`, `ui/WishlistPage.svelte`, `ui/WishPage.svelte`,
    `ui/CreateWishPage.svelte`, `ui/EditWishPage.svelte`, `ui/WishForm.svelte`,
    `ui/WishSummary.svelte` (Bewertung · Preis), `ui/NotFound.svelte`.
  - `ui/wishTexts.ts` — `ratingLabel`, `ratingStars`, `formatPrice`, `problemMessage`,
    `wishlistDeletionMessage(name, wishCount)`.

## Logging und Beobachtbarkeit

Keine Logs. Ungültige Einträge im `localStorage` werden stillschweigend übersprungen. Das
belegt ein Test.

## Umsetzung

### Phase 1: Wunschlisten anlegen und öffnen

Abhängigkeiten: keine

Router mit Parametern, fachfreie Bausteine, `Wishlist` mit Ports, localStorage-Adapter
und Verdrahtung. Man kann Wunschlisten anlegen, sieht sie in der Übersicht und öffnet sie.
Die Listenseite zeigt vorerst nur den Kopf und „Noch keine offenen Wünsche.“.

**Aufgaben**:
- [ ] `tests/architecture.test.ts` zuerst um die neuen Fälle erweitern:
  - verboten: `src/shared/ui/X.svelte` → `../../app/App.svelte`,
    `src/shared/ui/X.svelte` → `../../wishlist/domain/Wish`,
    `src/wishlist/domain/Wish.ts` → `../../shared/ui/navigation`,
    `src/wishlist/application/CreateWish.ts` → `../../shared/ui/navigation`
  - verboten: `src/wishlist/domain/Wish.test.ts` → `../../shared/ui/navigation`,
    `src/wishlist/application/CreateWish.test.ts` → `../../shared/ui/navigation`
  - erlaubt: `src/shared/ui/X.svelte` → `svelte`,
    `src/wishlist/infrastructure/ui/X.svelte` → `../../../shared/ui/ActionBar.svelte`
- [ ] `eslint.architecture.config.js`: neuer Block für `src/shared/**/*.{ts,svelte}` mit
      `outwardTo(['app', 'wishlist'])`. `'shared/ui'` kommt in die Verbotslisten der
      `domain`- und `application`-Blöcke **einschließlich** ihrer Testdatei-Blöcke (die
      Reihenfolge der Blöcke bleibt tragend, siehe WL-001, Entscheidung 3).
- [ ] `src/wishlist/infrastructure/ui/wishlistAddresses.test.ts` zuerst (TDD):
  - `parseWishlistAddress('#/')` → `{ page: 'wishlists' }`
  - `'#/liste/neu'` → `{ page: 'createWishlist' }`
  - `'#/liste/abc-1'` → `{ page: 'wishlist', wishlistId: 'abc-1', filter: 'open' }`
  - `'#/liste/abc-1/erfuellt'` → `filter: 'fulfilled'`
  - `'#/liste/abc-1/bearbeiten'`, `'#/liste/abc-1/wunsch/neu'`, `'#/wunsch/w-1'`,
    `'#/wunsch/w-1/bearbeiten'` → jeweilige Seite
  - `'#/liste/ab c'`, `'#/wunsch/'`, `'#/quatsch'` → `undefined`
  - `hashOf` ist für jede Adresse die Umkehrung von `parseWishlistAddress`
- [ ] `wishlistAddresses.ts` implementieren. Die Seite `wishlist` führt `filter`, alle
      Seiten den Schlüssel `page`.
- [ ] `src/app/router/routes.test.ts` anpassen und erweitern:
  - `resolveRoute('#/einstellungen')` → `{ page: 'settings' }`, `'#/quatsch'` →
    `{ page: 'wishlists' }`, `'#/liste/a'` → Wunschlisten-Adresse
  - `pageKeyOf` ist für beide Filter derselben Liste gleich, für zwei Listen verschieden,
    für `settings` `'#/einstellungen'`
  - `navigationTargetOf(route)` → `'wishlists'` bzw. `'settings'` (für `aria-current`)
  - der bisherige Test für `pageTitleFor` entfällt
- [ ] `src/app/router/routes.ts`: `type Route = WishlistAddress | { page: 'settings' }`,
      `resolveRoute`, `hashFor` (settings → `'#/einstellungen'`, sonst `hashOf`),
      `pageKeyOf`, `navigationTargetOf`; `pageTitleFor` entfällt
- [ ] `src/shared/ui/navigation.test.ts` zuerst: `backTargetFor({ entry: 'inApp' })` →
      `'back'`, `{ entry: 'start' }` und `null` → `'fallback'`
- [ ] `src/shared/ui/pageTitle.ts`, `pageFocus.ts`, `navigation.ts`,
      `watched.svelte.ts`
- [ ] `src/app/router/currentRoute.svelte.ts`: Seitenwechsel per
      `pageKeyOf(neu) !== pageKeyOf(alt)`, dann `requestHeadingFocus()` statt
      `focusPageHeading()`. Den Titel setzt es nicht mehr. Beim Start
      `markHistoryEntry('start')`, bei `hashchange` mit `history.state === null`
      `markHistoryEntry('inApp')`. `focusPageHeading.ts` löschen.
- [ ] `src/shared/ui/buttons.css` mit `.button` und `.button--quiet`, Import in `main.ts`.
      `MainNavigation.svelte` nutzt die Klassen statt des lokalen CSS. Das Aussehen bleibt
      gleich, `e2e/colorScheme.spec.ts` sichert das ab.
- [ ] `MainNavigation.svelte` bekommt die `Route`. `aria-current` ist `'page'` für die
      exakte Seite (`wishlists`, `settings`), `'true'` für Unterseiten des Ziels
      `wishlists`. Die Füllung hängt an `[aria-current]`, nicht nur an `='page'`.
- [ ] `src/shared/ui/PageHeader.svelte`: `h1 tabindex="-1"`, Snippet `actions`,
      `$effect(() => showPageTitle(heading))`. Beim Einhängen wird bei
      `takeHeadingFocusRequest()` das `h1` fokussiert. `SettingsPage.svelte` und
      `WishlistsPage.svelte` nutzen `PageHeader`.
- [ ] `src/shared/ui/ActionBar.svelte` und Layout als durchgehende Flex-Kette:
      `#app` (`display: flex; flex-direction: column; min-height: 100dvh`) → `main`
      (`flex: 1; display: flex; flex-direction: column`) → Seitenwurzel, also `form` oder
      `.page` (`flex: 1; display: flex; flex-direction: column`) → `ActionBar` als letztes
      Kind (`margin-top: auto; position: sticky; bottom: 0`, Hintergrund
      `--color-background`, oberer Rand `--color-outline`,
      `padding: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom))`,
      `margin-inline: -1rem`, damit sie trotz des seitlichen Abstands von `main` volle
      Breite hat). `body` verliert den unteren Safe-Area-Abstand. `main` hat unten
      `calc(1rem + env(safe-area-inset-bottom))` nur, wenn es keine Leiste enthält
      (`main:not(:has(.action-bar))`), sonst 0.
- [ ] `e2e/layout.spec.ts`: Auf „Wunschliste erstellen“ liegt die Leiste bei kurzem Inhalt
      am unteren Rand des Viewports. Bei künstlich hohem Inhalt bleibt sie nach dem
      Scrollen im Viewport, und ihre Unterkante fällt mit der des Viewports zusammen.
- [ ] Domäne, TDD in `src/wishlist/domain/*.test.ts`:
  - `Name.parse`: `'  Geburtstag  '` → `'Geburtstag'`, `''` und `'   '` → `missing`,
    100 Zeichen ok, 101 → `tooLong`, 100 Emoji zählen als 100
  - `Wishlist.create` trägt ID und Namen, `rename` liefert eine neue Liste mit neuem Namen
    und gleicher ID
  - `sortWishlists`: `['Weihnachten', 'ärger', 'Apfel']` → `Apfel, ärger, Weihnachten`.
    Bei gleichem Namen entscheidet die ID, damit die Reihenfolge stabil bleibt.
- [ ] `ids.ts`, `parsed.ts`, `Unsubscribe.ts`, `Name.ts`, `Wishlist.ts`,
      `WishlistRepository.ts` implementieren
- [ ] `src/wishlist/application/fakes/InMemoryWishlistRepository.ts`,
      `fakes/SequentialIdGenerator.ts`. Beobachter werden bei `watch…` sofort und bei
      jedem `save`/`delete` benachrichtigt.
- [ ] Use Cases, TDD in `src/wishlist/application/*.test.ts` gegen die Fakes:
  - `CreateWishlist.execute(name)` speichert eine Liste mit der nächsten ID und gibt die
    ID zurück
  - `WatchWishlists.execute(onChange)` liefert sortiert, meldet neue Listen, die
    Abmeldefunktion beendet die Meldungen
  - `WatchWishlist.execute(id, onChange)` liefert die Liste bzw. `undefined`
- [ ] `src/wishlist/infrastructure/localStorage/StoredCollection.ts` und
      `LocalStorageWishlistRepository.ts` (Schlüssel `wunschliste.wishlists`, Record
      `{ id, name }`)
- [ ] Integrationstest `LocalStorageWishlistRepository.test.ts` mit einem im Test
      definierten Speicher (`Pick<Storage, 'getItem' | 'setItem'>` auf Basis einer `Map`)
      und einem `EventTarget`. Ereignisse entstehen per
      `Object.assign(new Event('storage'), { key })`, weil Node kein `StorageEvent` kennt:
  - gespeicherte Liste ist über eine **zweite** Instanz auf demselben `Storage` lesbar
  - `watchAll` meldet sofort und nach `save`/`delete`
  - `storage`-Ereignis → Beobachter bekommen den neu gelesenen Stand; ein Ereignis für einen
    fremden Schlüssel löst nichts aus
  - zwei Instanzen auf demselben Speicher speichern abwechselnd je eine Liste → beide
    Listen sind vorhanden (kein Überschreiben durch veralteten Stand)
  - ungültiges JSON → leere Sammlung. Ein Eintrag mit leerem Namen wird übersprungen, die
    übrigen bleiben erhalten.
- [ ] `src/wishlist/infrastructure/createWishlistModule.ts` und
      `ui/wishlistModuleContext.ts`. `App.svelte` ruft
      `provideWishlistModule(createWishlistModule({ storage: localStorage, storageEvents: window, idGenerator: { next: () => crypto.randomUUID() } }))`
      auf.
- [ ] `App.svelte`: `{#key pageKeyOf(route)}` um `{#if route.page === 'settings'} <SettingsPage /> {:else} <WishlistPages address={route} /> {/if}`
- [ ] `ui/WishlistPages.svelte`: wählt die Seite zur Adresse. Seiten, die erst in späteren
      Phasen entstehen, zeigen bis dahin `NotFound`.
- [ ] `ui/WishlistsPage.svelte`: `PageHeader` mit [+] (`a.button`, `aria-label="Wunschliste erstellen"`,
      Lucide `Plus`), Liste als `<ul>` mit einem Link je Liste (`›`-Icon stumm) oder dem
      leeren Zustand
- [ ] `ui/CreateWishlistPage.svelte`: `<form novalidate>`, Feld „Name“, Fehler per
      `aria-invalid`/`aria-describedby`, Fokus aufs Feld bei Fehler. `ActionBar` mit
      [+ Erstellen] (`type="submit"`). Erfolg → `replaceWith(hashOf({ page: 'wishlist', … }))`.
- [ ] `ui/WishlistPage.svelte` (vorerst): `Watched` über `WatchWishlist`. `loading` →
      nichts, `found` → `PageHeader` mit dem Namen und „Noch keine offenen Wünsche.“,
      `missing` → `NotFound` mit „Diese Wunschliste gibt es nicht mehr.“
- [ ] `ui/NotFound.svelte`: `PageHeader` „Nicht gefunden“, Satz, Link „Zur Übersicht“
- [ ] `e2e/wishlists.spec.ts`:
  - leerer Zustand → „Wunschliste erstellen“ öffnet `#/liste/neu`, h1 fokussiert
  - leerer Name → Fehlertext sichtbar, Feld hat `aria-invalid="true"` und ist fokussiert
  - „Geburtstag 2027“ erstellen → Listenseite, h1 „Geburtstag 2027“ fokussiert, Titel
    „Geburtstag 2027 – Wunschliste“; `page.goBack()` → Übersicht (nicht das Formular)
  - zwei Listen erscheinen alphabetisch; nach `page.reload()` noch da
  - `#/liste/gibtsnicht` → „Diese Wunschliste gibt es nicht mehr.“, Link führt zu `#/`
  - Auf der Listenseite trägt der Navigationslink „Wunschlisten“ `aria-current="true"`
  - zweiter Tab im selben Kontext: eine dort erstellte Liste erscheint im ersten Tab ohne
    Neuladen
- [ ] `e2e/navigation.spec.ts` bleibt grün (Titel, Umleitung `#/quatsch`, Fokus, sticky)
- [ ] `e2e/accessibility.spec.ts`: Seitenliste als Tabelle mit optionalem Seed. Hilfsdatei
      `e2e/seed.ts` schreibt Records per `addInitScript` in `localStorage`, **nur wenn der
      Schlüssel noch fehlt**, damit ein `reload` die Änderungen des Tests nicht überschreibt. Neu: Übersicht
      mit Listen, „Wunschliste erstellen“, Listenseite, „Nicht gefunden“ — jeweils × drei
      Farbschemata
- [ ] `README.md`, Abschnitt „Architektur“: `shared/ui` ergänzen; neuer Abschnitt
      „Daten“: in Schritt 2 nur lokal im Browser (`wunschliste.wishlists`,
      `wunschliste.wishes`), sie werden beim späteren Wechsel auf Firestore nicht übernommen

**Automatisierte Verifikation**:
- [ ] `npm run test:unit` grün, u. a. `architecture.test.ts` mit allen alten und neuen
      Fällen, `wishlistAddresses.test.ts`, `routes.test.ts`, `navigation.test.ts`,
      Domänen-, Use-Case- und Adaptertests
- [ ] `npm run test:architecture` grün
- [ ] `npm run lint` grün
- [ ] `npm test` grün inklusive `wishlists.spec.ts`, `layout.spec.ts`, `navigation.spec.ts`,
      `colorScheme.spec.ts` und aller axe-Kombinationen

**Manuelle Verifikation**:
- [ ] iPhone mit VoiceOver: Übersicht → „Wunschliste erstellen, Link“ → Formular → Name →
      „Erstellen“ → VoiceOver liest „Geburtstag 2027, Überschrift“
- [ ] iOS-Textgröße auf Maximum: Die Leiste mit [+ Erstellen] liegt am unteren Rand, wird
      nicht vom Home-Indikator verdeckt und verdeckt keinen Inhalt. Der Kopf [+] bricht
      sauber um.

### Phase 2: Wünsche anlegen und ansehen

Abhängigkeiten: Phase 1

`Wish` mit allen Value Objects, Sortierung, Formular, Listeneinträge und Detailseite mit
Link-Knopf. Die Farbschema-Einstellung zieht auf `ChoiceGroup` um.

**Aufgaben**:
- [ ] Domäne, TDD:
  - `WishLink.parse`: `''` → kein Link; `'amazon.de/x'` → `https://amazon.de/x`;
    `'http://a.de'` bleibt `http`; `'javascript:alert(1)'`, `'mailto:a@b.de'`, `'foo'`,
    `'https://'` → `invalid`; `siteName` von `https://www.amazon.de/x` → `amazon.de`
  - `Description.parse`: Rand wird entfernt, Umbrüche innen bleiben, 2000 ok, 2001 →
    `tooLong`, `''` → keine
  - `Price.parse`: `'49'` → 4900, `'49,9'` → 4990, `'49.99'` → 4999, `' 0,01 '` → 1,
    `'0'` → `notPositive`, `'1.299'`/`'49,999'`/`'abc'`/`'-5'` → `invalidFormat`,
    `'99999,99'` ok, `'100000'` → `tooHigh`, `''` → kein Preis. `Price.ofCents(0)` →
    `notPositive`, `ofCents(1.5)` → `notWholeCents`
  - `WishLink.parse('HTTPS://A.DE')` bleibt `https`, `'amazon.de:8080/x'` →
    `https://amazon.de:8080/x`, `'JavaScript:alert(1)'` → `invalid`
  - `parseWishDetails`: gültige Eingabe → `details`. Leerer Name **und** falscher Preis →
    beide Probleme gleichzeitig.
  - `Wish.create` ist offen (`isOpen`), `edit` ersetzt die Details und behält ID,
    `wishlistId` und `gifted`
  - `sortWishes`: unbedingt → gern → nett → ohne, innerhalb einer Stufe alphabetisch, bei
    gleichem Namen nach ID
- [ ] `WishLink.ts`, `Description.ts`, `Price.ts`, `Rating.ts`, `WishDetails.ts`,
      `Wish.ts`, `wishOrder.ts` (vorerst nur `sortWishes`), `WishRepository.ts`
- [ ] `fakes/InMemoryWishRepository.ts`
- [ ] Use Cases, TDD:
  - `CreateWish.execute(wishlistId, details)` speichert einen offenen Wunsch und gibt die
    ID zurück. Unbekannte Liste → `WishlistNotFound`.
  - `WatchWishesOfWishlist.execute(wishlistId, onChange)` liefert sortiert, nur Wünsche
    dieser Liste
  - `WatchWish.execute(id, onChange)` liefert den Wunsch bzw. `undefined`
- [ ] `localStorage/LocalStorageWishRepository.ts` (Schlüssel `wunschliste.wishes`, Record
      `{ id, wishlistId, name, link?, description?, priceInCents?, rating?, gifted }`) und
      Integrationstest wie in Phase 1, zusätzlich: `watchByWishlist` liefert nur Wünsche
      der Liste; ein Record mit ungültigem Preis wird übersprungen. Wiederhergestellt wird
      über `Name.parse`, `WishLink.parse`, `Price.ofCents` usw.
- [ ] `createWishlistModule` um Wünsche erweitern
- [ ] `src/shared/ui/ChoiceGroup.svelte` aus `ColorSchemeSettings.svelte` herauslösen,
      `ColorSchemeSettings` nutzt sie. `e2e/colorScheme.spec.ts` bleibt unverändert grün.
- [ ] `ui/wishTexts.ts` mit Test `wishTexts.test.ts`: `formatPrice(Price.ofCents(4999))` →
      `'49,99 €'` (mit geschütztem Leerzeichen, wie `Intl` es liefert), `ratingLabel`,
      `ratingStars`, `problemMessage` für jedes Problem aus der Tabelle
- [ ] `ui/WishForm.svelte`: Felder „Name“ (`autocapitalize="sentences"`), „Link“
      (`type="url"`, `autocapitalize="off"`, `autocorrect="off"`), „Beschreibung“
      (`textarea`), „Preis in Euro“ (`inputmode="decimal"`), `ChoiceGroup` „Wie sehr
      gewünscht?“ mit unbedingt / gern / nett / keine Angabe (Vorauswahl keine Angabe).
      `ChoiceGroup` arbeitet mit Zeichenketten. „keine Angabe“ hat den Wert `'none'`,
      den `WishForm` in `undefined` übersetzt.
      `novalidate`, Fehler je Feld, Fokus auf das erste fehlerhafte Feld. Props:
      Startwerte, `onsubmit(details)`, `cancelFallback` (Hash der Elternseite), Snippet für
      Zusatzinhalt am Ende (Löschknopf in Phase 3). `ActionBar` mit [💾 Speichern] und
      [✕ Abbrechen] (`goBack(cancelFallback)`).
- [ ] `ui/CreateWishPage.svelte`: prüft per `Watched`, ob die Liste existiert (sonst
      `NotFound`), Elternseite ist die Liste.
      Erfolg → `replaceWith` zur Detailseite des neuen Wunsches.
- [ ] `ui/WishSummary.svelte`: `★★★ unbedingt · 49,99 €`, Sterne `aria-hidden`, fehlende
      Teile samt Trennpunkt weggelassen
- [ ] `ui/WishlistPage.svelte`: Kopf-Knopf [+] „Wunsch erstellen“, Liste der Wünsche als
      `<ul>`, je Eintrag **ein** Link auf `#/wunsch/<id>` mit Name und `WishSummary`.
      Leerer Zustand mit [+ Wunsch erstellen]. In dieser Phase werden alle Wünsche
      angezeigt, der Filter folgt in Phase 4.
- [ ] `ui/WishPage.svelte`: `Watched` über `WatchWish`, `PageHeader` mit dem Namen,
      `WishSummary`, Link-Knopf `a.button` „Zum Angebot auf {siteName}“ mit Lucide
      `ExternalLink` (`target="_blank"`, `rel="noopener"`), Beschreibung mit
      `white-space: pre-line`. Die `ActionBar` kommt erst in Phase 3 mit [✏ Bearbeiten]
      dazu. Unbekannte ID → „Diesen Wunsch gibt es nicht mehr.“
- [ ] `e2e/wishes.spec.ts`:
  - Wunsch mit allen Feldern anlegen (Preis `49,99`, Link `amazon.de/helm`, „unbedingt“)
    → Detailseite, h1 fokussiert, `★★★ unbedingt · 49,99 €` sichtbar, Link
    „Zum Angebot auf amazon.de“ hat `href="https://amazon.de/helm"` und
    `target="_blank"`; `page.goBack()` → Listenseite
  - Wunsch nur mit Namen → kein Link-Knopf, keine Zusammenfassung
  - leerer Name und Preis `abc` → beide Fehlertexte, Fokus auf „Name“
  - drei Wünsche mit verschiedenen Bewertungen erscheinen in der Sortierreihenfolge
  - Listeneintrag hat den zugänglichen Namen „Fahrradhelm unbedingt 49,99 €“
    (Sterne nicht enthalten)
  - „Abbrechen“ im Formular → zurück zur Liste, nichts angelegt
  - `#/liste/<id>/wunsch/neu` direkt aufrufen (Seed), „Abbrechen“ → Listenseite, die App
    bleibt offen
  - `#/wunsch/gibtsnicht` → „Diesen Wunsch gibt es nicht mehr.“
- [ ] `e2e/accessibility.spec.ts`: Listenseite mit Wünschen, Detailseite mit Link und
      Beschreibung, „Wunsch erstellen“ mit angezeigten Fehlern

**Automatisierte Verifikation**:
- [ ] `npm run test:unit` grün inklusive aller neuen Domänen-, Use-Case-, Adapter- und
      `wishTexts`-Tests
- [ ] `npm run lint` grün
- [ ] `npm test` grün inklusive `wishes.spec.ts` und `colorScheme.spec.ts`

**Manuelle Verifikation**:
- [ ] iPhone: Beim Tippen in „Preis in Euro“ erscheint die Zifferntastatur mit Komma
- [ ] iPhone mit VoiceOver: Ein Listeneintrag wird als „Fahrradhelm, unbedingt,
      49,99 €, Link“ gelesen, ohne Sterne. Der Link-Knopf öffnet den Shop, und man kommt
      in die App zurück.
- [ ] VoiceOver im Formular: Nach „Speichern“ mit leerem Namen landet der Fokus auf
      „Name“, und der Fehlertext wird vorgelesen

### Phase 3: Bearbeiten und Löschen

Abhängigkeiten: Phase 2

Listen umbenennen und löschen (mit ihren Wünschen), Wünsche bearbeiten und löschen, alles
mit dem eigenen Bestätigungsdialog.

**Aufgaben**:
- [ ] Use Cases, TDD:
  - `RenameWishlist.execute(id, name)` speichert den neuen Namen; unbekannt →
    `WishlistNotFound`
  - `DeleteWishlist.execute(id)` löscht die Liste und **nur** ihre Wünsche; die Wünsche
    anderer Listen bleiben
  - `EditWish.execute(id, details)` speichert die neuen Details, `gifted` bleibt;
    unbekannt → `WishNotFound`
  - `DeleteWish.execute(id)` entfernt den Wunsch
- [ ] `WishRepository.deleteAllOf` in Fake und Adapter, Adaptertest ergänzt
- [ ] `src/shared/ui/ConfirmDialog.svelte`: `<dialog aria-labelledby aria-describedby>`,
      `h2`, Text, eigene Knopfzeile (nicht `ActionBar`) mit [🗑 {confirmLabel}] und
      [✕ Abbrechen]. `open(returnFocusTo)` merkt sich das Element, ruft `showModal()` auf
      und fokussiert „Abbrechen“. Das Ereignis `close` (auch per Escape) gibt den Fokus an
      `returnFocusTo` zurück. „Löschen“ schließt erst den Dialog, dann folgt `onconfirm`. Der
      Hintergrund (`::backdrop`) ist halbtransparent schwarz, der Dialog nutzt die
      Farbtokens.
- [ ] `ui/wishTexts.ts`: `wishlistDeletionMessage` mit Test: 0 → „„X“ wird gelöscht.“,
      1 → „„X“ mit 1 Wunsch wird gelöscht.“, 5 → „„X“ mit 5 Wünschen wird gelöscht.“
- [ ] `ui/EditWishlistPage.svelte`: Formular wie beim Erstellen, vorbelegt. Am Ende
      [🗑 Wunschliste löschen] öffnet den Dialog „Wunschliste löschen?“ mit der Anzahl aus
      `WatchWishesOfWishlist`. Aufruf `open(event.currentTarget)`. `ActionBar`:
      [💾 Speichern] → `goBack(<Liste>)`, [✕ Abbrechen] → `goBack(<Liste>)`. Löschen →
      `replaceWith('#/')`. Unbekannte ID → `NotFound`.
- [ ] `ui/WishlistPage.svelte`: Kopf-Knopf [✏] „Wunschliste bearbeiten“ (Lucide `Pencil`)
      vor [+]
- [ ] `ui/EditWishPage.svelte`: `WishForm` vorbelegt, Zusatzinhalt [🗑 Wunsch löschen] mit
      Dialog „Wunsch löschen?“ / „„Fahrradhelm“ wird gelöscht.“. Speichern und Abbrechen →
      `goBack(<Detailseite>)`, Löschen → `replaceWith` zur Liste des Wunsches.
- [ ] `ui/WishPage.svelte`: `ActionBar` mit [✏ Bearbeiten] (Lucide `Pencil`, Link auf
      `#/wunsch/<id>/bearbeiten`)
- [ ] `e2e/editing.spec.ts`:
  - Liste umbenennen → Listenseite mit neuem h1; `page.goBack()` führt zur Übersicht
    (kein doppelter Eintrag der Liste); Übersicht neu sortiert
  - Liste im Filter „Erfüllte“ öffnen (Adresse `/erfuellt`) → bearbeiten → Speichern →
    wieder `/erfuellt`
  - Liste mit zwei Wünschen löschen (Knopf per `focus()` und `press('Enter')`, damit der
    Fokus-Rücksprung unabhängig vom Klickverhalten von WebKit prüfbar ist): Dialog nennt
    „mit 2 Wünschen“, Fokus liegt auf „Abbrechen“; „Abbrechen“ → Dialog zu, Fokus wieder
    auf „Wunschliste löschen“, nichts
    gelöscht; erneut öffnen, Escape → ebenso; „Löschen“ → Übersicht ohne die Liste, die
    Wünsche sind aus `wunschliste.wishes` verschwunden, die einer anderen Liste nicht
  - nach dem Löschen `page.goBack()` → „Diese Wunschliste gibt es nicht mehr.“
  - Wunsch bearbeiten: Preis leeren und Bewertung auf „keine Angabe“ → Detailseite ohne
    Zusammenfassung
  - Wunsch löschen → Listenseite ohne den Wunsch
- [ ] `e2e/accessibility.spec.ts`: „Wunschliste bearbeiten“, „Wunsch bearbeiten“ und der
      offene Löschdialog

**Automatisierte Verifikation**:
- [ ] `npm run test:unit` grün inklusive der neuen Use-Case- und Texttests
- [ ] `npm run lint` grün
- [ ] `npm test` grün inklusive `editing.spec.ts` und der Dialog-Prüfung mit axe

**Manuelle Verifikation**:
- [ ] iPhone mit VoiceOver: „Wunschliste löschen“ doppeltippen → VoiceOver liest
      „Wunschliste löschen?“ und den Text mit der Anzahl, der Fokus steht auf
      „Abbrechen“. Wischen verlässt den Dialog nicht. Die Zwei-Finger-Z-Geste schließt
      ihn, danach steht der Fokus wieder auf „Wunschliste löschen“.
- [ ] Der Dialog sieht in allen drei Farbschemata stimmig aus

### Phase 4: Schenken und Filter

Abhängigkeiten: Phase 3

Wünsche verschenken und das Schenken zurücknehmen. Die Listenseite filtert nach
„Offene“ und „Erfüllte“, der Filter steht in der Adresse.

**Aufgaben**:
- [ ] Domäne, TDD:
  - `gift()` auf einem offenen Wunsch → `gifted`, nicht mehr `isOpen`; auf einem
    verschenkten → `WishAlreadyGifted`
  - `takeBackGift()` auf einem verschenkten → offen; auf einem offenen → `WishNotGifted`
  - `wishesMatching(wishes, 'open')` / `'fulfilled'` trennt nach `isOpen` und erhält die
    Reihenfolge
- [ ] Use Cases, TDD: `GiftWish.execute(id)`, `TakeBackGift.execute(id)` laden, rufen die
      Domäne auf, speichern; unbekannt → `WishNotFound`
- [ ] `ui/WishPage.svelte`: in der `ActionBar` rechts [🎁 Schenken] (Lucide `Gift`) bzw.
      [↶ Schenken zurücknehmen] (Lucide `Undo2`), jeweils `<button>`. Ist der Wunsch
      verschenkt, steht unter der Zusammenfassung „Erfüllt“. Eine immer vorhandene
      Statuszeile `role="status"` erhält nach der Aktion „Als erfüllt markiert.“ bzw.
      „Wieder offen.“. Der Fokus bleibt auf dem Knopf.
- [ ] `ui/WishlistPage.svelte`: zwischen Kopf und Liste zwei `<button aria-pressed>`
      „Offene Wünsche“ / „Erfüllte Wünsche“ mit Knopf-Optik, der gedrückte gefüllt
      (`.button`), der andere `.button--quiet`. Tippen → `replaceWith` auf die Adresse mit
      dem anderen Filter, der Fokus bleibt auf dem Knopf (kein Seitenwechsel dank
      `pageKeyOf`). Die Liste zeigt `wishesMatching(…)`. Leere Zustände je Filter laut
      Akzeptanzkriterien.
- [ ] `e2e/gifting.spec.ts`:
  - Wunsch öffnen → „Schenken“ → Statuszeile „Als erfüllt markiert.“, Knopf heißt
    „Schenken zurücknehmen“, „Erfüllt“ sichtbar
  - zurück zur Liste: Wunsch fehlt unter „Offene Wünsche“ („Offene Wünsche“ hat
    `aria-pressed="true"`)
  - „Erfüllte Wünsche“ per `focus()` und `press('Space')` → URL endet auf `/erfuellt`,
    Wunsch sichtbar, der Knopf ist weiterhin fokussiert, `aria-pressed="true"`, h1
    **nicht** fokussiert, Titel unverändert „<Listenname> – Wunschliste“
  - Wunsch aus „Erfüllte“ öffnen, `page.goBack()` → wieder „Erfüllte“
  - Filter hin und her, dann `page.goBack()` → Seite vor der Liste (kein Eintrag je
    Umschalten)
  - „Schenken zurücknehmen“ → Wunsch wieder unter „Offene Wünsche“
  - leerer Zustand „Noch keine erfüllten Wünsche.“ ohne Knopf
- [ ] `e2e/accessibility.spec.ts`: Listenseite mit Filter „Erfüllte“, Detailseite eines
      verschenkten Wunsches

**Automatisierte Verifikation**:
- [ ] `npm run test:unit` grün inklusive der Tests für Schenken, Filter und Use Cases
- [ ] `npm run lint` grün
- [ ] `npm test` grün inklusive `gifting.spec.ts`

**Manuelle Verifikation**:
- [ ] iPhone mit VoiceOver: „Schenken“ doppeltippen → VoiceOver sagt „Als erfüllt
      markiert.“, danach heißt der Knopf „Schenken zurücknehmen“
- [ ] Filter: VoiceOver liest „Offene Wünsche, Taste, ausgewählt“ (bzw. die tatsächliche
      Ansage für `aria-pressed` notieren, falls sie abweicht)
- [ ] Gesamtablauf auf dem iPhone: Liste anlegen, drei Wünsche, einen verschenken, App
      schließen und neu starten → alles unverändert da

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- Konzept: `docs/agents/research/2026-09-28-wunschliste-konzept.md`
- Vorgänger: `docs/agents/plans/2026-09-28-geruest-pwa-navigation-farbschema.md` (WL-001)
- Architektur: `.claude/skills/architecture/SKILL.md`
- `<dialog>` und `showModal()`: https://developer.mozilla.org/de/docs/Web/HTML/Element/dialog
- `location.replace()` löst bei reiner Hash-Änderung `hashchange` aus:
  https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-location-replace
- `aria-pressed`: https://www.w3.org/WAI/ARIA/apg/patterns/button/
- `aria-current`: https://www.w3.org/TR/wai-aria-1.2/#aria-current
- `Intl.NumberFormat`: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
- Firestore `onSnapshot` (Form der Ports für Schritt 3):
  https://firebase.google.com/docs/firestore/query-data/listen
