import { ArrowLeft, CalendarClock, GitBranch } from "lucide-react";
import { formatLunarDate } from "../format";
import type { Member } from "../types";
import { buildGraph } from "./relationships";

type Props = {
  member: Member;
  members: Member[];
  onBack: () => void;
  onShowTree: () => void;
  onOpenBazi: () => void;
  onOpenPerson: (person: Member) => void;
};

export function PersonRecord({ member, members, onBack, onShowTree, onOpenBazi, onOpenPerson }: Props) {
  const graph = buildGraph(members);
  const byId = new Map(members.map((person) => [person.id, person]));
  const relations = graph.get(member.id) ?? [];
  const parents = relations.filter((edge) => edge.kind === "parent");
  const siblingIds = new Set(parents.flatMap((edge) => (graph.get(edge.to) ?? [])
    .filter((relative) => relative.kind === "child" && relative.to !== member.id).map((relative) => relative.to)));
  const facts = [
    ["农历出生", formatLunarDate(member.lunarBirth)], ["阳历出生", member.solarBirth],
    ["出生时辰", member.lunarBirth.time], ["出生地点", member.birthPlace],
    ["性别", member.gender], ["生肖", member.zodiac], ["字辈", member.generationName],
    ["逝世记录", member.death && [member.death.calendar, member.death.value, member.death.time].filter(Boolean).join(" ")]
  ];
  return (
    <article className="simple-person-record">
      <header><div><h1>{member.name}</h1><p>{member.id}{member.relation && <> · {member.relation}</>}</p></div>
        <span aria-hidden="true">{member.name.slice(0, 1)}</span>
      </header>
      <div className="simple-person-actions">
        <button onClick={onBack}><ArrowLeft size={17}/>人物列表</button>
        <button onClick={onShowTree}><GitBranch size={17}/>查看世系</button>
        <button onClick={onOpenBazi}><CalendarClock size={17}/>八字排盘</button>
      </div>
      <dl className="simple-person-facts">
        {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "待补充"}</dd></div>)}
      </dl>
      <section className="simple-record-section"><h2>家庭关系</h2>
        <div className="simple-relations">
          {[...relations, ...[...siblingIds].map((to) => ({ to, label: "兄弟姐妹" }))].map(({ to, label }) => (
            <p key={label + ":" + to}><strong>{label}</strong><span className="simple-relation-links">
              <button onClick={() => onOpenPerson(byId.get(to)!)}>{byId.get(to)!.name}</button>
            </span></p>
          ))}
          {!relations.length && <p>暂无亲属关系记录。</p>}
        </div>
      </section>
      {member.note && <section className="simple-record-section"><h2>档案备注</h2><p className="simple-note">{member.note}</p></section>}
    </article>
  );
}
