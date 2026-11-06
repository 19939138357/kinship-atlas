import { elementOf, type BaziCandidate, type BaziFineResult, type BaziYearCycle, type WuXing } from "./bazi";
import type { Member } from "./types";
import { getWesternAstrologyProfile, type WesternAstrologyProfile } from "./western-astrology";

export type ReadingThemeId = "personality" | "learning" | "career" | "wealth" | "relationship" | "wellbeing";

export type ReadingTheme = {
  id: ReadingThemeId;
  title: string;
  summary: string;
  advice: string;
  evidence: string[];
};

export type LifeStageReading = {
  key: string;
  ganZhi: string;
  yearRange: string;
  ageRange: string;
  title: string;
  summary: string;
  advice: string;
  active: boolean;
};

export type YearReading = {
  year: number;
  ganZhi: string;
  title: string;
  summary: string;
  current: boolean;
};

export type PracticalAdviceId = "location" | "career" | "hobbies" | "partner";

export type PracticalAdvice = {
  id: PracticalAdviceId;
  title: string;
  summary: string;
  suggestions: string[];
  evidence: string[];
};

export type MbtiGuess = {
  type: string;
  summary: string;
  axes: string[];
  evidence: string[];
};

export type BaziLifeReading = {
  headline: string;
  overview: string;
  evidence: string[];
  themes: ReadingTheme[];
  stages: LifeStageReading[];
  years: YearReading[];
  practicalAdvice: PracticalAdvice[];
  mbti: MbtiGuess;
  astrology?: WesternAstrologyProfile;
};

type StarGroupId = "peer" | "output" | "wealth" | "authority" | "resource";

type StarGroup = {
  id: StarGroupId;
  label: string;
  career: string;
  learning: string;
  relationship: string;
  action: string;
  jobs: string[];
  hobbies: string[];
  partner: string;
  partnerStyle: "开朗" | "文静" | "沉稳" | "独立";
};

const STAR_GROUPS: Record<StarGroupId, StarGroup> = {
  peer: {
    id: "peer",
    label: "比劫",
    career: "自主推进、同伴协作和竞争性环境",
    learning: "在讨论、比较和亲自实践中形成自己的方法",
    relationship: "重视平等与个人空间，也容易坚持自己的节奏",
    action: "先明确边界与分工，再把个人判断放进团队协作",
    jobs: ["销售顾问或招商主管", "项目主管或团队负责人", "创业合伙人与自主经营"],
    hobbies: ["篮球或羽毛球", "象棋、桌游与策略游戏", "徒步或骑行"],
    partner: "独立、有协商意识，并且尊重彼此空间的人",
    partnerStyle: "独立"
  },
  output: {
    id: "output",
    label: "食伤",
    career: "表达、创作、技术输出和把复杂事情讲明白",
    learning: "边做边学，用作品、讲解或复盘巩固理解",
    relationship: "需要坦率回应，情绪和想法说出来更容易相处",
    action: "把灵感收束成可交付成果，避免只开头不收尾",
    jobs: ["产品经理或软件开发", "设计师、短视频编导或文案", "培训讲师与咨询顾问"],
    hobbies: ["跳舞或唱歌", "摄影与短视频", "写作、乐器或编程创作"],
    partner: "愿意沟通、欣赏创造力，并能坦率表达感受的人",
    partnerStyle: "开朗"
  },
  wealth: {
    id: "wealth",
    label: "财星",
    career: "经营、资源协调、执行落地和结果导向的任务",
    learning: "从真实问题和实际反馈中掌握知识",
    relationship: "常用行动承担责任，也看重可靠与兑现",
    action: "先守住现金流和长期节奏，再评估机会与回报",
    jobs: ["财务会计、审计或税务", "采购、供应链或运营管理", "银行运营与销售管理"],
    hobbies: ["烹饪与烘焙", "记账与生活规划", "园艺或收藏整理"],
    partner: "做事可靠、生活有规划，并愿意共同承担责任的人",
    partnerStyle: "沉稳"
  },
  authority: {
    id: "authority",
    label: "官杀",
    career: "规则、责任、项目管理和需要稳定交付的岗位",
    learning: "在明确目标、标准和期限下进步更快",
    relationship: "重承诺和秩序，压力大时容易把要求带进相处",
    action: "把压力拆成流程和优先级，同时给自己留出恢复空间",
    jobs: ["项目经理或工程管理", "行政、合规或质量管理", "公务、事业单位与公共服务"],
    hobbies: ["跑步或力量训练", "书法与模型制作", "有目标的技能课程"],
    partner: "责任感强、边界清晰，同时情绪稳定不过度苛求的人",
    partnerStyle: "沉稳"
  },
  resource: {
    id: "resource",
    label: "印星",
    career: "学习研究、专业积累、文书知识和支持型工作",
    learning: "适合先建立体系，再通过长期积累形成专业深度",
    relationship: "重理解、信任和安全感，习惯先观察再表达",
    action: "设定行动截止点，让思考最终落到选择与实践",
    jobs: ["教师或研究助理", "咨询顾问与文案策划", "档案、图书与知识管理"],
    hobbies: ["阅读历史或人物传记", "书法、展览与博物馆", "瑜伽、冥想与安静创作"],
    partner: "耐心、重视信任，并愿意进行长期沟通的人",
    partnerStyle: "文静"
  }
};

