---
date: 2026-09-29T08:27:38.632917+00:00
git_commit: 38cf7f48518c929ffb3fe6b1163deee346b27a1a
branch: main
story: WL-005
topic: "Personen, Profilwahl, Besitzerin und gruppierte Übersicht"
tags: [plan, wishlist, domain, application, firestore, profile, router, settings, accessibility]
status: done
---

# PLAN: WL-005 — Personen, Profilwahl, Besitzerin und gruppierte Übersicht

Dieser Plan setzt Schritt 4 aus `docs/agents/research/2026-09-28-wunschliste-konzept.md` um:

- Es gibt Personen, gespeichert in Firestore.
- Jedes Gerät weiß, wer es benutzt („Wer bist du?“).
- Jede Wunschliste gehört genau einer Person.
- Die Übersicht ist nach Besitzerin gruppiert.

Wünsche und das Schenken bleiben unverändert. `giftedBy`, Erhalten und Geheim-Einträge
folgen in Schritt 5.

## Akzeptanzkriterien

**Profilwahl**
- Nach dem Anmelden erscheint „Wer bist du?“ (h1), solange auf dem Gerät kein Profil
  gespeichert ist oder die gespeicherte Person nicht mehr existiert. Solange ist weder
  die Hauptnavigation noch eine andere Seite erreichbar. Der Hash bleibt stehen, nach der
  Wahl erscheint die ursprünglich aufgerufene Seite mit Fokus auf ihrem h1.
- Die Personen stehen alphabetisch in einer Eintragsliste. Ein Tipp setzt das Profil
  sofort, und VoiceOver sagt „Du bist Anna.“ an.
- Ohne Personen steht dort „Noch keine Personen.“. Der Knopf [+ Neue Person] ist immer
  da und führt zu „Person erstellen“. Nach dem Erstellen gilt die neue Person als Profil.
  „Abbrechen“ führt zurück zu „Wer bist du?“.
- Das Profil liegt in `localStorage` unter `wunschliste.profile`. Abmelden entfernt es.
  Andere geöffnete Tabs folgen einer Änderung ohne Neuladen.
- Lassen sich die Personen nicht laden (keine Berechtigung, Regeln fehlen), erscheint
  „Die Daten konnten nicht geladen werden.“ mit [Abmelden]. Das ist keine Sackgasse.
- Solange die Personen laden, ist der Inhalt leer. Offline-Hinweis und Warnzeile im Kopf
  bleiben sichtbar.
- Ein Doppeltipp auf [Erstellen] legt nur eine Person an.

**Personen**
- Ein Personenname ist Pflicht, höchstens 100 Zeichen lang und eindeutig. Groß- und
  Kleinschreibung sowie Leerraum am Rand zählen nicht. Ein vergebener Name führt zu
  „Diesen Namen gibt es schon.“ am fokussierten Feld.
- In den Einstellungen gibt es zwischen „Farbschema“ und „Familienzugang“ zwei neue
  Abschnitte:
  - „Ich“ mit dem Satz „Ich bin Anna“ und dem Knopf [⇄ Wechseln]
  - „Personen“ mit einem [+]-Knopf („Person erstellen“) und der alphabetischen
    Personenliste
- „Wechseln“ öffnet `#/wer-bist-du` mit Zurück-Knopf „Einstellungen“. Nach der Wahl geht
  es zurück zu den Einstellungen, und VoiceOver sagt „Du bist Ben.“ an.
- [+] öffnet `#/person/neu`. Das Profil bleibt unverändert, danach geht es zurück zu den
  Einstellungen mit der Ansage „Person erstellt.“.
- Ein Tipp auf eine Person öffnet `#/person/<id>/bearbeiten` mit Umbenennen und am
  Formularende [🗑 Person löschen] samt Sicherheitsabfrage.
- Gehören der Person Wunschlisten, steht statt des Knopfs „Oma gehören noch 2
  Wunschlisten. Sie kann erst gelöscht werden, wenn sie keine mehr hat.“ (bei einer
  Liste: „1 Wunschliste“). `DeletePerson` lehnt das Löschen dann ab.
- Verschwindet die eigene Person, weil sie selbst gelöscht wurde oder jemand auf einem
  anderen Gerät sie gelöscht hat, erscheint „Wer bist du?“.

**Besitzerin und Übersicht**
- „Wunschliste erstellen“ hat unter dem Namen die Radiogruppe „Für“ (alle Personen, die
  eigene zuerst, dann alphabetisch). Vorausgewählt ist das eigene Profil.
- „Wunschliste bearbeiten“ zeigt „Für: Anna“ nur als Text.
- Die Seite einer Liste zeigt unter der Überschrift „für Anna“ bzw. in der eigenen Liste
  „für mich“.
- Die Übersicht ist nach Besitzerin gruppiert:
  - Gruppenköpfe als h2, die eigene Gruppe zuerst („Anna (ich)“), die übrigen
    alphabetisch
  - innerhalb der Gruppen alphabetisch
  - Personen ohne Listen werden ausgeblendet
  - Listen, deren Besitzerin es nicht mehr gibt, stehen am Ende unter „Unbekannt“
- Wunschlisten-Dokumente ohne gültige `ownerId` (Zeichenkette, nicht leer) werden
  ignoriert.

**Technik**
- `firestore.rules` erlaubt `persons/{id}` nur dem Familienkonto, und die Regeltests
  decken das ab.
- axe meldet in allen drei Farbschemata keine Verstöße auf diesen Seiten: „Wer bist du?“
  (leer und gefüllt), „Person erstellen“ mit Fehler, „Person bearbeiten“ samt
  Löschdialog und dem Hinweis bei eigenen Listen, gruppierte Übersicht, Einstellungen.
- `npm run lint` und `npm test` (Architektur, Unit, Integration, E2E) laufen grün.

## Wesentliche Entscheidungen und Abwägungen

1. **Umfang ohne Schenken:** `Wish`, `wishDocument` und die Schenken-Use-Cases bleiben
   unangetastet.
   - Warum: `giftedBy` und der Übergang vom alten Feld `gifted` gehören gebündelt zu
     Schritt 5.
   - Auswirkung: Der Wunschteil von `docs/notes.txt:73` bleibt offen.
2. **Besitzerin ist Pflicht, Altdaten werden verworfen:** `wishlistFromDocument`
   liefert `undefined` ohne gültige `ownerId`. Es gibt keinen Übergangscode.
   - Warum: In der Produktivdatenbank liegen nur Testdaten.
   - Auswirkung:
     - Die alten Listen (und ihre Wünsche) werden unsichtbar.
     - Die README bekommt den Schritt, sie in der Firebase-Konsole zu löschen.
3. **`Person` als eigenes Aggregat im Kontext `wishlist`:** Sammlung `persons` mit
   `{ name }`. Der Wert `Name` wird wiederverwendet.
   - Warum: Personen existieren nur als Besitzerinnen (später auch als Schenkende). Ein
     eigener Kontext wäre vorsorglich.
   - Auswirkung: Es kommen hinzu:
     - Port `PersonRepository`
     - Firestore-Adapter mit Integrationstest
     - In-Memory-Fake
     - Regel und Regeltest
