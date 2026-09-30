---
date: 2026-09-30T09:53:42.550483+00:00
git_commit: c2c77684c53afbafd52dda4dd10435601ea56a12
branch: main
story: WL-010
topic: "Wiederkehrende Wünsche, die mehrmals geschenkt werden können"
tags: [plan, wishlist, wish, gifting, wishform, firestore, ui]
status: done
---

# PLAN: WL-010 — Wiederkehrende Wünsche

Manche Wünsche kann man mehrmals schenken, etwa eine Lieblingssüßigkeit. Beim Erstellen
und Bearbeiten lässt sich ein Wunsch als „Mehrmals schenkbar“ markieren. Ein solcher
Wunsch verschwindet beim Schenken nicht aus „Noch offen“. Er taucht zusätzlich unter
„Erfüllt“ auf, mit dem Vermerk „n-mal geschenkt“. Der Plan greift den Punkt
„Wunsch wiederholen möglich machen“ aus `docs/notes.txt` auf.

## Akzeptanzkriterien

- Das Formular zum Erstellen und Bearbeiten eines Wunsches hat den Haken
  „Mehrmals schenkbar“. Er ist standardmäßig nicht gesetzt.
- „Geheim“ und „Mehrmals schenkbar“ schließen sich aus.
  - Ist einer der beiden gesetzt, ist der andere gesperrt. Er bleibt für VoiceOver
    lesbar und erklärt in seinem Hinweis, warum er gesperrt ist.
  - Die Domäne lehnt die Kombination ab (`WishCannotBeSecretAndRepeatable`).
- Beim Bearbeiten lässt sich „Mehrmals schenkbar“ nur im unberührten Zustand umschalten.
  - Einschalten geht nur, wenn der Wunsch weder geschenkt noch erhalten ist.
  - Ausschalten geht nur, wenn der Wunsch keine Schenkungen hat.
  - Sonst ist der Haken gesperrt, mit dem Hinweis „Bereits geschenkt – erst
    zurücknehmen.“. Die Domäne wirft `RepeatabilityLocked`.
- Wiederholbarer Wunsch, Sicht der Anderen:
  - „Schenken“ fügt sofort eine Schenkung hinzu. Der Knopf bleibt danach verfügbar,
    auch für dieselbe Person.
  - Wer mindestens eine eigene Schenkung hat, bekommt zusätzlich den Knopf
    „Schenken zurücknehmen“. Er entfernt die jüngste eigene Schenkung.
- Wiederholbarer Wunsch, Sicht der Besitzerin:
  - „Erhalten“ fügt eine Schenkung hinzu, die sie selbst vermerkt hat.
  - Hat sie mindestens einen eigenen Vermerk, bekommt sie „Erhalten zurücknehmen“. Er
    entfernt ihren jüngsten Vermerk.
- Ein wiederholbarer Wunsch steht immer unter „Noch offen“. Ab der ersten Schenkung
  steht er zusätzlich unter „Erfüllt“. Das gilt für die Besitzerin wie für alle anderen.
- Die Zahlen `n offen · m erfüllt` in der Übersicht und auf den Filterknöpfen zählen
  einen wiederholbaren Wunsch mit Schenkungen in beiden Zahlen.
- Anzeige in der Liste, unter beiden Filtern gleich:
  - „🔁 mehrmals schenkbar“, solange es keine Schenkung gibt.
  - „🔁 n-mal geschenkt“ ab der ersten Schenkung, z. B. „🔁 1-mal geschenkt“ oder
    „🔁 3-mal geschenkt“.
- Die Detailseite zeigt dieselbe Zeile. Ab der ersten Schenkung ergänzt sie die
  schenkenden Personen: „🔁 3-mal geschenkt – von Anna, Ben“.
  - Jede Person steht nur einmal da, in der Reihenfolge ihrer ersten Schenkung.
  - Vermerke der Besitzerin und Personen, die es nicht mehr gibt, erscheinen ohne Namen.
  - Bleibt kein Name übrig, entfällt der Zusatz „– von …“.
- Das Symbol 🔁 ist `aria-hidden`. VoiceOver liest nur den Text.
- Firestore-Dokumente ohne die neuen Felder gelten als nicht wiederholbar und ohne
  Schenkungen. Bestehende Wünsche verhalten sich unverändert.

