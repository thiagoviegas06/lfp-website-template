import type { DemoSection as DemoSectionType } from "@/types/sections";
import Lfp2VecDemo from "@/components/Lfp2VecDemo";

export default function DemoSection({ data }: { data: DemoSectionType }) {
  return (
    <section className="section hero is-light" id={data.id}>
      <div className="container is-max-desktop">
        <div className="columns is-centered has-text-centered">
          <div className="column is-four-fifths">
            {data.title ? <h2 className="title is-3">{data.title}</h2> : null}
            {data.description ? (
              <div className="content has-text-justified">
                <p>{data.description}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Demo itself (already Bulma-styled, no inline CSS) */}
        <Lfp2VecDemo />
      </div>
    </section>
  );
}