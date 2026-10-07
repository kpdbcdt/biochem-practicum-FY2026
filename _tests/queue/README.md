# queue tests

Tests for the chapter 5 day-2 photo/colony queue (`queue/Code.gs`, `queue/index.html`, `queue/staff.html`, `queue/queue.js`).

```bash
cd _tests/queue
npm ci        # first time only (installs jsdom into node_modules/, which git ignores)
npm test      # all three suites; exits non-zero on any FAIL
```

| File | What it checks |
| --- | --- |
| `test_gas.js` | `Code.gs` on a Sheets-like mock that converts dates and numbers the way real Sheets does: key check, team/kind/status validation, duplicate handling, today's-date filter, cancelled rows hidden, JSONP callback safety |
| `test_e2e.js` | The real pages over a local server with real JSONP: staff login, row ① registers photo + colony, ordering, call, student position messages, no write buttons for students, hand-typed sheet rows not rendered as HTML |
| `test_slow.js` | Staff console with 1.5 s simulated latency (the 2026-10-02 incident): instant feedback, no double call, ↩ undo, rollback on server error |

Helpers: `gas_mock.js` (Apps Script mocks), `site_server.js` (serves the repo root; rewrites `queueApi` in `config.js` to the local mock).

The production key is never used here; the mock key is `secret`.
After changing `Code.gs`, the PI must paste it into the sheet's Apps Script and deploy a new version (Deploy → Manage deployments → Edit → New version) — the tests cannot reach the deployed copy.