## Wesentliche Entscheidungen und Abwägungen

1. **Schenkung als Liste von Vermerken:** `Wish` bekommt `repeatable: boolean` und
   `gifts: readonly RepeatedGift[]` mit `RepeatedGift = { recordedBy: PersonId }`.
   - Warum:
     - Wer die Schenkung vermerkt hat, reicht für Anzeige und Zurücknehmen.
     - Ein Vermerk der Besitzerin („Erhalten“) ist daran erkennbar, dass
       `recordedBy === ownerId` ist.
     - Die Reihenfolge der Liste bestimmt die jüngste Schenkung. Ein Datum wird nicht
       gespeichert, weil es nirgends angezeigt wird.
   - Auswirkung: `giverId` und `received` bleiben bei wiederholbaren Wünschen immer
     `undefined` bzw. `false`. Der Ablauf „ein Schenker“ ändert sich für normale
     Wünsche nicht.
2. **Einstufiges Schenken ohne Reservierung:** Jede Schenkung zählt sofort und ist für
   alle sichtbar, auch für die Besitzerin.
   - Warum: Bei wiederkehrenden Wünschen sind Doppelkäufe erwünscht, und eine
     Überraschung ist kaum gefährdet.
   - Auswirkung: Für wiederholbare Wünsche gibt es kein „Übergeben“.
3. **Bestehende Aktionen weiterverwenden:** `gift`, `takeBackGift`, `receive` und
   `undoReceive` bedeuten bei wiederholbaren Wünschen „Vermerk hinzufügen“ bzw.
   „eigenen jüngsten Vermerk entfernen“.
   - Warum: Beschriftungen, Icons und Ansagen passen bereits.
   - Auswirkung: Es gibt keine neuen `WishAction`-Werte. `allowedWishActions` und
     `Wish.perform` verzweigen nach `repeatable`.
4. **Geheim und wiederholbar schließen sich aus:** Die Invariante liegt in `Wish.create`
   und `Wish.edit`. Im Formular sperrt der gesetzte Haken den anderen.
   - Warum: Sonst müsste man jede Sichtbarkeitsregel verdoppeln, ohne fachlichen Nutzen.
   - Auswirkung: Die beiden Wahrheitswerte wandern zusammen als Wert
     `WishTraits = { secret: boolean; repeatable: boolean }` durch Formular, Seiten und
     Anwendungsfälle. So gibt es keine zwei aufeinanderfolgenden `boolean`-Parameter.
5. **Umschalten nur im unberührten Zustand:** `Wish.edit` wirft `RepeatabilityLocked`.
   Die reine Domänenfunktion `canChangeRepeatability(wish)` sagt dem Formular, ob der
   Haken gesperrt ist.
   - Warum: Es geht nichts stillschweigend verloren, und die Regeln bleiben einfach.
6. **Ansicht mit Liste der Filter:** `WishView.status: WishFilter` wird zu
   `listedUnder: readonly WishFilter[]`. Dazu kommt `repeatedGifts?: RepeatedGiftsView`
   mit `{ count: number; giverIds: readonly PersonId[] }`.
   - Warum: Ein Wunsch kann jetzt unter beiden Filtern stehen.
   - Auswirkung: Angepasst werden `viewOfWishes`, `countWishes`, `WishStateNotes` und
     die bestehenden Tests in `wishView.test.ts`.
7. **Speichern wie bisher mit `setDoc`, der letzte Schreiber gewinnt:**
   - Warum: So verhält sich die App schon heute bei allen Zustandsänderungen.
     Transaktionen scheitern offline.
   - Risiko: Schenken zwei Personen fast gleichzeitig, geht eine Schenkung verloren.
     Das ist in der Familie selten und bewusst in Kauf genommen.
   - Auswirkung: `firestore.rules` bleibt unverändert.

## Ausgangslage

Zustand eines Wunsches (`src/wishlist/domain/Wish.ts:7-17`): genau ein `giverId`, dazu
`received`, `secret` und `removedByOwner`.

Erlaubte Aktionen (`src/wishlist/domain/wishActions.ts:23-37`):

