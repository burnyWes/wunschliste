---
date: 2026-09-29T11:11:20.984085+00:00
git_commit: 02314211907ef7a4ac34284f68a83fb8cc6418a1
branch: main
story: WL-006
topic: "Schenken und Erhalten, Geheim-Einträge und Löschen nur für die Besitzerin"
tags: [plan, wishlist, domain, application, firestore, wish-page, wishlist-page, accessibility]
status: ready
---

# PLAN: WL-006 — Schenken und Erhalten, Geheim-Einträge und Löschen nur für die Besitzerin

Dieser Plan setzt Schritt 5 aus `docs/agents/research/2026-09-28-wunschliste-konzept.md` um
(Abschnitte „Geheim-Einträge“, „Schenken und Erhalten“, „Bearbeiten und Löschen“). Die
Wünsche bekommen einen **Blickwinkel**: Was offen, erfüllt, sichtbar und bedienbar ist,
hängt davon ab, ob die Besitzerin der Liste oder jemand anderes draufschaut.

In den Beispielen ist Anna die Besitzerin, Ben der Schenkende und Oma eine dritte Person.

## Akzeptanzkriterien

**Schenken und Erhalten**
- Andere als die Besitzerin sehen bei einem offenen Wunsch [🎁 Schenken]. Danach ist der
  Wunsch für alle außer Anna „Erfüllt – von Ben“ und steht unter „Erfüllte Wünsche“. Für
  Anna bleibt er offen und unverändert.
- Nur der Schenkende sieht [↶ Schenken zurücknehmen], und nur solange der Wunsch nicht
  erhalten ist. Alle übrigen sehen nur den Vermerk „Erfüllt – von Ben“ und keinen
  Zustandsknopf.
- Die Besitzerin sieht bei normalen Wünschen immer [✓ Erhalten], auch wenn niemand
  geschenkt hat, und nach dem Erhalten [↶ Erhalten zurücknehmen]. Nach „Erhalten“ ist der
  Wunsch für alle erfüllt. Anna sieht dann „Erfüllt – von Ben“ bzw. „Erfüllt“, wenn niemand
  eingetragen ist. Für die anderen gilt dasselbe.
- In der fixierten Leiste steht links immer [✏ Bearbeiten] und rechts höchstens ein
  Zustandsknopf. Nach einer Zustandsänderung liegt der Fokus auf dem Zustandsknopf,
  sonst auf [✏ Bearbeiten].
- Die Ansagen:
  - „Als geschenkt markiert.“
  - „Schenken zurückgenommen.“
  - „Als erhalten markiert.“
  - „Wieder offen.“ (Erhalten zurückgenommen)
  - „Übergabe vermerkt.“
  - „Übergabe zurückgenommen.“
- Die Einträge der Wunschliste tragen dieselben Vermerke wie die Detailseite („von Ben“,
  „🤫 Geheim – von Ben“).
- Wunsch-Dokumente ohne das neue Format (`createdBy`, `secret`, `received`,
  `removedByOwner`) werden verworfen, auch alle im alten Format mit `gifted`. Die README
  beschreibt das Aufräumen in der Konsole.

**Geheim-Einträge**
- „Wunsch erstellen“ in einer **fremden** Liste hat nach „Wie sehr gewünscht?“ das
  Häkchen „Geheim“, vorausgewählt. In der eigenen Liste fehlt es.
- „Wunsch bearbeiten“ zeigt das Häkchen nur bei geheimen Wünschen, und dort lässt es sich
  nur abwählen. Ein normaler Wunsch wird nie nachträglich geheim.
- Andere sehen in Liste und Detail „🤫 Geheim – von Ben“. Ist die anlegende Person
  gelöscht, steht dort nur „🤫 Geheim“.
- Anna sieht geheime, noch nicht übergebene Wünsche nicht. Stattdessen steht am Ende der
  offenen Wünsche **eine** nicht antippbare Zeile „🎁 1 Überraschung“ bzw.
  „🎁 N Überraschungen“. Gibt es nur Überraschungen, entfällt „Noch keine offenen
  Wünsche.“, der Knopf [+ Wunsch erstellen] bleibt aber.
- Ruft Anna einen solchen Wunsch per Deep-Link auf (Detail oder Bearbeiten), sieht sie
  „Diesen Wunsch gibt es nicht mehr.“.
- Hat Ben einen geheimen Wunsch geschenkt, sieht er rechts [✓ Übergeben] und im Inhalt
  [↶ Schenken zurücknehmen]. Nach der Übergabe sieht er [↶ Übergabe zurücknehmen].
- Nach der Übergabe sieht Anna einen normalen erfüllten Wunsch „… – von Ben“, aber ohne
  Zustandsknopf.

**Nur für die Besitzerin gelöscht**
- Löscht Anna einen Wunsch, den jemand geschenkt und sie noch nicht erhalten hat,
  verschwindet er nur für sie. Jeden anderen Wunsch löscht sie endgültig.
- Löscht Anna eine Liste mit Geheimnissen, verschwindet die Liste nur für sie, und die
  Wünsche bleiben unverändert. Geheimnisse sind:
  - ein geheimer, nicht übergebener Wunsch
  - ein geschenkter, nicht erhaltener Wunsch

  Ohne Geheimnisse wird die Liste samt Wünschen endgültig gelöscht.
- Andere als die Besitzerin löschen immer endgültig.
- Anna merkt keinen Unterschied. Sicherheitsabfrage, Ansage und Rücksprung sind dieselben.
  Die Anzahl im Listen-Löschdialog zählt nur Wünsche, die Anna sieht.
- Andere sehen:
  - auf der Detailseite „⚠ Anna hat diesen Wunsch entfernt.“ mit
    [🗑 Endgültig löschen] samt Sicherheitsabfrage
  - auf der Listenseite „⚠ Anna hat diese Wunschliste entfernt.“ mit
    [🗑 Endgültig löschen] samt Sicherheitsabfrage
  - in der Wunschliste und in der Übersicht den Vermerk „⚠ von Anna entfernt“ am
    betroffenen Eintrag
- Anna sieht eine für sie entfernte Liste weder in der Übersicht noch per Deep-Link
  („Diese Wunschliste gibt es nicht mehr.“). Dasselbe gilt für einen für sie entfernten
  Wunsch („Diesen Wunsch gibt es nicht mehr.“).
- „Person bearbeiten“ für die **eigene** Person zählt die für sie ausgeblendeten Listen
  nicht mit.
  - Gehören ihr nur noch solche Listen, steht dort statt eines Löschknopfs „Anna kann
    gerade nicht gelöscht werden.“.
  - `DeletePerson` lehnt weiterhin ab.
  - Für alle anderen zählt der Hinweis alle Listen.

**Technik**
- `firestore.rules` bleibt unverändert, denn die Geheimhaltung ist Ehrensache.
- axe meldet in allen drei Farbschemata keine Verstöße auf diesen Zuständen:
  - Detailseite als Besitzerin, als Schenkender eines geheimen Wunsches und als Dritte
  - Liste mit Überraschungszeile
  - „Wunsch erstellen“ mit Häkchen „Geheim“
  - entfernte Liste und entfernter Wunsch aus Sicht der anderen
- `npm run lint` und `npm test` (Architektur, Unit, Integration, E2E) laufen grün.

## Wesentliche Entscheidungen und Abwägungen

1. **Erhalten ohne Schenkenden:** Die Besitzerin sieht bei normalen Wünschen immer
   [✓ Erhalten].
   - Warum:
     - Sie bekommt Wünsche auch außerhalb der App erfüllt.
     - Unterschiedliche Knöpfe würden ein Geschenk verraten.
   - Auswirkung: `received` ist unabhängig von `giverId`. Für die anderen heißt ein solcher
     Wunsch „Erfüllt“, ohne „von …“.
2. **Nur der Schenkende nimmt zurück:** „Schenken zurücknehmen“ gibt es nur für den
   Schenkenden und nur vor dem Erhalten.
   - Auswirkung: Nach „Erhalten“ macht nur Anna mit „Erhalten zurücknehmen“ etwas
     rückgängig.
3. **Die Besitzerin sieht nach dem Erhalten den Schenkenden:** „Erfüllt – von Ben“.
   - Warum: Die Überraschung ist vorbei, und es hilft beim Bedanken.
