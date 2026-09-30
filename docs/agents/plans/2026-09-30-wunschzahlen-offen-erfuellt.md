---
date: 2026-09-30T08:03:37.259159+00:00
git_commit: e91aad69ee6a04bc44d6870c5e8a92e57c4b3cbd
branch: main
story: WL-009
topic: "Anzahl offener und erfüllter Wünsche in der Wunschliste und in der Übersicht"
tags: [plan, wishlist, wish, overview, filter, firestore, ui]
status: ready
---

# PLAN: WL-009 — Anzahl offener und erfüllter Wünsche

Die Seite einer Wunschliste zeigt in den Filterknöpfen, wie viele Wünsche offen und wie
viele erfüllt sind. Die Wunschlisten-Übersicht zeigt dieselben Zahlen unter jedem
Listennamen.

## Akzeptanzkriterien

- Auf der Seite einer Wunschliste zeigen die Filterknöpfe die Anzahl der sichtbaren Wünsche
  mit dem jeweiligen Status: „🎁 Noch offen  3“ und „📦 Erfüllt  5“. Die Zahl steht schlicht,
  etwas abgesetzt, ohne Klammern.
  - Der zugängliche Name lautet „Noch offen 3“ bzw. „Erfüllt 5“. `aria-pressed` bleibt
    unverändert.
  - Solange die Wünsche nicht geladen sind, steht keine Zahl im Knopf.
  - Die Knöpfe bleiben gleich breit nebeneinander, auch bei doppelter Schriftgröße.
- Gezählt wird genau das, was hinter dem jeweiligen Filter sichtbar ist:
  - Besitzerin: Überraschungen (geheim, nicht erhalten) und von ihr entfernte Wünsche
    zählen nicht. Verschenkt, aber nicht erhalten zählt als offen.
  - Andere: Geheime Wünsche zählen mit. Verschenkt zählt als erfüllt. Von der Besitzerin
    entfernte Wünsche zählen mit.
  - Die Zeile „🎁 n Überraschungen“ bleibt unverändert und davon getrennt.
- In der Wunschlisten-Übersicht steht unter jedem Listennamen „3 offen · 5 erfüllt“.
  - Auch leere Listen zeigen die Zeile: „0 offen · 0 erfüllt“.
  - Es gilt dieselbe Zählregel, aus Sicht des aktuellen Profils.
  - Ein vorhandener ⚠-Hinweis folgt als dritte Zeile.
- Die Übersicht erscheint erst, wenn Listen, Personen **und** Wünsche geladen sind. Kann
  eines davon nicht geladen werden, erscheint die bekannte Fehlermeldung.
- Beide Anzeigen aktualisieren sich live, zum Beispiel wenn auf einem anderen Gerät
  geschenkt wird.

## Wesentliche Entscheidungen und Abwägungen

1. **Eine Zählregel in der Domäne:** `countWishes(wishes, perspective): WishCounts` in
   `domain/wishView.ts`. Sie baut auf `viewOfWish` auf und zählt nur Wünsche mit
   `visibility === 'shown'`, getrennt nach `status`.
   - Warum: Die Zahlen stimmen per Konstruktion mit den Filtern überein, und Liste und
     Übersicht nutzen dieselbe Regel.
   - Auswirkung: reine Unit-Tests in `wishView.test.ts`
2. **Überraschungen fließen nicht in die Zahl ein:**
   - Warum: Die Zahl würde der Besitzerin sonst Geheim-Einträge verraten.
   - Auswirkung: keine. Die Überraschungszeile bleibt, wie sie ist.
3. **Zahl im Filterknopf statt eigener Zeile:**
   - Warum: Die Zahl steht direkt bei ihrem Filter, kostet keinen Platz, und VoiceOver
     sagt sie beim Knopf mit an.
   - Auswirkung: Der zugängliche Name ändert sich. Die E2E-Selektoren mit exaktem Namen
     werden auf den Namensanfang umgestellt.
