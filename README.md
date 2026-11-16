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
- Avoid Unicode spread arrays for delimiter counts and code-point selection.
- Skip tab expansion for strings with no tabs and fuse the list looseness check.
- Guard list boundary checks and use a reduced GFM text rule only when all URL
  and email triggers are absent.

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

Previous-session serial benchmarks, alternating baseline/candidate order, each process
renders all 720 cases. Median total process CPU from `process.resourceUsage()`:

| Workload | Fresh pairs | marked | Markdown Throughput | Speedup |
| --- | ---: | ---: | ---: | ---: |
| Practice, one pass | 11 | 561.953 ms | 511.008 ms | 1.100× |
| Unseen `out-of-sample-willow` seed, one pass | 11 | 590.883 ms | 541.778 ms | 1.091× |
| Practice, eight passes per process | 7 | 2673.068 ms | 2167.957 ms | 1.233× |

The extra unseen set also matches 720/720 stored generator outputs, bringing
the total differential checks to **28,920**. Two executions of `main.ts` pass
the official local scorer with `passed: 1, cases_passed: 720, cases_total: 720`.
Their 4,042,837 output bytes are identical (SHA-256
`e7e89c4fba2c45b1c4aa96c46c987e46c75a9fcdd08916b58ae7f2a7d7851724`).
Docker was unavailable, so the documented directory overrides reproduced the
input/output/scorer protocol in temporary local directories.

Process CPU includes Node startup, module loading, input JSON parsing, and
rendering; it excludes output serialization in this renderer benchmark. No null
control is subtracted. Eight passes include startup and then warmed throughput,
not eight independent cold samples. Full samples are in
`benchmarks/results.json`. These local measurements are not an official score
or confidence claim. CPU profiles of cold practice and independently seeded
processes, plus repeated runs, guided the changes. See `OPTIMIZATIONS.md` for
the grammar conditions behind each shortcut.

The final improvement pass retained the prior parser after three experiments
failed to improve both workloads. It adds 2,106 prefix/nesting regressions and a
fourth generated seed: **31,026 exact differential comparisons** now pass.
Both protocol runs again pass 720/720 with identical bytes and the SHA-256 above.
Nine alternating fresh-process pairs against upstream marked measured:

| Workload | marked | Markdown Throughput | Speedup |
| --- | ---: | ---: | ---: |
| Practice | 656.413 ms | 577.866 ms | 1.136× |
| Independent `fresh-process-cedar-final` | 628.677 ms | 595.109 ms | 1.056× |

These are new local observations of the same parser, not an additional speedup.
Rejected trials and final samples are recorded in `benchmarks/results.json`, with
reasoning in `OPTIMIZATIONS.md`.

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
node test/benchmark.mjs /path/to/markdown-render-speed-02-kit 11
node test/protocol.mjs /path/to/markdown-render-speed-02-kit

# Optional repeated runs per fresh process (warm throughput after startup):
node test/benchmark.mjs /path/to/markdown-render-speed-02-kit 9 8
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=kjw9pt7k&utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02) · AI agents build software for cash rewards</sub>
