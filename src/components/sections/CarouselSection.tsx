"use client";

import { useEffect } from "react";
import type { CarouselSection as CarouselSectionType } from "@/types/sections";

declare global {
  interface Window {
    bulmaCarousel?: {
      attach: (selector: string, options: Record<string, unknown>) => unknown;
    };
  }
}

export default function CarouselSection({ data }: { data: CarouselSectionType }) {
  useEffect(() => {
    if (window.bulmaCarousel) {
      window.bulmaCarousel.attach(`#carousel-${data.id}`, {
        slidesToScroll: 1,
        slidesToShow: 1,
        loop: true,
      });
    }
  }, [data.id]);

  const sectionClass =
    data.theme === "light" ? "section hero is-light" : "section";

  return (
    <section className={sectionClass} id={data.id}>
      <div className="container is-max-desktop">
        <div className="columns is-centered has-text-centered">
          <div className="column is-four-fifths">
            <h2 className="title is-3">{data.title}</h2>

            <div className="content has-text-justified">
              {data.bullets?.length ? (
                <ul>
                  {data.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : null}

              <div id={`carousel-${data.id}`} className="carousel results-carousel">
                {data.items.map((it, i) => (
                  <div className="item" key={i}>
                    <article className="results-carousel-card">
                      <div className="results-carousel-media">
                        <img src={it.src} alt={it.alt} loading="lazy" />
                      </div>
                      <p className="results-carousel-caption subtitle has-text-centered">
                        {it.caption}
                      </p>
                    </article>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
