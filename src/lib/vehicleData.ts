/**
 * Base locale make → modèles avec dimensions réelles (en cm).
 * Couvre les marques les plus répandues en France/Europe + mondiales.
 * Si la marque ou le modèle n'est pas ici → saisie libre + API carqueryapi.
 */

export type ModelEntry = { name: string; lengthCm: number };
export type BrandEntry = { models: ModelEntry[] };

export const VEHICLE_DATA: Record<string, BrandEntry> = {
  "Audi": { models: [
    { name: "A1",        lengthCm: 405 }, { name: "A2",        lengthCm: 374 },
    { name: "A3",        lengthCm: 445 }, { name: "A4",        lengthCm: 468 },
    { name: "A5",        lengthCm: 470 }, { name: "A6",        lengthCm: 494 },
    { name: "A7",        lengthCm: 495 }, { name: "A8",        lengthCm: 520 },
    { name: "Q2",        lengthCm: 421 }, { name: "Q3",        lengthCm: 449 },
    { name: "Q4 e-tron", lengthCm: 458 }, { name: "Q5",        lengthCm: 469 },
    { name: "Q7",        lengthCm: 499 }, { name: "Q8",        lengthCm: 500 },
    { name: "e-tron",    lengthCm: 490 }, { name: "TT",        lengthCm: 420 },
    { name: "R8",        lengthCm: 443 },
  ]},

  "BMW": { models: [
    { name: "Série 1",  lengthCm: 432 }, { name: "Série 2",  lengthCm: 452 },
    { name: "Série 3",  lengthCm: 469 }, { name: "Série 4",  lengthCm: 477 },
    { name: "Série 5",  lengthCm: 494 }, { name: "Série 6",  lengthCm: 497 },
    { name: "Série 7",  lengthCm: 527 }, { name: "Série 8",  lengthCm: 491 },
    { name: "X1",       lengthCm: 448 }, { name: "X2",       lengthCm: 443 },
    { name: "X3",       lengthCm: 472 }, { name: "X4",       lengthCm: 469 },
    { name: "X5",       lengthCm: 494 }, { name: "X6",       lengthCm: 494 },
    { name: "X7",       lengthCm: 523 }, { name: "iX",       lengthCm: 491 },
    { name: "i3",       lengthCm: 400 }, { name: "i4",       lengthCm: 476 },
    { name: "i5",       lengthCm: 494 }, { name: "i7",       lengthCm: 527 },
    { name: "Z4",       lengthCm: 442 }, { name: "M2",       lengthCm: 445 },
    { name: "M3",       lengthCm: 469 }, { name: "M4",       lengthCm: 477 },
    { name: "M5",       lengthCm: 494 },
  ]},

  "BYD": { models: [
    { name: "Atto 3",   lengthCm: 460 }, { name: "Han",      lengthCm: 495 },
    { name: "Tang",     lengthCm: 480 }, { name: "Seal",     lengthCm: 475 },
    { name: "Dolphin",  lengthCm: 442 }, { name: "Seagull",  lengthCm: 375 },
    { name: "Song Pro", lengthCm: 466 }, { name: "Yuan Plus", lengthCm: 445 },
  ]},

  "Citroën": { models: [
    { name: "C1",          lengthCm: 361 }, { name: "C3",          lengthCm: 402 },
    { name: "C3 Aircross", lengthCm: 424 }, { name: "C4",          lengthCm: 437 },
    { name: "C4 X",        lengthCm: 449 }, { name: "C5 Aircross", lengthCm: 453 },
    { name: "C5 X",        lengthCm: 477 }, { name: "Berlingo",    lengthCm: 440 },
    { name: "Spacetourer", lengthCm: 491 }, { name: "ë-C3",        lengthCm: 402 },
    { name: "Ami",         lengthCm: 248 },
  ]},

  "Dacia": { models: [
    { name: "Sandero",  lengthCm: 407 }, { name: "Logan",    lengthCm: 444 },
    { name: "Duster",   lengthCm: 443 }, { name: "Jogger",   lengthCm: 452 },
    { name: "Spring",   lengthCm: 368 }, { name: "Bigster",  lengthCm: 461 },
  ]},

  "DS": { models: [
    { name: "DS 3",  lengthCm: 420 }, { name: "DS 4",  lengthCm: 441 },
    { name: "DS 7",  lengthCm: 455 }, { name: "DS 9",  lengthCm: 490 },
  ]},

  "Ferrari": { models: [
    { name: "Roma",       lengthCm: 454 }, { name: "Portofino",  lengthCm: 452 },
    { name: "SF90",       lengthCm: 457 }, { name: "F8 Tributo", lengthCm: 452 },
    { name: "296 GTB",    lengthCm: 447 }, { name: "Purosangue", lengthCm: 499 },
  ]},

  "Fiat": { models: [
    { name: "500",       lengthCm: 356 }, { name: "500X",      lengthCm: 424 },
    { name: "Panda",     lengthCm: 365 }, { name: "Tipo",      lengthCm: 465 },
    { name: "Doblo",     lengthCm: 451 }, { name: "Ducato",    lengthCm: 599 },
  ]},

  "Ford": { models: [
    { name: "Fiesta",   lengthCm: 406 }, { name: "Focus",    lengthCm: 444 },
    { name: "Puma",     lengthCm: 427 }, { name: "Kuga",     lengthCm: 456 },
    { name: "Explorer", lengthCm: 505 }, { name: "Mustang",  lengthCm: 478 },
    { name: "Bronco",   lengthCm: 467 }, { name: "Transit",  lengthCm: 597 },
    { name: "Ranger",   lengthCm: 536 },
  ]},

  "Honda": { models: [
    { name: "Jazz",     lengthCm: 404 }, { name: "Civic",    lengthCm: 449 },
    { name: "HR-V",     lengthCm: 432 }, { name: "CR-V",     lengthCm: 464 },
    { name: "e:Ny1",    lengthCm: 448 },
  ]},

  "Hyundai": { models: [
    { name: "i10",      lengthCm: 368 }, { name: "i20",      lengthCm: 401 },
    { name: "i30",      lengthCm: 436 }, { name: "Tucson",   lengthCm: 455 },
    { name: "Kona",     lengthCm: 430 }, { name: "Santa Fe", lengthCm: 480 },
    { name: "IONIQ 5",  lengthCm: 463 }, { name: "IONIQ 6",  lengthCm: 485 },
    { name: "IONIQ 9",  lengthCm: 503 },
  ]},

  "Jeep": { models: [
    { name: "Renegade",  lengthCm: 424 }, { name: "Compass",   lengthCm: 451 },
    { name: "Cherokee",  lengthCm: 469 }, { name: "Grand Cherokee", lengthCm: 489 },
    { name: "Wrangler",  lengthCm: 466 }, { name: "Avenger",   lengthCm: 432 },
  ]},

  "Kia": { models: [
    { name: "Picanto",  lengthCm: 369 }, { name: "Rio",      lengthCm: 415 },
    { name: "Ceed",     lengthCm: 436 }, { name: "Sportage", lengthCm: 452 },
    { name: "Niro",     lengthCm: 444 }, { name: "Sorento",  lengthCm: 480 },
    { name: "EV6",      lengthCm: 463 }, { name: "EV9",      lengthCm: 502 },
    { name: "Stinger",  lengthCm: 478 },
  ]},

  "Land Rover": { models: [
    { name: "Defender",      lengthCm: 504 }, { name: "Discovery",     lengthCm: 500 },
    { name: "Discovery Sport", lengthCm: 459 }, { name: "Freelander",  lengthCm: 445 },
    { name: "Range Rover",   lengthCm: 517 }, { name: "Range Rover Sport", lengthCm: 493 },
    { name: "Range Rover Velar", lengthCm: 479 }, { name: "Range Rover Evoque", lengthCm: 443 },
  ]},

  "Lexus": { models: [
    { name: "CT",   lengthCm: 432 }, { name: "UX",   lengthCm: 445 },
    { name: "NX",   lengthCm: 460 }, { name: "RX",   lengthCm: 479 },
    { name: "LX",   lengthCm: 511 }, { name: "ES",   lengthCm: 495 },
    { name: "IS",   lengthCm: 469 }, { name: "LS",   lengthCm: 520 },
  ]},

  "Mazda": { models: [
    { name: "2",      lengthCm: 408 }, { name: "3",      lengthCm: 459 },
    { name: "6",      lengthCm: 490 }, { name: "CX-3",   lengthCm: 421 },
    { name: "CX-30",  lengthCm: 443 }, { name: "CX-5",   lengthCm: 458 },
    { name: "CX-60",  lengthCm: 477 }, { name: "MX-5",   lengthCm: 390 },
    { name: "MX-30",  lengthCm: 439 },
  ]},

  "Mercedes-Benz": { models: [
    { name: "Classe A",  lengthCm: 441 }, { name: "Classe B",  lengthCm: 445 },
    { name: "Classe C",  lengthCm: 469 }, { name: "Classe E",  lengthCm: 495 },
    { name: "Classe S",  lengthCm: 523 }, { name: "Classe G",  lengthCm: 447 },
    { name: "GLA",       lengthCm: 442 }, { name: "GLB",       lengthCm: 444 },
    { name: "GLC",       lengthCm: 470 }, { name: "GLE",       lengthCm: 494 },
    { name: "GLS",       lengthCm: 513 }, { name: "EQA",       lengthCm: 443 },
    { name: "EQB",       lengthCm: 448 }, { name: "EQC",       lengthCm: 473 },
    { name: "EQE",       lengthCm: 490 }, { name: "EQS",       lengthCm: 520 },
    { name: "CLA",       lengthCm: 466 }, { name: "AMG GT",    lengthCm: 462 },
  ]},

  "MG": { models: [
    { name: "MG3",   lengthCm: 411 }, { name: "MG4",   lengthCm: 444 },
    { name: "MG5",   lengthCm: 456 }, { name: "MG ZS",  lengthCm: 444 },
    { name: "MG HS",  lengthCm: 461 }, { name: "Cyberster", lengthCm: 430 },
  ]},

  "Mini": { models: [
    { name: "Mini 3 portes",   lengthCm: 386 }, { name: "Mini 5 portes",   lengthCm: 404 },
    { name: "Mini Cabrio",     lengthCm: 386 }, { name: "Mini Clubman",    lengthCm: 427 },
    { name: "Mini Countryman", lengthCm: 447 }, { name: "Mini Paceman",    lengthCm: 422 },
    { name: "Mini Aceman",     lengthCm: 419 },
  ]},

  "Mitsubishi": { models: [
    { name: "Colt",     lengthCm: 401 }, { name: "Eclipse Cross", lengthCm: 447 },
    { name: "Outlander", lengthCm: 477 }, { name: "ASX",          lengthCm: 439 },
    { name: "L200",      lengthCm: 530 },
  ]},

  "NIO": { models: [
    { name: "ET5",  lengthCm: 478 }, { name: "ET7",  lengthCm: 510 },
    { name: "ES6",  lengthCm: 494 }, { name: "ES8",  lengthCm: 503 },
    { name: "EL6",  lengthCm: 491 }, { name: "EC6",  lengthCm: 492 },
  ]},

  "Nissan": { models: [
    { name: "Micra",   lengthCm: 387 }, { name: "Juke",    lengthCm: 423 },
    { name: "Qashqai", lengthCm: 444 }, { name: "X-Trail", lengthCm: 458 },
    { name: "Ariya",   lengthCm: 461 }, { name: "Leaf",    lengthCm: 449 },
    { name: "Navara",  lengthCm: 531 },
  ]},

  "Opel": { models: [
    { name: "Corsa",    lengthCm: 406 }, { name: "Astra",    lengthCm: 437 },
    { name: "Mokka",    lengthCm: 426 }, { name: "Crossland", lengthCm: 428 },
    { name: "Grandland", lengthCm: 449 }, { name: "Insignia", lengthCm: 490 },
    { name: "Zafira",   lengthCm: 461 },
  ]},

  "Peugeot": { models: [
    { name: "108",        lengthCm: 361 }, { name: "208",        lengthCm: 408 },
    { name: "308",        lengthCm: 443 }, { name: "408",        lengthCm: 447 },
    { name: "508",        lengthCm: 473 }, { name: "2008",       lengthCm: 424 },
    { name: "3008",       lengthCm: 453 }, { name: "5008",       lengthCm: 472 },
    { name: "e-208",      lengthCm: 408 }, { name: "e-2008",     lengthCm: 424 },
    { name: "Partner",    lengthCm: 436 }, { name: "Rifter",     lengthCm: 441 },
    { name: "Expert",     lengthCm: 493 }, { name: "Traveller",  lengthCm: 494 },
  ]},

  "Renault": { models: [
    { name: "Twingo",   lengthCm: 366 }, { name: "Clio",     lengthCm: 407 },
    { name: "Megane",   lengthCm: 436 }, { name: "Austral",  lengthCm: 446 },
    { name: "Espace",   lengthCm: 468 }, { name: "Scenic",   lengthCm: 447 },
    { name: "Talisman", lengthCm: 478 }, { name: "Koleos",   lengthCm: 466 },
    { name: "Captur",   lengthCm: 421 }, { name: "Arkana",   lengthCm: 447 },
    { name: "Zoe",      lengthCm: 408 }, { name: "Megane E-Tech", lengthCm: 436 },
    { name: "Kadjar",   lengthCm: 451 }, { name: "Kangoo",   lengthCm: 441 },
    { name: "Trafic",   lengthCm: 502 }, { name: "Master",   lengthCm: 598 },
  ]},

  "Seat": { models: [
    { name: "Ibiza",  lengthCm: 405 }, { name: "Leon",   lengthCm: 437 },
    { name: "Arona",  lengthCm: 415 }, { name: "Ateca",  lengthCm: 453 },
    { name: "Tarraco", lengthCm: 469 },
  ]},

  "Skoda": { models: [
    { name: "Fabia",    lengthCm: 413 }, { name: "Scala",    lengthCm: 437 },
    { name: "Octavia",  lengthCm: 468 }, { name: "Superb",   lengthCm: 494 },
    { name: "Kamiq",    lengthCm: 422 }, { name: "Karoq",    lengthCm: 448 },
    { name: "Kodiaq",   lengthCm: 471 }, { name: "Enyaq",    lengthCm: 465 },
  ]},

  "Subaru": { models: [
    { name: "Impreza", lengthCm: 451 }, { name: "Outback",  lengthCm: 483 },
    { name: "Forester", lengthCm: 466 }, { name: "XV",       lengthCm: 444 },
    { name: "Solterra", lengthCm: 458 }, { name: "BRZ",      lengthCm: 428 },
  ]},

  "Suzuki": { models: [
    { name: "Alto",    lengthCm: 347 }, { name: "Swift",   lengthCm: 398 },
    { name: "Baleno",  lengthCm: 426 }, { name: "Vitara",  lengthCm: 424 },
    { name: "S-Cross", lengthCm: 436 }, { name: "Jimny",   lengthCm: 373 },
    { name: "Across",  lengthCm: 459 },
  ]},

  "Tesla": { models: [
    { name: "Model 3", lengthCm: 469 }, { name: "Model Y", lengthCm: 474 },
    { name: "Model S", lengthCm: 497 }, { name: "Model X", lengthCm: 503 },
    { name: "Cybertruck", lengthCm: 575 },
  ]},

  "Toyota": { models: [
    { name: "Aygo X",    lengthCm: 388 }, { name: "Yaris",     lengthCm: 399 },
    { name: "Yaris Cross", lengthCm: 422 }, { name: "Corolla",   lengthCm: 457 },
    { name: "Camry",     lengthCm: 488 }, { name: "C-HR",      lengthCm: 443 },
    { name: "RAV4",      lengthCm: 460 }, { name: "Highlander", lengthCm: 495 },
    { name: "Land Cruiser", lengthCm: 497 }, { name: "Prius",   lengthCm: 462 },
    { name: "bZ4X",      lengthCm: 458 }, { name: "Proace",    lengthCm: 493 },
  ]},

  "Volkswagen": { models: [
    { name: "Up!",    lengthCm: 360 }, { name: "Polo",   lengthCm: 408 },
    { name: "Golf",   lengthCm: 436 }, { name: "Passat", lengthCm: 479 },
    { name: "Arteon", lengthCm: 487 }, { name: "T-Cross", lengthCm: 422 },
    { name: "T-Roc",  lengthCm: 432 }, { name: "Tiguan", lengthCm: 456 },
    { name: "Touareg", lengthCm: 490 }, { name: "ID.3",   lengthCm: 442 },
    { name: "ID.4",   lengthCm: 458 }, { name: "ID.5",   lengthCm: 458 },
    { name: "ID.7",   lengthCm: 497 }, { name: "Sharan", lengthCm: 469 },
    { name: "Caddy",  lengthCm: 443 }, { name: "Transporter", lengthCm: 497 },
  ]},

  "Volvo": { models: [
    { name: "V40",  lengthCm: 437 }, { name: "V60",  lengthCm: 468 },
    { name: "V90",  lengthCm: 491 }, { name: "S60",  lengthCm: 462 },
    { name: "S90",  lengthCm: 503 }, { name: "XC40", lengthCm: 442 },
    { name: "XC60", lengthCm: 468 }, { name: "XC90", lengthCm: 495 },
    { name: "C40",  lengthCm: 443 }, { name: "EX30", lengthCm: 432 },
    { name: "EX90", lengthCm: 503 },
  ]},

  "Xpeng": { models: [
    { name: "P7",   lengthCm: 495 }, { name: "G9",   lengthCm: 498 },
    { name: "G6",   lengthCm: 473 }, { name: "X9",   lengthCm: 527 },
    { name: "P5",   lengthCm: 474 },
  ]},
};

/** Toutes les marques triées alphabétiquement */
export const ALL_BRANDS = Object.keys(VEHICLE_DATA).sort((a, b) =>
  a.localeCompare(b, "fr", { sensitivity: "base" })
);
