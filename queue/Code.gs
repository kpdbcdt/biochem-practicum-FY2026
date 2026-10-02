/**
 * 生化学実習 第5章 2日目 — ゲル撮影・コロニー観察の順番待ち (Interactive Lab 用の API)
 *
 * 置き場所: スプレッドシート「第5章観察の順番」の 拡張機能 → Apps Script に貼り付ける。
 * 設定:     プロジェクトの設定 → スクリプト プロパティ に STAFF_KEY (中央台用の合言葉) を追加する。
 * 公開:     デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *           次のユーザーとして実行: 自分 / アクセスできるユーザー: 全員
 *           表示された URL (…/exec) を Interactive Lab の config.js の queueApi に入れる。
 *
 * データは同じスプレッドシートの「queue」シートに 1 行 1 件で保存する (無ければ自動で作る)。
 * 既存のシート (Bグループ など) には触らない。
 *
 * 呼び出しはすべて GET + JSONP (callback=...)。書き込みには key=STAFF_KEY が必要。
 *   action=list  group=A|B                       → その日のそのグループの全件
 *   action=add   group team kind key             → 登録 (kind: photo1 | photo2 | colony)
 *   action=set   id status key                   → 状態変更 (waiting | called | done | cancelled)
 */

const SHEET = 'queue';
const HEADER = ['id', 'group', 'team', 'kind', 'status', 'created', 'updated', 'date'];
const KINDS = ['photo1', 'photo2', 'colony'];
const STATUSES = ['waiting', 'called', 'done', 'cancelled'];

function doGet(e) {
  const p = e.parameter || {};
  let out;
  try {
    out = handle_(p);
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  const json = JSON.stringify(out);
  const cb = p.callback && /^[A-Za-z_$][\w$]*$/.test(p.callback) ? p.callback : null;
  return ContentService
    .createTextOutput(cb ? cb + '(' + json + ');' : json)
    .setMimeType(cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function handle_(p) {
  const action = p.action || 'list';
  if (action === 'list') return { ok: true, items: list_(group_(p.group)), now: new Date().toISOString() };

  const key = PropertiesService.getScriptProperties().getProperty('STAFF_KEY');
  if (!key) throw new Error('STAFF_KEY が設定されていません');
  if (p.key !== key) throw new Error('合言葉が違います');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (action === 'add') return { ok: true, item: add_(group_(p.group), team_(p.team), kind_(p.kind)) };
    if (action === 'set') return { ok: true, item: set_(String(p.id || ''), status_(p.status)) };
    if (action === 'check') return { ok: true };
    throw new Error('不明な action: ' + action);
  } finally {
    lock.releaseLock();
  }
}

function group_(g) { if (g !== 'A' && g !== 'B') throw new Error('group は A か B'); return g; }
function team_(t) { if (!/^[AB]([1-9]|1\d|2[0-4])$/.test(String(t))) throw new Error('班名が不正: ' + t); return String(t); }
function kind_(k) { if (KINDS.indexOf(k) < 0) throw new Error('kind が不正: ' + k); return k; }
function status_(s) { if (STATUSES.indexOf(s) < 0) throw new Error('status が不正: ' + s); return s; }

function today_() { return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'); }

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_() {
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, HEADER.length).getValues().map(function (r, i) {
    const o = { _row: i + 2 };
    // シートは日付らしい文字列を Date に変換してしまうので、読むときに戻す
    HEADER.forEach(function (h, j) {
      const v = r[j];
      o[h] = Object.prototype.toString.call(v) === '[object Date]'
        ? (h === 'date' ? Utilities.formatDate(v, 'Asia/Tokyo', 'yyyy-MM-dd') : v.toISOString())
        : String(v);
    });
    return o;
  });
}

function list_(group) {
  const d = today_();
  return rows_()
    .filter(function (r) { return r.group === group && r.date === d && r.status !== 'cancelled'; })
    .map(function (r) { delete r._row; return r; });
}

function add_(group, team, kind) {
  if (team.charAt(0) !== group) throw new Error(team + ' は ' + group + ' グループの班ではありません');
  const d = today_();
  const dup = rows_().filter(function (r) {
    return r.date === d && r.team === team && r.kind === kind && r.status !== 'cancelled';
  })[0];
  if (dup) { delete dup._row; return dup; }   // 二重登録は既存の行を返すだけ
  const now = new Date().toISOString();
  // id の先頭に文字を付けて、シートによる数値・指数表記への自動変換を防ぐ
  const item = { id: 'q' + Utilities.getUuid().slice(0, 8), group: group, team: team, kind: kind,
                 status: 'waiting', created: now, updated: now, date: d };
  sheet_().appendRow(HEADER.map(function (h) { return item[h]; }));
  return item;
}

function set_(id, status) {
  const r = rows_().filter(function (x) { return x.id === id; })[0];
  if (!r) throw new Error('見つかりません: ' + id);
  const now = new Date().toISOString();
  const sh = sheet_();
  sh.getRange(r._row, HEADER.indexOf('status') + 1).setValue(status);
  sh.getRange(r._row, HEADER.indexOf('updated') + 1).setValue(now);
  r.status = status; r.updated = now; delete r._row;
  return r;
}
