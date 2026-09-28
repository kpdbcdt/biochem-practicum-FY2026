// 生化学実習 Interactive Lab — 共通ユーティリティ (グラフ・回帰・保存・クイズ・提出パネル)
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const STORE = "bp26";
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---------- 数値 ---------- */
function num(v) {
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[．。]/g, ".").replace(/[−ー―‐]/g, "-");
  if (s === "") return NaN;
  const x = Number(s);
  return Number.isFinite(x) ? x : NaN;
}
function mean(a) {
  const v = a.filter((x) => Number.isFinite(x));
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN;
}
function fmt(x, sig = 3) {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e5 || a < 1e-3) return x.toExponential(sig - 1);
  const d = Math.max(0, sig - 1 - Math.floor(Math.log10(a)));
  return x.toFixed(Math.min(d, 6));
}
// 最小二乗直線 y = m x + b
function linreg(xs, ys) {
  const p = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const n = p.length;
  if (n < 2) return null;
  const mx = p.reduce((s, q) => s + q[0], 0) / n, my = p.reduce((s, q) => s + q[1], 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (const [x, y] of p) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); syy += (y - my) ** 2; }
  if (sxx === 0) return null;
  const m = sxy / sxx, b = my - m * mx;
  const r2 = syy === 0 ? 0 : (sxy * sxy) / (sxx * syy); // 全点が同じ y (平坦) は情報のない直線なので R² = 0 扱い
  return { m, b, r2, n };
}

/* ---------- SVG グラフ ---------- */
const PALETTE = ["#4c51bf", "#dd6b20", "#2f855a", "#c53030", "#805ad5", "#2b6cb0"];
function niceStep(range, target) {
  const raw = range / target, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}
function axisTicks(lo, hi, log) {
  if (log) {
    const t = [];
    for (let e = Math.floor(lo) - 1; e <= Math.ceil(hi) + 1; e++)
      for (const k of [1, 2, 5]) { const v = Math.log10(k) + e; if (v >= lo - 1e-9 && v <= hi + 1e-9) t.push({ v, label: fmt(10 ** v, 2), major: k === 1 }); }
    return t;
  }
  const st = niceStep(hi - lo || 1, 6), t = [];
  for (let v = Math.ceil(lo / st) * st; v <= hi + st * 1e-6; v += st) t.push({ v, label: fmt(Math.abs(v) < st * 1e-6 ? 0 : v, 3), major: true });
  return t;
}
/**
 * opt = { xlabel, ylabel, xlog, ylog, xmin, xmax, ymin, ymax (実数値),
 *   series: [{ label, color, pts: [[x,y],...], hollow: [bool...] }],
 *   lines:  [{ label, color, dash, x0, x1, f }],   // f: 実数 x -> 実数 y
 *   marks:  [{ x, y, color, label }] }            // 未知試料など (◆)
 */
