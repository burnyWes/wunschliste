---
date: 2026-09-30T11:54:48.252663+00:00
git_commit: 0c0df48535ae7756538e814fedfd0fe4d283471c
branch: main
story: WL-011
topic: "Wunsch in eine andere Wunschliste derselben Person verschieben"
tags: [plan, wishlist, wish, move, ui, routing]
status: ready
---

# PLAN: WL-011 — Wunsch in andere Liste verschieben

Ein Wunsch soll sich in eine andere Wunschliste derselben Besitzerin verschieben lassen,
etwa von „Geburtstag“ nach „Weihnachten“. Der Einstieg ist ein Knopf auf der
Bearbeiten-Seite, der auf eine eigene Unterseite mit den möglichen Ziellisten führt. Ein
Tipp auf eine Liste verschiebt sofort. Der Plan erledigt den Punkt „Wunsch in andere
Liste kopieren/ausschneiden“ aus `docs/notes.txt`. Kopieren wird nicht gebraucht.

## Akzeptanzkriterien

- Die Bearbeiten-Seite eines Wunsches zeigt den Knopf „In andere Liste verschieben“
  direkt über „Wunsch löschen“. Voraussetzungen:
  - Die Besitzerin der Liste hat mindestens eine weitere Liste, die sie nicht gelöscht
    hat.
  - Die aktuelle Liste ist nicht von der Besitzerin gelöscht (`removedByOwner`).
- Der Knopf öffnet die Unterseite `#/wunsch/<id>/verschieben`:
  - Zurück-Link „Wunsch bearbeiten“ zur Bearbeiten-Seite
  - Überschrift „Wohin verschieben?“
  - Hinweis „„<Wunsch>“ liegt in „<Liste>“.“
  - die anderen, nicht gelöschten Listen der Besitzerin, alphabetisch wie in der
    Übersicht, als antippbare Einträge mit `›`
- Ein Tipp auf eine Liste verschiebt den Wunsch sofort. Danach öffnet sich die
  Detailseite des Wunsches, ihr Zurück-Link zeigt die neue Liste, und es kommt die
  Ansage „In „<Liste>“ verschoben.“.
- Beim Verschieben ändert sich nur die Liste. Alles andere bleibt erhalten: Details,
  „gewünscht seit“, Ersteller, Geheim-Status, Schenkende, Erhalten, wiederholte
  Geschenke und `removedByOwner`.
- Die Wunschzahlen in der Übersicht und auf den Filterknöpfen stimmen danach für beide
  Listen.
- Wer einen Wunsch bearbeiten darf, darf ihn auch verschieben. Geheime Einträge können
  also alle außer der Besitzerin verschieben, und sie bleiben für die Besitzerin
  unsichtbar.
- Die Domäne lehnt ab (`WishCannotMoveThere`):
  - eine Zielliste einer anderen Person
  - die aktuelle Liste als Ziel
  - eine von der Besitzerin gelöschte Zielliste
  - das Verschieben aus einer von der Besitzerin gelöschten Liste
- Einen für mich verborgenen Wunsch kann ich nicht verschieben (`WishHiddenFromOwner`
  bzw. `WishlistNotFound`, wie beim Bearbeiten).
- Gibt es auf der Unterseite keine Zielliste (mehr), steht dort „Keine andere Liste
  vorhanden.“. Gibt es den Wunsch nicht mehr, steht dort „Diesen Wunsch gibt es nicht
  mehr.“.
- In `docs/notes.txt` steht der Punkt „Wunsch in andere Liste kopieren/ausschneiden“ mit
  `x` unter DONE.

## Wesentliche Entscheidungen und Abwägungen

1. **Nur zwischen Listen derselben Besitzerin:** Die Zielliste muss dieselbe `ownerId`
   haben wie die aktuelle.
   - Warum: Die Perspektive (`perspectiveOf(wishlist, me)`) leitet sich aus der
     Besitzerin der Liste ab. Bei einem Besitzerwechsel würde sich die Bedeutung von
     Geheim-Einträgen, `giverId`, `gifts` und `removedByOwner` ändern.
   - Auswirkung: Verschieben ändert nur `wishlistId`. Der Zustand wird nicht umgedeutet.