```
                 Andere Person            Schenkende Person          Besitzerin
                 ─────────────            ─────────────────          ──────────
offen, frei      [Schenken]               —                          [Erhalten]
geschenkt        —                        [Schenken zurücknehmen]    [Erhalten]
erhalten         —                        —                          [Erhalten zurücknehmen]
geheim           [Schenken]               [Übergeben] / [Zurück…]    sieht „Überraschung“
```

Offen oder erfüllt (`src/wishlist/domain/wishView.ts:24-29`): Jeder Wunsch ist genau
eines von beiden. `countWishes` (`wishView.ts:79-90`) zählt jeden Wunsch einmal.

Formular: `WishForm.svelte` zeigt „Geheim“ nur, wenn die Seite ein `secret` mitgibt.
`onsubmit(details, secret)` geht an `CreateWishPage.svelte` bzw. `EditWishPage.svelte`
und von dort an `CreateWish.execute(wishlistId, details, secret, me)` bzw.
`EditWish.execute(id, details, secret, me)`.

Speicherung: `src/wishlist/infrastructure/firestore/wishDocument.ts`, ganzes Dokument
per `setDoc` (`FirestoreWishRepository.ts:77-78`).

## Zielbild

```
Wish
 ├─ secret, giverId, received        normaler Ablauf, unverändert
 └─ repeatable, gifts[]              nur bei repeatable === true befüllt
        gifts = [ {recordedBy: anna}, {recordedBy: ben}, {recordedBy: anna} ]

Erlaubte Aktionen bei repeatable:
                 Andere Person                              Besitzerin
                 ─────────────                              ──────────
immer            primär  [Schenken]                         primär  [Erhalten]
mit eigenem      sekundär [Schenken zurücknehmen]           sekundär [Erhalten zurücknehmen]
Vermerk

listedUnder:  gifts.length === 0  → ['open']
              gifts.length  >  0  → ['open', 'fulfilled']
```

Formular (Erstellen, eigene Liste):

```
Vorher                                      Nachher
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│ Name  ...                       │        │ Name  ...                       │
│ Wie sehr gewünscht?  ...        │        │ Wie sehr gewünscht?  ...        │
│                                 │        │ Mehrmals schenkbar          [ ] │
│                                 │        │ Kann immer wieder geschenkt     │
│                                 │        │ werden, z. B. Süßigkeiten.      │
├─────────────────────────────────┤        ├─────────────────────────────────┤
│ [💾 Speichern]  [✕ Abbrechen]   │        │ [💾 Speichern]  [✕ Abbrechen]   │
└─────────────────────────────────┘        └─────────────────────────────────┘
```

Formular (Erstellen auf fremder Liste, „Geheim“ ist vorbelegt):

```
┌─────────────────────────────────┐
│ Geheim                      [✓] │
│ Ben sieht nur „Überraschung“.   │
│ Mehrmals schenkbar      (gesp.) │
│ Nicht zusammen mit „Geheim“     │
│ möglich.                        │
└─────────────────────────────────┘
```

Nimmt man „Geheim“ heraus, wird „Mehrmals schenkbar“ wählbar und zeigt wieder seinen
normalen Hinweis. Umgekehrt sperrt ein gesetztes „Mehrmals schenkbar“ den Haken „Geheim“
mit dem Hinweis „Nicht zusammen mit „Mehrmals schenkbar“ möglich.“.

Liste und Detailseite:

```
Liste „Noch offen“                        Liste „Erfüllt“
┌───────────────────────────────────┐     ┌───────────────────────────────────┐
│ Kinder-Schokolade               › │     │ Kinder-Schokolade               › │
│ Ferrero · ★★ gern · 2,49 €        │     │ Ferrero · ★★ gern · 2,49 €        │
│ 🔁 3-mal geschenkt                │     │ 🔁 3-mal geschenkt                │
├───────────────────────────────────┤     ├───────────────────────────────────┤
│ Gummibärchen                    › │     │ Lego-Set                        › │
│ 🔁 mehrmals schenkbar             │     │ geschenkt von Anna                │
└───────────────────────────────────┘     └───────────────────────────────────┘

Detailseite (Anna hat schon einmal geschenkt)
┌──────────────────────────────────────┐
│ ‹ Weihnachten                        │
│ Kinder-Schokolade                    │
│ 🔁 3-mal geschenkt – von Anna, Ben   │
│ Ferrero                              │
│ ★★ gern · 2,49 €                     │
│ gewünscht seit 1. September 2026     │
│ [↶ Schenken zurücknehmen]            │
├──────────────────────────────────────┤
│ [✎ Bearbeiten]      [🎁 Schenken]    │
└──────────────────────────────────────┘
```

