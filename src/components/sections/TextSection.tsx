import type { TextSection as TextSectionType } from "@/types/sections";

export default function TextSection({ data }: { data: TextSectionType }) {
  const sectionClass =
    data.theme === "light" ? "section hero is-light" : "section";

  return (
    <section className={sectionClass} id={data.id}>
      <div className="container is-max-desktop">
        <div className="columns is-centered has-text-centered">
          <div className="column is-four-fifths">
            <h2 className="title is-3">{data.title}</h2>
            <div className="content has-text-justified">
              {data.image ? (
                <div className="has-text-centered">
                  <img
                    src={data.image.src}
                    alt={data.image.alt}
                    style={{
                      maxWidth: data.image.maxWidth ?? 600,
                      width: "100%",
                      marginBottom: "0.5em",
                      display: "inline-block",
                    }}
                  />
                  {data.imageCaption ? (
                    <p className="is-size-7 has-text-grey" style={{ marginBottom: "1em" }}>
                      {data.imageCaption}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {data.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}

              {data.bullets?.length ? (
                <ul>
                  {data.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}