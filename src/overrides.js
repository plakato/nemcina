// Hand-made cards for rows of the teacher's sheet that the automatic splitting gets wrong.
// Key: "<German cell>|<Czech cell>" with whitespace collapsed to single spaces.
// Value: the cards to use instead, as [Czech, German] pairs; [] drops the row.
export default {
  "wir haben ihr habt sie / Sie haben|my máme vy máte oni mají / Vy máte": [
    ["my máme", "wir haben"], ["vy máte", "ihr habt"], ["oni mají", "sie haben"], ["Vy máte", "Sie haben"],
  ],
  "wir sind ihr seid sie / Sie sind|my jsme vy jste oni jsou / Vy jste": [
    ["my jsme", "wir sind"], ["vy jste", "ihr seid"], ["oni jsou", "sie sind"], ["Vy jste", "Sie sind"],
  ],
  "wir waren - ihr wart - sie / Sie waren|byli jsme - byli jste - byli / byl(a) jste": [
    ["byli jsme", "wir waren"], ["byli jste", "ihr wart"], ["oni byli", "sie waren"], ["Vy jste byl(a)", "Sie waren"],
  ],
  "Hast du keinen Bruder? --> Doch. / Nein.|Ty nemáš bratra? --> Ano(, mám). / Ne.": [
    ["Ty nemáš bratra? --> Ano(, mám).", "Hast du keinen Bruder? --> Doch."],
    ["Ty nemáš bratra? --> Ne.", "Hast du keinen Bruder? --> Nein."],
  ],
  "Du wohnst nicht in Prag? --> Doch. / Nein.|Ty nebydlíš v Praze? --> Ano(, bydlím). / Ne.": [
    ["Ty nebydlíš v Praze? --> Ano(, bydlím).", "Du wohnst nicht in Prag? --> Doch."],
    ["Ty nebydlíš v Praze? --> Ne.", "Du wohnst nicht in Prag? --> Nein."],
  ],
  "frei haben / frei sein|mít volno / být volný": [
    ["mít volno", "frei haben"], ["být volný", "frei sein"],
  ],
  "die Schule / das Gymnasium besuchen|chodit do školy / na gymnázium": [
    ["chodit do školy", "die Schule besuchen"], ["chodit na gymnázium", "das Gymnasium besuchen"],
  ],
  "ZÁKLADNÍ TVARY: mein - dein - sein / ihr / sein|můj - tvůj - jeho / její / jeho": [
    ["můj", "mein"], ["tvůj", "dein"], ["jeho (on)", "sein"], ["její", "ihr"], ["jeho (ono)", "sein"],
  ],
  "mit (der) Karte / bar bezahlen|zaplatit kartou / hotově": [
    ["zaplatit kartou", "mit (der) Karte bezahlen"], ["zaplatit hotově", "bar bezahlen"],
  ],
  "Viertel nach .... / Viertel vor ....|čtvrt na .... / tři čtvrtě na ....": [
    ["čtvrt na ....", "Viertel nach ...."], ["tři čtvrtě na ....", "Viertel vor ...."],
  ],
  "hungrig / durstig (sein) Ich bin hungrig und du bist durstig.|(být) hladový / žíznivý Jsem hladový a ty jsi žíznivý.": [
    ["(být) hladový", "hungrig (sein)"], ["(být) žíznivý", "durstig (sein)"],
    ["Jsem hladový a ty jsi žíznivý.", "Ich bin hungrig und du bist durstig."],
  ],
  // the German is in the opposite order to the Czech; both nouns are used without an article
  "s Pech x s Glück (používáme bez členu)|štěstí x smůla": [
    ["štěstí", "Glück (používáme bez členu)"], ["smůla", "Pech (používáme bez členu)"],
  ],
  // German examples in the Czech column next to an unrelated note
  "Nejstarší člověk je Giovanni. přívlastek --> skloňujeme --> zatím se neučíme|Das ist ein brauner Hund. Das ist eine braune Katze. Das ist ein braunes Auto.": [],
  "r Glühwein (e Glühbirne, -n s Glühwürmchen, ü-er = r Leuchtkäfer)|svařené víno žárovka světluška": [
    ["svařené víno", "r Glühwein"], ["žárovka", "e Glühbirne, -n"], ["světluška", "s Glühwürmchen, ü-er = r Leuchtkäfer"],
  ],
  "Was nimmt er / dein Sohn?|Co si dá on / tvůj syn?": [
    ["Co si dá on?", "Was nimmt er?"], ["Co si dá tvůj syn?", "Was nimmt dein Sohn?"],
  ],
};

// German nouns the sheet lists without an article that are normally used with one.
export const ARTICLES = {
  "Wetter": "s Wetter",
  "Familie": "e Familie, -n",
  "Million": "e Million, -en",
  "Einkaufen": "s Einkaufen",
};

// Extra answers accepted for a card, added after reviewing a "Měl/a jsem to dobře" click
// that had a real reason. Key: card id (from /api/vocab). Value: list of accepted German answers.
export const EXTRA_ANSWERS = {
};