4. **Die Übersicht besteht aus Einträgen statt aus nackten Wunschlisten:**
   `WishlistGroup.wishlists` wird zu `entries: readonly WishlistEntry[]` mit
   `WishlistEntry = { wishlist: Wishlist; wishCounts: WishCounts }`.
   `groupWishlistsByOwner` bekommt zusätzlich die Wünsche.
   - Warum: Die Übersicht bleibt ein fertiges Lesemodell aus der Domäne. Die Oberfläche
     rechnet nicht selbst.
   - Auswirkung: `wishlistOverview.test.ts`, `WishlistsPage.svelte` und die
     Test-Hilfe in `personTexts.test.ts` werden angepasst.
5. **Ein Listener auf die ganze Sammlung `wishes`:** Der Port bekommt
   `WishRepository.watchAll`. Er wird im In-Memory-Fake und in Firestore implementiert.
   `WatchWishlistOverview` wartet auf alle drei Quellen.
   - Warum: Eine Familien-App hat überschaubar viele Wünsche. Die Firestore-Regeln
     erlauben das Lesen der ganzen Sammlung schon. Offline kommen die Wünsche aus dem
     Cache. Listener je Liste zu verwalten, wäre unnötig aufwendig.
   - Auswirkung: kein kurzes Aufblitzen von „0 offen“. Ein Fehler zeigt wie bisher die
     gemeinsame Meldung.
6. **Text der Übersicht:** `wishCountsLine({ open, fulfilled })` in `wishTexts.ts` liefert
   „3 offen · 5 erfüllt“.
   - Warum: gleiche Wörter wie die Filter. VoiceOver liest „3 offen, 5 erfüllt“.
   - Auswirkung: ein Unit-Test in `wishTexts.test.ts`

## Ausgangslage

```
WishlistsPage (Übersicht)                     WishlistPage (eine Liste)
  WatchWishlistOverview                         WatchWishesOfWishlist  → wishes
   ├─ wishlists.watchAll()                      viewOfWishes(wishes, perspective, filter)
   └─ persons.watchAll()                          → entries (nur 'shown' + Filterstatus)
  groupWishlistsByOwner → WishlistGroup[]         → surpriseCount (nur Filter 'open')
    { owner, isMe, wishlists }                  Filterknöpfe „Noch offen“ / „Erfüllt“
  (keine Wünsche geladen)
```

- `src/wishlist/domain/wishView.ts:24-29`: `isFulfilledFor`. Für die Besitzerin gilt nur
  `received`, für alle anderen auch `giverId`.
- `src/wishlist/domain/wishView.ts:36-41`: `visibilityFor` ergibt `hidden`, `surprise`
  oder `shown`.
- `src/wishlist/domain/wishView.ts:66-78`: `viewOfWishes`
- `src/wishlist/domain/wishlistOverview.ts`: `WishlistGroup` und
  `groupWishlistsByOwner(wishlists, persons, me)`
- `src/wishlist/application/WatchWishlistOverview.ts`: kombiniert Listen und Personen und
  meldet sich erst, wenn beide bekannt sind.
- `src/wishlist/domain/WishRepository.ts`: nur `watchByWishlist`, kein `watchAll`
- `src/wishlist/infrastructure/ui/WishlistPage.svelte:33-46` definiert `FILTERS`,
  `:165-177` enthält die Knöpfe.
- `src/wishlist/infrastructure/ui/WishlistsPage.svelte:59-75`: Der Eintrag zeigt den Namen
  und gegebenenfalls den ⚠-Hinweis (`.note`).
- `src/wishlist/infrastructure/ui/personTexts.ts:31`: `ownerGroupHeading` liest nur
  `owner` und `isMe`.
- E2E-Tests suchen die Filterknöpfe mit exaktem Namen: `e2e/gifting.spec.ts:7`,
  `e2e/layout.spec.ts:93-94`, `e2e/backLinks.spec.ts:31`, `e2e/sync.spec.ts:48`.