const ELEMENT_TEMPERAMENT: Record<WuXing, string> = {
  木: "重成长与方向感，常从长期变化中判断事情",
  火: "重感受与表达，容易被清晰目标和现场反馈带动",
  土: "重稳定与承接，擅长把零散事务整理成秩序",
  金: "重判断与边界，倾向先分清标准再采取行动",
  水: "重观察与适应，善于从环境变化中寻找路径"
};

const ELEMENT_BALANCE: Record<WuXing, string> = {
  木: "多接触自然、保持伸展运动，并把长期目标拆成阶段行动",
  火: "增加日照与规律运动，让表达和行动保持温度但不过急",
  土: "保持稳定饮食与作息，用清单和固定节奏减少反复消耗",
  金: "整理空间与任务边界，给决定设置清晰标准和截止时间",
  水: "保证睡眠与安静独处时间，用散步、记录帮助恢复思路"
};

const ELEMENT_DEVELOPMENT: Record<WuXing, { direction: string; cities: string[]; environment: string; hobbies: string[] }> = {
  木: { direction: "东、东南", cities: ["上海", "杭州", "苏州", "宁波"], environment: "成长型行业集中、绿化较好或重视教育创新的城市环境", hobbies: ["徒步与园艺", "木作与绘画"] },
  火: { direction: "南", cities: ["深圳", "广州", "长沙", "厦门"], environment: "交流活跃、阳光较多、文化传播或科技服务集中的城市环境", hobbies: ["跳舞与球类", "摄影与舞台表达"] },
  土: { direction: "中部、西南", cities: ["武汉", "长沙", "成都", "重庆"], environment: "生活节奏稳定、制造建设或公共服务基础较完整的城市环境", hobbies: ["陶艺与烹饪", "收藏与空间整理"] },
  金: { direction: "西、西北", cities: ["西安", "成都", "重庆", "兰州"], environment: "规则清晰、工程制造、金融管理或专业服务集中的城市环境", hobbies: ["器械训练", "模型与金工手作"] },
  水: { direction: "北", cities: ["北京", "天津", "青岛", "大连"], environment: "临江临海、流动性强，适合信息、贸易、交通或跨区域协作的城市环境", hobbies: ["游泳与旅行", "音乐与观察记录"] }
};

function groupScore(counts: Map<StarGroupId, number>, ...ids: StarGroupId[]): number {
  return ids.reduce((total, id) => total + (counts.get(id) ?? 0), 0);
}

function buildMbtiGuess(counts: Map<StarGroupId, number>, primary: StarGroup, dayElement: WuXing): MbtiGuess {
  const extrovert = groupScore(counts, "peer", "output") >= groupScore(counts, "resource", "authority");
  const intuitive = groupScore(counts, "resource", "output") > groupScore(counts, "wealth", "authority");
  const thinking = groupScore(counts, "authority", "wealth", "peer") >= groupScore(counts, "output", "resource");
  const judging = groupScore(counts, "authority", "wealth", "resource") >= groupScore(counts, "peer", "output");
  const type = `${extrovert ? "E" : "I"}${intuitive ? "N" : "S"}${thinking ? "T" : "F"}${judging ? "J" : "P"}`;
  return {
    type,
    summary: `娱乐推测更接近 ${type}：${extrovert ? "偏外向表达" : "偏内向沉淀"}、${intuitive ? "偏整体与可能性" : "偏具体与经验"}、${thinking ? "偏逻辑权衡" : "偏感受协调"}、${judging ? "偏计划推进" : "偏灵活探索"}。`,
    axes: [extrovert ? "E · 外向" : "I · 内向", intuitive ? "N · 直觉" : "S · 实感", thinking ? "T · 思考" : "F · 情感", judging ? "J · 判断" : "P · 感知"],
    evidence: [`${primary.label}为主要线索`, `${dayElement}日主的行为映射`]
  };
}