## Abstraktionen und Wiederverwendung

- `src/wishlist/domain`
  - `Wish.ts`
    - `RepeatedGift` (neu): `{ recordedBy: PersonId }`
    - `WishTraits` (neu): `{ secret: boolean; repeatable: boolean }`
    - `RestoredWish`, `NewWish`: neue Felder `repeatable` bzw. `gifts`. `NewWish`
      bekommt `traits: WishTraits` statt `secret`.
    - `Wish.create`, `Wish.edit`: prüfen die neuen Invarianten
    - `Wish.perform`: Zweig für wiederholbare Wünsche
    - `Wish.hasGiftRecordedBy(personId)`: sagt, ob die Person einen Vermerk hat
    - `canChangeRepeatability(wish)`: steuert die Sperre im Formular
    - `WishCannotBeSecretAndRepeatable`, `RepeatabilityLocked` (neu)
  - `wishActions.ts`: `allowedForRepeatable(wish, perspective)`
  - `wishView.ts`: `listedUnder`, `RepeatedGiftsView`, `repeatedGiftsOf`, `countWishes`
- `src/wishlist/application`
  - `CreateWish.ts`, `EditWish.ts`: `traits: WishTraits` statt `secret: boolean`
  - `fakes/wishNamed.ts`: Standardwerte `repeatable: false`, `gifts: []`
- `src/wishlist/infrastructure`
  - `firestore/wishDocument.ts`: Felder `repeatable?`, `gifts?`, Standardwerte beim Lesen
  - `ui/WishForm.svelte`: Haken „Mehrmals schenkbar“, gegenseitige Sperre,
    `onsubmit(details, traits)`
  - `ui/CreateWishPage.svelte`, `ui/EditWishPage.svelte`: `traits` durchreichen, Sperre
    beim Bearbeiten
  - `ui/WishStateNotes.svelte`: Zeile „🔁 …“
  - `ui/wishTexts.ts`: neue Texte
- `src/shared/ui/CheckOption.svelte`: neue Eigenschaft `disabled`, der vorhandene
  Hinweis bleibt über `aria-describedby` verknüpft
- `e2e/emulators.ts`: `WishRecord` um `repeatable?` und `gifts?` erweitern

## Umsetzung

### Phase 1: Wiederholbarkeit anlegen und bearbeiten

Abhängigkeiten: keine

Man kann einen Wunsch als „Mehrmals schenkbar“ anlegen und bearbeiten. Er wird
gespeichert und in Liste und Detailseite mit „🔁 mehrmals schenkbar“ angezeigt. Schenken
verhält sich in dieser Phase noch wie bisher. Erst Phase 2 bringt die Schenkungsliste.

**Aufgaben**:

Domäne, test-getrieben in `Wish.test.ts`:

- [x] Typen `RepeatedGift` und `WishTraits` in `Wish.ts` einführen.
  - `RestoredWish` bekommt `repeatable: boolean` und `gifts: readonly RepeatedGift[]`.
  - `NewWish` bekommt `traits: WishTraits` statt `secret: boolean`.
  - `Wish` hat die Felder `repeatable` und `gifts`, und `#changed` übernimmt sie.
  - `Wish.create` setzt `gifts: []`.
- [x] Tests zuerst: `create` mit `{ secret: true, repeatable: true }` wirft
  `WishCannotBeSecretAndRepeatable`. `create` mit `{ secret: false, repeatable: true }`
  liefert `repeatable === true` und `gifts` leer.
