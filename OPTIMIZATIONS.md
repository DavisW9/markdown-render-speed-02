# Why the shortcuts preserve default rendering

The public contract is `parse(string)` with marked 18.1.3 defaults. The vendored
module's extension and nondefault option interfaces are not the public contract.
No optimization uses a case ID, document identity, fixture, seed, or previous case.

1. **Anchored inline dispatch.** Escape starts with `\`, tag/autolink with `<`,
   link/reference with `[` or `!`, emphasis with `*` or `_`, code span with a
   backtick, hard break with space or backslash, and deletion with `~`.
   Failure of these necessary conditions skips only an already failing rule.

2. **Whole plain inline source.** The direct path excludes every inline syntax
   introducer, LF, `@`, and the URL/email protocol triggers. It emits the same
   text token as the remaining inline text path, delegates numeric references
   to the upstream helper, preserves `inRawBlock`, and merges a preceding text
   token with the same concatenation semantics. It never skips block parsing.

3. **Delimiter bounds.** Upstream records the start of the last run of each
   delimiter whose preceding code unit is not space, tab, LF, CR, or form feed.
   `lastCloser` searches each delimiter backwards and applies that exact test.
   A run at offset zero has the same synthetic LF predecessor as upstream.
   Native `lastIndexOf` skips ordinary text; bounds remain code-unit indices.

4. **Masking passes.** Escaped punctuation requires backslash and code masking
   requires a backtick. Block skipping requires `[`, backtick, or `<`. An absent
   trigger makes the corresponding replacement an identity. Present triggers
   always use the unchanged upstream regular expressions and callbacks.

5. **Unicode allocation.** Captured delimiter runs contain only ASCII markers,
   so their code-point count equals their code-unit length. An opening delimiter
   has at most one trailing Unicode code point: subtract one extra unit for a
   surrogate pair. Previous and first code points are selected without spreading
   a whole string into an array. Lone surrogates retain their original behavior.

6. **List work.** Expanding a string with no tabs is an identity at any starting
   column. A single `some` preserves the filter-then-some test for a loose list.
   All six list boundary rules start after zero to three literal spaces with a
   backtick, tilde, hash, angle bracket, bullet, digit, or underscore. Their
   upstream indentation factory clamps to three; the guard rejects only lines
   on which every boundary rule must fail.

7. **Reduced GFM text rule.** Each inline invocation saves and restores a local
   flag saying whether `@`, `http`, `https`, `ftp`, `www.`, `mailto:`, or `xmpp:`
   occurs anywhere in its source (case-insensitive rejection is conservative).
   Without those triggers, the email/protocol/lookbehind branches cannot match.
   The reduced rule retains every other alternative and stopping condition.
   Bare URL tokenization is also impossible under that flag. Nested inline
   invocations restore the enclosing flag; the original rule handles all
   sources with any trigger.

The upstream grammar handles everything outside these sufficient conditions.
The differential harness exercises the complete practice corpus, independent
seeded documents, malformed combinations, mutations of spec examples, and long
ASCII/Unicode delimiter boundaries. Finite testing does not establish universal
correctness by itself; the conditions above explain why each shortcut applies.

To reproduce CPU measurements, use `test/benchmark.mjs`. It launches separate
Node processes in alternating order, counts process user+system CPU, and prints
all samples as well as medians. One repetition measures a cold process over the
entire workload; multiple repetitions additionally measure warmed throughput.
Neither measurement reproduces the contest's cgroup accounting or null control.