4. **Eindeutige Namen über eine Domänenfunktion:**
   - `ensureNameIsFree(name, persons, renamedPersonId?)` wirft `PersonNameTaken`.
   - `CreatePerson` und `RenamePerson` laden dafür alle Personen über
     `PersonRepository.getAll()` und rufen die Funktion auf. Dabei gilt Server zuerst,
     siehe Entscheidung 12.
   - Verglichen wird per `localeCompare(…, 'de', { sensitivity: 'accent' })`.
   - Warum: Die Regel betrifft alle Personen und passt deshalb nicht in ein einzelnes
     Aggregat.
   - Auswirkung: Legen zwei Geräte offline gleichzeitig „Ben“ an, entsteht ein Duplikat.
     Das ist bewusst hingenommen.
5. **Profil pro Gerät als Port `ProfileStore`:**
   - Die Methoden sind `current()`, `choose(id)`, `forget()` und `watch(onChange)`.
   - Der Adapter `LocalStorageProfileStore` benachrichtigt eigene Beobachter im selben
     Tab und hört zusätzlich auf das `storage`-Ereignis für `wunschliste.profile`. So
     folgen andere Tabs einem Wechsel oder einer Abmeldung.
   - Er bekommt den Speicher als Getter `() => Storage`, nicht als Objekt. Schon der
     Zugriff auf `window.localStorage` kann einen `SecurityError` werfen, und der
     try/catch im Adapter muss auch diesen Zugriff umschließen.
   - Warum:
     - Das Profil ist eine Gerätesache, anders als die Daten in Firestore.
     - Durch den Port lassen sich die Use Cases ohne Browser testen.
   - Auswirkung: `WatchCurrentPerson` verbindet `ProfileStore.watch` mit
     `PersonRepository.watchAll` und meldet `Person | undefined`. `undefined` heißt
     „Profil wählen“.
6. **Profilwahl als Tor in `SignedInApp`, ohne eigene Adresse:**
   - Der Zustand `CurrentProfile.state` wird per Svelte-Kontext bereitgestellt. Er ist
     eine diskriminierte Union:
     `{ status: 'loading' } | { status: 'missing' } | { status: 'failed' } | { status: 'chosen'; me: Person }`.
     Seiten, die nur unter `chosen` gerendert werden, holen `me` über
     `useCurrentProfile().me`. Der Getter wirft außerhalb von `chosen`, damit niemand
     `undefined` einengen muss.
   - Bei `missing` zeigt `SignedInApp` statt der Seiten die Komponente `ProfileSetup`.
     Sie wechselt intern zwischen `ChooseProfilePage` und `CreatePersonPage`.
   - Bei `loading` und `failed` gibt es ebenfalls den Kopf mit `OfflineNotice` und
     `ProblemNotice`, aber keine Hauptnavigation.
   - `failed` ist keine Sackgasse. Das tritt etwa ein, wenn die Regeln nicht ausgerollt
     sind oder das Konto keine Berechtigung hat. Dann zeigt `SignedInApp` die Meldung
     „Die Daten konnten nicht geladen werden.“ und darunter den Abschnitt
     `FamilyAccessSettings` mit [Abmelden].
   - Der Fokus nach der Wahl: `ProfileSetup` ruft `requestPageFocus()` **vor**
     `chooseProfile.execute` auf. Die Wahl schaltet `CurrentProfile` synchron auf
     `chosen`, und die Zielseite nimmt die Anforderung beim Aufbau ab. Ein Aufruf
     danach käme zu spät.
   - Warum: Wie bei der Anmeldung bleibt der Hash stehen, und nach der Wahl erscheint die
     ursprünglich aufgerufene Seite.
   - Auswirkung:
     - Dieselben Seitenkomponenten dienen auch als Unterseiten der Einstellungen
       (`#/wer-bist-du`, `#/person/neu`).
     - Wohin es nach Abschluss geht, bestimmen Props.
7. **Löschschutz in der Domäne:** `ensurePersonIsDeletable(personId, ownedWishlists)`
   wirft `PersonOwnsWishlists`. `DeletePerson` lädt dafür
   `WishlistRepository.getOwnedBy(personId)`. Dabei gilt Server zuerst, siehe
   Entscheidung 12.
   - Auswirkung: Der Port `WishlistRepository` bekommt `getOwnedBy` und
     `watchOwnedBy`. `watchOwnedBy` braucht die Seite „Person bearbeiten“ für ihren
     Hinweis.
8. **Übersicht als Domänenfunktion:** `groupWishlistsByOwner(wishlists, persons, me)`
   liefert `WishlistGroup[]` mit `{ owner: Person | undefined; isMe: boolean;
   wishlists }`.
   - Reihenfolge:
     - zuerst die Gruppe von `me`
     - dann die übrigen nach Name (wie `sortPersons`)
     - zuletzt `owner: undefined` („Unbekannt“)
   - `WatchWishlistOverview` verbindet beide Beobachtungen und meldet erst, wenn beide
     einmal geliefert haben.
   - Auswirkung: `WatchWishlists` entfällt. `personsMeFirst(persons, me)` ordnet
     zusätzlich die Radiogruppe „Für“.
9. **Besitzerin nachträglich nicht änderbar:** `Wishlist.rename` übernimmt `ownerId`.
   Es gibt keine Methode zum Ändern der Besitzerin. `CreateWishlist` prüft, ob die
   Besitzerin existiert, und wirft sonst `PersonNotFound`.
10. **Abmelden vergisst das Profil:** `SignedInApp` ruft im Schritt `before` von
    `access.onSignOut` nach dem Schließen der Seiten `forgetProfile.execute()` auf.
    Der bestehende Warnhinweis („Die Daten auf diesem Gerät werden entfernt.“) deckt
    das bereits ab.
11. **E2E-Tests starten mit einer gewählten Person:**
    - Die Fixture legt standardmäßig die Person `{ id: 'anna', name: 'Anna' }` an und
      wählt sie nach dem Anmelden über die Oberfläche.
    - Die Option `profile: 'Anna' | null` steuert das, Standard ist `'Anna'`. `null`
      heißt: keine Person und keine Wahl. `undefined` scheidet aus, denn Playwright
      setzt damit eine Option auf ihren Standardwert zurück.
    - `signIn(page, account = FAMILY, profile: 'Anna' | null = 'Anna')` ist eine freie
      Funktion. Specs mit `signedIn: false` geben das Profil selbst mit.
    - Warum: Die Oberfläche setzt das Profil wie echte Nutzer. `addInitScript` würde das
      Profil bei jedem Laden neu setzen und so Abmelde- und Löschtests verfälschen.
    - Auswirkung: `WishlistRecord` bekommt `ownerId`. Alle Seeds in `e2e/*.spec.ts`
      tragen `ownerId: 'anna'`.
12. **Prüfende Lesezugriffe gehen zuerst an den Server:**
    - `PersonRepository.getAll()` und `WishlistRepository.getOwnedBy()` nutzen
      `getDocs`, nicht `getDocsFromCache`.
    - Warum: `getDocsFromCache` einer Abfrage wirft bei leerem Cache nicht, sondern
      liefert `[]`. Auf einem frischen Gerät oder bei einem Deep-Link würde der
      Löschschutz dann eine Person mit Listen löschen, und die Namensprüfung ließe
      Duplikate durch.
    - Auswirkung: Offline liefert `getDocs` laut SDK den Cache-Stand, eventuell mit
      Verzögerung. Personen offline anzulegen oder zu löschen ist selten. Das ist
      hingenommen.
