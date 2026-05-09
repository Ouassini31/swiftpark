// Liste curated de ~160 marques mondiales — pas de dépendance externe
// Triée alphabétiquement, inclut Europe, Amérique, Asie, Chine
export const VEHICLE_BRANDS: string[] = [
  // A
  "Acura", "Alfa Romeo", "Alpine", "Aston Martin", "Audi", "Avatr", "AITO",
  // B
  "BAIC", "Bentley", "BMW", "BYD", "Buick",
  // C
  "Cadillac", "Changan", "Chery", "Chevrolet", "Chrysler", "Citroën", "Cupra",
  // D
  "Dacia", "Deepal", "Denza", "Dodge", "DS",
  // F
  "Ferrari", "Fiat", "Ford",
  // G
  "GAC", "Genesis", "Geely", "GMC", "Great Wall",
  // H
  "Haval", "Honda", "Hongqi", "Hyundai",
  // I
  "Infiniti",
  // J
  "Jaguar", "Jeep",
  // K
  "Kia",
  // L
  "Lamborghini", "Lancia", "Land Rover", "Leapmotor", "Lexus", "Li Auto", "Lincoln", "Lucid", "Lynk & Co",
  // M
  "Mahindra", "Maserati", "Mazda", "McLaren", "Mercedes-Benz", "MG", "Mini", "Mitsubishi",
  // N
  "NETA", "NIO", "Nissan",
  // O
  "Opel", "Ora",
  // P
  "Peugeot", "Porsche",
  // R
  "RAM", "Renault", "Rivian", "Rolls-Royce",
  // S
  "Saab", "SEAT", "SAIC", "Skoda", "Ssangyong", "Subaru", "Suzuki",
  // T
  "Tata", "Tesla", "Toyota",
  // V
  "Volkswagen", "Volvo", "Voyah",
  // W
  "Wuling",
  // X
  "Xpeng",
  // Z
  "Zeekr",
].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
