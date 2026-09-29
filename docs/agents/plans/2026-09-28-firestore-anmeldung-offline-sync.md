---
date: 2026-09-28T14:04:03+00:00
git_commit: 1290efbd937e1b15e152102a8149749b6c3fa901
branch: main
story: WL-004
topic: "Familienzugang, Firestore-Adapter, Sync und Offline"
tags: [plan, firebase, firestore, auth, offline, sync, emulator, ci, app-shell, wishlist-infrastructure, accessibility]
status: ready
---

# PLAN: WL-004 — Familienzugang, Firestore, Sync und Offline

Dieser Plan setzt Schritt 3 aus `docs/agents/research/2026-09-28-wunschliste-konzept.md` um:

- Die Daten wandern von `localStorage` nach Firebase Firestore und gleichen sich live
  zwischen den Geräten ab.
- Ein gemeinsames Familienkonto (E-Mail und Passwort) schützt den Zugang.
- Offline bleibt die App bedienbar.

Personen, Besitzer und Geheim-Einträge sind nicht Teil dieses Plans, sie folgen in den
Schritten 4 und 5.

## Akzeptanzkriterien

**Anmelden und Abmelden**
- Ohne Anmeldung zeigt die App nur die Anmeldeseite. Dazu gehören das h1 „Anmelden“, die
  Felder „E-Mail“ und „Passwort“ sowie [→ Anmelden] unten fixiert, aber keine
  Navigation.
- Nach erfolgreicher Anmeldung erscheint die ursprünglich aufgerufene Seite, der Fokus
  liegt auf ihrem h1.
- Falsche Zugangsdaten, fehlendes Netz und zu viele Versuche ergeben je einen eigenen
  deutschen Fehlertext. Leere Felder werden vor dem Absenden am Feld bemängelt.
- Die Felder tragen `autocomplete="username"` und `autocomplete="current-password"`.
- Die Sitzung überdauert Neustarts und funktioniert auch bei einem Start ohne Netz.
- Die Einstellungen zeigen unter „Familienzugang“ den Satz „Angemeldet als <E-Mail>“ und
  den Knopf [⎋ Abmelden] mit Rückfrage. Abmelden beendet Firestore, löscht den
  Offline-Cache des Geräts und zeigt die Anmeldeseite.
- Eine erneute Anmeldung zeigt die Daten wieder.

**Daten und Sicherheitsregeln**
- Wunschlisten und Wünsche liegen in Firestore unter `wishlists/{id}` und `wishes/{id}`.
  Leere Felder werden weggelassen.
- Änderungen auf einem Gerät erscheinen auf einem anderen ohne Neuladen.
- `firestore.rules` erlaubt Lesen und Schreiben nur der UID des Familienkontos.
  Regeltests belegen, was erlaubt ist und was nicht:
  - Familienkonto: ja
  - fremdes Konto: nein
  - ohne Anmeldung: nein
  - andere Pfade: nein

**Offline und Fehler**
- Ohne Netz navigieren Erstellen, Speichern, Löschen und Schenken sofort weiter. Die
  Änderung ist sofort sichtbar und wird später abgeglichen.
- Ohne Netz steht im fixierten Kopf „Offline – Änderungen werden später abgeglichen.“
  (`role="status"`, einmal angesagt). Kehrt das Netz zurück, verschwindet der Hinweis
  ohne Ansage.
- Lehnt der Server eine Änderung ab oder scheitert ein Listener, erscheint bis zum nächsten
  Seitenwechsel eine Warnzeile im Kopf (`role="alert"`). Sie lautet „Eine Änderung konnte
  nicht gespeichert werden.“ bzw. „Die Daten konnten nicht geladen werden.“.
- Eine Seite, deren Daten nicht laden, zeigt „Die Daten konnten nicht geladen werden.“
  statt ewig leer zu bleiben.

**Aufräumen, Builds und Tests**
- Die alten Schlüssel `wunschliste.wishlists` und `wunschliste.wishes` werden beim Start
  aus `localStorage` entfernt. Den localStorage-Adapter gibt es nicht mehr.
- Ein Produktionsbuild bricht mit klarer Meldung ab, wenn eine `VITE_FIREBASE_*`-Variable
  fehlt oder `VITE_FIREBASE_EMULATORS=true` gesetzt ist. Veröffentlicht wird nur der
  Produktionsbuild.
- Alle E2E-Tests laufen gegen die Firebase-Emulatoren (Projekt `demo-wunschliste`), CI
  mit Java 21.
- axe meldet in allen drei Farbschemata keine Verstöße auf diesen Seiten:
  - Anmeldeseite, auch mit Fehler
  - Einstellungen samt Abmelde-Dialog
  - einer Seite mit Offline-Hinweis und Warnzeile
- Der Architekturtest verbietet `firebase` in `domain`, `application` und `shared`.
- Die README erklärt die Firebase-Einrichtung Schritt für Schritt.

## Wesentliche Entscheidungen und Abwägungen

1. **Anmeldung als Vollbild-Tor in `src/app/access/`:** Es gibt keinen eigenen
   fachlichen Kontext und keine eigene Adresse.
   - Warum:
     - Die Anmeldung hat kaum Fachlogik, und ein vorsorglicher Kontext widerspräche dem
       Skill `architecture`.
     - Ohne eigene Adresse bleibt der Hash stehen, und nach dem Anmelden erscheint die
       ursprünglich aufgerufene Seite.
   - Auswirkung: `App.svelte` unterscheidet `checking` (leer), `signedOut`
     (`SignInPage`) und `signedIn` (heutige App). Das Wunschlisten-Modul entsteht erst im
     Zweig `signedIn`, sonst scheiterten die Listener an den Regeln.
2. **Zugriffsregel über die UID:** `request.auth.uid == '<UID>'` in `firestore.rules`.
   - Warum: Die Web-Konfiguration samt API-Key ist öffentlich. Jeder kann sich damit per
     `createUserWithEmailAndPassword` registrieren, `request.auth != null` reicht also
     nicht aus.
   - Auswirkung:
     - Die UID ist kein Geheimnis und steht im öffentlichen Repository. Bis zur
       Einrichtung steht dort der Platzhalter `FAMILY_ACCOUNT_UID`.
     - Tests lesen die UID aus `firestore.rules` und legen im Auth-Emulator ein Konto mit
       genau dieser UID an. So gibt es nur eine Quelle.
3. **Schreiben ohne Warten auf den Server:** `save`, `delete` und `deleteAllOf` lösen
   auf, sobald Firestore die Änderung lokal übernommen hat. `get` liest zuerst aus dem
   Cache.
   - Warum:
     - `setDoc`, `deleteDoc` und `writeBatch().commit()` lösen erst nach der Bestätigung
       durch den Server auf. Offline hängen sie, und die Seiten warten heute auf sie.
     - `getDoc` wartet bei unklarem Netz bis zu 10 s.
   - Auswirkung:
     - Das Promise des SDK wird nicht zurückgegeben, sondern nur mit `.catch` beobachtet.
       Eine Ablehnung meldet der Adapter über den eingespeisten Rückruf
       `onProblem('writeRejected')`.
     - `get` nutzt `getDocFromCache` und nur bei einem Fehlschlag `getDoc`.
     - Die Reihenfolge bleibt erhalten, weil das SDK Schreiben und Beobachten in einer
       gemeinsamen Warteschlange abarbeitet. Die nächste Seite sieht die Änderung sofort.
     - Bekannte Grenzen, bewusst hingenommen:
       - `EditWish` und `GiftWish` schreiben das ganze Dokument aus dem Cache-Stand. Eine
         gleichzeitige Änderung auf einem anderen Gerät kann so überschrieben werden
         („letzte Änderung gewinnt“, wie im Konzept).
       - Offline scheitert `get` für ein Dokument, das nicht im Cache liegt, erst nach
         bis zu 10 s. Praktisch kommt das nicht vor, weil jede Aktion von einer Seite
         ausgeht, die das Dokument beobachtet.
4. **Zwei Sammlungen auf oberster Ebene** (`wishlists`, `wishes`) mit denselben Feldern
   wie die bisherigen Records. Die IDs kommen weiter aus `IdGenerator`.
   - Warum:
     - `#/wunsch/<id>` braucht direkten Zugriff ohne Collection-Group-Abfrage.
     - `where('wishlistId', '==', …)` braucht keinen eigenen Index.
   - Auswirkung: `deleteAllOf` liest die Wünsche per `getDocsFromCache` und löscht sie
     in einem `writeBatch`. Das erfasst nur die Wünsche, die dieses Gerät im Cache hat.
     Das reicht, weil nur `EditWishlistPage` löscht und die Wünsche der Liste dort ohnehin
     beobachtet. Legt ein anderes Gerät im selben Moment einen Wunsch an, bleibt er als
     unsichtbare Waise liegen. Das ist hingenommen.
