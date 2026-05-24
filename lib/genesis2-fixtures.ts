export type Verse = {
  number: number;
  text: string;
  focusTargetIds?: MeaningTargetId[];
};

export type MeaningTargetId =
  | "helper"
  | "woman"
  | "man"
  | "one-flesh"
  | "side-rib"
  | "naked-not-ashamed";

export type MeaningTarget = {
  id: MeaningTargetId;
  label: string;
  originalWord: string;
  transliteration?: string;
  originalScript?: string;
  hebrewDefinition: string;
  literalSense?: string;
  verseRange: string;
  summary: string;
  whyItMatters: string;
  relatedOriginalWordPassages: Array<{
    reference: string;
    verseText: string;
  }>;
  relatedEnglishDifferentWordPassages: Array<{
    reference: string;
    originalWord: string;
    verseText: string;
    differenceNote: string;
  }>;
  graph: {
    nodes: Array<{ id: string; label: string; role: string }>;
    edges: Array<{ from: string; to: string; label: string }>;
  };
};

export const genesis2Chapter = {
  title: "Genesis 2",
  translation: "kjv",
  summary:
    "A calm first reading surface for creation, vocation, companionship, covenant, and unashamed intimacy.",
  verses: [
    { number: 1, text: "Thus the heavens and the earth were finished, and all the host of them." },
    { number: 2, text: "And on the seventh day God ended his work which he had made; and he rested on the seventh day from all his work which he had made." },
    { number: 3, text: "And God blessed the seventh day, and sanctified it: because that in it he had rested from all his work which God created and made." },
    { number: 4, text: "These are the generations of the heavens and of the earth when they were created, in the day that the LORD God made the earth and the heavens," },
    { number: 5, text: "And every plant of the field before it was in the earth, and every herb of the field before it grew: for the LORD God had not caused it to rain upon the earth, and there was not a man to till the ground.", focusTargetIds: ["man"] },
    { number: 6, text: "But there went up a mist from the earth, and watered the whole face of the ground." },
    { number: 7, text: "And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul.", focusTargetIds: ["man"] },
    { number: 8, text: "And the LORD God planted a garden eastward in Eden; and there he put the man whom he had formed.", focusTargetIds: ["man"] },
    { number: 9, text: "And out of the ground made the LORD God to grow every tree that is pleasant to the sight, and good for food; the tree of life also in the midst of the garden, and the tree of knowledge of good and evil." },
    { number: 10, text: "And a river went out of Eden to water the garden; and from thence it was parted, and became into four heads." },
    { number: 11, text: "The name of the first is Pison: that is it which compasseth the whole land of Havilah, where there is gold;" },
    { number: 12, text: "And the gold of that land is good: there is bdellium and the onyx stone." },
    { number: 13, text: "And the name of the second river is Gihon: the same is it that compasseth the whole land of Ethiopia." },
    { number: 14, text: "And the name of the third river is Hiddekel: that is it which goeth toward the east of Assyria. And the fourth river is Euphrates." },
    { number: 15, text: "And the LORD God took the man, and put him into the garden of Eden to dress it and to keep it.", focusTargetIds: ["man"] },
    { number: 16, text: "And the LORD God commanded the man, saying, Of every tree of the garden thou mayest freely eat:", focusTargetIds: ["man"] },
    { number: 17, text: "But of the tree of the knowledge of good and evil, thou shalt not eat of it: for in the day that thou eatest thereof thou shalt surely die." },
    { number: 18, text: "And the LORD God said, It is not good that the man should be alone; I will make him an help meet for him.", focusTargetIds: ["man", "helper"] },
    { number: 19, text: "And out of the ground the LORD God formed every beast of the field, and every fowl of the air; and brought them unto Adam to see what he would call them: and whatsoever Adam called every living creature, that was the name thereof.", focusTargetIds: ["man"] },
    { number: 20, text: "And Adam gave names to all cattle, and to the fowl of the air, and to every beast of the field; but for Adam there was not found an help meet for him.", focusTargetIds: ["man", "helper"] },
    { number: 21, text: "And the LORD God caused a deep sleep to fall upon Adam, and he slept: and he took one of his ribs, and closed up the flesh instead thereof;", focusTargetIds: ["side-rib", "man"] },
    { number: 22, text: "And the rib, which the LORD God had taken from man, made he a woman, and brought her unto the man.", focusTargetIds: ["side-rib", "woman", "man"] },
    { number: 23, text: "And Adam said, This is now bone of my bones, and flesh of my flesh: she shall be called Woman, because she was taken out of Man.", focusTargetIds: ["woman", "man"] },
    { number: 24, text: "Therefore shall a man leave his father and his mother, and shall cleave unto his wife: and they shall be one flesh.", focusTargetIds: ["man", "one-flesh", "woman"] },
    { number: 25, text: "And they were both naked, the man and his wife, and were not ashamed.", focusTargetIds: ["naked-not-ashamed", "man", "woman"] },
  ] as Verse[],
};