13. **Leerer Cache ist kein „keine Personen“:** `FirestorePersonRepository.watchAll`
    meldet einen Snapshot nicht weiter, wenn er leer ist und aus dem Cache stammt
    (`snapshot.metadata.fromCache`).
    - Warum: Auf einem frischen Gerät kommt zuerst ein leerer Cache-Snapshot. „Noch
      keine Personen.“ würde dann kurz aufblitzen und zu Duplikaten verleiten.
    - Auswirkung: `CurrentProfile` bleibt `loading`, bis der Server geantwortet hat oder
      der Cache Personen kennt. Offline beim allerersten Start ist ohnehin nicht möglich
      (Konzept).
14. **Namensformular einmal, zweimal genutzt:** `WishlistNameForm` wird zu `NameForm`
    verallgemeinert.
    - Neue Props: `fieldId`, `problemMessages` und
      `onsubmit(name) → Promise<'taken' | void>`.
    - Solange `onsubmit` läuft, sperrt das Formular weiteres Absenden, gegen doppelte
      Personen bei einem Doppeltipp.
    - Wunschlisten und Personen nutzen dasselbe Formular.
15. **Regeln vor dem Code ausrollen:** `deploy.yml` rollt keine Regeln aus. Ohne die
    Regel für `persons` landet jeder im Zustand `failed`. Die README hält deshalb fest:
    erst `npx firebase deploy --only firestore:rules`, dann auf `main` pushen.

## Ausgangslage

```
 App.svelte ── signedOut ──► SignInPage
     └── signedIn ──► SignedInApp ── createWishlistModule(firestore) ──► Kontext
                          ├── #/einstellungen ──► SettingsPage (app/)
                          │                        ├─ ColorSchemeSettings
                          │                        └─ FamilyAccessSettings
                          └── sonst ──► WishlistPages (wishlist/infrastructure/ui)
```

- `Wishlist` hat nur `id` und `name` (`src/wishlist/domain/Wishlist.ts:5-22`).
- Das Dokument ist `{ name }` (`src/wishlist/infrastructure/firestore/wishlistDocument.ts:6`).
  Ungültige Dokumente werden verworfen.
- Die Übersicht ist flach und alphabetisch
  (`src/wishlist/infrastructure/ui/WishlistsPage.svelte`,
  `src/wishlist/application/WatchWishlists.ts`).
- `firestore.rules` kennt nur `wishlists` und `wishes`.
- Die Adressen stehen in `src/wishlist/infrastructure/ui/wishlistAddresses.ts`.
  `mainPageOf` (`src/app/router/routes.ts:30`) blendet die Hauptnavigation auf
  Unterseiten aus.
- Wiederverwendbar sind:
  - `ChoiceGroup` (Radiogruppe mit Haken)
  - `entryList.css` (Eintragsliste)
  - `ConfirmDialog`
  - `PageHeader` mit `back`
  - `TextField` mit `problem`
  - `ActionBar`
  - `Watched`
  - `announce`
  - `requestPageFocus`
- Die E2E-Fixture meldet an und erwartet danach das h1 „Wunschlisten“
  (`e2e/fixtures.ts:163-169`).

## Zielbild

```
 SignedInApp
   ├─ provideWishlistModule(createWishlistModule({ firestore, idGenerator, profileStore, onProblem }))
   ├─ provideCurrentProfile(new CurrentProfile(module.watchCurrentPerson))
   │
   ├─ profile.status = loading  ──► <AppFrame> Kopf: Offline-/Problemhinweis, Inhalt leer
   ├─ profile.status = failed   ──► <AppFrame> Meldung „Die Daten konnten nicht geladen werden.“ + FamilyAccessSettings
   ├─ profile.status = missing  ──► <AppFrame><ProfileSetup/></AppFrame>   (ohne Navigation)
   │                                  ├─ ChooseProfilePage  (Tipp → chooseProfile → Seite von vorher)
   │                                  └─ CreatePersonPage   (Erstellen → createPerson + chooseProfile)
   └─ profile.status = chosen   ──► heutige App
                                     ├─ #/einstellungen ──► SettingsPage
                                     │                       ├─ ColorSchemeSettings
                                     │                       ├─ PersonSettings   (neu, aus wishlist/…/ui)
                                     │                       └─ FamilyAccessSettings
                                     └─ WishlistPages
                                          ├─ #/                     WishlistsPage (gruppiert)
                                          ├─ #/wer-bist-du          ChooseProfilePage (zurück: Einstellungen)
                                          ├─ #/person/neu           CreatePersonPage  (zurück: Einstellungen)
                                          └─ #/person/<id>/bearbeiten EditPersonPage
```

Oberflächen:

```
 Wer bist du? (Tor)                 Person erstellen                   Einstellungen
 ┌──────────────────────────────┐   ┌──────────────────────────────┐   ┌──────────────────────────────┐
 │ Wer bist du?                 │   │ Person erstellen             │   │ Einstellungen                │
 │ ──────────────────────────── │   │ Name [____________]          │   │ Farbschema …                 │
 │ Anna                       › │   │ ⚠ Diesen Namen gibt es schon.│   │ Ich                    (h2)  │
 │ Ben                        › │   │                              │   │ Ich bin Anna                 │
 │ Oma                        › │   │                              │   │ [⇄ Wechseln]                 │
 │ ──────────────────────────── │   │                              │   │ Personen               [+]   │
 │ [+ Neue Person]              │   ├──────────────────────────────┤   │ Anna                       › │
 └──────────────────────────────┘   │ [+ Erstellen] [✕ Abbrechen]  │   │ Ben                        › │
   leer: „Noch keine Personen.“     └──────────────────────────────┘   │ Familienzugang …             │
                                                                        └──────────────────────────────┘
 Person bearbeiten                  Wunschlisten (vorher → nachher)
 ┌──────────────────────────────┐   ┌───────────────────────┐   ┌──────────────────────────────┐
 │ ‹ Einstellungen              │   │ Wunschlisten      [+] │   │ Wunschlisten             [+] │
 │ Person bearbeiten            │   │ Geburtstag 2027     › │   │ Anna (ich)             (h2)  │
 │ Name [Oma_________]          │   │ Ostern              › │   │ Geburtstag 2027            › │
 │ [🗑 Person löschen]          │   │ Weihnachten         › │   │ Ben                    (h2)  │
 │   bzw. „Oma gehören noch     │   └───────────────────────┘   │ Weihnachten                › │
 │   2 Wunschlisten. …“         │                               │ Oma                    (h2)  │
 ├──────────────────────────────┤                               │ Ostern                     › │
 │ [💾 Speichern] [✕ Abbrechen] │                               │ Unbekannt              (h2)  │
 └──────────────────────────────┘                               │ …                            │
                                                                └──────────────────────────────┘
 Wunschliste erstellen              Wunschliste bearbeiten       Seite einer Liste
 Name [____________]                Name [Geburtstag 2027]       ‹ Wunschlisten
 Für                                Für: Anna                    Geburtstag 2027      [✏] [+]
   Anna (ich)       ✓               [🗑 Wunschliste löschen]     für mich
   Ben                                                           [Offene] [Erfüllte]
   Oma
```

Der Name der eigenen Person trägt in der Radiogruppe den Zusatz „(ich)“, genau wie in der
Übersicht.

## Abstraktionen und Wiederverwendung

