import type { Member } from "../types";

type Relation = { to: string; kind: "parent" | "child" | "spouse"; label: string };

export function buildGraph(members: Member[]) {
  const byId = new Map(members.map((member) => [member.id, member]));
  const graph = new Map<string, Relation[]>(members.map((member) => [member.id, []]));

  function add(from: string, to: string, kind: Relation["kind"], label: string) {
    if (from === to || !byId.has(to)) return;
    const edges = graph.get(from);
    if (edges && !edges.some((edge) => edge.to === to && edge.kind === kind)) {
      edges.push({ to, kind, label });
    }
  }

  function link(parent: string, child: Member, parentLabel: string) {
    add(child.id, parent, "parent", parentLabel);
    add(parent, child.id, "child", child.gender === "男" ? "儿子" : child.gender === "女" ? "女儿" : "子女");
  }

  for (const person of members) {
    if (person.fatherId) link(person.fatherId, person, "父亲");
    if (person.motherId) link(person.motherId, person, "母亲");
    for (const id of person.spouseIds ?? []) {
      add(person.id, id, "spouse", "配偶");
      add(id, person.id, "spouse", "配偶");
    }
  }
  for (const parent of members) {
    for (const id of parent.childIds ?? []) {
      const child = byId.get(id);
      if (child) link(parent.id, child, parent.gender === "男" ? "父亲" : parent.gender === "女" ? "母亲" : "家长");
    }
  }
  return graph;
}
