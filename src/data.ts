/* ------------------------------------------------------------------ */
/* WEDDING CONTENT — edit names, dates, venues and messages here.      */
/* ------------------------------------------------------------------ */

/* Local images from public/images */


const coupleHero ="https://res.cloudinary.com/kpkj3xqw/image/upload/v1791714285/couple-hero.jpg";

/* Cloudinary images */
const brideImg =
  "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791713661/bride.jpg";

const groomImg =
  "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791713670/groom.png";

const galleryCeremony = "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791714287/gallery-ceremony.jpg";
const galleryTemple ="https://res.cloudinary.com/kpkj3xqw/image/upload/v1791714288/gallery-temple.jpg";
const galleryDecor = "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791714286/gallery-decor.jpg";
const galleryRings = "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791714289/gallery-rings.jpg";
const galleryHands = "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791714289/gallery-hands.jpg";
const galleryCouple = "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791714287/gallery-couple2.jpg";
const templePillars ="https://res.cloudinary.com/kpkj3xqw/image/upload/v1791714289/temple-pillars.jpg";

/* Exported images */
export const images = {
  coupleHero,
  brideImg,
  groomImg,
  templePillars,
};

/* Wedding details */
export const wedding = {
  monogramLeft: "K",
  monogramRight: "M",

  groom: {
    name: "Karthik",
    fullName: "Karthik Srinivasan",
    parents: "Son of Sri S. Srinivasan & Smt. Lakshmi Srinivasan",
    blurb:
      "An architect by profession and a classical guitarist by heart, Karthik carries a quiet warmth and old-fashioned grace — a keeper of family stories and Sunday-morning filter coffee rituals.",
  },

  bride: {
    name: "Meenakshi",
    fullName: "Meenakshi Raman",
    parents: "Daughter of Sri R. Raman & Smt. Vijayalakshmi Raman",
    blurb:
      "A physician who paints in her quieter hours, Meenakshi keeps jasmine-scented memories and generous laughter — the kind of presence that turns a house into a home.",
  },

  /* Wedding countdown */
  dateISO: "2026-11-22T09:15:00+05:30",
  dateShort: "22 · 11 · 2026",
  dateDisplay: "Sunday, 22 November 2026",
  dateLong:
    "Sunday, the Twenty-Second of November, Two Thousand Twenty-Six",
  muhurtham: "9:15 AM — 10:45 AM IST",

  /* Wedding venue */
  venue: {
    name: "Sri Kapaleeswarar Kalyana Mandapam",
    line1: "No. 12, North Mada Street, Mylapore",
    line2: "Chennai, Tamil Nadu — 600004",

    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Kapaleeswarar+Temple+Mylapore+Chennai",

    mapsEmbed:
      "https://www.google.com/maps?q=Kapaleeswarar%20Temple%2C%20Mylapore%2C%20Chennai&output=embed",
  },

  /* Invitation message */
  message:
    "With hearts full of joy and gratitude, we invite you and your family to join us as we begin our journey together. Your presence and blessings will make our celebration truly special.",

  blessing:
    "May our union be blessed by the divine grace of the Almighty, and may your love and good wishes light our path always.",

  /* Developer details */
  developer: {
    name: "Hariharasudhan",
    portfolio:
      "https://hariharasudhan-portfolio-iota.vercel.app",
  },
};

/* Wedding event type */
export type WeddingEvent = {
  icon: "rings" | "music" | "flame" | "feast" | "sparkles";
  title: string;
  subtitle: string;
  date: string;
  time: string;
  venue: string;
  description: string;
};

/* Wedding events */
export const events: WeddingEvent[] = [
  {
    icon: "rings",
    title: "Nichayathartham",
    subtitle: "The Engagement",
    date: "Friday, 20 November 2026",
    time: "6:00 PM",
    venue: "The Family Residence, Mylapore",
    description:
      "The elders of both families exchange horoscopes and blessings, rings are slipped onto waiting fingers, and the wedding is joyously announced to the world.",
  },
  {
    icon: "music",
    title: "Mehndi & Sangeetham",
    subtitle: "An Evening of Music",
    date: "Saturday, 21 November 2026",
    time: "5:30 PM",
    venue: "Mandapam Courtyard",
    description:
      "Henna blooms across the bride's hands while veena and voice fill the courtyard — an evening of music, dance and unhurried laughter for both families.",
  },
  {
    icon: "flame",
    title: "Kalyana Muhurtham",
    subtitle: "The Sacred Ceremony",
    date: "Sunday, 22 November 2026",
    time: "9:15 AM — 10:45 AM",
    venue: "The Main Mantapam",
    description:
      "Beneath sanctified lamps, the thaali is tied, the homam is witnessed and the saptapadi is taken — two souls bound as one before the sacred fire.",
  },
  {
    icon: "feast",
    title: "Kalyana Virundhu",
    subtitle: "The Wedding Feast",
    date: "Sunday, 22 November 2026",
    time: "12:30 PM",
    venue: "The Dining Hall",
    description:
      "A grand traditional feast served on banana leaves in honour of the newly-wed couple — payasam first, always, and second helpings heartily encouraged.",
  },
  {
    icon: "sparkles",
    title: "The Grand Reception",
    subtitle: "An Evening of Blessings",
    date: "Sunday, 22 November 2026",
    time: "6:30 PM",
    venue: "The Grand Hall",
    description:
      "The couple receives friends and family beneath cascades of jasmine and gold — dinner, photographs and blessings long into the evening.",
  },
];

/* Gallery item type */
export type GalleryItem = {
  src: string;
  caption: string;
  alt: string;
  span: string;
};

/* Wedding gallery */
export const gallery: GalleryItem[] = [
  {
    src: galleryCouple,
    caption: "Before the Sacred Agni",
    alt: "The couple seated at the mandapam before the sacred fire",
    span: "col-span-2 row-span-2",
  },
  {
    src: galleryCeremony,
    caption: "The Tying of the Thaali",
    alt: "The thaali being tied during the wedding ceremony",
    span: "col-span-1 row-span-1",
  },
  {
    src: galleryHands,
    caption: "Her Adorned Hands",
    alt: "The bride's henna-adorned hands holding jasmine flowers",
    span: "col-span-1 row-span-1",
  },
  {
    src: galleryDecor,
    caption: "Jasmine & Brass",
    alt: "Jasmine garlands and brass lamps decorating the hall",
    span: "col-span-1 row-span-1",
  },
  {
    src: galleryRings,
    caption: "Tokens of Union",
    alt: "Gold thaali necklace and rings resting on maroon silk",
    span: "col-span-1 row-span-1",
  },
  {
    src: galleryTemple,
    caption: "Blessings of the Temple",
    alt: "The temple gopuram glowing at golden hour",
    span: "col-span-2 row-span-1",
  },
];