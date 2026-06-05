import fs from "fs";
import readline from "readline";

const rl = readline.createInterface({
  input: fs.createReadStream("es-extract.jsonl"),
  crlfDelay: Infinity
});
let count = 0;
let words = [];

rl.on("line", (line) => {
  if (!line.trim()) return;

  try {
    const obj = JSON.parse(line);
    // if (words.length > 100)
    //   process.exit();
    // Do whatever you need with each object
    // Example:
    let en = [];
    if (obj.translations && Array.isArray(obj.translations)) {
      en = obj.translations.filter(val => (val.lang_code === "en"))
    }
    if (en.length === 0) return;
    if (words.includes(obj.word)) return;

    
    words.push({
      word: obj.word,
      translation: en,
    });
    
    // console.log(words[words.length - 1]);


  } catch (err) {
    console.error("Bad JSON:", err);
  }
});

rl.on("close", () => {
  console.log("Finished processing file");
  console.log(words.length);
});
