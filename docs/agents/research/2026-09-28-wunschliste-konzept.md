---
date: 2026-09-28T07:36:47+00:00
git_commit: 03c10d66e58bc56344e1860f09b94dcdc50db6eb
branch: main
topic: "Konzept der Wunschliste-App (Ergebnis grill-me)"
tags: [concept, requirements, wishlist, pwa, firestore, svelte, voiceover]
status: complete
---

# Konzept: Wunschliste-App

Ergebnis einer grill-me-Befragung auf Basis von `docs/notes.txt`. Alle Punkte sind mit
dem Nutzer abgestimmt. Dieses Dokument ist die Quelle der Wahrheit für die Planung.

## Ausgangslage

- iOS-App **ohne Swift** und **ohne Apple-Developer-Account**, ausgeliefert über
  **GitHub Pages** → **PWA**, installiert über „Zum Home-Bildschirm“.
- Daten synchron auf mehreren Geräten.
- **VoiceOver first**: alles muss mit VoiceOver gut bedienbar sein.
- Repository ist beim Start leer (nur Template).

## Nutzung und Fachlichkeit

### Zugang und Personen

- **Ein gemeinsamer Familienzugang** (ein Firebase-Konto, E-Mail + Passwort). Alle Geräte
  sehen alle Listen.
- Keine Selbstregistrierung — das Konto wird einmalig von Hand in der Firebase-Konsole
  angelegt.
- **Profil pro Gerät**: beim ersten Start „Wer bist du?“ → Auswahl einer Person oder
  „+ Neu“. Die Wahl wird lokal gespeichert und ist in den Einstellungen wechselbar.
- Personen werden in der App angelegt und umbenannt (Einstellungen und Profilwahl).
- Eine Person kann nur gelöscht werden, wenn ihr **keine Wunschliste gehört**.
- Die Geheimhaltung ist **Ehrensache**: Mit einem gemeinsamen Zugang sind alle Daten
  technisch lesbar, die App blendet nur aus.

```
 Erster Start auf einem Gerät                    Jeder weitere Start
 ┌───────────────────────────┐   ┌──────────────────┐
 │ Familien-Zugang           │   │ Wer bist du?     │   → direkt „Wunschlisten“
 │ E-Mail   [____________]   │ → │ [Anna] [Ben]     │
 │ Passwort [____________]   │   │ [Oma ] [+ Neu]   │
 │ [Anmelden]                │   └──────────────────┘
 └───────────────────────────┘
```

### Wunschlisten

- Jede Wunschliste gehört **genau einer Person** (Besitzerin).
- Beim Erstellen ist die Besitzerin **wählbar**, vorausgewählt ist das eigene Profil.
- Die Besitzerin ist **nachträglich nicht änderbar**.
- Eine Liste kann umbenannt und gelöscht werden (Seite „Wunschliste erstellen/bearbeiten“).

### Wünsche

| Feld | Pflicht | Form |
|---|---|---|
| Name | ja | Text |
| Link | nein | URL; ohne `http(s)://` wird `https://` vorangestellt; öffnet in Safari |
| Beschreibung | nein | mehrzeiliger Freitext ohne Formatierung |
| Preis | nein | Eurobetrag, Kommaeingabe, Zifferntastatur |
| Rating | nein | „Wie sehr gewünscht“: nett / gern / unbedingt / keine Angabe |
| Geheim | – | Häkchen, nur in fremden Listen sichtbar, dort Voreinstellung „geheim“ |

- Sortierung: unbedingt → gern → nett → ohne Angabe, innerhalb einer Stufe alphabetisch.
  Kein manuelles Umsortieren.
- Keine Bilder (vorgemerkt als `m` in `docs/notes.txt`).

### Geheim-Einträge

- Wer in einer **fremden** Liste einen Wunsch anlegt, kann ihn per Häkchen geheim
  machen. Voreinstellung dort: geheim. In der **eigenen** Liste wird das Häkchen nicht
  angezeigt.
