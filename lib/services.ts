export const defaultServices = [
  {
    id: "extensii-1d",
    name: "Extensii gene 1D",
    description: "Classic set natural, potrivit pentru prima programare.",
    durationMin: 180,
    priceRon: 180
  },
  {
    id: "extensii-2d",
    name: "Extensii gene 2D",
    description: "Volum fin, usor mai plin decat 1D.",
    durationMin: 210,
    priceRon: 210
  },
  {
    id: "extensii-3d",
    name: "Extensii gene 3D",
    description: "Volum mediu, vizibil si inca purtabil zi de zi.",
    durationMin: 240,
    priceRon: 240
  },
  {
    id: "extensii-4d",
    name: "Extensii gene 4D",
    description: "Volum mai intens, pentru efect glam.",
    durationMin: 270,
    priceRon: 270
  },
  {
    id: "extensii-5d",
    name: "Extensii gene 5D",
    description: "Set dramatic, cu timp generos pentru lucru atent.",
    durationMin: 300,
    priceRon: 300
  },
  {
    id: "extensii-6d-plus",
    name: "Extensii gene 6D+",
    description: "Mega volum, potrivit pentru cliente care vor impact maxim.",
    durationMin: 360,
    priceRon: 340
  },
  {
    id: "intretinere-1d",
    name: "Intretinere 1D",
    description: "Refill pentru set 1D, recomandat la 2-3 saptamani.",
    durationMin: 120,
    priceRon: 120
  },
  {
    id: "intretinere-2d",
    name: "Intretinere 2D",
    description: "Refill fin pentru volum 2D, cu curatare si completare.",
    durationMin: 135,
    priceRon: 140
  },
  {
    id: "intretinere-3d",
    name: "Intretinere 3D",
    description: "Reimprospatare volum mediu pentru gene uniforme.",
    durationMin: 150,
    priceRon: 160
  },
  {
    id: "intretinere-4d",
    name: "Intretinere 4D",
    description: "Refill pentru volum intens, cu timp extra pentru aranjare.",
    durationMin: 165,
    priceRon: 180
  },
  {
    id: "intretinere-5d",
    name: "Intretinere 5D",
    description: "Intretinere dramatica, pentru pastrarea efectului plin.",
    durationMin: 180,
    priceRon: 200
  },
  {
    id: "intretinere-6d-plus",
    name: "Intretinere 6D+",
    description: "Refill mega volum, cu timp generos pentru simetrie.",
    durationMin: 210,
    priceRon: 230
  },
  {
    id: "demontare-gene",
    name: "Demontare gene",
    description: "Demontare blanda si curatare, fara smuls sau tras de genele naturale.",
    durationMin: 45,
    priceRon: 60
  }
];

export type BookingService = (typeof defaultServices)[number];