2. **Wer bearbeiten darf, darf verschieben:** Es gelten dieselben Prüfungen wie in
   `EditWish`, nämlich dass Wunsch und Liste existieren und für mich sichtbar sind.
   - Warum: Das ist konsistent mit dem Bearbeiten, und nur so lassen sich
     Geheim-Einträge verschieben.
   - Auswirkung: Es gibt keine neue Rechte-Logik.
3. **Eigene Unterseite mit sofortiger Wirkung:** Der Einstieg ist ein Knopf auf der
   Bearbeiten-Seite. Ungespeicherte Eingaben im Formular verfallen dabei, so wie heute
   schon bei „Wunsch löschen“.
   - Warum: Die Funktion wird selten gebraucht, und die Seite bleibt auch bei vielen
     Listen gut bedienbar. Ein Formularfeld würde die Formulardaten beim Seitenwechsel
     verlieren.
   - Auswirkung:
     - neuer Anwendungsfall `MoveWish`
     - neue Adresse `{ page: 'moveWish'; wishId }`
     - neue Seite `MoveWishPage.svelte` im Muster von `ChooseProfilePage.svelte`
       (`entry-list`, `ChevronRight`, Zurück-Link im Kopf, keine Aktionsleiste)
4. **Gelöschte Listen sind weder Ziel noch Quelle:**
   - Warum: Sonst tauchen gelöschte, nicht geheime Wünsche bei der Besitzerin wieder
     auf.
   - Auswirkung: Die Regel steckt in der Domänenfunktion `moveTargetsOf`. Sie liefert
     die Ziele für die Oberfläche und sichert zugleich `moveWish` ab. Ohne Ziele
     erscheint der Knopf nicht.
5. **Regel als Domänenfunktion neben dem Aggregat:** `moveWish(wish, source, target, me)`
   in `wishMove.ts` prüft die Listenregeln. `Wish.moveTo(wishlistId, perspective)`
   prüft die Sichtbarkeit und ändert `wishlistId`.
   - Warum: `Wish` kennt nur die `wishlistId`. Ob die Quellliste von der Besitzerin
     gelöscht ist, weiß `Perspective` für Nicht-Besitzerinnen nicht, denn
     `wishlistIsHidden` gilt nur für die Besitzerin (`Perspective.ts:10-13`).
   - Auswirkung: Es gibt eine einzige Fehlerklasse `WishCannotMoveThere` für alle
     unzulässigen Ziele.
6. **Speichern wie bisher mit `setDoc`:** Das ganze Dokument wird mit neuer
   `wishlistId` geschrieben.
   - Warum: Das funktioniert offline, und das Muster ist dasselbe wie bei allen anderen
     Änderungen. Die Liste steht nur als Feld am Wunsch, es gibt keine Unterkollektion.
   - Auswirkung: Firestore-Dokument, Adapter und `firestore.rules` bleiben unverändert.
     Einen neuen Integrationstest braucht es deshalb nicht.
7. **Kein Kopieren:** Kopieren entfällt ganz.

## Ausgangslage

```
Wishlist { id, name, ownerId, removedByOwner }         src/wishlist/domain/Wishlist.ts:16
   ▲ wishlistId (einfaches Feld im Wunsch-Dokument)    src/wishlist/infrastructure/firestore/wishDocument.ts:15
Wish { id, wishlistId, details, createdOn, createdBy,  src/wishlist/domain/Wish.ts:66
       secret, giverId, received, removedByOwner,
       repeatable, gifts }

perspectiveOf(wishlist, me) = { me, ownerId, wishlistIsHidden }
  wishlistIsHidden nur für die Besitzerin bei removedByOwner   src/wishlist/domain/Perspective.ts:10
```

