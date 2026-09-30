import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const webSrc = join(dirname(fileURLToPath(import.meta.url)), '../apps/web/src');

function resolveFile(base) {
  const candidates = [base, `${base}.ts`, `${base}.js`, join(base, 'index.ts')];
  for (const file of candidates) {
    if (existsSync(file) && extname(file)) return file;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@core' || specifier.startsWith('@core/')) {
      const rest = specifier === '@core' ? 'core/index.ts' : specifier.replace(/^@core\//, 'core/');
      const file = resolveFile(join(webSrc, rest));
      if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
    }
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL) {
      const parentDir = dirname(fileURLToPath(context.parentURL));
      const file = resolveFile(join(parentDir, specifier));
      if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
});
