// 生化学実習 FY2026 — 日程・締切・K-LMS 提出先の唯一の定義場所。
// 出典: K-LMS 151958「FY2026_生化学実習_実習予定表.pdf」(2026-09-28 取得)
const CONFIG = {
  courseUrl: "https://lms.keio.jp/courses/151958",
  chapters: {
    1: { title: "タンパク質の定量", short: "Bradford 法・紫外吸収法", pdf: "ch1.pdf", page: 1 },
    2: { title: "酵素の阻害剤に関する実験", short: "ロイペプチンのトリプシン阻害", pdf: "ch2.pdf", page: 10 },
    3: { title: "SDS ポリアクリルアミドゲル電気泳動 (SDS-PAGE)", short: "血清タンパク質の分子量", pdf: "ch3.pdf", page: 18 },
    4: { title: "抗原抗体反応を利用したタンパク質定量 (ELISA)", short: "血清 CRP の定量", pdf: "ch4.pdf", page: 27 },
    5: { title: "プラスミド DNA の調製と分析、大腸菌の形質転換", short: "制限酵素・PCR・形質転換", pdf: "ch5.pdf", page: 33 },
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