- `src/wishlist/domain/`
  - `ids.ts` - `PersonId`, `personIdOf`
  - `Person.ts` - neu
    - `Person` - `create`, `restore`, `rename`
    - `sortPersons`, `personsMeFirst`
    - `PersonNotFound`
  - `personRules.ts` - neu
    - `ensureNameIsFree` mit `PersonNameTaken`
    - `ensurePersonIsDeletable` mit `PersonOwnsWishlists`
  - `PersonRepository.ts` - neuer Port: `watchAll`, `get`, `getAll`, `save`, `delete`
  - `ProfileStore.ts` - neuer Port: `current`, `choose`, `forget`, `watch`
  - `Wishlist.ts` - `ownerId: PersonId` in `create`, `restore` und `rename`
  - `wishlistOverview.ts` - neu: `WishlistGroup`, `groupWishlistsByOwner`
  - `WishlistRepository.ts` - `getOwnedBy`, `watchOwnedBy`
- `src/wishlist/application/`
  - neue Use Cases:
    - `CreatePerson`, `RenamePerson`, `DeletePerson`
    - `WatchPersons`, `WatchPerson`
    - `ChooseProfile`, `ForgetProfile`, `WatchCurrentPerson`
    - `WatchWishlistOverview`, `WatchWishlistsOwnedBy`
  - `CreateWishlist` - bekommt `ownerId`
  - `WatchWishlists` - entfällt
  - `fakes/`
    - `InMemoryPersonRepository` - neu
    - `InMemoryProfileStore` - neu
    - `InMemoryWishlistRepository` - `getOwnedBy`, `watchOwnedBy`
- `src/wishlist/infrastructure/`
  - `firestore/`
    - `FirestorePersonRepository.ts` - neu, `PERSONS_COLLECTION = 'persons'`
    - `personDocument.ts` - neu, `{ name }`
    - `wishlistDocument.ts` - `ownerId`
    - `FirestoreWishlistRepository.ts` - Abfrage `where('ownerId', '==', …)`
  - `profile/LocalStorageProfileStore.ts` - neu, Schlüssel `wunschliste.profile`
  - `createWishlistModule.ts` - Personen- und Profil-Use-Cases, neuer Parameter
    `profileStore`
  - `ui/`
    - `currentProfile.svelte.ts` - `CurrentProfile`, `provideCurrentProfile`,
      `useCurrentProfile`
    - `ProfileSetup.svelte` - Tor mit Wahl und Erstellen
    - `ChooseProfilePage.svelte` - Props `back?` und `onchosen`
    - `NameForm.svelte` - umbenannt und verallgemeinert aus `WishlistNameForm.svelte`,
      mit Problem `taken` und Sperre beim Absenden
    - `CreatePersonPage.svelte`, `EditPersonPage.svelte`
    - `PersonSettings.svelte` - Abschnitte „Ich“ und „Personen“
    - `WishlistsPage.svelte` - Gruppen
    - `CreateWishlistPage.svelte`, `EditWishlistPage.svelte`, `WishlistPage.svelte` -
      Besitzerin
    - `wishlistAddresses.ts` - `chooseProfile`, `createPerson`, `editPerson`
    - `personTexts.ts` - Texte, Ansagen und Anzahl-Formulierungen
- `src/app/`
  - `SignedInApp.svelte` - Profil-Tor, Profil beim Abmelden vergessen
  - `settings/SettingsPage.svelte` - `PersonSettings`
- `firestore.rules`, `tests/integration/*`, `e2e/*`, `README.md`

## Logging und Beobachtbarkeit

Keine Änderungen. Schreib- und Lesefehler des neuen Adapters laufen wie bisher über
`onProblem` (`writeRejected`, `loadFailed`) in die Warnzeile im Kopf.

## Umsetzung

### Phase 1: Personen und Profilwahl

Abhängigkeiten: keine

Nach dem Anmelden verlangt die App eine Profilwahl. Personen lassen sich dort anlegen.
Abmelden vergisst das Profil.

**Aufgaben**:

Domäne (test-getrieben):
- [x] `ids.ts`: `PersonId` (Brand) und `personIdOf`
- [x] `Person.ts` mit `Person.create(id, name)`, `Person.restore(id, name)`,
  `rename(name)`, `sortPersons` (Name `de`, dann `compareIds`) und `PersonNotFound`.
  Dazu `Person.test.ts`.
- [x] `personRules.ts`: `ensureNameIsFree(name, persons, renamedPersonId?)`
  - wirft `PersonNameTaken` bei gleichem Namen, ohne Rücksicht auf Groß- und
    Kleinschreibung (`localeCompare(a, b, 'de', { sensitivity: 'accent' }) === 0`)
  - ignoriert die umbenannte Person selbst
  - Tests: „Ben“ gegen „ben“, Umbenennen in den eigenen Namen erlaubt, „Bén“ ist ein
    anderer Name
- [x] `PersonRepository.ts`:
  ```ts
  export interface PersonRepository {
    watchAll(onChange: (persons: readonly Person[]) => void, onFailure: () => void): Unsubscribe;
    get(id: PersonId): Promise<Person | undefined>;
    getAll(): Promise<readonly Person[]>;
    save(person: Person): Promise<void>;
    delete(id: PersonId): Promise<void>;
  }
  ```
- [x] `ProfileStore.ts`:
  ```ts
  export interface ProfileStore {
    current(): PersonId | undefined;
    choose(id: PersonId): void;
    forget(): void;
    watch(onChange: (id: PersonId | undefined) => void): Unsubscribe;
  }
  ```

Anwendung (test-getrieben, mit Fakes):
- [x] `fakes/InMemoryPersonRepository.ts` (auf `ObservableMap`, mit `failWatchers`) und
  `fakes/InMemoryProfileStore.ts`
- [x] `CreatePerson.execute(name): Promise<PersonId>`: `getAll` → `ensureNameIsFree` →
  `save`. Tests: legt an, lehnt einen vergebenen Namen ab.
- [x] `WatchPersons.execute(onChange, onFailure)` meldet sortiert.
- [x] `ChooseProfile.execute(id)`: `get`, wirft `PersonNotFound`, sonst
  `profileStore.choose(id)`.
- [x] `ForgetProfile.execute()` ruft `profileStore.forget()`.
- [x] `WatchCurrentPerson.execute(onChange, onFailure)` verbindet `profileStore.watch`
  und `persons.watchAll`. Gemeldet wird erst, wenn die Personen einmal geliefert haben:
  die Person zur gespeicherten ID, sonst `undefined`. Tests:
  - kein Profil → `undefined`
  - gewähltes Profil → die Person
  - Person gelöscht → `undefined`
  - Profil gewechselt → die neue Person
  - Fehler → `onFailure`
  - Abmelden beendet beide Beobachtungen

Infrastruktur:
- [x] `firestore/personDocument.ts`: `PersonDocument = { name: string }`,
  `toPersonDocument`, `personFromDocument` (ungültig → `undefined`)
- [x] `firestore/FirestorePersonRepository.ts` nach dem Muster von
  `FirestoreWishlistRepository`:
  - `watchAll` über `onSnapshot`. Ein leerer Snapshot mit `metadata.fromCache` wird
    nicht gemeldet (Entscheidung 13).
  - `get` über `cachedDocument`. Das reicht, weil die gewählte Person immer aus der
    beobachteten Liste stammt und damit im Cache liegt.
  - `getAll` über `getDocs` (Server zuerst, Entscheidung 12)
  - `save` und `delete` über `observedWrite`