## Zielbild

```
WishlistsPage                                 WishlistPage
  WatchWishlistOverview                         wishCounts = countWishes(wishes, perspective)
   ├─ wishlists.watchAll()                      Filterknopf: Icon, Label, Zahl
   ├─ persons.watchAll()
   └─ wishes.watchAll()        ◄── neu
  groupWishlistsByOwner(wishlists, persons, wishes, me)
    → { owner, isMe, entries: [{ wishlist, wishCounts }] }
       wishCounts = countWishes(Wünsche der Liste, perspectiveOf(wishlist, me))
```

Oberfläche, Seite einer Wunschliste:

```
 vorher                                    nachher
 ┌──────────────────┬──────────────────┐   ┌──────────────────┬──────────────────┐
 │ 🎁 Noch offen    │ 📦 Erfüllt       │   │ 🎁 Noch offen  3 │ 📦 Erfüllt  5    │
 └──────────────────┴──────────────────┘   └──────────────────┴──────────────────┘
                                             VoiceOver: „Noch offen 3, ausgewählt, Taste“
```

Oberfläche, Übersicht:

```
 vorher                                    nachher
 Ben (ich)                                 Ben (ich)
 ┌──────────────────────────────┐         ┌──────────────────────────────┐
 │ Geburtstag                  >│         │ Geburtstag                  >│
 ├──────────────────────────────┤         │ 3 offen · 5 erfüllt          │
 │ Weihnachten                 >│         ├──────────────────────────────┤
 │ ⚠ Von Ben entfernt …         │         │ Weihnachten                 >│
 └──────────────────────────────┘         │ 0 offen · 0 erfüllt          │
                                           │ ⚠ Von Ben entfernt …         │
                                           └──────────────────────────────┘
```

## Abstraktionen und Wiederverwendung

- `src/wishlist/domain`
  - `wishView.ts`: neu `WishCounts` und `countWishes`, auf Basis von `viewOfWish`
  - `wishlistOverview.ts`: neu `WishlistEntry`. `WishlistGroup.wishlists` wird zu
    `entries`. `groupWishlistsByOwner` bekommt den Parameter `wishes`.
  - `WishRepository.ts`: neu `watchAll`
- `src/wishlist/application`
  - `WatchWishlistOverview.ts`: bekommt das `WishRepository` als dritte Quelle.
  - `fakes/InMemoryWishRepository.ts`: neu `watchAll`
- `src/wishlist/infrastructure`
  - `firestore/FirestoreWishRepository.ts`: neu `watchAll` per `onSnapshot` auf
    `collection(firestore, WISHES_COLLECTION)`
  - `createWishlistModule.ts`: `new WatchWishlistOverview(wishlists, persons, wishes)`
  - `ui/wishTexts.ts`: neu `wishCountsLine`
  - `ui/WishlistPage.svelte`: Zahl im Filterknopf
  - `ui/WishlistsPage.svelte`: Zeile mit den Zahlen im Eintrag
- Vorhandene Muster: `.note` in `WishlistsPage.svelte` für die zweite Zeile, `ObservableMap`
  im Fake, `reportedFailure` in Firestore, `wishNamed` in `application/fakes` für Tests

## Umsetzung

### Phase 1: Zahlen in den Filterknöpfen der Wunschliste

Abhängigkeiten: keine.

**Aufgaben**:

