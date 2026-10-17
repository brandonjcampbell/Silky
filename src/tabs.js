/* Open-document tabs, remembered per project in this browser. */
const key = (project) => `silky:tabs:${project}`;

export const loadTabs = (project) => {
  try {
    const v = JSON.parse(localStorage.getItem(key(project)) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch (e) {
    return [];
  }
};

export const saveTabs = (project, tabs) => {
  try {
    localStorage.setItem(key(project), JSON.stringify(tabs));
  } catch (e) {
    /* per-browser convenience only */
  }
};