function starGroupId(star: string): StarGroupId | undefined {
  if (["比肩", "劫财"].includes(star)) return "peer";
  if (["食神", "伤官"].includes(star)) return "output";
  if (["偏财", "正财"].includes(star)) return "wealth";
  if (["七杀", "正官"].includes(star)) return "authority";
  if (["偏印", "正印"].includes(star)) return "resource";
  return undefined;
}

function countStarGroups(candidate: BaziCandidate): Map<StarGroupId, number> {
  const counts = new Map<StarGroupId, number>();
  candidate.details.forEach((pillar) => {
    const mainGroup = starGroupId(pillar.mainStar);
    if (mainGroup) counts.set(mainGroup, (counts.get(mainGroup) ?? 0) + 2);
    pillar.secondaryStars.forEach((star) => {
      const group = starGroupId(star);
      if (group) counts.set(group, (counts.get(group) ?? 0) + 1);
    });
  });
  return counts;
}

function rankedGroups(counts: Map<StarGroupId, number>): StarGroup[] {
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([id]) => STAR_GROUPS[id]);
}

function evidenceForGroup(group: StarGroup, counts: Map<StarGroupId, number>): string {
  const score = counts.get(group.id) ?? 0;
  return score >= 5 ? `${group.label}线索较集中` : `命盘可见${group.label}线索`;
}

function groupForStars(stars: string[]): StarGroup[] {
  const ids = stars.map(starGroupId).filter((id): id is StarGroupId => Boolean(id));
  return [...new Set(ids)].map((id) => STAR_GROUPS[id]);
}

function stageReading(decade: BaziFineResult["decades"][number]): LifeStageReading {
  if (decade.ganZhi === "小运") {
    return {
      key: `${decade.startYear}-small`,
      ganZhi: "小运",
      yearRange: `${decade.startYear}–${decade.endYear}`,
      ageRange: `${decade.startAge}–${decade.endAge}岁`,
      title: "启蒙与环境塑形",
      summary: "这一阶段以家庭、教育和生活环境的影响为主，适合观察兴趣、习惯与安全感如何形成。",
      advice: "重在建立稳定作息、学习习惯与被支持的体验。",
      active: decade.active
    };
  }

  const groups = groupForStars([decade.stemStar, decade.branchStar]);
  const primary = groups[0] ?? STAR_GROUPS.resource;
  const title = groups.length > 1 ? `${groups[0].label} × ${groups[1].label}` : `${primary.label}主题`;
  const isGrowing = decade.endAge <= 18;
  const isLaterLife = decade.startAge >= 61;
  const summary = isGrowing
    ? `天干侧重${decade.stemStar || "积累"}，地支侧重${decade.branchStar || "沉淀"}；可从${primary.learning}来理解这一阶段的成长方式。`
    : isLaterLife
      ? `天干侧重${decade.stemStar || "积累"}，地支侧重${decade.branchStar || "沉淀"}；可把与${primary.career}有关的经验，转化为兴趣、家庭支持和可传承的成果。`
      : `天干侧重${decade.stemStar || "积累"}，地支侧重${decade.branchStar || "沉淀"}；这十年可把注意力放在${primary.career}。`;
  const advice = isGrowing
    ? "以兴趣、习惯和支持性环境为主，不用命盘限定教育方向。"
    : isLaterLife
      ? "以现实健康状况、安全和生活质量为先，安排适度而稳定的节奏。"
      : primary.action;
  return {
    key: `${decade.startYear}-${decade.ganZhi}`,
    ganZhi: decade.ganZhi,
    yearRange: `${decade.startYear}–${decade.endYear}`,
    ageRange: `${decade.startAge}–${decade.endAge}岁`,
    title,
    summary,
    advice,
    active: decade.active
  };
}

