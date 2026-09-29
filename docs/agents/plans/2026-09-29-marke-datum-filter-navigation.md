---
date: 2026-09-29T15:08:17.463838+00:00
git_commit: 1708771ccfe360b14aba35d74ff214aa68ae5cd3
branch: main
story: WL-007
topic: "Navigation mit Listen-Icon, Filterknöpfe nebeneinander, Marke / Hersteller und „gewünscht seit“"
tags: [plan, wishlist, wish, navigation, filter, firestore, ui]
status: in-progress
---

# PLAN: WL-007 — Listen-Icon, Filterknöpfe, Marke und „gewünscht seit“

Setzt die vier offenen Punkte (`-`) aus `docs/notes.txt` um:

- „gewünscht seit \<Datum\>“ auf der Wunsch-Detailseite anzeigen
- Wunsch: optionales Textfeld „Marke / Hersteller“
- Wunschlisten-Button in der Navigation mit Listen-Icon
- „Offene Wünsche“/„Erfüllte Wünsche“ umbenennen in „Noch offen“/„Erfüllt“, mit Icons,
  nebeneinander

## Akzeptanzkriterien

- Der Knopf „Wunschlisten“ in der Hauptnavigation zeigt das Lucide-Icon `List`, für
  VoiceOver stumm. Sein zugänglicher Name bleibt „Wunschlisten“.
- Die Filterknöpfe heißen „Noch offen“ (Icon `Gift`) und „Erfüllt“ (Icon `PackageOpen`).
  Sie stehen gleich breit nebeneinander in **einer** Zeile, auch auf dem iPhone 15 bei
  doppelter Schriftgröße. Bei Platzmangel bricht der Text im Knopf um, nicht der Knopf.
  `aria-pressed` und die leeren Texte („Noch keine offenen Wünsche.“ und „Noch keine
  erfüllten Wünsche.“) bleiben unverändert.
- Ein Wunsch hat ein optionales Feld „Marke / Hersteller“ direkt unter „Name“:
  - Leerraum am Rand wird abgeschnitten. Leer bedeutet keine Marke.
  - Mehr als 100 Zeichen ergeben „Die Marke darf höchstens 100 Zeichen lang sein.“. Der
    Fokus springt auf das Feld, wenn es das erste fehlerhafte ist.
  - Beim Bearbeiten ist das Feld vorbelegt.
- Eine vorhandene Marke erscheint **ohne** „von“:
  - auf der Detailseite als eigene Zeile direkt unter der Überschrift, vor Bewertung und
    Preis,
  - im Listeneintrag vorn in der Zusammenfassung: „Uvex · ★★★ unbedingt · 49,99 €“.
  - VoiceOver sagt in beiden Fällen „Marke: Uvex“, durch einen unsichtbaren Vorsatz.
- Im Listeneintrag eines erfüllten Wunsches heißt der Schenkende „geschenkt von Ben“ statt
  „von Ben“. Die Detailseite bleibt bei „Erfüllt – von Ben“.
- Ein neu angelegter Wunsch speichert den lokalen Kalendertag seiner Anlage als `createdOn`
  im Format `JJJJ-MM-TT`. Bearbeiten, Schenken und Erhalten ändern ihn nicht.
- Die Detailseite zeigt „gewünscht seit 29. September 2026“ als eigene Zeile unter
  Bewertung und Preis, für alle, die den Wunsch sehen.
- Wünsche ohne `createdOn` in Firestore werden mit dem Stichtag **29.09.2026** eingelesen.
  Es wird nichts zurückgeschrieben. Wünsche ohne `brand` bleiben lesbar.

## Wesentliche Entscheidungen und Abwägungen

1. **Ein Plan für alle vier Punkte, drei fachliche Phasen:** Navigation und Filter, Marke,
   Datum.
   - Warum: kleine, zusammenhängende Nachbesserungen an Wunsch und Liste
   - Auswirkung: ein Story-Präfix WL-007, ein Commit je Phase
2. **Marke als Wertetyp `Brand` in `WishDetails`:** gleiche Regeln wie `Name` (trimmen,
   höchstens 100 Zeichen, Emoji zählen einfach), aber optional wie `Description`.
   - Warum: fügt sich in `parseWishDetails` und in die Formularprüfung ein
   - Auswirkung: Erweiterung von `WishDetailsInput`, `WishDetailsProblems`, Formular,
     Firestore-Feld `brand?` und Anzeige
