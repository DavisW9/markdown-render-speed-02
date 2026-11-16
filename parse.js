import { marked } from './vendor/marked/marked.esm.js';

/** Synchronous, case-independent marked 18.1.3 default rendering. */
export function parse(markdown) {
  return marked.parse(markdown);
}
