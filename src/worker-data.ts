import type { SiteData } from "./types";

// Fictional records created exclusively for this example.
export const demoData: SiteData = {
  meta: {
    title: "示例家谱",
    updatedAt: "2026-01-01",
    memberCount: 5,
    relationshipsComplete: true
  },
  members: [
    { id: "demo-1", name: "示例甲", gender: "男", zodiac: "虎", spouseIds: ["demo-2"],
      childIds: ["demo-3", "demo-4"], solarBirth: "1950-02-17 10:15", lunarBirth: { year: 1950, month: 1, day: 1, time: "巳时" } },
    { id: "demo-2", name: "示例乙", gender: "女", zodiac: "龙", spouseIds: ["demo-1"],
      childIds: ["demo-3", "demo-4"], solarBirth: "1952-03-28 14:30", lunarBirth: { year: 1952, month: 3, day: 3, time: "未时" } },
    { id: "demo-3", name: "示例丙", gender: "女", zodiac: "虎", fatherId: "demo-1",
      motherId: "demo-2", childIds: ["demo-5"], lunarBirth: { year: 1974, month: 5, day: 5 } },
    { id: "demo-4", name: "示例丁", gender: "男", zodiac: "龙", fatherId: "demo-1",
      motherId: "demo-2", lunarBirth: { year: 1976, month: 7, day: 7 } },
    { id: "demo-5", name: "示例戊", gender: "女", zodiac: "虎", motherId: "demo-3",
      lunarBirth: { year: 1998, month: 9, day: 9 } }
  ],
  sources: [{ title: "虚构样本", date: "2026-01-01", description: "这组人物与关系仅用于演示。" }]
};
