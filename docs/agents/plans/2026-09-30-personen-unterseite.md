---
date: 2026-09-30T06:14:18+00:00
git_commit: 5230a475b8151f07fb82d6eb2d7a699a77e71626
branch: main
story: WL-008
topic: "Personen und „Ich wechseln“ auf eine eigene Unterseite der Einstellungen"
tags: [plan, wishlist, person, settings, routing, ui]
status: done
---

# PLAN: WL-008 — Personen auf eigener Unterseite

Aus `docs/notes.txt`: „Einstellungen-Seite: Alles was mit Person zu tun hat auf eine
Unterseite“. Der Abschnitt „Ich“ mit „Wechseln“ und die Personenliste ziehen von der
Einstellungsseite auf eine eigene Seite `#/personen`. Auf den Einstellungen bleibt ein
Eintrag, der dorthin führt und zeigt, wer man gerade ist.

## Akzeptanzkriterien

- Die Einstellungsseite zeigt Farbschema, einen Eintrag „Personen ›“ mit der Zeile
  „Ich bin <Name>“ und den Familienzugang. „Ich“ und die Personenliste stehen dort nicht
  mehr.
- Der Eintrag führt zu `#/personen` mit der Überschrift „Personen“, dem Zurück-Knopf
  „‹ Einstellungen“, dem Abschnitt „Ich“ mit „Ich bin <Name>“ und „Wechseln“ sowie dem
  Abschnitt „Alle Personen“ mit dem Knopf „Person erstellen“ (+) und der Personenliste.
- „Wer bist du?“ und „Person bearbeiten“ haben den Zurück-Knopf „‹ Personen“.
- Nach Auswahl einer Person, Erstellen, Speichern, Löschen oder Abbrechen landet man auf
  `#/personen`. Die bisherigen Ansagen („Du bist Anna.“, „Person erstellt.“,
  „Gespeichert.“, „Person „Anna“ gelöscht.“) bleiben unverändert.
- Die Ersteinrichtung ohne Profil (`ProfileSetup`) verhält sich wie bisher.
- Wie alle Unterseiten zeigt `#/personen` keine Hauptnavigation.
- VoiceOver liest den Eintrag auf der Einstellungsseite als „Personen, Ich bin <Name>“ vor.

## Wesentliche Entscheidungen und Abwägungen

1. **Eintrag mit Ich-Angabe:** Der Einstieg auf der Einstellungsseite ist ein zweizeiliger
   Listeneintrag „Personen“ / „Ich bin <Name>“ mit Chevron.
   - Warum: Die wichtigste Information („wer bin ich auf diesem Gerät“) bleibt ohne
     zusätzlichen Schritt sichtbar.
   - Auswirkung: Der Eintrag folgt dem Muster aus `WishlistsPage.svelte:65-73`
     (Name und `note` als Blockelemente in einem `entry-list`-Knopf).
2. **Adresse `persons` im Kontext wishlist:** `{ page: 'persons' }` ↔ `#/personen` in
   `wishlistAddresses.ts`.
   - Warum: Die übrigen Personenseiten (`chooseProfile`, `createPerson`, `editPerson`)
     liegen dort schon. Die App-Schicht kennt nur `settings`.
   - Auswirkung: Die Rücksprungziele der Personenseiten liegen im eigenen Kontext.
     `settingsHash` braucht `WishlistPages` nur noch für den Zurück-Knopf der Personenseite.
     `EditPersonPage` verliert das Prop.
3. **Alle Rücksprünge nach `#/personen`,** auch nach dem Wechseln der Person.
   - Warum: Man landet dort, wo man losgegangen ist.
   - Auswirkung: `switchProfile` und `showCreatedPerson` in `WishlistPages` sowie alle
     `navigateTo`-Aufrufe in `EditPersonPage` zeigen auf `hashOf({ page: 'persons' })`.
4. **Keine Änderung an Domäne und Anwendungsfällen:** Es ist eine reine Umordnung der
   Oberfläche.
   - Auswirkung: Test-getrieben werden nur Adresse und Route
     (`wishlistAddresses.test.ts`, `routes.test.ts`).
5. **Zwischenüberschrift „Alle Personen“:** Auf der Unterseite heißt die Seite
   „Personen“, deshalb heißt die Liste darunter „Alle Personen“.
   - Warum: Sonst steht zweimal hintereinander „Personen“ (h1 und h2).

## Ausgangslage