- **Alle außer der Besitzerin** sehen den Eintrag im Klartext mit Kennzeichnung
  „🤫 von Ben“.
- Die **Besitzerin** sieht pro Geheim-Eintrag einen Platzhalter „🎁 Überraschung“, nur
  unter „Noch offen“, nicht antippbar, nicht bearbeit- oder löschbar.
- Ergänzung aus WL-006: Statt einer Zeile je Eintrag gibt es **eine** Zeile
  „🎁 N Überraschungen“ am Ende der offenen Wünsche. Die Besitzerin erreicht einen
  Geheim-Eintrag nicht, deshalb meldet der **Schenkende** mit „Übergeben“ die Übergabe.
  Beim Bearbeiten lässt sich „Geheim“ nur abwählen.

```
 Annas Ansicht ihrer Liste              Omas Ansicht von Annas Liste
 ┌──────────────────────────────┐       ┌──────────────────────────────┐
 │ • Buch „Dune“                │       │ • Buch „Dune“                │
 │ • Fahrradhelm                │       │ • Fahrradhelm                │
 │ • 🎁 Überraschung            │       │ • 🤫 Konzertkarten (von Ben) │
 └──────────────────────────────┘       └──────────────────────────────┘
```

### Schenken und Erhalten

- Tippt jemand anderes als die Besitzerin auf **Schenken**, gilt der Wunsch für alle
  anderen als „Erfüllt – von Ben“. **Für die Besitzerin bleibt er offen.**
- Die Besitzerin tippt selbst auf **Erhalten** (derselbe Knopfplatz auf der Detailseite);
  erst dann ist er auch für sie erfüllt.
- Schenken ist zurücknehmbar („Schenken zurücknehmen“).
- Pro Wunsch genau **ein** Schenkender; ist er vergeben, gibt es für andere keinen
  Schenken-Knopf mehr. Keine Gemeinschaftsgeschenke.
- Gilt gleichermaßen für Geheim-Einträge: nach „Erhalten“ wird aus dem Platzhalter ein
  normaler erfüllter Wunsch.
- Ergänzungen aus WL-006:
  - Die Besitzerin sieht bei normalen Wünschen **immer** „Erhalten“, auch ohne
    Schenkenden. Sonst verrieten unterschiedliche Knöpfe ein Geschenk. Ohne Schenkenden
    heißt der Wunsch danach nur „Erfüllt“.
  - „Schenken zurücknehmen“ gibt es nur für den Schenkenden und nur vor dem Erhalten.
  - Nach dem Erhalten sieht auch die Besitzerin „Erfüllt – von Ben“.

```
 Ben schaut Annas Wunsch an              Anna schaut ihren Wunsch an
 │ [✏ Bearbeiten] [🎁 Schenken] │        │ [✏ Bearbeiten] [✓ Erhalten]  │
```

### Bearbeiten und Löschen

- Alle dürfen alles bearbeiten und löschen (keine Rechte).
- Löschen steht **am Ende des Formulars**, nicht in der fixierten Leiste, mit
  Sicherheitsabfrage (bei Listen mit Anzahl der Wünsche).
- Löscht die Besitzerin einen Wunsch, der heimlich verschenkt wurde, oder eine Liste mit
  heimlich verschenkten bzw. geheimen Einträgen, **verschwindet er nur für sie**. Die
  anderen sehen „⚠ Anna hat diesen Wunsch entfernt“ und können endgültig löschen.

## Oberfläche

### Seiten