- `EditWish` (`src/wishlist/application/EditWish.ts`) lädt Wunsch und Liste, bildet die
  Perspektive, prüft `ensureVisibleTo` und speichert `wish.edit(...)`.
- `EditWishPage.svelte` beobachtet Wunsch, Liste und Besitzerin. Im `extra`-Bereich des
  `WishForm` steht „Wunsch löschen“ mit `ConfirmDialog`.
- Adressen stehen in `wishlistAddresses.ts` (`#/wunsch/<id>/bearbeiten` usw.).
  `WishlistPages.svelte` verteilt sie auf Seiten. Der `else`-Zweig ist `EditWishPage`.
- `WatchWishlistsOwnedBy` liefert alle Listen einer Person, auch die gelöschten.
  `sortWishlists` sortiert alphabetisch (`Wishlist.ts:59`).

## Zielbild

```
Domäne
  Wish.moveTo(wishlistId, perspective) → Wish           nur Sichtbarkeit + neue wishlistId
  wishMove.ts
    moveTargetsOf(source, wishlists) → Wishlist[]       gleiche Besitzerin, ≠ source,
                                                        nicht removedByOwner, sortiert;
                                                        [] wenn source.removedByOwner
    moveWish(wish, source, target, me) → Wish           ensureVisibleTo + Zielprüfung + moveTo
    WishCannotMoveThere

Anwendung
  MoveWish.execute(wishId, targetWishlistId, me)        lädt Wunsch, Quelle, Ziel → save

Oberfläche
  EditWishPage ──[⇄ In andere Liste verschieben]──► MoveWishPage  #/wunsch/<id>/verschieben
                                                     └─ Tipp ──► WishPage + Ansage
```

Bearbeiten-Seite:

```
Vorher                                     Nachher
┌────────────────────────────────┐        ┌────────────────────────────────┐
│ Wunsch bearbeiten              │        │ Wunsch bearbeiten              │
│ Name        [Lego Zug        ] │        │ Name        [Lego Zug        ] │
│ …                              │        │ …                              │
│ Mehrmals schenkbar         [ ] │        │ Mehrmals schenkbar         [ ] │
│ [🗑 Wunsch löschen]            │        │ [⇄ In andere Liste verschieben]│
│                                │        │ [🗑 Wunsch löschen]            │
├────────────────────────────────┤        ├────────────────────────────────┤
│ [💾 Speichern] [✕ Abbrechen]   │        │ [💾 Speichern] [✕ Abbrechen]   │
└────────────────────────────────┘        └────────────────────────────────┘
```

Neue Unterseite:

```
┌────────────────────────────────┐
│ ‹ Wunsch bearbeiten            │   Zurück-Link
│                                │
│ Wohin verschieben?             │   h1, bekommt den Fokus
│ „Lego Zug“ liegt in            │
│ „Geburtstag“.                  │
│                                │
│  Ostern                      › │   andere Listen von Anna,
│  Weihnachten                 › │   alphabetisch
└────────────────────────────────┘

ohne Ziel:
┌────────────────────────────────┐
│ ‹ Wunsch bearbeiten            │
│ Wohin verschieben?             │
│ „Lego Zug“ liegt in            │
│ „Geburtstag“.                  │
│ Keine andere Liste vorhanden.  │
└────────────────────────────────┘

Tipp auf „Weihnachten“:
┌────────────────────────────────┐
│ ‹ Weihnachten                  │   Detailseite, Zurück-Link zeigt neue Liste
│ Lego Zug                       │   Ansage: „In „Weihnachten“ verschoben.“
│ …                              │
└────────────────────────────────┘
```

## Abstraktionen und Wiederverwendung

- `src/wishlist/domain`
  - `Wish.ts`
    - `Wish.moveTo(wishlistId: WishlistId, perspective: Perspective): Wish` (neu) nutzt
      `isHiddenFrom` und `#changed({ wishlistId })`
  - `wishMove.ts` (neu)
    - `moveTargetsOf(source: Wishlist, wishlists: readonly Wishlist[]): Wishlist[]` nutzt
      `sortWishlists`
    - `moveWish(wish: Wish, source: Wishlist, target: Wishlist, me: PersonId): Wish`
      nutzt `perspectiveOf` und `Wishlist.ensureVisibleTo`
    - `WishCannotMoveThere` (neu)
