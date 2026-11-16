import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parse } from '../parse.js';

const kit = resolve(process.argv[2] ?? process.env.MAKEFUN_KIT ?? 'kit');
const { marked } = await import(pathToFileURL(join(kit, 'baselines/vendor/marked/marked.esm.js')));
let checked = 0;
function check(markdown, label) {
  let expected, actual, referenceError, candidateError;
  try { expected = marked.parse(markdown); } catch (e) { referenceError = e.message; }
  try { actual = parse(markdown); } catch (e) { candidateError = e.message; }
  if (actual !== expected || referenceError !== candidateError) {
    console.error(JSON.stringify({ label, markdown, expected, actual, referenceError, candidateError }));
    process.exit(1);
  }
  checked++;
}
const practice = JSON.parse(readFileSync(join(kit, 'practice/input/cases.json'), 'utf8'));
const expectedPractice = JSON.parse(readFileSync(join(kit, 'practice/reference/expected.json'), 'utf8'));
for (let i = 0; i < practice.length; i++) {
  check(practice[i].markdown, practice[i].id);
  if (parse(practice[i].markdown) !== expectedPractice.cases[i].html) throw Error('kit reference mismatch');
}
console.log(`practice: ${practice.length}/${practice.length}`);

// Three unrelated deterministic instance seeds, derived from public test labels.
const temporary = mkdtempSync(join(tmpdir(), 'markdown-throughput-test-'));
try {
  for (const label of ['independent-alder', 'independent-quartz', 'independent-tundra']) {
    const input = join(temporary, label, 'input');
    const output = join(temporary, label, 'output');
    mkdirSync(input, { recursive: true });
    writeFileSync(join(input, 'seed.json'), JSON.stringify({ schema: 'agent-fun/instance-seed/v1', seed: createHash('sha256').update(label).digest('hex') }));
    const result = spawnSync(process.execPath, [join(kit, 'program/generator/draw.ts')], {
      env: { ...process.env, MAKEFUN_INPUT_DIR: input, MAKEFUN_OUTPUT_DIR: output }, encoding: 'utf8'
    });
    if (result.status !== 0) throw Error(result.stderr);
    const cases = JSON.parse(readFileSync(join(output, 'input/cases.json'), 'utf8'));
    for (const c of cases) check(c.markdown, `${label}/${c.id}`);
    console.log(`${label}: ${cases.length}/${cases.length}`);
  }
} finally { rmSync(temporary, { recursive: true, force: true }); }

// Independent grammar fragments, malformed syntax, Unicode and mutations of spec inputs.
const fragments = ['alpha', 'Hello world', ' ', '\n', '\n\n', '\r\n', '\t', '*', '**', '***', '_', '__', '~', '~~', '`', '``', '\\', '!', '[', ']', '(', ')', '<', '>', '&', '&amp;', '&#0;', '&#x1f600;', '"', "'", '|', '-', '#', ':', 'www.example.org', 'https://x.test/a_(b)', 'a+b@c.example', 'mailto:a@b.co', 'xmpp:a@b.co', 'café', '日本語', '😀', '\ud800', '\udfff', '\u0000', '\u00a0', '\u2028', '<kbd>', '</kbd>', '[x](y)', '[r]: /url', '  \n', '- [x] task\n', '> quote\n', '---\n', 'a|b\n-|-\nx|y\n'];
for (const seed of [17, 923, 0xdeadbeef]) {
  let state = seed >>> 0;
  const random = n => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state % n; };
  for (let i = 0; i < 6000; i++) {
    let text = '';
    const size = 1 + random(45);
    for (let j = 0; j < size; j++) text += fragments[random(fragments.length)];
    check(text, `fragments/${seed}/${i}`);
  }
  for (let i = 0; i < 2000; i++) {
    let text = practice[random(680)].markdown;
    const position = random(text.length + 1);
    text = text.slice(0, position) + fragments[random(fragments.length)] + text.slice(position + random(4));
    check(text, `mutations/${seed}/${i}`);
  }
}
let edges = 0;
for (const length of [0, 1, 2, 3, 4, 7, 15, 31, 32, 63, 64, 127, 128, 255, 256, 999, 1000, 1023, 1024, 4095, 4096, 16384]) {
  for (const unit of ['a', ' ', '*', '_', '~', '`', '&', '\\', '😀', '\ud800', '\r', '\n']) {
    const text = unit.repeat(length);
    for (const markdown of [text, `[${text}](x)`, `*${text}*`, `\n${text}\n`, `<pre>${text}</pre>`]) {
      check(markdown, `edge/${length}/${JSON.stringify(unit)}`);
      edges++;
    }
  }
}
console.log(`fuzz: 24000; edge regressions: ${edges}; total: ${checked}; all exact`);
