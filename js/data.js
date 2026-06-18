/* ================================================================
   DrivePinas — Car Inventory Data
   ================================================================
   HOW TO ADD A NEW CAR:
   1. Find the brand you want (e.g. Toyota, Honda, etc.)
   2. Copy any existing unit block { ... }
   3. Paste it at the end of that brand's "units" array
   4. Change the values to match your new car
   5. Save this file → refresh browser → done!

   HOW TO MARK AS SOLD:     Change  sold: false  →  sold: true
   HOW TO FEATURE ON HOME:  Change  featured: false  →  featured: true
   HOW TO HIDE PRICE:       Change  price: 858000  →  price: null
   ================================================================ */

"use strict";

/* ----------------------------------------------------------------
   SITE CONFIGURATION
   ---------------------------------------------------------------- */
const SITE_CONFIG = {
  name: "DrivePinas",
  tagline: "Drive Your Journey",
  email: "info@drivepinas.com",
  phone: "+63 9XX XXX XXXX",
  phoneTel: "+639XXXXXXXXX",
  facebook: "https://facebook.com/drivepinas",
  facebookDisplay: "facebook.com/drivepinas",
  location: "Metro Manila, Philippines",
  year: new Date().getFullYear(),
};

/* ----------------------------------------------------------------
   IMAGE CONFIGURATION
   ---------------------------------------------------------------- */
const IMAGE_CONFIG = {
  baseUrl: "https://picsum.photos/seed",
  cardWidth: 600,
  cardHeight: 400,
  galleryWidth: 800,
  galleryHeight: 500,
  thumbWidth: 200,
  thumbHeight: 140,
};

/* ----------------------------------------------------------------
   ANIMATION CONFIGURATION
   ---------------------------------------------------------------- */
const ANIMATION_CONFIG = {
  staggerDelayMs: 70,
  scrollThreshold: 300,
  navScrollThreshold: 50,
  debounceMs: 10,
  brandsScrollDelayMs: 400,
  routeScrollDelayMs: 150,
  toastDurationMs: 4000,
  toastRemoveDelayMs: 300,
};

/* ----------------------------------------------------------------
   BRAND & CAR DATA
   ---------------------------------------------------------------- */
