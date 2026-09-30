/** Copy authoritative artifacts into the static site. Public copies are generated and gitignored. */
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const jobs = [
  ['packages/schema/schema/1.0', 'apps/web/public/schema/1.0'],
  ['packages/schema/schema/1.0', 'apps/web/public/schema/latest'],
  ['packages/schema/examples', 'apps/web/public/examples'],
  ['specification', 'apps/web/public/specification'],
  ['content', 'apps/web/public/registries']
];

for (const [from, to] of jobs) {
  const source = resolve(from);
  const target = resolve(to);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(resolve(target, '..'), { recursive: true });
  cpSync(source, target, { recursive: true });
}

console.log('Synced schema, examples, specification and registries into apps/web/public');