- `src/wishlist/application`
  - `MoveWish.ts` (neu), nach dem Muster von `EditWish.ts`
- `src/wishlist/infrastructure`
  - `createWishlistModule.ts`: `moveWish: new MoveWish(wishes, wishlists)`
  - `ui/wishlistAddresses.ts`: Adresse `moveWish` ↔ `#/wunsch/<id>/verschieben`
  - `ui/WishlistPages.svelte`: Zweig für `moveWish`
  - `ui/MoveWishPage.svelte` (neu): Muster aus `ChooseProfilePage.svelte` (Liste) und
    `EditWishPage.svelte` (Beobachten von Wunsch und Liste, `LoadFailed`, `NotFound`)
  - `ui/EditWishPage.svelte`: beobachtet zusätzlich die Listen der Besitzerin über
    `watchWishlistsOwnedBy` und zeigt den Knopf, wenn `moveTargetsOf` nicht leer ist
  - `ui/wishTexts.ts`: neue Texte
- Vorhandenes, unverändert genutzt: `PageHeader` (`back`), `entryList.css`,
  `announce`, `navigateTo`, `Watched`, `wishlistFilterMemory`, `InMemory*`-Fakes,
  `wishlistNamed`/`removedWishlistNamed`/`wishNamed`

## Logging und Beobachtbarkeit

Keine Änderungen. Schreibfehler laufen wie bisher über `observedWrite` in die
Problemanzeige.

## Umsetzung

Abhängigkeiten: keine

Ein Wunsch lässt sich über die Bearbeiten-Seite in eine andere Liste derselben
Besitzerin verschieben. Alle Regeln sind in Domäne und Anwendungsfall getestet, der
Ablauf per E2E.

**Aufgaben**:

Domäne, test-getrieben:

- [x] `Wish.test.ts`, Tests zuerst für `Wish.moveTo(wishlistId, perspective)`:
  - Das Ergebnis hat die neue `wishlistId`. Alle anderen Felder bleiben gleich,
    geprüft an einem Wunsch mit `secret`, `giverId`, `received`, `removedByOwner`,
    `repeatable` und `gifts` (per `Wish.restore`).
  - Ein geheimer Wunsch aus Sicht der Besitzerin wirft `WishHiddenFromOwner`, ebenso
    ein Wunsch mit `removedByOwner` aus ihrer Sicht.
- [x] `Wish.moveTo` umsetzen:
  ```ts
  moveTo(wishlistId: WishlistId, perspective: Perspective): Wish {
    if (this.isHiddenFrom(perspective)) {
      throw new WishHiddenFromOwner(this.id);
    }
    return this.#changed({ wishlistId });
  }
  ```
- [x] `wishMove.test.ts` (neu). Als Domänentest darf er nicht aus `application/fakes`
  importieren (`eslint.architecture.config.js`). Er bekommt deshalb eigene kleine
  Helfer für Listen und Wünsche, im Stil von `Wishlist.test.ts:26-41`.
  Tests zuerst für `moveTargetsOf(source, wishlists)`:
  - Liefert die anderen Listen derselben Besitzerin alphabetisch, ohne die Quelle.
  - Lässt Listen anderer Personen weg.
  - Lässt von der Besitzerin gelöschte Listen weg.
  - Liefert `[]`, wenn die Quelle von der Besitzerin gelöscht ist.