- [x] `profile/LocalStorageProfileStore.ts`:
  - Der Konstruktor bekommt den Getter
    `storage: () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>` und optional
    ein `EventTarget` für `storage`-Ereignisse (Standard `window`).
  - Schlüssel `wunschliste.profile`
  - Beobachter werden im selben Tab und bei `storage`-Ereignissen für den Schlüssel
    benachrichtigt.
  - Speicherfehler werden wie in `colorSchemeStorage.ts` abgefangen, einschließlich des
    Getter-Aufrufs, mit Warum-Kommentar und MDN-Link. Ohne Speicher gilt das Profil nur
    für die laufende Sitzung. Der Adapter merkt es sich dann im Speicher des Objekts.
- [x] `createWishlistModule.ts`: neuer Parameter `profileStore: ProfileStore`. Neu im
  Modul: `createPerson`, `watchPersons`, `chooseProfile`, `forgetProfile`,
  `watchCurrentPerson`.
- [x] `firestore.rules`: `match /persons/{personId} { allow read, write: if isFamilyAccount(); }`
- [x] `ui/currentProfile.svelte.ts`:
  - `CurrentProfile` mit `state` als diskriminierter Union (Entscheidung 6) und dem
    Getter `me: Person`, der außerhalb von `chosen` wirft
  - `follow()` gibt `Unsubscribe` zurück.
  - `provideCurrentProfile` / `useCurrentProfile` über `createContext`
- [x] `ui/personTexts.ts`:
  - `PERSON_NAME_PROBLEM_MESSAGES` mit `missing`, `tooLong` und `taken: 'Diesen Namen gibt es schon.'`
  - `profileChosenAnnouncement(name)` → `Du bist ${name}.`
  - `PERSON_CREATED_ANNOUNCEMENT = 'Person erstellt.'`
- [x] `ui/WishlistNameForm.svelte` → `ui/NameForm.svelte` (Entscheidung 14):
  - neue Props `fieldId` und `problemMessages: Record<NameProblem | 'taken', string>`
  - `onsubmit(name): Promise<'taken' | void>`. Bei `'taken'` erscheint die Meldung, und
    der Fokus springt ins Feld.
  - Solange `onsubmit` läuft, wird ein weiteres Absenden ignoriert.
  - `CreateWishlistPage` und `EditWishlistPage` umstellen (`fieldId="wishlist-name"`,
    Meldungen aus `NAME_PROBLEM_MESSAGES` ergänzt um `taken`, das dort nie eintritt)
- [x] `ui/personTexts.test.ts`: Texte mit Zahlen oder Namen, beginnend mit
  `profileChosenAnnouncement`
- [x] `ui/ChooseProfilePage.svelte`:
  - h1 „Wer bist du?“, optional `back`
  - Eintragsliste der Personen (`entry-list`, `ChevronRight`)
  - leer: „Noch keine Personen.“
  - Knopf [+ Neue Person] über den Rückruf `oncreate`
  - Tipp → Prop `onchoose(person: Person)`. Die Seite ruft den Use Case nicht selbst
    auf, damit der Aufrufer den Fokus vorher anfordern kann.
- [x] `ui/CreatePersonPage.svelte` mit den Props `oncreated(id: PersonId, name: Name)` und
  `oncancel`, Überschrift „Person erstellen“, Knöpfe [+ Erstellen] und [✕ Abbrechen] in
  der `ActionBar`, Namensfeld fokussiert. `PersonNameTaken` wird zu `'taken'` für
  `NameForm`.
- [x] `ui/ProfileSetup.svelte`:
  - interner Zustand `'choose' | 'create'`, bei jedem Wechsel `requestPageFocus()`
  - Wahl bzw. nach dem Erstellen, in genau dieser Reihenfolge:
    1. `requestPageFocus()`
    2. `announce(profileChosenAnnouncement(name))`
    3. `chooseProfile.execute(id)`
    
    `CurrentProfile` wechselt dann synchron auf `chosen`. Die ursprüngliche Seite
    erscheint und nimmt die Fokusanforderung ab.
- [x] `SignedInApp.svelte`:
  - `profileStore: new LocalStorageProfileStore(() => localStorage)` übergeben
  - `CurrentProfile` bereitstellen und `$effect(() => profile.follow())`
  - Verzweigung wie im Zielbild. `MainNavigation` erscheint nur bei `chosen`,
    `OfflineNotice` und `ProblemNotice` in allen Zuständen.
  - `failed`: `<p>{LOAD_FAILED_MESSAGE}</p>` und `<FamilyAccessSettings />`, damit
    Abmelden möglich bleibt
  - `before` in `access.onSignOut` ruft nach `closePagesAndDatabase()`
    `forgetProfile.execute()` auf.
- [x] `README.md`:
  - „Firebase einrichten“ bzw. neuer Unterabschnitt „Umstieg auf Personen (WL-005)“:
    Zuerst `npx firebase deploy --only firestore:rules`, **erst dann** auf `main`
    pushen (Entscheidung 15). Danach die alten Dokumente in `wishlists` und `wishes`
    in der Konsole löschen.
  - „Daten“: Sammlung `persons` und `localStorage`-Schlüssel `wunschliste.profile`

E2E:
- [x] `e2e/emulators.ts`:
  - `PersonRecord = { id: string; name: string }`
  - `SeedData.persons`, `seed` schreibt `persons`
  - `storedPersons()`
- [x] `e2e/fixtures.ts`:
  - Option `profile: 'Anna' | null`, Standard `'Anna'` (Entscheidung 11)
  - `freshEmulators` seedet `{ id: 'anna', name: 'Anna' }`, wenn `profile` nicht `null`
    ist
  - `signIn(page, account = FAMILY, profile: 'Anna' | null = 'Anna')` wählt nach dem
    Anmelden die Person auf „Wer bist du?“ und wartet auf das h1 „Wunschlisten“, bei
    `null` auf „Wer bist du?“
  - Tests, die weitere Personen brauchen, seeden sie zusätzlich (etwa Ben). `anna`
    kommt immer aus der Fixture.
- [x] Bestehende Specs an das Tor anpassen:
  - `e2e/access.spec.ts:60-72`: nutzt `submitSignIn` und erwartet sofort das h1
    „Einstellungen“. Neu: nach dem Anmelden erscheint das Tor, dann Anna wählen, dann
    liegt der Fokus auf „Einstellungen“. Die übrigen Fälle mit `signedIn: false` geben
    das Profil an `signIn` weiter.
  - `e2e/problems.spec.ts:12-45`: Das Konto STRANGER darf `persons` nicht lesen und
    landet im Zustand `failed`. Die drei Tests werden ersetzt durch: STRANGER sieht „Die
    Daten konnten nicht geladen werden.“, keine Hauptnavigation, [Abmelden] führt zur
    Anmeldeseite. Die Warnzeile für abgelehnte Schreibzugriffe bleibt durch die
    Integrationstests der Adapter (`writeRejected`) abgedeckt.
  - `e2e/accessibility.spec.ts:213-247` („overview offline with problems“): statt der
    Übersicht wird der Zustand `failed` mit Offline-Hinweis geprüft.
  - `e2e/sync.spec.ts`, `e2e/offline.spec.ts` und weitere Fundstellen von
    `signIn(`/`submitSignIn(` (`grep -n "signIn(" e2e`)
