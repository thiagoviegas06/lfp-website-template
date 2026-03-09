import type { Section } from "@/types/sections";

export const sections: Section[] = [
  {
    id: "top",
    kind: "hero",
    title:
      "Self supervised learning for in vivo localization of microelectrode arrays using raw local field potential",
    authors: [
      { name: "Tianxiao He", href: "#", superscripts: "1,*" },
      { name: "Malhar Patel", href: "#", superscripts: "1,*" },
      { name: "Chenyi Li", href: "#", superscripts: "1" },
      { name: "Anna Maslarova", href: "#", superscripts: "2" },
      { name: "Mihaly Voroslakos", href: "#", superscripts: "2" },
      { name: "Nalini Ramathan", href: "#", superscripts: "1" },
      { name: "Wei Lun Hung", href: "#", superscripts: "1" },
      { name: "Gyorgy Buszsaki", href: "#", superscripts: "2" },
      { name: "Erdem Varol", href: "#", superscripts: "1,2" },
      // ... add the rest
    ],
    affiliations: [
      "1 Department of Computer Science, New York University",
      "2 Neuroscience Institute, Grossman School of Medicine, New York University",
    ],
    venueLine: "New York University · NeurIPS 2025",
    links: [
      { label: "Paper", href: "https://openreview.net/pdf?id=96liIPUPXG", iconClass: "fas fa-file-pdf", isExternal: true },
      { label: "Supplementary", href: "/pdfs/supplementary_material.pdf", iconClass: "fas fa-file-pdf" },
      { label: "Code", href: "https://github.com/tianxiao18/Lfp2vec", iconClass: "fab fa-github", isExternal: true },
      { label: "arXiv", href: "https://arxiv.org/abs/<ARXIV_ID>", iconClass: "ai ai-arxiv", isExternal: true },
    ],
  },
  {
    id: "teaser",
    kind: "teaser",
    imageSrc: "/images/figure1_old.png",
    imageAlt: "Teaser image",
    caption:
      "Our framework uses self-supervised learning on raw LFP to perform in vivo localization and disease classification across multiple species and probe types.",
  },
  {
    id: "abstract",
    kind: "text",
    title: "Abstract",
    theme: "light",
    paragraphs: [
      "Recent advances in large-scale neural recordings have enabled accurate decoding of behavior and cognitive states, yet decoding anatomical regions remains underexplored, despite being crucial for consistent targeting in multiday recordings and effective deep brain stimulation. Current approaches typically rely on external anatomical information, from atlas-based planning to post hoc histology, which are limited in precision, longitudinal applicability, and real-time feedback. In this work, we develop a self-supervised learning framework, Lfp2vec, to infer anatomical regions directly from the neural signal in vivo. We adapt an audiopretrained transformer model by continuing self-supervised training on a large corpus of unlabeled local-field-potential (LFP) data, then fine-tuning for anatomical region decoding. Ablations show that combining out-of-domain initialization with in-domain self-supervision outperforms training from scratch. We demonstrate that our method achieves strong zero-shot generalization across different labs and probe geometries, and outperforms state-of-the-art self-supervised models on electrophysiology data. The learned embeddings form anatomically coherent clusters and transfer effectively to downstream tasks like disease classification with minimal fine-tuning. Altogether, our approach enables zero-shot prediction of brain regions in novel subjects, demonstrates that LFP signals encode rich anatomical information, and establishes self-supervised learning on raw LFP as a foundation to learn representations that can be tuned for diverse neural decoding tasks. Code to reproduce our results is found in the github repository at https://github.com/tianxiao18/Lfp2vec.",
    ],
  },
  {
  id: "interactive-demo",
  kind: "demo",
  title: "Interactive Demo",
  description:
    "Visualization with real probe data. The predictions are currently synthetic",
},
  {
  id: "methodology",
  kind: "text",
  title: "Methodology",
  theme: "light",
  image: { src: "/images/figure1.png", alt: "Figure 1: Model Overview", maxWidth: 700 },
  imageCaption: "Figure 1: LFP2Vec pipeline. The model operates directly on raw Local Field Potential (LFP) signals, applies spatiotemporal tokenization to preserve channel-wise spatial structure and temporal dynamics, and uses a Transformer encoder with self-supervised contrastive pretraining to learn domain-agnostic neural representations. The contrastive objective encourages anatomically similar segments to cluster in latent space. Fine-tuning on downstream tasks (region localization or disease classification) requires only limited labeled data.",
},
  {
    id: "results",
    kind: "carousel",
    title: "Results",
    theme: "light",
    items: [
      {
        src: "/images/figure2.png",
        alt: "Emergent Anatomical Structure",
        caption: "Emergent Anatomical Structure. Self-supervised embeddings cluster by brain region without explicit anatomical supervision. Embeddings from our pretrained model show clear separation between cortical regions (VISp, VISl, VISpm) and hippocampal structures (CA1, CA3, DG), demonstrating that spatial organization emerges naturally in the learned representation space.",
      },
      {
        src: "/images/figure5.png",
        alt: "Cross-Session and Cross-Species Generalization",
        caption: "Cross-Session and Cross-Species Generalization. Zero-shot generalization across recording sessions, animals, and species. The pretrained model maintains consistent performance across diverse experimental conditions (rodent and non-human primate recordings), indicating that the learned representations capture fundamental neural dynamics that transfer across different recording contexts.",
      },
      {
        src: "/images/supplement_figure2.png",
        alt: "Low-Label Efficiency and Downstream Performance",
        caption: "Low-Label Efficiency and Downstream Performance. With limited labeled data (10–50%), fine-tuning our pretrained backbone achieves competitive or superior performance compared to fully supervised baselines. The self-supervised pretraining provides a strong feature representation that accelerates convergence and requires minimal labeled data for downstream applications.",
      },
    ],
  },
  {
    id: "poster",
    kind: "pdf",
    title: "Poster",
    src: "/pdfs/poster.pdf",
    height: 550,
  },
  {
    id: "bibtex",
    kind: "bibtex",
    bibtex: `@article{he2025self,
  title={Self supervised learning for in vivo localization of microelectrode arrays using raw local field potential},
  author={Tianxiao He and Malhar Patel and Chenyi Li and Anna Maslarova and Mih{\'a}ly V{\"o}r{\"o}slakos and Nalini Ramanathan and Wei-Lun Hung and Gyorgy Buzsaki and Erdem Varol},
  journal={The Thirty-ninth Annual Conference on Neural Information Processing Systems},
  year={2025},
  url={https://openreview.net/forum?id=96liIPUPXG}
}`,
  },
  {
    id: "footer",
    kind: "footer",
    htmlLines: [
      `This page was built using the Academic Project Page Template and adapted from Nerfies.`,
      `This website is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License.`,
    ],
  },
];