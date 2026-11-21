import type { Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    sku: "PN-NB-G15",
    name: "GameBook 15 (RTX 4050)",
    subtitle: "Precision engineering with obsidian anodized aluminum finish",
    slug: "patronet-gamebook-15",
    brand: "PATRONET",
    categoryId: "c8e2b8f0-1099-4c6e-8263-d343c4ef036b",
    description: "Designed for high-intensity computing, creative rendering, and competitive gaming with calibrated display and vapor chamber cooling.",
    shortDescription: "Core i7, RTX 4050 6GB GDDR6, 16GB DDR5, 1TB NVMe SSD.",
    price: 94990,
    compareAtPrice: 104990,
    isActive: true,
    badge: "Bestseller",
    specifications: {
      "Category": "Laptops",
      "Processor": "Intel Core i7-13700H",
      "Graphics": "NVIDIA GeForce RTX 4050 6GB GDDR6",
      "Memory": "16GB DDR5 5200MHz",
      "Storage": "1TB NVMe PCIe 4.0 SSD",
      "Display": "15.6-inch FHD (1920 x 1080) 165Hz IPS",
      "Weight": "1.98 kg"
    },
    images: [
      {
        id: "img-001",
        productId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        url: "/images/products/gamebook-15.svg",
        altText: "PATRONET GameBook 15 Gaming Laptop",
        isPrimary: true,
        sortOrder: 1
      },
      {
        id: "img-001-side",
        productId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        url: "/images/products/gamebook-side.svg",
        altText: "PATRONET GameBook 15 Side Profile",
        isPrimary: false,
        sortOrder: 2
      },
      {
        id: "img-001-kb",
        productId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        url: "/images/products/gamebook-keyboard.svg",
        altText: "PATRONET GameBook 15 Keyboard Deck",
        isPrimary: false,
        sortOrder: 3
      },
      {
        id: "img-001-vents",
        productId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        url: "/images/products/gamebook-vents.svg",
        altText: "PATRONET GameBook 15 Thermal Vents",
        isPrimary: false,
        sortOrder: 4
      }
    ],
    inventory: [
      {
        storeId: "blr-central-01",
        storeName: "Bangalore Logistics Hub",
        quantityOnHand: 42,
        quantityReserved: 4,
        isAvailable: true,
        leadTimeDays: 2
      }
    ],
    primaryImage: "/images/products/gamebook-15.svg",
    createdAt: "2026-02-18T09:00:00Z",
    updatedAt: "2026-02-18T14:30:00Z"
  },
  {
    id: "e56bc78a-90ab-1234-cdef-123456789abc",
    sku: "PN-NB-AIR14",
    name: "AirBook Pro 14 (Ultra 7)",
    subtitle: "Aerospace magnesium-alloy chassis with all-day battery endurance",
    slug: "patronet-airbook-pro-14",
    brand: "PATRONET",
    categoryId: "c8e2b8f0-1099-4c6e-8263-d343c4ef036b",
    description: "Ultra-thin executive workstation engineered with Intel Core Ultra 7 and integrated Intel Arc graphics.",
    shortDescription: "Core Ultra 7, 32GB LPDDR5X, 1TB PCIe 4.0, 2.8K 120Hz OLED.",
    price: 78990,
    compareAtPrice: 84990,
    isActive: true,
    badge: "Ultralight",
    specifications: {
      "Category": "Laptops",
      "Processor": "Intel Core Ultra 7 155H",
      "Memory": "32GB LPDDR5X 7467MHz",
      "Storage": "1TB NVMe PCIe 4.0 SSD",
      "Display": "14-inch 2.8K 120Hz OLED 400 nits",
      "Weight": "1.28 kg"
    },
    images: [
      {
        id: "img-002",
        productId: "e56bc78a-90ab-1234-cdef-123456789abc",
        url: "/images/products/airbook-14.svg",
        altText: "PATRONET AirBook Pro 14 Business Laptop",
        isPrimary: true,
        sortOrder: 1
      }
    ],
    inventory: [
      {
        storeId: "blr-central-01",
        storeName: "Bangalore Logistics Hub",
        quantityOnHand: 28,
        quantityReserved: 3,
        isAvailable: true,
        leadTimeDays: 2
      }
    ],
    primaryImage: "/images/products/airbook-14.svg",
    createdAt: "2026-02-15T10:00:00Z",
    updatedAt: "2026-02-15T10:00:00Z"
  },
  {
    id: "a12bc34d-56ef-7890-abcd-ef1234567890",
    sku: "PN-AUD-ST-ANC",
    name: "Studio ANC Headphones",
    subtitle: "Custom 40mm bio-cellulose drivers with hybrid noise cancellation",
    slug: "patronet-studio-anc-headphones",
    brand: "PATRONET Audio",
    categoryId: "d9f3c9a1-2100-5d7f-9374-e454d5fa147c",
    description: "Tuned for reference acoustics and neutral audio mastering with memory foam ear cushions and 45-hour playback.",
    shortDescription: "Hybrid ANC, 40mm Bio-Cellulose, 45h Battery, LDAC Hi-Res.",
    price: 13999,
    compareAtPrice: 16999,
    isActive: true,
    badge: "Top Rated",
    specifications: {
      "Category": "Audio",
      "Driver": "40mm Bio-Cellulose Dynamic Drivers",
      "Noise Cancellation": "Hybrid Active Noise Cancellation (-42dB)",
      "Battery Life": "45 Hours (ANC On) / 60 Hours (ANC Off)",
      "Codecs": "LDAC, AAC, SBC",
      "Weight": "250g"
    },
    images: [
      {
        id: "img-003",
        productId: "a12bc34d-56ef-7890-abcd-ef1234567890",
        url: "/images/products/studio-anc.svg",
        altText: "PATRONET Studio ANC Wireless Headphones",
        isPrimary: true,
        sortOrder: 1
      }
    ],
    inventory: [
      {
        storeId: "del-central-01",
        storeName: "Delhi Distribution Center",
        quantityOnHand: 65,
        quantityReserved: 8,
        isAvailable: true,
        leadTimeDays: 3
      }
    ],
    primaryImage: "/images/products/studio-anc.svg",
    createdAt: "2026-02-10T11:00:00Z",
    updatedAt: "2026-02-17T16:00:00Z"
  },
  {
    id: "f78ab90c-12de-3456-bcde-23456789012a",
    sku: "PN-DIS-CV27",
    name: "CreatorView 27 QHD Monitor",
    subtitle: "Factory calibrated Delta E < 1 with 99% DCI-P3 wide color gamut",
    slug: "patronet-creatorview-27-monitor",
    brand: "PATRONET",
    categoryId: "ea04da12-3211-6e80-0485-f565e6ab258d",
    description: "Designed for color-critical photo editing and video production with 90W USB-C Power Delivery and daisy-chaining.",
    shortDescription: "27-inch IPS, 2560x1440, 99% DCI-P3, 90W USB-C, HDR400.",
    price: 24990,
    compareAtPrice: 28990,
    isActive: true,
    badge: "Color Accurate",
    specifications: {
      "Category": "Monitors",
      "Panel": "27-inch IPS Anti-Glare",
      "Resolution": "QHD (2560 x 1440) 100Hz",
      "Color Accuracy": "Delta E < 1, 99% DCI-P3, 100% sRGB",
      "Ports": "USB-C (90W PD), DisplayPort 1.4, HDMI 2.0, USB Hub",
      "Stand": "Height, Pivot, Tilt, Swivel Adjustability"
    },
    images: [
      {
        id: "img-004",
        productId: "f78ab90c-12de-3456-bcde-23456789012a",
        url: "/images/products/creatorview-27.svg",
        altText: "PATRONET CreatorView 27 QHD Monitor",
        isPrimary: true,
        sortOrder: 1
      }
    ],
    inventory: [
      {
        storeId: "mum-central-01",
        storeName: "Mumbai Distribution Center",
        quantityOnHand: 18,
        quantityReserved: 2,
        isAvailable: true,
        leadTimeDays: 4
      }
    ],
    primaryImage: "/images/products/creatorview-27.svg",
    createdAt: "2026-02-01T08:00:00Z",
    updatedAt: "2026-02-12T09:00:00Z"
  },
  {
    id: "c23de45f-67ab-8901-cdef-34567890123b",
    sku: "PN-ACC-KC-T75",
    name: "Tactile 75 Keyboard",
    subtitle: "Gasket-mounted hot-swappable mechanical keyboard with rotary encoder",
    slug: "patronet-tactile-75-keyboard",
    brand: "Keychron",
    categoryId: "fb15eb23-4322-7f91-1596-a676f7bc369e",
    description: "CNC machined aluminum body with sound dampening acoustic foam, pre-lubed tactile switches, and South-facing RGB.",
    shortDescription: "75% layout, Gasket Mount, Hot-swap, QMK/VIA programmable.",
    price: 8499,
    compareAtPrice: 9999,
    isActive: true,
    badge: "Custom Mechanical",
    specifications: {
      "Category": "Accessories",
      "Layout": "75% Compact (81 Keys + CNC Knob)",
      "Switches": "Pre-lubed Gateron Jupiter Brown Tactile",
      "Keycaps": "Double-shot PBT Cherry Profile",
      "Connectivity": "Type-C Wired / 2.4GHz / Bluetooth 5.1",
      "Compatibility": "macOS / Windows / Linux"
    },
    images: [
      {
        id: "img-005",
        productId: "c23de45f-67ab-8901-cdef-34567890123b",
        url: "/images/products/keychron-75.svg",
        altText: "Keychron Tactile 75 Mechanical Keyboard",
        isPrimary: true,
        sortOrder: 1
      }
    ],
    inventory: [
      {
        storeId: "blr-central-01",
        storeName: "Bangalore Logistics Hub",
        quantityOnHand: 52,
        quantityReserved: 6,
        isAvailable: true,
        leadTimeDays: 2
      }
    ],
    primaryImage: "/images/products/keychron-75.svg",
    createdAt: "2026-02-14T14:00:00Z",
    updatedAt: "2026-02-14T14:00:00Z"
  },
  {
    id: "d34ef56a-78bc-9012-defa-45678901234c",
    sku: "PN-ACC-FIT-PRO",
    name: "Fit Pro Watch",
    subtitle: "Titanium casing with dual-frequency GPS and advanced biometric telemetry",
    slug: "patronet-fit-pro-watch",
    brand: "PATRONET",
    categoryId: "a3b4c5d6-7890-1234-ef90-23456789abcd",
    description: "Rugged sapphire crystal display with ECG sensing, blood oxygen tracking, 100m water resistance, and 14-day battery life.",
    shortDescription: "1.43-inch AMOLED, Titanium, Dual GPS, 10ATM, 14-day Battery.",
    price: 18990,
    compareAtPrice: 21990,
    isActive: true,
    badge: "Rugged Outdoor",
    specifications: {
      "Category": "Wearables",
      "Display": "1.43-inch Sapphire AMOLED (466 x 466, 1000 nits)",
      "Sensors": "BioActive Sensor (Optical Heart Rate, Electrical Heart Sensor, Bioelectrical Impedance)",
      "Battery": "Up to 14 Days (Typical Usage) / 36 Hours (Continuous GPS)",
      "Water Resistance": "10 ATM + IP68 Rating",
      "Strap": "Fluoroelastomer Quick-Release 22mm"
    },
    images: [
      {
        id: "img-006",
        productId: "d34ef56a-78bc-9012-defa-45678901234c",
        url: "/images/products/fit-pro.svg",
        altText: "PATRONET Fit Pro Smartwatch",
        isPrimary: true,
        sortOrder: 1
      }
    ],
    inventory: [
      {
        storeId: "del-central-01",
        storeName: "Delhi Distribution Center",
        quantityOnHand: 34,
        quantityReserved: 5,
        isAvailable: true,
        leadTimeDays: 3
      }
    ],
    primaryImage: "/images/products/fit-pro.svg",
    createdAt: "2026-02-11T12:00:00Z",
    updatedAt: "2026-02-16T15:00:00Z"
  },
  {
    id: "e45fa67b-89cd-0123-efab-56789012345d",
    sku: "PN-ACC-MX-M3",
    name: "Precision Wireless Mouse",
    subtitle: "MagSpeed electromagnetic scroll wheel with 8K DPI Darkfield sensor",
    slug: "patronet-precision-wireless-mouse",
    brand: "Logitech",
    categoryId: "fb15eb23-4322-7f91-1596-a676f7bc369e",
    description: "Ergonomic silhouette crafted for palm comfort, gesture buttons, multi-computer flow control, and quiet clicks.",
    shortDescription: "8000 DPI sensor, MagSpeed Wheel, USB-C Quick Charge, Quiet Clicks.",
    price: 7995,
    compareAtPrice: 9495,
    isActive: true,
    badge: "Ergonomic",
    specifications: {
      "Category": "Accessories",
      "Sensor": "Darkfield High Precision (200 - 8000 DPI)",
      "Buttons": "7 Programmable Buttons + Gesture Button",
      "Scroll Wheel": "MagSpeed SmartShift Auto-Switching Wheel",
      "Battery": "Rechargeable Li-Po (500 mAh) up to 70 days",
      "Weight": "141g"
    },
    images: [
      {
        id: "img-007",
        productId: "e45fa67b-89cd-0123-efab-56789012345d",
        url: "/images/products/precision-mouse.svg",
        altText: "Logitech Precision Wireless Mouse",
        isPrimary: true,
        sortOrder: 1
      }
    ],
    inventory: [
      {
        storeId: "blr-central-01",
        storeName: "Bangalore Logistics Hub",
        quantityOnHand: 85,
        quantityReserved: 12,
        isAvailable: true,
        leadTimeDays: 2
      }
    ],
    primaryImage: "/images/products/precision-mouse.svg",
    createdAt: "2026-02-08T09:00:00Z",
    updatedAt: "2026-02-08T09:00:00Z"
  },
  {
    id: "a01bc234-5678-9012-cdef-23456789012a",
    sku: "PN-ACC-LED-LMP",
    name: "Smart LED Desk Lamp",
    subtitle: "CRI 98 full-spectrum illumination with smart ambient brightness sensor",
    slug: "patronet-smart-led-desk-lamp",
    brand: "PATRONET",
    categoryId: "fb15eb23-4322-7f91-1596-a676f7bc369e",
    description: "Anti-glare asymmetric optical design preventing screen reflections with stepless color temperature adjustment (2700K - 6500K).",
    shortDescription: "CRI 98, Auto-dimming, Dual Axis Rotation, Touch / App control.",
    price: 3990,
    compareAtPrice: 4990,
    isActive: true,
    badge: "Eye Comfort",
    specifications: {
      "Category": "Accessories",
      "Color Rendering Index": "Ra > 98 Ultra-Natural Spectrum",
      "Color Temperature": "2700K - 6500K Stepless Control",
      "Max Brightness": "1200 Lux @ 45cm",
      "Input": "USB-C 18W Fast Power Delivery",
      "Mounting": "Weighted Aluminum Desk Base"
    },
    images: [
      {
        id: "img-008",
        productId: "a01bc234-5678-9012-cdef-23456789012a",
        url: "/images/products/desk-lamp.svg",
        altText: "PATRONET Smart LED Desk Lamp",
        isPrimary: true,
        sortOrder: 1
      }
    ],
    inventory: [
      {
        storeId: "hyd-central-01",
        storeName: "Hyderabad Distribution Center",
        quantityOnHand: 110,
        quantityReserved: 15,
        isAvailable: true,
        leadTimeDays: 2
      }
    ],
    primaryImage: "/images/products/desk-lamp.svg",
    createdAt: "2026-02-05T12:00:00Z",
    updatedAt: "2026-02-15T09:00:00Z"
  },
  {
    id: "b12cd345-6789-0123-defa-34567890123b",
    sku: "PN-GAM-CTRL-APX",
    name: "Apex Wireless Controller",
    subtitle: "Hall-effect analog joysticks with sub-millisecond polling latency",
    slug: "patronet-apex-wireless-controller",
    brand: "PATRONET",
    categoryId: "b4c5d6e7-8901-2345-fa01-3456789abcde",
    description: "Equipped with drift-free electromagnetic Hall Effect sensors, mechanical microswitch tactile buttons, and multi-platform 2.4GHz wireless.",
    shortDescription: "Hall-effect sticks, 1000Hz polling rate, PC / Mobile / Console.",
    price: 4499,
    compareAtPrice: 5499,
    isActive: true,
    badge: "Low Latency",
    specifications: {
      "Category": "Gaming",
      "Sticks": "Hall-Effect Electromagnetic Sensors",
      "Polling Rate": "1000Hz Ultra-Low Latency",
      "Connectivity": "2.4GHz Wireless Dongle / Bluetooth / USB-C",
      "Battery Life": "Up to 30 hours"
    },
    images: [
      {
        id: "img-009",
        productId: "b12cd345-6789-0123-defa-34567890123b",
        url: "/images/products/apex-controller.svg",
        altText: "PATRONET Apex Wireless Gaming Controller",
        isPrimary: true,
        sortOrder: 1
      }
    ],
    inventory: [
      {
        storeId: "mum-central-01",
        storeName: "Mumbai Distribution Center",
        quantityOnHand: 0,
        quantityReserved: 0,
        isAvailable: false,
        leadTimeDays: 7
      }
    ],
    primaryImage: "/images/products/apex-controller.svg",
    createdAt: "2026-02-12T16:00:00Z",
    updatedAt: "2026-02-12T16:00:00Z"
  }
];