function yearReading(year: BaziYearCycle, currentYear: number, birthYear: number): YearReading {
  const groups = groupForStars([year.stemStar, year.branchStar]);
  const primary = groups[0] ?? STAR_GROUPS.resource;
  const age = year.year - birthYear + 1;
  const advice = age <= 18
    ? `把“${primary.learning}”作为成长提示，具体安排仍以家庭与学校的现实情况为准`
    : age >= 61
      ? "优先照顾生活质量、真实健康状况和家人陪伴，再安排其他目标"
      : primary.action;
  return {
    year: year.year,
    ganZhi: year.ganZhi,
    title: groups.length > 1 ? `${groups[0].label}与${groups[1].label}` : primary.label,
    summary: `${year.stemStar || "积累"}与${year.branchStar || "沉淀"}共同构成本年主题。建议${advice}。`,
    current: year.year === currentYear
  };
}

export function buildBaziLifeReading(member: Member, candidate: BaziCandidate, fine: BaziFineResult): BaziLifeReading | undefined {
  if (!member.gender || fine.status !== "ready") return undefined;

  const dayElement = elementOf(candidate.dayMaster);
  if (!dayElement) return undefined;

  const counts = countStarGroups(candidate);
  const groups = rankedGroups(counts);
  const primary = groups[0] ?? STAR_GROUPS.resource;
  const secondary = groups[1];
  const monthPillar = candidate.details.find((pillar) => pillar.key === "month");
  const yearPillar = candidate.details.find((pillar) => pillar.key === "year");
  const dayPillar = candidate.details.find((pillar) => pillar.key === "day");
  const season = fine.seasonStrength.find((item) => item.element === dayElement);
  const weakerElements = fine.seasonStrength.filter((item) => item.state === "囚" || item.state === "死").map((item) => item.element);
  const balanceElement = weakerElements[0] ?? dayElement;
  const development = ELEMENT_DEVELOPMENT[balanceElement];
  const spouseGroup = member.gender === "男" ? STAR_GROUPS.wealth : STAR_GROUPS.authority;
  const currentYear = new Date().getFullYear();
  const allYears = fine.decades.flatMap((decade) => decade.years);
  const years = [currentYear, currentYear + 1, currentYear + 2]
    .map((year) => allYears.find((item) => item.year === year))
    .filter((year): year is BaziYearCycle => Boolean(year))
    .map((year) => yearReading(year, currentYear, member.lunarBirth.year));
  const groupEvidence = evidenceForGroup(primary, counts);
  const mbti = buildMbtiGuess(counts, primary, dayElement);
  const astrology = getWesternAstrologyProfile(member);

  return {
    headline: `${candidate.dayMaster}${dayElement}日主 · ${primary.label}${secondary ? `与${secondary.label}` : ""}为主要线索`,
    overview: `四柱以${candidate.dayMaster}${dayElement}为日主，生于${monthPillar?.branch ?? "待核"}月。按本地细盘的季节旺衰次序，${dayElement}处在“${season?.state ?? "待核"}”位；这里的旺衰是传统季节术语，不代表现实中的好坏。整张命盘更适合从${primary.label}${secondary ? `、${secondary.label}` : ""}所对应的行为主题来理解。`,
    evidence: [
      `日主：${candidate.dayMaster}${dayElement}`,
      `月令：${monthPillar?.stem ?? ""}${monthPillar?.branch ?? "待核"}`,
      groupEvidence,
      `大运：${fine.direction ?? "顺逆待核"}`
    ],
    themes: [
      {
        id: "personality",
        title: "性格底色",
        summary: `${ELEMENT_TEMPERAMENT[dayElement]}。${primary.label}线索较突出时，做事会更看重${primary.career}。`,
        advice: `保留这一优势，同时记得${primary.action}。`,
        evidence: [`${candidate.dayMaster}${dayElement}日主`, groupEvidence]
      },
      {
        id: "learning",
        title: "学习成长",
        summary: `较适合${primary.learning}。${secondary ? `${secondary.label}的辅助线索也提示：${secondary.learning}。` : ""}`,
        advice: "选择能留下作品、记录或复盘的学习方式，比单纯追求速度更稳。",
        evidence: [groupEvidence, secondary ? evidenceForGroup(secondary, counts) : `月柱主星${monthPillar?.mainStar ?? "待核"}`]
      },
      {
        id: "career",
        title: "事业方向",
        summary: `命盘主题更容易在${primary.career}中得到发挥${secondary ? `，也可结合${secondary.career}` : ""}。`,
        advice: "职业选择仍应以能力、兴趣和现实机会为主；命盘只用来观察适合长期培养的工作方式。",
        evidence: [`主线${primary.label}`, `月柱主星${monthPillar?.mainStar ?? "待核"}`]
      },
      {
        id: "wealth",
        title: "财富习惯",
        summary: counts.has("wealth")
          ? `命盘可见财星线索，更适合通过长期执行、资源安排和可验证的成果积累。`
          : "财星不是当前最集中的线索，更需要依靠专业积累、预算纪律和稳定现金流建立安全感。",
        advice: "把预算、储蓄和风险上限写下来；不据此选择具体投资产品，也不把流年当成收益保证。",
        evidence: [counts.has("wealth") ? evidenceForGroup(STAR_GROUPS.wealth, counts) : "财星线索相对分散", `当前主线${primary.label}`]
      },
      {
        id: "relationship",
        title: "关系家庭",
        summary: `${primary.relationship}。年柱见${yearPillar?.mainStar ?? "待核"}、月柱见${monthPillar?.mainStar ?? "待核"}，可把它们理解为家族环境与成长阶段的互动线索。`,
        advice: "遇到重要关系问题时，先说清需求、边界和可执行的承诺，不用命盘替代真实沟通。",
        evidence: [`日支${dayPillar?.branch ?? "待核"}`, `年柱${yearPillar?.mainStar ?? "待核"}`, `月柱${monthPillar?.mainStar ?? "待核"}`]
      },
      {
        id: "wellbeing",
        title: "身心节律",
        summary: `季节旺衰中${weakerElements.length > 0 ? `${weakerElements.join("、")}处于“囚、死”位置` : "五行气势较均衡"}，只适合用作生活节律的提醒，不对应医学诊断。`,
        advice: ELEMENT_BALANCE[balanceElement],
        evidence: fine.seasonStrength.map((item) => `${item.element}${item.state}`)
      }
    ],
    stages: fine.decades.map(stageReading),
    years,
    practicalAdvice: [
      {
        id: "location",
        title: "发展地区",
        summary: `若从${member.birthPlace ?? "出生地"}出发，可优先考察${development.direction}方向；城市示例为${development.cities.join("、")}。`,
        suggestions: [`环境类型：${development.environment}`, "先比较具体岗位、收入成本与家庭支持", "可先短期试住或实习，再决定是否长期迁移"],
        evidence: [`季节补充线索：${balanceElement}`, `传统方位：${development.direction}`]
      },
      {
        id: "career",
        title: "适合的工作",
        summary: `${primary.label}${secondary ? `与${secondary.label}` : ""}线索更适合转化为可持续的工作方式。`,
        suggestions: [...primary.jobs, ...(secondary ? [secondary.jobs[0]] : [])],
        evidence: [groupEvidence, `月柱主星${monthPillar?.mainStar ?? "待核"}`]
      },
      {
        id: "hobbies",
        title: "兴趣爱好",
        summary: "可选择既能恢复精力、又能留下作品或长期进步记录的兴趣。",
        suggestions: [...primary.hobbies, ...development.hobbies],
        evidence: [`${candidate.dayMaster}${dayElement}日主`, `${primary.label}行为主题`]
      },
      {
        id: "partner",
        title: "适合的对象",
        summary: `性格类型可优先留意偏${primary.partnerStyle}、${primary.partner}；传统关系线索还会观察${spouseGroup.label}，但不能据此判断某段关系必然成败。`,
        suggestions: ["价值观和生活节奏能够协商", "遇到矛盾愿意直接沟通而不是冷处理", "尊重边界，也愿意兑现共同承诺"],
        evidence: [`日支${dayPillar?.branch ?? "待核"}`, `${spouseGroup.label}为传统关系观察线索`]
      }
    ],
    mbti,
    astrology
  };
}
