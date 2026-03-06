"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      className="scroll-to-top"
      onClick={scrollToTop}
      title="Scroll to top"
      aria-label="Scroll to top"
      style={{ display: visible ? "inline-flex" : "none" }}
    >
      <i className="fas fa-chevron-up" />
    </button>
  );
}