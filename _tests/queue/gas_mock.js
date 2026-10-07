// Minimal Google Apps Script mocks for queue/Code.gs.
// The sheet mock converts values the way real Google Sheets does on write
// (date-like strings -> Date, ISO timestamps -> Date, numeric strings -> Number),
// because Code.gs has to survive exactly that.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const CODE = path.resolve(__dirname, "../../queue/Code.gs");

function makeEnv(props = { STAFF_KEY: "secret" }) {
  const rows = [];
  const sheets = {};
  const conv = (v) => {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + "T00:00:00+09:00");
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v);
    if (typeof v === "string" && /^\d+(e\d+)?$/i.test(v)) return Number(v);
    return v;
  };
  const sheet = {
    getLastRow() { return rows.length; },
    getRange(r, c, nr, nc) {
      return {
        setValues(vals) { vals.forEach((row, i) => { rows[r - 1 + i] = rows[r - 1 + i] || []; row.forEach((v, j) => { rows[r - 1 + i][c - 1 + j] = conv(v); }); }); },
        getValues() {
          const out = [];
          for (let i = 0; i < (nr || 1); i++) out.push(Array.from({ length: nc || 1 }, (_, j) => ((rows[r - 1 + i] || [])[c - 1 + j] ?? "")));
          return out;
        },
        setValue(v) { rows[r - 1][c - 1] = conv(v); },
      };
    },
    setFrozenRows() {},
    appendRow(row) { rows.push(row.map(conv)); },
  };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => sheets[n] || null, insertSheet: (n) => (sheets[n] = sheet) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      // Code.gs only formats dates as yyyy-MM-dd in Asia/Tokyo
      formatDate: (d) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10),
    },
    ContentService: {
      MimeType: { JAVASCRIPT: "js", JSON: "json" },
      createTextOutput: (t) => ({ t, setMimeType() { return this; }, getContent() { return this.t; } }),
    },
    console,
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(CODE, "utf8"), ctx);
  return { ctx, rows, props };
}

// Call doGet the way the web app is called and parse the JSON reply
function api(ctx, params) { return JSON.parse(ctx.doGet({ parameter: params }).getContent()); }

module.exports = { makeEnv, api };