- [x] `wishMove.test.ts`, Tests zuerst für `moveWish(wish, source, target, me)`:
  - Verschiebt aus Sicht der Besitzerin und aus Sicht einer anderen Person.
  - Verschiebt einen geheimen Wunsch aus Sicht einer anderen Person. Er bleibt geheim.
  - Wirft `WishCannotMoveThere` bei einer Zielliste einer anderen Person, bei der
    Quelle als Ziel, bei einer gelöschten Zielliste und bei einer gelöschten Quelle
    (aus Sicht einer anderen Person).
  - Wirft `WishlistNotFound`, wenn die Besitzerin aus ihrer gelöschten Liste
    verschieben will.
  - Wirft `WishHiddenFromOwner`, wenn die Besitzerin einen geheimen Wunsch verschieben
    will, auch bei einem unzulässigen Ziel. Die Sichtbarkeit wird zuerst geprüft.
  - Wirft `WishCannotMoveThere`, wenn der Wunsch gar nicht in `source` liegt.
  - Eine andere Person verschiebt einen Wunsch mit `removedByOwner: true`, und das
    Kennzeichen bleibt gesetzt.
- [x] `wishMove.ts` umsetzen:
  ```ts
  export function moveTargetsOf(source: Wishlist, wishlists: readonly Wishlist[]): Wishlist[] {
    if (source.removedByOwner) {
      return [];
    }
    return sortWishlists(
      wishlists.filter(
        (wishlist) =>
          wishlist.ownerId === source.ownerId &&
          wishlist.id !== source.id &&
          !wishlist.removedByOwner,
      ),
    );
  }

  export function moveWish(wish: Wish, source: Wishlist, target: Wishlist, me: PersonId): Wish {
    const perspective = perspectiveOf(source, me);
    source.ensureVisibleTo(perspective);
    if (wish.isHiddenFrom(perspective)) {
      throw new WishHiddenFromOwner(wish.id);
    }
    const isInSource = wish.wishlistId === source.id;
    if (!isInSource || moveTargetsOf(source, [target]).length === 0) {
      throw new WishCannotMoveThere(wish.id, target.id);
    }
    return wish.moveTo(target.id, perspective);
  }

  export class WishCannotMoveThere extends Error {
    constructor(
      readonly wishId: WishId,
      readonly wishlistId: WishlistId,
    ) {
      super(`The wish ${wishId} cannot be moved to the wishlist ${wishlistId}.`);
      this.name = 'WishCannotMoveThere';
    }
  }
  ```

Anwendungsfall, test-getrieben:

- [x] `MoveWish.test.ts` (neu), Tests zuerst, Aufbau wie `EditWish.test.ts` mit Anna
  (`birthday`, `christmas`) und Ben (`bens`):
  - Verschiebt `Helm` von `birthday` nach `christmas`. Der gespeicherte Wunsch hat die
    neue `wishlistId` und behält `giverId` und `received`.
  - Ben verschiebt einen geheimen Wunsch in Annas Listen.
  - Wirft `WishCannotMoveThere` bei Bens Liste als Ziel.
  - Wirft `WishHiddenFromOwner`, wenn Anna einen geheimen Wunsch verschieben will.
  - Wirft `WishNotFound` bei unbekanntem Wunsch.
  - Wirft `WishlistNotFound` bei unbekannter Quellliste und bei unbekannter Zielliste.
- [x] `MoveWish.ts` umsetzen:
  ```ts
  export class MoveWish {
    constructor(
      private readonly wishes: WishRepository,
      private readonly wishlists: WishlistRepository,
    ) {}

    async execute(id: WishId, targetId: WishlistId, me: PersonId): Promise<void> {
      const wish = await this.wishes.get(id);
      if (wish === undefined) {
        throw new WishNotFound(id);
      }
      const source = await this.#wishlist(wish.wishlistId);
      const target = await this.#wishlist(targetId);
      await this.wishes.save(moveWish(wish, source, target, me));
    }

    async #wishlist(id: WishlistId): Promise<Wishlist> {
      const wishlist = await this.wishlists.get(id);
      if (wishlist === undefined) {
        throw new WishlistNotFound(id);
      }
      return wishlist;
    }
  }
  ```
- [x] `createWishlistModule.ts`: `moveWish: new MoveWish(wishes, wishlists)`.

Adresse und Seite:

