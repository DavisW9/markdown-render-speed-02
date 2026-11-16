import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const kit = resolve(process.argv[2] ?? process.env.MAKEFUN_KIT ?? 'kit');
const rounds = Number(process.argv[3] ?? 9);
const repeats = Number(process.argv[4] ?? 1);
const cases = process.argv[5] ? resolve(process.argv[5]) : join(kit, 'practice/input/cases.json');
const worker = fileURLToPath(new URL('./benchmark-worker.mjs', import.meta.url));
const modules = { baseline: process.argv[6] ? resolve(process.argv[6]) : join(kit, 'baselines/parse.js'), candidate: fileURLToPath(new URL('../parse.js', import.meta.url)) };
const records = { baseline: [], candidate: [] };
for (let round = 0; round < rounds; round++) {
  for (const name of round % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
    const child = spawnSync(process.execPath, [worker, modules[name], cases, String(repeats)], { encoding: 'utf8' });
    if (child.status !== 0) throw Error(child.stderr);
    const record = JSON.parse(child.stdout);
    records[name].push(record);
  }
}
const median = values => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];
const summary = {};
for (const [name, values] of Object.entries(records)) summary[name] = {
  cases: values[0].cases, repeats, outputCodeUnits: values[0].bytes,
  medianProcessCpuMs: median(values.map(v => v.processCpuMs)),
  medianRenderCpuMs: median(values.map(v => v.renderCpuMs)),
  processCpuMs: values.map(v => v.processCpuMs)
};
summary.speedup = summary.baseline.medianProcessCpuMs / summary.candidate.medianProcessCpuMs;
console.log(JSON.stringify({ node: process.version, rounds, methodology: 'fresh processes, alternating baseline/candidate order; process.resourceUsage CPU, no null subtraction', ...summary }, null, 2));