4. **Geheim-Einträge übergibt der Schenkende:** Anna erreicht einen geheimen Wunsch nicht.
   Deshalb setzt Ben mit [✓ Übergeben] das Erhalten.
   - Warum: Das Konzept verlangt einen erfüllten Wunsch nach dem Erhalten, der Platzhalter
     ist aber nicht antippbar.
   - Auswirkung:
     - „Erhalten“ und „Übergeben“ setzen dasselbe Feld `received`, mit unterschiedlicher
       Berechtigung.
     - Anna hat bei übergebenen geheimen Wünschen keinen Zustandsknopf.
5. **Überraschungen als eine Zeile am Ende:** „🎁 N Überraschungen“ statt einer Zeile je
   Eintrag.
   - Warum: VoiceOver liest dann nicht mehrfach dasselbe vor, und verraten wird gleich
     viel.
6. **Geheim nur abwählbar:** Beim Anlegen in fremder Liste ist „Geheim“ vorausgewählt.
   Beim Bearbeiten lässt es sich nur abwählen.
   - Warum: Ein sichtbarer Wunsch soll Anna nicht nachträglich entzogen werden.
   - Auswirkung: `Wish.edit` akzeptiert nur `secret: true → false`. `createdBy` wird für
     alle Wünsche gespeichert.
7. **Nur für die Besitzerin löschen:** Die Domäne entscheidet zwischen endgültigem Löschen
   und Ausblenden (`removeFor`).
   - Wunsch: ausblenden, wenn Anna löscht und er geschenkt, aber nicht erhalten ist.
   - Liste: ausblenden, wenn Anna löscht und sie Geheimnisse enthält.
   - Andere löschen immer endgültig. Deshalb braucht „Endgültig löschen“ keinen eigenen
     Use Case: `DeleteWish` bzw. `DeleteWishlist` löschen aus Sicht der anderen ohnehin
     endgültig.
8. **Personen-Hinweis ohne Verrat:** Für die eigene Person zählen ausgeblendete Listen
   nicht mit. Stattdessen steht dort „Anna kann gerade nicht gelöscht werden.“.
   - Auswirkung: `ensurePersonIsDeletable` bleibt unverändert und zählt alle Listen.
9. **Kein Übergang für alte Wunsch-Dokumente:** `wishFromDocument` verlangt das neue
   Format und verwirft alles andere.
   - Warum: In Firestore liegen nur Testdaten.
   - Auswirkung:
     - Die README bekommt „Umstieg auf Geheim-Einträge (WL-006)“.
     - Der Notizpunkt „Schritt 4/5: Übergang …“ geht nach der Umsetzung nach DONE.
10. **Fehlendes `removedByOwner` bei Listen gilt als `false`:** Anders als bei Wünschen
    werden Wunschlisten-Dokumente ohne das Feld weiter gelesen.
    - Warum: Sonst verschwänden alle bestehenden Listen, und das ist nicht gewollt.
    - Auswirkung: `WishlistDocument.removedByOwner` ist optional, geschrieben wird es
      immer.
11. **Perspektive in der Domäne:** `Perspective { me, ownerId }` mit `isOwner`.
    - Die Methoden von `Wish` und `Wishlist` bekommen die Perspektive.
    - `allowedWishActions(wish, perspective)` ist die einzige Quelle dafür, was erlaubt ist.
      Die Methoden prüfen dagegen und werfen `WishActionNotAllowed`.
    - `viewOfWish`/`viewOfWishes` liefern die Sicht:
      - `visibility`: `shown`, `surprise` oder `hidden`
      - `status`: `open` oder `fulfilled`
      - Vermerke: `giverId`, `secretCreatorId`, `removedByOwner`
      - Knöpfe: `primaryAction`, `secondaryAction`
    - Warum: Alle Überraschungsregeln sind Fachlogik und sollen ohne Browser testbar sein.
    - Auswirkung: Die Svelte-Seiten zeichnen die View nur nach. Sie importieren die reinen
      Domänenfunktionen, wie heute schon `wishesMatching`.
12. **Ein Use Case für alle Zustandsänderungen:**
    `ChangeWishState.execute(wishId, me, action)` mit
    `WishAction = 'gift' | 'takeBackGift' | 'receive' | 'undoReceive' | 'handOver' | 'undoHandOver'`
    ersetzt `GiftWish` und `TakeBackGift`.
    - Warum:
      - Die sechs Abläufe sind identisch (Wunsch und Liste laden, Perspektive bilden,
        `wish.perform(action, perspective)`, speichern).
      - Die Oberfläche kennt die Aktion ohnehin aus der View.
13. **Die Besitzerin wird nicht in den Wunsch kopiert.** Die Use Cases laden die Liste mit,
    und die Seiten beobachten sie schon.
14. **`received` als Boolean statt `receivedAt`:** Es wird kein Datum angezeigt.
15. **Prüfendes Lesen der Wünsche einer Liste geht an den Server, im Zweifel wird
    ausgeblendet:** `WishRepository.getByWishlist` nutzt `getDocs` wie `getOwnedBy` in
    WL-005 (Entscheidung 12). Zurück kommt `{ wishes, confirmed }`, wobei
    `confirmed = !snapshot.metadata.fromCache`.
    - Warum: Offline fällt `getDocs` auf den Cache zurück, und der kann leer oder
      unvollständig sein. Dann hielte `DeleteWishlist` eine Liste mit Geheimnissen für
      geheimnisfrei und löschte sie endgültig.
    - Auswirkung: Löscht die Besitzerin ohne bestätigten Stand, wird die Liste nur
      ausgeblendet. Das ist immer sicher. Im schlimmsten Fall sehen die anderen eine
      unnötige Warnung und löschen endgültig.
    - `deleteAllOf` liest ebenfalls über `getDocs` statt `getDocsFromCache`. So bleiben
      beim endgültigen Löschen seltener verwaiste Wünsche zurück.
16. **Ausgeblendete Listen schützen auch ihre Wünsche:** Ist eine Liste für Anna
    ausgeblendet, gilt das auch für alle ihre Wünsche und für „Wunsch erstellen“ darin.
    - Die Seiten zeigen dann `NotFound`.
    - `Wishlist.ensureVisibleTo(p)` wirft `WishlistNotFound`. `ChangeWishState`,
      `CreateWish`, `EditWish` und `DeleteWish` rufen die Methode auf.
    - Warum: Sonst erreicht Anna die Wünsche per Deep-Link und merkt, dass die Liste noch
      existiert.
17. **Andere dürfen bei `removedByOwner` weiter alles.** Die Knöpfe folgen unverändert
    der Regeltabelle.
    - Beispiel: Nimmt Ben sein Geschenk zurück, ist der Wunsch für die anderen wieder offen
      und bleibt für Anna ausgeblendet.
    - Warum: Die Warnung ⚠ genügt, und die anderen entscheiden selbst, ob sie endgültig
      löschen.
18. **Bewusst hingenommene Andeutungen:** Zwei Stellen verraten Anna, **dass** es
    Geheimnisse gibt, aber nicht **welche**:
    - „🎁 N Überraschungen“
    - „Anna kann gerade nicht gelöscht werden.“

    Das ist Absicht bzw. ohne Löschschutz-Verlust nicht vermeidbar.
19. **Sichtbarkeitsregeln nur in der Domäne:** Die Seiten zählen und filtern nicht selbst.
    Sie nutzen `visibleWishCount(wishes, p)` und `wishlistsVisibleTo(wishlists, me)`.

## Ausgangslage

```
 Wish { id, wishlistId, details, gifted }          wishes/{id}
   gift() / takeBackGift() / isOpen = !gifted   ◄──► { wishlistId, name, …, gifted }
 Wishlist { id, name, ownerId }                    wishlists/{id} { name, ownerId }

 WishPage ─ [✏ Bearbeiten] [🎁 Schenken ↔ ↶ Schenken zurücknehmen]  (für alle gleich)
 WishlistPage ─ wishesMatching(wishes, filter)  (ohne Blickwinkel)
 DeleteWish / DeleteWishlist ─ immer endgültig
```

- `src/wishlist/domain/Wish.ts:11-48`: nur `gifted`, keine Personen
- `src/wishlist/domain/wishOrder.ts:21-24`: Filter über `isOpen`
- `src/wishlist/application/GiftWish.ts`, `TakeBackGift.ts`: kippen das Flag
- `src/wishlist/infrastructure/firestore/wishDocument.ts:12-20`: Format mit `gifted`
- `src/wishlist/infrastructure/ui/WishPage.svelte:46-54, 92-98`: ein Knopf für alle
- `src/wishlist/infrastructure/ui/WishlistPage.svelte:66, 131-147`: Eintragsliste
- `src/wishlist/infrastructure/ui/EditWishlistPage.svelte:106`: Löschdialog zählt alle
  Wünsche
