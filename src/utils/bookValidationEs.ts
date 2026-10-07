/**
 * Spanish book abbreviations, as ProPresenter resolves them with the Spanish
 * Bible loaded. Book names are the ones in public/BookInfoEs.xml (unaccented).
 *
 * Rule (first come, first served): walking the books in Bible order, every
 * prefix of a book's name belongs to the first book that has it. Génesis owns
 * "g" because it is the first book starting with G; Gálatas owns "ga" because
 * it is the first starting with GA; and so on. Numbered books are matched with
 * their number ("1 r" = 1 Reyes). The first entry of each list is the shortest.
 *
 * The four Gospels must be typed with "S." in front ("s. mat", never "mat"):
 * ProPresenter names them S. Mateo, S. Marcos, S. Lucas and S. Juan, so their
 * abbreviations are prefixes of those names.
 *
 * Generated from the book list with that rule; to be verified in ProPresenter.
 * Edit an entry by hand if ProPresenter opens a different book.
 */
export const bookVariationsEs: Record<string, readonly string[]> = {
    "Genesis": ["g", "ge", "gen", "gene", "genes", "genesi", "genesis"],
    "Exodo": ["e", "ex", "exo", "exod", "exodo"],
    "Levitico": ["l", "le", "lev", "levi", "levit", "leviti", "levitic", "levitico"],
    "Numeros": ["n", "nu", "num", "nume", "numer", "numero", "numeros"],
    "Deuteronomio": ["d", "de", "deu", "deut", "deute", "deuter", "deutero", "deuteron", "deuterono", "deuteronom", "deuteronomi", "deuteronomio"],
    "Josue": ["j", "jo", "jos", "josu", "josue"],
    "Jueces": ["ju", "jue", "juec", "juece", "jueces"],
    "Rut": ["r", "ru", "rut"],
    "1 Samuel": ["1 s", "1 sa", "1 sam", "1 samu", "1 samue", "1 samuel"],
    "2 Samuel": ["2 s", "2 sa", "2 sam", "2 samu", "2 samue", "2 samuel"],
    "1 Reyes": ["1 r", "1 re", "1 rey", "1 reye", "1 reyes"],
    "2 Reyes": ["2 r", "2 re", "2 rey", "2 reye", "2 reyes"],
    "1 Cronicas": ["1 c", "1 cr", "1 cro", "1 cron", "1 croni", "1 cronic", "1 cronica", "1 cronicas"],
    "2 Cronicas": ["2 c", "2 cr", "2 cro", "2 cron", "2 croni", "2 cronic", "2 cronica", "2 cronicas"],
    "Esdras": ["es", "esd", "esdr", "esdra", "esdras"],
    "Nehemias": ["ne", "neh", "nehe", "nehem", "nehemi", "nehemia", "nehemias"],
    "Ester": ["est", "este", "ester"],
    "Job": ["job"],
    "Salmos": ["s", "sa", "sal", "salm", "salmo", "salmos"],
    "Proverbios": ["p", "pr", "pro", "prov", "prove", "prover", "proverb", "proverbi", "proverbio", "proverbios"],
    "Eclesiastes": ["ec", "ecl", "ecle", "ecles", "eclesi", "eclesia", "eclesias", "eclesiast", "eclesiaste", "eclesiastes"],
    "Cantares": ["c", "ca", "can", "cant", "canta", "cantar", "cantare", "cantares"],
    "Isaias": ["i", "is", "isa", "isai", "isaia", "isaias"],
    "Jeremias": ["je", "jer", "jere", "jerem", "jeremi", "jeremia", "jeremias"],
    "Lamentaciones": ["la", "lam", "lame", "lamen", "lament", "lamenta", "lamentac", "lamentaci", "lamentacio", "lamentacion", "lamentacione", "lamentaciones"],
    "Ezequiel": ["ez", "eze", "ezeq", "ezequ", "ezequi", "ezequie", "ezequiel"],
    "Daniel": ["da", "dan", "dani", "danie", "daniel"],
    "Oseas": ["o", "os", "ose", "osea", "oseas"],
    "Joel": ["joe", "joel"],
    "Amos": ["a", "am", "amo", "amos"],
    "Abdias": ["ab", "abd", "abdi", "abdia", "abdias"],
    "Jonas": ["jon", "jona", "jonas"],
    "Miqueas": ["m", "mi", "miq", "miqu", "mique", "miquea", "miqueas"],
    "Nahum": ["na", "nah", "nahu", "nahum"],
    "Habacuc": ["h", "ha", "hab", "haba", "habac", "habacu", "habacuc"],
    "Sofonias": ["so", "sof", "sofo", "sofon", "sofoni", "sofonia", "sofonias"],
    "Hageo": ["hag", "hage", "hageo"],
    "Zacarias": ["z", "za", "zac", "zaca", "zacar", "zacari", "zacaria", "zacarias"],
    "Malaquias": ["ma", "mal", "mala", "malaq", "malaqu", "malaqui", "malaquia", "malaquias"],
    "Mateo": ["s. m", "s. ma", "s. mat", "s. mate", "s. mateo"],
    "Marcos": ["s. mar", "s. marc", "s. marco", "s. marcos"],
    "Lucas": ["s. l", "s. lu", "s. luc", "s. luca", "s. lucas"],
    "Juan": ["s. j", "s. ju", "s. jua", "s. juan"],
    "Hechos": ["he", "hec", "hech", "hecho", "hechos"],
    "Romanos": ["ro", "rom", "roma", "roman", "romano", "romanos"],
    "1 Corintios": ["1 co", "1 cor", "1 cori", "1 corin", "1 corint", "1 corinti", "1 corintio", "1 corintios"],
    "2 Corintios": ["2 co", "2 cor", "2 cori", "2 corin", "2 corint", "2 corinti", "2 corintio", "2 corintios"],
    "Galatas": ["ga", "gal", "gala", "galat", "galata", "galatas"],
    "Efesios": ["ef", "efe", "efes", "efesi", "efesio", "efesios"],
    "Filipenses": ["f", "fi", "fil", "fili", "filip", "filipe", "filipen", "filipens", "filipense", "filipenses"],
    "Colosenses": ["co", "col", "colo", "colos", "colose", "colosen", "colosens", "colosense", "colosenses"],
    "1 Tesalonicenses": ["1 t", "1 te", "1 tes", "1 tesa", "1 tesal", "1 tesalo", "1 tesalon", "1 tesaloni", "1 tesalonic", "1 tesalonice", "1 tesalonicen", "1 tesalonicens", "1 tesalonicense", "1 tesalonicenses"],
    "2 Tesalonicenses": ["2 t", "2 te", "2 tes", "2 tesa", "2 tesal", "2 tesalo", "2 tesalon", "2 tesaloni", "2 tesalonic", "2 tesalonice", "2 tesalonicen", "2 tesalonicens", "2 tesalonicense", "2 tesalonicenses"],
    "1 Timoteo": ["1 ti", "1 tim", "1 timo", "1 timot", "1 timote", "1 timoteo"],
    "2 Timoteo": ["2 ti", "2 tim", "2 timo", "2 timot", "2 timote", "2 timoteo"],
    "Tito": ["t", "ti", "tit", "tito"],
    "Filemon": ["file", "filem", "filemo", "filemon"],
    "Hebreos": ["heb", "hebr", "hebre", "hebreo", "hebreos"],
    "Santiago": ["san", "sant", "santi", "santia", "santiag", "santiago"],
    "1 Pedro": ["1 p", "1 pe", "1 ped", "1 pedr", "1 pedro"],
    "2 Pedro": ["2 p", "2 pe", "2 ped", "2 pedr", "2 pedro"],
    "1 Juan": ["1 j", "1 ju", "1 jua", "1 juan"],
    "2 Juan": ["2 j", "2 ju", "2 jua", "2 juan"],
    "3 Juan": ["3 j", "3 ju", "3 jua", "3 juan"],
    "Judas": ["jud", "juda", "judas"],
    "Apocalipsis": ["ap", "apo", "apoc", "apoca", "apocal", "apocali", "apocalip", "apocalips", "apocalipsi", "apocalipsis"],
};

/** Books ProPresenter files under "S." (San): typed as "s. <name>". */
export const SAINT_PREFIXED_BOOKS = new Set(['Mateo', 'Marcos', 'Lucas', 'Juan']);
export const SAINT_PREFIX = 's. ';
