import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const { parse } = await import(pathToFileURL(process.argv[2]));
const cases = JSON.parse(readFileSync(process.argv[3], 'utf8'));
let bytes = 0;
const repeats = Number(process.argv[4] ?? 1);
const begin = process.cpuUsage();
for (let iteration = 0; iteration < repeats; iteration++) {
  for (const entry of cases) bytes += parse(entry.markdown).length;
}
const render = process.cpuUsage(begin);
const usage = process.resourceUsage();
console.log(JSON.stringify({ bytes, cases: cases.length, repeats, renderCpuMs: (render.user + render.system) / 1000, processCpuMs: (usage.userCPUTime + usage.systemCPUTime) / 1000 }));