- `src/wishlist/infrastructure/ui/EditPersonPage.svelte:89-107`: Hinweis zählt alle
  eigenen Listen
- `src/wishlist/domain/wishlistOverview.ts:11-30`: Übersicht ohne Sichtbarkeit
- E2E: Die Fixture wählt immer Anna (`e2e/fixtures.ts`). Alle Seeds haben
  `ownerId: 'anna'` und `gifted`. Damit ist Anna in den bestehenden Specs Besitzerin.
  Das trifft vor allem `e2e/gifting.spec.ts`, das heute als Besitzerin schenkt.

## Zielbild

```
 domain/
   Perspective.ts   Perspective { me, ownerId } · isOwner · perspectiveOf(wishlist, me)
   Wish.ts          Wish { id, wishlistId, details, createdBy, secret, giverId?, received, removedByOwner }
                    create({…}, p) · restore(RestoredWish) · edit(details, secret, p)
                    perform(action, p) · removeFor(p) → WishRemoval
                    WishActionNotAllowed · WishHiddenFromOwner
   wishActions.ts   WishAction · allowedWishActions(wish, p) → { primary?, secondary? }
   wishView.ts      WishView · viewOfWish(wish, p) · viewOfWishes(wishes, p, filter) → { entries, surpriseCount }
                    keepsSecretFromOwner(wish)
   Wishlist.ts      + removedByOwner · isVisibleTo(p) · removeFor(p, wishes) → WishlistRemoval
   wishlistOverview.ts  blendet für mich entfernte eigene Listen aus
   WishRepository.ts    + getByWishlist(wishlistId)

 application/
   ChangeWishState(wishId, me, action)      ersetzt GiftWish, TakeBackGift
   CreateWish(wishlistId, details, secret, me)
   EditWish(wishId, details, secret, me)
   DeleteWish(wishId, me)        → löschen oder ausblenden
   DeleteWishlist(wishlistId, me) → löschen oder ausblenden

 infrastructure/ui/
   WishPage        View → Vermerke, Zustandsknopf, Warnung + Endgültig löschen
   WishlistPage    viewOfWishes → Einträge + Überraschungszeile, Warnung + Endgültig löschen
   WishForm        Häkchen „Geheim“ (Snippet/Prop)
   WishStateNotes  neu: Vermerke „Erfüllt – von …“, „🤫 Geheim – von …“, „⚠ von … entfernt“
```

Oberflächen:

```
 Anna, ihr Wunsch                   Ben, Annas Wunsch (offen)          Oma, von Ben geschenkt
 ┌──────────────────────────────┐   ┌──────────────────────────────┐   ┌──────────────────────────────┐
 │ ‹ Geburtstag 2027            │   │ ‹ Geburtstag 2027            │   │ ‹ Geburtstag 2027            │
 │ Fahrradhelm                  │   │ Fahrradhelm                  │   │ Fahrradhelm                  │
 │ ★★★ unbedingt · 49,99 €      │   │ ★★★ unbedingt · 49,99 €      │   │ Erfüllt – von Ben            │
 ├──────────────────────────────┤   ├──────────────────────────────┤   │ ★★★ unbedingt · 49,99 €      │
 │ [✏ Bearbeiten] [✓ Erhalten]  │   │ [✏ Bearbeiten] [🎁 Schenken] │   ├──────────────────────────────┤
 └──────────────────────────────┘   └──────────────────────────────┘   │ [✏ Bearbeiten]               │
                                                                       └──────────────────────────────┘
 Ben, sein geheimer, geschenkter    Anna, Liste vorher → nachher
 Wunsch in Annas Liste
 ┌──────────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────────┐
 │ ‹ Geburtstag 2027            │   │ [Offene] [Erfüllte]      │   │ [Offene] [Erfüllte]          │
 │ Konzertkarten                │   │ Fahrradhelm            › │   │ Fahrradhelm                › │
 │ 🤫 Geheim – von Ben          │   │ Konzertkarten          › │   │   ★★★ unbedingt · 49,99 €    │
 │ Erfüllt – von Ben            │   └──────────────────────────┘   │ 🎁 1 Überraschung            │
 │ ★★★ unbedingt · 89,00 €      │                                  └──────────────────────────────┘
 │ [↶ Schenken zurücknehmen]    │
 ├──────────────────────────────┤   Oma, dieselbe Liste
 │ [✏ Bearbeiten] [✓ Übergeben] │   ┌──────────────────────────────┐
 └──────────────────────────────┘   │ Fahrradhelm                › │
                                    │ Konzertkarten              › │
                                    │   🤫 Geheim – von Ben         │
                                    │   von Ben                    │
                                    └──────────────────────────────┘

 Oma, von Anna entfernte Liste                Oma, von Anna entfernter Wunsch
 ┌──────────────────────────────┐             ┌──────────────────────────────┐
 │ ‹ Wunschlisten               │             │ ‹ Geburtstag 2027            │
 │ Geburtstag 2027     [✏] [+]  │             │ Fahrradhelm                  │
 │ für Anna                     │             │ ⚠ Anna hat diesen Wunsch     │
 │ ⚠ Anna hat diese Wunschliste │             │   entfernt.                  │
 │   entfernt.                  │             │ [🗑 Endgültig löschen]       │
 │ [🗑 Endgültig löschen]       │             │ Erfüllt – von Ben            │
 │ [Offene] [Erfüllte]          │             │ …                            │
 │ • Fahrradhelm                │             ├──────────────────────────────┤
 │   ⚠ von Anna entfernt        │             │ [✏ Bearbeiten]               │
 └──────────────────────────────┘             └──────────────────────────────┘
 Wunsch erstellen (fremde Liste)              Übersicht, Oma
 Name  [__________]                           Anna                   (h2)
 …                                            Geburtstag 2027              ›
 Wie sehr gewünscht? …                          ⚠ von Anna entfernt
 Geheim                              ✓
 [💾 Speichern] [✕ Abbrechen]
```

Aus der Sicht der anderen gilt: Erfüllte Wünsche stehen unter „Erfüllte Wünsche“, die
Vermerke im Eintrag und auf der Detailseite. Ein Vermerk „von Ben“ erscheint nur, wenn es
einen Schenkenden gibt.

Regeln im Überblick (`p` = Perspektive, `W` = Wunsch):

| p | W | visibility | status | primary | secondary |
|---|---|---|---|---|---|
| Besitzerin | `removedByOwner` | hidden | – | – | – |
| Besitzerin | geheim, nicht erhalten | surprise | open | – | – |
| Besitzerin | geheim, erhalten | shown | fulfilled | – | – |
| Besitzerin | normal, nicht erhalten | shown | open | receive | – |
| Besitzerin | normal, erhalten | shown | fulfilled | undoReceive | – |
| andere | kein Schenkender, nicht erhalten | shown | open | gift | – |
| andere | ich schenke, normal, nicht erhalten | shown | fulfilled | takeBackGift | – |
| andere | ich schenke, geheim, nicht erhalten | shown | fulfilled | handOver | takeBackGift |
| andere | ich schenke, geheim, erhalten | shown | fulfilled | undoHandOver | – |
| andere | sonst geschenkt oder erhalten | shown | fulfilled | – | – |

Für die Besitzerin ist die Sichtbarkeit `hidden` stärker als `surprise`. Außerdem ist
alles `hidden`, wenn die Liste für sie ausgeblendet ist (Entscheidung 16). Für andere
ändert `removedByOwner` nichts an Status und Knöpfen (Entscheidung 17).

Die Sichtbarkeit liegt in `Wish.ts` (`wish.isHiddenFrom(p)`, `wish.isSurpriseFor(p)`,
`wish.keepsSecretFromOwner`), damit `Wish`-Methoden sie ohne Zirkelimport aus
`wishView.ts` prüfen können. `wishView.ts` baut darauf auf.

## Abstraktionen und Wiederverwendung

