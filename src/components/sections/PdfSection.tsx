import type { PdfSection as PdfSectionType } from "@/types/sections";

export default function PdfSection({ data }: { data: PdfSectionType }) {
  return (
    <section className="hero is-small is-light" id={data.id}>
      <div className="hero-body">
        <div className="container">
          <h2 className="title">{data.title}</h2>
          <iframe src={data.src} width="100%" height={data.height ?? 550} />
        </div>
      </div>
    </section>
  );
}