import type { NameProblem } from '../../domain/Name';

export const NAME_PROBLEM_MESSAGES: Record<NameProblem, string> = {
  missing: 'Bitte einen Namen eingeben.',
  tooLong: 'Der Name darf höchstens 100 Zeichen lang sein.',
};
