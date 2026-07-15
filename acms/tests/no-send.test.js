/**
 * ACMS — no-send.test.js
 * C4 / FR-43 acceptance gate: the codebase must contain NO email-send call
 * anywhere. Draft-only outbound is a hard professional-judgement gate.
 * Run: `node tests/no-send.test.js` from the acms/ directory.
 */

var fs = require('fs');
var path = require('path');

var SRC = path.join(__dirname, '..', 'src');

// Patterns that would indicate an actual send. createDraft / createDraftReply
// are explicitly allowed (they never send). We match send calls, not the
// substring "send" inside comments about NOT sending, by requiring a call form.
var FORBIDDEN = [
  /\.send\s*\(/,                 // message.send(), draft.send()
  /\bsendEmail\s*\(/,            // GmailApp.sendEmail(...)
  /\bsendEmails\s*\(/,
  /GmailApp\.send/,              // any GmailApp.send*
  /MailApp\./                    // MailApp is send-only; ban entirely
];

var offenders = [];
fs.readdirSync(SRC).filter(function (f) { return /\.gs$/.test(f); }).forEach(function (file) {
  var full = path.join(SRC, file);
  var lines = fs.readFileSync(full, 'utf8').split('\n');
  lines.forEach(function (line, i) {
    // Ignore comment-only lines so prose like "never call send()" is allowed.
    var codePart = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    FORBIDDEN.forEach(function (re) {
      if (re.test(codePart)) offenders.push(file + ':' + (i + 1) + '  ' + line.trim());
    });
  });
});

if (offenders.length) {
  console.error('✗ FAIL: send call(s) found in src/ (violates C4/FR-43):');
  offenders.forEach(function (o) { console.error('  ' + o); });
  process.exit(1);
}
console.log('✓ PASSED — no send call found in src/*.gs (C4 draft-only gate holds).');
process.exit(0);
