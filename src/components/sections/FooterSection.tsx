import type { FooterSection as FooterSectionType } from "@/types/sections";

export default function FooterSection({ data }: { data: FooterSectionType }) {
  return (
    <footer className="footer" id={data.id}>
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-8">
            <div className="content">
              {data.htmlLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}