function drawPlot(svg, opt) {
  const W = 640, H = 400, L = 72, R = 18, T = 18, B = 54;
  const tx = (v) => (opt.xlog ? Math.log10(v) : v), ty = (v) => (opt.ylog ? Math.log10(v) : v);
  const ok = (x, y) => Number.isFinite(tx(x)) && Number.isFinite(ty(y));
  let X = [], Y = [];
  for (const s of opt.series || []) for (const [x, y] of s.pts) if (ok(x, y)) { X.push(tx(x)); Y.push(ty(y)); }
  for (const m of opt.marks || []) if (ok(m.x, m.y)) { X.push(tx(m.x)); Y.push(ty(m.y)); }
  for (const l of opt.lines || []) for (const x of [l.x0, l.x1]) { const y = l.f(x); if (ok(x, y)) { X.push(tx(x)); Y.push(ty(y)); } }
  if (opt.xmin !== undefined) X.push(tx(opt.xmin));
  if (opt.xmax !== undefined) X.push(tx(opt.xmax));
  if (opt.ymin !== undefined) Y.push(ty(opt.ymin));
  if (opt.ymax !== undefined) Y.push(ty(opt.ymax));
  let x0 = Math.min(...X), x1 = Math.max(...X), y0 = Math.min(...Y), y1 = Math.max(...Y);
  if (!X.length) { x0 = 0; x1 = 1; y0 = 0; y1 = 1; }
  const pad = (a, b) => { const d = (b - a) || Math.abs(a) || 1; return [a - d * 0.06, b + d * 0.08]; };
  [x0, x1] = pad(x0, x1); [y0, y1] = pad(y0, y1);
  const sx = (v) => L + ((v - x0) / (x1 - x0)) * (W - L - R), sy = (v) => H - B - ((v - y0) / (y1 - y0)) * (H - T - B);
  let g = `<rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>`;
  for (const t of axisTicks(x0, x1, opt.xlog)) {
    g += `<line x1="${sx(t.v)}" x2="${sx(t.v)}" y1="${T}" y2="${H - B}" stroke="${t.major ? "#e2e8f0" : "#f1f4f8"}"/>`;
    if (t.major || !opt.xlog) g += `<text x="${sx(t.v)}" y="${H - B + 16}" font-size="11" text-anchor="middle" fill="#4a5568">${t.label}</text>`;
  }
  for (const t of axisTicks(y0, y1, opt.ylog)) {
    g += `<line x1="${L}" x2="${W - R}" y1="${sy(t.v)}" y2="${sy(t.v)}" stroke="${t.major ? "#e2e8f0" : "#f1f4f8"}"/>`;
    g += `<text x="${L - 6}" y="${sy(t.v) + 4}" font-size="11" text-anchor="end" fill="${t.major ? "#4a5568" : "#a0aec0"}">${t.label}</text>`;
  }
  if (x0 < 0 && x1 > 0) g += `<line x1="${sx(0)}" x2="${sx(0)}" y1="${T}" y2="${H - B}" stroke="#718096"/>`;
  if (y0 < 0 && y1 > 0) g += `<line x1="${L}" x2="${W - R}" y1="${sy(0)}" y2="${sy(0)}" stroke="#718096"/>`;
  g += `<rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="none" stroke="#4a5568"/>`;
  g += `<text x="${(L + W - R) / 2}" y="${H - 12}" font-size="13" text-anchor="middle" fill="#1a2633">${opt.xlabel || ""}</text>`;
  g += `<text transform="translate(16 ${(T + H - B) / 2}) rotate(-90)" font-size="13" text-anchor="middle" fill="#1a2633">${opt.ylabel || ""}</text>`;
  g += `<clipPath id="clip-${svg.id}"><rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}"/></clipPath><g clip-path="url(#clip-${svg.id})">`;
  (opt.lines || []).forEach((l, i) => {
    const c = l.color || PALETTE[i % PALETTE.length], pts = [];
    for (let k = 0; k <= 60; k++) {
      const xr = l.x0 + ((l.x1 - l.x0) * k) / 60, yr = l.f(xr);
      if (ok(xr, yr)) pts.push(`${sx(tx(xr)).toFixed(1)},${sy(ty(yr)).toFixed(1)}`);
    }
    if (pts.length > 1) g += `<polyline points="${pts.join(" ")}" fill="none" stroke="${c}" stroke-width="1.8" ${l.dash ? 'stroke-dasharray="6 4"' : ""}/>`;
  });
  (opt.series || []).forEach((s, i) => {
    const c = s.color || PALETTE[i % PALETTE.length];
    s.pts.forEach(([x, y], k) => {
      if (!ok(x, y)) return;
      const hollow = s.hollow && s.hollow[k];
      g += `<circle cx="${sx(tx(x))}" cy="${sy(ty(y))}" r="4.5" fill="${hollow ? "#fff" : c}" stroke="${c}" stroke-width="1.6"/>`;
    });
  });
  (opt.marks || []).forEach((m) => {
    if (!ok(m.x, m.y)) return;
    const X0 = sx(tx(m.x)), Y0 = sy(ty(m.y)), c = m.color || "#c53030";
    g += `<path d="M${X0} ${Y0 - 7}L${X0 + 7} ${Y0}L${X0} ${Y0 + 7}L${X0 - 7} ${Y0}Z" fill="${c}"/>`;
    if (m.label) g += `<text x="${X0 + 9}" y="${Y0 - 6}" font-size="11" fill="${c}">${esc(m.label)}</text>`;
  });
  g += `</g>`;
  const leg = [...(opt.series || []).filter((s) => s.label).map((s, i) => ({ c: s.color || PALETTE[i % PALETTE.length], t: s.label, dot: 1 })),
    ...(opt.lines || []).filter((l) => l.label).map((l, i) => ({ c: l.color || PALETTE[i % PALETTE.length], t: l.label }))];
  const lx = opt.legendRight ? W - R - 230 : L + 10;
  leg.forEach((e, i) => {
    const y = T + 16 + i * 17;
    g += e.dot ? `<circle cx="${lx + 8}" cy="${y - 4}" r="4.5" fill="${e.c}"/>` : `<line x1="${lx}" x2="${lx + 16}" y1="${y - 4}" y2="${y - 4}" stroke="${e.c}" stroke-width="2"/>`;
    g += `<text x="${lx + 22}" y="${y}" font-size="11.5" fill="#1a2633">${esc(e.t)}</text>`;
  });
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = g;
}
function savePNG(svg, name) {
  const xml = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas"), vb = svg.viewBox.baseVal;
    c.width = vb.width * 2; c.height = vb.height * 2;
    const ctx = c.getContext("2d"); ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
    c.toBlob((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml.includes("xmlns=") ? xml : xml.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'));
}

/* ---------- 入力の自動保存 (この端末のブラウザだけ) ---------- */
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
function persist(root, key, onChange) {
  const els = $$("input[id],select[id]", root);
  for (const el of els) {
    const v = lsGet(`${STORE}:${key}:${el.id}`);
    if (v !== null) { if (el.type === "checkbox") el.checked = v === "1"; else el.value = v; }
    const save = () => { lsSet(`${STORE}:${key}:${el.id}`, el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value); onChange && onChange(); };
    el.addEventListener("input", save); el.addEventListener("change", save);
  }
  onChange && onChange();
}
function clearInputs(root, key, onChange) {
  for (const el of $$("input[id],select[id]", root)) {
    lsDel(`${STORE}:${key}:${el.id}`);
    if (el.type === "checkbox") el.checked = el.defaultChecked; else el.value = el.defaultValue;
  }
  onChange && onChange();
}

/* ---------- タブ ---------- */
function initTabs() {
  const btns = $$(".tab-bar button[data-tab]");
  const show = (id) => {
    btns.forEach((b) => b.classList.toggle("active", b.dataset.tab === id));
    $$(".panel").forEach((p) => p.classList.toggle("active", p.id === id));
  };
  btns.forEach((b) => b.addEventListener("click", () => { show(b.dataset.tab); history.replaceState(null, "", "#" + b.dataset.tab); }));
  const h = location.hash.slice(1);
  show(btns.some((b) => b.dataset.tab === h) ? h : btns[0].dataset.tab);
}

/* ---------- 当日の流れ チェックリスト ---------- */
function renderChecklist(el, days, key) {
  el.innerHTML = days.map((d, di) => `<div class="day-h">${d.h}</div><ol class="check">${d.items.map((t, i) =>
    `<li><input type="checkbox" id="ck-${di}-${i}"><span>${t}</span></li>`).join("")}</ol>`).join("") +
    `<p><button class="ghost" id="ck-reset">チェックをすべて外す</button></p>`;
  const sync = () => $$("li", el).forEach((li) => li.classList.toggle("done", $("input", li).checked));
  persist(el, key + ":check", sync);
  $("#ck-reset", el).onclick = () => clearInputs(el, key + ":check", sync);
}

/* ---------- 予習クイズ (即時フィードバック・記録なし) ---------- */
function renderQuiz(el, qs) {
  el.innerHTML = qs.map((q, i) => `<div class="q" data-i="${i}"><div class="qt">Q${i + 1}. ${q.q}</div>
    <div class="opts">${q.opts.map((o, k) => `<button data-k="${k}">${String.fromCharCode(65 + k)}. ${o}</button>`).join("")}</div>
    <div class="exp"></div></div>`).join("") + `<div class="out" id="quiz-score">0 / ${qs.length} 問 回答済み</div>`;
  let done = 0, right = 0;
  $$(".q", el).forEach((box) => {
    const q = qs[+box.dataset.i];
    $$(".opts button", box).forEach((b) => b.addEventListener("click", () => {
      if (box.classList.contains("answered")) return;
      box.classList.add("answered");
      const k = +b.dataset.k, correct = k === q.ans;
      b.classList.add(correct ? "right" : "wrong");
      $$(".opts button", box)[q.ans].classList.add("right");
      $(".exp", box).innerHTML = (correct ? "✅ 正解。" : "❌ 不正解。") + " " + q.exp;
      done++; if (correct) right++;
      $("#quiz-score", el).innerHTML = `${done} / ${qs.length} 問 回答済み — 正解 <b>${right}</b>` +
        (done === qs.length ? ` <button class="ghost" id="quiz-again">もう一度</button>` : "");
      const again = $("#quiz-again", el); if (again) again.onclick = () => renderQuiz(el, qs);
    }));
  });
}

/* ---------- 班 (A/B) と提出パネル ---------- */
function getGroup() { const g = lsGet(`${STORE}:group`); return g === "B" ? "B" : g === "A" ? "A" : null; }
function setGroup(g) { lsSet(`${STORE}:group`, g); document.dispatchEvent(new CustomEvent("groupchange", { detail: g })); }
function groupSeg(onPick) {
  const wrap = document.createElement("span"); wrap.className = "seg";
  const g = getGroup();
  wrap.innerHTML = `<button data-g="A" class="${g === "A" ? "active" : ""}">A グループ</button><button data-g="B" class="${g === "B" ? "active" : ""}">B グループ</button>`;
  $$("button", wrap).forEach((b) => b.onclick = () => { setGroup(b.dataset.g); onPick && onPick(b.dataset.g); });
  document.addEventListener("groupchange", (e) => $$("button", wrap).forEach((b) => b.classList.toggle("active", b.dataset.g === e.detail)));
  return wrap;
}
function sessionsFor(ch, g) { return CONFIG.sessions[g].filter((s) => s.ch.includes(ch)); }
function renderMeta(el, ch) {
  const draw = () => {
    const g = getGroup();
    const row = (G) => `<b>${G} グループ</b>: 実習 ${sessionsFor(ch, G).map((s) => s.date).join("・")} ／ レポート締切 <b>${CONFIG.reports[G][ch].due}</b>`;
    el.innerHTML = `📅 ${g ? row(g) : row("A") + "<br>📅 " + row("B")}　<span class="note">集合: B53・B54 実習室</span><br>
      📘 <a href="../pdf/${CONFIG.chapters[ch].pdf}" target="_blank">実習書 第${ch}章 (PDF)</a>${CONFIG.chapters[ch].slides ? `　·　📊 <a href="../pdf/slides/${CONFIG.chapters[ch].slides}" target="_blank"><b>実習スライド (PDF)</b></a>` : ""}${CONFIG.chapters[ch].notebook ? `　·　🤖 <a href="${CONFIG.chapters[ch].notebook}" target="_blank" rel="noopener"><b>第${ch}章の質問ノートブック (Gemini ノートブック)</b></a>` : ""}　·　<a href="../pdf/report_form.pdf" target="_blank">レポート用紙 (PDF)</a>　·　<a href="../">トップへ</a>`;
  };
  draw(); document.addEventListener("groupchange", draw);
}
function renderSubmit(el, ch) {
  el.innerHTML = "";
  const box = document.createElement("div"); box.className = "submit-box";
  const pick = document.createElement("div"); pick.className = "ctrl"; pick.innerHTML = "<span>自分のグループ:</span>";
  const body = document.createElement("div");
  const draw = () => {
    const g = getGroup();
    if (!g) { body.innerHTML = `<p>上のボタンで自分のグループ (A/B) を選ぶと、締切と提出先が表示されます。</p>`; return; }
    const r = CONFIG.reports[g][ch];
    body.innerHTML = `<div class="due">⏰ ${g} グループ 第${ch}章 レポート締切: ${r.due}</div>
      <p style="margin:8px 0">K-LMS に <b>単一の PDF ファイル</b>として提出してください（手書きの場合はスキャンして 1 つの PDF に）。</p>
      <a class="btn" href="${r.url}" target="_blank" rel="noopener">📤 K-LMS の「${g}グループ第${ch}章レポート」を開いて提出</a>
      <p class="note" style="margin-top:8px">期限を超過した場合、受け取らないことや減点の対象となる場合があります。K-LMS にログインした状態で開いてください。</p>`;
  };
  pick.appendChild(groupSeg(draw));
  box.appendChild(pick); box.appendChild(body); el.appendChild(box);
  draw(); document.addEventListener("groupchange", draw);
}

/* ---------- 標準曲線ツール (第1章 CBB/A280・第4章 ELISA 共通) ----------
 * cfg = { root, key, title, std: [{label, x}], reps, unk: 未知試料の行数, unkLabels,
 *         blank: true (ブランク行を持つ), blankAsPoint: true (ブランクを (0,0) の点として回帰に含める),
 *         semilogx: false (y = m·log10(x) + b で回帰), xunit, yname, origUnit(x)->追加表示, png }
 */
function stdCurveTool(cfg) {
  const k = cfg.key, R = cfg.reps;
  const repCells = (id) => Array.from({ length: R }, (_, j) => `<td><input type="number" step="any" id="${id}-r${j}"></td>`).join("");
  const repHead = Array.from({ length: R }, (_, j) => `<th>${cfg.yname} ${R > 1 ? j + 1 : ""}</th>`).join("");
  let h = `<div class="tbl-wrap"><table class="data"><tr><th>標準</th><th>濃度 (${cfg.xunit})</th>${repHead}<th>平均</th><th>−ブランク</th><th>回帰に使う</th></tr>`;
  if (cfg.blank) h += `<tr id="${k}-blankrow"><td>ブランク</td><td>0</td>${repCells(k + "-b")}<td class="calc" id="${k}-b-m"></td><td class="calc">0</td><td>${cfg.blankAsPoint ? `<input type="checkbox" id="${k}-b-use" checked>` : "—"}</td></tr>`;
  cfg.std.forEach((s, i) => { h += `<tr id="${k}-s${i}-row"><td>${s.label}</td><td>${fmt(s.x, 3)}</td>${repCells(`${k}-s${i}`)}<td class="calc" id="${k}-s${i}-m"></td><td class="calc" id="${k}-s${i}-c"></td><td><input type="checkbox" id="${k}-s${i}-use" checked></td></tr>`; });
  h += `</table></div><div class="tbl-wrap"><table class="data"><tr><th>未知試料</th><th>希釈倍率 ×</th>${repHead}<th>平均</th><th>−ブランク</th><th>希釈液の濃度</th><th>原液の濃度</th><th>判定</th></tr>`;
  for (let i = 0; i < cfg.unk; i++) h += `<tr><td>${cfg.unkLabels ? cfg.unkLabels[i] : "試料 " + (i + 1)}</td><td><input type="number" step="any" id="${k}-u${i}-f"></td>${repCells(`${k}-u${i}`)}<td class="calc" id="${k}-u${i}-m"></td><td class="calc" id="${k}-u${i}-c"></td><td class="calc" id="${k}-u${i}-d"></td><td class="calc" id="${k}-u${i}-o"></td><td class="calc" id="${k}-u${i}-j"></td></tr>`;
  h += `</table></div><div class="out" id="${k}-out">値を入力すると検量線が描かれます。</div>
    <svg class="plot" id="${k}-svg"></svg>
    <div class="ctrl"><button class="ghost" id="${k}-png">🖼 グラフを PNG で保存</button><button class="ghost" id="${k}-clear">入力をすべて消去</button></div>`;
  cfg.root.innerHTML = h;
  const v = (id) => mean(Array.from({ length: R }, (_, j) => num($(`#${id}-r${j}`).value)));
  const tx = (x) => (cfg.semilogx ? Math.log10(x) : x);
  const update = () => {
    const bm = cfg.blank ? v(`${k}-b`) : 0, blank = Number.isFinite(bm) ? bm : 0;
    if (cfg.blank) $(`#${k}-b-m`).textContent = fmt(bm, 3);
    const xs = [], ys = [], pts = [], hollow = [];
    if (cfg.blank && cfg.blankAsPoint) {
      const use = $(`#${k}-b-use`).checked;
      if (Number.isFinite(bm)) { pts.push([0, 0]); hollow.push(!use); if (use) { xs.push(0); ys.push(0); } }
    }
    cfg.std.forEach((s, i) => {
      const m = v(`${k}-s${i}`), c = m - blank, use = $(`#${k}-s${i}-use`).checked;
      $(`#${k}-s${i}-m`).textContent = fmt(m, 3); $(`#${k}-s${i}-c`).textContent = fmt(c, 3);
      $(`#${k}-s${i}-row`).classList.toggle("excluded", !use);
      if (Number.isFinite(c)) { pts.push([s.x, c]); hollow.push(!use); if (use) { xs.push(tx(s.x)); ys.push(c); } }
    });
    const fit = linreg(xs, ys), out = $(`#${k}-out`), marks = [];
    const yUsed = ys.filter(Number.isFinite), yLo = Math.min(...yUsed), yHi = Math.max(...yUsed);
    const inv = (y) => (fit ? (cfg.semilogx ? 10 ** ((y - fit.b) / fit.m) : (y - fit.b) / fit.m) : NaN);
    const origs = [];
    for (let i = 0; i < cfg.unk; i++) {
      const m = v(`${k}-u${i}`), c = m - blank, f = num($(`#${k}-u${i}-f`).value);
      const d = inv(c), fOk = Number.isFinite(f) && f > 0, o = fOk ? d * f : NaN;
      const inRange = Number.isFinite(c) && c >= yLo && c <= yHi;
      $(`#${k}-u${i}-m`).textContent = fmt(m, 3); $(`#${k}-u${i}-c`).textContent = fmt(c, 3);
      $(`#${k}-u${i}-d`).textContent = Number.isFinite(d) ? `${fmt(d, 3)} ${cfg.xunit}` : "—";
      $(`#${k}-u${i}-o`).innerHTML = Number.isFinite(o) ? `<b>${fmt(o, 3)}</b> ${cfg.xunit}` + (cfg.origUnit ? `<br><span class="note">${cfg.origUnit(o)}</span>` : "") : (Number.isFinite(d) ? `<span class="flag">${Number.isFinite(f) ? "倍率は正の数で入力" : "倍率を入力"}</span>` : "—");
      $(`#${k}-u${i}-j`).innerHTML = !Number.isFinite(c) || !fit || !Number.isFinite(d) ? "—" : inRange ? "✅ 範囲内" : '<span class="flag">⚠ 検量線の範囲外</span>';
      if (Number.isFinite(d) && d > 0) marks.push({ x: d, y: c, label: cfg.unkLabels ? cfg.unkLabels[i] : `試料${i + 1}` });
      if (inRange && Number.isFinite(o)) origs.push(o);
    }
    if (!fit) { out.innerHTML = "標準の値を 2 点以上入力すると検量線が描かれます。"; }
    else {
      const eq = cfg.semilogx ? `y = ${fmt(fit.m, 4)} × log₁₀(x) ${fit.b >= 0 ? "+" : "−"} ${fmt(Math.abs(fit.b), 4)}` : `y = ${fmt(fit.m, 4)} x ${fit.b >= 0 ? "+" : "−"} ${fmt(Math.abs(fit.b), 4)}`;
      out.innerHTML = `検量線: <b>${eq}</b>　R² = <b>${fit.r2.toFixed(4)}</b>（${fit.n} 点）` +
        (origs.length ? `<br>検量線の範囲内にある未知試料から求めた原液濃度の平均: <b>${fmt(mean(origs), 3)} ${cfg.xunit}</b>（${origs.length} 点）` + (cfg.origUnit ? `　<span class="note">${cfg.origUnit(mean(origs))}</span>` : "") : "") +
        (fit.r2 < 0.98 ? `<br><span class="flag">R² が低めです。直線から外れる点 (高濃度側の飽和など) を「回帰に使う」から外して比べてみましょう。</span>` : "");
    }
    const xsAll = pts.map((p) => p[0]).filter((x) => !cfg.semilogx || x > 0);
    const lo = Math.min(...xsAll), hi = Math.max(...xsAll);
    drawPlot($(`#${k}-svg`), {
      xlabel: cfg.xlabel, ylabel: cfg.ylabel, xlog: cfg.semilogx,
      series: [{ label: "標準 (○ は回帰から除外)", pts: pts.filter((p) => !cfg.semilogx || p[0] > 0), hollow: hollow.filter((_, i) => !cfg.semilogx || pts[i][0] > 0) }],
      lines: fit && xsAll.length ? [{ label: "回帰直線", color: "#dd6b20", x0: lo, x1: hi, f: (x) => fit.m * tx(x) + fit.b }] : [],
      marks,
    });
  };
  persist(cfg.root, k, update);
  $(`#${k}-png`).onclick = () => savePNG($(`#${k}-svg`), cfg.png);
  $(`#${k}-clear`).onclick = () => { if (confirmClear()) clearInputs(cfg.root, k, update); };
}
// ブラウザのダイアログは使わず、2 回押しで消去する
let _clearArmed = 0;
function confirmClear() {
  const now = Date.now();
  if (now - _clearArmed < 3000) { _clearArmed = 0; return true; }
  _clearArmed = now;
  const t = document.createElement("div");
  t.textContent = "もう一度押すと入力を消去します"; t.style.cssText = "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#2d3748;color:#fff;padding:8px 14px;border-radius:6px;font-size:13px;z-index:9";
  document.body.appendChild(t); setTimeout(() => t.remove(), 2800);
  return false;
}

/* ---------- 泳動距離 → 分子量/塩基長 (第3章 SDS-PAGE・第5章 アガロース共通) ----------
 * cfg = { root, key, markers: [size...], unit ("kDa"|"bp"), useFront: true なら Rf = 距離/泳動先端,
 *         unk: 行数, unkDefaults: [label...], png, markerName }
 * 回帰: log10(size) = m · X + b  (X = Rf または 移動距離)
 */
function migrationTool(cfg) {
  const k = cfg.key, X = cfg.useFront ? "Rf" : "移動距離";
  let h = "";
  if (cfg.useFront) h += `<div class="ctrl"><label>泳動先端 (BPB) までの距離</label><input type="number" step="any" id="${k}-front" style="width:90px"> <span>cm または mm (マーカー・試料と同じ単位で)</span></div>`;
  h += `<div class="tbl-wrap"><table class="data"><tr><th>${cfg.markerName}</th><th>移動距離</th>${cfg.useFront ? "<th>Rf</th>" : ""}<th>log₁₀(${cfg.unit})</th><th>回帰に使う</th></tr>`;
  cfg.markers.forEach((s, i) => { h += `<tr id="${k}-m${i}-row"><td>${s} ${cfg.unit}</td><td><input type="number" step="any" id="${k}-m${i}"></td>${cfg.useFront ? `<td class="calc" id="${k}-m${i}-rf"></td>` : ""}<td class="calc">${Math.log10(s).toFixed(3)}</td><td><input type="checkbox" id="${k}-m${i}-use" checked></td></tr>`; });
  h += `</table></div><p class="note">見えなかった・読み取れなかったバンドは空欄のままで構いません。直線から外れる点 (ゲルの端で詰まったバンドなど) は「回帰に使う」を外して比べてみましょう。</p>
    <div class="tbl-wrap"><table class="data"><tr><th>試料・バンド</th><th>移動距離</th>${cfg.useFront ? "<th>Rf</th>" : ""}<th>推定値</th><th>判定</th></tr>`;
  for (let i = 0; i < cfg.unk; i++) h += `<tr><td><input type="text" id="${k}-u${i}-n" value="${(cfg.unkDefaults && cfg.unkDefaults[i]) || ""}" style="width:130px"></td><td><input type="number" step="any" id="${k}-u${i}"></td>${cfg.useFront ? `<td class="calc" id="${k}-u${i}-rf"></td>` : ""}<td class="calc" id="${k}-u${i}-e"></td><td class="calc" id="${k}-u${i}-j"></td></tr>`;
  h += `</table></div><div class="out" id="${k}-out"></div><svg class="plot" id="${k}-svg"></svg>
    <div class="ctrl"><button class="ghost" id="${k}-png">🖼 グラフを PNG で保存</button><button class="ghost" id="${k}-clear">入力をすべて消去</button></div>`;
  cfg.root.innerHTML = h;
  const update = () => {
    const front = cfg.useFront ? num($(`#${k}-front`).value) : 1;
    const toX = (d) => (cfg.useFront ? (front > 0 ? d / front : NaN) : d);
    const xs = [], ys = [], pts = [], hol = [];
    cfg.markers.forEach((s, i) => {
      const d = num($(`#${k}-m${i}`).value), x = toX(d), use = $(`#${k}-m${i}-use`).checked;
      if (cfg.useFront) $(`#${k}-m${i}-rf`).textContent = fmt(x, 3);
      $(`#${k}-m${i}-row`).classList.toggle("excluded", !use);
      if (Number.isFinite(x)) { pts.push([x, s]); hol.push(!use); if (use) { xs.push(x); ys.push(Math.log10(s)); } }
    });
    const fit = linreg(xs, ys), marks = [];
    const xLo = Math.min(...xs), xHi = Math.max(...xs);
    for (let i = 0; i < cfg.unk; i++) {
      const d = num($(`#${k}-u${i}`).value), x = toX(d), name = $(`#${k}-u${i}-n`).value;
      if (cfg.useFront) $(`#${k}-u${i}-rf`).textContent = fmt(x, 3);
      const est = fit && Number.isFinite(x) ? 10 ** (fit.m * x + fit.b) : NaN;
      $(`#${k}-u${i}-e`).innerHTML = Number.isFinite(est) ? `<b>${fmt(est, 3)}</b> ${cfg.unit}` : "—";
      $(`#${k}-u${i}-j`).innerHTML = !Number.isFinite(est) ? "—" : x >= xLo && x <= xHi ? "✅ 範囲内" : '<span class="flag">⚠ マーカーの範囲外 (外挿)</span>';
      if (Number.isFinite(est)) marks.push({ x, y: est, label: name });
    }
    const out = $(`#${k}-out`);
    if (cfg.useFront && !(front > 0)) out.innerHTML = "まず泳動先端までの距離を入力してください。";
    else if (!fit) out.innerHTML = "マーカーの移動距離を 2 本以上入力すると標準曲線が描かれます。";
    else out.innerHTML = `標準曲線: <b>log₁₀(${cfg.unit}) = ${fmt(fit.m, 4)} × ${X} ${fit.b >= 0 ? "+" : "−"} ${fmt(Math.abs(fit.b), 4)}</b>　R² = <b>${fit.r2.toFixed(4)}</b>（${fit.n} 点）` +
      (fit.m > 0 ? '<br><span class="flag">傾きが正です (よく動くほど大きい?) — マーカーの移動距離の入力を見直しましょう。</span>' : "") +
      (fit.r2 < 0.97 ? '<br><span class="flag">R² が低めです。ゲルの端で詰まったバンドなどを回帰から外すと改善することがあります。</span>' : "");
    drawPlot($(`#${k}-svg`), {
      xlabel: cfg.useFront ? "比移動度 Rf" : "移動距離", ylabel: `${cfg.unit} (対数目盛)`, ylog: true, legendRight: true,
      series: [{ label: `マーカー (○ は回帰から除外)`, pts, hollow: hol }],
      lines: fit ? [{ label: "標準曲線", color: "#dd6b20", x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), f: (x) => 10 ** (fit.m * x + fit.b) }] : [],
      marks,
    });
  };
  persist(cfg.root, k, update);
  $(`#${k}-png`).onclick = () => savePNG($(`#${k}-svg`), cfg.png);
  $(`#${k}-clear`).onclick = () => { if (confirmClear()) clearInputs(cfg.root, k, update); };
}
