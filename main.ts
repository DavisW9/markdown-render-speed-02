import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parse.js';

// Directory overrides are the only runtime configuration; every case is independent.
const inputDirectory = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const outputDirectory = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const cases = JSON.parse(readFileSync(join(inputDirectory, 'cases.json'), 'utf8'));
const rendered = new Array(cases.length);
for (let index = 0; index < cases.length; index++) {
  rendered[index] = parse(cases[index].markdown);
}
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(join(outputDirectory, 'html.json'), JSON.stringify(rendered));