```
Einstellungen  (#/einstellungen)            src/app/settings/SettingsPage.svelte:8
┌──────────────────────────────────────┐
│ [≡ Wunschlisten] [⚙ Einstellungen]   │  MainNavigation
├──────────────────────────────────────┤
│ Einstellungen                        │
│ Farbschema   ( ) Dunkel ( ) Hell     │  ColorSchemeSettings
│                                      │
│ Ich                                  │  ┐
│ Ich bin Ben                          │  │ PersonSettings.svelte
│ [⇄ Wechseln]                         │  │
│                                      │  │
│ Personen                        [+]  │  │
│  Ben                              ›  │  │
│  Anna                             ›  │  ┘
│                                      │
│ Familienzugang                       │  FamilyAccessSettings
│ Angemeldet als …   [Abmelden]        │
└──────────────────────────────────────┘
```

Heutige Wege (alle Rücksprünge über `settingsHash`, `WishlistPages.svelte:19-56`,
`EditPersonPage.svelte:25,66,82,92,125`):

```
#/einstellungen ──[⇄ Wechseln]──▶ #/wer-bist-du            ‹ Einstellungen, Auswahl ─▶ #/einstellungen
                ──[+]──────────▶ #/person/neu              Erstellen/Abbrechen ─▶ #/einstellungen
                ──[Anna ›]─────▶ #/person/<id>/bearbeiten  ‹ Einstellungen, alles ─▶ #/einstellungen
```

## Zielbild

```
Einstellungen  (#/einstellungen)          Personen  (#/personen)
┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│ [≡ Wunschlisten] [⚙ Einstellungen]│     │ ‹ Einstellungen                  │
├──────────────────────────────────┤      │ Personen                         │
│ Einstellungen                    │      │                                  │
│ Farbschema  ( ) Dunkel ( ) Hell  │      │ Ich                              │
│                                  │      │ Ich bin Ben                      │
│ ──────────────────────────────── │      │ [⇄ Wechseln]                     │
│ Personen                       › │ ───▶ │                                  │
│ Ich bin Ben                      │      │ Alle Personen               [+]  │
│ ──────────────────────────────── │      │ ──────────────────────────────── │
│                                  │      │  Ben                          ›  │
│ Familienzugang                   │      │ ──────────────────────────────── │
│ Angemeldet als …   [Abmelden]    │      │  Anna                         ›  │
└──────────────────────────────────┘      │ ──────────────────────────────── │
                                          └──────────────────────────────────┘
```

```
#/einstellungen ──[Personen ›]──▶ #/personen                ‹ Einstellungen
                                   ├─[⇄ Wechseln]─▶ #/wer-bist-du            ‹ Personen
                                   │                 Auswahl ─▶ #/personen + „Du bist Anna.“
                                   ├─[+]──────────▶ #/person/neu
                                   │                 Erstellen ─▶ #/personen + „Person erstellt.“
                                   │                 Abbrechen ─▶ #/personen
                                   └─[Anna ›]─────▶ #/person/<id>/bearbeiten ‹ Personen
                                                     Speichern/Löschen/Abbrechen ─▶ #/personen
```

## Abstraktionen und Wiederverwendung

- `src/wishlist/infrastructure/ui`
  - `wishlistAddresses.ts` — neue Adresse
    - `WishlistAddress` — Variante `{ page: 'persons' }`
    - `addressPatterns` — `/^#\/personen$/`
    - `hashOf` — `case 'persons': return '#/personen'`
  - `wishlistAddresses.test.ts` — Zeile `['#/personen', { page: 'persons' }]` in `addresses`
  - `PersonsPage.svelte` — **neu**, übernimmt Inhalt und Datenbeschaffung aus
    `PersonSettings.svelte` samt `PageHeader` mit `back`
  - `PersonSettings.svelte` — wird zum Einstiegseintrag (ohne `watchPersons`)
  - `WishlistPages.svelte` — Zweig `persons`, Rücksprünge auf `personsHash`
  - `EditPersonPage.svelte` — Prop `settingsHash` entfällt, Rücksprung auf `#/personen`
- `src/app/router/routes.test.ts` — `resolveRoute('#/personen')` und
  `mainPageOf({ page: 'persons' })` ist `undefined`
- `e2e`
  - `persons.spec.ts` — Einstieg über die neue Seite, Rücksprünge auf „Personen“, neuer
    Test für Eintrag, Zurück-Knopf und fehlende Hauptnavigation
  - `accessibility.spec.ts` — neue Seite `./#/personen` in `pages`
- Wiederverwendet: `PageHeader` (Zurück-Knopf), `entry-list` (`src/shared/ui/entryList.css`),
  `navigateTo`, `useCurrentProfile`.

