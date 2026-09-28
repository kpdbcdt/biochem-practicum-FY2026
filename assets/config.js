// 生化学実習 FY2026 — 日程・締切・K-LMS 提出先の唯一の定義場所。
// 出典: K-LMS 151958「FY2026_生化学実習_実習予定表.pdf」(2026-09-28 取得)
const CONFIG = {
  courseUrl: "https://lms.keio.jp/courses/151958",
  // slides: pdf/slides/ 内の実習スライド PDF のファイル名（空ならリンクを出さない）。extras: 追加資料 [{label, file}]（pdf/slides/ 内）
  // notebook: 各章の Gemini ノートブック (旧 NotebookLM) の URL (履修生への個別招待)。空なら章ページにリンクを出さない。
  chapters: {
    1: { title: "タンパク質の定量", short: "Bradford 法・紫外吸収法", pdf: "ch1.pdf", page: 1, notebook: "https://notebook.google.com/notebook/16e5d4dd-7384-4566-ac05-9273d0e2185f", slides: "ch1_slides.pdf" },
    2: { title: "酵素の阻害剤に関する実験", short: "ロイペプチンのトリプシン阻害", pdf: "ch2.pdf", page: 10, notebook: "https://notebook.google.com/notebook/e829eee6-b00c-419e-9c24-2839118c22b4", slides: "ch2_slides.pdf" },
    3: { title: "SDS ポリアクリルアミドゲル電気泳動 (SDS-PAGE)", short: "血清タンパク質の分子量", pdf: "ch3.pdf", page: 18, notebook: "https://notebook.google.com/notebook/ec384675-868e-456c-a1c8-79040df338c4", slides: "ch3_slides.pdf", extras: [{ label: "データ解析 (PDF)", file: "ch3_data_analysis.pdf" }, { label: "ゲル撮影の方法 (PDF)", file: "ch3_gel_imaging.pdf" }] },
    4: { title: "抗原抗体反応を利用したタンパク質定量 (ELISA)", short: "血清 CRP の定量", pdf: "ch4.pdf", page: 27, notebook: "https://notebook.google.com/notebook/73e31273-65f0-43c5-82d2-17df1ce6f203", slides: "ch4_slides.pdf" },
    5: { title: "プラスミド DNA の調製と分析、大腸菌の形質転換", short: "制限酵素・PCR・形質転換", pdf: "ch5.pdf", page: 33, notebook: "https://notebook.google.com/notebook/da84df57-4f9c-4d62-a1df-c1e295964e02", slides: "ch5_slides.pdf" },
  },
  // 実習日 (集合: B53・B54 実習室)
  sessions: {
    A: [
      { n: 1, date: "9/29 (火)", what: "第3章 SDS-PAGE (ゲル作製) / 第1章 タンパク質の定量", ch: [3, 1] },
      { n: 2, date: "9/30 (水)", what: "第3章 続き (泳動・染色・分子量測定)", ch: [3] },
      { n: 3, date: "10/1 (木)", what: "第5章 プラスミド DNA の調製と分析、大腸菌の形質転換", ch: [5] },
      { n: 4, date: "10/2 (金)", what: "第5章 続き / 第2章 酵素の阻害剤に関する実験", ch: [5, 2] },
      { n: 5, date: "10/6 (火)", what: "第4章 抗原抗体反応 (ELISA)", ch: [4] },
    ],
    B: [
      { n: 6, date: "10/7 (水)", what: "第3章 SDS-PAGE (ゲル作製) / 第1章 タンパク質の定量", ch: [3, 1] },
      { n: 7, date: "10/8 (木)", what: "第3章 続き (泳動・染色・分子量測定)", ch: [3] },
      { n: 8, date: "10/9 (金)", what: "第5章 プラスミド DNA の調製と分析、大腸菌の形質転換", ch: [5] },
      { n: 9, date: "10/13 (火)", what: "第5章 続き / 第2章 酵素の阻害剤に関する実験", ch: [5, 2] },
      { n: 10, date: "10/14 (水)", what: "第4章 抗原抗体反応 (ELISA)", ch: [4] },
    ],
  },
  exam: { date: "10/15 (木)", place: "460 講義室 (予定)", what: "実習試験・片付け (A・B 共通)" },
  // レポート締切 (いずれも 23:59) と K-LMS 課題
  reports: {
    A: {
      1: { due: "10/5 (月) 23:59", url: "https://lms.keio.jp/courses/151958/assignments/1324153" },
      3: { due: "10/6 (火) 23:59", url: "https://lms.keio.jp/courses/151958/assignments/1324155" },
      5: { due: "10/8 (木) 23:59", url: "https://lms.keio.jp/courses/151958/assignments/1324157" },
      2: { due: "10/8 (木) 23:59", url: "https://lms.keio.jp/courses/151958/assignments/1324154" },
      4: { due: "10/12 (月) 23:59", url: "https://lms.keio.jp/courses/151958/assignments/1324156" },
    },
    B: {
      1: { due: "10/13 (火) 23:59", url: "https://lms.keio.jp/courses/151958/assignments/1324158" },
      3: { due: "10/14 (水) 23:59", url: "https://lms.keio.jp/courses/151958/assignments/1324160" },
      5: { due: "10/19 (月) 23:59", url: "https://lms.keio.jp/courses/151958/assignments/1324162" },
      2: { due: "10/19 (月) 23:59", url: "https://lms.keio.jp/courses/151958/assignments/1324159" },
      4: { due: "10/20 (火) 23:59", url: "https://lms.keio.jp/courses/151958/assignments/1324161" },
    },
  },
};