```
 ┌─────────────────────────────────────┐
 │ [☰ Wunschlisten]    [⚙ Einstellungen] │  ← oben fixiert
 └─────────────────────────────────────┘

 Wunschlisten                     [+]      Seite einer Wunschliste
 ── Anna (ich) ──                          Geburtstag 2027      [✏] [+]
 • Geburtstag 2027                         [🎁 Noch offen] [📦 Erfüllt]
 ── Ben ──                                 • Fahrradhelm
 • Weihnachten                               ★★★ unbedingt · 49,99 €

 Wunschliste erstellen/bearbeiten          Wunsch-Detailseite
 Name  [__________]                        …
 Für   (•) Anna ( ) Ben ( ) Oma            [✏ Bearbeiten] [🎁 Schenken]   ← unten fixiert
       (beim Bearbeiten nur Anzeige)
 [🗑 Wunschliste löschen]  (nur Bearbeiten) Wunsch erstellen/bearbeiten
 [+ Erstellen] bzw.                        Name, Link, Beschreibung, Preis,
 [💾 Speichern] [✕ Abbrechen]  ← fixiert   Wie sehr?, Geheim (nur fremde Liste)
                                           [🗑 Wunsch löschen]  (nur Bearbeiten)
 Einstellungen                             [💾 Speichern] [✕ Abbrechen]  ← fixiert
 Farbschema
   Dunkel      ✓
   Hell
   Invertiert
 Ich bin: Anna   [Wechseln]
 Personen                     [+]
 • Anna • Ben • Oma
 [Abmelden]
```

- Filter „Noch offen / Erfüllt“ (Icons Geschenk und offene Kiste): zwei gleich breite
  Umschaltknöpfe nebeneinander in einer Zeile, genau einer aktiv
  (VoiceOver: „Noch offen, ausgewählt“). Ergänzung aus WL-007.
- Der Knopf „Wunschlisten“ in der Navigation trägt ein Listen-Icon (WL-007).
- Leere Zustände: ein Satz plus Knopf („Noch keine Wunschlisten. [+ Wunschliste erstellen]“).
- Offline: dezenter Hinweis „Offline – Änderungen werden später abgeglichen“, von
  VoiceOver einmal angesagt.
- Nach jedem Seitenwechsel springt der Fokus auf die Überschrift der neuen Seite.
- Kopf-Knöpfe ([+], [✏]) nur mit Icon, aber mit zugänglichem Namen („Wunsch erstellen“).
  Fixierte Knöpfe unten mit Icon und Text.
- Icons: Lucide als eingebettete SVGs, für VoiceOver stumm.
- Schriftgröße folgt der iOS-Einstellung (Dynamic Type).
- Nur Deutsch. Name auf dem Home-Bildschirm „Wunschliste“, Icon: Geschenk.

### Farbschema

Drei Radiobuttons (echte Radiogruppe, `fieldset`/`legend` „Farbschema“), optisch wie die
Checkbox aus den Notizen: nur linke und untere Linie, großer Haken bei der gewählten
Option. Standard: Dunkel. Die Wahl gilt **pro Gerät** und wird nicht synchronisiert.

| Element | Dunkel | Hell | Invertiert |
|---|---|---|---|
| Hintergrund | `#000000` | `#FFFFFF` | `#FFFFFF` |
| Schrift | `#FFFFFF` | `#000000` | `#000000` |
| Button-Fläche | `#002366` | `#002366` | `#FFDC99` |
| Button-Schrift | `#FFFFFF` | `#FFFFFF` | `#000000` |
| Button-Rand | `#93C5FD` | `#000000` | `#6C3A02` |
| Haken | `#22FF22` | `#15803D` | `#DD00DD` |
| Streifen hinter der iOS-Statusleiste | `#000000` | `#000000` | `#000000` |

## Technik