- [x] `wishlistAddresses.test.ts`: `['#/wunsch/w-1/verschieben', { page: 'moveWish', wishId }]`
  in `addresses` aufnehmen, dazu `'#/wunsch/w-1/unbekannt'` bei den abgelehnten Adressen.
- [x] `wishlistAddresses.ts`: Variante `{ page: 'moveWish'; wishId: WishId }`, Muster
  `^#/wunsch/${ID}/verschieben$` und `hashOf` → `#/wunsch/<id>/verschieben`.
- [x] `wishTexts.ts`:
  - `MOVE_WISH_LABEL = 'In andere Liste verschieben'`
  - `MOVE_WISH_HEADING = 'Wohin verschieben?'`
  - `NO_MOVE_TARGET_MESSAGE = 'Keine andere Liste vorhanden.'`
  - `wishLocationNote(wishName: string, wishlistName: string): string` →
    `„Lego Zug“ liegt in „Geburtstag“.`
  - `wishMovedAnnouncement(wishlistName: string): string` →
    `In „Weihnachten“ verschoben.`
  - Tests in `wishTexts.test.ts` für beide Funktionen.
- [x] `MoveWishPage.svelte` (neu), Eigenschaft `wishId`:
  - Beobachtet drei Dinge, alle drei als `Watched`:
    - den Wunsch (`watchWish`)
    - die Quellliste (`watchWishlist`)
    - die Listen der Besitzerin (`watchWishlistsOwnedBy(ownerId)`), sobald `ownerId`
      bekannt ist, als `Watched<readonly Wishlist[]>`
  - `view` wie in `EditWishPage.svelte` über `viewOfWish(wish, perspectiveOf(...))`.
  - Während `isMoving` rendert die Seite nichts. Das verhindert einen Doppeltipp und
    einen kurzen falschen Zwischenstand, bevor die Adresse wechselt: `FirestoreWishRepository.save`
    wartet nicht auf `setDoc`, der lokale Snapshot kann vor dem `hashchange` kommen.
  - Schlägt eines der drei beim Laden fehl: `LoadFailed`.
  - Fehlen Wunsch oder Liste oder ist der Wunsch nicht `shown`: `NotFound` mit „Diesen
    Wunsch gibt es nicht mehr.“.
  - Sonst:
    - `PageHeader` mit `heading={MOVE_WISH_HEADING}` und
      `back={{ label: 'Wunsch bearbeiten', hash: hashOf({ page: 'editWish', wishId }) }}`
    - `<p>{wishLocationNote(...)}</p>`
    - Die Ziele erscheinen erst, wenn die Listen der Besitzerin geladen sind
      (`status === 'found'`). So blitzt „Keine andere Liste vorhanden.“ beim Laden nicht
      auf.
    - Ist `moveTargetsOf(...)` leer: `<p>{NO_MOVE_TARGET_MESSAGE}</p>`. Das gilt bewusst
      auch, wenn eine andere Person eine von der Besitzerin gelöschte Liste direkt über
      die Adresse aufruft.
    - Sonst `<ul class="entry-list">` mit einem `button` je Zielliste (Name und
      `ChevronRight`).
  - Tipp: `isMoving = true`, `await moveWish.execute(wishId, target.id, profile.me.id)`,
    `navigateTo(hashOf({ page: 'wish', wishId }))`,
    `announce(wishMovedAnnouncement(target.name.value))`.
- [x] `WishlistPages.svelte`: Zweig
  `{:else if address.page === 'moveWish'} <MoveWishPage wishId={address.wishId} />` vor
  dem `else`-Zweig.
- [x] `EditWishPage.svelte`:
  - Beobachtet über `watchWishlistsOwnedBy(ownerId)` die Listen der Besitzerin in
    `let ownedWishlists = $state.raw<readonly Wishlist[]>()`. Ein Ladefehler wird still
    übergangen (`() => {}`, wie bei `watchPerson`). Der Knopf erscheint dann einfach
    nicht.
  - `moveTargets = $derived(wishlist.value ? moveTargetsOf(wishlist.value, ownedWishlists ?? []) : [])`
  - Im `extra`-Snippet steht vor „Wunsch löschen“ bei nicht leerem `moveTargets` ein
    eigener `button-row` mit
    `<button class="button" type="button" onclick={() => navigateTo(hashOf({ page: 'moveWish', wishId }))}>`,
    dem Icon `ArrowRightLeft` (`@lucide/svelte`, `aria-hidden`) und `MOVE_WISH_LABEL`.