- [x] neu `e2e/profile.spec.ts`:
  - ohne Personen: leerer Zustand, [+ Neue Person] → „Person erstellen“ mit fokussiertem
    Feld; Erstellen → ursprüngliche Seite, Ansage „Du bist Lea.“, Fokus auf h1, keine
    Navigation vor der Wahl
  - Deep-Link `#/einstellungen` vor der Wahl → nach der Wahl die Einstellungen
  - vergebener Name („anna“) → „Diesen Namen gibt es schon.“, Feld fokussiert
  - „Abbrechen“ in „Person erstellen“ → zurück zu „Wer bist du?“
  - Neuladen behält das Profil.
  - Abmelden und erneut Anmelden → „Wer bist du?“ erscheint wieder,
    `localStorage['wunschliste.profile']` ist `null`.
  - Doppeltipp auf [Erstellen] legt nur eine Person an (`storedPersons()` hat genau
    einen Eintrag „Lea“).
  - Der Profilwechsel in einem Tab wirkt ohne Neuladen auch im anderen Tab. Das geht
    erst ab Phase 3 über die Oberfläche. Hier wird es über
    `localStorage.removeItem('wunschliste.profile')` im zweiten Tab geprüft: Der erste
    Tab zeigt „Wer bist du?“.
- [x] `e2e/accessibility.spec.ts`: „Wer bist du?“ leer und gefüllt, „Person erstellen“
  mit Fehler, jeweils in allen drei Farbschemata

**Automatisierte Verifikation**:
- [x] `npm run test:unit` grün, mit den neuen Tests für Domäne und Anwendung
- [x] Neuer `tests/integration/FirestorePersonRepository.integration.test.ts` grün:
  - Sync auf ein zweites Gerät
  - `watchAll` nach Speichern und Löschen
  - `getAll` liefert auf einem frischen Gerät (leerer Cache) die Personen vom Server
  - ungültige Dokumente werden übersprungen
  - Speichern ohne Warten auf den Server
  - Fehler ohne Berechtigung
  - Ein leerer Cache-Snapshot wird nicht als leere Liste gemeldet
- [x] `tests/integration/firestoreRules.integration.test.ts`: `persons/c` in allen drei
  `it.each`
- [x] Neuer `src/wishlist/infrastructure/profile/LocalStorageProfileStore.test.ts` grün,
  mit Map-basiertem Speicher und eigenem `EventTarget`:
  - `choose` → `current`
  - `forget`
  - Beobachter werden benachrichtigt, auch bei einem `storage`-Ereignis für den
    Schlüssel, bei anderen Schlüsseln nicht
  - Ein werfender Getter oder Speicher lässt die App mit Sitzungsprofil weiterlaufen.
- [x] `npm run test:integration` grün (Adapter- und Regeltests)
- [x] `npm run lint` und `npm test` grün (Architektur, Unit, Integration und E2E inklusive aller bestehenden Specs)

**Manuelle Verifikation**:
- [x] Auf dem iPhone mit VoiceOver nach dem Ausrollen der Regeln:
  - „Wer bist du?“ erscheint nach dem Anmelden.
  - Person anlegen und wählen: Die Ansage „Du bist …“ kommt, der Fokus liegt auf
    „Wunschlisten“.
  - Nach einem Neustart der App kommt keine erneute Abfrage.

### Phase 2: Besitzerin und gruppierte Übersicht

Abhängigkeiten: Phase 1

Jede Liste gehört einer Person. Die Übersicht gruppiert nach Besitzerin, und die
Listenseite nennt sie.

**Aufgaben**:

Domäne (test-getrieben):
- [x] `Wishlist.ts`: `ownerId: PersonId`
  - `create(id, name, ownerId)`, `restore(id, name, ownerId)`
  - `rename` behält `ownerId`
  - Tests anpassen, neuer Test: Umbenennen behält die Besitzerin
- [x] `Person.ts`: `personsMeFirst(persons, me)` → eigene Person zuerst, Rest wie
  `sortPersons`. Mit Test.
- [x] `wishlistOverview.ts`:
  ```ts
  export type WishlistGroup = {
    owner: Person | undefined;
    isMe: boolean;
    wishlists: readonly Wishlist[];
  };
  export function groupWishlistsByOwner(
    wishlists: readonly Wishlist[],
    persons: readonly Person[],
    me: PersonId,
  ): WishlistGroup[];
  ```
  Tests:
  - eigene Gruppe zuerst
  - Rest alphabetisch
  - Personen ohne Listen fehlen
  - Listen innerhalb der Gruppe per `sortWishlists`
  - Listen ohne bekannte Besitzerin in einer Gruppe `owner: undefined` am Ende
  - keine Listen → `[]`
- [x] `WishlistRepository.ts`: `getOwnedBy(ownerId)` und
  `watchOwnedBy(ownerId, onChange, onFailure)`. Der Fake bekommt beide Methoden.

Anwendung (test-getrieben):
- [x] `CreateWishlist.execute(name, ownerId)`: wirft `PersonNotFound`, wenn es die
  Person nicht gibt. Der Konstruktor bekommt `PersonRepository`.
- [x] `WatchWishlistOverview.execute(me, onChange, onFailure)`
  - beobachtet Wunschlisten und Personen und meldet erst nach beiden
  - ein Fehler in einer der beiden Beobachtungen → `onFailure`
  - die Rückgabe beendet beide
- [x] `WatchPerson.execute(id, onChange, onFailure)` für „für Anna“ (über `watchAll` und
  die Suche nach der ID)
- [x] `WatchWishlists` samt Test entfernen
- [x] Auf die neuen Signaturen von `Wishlist.create`/`restore` und
  `CreateWishlist` umstellen:
  - `src/wishlist/domain/Wishlist.test.ts`
  - `src/wishlist/application/CreateWishlist.test.ts` (Konstruktor mit
    `PersonRepository`, `execute(name, ownerId)`, neuer Test für `PersonNotFound`)
  - `CreateWish.test.ts`, `DeleteWishlist.test.ts`, `RenameWishlist.test.ts`,
    `WatchWishlist.test.ts` und alle weiteren Fundstellen von `Wishlist.create(` in
    `src` und `tests`

Infrastruktur:
- [x] `wishlistDocument.ts`:
  - `WishlistDocument = { name: string; ownerId: string }`
  - `ownerId` muss eine nicht leere Zeichenkette sein, sonst `undefined`
- [x] `FirestoreWishlistRepository.ts`: `getOwnedBy` (`getDocs` einer
  `where('ownerId', '==', id)`-Abfrage, Server zuerst, Entscheidung 12) und
  `watchOwnedBy` (`onSnapshot` derselben Abfrage)
- [x] `fakes/InMemoryWishlistRepository.ts`: `getOwnedBy`, `watchOwnedBy`
- [x] `createWishlistModule.ts`: `watchWishlistOverview` und `watchPerson` neu,
  `watchWishlists` entfernen, `createWishlist` bekommt die Personen
- [x] `ui/personTexts.ts` mit Tests in `ui/personTexts.test.ts`:
  - `ownerGroupHeading(group)` → „Anna (ich)“, „Ben“, „Unbekannt“
  - `ownerLine(owner, isMe)` → „für mich“ / „für Anna“
  - `ownerChoiceLabel(person, isMe)` → „Anna (ich)“ / „Ben“
  - `ownedByLabel(name)` → „Für: Anna“