5. **Offline-Erkennung über `navigator.onLine`** mit den Ereignissen `online` und
   `offline`. Der Hinweis steht im fixierten Kopf unter der Navigation.
   - Warum:
     - Das Signal ist sofort da, Firestore hört ebenfalls darauf. Bei `online` setzt das
       SDK allerdings nur die Wartezeit für den nächsten Verbindungsversuch zurück. Tests,
       die auf den Abgleich nach dem Wiederverbinden warten, brauchen deshalb großzügige
       Timeouts (15 s).
     - In Playwright lässt sich das mit `context.setOffline` prüfen.
     - `hasPendingWrites` wäre genauer, bräuchte aber zusätzliche Listener mit
       Metadaten.
6. **Fehler beim Beobachten gehen bis auf die Seite:** Die beobachtenden Ports bekommen
   einen dritten Parameter `onFailure: () => void`.
   - Warum: Ohne ihn bliebe eine Seite bei `permission-denied` für immer im Zustand
     `loading`, also leer.
   - Auswirkung:
     - Die Ports in `domain`, die Fakes, die `Watch…`-Use-Cases und `Watched` (neuer
       Zustand `failed`) ändern sich.
     - Zusätzlich meldet der Adapter `onProblem('loadFailed')` für die Warnzeile.
     - Die Warnzeile sammelt verschiedene Probleme als je eine Zeile, doppelte nur
       einmal. Nach dem Erstellen einer Liste können etwa `writeRejected` und
       `loadFailed` der neuen Seite in beliebiger Reihenfolge eintreffen, und keine
       Meldung darf die andere verdrängen.
7. **E2E-Tests vollständig gegen die Emulatoren,** seriell mit `workers: 1`.
   - Warum:
     - Getestet wird, was ausgeliefert wird: Regeln, Sync, Offline.
     - Die Fakes in `application/fakes/` decken die schnelle Seite schon ab.
   - Auswirkung:
     - Daten werden über `@firebase/rules-unit-testing` gesetzt und gelesen (Regeln
       umgangen), Konten über die REST-Schnittstelle des Auth-Emulators angelegt.
     - Eine Fixture setzt vor jedem Test beide Emulatoren zurück und meldet das
       Familienkonto an.
     - Die Laufzeit steigt.
8. **Getrennte Builds:**
   - Produktion: `vite build` nach `dist/`.
   - E2E: `vite build --mode e2e` mit der eingecheckten `.env.e2e` (Projekt
     `demo-wunschliste`, Schein-Schlüssel, Emulatoren an) nach `dist-e2e/`.
   - Warum:
     - Heute baut Playwright nach `dist/`, und genau das wird veröffentlicht.
     - `demo-`-Projekte existieren nur im Emulator. Tests brauchen deshalb keine
       Geheimnisse, und Pull Requests laufen durch.
   - Auswirkung: `vite.config.ts` prüft die Umgebung beim Produktionsbuild
     (Fail-fast).
9. **Emulator-Tests als eigenes Skript `test:integration`.** `test:unit` bleibt schnell
   und ohne Java.
   - Auswirkung:
     - Vitest bekommt die Projekte `unit` und `integration`.
     - Die Integrationstests liegen unter `tests/integration/` und heißen
       `*.integration.test.ts`. Dort gelten die Node-Typen aus `tsconfig.node.json`,
       die `readFileSync` und `@firebase/rules-unit-testing` brauchen. Unter `src/`
       prüft `svelte-check` mit `tsconfig.app.json`, und die kennt keine Node-Typen.
     - `npm test` wird zu `test:architecture`, dann `test:unit`, `test:integration` und
       `test:e2e`.
10. **Abmelden löscht den Cache, so gut es geht:** Die Reihenfolge ist
    `terminate(firestore)`, dann `signOut(auth)`, dann `clearIndexedDbPersistence` mit
    einem Zeitlimit von 3 s.
    - Warum:
      - „Abmelden“ heißt hier „dieses Gerät gehört nicht mehr dazu“.
      - `clearIndexedDbPersistence` löscht die Datenbank per `indexedDB.deleteDatabase`,
        ohne `onblocked` zu behandeln (`@firebase/firestore` 12.19). Hält ein anderer Tab
        sie offen, würde das Promise nie fertig.
      - Deshalb kommt `signOut(auth)` vorher und in jedem Fall (`finally`). Die anderen
        Tabs erfahren über die Auth-Persistenz davon, hängen `SignedInApp` aus und geben
        die Datenbank frei.
    - Auswirkung:
      - Jede Anmeldung öffnet eine neue Firestore-Instanz. `terminate` ist erneut
        aufrufbar, danach funktioniert `initializeFirestore` wieder
        (`_removeServiceInstance`).
      - `SignedInApp` beendet Firestore beim Aushängen immer, in der Aufräumfunktion
        eines `$effect`. Das gilt auch für Tabs, die das Abmelden nur mitbekommen.
      - Weil Firestore vor `signOut` beendet ist, melden die Listener des abmeldenden
        Tabs kein `permission-denied`.
      - Läuft das Zeitlimit ab, bleibt der Cache liegen. Beim nächsten Anmelden liest ihn
        das Familienkonto wieder, es landen also keine fremden Daten auf dem Gerät.
11. **`initializeAuth` mit `indexedDBLocalPersistence`** statt `getAuth`.
    - Warum: Es wird nur E-Mail und Passwort gebraucht. `getAuth` zöge den Popup- und
      Redirect-Resolver ins Bundle, und der macht in der installierten iOS-App ohnehin
      Probleme.
    - Auswirkung: `onAuthStateChanged` meldet den gespeicherten Nutzer auch ohne Netz.
12. **Alte lokale Daten werden entfernt** (`wunschliste.wishlists`, `wunschliste.wishes`).
    Laut Konzept werden sie nicht übernommen. `wunschliste.colorScheme` bleibt.

## Ausgangslage

```
 main.ts ──► App.svelte
              ├─ provideWishlistModule(createWishlistModule({ storage: localStorage,
              │                                               storageEvents: window, idGenerator }))
              ├─ header: MainNavigation (nur auf Hauptseiten)
              ├─ main:   SettingsPage | WishlistPages
              └─ Announcer (role="status")

 wishlist/infrastructure/
   createWishlistModule.ts ──► LocalStorageWishlistRepository ─┐
                          └──► LocalStorageWishRepository ─────┴─► StoredCollection
```

- Die Ports sind schon auf Firestore zugeschnitten: `watch…` liefert `Unsubscribe`,
  `get`/`save`/`delete` sind `Promise` (`src/wishlist/domain/WishlistRepository.ts:5`,
  `src/wishlist/domain/WishRepository.ts:5`).
- Die Seiten warten auf das Schreiben und navigieren erst danach weiter
  (`src/wishlist/infrastructure/ui/CreateWishPage.svelte:24`, `EditWishPage.svelte:35`,
  `EditWishlistPage.svelte:38`, `WishPage.svelte:37`).
- `Watched<T>` kennt `loading | found | missing` (`src/shared/ui/watched.svelte.ts:1`).
  `WishlistsPage` und `WishlistPage` halten Listen als einfaches `$state`
  (`src/wishlist/infrastructure/ui/WishlistsPage.svelte:12`).
- `CurrentRoute` meldet Seitenwechsel über `pageKeyOf`
  (`src/app/router/currentRoute.svelte.ts:18`). Navigiert wird per
  `navigateTo(hash)` ohne Verlaufseintrag (`src/shared/ui/navigation.ts:1`).
- Die Record-Abbildung samt Überspringen ungültiger Einträge steckt in
  `src/wishlist/infrastructure/localStorage/LocalStorageWishRepository.ts:44-104` und
  `LocalStorageWishlistRepository.ts:15-37`.
- Die E2E-Tests befüllen `localStorage` direkt (`e2e/seed.ts`) und lesen es teils aus
  (`storedRecords`, etwa in `e2e/editing.spec.ts`).
- Playwright baut über `webServer` mit `npm run build` nach `dist/`
  (`playwright.config.ts:13`). CI lädt dieses `dist/` hoch (`.github/workflows/deploy.yml`).
- Die Grenzregeln stehen in `eslint.architecture.config.js`, die Tests dazu in
  `tests/architecture.test.ts`.
- Lokal ist Java 21 (Corretto) vorhanden. `firebase` 12.19.0, `firebase-tools` 15.31.0
  und `@firebase/rules-unit-testing` 5.0.2 sind die aktuellen Versionen.

## Zielbild

### Ablauf beim Start

```
 App.svelte
   removeLegacyLocalData(localStorage)
   FamilyAccess.follow()  ── onAuthStateChanged ──┐
                                                  ▼
   status: checking ──► (nichts anzeigen)
           signedOut ──► SignInPage                         (kein Header-Menü)
           signedIn  ──► SignedInApp
                           ├─ openFamilyDatabase() ──► Firestore (persistentLocalCache,
                           │                              persistentMultipleTabManager)
                           ├─ provideWishlistModule(createWishlistModule({ firestore,
                           │                          idGenerator, onProblem }))
                           ├─ header: StatusBar-Streifen, MainNavigation, OfflineNotice,
                           │          ProblemNotice
                           └─ main:   SettingsPage | WishlistPages
```