const BRANDS = [
  {
    name: "Toyota",
    slug: "toyota",
    logo: "images/brands/Toyota.png",
    units: [
      {
        name: "Vios 1.3 XLE CVT",
        year: 2023,
        price: 858000,
        odometer: "18,500 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "Sedan",
        condition:
          "Excellent condition. Casa-maintained with complete service records. No flood, no accident.",
        sold: false,
        featured: true,
        images: [100, 101, 102, 103],
      },
      {
        name: "Fortuner 2.4 G DSL AT",
        year: 2022,
        price: 1650000,
        odometer: "42,000 km",
        transmission: "Automatic",
        fuel: "Diesel",
        body: "SUV",
        condition:
          "Very good condition. Minor scratches on rear bumper. All electronics working perfectly.",
        sold: false,
        featured: true,
        images: [110, 111, 112, 113],
      },
      {
        name: "Hilux 2.4 G 4x2 MT",
        year: 2021,
        price: 1180000,
        odometer: "55,000 km",
        transmission: "Manual",
        fuel: "Diesel",
        body: "Pickup",
        condition:
          "Good condition. Bed liner installed. New tires. Ready for work or adventure.",
        sold: false,
        featured: false,
        images: [120, 121, 122, 123],
      },
      {
        name: "Innova 2.8 V DSL AT",
        year: 2020,
        price: null,
        odometer: "68,000 km",
        transmission: "Automatic",
        fuel: "Diesel",
        body: "MPV",
        condition:
          "Well-maintained family vehicle. Leather seats in great shape. Cold AC.",
        sold: true,
        featured: false,
        images: [130, 131, 132, 133],
      },
    ],
  },
  {
    name: "Honda",
    slug: "honda",
    logo: "images/brands/Honda.png",
    units: [
      {
        name: "Civic 1.5 RS Turbo CVT",
        year: 2023,
        price: 1380000,
        odometer: "12,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "Sedan",
        condition:
          "Like new. Full Honda Sensing suite. Premium audio. No modifications.",
        sold: false,
        featured: true,
        images: [200, 201, 202, 203],
      },
      {
        name: "City 1.5 V CVT",
        year: 2022,
        price: 798000,
        odometer: "30,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "Sedan",
        condition:
          "Excellent fuel economy. Clean interior. All maintenance up to date.",
        sold: false,
        featured: false,
        images: [210, 211, 212, 213],
      },
      {
        name: "CR-V 2.0 S CVT",
        year: 2021,
        price: 1450000,
        odometer: "38,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "SUV",
        condition:
          "Spacious and reliable. Panoramic sunroof. No flood or accident history.",
        sold: false,
        featured: false,
        images: [220, 221, 222, 223],
      },
    ],
  },
  {
    name: "Mitsubishi",
    slug: "mitsubishi",
    logo: "images/brands/Mitsubishi.png",
    units: [
      {
        name: "Montero Sport 2.4 GT 4x2 AT",
        year: 2023,
        price: 1890000,
        odometer: "15,000 km",
        transmission: "Automatic",
        fuel: "Diesel",
        body: "SUV",
        condition:
          "Top of the line variant. Paddle shifters. 360 camera. Pristine condition.",
        sold: false,
        featured: true,
        images: [300, 301, 302, 303],
      },
      {
        name: "Xpander 1.5 GLS AT",
        year: 2022,
        price: 968000,
        odometer: "28,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "MPV",
        condition:
          "Perfect family car. 7-seater. Very fuel efficient. Minor cosmetic wear.",
        sold: false,
        featured: false,
        images: [310, 311, 312, 313],
      },
      {
        name: "Mirage G4 1.2 GLX CVT",
        year: 2021,
        price: 528000,
        odometer: "45,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "Sedan",
        condition:
          "Budget-friendly daily driver. Great on gas. Minor paint chips on hood.",
        sold: false,
        featured: false,
        images: [320, 321, 322, 323],
      },
    ],
  },
  {
    name: "Suzuki",
    slug: "suzuki",
    logo: "images/brands/Suzuki.png",
    units: [
      {
        name: "Ertiga 1.5 GL AT",
        year: 2023,
        price: 868000,
        odometer: "10,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "MPV",
        condition:
          "Almost brand new. Break-in period done. Full warranty remaining.",
        sold: false,
        featured: false,
        images: [400, 401, 402, 403],
      },
      {
        name: "Swift 1.2 GL CVT",
        year: 2022,
        price: 698000,
        odometer: "22,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "Hatchback",
        condition:
          "Fun to drive hatchback. Sporty handling. Clean inside and out.",
        sold: false,
        featured: false,
        images: [410, 411, 412, 413],
      },
      {
        name: "Celerio 1.0 GL AGS",
        year: 2022,
        price: 498000,
        odometer: "35,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "Hatchback",
        condition:
          "Most fuel-efficient in its class. Perfect city car. Well maintained.",
        sold: true,
        featured: false,
        images: [420, 421, 422, 423],
      },
    ],
  },
  {
    name: "Ford",
    slug: "ford",
    logo: "images/brands/Ford.png",
    units: [
      {
        name: "Ranger 2.0 Wildtrak 4x2 AT",
        year: 2023,
        price: 1780000,
        odometer: "20,000 km",
        transmission: "Automatic",
        fuel: "Diesel",
        body: "Pickup",
        condition:
          "Loaded with features. Bi-turbo engine. Sport bar and roller shutter included.",
        sold: false,
        featured: true,
        images: [500, 501, 502, 503],
      },
      {
        name: "Everest 2.0 Titanium+ 4x2 AT",
        year: 2022,
        price: 2150000,
        odometer: "25,000 km",
        transmission: "Automatic",
        fuel: "Diesel",
        body: "SUV",
        condition:
          "Premium SUV. Full leather. Panoramic sunroof. SYNC 4A infotainment.",
        sold: false,
        featured: false,
        images: [510, 511, 512, 513],
      },
      {
        name: "Territory 1.5 Titanium+ CVT",
        year: 2022,
        price: 1150000,
        odometer: "30,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "SUV",
        condition:
          "Stylish crossover. Wireless charging. 360 camera. Great value.",
        sold: false,
        featured: false,
        images: [520, 521, 522, 523],
      },
      {
        name: "Ranger Raptor 2.0 Bi-Turbo 4x4 AT",
        year: 2021,
        price: null,
        odometer: "48,000 km",
        transmission: "Automatic",
        fuel: "Diesel",
        body: "Pickup",
        condition:
          "The ultimate off-road pickup. Fox Racing shocks. BF Goodrich tires. Head-turning presence.",
        sold: false,
        featured: false,
        images: [530, 531, 532, 533],
      },
    ],
  },
  {
    name: "Nissan",
    slug: "nissan",
    logo: "images/brands/Nissan.png",
    units: [
      {
        name: "Navara 2.5 VL 4x2 AT",
        year: 2023,
        price: 1480000,
        odometer: "16,000 km",
        transmission: "Automatic",
        fuel: "Diesel",
        body: "Pickup",
        condition:
          "Top variant. Zero gravity seats. Around View Monitor. Casa maintained.",
        sold: false,
        featured: false,
        images: [600, 601, 602, 603],
      },
      {
        name: "Terra 2.5 VL 4x2 AT",
        year: 2022,
        price: 1680000,
        odometer: "32,000 km",
        transmission: "Automatic",
        fuel: "Diesel",
        body: "SUV",
        condition:
          "Comfortable 7-seater. Intelligent mobility features. Leather interior.",
        sold: false,
        featured: false,
        images: [610, 611, 612, 613],
      },
      {
        name: "Almera 1.0 VL Turbo CVT",
        year: 2022,
        price: 758000,
        odometer: "28,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "Sedan",
        condition:
          "Turbocharged efficiency. Spacious rear legroom. Apple CarPlay ready.",
        sold: false,
        featured: false,
        images: [620, 621, 622, 623],
      },
    ],
  },
  {
    name: "Hyundai",
    slug: "hyundai",
    logo: "images/brands/Hyundai.png",
    units: [
      {
        name: "Accent 1.4 GL AT",
        year: 2023,
        price: 828000,
        odometer: "14,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "Sedan",
        condition:
          "Reliable and affordable. Dual airbags. Stability control. Clean title.",
        sold: false,
        featured: false,
        images: [700, 701, 702, 703],
      },
      {
        name: "Tucson 2.0 GLS AT",
        year: 2022,
        price: 1350000,
        odometer: "26,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "SUV",
        condition:
          "Striking design. Digital instrument cluster. Bluelink connected car features.",
        sold: false,
        featured: true,
        images: [710, 711, 712, 713],
      },
      {
        name: "Stargazer 1.5 GLS CVT",
        year: 2023,
        price: 998000,
        odometer: "8,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "MPV",
        condition:
          "Almost brand new. Futuristic design. 7-seater with flat floor. Full warranty.",
        sold: false,
        featured: false,
        images: [720, 721, 722, 723],
      },
    ],
  },
  {
    name: "Kia",
    slug: "kia",
    logo: "images/brands/Kia.png",
    units: [
      {
        name: "Seltos 2.0 EX IVT",
        year: 2023,
        price: 1198000,
        odometer: "11,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "SUV",
        condition:
          "Feature-packed compact SUV. 8-inch display. Drive modes. Crisp handling.",
        sold: false,
        featured: false,
        images: [800, 801, 802, 803],
      },
      {
        name: "Stonic 1.4 EX AT",
        year: 2022,
        price: 898000,
        odometer: "20,000 km",
        transmission: "Automatic",
        fuel: "Gasoline",
        body: "SUV",
        condition:
          "Stylish urban crossover. Two-tone roof. Great city maneuverability.",
        sold: false,
        featured: false,
        images: [810, 811, 812, 813],
      },
      {
        name: "Carnival 2.2 EX DSL AT",
        year: 2022,
        price: 2480000,
        odometer: "35,000 km",
        transmission: "Automatic",
        fuel: "Diesel",
        body: "MPV",
        condition:
          "Ultimate family mover. VIP second row seats. Dual sunroofs. Premium Bose audio.",
        sold: false,
        featured: false,
        images: [820, 821, 822, 823],
      },
    ],
  },
];