- [x] `Wish.edit(details, traits, perspective)` statt `edit(details, secret, perspective)`.
  - Die bisherigen Prüfungen bleiben: `WishHiddenFromOwner`, `WishCannotBecomeSecret`.
  - Neu: `WishCannotBeSecretAndRepeatable`.
  - Neu: `RepeatabilityLocked`, wenn sich `repeatable` ändert, obwohl
    `canChangeRepeatability` `false` liefert.
- [x] `canChangeRepeatability(wish: Wish): boolean` als exportierte Funktion in `Wish.ts`.
  Liefert `true` genau dann, wenn `giverId === undefined && !received && gifts.length === 0`.
  - Tests: unberührt → `true`; geschenkt → `false`; erhalten → `false`; mit einem
    Vermerk (per `Wish.restore`) → `false`.
- [x] `fakes/wishNamed.ts`: Standardwerte `repeatable: false`, `gifts: []`.

Anwendungsfälle:

- [x] `CreateWish.execute(wishlistId, details, traits, me)` und
  `EditWish.execute(id, details, traits, me)`.
  - Bestehende Tests in `CreateWish.test.ts` und `EditWish.test.ts` auf
    `{ secret, repeatable: false }` umstellen.
  - Neuer Test: ein wiederholbarer Wunsch wird mit `repeatable === true` gespeichert.
  - Neuer Test: `EditWish` schaltet einen unberührten Wunsch um.
  - Neuer Test: `EditWish` wirft `RepeatabilityLocked` bei einem geschenkten Wunsch.

Firestore:

- [x] `wishDocument.ts` um die neuen Felder erweitern:
  - `WishDocument` bekommt `repeatable?: boolean` und `gifts?: { recordedBy: string }[]`.
  - `isWishDocument` prüft beide als optional. Jeder Eintrag in `gifts` braucht einen
    `recordedBy`, der `isPersonReference` erfüllt.
  - `wishFromDocument` liest `repeatable ?? false` und `gifts ?? []`.
  - `toWishDocument` schreibt `repeatable` immer und `gifts` nur, wenn die Liste nicht
    leer ist, im Stil der übrigen optionalen Felder.
- [x] Integrationstest in `tests/integration/FirestoreWishRepository.integration.test.ts`:
  - Ein wiederholbarer Wunsch mit zwei Vermerken übersteht Speichern und Lesen.
  - Ein Dokument ohne `repeatable` und `gifts` wird als nicht wiederholbar mit leerer
    Liste gelesen.

Oberfläche:

- [x] `CheckOption.svelte`: optionale Eigenschaft `disabled: boolean`, Standardwert
  `false`. Sie wird an das `<input>` weitergegeben. `.check-option` bekommt einen
  gedämpften Stil über `:has(input:disabled)`, passend zu `checkOption.css`.
- [x] `wishTexts.ts`:
  - `REPEATABLE_LABEL = 'Mehrmals schenkbar'`
  - `REPEATABLE_HINT = 'Kann immer wieder geschenkt werden, z. B. Süßigkeiten.'`
  - `REPEATABLE_EXCLUDED_BY_SECRET_HINT = 'Nicht zusammen mit „Geheim“ möglich.'`
  - `SECRET_EXCLUDED_BY_REPEATABLE_HINT = 'Nicht zusammen mit „Mehrmals schenkbar“ möglich.'`
  - `REPEATABILITY_LOCKED_HINT = 'Bereits geschenkt – erst zurücknehmen.'`
  - `REPEATABLE_NOTE = 'mehrmals schenkbar'`
  - Tests in `wishTexts.test.ts` für neue Funktionen; reine Konstanten brauchen keinen
    eigenen Test.
- [x] `WishForm.svelte`:
  - Neue Eigenschaft `repeatable: { initial: boolean; locked: boolean }`.
  - `onsubmit` bekommt die Signatur `(details: WishDetails, traits: WishTraits) => Promise<void>`.
  - Der Haken `wish-repeatable` steht unter dem Haken „Geheim“ bzw. an dessen Stelle,
    wenn die Seite kein `secret` mitgibt.
  - Gesperrt ist er, wenn `repeatable.locked` gilt oder `isSecret` gesetzt ist. Der
    Hinweis ist dann `REPEATABILITY_LOCKED_HINT` bzw.
    `REPEATABLE_EXCLUDED_BY_SECRET_HINT`, sonst `REPEATABLE_HINT`.
  - „Geheim“ ist gesperrt, solange `isRepeatable` gesetzt ist. Der Hinweis ist dann
    `SECRET_EXCLUDED_BY_REPEATABLE_HINT`, sonst `secret.hint`.