Der Offline-Hinweis erscheint auch auf der Anmeldeseite, dort unter dem Statusleisten-
Streifen.

### Seiten

```
 Anmelden (ohne Anmeldung, jede Adresse)   Anmelden mit Fehler
 ┌────────────────────────────────────┐    ┌────────────────────────────────────┐
 │ Anmelden                      (h1) │    │ Anmelden                      (h1) │
 │ Familienzugang für die Wunschliste.│    │ Familienzugang für die Wunschliste.│
 │ E-Mail                             │    │ E-Mail                             │
 │ [______________________________]   │    │ [familie@example.de____________]   │
 │ Passwort                           │    │ Passwort                           │
 │ [______________________________]   │    │ [••••••••______________________]   │
 │                                    │    │ ⚠ E-Mail oder Passwort stimmt      │ ← role="alert"
 │                                    │    │   nicht.                           │
 ├────────────────────────────────────┤    ├────────────────────────────────────┤
 │          [→ Anmelden]              │    │          [→ Anmelden]              │ ← ActionBar
 └────────────────────────────────────┘    └────────────────────────────────────┘

 Einstellungen vorher                      Einstellungen nachher
 ┌────────────────────────────────────┐    ┌────────────────────────────────────┐
 │ [Wunschlisten]    [⚙ Einstellungen]│    │ [Wunschlisten]    [⚙ Einstellungen]│
 ├────────────────────────────────────┤    ├────────────────────────────────────┤
 │ Einstellungen                      │    │ Einstellungen                      │
 │ Farbschema                         │    │ Farbschema                         │
 │   Dunkel                    ✓      │    │   Dunkel                    ✓      │
 │   Hell                             │    │   Hell                             │
 │   Invertiert                       │    │   Invertiert                       │
 │                                    │    │ Familienzugang                (h2) │
 │                                    │    │ Angemeldet als familie@example.de  │
 │                                    │    │         [⎋ Abmelden]               │
 └────────────────────────────────────┘    └────────────────────────────────────┘

 Abmelde-Dialog (ConfirmDialog)            Kopf mit Offline-Hinweis und Warnzeile
 ┌────────────────────────────────────┐    ┌────────────────────────────────────┐
 │ Abmelden?                     (h2) │    │ [Wunschlisten]    [⚙ Einstellungen]│
 │ Zum erneuten Anmelden braucht es   │    │ ☁̸ Offline – Änderungen werden      │ ← role="status"
 │ E-Mail und Passwort des            │    │   später abgeglichen.              │
 │ Familienzugangs. Die Daten auf     │    │ ⚠ Eine Änderung konnte nicht       │ ← role="alert"
 │ diesem Gerät werden entfernt.      │    │   gespeichert werden.              │
 │ [⎋ Abmelden]   [✕ Abbrechen]       │    ├────────────────────────────────────┤
 └────────────────────────────────────┘    │ Wunschlisten                  [+]  │
  Anfangsfokus: „Abbrechen“                 └────────────────────────────────────┘

 Daten nicht ladbar (Liste, Wunsch, Formulare)   Übersicht, Daten nicht ladbar
 ┌────────────────────────────────────┐          ┌────────────────────────────────────┐
 │ Laden fehlgeschlagen          (h1) │          │ Wunschlisten                  [+]  │
 │ Die Daten konnten nicht geladen    │          │ Die Daten konnten nicht geladen    │
 │ werden.                            │          │ werden.                            │
 │        [Zur Übersicht]             │          └────────────────────────────────────┘
 └────────────────────────────────────┘
```

Texte:

| Anlass | Text |
|---|---|
| E-Mail leer | „Bitte die E-Mail-Adresse eingeben.“ (am Feld) |
| Passwort leer | „Bitte das Passwort eingeben.“ (am Feld) |
| `auth/invalid-credential`, `auth/invalid-email`, `auth/user-not-found`, `auth/wrong-password`, `auth/user-disabled` | „E-Mail oder Passwort stimmt nicht.“ |
| `auth/network-request-failed` | „Keine Verbindung. Bitte später erneut versuchen.“ |
| `auth/too-many-requests` | „Zu viele Versuche. Bitte später erneut versuchen.“ |
| alles andere | „Anmelden hat nicht geklappt. Bitte später erneut versuchen.“ |
| Offline | „Offline – Änderungen werden später abgeglichen.“ |
| `writeRejected` | „Eine Änderung konnte nicht gespeichert werden.“ |
| `loadFailed` | „Die Daten konnten nicht geladen werden.“ |

Fokus:

- Beim Start wird kein Fokus gesetzt, wie bisher.
- Bei leeren Feldern springt der Fokus auf das erste fehlerhafte Feld.
- Bei einem Fehler von Firebase bleibt der Fokus stehen. Die Meldung wird über
  `role="alert"` angesagt.
- Die Anmeldeseite ruft `requestPageFocus()` **vor** dem Anmeldeversuch auf, damit die
  Zielseite ihr h1 fokussiert (bzw. das Namensfeld auf den Erstellen-Seiten, wie in
  WL-003). Grund: `onAuthStateChanged` kann `SignedInApp` schon einhängen, bevor
  `signInWithEmailAndPassword` auflöst, und dann käme die Anforderung zu spät. Scheitert
  der Versuch, verwirft `takePageFocusRequest()` sie wieder.

### Datenmodell

```
 wishlists/{wishlistId}   { name: string }
 wishes/{wishId}          { wishlistId: string, name: string, link?: string,
                            description?: string, priceInCents?: number,
                            rating?: 'essential' | 'wanted' | 'nice', gifted: boolean }
```

`firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isFamilyAccount() {
      return request.auth != null && request.auth.uid == 'FAMILY_ACCOUNT_UID';
    }
    match /wishlists/{wishlistId} {
      allow read, write: if isFamilyAccount();
    }
    match /wishes/{wishId} {
      allow read, write: if isFamilyAccount();
    }
  }
}
```

### Builds, Skripte, CI

| Skript | Inhalt |
|---|---|
| `build` | `vite build` (Produktion, `dist/`, Fail-fast bei fehlender Konfiguration) |
| `build:e2e` | `vite build --mode e2e --outDir dist-e2e` |
| `dev:emulators` | `firebase emulators:exec --only auth,firestore --project demo-wunschliste "vite --mode e2e"` |
| `test:unit` | `vitest run --project unit` |
| `test:integration` | `firebase emulators:exec --only auth,firestore --project demo-wunschliste "vitest run --project integration"` |
| `test:e2e` | `firebase emulators:exec --only auth,firestore --project demo-wunschliste "playwright test"` |
| `test` | `test:architecture` → `test:unit` → `test:integration` → `test:e2e` |

`.env.e2e` (eingecheckt, nur Schein-Werte):

```
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-wunschliste.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-wunschliste
VITE_FIREBASE_APP_ID=demo-app-id
VITE_FIREBASE_EMULATORS=true
```

Vite lädt `.env.e2e` im Modus `e2e` mit Vorrang vor `.env.local`, eine echte
Konfiguration in `.env.local` stört die Tests also nicht.

`firebase.json`:

```json
{
  "firestore": { "rules": "firestore.rules" },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "ui": { "enabled": false },
    "singleProjectMode": true
  }
}
```

### Schichten

```
 src/
 ├── app/                                   Kompositionswurzel
 │   ├── App.svelte                         Tor: checking | signedOut | signedIn
 │   ├── SignedInApp.svelte                 bisheriger Inhalt von App.svelte + Modul je Sitzung
 │   ├── firebase/
 │   │   ├── firebaseApp.ts                 initializeApp, familyAuth(), openFamilyDatabase(),
 │   │   │                                  forgetFamilyDatabase(firestore)
 │   │   ├── firebaseConfig.ts              import.meta.env → FirebaseOptions, useEmulators
 │   │   └── env.d.ts                       ImportMetaEnv um VITE_FIREBASE_* erweitert
 │   ├── access/
 │   │   ├── familyAccess.svelte.ts         FamilyAccess: state, follow(), signIn(), signOut()
 │   │   ├── familyAccessContext.ts         provide/use
 │   │   ├── signInProblem.ts (+ .test.ts)  Fehlercode → Problem → Text
 │   │   ├── SignInPage.svelte
 │   │   └── FamilyAccessSettings.svelte    „Familienzugang“ in den Einstellungen
 │   └── problemTexts.ts                    WishlistProblem → Text
 ├── shared/ui/
 │   ├── connectivity.svelte.ts             isOnline ($state), follow()
 │   ├── OfflineNotice.svelte
 │   ├── problemNotice.svelte.ts            reportProblem(text), clearProblems(), problemTexts()
 │   ├── ProblemNotice.svelte               role="alert", eine Zeile je Problem
 │   └── watched.svelte.ts                  + Zustand 'failed', fail()
 └── wishlist/
     ├── domain/                            Ports: watch…(…, onChange, onFailure)
     ├── application/                       Watch…-Use-Cases reichen onFailure durch
     └── infrastructure/
         ├── createWishlistModule.ts        { firestore, idGenerator, onProblem }
         ├── wishlistProblem.ts             type WishlistProblem = 'writeRejected' | 'loadFailed'
         ├── removeLegacyLocalData.ts
         ├── firestore/
         │   ├── FirestoreWishlistRepository.ts
         │   ├── FirestoreWishRepository.ts
         │   ├── wishlistDocument.ts            Dokument ↔ Wishlist
         │   ├── wishDocument.ts                Dokument ↔ Wish
         │   └── observedWrite.ts               startet Schreiben, meldet Ablehnung
         └── ui/LoadFailed.svelte

 tests/
 ├── familyAccount.ts                       familyAccountUidFrom(rules), FAMILY_RULES_PATH
 └── integration/
     ├── testFirestore.ts                   Emulator-Kontext, asModularFirestore(compat)
     ├── firestoreRules.integration.test.ts
     ├── FirestoreWishlistRepository.integration.test.ts
     └── FirestoreWishRepository.integration.test.ts
```

