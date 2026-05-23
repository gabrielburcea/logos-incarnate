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
  verseRange: string;
  summary: string;
  whyItMatters: string;
  context: string;
  relatedPassages: string[];
  graph: {
    nodes: Array<{ id: string; label: string; role: string }>;
    edges: Array<{ from: string; to: string; label: string }>;
  };
};

export const genesis2Chapter = {
  title: "Genesis 2",
  translation: "KJV (public domain)",
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
    verseRange: "Genesis 2:18, 20",
    summary: "Helper is introduced as a needed counterpart, not a lesser assistant. The passage frames companionship as a gift that answers human aloneness.",
    whyItMatters: "Meaning comes from fit, mutuality, and correspondence more than task delegation.",
    context: "The phrase appears after vocation and naming, showing that human flourishing still remains incomplete in isolation.",
    relatedPassages: ["Ecclesiastes 4:9-10", "Psalm 121:1-2", "Hebrews 13:6"],
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
    verseRange: "Genesis 2:22-25",
    summary: "Woman arrives as a person received with recognition, delight, and covenant nearness. The text presents shared humanity before role discussion.",
    whyItMatters: "The first response is wonder and kinship, not analysis.",
    context: "She is introduced through procession and speech, which gives the scene relational and liturgical weight.",
    relatedPassages: ["Proverbs 31:10", "Song of Songs 4:7", "Galatians 3:28"],
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
    verseRange: "Genesis 2:5-25",
    summary: "Man is shown as formed, placed, entrusted, commanded, and finally joined. His identity unfolds through relation to God, work, creation, and woman.",
    whyItMatters: "The chapter presents personhood as received vocation rather than self-invention.",
    context: "The movement from dust to garden to covenant keeps human meaning grounded in gift and calling.",
    relatedPassages: ["Psalm 8:4-6", "Romans 5:12-19", "1 Corinthians 15:45"],
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
    verseRange: "Genesis 2:24",
    summary: "One flesh gathers leaving, cleaving, and union into a covenant picture of shared life. It signals more than biology; it names belonging.",
    whyItMatters: "The verse turns a personal moment into a pattern that shapes later biblical teaching on marriage and faithfulness.",
    context: "The line follows Adam's recognition speech and becomes the chapter's interpretive hinge.",
    relatedPassages: ["Matthew 19:4-6", "Ephesians 5:31-32", "Malachi 2:14-15"],
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
    verseRange: "Genesis 2:21-22",
    summary: "The side or rib image stresses shared substance and closeness. The woman is not introduced from distance but from the man's own embodied life.",
    whyItMatters: "The image supports kinship and belonging rather than hierarchy-by-separation.",
    context: "The deep sleep scene slows the chapter down and marks the creation of woman as deliberate and personal.",
    relatedPassages: ["Genesis 1:27", "1 Corinthians 11:11-12", "Ephesians 5:28-29"],
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
    verseRange: "Genesis 2:25",
    summary: "The chapter ends with unveiled presence and no shame. The image carries innocence, trust, and relational safety before fracture enters in Genesis 3.",
    whyItMatters: "This is the quiet climax of the chapter's covenant and companionship theme.",
    context: "The final line gives a moral and emotional atmosphere, not just a physical description.",
    relatedPassages: ["Genesis 3:7-10", "Hebrews 4:13", "1 John 4:18"],
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