- [x] `CreateWishPage.svelte`: `repeatable={{ initial: false, locked: false }}`, und
  `create(details, traits)` reicht `traits` an `createWish.execute` weiter.
- [x] `EditWishPage.svelte`:
  `repeatable={{ initial: view.wish.repeatable, locked: !canChangeRepeatability(view.wish) }}`,
  und `save(details, traits)` reicht `traits` an `editWish.execute` weiter.
- [x] `WishView` bekommt `repeatable: boolean`, übernommen aus `wish.repeatable`.
  `WishStateNotes.svelte` zeigt bei `view.repeatable` die Zeile
  `<span aria-hidden="true">🔁</span> {REPEATABLE_NOTE}`, als `span` in der Liste und als
  `p` auf der Detailseite. In Phase 2 zeigt dieselbe Zeile dann die Zahl der Schenkungen.
- [x] `e2e/emulators.ts`: `WishRecord` um `repeatable?: boolean` und
  `gifts?: { recordedBy: string }[]` erweitern.
- [x] E2E in `e2e/wishes.spec.ts` bzw. `e2e/editing.spec.ts`:
  - Wunsch mit „Mehrmals schenkbar“ erstellen. Liste und Detailseite zeigen
    „mehrmals schenkbar“.
  - Auf einer fremden Liste ist „Mehrmals schenkbar“ gesperrt, solange „Geheim“ gesetzt
    ist, und wird wählbar, sobald „Geheim“ herausgenommen ist.
  - Beim Bearbeiten eines geschenkten Wunsches (Seed mit `giverId`) ist der Haken
    gesperrt und zeigt den Sperr-Hinweis.

**Automatisierte Verifikation**:
- [x] `npm run test:unit` läuft grün, einschließlich der neuen Tests in `Wish.test.ts`,
  `CreateWish.test.ts` und `EditWish.test.ts`.
- [x] `npm run test:integration` läuft grün, einschließlich des neuen Lese- und
  Schreibtests.
- [x] `npm run test:e2e` läuft grün, einschließlich der neuen Formulartests.
- [x] `npm run test:architecture` und `npm run lint` laufen durch.
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:
- [x] Auf dem iPhone mit VoiceOver: Der Haken „Mehrmals schenkbar“ wird mit Hinweis
  vorgelesen. Gesperrt wird er als „abgeblendet“ angesagt, und der Grund ist hörbar.

### Phase 2: Mehrfach schenken und zurücknehmen

Abhängigkeiten: Phase 1

Schenken und Erhalten fügen bei wiederholbaren Wünschen Vermerke hinzu, Zurücknehmen
entfernt den jüngsten eigenen. Der Wunsch bleibt offen und steht zusätzlich unter
„Erfüllt“. Die Zahlen und die Zeile „🔁 n-mal geschenkt“ zeigen den Stand.

**Aufgaben**:

Domäne, test-getrieben:

- [x] `wishActions.ts`: `allowedForRepeatable(wish, perspective)` wird vor der
  bisherigen Verzweigung aufgerufen, wenn `wish.repeatable` gilt.
  ```ts
  function allowedForRepeatable(wish: Wish, perspective: Perspective): AllowedWishActions {
    const hasOwnGift = wish.hasGiftRecordedBy(perspective.me);
    return isOwner(perspective)
      ? { primary: 'receive', ...(hasOwnGift && { secondary: 'undoReceive' }) }
      : { primary: 'gift', ...(hasOwnGift && { secondary: 'takeBackGift' }) };
  }
  ```
  Tests in `wishActions.test.ts`:
  - Andere ohne eigenen Vermerk: nur `gift`.
  - Andere mit eigenem Vermerk: `gift` und `takeBackGift`, auch wenn andere Personen
    ebenfalls Vermerke haben.
  - Besitzerin: `receive`; mit eigenem Vermerk zusätzlich `undoReceive`.
  - Ein fremder Vermerk gibt keinen Zurücknehmen-Knopf.
  - Der Wunsch ist in einer verborgenen Liste (`wishlistIsHidden`) oder von der
    Besitzerin entfernt: keine Aktionen.