E2E in `e2e/moving.spec.ts` (neu). Das Profil ist Anna. Gemeinsamer Seed im
`beforeEach`, Personen `ben` („Ben“) und `oma` („Oma“):

| Liste | Besitz | Wünsche |
|---|---|---|
| `birthday` „Geburtstag“ | Anna | `helmet` „Fahrradhelm“ (`giverId: 'ben'`), `book` „Buch“ |
| `christmas` „Weihnachten“ | Anna | `sledge` „Schlitten“ |
| `easter` „Ostern“ | Anna | – |
| `oldList` „Alt“ (`removedByOwner`) | Anna | – |
| `bens` „Bens Liste“ | Ben | `tickets` „Konzertkarten“ (`secret`, `createdBy: 'anna'`) |
| `bensSecond` „Bens Weihnachten“ | Ben | – |
| `bensOld` „Bens Alte“ (`removedByOwner`) | Ben | `kite` „Drachen“ (`createdBy: 'ben'`) |
| `omas` „Omas Liste“ | Oma | `scarf` „Schal“ |

Prüfungen auf einen *fehlenden* Knopf warten zuerst auf die Überschrift „Wunsch
bearbeiten“ und den Knopf „Wunsch löschen“. Weil der Verschieben-Knopf erst nach dem
Laden der Listen erscheint, stützt sie sich außerdem auf den positiven Fall im selben
Aufbau.

- [x] Verschiebt „Fahrradhelm“ von „Geburtstag“ nach „Weihnachten“:
  - Auf der Bearbeiten-Seite ist „In andere Liste verschieben“ sichtbar.
  - Die Unterseite zeigt die Überschrift „Wohin verschieben?“. Sie hat den Fokus
    (`toBeFocused`, wie `editing.spec.ts:139`).
  - Die Unterseite zeigt den Hinweis „„Fahrradhelm“ liegt in „Geburtstag“.“.
  - Ihre Einträge (`getByRole('main').getByRole('listitem')`) sind genau
    `['Ostern', 'Weihnachten']`. „Alt“ fehlt.
  - Nach dem Tipp auf „Weihnachten“ erscheint die Überschrift „Fahrradhelm“ mit dem Knopf
    „Zurück zu Weihnachten“. Die Ansage lautet „In „Weihnachten“ verschoben.“
    (`expectAnnouncement`).
  - `storedWishes()` zeigt für `helmet` `wishlistId: 'christmas'` und unverändert
    `giverId: 'ben'`.
  - Die Übersicht zeigt „Geburtstag“ mit „1 offen · 0 erfüllt“ (vorher 2) und
    „Weihnachten“ mit „2 offen · 0 erfüllt“ (vorher 1). Aus Annas Sicht zählt der
    geschenkte, nicht erhaltene Helm als offen.
- [x] Der Zurück-Knopf „Zurück zu Wunsch bearbeiten“ führt zur Bearbeiten-Seite, und in
  `storedWishes()` liegt `helmet` weiter in `birthday`.
- [x] Anna verschiebt „Konzertkarten“ innerhalb von Bens Listen:
  - Die Unterseite bietet genau `['Bens Weihnachten']` an.
  - Nach dem Tipp liegt der Wunsch in `storedWishes()` in `bensSecond` und ist weiterhin
    `secret: true`.
- [x] Auf der Bearbeiten-Seite von „Drachen“ (in Bens gelöschter Liste) fehlt der Knopf
  „In andere Liste verschieben“.
- [x] Auf der Bearbeiten-Seite von „Schal“ (Oma hat nur eine Liste) fehlt der Knopf.
  Wer `#/wunsch/scarf/verschieben` direkt aufruft, sieht „Keine andere Liste vorhanden.“.