`routes.ts` selbst braucht keine Änderung: `resolveRoute` fällt über
`parseWishlistAddress` auf die neue Adresse, `mainPageOf` liefert für sie `undefined`.

## Umsetzung

Abhängigkeiten: keine.

Ein einziger Schnitt, weil Adresse, neue Seite, Einstiegseintrag und umgehängte
Rücksprünge nur zusammen ein benutzbares Ergebnis ergeben.

**Aufgaben**:

- [x] Test zuerst: In `wishlistAddresses.test.ts` die Zeile
  `['#/personen', { page: 'persons' }]` in `addresses` aufnehmen und
  `'#/personen/x'` unter „rejects“ ergänzen. Test schlägt fehl.
- [x] Test zuerst: In `routes.test.ts` bei `resolveRoute` den Fall
  `['#/personen', { page: 'persons' }]` ergänzen, bei `mainPageOf` den Fall
  `[{ page: 'persons' }, undefined]`.
- [x] `wishlistAddresses.ts`: Variante `{ page: 'persons' }`, Muster
  `{ pattern: /^#\/personen$/, toAddress: () => ({ page: 'persons' }) }` und
  `case 'persons': return '#/personen';` ergänzen. Tests grün.
- [x] Neue Seite `src/wishlist/infrastructure/ui/PersonsPage.svelte` mit Prop
  `settingsHash: string`. Den Inhalt aus `PersonSettings.svelte:1-95` übernehmen und in
  `<div class="page">` mit `PageHeader` einbetten:
  ```svelte
  <div class="page">
    <PageHeader heading="Personen" back={{ label: 'Einstellungen', hash: settingsHash }} />
    <section aria-labelledby="{id}-me">
      <h2 id="{id}-me">Ich</h2>
      <p>Ich bin {profile.me.name.value}</p>
      <div class="button-row"> … [⇄ Wechseln] … </div>
    </section>
    <section aria-labelledby="{id}-persons">
      <div class="heading-row">
        <h2 id="{id}-persons">Alle Personen</h2>
        … [+] aria-label="Person erstellen" …
      </div>
      … entry-list wie bisher …
    </section>
  </div>
  ```
  Styles (`section`, `h2`, `.heading-row`, `p`) mitnehmen.
- [x] `PersonSettings.svelte` zum Einstiegseintrag umbauen: `watchPersons`, `persons`,
  `havePersonsFailed` und `$props.id()` entfallen, ebenso die Importe von
  `ArrowLeftRight`, `Plus`, `Person`, `useWishlistModule` und `LOAD_FAILED_MESSAGE`.
  ```svelte
  <ul class="entry-list">
    <li>
      <button type="button" onclick={() => navigateTo(hashOf({ page: 'persons' }))}>
        <span>
          <span class="title">Personen</span>
          <span class="note">Ich bin {profile.me.name.value}</span>
        </span>
        <ChevronRight aria-hidden="true" size="1.25em" />
      </button>
    </li>
  </ul>
  ```
  Styles: `.title, .note { display: block; }`, `.note { overflow-wrap: anywhere; }`,
  `ul { margin-bottom: 1.5rem; }`. Der Abstand zum Farbschema darüber kommt schon vom
  `fieldset` in `ChoiceGroup.svelte:43` (`margin: 0 0 1rem`). `SettingsPage.svelte` bleibt
  unverändert (Reihenfolge Farbschema, Personen, Familienzugang).
- [x] `WishlistPages.svelte`:
  - `const personsHash = hashOf({ page: 'persons' });`
  - neuer Zweig `{:else if address.page === 'persons'} <PersonsPage {settingsHash} />`
  - `switchProfile` und `showCreatedPerson` navigieren auf `personsHash`
  - `ChooseProfilePage`: `back={{ label: 'Personen', hash: personsHash }}`
  - `CreatePersonPage`: `oncancel={() => navigateTo(personsHash)}`
  - `EditPersonPage` ohne `{settingsHash}` aufrufen
- [x] `EditPersonPage.svelte`: Prop `settingsHash` entfernen. Stattdessen
  `const personsHash = hashOf({ page: 'persons' });` (Import aus `./wishlistAddresses`).
  `back={{ label: 'Personen', hash: personsHash }}`, sämtliche `navigateTo(settingsHash)`
  auf `navigateTo(personsHash)`.
