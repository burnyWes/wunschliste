---
date: 2026-09-28T12:49:19+00:00
git_commit: 15f72d0fa59d97ffb260379c810e04a1b36db179
branch: main
story: WL-003
topic: "Nativere Anmutung: Knöpfe statt Links, Navigation ohne Verlauf, Ansagen, Tastatur und Berührung"
tags: [plan, router, navigation, shared-ui, accessibility, voiceover, pwa, wishlist-ui]
status: ready
---

# PLAN: WL-003 — Nativere Anmutung: Knöpfe, Navigation ohne Verlauf, Ansagen, Tastatur

Die App soll sich auf dem iPhone mit VoiceOver so selbstverständlich anfühlen wie der
Mahlzeitenplaner. Grundlage ist die Untersuchung
`docs/agents/research/2026-09-28-voiceover-anmutung-im-vergleich-zum-mahlzeitenplaner.md`.
Deren Kernbefund: „…, Link“ statt „…, Taste“ kommt vom Navigationsmodell (Hash-Router mit
Verlauf und `<a href>`), nicht vom Framework.

## Akzeptanzkriterien

- Innerhalb der App wird jedes Bedienelement als Taste angesagt, z. B. „Wunschliste
  erstellen, Taste“ oder „Geburtstag, Taste“. Die einzige Ausnahme ist „Zum Angebot auf
  …“, das bleibt ein Link, weil es die App verlässt.
- Seitenwechsel legen **keine** History-Einträge an. Die Adresse im Hash wird nur
  ersetzt, und Neuladen zeigt dieselbe Seite.
- „Zurück“, „Abbrechen“ und „Speichern“ führen immer zur fachlichen Elternseite. Ist das
  eine Wunschliste, erscheint sie mit dem zuletzt gewählten Filter. Nach einem Neustart
  ist das „Offen“.
- Die Hauptnavigation erscheint nur auf „Wunschlisten“ und „Einstellungen“. Sie besteht
  aus zwei gleich breiten Knöpfen mit Text (Einstellungen zusätzlich mit Zahnrad). Der
  aktive Knopf ist gefüllt und trägt `aria-current="page"`. Alle Unterseiten haben oben
  einen Zurück-Knopf. „Wunschliste erstellen“ bekommt dafür „Abbrechen“, wie die anderen
  Formulare.
- Auf „Wunschliste erstellen“ und „Wunsch erstellen“ liegt nach dem Seitenwechsel der
  Fokus im Namensfeld, auf allen anderen neu gezeigten Seiten auf der h1. Beim App-Start
  wird kein Fokus gesetzt.
- Erstellen, Speichern, Löschen und Schenken melden ihr Ergebnis über einen zentralen
  Ansager (`role="status"`), der den Seitenwechsel übersteht.
- Bei offener Bildschirmtastatur fließt die untere Leiste ans Formularende, statt am
  unteren Rand zu kleben.
- Antippen zeigt keinen grauen Web-Blitz, dafür eine sichtbare `:active`-Rückmeldung.
  Langes Drücken auf Knöpfe markiert keinen Text und öffnet kein Kontextmenü, und
  Doppeltippen zoomt nicht.

## Wesentliche Entscheidungen und Abwägungen

1. **Adresse im Hash, aber ohne Verlauf.** Jeder Seitenwechsel läuft über
   `location.replace`.
   - Warum: Es gibt kein Zurück-Wischen, das aus der App führt (dieselbe Begründung wie
     im Mahlzeitenplaner). Neuladen, das Wiederaufsetzen nach dem Beenden durch iOS und
     der Direkteinstieg der E2E-Tests bleiben erhalten. Ein reiner State ohne Router
     hätte all das verloren.
   - Auswirkung: `navigation.ts` schrumpft auf `navigateTo(hash)`. Es entfallen
     History-Marker, `goBack`, `backTargetFor` und `navigation.test.ts`.
     `CurrentRoute` verliert die Marker-Logik.
2. **`<button>` statt `<a>` für alles innerhalb der App.**
   - Warum: Das ist die ehrliche Rolle, wenn es keine Verlaufs-Navigation mehr gibt, und
     VoiceOver sagt dann „Taste“ wie im Mahlzeitenplaner.
   - Auswirkung: Nur `WishPage` „Zum Angebot“ bleibt `<a class="button">`. `.link-list`
     wird zu `.entry-list` für `<button>`. Rund 40 `getByRole('link')` in den E2E-Tests
     werden zu `getByRole('button')`.
