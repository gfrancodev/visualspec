import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { catalogPath, docsPath, readJson, repoRoot } from '../apps/web/src/core/fs/repo-root.ts';
import { parseFrontmatter, renderMarkdown } from '../apps/web/src/core/markdown/parse.ts';
import {
  getUseCase,
  listUseCases,
  useCaseArtifactReady,
  useCaseArtifactsCatalogPath
} from '../apps/web/src/feature/use-cases/catalog.ts';

describe('core/fs', () => {
  it('resolves repoRoot independently of file depth', () => {
    assert.equal(existsSync(join(repoRoot, 'packages/schema')), true);
    assert.equal(existsSync(join(repoRoot, 'apps/web')), true);
    assert.equal(existsSync(docsPath), true);
    assert.equal(existsSync(catalogPath), true);
  });

  it('reads JSON from the repo', () => {
    const docs = readJson(docsPath);
    assert.equal(Array.isArray(docs), true);
    assert.ok(docs.some((doc) => doc.slug === 'why'));
  });
});

describe('core/markdown', () => {
  it('parses YAML frontmatter', () => {
    const { meta, body } = parseFrontmatter('---\ntitle: Hello\nstatus: draft\n---\n# Body\n');
    assert.equal(meta.title, 'Hello');
    assert.equal(meta.status, 'draft');
    assert.equal(body, '# Body\n');
  });

  it('renders trusted markdown to HTML', () => {
    const html = renderMarkdown('**bold**');
    assert.match(html, /<strong>bold<\/strong>/);
  });
});

describe('feature/use-cases catalog', () => {
  it('loads a single catalog of examples, artifacts and targets', () => {
    const useCases = listUseCases();
    assert.ok(useCases.length >= 12);
    const hello = getUseCase('hello');
    assert.ok(hello);
    assert.equal(hello.title, 'Hello Visual Spec');
    assert.equal(hello.artifactKind, 'html');
    assert.equal(hello.preview, '/targets/hello/index.html');
    assert.match(hello.modelLabel ?? '', /openai/);
    assert.equal(useCaseArtifactReady('hello'), true);
    assert.equal(existsSync(useCaseArtifactsCatalogPath), true);
  });
});
