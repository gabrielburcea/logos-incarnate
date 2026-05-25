export type BibleTranslation = {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  year: number;
  isPublicDomain: boolean;
  copyright: string;
};

export const availableTranslations: BibleTranslation[] = [
  {
    id: "kjv",
    name: "King James Version",
    abbreviation: "KJV",
    language: "English",
    year: 1611,
    isPublicDomain: true,
    copyright: "Public Domain",
  },
  {
    id: "esv",
    name: "English Standard Version",
    abbreviation: "ESV",
    language: "English",
    year: 2001,
    isPublicDomain: false,
    copyright: "© 2001 Crossway Bibles",
  },
  {
    id: "niv",
    name: "New International Version",
    abbreviation: "NIV",
    language: "English",
    year: 1978,
    isPublicDomain: false,
    copyright: "© 1978 Biblica",
  },
];

export const getTranslationById = (id: string): BibleTranslation | undefined => {
  return availableTranslations.find((t) => t.id === id);
};

export const getTranslationName = (id: string): string => {
  const translation = getTranslationById(id);
  return translation ? translation.abbreviation : id.toUpperCase();
};