3. **Hauptnavigation nur auf den Hauptseiten, als gleich breite Segmentleiste mit Text.**
   - Warum: Das ist das übliche iOS-Muster. Unterseiten haben Zurück, und die Texte
     entsprechen der Vorgabe aus `docs/notes.txt`.
   - Auswirkung: `navigationTargetOf` und `aria-current="true"` entfallen, neu ist
     `mainPageOf(route)`. Der Streifen hinter der Statusleiste bleibt auf allen Seiten.
4. **Zuletzt gewählter Filter je Wunschliste im Arbeitsspeicher**
   (`wishlist/infrastructure/ui`).
   - Warum: Ohne Verlauf muss Zurück selbst wissen, aus welcher Ansicht man kam.
     Heute leistet das `history.back()`.
   - Auswirkung: Die Klasse `WishlistFilterMemory` wird per Unit-Test abgesichert. Jedes
     Zurück-Ziel „Wunschliste“ läuft über `wishlistFilterMemory.hashOf(wishlistId)`.
5. **Zentraler Ansager in `src/shared/ui`**, gerendert in `App.svelte`, visuell versteckt.
   - Warum: Ein lokales `role="status"` verschwindet mit der alten Seite.
   - Auswirkung: Das Status-`<p>` in `WishPage` entfällt. Wiederholte gleiche Texte
     werden mit einem unsichtbaren Zeichen unterschieden, wie in
     `Mahlzeitenplaner/src/shared/ui/announcement.ts`.
6. **Fokus:** Die Fokusanforderung bei einem Seitenwechsel bleibt. Die Erstellen-Seiten
   nehmen sie für das Namensfeld statt für die h1.
   - Warum: Man kann dort sofort tippen. Auf Bearbeiten-Seiten will man zuerst den
     Kontext hören.
   - Auswirkung: `PageHeader` bekommt `takesFocus` (Standard `true`). `pageFocus.ts`
     heißt künftig `requestPageFocus` / `takePageFocusRequest`.
7. **`ActionBar` bleibt `sticky`** (Entscheidung 8 aus WL-001, wegen Dynamic Type).
   Ist die Tastatur offen, steht sie im Fluss.
   - Warum: Die Leiste soll nicht hinter der Tastatur hängen oder beim Scrollen springen.
   - Auswirkung: `onScreenKeyboard.svelte.ts` enthält eine reine Prüffunktion samt
     Unit-Test und eine reaktive Klasse auf `visualViewport`. Die Schwelle ist 150 px
     wie im Mahlzeitenplaner.
8. **Berührungs-CSS zentral** in `global.css` und `buttons.css`. Es gibt kein
   `overscroll-behavior` und keine Animationen.
   - Warum: Das Nachfedern ist auf iOS nativ. Übergänge wirken nur mit großem Aufwand
     echt und stören bei „Bewegung reduzieren“.
9. **Der Löschdialog bleibt unverändert.** Er ist bereits barrierearm, seine Knöpfe
   sind schon `<button>`.

## Ausgangslage

```
location.hash ──► CurrentRoute (hashchange) ──► {#key pageKey} ──► Seite
      ▲                                                  │
      │  <a href="#/…">   → neuer History-Eintrag        │
      │  goBack()         → history.back() oder          │
      │                     location.replace (Marker)    │
      └──────────────────────────────────────────────────┘
```

- `src/app/App.svelte:23-36`: `<header>` mit Statusleisten-Streifen und
  `MainNavigation` auf **allen** Seiten, darunter ein `<main>`.
- `src/app/layout/MainNavigation.svelte:18-33`: zwei `<a class="button">`,
  `aria-current` = `page` bzw. `true` auf Unterseiten.
- `src/shared/ui/navigation.ts:31-55`: Marker im History-State, `replaceWith` und `goBack`.
- `src/shared/ui/PageHeader.svelte:29-40`: Zurück als `<a>` mit `preventDefault` und
  `goBack`, h1-Fokus über `takeHeadingFocusRequest`.
- `<a class="button">` gibt es in `WishlistsPage.svelte:20,29`,
  `WishlistPage.svelte:46,53,77`, `WishPage.svelte:61,71`. Listeneinträge `<a>` stehen in
  `WishlistsPage.svelte:37` und `WishlistPage.svelte:86`, „Zur Übersicht“ in
  `NotFound.svelte:11`.