- [x] `WishlistsPage.svelte`:
  - `watchWishlists` durch `watchWishlistOverview.execute(me.id, …)` ersetzen
  - je Gruppe ein `<section aria-labelledby>` mit h2 und `entry-list`
  - leerer Zustand unverändert
  - `me` aus `useCurrentProfile().me`
- [x] `CreateWishlistPage.svelte`:
  - `ChoiceGroup` mit Legende „Für“ und `name="wishlist-owner"` im Snippet `extra`
    von `NameForm`
  - Optionen aus `watchPersons` + `personsMeFirst`, vorausgewählt `me.id`
  - `createWishlist.execute(name, ownerId)`
- [x] `EditWishlistPage.svelte`: Absatz „Für: Anna“ vor dem Löschknopf. Bei unbekannter
  Besitzerin entfällt der Absatz.
- [x] `WishlistPage.svelte`: unter dem `PageHeader` ein Absatz „für Anna“ bzw. „für
  mich“ über `watchPerson`. Bei unbekannter Besitzerin entfällt die Zeile.
- [x] `README.md` „Daten“: Feld `ownerId` erwähnen

E2E:
- [x] `e2e/emulators.ts`: `WishlistRecord` bekommt `ownerId: string`. Alle Seeds bekommen
  `ownerId: 'anna'`, sonst werden die Listen unsichtbar. Die Typprüfung findet sie:
  - `access.spec.ts`, `accessibility.spec.ts`, `backLinks.spec.ts`
  - `editing.spec.ts`, `gifting.spec.ts`, `layout.spec.ts`
  - `navigation.spec.ts`, `offline.spec.ts`, `problems.spec.ts`
  - `wishes.spec.ts`
- [x] `tests/integration/FirestoreWishlistRepository.integration.test.ts`:
  `wishlistNamed` mit `ownerId`
- [x] `e2e/wishlists.spec.ts`:
  - „lists wishlists alphabetically“ → gruppiert: mit geseedeter Person Ben und Listen
    für Anna, Ben und die unbekannte `ownerId: 'gone'` prüft der Test die h2-Reihenfolge
    `['Anna (ich)', 'Ben', 'Unbekannt']` und die Einträge je Gruppe
  - Person ohne Listen hat kein h2
  - Erstellen mit „Für: Ben“ → Liste steht unter „Ben“, die Listenseite zeigt „für Ben“
  - Vorauswahl „Anna (ich)“ ist `checked`
  - eigene Liste zeigt „für mich“
  - Die Bearbeiten-Seite zeigt „Für: Anna“ und hat keine Radiogruppe.
- [x] neuer Test: Ein Dokument ohne `ownerId` taucht nicht auf.
- [x] `e2e/accessibility.spec.ts`: gruppierte Übersicht und „Wunschliste erstellen“ mit
  Radiogruppe

**Automatisierte Verifikation**:
- [x] `npm run test:unit` grün
- [x] `tests/integration/FirestoreWishlistRepository.integration.test.ts` angepasst und
  grün:
  - `ownerId` wird gespeichert und gelesen
  - Dokument ohne `ownerId` bzw. mit leerer `ownerId` wird übersprungen
  - `getOwnedBy` und `watchOwnedBy` liefern nur die Listen der Person
- [x] `npm run lint` und `npm test` grün (Architektur, Unit, Integration, E2E)

**Manuelle Verifikation**:
- [x] Auf dem iPhone mit VoiceOver:
  - Im Rotor „Überschriften“ springt man in der Übersicht von Person zu Person.
  - Die Radiogruppe „Für“ wird als solche angesagt, mit „Anna (ich), ausgewählt“.
  - Auf der Listenseite wird „für mich“ vorgelesen.

### Phase 3: Personen in den Einstellungen

Abhängigkeiten: Phase 2

Das Profil lässt sich wechseln, und Personen lassen sich anlegen, umbenennen und
geschützt löschen.

**Aufgaben**:

Domäne (test-getrieben):
- [x] `personRules.ts`: `ensurePersonIsDeletable(personId, ownedWishlists)` wirft
  `PersonOwnsWishlists` (mit `wishlistCount`), sobald die Liste nicht leer ist. Mit
  Test.

Anwendung (test-getrieben):
- [x] `RenamePerson.execute(id, name)`:
  - `get` → `PersonNotFound`
  - `getAll` → `ensureNameIsFree(name, persons, id)`
  - `save(person.rename(name))`
  - Tests: umbenennen, vergebener Name, gleicher Name in anderer Schreibweise bei
    derselben Person
- [x] `DeletePerson.execute(id)`: `wishlists.getOwnedBy(id)` →
  `ensurePersonIsDeletable` → `persons.delete(id)`. Tests: löscht ohne Listen, lehnt mit
  Listen ab und lässt die Person bestehen.
- [x] `WatchWishlistsOwnedBy.execute(ownerId, onChange, onFailure)`
- „Person bearbeiten“ beobachtet die Person über `WatchPerson` aus Phase 2. Ein
  zusätzlicher Use Case ist nicht nötig.

Infrastruktur:
- [x] `createWishlistModule.ts`: `renamePerson`, `deletePerson`, `watchWishlistsOwnedBy`
- [x] `wishlistAddresses.ts`:
  - `{ page: 'chooseProfile' }` ↔ `#/wer-bist-du`
  - `{ page: 'createPerson' }` ↔ `#/person/neu`
  - `{ page: 'editPerson'; personId }` ↔ `#/person/<id>/bearbeiten`
  - Tests in `wishlistAddresses.test.ts` und `src/app/router/routes.test.ts`, damit
    `mainPageOf` für die drei Seiten `undefined` liefert
- [x] `WishlistPages.svelte`: Die drei neuen Adressen bekommen eigene `{:else if}`-Zweige
  **vor** dem abschließenden `{:else}` (`EditWishPage`), sonst schlägt die Typprüfung
  bei `address.wishId` fehl. Neuer Prop `settingsHash: string`. `wishlist` darf `app`
  nicht importieren, deshalb reicht `SignedInApp` `hashFor({ page: 'settings' })` hinein.
  Die drei neuen Seiten:
  - `ChooseProfilePage` mit `back={{ label: 'Einstellungen', hash: settingsHash }}`,
    bei `onchoose`: `chooseProfile.execute(id)`, `navigateTo(settingsHash)` und die
    Ansage. Den Fokus holt der Seitenwechsel über den Router.
  - `CreatePersonPage` → nach dem Erstellen `navigateTo(settingsHash)` und
    „Person erstellt.“, Abbrechen → Einstellungen
  - `EditPersonPage`
  - Die „Wer bist du?“-Liste markiert die aktuelle Person nicht extra. Ein Tipp auf
    sie wählt sie erneut und führt zurück zu den Einstellungen.