| Bereich | Entscheidung |
|---|---|
| Auslieferung | PWA auf GitHub Pages, `https://burnywes.github.io/wunschliste/` (Repo `burnyWes/wunschliste`, Vite `base: '/wunschliste/'`), keine eigene Domain |
| Oberfläche | Svelte 5 + Vite + TypeScript, **kein SvelteKit**, Hash-Router (`#/liste/123`) |
| PWA | `vite-plugin-pwa` (Manifest, Service Worker, offline startfähig) |
| Daten | Firebase **Firestore** mit Offline-Cache, Live-Sync; letzte Änderung gewinnt |
| Login | Firebase Auth, ein E-Mail-/Passwort-Konto; Sitzung bleibt auf dem Gerät |
| Zugriffsregeln | `firestore.rules`: Lesen/Schreiben nur für das Familienkonto; Ausrollen von Hand per Firebase-CLI |
| Tests | Vitest für `domain`/`application` (In-Memory-Fakes); Firestore-Adapter gegen Firebase-Emulator (Java nötig); Playwright + axe-core für die Oberfläche |
| Repository | öffentlich |
| Firebase-Konfiguration | GitHub-Actions-Variablen `VITE_FIREBASE_…`, lokal `.env.local` (ignoriert) |
| CI/CD | Push auf `main` → Lint, Tests, Build → Deploy auf GitHub Pages. Kein Staging |
| Manuelle Prüfung | VoiceOver auf dem iPhone an der veröffentlichten Version |

- Erster Start ohne Netz ist nicht möglich (Login braucht Netz).
- Firebase-Projekt und Familienkonto legt der Nutzer selbst an, nach einer
  mitgelieferten Anleitung.

## Architektur

- Bauart `onion`, ein fachlicher Kontext **`wishlist`** (Personen gehören dazu, weil sie
  nur als Besitzer und Schenkende existieren).
- Rahmen der Anwendung (Einstieg, Router, Layout, Farbschema) liegt in der
  Kompositionswurzel `src/app/` außerhalb des Kontexts (entschieden in Plan WL-001).
  Kein Kontext importiert `app`.

```
 src/
 └── wishlist/
     ├── domain/          reines TS: Person, Wishlist, Wish, Regeln geheim/geschenkt/erhalten
     ├── application/     Use Cases + Ports (Repositories, Profil-Speicher)
     └── infrastructure/  Firestore-Adapter, lokaler Adapter, Svelte-Oberfläche
```

- Datenmodell (Details im Plan): Sammlungen für Personen, Wunschlisten und Wünsche. Ein
  Wunsch trägt u. a. `createdBy`, `secret`, `giftedBy`, `receivedAt` und eine Markierung
  „für die Besitzerin ausgeblendet“.
  - Umgesetzt in WL-006 als `createdBy`, `secret`, `giverId`, `received` (Boolean statt
    `receivedAt`, weil kein Datum angezeigt wird) und `removedByOwner`. Wunschlisten
    tragen ebenfalls `removedByOwner`.

## Umsetzungsreihenfolge

Jeder Schritt bekommt einen eigenen Plan (`rpi-plan`) mit Story-Nummer `WL-NNN`.

| Schritt | Inhalt | Auf dem iPhone prüfbar |
|---|---|---|
| 1 | Gerüst: Svelte/Vite/TS, Lint, Tests, Actions, Deploy, Manifest, Navigation, leere Seiten, Farbschemata | Installation, Navigation, Fokus, VoiceOver-Grundgefühl |
| 2 | Wunschlisten und Wünsche erstellen/bearbeiten/löschen, Offen/Erfüllt, Rating, Preis — Speicherung **lokal** (localStorage-Adapter) | komplette Bedienung auf einem Gerät |
| 3 | Firestore-Adapter, Login, Offline, Sync | zwei Geräte gleichzeitig |
| 4 | Personen, Profilwahl, Besitzer, gruppierte Übersicht | „Wer bist du?“ |
| 5 | Geheim-Einträge, Platzhalter, Schenken/Erhalten, „nur für die Besitzerin gelöscht“ | Überraschungslogik |

- Lokale Daten aus Schritt 2 werden beim Wechsel auf Firestore **nicht** übernommen.
- Der lokale Adapter bleibt als In-Memory-Fake für Tests erhalten. Diese Rolle übernehmen
  die Fakes in `application/fakes/`, der localStorage-Adapter selbst ist mit WL-004 entfallen.

## Offene Fragen

Keine.