- `CreateWishlistPage.svelte` hat nur „Erstellen“. Zurück kommt man heute nur über die
  Hauptnavigation.
- `WishPage.svelte:69`: lokales `role="status"` für Schenken.
- `ActionBar.svelte:9-22`: `sticky; bottom: 0`, keine Rücksicht auf die Tastatur.
- Es gibt kein CSS für Berührungen (`tap-highlight`, `:active`, `touch-action`, …).

```
Heute (alle Seiten)                 Unterseite heute
┌─────────────────────────────┐     ┌─────────────────────────────┐
│[Wunschlisten]  [⚙ Einstell.]│     │[Wunschlisten]  [⚙ Einstell.]│
├─────────────────────────────┤     ├─────────────────────────────┤
│ Wunschlisten            [+] │     │ ‹ Geburtstag                │  ← „…, Link“
│ Geburtstag               ›  │     │ Fahrradhelm                 │
│ Weihnachten              ›  │     │ ★★ · 12,50 €                │
                                    ├─────────────────────────────┤
                                    │ [✏ Bearbeiten] [🎁 Schenken] │
```

## Zielbild

```
navigateTo(hash) ──► location.replace ──► hashchange ──► CurrentRoute ──► Seite
                     (kein neuer Eintrag)                  │
                                                           └─ requestPageFocus()
Zurück / Abbrechen / Speichern ──► navigateTo(Elternseite)
                                   Wunschliste: wishlistFilterMemory.hashOf(id)
Ergebnis ──► announce(text) ──► <p role="status"> in App.svelte (übersteht Wechsel)
```

**Hauptseiten**

```
┌──────────────┬──────────────┐
│▓Wunschlisten▓│ ⚙ Einstellung│   gleich breit, aktiv gefüllt, aria-current="page"
├──────────────┴──────────────┤
│ Wunschlisten            [+] │   [+] = <button aria-label="Wunschliste erstellen">
│ Geburtstag               ›  │   <button> in .entry-list
│ Weihnachten              ›  │
```

**Unterseiten**: kein Navigationsbalken, nur der Statusleisten-Streifen

```
┌─────────────────────────────┐
│ ‹ Geburtstag                │   <button aria-label="Zurück zu Geburtstag">
│ Fahrradhelm                 │
│ ★★ · 12,50 €                │
│ [↗ Zum Angebot auf amazon.de]│   bleibt <a>, „…, Link“
├─────────────────────────────┤
│ [✏ Bearbeiten] [🎁 Schenken] │   beide <button>
```

**Wunschliste erstellen**, jetzt mit Abbrechen

```
│ Wunschliste erstellen       │
│ Name                        │
│ [▌                        ] │  ← Fokus hier
├─────────────────────────────┤
│   [+ Erstellen] [✕ Abbrechen]│
```

**Tastatur offen**: Die Leiste steht im Fluss am Formularende.

```
│ Preis in Euro [12,50     ]  │
│ Wie sehr gewünscht? …       │
│ [💾 Speichern] [✕ Abbrechen] │
├─────────────────────────────┤
│         ⌨ Tastatur           │
```

**Zurück-Ziele**

| Seite | Zurück / Abbrechen / Speichern | Nach Löschen | Nach Erstellen |
|---|---|---|---|
| Wunschliste | Wunschlisten | – | – |
| Wunschliste erstellen | Abbrechen → Wunschlisten | – | neue Wunschliste (Offen) |
| Wunschliste bearbeiten | Wunschliste (gemerkter Filter) | Wunschlisten | – |
| Wunsch | Wunschliste (gemerkter Filter) | – | – |
| Wunsch erstellen | Abbrechen → Wunschliste (gemerkter Filter) | – | neuer Wunsch |
| Wunsch bearbeiten | Wunsch | Wunschliste (gemerkter Filter) | – |
| Nicht gefunden | „Zur Übersicht“ → Wunschlisten | – | – |

**Ansagen** (Texte in `wishTexts.ts`)

