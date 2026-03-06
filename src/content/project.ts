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
    "Seeded synthetic visualization showing the structure of signals and region-decoding outputs.",
},
  {
  id: "methodology",
  kind: "text",
  title: "Methodology",
  theme: "light",
  image: { src: "/images/figure1.png", alt: "Figure 1: Model Overview", maxWidth: 600 },
  bullets: [
    "Direct Raw LFP Modeling: The model operates directly on band-limited raw Local Field Potential (LFP) traces from high-density probes (e.g., Neuropixels), avoiding hand-engineered spectral or spike-based features.",
    
    "Spatiotemporal Tokenization: Continuous LFP signals are segmented into temporal windows and embedded into tokens that preserve both channel-wise spatial structure and temporal dynamics before being processed by the Transformer encoder.",
    
    "Self-Supervised Pretraining Objective: A Transformer-Encoder backbone is trained using a contrastive objective that encourages representations of related neural segments to be close in latent space while pushing apart unrelated segments.",
    
    "Cross-Session and Cross-Domain Alignment: The contrastive framework promotes invariance across recording sessions, animals, and probe types, enabling the model to learn domain-agnostic neural representations.",
    
    "Structured Latent Space Organization: After pretraining, embeddings cluster according to anatomical and functional regions (e.g., cortex, CA1, DG), suggesting that brain structure emerges naturally in the learned representation space.",
    
    "Lightweight Task-Specific Heads: For downstream applications (e.g., region localization or pathology classification), a small supervised decoder is fine-tuned on top of the frozen or partially frozen backbone, enabling strong performance with limited labeled data."
  ],
},
  {
    id: "results",
    kind: "carousel",
    title: "Results",
    theme: "light",
    bullets: [
    "Emergent Anatomical Structure: Self-supervised embeddings cluster by brain region (e.g., Cortex, CA1, DG) without explicit anatomical supervision, demonstrating that spatial organization is encoded in the latent space.",
    
    "Cross-Session Generalization: The pretrained model maintains performance across animals and recording sessions, indicating robustness to session-specific noise and experimental variability.",
    
    "Low-Label Efficiency: Fine-tuning with limited labeled data achieves competitive or superior performance compared to fully supervised baselines trained from scratch.",
    
    "Improved Downstream Accuracy: The pretrained backbone consistently outperforms classical feature-based pipelines on region localization and disease classification tasks.",
    
    "Cross-Species Transferability: Representations learned from one domain (e.g., rodent) transfer effectively to another (e.g., macaque), suggesting shared neural dynamics are captured in the embedding space.",
    
    "Stable Training Dynamics: Contrastive pretraining produces smooth convergence and consistent improvements in downstream metrics compared to random initialization."
  ],
    items: [
      { src: "/images/figure2.png", alt: "Result Figure 1", caption: "Result Figure 1 description." },
      { src: "/images/figure5.png", alt: "Result Figure 2", caption: "Result Figure 2 description." },
      { src: "/images/supplement_figure2.png", alt: "Result Figure 3", caption: "Result Figure 3 description." },
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