3. **Marke ohne „von“, mit unsichtbarem Vorsatz „Marke:“, dazu „geschenkt von Ben“ in der
   Liste:**
   - Warum: „von Uvex … von Ben“ wäre in der Liste und für VoiceOver doppeldeutig
   - Auswirkung: `giverNote` liefert „geschenkt von …“. Für den Vorsatz wird die vorhandene
     Klasse `visually-hidden` genutzt.
4. **Anlagedatum als `CalendarDate` am `Wish`, nicht in `WishDetails`:** Es wird nur in
   `Wish.create` gesetzt und über den neuen Port `Clock` (`today(): CalendarDate`)
   bezogen.
   - Warum: Das Datum ist keine editierbare Angabe. Mit der Uhr als Port bleibt `CreateWish`
     ohne Mocks testbar (Fake `FixedClock`).
   - Auswirkung: `RestoredWish` und `NewWish` bekommen `createdOn`. `CreateWish` bekommt eine
     Uhr. Der Adapter `SystemClock` liefert den lokalen Kalendertag des Geräts.
5. **Tagesgenaue Speicherung als Zeichenkette `createdOn: "2026-09-29"`:**
   - Warum: keine Zeitzonenverschiebung, in der Firebase-Konsole lesbar, genügt für die
     Anzeige
   - Auswirkung: `CalendarDate.parse`/`isoString` bilden das Firestore-Feld ab. Ein
     fehlerhaftes `createdOn` macht das Dokument ungültig, wie bei den anderen Feldern.
6. **Altbestand über festes Ersatzdatum 29.09.2026, ohne Zurückschreiben:**
   - Warum: gleiches Datum auf allen Geräten, keine Schreibzugriffe im Lesepfad, kein
     Sonderfall offline
   - Auswirkung: Konstante `CREATION_DATE_OF_EARLIER_WISHES` in `wishDocument.ts`, geprüft
     im Integrationstest
7. **Datumsformat „29. September 2026“:** über `Intl.DateTimeFormat('de-DE',
   { dateStyle: 'long', timeZone: 'UTC' })` auf `Date.UTC(…)`.
   - Warum: Der ausgeschriebene Monat klingt mit VoiceOver sauber. Mit UTC auf beiden
     Seiten kann der Tag nicht verrutschen.
   - Auswirkung: `wishedSinceNote` in `wishTexts.ts` mit Unit-Test

## Ausgangslage

```
 Wish (domain/Wish.ts)                    Firestore  wishes/{id}  (wishDocument.ts)
 ├─ details: WishDetails ──────────────►  name, link?, description?, priceInCents?, rating?
 │    name, link?, description?,
 │    price?, rating?
 ├─ createdBy, secret, giverId?,  ─────►  createdBy, secret, giverId?, received, removedByOwner
 │  received, removedByOwner
 └─ (kein Datum)                          (kein Datum)
```

- `src/wishlist/domain/Wish.ts:6-22` definiert `RestoredWish`/`NewWish`, `#changed`
  (`:124-136`) kopiert alle Felder.
- `src/wishlist/domain/WishDetails.ts` definiert Details, Eingabe, Probleme und
  `parseWishDetails`.
- `src/wishlist/infrastructure/firestore/wishDocument.ts` bildet ab und prüft das Format
  (`isWishDocument`, `detailsOf`, `toWishDocument`, `wishFromDocument`).
- `src/wishlist/application/CreateWish.ts` erzeugt den Wunsch mit `Wish.create`.
  Verdrahtet wird in `src/wishlist/infrastructure/createWishlistModule.ts`.
- `src/wishlist/infrastructure/ui/WishForm.svelte` ist das Formular. `firstFieldWith`
  bestimmt das Fokusziel.
- `src/wishlist/infrastructure/ui/WishSummary.svelte` zeigt Bewertung und Preis in der Liste
  und auf der Detailseite.
- `src/wishlist/infrastructure/ui/WishPage.svelte` ist die Detailseite.
- `src/wishlist/infrastructure/ui/WishlistPage.svelte:33-36` enthält `FILTERS`, `:152-164`
  die Knöpfe in `.button-row` mit `flex-wrap: wrap` (`src/shared/ui/buttons.css:30-36`).
  Auf dem iPhone rutscht „Erfüllte Wünsche“ unter „Offene Wünsche“.
- `src/app/layout/MainNavigation.svelte:9-18` ist der Knopf „Wunschlisten“, ohne Icon.
- `src/wishlist/infrastructure/ui/WishStateNotes.svelte:43` enthält `giverNote` → „von Ben“
  im Listeneintrag.
- Eine Uhr gibt es noch nicht. `IdGenerator` liegt als Port in `src/wishlist/domain/ids.ts`
  und kommt aus `src/app/SignedInApp.svelte:34`.

