import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { formatLunarDate, lunarMonthName } from "../format";
import type { Member } from "../types";

type PeopleProps = {
  members: Member[];
  onSelect: (member: Member) => void;
};

export function People({ members, onSelect }: PeopleProps) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesText = !normalized || [member.name, member.id, member.zodiac, member.relation]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized));
      const matchesMonth = month === "all" || member.lunarBirth.month === Number(month);
      return matchesText && matchesMonth;
    });
  }, [members, month, query]);

  return (
    <div className="record-page people-page">
      <header className="record-page-heading record-page-heading--split">
        <div><h1>人物</h1><p>浏览 {members.length} 位已收录成员的人物档案</p></div>
        <span className="record-total">{filtered.length}<small>人物记录</small></span>
      </header>

      <div className="people-toolbar">
        <label>
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索人物档案" placeholder="按姓名、编号或生肖搜索" />
        </label>
        <select value={month} onChange={(event) => setMonth(event.target.value)} aria-label="按农历月份筛选">
          <option value="all">全部月份</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>{lunarMonthName(value)}</option>
          ))}
        </select>
      </div>

      <div className="people-list" role="table" aria-label="人物档案列表">
        <div className="people-list__head" role="row">
          <span role="columnheader">人物</span><span role="columnheader">农历生日</span><span role="columnheader">时辰</span><span role="columnheader">生肖</span><span />
        </div>
        {filtered.map((member) => (
          <button key={member.id} type="button" role="row" onClick={() => onSelect(member)}>
            <span className="people-list__person" role="cell">
              <i className="mini-monogram" aria-hidden="true">{member.name.slice(0, 1)}</i>
              <span><strong>{member.name}</strong><small>{member.id}{member.relation ? ` · ${member.relation}` : ""}</small></span>
            </span>
            <span role="cell">{formatLunarDate(member.lunarBirth)}</span>
            <span role="cell">{member.lunarBirth.time ?? "待补充"}</span>
            <span role="cell">{member.zodiac ?? "待补充"}</span>
            <ChevronRight size={19} strokeWidth={1.5} aria-hidden="true" />
          </button>
        ))}
        {filtered.length === 0 && <p className="record-empty-inline">没有找到符合条件的人物</p>}
      </div>
    </div>
  );
}