- [x] `Wish.hasGiftRecordedBy(personId): boolean`.
- [x] `Wish.perform` verzweigt bei `repeatable`:
  - `gift` und `receive` hängen `{ recordedBy: perspective.me }` an `gifts` an.
  - `takeBackGift` und `undoReceive` entfernen den letzten Eintrag mit
    `recordedBy === perspective.me`.
  - `giverId` und `received` bleiben unverändert.
  - Tests:
    - Zweimal schenken durch dieselbe Person ergibt zwei Vermerke.
    - Zurücknehmen entfernt nur den jüngsten eigenen Vermerk und lässt fremde stehen.
      Beispiel: `[anna, ben, anna]` ergibt `[anna, ben]`.
    - `handOver` auf einem wiederholbaren Wunsch wirft `WishActionNotAllowed`.
- [x] `wishView.ts`:
  - `status` wird ersetzt durch `listedUnder: readonly WishFilter[]` mit
    `listedUnderFor(wish, perspective)`. Wiederholbare Wünsche liefern `['open']` bzw.
    `['open', 'fulfilled']`; alle anderen Wünsche liefern wie bisher genau einen Filter.
  - `repeatedGifts?: RepeatedGiftsView` mit `{ count, giverIds }` ersetzt das in
    Phase 1 eingeführte `repeatable: boolean`. `giverIds` enthält jede Person nur
    einmal, in der Reihenfolge ihres ersten Vermerks, ohne die Besitzerin.
  - `viewOfWishes` filtert mit `listedUnder.includes(filter)`.
  - `countWishes` zählt `open` und `fulfilled` jeweils über `listedUnder.includes(…)`.
  - Die bestehenden Tests in `wishView.test.ts` von `status` auf `listedUnder`
    umstellen. Neue Tests:
    - Ein wiederholbarer Wunsch ohne Vermerk steht nur unter `open`.
    - Mit Vermerk steht er unter beiden Filtern, für die Besitzerin wie für Andere.
    - `giverIds` ohne Dopplungen und ohne die Besitzerin.
    - `countWishes` zählt einen wiederholbaren Wunsch mit Vermerk in beiden Zahlen.
- [x] `wishlistOverview.test.ts`: ein Fall, bei dem ein wiederholbarer Wunsch mit
  Vermerk in beiden Zahlen der Übersicht zählt.
- [x] `ChangeWishState.test.ts`: Schenken eines wiederholbaren Wunsches speichert einen
  Vermerk, und der Wunsch bleibt über `allowedWishActions` weiter schenkbar.

Oberfläche:

- [x] `wishTexts.ts`: `repeatedGiftsNote(count: number, giverNames: readonly string[]): string`.
  - `0` → `mehrmals schenkbar`
  - `3, []` → `3-mal geschenkt`
  - `3, ['Anna', 'Ben']` → `3-mal geschenkt – von Anna, Ben`
  - Tests in `wishTexts.test.ts` für alle drei Fälle und für `1-mal geschenkt`.
  - `REPEATABLE_NOTE` aus Phase 1 entfällt zugunsten dieser Funktion.
- [x] `WishStateNotes.svelte`:
  - Bei `view.repeatedGifts` zeigt die Zeile „🔁“ in der Liste
    `repeatedGiftsNote(count, [])`, auf der Detailseite `repeatedGiftsNote(count, names)`.
    Die Namen kommen über `nameOf`; unbekannte Personen fallen heraus.
  - Der bisherige Zweig für `status === 'fulfilled'` prüft stattdessen
    `listedUnder.includes('fulfilled') && !view.repeatedGifts`.
- [x] `WishPage.svelte`: keine Logikänderung. Die Fokusführung nach `perform` bleibt
  richtig, weil der Hauptknopf „Schenken“ bzw. „Erhalten“ erhalten bleibt.