## Zielbild

```
 Wish                                     Firestore  wishes/{id}
 ├─ details: WishDetails ──────────────►  name, brand?, link?, description?,
 │    name, brand?, link?, …                priceInCents?, rating?
 ├─ createdOn: CalendarDate ───────────►  createdOn?  ("2026-09-29";
 │                                         fehlt → 29.09.2026 beim Einlesen)
 └─ createdBy, secret, …                  createdBy, secret, …

 CreateWish ──► Clock.today()   (Port in domain; SystemClock in infrastructure,
                                 FixedClock als Fake in application/fakes)
```

Oberfläche:

```
 Wunschliste – vorher                   Wunschliste – nachher
 ┌──────────────────┐                   ┌─────────────────┬─────────────────┐
 │  Offene Wünsche  │                   │ 🎁 Noch offen   │ 📦 Erfüllt      │
 └──────────────────┘                   └─────────────────┴─────────────────┘
 ┌──────────────────┐                    Gift              PackageOpen
 │ Erfüllte Wünsche │                    gleich breit, immer eine Zeile
 └──────────────────┘

 Listeneintrag – nachher (Filter „Erfüllt“)
 │ Fahrradhelm                            >│
 │ Uvex · ★★★ unbedingt · 49,99 €          │   VoiceOver: „Marke: Uvex …“
 │ geschenkt von Ben                       │   vorher: „von Ben“

 Navigation – nachher
 ┌──────────────────┬───────────────────┐
 │ ☰ Wunschlisten   │ ⚙ Einstellungen   │
 └──────────────────┴───────────────────┘

 Detailseite – nachher                  Formular – nachher
 ┌──────────────────────────────────┐   Name                [____________]
 │ < Geburtstag 2027                │   Marke / Hersteller  [____________]  ← neu
 │ Fahrradhelm                      │   Link                [____________]
 │ Uvex                             │ ← neu (Marke: Uvex)   Beschreibung …
 │ ★★★ unbedingt · 49,99 €          │   Preis in Euro …
 │ gewünscht seit 29. September 2026│ ← neu                 Wie sehr gewünscht? …
 │ [↗ Zum Angebot auf amazon.de]    │
 │ Beschreibung …                   │
 ├──────────────────────────────────┤
 │ [✏ Bearbeiten] [🎁 Schenken]     │
 └──────────────────────────────────┘
```

## Abstraktionen und Wiederverwendung

- Vorhanden und genutzt: `Parsed`/`valid`/`invalid`/`requireValid`
  (`domain/parsed.ts`), `characterCount`, das Muster von `Name`/`Description`,
  `TextField`, `visually-hidden`, die Lucide-Icons `List`, `Gift` und `PackageOpen` (in
  `@lucide/svelte` vorhanden), `seed`/`wishRecord` in `e2e/emulators.ts` und der Test
  „gives both navigation buttons the same width“ (`e2e/navigation.spec.ts:69`) als Vorbild.
- Neu:
  - `src/wishlist/domain`
    - `Brand.ts` - Wertetyp `Brand`, `BrandProblem = 'tooLong'`
    - `CalendarDate.ts` - Wertetyp `CalendarDate` (`of`, `parse`, `isoString`),
      `InvalidCalendarDate`
    - `Clock.ts` - Port `Clock { today(): CalendarDate }`
  - `src/wishlist/application/fakes/FixedClock.ts` - Uhr mit festem Tag
  - `src/wishlist/infrastructure/SystemClock.ts` - lokaler Kalendertag aus `new Date()`
- Geändert:
  - `src/wishlist/domain/WishDetails.ts` - `brand` in Details, Eingabe, Problemen, Prüfung
  - `src/wishlist/domain/Wish.ts` - `createdOn` in `RestoredWish`, `NewWish`, Konstruktor,
    `create`, `#changed`
  - `src/wishlist/application/CreateWish.ts` - Konstruktorparameter `clock: Clock`
  - `src/wishlist/application/fakes/wishNamed.ts` - Vorgabe `createdOn`
  - `src/wishlist/infrastructure/firestore/wishDocument.ts` - `brand?`, `createdOn?`,
    Ersatzdatum
  - `src/wishlist/infrastructure/createWishlistModule.ts` - `new SystemClock()` für
    `CreateWish`
  - `src/wishlist/infrastructure/ui/wishTexts.ts` - `BRAND_PROBLEM_MESSAGES`,
    `wishDetailsInputOf` mit Marke, `giverNote` → „geschenkt von …“, `wishedSinceNote`
  - `src/wishlist/infrastructure/ui/WishForm.svelte` - Feld „Marke / Hersteller“
  - `src/wishlist/infrastructure/ui/WishSummary.svelte` - Marke vorn, abschaltbar
  - `src/wishlist/infrastructure/ui/WishPage.svelte` - Markenzeile, Datumszeile
  - `src/wishlist/infrastructure/ui/WishlistPage.svelte` - neue Filter
  - `src/app/layout/MainNavigation.svelte` - Icon `List`
  - `e2e/emulators.ts` - `WishRecord` mit `brand?` und `createdOn?`

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

