/* Blank-page mode: just the scene, nothing else on screen. */
export const isFocus = () => document.documentElement.classList.contains("focus");
export const setFocus = (on) => {
  document.documentElement.classList.toggle("focus", !!on);
  window.dispatchEvent(new CustomEvent("silky-focus", { detail: !!on }));
};
export const toggleFocus = () => setFocus(!isFocus());
