# 生化学実習 Interactive Lab — FY2026

慶應義塾大学薬学部 薬学科・薬科学科 2 年「生化学実習」の学習支援サイト (GitHub Pages)。

- 公開 URL: https://kpdbcdt.github.io/biochem-practicum-FY2026/
- K-LMS: https://lms.keio.jp/courses/151958 (レポート提出先は各章の K-LMS 課題)

## 構成

| パス | 内容 |
| --- | --- |
| `index.html` | A/B グループ別の日程・レポート締切・提出ボタン、各章へのリンク |
| `ch1/`〜`ch5/` | 各章: 概要・原理 / 当日の流れ / データ解析 (検算ツール) / 予習クイズ / レポート・提出 |
| `assets/config.js` | 日程・締切・K-LMS 課題 URL の唯一の定義場所 |
| `assets/common.js` | グラフ描画・回帰・入力保存・クイズ・標準曲線/泳動距離ツール |
| `pdf/` | 実習書 (全体・章別・付録・レポート用紙) |

依存ライブラリなし (静的 HTML + バニラ JS)。入力値は閲覧者のブラウザの localStorage にのみ保存され、サーバーには送信されない。

## License

コード: CC BY-NC 4.0 (LICENSE)。実習書 PDF は受講者の学習用に掲載。