### Phase 1: Navigation mit Listen-Icon und Filterknöpfe nebeneinander

Abhängigkeiten: keine

Reine Oberflächenänderung: Icon in der Navigation, neue Namen und Icons der Filter, eine
Zeile mit gleich breiten Knöpfen.

**Aufgaben**:
- [x] `src/app/layout/MainNavigation.svelte`: `List` aus `@lucide/svelte` importieren und
  vor „Wunschlisten“ setzen, wie beim Zahnrad:
  `<List aria-hidden="true" size="1.25em" /> Wunschlisten`.
- [x] `src/wishlist/infrastructure/ui/WishlistPage.svelte`: `FILTERS` um ein Icon
  erweitern und umbenennen:
  ```ts
  const FILTERS: readonly { value: WishFilter; label: string; icon: typeof Gift; emptyText: string }[] = [
    { value: 'open', label: 'Noch offen', icon: Gift, emptyText: 'Noch keine offenen Wünsche.' },
    { value: 'fulfilled', label: 'Erfüllt', icon: PackageOpen, emptyText: 'Noch keine erfüllten Wünsche.' },
  ];
  ```
  Im `{#each}` das Icon mit `{@const Icon = icon}` und
  `<Icon aria-hidden="true" size="1.25em" />` vor das Label setzen.
- [x] `WishlistPage.svelte`: Den Container der Filterknöpfe von `button-row` auf eine
  eigene Klasse `filters` umstellen, mit lokalem Stil:
  ```css
  .filters { display: flex; gap: 0.5rem; margin: 1rem 0; }
  .filters > .button { flex: 1 1 0; min-width: 0; overflow-wrap: anywhere; }
  ```
  Kein `flex-wrap`, damit beide Knöpfe immer in einer Zeile stehen.
- [x] E2E-Tests auf die neuen Namen umstellen: `e2e/gifting.spec.ts` (`'Offene Wünsche'`
  → `'Noch offen'`, `'Erfüllte Wünsche'` → `'Erfüllt'`), `e2e/backLinks.spec.ts:31` und
  `e2e/sync.spec.ts:48`. Danach mit `grep -rn "Offene Wünsche\|Erfüllte Wünsche" e2e src`
  prüfen, dass nichts übrig ist.
- [x] `e2e/navigation.spec.ts`: Test „shows a list icon on the wishlists button“. Der Knopf
  „Wunschlisten“ enthält genau ein `svg[aria-hidden="true"]`, sein zugänglicher Name bleibt
  „Wunschlisten“.
- [x] `e2e/gifting.spec.ts` (oder `e2e/layout.spec.ts`, neben den übrigen Layout-Tests):
  Test „keeps both filter buttons side by side with equal width, even with doubled text
  size“. Seed mit einer Wunschliste. Einmal normal und einmal nach
  `document.documentElement.style.fontSize = '200%'` prüfen: gleicher `top` beider Knöpfe
  (Abweichung < 1) und gleiche Breite (Abweichung < 1).
- [x] `docs/agents/research/2026-09-28-wunschliste-konzept.md`: Im Abschnitt „Oberfläche“
  die Filter auf „Noch offen / Erfüllt“ mit Icons ändern. Im Skizzenblock „Seite einer
  Wunschliste“ `[Offene] [Erfüllte]` durch `[🎁 Noch offen] [📦 Erfüllt]` ersetzen und den
  Knopf der Navigation mit Icon zeigen. Die Erwähnung „Offene Wünsche“ bei den
  Geheim-Einträgen auf „Noch offen“ anpassen.

**Automatisierte Verifikation**:
- [x] `npm run lint` läuft durch.
- [x] `npm run test:e2e` läuft durch, einschließlich der neuen Tests in
  `navigation.spec.ts` und des Filter-Layout-Tests. `accessibility.spec.ts` bleibt grün
  (axe).
- [x] `npm test` läuft durch.