Abhängigkeitsrichtung (maschinell geprüft):

```
 app ──► wishlist/infrastructure ──► wishlist/application ──► wishlist/domain
  │              │                                              ▲
  │              └──► firebase (nur infrastructure und app)     │ ✗ firebase
  └──────────────┴──► shared/ui ──✗──► app, wishlist, firebase
```

## Abstraktionen und Wiederverwendung

Wiederverwendet:
- `ActionBar`, `TextField`, `PageHeader`, `ConfirmDialog`, `.button`, `.button-row` aus
  `src/shared/ui/` für die Anmeldeseite und das Abmelden.
- `requestPageFocus()` aus `src/shared/ui/pageFocus.ts` für den Fokus nach dem Anmelden.
- `navigateTo` für „Zur Übersicht“ auf `LoadFailed`.
- Die Record-Prüfung und Abbildung aus den localStorage-Adaptern wandert nahezu
  unverändert nach `firestore/wishlistDocument.ts` und `firestore/wishDocument.ts`.
  `isObject` wandert mit.
- `application/fakes/` bleiben die Ports für alle Use-Case-Tests.

Neu (Details in den Phasen):
- `vite.config.ts` — `defineConfig(({ command, mode }) => …)`. Bei `command === 'build'`
  und `mode === 'production'` ruft es `requireProductionFirebaseEnvironment(loadEnv(mode,
  process.cwd(), 'VITE_FIREBASE_'))` aus `build/firebaseEnvironment.ts` auf. Vitest
  bekommt `test.projects` `unit` und `integration`.
- `build/firebaseEnvironment.ts` mit `tests/firebaseEnvironment.test.ts`.
- `e2e/emulators.ts` — `resetEmulators()`, `createAccount(uid, email, password)`,
  `seed(data)`, `storedWishes()`, `familyAccountUid()`.
- `e2e/fixtures.ts` — `test` mit der Option `signedIn` (Standard `true`) und einem
  automatischen Zurücksetzen der Emulatoren, dazu `signIn(page)`.

## Logging und Beobachtbarkeit

Es gibt keine Logs. Abgelehnte Schreibvorgänge und gescheiterte Listener zeigt die App im
Kopf an (Entscheidung 6). Ungültige Dokumente werden wie bisher stillschweigend
übersprungen, das belegen die Integrationstests.

## Umsetzung

### Phase 1: Familienzugang und Firebase-Grundgerüst

Abhängigkeiten: keine

Firebase ist eingebunden, die Emulatoren laufen in Tests und CI, und die Regeln sind samt
Tests fertig. Die App ist hinter der Anmeldung verborgen, und man kann sich abmelden.
Die Wunschlisten liegen in dieser Phase **noch in `localStorage`**. So lässt sich die
Anmeldung auf dem iPhone isoliert prüfen.

**Voraussetzung vor dem ersten Push dieser Phase:** Die README-Einrichtung (Abschnitt
„Firebase einrichten“) ist erledigt, vor allem die Actions-Variablen `VITE_FIREBASE_*`.
Sonst bricht der Produktionsbuild auf `main` absichtlich ab, und es wird nichts
veröffentlicht.

**Aufgaben**:
- [x] Abhängigkeiten: `firebase@^12.19.0` in `dependencies`. `firebase-tools@15.31.0`
      (exakt gepinnt) und `@firebase/rules-unit-testing@^5.0.2` in `devDependencies`.
- [x] `firebase.json`, `.firebaserc` (`{ "projects": { "default": "<echte Projekt-ID>" } }`
      mit dem Platzhalter `wunschliste-familie`, den die README-Anleitung ersetzen lässt)
      und `firestore.rules` wie im *Zielbild*, mit Platzhalter `FAMILY_ACCOUNT_UID`.
- [x] `.gitignore` um `dist-e2e/`, `firebase-debug.log`, `firestore-debug.log` erweitern.
      `.prettierignore` und die `ignores` in `eslint.config.js` um `dist-e2e`.
- [x] `.env.e2e` wie im *Zielbild*.
- [x] `build/firebaseEnvironment.ts`, TDD in `tests/firebaseEnvironment.test.ts`:
  - vollständige Werte ohne Emulator-Schalter → ok
  - fehlt `VITE_FIREBASE_APP_ID` → Fehler, dessen Meldung den Namen der Variable und den
    Hinweis auf `.env.local` bzw. die Actions-Variablen enthält
  - leerer Wert gilt als fehlend
  - `VITE_FIREBASE_EMULATORS=true` → Fehler „must not be set for a production build“
  - `tsconfig.node.json` nimmt `build/**/*.ts` auf
- [x] `vite.config.ts`: Funktionsform mit Fail-fast (siehe *Abstraktionen*),
      `test.projects`:
  - `unit`: `include: ['src/**/*.test.ts', 'tests/**/*.test.ts']`,
    `exclude: ['**/*.integration.test.ts']`, `environment: 'node'`
  - `integration`: `include: ['tests/integration/**/*.integration.test.ts']`,
    `environment: 'node'`, `fileParallelism: false`
- [x] `package.json`-Skripte wie in der Tabelle *Builds, Skripte, CI*.
      `test:integration` läuft ab dieser Phase mit den Regeltests.
- [x] `playwright.config.ts`:
  - `webServer.command` → `npm run build:e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort`
  - `workers: 1`, `fullyParallel: false`
- [x] `tests/familyAccount.ts`: `familyAccountUidFrom(rules)` (Muster
      `request.auth.uid == '([^']+)'`, wirft ohne Treffer) und `readFamilyRules()`. Das
      teilen sich Regeltests, Integrationstests und `e2e/emulators.ts`.
- [x] `tests/integration/testFirestore.ts`:
  - `startTestEnvironment()` = `initializeTestEnvironment({ projectId:
    'demo-wunschliste', firestore: { rules: readFamilyRules(), host: '127.0.0.1', port:
    8080 } })`
  - `asModularFirestore(context)`: `context.firestore()` liefert laut Typen die
    Compat-Instanz. Zur Laufzeit funktioniert sie mit den modularen Funktionen, so zeigt es
    die Doku zu `@firebase/rules-unit-testing`. Der nötige Cast steht nur hier.
- [x] `tests/integration/firestoreRules.integration.test.ts`:
  - Familienkonto: Lesen und Schreiben in `wishlists/a` und `wishes/b` gelingen
  - anderes Konto (`authenticatedContext('stranger')`): Lesen und Schreiben scheitern
  - ohne Anmeldung (`unauthenticatedContext()`): Lesen und Schreiben scheitern
  - Familienkonto in `other/x`: Lesen und Schreiben scheitern
  - `clearFirestore()` in `beforeEach`, `cleanup()` in `afterAll`
- [x] Architekturtest zuerst (`tests/architecture.test.ts`):
  - verboten: `src/shared/ui/X.svelte` → `firebase/auth`, `src/shared/ui/x.ts` →
    `firebase/firestore`, `src/wishlist/domain/Wish.ts` → `firebase/firestore`,
    `src/wishlist/application/CreateWish.ts` → `firebase/firestore`
  - verboten: `src/wishlist/domain/Wish.test.ts` → `firebase/firestore`,
    `src/wishlist/application/CreateWish.test.ts` → `firebase/firestore`
  - erlaubt: `src/wishlist/infrastructure/firestore/X.ts` → `firebase/firestore`,
    `src/wishlist/infrastructure/firestore/X.ts` → `firebase/app` (heute ein falscher
    Treffer von `outwardTo(['app'])`), `src/app/firebase/firebaseApp.ts` → `firebase/app`
  - Jeder verbotene Fall liefert genau **eine** Meldung, wie `toBe(1)` es verlangt.