- [x] Test zuerst, in `src/wishlist/domain/wishView.test.ts`: neuer Block
  `describe('countWishes', …)`. Die vorhandenen Hilfen `annasWish`, `asAnna` und `asBen`
  werden genutzt. Fälle:
  - `'counts open and fulfilled wishes as the owner sees them'`: offen, verschenkt aber
    nicht erhalten (`giverId: ben`) und erhalten (`giverId: ben, received: true`) ergeben
    für `asAnna` `{ open: 2, fulfilled: 1 }`.
  - `'counts a given wish as fulfilled for the others'`: dieselben Wünsche ergeben für
    `asBen` `{ open: 1, fulfilled: 2 }`.
  - `'leaves out surprises for the owner but counts them for the others'`: ein geheimer
    Wunsch (`secret: true, createdBy: ben`) ergibt für `asAnna` `{ open: 0, fulfilled: 0 }`
    und für `asBen` `{ open: 1, fulfilled: 0 }`.
  - `'leaves out wishes the owner removed only for the owner'`: `removedByOwner: true,
    secret: true, createdBy: ben, giverId: ben` ergibt für `asAnna` nichts. Für `asBen`
    ergibt es `{ open: 0, fulfilled: 1 }`.
  - `'counts nothing when the wishlist is hidden'`: Mit
    `{ ...asAnna, wishlistIsHidden: true }` ergibt sich `{ open: 0, fulfilled: 0 }`.
  - `'counts nothing without wishes'`: `[]` ergibt `{ open: 0, fulfilled: 0 }`.
- [x] `src/wishlist/domain/wishView.ts`:
  ```ts
  export type WishCounts = { readonly open: number; readonly fulfilled: number };

  export function countWishes(wishes: readonly Wish[], perspective: Perspective): WishCounts {
    const shownStatuses = wishes
      .map((wish) => viewOfWish(wish, perspective))
      .filter(({ visibility }) => visibility === 'shown')
      .map(({ status }) => status);
    return {
      open: shownStatuses.filter((status) => status === 'open').length,
      fulfilled: shownStatuses.filter((status) => status === 'fulfilled').length,
    };
  }
  ```
  Die Tests sind grün.
- [x] `src/wishlist/infrastructure/ui/WishlistPage.svelte`:
  - `countWishes` und `WishCounts` importieren.
  - `const wishCounts = $derived(wishes && perspective && countWishes(wishes, perspective));`
  - Im Knopf hinter `{label}`:
    ```svelte
    {#if wishCounts}
      <span class="count">{wishCounts[value]}</span>
    {/if}
    ```
    `WishFilter` ist `'open' | 'fulfilled'` und passt damit direkt als Schlüssel von
    `WishCounts`.
  - Style: `.count { margin-inline-start: 0.5em; font-variant-numeric: tabular-nums; }`
- [x] Die E2E-Selektoren der Filterknöpfe auf den Namensanfang umstellen:
  - `e2e/gifting.spec.ts:7`:
    `const filterButton = (page: Page, name: string) => page.getByRole('button', { name: new RegExp(`^${name}( \\d+)?$`) });`
  - `e2e/layout.spec.ts:93-94`: `{ name: /^Noch offen( \d+)?$/ }` und
    `{ name: /^Erfüllt( \d+)?$/ }`
  - `e2e/backLinks.spec.ts:31` und `e2e/sync.spec.ts:48`: `{ name: /^Erfüllt( \d+)?$/ }`
- [x] Neue Datei `e2e/wishCounts.spec.ts` mit eigenem `seed` im `beforeEach`. Anna ist das
  Profil der Fixture, und die Fixture legt `ANNA` schon an. Der Seed ergänzt Ben (`ben`) und
  Oma (`oma`).
  - Wunschlisten:
    - `mine` „Geburtstag“, Besitzerin `anna`
    - `bens` „Weihnachten“, Besitzer `ben`
    - `empty` „Ostern“, Besitzer `ben`
  - Wünsche in `mine`:
    - `helmet` offen
    - `book` mit `giverId: 'ben'`
    - `kite` mit `giverId: 'ben', received: true`
    - `surprise` mit `secret: true, createdBy: 'ben'`
  - Wünsche in `bens` (je `createdBy: 'ben'`, sofern nicht anders angegeben):
    - `watch` offen
    - `socks` offen
    - `scarf` mit `giverId: 'anna'`
    - `cap` mit `secret: true, createdBy: 'anna'`
  - Test `'counts the wishes behind each filter as the owner sees them'`: Auf
    `./#/liste/mine` tragen die Knöpfe die Namen „Noch offen 2“ und „Erfüllt 1“, und
    „1 Überraschung“ ist sichtbar.
  - Test `'counts given and secret wishes on the wishlist of someone else'`: Auf
    `./#/liste/bens` lauten die Namen „Noch offen 3“ und „Erfüllt 1“.
  - Test `'updates the counts when a wish is given elsewhere'`: `./#/liste/bens` öffnen,
    dann per `seedDocument('wishes', 'watch', wishRecord({ … giverId: 'oma' }))`
    überschreiben (ohne `id` im Datensatz). Danach lauten die Namen „Noch offen 2“ und
    „Erfüllt 2“.
  - Die Selektoren in dieser Datei prüfen den Namen exakt, zum Beispiel
    `{ name: 'Noch offen 2', exact: true }`.

