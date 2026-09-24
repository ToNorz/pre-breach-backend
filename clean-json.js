const fs = require("fs");

const file = fs.readFileSync("./src/db/data/breachpoint_challenges.json", "utf8");
const data = JSON.parse(file);

const pointsMap = {
  easy: 250,
  medium: 500,
  hard: 750,
  expert: 1000
};

const cleaned = data.map(c => {
  // Combine preStory and postStory into description if they exist, because they contain the actual challenge context
  let finalDesc = c.description || "";
  
  if (c.preStory) {
    finalDesc = `${c.preStory}\n\n${finalDesc}`;
  }
  
  const obj = {
    title: c.title,
    description: finalDesc,
    difficulty: c.difficulty,
    category: c.category || "Misc",
    points: pointsMap[c.difficulty] || 500,
    flag: c.flag,
    resourceLink: c.resourceLink || null
  };
  return obj;
});

fs.writeFileSync("./src/db/data/breachpoint_challenges.json", JSON.stringify(cleaned, null, 2));
console.log("Cleaned JSON file.");
