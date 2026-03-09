"use client";

import { useEffect, useState } from "react";
import type { CarouselSection as CarouselSectionType } from "@/types/sections";

export default function CarouselSection({ data }: { data: CarouselSectionType }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? data.items.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === data.items.length - 1 ? 0 : prev + 1));
  };

  const sectionClass =
    data.theme === "light" ? "section hero is-light" : "section";

  const currentItem = data.items[currentIndex];

  return (
    <section className={sectionClass} id={data.id}>
      <div className="container is-max-desktop">
        <div className="columns is-centered has-text-centered">
          <div className="column is-four-fifths">
            <h2 className="title is-3">{data.title}</h2>

            <div className="content">
              {/* Carousel Card */}
              <div
                className="card"
                style={{
                  marginTop: "2rem",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="card-content">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    {/* Image Container */}
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        maxHeight: "500px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={currentItem.src}
                        alt={currentItem.alt}
                        loading="lazy"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "500px",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    {/* Caption */}
                    <p className="is-size-6 has-text-justified">
                      {currentItem.caption}
                    </p>

                    {/* Navigation Controls */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "1.5rem",
                        marginTop: "1rem",
                        width: "100%",
                      }}
                    >
                      {/* Previous Button */}
                      <button
                        className="button is-light"
                        onClick={goToPrevious}
                        aria-label="Previous slide"
                      >
                        <span className="icon">
                          <i className="fas fa-chevron-left"></i>
                        </span>
                      </button>

                      {/* Slide Indicator */}
                      <span className="is-size-7 has-text-grey">
                        {currentIndex + 1} / {data.items.length}
                      </span>

                      {/* Next Button */}
                      <button
                        className="button is-light"
                        onClick={goToNext}
                        aria-label="Next slide"
                      >
                        <span className="icon">
                          <i className="fas fa-chevron-right"></i>
                        </span>
                      </button>
                    </div>

                    {/* Dot Indicators */}
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        justifyContent: "center",
                      }}
                    >
                      {data.items.map((_, idx) => (
                        <button
                          key={idx}
                          className={`button is-small ${
                            idx === currentIndex ? "is-info" : "is-light"
                          }`}
                          onClick={() => setCurrentIndex(idx)}
                          aria-label={`Go to slide ${idx + 1}`}
                          style={{
                            width: "12px",
                            height: "12px",
                            padding: 0,
                            minWidth: "12px",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
