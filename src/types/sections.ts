export type LinkItem = {
  label: string;
  href: string;
  iconClass?: string; // e.g. "fas fa-file-pdf"
  isExternal?: boolean;
};

export type AuthorItem = {
  name: string;
  href?: string;
  superscripts?: string; // e.g. "1,*"
};

export type BaseSection = {
  id: string;
  kind:
    | "hero"
    | "teaser"
    | "text"
    | "carousel"
    | "pdf"
    | "bibtex"
    | "footer"
    | "demo"
    | "brain-view";
};

export type HeroSection = BaseSection & {
  kind: "hero";
  title: string;
  authors: AuthorItem[];
  affiliations: string[];
  venueLine?: string;
  links: LinkItem[];
};

export type TeaserSection = BaseSection & {
  kind: "teaser";
  imageSrc: string;
  imageAlt: string;
  caption: string;
};

export type TextSection = BaseSection & {
  kind: "text";
  title: string;
  theme?: "light" | "default"; // maps to Bulma hero styles
  paragraphs?: string[];
  bullets?: string[];
  image?: { src: string; alt: string; maxWidth?: number };
  imageCaption?: string;
};

export type CarouselSection = BaseSection & {
  kind: "carousel";
  title: string;
  theme?: "light" | "default";
  bullets?: string[];
  items: { src: string; alt: string; caption: string }[];
};

export type PdfSection = BaseSection & {
  kind: "pdf";
  title: string;
  src: string;
  height?: number;
};

export type BibtexSection = BaseSection & {
  kind: "bibtex";
  bibtex: string;
};

export type FooterSection = BaseSection & {
  kind: "footer";
  htmlLines: string[]; // keep it simple for now
};

export type DemoSection = BaseSection & {
  kind: "demo";
  title?: string;
  description?: string;
};

export type BrainViewSection = BaseSection & {
  kind: "brain-view";
  title?: string;
  dataSource?: "sample" | "api" | "both";
  defaultDataSource?: "sample" | "api";
};

export type Section =
  | HeroSection
  | TeaserSection
  | TextSection
  | CarouselSection
  | PdfSection
  | BibtexSection
  | FooterSection
  | DemoSection
  | BrainViewSection;