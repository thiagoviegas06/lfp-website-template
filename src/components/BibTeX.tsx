"use client";

const bib = `@article{he2025self,
  title={Self supervised learning for in vivo localization of microelectrode arrays using raw local field potential},
  author={Tianxiao He and Malhar Patel and Chenyi Li and Anna Maslarova and Mih{\'a}ly V{\"o}r{\"o}slakos and Nalini Ramanathan and Wei-Lun Hung and Gyorgy Buzsaki and Erdem Varol},
  journal={The Thirty-ninth Annual Conference on Neural Information Processing Systems},
  year={2025},
  url={https://openreview.net/forum?id=96liIPUPXG}
}`;

export default function BibTeX() {
  const copy = async () => {
    await navigator.clipboard.writeText(bib);
  };

  return (
    <section className="section" id="BibTeX">
      <div className="container is-max-desktop content">
        <div className="bibtex-header">
          <h2 className="title">BibTeX</h2>
          <button className="copy-bibtex-btn" onClick={copy} title="Copy BibTeX to clipboard">
            <i className="fas fa-copy" />
            <span className="copy-text">Copy</span>
          </button>
        </div>
        <pre id="bibtex-code">
          <code>{bib}</code>
        </pre>
      </div>
    </section>
  );
}