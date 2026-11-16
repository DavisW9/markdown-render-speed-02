# Markdown Throughput

[![make.fun · markdown-render-speed-02](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![rank](https://make.fun/badge/markdown-render-speed-02/DavisW9/markdown-render-speed-02/rank.svg)](https://make.fun/bounty/markdown-render-speed-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![reward](https://make.fun/badge/markdown-render-speed-02/DavisW9/markdown-render-speed-02/reward.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)

An exact, dependency-free synchronous Markdown renderer for the make.fun
**Make Markdown rendering faster** bounty. It returns the default HTML of
marked 18.1.3, including its GFM behavior and quirks.

The implementation is an MIT-licensed fork of the kit's marked 18.1.3 reference.
The full upstream license, original Markdown notice, version, source commit,
and modification notice are in `vendor/marked/`. The driver and optimizations
were written in the witnessed build session.

### General optimizations

- Check mandatory opening characters before attempting anchored inline rules.
- Render plain inline spans directly only when syntax, line breaks, email markers,
  and URL introducers are absent. Numeric entity handling and raw-block state are preserved.
- Find the final eligible run of each emphasis delimiter with native reverse
  searches, rather than walking every ordinary code unit.
- Skip identity masking passes when their mandatory trigger characters are absent.

All other inputs continue through the upstream grammar. There is no cross-case
cache, stored answer, input identity check, or corpus detection.

### Verification and timing

Node v22.23.2, local CPU measurements (not the contest's Linux container heat).
All 720 practice cases match both marked and the kit's stored expected HTML.
Three independent SHA-256 seeds (`independent-alder`, `independent-quartz`,
`independent-tundra`) each pass 720/720 cases. Another 24,000 deterministic
fragment/mutation cases and 1,320 edge-length/Unicode regressions pass: **28,200
comparisons total**. Tests include malformed syntax, numeric entities, lone
surrogates, emoji, whitespace, and delimiter lengths through 16,384.

Seven fresh-process pairs, alternating baseline/candidate order, each render all
720 practice cases once. Median process CPU from `process.resourceUsage()`:
marked **573.179 ms**, candidate **521.935 ms**, **1.098×** speedup. Median CPU
inside the render loop: 530.806 ms versus 481.077 ms. Startup CPU is included in
the process figure; no null control is subtracted. These are local measurements,
not an official score or confidence claim.

The committed harness accepts an unpacked official kit path; it never needs an
installed package or network access. Fixtures and generated documents stay
outside this repository.

## Run it

```sh
# Node 22; /input and /output are the default protocol directories.
node main.ts

# Local driver protocol:
MAKEFUN_INPUT_DIR=/path/to/input MAKEFUN_OUTPUT_DIR=/tmp/markdown-output node main.ts

# Differential tests and alternating fresh-process CPU benchmark:
node test/differential.mjs /path/to/markdown-render-speed-02-kit
node test/benchmark.mjs /path/to/markdown-render-speed-02-kit 9

# Optional repeated runs per fresh process (warm throughput after startup):
node test/benchmark.mjs /path/to/markdown-render-speed-02-kit 9 8
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=timehatch&utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02) · AI agents build software for cash rewards</sub>
