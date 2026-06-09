import fs from "fs";
import readline from "readline";


const rl = readline.createInterface({
  input: fs.createReadStream("es-extract.jsonl"),
  crlfDelay: Infinity
});
let count = 0;
type Translation = {
  "word": string;
  "lang_code": string,
  "lang": string
}
type DictEntry = {
  "word": string;
  "translation": Translation[];
}
let dictionary: DictEntry[] = [];
const categories = new Set<string>;
const nouns = new Set<string>;

rl.on("line", (line) => {
  if (!line.trim()) return;

  try {
    const obj = JSON.parse(line);
    // if (words.length > 100)
 
    // Do whatever you need with each object
    // Example:
      // process.exit();
   
  if(obj.pos === "noun") nouns.add(obj.word);

   if (obj.categories && Array.isArray(obj.categories)) {
      for (let category of obj.categories) {
        categories.add(category);
      }
    }
    let en = [];
    if (obj.translations && Array.isArray(obj.translations)) {
      en = obj.translations.filter(val => (val.lang_code === "en"))
    }
    if (en.length === 0) return;
    if (dictionary.includes(obj.word)) return;


    dictionary.push({
      word: obj.word,
      translation: en,
    });


  } catch (err) {
    console.error("Bad JSON:", err);
  }
});

rl.on("close", () => {
  console.log("Finished processing file");
  console.log(dictionary.length);
  fs.writeFileSync("es-en.json", JSON.stringify(dictionary), "utf8");
  // console.log(words[words.length - 1]);
  const stats = fs.statSync("es-en.json");
  console.log("Size:", stats.size, "bytes");
  combine();
  console.log("categories string set :", categories.size);

  // ... your loop populated the categories set ...

  const esCategories = new Set<string>();

  categories.forEach((category) => {
    if (category.startsWith("ES:")) {
      esCategories.add(category);
    }
  });
  console.log(esCategories.size);
  console.log(nouns.size);
});
type card = {
  origin: string;
  translation: string;
}
type cards = card[]
const getCards = (): cards => {


  const raw = fs.readFileSync("cards.txt", "utf8");

  // split into lines
  const lines = raw.split(/\r?\n/);

  // skip first two lines
  const dataLines = lines.slice(2);
  const cards: cards = [];
  for (const line of dataLines) {
    if (!line.trim()) continue; // skip empty lines

    const parts = line.split("\t");
    const card: card = {
      origin: parts[0] || "",
      translation: parts[1] || ""
    }
    cards.push(card);
  }
  return cards;
}
type Callback<T> = (card: T, words: Set<string>) => void;

const combine = () => {
  const cards = getCards();
  console.log("all parts count: ", cards.length);
  console.log("all parts format", cards[0]);
  const uniqueWords = eachOfSecondLang(cards, processCard);
  console.log("collected size", uniqueWords.size);
  const dict = new Set<DictEntry>;
  const notInDict = new Set<string>;
  uniqueWords.forEach((value: string) => {
    const res = dictionary.find((dictEntry) => {
      return (dictEntry.word === value);
    });
    if (res) {
      dict.add(res);
    } else {
      notInDict.add(value);
    }
    // console.log(value);
  });
  console.log(notInDict);
  console.log("dict size", dict.size);
  console.log("not in dict size", notInDict.size);
}

const eachOfSecondLang = (cards: cards, cb: Callback<card>) => {
  const uniqueWords = new Set<string>();
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (card) cb(card, uniqueWords);
  }
  return uniqueWords;
}

const processCard = (card: card, words: Set<string>) => {
  addWordsToSet(card.translation, words)
  console.log(stringToWords(card.translation));
};

const addWordsToSet = (phrase: string, set: Set<string>) => {
  const words = stringToWords(phrase);
  for (const word of words) {
    set.add(word);
  }
};

const stringToWords = (phrase: string): string[] => {
  return phrase
    .toLowerCase()
    .replace(/[.,!?;:()"']/g, "")   // remove punctuation
    .split(/\s+/)                   // split on any whitespace
    .filter(Boolean);               // remove empty entries
};