**Automatisierte Verifikation**:

- [x] `npm run test:unit`: Die neuen Fälle von `countWishes` in `wishView.test.ts` sind
  grün.
- [x] `e2e/wishCounts.spec.ts` läuft grün (Filterzahlen für die Besitzerin, für andere und
  nach einer Änderung von außen).
- [x] `e2e/layout.spec.ts`: „keeps both filter buttons side by side …“ bleibt mit Zahl
  grün, auch bei 200 %.
- [x] `e2e/gifting.spec.ts`, `e2e/backLinks.spec.ts`, `e2e/sync.spec.ts` und
  `e2e/accessibility.spec.ts` laufen grün.
- [x] `npm run lint` läuft durch.

### Phase 2: Zahlen in der Wunschlisten-Übersicht

Abhängigkeiten: Phase 1 (`countWishes`).

**Aufgaben**:

- [x] Test zuerst, in `tests/integration/FirestoreWishRepository.integration.test.ts`:
  `'reports the wishes of all wishlists, at once and after each save and delete'`.
  Das Muster ist `'reports only the wishes of one wishlist …'` (`:199`), aber mit
  `repository.watchAll(…)`. Nach dem Speichern von `Helm` (birthday) und `Schlitten`
  (christmas) lautet der letzte Bericht `['Helm', 'Schlitten']`. Nach dem Löschen von
  `Helm` lautet er `['Schlitten']`.
- [x] `src/wishlist/domain/WishRepository.ts`:
  `watchAll(onChange: (wishes: readonly Wish[]) => void, onFailure: () => void): Unsubscribe;`
- [x] `src/wishlist/infrastructure/firestore/FirestoreWishRepository.ts`: `watchAll` mit
  `onSnapshot(collection(this.#firestore, WISHES_COLLECTION), (snapshot) => onChange(snapshot.docs.map(wishIn).filter((wish) => wish !== undefined)), reportedFailure(onFailure, this.#onProblem))`.
  Falls `#wishesOf` die Sammlung schon als Hilfsmethode aufbaut, wird sie mitgenutzt.
  Der Integrationstest ist grün.
- [x] `src/wishlist/application/fakes/InMemoryWishRepository.ts`:
  `watchAll` liefert `this.#wishes.observe(() => onChange(this.#wishes.values()), onFailure)`.
- [x] Test zuerst, in `src/wishlist/domain/wishlistOverview.test.ts`:
  - `summaryOf` liest `entries.map(({ wishlist }) => wishlist.name.value)`. Alle
    Aufrufe von `groupWishlistsByOwner` bekommen `[]` als Wünsche, und die bestehenden
    Erwartungen bleiben gleich.
  - Neuer Fall `'counts the wishes of each wishlist as I see them'`: Annas Liste
    „Geburtstag“ hat einen offenen und einen geheimen Wunsch von Ben. Bens Liste
    „Ostern“ hat einen verschenkten Wunsch (`giverId: anna`). Eine Liste „Leer“ hat keine
    Wünsche.
    - Aus Annas Sicht: Geburtstag `{ open: 1, fulfilled: 0 }`, Ostern
      `{ open: 0, fulfilled: 1 }`, Leer `{ open: 0, fulfilled: 0 }`.
    - Die Wünsche entstehen mit `Wish.restore` und passender `wishlistId`, wie
      `annasWish` in `wishView.test.ts`.