export const meaningTargets: MeaningTarget[] = [
  {
    id: "helper",
    label: "Helper",
    originalWord: "ezer",
    transliteration: "ʿēzer",
    originalScript: "עֵזֶר",
    hebrewDefinition:
      "A strong help or support, often used for rescuing aid rather than a subordinate assistant.",
    literalSense: "Strengthening help that corresponds to a real need.",
    verseRange: "Genesis 2:18, 20",
    summary: "Helper is introduced as a needed counterpart, not a lesser assistant. The passage frames companionship as a gift that answers human aloneness.",
    whyItMatters: "Meaning comes from fit, mutuality, and correspondence more than task delegation.",
    relatedOriginalWordPassages: [
      {
        reference: "Exodus 18:4",
        verseText:
          "And the name of the other was Eliezer: for the God of my father, said he, was mine help, and delivered me from the sword of Pharaoh:",
      },
      {
        reference: "Psalm 121:1-2",
        verseText:
          "I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the LORD, which made heaven and earth.",
      },
      {
        reference: "Hosea 13:9",
        verseText:
          "O Israel, thou hast destroyed thyself; but in me is thine help.",
      },
    ],
    relatedEnglishDifferentWordPassages: [
      {
        reference: "Acts 27:17",
        originalWord: "boētheia",
        verseText:
          "Which when they had taken up, they used helps, undergirding the ship; and, fearing lest they should fall into the quicksands, strake sail, and so were driven.",
        differenceNote:
          "This describes practical aid in a crisis, not covenant counterpart language.",
      },
      {
        reference: "Hebrews 4:16",
        originalWord: "boētheia",
        verseText:
          "Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.",
        differenceNote:
          "This is timely rescue language, distinct from Genesis 2 relational correspondence.",
      },
    ],
    graph: {
      nodes: [
        { id: "helper", label: "Helper", role: "Meaning focus" },
        { id: "man", label: "Man", role: "Needs counterpart" },
        { id: "companionship", label: "Companionship", role: "Theme" },
      ],
      edges: [
        { from: "helper", to: "man", label: "corresponds to" },
        { from: "helper", to: "companionship", label: "restores" },
      ],
    },
  },
  {
    id: "woman",
    label: "Woman",
    originalWord: "ishah",
    transliteration: "ʾiššâ",
    originalScript: "אִשָּׁה",
    hebrewDefinition:
      "Woman, wife, or female counterpart in covenant relationship language.",
    literalSense: "The feminine partner corresponding to man (ish).",
    verseRange: "Genesis 2:22-25",
    summary: "Woman arrives as a person received with recognition, delight, and covenant nearness. The text presents shared humanity before role discussion.",
    whyItMatters: "The first response is wonder and kinship, not analysis.",
    relatedOriginalWordPassages: [
      {
        reference: "Genesis 3:20",
        verseText: "And Adam called his wife's name Eve; because she was the mother of all living.",
      },
      {
        reference: "Genesis 24:67",
        verseText:
          "And Isaac brought her into his mother Sarah's tent, and took Rebekah, and she became his wife; and he loved her: and Isaac was comforted after his mother's death.",
      },
    ],
    relatedEnglishDifferentWordPassages: [
      {
        reference: "Revelation 12:1",
        originalWord: "gynē",
        verseText:
          "And there appeared a great wonder in heaven; a woman clothed with the sun, and the moon under her feet, and upon her head a crown of twelve stars:",
        differenceNote:
          "The same English word appears in symbolic apocalyptic imagery, not Genesis creation narrative.",
      },
    ],
    graph: {
      nodes: [
        { id: "woman", label: "Woman", role: "Person" },
        { id: "man", label: "Man", role: "Person" },
        { id: "covenant", label: "Covenant union", role: "Theme" },
      ],
      edges: [
        { from: "woman", to: "man", label: "received by" },
        { from: "woman", to: "covenant", label: "participates in" },
      ],
    },
  },
  {
    id: "man",
    label: "Man",
    originalWord: "adam / ish",
    transliteration: "ʾādām / ʾîš",
    originalScript: "אָדָם / אִישׁ",
    hebrewDefinition:
      "Adam can denote humankind or the first man; ish often emphasizes a male person in relational context.",
    literalSense: "A formed human person called into vocation and covenant relation.",
    verseRange: "Genesis 2:5-25",
    summary: "Man is shown as formed, placed, entrusted, commanded, and finally joined. His identity unfolds through relation to God, work, creation, and woman.",
    whyItMatters: "The chapter presents personhood as received vocation rather than self-invention.",
    relatedOriginalWordPassages: [
      {
        reference: "Genesis 3:17",
        verseText:
          "And unto Adam he said, Because thou hast hearkened unto the voice of thy wife ... cursed is the ground for thy sake;",
      },
      {
        reference: "Psalm 8:4",
        verseText:
          "What is man, that thou art mindful of him? and the son of man, that thou visitest him?",
      },
    ],
    relatedEnglishDifferentWordPassages: [
      {
        reference: "John 19:5",
        originalWord: "anthrōpos",
        verseText: "Then came Jesus forth, wearing the crown of thorns, and the purple robe. And Pilate saith unto them, Behold the man!",
        differenceNote:
          "This is a Greek narrative use and does not carry Genesis 2's formation-and-covenant progression.",
      },
    ],
    graph: {
      nodes: [
        { id: "man", label: "Man", role: "Person" },
        { id: "eden", label: "Eden", role: "Place" },
        { id: "vocation", label: "Vocation", role: "Theme" },
        { id: "woman", label: "Woman", role: "Person" },
      ],
      edges: [
        { from: "man", to: "eden", label: "placed in" },
        { from: "man", to: "vocation", label: "entrusted with" },
        { from: "man", to: "woman", label: "joined to" },
      ],
    },
  },
  {
    id: "one-flesh",
    label: "One flesh",
    originalWord: "basar echad",
    transliteration: "bāśār ʾeḥād",
    originalScript: "בָּשָׂר אֶחָד",
    hebrewDefinition:
      "A covenant union where two lives become one shared embodied bond.",
    literalSense: "One body-life, not merely close partnership.",
    verseRange: "Genesis 2:24",
    summary: "One flesh gathers leaving, cleaving, and union into a covenant picture of shared life. It signals more than biology; it names belonging.",
    whyItMatters: "The verse turns a personal moment into a pattern that shapes later biblical teaching on marriage and faithfulness.",
    relatedOriginalWordPassages: [
      {
        reference: "Matthew 19:5",
        verseText:
          "And said, For this cause shall a man leave father and mother, and shall cleave to his wife: and they twain shall be one flesh?",
      },
      {
        reference: "Ephesians 5:31",
        verseText:
          "For this cause shall a man leave his father and mother, and shall be joined unto his wife, and they two shall be one flesh.",
      },
    ],
    relatedEnglishDifferentWordPassages: [
      {
        reference: "1 Corinthians 6:16",
        originalWord: "sarx mia",
        verseText:
          "What? know ye not that he which is joined to an harlot is one body? for two, saith he, shall be one flesh.",
        differenceNote:
          "Paul uses the phrase as a warning contrast, not as a covenant ideal in Eden.",
      },
    ],
    graph: {
      nodes: [
        { id: "one-flesh", label: "One flesh", role: "Union" },
        { id: "man", label: "Man", role: "Participant" },
        { id: "woman", label: "Woman", role: "Participant" },
        { id: "family", label: "Family bonds", role: "Context" },
      ],
      edges: [
        { from: "one-flesh", to: "man", label: "joins" },
        { from: "one-flesh", to: "woman", label: "joins" },
        { from: "one-flesh", to: "family", label: "reorders" },
      ],
    },
  },
  {
    id: "side-rib",
    label: "Side / rib",
    originalWord: "tsela",
    transliteration: "ṣēlāʿ",
    originalScript: "צֵלָע",
    hebrewDefinition:
      "Side, flank, or rib-side, suggesting proximity and shared substance.",
    literalSense: "A side-part taken to form a corresponding counterpart.",
    verseRange: "Genesis 2:21-22",
    summary: "The side or rib image stresses shared substance and closeness. The woman is not introduced from distance but from the man's own embodied life.",
    whyItMatters: "The image supports kinship and belonging rather than hierarchy-by-separation.",
    relatedOriginalWordPassages: [
      {
        reference: "Exodus 26:20",
        verseText:
          "And for the second side of the tabernacle on the north side there shall be twenty boards:",
      },
      {
        reference: "1 Kings 6:5",
        verseText:
          "And against the wall of the house he built chambers round about ... against the walls of the house round about, both of the temple and of the oracle:",
      },
    ],
    relatedEnglishDifferentWordPassages: [
      {
        reference: "John 19:34",
        originalWord: "pleura",
        verseText:
          "But one of the soldiers with a spear pierced his side, and forthwith came there out blood and water.",
        differenceNote:
          "This refers to a pierced body side in crucifixion, not a creation act of forming a counterpart.",
      },
    ],
    graph: {
      nodes: [
        { id: "side-rib", label: "Side / rib", role: "Image" },
        { id: "man", label: "Man", role: "Source image" },
        { id: "woman", label: "Woman", role: "Received person" },
      ],
      edges: [
        { from: "side-rib", to: "man", label: "taken from" },
        { from: "side-rib", to: "woman", label: "forms" },
      ],
    },
  },
  {
    id: "naked-not-ashamed",
    label: "Naked / not ashamed",
    originalWord: "arummim / lo yitboshashu",
    transliteration: "ʿărummîm / lōʾ yitbōšāšû",
    originalScript: "עֲרוּמִּים / לֹא יִתְבּשָׁשׁוּ",
    hebrewDefinition:
      "Uncovered and without shame, signaling transparent relational safety before the fall.",
    literalSense: "Exposed yet unembarrassed in innocent trust.",
    verseRange: "Genesis 2:25",
    summary: "The chapter ends with unveiled presence and no shame. The image carries innocence, trust, and relational safety before fracture enters in Genesis 3.",
    whyItMatters: "This is the quiet climax of the chapter's covenant and companionship theme.",
    relatedOriginalWordPassages: [
      {
        reference: "Genesis 3:7",
        verseText:
          "And the eyes of them both were opened, and they knew that they were naked; and they sewed fig leaves together, and made themselves aprons.",
      },
      {
        reference: "Genesis 3:10",
        verseText:
          "And he said, I heard thy voice in the garden, and I was afraid, because I was naked; and I hid myself.",
      },
    ],
    relatedEnglishDifferentWordPassages: [
      {
        reference: "2 Corinthians 5:3",
        originalWord: "gymnos",
        verseText: "If so be that being clothed we shall not be found naked.",
        differenceNote:
          "Paul uses clothing imagery for mortality and resurrection hope, not pre-fall relational innocence.",
      },
    ],
    graph: {
      nodes: [
        { id: "naked-not-ashamed", label: "Naked / not ashamed", role: "State" },
        { id: "man", label: "Man", role: "Participant" },
        { id: "woman", label: "Woman", role: "Participant" },
        { id: "trust", label: "Trust", role: "Theme" },
      ],
      edges: [
        { from: "naked-not-ashamed", to: "man", label: "describes" },
        { from: "naked-not-ashamed", to: "woman", label: "describes" },
        { from: "naked-not-ashamed", to: "trust", label: "reveals" },
      ],
    },
  },
];

export const meaningTargetMap = Object.fromEntries(
  meaningTargets.map((target) => [target.id, target]),
) as Record<MeaningTargetId, MeaningTarget>;
