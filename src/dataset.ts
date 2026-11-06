import type { Member, SiteData } from "./types";

type Row = Record<string, unknown>;
function hasFields(value: unknown, fields: string): value is Row {
  return !!value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).every(key => fields.split(" ").includes(key));
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function integer(value: unknown, min: number, max: number): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}
function optionalStrings(row: Row, fields: string): boolean {
  return fields.split(" ").every(key => row[key] === undefined || typeof row[key] === "string");
}
function isIdList(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.every(text) && new Set(value).size === value.length);
}
function isMember(value: unknown): value is Member {
  if (!hasFields(value, "id name relation gender zodiac birthPlace fatherId motherId spouseIds childIds generationName lunarBirth solarBirth baziFine death note")) return false;
  if (!text(value.id) || !text(value.name) || !optionalStrings(value, "relation zodiac birthPlace fatherId motherId generationName solarBirth note")) return false;
  if (value.gender !== undefined && value.gender !== "男" && value.gender !== "女") return false;
  if (!isIdList(value.spouseIds) || !isIdList(value.childIds)) return false;
  const { lunarBirth, death, baziFine } = value;
  if (!hasFields(lunarBirth, "year month day leap time") || !integer(lunarBirth.year, 1, 9999)
      || !integer(lunarBirth.month, 1, 12) || !integer(lunarBirth.day, 1, 30)
      || !optionalStrings(lunarBirth, "time") || (lunarBirth.leap !== undefined && typeof lunarBirth.leap !== "boolean")) return false;
  if (death !== undefined && !(hasFields(death, "value calendar time") && text(death.value) && text(death.calendar) && optionalStrings(death, "time"))) return false;
  return baziFine === undefined || (hasFields(baziFine, "startYun handover source") && optionalStrings(baziFine, "startYun handover source"));
}

function validRelationships(members: Member[]): boolean {
  const children = new Map(members.map(m => [m.id, new Set<string>()]));
  if (children.size !== members.length) return false;
  for (const m of members) {
    for (const id of [...(m.spouseIds ?? []), ...(m.childIds ?? [])]) {
      if (id === m.id || !children.has(id)) return false;
    }
    for (const child of m.childIds ?? []) children.get(m.id)!.add(child);
    for (const parent of [m.fatherId, m.motherId]) {
      if (parent === undefined) continue;
      if (parent === m.id || !children.has(parent)) return false;
      children.get(parent)!.add(m.id);
    }
  }
  // Validate ancestry using both parent and child references, without recursion.
  const pendingParents = new Map(members.map(m => [m.id, 0]));
  for (const ids of children.values()) {
    for (const id of ids) pendingParents.set(id, pendingParents.get(id)! + 1);
  }
  const ready = members.filter(m => pendingParents.get(m.id) === 0).map(m => m.id);
  for (const id of ready) {
    for (const child of children.get(id)!) {
      const remaining = pendingParents.get(child)! - 1;
      pendingParents.set(child, remaining);
      if (remaining === 0) ready.push(child);
    }
  }
  return ready.length === members.length;
}

export function isSiteData(value: unknown): value is SiteData {
  if (!hasFields(value, "meta members sources")) return false;
  const { meta, members, sources } = value;
  if (!hasFields(meta, "title updatedAt memberCount relationshipsComplete")
      || !text(meta.title) || !text(meta.updatedAt) || typeof meta.relationshipsComplete !== "boolean") return false;
  if (!Array.isArray(members) || members.length !== meta.memberCount || !members.every(isMember)) return false;
  if (!Array.isArray(sources) || !sources.every(s => hasFields(s, "title date description")
      && text(s.title) && typeof s.date === "string" && typeof s.description === "string")) return false;
  return validRelationships(members);
}