**Manuelle Verifikation**:
- [ ] Auf dem iPhone mit VoiceOver: Der Knopf in der Navigation wird als „Wunschlisten“
  angesagt, ohne Icon-Namen. Die Filter heißen „Noch offen, ausgewählt“ bzw. „Erfüllt“.
- [ ] Auf dem iPhone mit sehr großer Schrift (Bedienungshilfen → Größerer Text) stehen die
  Filterknöpfe weiterhin nebeneinander.

### Phase 2: Marke / Hersteller

Abhängigkeiten: keine (Phase 1 ändert andere Stellen)

Neues optionales Feld von der Domäne bis zur Anzeige. Dazu „geschenkt von …“ im
Listeneintrag, damit die Marke ohne „von“ nicht mit dem Schenkenden verwechselt wird.

**Aufgaben**:
- [x] **Test zuerst** `src/wishlist/domain/Brand.test.ts`, nach dem Vorbild von
  `Name.test.ts`: trimmt Leerraum; `''` und `'   '` ergeben `valid(undefined)`; 100 Zeichen
  sind erlaubt; 101 ergeben `{ ok: false, problem: 'tooLong' }`; Emoji zählen einfach.
- [x] `src/wishlist/domain/Brand.ts`: Wertetyp nach dem Muster von `Description`
  (`static parse(raw): Parsed<Brand | undefined, BrandProblem>`,
  `MAXIMUM_CHARACTERS = 100`).
- [x] **Test zuerst** `src/wishlist/domain/WishDetails.test.ts`: `parseWishDetails`
  übernimmt eine gültige Marke, lässt eine leere weg und meldet eine zu lange als
  `problems.brand = 'tooLong'` neben anderen Problemen.
- [x] `src/wishlist/domain/WishDetails.ts`: `brand?: Brand` in `WishDetails`,
  `brand: string` in `WishDetailsInput`, `brand?: BrandProblem` in `WishDetailsProblems`,
  `parseWishDetails` entsprechend erweitern.
- [x] Alle Stellen mit `WishDetailsInput`-Literalen um `brand: ''` ergänzen (Compiler
  zeigt sie): u. a. `WishForm.svelte` (`EMPTY_INPUT`),
  `tests/integration/FirestoreWishRepository.integration.test.ts` (`ONLY_A_NAME`) und
  vorhandene Unit-Tests.
- [x] `src/wishlist/infrastructure/firestore/wishDocument.ts`: `brand?: string` in
  `WishDocument`, `isOptional(candidate.brand, 'string')` in `isWishDocument`,
  `Brand.parse(document.brand ?? '')` in `detailsOf` (ungültig → `undefined`),
  `...(details.brand && { brand: details.brand.value })` in `toWishDocument`.
- [x] `tests/integration/FirestoreWishRepository.integration.test.ts`: Ein Wunsch mit Marke
  wird mit `brand` gespeichert und wieder gelesen. Ein Dokument ohne `brand` (mit
  `withoutField`) bleibt lesbar und hat keine Marke.
- [x] `src/wishlist/infrastructure/ui/wishTexts.ts`:
  - `BRAND_PROBLEM_MESSAGES: Record<BrandProblem, string> = { tooLong: 'Die Marke darf
    höchstens 100 Zeichen lang sein.' }`
  - `wishDetailsInputOf`: `brand: details.brand?.value ?? ''`
  - `giverNote(giverName)` → `` `geschenkt von ${giverName}` ``
  - Konstante `BRAND_PREFIX = 'Marke: '` (mit Leerzeichen, weil Svelte Leerraum am Ende eines Elements entfernt) für den unsichtbaren Vorsatz
- [x] `src/wishlist/infrastructure/ui/wishTexts.test.ts`: Erwartungen für `giverNote`
  („geschenkt von Ben“), `wishDetailsInputOf` (Rundreise mit Marke) und die neue Meldung
  anpassen bzw. ergänzen.
- [x] `src/wishlist/infrastructure/ui/WishForm.svelte`: Feld direkt unter „Name“:
  ```svelte
  <TextField bind:this={brandField} id="wish-brand" label="Marke / Hersteller"
    bind:value={brand} problem={problems.brand && BRAND_PROBLEM_MESSAGES[problems.brand]}
    autocapitalize="words" autocomplete="off" />
  ```
  `let brand = $state(start.brand)`, Übergabe an `parseWishDetails`, und `firstFieldWith`
  prüft `found.brand` direkt nach `found.name`.
