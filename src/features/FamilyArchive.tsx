import { useMemo, useState, type CSSProperties } from "react";
import { BarChart3, Cake, ChevronRight, History, Network, Repeat2 } from "lucide-react";
import { Lunar } from "lunar-typescript";
import { formatLunarDate, lunarDayName, lunarMonthName, sortByLunarBirthday } from "../format";
import { buildGraph } from "./relationships";
import type { SiteData, Member } from "../types";

type FamilyArchiveProps = {
  members: Member[];
  onSelectMember: (member: Member) => void;
};

type ArchiveTab = "relationships" | "timeline" | "birthdays" | "statistics" | "sources";

type RelationshipPath = { member: Member; via?: string }[];

const archiveTabs: Array<{ id: ArchiveTab; label: string; icon: typeof Network }> = [
  { id: "relationships", label: "关系", icon: Network },
  { id: "timeline", label: "年表", icon: History },
  { id: "birthdays", label: "生辰", icon: Cake },
  { id: "statistics", label: "统计", icon: BarChart3 },
  { id: "sources", label: "来源", icon: History }
];

function findRelationshipPath(members: Member[], startId: string, endId: string): RelationshipPath {
  const memberById = new Map(members.map((member) => [member.id, member]));
  const start = memberById.get(startId);
  if (!start) return [];
  if (startId === endId) return [{ member: start }];

  const graph = buildGraph(members);
  const visited = new Set([startId]);
  const queue: Array<{ id: string; path: Array<{ id: string; via?: string }> }> = [{ id: startId, path: [{ id: startId }] }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of graph.get(current.id) ?? []) {
      if (visited.has(edge.to)) continue;
      const path = [...current.path, { id: edge.to, via: edge.label }];
      if (edge.to === endId) {
        return path.map((item) => ({ member: memberById.get(item.id)!, via: item.via }));
      }
      visited.add(edge.to);
      queue.push({ id: edge.to, path });
    }
  }
  return [];
}

