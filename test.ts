import fs from "fs";
import readline from "readline";

const uniqueWordsInJSONL = new Set<string>;
const jsonlWordsInCards: any[] = []
type Card = {
  origin: string;
  translation: string;
}
type Cards = Card[]


type WordPosCount = {
  wordType: string;
  count: number;
};
type Translation = {
  "word": string;
  "lang_code": string,
  "lang": string
}
type DictEntry = {
  "word": string;
  "translation": Translation[];
}
let dictionaryEsEn: DictEntry[] = [];



const getCards = (): Cards => {


  const raw = fs.readFileSync("in/cards.txt", "utf8");

  // split into lines
  const lines = raw.split(/\r?\n/);

  // skip first two lines
  const dataLines = lines.slice(2);
  const cards: Cards = [];
  for (const line of dataLines) {
    if (!line.trim()) continue; // skip empty lines

    const parts = line.split("\t");
    const card: Card = {
      origin: parts[0] || "",
      translation: parts[1] || ""
    }
    cards.push(card);
  }
  return cards;
}
const eachOfSecondLang = (cards: Cards) => {
  const stringToWords = (phrase: string): string[] => {
    return phrase
      .toLowerCase()
      .replace(/[.,!?;:()"']/g, "")   // remove punctuation
      .split(/\s+/)                   // split on any whitespace
      .filter(Boolean);               // remove empty entries
  };
  const uniqueWords = new Set<string>();
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (card) {
      const words = stringToWords(card.translation);
      for (const word of words) {
        uniqueWords.add(word);
      }
    }
  }
  return uniqueWords;
}

const Cards = getCards();
console.log("all parts count: ", Cards.length);
// console.log("all parts format", cards[0]);
const uniqueWordsInCards = eachOfSecondLang(Cards);
const rl = readline.createInterface({
  input: fs.createReadStream("in/es-extract.jsonl"),
  crlfDelay: Infinity
});

const wordTypeCounts: WordPosCount[] = [];
let entriesInJsonl = 0;
let duplicatedWordsInJSONL = 0;

const processLine = (line: string) => {
  //remove empty lines
  if (!line.trim()) return;

  try {
    const obj = JSON.parse(line);

    if (uniqueWordsInCards.has(obj.word)) {
      //adding all jsonl info of words that 
      // intersect sets to array
      jsonlWordsInCards.push(obj);
    }
    
    // duplicates + uniqueWordsInJSONL should equal entriesInJsonl
    if (uniqueWordsInJSONL.has(obj.word)) ++duplicatedWordsInJSONL;
    uniqueWordsInJSONL.add(obj.word);
    ++entriesInJsonl;

    let matched = false;
    wordTypeCounts.forEach(wordPosCount => {
      if (wordPosCount.wordType === obj.pos) {
        wordPosCount.count++;
        matched = true;
      }
    })
    if (!matched && obj.pos) {
      wordTypeCounts.push({
        wordType: obj.pos,
        count: 1
      })
    }
      let en = [];
      if (obj.translations && Array.isArray(obj.translations)) {
        en = obj.translations.filter((val: any) => (val.lang_code === "en"))
      }
      if (en.length === 0) return;
      
      // if (dictionaryEsEn.includes(obj.word)) return;
      dictionaryEsEn.push({
        word: obj.word,
        translation: en,
      });


    } catch (err) {
      console.error("Bad JSON:", err);
    }
  }

const processClose = () => {
    console.log("Finished processing file");
    console.log(dictionaryEsEn.length);
    fs.writeFileSync("out/es-en.json", JSON.stringify(dictionaryEsEn, null, 2), "utf8");
    // console.log(words[words.length - 1]);
    const statsEsEn = fs.statSync("out/es-en.json");
    wordTypeCounts.forEach(value => {
      console.log(`counted ${value.count} of ${value.wordType}`)
    })

    fs.writeFileSync("out/es.json", JSON.stringify(jsonlWordsInCards, null, 2), "utf8");
    // console.log(words[words.length - 1]);
    fs.writeFileSync("out/wordsInCards.json", JSON.stringify(Array.from(uniqueWordsInCards), null, 2), "utf8");

        console.log("Size:", statsEsEn.size, "bytes");
    // combine();

    // console.log(nouns.size);
    // console.log(japs);
    console.log("wordsInJSONL.size", uniqueWordsInJSONL.size);
    console.log("entries in jsonl", entriesInJsonl);
    console.log("duplicates", duplicatedWordsInJSONL);
    console.log("numbers add up", (uniqueWordsInJSONL.size + duplicatedWordsInJSONL === entriesInJsonl));
    console.log("dictionaryEsEn size", dictionaryEsEn.length)
    console.log("jsonlWordsInCards", jsonlWordsInCards.length);

  }
  rl.on("line", processLine);

  rl.on("close", processClose);


  const combine = () => {
    const cards = getCards();
    console.log("all parts count: ", cards.length);
    // console.log("all parts format", cards[0]);
    const uniqueWords = eachOfSecondLang(cards, processCard);
    console.log("unique words from cards size", uniqueWords.size);
    const combinedDict = new Set<DictEntry>;
    const notInCombinedDict = new Set<string>;
    let cardWordsInJsonL = 0;

    uniqueWords.forEach((word: string) => {
      const res = dictionaryEsEn.find((dictEntry) => {
        return (dictEntry.word === word);
      });
      if (res) {
        combinedDict.add(res);
      } else {
        notInCombinedDict.add(word);
      }
      if (uniqueWordsInJSONL.has(word)) {
        if (!res) {

        }
        cardWordsInJsonL++
      }
      // console.log(value);
    });
    console.log("card words in jsonl", cardWordsInJsonL);
    // console.log(notInDict);
    console.log("combined dict size", combinedDict.size);
    console.log("not in combined dict size", notInCombinedDict.size);
  }






