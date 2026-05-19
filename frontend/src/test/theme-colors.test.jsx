import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const indexCssPath = path.resolve(import.meta.dirname, '../index.css');
const indexCss = fs.readFileSync(indexCssPath, 'utf8');

describe('Green theme tokens', () => {
  it('defines the approved green accent palette in index.css', () => {
    expect(indexCss).toContain('--color-accent: #2f8f4e;');
    expect(indexCss).toContain('--color-accent-strong: #237242;');
    expect(indexCss).toContain('--color-accent-soft: rgba(47, 143, 78, 0.12);');
  });
});