- [x] `src/wishlist/infrastructure/ui/WishSummary.svelte`: Prop `includesBrand = true`.
  Die Teile Marke, Bewertung und Preis werden in dieser Reihenfolge mit
  `<span aria-hidden="true">·</span>` verbunden. Die Marke wird als
  `<span class="visually-hidden">{BRAND_PREFIX} </span>{brand.value}` ausgegeben. Die
  Zusammenfassung erscheint nur, wenn mindestens ein Teil vorhanden ist.
- [x] `src/wishlist/infrastructure/ui/WishPage.svelte`: Direkt nach `PageHeader` und den
  Hinweisen, vor der Zusammenfassung, bei vorhandener Marke
  `<p class="brand"><span class="visually-hidden">{BRAND_PREFIX} </span>{brand.value}</p>`
  (mit `overflow-wrap: anywhere`). Die Zusammenfassung mit
  `<WishSummary details={…} includesBrand={false} />` ausgeben. Den leeren `<p>` um
  `WishSummary` vermeiden, wenn weder Bewertung noch Preis vorliegen: den Absatz nur
  rendern, wenn `details.rating || details.price`.
- [x] `e2e/emulators.ts`: `brand?: string` in `WishRecord`.
- [x] `e2e/wishes.spec.ts`: Im Test „creates a wish with every field …“ das Feld
  „Marke / Hersteller“ mit „Uvex“ füllen. Die Detailseite zeigt „Uvex“ als eigenen
  Absatz, der zugängliche Text enthält „Marke: Uvex“. Nach „Zurück zu Geburtstag“ enthält
  der Listeneintrag „Uvex · ★★★ unbedingt · 49,99 €“. Neuer Test: eine Marke mit 101
  Zeichen zeigt die Meldung und fokussiert das Feld. Neuer Test: Beim Bearbeiten ist die
  Marke vorbelegt, und geleert wird sie entfernt (`storedWishes()` hat kein `brand`).
- [x] `e2e/gifting.spec.ts:68` und `:130`: Erwartung „von Anna“/„von Ben“ im Listeneintrag
  auf „geschenkt von Anna“/„geschenkt von Ben“ ändern.
- [x] `docs/agents/research/2026-09-28-wunschliste-konzept.md`: In der Tabelle
  „Wünsche“ eine Zeile „Marke / Hersteller | nein | Text, höchstens 100 Zeichen; Anzeige
  ohne „von“, VoiceOver „Marke: …““ ergänzen. In „Schenken und Erhalten“ ergänzen, dass
  der Listeneintrag „geschenkt von Ben“ zeigt.

**Automatisierte Verifikation**:
- [x] `npm run test:unit` läuft durch, einschließlich `Brand.test.ts`,
  `WishDetails.test.ts` und `wishTexts.test.ts`.
- [x] `npm run test:integration` läuft durch (Marke speichern und lesen, Dokument ohne
  `brand`).
- [x] `npm run test:e2e` läuft durch (`wishes.spec.ts`, `gifting.spec.ts`,
  `accessibility.spec.ts`).
- [x] `npm run lint` und `npm test` laufen durch.

**Manuelle Verifikation**:
- [ ] Auf dem iPhone mit VoiceOver: Ein Wunsch mit Marke wird in der Liste als
  „Fahrradhelm, Marke: Uvex, drei Sterne unbedingt …“ angesagt (die Sterne selbst sind
  stumm), auf der Detailseite als eigene Zeile „Marke: Uvex“. Ein erfüllter Eintrag sagt
  „geschenkt von …“.

### Phase 3: „gewünscht seit“

Abhängigkeiten: Phase 2 (beide ändern `wishDocument.ts`, `WishPage.svelte`,
`e2e/emulators.ts`; nacheinander umsetzen)

Anlagedatum über eine Uhr, gespeichert als Kalendertag, mit Ersatzdatum für den
Altbestand, angezeigt auf der Detailseite.

**Aufgaben**:
- [x] **Test zuerst** `src/wishlist/domain/CalendarDate.test.ts`:
  - `CalendarDate.of(2026, 9, 29).isoString` ist `'2026-09-29'` (Monat und Tag mit
    führender Null).
  - `CalendarDate.parse('2026-09-29')` ist gültig mit Jahr 2026, Monat 9, Tag 29.
  - `parse` meldet `'invalid'` für `''`, `'29.09.2026'`, `'2026-9-29'`, `'2026-02-30'` und
    `'2026-13-01'`.
  - `CalendarDate.of(2026, 2, 30)` wirft `InvalidCalendarDate`.
