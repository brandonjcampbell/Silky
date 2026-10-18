/* Spinner sorts elements into characters, locations and things. */
import { complete } from "./client";
import { ROLES } from "../role";

const plain = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** @returns {Promise<Object<string,string>>} element file → role */
export const classifyRoles = async (elements, signal) => {
  const out = {};
  for (let i = 0; i < elements.length; i += 40) {
    const batch = elements.slice(i, i + 40);
    const res = await complete({
      system: `You sort the elements of a novelist's story bible into roles: ${ROLES.map((r) => `${r.id} — ${r.blurb}`).join("; ")}. Judge from the name and description. Return JSON only.`,
      user: `Elements:\n${batch.map((e, k) => `${k + 1}. ${e.name}${plain(e.content) ? " — " + plain(e.content).slice(0, 160) : ""}`).join("\n")}\n\nReturn JSON: { "roles": ["character"|"location"|"thing", ... one per element, in order] }`,
      json: true,
      maxTokens: 600,
      signal,
    });
    const roles = Array.isArray(res && res.roles) ? res.roles : [];
    batch.forEach((e, k) => { const r = String(roles[k] || "").toLowerCase(); if (ROLES.some((x) => x.id === r)) out[e.file] = r; });
  }
  return out;
};