- `src/wishlist/domain/`
  - `Perspective.ts` - neu: `Perspective`, `perspectiveOf(wishlist, me)`
  - `Wish.ts` - neues Modell, `gifted`/`isOpen`/`gift`/`takeBackGift` entfallen.
    `WishAlreadyGifted` und `WishNotGifted` gehen in `WishActionNotAllowed` auf.
  - `wishActions.ts` - neu: `WishAction`, `allowedWishActions`
  - `wishView.ts` - neu: `WishView`, `viewOfWish`, `viewOfWishes`,
    `keepsSecretFromOwner`
  - `wishOrder.ts` - `sortWishes` bleibt. `wishesMatching` entfällt und geht in
    `viewOfWishes` auf.
  - `Wishlist.ts` - `removedByOwner`, `isVisibleTo`, `removeFor`
  - `wishlistOverview.ts` - Sichtbarkeit berücksichtigen
  - `WishRepository.ts` - `getByWishlist`
- `src/wishlist/application/`
  - `ChangeWishState.ts` - neu, ersetzt `GiftWish.ts` und `TakeBackGift.ts` samt Tests
  - `CreateWish.ts`, `EditWish.ts`, `DeleteWish.ts`, `DeleteWishlist.ts` - Perspektive
  - `fakes/InMemoryWishRepository.ts` - `getByWishlist`
  - `fakes/wishNamed.ts` - neu, Testhilfe analog `wishlistNamed`
- `src/wishlist/infrastructure/`
  - `firestore/wishDocument.ts` - neues Format
  - `firestore/wishlistDocument.ts` - optionales `removedByOwner`
  - `firestore/FirestoreWishRepository.ts` - `getByWishlist` über `getDocs`
  - `createWishlistModule.ts` - `changeWishState`, Signaturen
  - `ui/WishPage.svelte`, `ui/WishlistPage.svelte`, `ui/WishForm.svelte`,
    `ui/CreateWishPage.svelte`, `ui/EditWishPage.svelte`,
    `ui/EditWishlistPage.svelte`, `ui/WishlistsPage.svelte`,
    `ui/EditPersonPage.svelte`
  - `ui/WishStateNotes.svelte` - neu, Vermerke für Eintrag und Detailseite
  - `ui/wishTexts.ts` - Knopftexte, Ansagen, Vermerke, `surpriseLine`
  - `ui/personTexts.ts` - `personNotDeletableRightNowHint`
- Wiederverwendet werden:
  - `ChoiceGroup` bzw. die Häkchen-Optik aus `ColorSchemeSettings`
  - `ConfirmDialog`
  - `ActionBar`
  - `Watched`
  - `announce`
  - `useCurrentProfile().me`
  - `watchPersons` für die Namen in den Vermerken
- `e2e/emulators.ts` (`WishRecord`, `WishlistRecord`), alle Wunsch-Seeds in `e2e/*.spec.ts`
- `README.md`, `docs/agents/research/2026-09-28-wunschliste-konzept.md`, `docs/notes.txt`

## Logging und Beobachtbarkeit

Keine Änderungen. Schreib- und Lesefehler laufen wie bisher über `onProblem` in die
Warnzeile.

## Umsetzung

### Phase 1: Schenken und Erhalten mit Personen

Abhängigkeiten: keine

Das neue Wunsch-Format steht vollständig, samt `secret` und `removedByOwner`, die erst
später genutzt werden. Schenken, Zurücknehmen und Erhalten richten sich nach dem
Blickwinkel.

**Aufgaben**:

Domäne (test-getrieben):
- [x] `Perspective.ts`:
  ```ts
  export type Perspective = { readonly me: PersonId; readonly ownerId: PersonId };
  export function perspectiveOf(wishlist: Wishlist, me: PersonId): Perspective;
  export function isOwner(perspective: Perspective): boolean;
  ```
- [x] `Wish.ts`:
  ```ts
  export type RestoredWish = {
    id: WishId; wishlistId: WishlistId; details: WishDetails;
    createdBy: PersonId; secret: boolean; giverId: PersonId | undefined;
    received: boolean; removedByOwner: boolean;
  };
  ```
  - `Wish.create({ id, wishlistId, details }, p)` setzt `createdBy = p.me` und
    `secret = false` (Geheim folgt in Phase 2). Dazu kommen `giverId = undefined`,
    `received = false` und `removedByOwner = false`.
  - `edit(details)` behält alle übrigen Felder.
  - `perform(action, p)` prüft `allowedWishActions(this, p)` und wirft sonst
    `WishActionNotAllowed(wishId, action)`:
    - `gift` → `giverId = p.me`
    - `takeBackGift` → `giverId = undefined`
    - `receive`/`handOver` → `received = true`
    - `undoReceive`/`undoHandOver` → `received = false`
  - `WishAlreadyGifted`, `WishNotGifted`, `gifted`, `isOpen`, `gift()` und `takeBackGift()`
    entfallen.
  - Tests: jede Aktion aus der Regeltabelle erlaubt und verboten, darunter „Besitzerin
    kann nicht schenken“, „Oma kann Bens Geschenk nicht zurücknehmen“, „Ben kann nach dem
    Erhalten nicht zurücknehmen“ und „Erhalten ohne Schenkenden“.
- [x] `wishActions.ts`: `WishAction` und
  `allowedWishActions(wish, p): { primary?: WishAction; secondary?: WishAction }` nach
  der Regeltabelle. Die Zeilen für geheime Wünsche sind schon enthalten und getestet.
- [x] `wishView.ts`:
  ```ts
  export type WishView = {
    wish: Wish;
    visibility: 'shown' | 'surprise' | 'hidden';
    status: 'open' | 'fulfilled';
    giverId?: PersonId;
    secretCreatorId?: PersonId;
    removedByOwner: boolean;
    primaryAction?: WishAction;
    secondaryAction?: WishAction;
  };
  export function viewOfWish(wish: Wish, p: Perspective): WishView;
  export function viewOfWishes(
    wishes: readonly Wish[], p: Perspective, filter: WishFilter,
  ): { entries: WishView[]; surpriseCount: number };
  ```
  - In Phase 1 ist `visibility` immer `shown`.
  - `status` folgt der Regeltabelle.
  - Die Besitzerin sieht `giverId` nur, wenn der Wunsch erhalten ist.
  - `entries` ist sortiert per `sortWishes` und gefiltert nach `status`.
  - `WishFilter` zieht von `wishOrder.ts` hierher um, `wishesMatching` entfällt.
    Importe anpassen: `ui/wishlistAddresses.ts:9`, `ui/wishlistFilterMemory.ts:2` und
    `WishlistPage.svelte:10`.
  - Tests:
    - Ben schenkt: Für Anna ist der Wunsch offen, für Oma erfüllt mit `giverId` `ben`.
    - Anna hat erhalten: Sie sieht `giverId`.
    - Anna erhält ohne Schenkenden: erfüllt ohne `giverId`.
    - Filter und Sortierung
- [x] `WishRepository.ts`: unverändert in Phase 1

Anwendung (test-getrieben):
- [x] `fakes/wishNamed.ts`: `wishNamed(name, overrides?)` liefert einen per `Wish.restore`
  gebauten Wunsch. Standard: Liste `birthday`, `createdBy` `anna`, nicht geheim, offen.
- [x] `ChangeWishState.execute(wishId, me, action)`:
  - `wishes.get` → `WishNotFound`
  - `wishlists.get(wish.wishlistId)` → `WishlistNotFound`
  - `save(wish.perform(action, perspectiveOf(wishlist, me)))`
  - Tests: schenkt, Besitzerin erhält, verbotene Aktion wirft und speichert nichts,
    unbekannter Wunsch, unbekannte Liste
- [x] `GiftWish.ts`, `TakeBackGift.ts` samt Tests entfernen
- [x] `CreateWish.execute(wishlistId, details, me)` erzeugt mit `perspectiveOf(wishlist, me)`.
  Test: `createdBy` ist `me`.
- [x] Alle Fundstellen umstellen, gefunden über
  `grep -rn "gifted\|wishesMatching\|Wish.create(\|Wish.restore(\|WISH_GIFTED\|GIFT_TAKEN_BACK\|giftWish\|takeBackGift\|WishFilter" src tests`:
  - `Wish.test.ts`, `EditWish.test.ts`, `WatchWish.test.ts`,
    `WatchWishesOfWishlist.test.ts`, `DeleteWish.test.ts`, `DeleteWishlist.test.ts`,
    `CreateWish.test.ts`, `wishOrder.test.ts`
  - `wishDocument.ts:76`
  - `wishTexts.test.ts:88-89`
  - `createWishlistModule.ts:66-67`
  - Die Typprüfung (`npm run lint`) meldet übersehene Stellen.

