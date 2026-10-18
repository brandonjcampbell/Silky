/* Element roles. Any element may be designated a character (it can speak in
   Spinner's chats) or a location (it can be pinned on a map). Everything
   else is a thing: present, not sentient. Roles are optional; an element
   created by Spinner carries the kind it was extracted with, which gives a
   default. */
export const ROLES = [
  { id: "character", name: "Character", glyph: "🗣", blurb: "A person (or anything sentient). Can be talked to in Spinner's chats." },
  { id: "location", name: "Location", glyph: "📍", blurb: "A place. Can be pinned on a map and measured against others." },
  { id: "thing", name: "Thing", glyph: "🔹", blurb: "Anything else — an object, a group, an idea. Present in chats, never speaks." },
];
const FROM_KIND = { person: "character", place: "location" };

const plain = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, " ").trim();
const TITLE = /^(dr|mr|mrs|ms|miss|sir|lord|lady|count|countess|baron|duke|duchess|professor|prof|captain|capt|colonel|col|major|general|rev|father|brother|sister|king|queen|prince|princess|saint|st|madame|mme|monsieur|m|herr|frau|señor|señora|don|doña)\b\.?/i;
const PERSON = /\b(he|she|his|her|him|man|woman|boy|girl|son|daughter|wife|husband|brother|sister|mother|father|friend|servant|doctor|lawyer|solicitor|clerk|nephew|niece|baronet|heir|naturalist|butler|maid|convict|ghost|spirit|vampire|nobleman|gentleman|lady|child|detective|inspector|priest|nurse|soldier|captain|sailor|merchant|miser|partner)\b/i;
const PLACE = /\b(house|hall|manor|castle|abbey|church|chapel|inn|hotel|tavern|town|city|village|hamlet|street|road|lane|alley|square|bridge|river|lake|sea|coast|shore|bay|harbour|harbor|port|island|moor|heath|mire|bog|marsh|forest|wood|woods|hill|mountain|valley|pass|cave|cliff|tor|ruin|ruins|station|office|shop|room|cellar|crypt|tomb|graveyard|cemetery|garden|park|farm|estate|county|country|kingdom|land|realm|asylum|prison|school|university|college|library|museum|theatre|theater|market|camp|fort|fortress|tower|palace|temple|monastery|cottage|lodge|mill|mine|quarry|dock|wharf|pier|field|plain|desert|glacier|canyon|gorge|grove|orchard|vineyard|beach|dune|moorland|moors|downs|fens|highlands|lowlands|wilderness|plateau|swamp|jungle|steppe|tundra|coastline|countryside|district|quarter|borough|province|region|continent|planet|world)\b/i;

const THING = /\b(portrait|painting|picture|letter|note|manuscript|document|papers?|book|journal|diary|boots?|shoe|hat|coat|cloak|stick|cane|knife|dagger|sword|gun|pistol|rifle|map|ring|key|box|chest|bottle|phial|vial|potion|poison|coin|coins|money|treasure|jewel|necklace|watch|clock|lamp|candle|mirror|carriage|cart|coach|ship|boat|horse|hound|dog|cat|net|rope|chain|bell|legend|curse|prophecy|rumour|rumor|secret|plan|scheme|will|deed|contract|debt|song|poem|story|tale|myth|recipe|machine|device|engine|weapon|artifact|artefact|relic|statue|idol|crown|throne|flag|banner)\b/i;

/** A best guess from name and description, for elements that were never designated. */
export const guessRole = (el) => {
  const name = String(el.name || "");
  const desc = plain(el.content).slice(0, 240);
  if (TITLE.test(name)) return "character";
  const descHead = desc.split(/[.;:—-]/)[0] || "";
  if (PERSON.test(descHead)) return "character";
  if (THING.test(name) || (THING.test(descHead) && /^(a|an|the) /i.test(descHead))) return "thing";
  const nameHasPlace = PLACE.test(name);
  if (/^(the )?[a-z' ]+ (of|at|in|on) /i.test(name) && nameHasPlace) return "location";
  if (nameHasPlace && !PERSON.test(descHead)) return "location";
  if (PLACE.test(descHead) && !PERSON.test(descHead)) return "location";
  if (PERSON.test(desc) || (!/^the /i.test(name) && /^[A-Z][a-z]+( [A-Z][a-z]+)+$/.test(name))) return "character";
  return "thing";
};

/** "character" | "location" | "thing" — explicit, else from the extraction kind, else guessed. */
export const roleOf = (el) => {
  if (!el) return "thing";
  if (el.role && ROLES.some((r) => r.id === el.role)) return el.role;
  if (el.kind && FROM_KIND[el.kind]) return FROM_KIND[el.kind];
  if (el.kind) return "thing";
  return guessRole(el);
};
export const roleIsExplicit = (el) => !!(el && el.role && ROLES.some((r) => r.id === el.role));
export const isCharacter = (el) => roleOf(el) === "character";
export const isLocation = (el) => roleOf(el) === "location";
export const roleFromKind = (kind) => FROM_KIND[kind] || "thing";
