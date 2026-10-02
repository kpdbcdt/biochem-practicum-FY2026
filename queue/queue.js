// 第5章 2日目の順番待ち — 学生用 (index.html) と中央台用 (staff.html) の共通部分。
// API は Google Apps Script のウェブアプリ (queue/Code.gs)。URL は config.js の CONFIG.queueApi。
"use strict";

const Q = {
  KIND: {
    photo1: { label: "撮影 ① 制限酵素 (1% ゲル)", queue: "photo" },
    photo2: { label: "撮影 ② PCR (2% ゲル)", queue: "photo" },
    colony: { label: "コロニー観察", queue: "colony" },
  },
  QUEUE: { photo: "ゲル撮影", colony: "コロニー観察 (暗室)" },
  TEAMS: 24,

  // 日程から既定のグループを決める (B の初日 10/7 以降は B)
  defaultGroup() {
    const d = new Date(), m = d.getMonth() + 1, day = d.getDate();
    return (m > 10 || (m === 10 && day >= 7)) ? "B" : "A";
  },

  // JSONP (Apps Script のウェブアプリは CORS の設定ができないため)
  call(params) {
    return new Promise((resolve, reject) => {
      // CONFIG は config.js の const なので window には載らない。名前で参照する
      const api = (typeof CONFIG !== "undefined" && CONFIG.queueApi) || "";
      if (!api) { reject(new Error("順番待ちの API がまだ設定されていません")); return; }
      const cb = "__q" + Date.now() + Math.floor(Math.random() * 1e6);
      const qs = new URLSearchParams({ ...params, callback: cb, _: Date.now() });
      const s = document.createElement("script");
      const timer = setTimeout(() => { cleanup(); reject(new Error("サーバーから応答がありません")); }, 15000);
      function cleanup() { clearTimeout(timer); delete window[cb]; s.remove(); }
      window[cb] = (data) => { cleanup(); data && data.ok ? resolve(data) : reject(new Error((data && data.error) || "エラー")); };
      s.onerror = () => { cleanup(); reject(new Error("通信に失敗しました")); };
      s.src = api + (api.includes("?") ? "&" : "?") + qs.toString();
      document.head.appendChild(s);
    });
  },

  // 登録順に並べ、キューごとに「呼び出し中」「待ち」「済み」に分ける
  split(items) {
    const out = {};
    for (const q of Object.keys(Q.QUEUE)) out[q] = { called: [], waiting: [], done: [] };
    Q.clean(items).sort((a, b) => a.created.localeCompare(b.created)).forEach((it) => {
      const k = Q.KIND[it.kind]; if (!k) return;
      const bucket = out[k.queue][it.status];
      if (bucket) bucket.push(it);
    });
    return out;
  },

  esc(v) {
    return String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },

  // シートを直接編集されても表示が壊れないよう、想定外の値の行は捨てる
  clean(items) {
    return (items || []).filter((it) => it && /^[AB]([1-9]|1\d|2[0-4])$/.test(it.team) && Q.KIND[it.kind]
      && ["waiting", "called", "done"].includes(it.status) && /^[\w-]+$/.test(String(it.id)));
  },

  time(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  },
};
