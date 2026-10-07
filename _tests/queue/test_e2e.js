// End to end: the real staff and student pages, real JSONP, mocked Code.gs.
"use strict";
const { makeEnv, api } = require("./gas_mock.js");
const { start, open, sleep } = require("./site_server.js");

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("FAIL", m); } else console.log("ok  ", m); };
const flat = (el) => el.textContent.replace(/\s/g, "");

(async () => {
  const env = makeEnv();
  const { ctx, rows } = env;
  const list = () => api(ctx, { action: "list", group: "A" }).items;
  const { srv, port } = await start(ctx);

  // staff: wrong key, then right key
  const s = await open(port, "/queue/staff.html");
  const sd = s.doc;
  sd.querySelector("#key").value = "nope"; sd.querySelector("#enter").click(); await sleep(800);
  ok(/合言葉が違います/.test(sd.querySelector("#loginmsg").textContent), "wrong key message");
  sd.querySelector("#key").value = "secret"; sd.querySelector("#enter").click(); await sleep(1200);
  ok(sd.querySelector("#main").classList.contains("active"), "staff main shown after login");
  // tests always drive group A, whatever today's date makes the default
  sd.querySelector('#grp button[data-g="A"]').click(); await sleep(1200);
  ok(sd.querySelectorAll("#t1 button").length === 24 && sd.querySelector("#t1 button").textContent === "A1", "24 team buttons A1..A24");

  sd.querySelector('#t1 button[data-t="A5"]').click(); await sleep(800);
  sd.querySelector('#t2 button[data-t="A2"]').click(); await sleep(800);
  sd.querySelector('#t1 button[data-t="A9"]').click(); await sleep(1500);
  ok(list().length === 5, "row ① registers photo1 + colony; row ② registers photo2 (5 rows, got " + list().length + ")");
  ok(sd.querySelector('#t1 button[data-t="A5"]').classList.contains("reg"), "A5 marked registered");

  const photoCard = () => sd.querySelectorAll("#board .card")[0];
  ok(/次を呼ぶ: A5/.test(photoCard().textContent), "photo queue next = A5 (registered first)");
  photoCard().querySelector("p button.primary").click(); await sleep(1500);
  ok(list().find((i) => i.team === "A5" && i.kind === "photo1").status === "called", "A5 photo1 called");

  sd.querySelector('#t2 button[data-t="A11"]').click(); sd.querySelector('#t2 button[data-t="A12"]').click(); await sleep(2000);
  ok(list().some((i) => i.team === "A11") && list().some((i) => i.team === "A12"), "two quick presses register both A11 and A12");

  // a row typed into the sheet by hand must not be rendered as HTML
  rows.push(["qevil", "A", "<img src=x onerror=alert(1)>", "photo1", "waiting", new Date(), new Date(), new Date()]);

  // student view
  const st = await open(port, "/queue/index.html");
  const td = st.doc;
  td.querySelector('#grp button[data-g="A"]').click(); await sleep(1500);
  const sel = td.querySelector("#team"); sel.value = "A2"; sel.dispatchEvent(new st.d.window.Event("change")); await sleep(1500);
  ok(/A2：撮影 ② PCR \(2% ゲル\) は 次の番です/.test(td.querySelector("#me").textContent), "A2 told it is next");
  const cards = td.querySelectorAll("#board .card");
  ok(cards.length === 2, "two queues (photo, colony)");
  ok(/A5/.test(cards[0].querySelector(".now").textContent), "photo queue shows A5 called");
  ok(/1番目A2/.test(flat(cards[0].querySelector(".wait"))), "A2 first waiting in the photo queue");
  ok(/1番目A5/.test(flat(cards[1].querySelector(".wait"))) && /2番目A9/.test(flat(cards[1].querySelector(".wait"))), "colony queue A5 then A9");
  ok(!td.querySelector("button[data-id]"), "student page has no write buttons");
  ok(!td.querySelector("#board img") && !/onerror/.test(td.querySelector("#board").innerHTML), "injected row is not rendered");
  ok(!!td.querySelector("#now"), "student page has a 今すぐ更新 button");

  ok([...s.errs, ...st.errs].length === 0, "no script errors " + JSON.stringify([...s.errs, ...st.errs]));
  s.d.window.close(); st.d.window.close(); srv.close();
  process.exit(fail);
})();
