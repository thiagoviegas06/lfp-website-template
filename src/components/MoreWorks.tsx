"use client";

import { useEffect, useRef, useState } from "react";

export default function MoreWorks() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="more-works-container" ref={dropdownRef}>
      <button
        className="more-works-btn"
        onClick={() => setOpen((v) => !v)}
        title="View More Works from Our Lab"
      >
        <i className="fas fa-flask" /> More Works{" "}
        <i className="fas fa-chevron-down dropdown-arrow" />
      </button>

      <div
        className="more-works-dropdown"
        id="moreWorksDropdown"
        style={{ display: open ? "block" : "none" }}
      >
        <div className="dropdown-header">
          <h4>More Works from Our Lab</h4>
          <button className="close-btn" onClick={() => setOpen(false)}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="works-list">
          <a href="https://arxiv.org/abs/PAPER_ID_1" className="work-item" target="_blank" rel="noreferrer">
            <div className="work-info">
              <h5>Paper Title 1</h5>
              <p>Brief description of the work and its main contribution.</p>
              <span className="work-venue">Conference/Journal 2024</span>
            </div>
            <i className="fas fa-external-link-alt" />
          </a>

          {/* add more */}
        </div>
      </div>
    </div>
  );
}