function RelationshipExplorer({ members, onSelectMember }: FamilyArchiveProps) {
  const defaultStart = members[0]?.id ?? "";
  const defaultEnd = members[1]?.id ?? defaultStart;
  const [startId, setStartId] = useState(defaultStart);
  const [endId, setEndId] = useState(defaultEnd);
  const path = useMemo(() => findRelationshipPath(members, startId, endId), [members, startId, endId]);

  function swapPeople() {
    setStartId(endId);
    setEndId(startId);
  }

  return (
    <section className="archive-panel relationship-explorer">
      <div className="archive-panel__intro">
        <div><span>亲属关系图</span><h2>两个人是什么关系</h2></div>
        <p>只沿已确认的父母、子女和配偶关系寻找最短路径。</p>
      </div>

      <div className="relationship-controls">
        <label><span>从谁开始</span><select value={startId} onChange={(event) => setStartId(event.target.value)}>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
        <button type="button" onClick={swapPeople} aria-label="交换两个人"><Repeat2 size={20} /></button>
        <label><span>查到谁</span><select value={endId} onChange={(event) => setEndId(event.target.value)}>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
      </div>

      {path.length > 0 ? (
        <div className="relationship-result">
          <p>{path.length === 1 ? "这是同一个人" : `已找到 ${path.length - 1} 段已确认关系`}</p>
          <div className="relationship-thread" aria-label="亲属关系路径">
            {path.map((item, index) => (
              <div className="relationship-thread__step" key={item.member.id}>
                {index > 0 && <span className="relationship-thread__link"><i />{item.via}<i /></span>}
                <button type="button" onClick={() => onSelectMember(item.member)}>
                  <small>{item.member.id}</small><strong>{item.member.name}</strong><span>{item.member.relation ?? "关系已录入"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="archive-empty-inline"><Network size={28} /><strong>尚未找到关系路径</strong><span>这两个人之间的亲属资料还没有连接完整。</span></div>
      )}
    </section>
  );
}

function FamilyTimeline({ members, onSelectMember }: FamilyArchiveProps) {
  const [eventType, setEventType] = useState<"all" | "birth" | "death">("all");
  const events = useMemo(() => {
    const items = members.flatMap((member) => {
      const birth = { key: `${member.id}-birth`, type: "birth" as const, year: member.lunarBirth.year, member, date: formatLunarDate(member.lunarBirth), time: member.lunarBirth.time ?? "时辰待补" };
      const deathYear = member.death?.value.match(/\d{4}/)?.[0];
      return member.death && deathYear
        ? [birth, { key: `${member.id}-death`, type: "death" as const, year: Number(deathYear), member, date: member.death.value, time: member.death.time ?? "时辰待补" }]
        : [birth];
    });
    return items.filter((item) => eventType === "all" || item.type === eventType).sort((left, right) => left.year - right.year || left.member.lunarBirth.month - right.member.lunarBirth.month || left.member.lunarBirth.day - right.member.lunarBirth.day);
  }, [eventType, members]);
  const yearRange = events.length > 0 ? `${events[0].year} 到 ${events[events.length - 1].year}` : "暂无纪年";

  return (
    <section className="archive-panel family-timeline">
      <div className="archive-panel__intro archive-panel__intro--row">
        <div><span>家族纪年</span><h2>{yearRange}</h2></div>
        <div className="archive-segmented" aria-label="筛选事件类型">
          {([ ["all", "全部"], ["birth", "出生"], ["death", "逝世"] ] as const).map(([value, label]) => <button type="button" className={eventType === value ? "is-active" : ""} onClick={() => setEventType(value)} key={value}>{label}</button>)}
        </div>
      </div>
      <div className="timeline-list">
        {events.map((event, index) => {
          const previousDecade = index > 0 ? Math.floor(events[index - 1].year / 10) : -1;
          const decade = Math.floor(event.year / 10);
          return (
            <div className="timeline-entry" key={event.key}>
              <span className="timeline-decade">{decade !== previousDecade ? `${decade * 10}年代` : ""}</span>
              <time>{event.year}</time>
              <i aria-hidden="true" />
              <button type="button" onClick={() => onSelectMember(event.member)}>
                <span className={`timeline-event-type timeline-event-type--${event.type}`}>{event.type === "birth" ? "生" : "卒"}</span>
                <span><strong>{event.member.name}</strong><small>{event.date} · {event.time}</small></span>
                <ChevronRight size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BirthdayCalendar({ members, onSelectMember }: FamilyArchiveProps) {
  const today = useMemo(() => Lunar.fromDate(new Date()), []);
  const currentMonth = Math.abs(today.getMonth());
  const currentDay = today.getDay();
  const [month, setMonth] = useState(currentMonth);
  const birthdays = useMemo(() => members.filter((member) => member.lunarBirth.month === month).sort(sortByLunarBirthday), [members, month]);

  return (
    <section className="archive-panel birthday-calendar">
      <div className="archive-panel__intro archive-panel__intro--row">
        <div><span>农历生辰簿</span><h2>今天是{today.getMonth() < 0 ? "闰" : ""}{lunarMonthName(currentMonth)}{lunarDayName(currentDay)}</h2></div>
        <p>按农历月份查看家人的生辰。</p>
      </div>
      <div className="birthday-months" aria-label="选择农历月份">
        {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => {
          const count = members.filter((member) => member.lunarBirth.month === value).length;
          return <button type="button" className={month === value ? "is-active" : ""} onClick={() => setMonth(value)} key={value}><span>{lunarMonthName(value)}</span><small>{count} 人</small></button>;
        })}
      </div>
      <div className="birthday-ledger">
        {birthdays.map((member) => {
          const upcoming = month === currentMonth && member.lunarBirth.day >= currentDay && Boolean(member.lunarBirth.leap) === (today.getMonth() < 0);
          return (
            <button type="button" onClick={() => onSelectMember(member)} key={member.id}>
              <time><strong>{member.lunarBirth.day}</strong><small>{member.lunarBirth.leap ? "闰月" : ""}{lunarDayName(member.lunarBirth.day)}</small></time>
              <span className="mini-monogram" aria-hidden="true">{member.name.slice(0, 1)}</span>
              <span><strong>{member.name}</strong><small>{member.lunarBirth.year}年 · {member.lunarBirth.time ?? "时辰待补"}</small></span>
              <span>{upcoming ? "本月将至" : member.zodiac ? `属${member.zodiac}` : "生肖待补"}</span>
              <ChevronRight size={18} />
            </button>
          );
        })}
        {birthdays.length === 0 && <div className="archive-empty-inline"><Cake size={28} /><strong>这个月暂时没有生辰记录</strong><span>后续录入成员后会自动出现在这里。</span></div>}
      </div>
    </section>
  );
}

function FamilyStatistics({ members }: { members: Member[] }) {
  const graph = buildGraph(members);
  const connected = members.filter((member) => graph.get(member.id)?.length).length;
  const exactTimes = members.filter((member) => /\d{2}:\d{2}/.test(member.solarBirth ?? "")).length;
  const deaths = members.filter((member) => member.death).length;
  const knownGender = members.filter((member) => member.gender).length;
  const fieldTotal = members.length * 5;
  const filledTotal = members.reduce((sum, member) => sum + [member.gender, member.zodiac, member.birthPlace, member.lunarBirth.time, graph.get(member.id)?.length].filter(Boolean).length, 0);
  const completeness = fieldTotal ? Math.round((filledTotal / fieldTotal) * 100) : 0;
  const surnameCounts = [...members.reduce((map, member) => map.set(member.name.slice(0, 1), (map.get(member.name.slice(0, 1)) ?? 0) + 1), new Map<string, number>()).entries()].sort((left, right) => right[1] - left[1]);
  const zodiacCounts = [...members.reduce((map, member) => member.zodiac ? map.set(member.zodiac, (map.get(member.zodiac) ?? 0) + 1) : map, new Map<string, number>()).entries()].sort((left, right) => right[1] - left[1]);

  return (
    <section className="archive-panel family-statistics">
      <div className="archive-panel__intro"><div><span>资料概况</span><h2>这本家谱记录到什么程度</h2></div><p>统计只基于已经录入并确认的字段。</p></div>
      <div className="statistics-overview">
        <div className="completeness-ring" style={{ "--progress": `${completeness * 3.6}deg` } as CSSProperties}><span><strong>{completeness}%</strong><small>基础资料完整度</small></span></div>
        <dl>
          <div><dt>{members.length}</dt><dd>人物档案</dd></div>
          <div><dt>{connected}</dt><dd>已连接亲属</dd></div>
          <div><dt>{knownGender}</dt><dd>性别已确认</dd></div>
          <div><dt>{exactTimes}</dt><dd>精确到分钟</dd></div>
          <div><dt>{deaths}</dt><dd>生卒记录</dd></div>
          <div><dt>{members.length - connected}</dt><dd>关系待补</dd></div>
        </dl>
      </div>
      <div className="statistics-breakdown">
        <div><h3>姓氏分布</h3>{surnameCounts.map(([name, count]) => <p key={name}><span>{name}姓</span><i><b style={{ width: `${count / members.length * 100}%` }} /></i><strong>{count}</strong></p>)}</div>
        <div><h3>生肖分布</h3><div className="zodiac-cloud">{zodiacCounts.map(([name, count]) => <span key={name}>{name}<small>{count}</small></span>)}</div></div>
      </div>
    </section>
  );
}

export function FamilyArchive({ members, onSelectMember, sources }: FamilyArchiveProps & { sources: SiteData["sources"] }) {
  const [tab, setTab] = useState<ArchiveTab>("relationships");

  return (
    <div className="simple-page family-archive-page">
      <header className="simple-page-heading family-archive-heading">
        <h1>家族志</h1>
        <i aria-hidden="true" />
      </header>
      <nav className="archive-tabs" aria-label="家族志功能">
        {archiveTabs.map(({ id, label, icon: Icon }) => <button type="button" className={tab === id ? "is-active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)} key={id}><Icon size={19} /><span>{label}</span></button>)}
      </nav>
      {tab === "sources" && <section className="archive-panel"><h2>资料来源</h2>
        {sources.length ? sources.map((source, index) => <article key={index} className="source-entry">
          <h3>{source.title}</h3><time>{source.date}</time><p>{source.description}</p>
        </article>) : <p>暂无来源记录。</p>}
      </section>}
      {tab === "relationships" && <RelationshipExplorer members={members} onSelectMember={onSelectMember} />}
      {tab === "timeline" && <FamilyTimeline members={members} onSelectMember={onSelectMember} />}
      {tab === "birthdays" && <BirthdayCalendar members={members} onSelectMember={onSelectMember} />}
      {tab === "statistics" && <FamilyStatistics members={members} />}
    </div>
  );
}
