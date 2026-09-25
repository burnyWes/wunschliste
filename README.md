# Wunschliste

Kürzel `WL` · Bauart `onion` (Domain-Driven Design mit Onion-Architektur)

Der Stack ist noch offen. Projektspezifische Einstellungen und Befehle stehen in
`.claude/projekt.md`, die offenen Aufgaben in `docs/notes.txt`.

## Arbeitsablauf

```
/rpi-research <Frage>       Bestehendes verstehen        -> docs/agents/research/
   |
/rpi-plan <Vorhaben>        Plan erstellen               -> docs/agents/plans/
   |
/rpi-implement <Plan>       Plan Phase für Phase umsetzen
   |
/commit                     Format, Lint, Tests, Architektur, Secrets -> Commit
```

Mit `/grill-me <Vorhaben>` lässt sich ein Entwurf vorher auf Herz und Nieren prüfen.

## Arbeitsweise

- **Sprache:** Gespräch und Dokumente auf Deutsch, Code und Commit-Nachrichten auf Englisch.
- **Architektur:** fachlicher Kontext vor Schicht, Abhängigkeiten zeigen nach innen.
- **Code:** so sprechend geschrieben, dass keine Kommentare nötig sind.
- **Tests:** `domain` und `application` werden test-getrieben entwickelt, ohne Framework.
- **Commits:** im Format `WL-NNN > type: subject`, nur wenn das Gate grün ist.