- [x] `e2e/persons.spec.ts` umstellen:
  - `personsSection` sucht die Region `'Alle Personen'`.
  - `openSettings` wird zu `openPersons`: `page.goto('./#/personen')` und Überschrift
    „Personen“ erwarten. Alle bestehenden Tests starten dort.
  - Wo heute `pageHeading(page, 'Einstellungen')` nach Wechseln, Erstellen, Umbenennen
    oder Löschen erwartet wird, gilt künftig `pageHeading(page, 'Personen')` (fokussiert).
  - `'Zurück zu Einstellungen'` in „switches the profile …“ wird zu
    `'Zurück zu Personen'`. Den Testnamen auf „… goes back to the persons“ anpassen.
  - „asks who uses the device after deleting the own person“: Die URL bleibt
    `#/personen`. Nach `chooseProfile` ist „Personen“ fokussiert.
  - „shows who uses the device and all persons in the settings“ ersetzen durch zwei Tests:
    - `'shows who uses the device in the settings and leads to the persons'`: Auf
      `./#/einstellungen` ist der Knopf `{ name: /^Personen\s*Ich bin Anna$/ }` sichtbar, die
      Region „Alle Personen“ und der Knopf „Wechseln“ fehlen (`toHaveCount(0)`). Ein Klick
      führt zu `#/personen`, „Personen“ ist fokussiert, und die Hauptnavigation fehlt
      (`getByRole('navigation', { name: 'Hauptnavigation' })` hat `toHaveCount(0)`).
      `'Zurück zu Einstellungen'` führt zurück, „Einstellungen“ ist fokussiert.
    - `'shows who uses the device and all persons on the persons page'`: Auf
      `./#/personen` steht „Ich bin Anna“, die Liste zeigt `['Anna', 'Ben', 'Oma']`.
  - Neuer Test `'goes back to the persons when cancelling the creation'`: „Person
    erstellen“ → „Abbrechen“ → „Personen“ fokussiert.
  - Neuer Test `'leads from editing a person back to the persons'`: „Ben“ öffnen →
    `'Zurück zu Personen'` → „Personen“ fokussiert.
- [x] `e2e/accessibility.spec.ts`: In `pages` nach „settings with persons“ den Eintrag
  `{ name: 'persons', path: './#/personen', heading: 'Personen', data: wishlistsOfSeveralOwners }`
  aufnehmen. „settings with persons“ in „settings“ umbenennen und `data` behalten.
- [x] `docs/notes.txt`: Den Eintrag „m Einstellungen-Seite: Alles was mit Person zu tun hat
  auf eine Unterseite“ nach Abnahme auf `x` setzen und unverändert nach DONE verschieben.

**Automatisierte Verifikation**:

- [x] `wishlistAddresses.test.ts`: `#/personen` wird hin und zurück abgebildet,
  `#/personen/x` wird abgelehnt.
- [x] `routes.test.ts`: `resolveRoute('#/personen')` ergibt `{ page: 'persons' }`,
  `mainPageOf({ page: 'persons' })` ist `undefined`.
- [x] `grep -rn "settingsHash" src/wishlist/infrastructure/ui/EditPersonPage.svelte` findet
  nichts mehr.
- [x] `npm run lint` läuft durch (inklusive `svelte-check`, damit die Vollständigkeit der
  `switch`-Anweisung in `hashOf` geprüft ist).
- [x] `e2e/persons.spec.ts` läuft grün: Einstieg aus den Einstellungen, Zurück-Knopf,
  fehlende Hauptnavigation, Rücksprünge nach Wechseln, Erstellen, Abbrechen, Umbenennen
  und Löschen jeweils auf „Personen“ samt Ansagen.
- [x] `e2e/profile.spec.ts` läuft unverändert grün (Ersteinrichtung ohne Zurück-Knopf).
- [x] `e2e/accessibility.spec.ts` läuft grün, auch für `./#/personen`.
- [x] `npm test` läuft durch (Architektur, Unit, Integration, E2E).
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver: Der Eintrag in den Einstellungen wird verständlich als
  „Personen, Ich bin <Name>, Taste“ angesagt. Die beiden Zeilen stehen sauber
  untereinander, auch bei sehr großer Schrift.
- [x] Auf dem iPhone mit VoiceOver: Nach „Wechseln“ und Auswahl landet der Fokus auf
  „Personen“, und „Du bist <Name>.“ wird angesagt.

## Notizen zur Umsetzung

## Verweise

- `docs/notes.txt` — TODO-Eintrag „Einstellungen-Seite: Alles was mit Person zu tun hat auf
  eine Unterseite“
- `docs/agents/plans/2026-09-29-personen-profilwahl-besitzerin.md` (WL-005) — Einführung
  von Profilwahl und Personenverwaltung
- `src/wishlist/infrastructure/ui/WishlistsPage.svelte:65-73` — Muster für zweizeilige
  Listeneinträge