- [x] `src/wishlist/domain/wishlistOverview.ts`:
  ```ts
  export type WishlistEntry = { wishlist: Wishlist; wishCounts: WishCounts };

  export type WishlistGroup = {
    owner: Person | undefined;
    isMe: boolean;
    entries: readonly WishlistEntry[];
  };
  ```
  `groupWishlistsByOwner(wishlists, persons, wishes, me)` baut aus jeder sortierten Liste
  einen Eintrag:
  `{ wishlist, wishCounts: countWishes(wishes.filter((wish) => wish.wishlistId === wishlist.id), perspectiveOf(wishlist, me)) }`.
  Die Gruppierung selbst bleibt unverändert. Der Filter am Ende prüft
  `group.entries.length > 0`. Die Tests sind grün.
- [x] `src/wishlist/infrastructure/ui/personTexts.test.ts:54`:
  `{ ...group, wishlists: [] }` wird zu `{ ...group, entries: [] }`.
- [x] Test zuerst, in `src/wishlist/application/WatchWishlistOverview.test.ts`:
  - `setUp` legt ein `InMemoryWishRepository` an und reicht es als dritten Parameter
    durch.
  - Neuer Fall `'reports nothing before the wishes are known'`, mit einer Klasse
    `UnansweredWishRepository extends InMemoryWishRepository`, deren `watchAll` nichts
    meldet (Muster: `UnansweredPersonRepository`).
  - Neuer Fall `'reports the counts again when a wish changes'`: Ein Wunsch für Bens
    „Ostern“ wird gespeichert und dann mit `giverId: anna` erneut gespeichert. Die
    Berichte zeigen `{ open: 1, fulfilled: 0 }` und danach `{ open: 0, fulfilled: 1 }`.
    Die Wünsche entstehen mit `wishNamed(…, { wishlistId: wishlistIdOf('easter') })` aus
    `fakes/wishNamed.ts`.
  - `'reports when … cannot be watched'` schließt `wishes.failWatchers()` ein und
    erwartet `3` Fehler.
  - `'stops watching both when unsubscribed'` wird zu `'stops watching all three when
    unsubscribed'` und speichert zusätzlich einen Wunsch.
- [x] `src/wishlist/application/WatchWishlistOverview.ts`: Der Konstruktor bekommt
  `private readonly wishes: WishRepository`. Dazu kommen `knownWishes` und
  `stopWatchingWishes`. `reportGroups` meldet erst, wenn alle drei bekannt sind, und ruft
  `groupWishlistsByOwner(knownWishlists, knownPersons, knownWishes, me)` auf. Das
  zurückgegebene Unsubscribe beendet alle drei Listener. Die Tests sind grün.
- [x] `src/wishlist/infrastructure/createWishlistModule.ts`:
  `watchWishlistOverview: new WatchWishlistOverview(wishlists, persons, wishes)`
- [x] Test zuerst, in `src/wishlist/infrastructure/ui/wishTexts.test.ts`: `wishCountsLine`
  liefert für `{ open: 3, fulfilled: 5 }` „3 offen · 5 erfüllt“, für
  `{ open: 0, fulfilled: 0 }` „0 offen · 0 erfüllt“ und für `{ open: 1, fulfilled: 1 }`
  „1 offen · 1 erfüllt“.
- [x] `src/wishlist/infrastructure/ui/wishTexts.ts`:
  ```ts
  export function wishCountsLine({ open, fulfilled }: WishCounts): string {
    return `${open} offen · ${fulfilled} erfüllt`;
  }
  ```
- [x] `src/wishlist/infrastructure/ui/WishlistsPage.svelte`:
  - `{#each group.entries as { wishlist, wishCounts } (wishlist.id)}`
  - Direkt unter `.wishlist-name`:
    `<span class="note">{wishCountsLine(wishCounts)}</span>`. Der ⚠-Hinweis folgt danach
    unverändert.