- [x] `eslint.architecture.config.js`:
  - `outwardTo` trifft nur noch relative Pfade: `^\.\.?/(.*/)?(${layers})(/|$)`. Heute
    trifft `(^|/)app(/|$)` auch `firebase/app`.
  - Neu ist `firebasePackages = { regex: '^(firebase|@firebase)(/|$)', … }`. Das Muster
    kommt in den `shared`-Block und in die Testdatei-Blöcke von `domain` und
    `application`, die ohne `nonRelativeImport` auskommen. In den übrigen Blöcken von
    `domain` und `application` greift schon `nonRelativeImport`.
  - Bleiben alle bisherigen Fälle in `tests/architecture.test.ts` grün, ist belegt, dass
    die engere Regel nichts Bisheriges durchlässt.
- [x] `src/app/firebase/env.d.ts`: `ImportMetaEnv` mit den fünf `VITE_FIREBASE_*`.
- [x] `src/app/firebase/firebaseConfig.ts`: `firebaseOptions` (`apiKey`, `authDomain`,
      `projectId`, `appId`) und `useEmulators` aus `import.meta.env`.
- [x] `src/app/firebase/firebaseApp.ts`:
  - `familyAuth()`, einmalig:
    - `initializeAuth(app, { persistence: indexedDBLocalPersistence })`
    - bei `useEmulators` zusätzlich
      `connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })`
  - `openFamilyDatabase()` und `forgetFamilyDatabase()` folgen in Phase 2
- [x] `src/app/access/signInProblem.ts`, TDD in `signInProblem.test.ts`:
  - `signInProblemOf(error: unknown): SignInProblem` mit `'wrongCredentials' |
    'offline' | 'tooManyAttempts' | 'unknown'` nach der Tabelle *Texte*
  - ein Fehler ohne `code` → `'unknown'`
  - `SIGN_IN_PROBLEM_MESSAGES` mit den Texten, jeder Eintrag getestet
- [x] `src/app/access/familyAccess.svelte.ts`:
  - Klasse `FamilyAccess` mit dem Zustand `state = $state.raw<{ status: 'checking' } |
    { status: 'signedOut' } | { status: 'signedIn'; email: string }>({ status: 'checking' })`
  - `follow(): Unsubscribe` über `onAuthStateChanged`
  - `signIn(email, password): Promise<SignInProblem | undefined>`
  - `signOut(): Promise<void>` laut Entscheidung 10:
    - registrierte Abschlüsse (`onSignOut({ before, after }): Unsubscribe`) ausführen,
      erst alle `before` (in Phase 2 `terminate`)
    - dann `signOut(auth)` im `finally`, also auch wenn `before` scheitert
    - dann alle `after` (in Phase 2 `clearIndexedDbPersistence`) mit einem Zeitlimit von
      3 s, Fehler werden verschluckt
  - Kontext in `familyAccessContext.ts` per `createContext`.
- [x] `src/app/access/SignInPage.svelte`:
  - `PageHeader` „Anmelden“, dazu der Satz „Familienzugang für die Wunschliste.“
  - `<form novalidate>` mit `TextField`:
    - „E-Mail“: `type="email"`, `autocomplete="username"`, `autocapitalize="off"`,
      `autocorrect="off"`, `spellcheck="false"`
    - „Passwort“: `type="password"`, `autocomplete="current-password"`
  - `ActionBar` mit [→ Anmelden] (Lucide `LogIn`, `type="submit"`)
  - Leere Felder → Fehler am Feld, Fokus auf das erste.
  - Während der Anfrage ist der Knopf `aria-disabled` und doppeltes Absenden wird
    ignoriert.
  - Ein Problem erscheint in `<p role="alert">` über der Leiste. Das Element ist immer
    vorhanden, nur sein Text wechselt.
  - Vor dem Versuch `requestPageFocus()`, bei einem Problem `takePageFocusRequest()`
    (siehe *Fokus*).
  - `TextField` reicht weitere Attribute über `...inputAttributes` nach `type="text"`
    durch. `type` und `autocomplete` kommen also ohne Änderung an.
- [x] `src/app/App.svelte` wird zum Tor:
  - `FamilyAccess` anlegen und bereitstellen, `$effect(() => access.follow())`
  - `checking` → leeres `<main>`, `signedOut` → Header nur mit dem Statusleisten-Streifen
    und `<main>` mit `SignInPage`, `signedIn` → `SignedInApp`
  - `Announcer` bleibt außerhalb der Zweige.
- [x] `src/app/SignedInApp.svelte`: der bisherige Inhalt von `App.svelte` (Modul,
      `CurrentRoute`, Header, `main`). Das Modul nutzt in dieser Phase weiter
      `localStorage`.
- [x] `src/app/access/FamilyAccessSettings.svelte`:
  - `h2` „Familienzugang“, „Angemeldet als {email}“
  - [⎋ Abmelden] (Lucide `LogOut`) in einer `.button-row`
  - `ConfirmDialog` mit Überschrift „Abmelden?“, dem Text aus dem *Zielbild* und
    `confirmLabel` „Abmelden“. Aufruf per `open(event.currentTarget)`.
  - `SettingsPage.svelte` bindet es unter `ColorSchemeSettings` ein.
  - `ConfirmDialog` hat `Trash2` fest eingebaut. Es bekommt eine Prop `confirmIcon`
    (Svelte-Komponente, Standard `Trash2`). Das Abmelden übergibt `LogOut`.
- [x] `e2e/emulators.ts`:
  - Konstanten `PROJECT_ID = 'demo-wunschliste'` und `FAMILY = { email:
    'familie@example.de', password: 'geheim-123' }`
  - `familyAccountUid()` über `tests/familyAccount.ts`
  - `resetAuth()`: `DELETE http://127.0.0.1:9099/emulator/v1/projects/demo-wunschliste/accounts`
  - `createAccount({ uid, email, password })`:
    `POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-wunschliste/accounts`
    mit `Authorization: Bearer owner` und `{ localId, email, password }`. Laut
    firebase-tools 15.31 übernimmt der Emulator dabei die feste `localId`.
- [x] `e2e/fixtures.ts`:
  - `test = base.extend<{ signedIn: boolean }>`
  - Option `signedIn` (Standard `true`)
  - automatische Fixture: `resetAuth()` und `createAccount` mit dem Familienkonto
  - Ist `signedIn` gesetzt, ruft die Fixture `page` `signIn(page)` auf: `goto('./')`,
    Felder füllen, [Anmelden], warten auf das h1 „Wunschlisten“, dann
    `page.goto('about:blank')`. So lädt das `goto` des Tests ein neues Dokument, und die
    `addInitScript`-Seeds greifen.
  - `signIn(page)` wird für eigene Kontexte exportiert.
- [x] Alle Specs, die heute `test` aus `@playwright/test` holen und die App öffnen,
      importieren `test` aus `./fixtures`. `pwa.spec.ts` bleibt, wie es ist.
- [x] `e2e/access.spec.ts` (`test.use({ signedIn: false })`):
  - `./#/einstellungen` ohne Anmeldung → h1 „Anmelden“, keine Navigation, Titel
    „Anmelden – Wunschliste“
  - leere Felder → „Bitte die E-Mail-Adresse eingeben.“, Fokus auf „E-Mail“
  - falsches Passwort → „E-Mail oder Passwort stimmt nicht.“ in `role="alert"`
  - `context.setOffline(true)`, anmelden → „Keine Verbindung. Bitte später erneut
    versuchen.“
  - richtige Daten → h1 „Einstellungen“ fokussiert, Adresse unverändert `#/einstellungen`
  - nach `page.reload()` weiter angemeldet
  - Ein Neustart ohne Netz lässt sich hier nicht automatisch prüfen: Die Tests sperren den
    Service Worker, und `setOffline` sperrt auch `localhost`. Das prüft die manuelle
    Verifikation.
  - „Angemeldet als familie@example.de“ sichtbar. [Abmelden] öffnet den Dialog, der Fokus
    liegt auf „Abbrechen“. Nach „Abbrechen“ ist man weiter angemeldet, nach „Abmelden“
    erscheint die Anmeldeseite.
  - Die Felder tragen `autocomplete="username"` und `autocomplete="current-password"`.
- [x] `e2e/accessibility.spec.ts`:
  - mit `signedOut`: Anmeldeseite leer und mit dem Fehler „E-Mail oder Passwort stimmt
    nicht.“
  - „Einstellungen mit Abmelde-Dialog“
  - alle Fälle in allen drei Farbschemata
