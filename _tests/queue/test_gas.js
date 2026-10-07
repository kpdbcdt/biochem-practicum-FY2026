// Unit tests for queue/Code.gs against a Sheets-like mock.
"use strict";
const { makeEnv, api } = require("./gas_mock.js");

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("FAIL", m); } else console.log("ok  ", m); };

const { ctx, rows } = makeEnv();
const call = (p) => api(ctx, p);
const K = "secret";

ok(call({ action: "list", group: "A" }).items.length === 0, "empty list");
ok(call({ action: "add", group: "A", team: "A3", kind: "photo1", key: "bad" }).ok === false, "wrong key rejected");
ok(call({ action: "check", key: K }).ok === true, "check accepts the right key");

const a1 = call({ action: "add", group: "A", team: "A3", kind: "photo1", key: K });
ok(a1.ok && a1.item.status === "waiting" && a1.item.team === "A3" && a1.item.kind === "photo1", "add A3 photo1 stores team and kind");
call({ action: "add", group: "A", team: "A3", kind: "colony", key: K });
call({ action: "add", group: "A", team: "A7", kind: "photo2", key: K });

ok(call({ action: "add", group: "A", team: "A3", kind: "photo1", key: K }).item.id === a1.item.id, "duplicate waiting row returns the existing id");
ok(call({ action: "add", group: "A", team: "B3", kind: "photo1", key: K }).ok === false, "B team in A group rejected");
ok(call({ action: "add", group: "A", team: "A25", kind: "photo1", key: K }).ok === false, "A25 rejected");
ok(call({ action: "add", group: "A", team: "A3", kind: "xx", key: K }).ok === false, "bad kind rejected");
ok(call({ action: "set", id: a1.item.id, status: "bogus", key: K }).ok === false, "bad status rejected");

let L = call({ action: "list", group: "A" });
ok(L.items.length === 3, "list shows 3 rows today although the sheet turned the date cells into Date (got " + L.items.length + ")");
ok(L.items.every((i) => /^q/.test(i.id) && typeof i.id === "string"), "ids keep their q prefix as strings");
ok(L.items.every((i) => i.date && /^\d{4}-\d{2}-\d{2}$/.test(i.date)), "dates read back as yyyy-MM-dd");

ok(call({ action: "set", id: a1.item.id, status: "called", key: K }).item.status === "called", "set called");
call({ action: "set", id: a1.item.id, status: "cancelled", key: K });
ok(call({ action: "list", group: "A" }).items.length === 2, "cancelled rows are hidden");
ok(call({ action: "list", group: "B" }).items.length === 0, "group B list is separate");

rows.push(["qold", "A", "A1", "photo1", "waiting", new Date(), new Date(), new Date(Date.now() - 864e5)]);
ok(call({ action: "list", group: "A" }).items.length === 2, "yesterday's rows are filtered out");

const d1 = call({ action: "add", group: "A", team: "A8", kind: "photo2", key: K });
call({ action: "set", id: d1.item.id, status: "done", key: K });
const d2 = call({ action: "add", group: "A", team: "A8", kind: "photo2", key: K });
ok(d2.item.id !== d1.item.id && d2.item.status === "waiting", "a done team can register again as a new row");

const j = ctx.doGet({ parameter: { action: "list", group: "A", callback: "cb1" } }).getContent();
ok(/^cb1\(\{/.test(j), "JSONP wrapper");
ok(ctx.doGet({ parameter: { action: "list", group: "A", callback: "x);alert(1" } }).getContent().startsWith("{"), "unsafe callback name is ignored");

const noKey = makeEnv({}).ctx;
ok(api(noKey, { action: "add", group: "A", team: "A1", kind: "photo1", key: "" }).error === "STAFF_KEY が設定されていません", "missing STAFF_KEY is reported");

process.exit(fail);
