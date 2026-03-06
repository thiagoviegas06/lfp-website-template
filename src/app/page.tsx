import { sections } from "@/content/project";
import type { Section } from "@/types/sections";

import HeroSection from "@/components/sections/HeroSection";
import TeaserSection from "@/components/sections/TeaserSection";
import TextSection from "@/components/sections/TextSection";
import CarouselSection from "@/components/sections/CarouselSection";
import PdfSection from "@/components/sections/PdfSection";
import BibtexSection from "@/components/sections/BibtexSection";
import FooterSection from "@/components/sections/FooterSection";
import DemoSection from "@/components/sections/DemoSection";

function renderSection(section: Section) {
  switch (section.kind) {
    case "hero":
      return <HeroSection key={section.id} data={section} />;
    case "teaser":
      return <TeaserSection key={section.id} data={section} />;
    case "text":
      return <TextSection key={section.id} data={section} />;
    case "carousel":
      return <CarouselSection key={section.id} data={section} />;
    case "pdf":
      return <PdfSection key={section.id} data={section} />;
    case "bibtex":
      return <BibtexSection key={section.id} data={section} />;
    case "footer":
      return <FooterSection key={section.id} data={section} />;
    case "demo":
      return <DemoSection key={section.id} data={section} />;
    default:
      return null;
  }
}

export default function Page() {
  return <main id="main-content">{sections.map(renderSection)}</main>;
}