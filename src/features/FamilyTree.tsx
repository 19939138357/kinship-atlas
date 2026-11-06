import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import type { Member } from "../types";
import { buildGraph } from "./relationships";

type Props = {
  members: Member[];
  focusId: string;
  onFocus: (id: string) => void;
  onOpenPerson: (member: Member) => void;
  onOpenPeople: () => void;
};

export function FamilyTree({ members, focusId, onFocus, onOpenPerson, onOpenPeople }: Props) {
  const graph = useMemo(() => buildGraph(members), [members]);
  const byId = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const visited = new Set<string>();

  function branch(member: Member) {
    const reference = visited.has(member.id);
    visited.add(member.id);
    const edges = graph.get(member.id) ?? [];
    const children = edges.filter((edge) => edge.kind === "child");
    const spouses = edges.filter((edge) => edge.kind === "spouse");
    return (
      <li key={member.id}>
        <div className="branch-unit">
          <button className="branch-person" onClick={() => onOpenPerson(member)}>
            <strong>{member.name}</strong>
            <small>{member.generationName ? member.generationName + "字辈 · " : ""}{member.lunarBirth.year}年</small>
          </button>
          {!reference && spouses.map(({ to }) => {
            const spouse = byId.get(to)!;
            return <button className="branch-spouse" key={to} onClick={() => onOpenPerson(spouse)}>配偶 · {spouse.name}</button>;
          })}
          {reference && <small>已在其他分支列出</small>}
        </div>
        {!reference && children.length > 0 && <ul>{children.map(({ to }) => branch(byId.get(to)!))}</ul>}
      </li>
    );
  }

  const roots = members.filter((member) => !graph.get(member.id)?.some((edge) => edge.kind === "parent"));
  const focus = byId.get(focusId);
  const forest = focus ? [branch(focus)] : roots.map(branch);
  // Isolated loops in imported records may have no root. Include them once.
  if (!focus) for (const member of members) if (!visited.has(member.id)) forest.push(branch(member));

  return (
    <div className="simple-page simple-tree-page">
      <header className="simple-page-heading simple-page-heading--row">
        <div><h1>世系图</h1><p>沿亲子分支查阅后代，点击姓名打开档案。</p></div>
        <button onClick={onOpenPeople}>人物列表<ChevronRight size={16} /></button>
      </header>
      {members.length ? <>
        <label className="tree-picker">查看分支
          <select value={focus?.id ?? ""} onChange={(e) => onFocus(e.target.value)}>
            <option value="">全部人物</option>
            {members.map((member) => <option value={member.id} key={member.id}>{member.name} · {member.id}</option>)}
          </select>
        </label>
        <div className="family-forest"><ul>{forest}</ul></div>
      </> : <p className="record-empty-inline">暂无人物，录入档案后会在此生成世系图。</p>}
    </div>
  );
}