Infrastruktur:
- [x] `firestore/wishDocument.ts`:
  ```ts
  export type WishDocument = {
    wishlistId: string; name: string; link?: string; description?: string;
    priceInCents?: number; rating?: Rating;
    createdBy: string; secret: boolean; giverId?: string;
    received: boolean; removedByOwner: boolean;
  };
  ```
  - Bedingungen:
    - `createdBy` ist eine nicht leere Zeichenkette.
    - `giverId` fehlt oder ist eine nicht leere Zeichenkette.
    - `secret`, `received` und `removedByOwner` sind Booleans.
  - Sonst liefert die Funktion `undefined` (Entscheidung 9). `gifted` wird weder gelesen
    noch geschrieben.
- [x] `createWishlistModule.ts`: `changeWishState: new ChangeWishState(wishes, wishlists)`,
  `giftWish` und `takeBackGift` entfernen
- [x] `ui/wishTexts.ts` mit Tests in `wishTexts.test.ts`:
  - `WISH_ACTION_LABELS: Record<WishAction, string>`: Schenken, Schenken zurücknehmen,
    Erhalten, Erhalten zurücknehmen, Übergeben, Übergabe zurücknehmen
  - `WISH_ACTION_ANNOUNCEMENTS: Record<WishAction, string>` (Ansagen wie in den
    Akzeptanzkriterien). `WISH_GIFTED_ANNOUNCEMENT` und `GIFT_TAKEN_BACK_ANNOUNCEMENT`
    entfallen.
  - `fulfilledNote(giverName?)` → „Erfüllt – von Ben“ / „Erfüllt“
  - `giverNote(giverName)` → „von Ben“ (für Einträge der Liste)
- [x] `ui/WishStateNotes.svelte` (neu):
  - Props `view: WishView`, `persons: readonly Person[]`, `variant: 'entry' | 'page'`
  - zeigt die Vermerke. In Phase 1 ist das nur „Erfüllt – von …“ bzw. im Eintrag
    „von …“, und nur bei `status === 'fulfilled'`.
  - Namen über die ID in `persons`, bei unbekannter ID ohne „von …“
  - Emojis `aria-hidden`
- [x] `ui/WishPage.svelte`:
  - `me` aus `useCurrentProfile()`, `view = $derived(viewOfWish(wish, perspectiveOf(wishlist, me.id)))`
  - Personen über `watchPersons` für die Vermerke
  - `ActionBar`: [✏ Bearbeiten] und, falls `view.primaryAction`, der Zustandsknopf mit
    Icon je Aktion (Lucide: `Gift`, `Undo2`, `Check`)
  - `view.secondaryAction` als Knopf in einer `button-row` im Inhalt (Phase 2 nutzt ihn)
  - Nach `changeWishState.execute(...)`:
    - `announce(WISH_ACTION_ANNOUNCEMENTS[action])`
    - `await tick()`
    - Fokus auf den Zustandsknopf, falls vorhanden, sonst auf [✏ Bearbeiten]
    - Beide Knöpfe werden über `bind:this` gehalten.
  - Der Absatz „Erfüllt“ entfällt, stattdessen `<WishStateNotes variant="page">`.
- [x] `ui/WishlistPage.svelte`:
  - `me`, `perspectiveOf(wishlist, me.id)` und
    `viewOfWishes(wishes, perspective, filter).entries` statt `wishesMatching`
  - Im Eintrag unter `WishSummary` steht `<WishStateNotes variant="entry">`.
  - Personen über `watchPersons`
- [x] `ui/CreateWishPage.svelte`: `createWish.execute(wishlistId, details, me.id)`

E2E:
- [x] `e2e/emulators.ts`: `WishRecord` bekommt `createdBy: string`, `secret: boolean`,
  `giverId?: string`, `received: boolean` und `removedByOwner: boolean`. `gifted` entfällt.
  Hilfsfunktion `wishRecord(fields)` mit den Standardwerten `createdBy: 'anna'`,
  `secret: false`, `received: false` und `removedByOwner: false`. Alle Seeds nutzen sie,
  die Typprüfung findet die Fundstellen:
  - `accessibility.spec.ts`, `backLinks.spec.ts`, `editing.spec.ts`
  - `gifting.spec.ts`, `wishes.spec.ts`
  - weitere laut `grep -rn "gifted" e2e`
  - Das bisherige `gifted: true` wird zu `received: true`.
- [x] `e2e/gifting.spec.ts` neu fassen:
  - Seeds: Personen Ben und Oma, Liste `birthday` von Ben, Liste `anniversary` von Anna.
    Die Fixture wählt Anna.
  - Anna schenkt in Bens Liste:
    - Ansage „Als geschenkt markiert.“
    - Fokus auf [Schenken zurücknehmen]
    - „Erfüllt – von Anna“
    - Der Wunsch steht unter „Erfüllte Wünsche“ mit „von Anna“.
    - Die Filter-Tests (Fokus, `aria-pressed`, keine Verlaufseinträge, Rücksprung auf
      `/erfuellt`) bleiben erhalten.
  - Anna nimmt zurück: Ansage „Schenken zurückgenommen.“, Wunsch wieder offen.
  - Wunsch in Bens Liste mit `giverId: 'oma'`: nur „Erfüllt – von Oma“, nur
    [Bearbeiten], kein Zustandsknopf
  - Anna in ihrer eigenen Liste:
    - Wunsch mit `giverId: 'ben'` ist offen, ohne Vermerk, mit [Erhalten].
    - Tipp → Ansage „Als erhalten markiert.“, Fokus auf [Erhalten zurücknehmen],
      „Erfüllt – von Ben“, steht unter „Erfüllte Wünsche“
    - [Erhalten zurücknehmen] → „Wieder offen.“
  - Erhalten ohne Schenkenden → „Erfüllt“ ohne „von“
  - In Bens Liste ein von Anna geschenkter und von Ben erhaltener Wunsch: Anna hat kein
    [Schenken zurücknehmen].
  - leerer Zustand „Noch keine erfüllten Wünsche.“ bleibt
- [x] `e2e/offline.spec.ts:57` und `e2e/sync.spec.ts:39` klicken heute als Besitzerin Anna
  auf [Schenken]. Sie bekommen eine Liste von Ben (Person Ben seeden, `ownerId: 'ben'`),
  damit Anna dort schenken kann. Die geprüften Ansagen und Texte werden an die neuen
  angepasst.
- [x] `e2e/accessibility.spec.ts`: Detailseite als Besitzerin mit [Erhalten], als
  Schenkende mit Vermerk, als Dritte ohne Zustandsknopf

**Automatisierte Verifikation**:
- [x] `npm run test:unit` grün, mit den Regeltests für `allowedWishActions`, `Wish.perform`,
  `viewOfWish(es)` und `ChangeWishState`
- [x] `tests/integration/FirestoreWishRepository.integration.test.ts` angepasst und grün:
  - neues Format wird geschrieben und gelesen (`createdBy`, `giverId`, `received`)
  - ein Dokument im alten Format (`gifted`, ohne `createdBy`) wird übersprungen
  - `it.each` der ungültigen Dokumente um `createdBy: ''`, `giverId: ''`,
    `received: 'ja'`, `secret` fehlt und `removedByOwner` fehlt ergänzt
- [x] `npm run lint` und `npm test` grün (Architektur, Unit, Integration, E2E)

**Manuelle Verifikation**:
- [x] Auf zwei iPhones mit VoiceOver, als Anna und als Ben:
  - Ben schenkt in Annas Liste: Anna sieht weiter [Erhalten] und keinen Hinweis.
  - Anna tippt [Erhalten]: Ansage, Fokus auf [Erhalten zurücknehmen], „Erfüllt – von Ben“
    wird vorgelesen.

### Phase 2: Geheim-Einträge

Abhängigkeiten: Phase 1

Wer in einer fremden Liste einen Wunsch anlegt, kann ihn geheim halten. Anna sieht dafür
nur eine Überraschungszeile. Der Schenkende meldet die Übergabe.

**Aufgaben**:

Domäne (test-getrieben):
- [x] `Wish.create({ id, wishlistId, details, secret }, p)`: `secret && isOwner(p)` wirft
  `OwnerCannotKeepSecrets`. Tests: geheim in fremder Liste, verboten in der eigenen.
