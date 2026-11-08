export interface StockPhoto {
  src: string;
  alt: string;
  artist: string;
  license: string;
  licenseUrl: string;
  sourcePage: string;
  note: string;
}

/** Files saved under public/. They are not hotlinked. None of these photographs show Miami Dade College people or campuses. */
export const stockPhotos = {
  classroom: {
    src: "/images/stock/polytechnique-class.jpg",
    alt: "A student in a library at École polytechnique in Paris. This person and this room are not Miami Dade College.",
    artist: "École polytechnique, Paris",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Enseignement_%C3%A0_l%27Ecole_polytechnique_(38423250634).jpg",
    note: "Wikimedia Commons file downloaded for this prototype. The picture is a French engineering school, not an MDC campus.",
  },
  study: {
    src: "/images/stock/hcc-study-area.jpg",
    alt: "Study tables in a building the photographer identified as HCC. This is not a Miami Dade College facility.",
    artist: "D00264450",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Study_Areas_on_3rd_Floor_at_the_HCC.jpg",
    note: "Wikimedia Commons. The filename refers to HCC, which this app does not treat as Miami Dade College.",
  },
  conversation: {
    src: "/images/stock/library-discussion.jpg",
    alt: "A librarian and a student talking beside a laptop in a library. They are not identified as Miami Dade College students or staff.",
    artist: "Kallie Hagel",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Discussing_Wikipedia_in_a_Library.jpg",
    note: "Wikimedia Commons, own work of Kallie Hagel.",
  },
  shelves: {
    src: "/images/stock/hove-library.jpg",
    alt: "Bookshelves in Hove Library, England, photographed in 2025. This is not a Miami Dade College library.",
    artist: "Andy Li",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Bookshelves_in_Hove_Library_2025-08-20.jpg",
    note: "Wikimedia Commons. Public domain dedication by Andy Li.",
  },
} as const satisfies Record<string, StockPhoto>;

/** Landing-page background supplied by the user. Permission and source were not independently verified. */
export const landingBackground = {
  src: "/images/lake-background.png",
  width: 2500,
  height: 1667,
  note: "Supplied by the user for the landing page only. The file is 2500 by 1667 pixels and is shown without a blur filter or extra magnification. Permission and source were not independently verified. No creator, license, or public-domain status is assigned.",
} as const;

/** Displayed seal. Outer white field removed from the supplied file; interior artwork kept. */
export const mdcLogo = {
  src: "/brand/mdc-seal-transparent.png",
  alt: "Miami Dade College seal",
  width: 372,
  height: 300,
  note: "The header uses public/brand/mdc-seal-transparent.png. That file is the supplied public/brand/mdc-seal.png after the outer white field was made transparent. Interior white in the artwork was kept. Permission and source were not independently verified. No creator, license, or public-domain status is assigned.",
} as const;
