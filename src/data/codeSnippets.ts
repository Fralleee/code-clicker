export const CODE_SNIPPETS = [
  "// TODO: refactor this mess",
  "if (works) { dont_touch(); }",
  "const x = undefined as any;",
  "// This should never happen",
  'console.log("here");',
  "git push --force // YOLO",
  "catch (e) { /* ignore */ }",
  "// Written by AI, reviewed by nobody",
  "sleep(1000); // fixes race condition",
  "const isEven = n => n % 2 === 0;",
  "return true; // sometimes false",
  "// I have no idea why this works",
  "if (bug) { ship_anyway(); }",
  "const temp = permanent;",
  "// Temporary fix (2019)",
  "while (true) { pray(); }",
  "// Do not delete this empty line",
  "const pi = 3.14; // close enough",
  'throw new Error("TODO");',
  "// Works on my machine",
  "JSON.parse(JSON.stringify(obj));",
  "arr.sort(); // sorts numbers wrong",
  '!!"false" === true; // JS moment',
  "await new Promise(r => setTimeout(r));",
  "const answer = 42;",
  "rm -rf node_modules && npm install",
  "// The next line is very important",
  "// The previous line is a lie",
  "margin: 0 auto; /* please center */  ",
  "git stash && git stash drop",
];

let lastIndex = -1;

export function getRandomSnippet(): string {
  let index: number;
  do {
    index = Math.floor(Math.random() * CODE_SNIPPETS.length);
  } while (index === lastIndex && CODE_SNIPPETS.length > 1);
  lastIndex = index;
  return CODE_SNIPPETS[index];
}
