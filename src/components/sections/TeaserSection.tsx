import type { TeaserSection as TeaserSectionType } from "@/types/sections";

export default function TeaserSection({ data }: { data: TeaserSectionType }) {
  return (
    <section className="hero teaser">
      <div className="container is-max-desktop">
        <div className="hero-body">
          <img src={data.imageSrc} alt={data.imageAlt} style={{ width: "100%", height: "auto" }} />
          <h2 className="subtitle has-text-centered">{data.caption}</h2>
        </div>
      </div>
    </section>
  );
}