- [x] `src/wishlist/domain/CalendarDate.ts`:
  ```ts
  export type CalendarDateProblem = 'invalid';
  export class CalendarDate {
    private constructor(readonly year: number, readonly month: number, readonly day: number) {}
    static of(year: number, month: number, day: number): CalendarDate { … wirft InvalidCalendarDate … }
    static parse(raw: string): Parsed<CalendarDate, CalendarDateProblem> { … /^\d{4}-\d{2}-\d{2}$/ … }
    get isoString(): string { … }
  }
  ```
  Ob ein Tag existiert, wird per `Date.UTC(year, month - 1, day)` und Rückvergleich von
  `getUTCFullYear/Month/Date` geprüft.
- [x] `src/wishlist/domain/Clock.ts`: `export interface Clock { today(): CalendarDate; }`.
- [x] `src/wishlist/application/fakes/FixedClock.ts`:
  `class FixedClock implements Clock { constructor(private readonly date: CalendarDate) {} today() { return this.date; } }`.
- [x] **Test zuerst** `src/wishlist/domain/Wish.test.ts`: `Wish.create` übernimmt
  `createdOn`. `edit`, `perform('gift')` und `removeFor` (Variante `hideFromOwner`) behalten
  es.
- [x] `src/wishlist/domain/Wish.ts`: `createdOn: CalendarDate` in `RestoredWish` und
  `NewWish`, als `readonly`-Feld, im Konstruktor, in `create` und in `#changed`.
- [x] `src/wishlist/application/fakes/wishNamed.ts`: Vorgabe
  `createdOn: CalendarDate.of(2026, 9, 29)`.
- [x] **Test zuerst** `src/wishlist/application/CreateWish.test.ts`: `setUp` baut
  `new CreateWish(wishlists, wishes, new SequentialIdGenerator(), new FixedClock(CalendarDate.of(2027, 3, 14)))`.
  Neuer Test „remembers the day the wish was created“ prüft `saved?.createdOn` gleich
  `CalendarDate.of(2027, 3, 14)`.
- [x] `src/wishlist/application/CreateWish.ts`: vierter Konstruktorparameter
  `private readonly clock: Clock`, `createdOn: this.clock.today()` an `Wish.create`.
- [x] `src/wishlist/infrastructure/SystemClock.ts`:
  ```ts
  export class SystemClock implements Clock {
    today(): CalendarDate {
      const now = new Date();
      return CalendarDate.of(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
  }
  ```
- [x] `src/wishlist/infrastructure/createWishlistModule.ts`:
  `createWish: new CreateWish(wishlists, wishes, idGenerator, new SystemClock())`.
- [x] `src/wishlist/infrastructure/firestore/wishDocument.ts`:
  - `createdOn?: string` in `WishDocument`, `isOptional(candidate.createdOn, 'string')` in
    `isWishDocument`
  - `export const CREATION_DATE_OF_EARLIER_WISHES = CalendarDate.of(2026, 9, 29);`
  - in `wishFromDocument`: fehlt `createdOn`, gilt die Konstante. Sonst
    `CalendarDate.parse(data.createdOn)`, ungültig → `undefined` (Dokument unlesbar, wie
    bei den übrigen Feldern).
  - `toWishDocument`: `createdOn: wish.createdOn.isoString` (immer geschrieben, also
    bekommt ein alter Wunsch beim nächsten Speichern den Stichtag fest eingetragen, was
    gewollt ist)
- [x] Integrationstest-Helfer anpassen: `wishOf` in
  `tests/integration/FirestoreWishRepository.integration.test.ts` übergibt
  `createdOn: CalendarDate.of(2026, 10, 1)` an `Wish.create`. Neue Tests: Speichern schreibt
  `createdOn: '2026-10-01'` und liest es wieder. Ein Dokument ohne `createdOn` wird mit
  `CREATION_DATE_OF_EARLIER_WISHES` gelesen, und im gespeicherten Dokument fehlt das Feld
  weiterhin (kein Zurückschreiben). Ein Dokument mit `createdOn: 'gestern'` wird nicht
  gelesen.
- [x] `src/wishlist/infrastructure/ui/wishTexts.ts`:
  ```ts
  const longDates = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeZone: 'UTC' });
  export function wishedSinceNote(date: CalendarDate): string {
    return `gewünscht seit ${longDates.format(Date.UTC(date.year, date.month - 1, date.day))}`;
  }
  ```
- [x] `src/wishlist/infrastructure/ui/wishTexts.test.ts`:
  `wishedSinceNote(CalendarDate.of(2026, 9, 29))` ergibt
  `'gewünscht seit 29. September 2026'`, `CalendarDate.of(2027, 1, 1)` ergibt
  `'gewünscht seit 1. Januar 2027'`.