- [x] `#/wunsch/unbekannt/verschieben` zeigt „Diesen Wunsch gibt es nicht mehr.“.
- [x] `e2e/accessibility.spec.ts`, zwei neue Einträge nach „edit wish“:
  - `{ name: 'move wish', path: './#/wunsch/helmet/verschieben', heading: 'Wohin verschieben?', data: wishlistWithWishes }`.
    `wishlistWithWishes` hat mit „Weihnachten“ bereits eine Zielliste.
  - `'move wish without target'` mit einem Seed aus genau einer Liste samt Wunsch. Die
    Seite zeigt „Keine andere Liste vorhanden.“.

Dokumentation:

- [x] `README.md`, im Absatz über die Felder eines Wunsches: „Ein Wunsch lässt sich in
  eine andere Liste derselben Person verschieben. Dabei ändert sich nur `wishlistId`,
  der übrige Zustand bleibt erhalten. Gelöschte Listen sind weder Ziel noch Quelle.“
- [ ] `docs/notes.txt`: „Wunsch in andere Liste kopieren/ausschneiden“ auf `x` setzen und
  ans Ende von DONE verschieben, erst nach der Geräteabnahme.

**Automatisierte Verifikation**:

- [x] `npm run test:unit` läuft grün, einschließlich `Wish.test.ts`, `wishMove.test.ts`,
  `MoveWish.test.ts`, `wishlistAddresses.test.ts` und `wishTexts.test.ts`.
- [x] `npm run test:e2e` läuft grün, einschließlich `e2e/moving.spec.ts` und der
  Barrierefreiheitsprüfung der neuen Seite.
- [x] `npm run test:integration` läuft grün, unverändert.
- [x] `npm run test:architecture` und `npm run lint` laufen durch.
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:

- [ ] Auf dem iPhone mit VoiceOver: Auf der Bearbeiten-Seite wird „In andere Liste
  verschieben“ als Taste vorgelesen. Auf der Unterseite liegt der Fokus auf „Wohin
  verschieben?“, und der Hinweis mit der aktuellen Liste sowie die Ziellisten sind der
  Reihe nach erreichbar.
- [ ] Nach dem Verschieben wird „In „…“ verschoben.“ angesagt. Der Wunsch steht in der
  neuen Liste und fehlt in der alten, auch auf einem zweiten Gerät.
- [ ] Offline verschieben: Der Wunsch erscheint sofort in der neuen Liste und ist nach
  der Wiederverbindung auf dem zweiten Gerät ebenfalls umgezogen.

## Notizen zur Umsetzung

- `MoveWishPage` setzt `isMoving` zurück, wenn `moveWish.execute` scheitert. So bleibt
  die Seite nach einem Fehler nicht leer.
- Die E2E-Prüfungen auf einen fehlenden Knopf gehen zuerst über die Unterseite. Dort
  erscheint „Keine andere Liste vorhanden.“ erst nach dem Laden der Listen. Erst danach
  prüfen sie die Bearbeiten-Seite, so wartet die Prüfung nicht ins Leere.
- In `e2e/accessibility.spec.ts` warten beide neuen Einträge per `prepare`, bis die Ziele
  bzw. der Hinweis geladen sind.

## Verweise

- `src/wishlist/domain/Wish.ts`, `src/wishlist/domain/Wishlist.ts`,
  `src/wishlist/domain/Perspective.ts`
- `src/wishlist/application/EditWish.ts` als Muster für `MoveWish`
- `src/wishlist/infrastructure/ui/ChooseProfilePage.svelte` als Muster für die Unterseite
- `src/wishlist/infrastructure/ui/EditWishPage.svelte`
- `docs/agents/plans/2026-09-29-geheim-schenken-erhalten.md` für `removedByOwner` und
  die Sichtbarkeitsregeln
- `docs/notes.txt`, Punkt „Wunsch in andere Liste kopieren/ausschneiden“
