import { useEffect, useState } from "react";

export const MOBILE_QUERY = "(max-width: 820px)";

/** True on narrow screens; updates as the window resizes or rotates. */
export const useMobile = () => {
  const get = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia(MOBILE_QUERY).matches;
  const [mobile, setMobile] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", on); else mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", on); else mq.removeListener(on); };
  }, []);
  return mobile;
};
