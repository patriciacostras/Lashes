export const defaultServices = [
  {
    id: "extensii-1d",
    name: "Extensii gene 1D",
    description: "Classic set natural, curat si elegant.",
    durationMin: 180,
    priceRon: 130
  },
  {
    id: "extensii-2d",
    name: "Extensii gene 2D",
    description: "Volum fin, usor mai plin decat 1D.",
    durationMin: 180,
    priceRon: 150
  },
  {
    id: "extensii-3d",
    name: "Extensii gene 3D",
    description: "Volum mediu, vizibil si inca purtabil zi de zi.",
    durationMin: 180,
    priceRon: 170
  },
  {
    id: "extensii-4d",
    name: "Extensii gene 4D",
    description: "Volum mai intens, pentru efect glam.",
    durationMin: 180,
    priceRon: 190
  },
  {
    id: "extensii-5d",
    name: "Extensii gene 5D",
    description: "Set dramatic, cu volum intens si finisaj curat.",
    durationMin: 180,
    priceRon: 200
  },
  {
    id: "extensii-6d-plus",
    name: "Extensii gene 6D+",
    description: "Mega volum; pretul depinde de grosimea dorita. Scrie-mi pe Instagram pentru pret exact.",
    durationMin: 180,
    priceRon: 0
  },
  {
    id: "intretinere-1d",
    name: "Intretinere 1D",
    description: "Refill pentru set 1D, recomandat la 2-3 saptamani.",
    durationMin: 180,
    priceRon: 120
  },
  {
    id: "intretinere-2d",
    name: "Intretinere 2D",
    description: "Refill fin pentru volum 2D, cu curatare si completare.",
    durationMin: 180,
    priceRon: 140
  },
  {
    id: "intretinere-3d",
    name: "Intretinere 3D",
    description: "Reimprospatare volum mediu pentru gene uniforme.",
    durationMin: 180,
    priceRon: 160
  },
  {
    id: "intretinere-4d",
    name: "Intretinere 4D",
    description: "Refill pentru volum intens, cu timp extra pentru aranjare.",
    durationMin: 180,
    priceRon: 180
  },
  {
    id: "intretinere-5d",
    name: "Intretinere 5D",
    description: "Intretinere dramatica, pentru pastrarea efectului plin.",
    durationMin: 180,
    priceRon: 190
  },
  {
    id: "intretinere-6d-plus",
    name: "Intretinere 6D+",
    description: "Intretinere mega volum; pretul depinde de grosimea dorita. Scrie-mi pe Instagram pentru pret exact.",
    durationMin: 180,
    priceRon: 0
  },
  {
    id: "demontare-gene",
    name: "Demontare gene",
    description: "Demontare blanda si curatare, fara smuls sau tras de genele naturale.",
    durationMin: 180,
    priceRon: 50
  }
];

export type BookingService = (typeof defaultServices)[number];
