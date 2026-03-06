"use client";

import type { BibtexSection as BibtexSectionType } from "@/types/sections";

export default function BibtexSection({ data }: { data: BibtexSectionType }) {
  const copy = async () => {
    await navigator.clipboard.writeText(data.bibtex);
  };

  return (
    <section className="section" id={data.id}>
      <div className="container is-max-desktop content">
        <div className="bibtex-header">
          <h2 className="title">BibTeX</h2>
          <button className="copy-bibtex-btn" onClick={copy} title="Copy BibTeX to clipboard">
            <i className="fas fa-copy" />
            <span className="copy-text">Copy</span>
          </button>
        </div>
        <pre id="bibtex-code">
          <code>{data.bibtex}</code>
        </pre>
      </div>
    </section>
  );
}