- [x] `.github/workflows/deploy.yml`, Job `check`:
  - `actions/setup-java@v5` mit `distribution: temurin`, `java-version: 21`
  - `actions/cache@v5` für `~/.cache/firebase/emulators`, Schlüssel
    `firebase-emulators-${{ hashFiles('package-lock.json') }}`
  - nach `npm test`: `npm run build` mit `env` aus
    `vars.VITE_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_APP_ID`, nur auf
    `main`
  - Hochgeladen wird `dist/` wie bisher.
  - Stimmen die Hauptversionen der Actions nicht (`setup-java`, `cache`), wird die
    aktuelle Hauptversion genommen und in den Notizen festgehalten.
- [x] `README.md`:
  - Stack: „Firebase (Firestore, Auth)“ statt „Später Firebase“
  - Einmalige Einrichtung: Java 21 für die Emulatoren
  - Befehlstabelle: `build:e2e`, `dev:emulators`, `test:unit`, `test:integration`,
    `test:e2e`
  - Neuer Abschnitt „Firebase einrichten“ mit diesen Schritten:
    1. Projekt in der Firebase-Konsole anlegen, Google Analytics aus.
    2. Firestore-Datenbank anlegen (Produktionsmodus, Region `europe-west3`).
    3. Authentication → Anmeldeanbieter „E-Mail/Passwort“ aktivieren.
    4. Authentication → Nutzer → Familienkonto anlegen und die UID kopieren.
    5. UID in `firestore.rules` statt `FAMILY_ACCOUNT_UID` eintragen und committen.
    6. Projekt-ID in `.firebaserc` eintragen.
    7. `npx firebase login` und `npx firebase deploy --only firestore:rules`.
    8. Projekteinstellungen → Web-App hinzufügen, die Werte `apiKey`, `authDomain`,
       `projectId` und `appId` als Actions-Variablen (`Settings → Secrets and variables →
       Actions → Variables`) `VITE_FIREBASE_…` sowie lokal in `.env.local` hinterlegen.
    9. In der installierten App einmal anmelden. Die installierte App hat einen eigenen
       Speicher, getrennt von Safari.
  - Hinweis dazu: Die Web-Konfiguration ist öffentlich, geschützt wird über
    `firestore.rules`.
  - Hinweis zu Vitest: Ein bloßes `npx vitest` bzw. der Testlauf in der IDE startet auch
    die Integrationstests und scheitert ohne Emulator. Für schnelle Läufe `npm run
    test:unit` nehmen.

**Automatisierte Verifikation**:
- [x] `npm run test:unit` grün, u. a. `firebaseEnvironment.test.ts`,
      `signInProblem.test.ts`, `architecture.test.ts` mit den neuen Fällen
- [x] `npm run test:integration` grün mit `firestoreRules.integration.test.ts`
- [x] `npm run test:architecture` und `npm run lint` grün
- [x] `npm test` grün, inklusive `access.spec.ts`, aller bisherigen Specs (angemeldet)
      und der neuen axe-Fälle
- [x] Fail-fast ist durch `tests/firebaseEnvironment.test.ts` belegt. Die Verdrahtung in
      `vite.config.ts` zeigt sich so: Bei vorübergehend umbenannter `.env.local` bricht
      `npm run build` mit der Meldung zur fehlenden Variable ab.
- [x] `dist/` löschen, dann `npm run build:e2e` → `dist/` existiert nicht, `dist-e2e/`
      existiert.

**Manuelle Verifikation** (setzt die README-Einrichtung mit einem echten Firebase-Projekt
voraus):
- [ ] iPhone, installierte App nach dem Deploy: Die Anmeldeseite erscheint. Der
      Schlüsselbund bietet an, das Passwort zu speichern bzw. einzusetzen, und die
      Anmeldung gelingt.
- [ ] App schließen und neu starten → ohne erneute Anmeldung auf der Übersicht
- [ ] Flugmodus, App neu starten → weiter angemeldet
- [ ] VoiceOver: Falsches Passwort → die Fehlermeldung wird vorgelesen. „Abmelden“ →
      Dialog mit Fokus auf „Abbrechen“, „Abmelden“ → Anmeldeseite.

### Phase 2: Firestore-Adapter und Sync

Abhängigkeiten: Phase 1

Beide Repositories laufen gegen Firestore, mit Offline-Cache und ohne Warten auf den
Server. Das Modul entsteht je Anmeldung neu, Abmelden löscht den Cache. Der
localStorage-Adapter und die alten Daten verschwinden. Die E2E-Seeds laufen über den
Emulator, und ein Test mit zwei Geräten belegt den Sync.

**Aufgaben**:
- [x] `tests/integration/testFirestore.ts` erweitern:
  - `familyFirestore()` = `asModularFirestore(authenticatedContext(<UID aus
    firestore.rules>))`
  - `withoutRules(action)` = `withSecurityRulesDisabled`, zum Schreiben ungültiger
    Dokumente und Lesen der Rohdaten
  - `clearFirestore()`
- [x] `firestore/wishlistDocument.ts` und `firestore/wishDocument.ts`:
  - Prüfung und Abbildung aus den localStorage-Adaptern übernehmen
  - `toDocument` lässt `undefined`-Felder weg und nimmt kein `id` ins Dokument, die ID
    ist der Dokumentname
  - `fromDocument(id, data: unknown)` liefert die Domänenklasse oder `undefined`
- [x] `firestore/observedWrite.ts`:
  - `observedWrite(write: Promise<void>, onProblem): void` hängt nur `.catch(() =>
    onProblem('writeRejected'))` an
  - `type WishlistProblem = 'writeRejected' | 'loadFailed'` liegt in einer eigenen
    Datei `src/wishlist/infrastructure/wishlistProblem.ts`. So entsteht kein Zyklus
    zwischen `createWishlistModule.ts` und den Adaptern.
- [x] `firestore/FirestoreWishlistRepository.ts`,
      `constructor(firestore: Firestore, onProblem: (problem: WishlistProblem) => void)`:
  - `watchAll(onChange)` über `onSnapshot(collection(firestore, 'wishlists'))`
  - `watch(id, onChange)` über `onSnapshot(doc(…))`, `exists()` → `fromDocument`, sonst
    `undefined`
  - `get(id)` über `getDocFromCache`, bei einem Fehler `getDoc`
  - `save(wishlist)` über `observedWrite(setDoc(…))`, löst sofort auf
  - `delete(id)` über `observedWrite(deleteDoc(…))`
- [x] `firestore/FirestoreWishRepository.ts` analog:
  - `watchByWishlist` über `query(collection('wishes'), where('wishlistId', '==', id))`
  - `deleteAllOf(wishlistId)`: Wünsche per `getDocsFromCache(query)` holen, alle in einem
    `writeBatch` löschen, `observedWrite(batch.commit())`
- [x] Integrationstests `tests/integration/FirestoreWishlistRepository.integration.test.ts`
      und `tests/integration/FirestoreWishRepository.integration.test.ts`, gegen
      `familyFirestore()`:
  - gespeicherte Liste bzw. gespeicherter Wunsch ist über eine **zweite**
    Firestore-Instanz lesbar, also über einen zweiten `authenticatedContext`
  - `watchAll` bzw. `watchByWishlist` meldet sofort, nach `save` und nach `delete`.
    `watchByWishlist` liefert nur Wünsche dieser Liste.
  - `get` einer unbekannten ID → `undefined`
  - Das Rohdokument eines Wunsches nur mit Namen enthält genau `{ wishlistId, name,
    gifted }`.
  - Ein per `withoutRules` geschriebenes Dokument mit leerem Namen bzw. Preis `0` wird
    übersprungen, die übrigen bleiben.
  - `deleteAllOf` löscht nur die Wünsche der einen Liste.
  - Nach `disableNetwork(firestore)` löst `save` binnen 1 s auf, und `watch` meldet den
    neuen Stand. Das belegt, dass nicht auf den Server gewartet wird.
  - `beforeEach` `clearFirestore()`
- [x] `createWishlistModule({ firestore, idGenerator, onProblem })` nutzt die
      Firestore-Adapter.
- [x] `src/app/firebase/firebaseApp.ts`:
  - `openFamilyDatabase()`:
    - `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager:
      persistentMultipleTabManager() }) })`
    - bei `useEmulators` zusätzlich `connectFirestoreEmulator(firestore, '127.0.0.1', 8080)`
  - `forgetFamilyDatabase(firestore)`: `clearIndexedDbPersistence(firestore)`. Das
    Zeitlimit steckt in `FamilyAccess.signOut`, siehe Phase 1.
- [x] `src/app/SignedInApp.svelte`:
  - `const firestore = openFamilyDatabase()`
  - `provideWishlistModule(createWishlistModule({ firestore, idGenerator, onProblem }))`.
    `onProblem` wird in Phase 3 angeschlossen und bis dahin nicht verwendet.
  - `$effect(() => access.onSignOut({ before: () => terminate(firestore), after: () =>
    forgetFamilyDatabase(firestore) }))`
  - Eine zweite `$effect`-Aufräumfunktion beendet Firestore beim Aushängen immer
    (`terminate(firestore)`). Das gilt auch in Tabs, die das Abmelden nur über die
    Auth-Persistenz mitbekommen. So geben sie die Datenbank frei, die der abmeldende Tab
    löschen will.