- [x] `Wish.ts`:
  - `wish.isSurpriseFor(p)` gilt für die Besitzerin bei geheimen, nicht erhaltenen
    Wünschen.
  - `wish.isHiddenFrom(p)` ist in Phase 2 gleich `isSurpriseFor(p)`, Phase 3 erweitert es.
  - Tests
- [x] `Wish.edit(details, secret, p)`:
  - Gilt `isHiddenFrom(p)`, wirft die Methode `WishHiddenFromOwner`.
  - `secret` darf nur gleich bleiben oder von `true` auf `false` wechseln, sonst wirft sie
    `WishCannotBecomeSecret`.
  - Tests: abwählen, nicht nachträglich geheim, Besitzerin kann Geheimes nicht bearbeiten
- [x] `wishView.ts`:
  - `visibility: 'surprise'` für die Besitzerin bei geheimen, nicht erhaltenen Wünschen
  - `secretCreatorId` für andere bei geheimen Wünschen
  - `viewOfWishes` zählt Überraschungen nur beim Filter `open` in `surpriseCount` und
    nimmt sie nicht in `entries` auf.
  - Tests:
    - Überraschung für Anna, Klartext für Oma
    - nach der Übergabe erfüllt für Anna mit `giverId` und ohne Aktion
    - `surpriseCount` bei `fulfilled` ist 0
- [x] `Wish.perform`: Die Tests für `handOver`, `undoHandOver` und `takeBackGift` bei
  geheimen Wünschen bestätigen die Regeltabelle (schon in `allowedWishActions`
  enthalten).

Anwendung (test-getrieben):
- [x] `CreateWish.execute(wishlistId, details, secret, me)`, Test für geheim
- [x] `EditWish.execute(wishId, details, secret, me)` lädt die Liste für die Perspektive.
  Der Konstruktor bekommt dafür `WishlistRepository`. Dazu Tests.
- [x] `createWishlistModule.ts`: `new EditWish(wishes, wishlists)`

Infrastruktur:
- [x] `src/shared/ui/CheckOption.svelte` (neu):
  - eine einzelne Checkbox mit Label links und Haken rechts
  - Optik wie `ChoiceGroup` (nur linke und untere Linie, großer Haken in der Hakenfarbe
    des Farbschemas)
  - Props `id`, `label`, `checked` (bindable) und `description?` für `aria-describedby`
  - `ChoiceGroup` selbst ist eine Radiogruppe und passt deshalb nicht.
  - Die gemeinsame Haken-Optik wird bei Bedarf in eine CSS-Datei neben `entryList.css`
    ausgelagert.
- [x] `ui/WishForm.svelte`:
  - optionale Prop `secret?: { initial: boolean; hint: string }`
  - Ist sie gesetzt, erscheint nach „Wie sehr gewünscht?“ `CheckOption` mit „Geheim“.
    Sonst gibt es keine Checkbox, und `onsubmit` bekommt `false`.
  - `onsubmit(details, secret)`
  - Innerhalb des Formulars lässt sich die Checkbox frei an- und abwählen. Dass ein
    normaler Wunsch nicht geheim wird, sichern die Seiten (sie reichen `secret` beim
    Bearbeiten nur für geheime Wünsche herein) und `Wish.edit` ab.
  - Der Hinweistext `hint` hängt per `aria-describedby` an der Checkbox, etwa „Anna sieht
    nur ‚Überraschung‘.“.
- [x] `ui/CreateWishPage.svelte`:
  - `secret` nur, wenn `wishlist.ownerId !== me.id`, und dann mit `initial: true`
  - Der Hinweistext nennt den Namen der Besitzerin (`watchPerson`).
- [x] `ui/EditWishPage.svelte`:
  - lädt die Liste für die Perspektive
  - `secret` nur, wenn `wish.secret` gilt
  - `view.visibility !== 'shown'` → `NotFound` „Diesen Wunsch gibt es nicht mehr.“
- [x] `ui/WishPage.svelte`: `view.visibility !== 'shown'` → `NotFound`. Der Knopf
  `secondaryAction` erscheint im Inhalt.
- [x] `ui/WishStateNotes.svelte`: „🤫 Geheim – von Ben“ bzw. „🤫 Geheim“, in Eintrag und
  Seite vor dem Erfüllt-Vermerk
- [x] `ui/WishlistPage.svelte`:
  - Bei `surpriseCount > 0` steht am Ende der `entry-list` ein `<li class="surprise">`
    ohne Knopf mit `surpriseLine(count)`.
  - Die Liste erscheint auch, wenn `entries` leer ist.
  - Der Leer-Satz erscheint nur bei `entries.length === 0 && surpriseCount === 0`.
  - [+ Wunsch erstellen] bleibt bei leeren `entries` sichtbar.
- [x] `ui/wishTexts.ts` mit Tests:
  - `surpriseLine(count)` → „1 Überraschung“ / „2 Überraschungen“ (Emoji separat,
    `aria-hidden`)
  - `secretNote(creatorName?)` → „Geheim – von Ben“ / „Geheim“
  - `secretHint(ownerName)` → „Anna sieht nur ‚Überraschung‘.“

E2E:
- [x] neu `e2e/secrets.spec.ts`:
  - Seeds: Ben, Liste `birthday` von Ben, Liste `mine` von Anna
  - Anna legt in Bens Liste an: „Geheim“ ist angehakt. Nach dem Speichern zeigt die
    Detailseite „🤫 Geheim – von Anna“, und `storedWishes()` hat `secret: true` und
    `createdBy: 'anna'`.
  - In Annas eigener Liste hat „Wunsch erstellen“ kein Häkchen.
  - Annas Liste mit zwei geheimen Wünschen von Ben:
    - Zu sehen ist „2 Überraschungen“ am Ende und ohne Knopf, dazu kein Leer-Satz.
    - Unter „Erfüllte Wünsche“ steht nichts davon.
    - `#/wunsch/<id>` und `#/wunsch/<id>/bearbeiten` zeigen „Diesen Wunsch gibt es nicht
      mehr.“.
  - Anna als Schenkende eines geheimen Wunsches in Bens Liste:
    - [Übergeben] rechts, [Schenken zurücknehmen] im Inhalt
    - [Übergeben] → „Übergabe vermerkt.“, Fokus auf [Übergabe zurücknehmen]
    - [Schenken zurücknehmen] → Fokus auf [Schenken]
  - Annas Liste mit einem geheimen, von Ben übergebenen Wunsch: erfüllt, „Erfüllt – von
    Ben“, kein Zustandsknopf
  - Bearbeiten eines geheimen Wunsches: Häkchen abwählen und speichern → `secret: false`.
    Bearbeiten eines normalen Wunsches: kein Häkchen.
- [x] `e2e/accessibility.spec.ts`: „Wunsch erstellen“ mit Häkchen, Liste mit
  Überraschungszeile, Detailseite des Schenkenden eines geheimen Wunsches, jeweils in
  allen drei Farbschemata

**Automatisierte Verifikation**:
- [x] `npm run test:unit` grün
- [x] `tests/integration/FirestoreWishRepository.integration.test.ts`: `secret: true`
  wird gespeichert und gelesen
- [x] `npm run lint` und `npm test` grün (Architektur, Unit, Integration, E2E)

**Manuelle Verifikation**:
- [x] Auf zwei iPhones mit VoiceOver:
  - Ben legt in Annas Liste einen geheimen Wunsch an. Anna hört am Ende der Liste „1
    Überraschung“, und die Zeile ist nicht antippbar.
  - Ben schenkt und übergibt. Danach hört Anna den Wunsch unter „Erfüllte Wünsche“ mit
    „Erfüllt – von Ben“.
  - Die Checkbox „Geheim“ wird als Checkbox mit Zustand und Hinweis angesagt.

### Phase 3: Nur für die Besitzerin gelöscht

Abhängigkeiten: Phase 2

Löscht Anna, was andere noch als Geheimnis hüten, verschwindet es nur für sie. Die
anderen werden gewarnt und können endgültig löschen.

**Aufgaben**:

Domäne (test-getrieben):
- [x] `Wish.ts`:
  - Der Getter `keepsSecretFromOwner` gilt, wenn der Wunsch nicht erhalten ist und geheim
    ist oder einen Schenkenden hat.
  - `isHiddenFrom(p)` gilt zusätzlich bei `removedByOwner` für die Besitzerin.
  - `viewOfWish` liefert dann `visibility: 'hidden'`.
  - Tests
