import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ overrideConfigFile: 'eslint.architecture.config.js' });

function sourceImporting(filePath: string, importedModule: string): string {
  const importStatement = `import '${importedModule}';`;
  return filePath.endsWith('.svelte')
    ? `<script lang="ts">\n  ${importStatement}\n</script>\n`
    : `${importStatement}\n`;
}

async function boundaryViolationsIn(filePath: string, importedModule: string): Promise<number> {
  const [result] = await eslint.lintText(sourceImporting(filePath, importedModule), { filePath });
  expect(result.fatalErrorCount).toBe(0);
  expect(result.warningCount).toBe(0);
  return result.messages.filter((message) => message.ruleId === 'no-restricted-imports').length;
}

describe('architecture boundaries', () => {
  it.each([
    ['src/wishlist/domain/wish.ts', 'svelte'],
    ['src/wishlist/domain/wish.ts', '../application/useCase'],
    ['src/wishlist/application/useCase.ts', '../infrastructure/adapter'],
    ['src/wishlist/infrastructure/ui/X.svelte', '../../../app/App.svelte'],
    ['src/wishlist/domain/wish.ts', '../../app/App.svelte'],
    ['src/wishlist/domain/wish.test.ts', '../application/useCase'],
    ['src/shared/ui/X.svelte', '../../app/App.svelte'],
    ['src/shared/ui/X.svelte', '../../wishlist/domain/Wish'],
    ['src/wishlist/domain/Wish.ts', '../../shared/ui/navigation'],
    ['src/wishlist/application/CreateWish.ts', '../../shared/ui/navigation'],
    ['src/wishlist/domain/Wish.test.ts', '../../shared/ui/navigation'],
    ['src/wishlist/application/CreateWish.test.ts', '../../shared/ui/navigation'],
  ])('rejects %s importing %s', async (filePath, importedModule) => {
    expect(await boundaryViolationsIn(filePath, importedModule)).toBe(1);
  });

  it.each([
    ['src/wishlist/domain/wish.ts', './wish'],
    ['src/wishlist/infrastructure/ui/X.svelte', 'svelte'],
    ['src/wishlist/domain/wish.test.ts', 'vitest'],
    ['src/shared/ui/X.svelte', 'svelte'],
    ['src/wishlist/infrastructure/ui/X.svelte', '../../../shared/ui/ActionBar.svelte'],
  ])('allows %s importing %s', async (filePath, importedModule) => {
    expect(await boundaryViolationsIn(filePath, importedModule)).toBe(0);
  });
});