| Aktion | Text |
|---|---|
| Wunschliste erstellt | `Wunschliste erstellt.` |
| Wunschliste gespeichert | `Gespeichert.` |
| Wunschliste gelöscht | `Wunschliste „Geburtstag“ gelöscht.` |
| Wunsch erstellt | `Wunsch erstellt.` |
| Wunsch gespeichert | `Gespeichert.` |
| Wunsch gelöscht | `Wunsch „Fahrradhelm“ gelöscht.` |
| Schenken | `Als erfüllt markiert.` |
| Schenken zurücknehmen | `Wieder offen.` |

## Abstraktionen und Wiederverwendung

- `src/shared/ui`
  - `navigation.ts`: Aus `replaceWith` wird `navigateTo(hash)`. `HistoryEntryState`,
    `markStartEntry`, `markNewEntry`, `isHistoryEntryMarked`, `backTargetFor` und `goBack`
    entfallen.
  - `navigation.test.ts`: entfällt, weil `backTargetFor` wegfällt.
  - `pageFocus.ts`: umbenannt in `requestPageFocus` / `takePageFocusRequest`.
  - `PageHeader.svelte`: Zurück als `<button>`, neue Prop `takesFocus`.
  - `announcement.ts` / `announcement.test.ts` (neu): `announcementText(text, repetition)`.
  - `announcer.svelte.ts` (neu): `announce(text)` und reaktiv lesbares `spokenText`.
  - `Announcer.svelte` (neu): `<p class="visually-hidden" role="status">`.
  - `onScreenKeyboard.svelte.ts` / `onScreenKeyboard.test.ts` (neu):
    `isOnScreenKeyboardOpen(...)` und die Klasse `OnScreenKeyboard`.
  - `ActionBar.svelte`: weicht der Tastatur.
  - `buttons.css`: `:active`, `user-select`, `touch-callout`.
  - `linkList.css` → `entryList.css`: `.entry-list button`.
- `src/app`
  - `App.svelte`: Navigation nur auf Hauptseiten, `Announcer` eingebunden.
  - `layout/MainNavigation.svelte`: Knöpfe, gleich breit.
  - `router/routes.ts` / `routes.test.ts`: `mainPageOf` statt `navigationTargetOf`.
  - `router/currentRoute.svelte.ts`: ohne Marker.
  - `global.css`: `tap-highlight`, `touch-action`.
- `src/main.ts`: bindet `entryList.css` ein und registriert einen leeren
  `touchstart`-Listener für `:active`.
- `src/wishlist/infrastructure/ui`
  - `wishlistFilterMemory.ts` / `.test.ts` (neu): `WishlistFilterMemory` und die
    Instanz `wishlistFilterMemory`.
  - `wishTexts.ts` / `.test.ts`: Ansagetexte.
  - Alle Seiten: `<a>` → `<button>`, `navigateTo`, Zurück-Ziele laut Tabelle, `announce`.

Die bestehende Ausnahme für Svelte-Runen-Dateien (`*.svelte.ts`) liegt bereits in
`shared/ui` (`watched.svelte.ts`). Die Architekturregel erlaubt dort also Svelte-Importe.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

### Phase 1: Knöpfe statt Links, Navigation ohne Verlauf

Abhängigkeiten: keine

Alle Seitenwechsel innerhalb der App laufen über `<button>` und `navigateTo`, ohne
History-Einträge. Zurück kennt den Filter der Wunschliste, und die Hauptnavigation gibt
es nur noch auf den Hauptseiten.

**Aufgaben**:
- [x] `src/wishlist/infrastructure/ui/wishlistFilterMemory.test.ts` zuerst schreiben:
  Ohne Eintrag liefert `hashOf` `#/liste/<id>`. Nach `remember(id, 'fulfilled')` liefert
  es `#/liste/<id>/erfuellt`. Zwei Wunschlisten stören sich nicht gegenseitig.
- [x] `wishlistFilterMemory.ts` umsetzen:
  ```ts
  export class WishlistFilterMemory {
    readonly #filters = new Map<WishlistId, WishFilter>();
    remember(wishlistId: WishlistId, filter: WishFilter): void { … }
    hashOf(wishlistId: WishlistId): string {
      return hashOf({ page: 'wishlist', wishlistId, filter: this.#filters.get(wishlistId) ?? 'open' });
    }
  }
  export const wishlistFilterMemory = new WishlistFilterMemory();
  ```
- [x] `src/shared/ui/navigation.ts`: nur noch
  ```ts
  export function navigateTo(hash: string): void {
    if (location.hash !== hash) {
      location.replace(hash);
    }
  }
  ```
  `navigation.test.ts` löschen.