- [x] `src/wishlist/infrastructure/ui/WishPage.svelte`: Direkt nach dem Absatz mit
  `WishSummary`, vor dem Knopf für die Zweitaktion,
  `<p>{wishedSinceNote(view.wish.createdOn)}</p>`.
- [x] `e2e/emulators.ts`: `createdOn?: string` in `WishRecord`. `wishRecord` bleibt ohne
  Vorgabe, damit Seeds den Altbestand abbilden.
- [x] `e2e/wishes.spec.ts`: Neuer Test „shows the day a new wish was created“ mit
  `await page.clock.setFixedTime(new Date('2027-03-14T10:00:00'))` vor `page.goto`, Wunsch
  anlegen, Detailseite zeigt „gewünscht seit 14. März 2027“, `storedWishes()` enthält
  `createdOn: '2027-03-14'`. Stört die feste Zeit die Anmeldung am Auth-Emulator
  (abgelaufene Tokens), wird stattdessen ohne Clock-API der erwartete Tag im Test aus
  `new Date()` berechnet und mit demselben `Intl`-Format verglichen. Neuer Test „shows the reference day for a wish without
  creation day“: per `seed` einen Wunsch ohne `createdOn` anlegen, Detailseite zeigt
  „gewünscht seit 29. September 2026“. Neuer Test: Bearbeiten eines Wunsches mit
  `createdOn: '2027-03-14'` lässt das Datum unverändert.
- [x] `docs/agents/research/2026-09-28-wunschliste-konzept.md`: In der Tabelle „Wünsche“
  ergänzen: „Anlagedatum | – | automatisch, Kalendertag des Geräts; Detailseite:
  „gewünscht seit 29. September 2026“; ältere Wünsche ohne Datum gelten ab 29.09.2026“. Im
  Abschnitt „Datenmodell“ `createdOn` (Zeichenkette `JJJJ-MM-TT`) und `brand` nennen.
- [x] `docs/notes.txt`: Die vier umgesetzten Punkte samt Unterpunkt „nebeneinander“ auf `x`
  setzen und unverändert nach DONE verschieben. Die `m`-Punkte bleiben unberührt.

**Automatisierte Verifikation**:
- [x] `npm run test:unit` läuft durch, einschließlich `CalendarDate.test.ts`,
  `Wish.test.ts`, `CreateWish.test.ts` und `wishTexts.test.ts`.
- [x] `npm run test:integration` läuft durch (Speichern mit Datum, Ersatzdatum ohne
  Zurückschreiben, ungültiges Datum).
- [x] `npm run test:e2e` läuft durch (`wishes.spec.ts` mit fester Uhr, Altbestand,
  Bearbeiten).
- [x] `npm run test:architecture` bestätigt: `Clock` und `CalendarDate` in `domain` ohne
  Framework-Importe, `SystemClock` nur in `infrastructure`.
- [x] `npm run lint` und `npm test` laufen durch.

**Manuelle Verifikation**:
- [ ] Nach dem Ausrollen auf dem iPhone: Ein vorhandener Wunsch zeigt „gewünscht seit
  29. September 2026“, ein neu angelegter das heutige Datum. VoiceOver liest „gewünscht
  seit neunundzwanzigster September zweitausendsechsundzwanzig“ o. ä. verständlich vor.
- [ ] Auf einem zweiten Gerät erscheint dasselbe Datum.

## Notizen zur Umsetzung

- Phase 2: Svelte entfernt Leerraum am Ende eines Elements, deshalb enthält
  `BRAND_PREFIX` das Leerzeichen selbst (`'Marke: '`). Sonst hätte VoiceOver „Marke:Uvex“
  bekommen.
- Phase 2: Die Markenzeile auf der Detailseite steht nach den Zustandshinweisen
  (entfernt, geheim, erfüllt), direkt vor Bewertung und Preis.
- Phase 3: `page.clock.setFixedTime` verträgt sich mit der Anmeldung am Auth-Emulator.
  Die Ausweichlösung ohne Clock-API war nicht nötig.

## Verweise

- `docs/notes.txt` (TODO-Punkte)
- `docs/agents/research/2026-09-28-wunschliste-konzept.md` (Konzept, wird mitgepflegt)
- `docs/agents/plans/2026-09-29-geheim-schenken-erhalten.md` (WL-006, Vorbild für Felder am
  `Wish` und Altbestand in Firestore)
- Playwright Clock-API: https://playwright.dev/docs/clock
- `Intl.DateTimeFormat` `dateStyle`: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
