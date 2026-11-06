import { useMemo } from "react";
import { ArrowRight, GitBranch } from "lucide-react";
import { formatLunarDate, sortByLunarBirthday } from "../format";
import type { Member, SiteData, ViewName } from "../types";
import { buildGraph } from "./relationships";

type Props = {
  data: SiteData;
  onNavigate: (view: ViewName) => void;
  onSelectMember: (member: Member) => void;
};

export function Home({ data, onNavigate, onSelectMember }: Props) {
  const { members, meta, sources } = data;
  const graph = useMemo(() => buildGraph(members), [members]);
  const roots = members.filter((person) => {
    const edges = graph.get(person.id) ?? [];
    return edges.some((e) => e.kind === "child") && !edges.some((e) => e.kind === "parent");
  });
  const birthdays = [...members].sort(sortByLunarBirthday).slice(0, 4);

  return (
    <div className="simple-page simple-home">
      <header className="simple-page-heading">
        <h1>{meta.title || "家族概览"}</h1>
        <i aria-hidden="true" />
        <strong>{members.length} 位成员 · {sources.length} 项资料来源</strong>
      </header>
      <div className="simple-home__grid">
        <section className="simple-tree-preview">
          <div className="simple-section-heading">
            <h2>世系索引</h2>
            <button onClick={() => onNavigate("tree")}>查看世系图<ArrowRight size={16} /></button>
          </div>
          <div className="home-roots">
            {roots.slice(0, 5).map((person) => (
              <button className="home-root" key={person.id} onClick={() => onSelectMember(person)}>
                <GitBranch size={20} />
                <span><strong>{person.name}</strong><small>{person.generationName ? person.generationName + "字辈 · " : ""}已录 {graph.get(person.id)?.filter((e) => e.kind === "child").length} 位子女</small></span>
                <ArrowRight size={17} />
              </button>
            ))}
            {!roots.length && <p className="record-empty-inline">尚无可展示的起始分支。</p>}
          </div>
        </section>
        <section className="simple-birthdays">
          <div className="simple-section-heading"><h2>农历生辰簿</h2></div>
          <div>
            {birthdays.map((member) => <button key={member.id} onClick={() => onSelectMember(member)}>
              <span>{member.name.slice(0, 1)}</span><span><strong>{member.name}</strong><small>{formatLunarDate(member.lunarBirth, false)}</small></span><ArrowRight size={16}/>
            </button>)}
            {!birthdays.length && <p className="record-empty-inline">暂无生辰记录。</p>}
          </div>
        </section>
      </div>
      {meta.updatedAt && <footer className="simple-archive-line"><span>最近更新　{meta.updatedAt}</span></footer>}
    </div>
  );
}