- [x] `e2e/wishCounts.spec.ts` ergänzen:
  - `'shows the counts of each wishlist in the overview'`: Auf `./` enthält der
    Listeneintrag „Geburtstag“ den Text „2 offen · 1 erfüllt“, „Weihnachten“ enthält
    „3 offen · 1 erfüllt“ und „Ostern“ enthält „0 offen · 0 erfüllt“. Die Einträge werden
    über `getByRole('main').getByRole('button', { name: /^Geburtstag/ })` gefunden,
    zusammen mit `toContainText`.
  - `'updates the counts in the overview when a wish is given elsewhere'`: Auf `./` wird
    `watch` wie in Phase 1 per `seedDocument` verschenkt. Danach enthält „Weihnachten“
    den Text „2 offen · 2 erfüllt“.
- [x] Prüfen, ob bestehende E2E-Tests Übersichtseinträge mit exaktem Namen suchen
  (`grep -rn "exact: true" e2e`). Solche Selektoren werden auf den Namensanfang
  umgestellt, weil der Eintrag jetzt die Zahlenzeile mitliest.

**Automatisierte Verifikation**:

- [x] `npm run test:unit`: `wishlistOverview.test.ts`, `WatchWishlistOverview.test.ts`,
  `wishTexts.test.ts` und `personTexts.test.ts` sind grün.
- [x] `npm run test:integration`: Der neue `watchAll`-Fall in
  `FirestoreWishRepository.integration.test.ts` ist grün.
- [x] `npm run test:architecture` läuft durch (die Domäne importiert nur Domäne).
- [x] `e2e/wishCounts.spec.ts` läuft vollständig grün.
- [x] `e2e/wishlists.spec.ts`, `e2e/persons.spec.ts`, `e2e/ownerRemoval.spec.ts`,
  `e2e/offline.spec.ts` und `e2e/accessibility.spec.ts` laufen grün.
- [x] `npm run lint` läuft durch.
- [x] `npm test` läuft durch (Architektur, Unit, Integration, E2E).
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:

- [ ] Auf dem iPhone mit VoiceOver: Die Filterknöpfe werden als „Noch offen 3, ausgewählt,
  Taste“ bzw. „Erfüllt 5, Taste“ angesagt. Die Zahl steht bei doppelter Schriftgröße
  sauber im Knopf.
- [ ] Auf dem iPhone mit VoiceOver: Ein Übersichtseintrag wird als „Geburtstag, 3 offen,
  5 erfüllt, Taste“ angesagt. Die Zeilen stehen bei sehr großer Schrift sauber
  untereinander.
- [ ] Auf zwei Geräten: Wird auf dem einen geschenkt, ändern sich die Zahlen auf dem
  anderen, in der Übersicht wie in der Liste.

## Notizen zur Umsetzung

- `FirestoreWishRepository`: `watchAll` und `watchByWishlist` teilen sich die private
  Methode `#watchWishesIn`, und `#wishesOf` baut auf `#allWishes` auf.
- Sechs E2E-Tests in `e2e/wishlists.spec.ts` und `e2e/editing.spec.ts` prüften den ganzen
  Eintragstext der Übersicht mit `toHaveText` und sahen jetzt die Zahlenzeile mit. Sie
  lesen die Namen nun über `.wishlist-name`, nach dem Muster `.wish-name` in
  `editing.spec.ts`.

## Verweise

- `docs/agents/plans/2026-09-29-geheim-schenken-erhalten.md` (WL-006): Regeln für
  Überraschungen, Schenken und Erhalten
- `docs/agents/plans/2026-09-29-marke-datum-filter-navigation.md` (WL-007): Filterknöpfe
  nebeneinander
- `src/wishlist/domain/wishView.ts`: Sichtbarkeits- und Statusregeln