- [x] `ui/EditPersonPage.svelte`:
  - Überschrift „Person bearbeiten“, `back` → Einstellungen
  - `NameForm` mit `initialName` und `fieldId="person-name"`
  - Speichern: `renamePerson`, danach Einstellungen und „Gespeichert.“
  - `PersonNameTaken` → `'taken'` → Feldmeldung
  - `isDeleting` wie in `EditWishlistPage`: Während und nach dem Löschen erscheint kein
    „Diese Person gibt es nicht mehr.“.
  - Snippet `extra`:
    - bei 0 eigenen Listen [🗑 Person löschen] + `ConfirmDialog` („Person löschen?“,
      `„Oma“ wird gelöscht.`, Bestätigen „Löschen“)
    - sonst der Satz aus `personTexts.ownedWishlistsHint(name, count)`
  - Nach dem Löschen: `navigateTo(settingsHash)` und die Ansage
    `Person „Oma“ gelöscht.`
  - `PersonOwnsWishlists` (zwischendurch hat jemand eine Liste angelegt): Der Dialog
    schließt, und der Hinweissatz erscheint durch die laufende Beobachtung. Es gibt
    keine zusätzliche Meldung.
  - Ist es die eigene Person, schaltet `CurrentProfile` auf `missing`, und das Tor
    erscheint. Vor dem Löschen ruft die Seite `requestPageFocus()` auf, damit der
    Fokus auf „Wer bist du?“ landet. Die Ansage bleibt `Person „Anna“ gelöscht.`, der
    Hash zeigt auf die Einstellungen. Nach der neuen Wahl erscheinen die Einstellungen.
  - Unbekannte ID → `NotFound` „Diese Person gibt es nicht mehr.“
- [x] `ui/PersonSettings.svelte`:
  - `<section aria-labelledby>` „Ich“ mit „Ich bin Anna“ und dem Knopf [⇄ Wechseln]
    (Lucide `ArrowLeftRight`)
  - `<section>` „Personen“ mit h2 und icon-only [+] (`aria-label="Person erstellen"`),
    Eintragsliste aus `watchPersons` → `editPerson`
  - Stil wie `FamilyAccessSettings` (h2 1.25em)
- [x] `src/app/settings/SettingsPage.svelte`: `<PersonSettings />` zwischen
  `ColorSchemeSettings` und `FamilyAccessSettings`. `PersonSettings` führt nur zu
  Adressen aus `wishlistAddresses.ts` und braucht keinen Einstellungs-Hash.
- [x] `src/app/SignedInApp.svelte`: `<WishlistPages address={…} settingsHash={hashFor({ page: 'settings' })} />`
- [x] `ui/personTexts.ts`:
  - `ownedWishlistsHint(name, count)` → „Oma gehören noch 1 Wunschliste. Sie kann erst
    gelöscht werden, wenn sie keine mehr hat.“ bzw. „… 2 Wunschlisten. …“. Mit Test in
    `personTexts.test.ts`.
  - `personDeletionMessage`, `personDeletedAnnouncement`
- [x] `README.md`: kurz in „Daten“ oder im Konzeptverweis ergänzen, dass Personen in den
  Einstellungen verwaltet werden

E2E:
- [x] neu `e2e/persons.spec.ts`:
  - Einstellungen zeigen „Ich bin Anna“.
  - „Wechseln“ → `#/wer-bist-du` mit „Zurück zu Einstellungen“ → Ben wählen → zurück in
    den Einstellungen, „Ich bin Ben“, Ansage „Du bist Ben.“
  - [+] → Person erstellen → zurück zu den Einstellungen, neue Person in der Liste,
    Profil unverändert
  - umbenennen, vergebener Name → Feldmeldung
  - Person mit Liste: Hinweissatz, kein Löschknopf
  - Person ohne Liste löschen → Dialog → aus der Liste verschwunden, Ansage
  - eigene Person löschen → „Wer bist du?“ mit Fokus auf dem h1, nach der Wahl die
    Einstellungen
  - eigene Person wird in einem zweiten Tab gelöscht → der erste Tab zeigt „Wer bist
    du?“
  - `#/person/gibtsnicht/bearbeiten` → „Diese Person gibt es nicht mehr.“
- [x] `e2e/accessibility.spec.ts`: Einstellungen mit Personen, „Person bearbeiten“ mit
  Löschdialog und mit Hinweissatz, `#/wer-bist-du` mit Zurück-Knopf

**Automatisierte Verifikation**:
- [x] `npm run test:unit` grün, mit den neuen Tests für Domäne, Anwendung, Adressen und
  Texte
- [x] `npm run lint` und `npm test` grün (Architektur, Unit, Integration, E2E)

**Manuelle Verifikation**:
- [x] Auf dem iPhone mit VoiceOver:
  - Profil in den Einstellungen wechseln: Ansage „Du bist …“, Fokus auf „Einstellungen“
  - Eine Person mit Liste zeigt den Hinweis statt des Löschknopfs.
- [x] Auf zwei Geräten: Eine Person wird auf Gerät A gelöscht, die Gerät B als Profil
  nutzt. B zeigt „Wer bist du?“.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1, Entscheidung 13: `FirestorePersonRepository.watchAll` beobachtet mit
  `includeMetadataChanges: true`. Ohne das meldet Firestore keinen neuen Snapshot, wenn
  der Server eine leere Sammlung nur bestätigt (reine Metadatenänderung `fromCache` →
  `false`). Nach dem verworfenen leeren Cache-Snapshot bliebe die App sonst dauerhaft in
  `loading`, etwa nach einem Neuladen, bevor die erste Person angelegt ist. Der
  Integrationstest „reports an empty cache once the server confirmed it“ sichert das ab.
- Phase 1, Entscheidung 14: `NameForm` hat keine Prop `problemMessages`. Wunschlisten und
  Personen brauchen dieselben Meldungen, deshalb nutzt das Formular
  `NAME_FORM_PROBLEM_MESSAGES` (`wishTexts.ts`, `NameProblem` plus `taken`). Dafür hat es
  eine optionale Prop `back` für „Person bearbeiten“. `personTexts.ts` enthält in Phase 1
  nur die Ansagen.
- Phase 1, E2E: `fixtures.ts` exportiert neben `signIn` auch `submitSignIn` (ohne
  Navigation, damit Deep-Links erhalten bleiben) und `chooseProfile`. Das Konto STRANGER
  landet im Zustand `failed`. Die Seite zeigt dort das h1 „Laden fehlgeschlagen“.
- Phase 2: `WatchWishlistOverview` meldet über zwei Beobachtungen. Die Testhilfe
  `wishlistNamed` (`application/fakes`) setzt standardmäßig die Besitzerin `anna`. Für
  Dokumente ohne gültige Form gibt es in `e2e/emulators.ts` `seedDocument`.
- Phase 3, Fokus nach dem Löschen der eigenen Person: Der Plan sah vor, dass
  `EditPersonPage` vor dem Löschen `requestPageFocus()` aufruft. Das ist ein Wettlauf. Das
  Löschen wartet nicht auf den Server, und `navigateTo(settingsHash)` kann vor dem
  Schnappschuss ankommen. Dann nimmt die Einstellungsseite die Anforderung ab, und das
  Tor erscheint ohne Fokus. Stattdessen fordert `ProfileSetup` beim Erscheinen immer
  selbst den Fokus an. Das Tor ist stets ein Kontextwechsel (Anmelden, eigene Person
  gelöscht, Profil in einem anderen Tab vergessen).

## Verweise

- Konzept: `docs/agents/research/2026-09-28-wunschliste-konzept.md` (Abschnitte
  „Zugang und Personen“, „Wunschlisten“, „Seiten“, „Umsetzungsreihenfolge“)
- Vorgänger: `docs/agents/plans/2026-09-28-firestore-anmeldung-offline-sync.md` (WL-004,
  Muster für Adapter, Cache-first-Lesen, `observedWrite`, Regeltests)
- Offener Punkt: `docs/notes.txt:73`
- Architektur: `.claude/skills/architecture/SKILL.md`
- `localStorage`-Ausnahmen:
  <https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage#exceptions>