- [x] `src/app/router/currentRoute.svelte.ts`: Marker-Aufrufe im Konstruktor und in
  `followHashChanges` entfernen. `#showCanonicalHash` bleibt.
- [x] `src/app/router/routes.ts`: `navigationTargetOf` ersetzen durch
  `mainPageOf(route): MainPage | undefined` (`'wishlists' | 'settings'`), das nur für die
  Seiten `wishlists` und `settings` einen Wert liefert. Den Test in `routes.test.ts`
  anpassen: `createWishlist` und `wishlist` ergeben `undefined`.
- [x] `src/app/App.svelte`: `MainNavigation` nur rendern, wenn `mainPageOf(route)`
  definiert ist, und den aktiven Wert als Prop übergeben. `.status-bar-backdrop` bleibt
  immer im `<header>`.
- [x] `src/app/layout/MainNavigation.svelte`: zwei `<button type="button" class="button">`
  mit `onclick={() => navigateTo(…)}` und `aria-current={active ? 'page' : undefined}`.
  Inaktive Knöpfe bekommen `button--quiet`. Im Layout `nav { display: flex; gap: 0.5rem }`
  und `nav > .button { flex: 1 1 0 }`, das ergibt gleich breite Knöpfe, die bei Dynamic
  Type umbrechen dürfen (`flex-wrap: wrap`).
- [x] `src/shared/ui/PageHeader.svelte`: Zurück wird
  `<button type="button" class="back-button" aria-label="Zurück zu {label}" onclick={() => navigateTo(back.hash)}>`.
  Das Button-Styling wird zurückgesetzt (kein Rahmen, kein Hintergrund,
  `color: inherit`, `font: inherit`, `padding: 0`). Die bisherige Optik mit Chevron,
  `font-weight: 600` und `min-height: 2.75rem` bleibt.
- [x] `src/shared/ui/linkList.css` → `entryList.css` mit der Klasse `.entry-list`. Die
  Regeln gelten für `button`: volle Breite, `text-align: start`, kein Rahmen, kein
  Hintergrund, `color: inherit`, `font: inherit`. Import in `src/main.ts` anpassen.
- [x] `WishlistsPage.svelte`: [+] und der Knopf im Leerzustand werden
  `<button type="button" class="button …" onclick={() => navigateTo(createWishlistHash)}>`,
  Listeneinträge werden `<button type="button">` in `.entry-list`.
- [x] `WishlistPage.svelte`: Bearbeiten, [+], den Knopf im Leerzustand und die
  Listeneinträge wie oben umstellen. `$effect(() => wishlistFilterMemory.remember(wishlistId, filter))`
  ergänzen. `show()` nutzt `navigateTo`.
- [x] `WishPage.svelte`: Bearbeiten wird `<button>`, „Zum Angebot“ bleibt `<a>`. Als
  Zurück-Ziel dient `wishlistFilterMemory.hashOf(wishlist.value.id)`.
- [x] `CreateWishlistPage.svelte`: `navigateTo` statt `replaceWith` und neuer Knopf
  „Abbrechen“ (X-Icon) → `navigateTo(hashOf({ page: 'wishlists' }))`.
- [x] `EditWishlistPage.svelte`: Speichern und Abbrechen führen per `navigateTo` zu
  `wishlistFilterMemory.hashOf(wishlistId)`, Löschen führt zu `#/`.
- [x] `WishForm.svelte`: `cancelFallback` → `cancelTarget`, Abbrechen ruft
  `navigateTo(cancelTarget)`.
- [x] `CreateWishPage.svelte`: `cancelTarget = wishlistFilterMemory.hashOf(wishlistId)`,
  nach dem Erstellen `navigateTo(hashOf({ page: 'wish', wishId }))`.
- [x] `EditWishPage.svelte`: Speichern führt per `navigateTo` zu `wishHash`, Löschen zu
  `wishlistFilterMemory.hashOf(wish.value.wishlistId)`.
- [x] `NotFound.svelte`: „Zur Übersicht“ wird `<button type="button" class="button">`.
- [x] E2E-Tests anpassen: In-App-`getByRole('link')` wird `getByRole('button')`. Das
  betrifft `backLinks`, `editing`, `gifting`, `navigation`, `wishes`, `wishlists`,
  `accessibility`. In `colorScheme.spec.ts` werden `nav a[…]` zu `nav button[…]`,
  in `gifting.spec.ts:84` die Prüfung auf den Angebotslink bleibt `link`.
