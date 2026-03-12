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
  imageCaption: "Figure 1: Overview of the Lfp2vec pipeline. a) Example multi-species local-field-potential (LFP) segments: SiNAPs (mouse), Neuropixels–IBL (mouse), Neuropixels–Allen (mouse), and NeuropixelsNHP (Macaque), segmented into short spatiotemporal windows. b) Each window is encoded using a 1-D convolutional encoder and a Transformer, trained with a masked-prediction contrastive objective to learn spatially coherent representations. The pretrained model is then fine-tuned for downstream tasks. c) Learned embeddings after fine-tuning: rodent hippocampus (top), macaque motor regions (middle), and healthy vs. disease-model recordings (bottom). Colors denote ground-truth anatomical or experimental labels. d) Embeddings drive lightweight decoders for downstream tasks: brain-region localization (top: rodent, middle: macaque) and session-level disease classification (bottom; Alzheimer’s model vs. healthy). Each dot shows predicted region probabilities pie charts per trial. Columns correspond to trials, rows to channels, and colors represent brain regions or disease labels in c).",
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
        caption: "Model performance comparison in region decoding across rodent datasets. a) Balanced test accuracy and macro-F1 (left) for brain-region decoding on three mouse LFP datasets (Neuronexus, Allen, IBL). Silhouette score and linear probing accuracy (right) quantifies how well embeddings cluster by brain region, session, and probe identity in Allen sessions. b) Confusion matrices showing the brain region classification performance across all models in Allen sessions. c) PCA projections of channel embeddings for Allen sessions, colored by distinct brain regions, showing clusters by brain regions. d) Channel-wise predicted regions on a Neuronexus probe compared to ground truth. Each dot represents a region probability pie chart (right top), with temporal smoothing (right middle) and spatial smoothing (right bottom) improving prediction. e) Cross lab generalization matrix for zero-shot (middle) and one-shot (right) performance across three mice datasets (left), here high off-diagonal values indicate good generalization performance from one lab to another",
      },
      {
        src: "/images/figure5.png",
        alt: "Cross-Session and Cross-Species Generalization",
        caption: " Lfp2vec representations transfer across laboratories, probe geometries, and species. a) Cross-species generalization: Lfp2vec outperforms spectrograms, SimCLR, and BrainBERT in balanced accuracy and macro-F1 for classifying SMA, M1, and BG. b) Confusion matrices show Lfp2vec achieves the highest accuracy and clearest separation across regions (BG, SMA, M1). c) PCA plots reveal Lfp2vec embeddings form distinct, region-specific clusters, generalizing beyond rodent data.",
      },
      {
        src: "/images/supplement_figure2.png",
        alt: "Low-Label Efficiency and Downstream Performance",
        caption: "Disease Prediction and Abnormality Study by Brain Regions. a) Classification performance (accuracy and F1 score) on distinguishing Alzheimer’s disease (AD) model mice (App x Psen1) from healthy controls using different self-supervised models. Lfp2vec consistently outperforms SimCLR and BrainBERT. b) PCA projection of learned Lfp2vec embeddings shows distinct clustering between diseased and healthy animals. c–d) Channel-wise predictions and region-level abnormality scores for AD model mice (c) and healthy controls (d). Each dot represents a channel’s prediction across trials. Bar plots below summarize region-wise abnormality scores, showing which anatomical regions have higher deviation from normal activity. CA3 and DG show the least abnormal signals in AD mice, while abnormality scores in healthy controls remain low across all regions.",
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