- [x] `src/wishlist/infrastructure/removeLegacyLocalData.ts`:
      `removeLegacyLocalData(storage: Pick<Storage, 'removeItem'>)` entfernt
      `wunschliste.wishlists` und `wunschliste.wishes`. `App.svelte` ruft es beim Start
      auf.
- [x] Löschen: `src/wishlist/infrastructure/localStorage/` vollständig (Adapter,
      `StoredCollection`, `testStorage`, beide Tests).
- [x] `e2e/emulators.ts` erweitern:
  - `resetFirestore()` über `testEnvironment.clearFirestore()`
  - `seed(data)` schreibt Listen und Wünsche per `withSecurityRulesDisabled`, das
    Record-Format bleibt wie in `e2e/seed.ts`. `id` wird zum Dokumentnamen und nicht ins
    Dokument geschrieben.
  - `storedWishes()` liest alle Wünsche roh
  - Die automatische Fixture setzt zusätzlich Firestore zurück.
- [x] `e2e/seed.ts` auflösen:
  - `historyLength` wandert, falls noch genutzt, nach `e2e/emulators.ts` oder in eine
    eigene Hilfsdatei
  - Aufrufe `seed(page, data)` → `await seed(data)`
  - `storedRecords(page, 'wunschliste.wishes')` → `storedWishes()`
  - Seeds dürfen jetzt auch nach der Anmeldung erfolgen, weil die Listener live melden.
- [x] `e2e/sync.spec.ts`:
  - zwei Kontexte A und B (`browser.newContext` mit `devices['iPhone 15']`), beide per
    `signIn`
  - A legt „Geburtstag 2027“ an → B sieht sie in der Übersicht ohne Neuladen
  - B öffnet die Liste, A legt einen Wunsch an → B sieht ihn in der Liste
  - A verschenkt ihn → bei B wandert er nach „Erfüllte Wünsche“
- [x] `e2e/access.spec.ts` ergänzen:
  - Daten seeden, abmelden, erneut anmelden → Listen wieder sichtbar. Das belegt die
    neue Firestore-Instanz nach `terminate`.
  - Nach dem Abmelden liegt kein Firestore-Cache mehr vor: `indexedDB.databases()`
    enthält keinen Eintrag, der mit `firestore/` beginnt.
  - Zwei Tabs im selben Kontext, beide angemeldet. Tab 1 meldet sich ab → Tab 1 zeigt
    binnen 5 s die Anmeldeseite, ebenso Tab 2. Das Abmelden hängt also nicht an der
    offenen Datenbank des zweiten Tabs.
- [x] `e2e/legacyData.spec.ts`: `addInitScript` setzt `wunschliste.wishlists` und
      `wunschliste.colorScheme`. Nach dem Start fehlt `wunschliste.wishlists`, das
      Farbschema bleibt, und die Übersicht zeigt „Noch keine Wunschlisten.“.
- [x] `e2e/wishlists.spec.ts`: Der Test mit dem zweiten Tab bleibt und belegt jetzt
      `persistentMultipleTabManager`.
- [x] `README.md`, Abschnitt „Daten“ neu:
  - Die Daten liegen in Firestore (`wishlists`, `wishes`) und werden auf dem Gerät
    offline zwischengespeichert.
  - Abmelden löscht den Zwischenspeicher.
  - Alte lokale Daten aus Schritt 2 werden beim Start entfernt.
- [x] `docs/agents/research/2026-09-28-wunschliste-konzept.md`, Umsetzungsreihenfolge: Im
      Satz „Der lokale Adapter bleibt als In-Memory-Fake für Tests erhalten“ wird ergänzt,
      dass diese Rolle die Fakes in `application/fakes/` übernehmen.

**Automatisierte Verifikation**:
- [x] `npm run test:integration` grün, u. a. beide Adaptertests und die Regeltests
- [x] `npm run test:unit`, `npm run test:architecture`, `npm run lint` grün
- [x] `npm test` grün, inklusive `sync.spec.ts`, `legacyData.spec.ts`, der erweiterten
      `access.spec.ts` und aller auf Emulator-Seeds umgestellten Specs
- [x] Im Quellcode findet sich kein `localStorage`-Adapter mehr:
      `src/wishlist/infrastructure/localStorage` existiert nicht

**Manuelle Verifikation**:
- [ ] iPhone und zweites Gerät (oder ein Desktop-Browser), beide angemeldet: Eine auf dem
      iPhone angelegte Liste erscheint auf dem anderen Gerät ohne Neuladen und umgekehrt.
