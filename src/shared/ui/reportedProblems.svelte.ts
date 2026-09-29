let reportedTexts = $state.raw<readonly string[]>([]);

export function reportProblem(text: string): void {
  if (!reportedTexts.includes(text)) {
    reportedTexts = [...reportedTexts, text];
  }
}

export function clearProblems(): void {
  reportedTexts = [];
}

export function problemTexts(): readonly string[] {
  return reportedTexts;
}