- [x] `Wish.removeFor(p): WishRemoval`, mit
  `WishRemoval = { kind: 'delete' } | { kind: 'hideFromOwner'; wish: Wish }`:
  - `isHiddenFrom(p)` → `WishHiddenFromOwner`
  - Besitzerin und `keepsSecretFromOwner` → ausblenden, sonst löschen. Bei anderen wird
    immer gelöscht.
  - Tests je Zeile der Tabelle aus Entscheidung 7
- [x] `Wishlist.ts`:
  - `removedByOwner: boolean` in `create` (false) und `restore`. `rename` behält den Wert.
    `restore` bekommt ein Objekt statt Positionsparametern, mit den Aufrufern
    `wishlistDocument.ts:27`, `Wishlist.test.ts` und `fakes/wishlistNamed.ts`.
  - `isVisibleTo(p)` ist `!(isOwner(p) && removedByOwner)`.
  - `ensureVisibleTo(p)` wirft `WishlistNotFound` (Entscheidung 16).
  - `removeFor(p, { wishes, confirmed }): WishlistRemoval`: Die Besitzerin blendet aus,
    wenn `!confirmed` oder ein Wunsch `keepsSecretFromOwner` erfüllt. Sonst wird
    gelöscht.
  - Tests, darunter „unbestätigter Stand → ausblenden“
- [x] `Perspective.ts`: neues Feld `wishlistIsHidden: boolean`.
  - `perspectiveOf(wishlist, me)` setzt es auf `!wishlist.isVisibleTo(...)`.
  - `wish.isHiddenFrom(p)` ist bei `p.wishlistIsHidden` immer wahr. Damit sind alle
    Wünsche einer ausgeblendeten Liste für Anna `hidden`, ohne dass sich die Signaturen
    von `viewOfWish`/`viewOfWishes` ändern.
  - Die Test-Perspektiven setzen das Feld auf `false`, dazu kommt eine Testhilfe
    `perspective(me, ownerId)` in `fakes/`.
- [x] `wishView.ts`:
  - `visibleWishCount(wishes, p): number` zählt die Wünsche mit `visibility: 'shown'`,
    für den Listen-Löschdialog.
  - Tests
- [x] `Wishlist.ts`: `wishlistsVisibleTo(wishlists, me)` filtert über
  `isVisibleTo(perspectiveOf(wishlist, me))`. Test. `groupWishlistsByOwner` nutzt die
  Funktion.
- [x] `wishlistOverview.ts`: `groupWishlistsByOwner` blendet Listen aus, die für `me`
  nicht sichtbar sind. Test: Annas entfernte Liste fehlt bei Anna, bei Oma ist sie da.
  Eine Gruppe, die dadurch leer wird, fehlt.
- [x] `WishRepository.ts`:
  `getByWishlist(wishlistId): Promise<{ wishes: readonly Wish[]; confirmed: boolean }>`
  (Entscheidung 15)

Anwendung (test-getrieben):
- [x] `fakes/InMemoryWishRepository.ts`: `getByWishlist` mit `confirmed: true`, dazu ein
  Schalter `answerFromCacheOnly()` für den Test mit unbestätigtem Stand
- [x] `ChangeWishState`, `CreateWish` und `EditWish` rufen `wishlist.ensureVisibleTo(p)`
  auf. Je ein Test: Anna und ihre ausgeblendete Liste → `WishlistNotFound`.
- [x] `DeleteWish.execute(wishId, me)`:
  - Wunsch und Liste laden, `ensureVisibleTo`
  - `removeFor(perspective)`: `delete` → `wishes.delete`, `hideFromOwner` →
    `wishes.save`
  - Ein unbekannter Wunsch bleibt wie heute kein Fehler.
  - Tests: Anna blendet einen geschenkten Wunsch aus, Anna löscht einen offenen, Oma
    löscht einen entfernten endgültig
- [x] `DeleteWishlist.execute(wishlistId, me)`:
  - Liste laden (`WishlistNotFound`) und `wishes.getByWishlist`
  - `removeFor`: `delete` → `wishes.deleteAllOf` + `wishlists.delete`, `hideFromOwner` →
    `wishlists.save`
  - Tests:
    - Anna mit Geheimnis → ausgeblendet, Wünsche unverändert
    - Anna ohne Geheimnis → gelöscht
    - Anna ohne bestätigten Stand → ausgeblendet
    - Oma → gelöscht
- [x] `WatchWishlistOverview`: reicht `me` an `groupWishlistsByOwner` weiter. Der Test mit
  entfernter Liste kommt dazu.
- [x] `createWishlistModule.ts`: angepasste Konstruktoren von `DeleteWish` und
  `DeleteWishlist`

Infrastruktur:
- [x] `firestore/wishlistDocument.ts`:
  - `removedByOwner?: boolean`. Fehlt es, gilt `false` (Entscheidung 10), ein anderer Typ
    als Boolean ist ungültig.
  - `toWishlistDocument` schreibt das Feld immer.
- [x] `firestore/FirestoreWishRepository.ts` (Entscheidung 15):
  - `getByWishlist` über `getDocs(#wishesOf(...))`, mit
    `confirmed: !snapshot.metadata.fromCache`
  - `deleteAllOf` liest über `getDocs` statt `getDocsFromCache`.
- [x] `ui/wishTexts.ts` mit Tests:
  - `wishRemovedByOwnerMessage(ownerName)` → „Anna hat diesen Wunsch entfernt.“
  - `wishlistRemovedByOwnerMessage(ownerName)` → „Anna hat diese Wunschliste entfernt.“
  - `removedByOwnerNote(ownerName)` → „von Anna entfernt“
  - Ohne bekannten Namen lauten sie „Die Besitzerin hat …“ bzw. „von der Besitzerin
    entfernt“.
  - `FINAL_DELETION_LABEL = 'Endgültig löschen'`
- [x] `ui/WishStateNotes.svelte`: „⚠ von Anna entfernt“ bei `view.removedByOwner` (nur
  Variante `entry`)
- [x] `ui/WishPage.svelte`:
  - bei `view.removedByOwner` für andere ein Absatz mit ⚠-Meldung, darunter
    [🗑 Endgültig löschen] + `ConfirmDialog` („Wunsch endgültig löschen?“,
    `wishDeletionMessage`)
  - danach `deleteWish.execute(wishId, me.id)`, Rücksprung zur Liste,
    `wishDeletedAnnouncement`
  - `isDeleting` wie in `EditWishPage`
  - Für Anna greift `visibility: 'hidden'` → `NotFound`.
- [x] `ui/EditWishPage.svelte`:
  - `deleteWish.execute(wishId, me.id)`
  - Ansage und Rücksprung unverändert
  - Nach dem Ausblenden meldet die Beobachtung den Wunsch als `hidden`. Durch
    `isDeleting` erscheint kein „Diesen Wunsch gibt es nicht mehr.“.
- [x] `ui/WishlistPage.svelte`:
  - `wishlist.isVisibleTo(perspective)` ist falsch → `NotFound` „Diese Wunschliste gibt es
    nicht mehr.“
  - Bei `removedByOwner` für andere folgt unter der Besitzerinnenzeile die ⚠-Meldung,
    darunter [🗑 Endgültig löschen] + `ConfirmDialog` mit `wishlistDeletionMessage(name,
    count)`.
  - `deleteWishlist.execute(wishlistId, me.id)`, danach `navigateTo` zur Übersicht und
    `wishlistDeletedAnnouncement`
  - `isDeleting` wie in `EditWishlistPage`, damit nach dem Löschen kein `NotFound`
    aufblitzt
  - Die Anzahl im Dialog kommt aus `visibleWishCount(wishes, perspective)`. Für andere
    sind das alle Wünsche.
- [x] `ui/CreateWishPage.svelte`: Ist die Liste für mich nicht sichtbar, erscheint
  `NotFound` „Diese Wunschliste gibt es nicht mehr.“. `WishPage` und `EditWishPage`
  zeigen `NotFound` bereits über `visibility: 'hidden'`, denn die Perspektive trägt
  `wishlistIsHidden`.
- [x] `ui/EditWishlistPage.svelte`:
  - `deleteWishlist.execute(wishlistId, me.id)`
  - Die Anzahl im Dialog kommt aus `visibleWishCount(wishes, perspective)`.
  - Ist die Liste für Anna nicht sichtbar → `NotFound`. `isDeleting` verhindert das nach
    dem eigenen Ausblenden.
