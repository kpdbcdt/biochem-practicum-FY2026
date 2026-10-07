// Serves the site from the repo root and answers /api with the mocked Code.gs,
// so the real pages run their real JSONP calls. config.js is rewritten on the fly
// to point queueApi at this server (the committed config keeps the production URL).
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.resolve(__dirname, "../..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// opts.latency: ms added to every /api answer; opts.fault(params) -> error string or null
function start(ctx, opts = {}) {
  const calls = [];
  return new Promise((resolve) => {
    let port;
    const srv = http.createServer(async (req, res) => {
      const u = new URL(req.url, "http://x");
      if (u.pathname === "/api") {
        const p = Object.fromEntries(u.searchParams);
        calls.push(p);
        if (opts.latency) await sleep(opts.latency);
        const err = opts.fault && opts.fault(p);
        const out = err ? `${p.callback}(${JSON.stringify({ ok: false, error: err })});` : ctx.doGet({ parameter: p }).getContent();
        res.setHeader("content-type", "application/javascript");
        return res.end(out);
      }
      let f = path.join(ROOT, decodeURIComponent(u.pathname));
      if (!f.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
      if (f.endsWith("/")) f += "index.html";
      if (!fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
      let body = fs.readFileSync(f);
      if (f.endsWith("config.js")) {
        const s = body.toString();
        if (!/queueApi: "[^"]*",/.test(s)) throw new Error("config.js has no queueApi line to override");
        body = s.replace(/queueApi: "[^"]*",/, `queueApi: "http://localhost:${port}/api",`);
      }
      res.end(body);
    });
    srv.listen(0, () => { port = srv.address().port; resolve({ srv, port, calls }); });
  });
}

async function open(port, p, wait = 1500) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errs.push(e.message));
  const d = await JSDOM.fromURL(`http://localhost:${port}${p}`, { runScripts: "dangerously", resources: "usable", virtualConsole: vc, pretendToBeVisual: true });
  await sleep(wait);
  return { d, doc: d.window.document, errs };
}

module.exports = { start, open, sleep, ROOT };
