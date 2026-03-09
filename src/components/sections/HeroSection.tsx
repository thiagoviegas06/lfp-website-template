import type { HeroSection as HeroSectionType } from "@/types/sections";

export default function HeroSection({ data }: { data: HeroSectionType }) {
  return (
    <section className="hero">
      <div className="hero-body pb-3">
        <div className="container is-max-desktop">
          <div className="columns is-centered">
            <div className="column has-text-centered">
              <h1 className="title is-1 publication-title">{data.title}</h1>

              <div className="is-size-5 publication-authors">
                {data.authors.map((a, i) => (
                  <span className="author-block" key={`${a.name}-${i}`}>
                    {a.href ? (
                      <a href={a.href} target="_blank" rel="noreferrer">
                        {a.name}
                      </a>
                    ) : (
                      a.name
                    )}
                    {a.superscripts ? <sup>{a.superscripts}</sup> : null}
                    {i < data.authors.length - 1 ? ", " : null}
                  </span>
                ))}
              </div>

              <div className="is-size-5 publication-authors">
                <span className="author-block">
                  {data.venueLine ? (
                    <>
                      {data.venueLine}
                      <br />
                    </>
                  ) : null}
                </span>
                <span className="eql-cntrb">
                  <small>
                    <br />
                    {data.affiliations.map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </small>
                </span>
              </div>

              <div className="column has-text-centered">
                <div className="publication-links">
                  {data.links.map((l, i) => (
                    <span className="link-block" key={`${l.label}-${i}`}>
                      <a
                        href={l.href}
                        target={l.isExternal ? "_blank" : undefined}
                        rel={l.isExternal ? "noreferrer" : undefined}
                        className="external-link button is-normal is-rounded is-dark"
                      >
                        {l.iconClass ? (
                          <span className="icon">
                            <i className={l.iconClass} />
                          </span>
                        ) : null}
                        <span>{l.label}</span>
                      </a>
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}