- [x] Tests, die `page.goBack()` als Verlaufs-Verhalten prüfen, auf das neue Modell
  umschreiben (`backLinks.spec.ts:16-28`, `editing.spec.ts:41,94`, `gifting.spec.ts:47,62`,
  `navigation.spec.ts:31`, `wishes.spec.ts:35`, `wishlists.spec.ts:43-53`): Statt
  `goBack` wird `history.length` vor und nach den Wechseln verglichen, und er bleibt
  gleich. Die Fokusprüfungen nach „Zurück“ bleiben.
- [x] Neuer E2E-Test in `backLinks.spec.ts`: „keeps the filter of the wishlist“ geht
  über den Filterknopf „Erfüllte Wünsche“ → Zelt → „Zurück zu Geburtstag“ und landet auf
  `#/liste/birthday/erfuellt`. Außerdem: Der Direkteinstieg `#/wunsch/tent` führt mit
  „Zurück“ zu `#/liste/birthday` (Offen).
- [x] Neuer E2E-Test in `navigation.spec.ts`: Die Hauptnavigation ist auf `#/` und
  `#/einstellungen` sichtbar, auf `#/liste/birthday` und `#/liste/neu` nicht.
  Außerdem sind beide Knöpfe gleich breit (Breiten-Differenz unter 1 px).
- [x] Neuer E2E-Test in `wishlists.spec.ts`: „Abbrechen“ auf „Wunschliste erstellen“
  führt zu „Wunschlisten“, und es wird nichts angelegt.
- [x] Neuer E2E-Test in `accessibility.spec.ts`: Auf den Seiten Übersicht, Liste und
  Wunsch gibt es im `main` bzw. in der `navigation` keinen `link` außer „Zum Angebot“.

**Automatisierte Verifikation**:
- [x] `npm run test:unit`: `wishlistFilterMemory.test.ts` und `routes.test.ts` grün.
- [x] `npm run test:e2e`: alle Specs grün, einschließlich der neuen Tests.
- [x] `npm run lint` und `npm run test:architecture` grün.

**Manuelle Verifikation** (iPhone, Home-Bildschirm-App, VoiceOver):
- [x] „Wunschliste erstellen, Taste“, „Geburtstag, Taste“ und „Zurück zu Geburtstag,
  Taste“ werden so angesagt, „Zum Angebot auf …“ weiterhin als Link.
- [x] Die Zurück-Wischgeste vom linken Rand bzw. VoiceOvers Zwei-Finger-Z verlässt die
  App nicht und springt nicht auf eine frühere Seite.

### Phase 2: Fokus und Ansagen

Abhängigkeiten: Phase 1

Die Erstellen-Seiten setzen den Fokus ins Namensfeld. Ergebnisse von Aktionen werden über
einen zentralen Ansager gesprochen.

**Aufgaben**:
- [x] `src/shared/ui/pageFocus.ts`: `requestHeadingFocus` / `takeHeadingFocusRequest` in
  `requestPageFocus` / `takePageFocusRequest` umbenennen, Aufrufer in
  `currentRoute.svelte.ts` und `PageHeader.svelte` anpassen.
- [x] `PageHeader.svelte`: neue Prop `takesFocus = true`. Ist sie `false`, bleibt die
  Anforderung unberührt. `PageHeader` wird vor dem Formular gemountet, deshalb darf es
  die Anforderung dann nicht verbrauchen.
- [x] `WishlistNameForm.svelte` und `WishForm.svelte`: neue Prop `focusesName = false`.
  Ist sie gesetzt, bekommt `PageHeader` `takesFocus={false}`, und in `onMount` gilt
  `if (takePageFocusRequest()) nameField.focus()`.
- [x] `CreateWishlistPage.svelte` und `CreateWishPage.svelte`: `focusesName` setzen.
- [x] `src/shared/ui/announcement.test.ts` zuerst schreiben, dann `announcement.ts`
  umsetzen: `announcementText('', n)` ergibt `''`, und eine gerade bzw. ungerade
  Wiederholung ergibt den Text ohne bzw. mit angehängtem `​`. Das Verfahren stammt
  aus `Mahlzeitenplaner/src/shared/ui/announcement.ts`.