- [x] `ui/WishlistsPage.svelte`: Für andere steht im Eintrag einer entfernten Liste unter
  dem Namen „⚠ von Anna entfernt“. Der Name der Besitzerin kommt aus der Gruppe.
- [x] `ui/EditPersonPage.svelte`:
  - Bei der eigenen Person (`person.id === me.id`) zählt der Hinweis nur
    `wishlistsVisibleTo(ownedWishlists, me.id)`.
  - Sichtbar 0 und gesamt > 0 → `personTexts.personNotDeletableRightNowHint(name)` =
    „Anna kann gerade nicht gelöscht werden.“, kein Löschknopf
  - Bei anderen Personen bleibt der Hinweis unverändert.
- [x] `README.md`:
  - neuer Unterabschnitt „Umstieg auf Geheim-Einträge (WL-006)“: Die Regeln bleiben
    unverändert. Nach dem Push die alten Dokumente in `wishes` in der Konsole löschen,
    denn sie haben kein neues Format und werden nicht mehr angezeigt.
  - „Daten“: Wunschfelder `createdBy`, `secret`, `giverId`, `received`,
    `removedByOwner`, Listenfeld `removedByOwner`. Geheimhaltung ist Ehrensache, denn
    technisch kann jeder alles lesen.
- [x] `docs/agents/research/2026-09-28-wunschliste-konzept.md`, Abschnitte „Geheim-Einträge“,
  „Schenken und Erhalten“, „Datenmodell“: die Entscheidungen 1–5 und 14 als kurze
  Ergänzungen nachtragen (Erhalten ohne Schenkenden, Übergeben, Überraschungszeile,
  `received` statt `receivedAt`)
- [x] `docs/notes.txt`: den Punkt „Schritt 4/5: Übergang für Firestore-Dokumente …“ auf `x`
  setzen und nach DONE verschieben

E2E:
- [x] `e2e/emulators.ts`: `WishlistRecord.removedByOwner?: boolean`
- [x] neu `e2e/ownerRemoval.spec.ts`:
  - Anna löscht in ihrer Liste einen von Ben geschenkten Wunsch:
    - Ansage „Wunsch „…“ gelöscht.“, Rücksprung zur Liste, Wunsch weg
    - `storedWishes()` enthält ihn mit `removedByOwner: true`.
  - Anna löscht einen offenen Wunsch: `storedWishes()` enthält ihn nicht mehr.
  - Anna löscht ihre Liste mit einem geheimen Wunsch:
    - Die Abfrage nennt nur die sichtbaren Wünsche.
    - Danach ist die Liste aus der Übersicht verschwunden.
    - `storedWishlists()` enthält sie mit `removedByOwner: true`, die Wünsche sind
      unverändert.
    - `#/liste/<id>` und `#/liste/<id>/wunsch/neu` (Adresse laut `wishlistAddresses.ts`)
      zeigen „Diese Wunschliste gibt es nicht mehr.“.
    - `#/wunsch/<id>` eines normalen Wunsches dieser Liste zeigt „Diesen Wunsch gibt es
      nicht mehr.“.
  - Anna löscht ihre Liste ohne Geheimnisse: Liste und Wünsche sind weg.
  - Sicht der anderen, geseedet mit `removedByOwner` in Bens Liste bzw. Bens Wunsch,
    Anna schaut:
    - Übersicht mit „⚠ von Ben entfernt“
    - Listenseite mit „Ben hat diese Wunschliste entfernt.“ und
      [Endgültig löschen] → Dialog → Übersicht ohne die Liste, `storedWishlists()` leer
    - Wunschseite mit „Ben hat diesen Wunsch entfernt.“ und [Endgültig löschen] → weg
  - „Person bearbeiten“ für Anna mit nur einer für sie entfernten Liste: „Anna kann gerade
    nicht gelöscht werden.“ und kein Löschknopf
- [x] `tests/integration/FirestoreWishlistRepository.integration.test.ts`:
  - `removedByOwner` wird geschrieben und gelesen.
  - Ein fehlendes Feld ergibt `false`.
  - `removedByOwner: 'ja'` wird übersprungen.
- [x] `e2e/accessibility.spec.ts`: entfernte Liste und entfernter Wunsch aus Sicht der
  anderen samt Dialog, in allen drei Farbschemata

**Automatisierte Verifikation**:
- [x] `npm run test:unit` grün, mit den Tests für `removeFor`, `isVisibleTo`,
  `groupWishlistsByOwner`, `DeleteWish`, `DeleteWishlist` und den Texten
- [x] `tests/integration/FirestoreWishRepository.integration.test.ts`: `getByWishlist`
  liefert auf einem frischen Gerät (leerer Cache) die Wünsche vom Server
- [x] `npm run lint` und `npm test` grün (Architektur, Unit, Integration, E2E)

**Manuelle Verifikation**:
- [ ] Auf zwei iPhones mit VoiceOver:
  - Anna löscht einen Wunsch, den Ben geschenkt hat. Bei Anna ist er weg, Ben hört auf der
    Detailseite „Anna hat diesen Wunsch entfernt.“ und kann endgültig löschen.
  - Anna löscht eine Liste mit einem geheimen Wunsch. Bei Anna ist sie weg, Ben sieht sie
    in der Übersicht mit „von Anna entfernt“.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1, `WishPage`: Der Fokus nach einer Zustandsänderung wird gesetzt, sobald die
  Beobachtung die neue View meldet (`$effect` auf `view`), nicht nach einem festen `tick()`.
  Grund: Die Firestore-Meldung des lokalen Schreibens kann nach dem Ende des Use Cases
  kommen, und beim Wechsel von [↶ Schenken zurücknehmen] im Inhalt zu [🎁 Schenken]
  verschwindet der geklickte Knopf.
- Phase 1, `WishPage`: Der Erfüllt-Vermerk steht wie in den Skizzen unter der Überschrift
  und vor Bewertung und Preis. Fehlt die Liste eines Wunsches, erscheint jetzt ebenfalls
  „Diesen Wunsch gibt es nicht mehr.“ statt einer leeren Seite.
- Phase 2: Die Haken-Optik von `ChoiceGroup` steht jetzt global in
  `src/shared/ui/checkOption.css` (`.check-option`, `.check-option__box`) und wird von
  `ChoiceGroup` und `CheckOption` geteilt. Der Hinweis unter „Geheim“ steht als Absatz unter
  der Checkbox und ist per `aria-describedby` verknüpft.
- Phase 3: `Wish.isRemovedFor(p)` (Liste ausgeblendet oder Wunsch von der Besitzerin
  entfernt) trennt `hidden` von `surprise`, damit `hidden` stärker ist.
  `allowedWishActions` liefert für ausgeblendete Wünsche keine Aktion.
- Phase 3: `DeleteWish` wirft `WishlistNotFound`, wenn die Liste eines Wunsches fehlt. Ein
  unbekannter Wunsch bleibt wie bisher kein Fehler. `DeleteWishlist` wirft bei unbekannter
  Liste `WishlistNotFound`.
- Phase 3: `WishlistPage` leitet die Besitzerin aus `watchPersons` ab statt sie zusätzlich
  per `watchPerson` zu beobachten. `WishStateNotes` bekommt dafür `ownerName`.
- Die Testhilfe `perspective(me, ownerId)` in `fakes/` war nicht nötig. Die
  Anwendungstests bilden Perspektiven über die Use Cases, und die Domänentests nutzen
  Literale mit `wishlistIsHidden: false`. Neu ist dagegen `removedWishlistNamed` in
  `fakes/wishlistNamed.ts`.

## Verweise

- Konzept: `docs/agents/research/2026-09-28-wunschliste-konzept.md` (Abschnitte
  „Geheim-Einträge“, „Schenken und Erhalten“, „Bearbeiten und Löschen“,
  „Umsetzungsreihenfolge“ Schritt 5)
- Vorgänger: `docs/agents/plans/2026-09-29-personen-profilwahl-besitzerin.md` (WL-005,
  `useCurrentProfile`, Fixture mit Anna, Server-zuerst-Lesen, Entscheidung 12)
- `docs/agents/plans/2026-09-28-firestore-anmeldung-offline-sync.md` (WL-004, Muster für
  Adapter und Integrationstests)
- Offener Punkt: `docs/notes.txt` „Schritt 4/5: Übergang für Firestore-Dokumente …“
- Architektur: `.claude/skills/architecture/SKILL.md`
