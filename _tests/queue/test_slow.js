// Staff console under production-like latency (live Apps Script measured 1.3–2.1 s per call, 2026-10-02).
// Guards the 2026-10-02 incident: no feedback for 3–4 s led to repeat presses on a stale screen.
"use strict";
const { makeEnv, api } = require("./gas_mock.js");
const { start, open, sleep } = require("./site_server.js");

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("FAIL", m); } else console.log("ok  ", m); };
const flat = (el) => el.textContent.replace(/\s/g, "");

(async () => {
  const { ctx } = makeEnv();
  const list = () => api(ctx, { action: "list", group: "A" }).items;
  for (const t of ["A1", "A2", "A3"]) { api(ctx, { action: "add", group: "A", team: t, kind: "photo1", key: "secret" }); await sleep(5); }
  const { srv, port } = await start(ctx, {
    latency: 1500,
    fault: (p) => (p.action === "add" && p.team === "A24" ? "テスト用のエラー" : null),
  });

  const { d, doc, errs } = await open(port, "/queue/staff.html", 800);
  doc.querySelector("#key").value = "secret"; doc.querySelector("#enter").click(); await sleep(4000);
  doc.querySelector('#grp button[data-g="A"]').click(); await sleep(2500);
  const photo = () => doc.querySelectorAll("#board .card")[0];

  // 1. instant feedback on 次を呼ぶ; a second press cannot call another team
  const nb = photo().querySelector("p button.primary");
  ok(/次を呼ぶ: A1/.test(nb.textContent), "next is A1");
  nb.click(); await sleep(60);
  ok(/🔔呼出中A1/.test(flat(photo())), "A1 shows 呼出中 before the server answers");
  ok(/送信中/.test(photo().textContent), "送信中 shown while waiting");
  const nb2 = photo().querySelector("p button.primary");
  ok(!nb2 || nb2.disabled, "次を呼ぶ disabled while pending");
  if (nb2) nb2.click();
  await sleep(4000);
  ok(list().filter((i) => i.status === "called").map((i) => i.team).join() === "A1", "server: only A1 called after a double press");

  // 2. 済み, then undo with ↩
  [...photo().querySelectorAll("button")].find((b) => b.textContent === "済み").click(); await sleep(60);
  ok(/済み（↩ で待ちに戻す）: A1/.test(photo().textContent), "A1 moves to 済み immediately");
  await sleep(2500);
  ok(list().find((i) => i.team === "A1").status === "done", "server: A1 done");
  [...photo().querySelectorAll(".note button")].find((b) => b.textContent === "↩").click(); await sleep(2500);
  ok(list().find((i) => i.team === "A1").status === "waiting", "↩ puts A1 back to waiting on the server");
  ok(/1番目A1/.test(flat(photo())), "A1 back at the head (original order)");

  // 3. team button: optimistic row, then exactly one server row
  doc.querySelector('#t2 button[data-t="A5"]').click(); await sleep(60);
  ok(/A5/.test(photo().textContent), "A5 appears immediately after pressing");
  await sleep(2500);
  ok(list().filter((i) => i.team === "A5").length === 1 && (photo().textContent.match(/A5/g) || []).length === 1, "one A5 row on the server and on screen");

  // 4. server error rolls the screen back
  doc.querySelector('#t2 button[data-t="A24"]').click(); await sleep(60);
  ok(/A24/.test(photo().textContent), "A24 shown optimistically");
  await sleep(2500);
  ok(!/A24/.test(photo().textContent) && /テスト用のエラー/.test(doc.querySelector("#msg").textContent), "A24 rolled back with the error message");

  ok(errs.length === 0, "no script errors " + JSON.stringify(errs));
  d.window.close(); srv.close();
  process.exit(fail);
})();