- [ ] iPhone: App in den Hintergrund, auf dem anderen Gerät etwas ändern, App wieder
      öffnen → die Änderung erscheint. Verstummt der Listener (firebase-js-sdk #4948),
      wird das in `docs/notes.txt` als Bug festgehalten.
- [ ] Abmelden und wieder anmelden → die Daten sind wieder da

### Phase 3: Offline-Hinweis und Fehlermeldungen

Abhängigkeiten: Phase 2

Die App zeigt an, dass sie offline ist, und meldet abgelehnte Änderungen und
gescheiterte Listener, im Kopf wie auf der Seite.

**Aufgaben**:
- [ ] Ports, TDD über die Use Cases:
  - `WishlistRepository.watchAll(onChange, onFailure)`, `watch(id, onChange, onFailure)`,
    `WishRepository.watchByWishlist(id, onChange, onFailure)`,
    `watch(id, onChange, onFailure)`
  - `onFailure: () => void`
- [ ] `application/fakes/ObservableMap.ts`: `observe(onChange, onFailure)` und
      `failObservers()` für Tests. Beide Fakes reichen das durch.
- [ ] Use-Case-Tests zuerst: `WatchWishlists`, `WatchWishlist`,
      `WatchWishesOfWishlist` und `WatchWish` rufen `onFailure` auf, wenn der Fake scheitert.
      `execute(…, onChange, onFailure)`.
- [ ] Firestore-Adapter: `onSnapshot(…, next, () => { onFailure();
      onProblem('loadFailed'); })`
- [ ] Integrationstests ergänzen, mit einer Firestore-Instanz aus
      `unauthenticatedContext()`:
  - `watchAll` ruft `onFailure` auf, `onProblem` erhält `'loadFailed'`
  - `save` löst auf, danach erhält `onProblem` `'writeRejected'` (mit `vi.waitFor`)
- [ ] `src/shared/ui/watched.svelte.ts`: `WatchStatus` um `'failed'` erweitern,
      Methode `fail()`
- [ ] `src/wishlist/infrastructure/ui/LoadFailed.svelte`: `PageHeader` „Laden
      fehlgeschlagen“, der Satz „Die Daten konnten nicht geladen werden.“ und
      [Zur Übersicht] (`navigateTo('#/')`) in einer `.button-row`
- [ ] Seiten:
  - `WishPage`, `WishlistPage`, `CreateWishPage`, `EditWishPage` und `EditWishlistPage`
    zeigen bei `status === 'failed'` `LoadFailed`.
  - `WishlistsPage` zeigt statt der Liste den Satz „Die Daten konnten nicht geladen
    werden.“.
  - `WishlistPage` zeigt ihn auch, wenn nur die Wünsche nicht laden.
- [ ] `src/shared/ui/problemNotice.svelte.ts`: `reportProblem(text)` merkt sich den Text,
      doppelte nur einmal, in der Reihenfolge des Eintreffens. Dazu `clearProblems()` und
      `problemTexts(): readonly string[]`.
- [ ] `src/shared/ui/ProblemNotice.svelte`: ein immer vorhandener Container mit
      `role="alert"`, darin eine Zeile je Problem mit Warnsymbol (Lucide `TriangleAlert`,
      stumm), Rand oben und unten in `--color-outline`. Ohne Problem ist er leer und ohne
      Rand.
- [ ] `src/app/router/currentRoute.svelte.ts`: Bei einem Seitenwechsel wird zusätzlich
      `clearProblems()` aufgerufen.
- [ ] `src/app/problemTexts.ts` (mit Test): `WishlistProblem` → Text laut Tabelle.
      `SignedInApp` übergibt `onProblem: (problem) => reportProblem(problemText(problem))`.
      Beim Abmelden wird `clearProblems()` aufgerufen.
- [ ] `src/shared/ui/connectivity.svelte.ts`: Klasse `Connectivity` mit
      `isOnline = $state(navigator.onLine)` und `follow(): () => void` für `online` und
      `offline`
- [ ] `src/shared/ui/OfflineNotice.svelte`:
  - Container mit `role="status"`, immer vorhanden
  - offline: Lucide `CloudOff` (stumm) und „Offline – Änderungen werden später
    abgeglichen.“
  - kleinere Schrift (`0.875em`), Rand oben und unten in `--color-outline`, Innenabstand
    `0.25rem 1rem`
- [ ] Einbau:
  - `SignedInApp`: Header mit Streifen, `MainNavigation`, `OfflineNotice` und
    `ProblemNotice`
  - `App.svelte`: im Zweig `signedOut` ebenfalls `OfflineNotice`
- [ ] `e2e/offline.spec.ts`:
  - `context.setOffline(true)` → der Hinweis ist sichtbar, und der Container mit
    `role="status"` enthält den Text. Nach `setOffline(false)` ist er leer.
  - Erwartungen, die auf den Abgleich nach dem Wiederverbinden warten, bekommen ein
    Timeout von 15 s (Entscheidung 5).
  - zwei Kontexte A und B: A offline legt einen Wunsch an und landet **sofort** auf dessen
    Detailseite (h1 sichtbar). A verschenkt ihn, die Statusmeldung erscheint. B sieht den
    Wunsch nicht. A geht online → B sieht den verschenkten Wunsch unter „Erfüllte
    Wünsche“.
  - A offline löscht eine Liste → die Übersicht erscheint sofort ohne sie
- [ ] `e2e/problems.spec.ts` mit einem zweiten Konto `fremd@example.de`, dessen UID nicht
      in den Regeln steht:
  - anmelden → die Übersicht zeigt „Die Daten konnten nicht geladen werden.“, die
    Warnzeile mit `role="alert"` ebenso
  - Wechsel zu `#/einstellungen` → die Warnzeile ist leer
  - `#/liste/neu`, „Test“ erstellen → die Warnzeile **enthält** eine Zeile „Eine
    Änderung konnte nicht gespeichert werden.“. Daneben darf „Die Daten konnten nicht
    geladen werden.“ der neuen Listenseite stehen, die Reihenfolge ist offen.
  - `#/liste/<seeded id>` → „Laden fehlgeschlagen“
- [ ] `e2e/accessibility.spec.ts`:
  - Übersicht offline mit Offline-Hinweis und der Warnzeile, als fremdes Konto
  - „Laden fehlgeschlagen“
  - jeweils in allen drei Farbschemata

**Automatisierte Verifikation**:
- [ ] `npm run test:unit` grün, u. a. die Use-Case-Tests mit `onFailure` und
      `problemTexts.test.ts`
- [ ] `npm run test:integration` grün mit den Fehlerfällen der Adapter
- [ ] `npm run test:architecture` und `npm run lint` grün
- [ ] `npm test` grün, inklusive `offline.spec.ts`, `problems.spec.ts` und der neuen
      axe-Fälle

**Manuelle Verifikation**:
- [ ] iPhone mit VoiceOver, Flugmodus an → VoiceOver sagt einmal „Offline – Änderungen
      werden später abgeglichen.“. Der Hinweis steht unter der Navigation und bricht bei
      maximaler Textgröße sauber um.
- [ ] Offline einen Wunsch anlegen und verschenken → Die App reagiert sofort. Flugmodus
      aus → Der Hinweis verschwindet ohne Ansage, und das zweite Gerät zeigt den Wunsch
      als erfüllt.
- [ ] Offline-Hinweis und Warnzeile sehen in allen drei Farbschemata stimmig aus. Die
      Warnzeile lässt sich über ein Konto ohne Freigabe erzeugen, etwa ein zweites in der
      Firebase-Konsole angelegtes Konto.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

**Phase 1**
- `actions/setup-java` und `actions/cache` liegen inzwischen bei v6 (Stand 2026-09-28),
  eingesetzt ist daher `@v6` statt `@v5`.
- npm 11 führt Install-Skripte nur nach Freigabe aus. `@firebase/util` braucht sein
  Postinstall-Skript, sonst fehlt `dist/postinstall.mjs` und der Build scheitert. Freigegeben
  sind `@firebase/util` und `protobufjs` über `allowScripts` in `package.json`, jeweils mit
  exakter Version. Nach einem Update von `firebase` ist dort nachzuziehen
  (`npm approve-scripts @firebase/util protobufjs`). `re2` (optional für firebase-tools)
  bleibt gesperrt.
- Kopf mit Statusleisten-Streifen und `main` liegen in `src/app/layout/AppFrame.svelte`, das
  Tor und `SignedInApp` teilen sich diesen Rahmen.
- Abmelden fordert vorher `requestPageFocus()` an, damit das h1 „Anmelden“ den Fokus bekommt
  und VoiceOver nicht im Leeren steht.
- `e2e/fixtures.ts` braucht ein leeres Objektmuster für die automatische Fixture.
  `eslint.config.js` erlaubt das für `e2e/**` über `no-empty-pattern` mit
  `allowObjectPatternsAsParameters`.
- `outwardTo` hat keinen Standardwert mehr, der Parametertyp steht als JSDoc dabei
  (`tsc -p tsconfig.node.json` prüft `checkJs`).
- `vite.config.ts` importiert `./build/firebaseEnvironment.ts` mit Endung
  (`allowImportingTsExtensions` in `tsconfig.node.json`), sonst warnt Vite 8 wegen
  `configLoader: 'native'`.
- `navigation.spec.ts` „gives both navigation buttons the same width“ wartet jetzt auf die
  Navigation, weil die App nach dem asynchronen Auth-Check erst später rendert.
- Es gibt lokal keine `.env.local`, deshalb bricht `npm run build` ohne Umbenennen ab.
  Gegenprobe: mit gesetzten Variablen gelingt der Build, mit `VITE_FIREBASE_EMULATORS=true`
  bricht er mit „must not be set for a production build“ ab.

**Phase 2**
- `get` liest zuerst aus dem Cache. Hat ein Gerät ein Dokument einmal als „nicht vorhanden“
  gelesen und beobachtet es nicht, bleibt dieser Stand stehen, bis ein Listener ihn
  auffrischt. In der App beobachtet jede Seite ihre Daten, deshalb prüfen die
  Integrationstests das zweite Gerät über `watch`/`watchByWishlist` statt über `get`.
- `isObject` liegt jetzt in `firestore/isObject.ts`, das Lesen mit Cache-Vorrang in
  `firestore/cachedDocument.ts`.
- `historyLength` liegt in `e2e/history.ts`. Neben `storedWishes()` gibt es
  `storedWishlists()`, weil `editing.spec.ts` und `wishlists.spec.ts` die Listen roh lesen.
  Rohdaten nach einer Aktion der App werden mit `expect.poll` gelesen, da die App nicht
  auf den Server wartet.
- Die Firestore-Datenbank im IndexedDB entsteht erst kurz nach dem Anmelden. Die
  Vorbedingung im Abmelde-Test wartet deshalb ebenfalls per `expect.poll`.
- Auf GitHub Actions scheiterte einmal „create wish with problems … light scheme“, weil die
  Überschrift nicht binnen 5 s erschien. Lokal braucht die Seite rund 1 s. Seit die Seiten
  ihre Daten asynchron aus Firestore laden, setzt `playwright.config.ts` das
  Erwartungs-Timeout auf 10 s.
- Die Adaptertests warten über `tests/integration/eventually.ts` bis zu 5 s auf den Abgleich.
  Die 1 s Standard von `vi.waitFor` reichte für die Übertragung auf ein zweites Gerät nicht
  immer.
- Bis Phase 3 melden Listener beim Beenden von Firestore „Firestore shutting down“ auf der
  Konsole der Integrationstests. Das verschwindet mit dem Fehler-Rückruf aus Phase 3.

## Verweise

- Konzept: `docs/agents/research/2026-09-28-wunschliste-konzept.md`
- Vorgänger: `docs/agents/plans/2026-09-28-wunschlisten-und-wuensche-lokal.md` (WL-002),
  `docs/agents/plans/2026-09-28-native-anmutung-knoepfe-ansagen-tastatur.md` (WL-003)
- Architektur: `.claude/skills/architecture/SKILL.md`
- Offline-Cache, `persistentLocalCache`, Schreiben offline:
  https://firebase.google.com/docs/firestore/manage-data/enable-offline
- Auth-Persistenz: https://firebase.google.com/docs/auth/web/auth-state-persistence
- Emulator anbinden: https://firebase.google.com/docs/emulator-suite/connect_firestore
- Regeltests: https://firebase.google.com/docs/rules/unit-tests
- `demo-`-Projekte: https://firebase.google.com/docs/emulator-suite/connect_and_prototype#choose_a_firebase_project
- Öffentliche API-Keys: https://firebase.google.com/docs/projects/api-keys
- Emulator-REST (Konten, Daten löschen):
  https://firebase.google.com/docs/reference/rest/auth ·
  https://firebase.google.com/docs/emulator-suite/connect_firestore#clear_your_database_between_tests
- iOS-Listener nach Hintergrundwechsel: https://github.com/firebase/firebase-js-sdk/issues/4948
- Vite-Env-Dateien und Modi: https://vite.dev/guide/env-and-mode
- `navigator.onLine`: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