- [x] `src/shared/ui/announcer.svelte.ts`: modulweiter `$state` mit `{ text, repetition }`,
  `announce(text)` erhöht `repetition`, `spokenText()` liefert `announcementText(...)`.
- [x] `src/shared/ui/Announcer.svelte`: `<p class="visually-hidden" role="status">{spokenText()}</p>`.
  Einbinden in `App.svelte` außerhalb von `{#key}`, damit der Ansager den Seitenwechsel
  übersteht.
- [x] `wishTexts.test.ts` zuerst ergänzen, dann `wishTexts.ts`: Konstanten und Funktionen
  für die Ansagetexte laut Tabelle im Zielbild, z. B. `wishlistDeletedAnnouncement(name)`
  und `wishDeletedAnnouncement(name)`.
- [x] Die Seiten rufen `announce(...)` nach dem Aufruf des Anwendungsfalls auf, direkt
  nach `navigateTo`:
  - `CreateWishlistPage` (erstellt)
  - `EditWishlistPage` (gespeichert, gelöscht mit Namen)
  - `CreateWishPage` (erstellt)
  - `EditWishPage` (gespeichert, gelöscht mit Namen)
  - `WishPage` (Schenken und Zurücknehmen)
  Bei Abbrechen gibt es keine Ansage.
- [x] `WishPage.svelte`: `statusMessage`, `<p class="status" role="status">` und die
  zugehörige CSS-Regel entfernen.
- [x] E2E `wishlists.spec.ts:21` und die Erstellen-Seiten in `wishes.spec.ts`: Statt der
  h1 wird das Namensfeld fokussiert. Bearbeiten-Seiten behalten den Fokus auf der h1
  (neuer Testfall).
- [x] E2E: Ansagen prüfen über `page.getByRole('status')`. Dazu gehören je ein Test für
  Wunschliste erstellt, Wunsch gespeichert und Wunsch gelöscht („Wunsch „Fahrradhelm“
  gelöscht.“). Die bestehenden Schenken-Tests (`gifting.spec.ts:27,73`) bleiben grün.
- [x] E2E `navigation.spec.ts`: Beim App-Start ist weder die h1 noch das Namensfeld
  fokussiert, auch nicht beim Direkteinstieg auf `#/liste/neu`.

**Automatisierte Verifikation**:
- [x] `npm run test:unit`: `announcement.test.ts` und `wishTexts.test.ts` grün.
- [x] `npm run test:e2e`: Fokus- und Ansagetests grün.
- [x] `npm run lint` und `npm run test:architecture` grün.

**Manuelle Verifikation** (iPhone, VoiceOver):
- [ ] „Wunschliste erstellen“ antippen: VoiceOver sagt „Name, Textfeld“ o. Ä.
- [ ] Einen Wunsch löschen: VoiceOver sagt die Überschrift der Wunschliste und
  „Wunsch „…“ gelöscht.“, und keine der beiden Ansagen verschluckt die andere.
- [ ] Zweimal hintereinander „Schenken“ und „Schenken zurücknehmen“: Jede Meldung wird
  gesprochen.

### Phase 3: Berührungsgefühl und Tastatur

Abhängigkeiten: Phase 1

Knöpfe reagieren wie native Knöpfe, und die untere Leiste weicht der Bildschirmtastatur.

**Aufgaben**:
- [ ] `src/shared/ui/onScreenKeyboard.test.ts` zuerst schreiben, dann
  `onScreenKeyboard.svelte.ts` umsetzen. Die reine Funktion lautet
  `isOnScreenKeyboardOpen({ layoutHeight, visibleHeight, scale })`: Sie ist `true`, wenn
  `layoutHeight - visibleHeight * scale > 150`. Testfälle sind geschlossen (0), genau
  150 (`false`), 300 (`true`) und Zoom (`scale` 2 bei halber Höhe → `false`).
- [ ] In derselben Datei die Klasse `OnScreenKeyboard` mit `isOpen = $state(...)` und
  `follow(): () => void`. Sie hört auf `visualViewport` `resize` und liest
  `window.innerHeight`. Ohne `visualViewport` bleibt `isOpen` `false`.
