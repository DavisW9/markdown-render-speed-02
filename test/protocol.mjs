import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const kit = resolve(process.argv[2] ?? process.env.MAKEFUN_KIT ?? 'kit');
const directory = mkdtempSync(join(tmpdir(), 'markdown-protocol-'));
function run(file, env) {
  const child = spawnSync(process.execPath, [file], { env: { ...process.env, ...env }, encoding: 'utf8' });
  if (child.status !== 0) throw Error(child.stderr);
}
try {
  const outputs = [];
  for (const index of [0, 1]) {
    const output = join(directory, `run-${index}`);
    run(fileURLToPath(new URL('../main.ts', import.meta.url)), {
      MAKEFUN_INPUT_DIR: join(kit, 'practice/input'), MAKEFUN_OUTPUT_DIR: output
    });
    outputs.push(readFileSync(join(output, 'html.json')));
    const scores = join(directory, `scores-${index}`);
    run(join(kit, 'program/scorer/main.ts'), {
      MAKEFUN_OUTPUT_DIR: output, MAKEFUN_REFERENCE_DIR: join(kit, 'practice/reference'), MAKEFUN_SCORES_DIR: scores
    });
    const score = JSON.parse(readFileSync(join(scores, 'scores.json'), 'utf8'));
    if (score.passed !== 1 || score.cases_passed !== 720) throw Error(JSON.stringify(score));
    console.log(`driver ${index + 1}: ${JSON.stringify(score)}`);
  }
  if (!outputs[0].equals(outputs[1])) throw Error('nondeterministic driver bytes');
  console.log(`identical bytes: ${outputs[0].length}; SHA-256: ${createHash('sha256').update(outputs[0]).digest('hex')}`);
} finally { rmSync(directory, { recursive: true, force: true }); }