- [x] E2E in `e2e/gifting.spec.ts`, mit Seed für einen wiederholbaren Wunsch:
  - Anna schenkt zweimal. Die Ansage lautet „Als geschenkt markiert.“, und der Fokus
    liegt auf „Schenken“. Die Detailseite zeigt „2-mal geschenkt – von Anna“, und
    „Schenken zurücknehmen“ ist sichtbar.
  - Der Wunsch steht unter „Noch offen“ und unter „Erfüllt“, beide Male mit
    „2-mal geschenkt“.
  - „Schenken zurücknehmen“ ergibt „1-mal geschenkt – von Anna“.
  - Aus Sicht der Besitzerin (Profil Ben) gilt:
    - „Erhalten“ erhöht die Zahl, und die Namensliste bleibt ohne Ben.
    - „Erhalten zurücknehmen“ erscheint, und bei einem Wunsch nur mit fremden
      Vermerken fehlt er.
- [x] E2E in `e2e/wishCounts.spec.ts`: Ein wiederholbarer Wunsch mit Vermerk zählt auf
  den Filterknöpfen und in der Übersicht in beiden Zahlen.

**Automatisierte Verifikation**:
- [x] `npm run test:unit` läuft grün, einschließlich der neuen Tests in
  `wishActions.test.ts`, `Wish.test.ts`, `wishView.test.ts`,
  `wishlistOverview.test.ts`, `ChangeWishState.test.ts` und `wishTexts.test.ts`.
- [x] `npm run test:e2e` läuft grün, einschließlich der neuen Fälle in
  `gifting.spec.ts` und `wishCounts.spec.ts`.
- [x] `npm run test:architecture`, `npm run lint` und `npm run build` laufen durch.

**Manuelle Verifikation**:
- [x] Auf dem iPhone mit zwei Profilen: Eine Person schenkt einen wiederholbaren Wunsch
  zweimal. Das andere Gerät zeigt nach dem Abgleich „2-mal geschenkt“ unter
  „Noch offen“ und unter „Erfüllt“, und die Zahlen in der Übersicht stimmen.
- [x] VoiceOver liest „3-mal geschenkt – von Anna, Ben“ ohne das Symbol vor.

## Notizen zur Umsetzung

- Beide Phasen wurden auf Wunsch des Nutzers ohne Zwischenabnahme in einem Zug umgesetzt.
  Deshalb bekam `WishView` das Zwischenfeld `repeatable: boolean` aus Phase 1 nicht,
  sondern gleich `repeatedGifts` aus Phase 2. `REPEATABLE_NOTE` entstand gar nicht erst,
  der Text kommt aus `repeatedGiftsNote(0, …)`.
- `repeatedGifts` ist bei jedem wiederholbaren Wunsch gesetzt (auch mit `count: 0`) und bei
  allen anderen `undefined`. Daran erkennt `WishStateNotes`, welche Zeile es zeigt.
- `Array.prototype.findLastIndex` steht mit `lib: ES2022` nicht zur Verfügung. Die jüngste
  eigene Schenkung wird deshalb über `map(...).lastIndexOf(me)` gefunden.
- Die E2E-Fälle für Formular und Schenken stehen gebündelt in `e2e/repeatable.spec.ts`
  statt verteilt auf `wishes.spec.ts`, `editing.spec.ts` und `gifting.spec.ts`. Die
  Besitzerinnen-Sicht wird mit einer Liste von Anna geprüft (Standardprofil der E2E-Tests),
  nicht mit einem Profilwechsel zu Ben.
- `wishCounts.spec.ts` bekommt einen eigenen Fall mit einer zusätzlichen Liste „Naschen“,
  damit die bestehenden Erwartungen an „Ostern“ (leer) unverändert bleiben.
- `toWishDocument` schreibt `repeatable` jetzt immer. Deshalb erwartet der
  Integrationstest „stores only the fields a wish has“ zusätzlich `repeatable: false`.

## Verweise

- `docs/notes.txt`: TODO „Wunsch wiederholen möglich machen“
- `docs/agents/plans/2026-09-29-geheim-schenken-erhalten.md`: heutiger Ablauf von
  Schenken und Erhalten
- `docs/agents/plans/2026-09-30-wunschzahlen-offen-erfuellt.md`: Zählung offen/erfüllt