- [ ] `ActionBar.svelte`: `const keyboard = new OnScreenKeyboard()`,
  `$effect(() => keyboard.follow())` und
  `class:action-bar--in-flow={keyboard.isOpen}` mit `position: static`. Der obere Rand
  und der Hintergrund bleiben, damit die Leiste als Gruppe erkennbar ist.
- [ ] `src/app/global.css`: `html { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }`.
- [ ] `src/shared/ui/buttons.css`: Ergänzt werden
  ```css
  button,
  .button {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  .button:active,
  .entry-list button:active,
  .back-button:active {
    opacity: 0.6;
  }
  ```
  Die Regel für `.back-button` liegt im globalen CSS, weil `PageHeader` sonst eine
  `:global`-Ausnahme bräuchte.
- [ ] `src/main.ts`: leerer passiver `touchstart`-Listener auf `document`, damit iOS
  `:active` überhaupt anwendet. Mit Warum-Kommentar und Quelle: Apple, Safari Web Content
  Guide, „Handling Events“
  (https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html).
- [ ] E2E `layout.spec.ts`: Ein Test simuliert die offene Tastatur, indem
  `window.visualViewport` per `addInitScript` durch ein Objekt mit reduzierter `height`
  ersetzt und ein `resize` ausgelöst wird. Erwartet wird, dass `.action-bar` die Klasse
  `action-bar--in-flow` trägt und `position: static` hat. Die bestehenden drei
  Layout-Tests bleiben grün.
- [ ] E2E `layout.spec.ts`: Der berechnete Stil eines `.button` hat
  `user-select: none` und `-webkit-tap-highlight-color` mit Alpha 0.

**Automatisierte Verifikation**:
- [ ] `npm run test:unit`: `onScreenKeyboard.test.ts` grün.
- [ ] `npm run test:e2e`: `layout.spec.ts` grün.
- [ ] `npm run lint` und `npm run test:architecture` grün.
- [ ] `npm run build` läuft durch.

**Manuelle Verifikation** (iPhone, Home-Bildschirm-App):
- [ ] Antippen eines Knopfs zeigt kein graues Rechteck, der Knopf wird kurz blasser.
- [ ] Langes Drücken auf „Wunschliste erstellen“ oder einen Listeneintrag markiert
  keinen Text und öffnet kein Menü. Doppeltippen zoomt nicht.
- [ ] „Wunsch bearbeiten“: Beim Tippen ins Feld „Preis“ springt die Leiste ans
  Formularende und liegt nicht hinter der Tastatur. Beim Schließen der Tastatur klebt
  sie wieder unten.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: „Zur Übersicht“ auf „Nicht gefunden“ steht als Knopf in einer `.button-row`,
  weil ein `.button` im Fließtext-`<p>` fremd wirkt.
- Phase 1: `gifting.spec.ts` („shows the empty fulfilled wishes without a create button“)
  prüft jetzt, dass in der `.button-row` kein Knopf „Wunsch erstellen“ steht. Die alte
  Prüfung auf `link` wäre nach dem Umbau immer grün gewesen.
- Phase 1: `history.length` wird über den Helfer `historyLength` in `e2e/seed.ts` gelesen.
- Phase 2: Das Modul heißt `announcements.svelte.ts` statt `announcer.svelte.ts`. Der
  Import `./announcer.svelte` kollidierte unter Windows (Dateisystem ohne Beachtung der
  Groß-/Kleinschreibung) mit `Announcer.svelte`, `svelte-check` meldete das als Fehler.
- Phase 2: Die E2E-Tests prüfen Ansagen über `expectAnnouncement` in `e2e/announcement.ts`.
  Ein exakter Textvergleich scheitert an der ersten Ansage, weil ungerade Wiederholungen
  das unsichtbare Zeichen tragen.

## Verweise

- Untersuchung: `docs/agents/research/2026-09-28-voiceover-anmutung-im-vergleich-zum-mahlzeitenplaner.md`
- Vorgängerpläne: `docs/agents/plans/2026-09-28-geruest-pwa-navigation-farbschema.md`
  (Entscheidungen 5 und 8), `docs/agents/plans/2026-09-28-wunschlisten-und-wuensche-lokal.md`
- Maßstab: `..\Mahlzeitenplaner\src\shared\ui\{Announcer.tsx,announcement.ts,useOnScreenKeyboard.ts,BottomBar.tsx,NavigationBar.tsx}`
- Apple, Safari Web Content Guide, Handling Events:
  https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html
