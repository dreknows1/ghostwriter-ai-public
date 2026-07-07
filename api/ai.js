// server/ai.ts
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// server/engine/curriculum.generated.ts
var CURRICULUM = {
  "genreBuilder": {
    "R&B": {
      "themes": [
        "New love",
        "Deep love / devotion",
        "Complicated love",
        "Heartbreak / letting go",
        "Missing someone",
        "Celebration / milestone",
        "Family",
        "Faith / gratitude",
        "Growth / proving myself",
        "Remembering someone"
      ],
      "purposes": [
        "Slow dance",
        "Bring happy tears",
        "Party / celebrate",
        "Make them feel seen",
        "Testify / give thanks",
        "Win them back",
        "Say what I never said"
      ],
      "instruments": [
        "soft keys",
        "808 sub-bass",
        "live bass",
        "Rhodes piano",
        "saxophone",
        "strings",
        "brushed drums",
        "muted guitar"
      ]
    },
    "Hip-Hop": {
      "themes": [
        "The come-up / hustle",
        "Proving them wrong",
        "Where I'm from",
        "Love & loyalty",
        "Losing a friend",
        "Money & ambition",
        "The struggle",
        "Celebration / flexing"
      ],
      "purposes": [
        "Flex / celebrate",
        "Tell my story",
        "Motivate the ones grinding",
        "Ride music",
        "Call somebody out",
        "Grieve a loss"
      ],
      "instruments": [
        "heavy 808s",
        "boom-bap drums",
        "dusty piano loop",
        "soul sample chops",
        "dark synth lead",
        "strings",
        "live bass"
      ]
    },
    "Gospel": {
      "themes": [
        "Praise & worship",
        "Testimony / what God brought me through",
        "Gratitude",
        "Faith through the storm",
        "Deliverance",
        "Celebration of His love",
        "For the congregation"
      ],
      "purposes": [
        "Worship / exalt",
        "Testify",
        "Lift the congregation",
        "Comfort in grief",
        "Celebrate",
        "Encourage / motivate",
        "Altar call"
      ],
      "instruments": [
        "Hammond organ",
        "grand piano",
        "full choir",
        "tambourine",
        "live bass",
        "gospel drums",
        "handclaps"
      ]
    },
    "Reggae": {
      "themes": [
        "One love / unity",
        "Sufferation & struggle",
        "Praise & spirituality",
        "Romance (lovers rock)",
        "Freedom & justice",
        "Celebration",
        "Missing someone",
        "Confidence & swagger",
        "Proving them wrong"
      ],
      "purposes": [
        "Uplift the people",
        "Protest",
        "Romance",
        "Slow dance",
        "Skank / dance",
        "Give thanks",
        "Party / celebrate",
        "Flex / celebrate"
      ],
      "instruments": [
        "one-drop drums",
        "skanking guitar",
        "organ bubble",
        "deep bass",
        "horns",
        "melodica"
      ]
    },
    "Afrobeats": {
      "themes": [
        "Celebration of life",
        "Love & desire",
        "Hustle & blessings",
        "Homeland pride",
        "Dance & good vibes",
        "Gratitude"
      ],
      "purposes": [
        "Dance",
        "Celebrate",
        "Romance",
        "Give thanks",
        "Summer anthem"
      ],
      "instruments": [
        "log drums",
        "talking drum",
        "shakers",
        "afro percussion",
        "warm synth keys",
        "guitar licks",
        "deep bass"
      ]
    },
    "Pop": {
      "themes": [
        "New love",
        "Heartbreak",
        "Self-empowerment",
        "Night out / freedom",
        "Nostalgia",
        "Friendship",
        "Missing someone"
      ],
      "purposes": [
        "Sing along",
        "Dance",
        "Cry it out",
        "Empower",
        "Celebrate",
        "Windows-down driving"
      ],
      "instruments": [
        "bright synths",
        "piano",
        "electric guitar",
        "punchy drums",
        "strings",
        "handclaps",
        "vocal stacks"
      ]
    },
    "Country": {
      "themes": [
        "Small-town life",
        "First love",
        "Heartbreak",
        "Family & faith",
        "Home & roots",
        "Losing someone",
        "Friday night"
      ],
      "purposes": [
        "Two-step / dance",
        "Cry in your beer",
        "Tell a story",
        "Celebrate",
        "Honor someone"
      ],
      "instruments": [
        "acoustic guitar",
        "fiddle",
        "pedal steel",
        "banjo",
        "upright bass",
        "brushed drums",
        "telecaster"
      ]
    },
    "Rock": {
      "themes": [
        "Rebellion",
        "Love & obsession",
        "Feeling like an outsider",
        "The road",
        "Standing back up",
        "Loss"
      ],
      "purposes": [
        "Anthem / fists up",
        "Raw energy",
        "Power ballad",
        "Drive music"
      ],
      "instruments": [
        "electric guitars",
        "live drums",
        "driving bass",
        "organ",
        "power chords",
        "feedback swells"
      ]
    },
    "Soul": {
      "themes": [
        "Devotion",
        "Heartache",
        "Pride & respect",
        "Longing",
        "Celebration of love",
        "Remembering someone"
      ],
      "purposes": [
        "Slow dance",
        "Testify my love",
        "Cry it out",
        "Celebrate"
      ],
      "instruments": [
        "horns",
        "Rhodes piano",
        "live bass",
        "tambourine",
        "organ",
        "strings",
        "backing trio"
      ]
    },
    "Blues": {
      "themes": [
        "Hard times",
        "Love done me wrong",
        "The road",
        "Regret & redemption",
        "Working for nothing"
      ],
      "purposes": [
        "Moan it out",
        "Shuffle / dance",
        "Tell it straight"
      ],
      "instruments": [
        "slide guitar",
        "harmonica",
        "upright bass",
        "brushed drums",
        "barrelhouse piano",
        "resonator guitar"
      ]
    },
    "Jazz": {
      "themes": [
        "Late-night romance",
        "City nights",
        "Longing",
        "Bittersweet memory",
        "New flame"
      ],
      "purposes": [
        "Slow burn",
        "Swing / dance",
        "Croon it close"
      ],
      "instruments": [
        "upright bass",
        "brushed drums",
        "piano trio",
        "muted trumpet",
        "tenor sax",
        "comping guitar"
      ]
    },
    "Folk": {
      "themes": [
        "Home & roots",
        "Protest & justice",
        "Plain-spoken love",
        "Passing time",
        "Nature & seasons",
        "A person's story"
      ],
      "purposes": [
        "Tell a story",
        "Protest",
        "Comfort",
        "Sing together"
      ],
      "instruments": [
        "acoustic guitar",
        "banjo",
        "fiddle",
        "mandolin",
        "harmonica",
        "upright bass"
      ]
    },
    "EDM": {
      "themes": [
        "Euphoria",
        "Lost in the night",
        "Freedom",
        "Love rush",
        "Letting go"
      ],
      "purposes": [
        "The drop / rave",
        "Festival anthem",
        "Sunrise chill"
      ],
      "instruments": [
        "supersaw synths",
        "sidechained bass",
        "four-on-the-floor kick",
        "plucks",
        "risers",
        "vocal chops"
      ]
    },
    "Metal": {
      "themes": [
        "Rage & defiance",
        "Inner demons",
        "War & darkness",
        "Betrayal",
        "Survival"
      ],
      "purposes": [
        "Mosh",
        "Scream it out",
        "Epic saga"
      ],
      "instruments": [
        "down-tuned guitars",
        "double-kick drums",
        "growling bass",
        "blast beats",
        "orchestral hits"
      ]
    }
  },
  "genreBuilderByLang": {
    "English": {
      "R&B": {
        "themes": [
          "New love",
          "Deep love / devotion",
          "Complicated love",
          "Heartbreak / letting go",
          "Missing someone",
          "Celebration / milestone",
          "Family",
          "Faith / gratitude",
          "Growth / proving myself",
          "Remembering someone"
        ],
        "purposes": [
          "Slow dance",
          "Bring happy tears",
          "Party / celebrate",
          "Make them feel seen",
          "Testify / give thanks",
          "Win them back",
          "Say what I never said"
        ],
        "instruments": [
          "soft keys",
          "808 sub-bass",
          "live bass",
          "Rhodes piano",
          "saxophone",
          "strings",
          "brushed drums",
          "muted guitar"
        ]
      },
      "Hip-Hop": {
        "themes": [
          "The come-up / hustle",
          "Proving them wrong",
          "Where I'm from",
          "Love & loyalty",
          "Losing a friend",
          "Money & ambition",
          "The struggle",
          "Celebration / flexing"
        ],
        "purposes": [
          "Flex / celebrate",
          "Tell my story",
          "Motivate the ones grinding",
          "Ride music",
          "Call somebody out",
          "Grieve a loss"
        ],
        "instruments": [
          "heavy 808s",
          "boom-bap drums",
          "dusty piano loop",
          "soul sample chops",
          "dark synth lead",
          "strings",
          "live bass"
        ]
      },
      "Gospel": {
        "themes": [
          "Praise & worship",
          "Testimony / what God brought me through",
          "Gratitude",
          "Faith through the storm",
          "Deliverance",
          "Celebration of His love",
          "For the congregation"
        ],
        "purposes": [
          "Worship / exalt",
          "Testify",
          "Lift the congregation",
          "Comfort in grief",
          "Celebrate",
          "Encourage / motivate",
          "Altar call"
        ],
        "instruments": [
          "Hammond organ",
          "grand piano",
          "full choir",
          "tambourine",
          "live bass",
          "gospel drums",
          "handclaps"
        ]
      },
      "Reggae": {
        "themes": [
          "One love / unity",
          "Sufferation & struggle",
          "Praise & spirituality",
          "Romance (lovers rock)",
          "Freedom & justice",
          "Celebration",
          "Missing someone",
          "Confidence & swagger",
          "Proving them wrong"
        ],
        "purposes": [
          "Uplift the people",
          "Protest",
          "Romance",
          "Slow dance",
          "Skank / dance",
          "Give thanks",
          "Party / celebrate",
          "Flex / celebrate"
        ],
        "instruments": [
          "one-drop drums",
          "skanking guitar",
          "organ bubble",
          "deep bass",
          "horns",
          "melodica"
        ]
      },
      "Afrobeats": {
        "themes": [
          "Celebration of life",
          "Love & desire",
          "Hustle & blessings",
          "Homeland pride",
          "Dance & good vibes",
          "Gratitude"
        ],
        "purposes": [
          "Dance",
          "Celebrate",
          "Romance",
          "Give thanks",
          "Summer anthem"
        ],
        "instruments": [
          "log drums",
          "talking drum",
          "shakers",
          "afro percussion",
          "warm synth keys",
          "guitar licks",
          "deep bass"
        ]
      },
      "Pop": {
        "themes": [
          "New love",
          "Heartbreak",
          "Self-empowerment",
          "Night out / freedom",
          "Nostalgia",
          "Friendship",
          "Missing someone"
        ],
        "purposes": [
          "Sing along",
          "Dance",
          "Cry it out",
          "Empower",
          "Celebrate",
          "Windows-down driving"
        ],
        "instruments": [
          "bright synths",
          "piano",
          "electric guitar",
          "punchy drums",
          "strings",
          "handclaps",
          "vocal stacks"
        ]
      },
      "Country": {
        "themes": [
          "Small-town life",
          "First love",
          "Heartbreak",
          "Family & faith",
          "Home & roots",
          "Losing someone",
          "Friday night"
        ],
        "purposes": [
          "Two-step / dance",
          "Cry in your beer",
          "Tell a story",
          "Celebrate",
          "Honor someone"
        ],
        "instruments": [
          "acoustic guitar",
          "fiddle",
          "pedal steel",
          "banjo",
          "upright bass",
          "brushed drums",
          "telecaster"
        ]
      },
      "Rock": {
        "themes": [
          "Rebellion",
          "Love & obsession",
          "Feeling like an outsider",
          "The road",
          "Standing back up",
          "Loss"
        ],
        "purposes": [
          "Anthem / fists up",
          "Raw energy",
          "Power ballad",
          "Drive music"
        ],
        "instruments": [
          "electric guitars",
          "live drums",
          "driving bass",
          "organ",
          "power chords",
          "feedback swells"
        ]
      },
      "Soul": {
        "themes": [
          "Devotion",
          "Heartache",
          "Pride & respect",
          "Longing",
          "Celebration of love",
          "Remembering someone"
        ],
        "purposes": [
          "Slow dance",
          "Testify my love",
          "Cry it out",
          "Celebrate"
        ],
        "instruments": [
          "horns",
          "Rhodes piano",
          "live bass",
          "tambourine",
          "organ",
          "strings",
          "backing trio"
        ]
      },
      "Blues": {
        "themes": [
          "Hard times",
          "Love done me wrong",
          "The road",
          "Regret & redemption",
          "Working for nothing"
        ],
        "purposes": [
          "Moan it out",
          "Shuffle / dance",
          "Tell it straight"
        ],
        "instruments": [
          "slide guitar",
          "harmonica",
          "upright bass",
          "brushed drums",
          "barrelhouse piano",
          "resonator guitar"
        ]
      },
      "Jazz": {
        "themes": [
          "Late-night romance",
          "City nights",
          "Longing",
          "Bittersweet memory",
          "New flame"
        ],
        "purposes": [
          "Slow burn",
          "Swing / dance",
          "Croon it close"
        ],
        "instruments": [
          "upright bass",
          "brushed drums",
          "piano trio",
          "muted trumpet",
          "tenor sax",
          "comping guitar"
        ]
      },
      "Folk": {
        "themes": [
          "Home & roots",
          "Protest & justice",
          "Plain-spoken love",
          "Passing time",
          "Nature & seasons",
          "A person's story"
        ],
        "purposes": [
          "Tell a story",
          "Protest",
          "Comfort",
          "Sing together"
        ],
        "instruments": [
          "acoustic guitar",
          "banjo",
          "fiddle",
          "mandolin",
          "harmonica",
          "upright bass"
        ]
      },
      "EDM": {
        "themes": [
          "Euphoria",
          "Lost in the night",
          "Freedom",
          "Love rush",
          "Letting go"
        ],
        "purposes": [
          "The drop / rave",
          "Festival anthem",
          "Sunrise chill"
        ],
        "instruments": [
          "supersaw synths",
          "sidechained bass",
          "four-on-the-floor kick",
          "plucks",
          "risers",
          "vocal chops"
        ]
      },
      "Metal": {
        "themes": [
          "Rage & defiance",
          "Inner demons",
          "War & darkness",
          "Betrayal",
          "Survival"
        ],
        "purposes": [
          "Mosh",
          "Scream it out",
          "Epic saga"
        ],
        "instruments": [
          "down-tuned guitars",
          "double-kick drums",
          "growling bass",
          "blast beats",
          "orchestral hits"
        ]
      }
    },
    "Spanish": {
      "Reggaet\xF3n": {
        "themes": [
          "Perreo y fiesta",
          "Deseo y calentura",
          "Desamor y superaci\xF3n",
          "Presumir y flexear",
          "La disco y la noche",
          "Amor t\xF3xico",
          "Lealtad al barrio",
          "Confianza y actitud"
        ],
        "purposes": [
          "Perrear",
          "Prender la disco",
          "Presumir",
          "Levantar el ego",
          "Conquistar",
          "Olvidar a alguien"
        ],
        "instruments": [
          "dembow",
          "sub bajo 808",
          "sintetizador oscuro",
          "hi-hats picados",
          "pads atmosf\xE9ricos",
          "efectos y vocal chops",
          "snare del dembow"
        ]
      },
      "Bachata": {
        "themes": [
          "Amor y desamor",
          "Traici\xF3n",
          "Nostalgia",
          "Borrachera de despecho",
          "Amor imposible",
          "Rogar y suplicar",
          "Celos",
          "Recuerdos de un amor"
        ],
        "purposes": [
          "Bailar pegado",
          "Llorar el despecho",
          "Dedicar a un amor",
          "Rogar que vuelva",
          "Desahogar la pena"
        ],
        "instruments": [
          "requinto",
          "guitarra r\xEDtmica",
          "bong\xF3",
          "g\xFCira",
          "bajo",
          "segunda guitarra",
          "maracas"
        ]
      },
      "Regional Mexicano": {
        "themes": [
          "La lucha y el trabajo",
          "El rancho y la tierra",
          "Lealtad y la palabra",
          "La frontera",
          "El corrido de un valiente",
          "Traici\xF3n y venganza",
          "Orgullo del pueblo",
          "La familia y la madre"
        ],
        "purposes": [
          "Contar una historia",
          "Honrar a alguien",
          "Presumir el logro",
          "Bailar en la fiesta",
          "Recordar al ausente",
          "Celebrar con la banda"
        ],
        "instruments": [
          "acorde\xF3n",
          "bajo sexto",
          "tuba",
          "tarola",
          "charcheta",
          "clarinete",
          "trompetas de banda"
        ]
      },
      "Salsa": {
        "themes": [
          "El barrio y la calle",
          "Romance caliente",
          "Celebraci\xF3n y rumba",
          "Orgullo latino",
          "Amor y enga\xF1o",
          "Nostalgia del que se fue",
          "Injusticia social",
          "Sabor y alegr\xEDa de vivir"
        ],
        "purposes": [
          "Bailar en la pista",
          "Celebrar la rumba",
          "Enamorar",
          "Recordar la tierra",
          "Encender la fiesta",
          "Contar la vida del barrio"
        ],
        "instruments": [
          "timbales",
          "congas",
          "bong\xF3",
          "piano montuno",
          "trompetas",
          "tromb\xF3n",
          "bajo tumbao",
          "campana"
        ]
      },
      "Cumbia": {
        "themes": [
          "El baile y la fiesta del pueblo",
          "Amor sencillo",
          "La cantina y el trago",
          "Nostalgia y migraci\xF3n",
          "Alegr\xEDa popular",
          "Desamor con sabor",
          "Orgullo del barrio",
          "La vida cotidiana"
        ],
        "purposes": [
          "Bailar en la fiesta",
          "Alegrar la reuni\xF3n",
          "Enamorar",
          "Cantar en la cantina",
          "Prender el bailongo"
        ],
        "instruments": [
          "acorde\xF3n",
          "guacharaca",
          "g\xFCira",
          "teclado tropical",
          "bajo",
          "congas",
          "timbal",
          "guitarra"
        ]
      },
      "Merengue": {
        "themes": [
          "Fiesta y desenfreno",
          "Amor y coqueteo",
          "Picard\xEDa y doble sentido",
          "Orgullo dominicano",
          "Desamor con humor",
          "La calle y el ambiente",
          "Celebraci\xF3n sin parar",
          "Sabrosura"
        ],
        "purposes": [
          "Bailar r\xE1pido",
          "Prender la fiesta",
          "Coquetear",
          "Re\xEDr y gozar",
          "Encender el ambiente"
        ],
        "instruments": [
          "tambora",
          "g\xFCira",
          "acorde\xF3n",
          "saxof\xF3n",
          "piano",
          "bajo",
          "metales"
        ]
      },
      "Vallenato": {
        "themes": [
          "Amor y despecho",
          "La tierra y el campo",
          "La parranda entre amigos",
          "Nostalgia del terru\xF1o",
          "Amor imposible",
          "La mujer que se fue",
          "Vivencias y an\xE9cdotas",
          "El r\xEDo y el pueblo"
        ],
        "purposes": [
          "Enamorar",
          "Parrandear con los amigos",
          "Llorar el desamor",
          "Contar una vivencia",
          "Recordar la tierra"
        ],
        "instruments": [
          "acorde\xF3n",
          "caja vallenata",
          "guacharaca",
          "bajo",
          "guitarra",
          "coros"
        ]
      },
      "Balada / Bolero": {
        "themes": [
          "Amor eterno",
          "Desamor y p\xE9rdida",
          "Nostalgia",
          "Amor prohibido",
          "Soledad",
          "Recuerdos de un gran amor",
          "Arrepentimiento",
          "Entrega total al amor"
        ],
        "purposes": [
          "Dedicar a un amor",
          "Llorar la p\xE9rdida",
          "Enamorar despacio",
          "Recordar a alguien",
          "Pedir perd\xF3n"
        ],
        "instruments": [
          "piano",
          "cuerdas",
          "guitarra espa\xF1ola",
          "requinto",
          "bajo",
          "contrabajo",
          "percusi\xF3n suave"
        ]
      },
      "Pop Latino": {
        "themes": [
          "Amor nuevo",
          "Desamor y superaci\xF3n",
          "Empoderamiento",
          "Amor de verano",
          "Nostalgia",
          "Amistad",
          "Sentirse libre",
          "Extra\xF1ar a alguien"
        ],
        "purposes": [
          "Cantar a coro",
          "Bailar",
          "Superar una ruptura",
          "Sentirse fuerte",
          "Celebrar",
          "Enamorar"
        ],
        "instruments": [
          "sintetizadores brillantes",
          "piano",
          "guitarra el\xE9ctrica",
          "bater\xEDa pop",
          "palmas",
          "percusi\xF3n latina",
          "coros"
        ]
      },
      "Latin Trap / Trap Latino": {
        "themes": [
          "La calle y el bloque",
          "Dinero y ambici\xF3n",
          "La lucha y el hambre",
          "Amor t\xF3xico",
          "Lealtad y traici\xF3n",
          "Presumir lo conseguido",
          "Desconfianza",
          "Vicios y noche"
        ],
        "purposes": [
          "Contar mi historia",
          "Flexear el logro",
          "Motivar al que lucha",
          "Encarar a alguien",
          "Desahogar la calle",
          "Prender el ambiente"
        ],
        "instruments": [
          "808 profundo",
          "hi-hats en tresillos",
          "sintetizador melanc\xF3lico",
          "pads oscuros",
          "efectos y ad-libs",
          "piano sombr\xEDo"
        ]
      },
      "Flamenco / Rumba": {
        "themes": [
          "El quej\xEDo y el dolor",
          "Amor y pasi\xF3n",
          "La fiesta y la juerga",
          "Orgullo y ra\xEDces",
          "Pena y desenga\xF1o",
          "Libertad",
          "La tierra y el pueblo",
          "La vida gitana"
        ],
        "purposes": [
          "Sentir el quej\xEDo",
          "Prender la fiesta",
          "Enamorar con arte",
          "Desahogar la pena",
          "Palmear y bailar"
        ],
        "instruments": [
          "guitarra flamenca",
          "palmas",
          "caj\xF3n",
          "casta\xF1uelas",
          "jaleo y coros",
          "bajo",
          "taconeo"
        ]
      },
      "Mariachi / Ranchera": {
        "themes": [
          "Amor y desamor",
          "Borrachera de despecho",
          "Orgullo mexicano",
          "La madre y la familia",
          "Traici\xF3n",
          "Nostalgia del pueblo",
          "Amor eterno",
          "Fuerza para seguir"
        ],
        "purposes": [
          "Cantar con el alma",
          "Dedicar a un amor",
          "Ahogar las penas",
          "Celebrar con mariachi",
          "Honrar a alguien",
          "Recordar la tierra"
        ],
        "instruments": [
          "trompetas",
          "violines",
          "vihuela",
          "guitarr\xF3n",
          "guitarra",
          "arpa"
        ]
      },
      "Corrido Tumbado": {
        "themes": [
          "La vida en la calle",
          "La lucha y el ascenso",
          "Lealtad y el clan",
          "Dinero y lujos",
          "Traici\xF3n",
          "Orgullo del barrio",
          "La frontera",
          "Adrenalina y riesgo"
        ],
        "purposes": [
          "Contar una historia",
          "Presumir el logro",
          "Honrar a los leales",
          "Encender la fiesta",
          "Motivar al que lucha",
          "Recordar de d\xF3nde vengo"
        ],
        "instruments": [
          "guitarra requinto",
          "bajo sexto",
          "tuba",
          "charcheta",
          "808 sutil",
          "guitarra ac\xFAstica"
        ]
      }
    },
    "French": {
      "Chanson Fran\xE7aise": {
        "themes": [
          "L'amour et ses vertiges",
          "La m\xE9lancolie et le spleen",
          "Paris et ses rues",
          "La condition humaine",
          "L'engagement et la r\xE9volte",
          "Le temps qui passe",
          "La nostalgie de l'enfance",
          "La libert\xE9",
          "Les gens ordinaires",
          "La mort et l'absence"
        ],
        "purposes": [
          "Raconter une histoire",
          "\xC9mouvoir jusqu aux larmes",
          "D\xE9noncer une injustice",
          "Rendre hommage \xE0 quelqu un",
          "Faire r\xE9fl\xE9chir",
          "Chanter la vie"
        ],
        "instruments": [
          "guitare s\xE8che",
          "piano",
          "accord\xE9on",
          "contrebasse",
          "cordes",
          "clarinette",
          "balais sur batterie"
        ]
      },
      "Vari\xE9t\xE9 Fran\xE7aise": {
        "themes": [
          "L'amour naissant",
          "La rupture",
          "Le souvenir",
          "La f\xEAte et l'insouciance",
          "L'\xE9t\xE9 et les vacances",
          "La famille",
          "Grandir et vieillir",
          "L'espoir malgr\xE9 tout"
        ],
        "purposes": [
          "Chanter en ch\u0153ur",
          "Danser",
          "Pleurer un chagrin",
          "C\xE9l\xE9brer",
          "R\xE9conforter",
          "Faire vibrer un stade"
        ],
        "instruments": [
          "piano",
          "synth\xE9",
          "guitare \xE9lectrique",
          "cordes",
          "batterie franche",
          "basse",
          "ch\u0153urs",
          "cuivres"
        ]
      },
      "Rap Fran\xE7ais": {
        "themes": [
          "La rue et le quartier",
          "La r\xE9ussite et l'ambition",
          "La famille et la m\xE8re",
          "Les origines et le pays",
          "L'injustice et le syst\xE8me",
          "La loyaut\xE9 et les vrais",
          "L'argent et la d\xE9brouille",
          "La foi",
          "Prouver aux autres",
          "Le deuil d'un fr\xE8re"
        ],
        "purposes": [
          "Raconter mon histoire",
          "Repr\xE9senter d'o\xF9 je viens",
          "Motiver ceux qui gal\xE8rent",
          "Clasher / r\xE9pondre",
          "Faire bouger la t\xEAte",
          "Rendre hommage \xE0 un disparu",
          "C\xE9l\xE9brer la r\xE9ussite"
        ],
        "instruments": [
          "808 lourdes",
          "bo\xEEte \xE0 rythmes trap",
          "sample soul",
          "piano sombre",
          "nappes de synth\xE9",
          "cordes",
          "basse profonde",
          "boom-bap"
        ]
      },
      "Zouk": {
        "themes": [
          "L'amour sensuel",
          "La s\xE9paration et le manque",
          "La f\xEAte et le carnaval",
          "Le pays natal et l'exil",
          "La femme aim\xE9e",
          "La douceur des \xEEles",
          "La jalousie",
          "La joie de vivre cr\xE9ole"
        ],
        "purposes": [
          "Danser coll\xE9",
          "S\xE9duire",
          "C\xE9l\xE9brer le pays",
          "Faire la f\xEAte",
          "Consoler un c\u0153ur bris\xE9",
          "Ambiancer la soir\xE9e"
        ],
        "instruments": [
          "ti-bwa",
          "tambour ka",
          "bo\xEEte \xE0 rythmes",
          "synth\xE9 chaud",
          "guitare rythmique",
          "basse ronde",
          "cuivres",
          "congas"
        ]
      },
      "Afro": {
        "themes": [
          "La f\xEAte et l'ambiance",
          "L'amour et le d\xE9sir",
          "La d\xE9brouille et les b\xE9n\xE9dictions",
          "La fiert\xE9 du continent",
          "La femme",
          "La r\xE9ussite",
          "Danser jusqu au bout de la nuit",
          "La joie communicative"
        ],
        "purposes": [
          "Danser",
          "Ambiancer le dancefloor",
          "S\xE9duire",
          "C\xE9l\xE9brer",
          "Remercier Dieu",
          "Faire l'anth\xE8me de l'\xE9t\xE9"
        ],
        "instruments": [
          "percussions afro",
          "djemb\xE9",
          "shakers",
          "guitare highlife",
          "synth\xE9 chaud",
          "basse profonde",
          "bo\xEEte \xE0 rythmes",
          "congas"
        ]
      },
      "Ra\xEF": {
        "themes": [
          "L'amour interdit",
          "La douleur et la solitude",
          "L'exil et le bled",
          "La libert\xE9",
          "La f\xEAte et l'ivresse",
          "Le destin et la vie dure",
          "La nostalgie du pays",
          "La jeunesse"
        ],
        "purposes": [
          "Danser",
          "Vider son c\u0153ur",
          "C\xE9l\xE9brer un mariage",
          "Faire la f\xEAte",
          "Chanter l'amour impossible",
          "Ambiancer"
        ],
        "instruments": [
          "derbouka",
          "synth\xE9 oriental",
          "accord\xE9on",
          "guembri",
          "violon",
          "bo\xEEte \xE0 rythmes",
          "guitare",
          "cuivres"
        ]
      },
      "Ballade Fran\xE7aise": {
        "themes": [
          "L'amour profond",
          "Le manque de l'\xEAtre aim\xE9",
          "La rupture et le regret",
          "Le souvenir tendre",
          "La promesse",
          "La solitude",
          "Le pardon",
          "L'espoir d'un retour"
        ],
        "purposes": [
          "\xC9mouvoir jusqu aux larmes",
          "D\xE9clarer sa flamme",
          "Danser un slow",
          "Consoler",
          "Rendre hommage"
        ],
        "instruments": [
          "piano",
          "cordes",
          "guitare s\xE8che",
          "nappes de synth\xE9",
          "basse douce",
          "batterie feutr\xE9e",
          "violoncelle"
        ]
      },
      "French Touch": {
        "themes": [
          "L'euphorie de la nuit",
          "L'amour \xE9lectrique",
          "La libert\xE9",
          "La nostalgie douce",
          "Se perdre dans la f\xEAte",
          "Le rush du dancefloor",
          "Paris la nuit"
        ],
        "purposes": [
          "Danser toute la nuit",
          "Faire l'anth\xE8me de club",
          "Planer au lever du soleil",
          "Se l\xE2cher",
          "Ambiancer un festival"
        ],
        "instruments": [
          "synth\xE9s filtr\xE9s",
          "basse funky",
          "bo\xEEte \xE0 rythmes house",
          "nappes analogiques",
          "samples disco",
          "vocoder",
          "claps",
          "four-on-the-floor"
        ]
      },
      "Slam": {
        "themes": [
          "La condition humaine",
          "L'injustice sociale",
          "Les origines et l'identit\xE9",
          "La ville et ses oubli\xE9s",
          "L'amour et la perte",
          "L'enfance",
          "La r\xE9volte",
          "La qu\xEAte de sens"
        ],
        "purposes": [
          "Faire passer un message",
          "\xC9mouvoir",
          "D\xE9noncer",
          "Raconter une histoire vraie",
          "Faire r\xE9fl\xE9chir",
          "Poser des mots sur un silence"
        ],
        "instruments": [
          "piano",
          "contrebasse",
          "guitare s\xE8che",
          "nappes discr\xE8tes",
          "percussions l\xE9g\xE8res",
          "violoncelle",
          "ambiances feutr\xE9es"
        ]
      },
      "RnB Fran\xE7ais": {
        "themes": [
          "L'amour naissant",
          "L'amour compliqu\xE9",
          "Le manque et la distance",
          "La sensualit\xE9",
          "La trahison",
          "La nuit et les sentiments",
          "Grandir et s'affirmer",
          "La famille"
        ],
        "purposes": [
          "Danser un slow",
          "S\xE9duire",
          "Vider son c\u0153ur",
          "Se sentir compris",
          "Ambiancer la nuit",
          "Reconqu\xE9rir quelqu un"
        ],
        "instruments": [
          "claviers doux",
          "808 sub-bass",
          "Rhodes",
          "nappes de synth\xE9",
          "guitare feutr\xE9e",
          "cordes",
          "bo\xEEte \xE0 rythmes",
          "basse live"
        ]
      },
      "Musette": {
        "themes": [
          "Paris et ses guinguettes",
          "L'amour d'autrefois",
          "La nostalgie",
          "Le bal et la valse",
          "Les amours de bistrot",
          "La joie populaire",
          "Le souvenir des anciens"
        ],
        "purposes": [
          "Danser la valse",
          "Faire tourner le bal",
          "\xC9mouvoir avec nostalgie",
          "C\xE9l\xE9brer une f\xEAte",
          "Rassembler les g\xE9n\xE9rations"
        ],
        "instruments": [
          "accord\xE9on",
          "guitare manouche",
          "contrebasse",
          "banjo",
          "violon",
          "clarinette",
          "piano"
        ]
      }
    },
    "Portuguese": {
      "MPB": {
        "themes": [
          "Amor maduro e cotidiano",
          "O Brasil e sua gente",
          "Saudade e passagem do tempo",
          "Poesia do dia a dia",
          "Cr\xEDtica social e esperan\xE7a",
          "Mar, sol e paisagem",
          "Reencontro e despedida",
          "Mem\xF3ria e ra\xEDzes",
          "Beleza nas pequenas coisas",
          "A vida como ela \xE9"
        ],
        "purposes": [
          "Emocionar e fazer pensar",
          "Cantar junto de viol\xE3o",
          "Homenagear algu\xE9m",
          "Dizer uma verdade com delicadeza",
          "Celebrar a vida",
          "Consolar"
        ],
        "instruments": [
          "viol\xE3o",
          "piano",
          "cordas",
          "flauta",
          "percuss\xE3o brasileira",
          "contrabaixo ac\xFAstico",
          "sopros suaves",
          "voz e coro"
        ]
      },
      "Bossa Nova": {
        "themes": [
          "Saudade serena",
          "O amor tranquilo",
          "O mar e a orla do Rio",
          "A garota que passa",
          "Fim de tarde e melancolia doce",
          "Desejo contido",
          "Sofistica\xE7\xE3o e intimidade",
          "A beleza discreta"
        ],
        "purposes": [
          "Sussurrar bem de perto",
          "Dan\xE7a a dois lenta",
          "Embalar um fim de noite",
          "Seduzir com suavidade",
          "Acalmar o cora\xE7\xE3o"
        ],
        "instruments": [
          "viol\xE3o de nylon",
          "piano",
          "contrabaixo ac\xFAstico",
          "bateria com vassourinhas",
          "flauta",
          "saxofone suave",
          "voz sussurrada"
        ]
      },
      "Sertanejo": {
        "themes": [
          "Amor sofrido",
          "A mod\xE3o e a dor de cotovelo",
          "A ro\xE7a e a viola",
          "Cerveja e desilus\xE3o",
          "O pe\xE3o e a estrada",
          "Trai\xE7\xE3o e saudade",
          "Balada e paquera na festa",
          "Homenagem \xE0 m\xE3e e \xE0 terra",
          "Supera\xE7\xE3o depois do fim"
        ],
        "purposes": [
          "Chorar as m\xE1goas",
          "Dan\xE7ar agarradinho",
          "Beber e esquecer",
          "Cantar no karaok\xEA com os amigos",
          "Declarar um amor",
          "Animar o rodeio"
        ],
        "instruments": [
          "viola caipira",
          "viol\xE3o",
          "sanfona",
          "acorde\xE3o",
          "contrabaixo",
          "bateria",
          "teclado",
          "guitarra"
        ]
      },
      "Samba": {
        "themes": [
          "Alegria apesar da vida",
          "Malandragem e ginga",
          "Amor e ci\xFAme",
          "O botequim e a roda",
          "Saudade do que ficou",
          "Orgulho do samba e do morro",
          "F\xE9 e agradecimento",
          "A batucada da comunidade",
          "Resist\xEAncia com sorriso no rosto"
        ],
        "purposes": [
          "Fazer sambar",
          "Levantar a roda",
          "Celebrar em grupo",
          "Chorar de saudade sorrindo",
          "Homenagear o samba e seus mestres",
          "Animar o boteco"
        ],
        "instruments": [
          "cavaquinho",
          "pandeiro",
          "surdo",
          "tant\xE3",
          "cu\xEDca",
          "viol\xE3o de sete cordas",
          "tamborim",
          "agog\xF4"
        ]
      },
      "Pagode": {
        "themes": [
          "Amor apaixonado",
          "O churrasco e a resenha",
          "Cora\xE7\xE3o partido",
          "Paquera e desejo",
          "Amizade e roda de amigos",
          "Saudade da antiga",
          "Reconcilia\xE7\xE3o",
          "Curti\xE7\xE3o de fim de semana",
          "Ci\xFAme e volta por cima"
        ],
        "purposes": [
          "Animar o churrasco",
          "Dan\xE7ar coladinho",
          "Cantar com a galera",
          "Chorar um t\xE9rmino",
          "Paquerar na festa",
          "Celebrar a amizade"
        ],
        "instruments": [
          "cavaquinho",
          "banjo",
          "pandeiro",
          "tant\xE3",
          "repique de m\xE3o",
          "viol\xE3o",
          "surdo",
          "teclado"
        ]
      },
      "Funk Carioca": {
        "themes": [
          "O baile e a pista",
          "A quebrada e a favela",
          "Ostenta\xE7\xE3o e conquista",
          "Desejo e sensualidade",
          "F\xE9 e agradecimento a Deus",
          "Supera\xE7\xE3o da comunidade",
          "Poder feminino e atitude",
          "A vida na correria",
          "Orgulho de onde vim"
        ],
        "purposes": [
          "Botar pra quebrar no baile",
          "Rebolar e dan\xE7ar",
          "Ostentar e celebrar",
          "Provocar e seduzir",
          "Contar a realidade da rua",
          "Dar volta por cima"
        ],
        "instruments": [
          "batida de funk",
          "tamborz\xE3o",
          "808 grave",
          "beat eletr\xF4nico",
          "sintetizador",
          "sample vocal",
          "percuss\xE3o eletr\xF4nica"
        ]
      },
      "Forr\xF3": {
        "themes": [
          "Amor e paix\xE3o nordestina",
          "Saudade do sert\xE3o e da terra natal",
          "O S\xE3o Jo\xE3o e a fogueira",
          "Namoro no arraial",
          "A seca e a esperan\xE7a de chuva",
          "A vida do sertanejo",
          "Reencontro depois da dist\xE2ncia",
          "Alegria do Nordeste"
        ],
        "purposes": [
          "Dan\xE7ar colado o forr\xF3",
          "Animar o S\xE3o Jo\xE3o",
          "Matar a saudade da terra",
          "Namorar no arrasta-p\xE9",
          "Celebrar o Nordeste",
          "Aquecer a festa junina"
        ],
        "instruments": [
          "sanfona",
          "zabumba",
          "tri\xE2ngulo",
          "acorde\xE3o",
          "contrabaixo",
          "viol\xE3o",
          "rabeca",
          "p\xEDfano"
        ]
      },
      "Pop Brasileiro": {
        "themes": [
          "Amor novo e paix\xE3o",
          "Supera\xE7\xE3o e autoestima",
          "Noite e liberdade",
          "Cora\xE7\xE3o partido",
          "Amizade e juventude",
          "Saudade de algu\xE9m",
          "Empoderamento e brilho pr\xF3prio"
        ],
        "purposes": [
          "Cantar junto",
          "Dan\xE7ar",
          "Chorar e superar",
          "Empoderar",
          "Celebrar",
          "Curtir de janela aberta"
        ],
        "instruments": [
          "sintetizadores brilhantes",
          "piano",
          "guitarra",
          "bateria marcante",
          "cordas",
          "palmas",
          "camadas de voz",
          "contrabaixo"
        ]
      },
      "Ax\xE9": {
        "themes": [
          "Alegria da Bahia",
          "Carnaval e folia",
          "Amor de ver\xE3o",
          "Sensualidade e dan\xE7a",
          "Orgulho baiano e afro",
          "Curti\xE7\xE3o no bloco",
          "Energia e liberdade",
          "Celebra\xE7\xE3o da vida"
        ],
        "purposes": [
          "Pular o Carnaval",
          "Dan\xE7ar sem parar",
          "Levantar o bloco",
          "Animar o ver\xE3o",
          "Celebrar a Bahia",
          "Contagiar a multid\xE3o"
        ],
        "instruments": [
          "guitarra baiana",
          "timbau",
          "surdo",
          "percuss\xE3o afro",
          "agog\xF4",
          "sopros",
          "repique",
          "teclado"
        ]
      },
      "Piseiro / Arrocha": {
        "themes": [
          "Amor sofrido e trai\xE7\xE3o",
          "Balada e bebedeira",
          "Paquera e sofr\xEAncia",
          "Cora\xE7\xE3o partido de novo",
          "Curti\xE7\xE3o na vaquejada",
          "Volta por cima com atitude",
          "Saudade misturada com festa",
          "Desejo e reconcilia\xE7\xE3o"
        ],
        "purposes": [
          "Dan\xE7ar agarradinho",
          "Beber e chorar a sofr\xEAncia",
          "Animar o pared\xE3o",
          "Cantar com os amigos na farra",
          "Esquecer um amor",
          "Levantar a vaquejada"
        ],
        "instruments": [
          "teclado de piseiro",
          "sintetizador",
          "acorde\xE3o eletr\xF4nico",
          "batida eletr\xF4nica",
          "contrabaixo",
          "groovebox",
          "percuss\xE3o"
        ]
      },
      "Fado": {
        "themes": [
          "Saudade e destino",
          "Lisboa e o Tejo",
          "O fado da vida e a sina",
          "Amor perdido e aus\xEAncia",
          "Melancolia e alma portuguesa",
          "O mar e a partida",
          "Tradi\xE7\xE3o e mem\xF3ria",
          "Dor de um adeus"
        ],
        "purposes": [
          "Cantar a saudade",
          "Emocionar at\xE9 as l\xE1grimas",
          "Contar a sina de uma vida",
          "Homenagear Lisboa e os que partiram",
          "Recolher a alma",
          "Confessar uma dor"
        ],
        "instruments": [
          "guitarra portuguesa",
          "viola de fado",
          "viol\xE3o",
          "contrabaixo ac\xFAstico",
          "viola baixo",
          "voz solo"
        ]
      },
      "Kizomba": {
        "themes": [
          "Amor sensual e apaixonado",
          "Saudade de quem se ama",
          "O abra\xE7o e o corpo colado",
          "Desejo e ternura",
          "Aus\xEAncia e dist\xE2ncia",
          "Reconcilia\xE7\xE3o",
          "Noite quente e romance",
          "Alma de Angola e Cabo Verde"
        ],
        "purposes": [
          "Dan\xE7ar bem colado",
          "Seduzir com carinho",
          "Embalar a noite rom\xE2ntica",
          "Matar a saudade do amor",
          "Aquecer um encontro",
          "Declarar paix\xE3o"
        ],
        "instruments": [
          "guitarra",
          "sintetizador suave",
          "baixo marcante",
          "percuss\xE3o africana",
          "teclado",
          "batida de kizomba",
          "caixa de ritmo"
        ]
      }
    }
  },
  "core": `What a song IS, and the job of every section

A song is a felt emotion delivered through structure, repetition, and melody over time.
Sections are not labels; they are jobs:

- **Intro** \u2014 sets the world in seconds; earns the first verse.
- **Verse** \u2014 the SUBSTANCE; where the story is told. Each verse adds new information (verse 2
  is never verse 1 reworded) and must be **at least as long as the chorus, usually longer** \u2014 a
  song whose verses are shorter than its chorus has starved itself of meaning. Build the verse;
  earn the chorus.
- **Pre-Chorus** \u2014 builds tension; the ramp that makes the chorus feel inevitable.
- **Chorus** \u2014 the emotional thesis. It must LIFT (energy, melody, simplicity). It repeats because it's true every time.
- **Bridge** \u2014 the turn: a new angle, a confession, a decision. The song must be different after it.
- **Outro** \u2014 lands the plane; the emotional residue the listener leaves with.

(Genre note: repetition-driven traditions bend these jobs on purpose \u2014 praise & worship,
Afrobeats, and some soul and pop rooms may replace "verse 2 adds new information" with
deepened repetition, and "the chorus lifts" with accumulation \u2014 the same words returning
hotter each time. As with point of view, the genre's tradition wins over the default rule,
and each sub-genre page says when that bend applies.)

Creative writing craft

- **Song purpose** \u2014 every song exists FOR something: to make people dance, testify, cry, feel seen,
  ride with the windows down, worship, flirt. The purpose shapes every choice (tempo of the words,
  subject, how personal it gets). The app must know a song's purpose before writing line one.
- **Point of view** \u2014 who is speaking, to whom, and why now. First person confessing? Second person
  confronting ("you did this")? Third person telling someone's story? Pick one and make the addressee
  real \u2014 a song to a specific person beats a song to the air. (Genre note: some traditions pivot POV
  on purpose \u2014 gospel moves from testimony "I" in the verse to congregational "we/You" in the chorus.
  The genre's tradition wins over the consistency rule.)
- **Creative writing devices \u2014 used with skill:**
  - Metaphors and similes that are fresh and physically true (never decoration for its own sake)
  - Entendres and **double entendres** \u2014 lines that mean two things at once, both intended
    (a hallmark of great R&B and hip-hop writing; must land naturally, never announced)
  - Wordplay, flips, and reversals \u2014 saying the expected thing the unexpected way
  - **Extended metaphor** \u2014 develop the ONE central image across the whole song into a system,
    not just a repeated object: a warning becomes "colorblind" becomes "red all over you"; a
    pressure becomes "caged," "walls," "can't breathe." The strongest songs work a single picture
    every way it turns.
  - Personification, allusion \u2014 sparingly, where the genre welcomes them
- Voice: a real person is speaking; one point of view with an attitude.
- Show and tell in balance: images earn feelings; plain spoken lines make them land. Neither alone.
- **Originality** \u2014 the non-negotiable: no house formulas of ANY kind (no greeting-card affirmations,
  no "inventory of objects the ex left behind" template, no borrowed hooks from famous songs).
  If two users with different stories could receive the same song, the writing has failed.
- **The concrete-image law (checked by code).** Every song is built around ONE real thing you
  could photograph \u2014 an object, a place, a physical action. Feelings attach to that thing; they
  never float free. A song made only of weather and abstraction is the greeting-card failure.
  A central image built only from the words below is rejected and re-planned (founder-editable):
  - **abstraction words (never a central image on their own):** love, heart, soul, spirit, light,
    dark, darkness, shadow, shade, color, colors, colour, sky, sun, sunlight, moon, star, stars,
    distance, space, time, memory, memories, dream, dreams, goodbye, forever, fire, flame, spark,
    gravity, ocean, sea, wave, waves, storm, rain, pieces, piece, fade, drift, glow, shine, light,
    silence, echo, horizon, wings, chains, walls, road, journey, feeling, feelings, emotion, magic,
    destiny, fate, eternity, universe, stardust, moment, moments, whisper, breath
- Emotional truth: write the specific feeling, not the category ("the ache of hearing they moved on
  from a mutual friend" \u2014 not "sadness").

Musical craft (the founder's list; each becomes concrete rules)

- **Writing for melody** \u2014 open vowels (ah/oh/ay) on notes that hold or peak; avoid consonant pileups where the voice needs to move; end key lines on singable syllables. **Chorus lines must be metrically parallel** \u2014 matching syllable counts and stress patterns across the repeated lines \u2014 this one rule does more for melody than any other.
- **Syncopation** \u2014 leave rhythmic room; lyrics should invite pushing/pulling against the beat, especially in R&B/hip-hop phrasing.
- **Rhythm** \u2014 the words carry their own drum pattern; scan lines aloud; stressed syllables should land where the beat wants them.
- **Dynamics** \u2014 write sections at different intensities: conversational verse, building pre, wide-open chorus, intimate bridge.
- **Cadence** \u2014 control where phrases resolve vs hang; use hanging lines to pull the listener forward, resolving lines to close thoughts.
- **Musicality** \u2014 the sum test: read it aloud \u2014 does it already want to be sung?
- **Word choice** \u2014 words have sound-color; match the mouth-feel to the feeling (percussive words for anger, humming/open words for longing); prefer words a singer can act.
- **House-style words \u2014 instant failures.** These are the AI's default phrases; they belong
  to no one's story, so using one fails the song (checked by code). The founder owns this
  list and can edit it like everything else:
  - hearts entwined; two hearts beat as one; beat of my heart; beat inside my heart
  - shadows flicker; shadows dance; silhouette; neon
  - you complete me; my missing piece; meant to be; written in the stars
  - more than words can say; words can't express; honest truth
  - forever and always; till the end of time; take my breath away
  - moth to a flame; fire in my veins; electricity between us; gravity pulls
  - love like ours; heart on my sleeve; lose me too
  - light up my; you light up; shining like the city; screaming out
  - can't get enough; new addiction; live it up; my best; ride this riot
- **Hook** \u2014 short, rhythmic, emotionally loaded, placed at the lift; the title lives here; a listener can sing it after one listen. In R&B and hip-hop, the hook is where the double entendre or flipped phrase pays rent \u2014 a hook that means two things beats a sincere flat one.
- **Rhyme** \u2014 a choice, not a duty: perfect rhyme closes a thought, slant rhyme keeps it moving, internal rhyme builds momentum (rap's engine), and NO rhyme is a legitimate choice when the honest line matters more. Rhyme density is a genre decision, never a fixed rule.
- **Emotion** \u2014 every craft decision above serves ONE core feeling with an arc (where it starts \u2192 where it turns \u2192 where it lands).`,
  "bannedPhrases": [
    "hearts entwined",
    "two hearts beat as one",
    "beat of my heart",
    "beat inside my heart",
    "shadows flicker",
    "shadows dance",
    "silhouette",
    "neon",
    "you complete me",
    "my missing piece",
    "meant to be",
    "written in the stars",
    "more than words can say",
    "words can't express",
    "honest truth",
    "forever and always",
    "till the end of time",
    "take my breath away",
    "moth to a flame",
    "fire in my veins",
    "electricity between us",
    "gravity pulls",
    "love like ours",
    "heart on my sleeve",
    "lose me too",
    "light up my",
    "you light up",
    "shining like the city",
    "screaming out",
    "can't get enough",
    "new addiction",
    "live it up",
    "my best",
    "ride this riot"
  ],
  "abstractionWords": [
    "love",
    "heart",
    "soul",
    "spirit",
    "light",
    "dark",
    "darkness",
    "shadow",
    "shade",
    "color",
    "colors",
    "colour",
    "sky",
    "sun",
    "sunlight",
    "moon",
    "star",
    "stars",
    "distance",
    "space",
    "time",
    "memory",
    "memories",
    "dream",
    "dreams",
    "goodbye",
    "forever",
    "fire",
    "flame",
    "spark",
    "gravity",
    "ocean",
    "sea",
    "wave",
    "waves",
    "storm",
    "rain",
    "pieces",
    "piece",
    "fade",
    "drift",
    "glow",
    "shine",
    "silence",
    "echo",
    "horizon",
    "wings",
    "chains",
    "walls",
    "road",
    "journey",
    "feeling",
    "feelings",
    "emotion",
    "magic",
    "destiny",
    "fate",
    "eternity",
    "universe",
    "stardust",
    "moment",
    "moments",
    "whisper"
  ],
  "validTags": [
    "[Intro]",
    "[Verse]",
    "[Pre-Chorus]",
    "[Chorus]",
    "[Post-Chorus]",
    "[Hook]",
    "[Refrain]",
    "[Bridge]",
    "[Break]",
    "[Breakdown]",
    "[Interlude]",
    "[Outro]",
    "[Instrumental]",
    "[Ad-Lib Section]",
    "[Male Vocal]",
    "[Female Vocal]",
    "[Duet]",
    "[Choir]",
    "[Whispered]",
    "[Spoken]",
    "[Belting]",
    "[Falsetto]",
    "[Crooning]",
    "[Harmonies]",
    "[Vocal Run]",
    "[Call and Response]",
    "[Choir enters]",
    "[Build]",
    "[Build Up]",
    "[Drop]",
    "[Crescendo]",
    "[Big Finish]",
    "[Soft]",
    "[Quiet]",
    "[Guitar Solo]",
    "[Piano Solo]",
    "[Sax Solo]",
    "[Bass Solo]",
    "[Instrumental Break]",
    "[Instrumental Bridge]",
    "[Instrumental Intro]",
    "[Instrumental Outro]",
    "[Vamp]",
    "[Outro Vamp]",
    "[Final Vamp]",
    "[Guitar Riff]",
    "[Vocal Runs]",
    "[Runs]",
    "[Groove]"
  ],
  "genres": {
    "rnb": {
      "id": "rnb",
      "name": "R&B",
      "aliases": [
        "r&b",
        "rnb",
        "r and b",
        "randb",
        "rhythm and blues"
      ],
      "profileText": "An R&B writer starts with who the song is spoken to. R&B is intimate by trade: the song is almost always aimed at one real person \u2014 a lover, an ex, a spouse, sometimes the narrator's own self \u2014 and every line should survive being said to that person's face. First person is the home position: one voice, one person, right now. Some rooms bend the tense or widen the address \u2014 to family, to spirit, to everybody listening \u2014 but somebody real is always on the receiving end.\n\nPhrasing works the way people talk when they finally say the true thing: conversational sentences, not slogans. The genre's most important habit is leaving room \u2014 the voice is the lead instrument, and the words must get out of its way. Key lines like to end on open vowels the voice can hold and bend. Where the space goes is the room's call: some rooms stop lines early for runs, some leave long instrumental pockets, some leave one beat for an echoed word. A lyric that leaves no space anywhere \u2014 no line end, no bar, no section \u2014 has already failed as R&B.\n\nRhyme runs on a spectrum. In some rooms, slant rhymes \u2014 words that almost rhyme \u2014 and vowel echoes are the everyday tools, and a too-perfect rhyme reads as fake; in others, clean simple rhyme is the tradition and reads as timeless. The room sets that dial. The genre-wide law is smaller and firmer: the honest word outranks the rhyming word, every time.\n\nThis genre is the home of the double entendre \u2014 one line that means two things at once, both meanings intended, neither announced. When the user's story offers a true second meaning, use it; where it lands \u2014 the hook, an opening line, or an image carried across the song \u2014 is the room's and the story's call. A fully sincere song with no second meaning is just as much R&B. Flips \u2014 the expected phrase said the unexpected way \u2014 are welcome anywhere. Metaphors must be physically true and built from the user's own details, never decoration. Sensuality and vulnerability are the genre's twin subjects, and both work the same way: say the specific true thing plainly, and never announce that a moment is sexy or sad.\n\nVerses talk and choruses lift \u2014 or, in some rooms, circle and deepen \u2014 and the lift is melodic and emotional, not automatically loud. Plan ad-lib room \u2014 answers, echoes, hums \u2014 and let the room say where it sits. Many rooms end on a vamp: a short section, usually the chorus, repeating while the lead sings freely over it. Whether a song vamps is the room's call; when it does, the chorus words must be simple and true enough to survive the repeats. The bridge is where the song changes \u2014 in many rooms the guard drops there, in others it is the turn in the story; the room decides.\n\nRendering, in any room, protects three things. Space: instruments leave air; a wall of sound kills intimacy. The voice up front: lead vocal close and human, background vocals treated as their own instrument \u2014 stacks, answers, echoes \u2014 with ad-libs written as sounds and delivery notes (hums, calls, breath), never slang. The pocket: a warm low end and a groove the phrasing was written to sit on. Every dial above bends to the user's story; none of it may ever change what the song is about.",
      "defaultRoomId": "contemporary-rnb",
      "rooms": [
        {
          "id": "contemporary-rnb",
          "name": "Contemporary R&B",
          "oneLine": "Today's mainstream R&B \u2014 diary-honest, melodic, streaming-era songs that feel like a late-night text thread set to music.",
          "tempoGroove": "65\u2013105 BPM. Ballads sit 65\u201380 with half-time drums; mid-tempos ride 90\u2013105 with a light bounce. Word density is moderate and conversational \u2014 phrases the length of spoken sentences with natural pauses, never packed bars.",
          "writingDials": [
            "Phrasing runs conversational and uneven on purpose \u2014 a line can spill past the bar like real speech, then the next one stops short; too-perfect symmetry reads as fake in this style.",
            "Rhyme stays loose: slant rhyme and vowel echoes over perfect rhyme; a perfectly rhymed four-line block sounds like a greeting card here, where it would sound right in Classic Soul.",
            "Vulnerability is the default register \u2014 flaws, jealousy, and mixed feelings get said plainly; sensuality shows up as honesty about wanting someone, not as seduction talk.",
            "Write what the user would text: specific, present-tense, small details pulled from their actual story (the place, the time of night, the exact habit) beat poetic images every time.",
            "Leave ad-lib space at line ends and behind the hook \u2014 keep the main line short enough that an answer vocal can echo or comment underneath it.",
            "The double entendre lives in the hook and plays it casual \u2014 one phrase that reads as love and self-worth at once, dropped without being announced.",
            "POV: present tense \u2014 the song sounds like it is being said tonight, not remembered from years away.",
            "Choruses lift melodically but stay low-key \u2014 a raised refrain, not a belted anthem; the bridge often drops to near-spoken honesty, the most naked moment of the song."
          ],
          "rendering": "Warm sparse keys or a clean electric guitar loop over sub-heavy 808 bass, with soft half-time snares and plenty of air between elements. Lead vocal close-miked and intimate, stacked harmonies arriving on the hook, answer ad-libs tucked behind the lead. Modern polish with light vocal effects \u2014 a 2010s-to-now sheen, never busy.",
          "storyFit": "Best for real, messy, current relationship stories \u2014 situationships, self-worth after a breakup, healing, wanting someone you shouldn't, complicated love told honestly. Serves badly: formal tributes, whole-life story songs, weddings that want grandeur, or anything needing big-band ceremony.",
          "parodyTraps": "Over-singing every line instead of talking some of them; pet-name filler and stock compliments instead of the user's actual details; tidy nursery rhymes; announcing the sexy or sad part instead of just saying the true thing; filling the space that should stay empty for ad-libs.",
          "performance": {
            "prose": "Density sparse; min adlibs 4; delivery tags [Harmonies] [Spoken] [Soft] [Falsetto] [Crooning]. This room performs like a late-night text thread set to music \u2014 one intimate lead talking as much as singing, so bracket tags stay light and the adlibs do the emotional work. Signature: A quiet answer vocal tucked in parentheses under the end of a lead line \u2014 echoing or gently commenting on the last few words the way a lover would murmur back over a text thread, never a full-voiced group response. Placement: The floor of 4 is reachable without ever filling the empty space the writing leaves: roughly 2 under the hook, 1 at a verse line-end, and 1 in a short repeated-hook outro tag. Tag identity: a solo modern voice \u2014 texty echo doubles at line ends, a labeled (background: soft oohs) on the hook, an occasional (spoken: quiet aside) on its own line. No choir, no crowd \u2014 the room is one person and their own layered voice.",
            "adlibDensity": "sparse",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Harmonies]",
              "[Spoken]",
              "[Soft]",
              "[Falsetto]",
              "[Crooning]"
            ]
          },
          "builder": {
            "instruments": [
              "soft keys",
              "clean electric guitar loop",
              "808 sub-bass",
              "half-time drums",
              "airy pads",
              "light strings"
            ],
            "themes": [
              "New love",
              "Deep love / devotion",
              "Complicated love",
              "Heartbreak / letting go",
              "Missing someone",
              "Growth / proving myself"
            ],
            "purposes": [
              "Make them feel seen",
              "Say what I never said",
              "Win them back",
              "Slow dance",
              "Bring happy tears"
            ]
          }
        },
        {
          "id": "90s-rnb",
          "name": "90s R&B",
          "oneLine": "The golden-era sound \u2014 big stacked harmonies, hip-hop drums under grown love songs, and choruses built to be belted by a group.",
          "tempoGroove": "Ballads 60\u201376 BPM with heavy swung sixteenth-notes (the fast notes lean long-short instead of even); hip-hop-soul mid-tempos high-80s to mid-100s over a boom-bap backbeat (the snare cracking on beats 2 and 4 \u2014 classic head-nod hip-hop drums); new-jack-swing uptempos (the late-80s style that put hip-hop drums under R&B songs) roughly 104\u2013116 with a hard bounce. Word density low-to-moderate in verses; choruses are short and endlessly repeatable.",
          "writingDials": [
            "The chorus is an anthem: short, declarative, metrically parallel lines (matching syllable counts and stresses) built for group harmony \u2014 this is the one sibling where the chorus must survive four voices belting it at once.",
            "Verses are pleading and direct \u2014 full sentences of devotion, apology, or desire aimed straight at the person; less irony and more open commitment than any other R&B sub-genre.",
            "Run-room is a writing job: end key lines on open vowels and leave the last beat or two of the bar empty so the lead can run; a syllable-packed line ending kills the style. This is the firewall against Classic Soul: 90s verses are full conversational sentences that stop early to leave room for runs, where Classic Soul verses are short stress-locked lines punched right on the beat.",
            "Rhyme lands tidier than modern R&B \u2014 end rhymes hit more reliably \u2014 but the honest word still outranks the rhyming one.",
            "Sensuality is confident and stated (grown and unashamed) while vulnerability's natural home is the bridge \u2014 the begging, the confession, the admission of fault usually lands there; but if the user's story IS the confession, the story wins and the whole song can carry it.",
            "Call-and-response is structural, not decoration: write lead lines that a background stack can answer, and plan a repeated end-vamp (the chorus loops while the lead sings freely over it).",
            "Double entendres go bolder here \u2014 the slow-jam tradition lets one physical image carry the song's second meaning, planted in verse one and paid off in the hook.",
            "POV: full sincerity, no detached narration \u2014 and the address stays locked on that one person to the last note; it never widens to the room the way Classic Soul does."
          ],
          "rendering": "Boom-bap or live-feel drums under lush keys (Rhodes warmth, bell-tone synths), real moving bass lines, and big stacked background harmonies treated as their own instrument. Gospel-trained lead vocal upfront with runs at phrase ends, church-flavored chord changes, and an extended outro vamp \u2014 a late-80s-through-90s radio warmth throughout (the new-jack-swing option sits at the earlier end of that window).",
          "storyFit": "Best for devotion, weddings, apologies, winning somebody back, grown committed romance, and friend-group anthems that want harmony and lift. Serves badly: detached or ironic stories, guarded narrators, and minimal lo-fi moods \u2014 this style cannot keep its heart hidden.",
          "parodyTraps": "Cramming in dated pet names and 90s slang the user never wrote (the era lives in the chords and harmonies, not the vocabulary); turning every single line into a run cue; choruses that are paragraphs instead of chants; wearing the decade as a costume instead of writing sincere devotion.",
          "performance": {
            "prose": "Density heavy; min adlibs 8; delivery tags [Call and Response] [Harmonies] [Vocal Run] [Belting] [Ad-Lib Section] [Choir enters]. This is the loudest, most vocally crowded room in R&B, so it leans hardest on adlibs and backing-vocal tags of all the siblings. Signature: A four-voice backing stack belting a chant-simple, metrically parallel chorus together while answering the lead line for line under the verses \u2014 a call-and-response conversation with the address locked on one person, opening into a final vamp where the whole stack holds the chorus and the lead runs freely over the top. Placement: Structure tags ([Verse], [Chorus], [Bridge]) go bare on their own lines. Tag identity: a lead with a 3\u20134 voice backing stack that answers line-for-line \u2014 (background: echo of the last words) everywhere, written call-and-response blocks with line-start Lead: and (response) pairs, group belt on the final chorus, run cues at phrase ends. The stack is a character in the song.",
            "adlibDensity": "heavy",
            "minAdlibs": 8,
            "deliveryTags": [
              "[Call and Response]",
              "[Harmonies]",
              "[Vocal Run]",
              "[Belting]",
              "[Ad-Lib Section]",
              "[Choir enters]"
            ]
          },
          "builder": {
            "instruments": [
              "boom-bap drums",
              "Rhodes keys",
              "bell-tone synths",
              "live bass",
              "gospel-voiced piano",
              "new-jack-swing drum machine"
            ],
            "themes": [
              "Deep love / devotion",
              "New love",
              "Missing someone",
              "Complicated love",
              "Celebration / milestone"
            ],
            "purposes": [
              "Win them back",
              "Slow dance",
              "Party / celebrate",
              "Bring happy tears",
              "Make them feel seen"
            ]
          }
        },
        {
          "id": "2000s-rnb",
          "name": "2000s R&B",
          "oneLine": "The turn-of-the-millennium sound \u2014 glossy production and dramatic story-songs where one star voice narrates the night everything changed.",
          "tempoGroove": "Ballads 60\u201380 BPM with big dramatic peaks; mid-tempos 88\u2013105 over crisp programmed drums with a smooth head-nod bounce; club-leaning uptempos up to about 115. Word density moderate-to-high in verses \u2014 full narrative sentences that fill the bar \u2014 then choruses tighten into short, clean, resolving lines.",
          "writingDials": [
            "Verses tell a story in order \u2014 set the scene, then the event, then the fallout; verse two advances the plot like a second act. No sibling narrates like this: Contemporary confesses present-tense feelings, 90s pleads straight at the person.",
            "The chorus is one clean, complete statement of the situation, sung by a single star voice \u2014 tidier than Contemporary's loose refrain, but never built for the four-voice group belt of 90s R&B.",
            "Drama is allowed to peak theatrically \u2014 the ultimatum, the discovery, the confession said out loud \u2014 where Contemporary would underplay it and Quiet Storm would forbid it.",
            "Run-room serves one show-off voice: leave open line-endings at the emotional peaks for a solo run; background vocals echo the lead's words instead of answering them \u2014 the opposite of 90s call-and-response.",
            "Rhyme resolves at line ends more reliably than Contemporary because the narrative wants closure, but stays looser than Classic Soul's clean perfect rhymes.",
            "The bridge is the plot twist: the reveal, the decision, the thing the listener didn't know yet \u2014 not just a deeper feeling.",
            "POV: often starts in past tense telling what happened, then flips to present at the hook where the feeling lands now \u2014 the only sibling where past-tense storytelling is the default."
          ],
          "rendering": "Glossy programmed drums with crisp snares, plush keys or plucked string-like synth lines, deep polished bass, dramatic string or choir pads at the peaks. One star lead vocal front and center with confident runs and doubled hooks, background vocals echoing the lead rather than answering it \u2014 an early-2000s radio shine, glossier than 90s warmth, fuller than trap-soul's empty space.",
          "storyFit": "Best for stories with a plot: a confession, a confrontation, a dramatic apology, the night everything changed, a breakup with actual events in it. Serves badly: quiet contentment, meditative growth stories, and whisper-close intimacy \u2014 this style needs something to happen.",
          "parodyTraps": "Era props (flip phones, club scenes, the other woman) the user never gave; melodrama with no real event underneath it; over-running every line instead of saving runs for the peaks; letting the era's stock plots swallow the user's actual story.",
          "performance": {
            "prose": "Density moderate; min adlibs 5; delivery tags [Vocal Run] [Falsetto] [Crescendo] [Big Finish]. This room performs like a solo star narrating the night everything changed, so nearly all the vocal texture bends around one lead voice. Signature: At the emotional peak, the single star voice breaks into a solo run over the doubled hook while the backgrounds echo its last word behind it \u2014 one voice showing off, never a group trading lines. Placement: Verses stay bare and story-forward \u2014 set the scene, the event, the fallout with almost no adlibs so the narrative reads clean; at most a single echoed last-word under the line that ends the scene. Tag identity: one star voice with backgrounds that ECHO the lead's own words at the peaks (never answer with new words), a dramatic pulled-back bridge header, and a solo run cue before the final chorus. Theatrical, single-spotlight tagging.",
            "adlibDensity": "moderate",
            "minAdlibs": 5,
            "deliveryTags": [
              "[Vocal Run]",
              "[Falsetto]",
              "[Crescendo]",
              "[Big Finish]"
            ]
          },
          "builder": {
            "instruments": [
              "glossy programmed drums",
              "plush keys",
              "deep polished bass",
              "string and choir pads",
              "plucked synth lines"
            ],
            "themes": [
              "Complicated love",
              "Heartbreak / letting go",
              "New love",
              "Deep love / devotion"
            ],
            "purposes": [
              "Say what I never said",
              "Win them back",
              "Slow dance",
              "Make them feel seen"
            ]
          }
        },
        {
          "id": "neo-soul",
          "name": "Neo-Soul",
          "oneLine": "Loose, live, poetic soul \u2014 jazz chords, behind-the-beat grooves, and lyrics that read like spoken poetry about love and self.",
          "tempoGroove": "60\u201395 BPM with a heavily behind-the-beat, slightly drunken swing \u2014 the drums drag on purpose and the voice floats over the bar line. Word density is flexible: lines can be talky and dense or stretch one thought across four bars; either way the phrasing never sits squarely on the grid.",
          "writingDials": [
            "Phrasing is elastic: start lines late, let them cross bar lines, resolve where natural speech would resolve \u2014 write for a singer who treats the beat as a suggestion, the opposite of Classic Soul's on-the-beat punch.",
            "Imagery does the heavy lifting \u2014 abstract feelings must become physical pictures (a place, a body, a meal, weather from the user's world) \u2014 but every image must be built from the user's own story details, never pulled from the genre's stock shelf; this is the most metaphor-rich of all the siblings.",
            "The subject widens past romance: self-knowledge, spirit, community, growth \u2014 a neo-soul love song is always also about who the narrator is becoming.",
            "Rhyme is optional and mostly internal \u2014 vowel sounds inside the lines carry the musicality; forced end-rhyme flattens the poetry and marks the writer as an outsider.",
            "Sensuality is slow-burn and adult, carried through metaphor rather than statement; vulnerability sounds like meditation, not confession or begging.",
            "Repetition works as mantra: a phrase returns with small changes until it deepens \u2014 choruses are allowed to circle rather than lift, unlike every other sibling.",
            "Write fewer words than feel necessary and leave long instrumental pockets \u2014 the band, the hum, and the silence are co-writers.",
            "The double entendre is a spirit/body twin \u2014 one image that means both the lover and the higher thing, sustained rather than punchlined."
          ],
          "rendering": "Fender Rhodes with extended jazz chords, warm live bass, dusty in-the-pocket drums that drag a hair behind, muted guitar licks, optional horns. Vocals layered loose and human \u2014 hummed ad-libs, spoken asides, minimal pitch correction \u2014 with a late-90s/early-2000s organic, analog warmth and room to breathe.",
          "storyFit": "Best for reflective stories \u2014 personal growth, self-love, gratitude, long-term love seen from altitude, roots and family lineage, spiritual searching. Serves badly: urgent drama, petty conflict, club energy, or any story that needs to move fast and hit hard on the beat.",
          "parodyTraps": "Fake-deep word salad with no concrete story underneath; mystical props stacked up as decoration; imitating vocal scatting or filler syllables on the page; poeticness with zero specific detail from the user's actual life \u2014 the poetry must be built FROM their story, not draped over it.",
          "performance": {
            "prose": "Density moderate; min adlibs 5; delivery tags [Crooning] [Spoken] [Vocal Run] [Instrumental Break] [Soft]. Neo-Soul performs loose and human, not staged. Signature: The closing vamp circles as a flat mantra instead of building \u2014 the chorus phrase repeats with small changes at the SAME dynamic level top to bottom while hums, a spoken aside, and a drifting (not peak) [Vocal Run] wander over a long instrumental pocket. Placement: The adlib floor is back-heavy: most of the required adlibs live in the closing vamp, verses get at most one, and the bridge is near-zero \u2014 a loaded outro over near-empty verses is what makes this room, not echoes sprinkled evenly under every hook (that is the Contemporary pattern). Tag identity: a loose live room \u2014 hummed (mmm) drifting anywhere in a line (start, middle, end), (spoken: low observation) asides on their own lines, instrumental-breathing headers where the band talks. Human, unquantized, nobody performing AT anyone.",
            "adlibDensity": "moderate",
            "minAdlibs": 5,
            "deliveryTags": [
              "[Crooning]",
              "[Spoken]",
              "[Vocal Run]",
              "[Instrumental Break]",
              "[Soft]"
            ]
          },
          "builder": {
            "instruments": [
              "Fender Rhodes",
              "in-the-pocket live drums",
              "warm bass",
              "muted guitar",
              "horns",
              "Wurlitzer"
            ],
            "themes": [
              "Growth / proving myself",
              "Faith / gratitude",
              "Deep love / devotion",
              "Family",
              "Remembering someone"
            ],
            "purposes": [
              "Make them feel seen",
              "Testify / give thanks",
              "Bring happy tears",
              "Slow dance"
            ]
          }
        },
        {
          "id": "trap-soul",
          "name": "Trap-Soul / Alt-R&B",
          "oneLine": "Moody late-night R&B over trap drums \u2014 short melodic phrases, blunt honesty, atmosphere over polish.",
          "tempoGroove": "Felt tempo 60\u201380 BPM in half-time (often written 120\u2013160 with rolling hi-hats doubling and tripling above the slow snare). Word density is the lowest-per-bar of the modern siblings: short clipped phrases with real dead air between them, and heavy repetition doing melodic work.",
          "writingDials": [
            "Phrases run short and clipped \u2014 roughly three to seven words, dropped like texts, each followed by space; long flowing sentences break the style instantly.",
            "Repetition IS the hook: one blunt phrase repeated with small melodic variation beats a clever constructed chorus \u2014 write the one line that can loop and mean more each pass.",
            "The register is numb-honest: desire, guilt, distrust, and pride sit side by side without apology; vulnerability gets admitted flatly, never dramatized \u2014 the coolness of delivery is itself the feeling.",
            "Verses slide between singing and rhythmic talk \u2014 write lines that work equally well spoken and sung, because the performer will blur the two.",
            "Rhyme leans rap-adjacent: internal rhyme, repeated end-words, and identical-word line endings are idiomatic here, not lazy \u2014 where 90s R&B would call that a miss.",
            "Double entendres are street-smart and casual \u2014 money/love flips, city/person flips \u2014 dropped in passing, often in an opening line rather than saved for the hook, and never explained.",
            "POV: guard up \u2014 the narrator states how things are more than how they hurt; the address is direct but keeps emotional distance.",
            "Ad-libs are punctuation, not runs: plan single echo words and short tags after lines; long vocal runs are rare, and tone carries what runs would carry elsewhere.",
            "Cross-genre firewall: hip-hop's Melodic Rap and gospel's urban/trap room run the same drums and tempo as this one \u2014 the dial that makes it Trap-Soul is the guard staying up, feelings admitted flatly instead of sung as an open ache or told as a testimony."
          ],
          "rendering": "Dark ambient pads and detuned keys over a booming 808 sub, crisp trap hi-hats rolling in double and triple time, half-time snare. Vocals sit in reverb and delay with a subtle Auto-Tune color, doubled hooks, and murmured background ad-libs \u2014 a 2015-to-now nocturnal palette, minimal and spacious.",
          "storyFit": "Best for situationships, late-night regret, mixed feelings, ambition tangled with love, guarded hearts, and stories the user tells in blunt fragments. Serves badly: weddings, tributes to parents, joyful celebration, wholesome family stories, or any narrator who wants to sound fully open-hearted.",
          "parodyTraps": "Forcing designer brands, substances, or city clich\xE9s the user never gave; over-singing \u2014 this style murmurs, it does not run; rhyming too neatly; letting the narrator gush emotionally when the style's whole identity is the guard staying up; cramming words into space that must stay empty.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Whispered] [Spoken] [Soft] [Crooning]. This room performs by murmur, not by run. Signature: A single doubled voice murmuring an echo of its own last word \u2014 the same phrase looping while a low ad-lib breathes back at the end of each pass, tone carrying the feeling instead of a run. Placement: Two placements, kept strictly apart so a writer never confuses them: bracket meta tags ([Spoken], [Whispered], [Soft]) only ever sit on their own line before a section, never mid-line and never inside a phrase; parenthetical adlibs only ever sit at a phrase END, in parentheses, never mid-line and never inside the dead air the writing protects. Tag identity: the lead's OWN voice doubling single murmured words at line ends \u2014 never a choir, never a crowd; a whispered header where the guard drops, emphasis carried by a stretched word (lo-ove) or a held last word, not by answers.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Whispered]",
              "[Spoken]",
              "[Soft]",
              "[Crooning]"
            ]
          },
          "builder": {
            "instruments": [
              "dark ambient pads",
              "detuned keys",
              "booming 808 sub",
              "rolling trap hi-hats",
              "sparse guitar loop"
            ],
            "themes": [
              "Complicated love",
              "Heartbreak / letting go",
              "Missing someone",
              "Growth / proving myself"
            ],
            "purposes": [
              "Say what I never said",
              "Make them feel seen"
            ]
          }
        },
        {
          "id": "quiet-storm",
          "name": "Quiet Storm / Slow Jam",
          "oneLine": "The grown-and-slow late-night ballad \u2014 candlelight tempo, patient phrasing, romance treated like fine dining.",
          "tempoGroove": "Felt tempo roughly 50\u201380 BPM, straight or gently swung, sometimes in 6/8 (a rolling, waltz-like sway); some grooves are written faster but sway in half-time. Word density is the lowest of all siblings \u2014 every line gets room to bloom, and the words move at speaking-to-one-person pace.",
          "writingDials": [
            "Patience is the craft: one idea per section, unhurried \u2014 a verse may spend four lines setting a single scene; rushing the words is the cardinal sin of this style.",
            "Address is intimate second person at whisper distance \u2014 the song is written for an audience of one, in the room, tonight, and every line should survive being said that close.",
            "Sensuality is adult and elegant \u2014 suggestion over statement; the double entendre here is velvet: one ordinary domestic or natural image that turns romantic on the second listen and sustains across the whole song.",
            "Every style wants singable vowels, but none holds notes as long as this one \u2014 so word choice is stricter here than in any sibling: long open vowels on the held notes, soft consonants throughout, lines that stay beautiful at half volume.",
            "Vulnerability is devotional \u2014 gratitude, promise, cherishing \u2014 not wound-airing; if conflict appears at all, it resolves inside the song.",
            "The climax is a vamp (the chorus loops while the lead climbs freely over it), not a bigger chorus: plan a final stretch where the chorus repeats and the lead ascends \u2014 so the chorus words must be simple enough to survive twenty repeats.",
            "Rhyme lands soft and optional; a gently placed slant rhyme suits the mood better than the snap of a perfect one.",
            "No hype interjections or energy filler anywhere \u2014 elegance is the register from first line to last, which no other sibling demands this strictly."
          ],
          "rendering": "Silky electric piano with soft strings or warm synth pads, gentle drums with a rimshot snare (brushed or softly programmed), round smooth bass, optional saxophone or muted guitar. Lead vocal velvet and close-miked, restraint throughout, with the tasteful runs saved for the final vamp \u2014 mid-70s-through-90s adult late-night radio warmth.",
          "storyFit": "Best for anniversaries, long marriages, proposals, devoted grown romance, and songs sung to a spouse or lifelong partner. Serves badly: breakups in progress, anger, casual flings, group anthems, or stories that need modern slang energy and pace.",
          "parodyTraps": "Running the seduction-clich\xE9 checklist (wine, fireplace, silk) instead of using the couple's real details; breathy overacting; letting the words rush ahead of the tempo; getting explicit \u2014 this style seduces by implication only; treating the genre as a wink or a skit instead of full sincerity.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Soft] [Crooning] [Falsetto] [Sax Solo] [Vocal Run] [Harmonies]. This room performs by holding back. Signature: The final chorus becomes a vamp that stays close-miked and solo: the simple chorus words loop while one lead voice ascends over the top \u2014 climbing into falsetto and spending its saved-up tasteful runs \u2014 without ever raising the room's volume, without a background trio answering, without a group belt. Placement: Intro and verses stay almost bare \u2014 no run cues, at most a single soft hummed or breathed adlib tucked under a line where a lover would sigh; keep the pre-chorus bare too so the lift is felt, not announced. Tag identity: near-silence as a choice \u2014 at most a single breathed hum under a line, held last words marked with trailing dots, soft harmonies arriving only on the final chorus, and ONE closing vamp header where the lead finally climbs over the looping words. Tags whisper here.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Soft]",
              "[Crooning]",
              "[Falsetto]",
              "[Sax Solo]",
              "[Vocal Run]",
              "[Harmonies]"
            ]
          },
          "builder": {
            "instruments": [
              "silky electric piano",
              "soft strings",
              "brushed rimshot drums",
              "round smooth bass",
              "saxophone",
              "muted guitar"
            ],
            "themes": [
              "Deep love / devotion",
              "Celebration / milestone"
            ],
            "purposes": [
              "Slow dance",
              "Bring happy tears",
              "Make them feel seen"
            ]
          }
        },
        {
          "id": "classic-soul",
          "name": "Classic Soul / Motown",
          "oneLine": "The 60s-70s foundation \u2014 church-born voices, live bands, and plainspoken songs that hit like testimony.",
          "tempoGroove": "Uptempo Motown-style grooves roughly 100\u2013130 BPM with a driving backbeat and tambourine; southern-soul ballads 55\u201380, often in a slow 6/8 sway. Words sit ON the beat more than any sibling \u2014 punchy, symmetrical phrases whose stressed syllables lock to the backbeat; density moderate and even.",
          "writingDials": [
            "Plain words, big feelings: the vocabulary stays simple and universal; the craft lives in stress placement and escalating repetition, not in clever wordplay \u2014 the opposite bet from Neo-Soul.",
            "Lines land on the beat \u2014 write tight, symmetrical phrases whose stressed syllables hit where the snare hits, short enough for a horn section to punch between them; where 90s R&B writes longer conversational sentences that stop early to leave run-room, Classic Soul locks the words to the beat itself.",
            "Call-and-response with the background voices is written into the lyric: plan short answer phrases and echo hooks for the backing trio in both verse and chorus.",
            "The register is testimony \u2014 love sworn, lost, or begged for at full voice and full sincerity; irony, guardedness, and cool detachment do not exist in this style.",
            "Repetition escalates: the same chorus words return hotter each time, and the outro repeats the hook while the lead preaches and improvises over it.",
            "The double entendre is the church/love twin \u2014 the beloved described in near-worship language so one lyric serves both the altar and the bedroom, a tradition carried straight from gospel roots. This is also what separates the room from gospel's quartet lane: Classic Soul is secular love and celebration that borrows worship language, where Quartet-Style's engine is God's act inside a narrated story \u2014 scenes, a drive, an anchor phrase.",
            "Rhyme is clean and confident \u2014 simple perfect rhymes are idiomatic here and read as timeless, where the same rhymes would read as childish in Contemporary R&B.",
            "POV: full voice, testimony register \u2014 and unlike 90s R&B, the address is allowed to widen from one person to everybody listening by the final chorus, testimony becoming celebration."
          ],
          "rendering": "A live rhythm section \u2014 real drums, electric bass, chanking rhythm guitar (short choppy strums right on the beat), piano or organ \u2014 with horn stabs and string sweetening; tambourine on the backbeat for uptempo numbers. Raw, gospel-fired lead vocal with a background trio answering; 1960s-70s analog warmth, real room sound, no modern vocal effects.",
          "storyFit": "Best for tributes, milestone celebrations, songs for parents and grandparents, timeless full-hearted declarations of love, and joyful dance-along family songs. Serves badly: modern situationship nuance, guarded or ironic narrators, minimal lo-fi moods, and stories that hinge on texting-era details.",
          "parodyTraps": "Fake-vintage slang and era name-dropping \u2014 the period lives in the band, the chords, and the phrasing, never in the vocabulary; over-sweetening into jingle territory; wordy verses a horn section cannot punch around; imitation-oldies pastiche instead of sincere testimony built from the user's story.",
          "performance": {
            "prose": "Density heavy; min adlibs 7; delivery tags [Call and Response] [Belting] [Harmonies] [Vocal Run] [Big Finish] [Instrumental Break]. This room performs like a live band with a backing trio in the room, so it leans on adlibs harder than most siblings and on delivery tags moderately. Signature: The outro becomes a hook-loop vamp where the backing trio holds the repeated hook and the lead preaches freely over the top \u2014 but the move that most says this room is that the address opens up here: what began as testimony sung to one person widens into celebration sung to the whole room, so the vamp lands as a crowd lifting the hook, not one voice still fixed on one person. Placement: Verses carry real trio answers, not just chorus ones: short on-beat parenthetical responses and echoed line-ends, kept punchy so the words stay locked to the backbeat. Tag identity: church-born and communal \u2014 a backing trio's (response phrases) written after the lead's calls, line-start Lead: and (CROWD: response) blocks at the crown moment, handclap and live-room headers, and an outro hook-loop vamp with the lead preaching over it. The room itself sings.",
            "adlibDensity": "heavy",
            "minAdlibs": 7,
            "deliveryTags": [
              "[Call and Response]",
              "[Belting]",
              "[Harmonies]",
              "[Vocal Run]",
              "[Big Finish]",
              "[Instrumental Break]"
            ]
          },
          "builder": {
            "instruments": [
              "live rhythm section",
              "horn stabs",
              "tambourine on the backbeat",
              "organ",
              "chanking rhythm guitar",
              "strings"
            ],
            "themes": [
              "Celebration / milestone",
              "Family",
              "Deep love / devotion",
              "Remembering someone",
              "Faith / gratitude"
            ],
            "purposes": [
              "Party / celebrate",
              "Bring happy tears",
              "Testify / give thanks",
              "Slow dance",
              "Win them back"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "situationship",
          "strength": "weak",
          "roomId": "contemporary-rnb"
        },
        {
          "cue": "messy",
          "strength": "weak",
          "roomId": "contemporary-rnb"
        },
        {
          "cue": "jealous",
          "strength": "weak",
          "roomId": "contemporary-rnb"
        },
        {
          "cue": "healing",
          "strength": "weak",
          "roomId": "contemporary-rnb"
        },
        {
          "cue": "self-worth",
          "strength": "weak",
          "roomId": "contemporary-rnb"
        },
        {
          "cue": "not official",
          "strength": "weak",
          "roomId": "contemporary-rnb"
        },
        {
          "cue": "wedding",
          "strength": "weak",
          "roomId": "90s-rnb"
        },
        {
          "cue": "win her back",
          "strength": "strong",
          "roomId": "90s-rnb"
        },
        {
          "cue": "win him back",
          "strength": "strong",
          "roomId": "90s-rnb"
        },
        {
          "cue": "win them back",
          "strength": "strong",
          "roomId": "90s-rnb"
        },
        {
          "cue": "apology",
          "strength": "weak",
          "roomId": "90s-rnb"
        },
        {
          "cue": "90s",
          "strength": "strong",
          "roomId": "90s-rnb"
        },
        {
          "cue": "new jack swing",
          "strength": "strong",
          "roomId": "90s-rnb"
        },
        {
          "cue": "sing along",
          "strength": "weak",
          "roomId": "90s-rnb"
        },
        {
          "cue": "harmony",
          "strength": "weak",
          "roomId": "90s-rnb"
        },
        {
          "cue": "harmonies",
          "strength": "weak",
          "roomId": "90s-rnb"
        },
        {
          "cue": "2000s",
          "strength": "strong",
          "roomId": "2000s-rnb"
        },
        {
          "cue": "cheated",
          "strength": "weak",
          "roomId": "2000s-rnb"
        },
        {
          "cue": "cheating",
          "strength": "weak",
          "roomId": "2000s-rnb"
        },
        {
          "cue": "confrontation",
          "strength": "weak",
          "roomId": "2000s-rnb"
        },
        {
          "cue": "confession",
          "strength": "weak",
          "roomId": "2000s-rnb"
        },
        {
          "cue": "found out",
          "strength": "weak",
          "roomId": "2000s-rnb"
        },
        {
          "cue": "caught him",
          "strength": "weak",
          "roomId": "2000s-rnb"
        },
        {
          "cue": "caught her",
          "strength": "weak",
          "roomId": "2000s-rnb"
        },
        {
          "cue": "caught them",
          "strength": "weak",
          "roomId": "2000s-rnb"
        },
        {
          "cue": "self-discovery",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "who i'm becoming",
          "strength": "strong",
          "roomId": "neo-soul"
        },
        {
          "cue": "who i am becoming",
          "strength": "strong",
          "roomId": "neo-soul"
        },
        {
          "cue": "finding myself",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "growth",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "spirit",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "grateful",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "gratitude",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "guard up",
          "strength": "strong",
          "roomId": "trap-soul"
        },
        {
          "cue": "guarded",
          "strength": "weak",
          "roomId": "trap-soul"
        },
        {
          "cue": "late night",
          "strength": "weak",
          "roomId": "trap-soul"
        },
        {
          "cue": "regret",
          "strength": "weak",
          "roomId": "trap-soul"
        },
        {
          "cue": "ambition",
          "strength": "weak",
          "roomId": "trap-soul"
        },
        {
          "cue": "pride",
          "strength": "weak",
          "roomId": "trap-soul"
        },
        {
          "cue": "anniversary",
          "strength": "strong",
          "roomId": "quiet-storm"
        },
        {
          "cue": "propose",
          "strength": "strong",
          "roomId": "quiet-storm"
        },
        {
          "cue": "proposal",
          "strength": "strong",
          "roomId": "quiet-storm"
        },
        {
          "cue": "slow jam",
          "strength": "strong",
          "roomId": "quiet-storm"
        },
        {
          "cue": "my wife",
          "strength": "weak",
          "roomId": "quiet-storm"
        },
        {
          "cue": "my husband",
          "strength": "weak",
          "roomId": "quiet-storm"
        },
        {
          "cue": "spouse",
          "strength": "weak",
          "roomId": "quiet-storm"
        },
        {
          "cue": "years together",
          "strength": "weak",
          "roomId": "quiet-storm"
        },
        {
          "cue": "motown",
          "strength": "strong",
          "roomId": "classic-soul"
        },
        {
          "cue": "old school",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "tribute",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "throwback",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "milestone",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "grandparents",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "grandma",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "grandpa",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "grandfather",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "for my parents",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "mom and dad",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "80s",
          "strength": "weak",
          "roomId": "classic-soul"
        }
      ]
    },
    "hiphop": {
      "id": "hiphop",
      "name": "Hip-Hop",
      "aliases": [
        "hip hop",
        "hiphop",
        "hip-hop",
        "rap"
      ],
      "profileText": "A hip-hop writer thinks in bars. A bar is one measure of drums plus the words that ride it \u2014 the unit of thought, the way the sentence is for prose. Before line one the writer picks a flow: how many syllables sit on the bar, where they cluster, where they stop, which syllable stomps the snare. The same sentence can become a boom-bap punchline, a trap burst, or a sung phrase depending on how it rides \u2014 flow, not subject, is what separates the rooms. Every line takes the read-aloud test against its drums: if the stresses land nowhere, it is a poem, not a rap.\n\nThe verse is the star. Sixteen bars is the standard verse and the hook usually runs eight or less, so the meaning lives in the verses. Every verse must earn its bars: a new angle, new information, the story moved forward \u2014 verse two is never verse one reworded. The hook's job is smaller and exact: state the thesis in a form a listener can carry, then reset the room. Whether it is chanted, sung, talk-sung, scratched, or nearly absent is the room's call.\n\nInternal rhyme is the engine, and density is a dial. Rhymes inside the line, not just at its end, give rap its motor. One room chains multi-syllable internals and changes the sound every few bars; another rides one vowel sound for eight bars and hammers repeated end-words; another wants easy rhymes that sound like talking. Slant rhyme is everyday equipment everywhere. The genre-wide law is smaller and firmer: the honest word outranks the rhyming word, and a sentence bent to reach a rhyme has it backwards.\n\nWordplay is the genre's signature intelligence. The flip \u2014 the expected thing said the unexpected way \u2014 the double meaning with both meanings intended, the punchline built on a setup bar: all home equipment here. Where cleverness lives is the room's call \u2014 in one room it is the meal, in most it is seasoning \u2014 but the manner is a law: never announced, never explained. Every flip is built from the user's own details; a borrowed punchline is theft, a generic one is worse.\n\nCadence is dynamics. A hip-hop writer switches flows the way other genres change chords \u2014 tighten as tension rises, drop to half speed for the line that matters, flip the pattern at the turn. The writing also plans its own performance: gaps between phrases are written on purpose, because that is where the ad-lib cast lives, and the cast is a room decision \u2014 one room doubles its own punchlines, one is trailed by its own ad-lib track, one gets a crew's cold echo, one hands half the record to a shouting crowd. A writer who fills every gap has erased the second performer.\n\nWhat disqualifies is the same list in every room: words with no relationship to the drums; starved verses under an oversized hook; identity worn as a costume. Slang, accents, place names, menace, or street content the user never wrote is the loudest parody in the genre \u2014 rhythm and cadence carry the identity in the user's own plain language. And a lyric two different users could both receive \u2014 stock flexes, brand lists, off-the-shelf struggle \u2014 has failed before the beat drops.",
      "defaultRoomId": "trap",
      "rooms": [
        {
          "id": "boom-bap",
          "name": "Boom-Bap",
          "oneLine": "The classic 90s sound: dusty drums, dense clever bars, and skill on display \u2014 hip-hop that rewards close listening.",
          "tempoGroove": "85-95 BPM. Slightly swung head-nod pocket; the kick and snare are the whole conversation and the stressed rhyme word of each bar lands square on the snare. Word density is high \u2014 roughly 10-14 syllables per bar, nearly every beat carries a word.",
          "writingDials": [
            "Flow decision: the one constant is that the stressed rhyme word lands on the snare. Sentences are free to run across the bar line \u2014 the great 90s writers did this constantly \u2014 but every bar should still be quotable on its own, a punchline that can stand alone. That quotability is what separates boom-bap from conscious rap, where sentences chain across bars to serve the plot.",
            "Rhyme engine: dense multi-syllable rhyme, including internal rhyme (rhymes inside the line, not just at the end). Chain two or three rhyming syllables at a time, and change the rhyme sound every 2-4 bars so it never becomes a typewriter.",
            "Wordplay placement: this is the sub-genre where flips, double meanings, and punchlines live in the VERSE, roughly one clever turn every 2-4 bars \u2014 setup bar, payoff bar. In the siblings, cleverness is seasoning; here it is the meal.",
            "Hook treatment: small and functional. A short chanted refrain, a repeated phrase with a cut-up scratched-record feel, or no sung hook at all \u2014 the verses are the star and the hook just resets the room.",
            "Section shape: 16-bar verses are standard, two or three of them. No pre-chorus, rarely a bridge. Each verse must open a new angle on the story \u2014 same subject, new camera position.",
            "Subject treatment: everyday concrete detail is the currency \u2014 the block, the job, the small specific moments of the user's story told with wit. Skill itself is allowed to be part of the subject: the writing can visibly enjoy being good.",
            "Vocal space: almost none needed. No melody room and no big ad-lib gaps \u2014 the bar is full; the only planned space is the tail of a punchline bar, where the writer marks which rhyme word gets doubled."
          ],
          "rendering": "Dusty chopped soul or jazz sample as the main melody, thick swung kick-and-snare break with vinyl crackle, deep upright-style or filtered bassline. DJ scratches and record cuts can act as the hook. 85-95 BPM, raw close-mic rap vocal with no pitch tuning, small room feel, 90s East Coast character. Keep the beat loop-based and let it ride \u2014 no big drops or builds.",
          "storyFit": "Best for witty roasts, skill-flex tributes, nostalgia stories, day-in-the-life narratives, odes to a craft or a city, users who say real hip-hop or name 90s artists. Serves badly: tender love songs and grief (the density crowds the feeling out), party songs meant for dancing (the pocket nods heads, it does not move hips), and anything that needs a big singable chorus.",
          "parodyTraps": "Forced 90s slang the user never wrote; rhyming every single syllable until the meaning dies; fake New York references for a user from somewhere else; generic nostalgia filler instead of the user's actual story; tough-guy content the story does not contain. Boom-bap parody sounds like a rhyme robot \u2014 real boom-bap sounds like a sharp person talking in rhythm.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Spoken] [Break] [Instrumental Break] [Groove]. This room performs like one MC and a DJ in a small room \u2014 the voice stays dry and upfront, the beat never stops nodding, and the DJ is the second performer, so the tags lean on breaks and cuts instead of vocal effects. Signature: the lead doubling its own last rhyme word \u2014 a tight second track landing with the snare on the punchline bars, plus one short hype echo at the hand-off between verses. Placement: doubles go only on the bars that earn them, roughly one every four bars at most, and the hook slot can be an [Instrumental Break] header where the DJ cuts and scratches a phrase instead of anyone singing; everywhere else the bar stays full and bare. Tag identity: one MC plus their own double-track, with the DJ treated as an instrument \u2014 (echo of the rhyme word) doubles on punchlines, a single short (yeah) or (uh) at section turns, scratch-hook headers. No crew, no crowd, no singing stack \u2014 skill does not need backup.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Spoken]",
              "[Break]",
              "[Instrumental Break]",
              "[Groove]"
            ]
          },
          "builder": {
            "instruments": [
              "dusty soul sample chops",
              "swung boom-bap drum break",
              "vinyl crackle",
              "filtered upright-style bass",
              "DJ scratches",
              "dusty piano loop"
            ],
            "themes": [
              "Where I'm from",
              "The come-up / hustle",
              "Proving them wrong",
              "Celebration / flexing"
            ],
            "purposes": [
              "Tell my story",
              "Flex / celebrate",
              "Call somebody out"
            ]
          }
        },
        {
          "id": "trap",
          "name": "Trap",
          "oneLine": "The modern mainstream sound: booming 808 bass (deep bass-drum boom), rattling hi-hats, short punchy phrases with swagger and space.",
          "tempoGroove": "Usually written at 130-160 BPM but FELT in half-time (the body hears roughly 65-80). The snare cracks on beat three, hi-hats roll in fast triplet bursts (three quick hits per beat). Word density is medium and bursty \u2014 quick runs of 8-12 syllables, then deliberate air where the ad-libs (the echo words between lines) live.",
          "writingDials": [
            "Flow decision: write in bursts, not full bars \u2014 a rapid phrase (often in threes, matching the triplet hi-hats), then a gap. Each phrase should be able to stand alone like a caption; long winding sentences kill the bounce.",
            "The gap is a written thing: the air after each burst is not empty \u2014 it is where the ad-lib track answers \u2014 so the writer plans which word gets echoed and leaves the gap its exact size. Filling every gap is the fastest way to break the style.",
            "Rhyme engine: ride ONE rhyme sound for 4-8 bars before switching, and let repetition be a device \u2014 repeating the same word at the end of back-to-back lines is a legitimate hammer, not laziness. This is the opposite of boom-bap's constantly-shifting internals.",
            "Cadence switching: hold one flow pattern for a 4-bar block, then flip to a new one \u2014 the flip is the event in a trap verse, doing the job a chord change does elsewhere. Plan one or two flips per verse and let the hook keep the simplest cadence in the song.",
            "Hook treatment: chanted, not sung \u2014 two short phrases traded back and forth, simple enough to say along by the second listen. The hook can open the song before any verse, and it returns often.",
            "Section shape: verses of 12-16 bars \u2014 even with the hook returning every 30-40 seconds the verse stays the star, and an 8-bar verse plan starves the song. No pre-chorus, rarely a bridge. Momentum comes from the hook returning, not from a build.",
            "Subject treatment: present tense, first person, confident \u2014 the user's wins, grind, loyalty, glow-up stated as facts. Vulnerability is allowed but delivered flat and unbothered; one plain line dropped between flexes hits harder than a whole sad verse.",
            "Concrete detail rule: swagger only works when the details are the USER'S \u2014 their real car, job, block, win. Generic luxury inventory is how two different users end up with the same song, which is failure."
          ],
          "rendering": "Deep gliding 808 sub-bass, crisp fast hi-hats with triplet rolls, hard clap or snare on beat three, sparse dark melody \u2014 bells, muted keys, a lone flute or pad. 130-160 BPM with a half-time feel. Modern lightly-tuned rap vocal with a stacked ad-lib track echoing key words. Wide, punchy, radio-modern mix with plenty of low end.",
          "storyFit": "Best for hype songs, hustle and glow-up stories, birthday flexes, gym and pregame anthems, celebrating a win, making one person feel like a boss. Handles pain too, if the user's story carries it \u2014 flat delivery over hard drums reads as strength. Serves badly: tender detailed storytelling (the burst-flow chops narratives into confetti) and songs that need a big emotional sung chorus.",
          "parodyTraps": "Inventing drug, gun, or street content the user never wrote \u2014 the number one trap parody; brand-name shopping lists; writing the ad-libs into every line like punctuation; forcing triplets onto every single bar until it sounds like a typewriter; confusing loud with confident. Real trap is economical and cold; parody trap is busy and try-hard.",
          "performance": {
            "prose": "Density heavy; min adlibs 8; delivery tags [Ad-Lib Section] [Build Up] [Drop] [Spoken]. Trap performs as a two-voice conversation where both voices are the lead \u2014 the main track and its own ad-lib track punctuating behind it \u2014 and that punctuation is the room's signature invention. Signature: the punctuation ad-lib \u2014 a bar lands, and in the written gap the second track answers with an echo of the bar's key word or a short exclamation sound, one answer per gap, cold and exact, never stepping on the next burst. Placement: ad-libs live ONLY in the gaps the bursts leave and thicken under the hook's returns \u2014 the verse floor is roughly one echo every two bars, the hook doubles that, and a [Drop] or [Build Up] header can frame the hook's arrival; the one place to stay bare is the single flat vulnerable line, which lands alone. Tag identity: the lead and its own second self \u2014 (echo of the key word) after bars, short exclamation sounds like (yeah) (okay) (woo) as punctuation, a doubled chant hook. No crew, no crowd, no melody stack: one voice twice.",
            "adlibDensity": "heavy",
            "minAdlibs": 8,
            "deliveryTags": [
              "[Ad-Lib Section]",
              "[Build Up]",
              "[Drop]",
              "[Spoken]"
            ]
          },
          "builder": {
            "instruments": [
              "gliding 808 sub-bass",
              "rolling triplet hi-hats",
              "hard clap snare",
              "dark bell melody",
              "muted keys",
              "lone flute"
            ],
            "themes": [
              "The come-up / hustle",
              "Money & ambition",
              "Celebration / flexing",
              "Proving them wrong"
            ],
            "purposes": [
              "Flex / celebrate",
              "Motivate the ones grinding",
              "Ride music"
            ]
          }
        },
        {
          "id": "drill",
          "name": "Drill",
          "oneLine": "The cold, sliding, late-night cousin of trap: menacing bass that slides, clipped deadpan (flat-voiced) phrases, confidence with the temperature turned down.",
          "tempoGroove": "138-150 BPM, almost always right around 140, half-time feel. The signature is the sliding 808 bass (a deep bass boom that bends in pitch) and drums that hit slightly off the grid \u2014 so phrases enter LATE, behind the beat, and get clipped short. Word density medium-high but chopped: 9-13 syllables per bar delivered in short cold pieces, little air for melody, some air for punch.",
          "writingDials": [
            "Flow decision: slide in late. Where trap bursts on top of the beat, drill phrases start a hair behind it and lean on the last word of each phrase \u2014 write lines whose final word is the heaviest one, because that is the word the flow stomps on.",
            "Tone dial (the big one): understatement. Drill's power is saying a hard thing flatly, like it barely matters. Exclamation is weakness here; the coldest line in the verse should read almost bored. If humor shows up, it is a dry shrug inside an otherwise serious line \u2014 never a set-up-and-punchline like boom-bap. This is the exact opposite of bounce's shouted energy.",
            "Rhyme engine: slant rhyme (near-rhyme) over perfect rhyme, and repeated cadence patterns \u2014 the same rhythmic shape recurring line after line matters more than the rhyme sounds matching cleanly.",
            "Hook treatment: the hook is a colder, tighter verse \u2014 same flow, same deadpan, just more repetition. The boundary between verse and hook blurs; do not write a lifted singable chorus, it breaks the spell.",
            "Section shape: 16-bar verses are the norm (12 at the shortest) and a hook that returns often; no pre-chorus, no bridge, no builds \u2014 the song tightens by repetition, it never lifts.",
            "Point-of-view norm: the crew voice is at home here \u2014 we and us carry weight, and direct address to a rival or a doubter is a standard move. Use it only if the user's story actually has a them.",
            "Subject treatment for a consumer app: translate drill's edge into what the user actually wrote \u2014 rivalry, doubters, surviving something, cold self-belief. NEVER import violence, gang references, or threats the user's story does not contain."
          ],
          "rendering": "Sliding, pitch-bending 808 bass (the defining sound), sparse eerie melody \u2014 a lonely piano, a bell, a ghostly vocal texture \u2014 and syncopated (off-beat) skittering hi-hats with hard off-grid snare placement. 138-150 BPM (usually right at 140), half-time feel. Deadpan low-energy rap vocal, dry and up-front, minimal tuning, UK/NY drill drum character. Dark, minimal, no warmth in the mix.",
          "storyFit": "Best for rivalry and doubters stories, cold-confidence anthems, survived-something narratives, competitive sports or business energy, users whose own words carry an edge. Serves badly: celebrations, love songs, tributes, and anything warm \u2014 drill cannot smile without breaking. If the user's story has no adversary and no edge, do not put it in drill.",
          "parodyTraps": "Invented street beef or gang content \u2014 instantly fake and potentially harmful; borrowed UK slang from a non-UK user's story (the dialect law applies to slang too \u2014 only the user's own words); mistaking shouted aggression for drill's cold restraint; threats aimed at nobody. Parody drill is loud and cartoonish; real drill is quiet and heavy.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Spoken] [Break] [Drop] [Quiet]. Drill performs cold \u2014 the crew is in the room, but nobody is hype, and the whole performance sits low and level like the temperature dropped. Signature: the crew echo on the heaviest word \u2014 the phrase-final word gets a flat low group double, more grunt than shout, landing a hair behind the lead exactly where the flow leans. Placement: crew echoes land only on phrase-final words and only on the bars that carry the most weight \u2014 never inside a phrase, never on every line; the hook carries the most repetition and so the most echoes, and one [Quiet] or bare [Break] header can mark the coldest moment instead of any build. Tag identity: the lead plus a low crew \u2014 flat (group echo of the last word) on the heavy bars, an occasional short cold exclamation sound, every delivery kept deadpan. No melody stack, no belting, no party energy \u2014 the crew confirms, it never cheers.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Spoken]",
              "[Break]",
              "[Drop]",
              "[Quiet]"
            ]
          },
          "builder": {
            "instruments": [
              "sliding pitch-bending 808 bass",
              "skittering off-grid hi-hats",
              "lonely piano",
              "eerie bell",
              "ghostly vocal texture pad"
            ],
            "themes": [
              "Proving them wrong",
              "The struggle",
              "Money & ambition",
              "Where I'm from"
            ],
            "purposes": [
              "Call somebody out",
              "Motivate the ones grinding",
              "Flex / celebrate"
            ]
          }
        },
        {
          "id": "melodic-rap",
          "name": "Melodic Rap",
          "oneLine": "Half-rapped, half-sung feelings over booming soft beats \u2014 the lane for heartbreak, longing, and loyalty said out loud.",
          "tempoGroove": "Written 130-150 BPM with a half-time feel, so it FEELS slow and floaty (roughly 65-75 in the body). Flow sings: notes get held, words get stretched. Word density is LOW \u2014 about 6-9 syllables per bar \u2014 with the most air per phrase of any rap-flow lane; melody fills what the words leave empty.",
          "writingDials": [
            "Flow decision: write phrases that can be SUNG, not just said \u2014 end lines on open vowel sounds (ah, oh, ay) that a voice can hold and bend, and keep lines short enough that stretching a word does not crowd the next one.",
            "Rhyme engine: clean, singable end rhymes and very few internal rhymes. Dense internals fight the melody; here the rhyme's job is to make the tune feel inevitable, not to show skill.",
            "Hook treatment: fully sung, and it IS the emotional thesis of the song \u2014 the one line the user's whole story boils down to. Chorus lines must match each other in syllable count and stress so the melody repeats cleanly \u2014 Layer 3's matching-length-lines rule matters most in this sub-genre.",
            "Section shape: the only hip-hop sub-genre where a pre-chorus (the short build before the chorus) and a bridge genuinely belong. Verses still run 12-16 bars and stay the substance \u2014 melody never excuses a thin verse. Verses can melt into the hook instead of stopping dead \u2014 write the last verse line to hand off, not to slam shut.",
            "Subject treatment: feelings stated to a specific person \u2014 second person address (you) is the home position. Name the feeling AND the concrete moment it comes from; a feeling with no scene is greeting-card mush.",
            "Vulnerability dial: this is the one hip-hop lane where soft is strong. No armor required \u2014 but the confession must be the USER'S confession, in their situation, not stock heartbreak.",
            "Repetition as emotion: repeating one phrase with a different melody or emphasis reads as obsession or ache \u2014 a legitimate device here that would read as lazy in boom-bap.",
            "Cross-genre firewall: R&B's Trap-Soul and gospel's urban/trap room run the same drums and tempo as this one \u2014 the dial that makes it Melodic Rap is the guard coming down, a sung ache aimed straight at a person."
          ],
          "rendering": "Warm atmospheric foundation \u2014 ambient keys, soft guitar, or airy pads \u2014 over booming but rounded 808 bass (deep bass-drum boom) and relaxed half-time trap drums with only light hi-hat rolls. 130-150 BPM half-time feel. Heavily melodic tuned vocal with harmony stacks and background layers; the voice is the lead instrument. Emotional, spacious, late-night mix.",
          "storyFit": "Best for heartbreak, missing someone, love, apology, grief, loyalty, ambition mixed with loneliness \u2014 any story that is mainly a FEELING aimed at a person. The single most useful lane for a consumer app's sentimental stories that still want to knock. Serves badly: wit-driven roasts, dense storytelling, and crowd-chant party songs \u2014 the low word density cannot carry jokes or plot.",
          "parodyTraps": "Autopilot heartbreak clich\xE9s and numbness tropes the user never wrote; vowel-mush lines with no concrete image (pretty sound, says nothing); every line the exact same length in a singsong lull; sad-boy costume on a story that is not sad. Real melodic rap earns the ache with one specific detail; parody just moans in tune.",
          "performance": {
            "prose": "Density moderate; min adlibs 5; delivery tags [Falsetto] [Harmonies] [Crooning] [Soft] [Build]. This room performs like one hurt voice multiplied \u2014 every added voice is the lead layering itself, and everything added sings; nothing talks back. Signature: the sung trail \u2014 the last words of the hook line return behind it as a higher or softer sung layer, melody carrying what the words leave unsaid, the ache thickening as layers stack on each hook return. Placement: verses stay barer so the confession reads plainly \u2014 at most one soft sung echo per verse \u2014 then harmonies bloom on the hook and thicken every return, and the bridge or final chorus can lift into a [Falsetto] peak; a [Build] belongs only at the hand-off into the last hook. Tag identity: the lead's harmonized self \u2014 sung (echo of the hook's last words), harmony stacks on held open vowels, a falsetto double at the emotional peak. No punctuation ad-libs, no crew, no crowd \u2014 if a voice answers here, it sings.",
            "adlibDensity": "moderate",
            "minAdlibs": 5,
            "deliveryTags": [
              "[Falsetto]",
              "[Harmonies]",
              "[Crooning]",
              "[Soft]",
              "[Build]"
            ]
          },
          "builder": {
            "instruments": [
              "rounded 808 bass",
              "ambient keys",
              "soft guitar loop",
              "airy pads",
              "relaxed half-time trap drums"
            ],
            "themes": [
              "Love & loyalty",
              "Losing a friend",
              "The struggle",
              "Money & ambition"
            ],
            "purposes": [
              "Grieve a loss",
              "Say what I never said",
              "Ride music"
            ]
          }
        },
        {
          "id": "conscious",
          "name": "Conscious / Storytelling",
          "oneLine": "Hip-hop with a point: real narratives, tributes, and messages told with craft \u2014 the verse as a short film.",
          "tempoGroove": "Most at home at 85-100 BPM with a live, roomy pocket \u2014 the constant is drums that leave space for words to be HEARD. Word density is the highest in hip-hop, 10-16 syllables per bar, but delivered conversationally, like gripping speech more than performance.",
          "writingDials": [
            "Flow decision: shift cadence WITHIN the verse to mark emotional turns \u2014 start conversational, tighten and speed up as tension rises, slow down for the gut-punch line. Sentences chain across bar lines in service of the plot; unlike boom-bap, no single bar has to work as a stand-alone punchline \u2014 the paragraph is the unit here, not the bar.",
            "Structure decision: the story poses a QUESTION and answers it late. Somewhere along the way something must shift \u2014 a new set of eyes, a different point in time \u2014 but the user's story decides how many verses it needs and where that shift lands; never assign fixed jobs to verse numbers. Verses run long: 16-24 bars is normal.",
            "The extended metaphor: this is the one sub-genre where a single comparison can carry the WHOLE song \u2014 the entire story told as if it were something else, revealed fully only near the end. In the siblings a metaphor lasts a line or two; here it can be the architecture.",
            "Hook treatment: understated on purpose \u2014 sparse, low, sometimes half-spoken, sometimes just a breath between chapters. A big shiny chorus would cheapen the story; the hook's job is to let the listener absorb, then pull them back in.",
            "Detail-first rule: proper nouns, dates, places, small physical facts from the user's story do the emotional work. The lesson is never stated first \u2014 the details earn it, and the point lands late.",
            "Rhyme engine: internals as dense as boom-bap but in SERVICE of the argument \u2014 rhyme follows the sentence, the sentence never bends to reach a rhyme. When the honest line does not rhyme, the honest line wins (Layer 3's no-rhyme option lives here).",
            "Point-of-view discipline: choose the narrator deliberately \u2014 first person confessing, third person telling someone else's story, or second person putting the listener inside it \u2014 and breaking that point of view once, late, is a power move, not an accident."
          ],
          "rendering": "Live-feeling drums or a warm boom-bap hybrid, soulful keys, strings, or a gospel-tinged sample; the beat should DROP OUT or thin down under the most important lines. 85-100 BPM. Clear untuned vocal sitting close and upfront, minimal effects, dynamic arrangement that breathes with the story rather than looping flat. Sparse, low-key hook treatment.",
          "storyFit": "Best for tributes to a parent or a lost loved one, life-lesson stories, overcoming-something narratives, injustice, faith journeys, telling a real person's real story with dignity. The lane for the app's heaviest, most meaningful requests. Serves badly: party songs, flexes, and quick fun \u2014 it takes itself seriously and needs a story with actual weight to justify that.",
          "parodyTraps": "Preaching \u2014 turning the user's story into a sermon aimed at the listener; clich\xE9s that order the listener to pay attention or get conscious instead of showing a life; rhyming-dictionary big words to sound deep; stating the moral up front instead of earning it; name-dropping social issues the user's story never touched. Real conscious rap shows a life and lets the listener conclude; parody lectures.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Spoken] [Breakdown] [Instrumental Break] [Soft] [Quiet]. This room performs like a story told to a quiet room \u2014 the production reacts to the words and voices almost never do, so it is the barest ad-lib room in hip-hop and the tags do the reacting. Signature: the drop-out under the gut-punch \u2014 a direction line pulling the beat away for a bar so the heaviest sentence lands in near silence, then the drums return and carry the weight forward. Placement: the required adlibs are quiet ones \u2014 a low spoken aside where the story turns, a single breath or hum before the final section \u2014 and they never land on the heavy lines, which always stand bare; the hook header stays low ([Soft] or [Spoken]) because a shiny chorus would cheapen the story. Tag identity: the narrator alone with a band that listens \u2014 (beat drops out for a bar) direction lines, one (spoken: low aside) on its own line, soft half-spoken hook headers. No hype voices, no echoes chasing bars \u2014 silence is the second performer.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Spoken]",
              "[Breakdown]",
              "[Instrumental Break]",
              "[Soft]",
              "[Quiet]"
            ]
          },
          "builder": {
            "instruments": [
              "live-feel drums",
              "soulful keys",
              "strings",
              "gospel-tinged sample",
              "warm live bass",
              "dusty piano loop"
            ],
            "themes": [
              "Losing a friend",
              "The struggle",
              "Where I'm from",
              "The come-up / hustle"
            ],
            "purposes": [
              "Tell my story",
              "Grieve a loss",
              "Motivate the ones grinding"
            ]
          }
        },
        {
          "id": "west-coast",
          "name": "West Coast / G-Funk",
          "oneLine": "Laid-back funk-driven rap built for cruising \u2014 a relaxed, talk-sung flow that leans back on a rolling groove and sounds like a good day.",
          "tempoGroove": "90-100 BPM, swung rolling funk bounce \u2014 the flow sits BEHIND the beat, unhurried, stretching vowels at phrase ends. Word density is medium, about 8-12 syllables per bar, but delivered so relaxed it feels lighter; nothing is ever allowed to sound rushed.",
          "writingDials": [
            "Flow decision: lay back. Phrases start a touch after the beat and drawl through it \u2014 where boom-bap stomps the snare and trap bursts on top, this flow lounges. If a line cannot be said in one relaxed exhale, it is too crowded \u2014 cut words until it can.",
            "Rhyme engine: easy, conversational end rhymes with a light singsong lilt \u2014 a few internals for bounce, never packed. The rhyme must sound effortless; the moment a rhyme feels reached-for, the cool breaks.",
            "Hook treatment: talk-sung and smooth \u2014 melodic but cool, never aching. The hook states a vibe, not a confession; that is the line between this lane and melodic rap, which sings feelings AT someone.",
            "Subject treatment: the good day \u2014 scene-setting sensory detail carries the song: the weather, the ride, the company, the music, the food, all from the user's story. Wins are told with a shrug and a smile; urgency is the one thing this lane refuses.",
            "Vocal space: medium \u2014 leave the ends of phrases open so the high synth line and the bassline can answer. The groove is a duet partner, not a backdrop; write as if something else gets the last word of the bar.",
            "Tone dial: wry and warm \u2014 observational humor delivered slow, never set-up-and-punchline like boom-bap. Even the flex is friendly; this is the one hip-hop lane where the confidence smiles.",
            "Section shape: standard 16-bar verses with a sung hook and one steady temperature throughout \u2014 instead of a bridge, leave room for the groove itself (a synth or bass break) to take a turn. No drops, no builds; the ride just keeps rolling."
          ],
          "rendering": "Rolling funk bassline up front, a high whining synth lead that slides between notes (the classic G-funk whistle), warm electric-piano chords, an optional talkbox hook (the melodic robot-voice synth, a G-funk signature), and laid-back swung drums with a snappy snare. 90-100 BPM. Smooth, relaxed, talk-sung vocal with light melody and a few harmony touches, sunny 90s West Coast character. Groove-led and steady \u2014 no drops, no big builds, just ride.",
          "storyFit": "Best for windows-down cruising songs, laid-back celebrations, summer cookouts and reunions told smooth instead of loud, good-day stories, city or neighborhood pride with a smile, users who ask for a West Coast vibe. Serves badly: urgent hype (too relaxed), heartbreak and grief (too sunny), dense wordplay showcases, and cold rivalry \u2014 this lane cannot frown for long.",
          "parodyTraps": "Fake California scenery \u2014 palm trees, lowriders, and beach references for a user whose story never leaves Ohio; borrowed 90s West Coast slang the user never wrote (the dialect law covers slang too); importing gang references from the era's famous records; forced chill \u2014 filler about relaxing instead of the user's actual good day. Real G-funk is unhurried confidence in the user's own scene; parody is a costume.",
          "performance": {
            "prose": "Density moderate; min adlibs 5; delivery tags [Harmonies] [Spoken] [Groove] [Instrumental Break]. This room performs like a backyard function on a warm evening \u2014 a couple of relaxed voices in the cut answering the lead, nobody in a hurry, and the groove itself allowed the last word. Signature: the laid-back call-out \u2014 a smooth second voice answering the open end of a phrase from across the yard, low and easy, plus light harmonies leaning into the talk-sung hook. Placement: answers sit only at the phrase ends the writing left open \u2014 where the synth line or bassline was invited to reply, a voice may reply instead \u2014 the hook carries the harmonies, and one [Instrumental Break] or [Groove] header gives the band its own turn in place of a bridge. Tag identity: the lead plus a few laid-back friends and a smooth hook voice \u2014 relaxed (call-outs answering phrase ends), light hook harmonies, groove headers where the music talks. Warm and unhurried; nobody shouts, nobody rushes, and even the answers smile.",
            "adlibDensity": "moderate",
            "minAdlibs": 5,
            "deliveryTags": [
              "[Harmonies]",
              "[Spoken]",
              "[Groove]",
              "[Instrumental Break]"
            ]
          },
          "builder": {
            "instruments": [
              "rolling funk bassline",
              "high whining synth lead",
              "warm electric-piano chords",
              "laid-back swung drums",
              "talkbox-style synth",
              "snappy snare"
            ],
            "themes": [
              "Where I'm from",
              "Celebration / flexing",
              "Love & loyalty"
            ],
            "purposes": [
              "Ride music",
              "Flex / celebrate",
              "Tell my story"
            ]
          }
        },
        {
          "id": "southern-bounce",
          "name": "Southern Bounce / Club",
          "oneLine": "Call-and-response party rap built for a room full of people shouting back \u2014 the celebration machine.",
          "tempoGroove": "95-105 BPM, straight relentless groove with a rapid syncopated (off-beat) kick \u2014 no half-time, no swing, just forward drive. The drum flavor can vary (New Orleans bounce, crunk stomp, modern club) but the writing engine is the same. Word density is the fewest syllables per line in hip-hop \u2014 short chant-sized lines of 4-8 syllables \u2014 but the lines turn over fast, so the song never sits still.",
          "writingDials": [
            "The writing engine is call-and-response: write in pairs \u2014 a call line, then a gap or a response line a CROWD could shout back. Every section must pass the test: could a room full of people who just heard it once yell the answer? If not, shorten it.",
            "Command voice: this is the one sub-genre where telling the listener what to do is the norm \u2014 commands that get the room moving, celebrating, or honoring the named person. Build the actual command wording from the user's own story and people, never from stock party phrases.",
            "Rhyme engine: simple, percussive, and proudly repetitive \u2014 repeating the same end word across lines is not lazy here, it IS the hook mechanism. Complex internals would only slow the crowd down.",
            "Hook treatment: the hook is the whole point and it eats the song \u2014 expect the hook to take up half the runtime, with mini-verses (4-8 bars) as quick breathers between chant sections. Structure is hook-heavy, verse-light: the mirror image of boom-bap, and the genre's one lawful bend of verse-is-the-star \u2014 even these mini-verses must carry the user's real people and details, never filler.",
            "Roll-call device: naming \u2014 the birthday person, the team, the family members, the city \u2014 chanted so the named people react. This is the sub-genre's superpower for celebration songs, and the names must come from the user's story (which also keeps the originality law satisfied automatically).",
            "Space rule: leave the response gaps EMPTY in the writing. Filling every beat kills the party \u2014 the crowd's answer is part of the song, so the lyric sheet must have holes shaped like it.",
            "Energy discipline: no dynamic dips. Where melodic rap breathes and conscious rap slows down for weight, bounce holds one high temperature start to finish \u2014 the only build allowed is stacking more voices."
          ],
          "rendering": "Choose the drum character from the story's energy: rapid New Orleans bounce-style kicks, a heavy stomping crunk-style clap groove, or clean modern club drums \u2014 all straight and driving at 95-105 BPM. Sharp claps and a simple bass riff; horn stabs and whistle hits only when the story wants full-blast parade energy. Lead chant vocal answered by stacked group-shout response vocals \u2014 the call-and-response must be audible in the arrangement. Big live party energy, handclap layers, no ballad softness anywhere.",
          "storyFit": "Best for birthdays, graduations, weddings, team and family anthems, reunions, city pride, any story whose purpose is a ROOM celebrating together. The best hip-hop lane for making the named person light up in front of everyone. Serves badly: introspection, heartbreak, tributes to the departed, and detailed storytelling \u2014 the chant format physically cannot hold a narrative or a quiet feeling.",
          "parodyTraps": "Generic party filler so interchangeable that any name could be swapped in (the exact failure the originality law forbids \u2014 the user's specific people and moments must be IN the chants); instructing dances that do not exist or are ten years stale; writing it as generic pop-EDM party lyrics with no call-and-response structure; filling every gap so the crowd has nowhere to answer; locking every party song into one city's sound the user never mentioned; and instructing any regional dialect \u2014 the bounce rhythm carries the identity in standard English.",
          "performance": {
            "prose": "Density heavy; min adlibs 9; delivery tags [Call and Response] [Ad-Lib Section] [Groove] [Big Finish]. The crowd IS the record \u2014 this room performs as one leader and a room full of people, and the writing already cut the holes their answers fill, so it carries the biggest cast and the highest adlib floor in hip-hop. Signature: the written answer \u2014 a call line, then the crowd's short shouted response in the gap, over and over, with roll-call lines where the room shouts back the named people from the user's story. Placement: response gaps everywhere \u2014 every call gets its answer, chant sections stack more voices each pass, the mini-verses run near-bare as breathers, and the [Big Finish] stacks every voice in the room; the floor of 9 is met by the response gaps alone, never by decorating the calls. Tag identity: a lead caller and a full crowd \u2014 written call-and-response blocks with line-start Lead: and (crowd: shouted response) pairs, roll-call answers, handclap and stomp direction lines, group shouts stacking to the end. The one hip-hop room where the cast outnumbers the lead.",
            "adlibDensity": "heavy",
            "minAdlibs": 9,
            "deliveryTags": [
              "[Call and Response]",
              "[Ad-Lib Section]",
              "[Groove]",
              "[Big Finish]"
            ]
          },
          "builder": {
            "instruments": [
              "rapid bounce kicks",
              "sharp handclaps",
              "simple bass riff",
              "horn stabs",
              "whistle hits",
              "stomping crunk claps"
            ],
            "themes": [
              "Celebration / flexing",
              "Where I'm from",
              "Love & loyalty"
            ],
            "purposes": [
              "Flex / celebrate",
              "Ride music"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "boom bap",
          "strength": "strong",
          "roomId": "boom-bap"
        },
        {
          "cue": "boom-bap",
          "strength": "strong",
          "roomId": "boom-bap"
        },
        {
          "cue": "real hip-hop",
          "strength": "strong",
          "roomId": "boom-bap"
        },
        {
          "cue": "golden era",
          "strength": "weak",
          "roomId": "boom-bap"
        },
        {
          "cue": "90s",
          "strength": "weak",
          "roomId": "boom-bap"
        },
        {
          "cue": "old school",
          "strength": "weak",
          "roomId": "boom-bap"
        },
        {
          "cue": "wordplay",
          "strength": "weak",
          "roomId": "boom-bap"
        },
        {
          "cue": "roast",
          "strength": "weak",
          "roomId": "boom-bap"
        },
        {
          "cue": "trap",
          "strength": "strong",
          "roomId": "trap"
        },
        {
          "cue": "808",
          "strength": "weak",
          "roomId": "trap"
        },
        {
          "cue": "flex",
          "strength": "weak",
          "roomId": "trap"
        },
        {
          "cue": "hustle",
          "strength": "weak",
          "roomId": "trap"
        },
        {
          "cue": "grind",
          "strength": "weak",
          "roomId": "trap"
        },
        {
          "cue": "glow-up",
          "strength": "weak",
          "roomId": "trap"
        },
        {
          "cue": "glow up",
          "strength": "weak",
          "roomId": "trap"
        },
        {
          "cue": "gym",
          "strength": "weak",
          "roomId": "trap"
        },
        {
          "cue": "boss",
          "strength": "weak",
          "roomId": "trap"
        },
        {
          "cue": "drill",
          "strength": "strong",
          "roomId": "drill"
        },
        {
          "cue": "uk drill",
          "strength": "strong",
          "roomId": "drill"
        },
        {
          "cue": "ny drill",
          "strength": "strong",
          "roomId": "drill"
        },
        {
          "cue": "rival",
          "strength": "weak",
          "roomId": "drill"
        },
        {
          "cue": "doubters",
          "strength": "weak",
          "roomId": "drill"
        },
        {
          "cue": "haters",
          "strength": "weak",
          "roomId": "drill"
        },
        {
          "cue": "unbothered",
          "strength": "weak",
          "roomId": "drill"
        },
        {
          "cue": "enemies",
          "strength": "weak",
          "roomId": "drill"
        },
        {
          "cue": "melodic rap",
          "strength": "strong",
          "roomId": "melodic-rap"
        },
        {
          "cue": "emo rap",
          "strength": "strong",
          "roomId": "melodic-rap"
        },
        {
          "cue": "sad rap",
          "strength": "strong",
          "roomId": "melodic-rap"
        },
        {
          "cue": "soundcloud rap",
          "strength": "strong",
          "roomId": "melodic-rap"
        },
        {
          "cue": "heartbreak",
          "strength": "weak",
          "roomId": "melodic-rap"
        },
        {
          "cue": "missing",
          "strength": "weak",
          "roomId": "melodic-rap"
        },
        {
          "cue": "apology",
          "strength": "weak",
          "roomId": "melodic-rap"
        },
        {
          "cue": "lonely",
          "strength": "weak",
          "roomId": "melodic-rap"
        },
        {
          "cue": "conscious rap",
          "strength": "strong",
          "roomId": "conscious"
        },
        {
          "cue": "storytelling",
          "strength": "strong",
          "roomId": "conscious"
        },
        {
          "cue": "life story",
          "strength": "strong",
          "roomId": "conscious"
        },
        {
          "cue": "rest in peace",
          "strength": "strong",
          "roomId": "conscious"
        },
        {
          "cue": "conscious",
          "strength": "weak",
          "roomId": "conscious"
        },
        {
          "cue": "tribute",
          "strength": "weak",
          "roomId": "conscious"
        },
        {
          "cue": "lesson",
          "strength": "weak",
          "roomId": "conscious"
        },
        {
          "cue": "injustice",
          "strength": "weak",
          "roomId": "conscious"
        },
        {
          "cue": "west coast",
          "strength": "strong",
          "roomId": "west-coast"
        },
        {
          "cue": "g-funk",
          "strength": "strong",
          "roomId": "west-coast"
        },
        {
          "cue": "g funk",
          "strength": "strong",
          "roomId": "west-coast"
        },
        {
          "cue": "lowrider",
          "strength": "strong",
          "roomId": "west-coast"
        },
        {
          "cue": "cruising",
          "strength": "weak",
          "roomId": "west-coast"
        },
        {
          "cue": "windows down",
          "strength": "weak",
          "roomId": "west-coast"
        },
        {
          "cue": "summer",
          "strength": "weak",
          "roomId": "west-coast"
        },
        {
          "cue": "cookout",
          "strength": "weak",
          "roomId": "west-coast"
        },
        {
          "cue": "bounce music",
          "strength": "strong",
          "roomId": "southern-bounce"
        },
        {
          "cue": "new orleans bounce",
          "strength": "strong",
          "roomId": "southern-bounce"
        },
        {
          "cue": "twerk",
          "strength": "strong",
          "roomId": "southern-bounce"
        },
        {
          "cue": "crunk",
          "strength": "strong",
          "roomId": "southern-bounce"
        },
        {
          "cue": "block party",
          "strength": "strong",
          "roomId": "southern-bounce"
        },
        {
          "cue": "bounce",
          "strength": "weak",
          "roomId": "southern-bounce"
        },
        {
          "cue": "club",
          "strength": "weak",
          "roomId": "southern-bounce"
        },
        {
          "cue": "birthday",
          "strength": "weak",
          "roomId": "southern-bounce"
        },
        {
          "cue": "party",
          "strength": "weak",
          "roomId": "southern-bounce"
        },
        {
          "cue": "graduation",
          "strength": "weak",
          "roomId": "southern-bounce"
        }
      ]
    },
    "gospel": {
      "id": "gospel",
      "name": "Gospel",
      "aliases": [
        "gospel music",
        "praise",
        "worship music"
      ],
      "profileText": "A gospel writer starts with direction: who is the song facing? Some songs testify \u2014 they face people and tell them what God did. Some songs worship \u2014 they face God and say it to Him straight. Some songs trade \u2014 a leader calls and a room answers. That one choice rewrites every line, because a congregation cannot sing a soloist's winding sentences, and a soloist wastes a room-sized chorus. Gospel also allows a pivot most genres forbid: a verse may testify in first person and the chorus may widen to we or turn to You, so the whole room can claim the words. The tradition wins over the one-voice rule \u2014 but the pivot is planned, never drift, and the worship lane never pivots at all.\n\nThe second decision is the ascent. A gospel song must end higher than it began \u2014 that is the job. Every room climbs its own ladder: the choir stacks a vamp and changes key; worship repeats one declaration over a growing build until it weighs more; the quartet strips to one anchor phrase and drives; the contemporary soloist climbs a bridge into a lifted final chorus; the urban cut drops the beat away and floods it back. The writer picks the ladder early and writes toward it, because the ending is the most important part of a gospel song.\n\nRepetition is craft here, not laziness. Gospel is the tradition where the same phrase returns hotter each time, so the writer's test is blunt: is this phrase true enough, and short enough, to be worth twenty repeats? Worship may replace new verse information with repetition that deepens \u2014 that bend is sanctioned, and even there the approach verse plants a real detail from the user's story first. Everywhere else the verses carry the substance: the scenes, the specifics, the before. The repeated phrase is the truth those verses earned.\n\nCall-and-response is gospel's native grammar \u2014 the tradition the other genres borrowed it from. The writer puts both layers on the page: the lead's freer lines, and the short fixed answer the other voices give, learnable in one pass. Who answers is the room's call \u2014 a mass choir, a praise team with a congregation, a small polished stack, a quartet's named parts, or a modern lead layering its own voice \u2014 and the answer is planned in the writing.\n\nThe language stays the user's own. Scripture-rooted images and familiar turns of thought are welcome \u2014 but folded into the user's plain speech, never pasted on as costume, and never faked as personal history the user did not give. The testimony keeps its mess: the before must be as vivid as the after, because a scrubbed struggle is a false witness. The user's real diagnosis, real habit, real year of silence is what makes the praise believable.\n\nRendering protects three things in every room. The voice out front \u2014 raw or polished as the room decides, but human and leading. The church's instruments \u2014 organ, piano, live drums, tambourine, and voices treated as the biggest instrument of all. And the arc \u2014 a sparse start, a real quiet before the biggest lift, the fullest sound saved for the end. The dials bend to the story; the story never bends to the room.",
      "defaultRoomId": "contemporary-gospel",
      "rooms": [
        {
          "id": "traditional-gospel",
          "name": "Traditional Gospel / Choir",
          "oneLine": "The big-choir church sound \u2014 a leader out front, a wall of voices answering, and an ending that climbs higher than the beginning.",
          "tempoGroove": "Two lanes: slow burn at 60-75 BPM in a 12/8 feel (a triplet sway \u2014 the classic slow-church rock), and uptempo praise at 100-126 BPM, straight or lightly shuffled with claps on 2 and 4. Word density is low-to-medium: every choir line must be short enough for forty voices to hit together. Slow songs stretch few words over long bars; uptempo songs use punchy call phrases.",
          "writingDials": [
            "Write two layers at once: the LEAD's lines (freer, testimony-flavored, can stretch and repeat) and the CHOIR's answer (short, fixed, 3-7 words a room can lock onto). Every section should say which layer carries it.",
            "Build the vamp on paper \u2014 the vamp is the repeated ending section. The craft is choosing THE one short phrase worth repeating 8-16 times while intensity climbs, plus a second short phrase (the 'special') that stacks on top of or answers it near the peak.",
            "Rhyme density is low. Repetition and parallel structure (matching line shapes) do the work rhyme does in other genres; a choir anthem can rhyme almost nothing and still land.",
            "POV convention: the verse may testify in 'I,' but the chorus widens to 'we' or turns to 'You/He' \u2014 the whole room has to be able to claim the chorus words as their own.",
            "Scripture allusion is welcome and expected \u2014 folded in as borrowed images and familiar turns of thought, never chapter-and-verse citations dropped mid-line.",
            "The section plan is different from pop: verse \u2192 chorus \u2192 vamp \u2192 (often) key change \u2192 reprise (the chorus comes back one more time). The vamp usually replaces the bridge; if a bridge exists, its job is to set up the key change.",
            "Keep lines metrically square (even, landing on the beat) and predictable \u2014 a choir cannot syncopate loosely the way a soloist can. Put the surprise in harmony and dynamics, not in rhythm.",
            "Write the dynamics into the lyric arc: place the softest, most confessional line right before the biggest lift \u2014 it should be NEW information, carried by the lead voice alone, giving the director a near-whisper to climb from."
          ],
          "rendering": "Full mass choir in three-part harmony behind a powerhouse lead vocalist, Hammond B3 organ with Leslie speaker (classic church organ), grand piano, live bass and drums, tambourine on uptempo numbers. Slow songs in a 12/8 sway with big choir swells; uptempo with handclaps on 2 and 4. Call for a key change into the final vamp and a drum-led drive ending. Era marker: rooted in the 1970s-90s mass-choir tradition and still recorded live today \u2014 live church-recording energy, warm and roomy, not polished pop.",
          "storyFit": "Best for church celebrations (anniversaries, pastor appreciation), big communal gratitude, deliverance stories meant to be shared by a congregation, and homegoing services. Bad for intimate private confession and stories built on lots of specific narrative detail \u2014 the choir format compresses detail out, and whatever specifics survive must live in the lead's verse lines only.",
          "parodyTraps": "Cramming long wordy lines into choir parts (a real choir cannot sing a paragraph together). Stuffing in fake old-church vocabulary the user never wrote. Skipping the vamp \u2014 a traditional choir song that simply ends after the second chorus sounds like an unfinished demo. Starting loud and staying loud, leaving the ending nowhere to ascend to.",
          "performance": {
            "prose": "Density heavy; min adlibs 8; delivery tags [Call and Response] [Choir enters] [Belting] [Vocal Run] [Crescendo] [Final Vamp]. This room performs like a full service with the church on its feet \u2014 one lead out front and a wall of voices behind, and the performance is built to climb: light early, fuller each section, heaviest at the vamp. Signature: the two-layer conversation the writing already planned \u2014 the lead calls in freer testimony lines and the mass choir answers with its short fixed phrase, together, on time, every time; at the vamp the choir holds the one repeated phrase through the key change while the lead breaks loose over it, and the special stacks on near the peak. Placement: verses keep the choir at line-end answers only; the chorus brings the full wall under a [Choir enters] header; the soft confessional line before the biggest lift stands completely bare \u2014 the lead alone, no answers; then the vamp is the heaviest adlib zone in gospel, lead calls and choir answers landing on every pass, run cues riding the key change. Tag identity: a lead and a mass choir \u2014 line-start Lead: calls with the choir's (fixed short answer) behind them, (choir swells) direction lines, a [Choir enters] chorus header, and a [Final Vamp] header where the special stacks over the loop. Forty voices move as ONE voice: the choir answers and swells together, never as scattered solo echoes \u2014 that wall-of-one grammar is what no other gospel room shares.",
            "adlibDensity": "heavy",
            "minAdlibs": 8,
            "deliveryTags": [
              "[Call and Response]",
              "[Choir enters]",
              "[Belting]",
              "[Vocal Run]",
              "[Crescendo]",
              "[Final Vamp]"
            ]
          },
          "builder": {
            "instruments": [
              "Hammond B3 organ",
              "grand piano",
              "live bass",
              "gospel drums",
              "tambourine",
              "handclaps"
            ],
            "themes": [
              "For the congregation",
              "Celebration of His love",
              "Deliverance",
              "Gratitude"
            ],
            "purposes": [
              "Lift the congregation",
              "Celebrate",
              "Comfort in grief",
              "Worship / exalt"
            ]
          }
        },
        {
          "id": "contemporary-gospel",
          "name": "Contemporary Gospel",
          "oneLine": "Modern radio gospel \u2014 a soloist's personal testimony with pop/R&B polish, a big singable chorus, and a bridge that lifts the whole song.",
          "tempoGroove": "Ballads 58-72 BPM (often in 6/8 \u2014 a rolling, waltz-like sway \u2014 or a half-time feel, where the drums move at half speed), mid-tempos 84-104 BPM with an R&B-leaning pocket, celebratory uptempos 108-126 BPM. Word density is medium: verses conversational and specific, choruses tightened into short parallel lines. Phrasing sits between choir writing and urban gospel \u2014 some push and pull against the beat, but the melody stays the star.",
          "writingDials": [
            "Testimony 'I' carries the whole song more than in any other gospel lane except quartet \u2014 the singer's specific story IS the song; the chorus universalizes the feeling without abandoning first person.",
            "Split the specificity: verses hold whatever hard specifics the user actually wrote \u2014 put those in, unsoftened; the chorus states the resolved truth in plain, singable words, with one short echoable phrase inside it that background voices can lift and answer. Specific verse, universal chorus.",
            "Rhyme density medium and mostly slant (near-rhyme) \u2014 perfect rhymes reserved for chorus landing lines; in the verses, honesty outranks rhyme.",
            "The bridge is load-bearing: it holds the turn (the moment faith kicked in, the decision, the answered prayer) and typically climbs melodically into a final key-lifted or re-voiced (sung a new way) chorus.",
            "Leave run room: end key phrases on open vowels and leave a beat or two of air at line ends for the vocalist to fill \u2014 but less ad-lib room (ad-libs are short unscripted vocal extras) than urban gospel takes.",
            "A late-song vamp is optional and shorter than a choir vamp \u2014 usually the chorus's single strongest phrase, isolated and repeated 4-8 times with ad-libs floating over it.",
            "Scripture allusion is lighter-touch here: a familiar biblical image folded into modern everyday speech, not quoted phrasing."
          ],
          "rendering": "Polished modern production: piano or keys-led, live-feeling drums, electric bass, clean guitar swells, string or pad beds, and tight stacked background vocals (a small polished stack, not a mass choir) entering at the chorus. Lead is a featured soloist with gospel runs. Ballads big and cinematic with a key lift near the end; mid-tempos with an R&B-informed pocket and lush extended church chords. Era marker: 2000s-2020s gospel radio \u2014 clean, warm, contemporary sheen over church harmony.",
          "storyFit": "The widest lane in gospel. Best for personal testimony of any kind (health scares, grief, recovery, new beginnings, gratitude), encouragement songs aimed at one struggling listener, and milestone tributes carrying a faith frame. Weak for purely corporate worship moments (a room singing to God belongs in Praise & Worship) and for stories that want grit and street texture (urban gospel serves those better).",
          "parodyTraps": "Stacking greeting-card faith clich\xE9s with zero personal detail. Choruses so wordy nobody could sing along by the second listen. Skipping the turn \u2014 a testimony with no before-and-after is just a mood, not a testimony. Forcing churchy vocabulary onto a user who wrote their story in plain modern speech.",
          "performance": {
            "prose": "Density moderate; min adlibs 5; delivery tags [Vocal Run] [Harmonies] [Soft] [Build] [Big Finish]. This room performs like a featured soloist on a gospel-radio single \u2014 one testifying voice out front with a small polished background stack, and the stack is backup, never a congregation: it lifts the lead's own words instead of answering with new ones. Signature: the lifted echo \u2014 the chorus carries one short echoable phrase, and on every return the stack lifts and answers exactly that phrase while the lead spends its runs in the line-end air the writing left on open vowels; the bridge climbs through a [Build] into the key-lifted final chorus, where the biggest run of the song finally lands. Placement: the floor of 5 is met without ever crowding the testimony \u2014 verses stay nearly bare under a [Soft] header (at most one softly answered phrase where the story turns), roughly 2 stack-lifts across the chorus returns, 1 run cue at the bridge peak, and the rest in the optional short vamp, where the strongest chorus phrase repeats 4-8 times with adlibs floating over it. Tag identity: a soloist and a small polished stack \u2014 (background: lift of the chorus phrase) on hook returns, run cues at phrase ends, one [Soft] confessional verse header, one [Big Finish] on the key-lifted last chorus. No mass choir and no room answering back \u2014 one witness with tasteful backup, radio-clean.",
            "adlibDensity": "moderate",
            "minAdlibs": 5,
            "deliveryTags": [
              "[Vocal Run]",
              "[Harmonies]",
              "[Soft]",
              "[Build]",
              "[Big Finish]"
            ]
          },
          "builder": {
            "instruments": [
              "grand piano",
              "warm keys",
              "live-feel drums",
              "electric bass",
              "clean guitar swells",
              "string pads"
            ],
            "themes": [
              "Testimony / what God brought me through",
              "Faith through the storm",
              "Gratitude",
              "Deliverance"
            ],
            "purposes": [
              "Testify",
              "Comfort in grief",
              "Encourage / motivate",
              "Celebrate",
              "Altar call"
            ]
          }
        },
        {
          "id": "praise-n-worship",
          "name": "Praise & Worship",
          "oneLine": "Songs a whole room sings straight TO God \u2014 simple enough to learn in one pass, deep enough to repeat for ten minutes.",
          "tempoGroove": "Worship ballads 60-76 BPM with a straight feel and long sustained phrases; anthemic builds 72-84 BPM; uptempo corporate praise 100-128 BPM straight-ahead. Word density is the LOWEST in gospel: few words, long notes, lots of air. A congregation learning the song in real time cannot process dense lines.",
          "writingDials": [
            "POV is vertical and constant: second person TO God ('You') dominates, with 'we/us' for the room. Personal 'I' appears only as the doorway into 'You.' This is the one gospel lane where you do NOT pivot POV mid-song \u2014 switching from talking TO God to talking ABOUT God breaks the room.",
            "Write for instant singability: phrases of roughly 4-8 syllables, repeated exactly, easy to pitch. A first-time listener should be singing by the second chorus. Predictability is a feature here, not a flaw.",
            "Depth comes from repetition that deepens, not from new information: the same phrase means more the fifth time because the build and the room have grown around it. Choose phrases that can bear repetition \u2014 declarative, present-tense statements about who God is that stay true every time they're sung, not one-time narrative events. The bend keeps a floor: the approach verse still plants a real detail or two from the user's own story before the repeats take over \u2014 compressed, never erased.",
            "Rhyme density is very low \u2014 heavy rhyme can even feel manipulative in worship. Parallel phrasing and repetition replace it.",
            "Structure convention: low, personal verse (the approach) \u2192 chorus (the declaration) \u2192 a bridge or tag that becomes THE moment \u2014 in modern worship that short escalating bridge is often the most-remembered part of the song; design it as the peak, not an afterthought.",
            "Pick ONE attribute of God that the user's actual story points at \u2014 provider, healer, protector, comfort \u2014 and stay on it the whole song. Listing many attributes flattens all of them.",
            "Write a line that can survive being whispered: the standard arc includes a near-silent breakdown (voice plus one instrument) before the final full-band chorus. Unlike the choir lane, where that quiet moment is a NEW confessional line, the exposed line here is the SAME declaration the room has been repeating, proving it still holds with nothing behind it."
          ],
          "rendering": "Two textures live in this one lane. The default is gospel worship: piano and Hammond organ leading, rich church-chord harmony, choir-flavored group vocals swelling behind a lead who runs freely \u2014 warm, live sanctuary energy. Switch to the ambient worship-band texture \u2014 warm synth pads, delay-and-reverb electric guitars, a steady kick-driven build, roomy congregation-style group vocals, a close and plain lead that barely runs \u2014 only when the user's language or references point there. Either way, keep the long dynamic arc: sparse first verse, near-silent drop-down, huge layered final choruses. Era marker: 2010s-2020s live-recorded worship, spacious, builds over flash.",
          "storyFit": "Best for stories written as prayer or thanks addressed to God, congregational moments (services, baptisms, a worship moment inside a wedding), and seasons of surrender, awe, or waiting. Bad for detailed personal narratives (worship compresses story into a single posture toward God), tribute songs to people, and any request where the user's specific events are the point \u2014 this lane trades specificity for a room full of voices.",
          "parodyTraps": "Vague stock nature imagery stacked with no anchor in the user's actual story. Wordy verses nobody could sing on first hearing. Pivoting mid-song from addressing God to describing God. Building a huge emotional swell around a line that isn't worth repeating \u2014 the build must be earned by the phrase at its center.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Quiet] [Soft] [Build] [Harmonies] [Crescendo]. This room performs by repetition, not decoration \u2014 the cast is the room itself: a worship leader and a praise team out front, a congregation singing every word, all facing one direction, so the work adlibs do elsewhere is done here by the same phrase returning bigger. Signature: the leader's short lifted call \u2014 a repeated word from the declaration or a brief sung invitation floated over the room just before the next section \u2014 while the praise team's harmonies swell under the repeats and the congregation carries the phrase itself. Placement: the floor of 3 lives at the seams, never inside a phrase the room is learning: one leader call at the turn into the chorus, one breathed or hummed moment in the near-silent breakdown where the bare declaration stands with one instrument under a [Quiet] header, and one swelling group answer as the final chorus rebuilds through a [Crescendo]; verses stay bare, and the long arc from near-silence to full room is carried by [Build] headers more than by adlib count. Tag identity: a leader, a praise team, and a congregation \u2014 (leader: short call into the next section) lines, (congregation swells) and (praise team harmonies rise) direction lines, group harmonies blooming only as the song grows. Nobody performs AT anyone: every voice faces God, and the leader's calls serve the room's singing, never a solo spotlight \u2014 the exact opposite of the choir room's staged lead-and-wall drama.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Quiet]",
              "[Soft]",
              "[Build]",
              "[Harmonies]",
              "[Crescendo]"
            ]
          },
          "builder": {
            "instruments": [
              "piano",
              "Hammond organ",
              "warm synth pads",
              "delay-and-reverb electric guitars",
              "steady kick-driven drums",
              "acoustic guitar"
            ],
            "themes": [
              "Praise & worship",
              "Gratitude",
              "Celebration of His love",
              "Faith through the storm"
            ],
            "purposes": [
              "Worship / exalt",
              "Lift the congregation",
              "Altar call"
            ]
          }
        },
        {
          "id": "urban-gospel",
          "name": "Urban Gospel / Inspirational R&B & Trap",
          "oneLine": "Faith with today's sound \u2014 gospel truth over R&B and trap production, written in the user's everyday voice.",
          "tempoGroove": "R&B-leaning cuts 60-80 BPM with a half-time bounce and deep pocket; trap-influenced tracks written at 130-150 BPM but felt in half-time (so they groove like 65-75); mid-tempo bounce 88-100 BPM. Word density is the highest in gospel \u2014 conversational, syncopated phrasing with more syllables per bar than any sibling lane, but still leaving pockets of air for ad-libs.",
          "writingDials": [
            "Write in the user's actual speech register: modern, casual, plain. Church vocabulary appears only where the user's own story already lives there \u2014 the faith is in the content, never in costume word choice.",
            "Testimony 'I' with the mess left in: whatever hard specifics the user actually wrote go into the verses unsoftened. The before must be as vivid as the after \u2014 sanitizing the struggle kills this lane.",
            "Syncopation is the engine: start phrases off the beat, tuck extra syllables, land early or late. The words should bounce like an R&B or hip-hop melody line, not sit square like a hymn \u2014 this is the one gospel lane where square phrasing is the mistake.",
            "Rhyme density is the highest in gospel: internal rhyme and multi-syllable slant (near-rhyme) borrowed from hip-hop are welcome \u2014 but conversational flow still outranks rhyme when they conflict.",
            "Hooks behave like R&B hooks: short, rhythmic, repeated \u2014 often an everyday phrase flipped so it carries a second, sacred meaning at the same time. Double meanings are at home here in a way they are nowhere else in gospel.",
            "Leave ad-lib real estate: pockets at line ends for stacked ad-libs, spoken asides, and breathy runs \u2014 the space IS part of the writing.",
            "The ascent is a production move, not a key change: write one nakedly honest lyric moment specifically for the beat drop-out before the final hook, where the voice stands alone.",
            "The bridge may be spoken or rapped \u2014 a talking-to-yourself or under-the-breath prayer moment reads authentic here where it would break the other gospel lanes.",
            "Cross-genre firewall: R&B's Trap-Soul and hip-hop's Melodic Rap run the same drums and tempo as this one \u2014 the dial that makes it Urban Gospel is testimony, a before-and-after with an ascent at the end."
          ],
          "rendering": "808 bass, trap hi-hats with rolls and stutters or smooth R&B drum programming, dark-to-warm keys and pads, pitched vocal chops, tight modern vocal stacks with heavy ad-lib layering. Lead vocal intimate and close-mic'd; light saturation or melodic autotune texture acceptable as a style choice. Half-time bounce with a beat drop-out before the final hook. Era marker: mid-2010s to 2020s gospel-R&B and Christian trap crossover \u2014 playlist-ready, mixed like mainstream R&B/hip-hop, church chords hidden inside the production.",
          "storyFit": "Best for younger voices, testimonies with rough edges (streets, recovery, anxiety, hustle seasons), encouragement for people who don't sit in pews, and faith-rooted motivation. Bad for congregational singing (no room sings a syncopated melody together), church-service moments, and older-generation tributes where the production choice itself would read as disrespectful.",
          "parodyTraps": "Renting slang the user never wrote \u2014 borrowed slang ages in a week and reads fake instantly. Preaching down at the listener over a trap beat \u2014 this lane talks WITH people, never at them. Scrubbing the struggle until the song is all victory lap. Porting church clich\xE9s onto modern production without translating the language.",
          "performance": {
            "prose": "Density moderate; min adlibs 6; delivery tags [Spoken] [Whispered] [Vocal Run] [Harmonies] [Drop]. This room performs like testimony with 808s \u2014 one modern voice and its own stacked second track, the same two-voice grammar trap and trap-soul run, except the second voice answers the witness, not the flex. Signature: the testimony punctuation \u2014 a line lands, and in the pocket the syncopation left, the lead's own stack answers with an echoed key word, a breathy run, or a low murmured agreement; under each hook return the stack thickens, so the everyday phrase carrying the second sacred meaning lands doubled by the end. Placement: adlibs live only in the line-end pockets the writing left \u2014 roughly one every two bars in the verses, doubled under the hook \u2014 and the spoken or rapped bridge runs as an under-the-breath prayer on its own [Spoken] or [Whispered] lines; the one bare zone is the beat drop-out before the final hook, where the nakedly honest line stands completely alone, then the stack floods back with the last hook behind a [Drop]. Tag identity: the lead and its own layered self \u2014 (echo of the key word) and (breathy run) at pocket ends, a low (murmured agreement) under the hook, prayer-close [Whispered] headers at the bridge. Never a choir, never a congregation: the church chords hide in the production while one voice testifies over them.",
            "adlibDensity": "moderate",
            "minAdlibs": 6,
            "deliveryTags": [
              "[Spoken]",
              "[Whispered]",
              "[Vocal Run]",
              "[Harmonies]",
              "[Drop]"
            ]
          },
          "builder": {
            "instruments": [
              "808 sub-bass",
              "rolling trap hi-hats",
              "smooth R&B drum programming",
              "warm keys",
              "airy pads",
              "pitched vocal chops"
            ],
            "themes": [
              "Testimony / what God brought me through",
              "Faith through the storm",
              "Deliverance"
            ],
            "purposes": [
              "Testify",
              "Encourage / motivate",
              "Celebrate"
            ]
          }
        },
        {
          "id": "quartet-style",
          "name": "Quartet-Style (Southern Soul Gospel)",
          "oneLine": "The old-school quartet sound \u2014 a gritty lead telling a story while the group answers behind them, driving harder until the church is on its feet.",
          "tempoGroove": "Slow-burn story songs 66-84 BPM with a heavy swung backbeat. The drive (the intensifying ending push) often pushes the tempo forward \u2014 though some drives hold tempo and climb through dynamics and the lead's density alone. Almost always swung, never stiff. Word density splits: lead verses are medium-dense and narrative \u2014 nearly talked \u2014 while the group's answer lines are tiny, 2-5 words hammered on the same beat every time.",
          "writingDials": [
            "Write it as a story with scenes: quartet verses are narrative \u2014 a specific day, a specific place, what happened, who said what. This is the most story-forward lane in gospel; the user's concrete details go IN, not compressed out. This engine \u2014 God's act inside a narrated story, told through scenes, a drive, and one anchor phrase \u2014 is also what separates the lane from R&B's Classic Soul, which is secular love and celebration borrowing worship language.",
            "Put two voices on the page: the lead's lines (long, conversational, preacher-adjacent phrasing that can stretch and repeat at will) and the background answer (ONE short fixed phrase the group repeats identically \u2014 choose it early, because it anchors the whole song).",
            "The DRIVE is the ascent: the final section strips down to the anchor phrase while the lead escalates over it. Write the anchor plus three or four escalation ideas \u2014 turns and intensifying restatements of the same thought \u2014 instead of new verses.",
            "Repetition-as-preaching is the craft: the lead repeating one line three or four times with growing intensity is the style working, not lazy writing.",
            "Rhyme is loose and optional; the storytelling cadence and the call-and-response lock (leader calls, group answers on time) matter far more than rhyme.",
            "POV: testimony 'I' or third-person parable \u2014 telling somebody else's story to make the point \u2014 are both traditional. Direct-to-God 'You' address is rare in this lane.",
            "Physical, lived-in, and concrete beats abstract: pull the two or three most touchable details out of the user's own story and build scenes around those.",
            "A spoken or half-sung opening is a legitimate section: the lead 'talking' the audience into the song before it fully starts is part of the tradition."
          ],
          "rendering": "Electric guitar with twang and tremolo, bass and drums with a heavy swung backbeat, Hammond organ or piano stabs, four- or five-voice harmony backgrounds behind a rough-edged lead vocal \u2014 grit, rasp, and shouts welcome. The arrangement must build to a drive: tempo and intensity climbing, backgrounds chugging one phrase, lead ad-libbing over the top, hard hits and holds at the finish. Era marker: 1950s-70s quartet tradition, alive on today's Southern soul circuit \u2014 live, raw, church-floor energy over studio polish.",
          "storyFit": "Best for narrative testimonies told start to finish, tributes to elders and mothers and fathers, songs for older congregations, homegoing services, and long-road stories spanning years of struggle or family history. Bad for abstract feelings with no events, youth-targeted songs, and quiet intimate confessions \u2014 this format is public and communal, built for a room, not headphones.",
          "parodyTraps": "Faking country-church grammar or spelling out an accent the user never wrote \u2014 the rhythm and phrasing carry the tradition in standard English. Writing polished, symmetrical pop lines for the lead, who should read like heightened speech. Skipping the drive and ending like a pop record. Making the group's answer a full sentence \u2014 if the background phrase can't fit on a church fan, it's too long.",
          "performance": {
            "prose": "Density heavy; min adlibs 7; delivery tags [Call and Response] [Spoken] [Harmonies] [Belting] [Crescendo] [Big Finish]. This room performs like the oldest cast in gospel on a church floor \u2014 four named parts: the lead out front, free to stretch and repeat, the tenor riding high, the baritone filling the middle, the bass walking the bottom, the group hammering the ONE anchor phrase the writing chose early (the render may thicken it with a fifth voice). Signature: the lock \u2014 the lead calls loose and preacher-adjacent, the group answers with the same tiny fixed phrase on the same beat every time, tenor on top, bass underneath; in the drive the group strips to that anchor and chugs it while the lead escalates over it in repeats, rasp, and shouts, into the hard hits and holds of the [Big Finish]. Placement: the spoken opening runs on its own [Spoken] lines \u2014 the lead talking the room into the song; verses carry the group's answer at the end of every call; the drive is the heaviest zone \u2014 the anchor looping under a [Crescendo] while the lead ad-libs over the top \u2014 and most of the floor of 7 lives there and in the verse answers, never scattered mid-phrase. Tag identity: a lead and a named four-part group \u2014 line-start Lead: calls with the group's (fixed anchor answer) behind them, (bass walks down) and (tenor lifts above the lead) direction lines, and a drive header where the anchor chugs and the lead preaches over it. Four parts, one phrase, one direction: up.",
            "adlibDensity": "heavy",
            "minAdlibs": 7,
            "deliveryTags": [
              "[Call and Response]",
              "[Spoken]",
              "[Harmonies]",
              "[Belting]",
              "[Crescendo]",
              "[Big Finish]"
            ]
          },
          "builder": {
            "instruments": [
              "tremolo electric guitar",
              "live bass",
              "heavy swung backbeat drums",
              "Hammond organ",
              "piano stabs",
              "handclaps"
            ],
            "themes": [
              "Testimony / what God brought me through",
              "Deliverance",
              "Faith through the storm",
              "For the congregation"
            ],
            "purposes": [
              "Testify",
              "Comfort in grief",
              "Lift the congregation",
              "Celebrate"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "choir",
          "strength": "strong",
          "roomId": "traditional-gospel"
        },
        {
          "cue": "pastor appreciation",
          "strength": "strong",
          "roomId": "traditional-gospel"
        },
        {
          "cue": "church anniversary",
          "strength": "strong",
          "roomId": "traditional-gospel"
        },
        {
          "cue": "hymn",
          "strength": "strong",
          "roomId": "traditional-gospel"
        },
        {
          "cue": "praise break",
          "strength": "strong",
          "roomId": "traditional-gospel"
        },
        {
          "cue": "church",
          "strength": "weak",
          "roomId": "traditional-gospel"
        },
        {
          "cue": "congregation",
          "strength": "weak",
          "roomId": "traditional-gospel"
        },
        {
          "cue": "homegoing",
          "strength": "weak",
          "roomId": "traditional-gospel"
        },
        {
          "cue": "sunday morning",
          "strength": "weak",
          "roomId": "traditional-gospel"
        },
        {
          "cue": "testimony",
          "strength": "strong",
          "roomId": "contemporary-gospel"
        },
        {
          "cue": "brought me through",
          "strength": "weak",
          "roomId": "contemporary-gospel"
        },
        {
          "cue": "recovery",
          "strength": "weak",
          "roomId": "contemporary-gospel"
        },
        {
          "cue": "healed",
          "strength": "weak",
          "roomId": "contemporary-gospel"
        },
        {
          "cue": "healing",
          "strength": "weak",
          "roomId": "contemporary-gospel"
        },
        {
          "cue": "encourage",
          "strength": "weak",
          "roomId": "contemporary-gospel"
        },
        {
          "cue": "funeral",
          "strength": "weak",
          "roomId": "contemporary-gospel"
        },
        {
          "cue": "passed away",
          "strength": "weak",
          "roomId": "contemporary-gospel"
        },
        {
          "cue": "praise team",
          "strength": "strong",
          "roomId": "praise-n-worship"
        },
        {
          "cue": "worship",
          "strength": "strong",
          "roomId": "praise-n-worship"
        },
        {
          "cue": "thank you lord",
          "strength": "strong",
          "roomId": "praise-n-worship"
        },
        {
          "cue": "prayer",
          "strength": "weak",
          "roomId": "praise-n-worship"
        },
        {
          "cue": "surrender",
          "strength": "weak",
          "roomId": "praise-n-worship"
        },
        {
          "cue": "baptism",
          "strength": "weak",
          "roomId": "praise-n-worship"
        },
        {
          "cue": "altar call",
          "strength": "weak",
          "roomId": "praise-n-worship"
        },
        {
          "cue": "gospel trap",
          "strength": "strong",
          "roomId": "urban-gospel"
        },
        {
          "cue": "christian trap",
          "strength": "strong",
          "roomId": "urban-gospel"
        },
        {
          "cue": "gospel r&b",
          "strength": "strong",
          "roomId": "urban-gospel"
        },
        {
          "cue": "trap",
          "strength": "strong",
          "roomId": "urban-gospel"
        },
        {
          "cue": "808s",
          "strength": "weak",
          "roomId": "urban-gospel"
        },
        {
          "cue": "808",
          "strength": "weak",
          "roomId": "urban-gospel"
        },
        {
          "cue": "rap",
          "strength": "weak",
          "roomId": "urban-gospel"
        },
        {
          "cue": "streets",
          "strength": "weak",
          "roomId": "urban-gospel"
        },
        {
          "cue": "anxiety",
          "strength": "weak",
          "roomId": "urban-gospel"
        },
        {
          "cue": "relapse",
          "strength": "weak",
          "roomId": "urban-gospel"
        },
        {
          "cue": "quartet",
          "strength": "strong",
          "roomId": "quartet-style"
        },
        {
          "cue": "southern soul",
          "strength": "strong",
          "roomId": "quartet-style"
        },
        {
          "cue": "grandma",
          "strength": "weak",
          "roomId": "quartet-style"
        },
        {
          "cue": "grandmother",
          "strength": "weak",
          "roomId": "quartet-style"
        },
        {
          "cue": "grandpa",
          "strength": "weak",
          "roomId": "quartet-style"
        },
        {
          "cue": "grandfather",
          "strength": "weak",
          "roomId": "quartet-style"
        },
        {
          "cue": "elders",
          "strength": "weak",
          "roomId": "quartet-style"
        },
        {
          "cue": "country church",
          "strength": "weak",
          "roomId": "quartet-style"
        },
        {
          "cue": "old school",
          "strength": "weak",
          "roomId": "quartet-style"
        },
        {
          "cue": "homegoing",
          "strength": "weak",
          "roomId": "quartet-style"
        }
      ]
    },
    "reggae": {
      "id": "reggae",
      "name": "Reggae",
      "aliases": [
        "reggae music",
        "roots reggae",
        "lovers rock",
        "dancehall"
      ],
      "profileText": "A reggae writer starts with the riddim \u2014 the drum-and-bass foundation the words will live on \u2014 and treats the words as guests on it. The genre's heartbeat is the one-drop: the kick and the rim land together on beat three, and beat one is left empty, so the groove breathes exactly where most genres stomp. That open first beat IS the identity. The offbeat guitar skank marks the spaces between the beats, and the bass, mixed up front and carrying the melody, does the talking between phrases. So the writing job is spatial before it is verbal: phrases start just after the downbeat and stop before the bar ends, lines stay short enough that the gaps remain audible, and a lyric sheet with no holes in it has failed before its first word is judged. The writer plans where the words are NOT.\n\nRepetition is a feature, never a failure. A reggae hook is a short, chantable phrase repeated more times than feels polite on paper, and it gains power each round \u2014 the same words land heavier the fifth time because the groove and the people around them have grown. Rhyme stays loose almost everywhere: repeating a key word beats a clever rhyme, slant rhyme and no rhyme are normal, and a showy scheme reads as another genre. Dancehall is the one exception \u2014 dense internal rhyme, one end-sound ridden hard for lines at a time \u2014 because momentum is its whole job.\n\nThree registers cover nearly everything the genre says: sufferation (struggle, injustice, endurance told plainly), uplift (faith, gratitude, good news, reassurance), and romance. The same groove carries all three, and the writer always knows who the song is for \u2014 a whole people, where the singer's I stands for we (roots); one person at whisper distance (lovers rock); or the party in front of the deejay right now (dancehall). That single question \u2014 who is this for \u2014 moves more dials than any other: it sets the point of view, the hook's shape, and how personal the details get.\n\nThe law above every dial is dialect. Patois appears ONLY if the user wrote it in their own story \u2014 in the lyrics, the adlibs, the delivery directions, and the render notes alike. Rhythm and phrasing carry the identity in standard English: where the phrase starts, where it stops, what the bass answers. The craft terms these pages teach with \u2014 riddim, skank, one-drop, deejay, dub, sufferation, bashment \u2014 are the writer's working vocabulary, never the song's: they stay out of the lyrics, adlibs, and render notes too unless the user wrote them first, and delivery is directed as rhythm and energy in plain English \u2014 cadence, bounce, punch \u2014 never as an accent or a nationality. Generated patois, accent spellings, or island slang read as parody \u2014 a costume \u2014 and in this genre the costume is worse than being boring. The same goes for the postcard: beaches, palm trees, and cocktails are not reggae; the user's own places, work, weather, and people are.\n\nRendering, in any room, protects three things. The space: beat one stays open and the instruments leave the gaps the writing planned. The foundation: deep bass up front and the skank clearly audible \u2014 reggae mixes are built from the bottom. The voice as a person: warm and human, answered by whichever cast the room declares \u2014 a harmony group, soft doubles, or a crowd \u2014 never an added accent. Every dial above bends to the user's story; none of it may ever change what the song is about.",
      "defaultRoomId": "roots-reggae",
      "rooms": [
        {
          "id": "roots-reggae",
          "name": "Roots Reggae",
          "oneLine": "The classic 1970s reggae of faith, struggle, and uplift \u2014 slow, deep, and sung like a message to a whole people, whether the news is heavy or good.",
          "tempoGroove": "60-90 BPM (most classics sit in the 70s) in a one-drop feel \u2014 the kick and rim land together on beat three and beat ONE is left empty, so the groove breathes exactly where other genres stomp \u2014 with swung offbeat guitar skank marking the spaces between beats. Word density is low-to-medium: short phrases with real air between them so the bass melody and the offbeat stay audible.",
          "writingDials": [
            "Riddim-first: the words are guests on the drum-and-bass foundation. Start phrases just after the downbeat and stop before the bar ends so the bass and the skank get the spotlight between phrases \u2014 a sheet that fills every beat has failed the genre before a single word is judged.",
            "Widen the story: the singer's personal pain or hope is treated as everyone's \u2014 a lost job becomes a song about a system, one person's good news becomes everyone's reason to smile. Keep the user's specific details in the verses, but let the chorus speak for more than one person.",
            "The hook is a chant: a short rallying phrase of roughly three to six words, built for a crowd to sing together, repeated more times than feels polite on paper. It gains power each round \u2014 repetition is the feature, never the failure.",
            "Rhyme loose: repeating a key word beats a clever rhyme; slant rhyme and no-rhyme are normal; a tight, showy rhyme scheme reads as the wrong genre.",
            "Imagery is big and physical \u2014 pulled from the nature, weather, work, and places in the user's OWN story, never from a stock reggae image bank. It may lean scriptural only if the user's own story carries faith. Never postcard island scenery.",
            "Sections: verses may run long and preach a little; the bridge is often replaced by a stripped-down instrumental stretch (a dub drop) where the words stop entirely \u2014 plan the lyric around that silence.",
            "Point of view: an I that stands for we, or direct address to the powerful or to the people. Second-person confrontation is fully at home here.",
            "Two registers, one voice: sufferation and uplift ride the same groove \u2014 heavy news and good news are both delivered warm and communal, so the words can turn dark without the song ever turning cold."
          ],
          "rendering": "One-drop drums with kick and rim landing together on beat three, deep melodic bass mixed up front, offbeat guitar skank, bubbling organ, horn-section stabs, spring-reverb echo trails. Either 1970s analog tape warmth or the cleaner modern roots-revival sound. Lead vocal answered by a small harmony group singing the responses \u2014 response words stay in the song's own plain English, never an added accent.",
          "storyFit": "Best for: struggle, injustice, faith, endurance, homeland, family legacy, warnings and hope \u2014 and just as naturally the light side: easy communal joy, gratitude, good news, a carefree day, reassurance for someone who is worried. Roots carries heavy and light with the same warm, communal voice. Poor fit: flirty club stories, petty gossip, luxury bragging \u2014 those belong to dancehall; and a private two-person romance at whisper distance \u2014 that is lovers rock's lane, never kept here by default.",
          "parodyTraps": "Any patois spelling the user did not write themselves; marijuana references the user never mentioned; religious names or slogans inserted uninvited; postcard island imagery (beaches, palm trees, cocktails); borrowing famous reggae hook phrases; making the chorus clever instead of chantable.",
          "performance": {
            "prose": "Density moderate; min adlibs 5; delivery tags [Call and Response] [Harmonies] [Instrumental Break] [Breakdown] [Groove]. This room performs like a message meeting its people \u2014 one lead voice with a small harmony group answering as a congregation of the people, and the band itself given whole stretches to speak. Signature: the congregation response \u2014 the harmony group answers the chant hook's last words in the gaps the phrasing leaves, and each return of the chant gathers voices, so the same words land heavier every round. Placement: responses live on the chant hook and at the verse line-ends that ask for witness \u2014 roughly one response every other line in the chorus, verses lighter; the dub drop gets an [Instrumental Break] or [Breakdown] header on its own line where the words stop entirely, and the final rounds of the chant stack the fullest. Tag identity: the people in the room \u2014 a small harmony group singing short (response phrases) to the lead's call like a congregation of the people, group voices swelling on each chant repeat, direction lines marking the dub drop. No solo showing off, no club hype \u2014 the crowd answers as one, and every response is plain-language words from the song's own sheet, never an added accent.",
            "adlibDensity": "moderate",
            "minAdlibs": 5,
            "deliveryTags": [
              "[Call and Response]",
              "[Harmonies]",
              "[Instrumental Break]",
              "[Breakdown]",
              "[Groove]"
            ]
          },
          "builder": {
            "instruments": [
              "one-drop drums",
              "deep melodic bass",
              "skanking offbeat guitar",
              "organ bubble",
              "horn stabs",
              "melodica",
              "spring-reverb echo"
            ],
            "themes": [
              "Sufferation & struggle",
              "Freedom & justice",
              "One love / unity",
              "Praise & spirituality",
              "Celebration"
            ],
            "purposes": [
              "Uplift the people",
              "Protest",
              "Give thanks",
              "Skank / dance"
            ]
          }
        },
        {
          "id": "lovers-rock",
          "name": "Lovers Rock",
          "oneLine": "Reggae's tender love-song lane \u2014 the smoother UK sound born in mid-1970s South London, soft, romantic, and sung close, carried by Jamaica's crooners too.",
          "tempoGroove": "65-80 BPM, a gentle swung one-drop with every edge softened \u2014 the space on beat one stays, but the room is a bedroom, not a rally. Low word density with long held notes at line-ends; the singer croons, so lines must leave room to stretch and bend.",
          "writingDials": [
            "Keep the world small: one room, two people. Never widen to community or message \u2014 that is roots territory. The whole song is a private conversation.",
            "The verses are a real conversation moving forward: verse two must advance the story of these two specific people \u2014 an answer, a memory, a next step \u2014 never re-circle verse one's feeling.",
            "Write for a crooner: end the lines that carry the feeling on open vowels a voice can hold and slide; avoid hard consonant endings there.",
            "Couplets that resolve: gentle perfect or near-perfect rhymes that close sweetly feel romantic here, where roots deliberately leaves lines hanging open.",
            "The hook is a promise or a question aimed at one specific person \u2014 intimate, never a crowd chant. If a stadium could shout it, it is wrong for this lane.",
            "Answer vocals are part of the writing: soft backing voices echo the last words of lines, so write line-endings worth echoing \u2014 and the gaps of the one-drop still belong to the bass and the skank, even this close.",
            "The bridge earns its place with a confession or a doubt \u2014 the one moment the sweetness admits a crack, which makes the final chorus land harder.",
            "Point of view: first person to you, and that you must feel like the real person from the user's story \u2014 include one detail only they would recognize."
          ],
          "rendering": "Soft one-drop drums with a rimshot instead of a full snare, warm round bass, silky offbeat guitar, electric-piano chords, lush strings or pads, a sax or melodica fill answering the voice. Tender lead vocal with airy doubled harmonies and generous reverb; late-70s/80s London-studio warmth.",
          "storyFit": "Best for: love letters, anniversaries, apologies, new crushes, missing a partner, devotion through hard times. Poor fit: protest, party bangers, boasting, explicit heat \u2014 lovers rock suggests, it never spells out; that heat belongs to dancehall.",
          "parodyTraps": "Confusing tenderness with beach-bar island-romance clich\xE9s; getting sexually explicit; machine-added patois pet names; a chorus that behaves like a crowd chant instead of a whisper; strings-and-roses greeting-card lines with no specific person in them.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Soft] [Crooning] [Harmonies] [Falsetto] [Sax Solo]. This room performs at whisper distance \u2014 one tender lead voice with its own soft harmony doubles, and nobody else in the room. Signature: the soft echo \u2014 an airy doubled harmony repeating the last words of a line the way a lover repeats a promise back, close and breathy, never a group answering and never a crowd. Placement: the floor of 3 sits where the tenderness peaks \u2014 roughly one soft echo under the hook's last words, one at the line where the bridge admits its crack, and one hummed or breathed note in the outro; verses stay nearly bare so the crooning carries them, and a [Sax Solo] or melodica answer can take a whole section instead of any vocal show. Tag identity: an intimate solo voice with soft self-harmonies \u2014 airy (echo of the last words) doubles, a [Falsetto] lift saved for the final chorus, a [Soft] header where the song pulls closest. No congregation, no deejay, no crowd \u2014 two people and a slow groove, and every echoed word comes from the song's own sheet.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Soft]",
              "[Crooning]",
              "[Harmonies]",
              "[Falsetto]",
              "[Sax Solo]"
            ]
          },
          "builder": {
            "instruments": [
              "soft rimshot one-drop drums",
              "warm round bass",
              "silky offbeat guitar",
              "electric piano",
              "lush strings",
              "saxophone",
              "melodica"
            ],
            "themes": [
              "Romance (lovers rock)",
              "Missing someone",
              "Celebration"
            ],
            "purposes": [
              "Romance",
              "Slow dance",
              "Give thanks"
            ]
          }
        },
        {
          "id": "dancehall",
          "name": "Dancehall",
          "oneLine": "Jamaica's high-energy party and boast music \u2014 born in the late 1970s, defined by the mid-80s digital era, running to today's chart crossovers: punchy digital riddims and rapid rhythm-riding vocals.",
          "tempoGroove": "95-110 BPM with the signature syncopated bounce (kick hits grouped 3+3+2 across the bar \u2014 a long-long-short bounce). Verses are word-dense and rap-adjacent; hooks are short chants or commands. The groove bounces, so the words must bounce with it.",
          "writingDials": [
            "Verses ride the riddim (the instrumental backing track): near-rap cadence with dense internal rhyme locked to the bounce \u2014 the highest word density anywhere in the reggae family.",
            "Ride one rhyme sound for four or more lines on purpose: hammering the same end-sound builds momentum here, where in most genres it would read as lazy.",
            "The hook is a command or a catchphrase: tell the floor what to do or state the boast flat. Two short alternating lines trading back and forth make a legitimate hook.",
            "Write punch-and-pause: land a hard phrase, then leave a beat of silence for the crowd's reaction \u2014 the space after the punch is part of the lyric, this room's version of the genre's riddim-first gaps.",
            "Present tense only: the song happens NOW, in the party or on the road. No backstory, no reflection \u2014 energy over narrative, always.",
            "Sections contrast by flow, not by chords: riddim culture builds many songs on one shared, named riddim, so the voice IS the song \u2014 switch the vocal rhythm between sections instead. Verses run 8-12 bars and the hook returns often; the pre-chorus is usually skipped. Short never means thin: at this density an eight-bar verse still out-words the hook, and every verse must land fresh boasts and details from the user's own story, never the hook restated.",
            "Boasts are stated, never explained \u2014 the moment a boast gets justified, it dies.",
            "Cross-genre firewall: hip-hop's Trap and Southern Bounce share the boasts and the party job \u2014 the dial that makes it Dancehall is the 3+3+2 bounce carrying the phrasing, with the deejay's rhythm-riding cadence written in the user's own plain English; American rap phrasing pasted over the riddim loses the bounce entirely."
          ],
          "rendering": "Hard digital drums with the 3+3+2 syncopated kick, cracking snare or clap, heavy sub bass, one dark minor-key synth riff doing most of the melodic work, sparse arrangement with hype vocal doubles on the punch words. Delivery is rhythmic deejay talk-singing (dancehall's rhythm-riding vocal style, the ancestor of rap's flow) more than melodic singing \u2014 deejay names the RHYTHM of the delivery, and rhythm is all a render note may ask of the voice: cadence, bounce, and punch in plain English, never an accent, a nationality, or patois vocalization beyond what the user's own sheet contains; modern versions may add trap-style hi-hats.",
          "storyFit": "Best for: party anthems, confidence and swagger, dance, bold flirtation, rivalry and winning, hustle pride. Poor fit: grief, worship, tender apology, slow reflection \u2014 the groove has no patience for them.",
          "parodyTraps": "Machine-written patois is the single fastest way to make it fake; American rap phrasing pasted over the beat (loses the bounce entirely); long storytelling verses; explaining or softening the boast; hooks with too many words for a crowd to shout back.",
          "performance": {
            "prose": "Density heavy; min adlibs 8; delivery tags [Spoken] [Call and Response] [Ad-Lib Section] [Build Up] [Drop]. This room performs like a deejay working a packed dancefloor \u2014 the lead rides the riddim and the crowd is the second instrument, with hype doubles cracking on the punch words. Signature: the answered punch \u2014 a hard phrase lands, and the written beat of silence gets the crowd's short shouted response or a hype double of the punch word, one answer per gap, so the record sounds like the party it is for. Placement: doubles hit the punch words the verse rhymes hammer; crowd responses fill the pauses after them and thicken on every hook return \u2014 the command hook earns a response on every pass, a [Build Up] and [Drop] can frame the hook's arrival, and the one place to stay bare is the two bars before the drop, where the riddim alone builds the pressure. Tag identity: a deejay and the crowd \u2014 hype (double of the punch word) on the hard lines, short (crowd: shouted response) answers in the written gaps, two-line hooks traded between lead and crowd. All delivery direction stays rhythm-and-energy language in plain English \u2014 cadence, bounce, punch \u2014 never a request for patois, accent, or island vocalization beyond words the user's own sheet already contains.",
            "adlibDensity": "heavy",
            "minAdlibs": 8,
            "deliveryTags": [
              "[Spoken]",
              "[Call and Response]",
              "[Ad-Lib Section]",
              "[Build Up]",
              "[Drop]"
            ]
          },
          "builder": {
            "instruments": [
              "hard digital drums",
              "heavy sub bass",
              "dark minor-key synth riff",
              "cracking snare claps",
              "trap-style hi-hats"
            ],
            "themes": [
              "Celebration",
              "Confidence & swagger",
              "Proving them wrong"
            ],
            "purposes": [
              "Skank / dance",
              "Flex / celebrate",
              "Party / celebrate"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "roots reggae",
          "strength": "strong",
          "roomId": "roots-reggae"
        },
        {
          "cue": "one drop",
          "strength": "strong",
          "roomId": "roots-reggae"
        },
        {
          "cue": "sufferation",
          "strength": "strong",
          "roomId": "roots-reggae"
        },
        {
          "cue": "struggle",
          "strength": "weak",
          "roomId": "roots-reggae"
        },
        {
          "cue": "injustice",
          "strength": "weak",
          "roomId": "roots-reggae"
        },
        {
          "cue": "protest",
          "strength": "weak",
          "roomId": "roots-reggae"
        },
        {
          "cue": "uplift",
          "strength": "weak",
          "roomId": "roots-reggae"
        },
        {
          "cue": "give thanks",
          "strength": "weak",
          "roomId": "roots-reggae"
        },
        {
          "cue": "faith",
          "strength": "weak",
          "roomId": "roots-reggae"
        },
        {
          "cue": "gratitude",
          "strength": "weak",
          "roomId": "roots-reggae"
        },
        {
          "cue": "lovers rock",
          "strength": "strong",
          "roomId": "lovers-rock"
        },
        {
          "cue": "anniversary",
          "strength": "strong",
          "roomId": "lovers-rock"
        },
        {
          "cue": "romance",
          "strength": "strong",
          "roomId": "lovers-rock"
        },
        {
          "cue": "romantic",
          "strength": "strong",
          "roomId": "lovers-rock"
        },
        {
          "cue": "first dance",
          "strength": "strong",
          "roomId": "lovers-rock"
        },
        {
          "cue": "love song",
          "strength": "weak",
          "roomId": "lovers-rock"
        },
        {
          "cue": "slow dance",
          "strength": "weak",
          "roomId": "lovers-rock"
        },
        {
          "cue": "my wife",
          "strength": "weak",
          "roomId": "lovers-rock"
        },
        {
          "cue": "my husband",
          "strength": "weak",
          "roomId": "lovers-rock"
        },
        {
          "cue": "my girlfriend",
          "strength": "weak",
          "roomId": "lovers-rock"
        },
        {
          "cue": "my boyfriend",
          "strength": "weak",
          "roomId": "lovers-rock"
        },
        {
          "cue": "wedding",
          "strength": "weak",
          "roomId": "lovers-rock"
        },
        {
          "cue": "apology",
          "strength": "weak",
          "roomId": "lovers-rock"
        },
        {
          "cue": "crush",
          "strength": "weak",
          "roomId": "lovers-rock"
        },
        {
          "cue": "dancehall",
          "strength": "strong",
          "roomId": "dancehall"
        },
        {
          "cue": "bashment",
          "strength": "strong",
          "roomId": "dancehall"
        },
        {
          "cue": "party",
          "strength": "weak",
          "roomId": "dancehall"
        },
        {
          "cue": "club",
          "strength": "weak",
          "roomId": "dancehall"
        },
        {
          "cue": "dance",
          "strength": "weak",
          "roomId": "dancehall"
        },
        {
          "cue": "flirt",
          "strength": "weak",
          "roomId": "dancehall"
        },
        {
          "cue": "flirting",
          "strength": "weak",
          "roomId": "dancehall"
        },
        {
          "cue": "swagger",
          "strength": "weak",
          "roomId": "dancehall"
        }
      ]
    },
    "afrobeats": {
      "id": "afrobeats",
      "name": "Afrobeats",
      "aliases": [
        "afrobeat",
        "afro beats",
        "afro-fusion",
        "afropop"
      ],
      "profileText": "An Afrobeats writer starts with the groove, not the sentence. The percussion is already talking before the first word arrives \u2014 the swung kick, the shakers, the space between them \u2014 and the writer's job is to find where the words dance on that pattern. Every line gets read aloud against the drums: stressed syllables land with the percussion hits, and the voice sits slightly behind the beat, relaxed, never chasing. A line that fights the groove is not fixed by singing it harder; it is recut until it dances. The melody and the drums are co-writers here, and words are chosen as much for how the mouth rides them as for what they say.\n\nEconomy is the second instinct. Phrases run short \u2014 a few strong words that survive being sung four times in a row \u2014 and they end early, leaving the last beats of the bar to the shakers, the answers, and the air. The gap is written property: the room decides who lives there (a communal chant answer, the singer's own hazy layer, or the log drum itself), but the writer cuts the hole on purpose. Open vowels and soft consonants carry the sweetness; a plain line that glides beats a clever line that crowds the mouth.\n\nRepetition is architecture, not a failure \u2014 this genre holds the curriculum's sanctioned bend. The hook can be half the song; verse two may deepen the same feeling instead of advancing a plot; freshness comes from how the melody bends on each return, how the voices stack, and what gets subtracted underneath. But the bend has a floor: the verses still carry the user's real details \u2014 the actual name, the actual blessing, the actual city \u2014 because repetition deepens a real story; it never replaces one. A loop with nothing true under it is a jingle.\n\nThe home registers are celebration, desire, and hustle-blessings, and they mix freely: gratitude sits inside a love song, blessings inside a success song, and thankfulness never clashes with wanting. The address stays simple and direct \u2014 a lover, God, life itself, or the room \u2014 and the chosen room sets how communal or interior it gets: one lane keeps the feeling sweet and universal with a crowd invited to answer, one turns inward to the awkward private detail, one compresses everything to the feeling of a single night on the floor.\n\nPerformance is planned on the page, and every room fields a different cast: mainline writes gaps for communal chant answers, alt\xE9 layers the singer's own voice into a haze, amapiano leaves space so the log drum can answer instead of a voice. Ad-libs obey the dialect law like everything else: sounds, hums, chants, and short honest answers in the song's own plain voice.\n\nIdentity is carried by rhythm, phrasing, and melodic shape in standard English \u2014 a law, not a preference. Pidgin appears only if the user wrote it in their own story; generated dialect, borrowed exclamations, and postcard-Africa scenery read as costume, and in this genre a costume is worse than a dull song. Rendering protects the same values: percussion mixed up where it can talk, a warm rounded low end, air between elements, and the voice silky and unhurried on top.",
      "defaultRoomId": "afrobeats",
      "rooms": [
        {
          "id": "afrobeats",
          "name": "Afrobeats",
          "oneLine": "The melodic West African pop sound of the last fifteen years \u2014 sweet, groove-heavy, low word count, built for repeat listening and dancing.",
          "tempoGroove": "95-115 BPM (most hits sit 100-110), a swung off-beat percussion pocket with the vocal sitting slightly behind the beat, relaxed. Very low word density: short melodic phrases, heavy repetition, and open space in every bar for the percussion to talk.",
          "writingDials": [
            "Groove-first economy: melody-led phrases of roughly three to seven words, each strong enough to be sung four times in a row without boring anyone. Fewer, better words \u2014 the line is finished when nothing can be cut.",
            "The words dance ON the percussion: scan every line aloud against the swung kick and the shakers \u2014 stressed syllables land with the percussion hits and the voice stays relaxed, slightly behind the beat. A line that fights the groove gets recut, never forced.",
            "Repetition is the architecture, not a failure \u2014 this genre carries the curriculum's sanctioned bend: the hook can be half the song, and verse two may deepen the same feeling instead of adding plot. The bend has a floor: verses still carry the user's real details (the actual person, the actual blessing, the actual city), because repetition deepens a real story \u2014 it never replaces one.",
            "End phrases early: leave the last beat or two of each bar empty \u2014 that gap belongs to the shakers, the echo answers, and the groove. A full bar of words is a mistake here.",
            "Choose words for sweetness of sound: open vowels, soft consonants, words that glide. A plain line that sings smooth beats a clever line that crowds the mouth.",
            "The home registers are celebration, desire, and hustle-blessings \u2014 and they mix freely: gratitude sits naturally inside love songs, blessings inside success songs; thankfulness is a home register, never a clash.",
            "Wordless melodic syllables are legitimate hook material as texture the story rides on \u2014 but they are sounds, never dialect or borrowed exclamations, and they can never replace the user's actual story.",
            "Sections blend at similar energy: verse, pre, and chorus flow into each other, and the chorus lifts through melody and stacked answering voices, not by getting louder or wordier \u2014 the lift is a widening, not a jump.",
            "Point of view: simple and direct \u2014 first person to a lover, to God, or to life itself. Keep the address uncomplicated; complexity belongs to alt\xE9."
          ],
          "rendering": "Mid-tempo swung drums with a syncopated kick, tight shakers, rim and woodblock percussion, talking drum accents, warm rounded bass, airy plucked guitar or bell-tone synth riffs, wide soft pads. Silky lead vocal with a light modern tuning sheen, stacked harmonies and communal echo answers arriving on the hook; current Lagos pop polish \u2014 warm, open, never busy.",
          "storyFit": "Best for love and desire, celebration, gratitude, weddings, glow-ups and hustle rewarded with blessings, missing someone across distance, soft-life joy. Serves badly: dense storytelling, anger, protest detail, any story that needs a complicated plot \u2014 the word budget is too small.",
          "parodyTraps": "Machine-written pidgin is the number-one killer \u2014 rhythm and phrasing carry the identity in standard English; overstuffed lines that smother the groove; fake African-language exclamations dropped in for flavor; rewriting every repeat as if repetition were a flaw; safari or jungle imagery (an offensive clich\xE9, not local color).",
          "performance": {
            "prose": "Density heavy; min adlibs 7; delivery tags [Call and Response] [Harmonies] [Groove] [Build] [Outro Vamp]. This room performs like a warm crowd gathered around one silky lead \u2014 the words are few, so the communal answers are most of the performance. Signature: the communal chant answer \u2014 the lead sings the melodic hook phrase and a warm stack of voices answers in the written gap with a short chant or an echo of the phrase's last words, the answer gaining a layer on each repeat so the same words come back deeper every round. Placement: answers live ONLY in the gaps the phrasing leaves at bar ends \u2014 never over the lead's words \u2014 thin in verse one, doubling on each hook return, fullest at the closing vamp where the hook loops and the whole room carries it; the percussion keeps at least half the gaps for itself, so the floor of 7 is met on hook repeats and the vamp, never by crowding the verses. Tag identity: a lead voice plus a communal answer stack \u2014 short (chant answers) and (echo of the hook's last words) from a warm group, a [Groove] or [Build] header where the percussion swells, an [Outro Vamp] where lead and crowd trade the hook to the fade. The cast is a celebration: many voices, one feeling \u2014 never a lone layered self, never empty space.",
            "adlibDensity": "heavy",
            "minAdlibs": 7,
            "deliveryTags": [
              "[Call and Response]",
              "[Harmonies]",
              "[Groove]",
              "[Build]",
              "[Outro Vamp]"
            ]
          },
          "builder": {
            "instruments": [
              "talking drum",
              "tight shakers",
              "rim and woodblock percussion",
              "syncopated swung kick",
              "warm rounded bass",
              "plucked guitar licks",
              "bell-tone synth riffs",
              "wide soft pads"
            ],
            "themes": [
              "Love & desire",
              "Celebration of life",
              "Hustle & blessings",
              "Gratitude",
              "Dance & good vibes",
              "Homeland pride"
            ],
            "purposes": [
              "Dance",
              "Celebrate",
              "Romance",
              "Give thanks",
              "Summer anthem"
            ]
          }
        },
        {
          "id": "afro-fusion",
          "name": "Afro-fusion / Alt\xE9",
          "oneLine": "The moodier, more personal cousin of afrobeats \u2014 alt\xE9 is Lagos slang for 'alternative' \u2014 blending African rhythm with R&B, dancehall, and indie feeling, made for night drives and complicated emotions.",
          "tempoGroove": "80-110 BPM with freer feels \u2014 half-time moods (drums feel half speed), dancehall-leaning bounces, and slow R&B burns are all allowed. Word density is medium and deliberately shifts between sections; phrasing is looser and more conversational than mainline afrobeats.",
          "writingDials": [
            "Interior over communal: sing the specific private feeling even when it is awkward or contradictory \u2014 where mainline afrobeats keeps things sweet and universal, this room rewards the odd true detail.",
            "Conversational phrasing: lines can run long and land off the grid like a thought spoken out loud; symmetry between lines is optional, not required \u2014 but the words still ride the percussion, just looser in the saddle.",
            "One strange, true image per section: a specific sensory detail from the user's story \u2014 a place, an object, a time of night \u2014 does more than any pretty generality.",
            "Flow-switch between sections on purpose: a verse can move like dancehall while the chorus floats like R&B. Write the sections at different word densities to force that switch \u2014 the density shift IS the drama here.",
            "Hooks can be moods, not chants: a hushed repeated phrase works fine here; it never needs crowd energy \u2014 if a whole room could shout it, it probably belongs in the mainline room.",
            "Rhyme relaxed and slanted; honesty outranks rhyme every single time in this room.",
            "Ambition and its cost is a home subject: wanting more and what the wanting takes from you \u2014 a register mainline afrobeats rarely touches; faith and doubt are allowed to share one verse.",
            "The mood is a lens, never a substitute: verses still carry the user's real details, and a hazy song with no concrete story underneath has failed this room, not honored it."
          ],
          "rendering": "Hybrid production: afrobeats percussion softened under R&B chords, hazy guitars or lo-fi synth textures, a dancehall-tinted bounce or half-time trap-touched drums, air and space in the mix. Intimate close-mic vocal with light tuning, self-layered doubles and falsetto drifts, moody reverb, late-night atmosphere; the feel of the Lagos alternative scene from the mid-2010s to now.",
          "storyFit": "Best for complicated love, self-discovery, homesickness, grief that still grooves, ambition versus peace, faith and doubt. Serves badly: straight-ahead party anthems, wedding-crowd singalongs, message music for a community.",
          "parodyTraps": "Mistaking moody for vague \u2014 it still needs one concrete story; machine-written pidgin; pasting sunshine afrobeats clich\xE9s into what should be a night song; endless atmosphere-words with no specific feeling underneath them; letting the percussion stop mattering \u2014 if the groove is gone, this is generic international R&B, not alt\xE9.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Falsetto] [Harmonies] [Soft] [Spoken] [Crooning]. This room performs like one person alone with their own voice multiplied \u2014 nothing communal, nothing answering from outside the singer. Signature: the hazy self-layer \u2014 the lead's own voice returns as a soft falsetto drift or a hummed shadow behind the line, layers stacking loosely so the mix blurs at the edges; the feeling thickens by self-echo, never by a crowd. Placement: verses stay nearly bare so the odd true detail reads clean \u2014 at most one hum or breathed double \u2014 then the self-layers bloom on the hook and thicken at the outro, and one (spoken: low aside) on its own line can carry the bridge where the guard slips; the written density shift between sections must be performed too, not just written. Tag identity: the lead's own layered self \u2014 hummed (mmm) drifts anywhere in a line, soft falsetto doubles behind the hook, one low spoken aside. No chant answers, no crowd, no group stack \u2014 the cast is one person and their own haze, and a communal answer would break the privacy the room is built on.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Falsetto]",
              "[Harmonies]",
              "[Soft]",
              "[Spoken]",
              "[Crooning]"
            ]
          },
          "builder": {
            "instruments": [
              "softened afro percussion",
              "hazy electric guitar",
              "lo-fi synth textures",
              "R&B keys",
              "half-time trap-touched drums",
              "dancehall-tinted bounce kit",
              "moody pads"
            ],
            "themes": [
              "Love & desire",
              "Homeland pride",
              "Hustle & blessings",
              "Gratitude",
              "Growth / finding myself"
            ],
            "purposes": [
              "Romance",
              "Night drive",
              "Say what I never said",
              "Give thanks"
            ]
          }
        },
        {
          "id": "amapiano-influenced",
          "name": "Amapiano-influenced (Afro-piano)",
          "oneLine": "The South African dance sound, now pan-African, built on the deep bouncing log drum \u2014 hypnotic, spacious, and chant-driven rather than verse-driven.",
          "tempoGroove": "108-118 BPM (most songs sit 110-115), rolling and hypnotic with long builds. The lowest word density in the genre: short chant phrases, call-and-response cells, and long stretches where the voice steps aside completely.",
          "writingDials": [
            "Write chants, not verses: one- and two-line cells designed to loop, stack, and layer. A whole song may need only a handful of distinct lines used many different ways.",
            "The drop belongs to the log drum (the deep, bouncy signature bass): plan sections where the vocal thins to a single repeated word \u2014 or full silence \u2014 when the bassline takes over, and hand those bars over on paper.",
            "Build call-and-response into the writing itself: a lead phrase, then a gap sized for a group answer \u2014 and write the answer line too, never leave it to chance.",
            "Pick percussive words: consonant attacks that lock with the shakers. The lyric works as another drum, so mouth-feel outranks meaning-density here.",
            "Structure is a slow build, not a verse-chorus seesaw: the main hook may arrive late; energy accumulates over minutes \u2014 write for patience, not for a quick payoff.",
            "Keep sung phrases short and clipped; long vocal runs fight the groove. One soulful line floating over the top is a feature; three is a traffic jam.",
            "Compress the user's story to its emotional core \u2014 one victory, one feeling, one name \u2014 and put THOSE real details inside the chant cells: there is no room for plot, but the night must still be unmistakably this user's.",
            "Repetition deepens by accumulation: the same cell means more each return because the build has grown around it \u2014 freshness comes from layering and subtraction, never from new words."
          ],
          "rendering": "Rolling groove built on the signature log drum bass, soft jazzy piano chords, tight shakers and crisp hi-hats, airy pads, long filtered builds and breakdowns. Sparse lead vocal chants with one written group-answer cell and an occasional soulful sung phrase floating over the groove; South African house lineage, 2020s club sound, with the space mixed as an instrument.",
          "storyFit": "Best for celebration, victory laps, dance-floor release, friendship and crew love, shaking off stress, gratitude in motion. Serves badly: heartbreak ballads, detailed storytelling, confessional intimacy \u2014 there are simply too few words available for a complex tale.",
          "parodyTraps": "Delivering a full, dense lyric sheet (instantly wrong); fake South African-language exclamations; treating it as afrobeats at a different tempo \u2014 the space rules are much stricter; leaving no room for the instrumental drop; hooks too wordy for a crowd to chant back.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Call and Response] [Drop] [Build] [Groove] [Quiet]. This room performs by subtraction \u2014 the log drum is the co-star, and the boldest performance move is the voice stepping aside. Signature: one hook phrase in log-drum space \u2014 a single chanted phrase loops while the groove swells around it, answered by the one written group-answer cell, then the vocal thins to a single word or full silence as the [Drop] hands the floor to the log drum. Placement: the few vocal events sit exactly where the writing cut their holes \u2014 the group answer in its gap after the lead's chant, one repeated word riding the [Build], nothing at all during the drop; headers do the arranging ([Build] into [Drop], a [Quiet] breakdown before the last swell) while the adlib count stays low enough to count on one hand. Tag identity: a chant lead, one group-answer cell, and the log drum treated as the answering voice \u2014 the sparsest cast in the genre: no harmony stacks, no self-layered haze, no free runs. One phrase, one answer, and space \u2014 if the page fills the space, the room is gone.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Call and Response]",
              "[Drop]",
              "[Build]",
              "[Groove]",
              "[Quiet]"
            ]
          },
          "builder": {
            "instruments": [
              "log drum bass",
              "soft jazzy piano chords",
              "tight shakers",
              "crisp hi-hats",
              "airy pads",
              "long filtered builds"
            ],
            "themes": [
              "Dance & good vibes",
              "Celebration of life",
              "Gratitude",
              "Friendship & crew love"
            ],
            "purposes": [
              "Dance",
              "Celebrate",
              "Summer anthem"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "afropop",
          "strength": "strong",
          "roomId": "afrobeats"
        },
        {
          "cue": "wedding",
          "strength": "weak",
          "roomId": "afrobeats"
        },
        {
          "cue": "celebration",
          "strength": "weak",
          "roomId": "afrobeats"
        },
        {
          "cue": "blessings",
          "strength": "weak",
          "roomId": "afrobeats"
        },
        {
          "cue": "gratitude",
          "strength": "weak",
          "roomId": "afrobeats"
        },
        {
          "cue": "glow-up",
          "strength": "weak",
          "roomId": "afrobeats"
        },
        {
          "cue": "glow up",
          "strength": "weak",
          "roomId": "afrobeats"
        },
        {
          "cue": "in love",
          "strength": "weak",
          "roomId": "afrobeats"
        },
        {
          "cue": "soft life",
          "strength": "weak",
          "roomId": "afrobeats"
        },
        {
          "cue": "alt\xE9",
          "strength": "strong",
          "roomId": "afro-fusion"
        },
        {
          "cue": "alte",
          "strength": "strong",
          "roomId": "afro-fusion"
        },
        {
          "cue": "afro-fusion",
          "strength": "strong",
          "roomId": "afro-fusion"
        },
        {
          "cue": "afro fusion",
          "strength": "strong",
          "roomId": "afro-fusion"
        },
        {
          "cue": "afroswing",
          "strength": "strong",
          "roomId": "afro-fusion"
        },
        {
          "cue": "night drive",
          "strength": "weak",
          "roomId": "afro-fusion"
        },
        {
          "cue": "homesick",
          "strength": "weak",
          "roomId": "afro-fusion"
        },
        {
          "cue": "mixed feelings",
          "strength": "weak",
          "roomId": "afro-fusion"
        },
        {
          "cue": "amapiano",
          "strength": "strong",
          "roomId": "amapiano-influenced"
        },
        {
          "cue": "log drum",
          "strength": "strong",
          "roomId": "amapiano-influenced"
        },
        {
          "cue": "yanos",
          "strength": "strong",
          "roomId": "amapiano-influenced"
        },
        {
          "cue": "afro house",
          "strength": "strong",
          "roomId": "amapiano-influenced"
        },
        {
          "cue": "dance floor",
          "strength": "weak",
          "roomId": "amapiano-influenced"
        },
        {
          "cue": "victory lap",
          "strength": "weak",
          "roomId": "amapiano-influenced"
        },
        {
          "cue": "crew",
          "strength": "weak",
          "roomId": "amapiano-influenced"
        },
        {
          "cue": "club",
          "strength": "weak",
          "roomId": "amapiano-influenced"
        }
      ]
    },
    "pop": {
      "id": "pop",
      "name": "Pop",
      "aliases": [
        "pop music"
      ],
      "profileText": "A pop writer starts with the title. The title is the contract: it names the one feeling the song exists to deliver, and every section is built to make that phrase land harder each time it returns. Where it sits is the room's call \u2014 announced as the chorus opens, earned late on a held note, or hidden mid-chorus like something let slip \u2014 but in every room the writer knows the title before line one and writes toward it.\n\nEconomy is the craft underneath everything. Pop carries fewer words per line than almost any genre, so every word must earn its place out loud. Chorus lines are metrically parallel \u2014 repeated lines matching in syllable count and stress \u2014 because that parallel, more than any other single choice, is what makes a melody stick after one listen. Key words land on open vowels the voice can hold. If a line can lose a word and still mean the same thing, it loses the word.\n\nBut the hook being king does not shrink the verses \u2014 it raises their price. The verses are where the story lives: each verse adds new information, verse two is never verse one reworded, and a verse thinner than its chorus has starved the song into a jingle. The chorus is the feeling; the verses are why the feeling is true. Pop economy means the verse says more with fewer words \u2014 it never means the verse says less.\n\nThe trap pop falls into more than any other genre is abstraction. Pop believes universal means general, and that is exactly backwards: the songs whole rooms sing along to are about one person's exact night, one street, one dress, one message never answered. The concrete-image law bites hardest here \u2014 every pop song is built around one thing you could photograph, and the feelings attach to that thing instead of floating free. The writer takes the user's single most specific detail and trusts strangers to recognize themselves in it. That trust is the entire trick of pop universality.\n\nThe pre-chorus is a tool, not a fixture, and its job changes by room: a physical ramp that quickens the body, an emotional narrowing that gets quieter so the chorus can bloom, a four-bar sprint at shout volume, a lean-in close to the ear \u2014 or nothing at all, cut because the room blurs its sections on purpose. The writer decides what the lift needs before deciding whether a ramp exists.\n\nLast, a pop song is written to be performed, and each room keeps its own cast: a party stack singing the hook over handclaps, one exposed voice with harmonies swelling late, a machine-distanced echo, a self-double an inch from the mic, a kept breath in a bare room, a shouted gang answer, a second voice flirting back. Some rooms lawfully circle instead of lift \u2014 the repetition bend, where the same words return gathering weight \u2014 but even there the verses keep adding facts. Polish is pop's finish, never its substance: the pulse stays human, the story stays the user's, and every dial above bends to the story without ever changing what the song is about.",
      "defaultRoomId": "dance-pop",
      "rooms": [
        {
          "id": "dance-pop",
          "name": "Dance-Pop",
          "oneLine": "The big-night-out pop song \u2014 built to move bodies first and hearts second.",
          "tempoGroove": "100-128 BPM, kick drum on every beat, straight feel. Low word density: short punchy phrases with real air between them so the beat can carry. Verses are lean; choruses are leaner.",
          "writingDials": [
            "Hook economy is extreme: the chorus must be singable after ONE hearing. The title opens the chorus and usually closes it too \u2014 announced, not arrived at.",
            "Phrasing runs short (roughly four to seven syllables a line) with gaps; a single repeated word can legitimately be a whole line here \u2014 a license shared elsewhere in pop only by the Latin room's trance.",
            "The pre-chorus is a physical ramp, not an emotional one: lines get shorter and the word-pace quickens as it climbs, so the body feels the lift coming.",
            "Rhyme is clean, bright, and mostly perfect, landing on open vowels \u2014 the mouth has to land easy at speed. Clever slant rhymes read as drag here.",
            "Subject treatment compresses time: present tense, tonight, this room, this moment. The backstory gets one line, never a verse. If the story needs a timeline, this is the wrong lane.",
            "Lean verses still carry the story \u2014 the verse substance law at pop speed: verse one names the real who and where in a handful of words, verse two adds what changed tonight, never verse one reshuffled. Compression means keeping only the strongest details, not deleting them all \u2014 a verse thinner than the chorus has starved the song.",
            "The one-photograph rule holds on the dance floor: the song stands on one physical thing from the user's actual night \u2014 the shoes, the car, the kitchen turned dance floor \u2014 and the joy attaches to it. A chorus built only of floating feeling-words is the exact parody this lane is famous for.",
            "Plan the post-chorus (the section after the chorus where the beat pays off): it needs its own tiny vocal idea \u2014 one short phrase or a wordless singable shape \u2014 decided at the writing stage, not left to production.",
            "Point of view is first person to a 'you' who is physically present; direct address and short, simple command verbs aimed at someone in the room feel natural here \u2014 teach the verb type from the user's own story, never a stock list."
          ],
          "rendering": "Four-on-the-floor kick (kick drum hitting on every beat) with sidechained synth bass (bass that ducks each time the kick hits), bright plucked synths, claps, and risers into every chorus. Polished lead vocal with tight doubles and shiny stacked backgrounds. Modern club-pop sheen (2010s to now), or add disco strings and octave bass for a retro flavor. For celebration stories that want a live band instead of a club, flex to a funk flavor \u2014 live drums, popping bass, choppy rhythm guitar, horn stabs \u2014 with the same writing dials.",
          "storyFit": "Best for celebrations, birthdays, nights out, confidence anthems, new-crush excitement, and the dance-floor moment of a wedding. Serves badly: grief, apologies, complicated histories \u2014 anything that asks the listener to sit still and follow a story.",
          "parodyTraps": "Cramming a full narrative into the verses; stacking party-scene clich\xE9 props instead of the user's own moment; writing a chorus of long clever sentences (dance-pop choruses die of cleverness); forgetting the post-chorus so the drop arrives with no vocal hook on it.",
          "performance": {
            "prose": "Density heavy; min adlibs 7; delivery tags [Build Up] [Drop] [Harmonies] [Post-Chorus]. This room performs like the best night of the year \u2014 one polished lead riding the beat while a party of stacked voices and handclaps waits for the hook to arrive. Signature: the party-stack hook \u2014 the chorus lands with the whole stack singing the short lines together over claps, then the beat pays off into a post-chorus where the stack chants the one tiny vocal idea the writing planned, bigger on every return. Placement: verses stay clean and nearly bare \u2014 at most one echoed word \u2014 so the stack hits harder when it arrives; a [Build Up] header frames every chorus arrival and a [Drop] or [Post-Chorus] header frames the payoff; the floor of 7 is met on hooks and post-choruses alone (stack echoes of the title, (claps) direction lines, one short group shout), never by decorating the verses. Tag identity: a polished lead plus a full party stack \u2014 sung stacked doubles on every chorus line, handclap direction lines, stack echoes of the title on the post-chorus, one crowd shout at the final chorus. The stack sings tuned and polished \u2014 shouting belongs to pop-punk. The stack only exists at the lift; the verses belong to one voice.",
            "adlibDensity": "heavy",
            "minAdlibs": 7,
            "deliveryTags": [
              "[Build Up]",
              "[Drop]",
              "[Harmonies]",
              "[Post-Chorus]"
            ]
          },
          "builder": {
            "instruments": [
              "four-on-the-floor kick",
              "sidechained synth bass",
              "bright plucked synths",
              "handclaps",
              "risers",
              "disco strings"
            ],
            "themes": [
              "Night out / freedom",
              "Self-empowerment",
              "New love",
              "Friendship"
            ],
            "purposes": [
              "Dance",
              "Celebrate",
              "Sing along",
              "Empower"
            ]
          }
        },
        {
          "id": "pop-ballad",
          "name": "Pop Ballad",
          "oneLine": "The slow, big-feeling pop song \u2014 the one that plays at the wedding or makes the whole room go quiet.",
          "tempoGroove": "60-80 BPM, straight feel or a gentle 6/8 sway; drums often enter late and in half-time (hitting half as often, so everything feels bigger). Moderate word density: the slow tempo buys longer lines, but the peak moments must be left open for held notes.",
          "writingDials": [
            "The title leans toward landing late \u2014 at the end of the chorus or on its held peak, earned by the lines before it \u2014 where dance-pop leans toward announcing it up front. This is a lean, not a law: if the user's own key phrase wants to open the chorus, let it lead. What matters is that the title feels arrived at, not chanted.",
            "Verses are storytelling rooms: full sentences, longer lines, and more concrete detail from the user's story than any other polished-pop lane allows.",
            "Verse two is the second act: a new scene or a new understanding, never verse one slowed down \u2014 the held-note chorus only earns its size if each verse buys it new meaning. The verse substance law matters most in the genre's biggest room.",
            "The pre-chorus works emotionally, not physically: it names the stakes and often gets QUIETER \u2014 instruments drop out rather than pile on \u2014 so the chorus can bloom.",
            "Dynamics are the architecture: verse one nearly spoken, chorus one restrained, final chorus wide open. Write chorus lines that survive being sung both whispered and huge, because they will be.",
            "The bridge is load-bearing: the confession, the decision, or the turn lives there. A ballad whose bridge just restates the chorus louder is a loop, not a journey.",
            "Rhyme relaxes: slant rhyme (close-but-not-exact) is welcome and an honest unrhymed line beats a forced perfect one \u2014 at this speed the melody covers the seams.",
            "Plan the money note: end the key chorus lines on open vowels (ah, oh, ay) because the singer will hold them for bars. Do not pack so many words into the peak that there is no room to hold and bend a note.",
            "The ceremony needs an anchor you could photograph: one physical thing from the user's story \u2014 the hospital bracelet, the kitchen table, the borrowed dress \u2014 that the big feeling stays tied to. Sky-and-weather abstraction is the greeting-card failure this lane slides into fastest, and here it is forbidden, not just discouraged."
          ],
          "rendering": "Piano or clean guitar foundation; strings or warm pads swell in by the second chorus; drums arrive late with big half-time weight. Intimate close-mic vocal early, stacked harmonies late, and optionally a final-chorus key lift. Timeless adult-pop palette \u2014 90s diva ballad through modern piano-pop.",
          "storyFit": "Best for love declarations, weddings, grief and tributes, apologies, parent-and-child songs, anniversaries \u2014 any heavy or ceremonial feeling. Serves badly: jokes, hype, casual fun; ballad treatment makes small feelings sound overblown and insincere. Routing tiebreaker with Acoustic/Singer-Songwriter: if the user gave a detailed timeline they want heard word-for-word, send it there; if the feeling is bigger than its details and wants a held-note ceremonial moment, it belongs here.",
          "parodyTraps": "Every line at maximum emotion so there is no arc left to climb; greeting-card abstractions replacing the user's one concrete scene; a bridge that adds volume but no new information; burying the held-note moments under piles of syllables.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Soft] [Belting] [Harmonies] [Crescendo] [Big Finish]. This room performs like one voice alone in a big quiet space that slowly fills. Signature: the staged swell \u2014 verse one nearly spoken and completely bare, harmonies arriving soft under chorus two, then the final chorus opening wide: the lead belts the held money note while stacked harmonies swell underneath \u2014 one singer growing, never a crowd joining. Placement: keep the verses and the bridge stripped to the lead (breaths kept in are part of the record); the sparse floor lives late \u2014 a soft harmony entrance on chorus two, an echoed last word into the bridge, and the full swell under the [Big Finish]; a [Crescendo] header belongs only at the hand-off into the final chorus. Tag identity: a solo lead with swelling harmonies \u2014 the harmonies are the same singer multiplied, entering in stages and blooming at the peak; no gang, no claps, no answer voice. The drama is one voice and how much air it finally takes up.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Soft]",
              "[Belting]",
              "[Harmonies]",
              "[Crescendo]",
              "[Big Finish]"
            ]
          },
          "builder": {
            "instruments": [
              "grand piano",
              "clean electric guitar",
              "swelling strings",
              "warm pads",
              "late half-time drums"
            ],
            "themes": [
              "Missing someone",
              "Heartbreak",
              "New love",
              "Deep love / devotion"
            ],
            "purposes": [
              "Cry it out",
              "Sing along",
              "Bring happy tears"
            ]
          }
        },
        {
          "id": "synth-pop",
          "name": "Synth-Pop / Retro-Wave",
          "oneLine": "80s-flavored pop \u2014 moody synths, a driving pulse, and feelings watched through a windshield at night.",
          "tempoGroove": "85-125 BPM \u2014 the lane spans moody-slow to driving, and the steady even grid from the synths and drum machine, not the number, is what defines it. The groove is a steady grid, not a bounce. Medium-low word density: even, measured phrases that ride the grid \u2014 hypnotic and controlled rather than pushed and pulled.",
          "writingDials": [
            "Mood outranks plot: take the single strongest image or feeling in the user's story and circle it for the whole song, instead of walking through events in order. This is the one pop lane where NOT advancing the story much is correct.",
            "The circled image obeys the one-photograph rule: a real object or place from the user's story \u2014 the actual car, the actual street, the jacket left behind \u2014 never stock night-and-city atmosphere. The cool surface only reads as feeling when something real sits under it.",
            "Circling is not stalling: each verse must add one new fact about the same image \u2014 what happened there, what is missing now \u2014 so the mood deepens for a reason. This room carries the sanctioned repetition bend: the chorus may return unchanged and gather weight, but that bend never excuses a verse that only re-decorates the last one.",
            "Phrasing is even and gridded: lines of matching length delivered coolly on the pulse; the ragged conversational spill that works in bedroom pop breaks the trance here.",
            "Understatement is the emotional engine: the surface stays cool and the ache lives in what is held back. Belting (singing it big and loud) is a lane violation \u2014 restraint IS the feeling.",
            "The chorus can be a short repeated phrase \u2014 usually the title \u2014 that returns like a chant and gathers weight each pass rather than lifting; dance-pop would demand more shape here, and a ballad more payoff.",
            "The pre-chorus barely exists here: when used, it is two gridded lines that tighten the pattern \u2014 same cool delivery, shorter phrases \u2014 never a rising ramp; the lift into the chorus is a texture change, not a vocal event.",
            "Rhyme is moderate and often slant (close-but-not-exact); hard, clever, snappy rhymes puncture the atmosphere.",
            "Point of view is first person reflective, speaking to an absent 'you' \u2014 the person is in the memory, not in the room. That distance is the sub-genre's signature and should shape verb tense: lean past and conditional (would, could) over present."
          ],
          "rendering": "Repeating analog-style synth bass pattern, 80s drum-machine character with a big gated snare (that huge chopped-off drum sound), shimmering pads and arpeggios (chord notes played one at a time), optional chorused electric guitar. Vocal sits back in space with reverb, delivered cool. Aim at a 1983-1986 palette or its modern retro-wave gloss.",
          "storyFit": "Best for nostalgia, longing for someone far away or long gone, bittersweet memories, late-night solitude, and stylish self-possession. Serves badly: warm cozy domestic stories, comedy, and any story that needs a detailed sequence of events told in order.",
          "parodyTraps": "Name-checking the decade \u2014 listing 80s props and references instead of sounding like the era; overheated belting that breaks the cool; cramming syllables against the steady grid; letting stock neon-and-midnight boilerplate stand in for the user's own images.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Soft] [Quiet] [Harmonies] [Instrumental Break]. This room performs like a voice heard from the far side of a windshield \u2014 cool, even, deliberately distant, with the machines doing the feeling the singer refuses to show. Signature: the cold echo \u2014 the chant-chorus title phrase trails a distant, reverb-washed repeat of its own last words, returning identical each pass and gathering weight precisely because it never changes. Placement: verses stay dry and single-voiced on the grid; the echo lives only on the chorus chant and the outro; soft gridded harmonies may thicken the final passes without ever lifting the volume; one [Instrumental Break] header gives the synths a section of their own \u2014 the only place the song is allowed to open up. Tag identity: the lead and its own machine-distanced reflection \u2014 a distant echo of the chant's last words, cool pad-like harmonies late, no belting anywhere, no human answer voice, no crowd. Restraint is the cast: one person, one machine, one memory.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Soft]",
              "[Quiet]",
              "[Harmonies]",
              "[Instrumental Break]"
            ]
          },
          "builder": {
            "instruments": [
              "analog synth bass",
              "gated-snare drum machine",
              "shimmering pads",
              "arpeggiated synths",
              "chorused electric guitar"
            ],
            "themes": [
              "Nostalgia",
              "Missing someone",
              "Heartbreak",
              "Night out / freedom"
            ],
            "purposes": [
              "Windows-down driving",
              "Cry it out",
              "Sing along"
            ]
          }
        },
        {
          "id": "indie",
          "name": "Indie / Bedroom Pop",
          "oneLine": "Small-sounding, personal pop \u2014 like a voice memo from someone you have a crush on.",
          "tempoGroove": "70-105 BPM, laid-back straight or lightly swung feel, sitting slightly behind the beat. Conversational word density: lines can run long and spill over like real speech, then land hard on a short one \u2014 the unevenness is the style.",
          "writingDials": [
            "Lead with the user's smallest, most particular true detail \u2014 inside the first two lines, not saved for the bridge \u2014 and let that one detail carry the emotion a ballad would hand to a key change. Understatement is law: the biggest feeling gets the plainest line, and this lane rewards the user's oddest true detail more than any other pop sub-genre.",
            "Stay inside ONE scene from the user's story \u2014 one afternoon, one hallway, one unsent message \u2014 because universality here comes from the specific crush and the specific kitchen, never from writing about feelings at large. Zooming out to the big abstract statement is the fastest way to break this room.",
            "Phrasing mimics talk: uneven line lengths, run-on thoughts, mid-line pauses. Metrically perfect matched lines \u2014 mandatory in dance-pop \u2014 read as fake here.",
            "The hook is an off-hand phrase, not a banner: it should sound discovered, like something actually said, and the title often hides mid-chorus instead of opening or closing it.",
            "Rhyme density is the lowest in pop: mostly slant (close-but-not-exact) or none. An obvious locked rhyme scheme reads as trying too hard in this room.",
            "Sections blur on purpose: the pre-chorus is often skipped, the chorus may be barely bigger than the verse, and the whole song can sit on two chords \u2014 so the words alone must create the shape and the turn.",
            "Small does not mean static: each verse adds one new fact or one honest correction, because the chorus here is barely bigger than the verse and there is no production lift to hide a repeated thought behind \u2014 the words alone carry the verse substance law.",
            "Point of view is first person and self-aware; dry humor and correcting yourself mid-line feel natural here. Address the 'you' like a text message, never like a proclamation."
          ],
          "rendering": "Soft drum machine or lazy live kit, warm round bass, jangly or lo-fi guitar and keys; tape hiss and wobble are welcome, not flaws. Intimate close vocal with minimal tuning sheen and light doubling. The production should feel homemade on purpose \u2014 the 2015-to-now bedroom aesthetic or 2000s indie-pop warmth.",
          "storyFit": "Best for crushes, quiet heartbreaks, friendship, anxiety and self-talk, and small everyday moments the user wants made meaningful. Serves badly: grand declarations, ceremonies, and hype \u2014 big-occasion energy collapses this small room.",
          "parodyTraps": "Performative quirkiness (random odd objects inserted for quirk's sake instead of drawn from the user's story); vague mumbly lines with no actual detail \u2014 lo-fi is a sound, not an excuse to say nothing; bolting on a big polished chorus lift that belongs in dance-pop; stacking sad-kid clich\xE9s instead of one honest specific.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Spoken] [Soft] [Whispered]. This room performs like a voice memo made at 1 a.m. an inch from the mic \u2014 one person, their own quiet double, and the sound of the room left in. Signature: the close self-double \u2014 a second track of the same voice sliding in mid-line on the phrase that matters most, hugging the lead for a few words, then dropping away; plus one spoken aside where the writer catches themselves mid-thought. Placement: doubles cluster on the off-hand hook and the very last line of the song; the (spoken: quiet aside) sits on its own line where the lyric corrects itself; a soft hum can close the outro; verses otherwise stay one voice \u2014 crowding this room with answers breaks it instantly. Tag identity: close self-doubles and murmured asides \u2014 the lead harmonizing with itself at whisper distance, a soft hum, a mid-line double on the load-bearing phrase. No stack, no gang, no polish: the second voice is the same person, just closer.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Spoken]",
              "[Soft]",
              "[Whispered]"
            ]
          },
          "builder": {
            "instruments": [
              "soft drum machine",
              "lazy live kit",
              "warm round bass",
              "jangly guitar",
              "lo-fi keys",
              "tape hiss texture"
            ],
            "themes": [
              "New love",
              "Heartbreak",
              "Friendship",
              "Missing someone"
            ],
            "purposes": [
              "Cry it out",
              "Sing along",
              "Make them feel seen"
            ]
          }
        },
        {
          "id": "acoustic",
          "name": "Acoustic / Singer-Songwriter Pop",
          "oneLine": "One voice, one guitar or piano, one true story told straight \u2014 the coffeehouse confessional that can still fill a stadium.",
          "tempoGroove": "70-110 BPM, straight or gently swung, with the strum or fingerpicking pattern carrying the groove itself. Highest word density in pop: the lyric IS the production, so lines hold more detail and more syllables per bar than any sibling lane.",
          "writingDials": [
            "Narrative is the spine: verses move through time \u2014 then to now \u2014 with scenes, people, and places. This is the ONE pop lane where a story with a beginning, middle, and turn genuinely fits; use the user's timeline instead of compressing it.",
            "Every line is exposed: with no production to hide behind, a filler line that would slide by in dance-pop stands out naked. Cut anything that only exists to reach the rhyme.",
            "The title is a meaning-shifter: the same chorus words should land differently each time because the verses in between changed what they mean. That re-lighting trick is this lane's signature move \u2014 and it is the verse substance law made audible: if verse two adds nothing, the chorus cannot change its meaning.",
            "Rhyme is craftsmanlike and noticed: internal rhyme and tight schemes are welcome here, because listeners in this lane hear rhyme skill as care \u2014 the opposite of bedroom pop's allergy to it.",
            "Let plain-spoken lines outnumber the image lines: the plain talk is what makes the images land. Wall-to-wall imagery reads as a poetry exercise, not a song.",
            "Build the dynamics into the words: since no synth stack will lift the chorus, write chorus lines that shorten and quicken to create lift, and let the bridge go QUIETEST \u2014 the near-whispered admission before the last chorus \u2014 rather than biggest.",
            "The pre-chorus, when it exists at all, is a hinge: one or two lines that tilt the verse's scene toward the chorus's meaning \u2014 never a volume ramp, because there is no wall of sound to ramp into.",
            "Keep every feeling within arm's reach of a thing: this lane already runs on scenes, so the discipline is attachment \u2014 each feeling line sits next to something you could photograph (the truck, the porch, the phone face-down on the table), and three abstract lines in a row is a lane violation.",
            "Address is across-the-kitchen-table: second person to a real, named-in-the-writer's-mind person; the more the app knows who is being spoken to, the better this lane writes."
          ],
          "rendering": "Acoustic guitar (fingerpicked or strummed) or felt piano front and center; brushed drums, soft bass, maybe light strings arriving late. Dry, present lead vocal with minimal effects \u2014 natural breaths kept in. Timeless palette: it could pass for 1971 or 2024.",
          "storyFit": "Best for tributes, family stories, life milestones, gratitude, honest heartbreak, and any story where the user gave rich detail they want heard word-for-word. Serves badly: party energy, dance moments, and swagger \u2014 this lane cannot fake adrenaline. Routing tiebreaker with Pop Ballad: a detailed timeline the user wants heard word-for-word belongs here; a feeling bigger than its details, built for a held-note ceremonial moment, belongs in the ballad.",
          "parodyTraps": "Greeting-card sincerity \u2014 abstract virtues instead of the user's actual scenes; rhyming so densely it turns sing-song; nonstop imagery with no plain-spoken landing lines; adding drops or post-choruses that betray the intimacy the arrangement promised.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Quiet] [Soft] [Harmonies] [Instrumental Break]. This room performs like a kitchen-table telling \u2014 the barest room in pop, where the instrument is the second performer and the silence is kept honest. Signature: the instrumental answer and the late friend \u2014 the guitar or piano takes a short turn after the verse's heaviest line, and a single harmony voice joins only at the final chorus, re-lighting the title the verses just changed. Placement: the two required adlibs are quiet ones \u2014 a kept breath or low hum on its own line before the bridge, and the soft harmony entrance at the last chorus; heavy lines always stand alone, and no echo ever chases the title; one [Instrumental Break] header marks the instrument's answer. Tag identity: one dry, present voice with kept breaths, an answering instrument, and ONE late harmony \u2014 never a stack, never a doubled sheen, never a crowd. If a second voice shows up before the last chorus, the room has been broken.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Quiet]",
              "[Soft]",
              "[Harmonies]",
              "[Instrumental Break]"
            ]
          },
          "builder": {
            "instruments": [
              "fingerpicked acoustic guitar",
              "felt piano",
              "brushed drums",
              "soft bass",
              "light strings"
            ],
            "themes": [
              "Nostalgia",
              "Friendship",
              "Missing someone",
              "Heartbreak",
              "Deep love / devotion"
            ],
            "purposes": [
              "Cry it out",
              "Bring happy tears",
              "Sing along"
            ]
          }
        },
        {
          "id": "pop-punk",
          "name": "Pop-Punk / Pop-Rock Anthem",
          "oneLine": "Loud, fast, grinning pop with guitars \u2014 the shout-along for feelings that need volume.",
          "tempoGroove": "150-190 BPM for pop-punk (verses sometimes feel half-time \u2014 drums hitting half as often), 120-140 BPM for the pop-rock anthem end. Driving straight eighth-notes (a fast, even chug) with a hard backbeat (the snare cracking on beats 2 and 4). Word density flips by section: rapid-fire wordy verses, then a chorus that drops to short shoutable chunks.",
          "writingDials": [
            "The chorus must survive being yelled by a crowd: short declarative lines, simple enough for a room to catch on first listen. All nuance gets exiled to the verses \u2014 the reverse of the ballad, where the chorus holds the deepest line.",
            "Verses are motormouth: fast, wordy, hyper-specific, often funny or self-deprecating. The speed of detail is the charm; slow scenic description kills the engine.",
            "The motormouth verses are where the user's story actually lives \u2014 the real boss, the real ex's car, the real town, named fast and specific \u2014 and verse two escalates with the next grievance or the next chapter, never a re-run. The chorus gets to shout the feeling only because the verses already showed what happened.",
            "Attitude is a writing ingredient: exaggeration, sarcasm, and blunt honesty are natural here. The bridge is usually where this style drops the joke and lets the real feeling show for a few lines before the last chorus \u2014 but that is the lane's habit, not a rule: if the user's story leads with sincerity, the writing follows the story.",
            "Rhyme runs punchy and dense: snapping couplets with hard end rhymes; at this speed even simple rhymes feel athletic, and slant-rhyme subtlety just sounds like a miss.",
            "Write the gang-vocal moments in: plan which word gets echoed by the group and which line gets answered (call-and-response \u2014 one voice states, many voices reply). That is a lyric decision, not a production afterthought.",
            "The pre-chorus is a four-bar sprint: drums double, lines shorten toward shouts, and the last line hangs unresolved so the chorus lands like a kicked-open door \u2014 it works on the body like dance-pop's ramp, just at guitar volume.",
            "Leave one passage nearly wordless for the crowd-shout melody moment this lane expects \u2014 plan where it goes, but never let wordless filler BE the hook.",
            "Subject treatment converts pain to defiance: the breakup becomes a victory lap, the anxiety becomes a battle cry. If the user's story stays sad with no fight in it, route it to a ballad instead \u2014 this lane at this speed makes plain sadness sound sarcastic."
          ],
          "rendering": "Distorted power-chord guitars, driving live drums with a big cracking snare, melodic bass runs. Energetic, slightly raspy lead vocal with gang vocals answering on the chorus. Either 2000s pop-punk crunch or modern pop-rock polish with a few synth touches.",
          "storyFit": "Best for breakups the user is over, quitting the bad job, underdog wins, friendship anthems, growing-up nostalgia, and funny revenge energy. Serves badly: tender tributes, fresh grief, and romance still in progress \u2014 volume flattens tenderness.",
          "parodyTraps": "Faking teen-angst vocabulary when the user's story is clearly adult; stacking generic rebellion props instead of the user's real grievance; choruses built of complex sentences nobody can shout; playing genuinely sad material straight at 170 BPM so it accidentally reads as mockery.",
          "performance": {
            "prose": "Density heavy; min adlibs 8; delivery tags [Call and Response] [Belting] [Build] [Big Finish]. This room performs like a packed van with the windows down \u2014 the lead shouting the story while a gang of friends answers on cue, because the writing already marked which words they own. Signature: the shouted group response \u2014 the lead states the chorus line and the gang yells the answer or echoes the last words a half-beat later, rowdy and tight at once, plus one nearly wordless crowd-melody passage on open vowels that a whole room can carry without knowing the words. Placement: gang answers live on the chorus and on the echo words the verses marked; the motormouth verses stay lead-only except one hype shout at the turn into the pre-chorus sprint, which a [Build] header frames; the wordless crowd passage lands after the bridge, and the [Big Finish] stacks every voice at once. Tag identity: a raspy lead plus a shouted gang \u2014 (gang: shouted response) lines, short (hey!) punches on the backbeat, group echoes of the chorus tails, everybody in by the end. The gang never harmonizes prettily; it shouts in tune.",
            "adlibDensity": "heavy",
            "minAdlibs": 8,
            "deliveryTags": [
              "[Call and Response]",
              "[Belting]",
              "[Build]",
              "[Big Finish]"
            ]
          },
          "builder": {
            "instruments": [
              "distorted power-chord guitars",
              "driving live drums",
              "big cracking snare",
              "melodic bass",
              "light synth touches"
            ],
            "themes": [
              "Self-empowerment",
              "Heartbreak",
              "Friendship",
              "Nostalgia"
            ],
            "purposes": [
              "Empower",
              "Sing along",
              "Celebrate",
              "Windows-down driving"
            ]
          }
        },
        {
          "id": "latin",
          "name": "Latin / Tropical Pop",
          "oneLine": "Warm, swaying pop with a rolling Latin groove \u2014 made for dancing close, not jumping.",
          "tempoGroove": "88-105 BPM over a dembow rhythm (the rolling boom-chick drum pattern under most reggaeton) or a lighter tropical bounce. The groove leans off the beat rather than landing square on it. Medium word density: phrases ride the syncopation (notes landing between the beats), with real space left for the rhythm to answer back.",
          "writingDials": [
            "Phrases push and pull against the beat instead of landing on it: write lines that invite the singer to lean in early or drag late, where dance-pop wants the words square on the grid.",
            "The hook is a loop, not an announcement: a short phrase that circles back again and again, gathering heat each pass \u2014 closer to a chant you sway to than a banner you shout. Dance-pop announces its title; this lane circles it.",
            "Repetition is welcome at a level no other pop lane allows: repeating one line or even one word several times in a row builds the trance here, where most other pop lanes would call it lazy.",
            "The pre-chorus is a lean-in, not a ramp: the beat thins, phrases shorten and come closer to the ear, the voice drops nearer to speech for two bars \u2014 then the hook loop returns and the sway gets bigger.",
            "Subject treatment is sensual slow-motion: the song lingers on one person, one dance, one night, noticing small physical details from the user's story \u2014 the opposite of a story that travels through time. Romance and flirtation are the home keys; warm joy and celebration fit too.",
            "The verses still move the night forward, in slow motion: verse one sets the place and the person, verse two moves closer \u2014 what was said, what almost happened \u2014 new information each pass even while the hook circles, and every line stays tied to a physical detail from the user's story (the dress, the balcony, the drink going warm). Borrowed beach-and-cocktail props are this lane's abstraction failure.",
            "Rhyme leans on repeated vowel sounds more than hard end rhymes: the same open vowel ringing at the ends of lines (assonance \u2014 vowel rhyme) suits the melody's roll better than snapping consonants.",
            "Plan the second voice: which words get echoed and which lines get answered (call-and-response \u2014 one voice states, another replies) is a lyric decision made at the writing stage, and here the answer voice flirts rather than shouts.",
            "Language law: Spanish \u2014 or any language beyond English \u2014 appears ONLY if the user wrote it in their own story. The groove and the syncopated phrasing carry the flavor in standard English; sprinkled borrowed words the user never said read as costume, not identity."
          ],
          "rendering": "Dembow drum pattern or a soft tropical kit, warm deep bass, syncopated piano or guitar stabs, marimba- or steel-drum-flavored synth plucks, airy pads. Smooth melodic lead vocal with light echo answers and a second voice replying on the hook. Modern tropical-pop or reggaeton-pop polish, 2015 to now.",
          "storyFit": "Best for romance, anniversaries, honeymoon and vacation memories, flirtation, and warm celebrations that want sway instead of jump. Serves badly: grief, anger, and stories that need a detailed timeline \u2014 this groove's job is to hold one moment, not to travel through events.",
          "parodyTraps": "Sprinkling Spanish words the user never wrote (the fastest way to sound like a costume); stacking beach-and-cocktail props instead of the user's own moment; writing square on-the-beat lines that fight the groove; treating the lane as dance-pop with different drums \u2014 the phrasing must actually swing off the beat.",
          "performance": {
            "prose": "Density moderate; min adlibs 5; delivery tags [Call and Response] [Harmonies] [Groove] [Soft]. This room performs like two people dancing close while the rhythm listens in \u2014 a duet-shaped record even when only one name is on it. Signature: the flirting reply \u2014 a second voice answering the open ends of lines in the syncopated gaps the writing left, and echoing the looping hook a beat late, teasing instead of shouting, a little warmer on every pass. Placement: replies sit only in the written gaps \u2014 never on top of the lead \u2014 roughly one answer every few lines in the verses, with the echoes thickening as the hook circles; a [Groove] header can hand the rhythm the last word for a bar, and the pre-chorus lean-in stays reply-free so the return of the loop feels bigger. Tag identity: the lead plus one flirting answer voice \u2014 soft replies at phrase ends, hook echoes a beat behind, light harmonies on the loop's final passes, a percussion-breath direction line where the beat answers instead. A conversation for two \u2014 never a crowd, never a stack.",
            "adlibDensity": "moderate",
            "minAdlibs": 5,
            "deliveryTags": [
              "[Call and Response]",
              "[Harmonies]",
              "[Groove]",
              "[Soft]"
            ]
          },
          "builder": {
            "instruments": [
              "dembow drums",
              "warm deep bass",
              "syncopated piano stabs",
              "marimba-flavored synth plucks",
              "steel-drum synth",
              "airy pads"
            ],
            "themes": [
              "New love",
              "Deep love / devotion",
              "Night out / freedom"
            ],
            "purposes": [
              "Dance",
              "Celebrate",
              "Sing along"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "night out",
          "strength": "strong",
          "roomId": "dance-pop"
        },
        {
          "cue": "club",
          "strength": "strong",
          "roomId": "dance-pop"
        },
        {
          "cue": "dance floor",
          "strength": "strong",
          "roomId": "dance-pop"
        },
        {
          "cue": "party",
          "strength": "weak",
          "roomId": "dance-pop"
        },
        {
          "cue": "birthday",
          "strength": "weak",
          "roomId": "dance-pop"
        },
        {
          "cue": "celebrate",
          "strength": "weak",
          "roomId": "dance-pop"
        },
        {
          "cue": "celebration",
          "strength": "weak",
          "roomId": "dance-pop"
        },
        {
          "cue": "confidence",
          "strength": "weak",
          "roomId": "dance-pop"
        },
        {
          "cue": "dance",
          "strength": "weak",
          "roomId": "dance-pop"
        },
        {
          "cue": "dancing",
          "strength": "weak",
          "roomId": "dance-pop"
        },
        {
          "cue": "wedding",
          "strength": "strong",
          "roomId": "pop-ballad"
        },
        {
          "cue": "vows",
          "strength": "strong",
          "roomId": "pop-ballad"
        },
        {
          "cue": "vow renewal",
          "strength": "strong",
          "roomId": "pop-ballad"
        },
        {
          "cue": "first dance",
          "strength": "strong",
          "roomId": "pop-ballad"
        },
        {
          "cue": "in memory",
          "strength": "strong",
          "roomId": "pop-ballad"
        },
        {
          "cue": "in loving memory",
          "strength": "strong",
          "roomId": "pop-ballad"
        },
        {
          "cue": "passed away",
          "strength": "strong",
          "roomId": "pop-ballad"
        },
        {
          "cue": "rest in peace",
          "strength": "strong",
          "roomId": "pop-ballad"
        },
        {
          "cue": "funeral",
          "strength": "strong",
          "roomId": "pop-ballad"
        },
        {
          "cue": "celebration of life",
          "strength": "strong",
          "roomId": "pop-ballad"
        },
        {
          "cue": "tribute",
          "strength": "weak",
          "roomId": "pop-ballad"
        },
        {
          "cue": "anniversary",
          "strength": "weak",
          "roomId": "pop-ballad"
        },
        {
          "cue": "apology",
          "strength": "weak",
          "roomId": "pop-ballad"
        },
        {
          "cue": "grief",
          "strength": "weak",
          "roomId": "pop-ballad"
        },
        {
          "cue": "grieving",
          "strength": "weak",
          "roomId": "pop-ballad"
        },
        {
          "cue": "memorial",
          "strength": "weak",
          "roomId": "pop-ballad"
        },
        {
          "cue": "heaven",
          "strength": "weak",
          "roomId": "pop-ballad"
        },
        {
          "cue": "synthwave",
          "strength": "strong",
          "roomId": "synth-pop"
        },
        {
          "cue": "retrowave",
          "strength": "strong",
          "roomId": "synth-pop"
        },
        {
          "cue": "80s",
          "strength": "weak",
          "roomId": "synth-pop"
        },
        {
          "cue": "eighties",
          "strength": "weak",
          "roomId": "synth-pop"
        },
        {
          "cue": "retro",
          "strength": "weak",
          "roomId": "synth-pop"
        },
        {
          "cue": "nostalgia",
          "strength": "weak",
          "roomId": "synth-pop"
        },
        {
          "cue": "nostalgic",
          "strength": "weak",
          "roomId": "synth-pop"
        },
        {
          "cue": "late night",
          "strength": "weak",
          "roomId": "synth-pop"
        },
        {
          "cue": "night drive",
          "strength": "weak",
          "roomId": "synth-pop"
        },
        {
          "cue": "bedroom pop",
          "strength": "strong",
          "roomId": "indie"
        },
        {
          "cue": "indie",
          "strength": "strong",
          "roomId": "indie"
        },
        {
          "cue": "lo-fi",
          "strength": "strong",
          "roomId": "indie"
        },
        {
          "cue": "lofi",
          "strength": "strong",
          "roomId": "indie"
        },
        {
          "cue": "crush",
          "strength": "weak",
          "roomId": "indie"
        },
        {
          "cue": "shy",
          "strength": "weak",
          "roomId": "indie"
        },
        {
          "cue": "overthinking",
          "strength": "weak",
          "roomId": "indie"
        },
        {
          "cue": "texting",
          "strength": "weak",
          "roomId": "indie"
        },
        {
          "cue": "acoustic",
          "strength": "strong",
          "roomId": "acoustic"
        },
        {
          "cue": "singer-songwriter",
          "strength": "strong",
          "roomId": "acoustic"
        },
        {
          "cue": "singer songwriter",
          "strength": "strong",
          "roomId": "acoustic"
        },
        {
          "cue": "life story",
          "strength": "weak",
          "roomId": "acoustic"
        },
        {
          "cue": "family",
          "strength": "weak",
          "roomId": "acoustic"
        },
        {
          "cue": "gratitude",
          "strength": "weak",
          "roomId": "acoustic"
        },
        {
          "cue": "grateful",
          "strength": "weak",
          "roomId": "acoustic"
        },
        {
          "cue": "pop punk",
          "strength": "strong",
          "roomId": "pop-punk"
        },
        {
          "cue": "pop-punk",
          "strength": "strong",
          "roomId": "pop-punk"
        },
        {
          "cue": "quit my job",
          "strength": "strong",
          "roomId": "pop-punk"
        },
        {
          "cue": "revenge",
          "strength": "weak",
          "roomId": "pop-punk"
        },
        {
          "cue": "fed up",
          "strength": "weak",
          "roomId": "pop-punk"
        },
        {
          "cue": "over it",
          "strength": "weak",
          "roomId": "pop-punk"
        },
        {
          "cue": "shout",
          "strength": "weak",
          "roomId": "pop-punk"
        },
        {
          "cue": "underdog",
          "strength": "weak",
          "roomId": "pop-punk"
        },
        {
          "cue": "reggaeton",
          "strength": "strong",
          "roomId": "latin"
        },
        {
          "cue": "dembow",
          "strength": "strong",
          "roomId": "latin"
        },
        {
          "cue": "tropical",
          "strength": "strong",
          "roomId": "latin"
        },
        {
          "cue": "latin",
          "strength": "strong",
          "roomId": "latin"
        },
        {
          "cue": "vacation",
          "strength": "weak",
          "roomId": "latin"
        },
        {
          "cue": "honeymoon",
          "strength": "weak",
          "roomId": "latin"
        },
        {
          "cue": "island",
          "strength": "weak",
          "roomId": "latin"
        },
        {
          "cue": "beach",
          "strength": "weak",
          "roomId": "latin"
        }
      ]
    },
    "reggaeton": {
      "id": "reggaeton",
      "name": "Reggaet\xF3n",
      "aliases": [
        "reggaeton",
        "reguet\xF3n",
        "regueton",
        "perreo",
        "urbano",
        "reggaeton music"
      ],
      "profileText": "A reggaet\xF3n writer starts with the dembow \u2014 the riddim is the engine, that looping boom-ch-boom-chick with the snare snapping on the offbeat, and every word is a guest on it. The dembow, not the trap tresillo, is the identity: the bounce moves the body before it moves the mind, and the writing job is rhythmic before it is verbal. Scan every line aloud against the boom-ch-boom-chick, lock the stressed syllables to the snare, and treat the lyric as another percussion layer \u2014 a line that fights the bounce gets recut, never forced. Get the pocket wrong and no clever word saves it.\n\nThe hook is the room. Across the genre the coro carries the song, but each room answers it differently: Perreo hammers a grind command flat and dense; Reggaet\xF3n Rom\xE1ntico thins the verses so a sung, melodic chorus can lift on held vowels; Old-School builds the whole song on the coro-and-preg\xF3n call-and-response the barrio shouts back; Neoperreo warps a cold cell sparse and glitchy. That one choice \u2014 who is the song for, and does the hook command, soar, gather a crowd, or flip cold \u2014 moves more dials than any other: it sets density, point of view, how explicit the heat gets, and who answers on top of the beat. Perreo aims below the waist, rom\xE1ntico at the chest, old-school at the crowd's fist, neoperreo at the art-brat edge; the body register picks the room, and topic alone never can, because desire and the club and the night run through all four.\n\nThe law above every dial is the voice. The lyrics are written in Spanish by the language layer later \u2014 this page writes craft in English, and it never fakes the dialect. Slang, calle vocabulary, and accent spellings appear ONLY if the user wrote them in their own story, in the lyrics, adlibs, delivery directions, and render notes alike. The craft terms these pages teach with \u2014 dembow, perreo, preg\xF3n, coro, flow, gasolina-era, neoperreo \u2014 are the writer's working vocabulary, never the song's: they stay out unless the user reached for them first, and delivery is directed as rhythm, energy, and register in plain English \u2014 bounce, punch, swagger, cold \u2014 never as an accent, a nationality, or manufactured slang. Machine-faked slang is the genre's cardinal sin, a costume, and here the costume is worse than a dull song. The same goes for the postcard: beaches, palm trees, and the Latin-lover clich\xE9 are not reggaet\xF3n \u2014 the club's real dark, the user's own night, people, and want are. Rendering in any room protects three things: the bounce (the dembow stays felt, softened for rom\xE1ntico but never deleted), the low end (deep sub bajo 808 and dark minor synths mixed to move a body), and the voice as a person answered by whichever cast the room declares \u2014 a hype shouter, self-harmonies, the whole barrio, or a cold effected self \u2014 never an added accent. Every dial bends to the user's story; none may change what the song is about.",
      "defaultRoomId": "perreo",
      "rooms": [
        {
          "id": "perreo",
          "name": "Perreo",
          "oneLine": "The dense, sweaty club-and-heat lane \u2014 the reggaet\xF3n a stranger pictures when they hear the word: grind-floor commands, minor-key darkness, the hardest dembow bounce, aimed straight at the body.",
          "tempoGroove": "90-102 BPM locked to the dembow riddim \u2014 the boom-ch-boom-chick with the snare snapping on the offbeat, the bounce that moves hips before it moves minds. High word density with a chant hook: verses pack tight rhythmic phrases that lock to the snare, and the hook is a short command repeated until the floor obeys.",
          "writingDials": [
            "Aim below the waist and stay there: this is a body song about right now, the floor, the grind, the heat. Keep it physical and present-tense \u2014 desire stated, never a story explained. The moment the heat gets a backstory it cools.",
            "The hook is a command or a demand, not a confession: tell the body what to do or state the want flat, in a phrase short enough to chant back on the second pass. Two short lines trading can carry it.",
            "Ride the snare: every line locks its stressed syllables to the dembow's offbeat snap \u2014 scan aloud against the boom-ch-boom-chick and recut anything that fights the bounce. The words are another percussion layer.",
            "Hammer one rhyme sound across several lines on purpose: here the repeated end-sound builds momentum and grind, where in a ballad it would read as lazy.",
            "Confidence is the only posture: the singer runs the floor. Even want is delivered from power, never from need \u2014 this room does not beg.",
            "Repetition is the architecture: the hook can eat half the song and verse two can deepen the same heat rather than add plot \u2014 but the verses still carry the user's real person, real night, real want, because repetition deepens a real thing, it never invents one.",
            "Explicitness is a dial the user sets, never one the room adds: match the heat the user brought and go no further \u2014 never invent bodies, acts, or partners the story did not name.",
            "Cross-genre firewall: the engine is the dembow riddim (boom-ch-boom-chick, snare on the offbeat), NOT Latin Trap's rolling tresillo hi-hats and half-time drift \u2014 if the bounce turns into a trap crawl, the room is gone. And the hook rides the dembow bounce, not dancehall's deejay toasting."
          ],
          "rendering": "Hard dembow drums with the signature offbeat snare snap, deep sub bajo 808 pushing the low end, one dark minor-key synth riff carrying most of the melody, sharp hi-hats picados, sparse atmospheric pads leaving the bounce room to breathe, vocal chops and risers on the transitions. Rhythmic half-sung half-rapped lead riding the pocket with hype doubles cracking on the punch words; modern urbano club polish, dark and physical, the low end mixed to move a body.",
          "storyFit": "Best for: club heat, dance-floor grind, bold desire, confident flirtation, a night out, owning the room. Poor fit: grief, tender apology, worship, slow storytelling \u2014 the bounce has no patience and the darkness has no tenderness.",
          "parodyTraps": "Machine-faked calle slang or accent spellings the user never wrote (the fastest way to fake it); a trap tresillo crawl standing in for the dembow bounce; long narrative verses that explain instead of grind; beach-and-palm-tree postcard imagery instead of the club's real dark; inventing explicit props the user's story never named; a hook too wordy for the floor to shout back.",
          "performance": {
            "prose": "Density heavy; min adlibs 8; delivery tags [Perreo] [Ad-Lib Section] [Drop] [Build Up]. This room performs like an artist working a packed dark club \u2014 the lead rides the dembow and the crowd is the second instrument, with hype doubles cracking the punch words and a signature producer-tag shout stamping the drops. Signature: the answered command \u2014 the grind hook lands and the written gap gets a hype double of the last word or a short crowd shout, one answer per pocket, so the record sounds like the floor it runs. Placement: doubles hit the punch words the verse rhymes hammer; crowd answers thicken on every hook return; a [Build Up] into [Drop] frames the beat re-entering, and the two bars before the drop stay bare so the dembow alone loads the pressure. Tag identity: a lead, a hype shouter, and the crowd \u2014 hype (double of the punch word) on the hard lines, short (crowd: shouted answer) in the gaps, a producer-style ad-lib stamp on the drop; all direction stays rhythm-and-energy in plain English \u2014 bounce, punch, swagger \u2014 never a request for an accent, a nationality, or slang beyond words the user's own sheet already holds.",
            "adlibDensity": "heavy",
            "minAdlibs": 8,
            "deliveryTags": [
              "[Perreo]",
              "[Ad-Lib Section]",
              "[Drop]",
              "[Build Up]"
            ]
          },
          "builder": {
            "instruments": [
              "dembow",
              "sub bajo 808",
              "sintetizador oscuro",
              "hi-hats picados",
              "snare del dembow",
              "efectos y vocal chops",
              "pads atmosf\xE9ricos"
            ],
            "themes": [
              "Perreo y fiesta",
              "Deseo y calentura",
              "La disco y la noche"
            ],
            "purposes": [
              "Perrear",
              "Prender la disco",
              "Conquistar"
            ]
          }
        },
        {
          "id": "reggaet-n-rom-ntico",
          "name": "Reggaet\xF3n Rom\xE1ntico",
          "oneLine": "The melodic crossover lane \u2014 dembow under real feeling, the sung reggaet\xF3n of love, heartbreak, and devotion that carries the genre to radio without losing the bounce.",
          "tempoGroove": "90-96 BPM on a softened dembow \u2014 the boom-ch-boom-chick stays, but the snare eases and the synths open so a real melody can ride on top. Medium-low word density: verses thin out and the pre-chorus and chorus breathe with sung, held lines the voice can bend, so the hook lifts instead of hammering.",
          "writingDials": [
            "Aim at the chest, not the floor: this room carries feeling \u2014 love, longing, heartbreak, devotion. The dembow still bounces, but the song is about one person and how they make the singer feel, not a command to the crowd.",
            "Write a melodic hook that lifts, not a chant that hammers: the chorus is a sung promise, a question, or an ache built to soar on open vowels \u2014 end the feeling-lines on sounds a voice can hold and slide, and let the melody, not the word-count, do the lifting.",
            "Thin the verses so the chorus can breathe: verses stay lower and more spoken-melodic to set up the lift; the density drop between verse and chorus IS the drama, the opposite of perreo's flat grind.",
            "Verse two must move the story of these two people forward \u2014 an answer, a memory, a turn \u2014 never re-circle verse one's feeling; the melody repeats, the story advances.",
            "Vulnerability is allowed here and nowhere else in the genre so freely: the singer can want, miss, regret, and admit fault \u2014 the ache is the point, delivered warm.",
            "Keep one detail only the real person would recognize: rom\xE1ntico dies as greeting-card sweetness the second it stops being about a specific someone from the user's story.",
            "The bounce is the floor, the feeling is the ceiling: if the dembow disappears entirely under the ballad, this has become a Latin pop song, not reggaet\xF3n \u2014 the riddim must stay felt.",
            "Cross-genre firewall: the dial that keeps it reggaet\xF3n and not Latin ballad is the dembow riddim staying audible under the melody \u2014 soften it, do not delete it; a sung love song with the boom-ch-boom-chick gone is Pop, not this room."
          ],
          "rendering": "Softened dembow drums with an eased offbeat snare, warm sub bajo 808, bright melodic synth riffs and lush atmospheric pads opening the top end, gentle vocal chops answering the hook, guitar or piano color allowed under the chorus. Melodic lead vocal with a light modern tuning sheen, stacked harmony doubles lifting the chorus and generous air; current urbano-crossover polish \u2014 warm, open, radio-bright, the bounce still there but never harsh.",
          "storyFit": "Best for: love songs, heartbreak, missing someone, devotion, apology with a beat, a crush, longing across distance. Poor fit: hard club grind, pure boasting, aggressive flexing, party commands \u2014 the feeling needs room the perreo floor will not give it.",
          "parodyTraps": "Deleting the dembow entirely so it becomes generic Latin balladry; greeting-card devotion with no specific person in it; machine-faked slang dropped into a tender song; getting club-explicit where the room asked for ache; a chorus that chants like a floor command instead of soaring.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Melodic] [Harmonies] [Drop] [Falsetto]. This room performs like one melodic lead multiplied by their own harmonies over a bouncing beat \u2014 warmer and more intimate than perreo, with soft doubles instead of a hype shouter. Signature: the harmony lift \u2014 the lead sings the hook and stacked self-harmonies swell under the last words, thickening the ache without a crowd shouting from outside. Placement: verses stay nearly bare with at most a breathed double so the story reads clean, then the harmonies bloom on the pre-chorus and stack fullest on the chorus lift; a [Drop] can mark the beat opening back up under the first chorus, and a [Falsetto] rise is saved for the final chorus where the feeling peaks. Tag identity: a melodic lead and their own harmony stack \u2014 soft (echo of the hook's last words) doubles, a saved [Falsetto] lift, warm ad-libs answering the melody; no hype shouter, no crowd chant, and every echoed word comes from the song's own sheet, directed as feeling and melody in plain English, never as an accent.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Melodic]",
              "[Harmonies]",
              "[Drop]",
              "[Falsetto]"
            ]
          },
          "builder": {
            "instruments": [
              "dembow",
              "sub bajo 808",
              "sintetizador oscuro",
              "pads atmosf\xE9ricos",
              "efectos y vocal chops",
              "snare del dembow",
              "hi-hats picados"
            ],
            "themes": [
              "Desamor y superaci\xF3n",
              "Amor t\xF3xico",
              "La disco y la noche"
            ],
            "purposes": [
              "Conquistar",
              "Olvidar a alguien",
              "Prender la disco"
            ]
          }
        },
        {
          "id": "old-school",
          "name": "Old-School / Reggaet\xF3n Cl\xE1sico",
          "oneLine": "The 2000s boom era \u2014 the raw Puerto Rican coro-and-preg\xF3n sound, chant hooks and crowd energy, the gasolina-era bounce built for the whole barrio to shout back.",
          "tempoGroove": "94-102 BPM on a rawer, harder dembow \u2014 the classic snare cracking loud and dry, less polish, more punch. Medium-high word density built on the coro structure: a big call-and-response chorus the crowd shouts, verses of rhythmic preg\xF3n between, hooks short and blunt enough for a stadium to answer.",
          "writingDials": [
            "Build the whole song around the coro: the chorus is a call-and-response chant the whole barrio shouts back \u2014 write the call AND the answer, keep both short and blunt, and make the coro the thing the song is remembered by.",
            "Write the verses as preg\xF3n: rhythmic, chant-adjacent delivery between coros, riding the raw dembow with hard internal rhyme \u2014 closer to the crowd than to the radio.",
            "This is a we song, not an I-and-you song: the energy is collective, the barrio, the crew, the party as one \u2014 the coro speaks for the whole floor, not a private feeling.",
            "Keep it raw and direct: the era's charm is grit, not gloss \u2014 blunt hooks, hard bounce, no melodic softening. If it sounds radio-smooth, it has left the room.",
            "Ride and repeat one hook phrase past polite \u2014 the coro gains power each round as more voices pile onto it, so the return is the feature, never the failure.",
            "Present-tense party energy: the night is happening now, the floor is full now \u2014 celebration, swagger, the dance, told from inside the moment, not remembered after.",
            "Keep the user's real crew, real barrio, real night in the verses \u2014 the era is a sound and an energy, never an excuse to swap the user's story for stock 2000s club props.",
            "Cross-genre firewall: the tag-identity gold is the coro-and-preg\xF3n crowd chant \u2014 a whole barrio answering the call \u2014 which is what makes it reggaet\xF3n cl\xE1sico and not dancehall's lone deejay toasting or hip-hop's solo-plus-hype; the crowd IS the co-star here."
          ],
          "rendering": "Raw hard dembow with a loud dry cracking snare del dembow, punchy sub bajo 808, gritty minor synth stabs, sharp hi-hats picados, minimal pads \u2014 the rougher, less-polished 2000s club sound. Rhythmic preg\xF3n lead answered by a shouting crowd coro, hype doubles on the punch words; gasolina-era energy, raw and loud, mixed to sound like a packed marquesina, not a studio.",
          "storyFit": "Best for: party anthems, crew and barrio pride, the dance floor, confident swagger, a big night, throwback celebration. Poor fit: tender heartbreak, private devotion, slow reflection, polished radio love \u2014 the raw coro has no room for whisper-distance feeling.",
          "parodyTraps": "Machine-faked slang or accent spellings instead of the user's own words; a coro too wordy or too smooth for a crowd to shout back; melodic radio gloss papering over the era's grit; stock 2000s club props swapped in for the user's real barrio and crew; a solo hook where the whole floor should be answering.",
          "performance": {
            "prose": "Density heavy; min adlibs 7; delivery tags [Call and Response] [Ad-Lib Section] [Drop] [Build Up]. This room performs like a packed marquesina answering one MC \u2014 the lead throws the coro call and the whole crowd shouts the answer back, the barrio itself the co-star, with hype doubles cracking the preg\xF3n. Signature: the coro answer \u2014 the lead calls the hook and the crowd shouts the response in its gap, more voices piling on each return, so the same coro lands louder every round. Placement: crowd answers live on the coro call-and-response and the preg\xF3n line-ends that ask for witness; doubles hit the punch words the verses hammer; a [Build Up] into [Drop] frames the coro slamming back in, and the final coros stack the fullest crowd. Tag identity: an MC and the whole barrio \u2014 call (lead) and (crowd: shouted answer) trading the coro, hype (double of the punch word) on the preg\xF3n, the crowd swelling each hook repeat; all direction stays rhythm-and-energy in plain English \u2014 bounce, punch, crowd \u2014 never a request for an accent, a nationality, or slang the user's own sheet did not already carry.",
            "adlibDensity": "heavy",
            "minAdlibs": 7,
            "deliveryTags": [
              "[Call and Response]",
              "[Ad-Lib Section]",
              "[Drop]",
              "[Build Up]"
            ]
          },
          "builder": {
            "instruments": [
              "dembow",
              "snare del dembow",
              "sub bajo 808",
              "sintetizador oscuro",
              "hi-hats picados",
              "efectos y vocal chops"
            ],
            "themes": [
              "Perreo y fiesta",
              "Lealtad al barrio",
              "Presumir y flexear"
            ],
            "purposes": [
              "Perrear",
              "Prender la disco",
              "Levantar el ego"
            ]
          }
        },
        {
          "id": "neoperreo",
          "name": "Neoperreo",
          "oneLine": "The underground, art-brat lane \u2014 the femme-forward, queer-leaning experimental reggaet\xF3n that flips the dembow cold: glitchy, sparse, distorted, self-aware, made for the club fringe not the radio.",
          "tempoGroove": "95-105 BPM on a warped, stripped dembow \u2014 the boom-ch-boom-chick present but flipped cold, sometimes distorted, sometimes cut to skeleton. Deliberately shifting word density: sparse, chopped, glitchy cells and long stretches where the beat drops to almost nothing, more texture than verse-chorus.",
          "writingDials": [
            "Flip the perreo posture: same body heat, but ironic, self-aware, and in control \u2014 the singer owns the gaze rather than performing for it, and attitude outranks explicitness.",
            "Write sparse and chopped: short cells built to loop, pitch, and glitch, with hard silences engineered in \u2014 the space and the distortion are half the song, so hand whole bars to the beat.",
            "Cold over warm: detached, deadpan, edged delivery beats sweetness or hype here; the energy is the underground club at 3am, not the mainstage.",
            "Attitude is the whole register: confidence, defiance, boredom-as-power, the fringe looking back at the mainstream \u2014 a posture the other three rooms rarely hold.",
            "Repetition works by warping, not warmth: the same cell returns pitched, chopped, or filtered differently each time \u2014 freshness comes from the flip, never from new words.",
            "Keep the user's real edge and real story inside the cells: neoperreo is a stance, never a license to fake a persona the user never wrote.",
            "Cross-genre firewall: still the dembow, just flipped cold and sparse \u2014 the bounce survives under the glitch; strip the dembow out entirely for straight distorted club and it stops being reggaet\xF3n, and its cold self-aware stance is what separates it from Perreo's straight sweat."
          ],
          "rendering": "Warped, stripped dembow with the offbeat snare distorted or filtered, heavy sub bajo 808, cold detuned sintetizador oscuro, glitchy hi-hats picados, aggressive efectos y vocal chops pitched and chopped as texture, atmospheric pads bleeding into silence \u2014 space and distortion mixed as instruments. Deadpan, close-mic, effected lead with pitched and glitched vocal treatment; underground 2010s-to-now neoperreo aesthetic, cold and self-aware, the club fringe not the radio.",
          "storyFit": "Best for: defiant confidence, ironic heat, owning the gaze, fringe swagger, self-possessed flirtation, attitude over romance. Poor fit: warm devotion, crowd singalongs, tender apology, earnest celebration \u2014 the cold detachment kills sincerity and the sparseness kills the singalong.",
          "parodyTraps": "Faking underground edge with machine-generated slang instead of the user's real voice; writing it warm or hype like mainstream perreo; deleting the dembow for generic glitch club; filling the engineered silences with words; a persona the user never wrote pasted on as costume.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Ad-Lib Section] [Drop] [Build Up]. This room performs by subtraction and effect \u2014 the lead is cold and close, the beat is the co-star, and the boldest move is the voice glitching or stepping aside. Signature: the pitched self-chop \u2014 the lead's own line returns chopped, pitched, or filtered in the engineered gap, a cold self-echo that thickens by effect rather than by a crowd. Placement: the few vocal events sit exactly where the writing cut the holes \u2014 a pitched chop after the cell, a deadpan aside on the [Drop], nothing at all where the beat strips to silence; a [Build Up] into [Drop] does the arranging while the adlib count stays low enough to count on one hand. Tag identity: a cold solo lead and their own effected self \u2014 pitched (chop of the last word) and glitched doubles, one deadpan aside, no crowd and no warm harmony stack; all direction stays energy and texture in plain English \u2014 cold, deadpan, chopped \u2014 never an accent or faked slang, and if the page fills the engineered silence the room is gone.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Ad-Lib Section]",
              "[Drop]",
              "[Build Up]"
            ]
          },
          "builder": {
            "instruments": [
              "dembow",
              "sub bajo 808",
              "sintetizador oscuro",
              "efectos y vocal chops",
              "hi-hats picados",
              "pads atmosf\xE9ricos"
            ],
            "themes": [
              "Confianza y actitud",
              "Deseo y calentura",
              "Perreo y fiesta"
            ],
            "purposes": [
              "Levantar el ego",
              "Perrear",
              "Conquistar"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "perreo",
          "strength": "strong",
          "roomId": "perreo"
        },
        {
          "cue": "perrear",
          "strength": "strong",
          "roomId": "perreo"
        },
        {
          "cue": "dembow",
          "strength": "strong",
          "roomId": "perreo"
        },
        {
          "cue": "club",
          "strength": "weak",
          "roomId": "perreo"
        },
        {
          "cue": "disco",
          "strength": "weak",
          "roomId": "perreo"
        },
        {
          "cue": "grind",
          "strength": "weak",
          "roomId": "perreo"
        },
        {
          "cue": "calentura",
          "strength": "weak",
          "roomId": "perreo"
        },
        {
          "cue": "fiesta",
          "strength": "weak",
          "roomId": "perreo"
        },
        {
          "cue": "baile",
          "strength": "weak",
          "roomId": "perreo"
        },
        {
          "cue": "rom\xE1ntico",
          "strength": "strong",
          "roomId": "reggaet-n-rom-ntico"
        },
        {
          "cue": "desamor",
          "strength": "strong",
          "roomId": "reggaet-n-rom-ntico"
        },
        {
          "cue": "reggaet\xF3n rom\xE1ntico",
          "strength": "strong",
          "roomId": "reggaet-n-rom-ntico"
        },
        {
          "cue": "amor",
          "strength": "weak",
          "roomId": "reggaet-n-rom-ntico"
        },
        {
          "cue": "heartbreak",
          "strength": "weak",
          "roomId": "reggaet-n-rom-ntico"
        },
        {
          "cue": "coraz\xF3n",
          "strength": "weak",
          "roomId": "reggaet-n-rom-ntico"
        },
        {
          "cue": "devotion",
          "strength": "weak",
          "roomId": "reggaet-n-rom-ntico"
        },
        {
          "cue": "te extra\xF1o",
          "strength": "weak",
          "roomId": "reggaet-n-rom-ntico"
        },
        {
          "cue": "olvidar",
          "strength": "weak",
          "roomId": "reggaet-n-rom-ntico"
        },
        {
          "cue": "cl\xE1sico",
          "strength": "strong",
          "roomId": "old-school"
        },
        {
          "cue": "reggaet\xF3n cl\xE1sico",
          "strength": "strong",
          "roomId": "old-school"
        },
        {
          "cue": "gasolina",
          "strength": "strong",
          "roomId": "old-school"
        },
        {
          "cue": "coro",
          "strength": "strong",
          "roomId": "old-school"
        },
        {
          "cue": "viejo school",
          "strength": "weak",
          "roomId": "old-school"
        },
        {
          "cue": "barrio",
          "strength": "weak",
          "roomId": "old-school"
        },
        {
          "cue": "2000s",
          "strength": "weak",
          "roomId": "old-school"
        },
        {
          "cue": "throwback",
          "strength": "weak",
          "roomId": "old-school"
        },
        {
          "cue": "marquesina",
          "strength": "weak",
          "roomId": "old-school"
        },
        {
          "cue": "neoperreo",
          "strength": "strong",
          "roomId": "neoperreo"
        },
        {
          "cue": "underground",
          "strength": "strong",
          "roomId": "neoperreo"
        },
        {
          "cue": "glitch",
          "strength": "weak",
          "roomId": "neoperreo"
        },
        {
          "cue": "experimental",
          "strength": "weak",
          "roomId": "neoperreo"
        },
        {
          "cue": "alt",
          "strength": "weak",
          "roomId": "neoperreo"
        },
        {
          "cue": "fringe",
          "strength": "weak",
          "roomId": "neoperreo"
        }
      ]
    },
    "bachata": {
      "id": "bachata",
      "name": "Bachata",
      "aliases": [
        "bachata music",
        "bachata sensual",
        "bachata moderna",
        "bachata tradicional"
      ],
      "profileText": "A bachata writer starts with the second voice. The lead requinto guitar is not accompaniment \u2014 it is a character, and it answers the singer at the end of nearly every line. So the writing job is spatial before it is verbal: phrases end early and leave the line hanging so the requinto can cry its reply in the gap, and a lyric sheet packed wall-to-wall has silenced the instrument that defines the genre before its first word is judged. Under that call-and-answer runs the groove that separates bachata from bolero: the g\xFCira scraping steady sixteenths and the bong\xF3 rolling into every phrase-turn, danceable even when the words are breaking. The writer plans where the words are NOT, because that space belongs to the guitar and the scrape.\n\nThe tradition the genre was built to carry is amargue \u2014 bitterness, the wound of a love gone wrong worn openly. That is the emotional root, but the three rooms wear it three different ways, and choosing the room is choosing how nakedly the hurt shows and to whom. Tradicional wears it undignified, the drunk undefended confession sung to a cantina that already knows the cry \u2014 short wailed phrases, plain rhyme, the requinto answering like a second mourner. Moderna / Urbana keeps composure and narrates the wound like a man telling you the story of what she did \u2014 the Aventura / Romeo Santos lane, richer harmony, R&B-tinged phrasing that leans and syncopates, real plot per verse, the requinto now trading with a controlled voice. Sensual lowers the lights and pulls two bodies close, folding the ache into desire and breathing it as wanting rather than wailing it \u2014 sparse breathed phrases, suggestion over statement, the requinto answering warm and mellow instead of crying. Same guitar, same wound; different amount of dignity kept, different distance to the listener.\n\nThe law above every dial is language. Spanish is the song's native tongue here \u2014 the lyrics are written in Spanish by a later layer \u2014 but the writer works in plain English craft instruction and never invents endearments, slang, or accent flavor to costume the song; only words the user wrote in their own story survive, and the identity is carried by rhythm, phrasing, and the requinto's answer, never by sprinkled vocabulary. Craft terms the writer thinks with \u2014 requinto, amargue, g\xFCira, bong\xF3, derecho, mambo section \u2014 are working vocabulary and stay out of the lyrics, adlibs, and render notes unless the user wrote them first. And the postcard is not bachata: generic Latin-lover romance, beaches, and cocktails are the tourist parody the founder rejects; the user's own bottle, door, name, and room are the song.",
      "defaultRoomId": "bachata-tradicional",
      "rooms": [
        {
          "id": "bachata-tradicional",
          "name": "Bachata Tradicional",
          "oneLine": "The raw amargue of the cabaret and the campo \u2014 1960s-90s Dominican heartbreak sung wide open, requinto crying back at every line, no dignity left to protect.",
          "tempoGroove": "130-160 BPM (the amargue ballad end sits around 130-140, the campo and cabaret dance end pushes 150-160 \u2014 the fastest and most agitated of the three rooms) felt in a lilting four with the g\xFCira scraping steady sixteenths and the bong\xF3 rolling into every phrase-turn; the derecho verse groove opens up into the mambo section where the requinto takes over. Low-to-medium word density: short wounded phrases with real air after them, because the requinto answers the voice at the end of nearly every line and the singer needs room to break.",
          "writingDials": [
            "Requinto-first: the lead guitar is the second voice and it gets the last word. End phrases early and leave the line hanging so the requinto can cry the answer in the gap \u2014 a sheet that fills every bar has silenced the instrument that defines the genre.",
            "Wear the amargue undignified: this room is the drunk, undefended confession \u2014 the man who has stopped protecting his pride and says the pain plainly. Self-pity is not a flaw here; it is the register.",
            "The hook is a wail the whole cantina knows: a short heartbroken phrase of roughly four to seven words, re-sung more times than dignity allows, gathering grief each round rather than resolving it.",
            "Rhyme stays plain and singable: a repeated key word or an easy near-rhyme beats a clever scheme; the point is the cry landing, not the craft showing.",
            "Keep the story bodily and specific to the user's own life \u2014 the actual bottle, the actual door, the actual name \u2014 but let the feeling run to the floor. Understatement is the wrong instinct here; this room says the whole hurt.",
            "Direct address to the one who left is fully at home: begging, accusing, remembering out loud. Second person aimed at her, or a first person collapsing in front of the room.",
            "The mambo section is a written silence: plan a stretch where the words stop entirely and the requinto and bong\xF3 take the song \u2014 the lyric is built around that instrumental cry, not over it.",
            "Cross-genre firewall: What makes it tradicional and not bolero is the g\xFCira and bong\xF3 driving a danceable lilt under the heartbreak \u2014 bolero broods in orchestral rubato with no scraper and no dance; this room aches on its feet."
          ],
          "rendering": "Bright crying lead requinto answering every vocal line, steady rhythm guitar (segunda), rolling bong\xF3 with open-tone fills into each turn, g\xFCira scraping constant sixteenths, upright-toned electric bass, a derecho verse groove breaking into a requinto-led mambo section. Raw impassioned lead vocal pushed to the edge of breaking, minimal doubling, dry-to-warm cabaret room sound; 1970s-90s Dominican amargue era.",
          "storyFit": "Best for: heartbreak worn openly, betrayal, drunken despecho, begging someone to come back, an amor imposible confessed, the memory of a love that ruined you. Poor fit: cool composed storytelling with a plot to unfold \u2014 that is moderna; slow-dance seduction \u2014 that is sensual; party confidence and joy of any kind, which this room has no register for.",
          "parodyTraps": "Any Spanish endearment or slang the writer sprinkled that the user never said; generic Latin-lover postcard romance with no real wound under it; making the hook clever instead of cry-able; filling the requinto's answer gaps with words; keeping a dignified distance when the whole point is the man who has lost his.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Guitar Solo] [Instrumental Break] [Harmonies] [Melancholy]. This room performs like a man crying to a room that already knows the song \u2014 one raw lead voice and the requinto answering him like a second mourner, no crowd, no polish. Signature: the requinto answer \u2014 the guitar cries back the emotion of the line in the gap the phrasing leaves, so the ache is stated twice, once in words and once in strings. Placement: the requinto answers land at the line-ends the singer leaves open, roughly one per line through the verses, and the mambo section gets a [Guitar Solo] or [Instrumental Break] header on its own line where the words stop entirely and the requinto and bong\xF3 carry the grief; a thin harmony can shadow the hook's last words, and the final wails push hardest. Tag identity: a lone heartbroken voice and its crying requinto \u2014 the guitar as the answering mourner, a bare harmony shadow on the hook only, the mambo break marked as its own instrumental cry. No group, no hype, no club \u2014 one man, one guitar answering him, and any sung word is plain language from the user's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Guitar Solo]",
              "[Instrumental Break]",
              "[Harmonies]",
              "[Melancholy]"
            ]
          },
          "builder": {
            "instruments": [
              "requinto",
              "segunda guitarra",
              "bong\xF3",
              "g\xFCira",
              "bajo"
            ],
            "themes": [
              "Amor y desamor",
              "Borrachera de despecho",
              "Traici\xF3n",
              "Rogar y suplicar",
              "Amor imposible"
            ],
            "purposes": [
              "Llorar el despecho",
              "Rogar que vuelva",
              "Desahogar la pena"
            ]
          }
        },
        {
          "id": "bachata-moderna",
          "name": "Bachata Moderna / Urbana",
          "oneLine": "The Aventura / Romeo Santos lane \u2014 bachata that tells the story instead of only wailing it: richer harmony, R&B-tinged phrasing, a composed narrator working through heartbreak with a cooler head.",
          "tempoGroove": "125-140 BPM with the classic g\xFCira-and-bong\xF3 bachata groove kept intact but produced clean and modern, the requinto often electric and effected. Medium word density: longer storytelling lines with an R&B sense of phrasing that leans and syncopates, still leaving the requinto its answer but carrying real plot per verse.",
          "writingDials": [
            "Narrate, do not only wail: the singer is composed enough to tell you what happened \u2014 this room has a plot, a point of view, sometimes a twist. The heartbreak is delivered as a story with a narrator who has thought about it.",
            "Verses move forward with real information: verse two must advance the account of these two specific people \u2014 what she said, what he did next, how it turned \u2014 never re-circle verse one's feeling. The story is the engine.",
            "Write for R&B-tinged phrasing: lines can lean, drag, and syncopate against the groove the way a smooth vocal bends a bachata, and melisma on held vowels is welcome where tradicional stays plain \u2014 so end feeling-lines on vowels the voice can slide.",
            "Harmony is richer, so the hook can carry a fuller melodic idea than the plain tradicional wail \u2014 a sung refrain, memorable and returning, that deepens as the chapters accumulate rather than just repeating.",
            "Keep the requinto answering even inside the fuller production: leave it real gaps at line-ends. A modern bachata that buries the guitar's reply under wall-to-wall vocals has lost the lane's spine.",
            "Point of view is confident and specific: first person telling one person the story, with room for wit, irony, or an unexpected angle on the heartbreak that a pure amargue wail would never pause for.",
            "Register can widen past pure despecho: devotion, seduction inside a story, a proud reckoning, even confidence \u2014 but it stays a bachata story, and the requinto stays its second voice.",
            "Cross-genre firewall: What makes it moderna and not salsa is that the requinto answering the voice over g\xFCira and bong\xF3 still runs the song \u2014 keys may add pads or color, but never a repeating salsa-style piano montuno pattern, no brass section, no clave driving it; the R&B flavor lives in the phrasing and harmony, never in a horn arrangement."
          ],
          "rendering": "Clean modern bachata production \u2014 electric requinto with light effects answering the vocal lines, tight rhythm guitar, crisp bong\xF3, g\xFCira scraping steady sixteenths, rounded modern bass, subtle keys or pads under the harmony. Smooth controlled lead vocal with R&B phrasing, tasteful runs and doubled harmonies, a polished contemporary sheen; Aventura-to-Romeo-Santos era, 2000s to now.",
          "storyFit": "Best for: a heartbreak with a story to tell, betrayal narrated with composure, devotion, a proud reckoning with an ex, seduction framed as a story, an amor imposible worked through with a cooler head. Poor fit: an undignified drunk collapse with no plot \u2014 that is tradicional; a wordless slow-grind mood \u2014 that is sensual; anything that needs a horn section or a montuno, which belongs to salsa, not here.",
          "parodyTraps": "Sprinkled Spanish phrases the user never wrote; a story that never actually advances \u2014 verses re-circling one feeling while pretending to narrate; burying the requinto under nonstop vocals; borrowing a famous Romeo hook line the user's story never contained; mistaking R&B flavor for turning the track into generic Latin R&B with the bachata guitar removed.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Guitar Solo] [Harmonies] [Smooth] [Ad-Lib Section]. This room performs like a smooth narrator with the requinto as his confidant \u2014 one composed lead voice, tasteful self-harmonies, the electric requinto answering and trading with him. Signature: the requinto trade \u2014 the guitar answers the sung line and sometimes finishes the phrase the voice starts, a call-and-answer between the narrator and his second voice that carries the story's mood between the words. Placement: requinto answers sit in the gaps at line-ends and a full [Guitar Solo] takes the instrumental section; light harmony doubles thicken the hook, and a short ad-lib run can lift the last chorus where a pure wail would not. Tag identity: a composed lead and his electric requinto \u2014 self-harmonies on the refrain, the guitar trading and answering across the verses, one tasteful run reserved for the final chorus. No cantina crowd and no club stack \u2014 a narrator, his harmonies, and the guitar that answers him, every sung word from the user's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Guitar Solo]",
              "[Harmonies]",
              "[Smooth]",
              "[Ad-Lib Section]"
            ]
          },
          "builder": {
            "instruments": [
              "requinto",
              "segunda guitarra",
              "bong\xF3",
              "g\xFCira",
              "bajo"
            ],
            "themes": [
              "Amor y desamor",
              "Traici\xF3n",
              "Nostalgia",
              "Recuerdos de un amor",
              "Celos"
            ],
            "purposes": [
              "Dedicar a un amor",
              "Rogar que vuelva",
              "Llorar el despecho"
            ]
          }
        },
        {
          "id": "bachata-sensual",
          "name": "Bachata Sensual",
          "oneLine": "The modern Spanish-born sensual lane \u2014 bachata pulled close and slowed to a grind: smooth, breathy, intimate, the ache folded into desire on a dimly lit floor.",
          "tempoGroove": "125-135 BPM but felt smooth and unhurried, the g\xFCira and bong\xF3 softened and the pocket relaxed for a body-to-body sway; the requinto answers warm and mellow rather than crying. Low word density with long breathed phrases and held vowels; the singer sits close to the mic, so lines must leave room to soften and stretch.",
          "writingDials": [
            "Keep the world close: two bodies, one dim room, one slow dance. The whole song is at skin distance \u2014 never widen to a public cry or a narrated saga; this room is felt, not declared.",
            "Fold the ache into the desire: sensual bachata still carries longing and even hurt, but it breathes it as wanting rather than wailing it \u2014 the amargue is present, lowered to a murmur, tangled with the pull of the body.",
            "Write for a breathy close vocal: end feeling-lines on open vowels the voice can hold and soften; avoid hard consonant endings there, and let phrases trail so the requinto's warm answer can slide underneath.",
            "Suggestion over statement: the heat is in what is implied and physical from the user's own moment \u2014 the closeness, the breath, the hand \u2014 never in explicit spelling-out; sensual insinuates, it does not narrate the act.",
            "The hook is a low intimate phrase aimed at one body, re-sung softer and closer each pass \u2014 a private murmur, never a phrase a room would shout back.",
            "Keep the requinto answering, but mellow: leave it the line-end gaps so its warm reply threads the sway; the space still belongs to the guitar even at this closeness.",
            "Point of view is first person to a you who must feel like the real person from the user's story \u2014 one detail only the two of them would recognize keeps it from becoming a generic seduction template.",
            "Cross-genre firewall: What makes it bachata and not reggaeton or tropical pop is the requinto answering the voice over a real g\xFCira-and-bong\xF3 bachata groove \u2014 there is no dembow boom-chick under it; if the guitar answer and the scraper vanish, the room is gone."
          ],
          "rendering": "Smooth modern sensual production \u2014 warm mellow requinto answering softly, silky rhythm guitar, relaxed bong\xF3 and softened g\xFCira holding the sway, deep rounded bass, airy pads and light reverb for intimacy. Breathy close-mic lead vocal with soft doubled harmonies and a controlled falsetto lift, polished and low; 2010s-to-now sensual bachata sound.",
          "storyFit": "Best for: slow-dance intimacy, seduction, close devotion, a sensual anniversary, missing a partner's body, longing folded into desire. Poor fit: an undignified drunk heartbreak wail \u2014 that is tradicional; a plot-driven story of what went wrong \u2014 that is moderna; anger, protest, or party energy, which this hushed room has no room for.",
          "parodyTraps": "Getting explicit where the room insists on suggestion; Spanish endearments the user never wrote pasted in as flavor; strings-and-candles greeting-card seduction with no specific real person in it; a hook that behaves like a crowd chant instead of a murmur; dropping the requinto and the g\xFCira so it becomes generic slow R&B with a Latin coat of paint.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Soft] [Harmonies] [Falsetto] [Sensual]. This room performs at skin distance \u2014 one breathy lead voice with its own soft harmony doubles and the requinto answering warm and low, nobody else in the room. Signature: the breathed echo and mellow guitar \u2014 a soft doubled harmony repeats the last words of a line the way a body leans closer, while the warm requinto slides its answer under the gap, close and unhurried, never a crowd. Placement: the floor of 3 sits where the closeness peaks \u2014 one soft echo under the hook's last words, one breathed harmony where the phrase trails at the bridge, one held falsetto or hummed note in the outro; verses stay nearly bare so the breath carries them, and the requinto's warm answer can take a whole passage instead of any vocal show. Tag identity: an intimate solo voice with soft self-harmonies and a mellow answering requinto \u2014 a breathed (echo of the last words) double, a [Falsetto] lift saved for the closest moment, a [Soft] header where the song pulls nearest. No crowd, no narrator's trade, no cantina \u2014 two bodies and a slow sway, every echoed word from the user's own sheet.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Soft]",
              "[Harmonies]",
              "[Falsetto]",
              "[Sensual]"
            ]
          },
          "builder": {
            "instruments": [
              "requinto",
              "segunda guitarra",
              "bong\xF3",
              "g\xFCira",
              "bajo"
            ],
            "themes": [
              "Amor y desamor",
              "Nostalgia",
              "Recuerdos de un amor",
              "Celos"
            ],
            "purposes": [
              "Bailar pegado",
              "Dedicar a un amor",
              "Desahogar la pena"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "amargue",
          "strength": "strong",
          "roomId": "bachata-tradicional"
        },
        {
          "cue": "despecho",
          "strength": "strong",
          "roomId": "bachata-tradicional"
        },
        {
          "cue": "borrachera de despecho",
          "strength": "strong",
          "roomId": "bachata-tradicional"
        },
        {
          "cue": "cabaret",
          "strength": "strong",
          "roomId": "bachata-tradicional"
        },
        {
          "cue": "bachata del campo",
          "strength": "strong",
          "roomId": "bachata-tradicional"
        },
        {
          "cue": "heartbreak",
          "strength": "weak",
          "roomId": "bachata-tradicional"
        },
        {
          "cue": "traici\xF3n",
          "strength": "weak",
          "roomId": "bachata-tradicional"
        },
        {
          "cue": "rogar",
          "strength": "weak",
          "roomId": "bachata-tradicional"
        },
        {
          "cue": "suplicar",
          "strength": "weak",
          "roomId": "bachata-tradicional"
        },
        {
          "cue": "amor imposible",
          "strength": "weak",
          "roomId": "bachata-tradicional"
        },
        {
          "cue": "llorar",
          "strength": "weak",
          "roomId": "bachata-tradicional"
        },
        {
          "cue": "aventura",
          "strength": "strong",
          "roomId": "bachata-moderna"
        },
        {
          "cue": "romeo santos",
          "strength": "strong",
          "roomId": "bachata-moderna"
        },
        {
          "cue": "bachata urbana",
          "strength": "strong",
          "roomId": "bachata-moderna"
        },
        {
          "cue": "contar la historia",
          "strength": "weak",
          "roomId": "bachata-moderna"
        },
        {
          "cue": "storytelling",
          "strength": "weak",
          "roomId": "bachata-moderna"
        },
        {
          "cue": "devoci\xF3n",
          "strength": "weak",
          "roomId": "bachata-moderna"
        },
        {
          "cue": "reproche",
          "strength": "weak",
          "roomId": "bachata-moderna"
        },
        {
          "cue": "nostalgia",
          "strength": "weak",
          "roomId": "bachata-moderna"
        },
        {
          "cue": "bachata sensual",
          "strength": "strong",
          "roomId": "bachata-sensual"
        },
        {
          "cue": "sensual",
          "strength": "strong",
          "roomId": "bachata-sensual"
        },
        {
          "cue": "bailar pegado",
          "strength": "strong",
          "roomId": "bachata-sensual"
        },
        {
          "cue": "pegao",
          "strength": "strong",
          "roomId": "bachata-sensual"
        },
        {
          "cue": "seducci\xF3n",
          "strength": "weak",
          "roomId": "bachata-sensual"
        },
        {
          "cue": "slow dance",
          "strength": "weak",
          "roomId": "bachata-sensual"
        },
        {
          "cue": "intimidad",
          "strength": "weak",
          "roomId": "bachata-sensual"
        },
        {
          "cue": "cuerpo a cuerpo",
          "strength": "weak",
          "roomId": "bachata-sensual"
        }
      ]
    },
    "regionalmexicano": {
      "id": "regionalmexicano",
      "name": "Regional Mexicano",
      "aliases": [
        "regional",
        "banda",
        "norte\xF1o",
        "norteno",
        "corrido",
        "sierre\xF1o",
        "sierreno",
        "musica mexicana",
        "m\xFAsica mexicana"
      ],
      "profileText": "A Regional Mexicano writer starts by choosing the room the band lives in, because in this umbrella the instrumentation is the identity and it rewrites the whole lyric. Banda is a full acoustic wind band from Sinaloa \u2014 a wall of trumpets and trombones over tambora and sousaphone \u2014 so its writing is loud, communal, and belted, with phrase-ends left open for the brass to shout back. Norteno is leaner: accordion and bajo sexto over an upright or electric bass, a dance band equally at home carrying a corrido or aching through a cantina love song, sung close to speech with the accordion answering as a second voice. Sierreno strips it further to a spare acoustic trio \u2014 requinto guitar, twelve-string bajo, and tuba \u2014 intimate and unhurried, the traditional root the modern tumbado grew from. Pick the band first; the room decides density, delivery, and how much air the words leave.\n\nAt the center of it all is the corrido: a sung narrative ballad that tells one true story in the third person, plainly and in order, with real names, places, and dates. The corrido announces its subject up front and takes its leave at the end; it advances the plot every verse and treats a repeated hook as optional. It is the storytelling engine of the genre and it can be carried by norteno accordion or banda brass alike. The grito \u2014 the joyful, defiant shout the players throw over a peak or into a solo \u2014 is legitimate energy in every room; write it as a shout in plain English, never as a phonetic spelling.\n\nTwo laws sit above every dial. First, dialect: never write generated border slang, accent spelling, or fake exclamations \u2014 delivery is directed as register, energy, and phrasing in plain English, and the craft words these pages teach with (corrido, banda, norteno, bajo sexto, requinto, sierreno) stay out of the lyrics unless the user wrote them. Second, and absolute for corridos: never invent violence, weapons, cartels, or crime the user did not put in their own story. The corrido form serves whatever true story the user brings \u2014 a struggle, a rise, a loyalty, a hero, a loss \u2014 and the craft is the storytelling, never the narco costume.",
      "defaultRoomId": "corrido",
      "rooms": [
        {
          "id": "banda-sinaloense",
          "name": "Banda Sinaloense",
          "oneLine": "Sinaloa's brass-and-tambora powerhouse \u2014 a full acoustic wind band, loud and celebratory, built to fill a plaza and move a whole crowd at once.",
          "tempoGroove": "120-160 BPM most commonly, spanning a driving 2/4 for a fast pace and a swaying 3/4 waltz (vals); the tambora and tuba drive a bouncing oom-pah pulse. Word density is medium and singable \u2014 the brass answers between vocal lines, so leave the ends of phrases open for the horns to shout back.",
          "writingDials": [
            "Write for the brass to answer: end vocal phrases a beat early and leave a hole where the trumpets and trombones throw their fanfare \u2014 the horn response is part of the line, so a sheet that fills every beat smothers the band that defines the genre.",
            "Big and communal on top of the user's real story: banda is celebration music for a plaza, so the chorus opens outward for a crowd to sing while the verses keep the specific names, places, and details the user brought.",
            "Melody rides high and declamatory: write lines a singer belts near the top of the range with strong open vowels at the peaks, because banda vocals are pushed out over a wall of brass, never crooned under it.",
            "Chorus is a raised toast, not a whisper: a short, hooky, repeatable phrase the room can lift on \u2014 if it could not be shouted across a packed dance floor with drinks in the air, it is pitched wrong for this room.",
            "Match the meter to the dance: a fast 2/4 for the up-tempo quebradita and tambora numbers, a swaying 3/4 waltz (vals) when the story wants it \u2014 pick the pulse first and write the syllable count to sit inside it.",
            "Rhyme clean and sturdy: banda leans on solid, satisfying end-rhyme the crowd hears coming \u2014 this is not the room for slant-rhyme subtlety, the rhyme lands square with the downbeat.",
            "Registers are pride, love, heartbreak, and party: a boast honoring a hometown, a devoted love song, a drink-in-hand heartbreak, or a flat-out fiesta \u2014 all delivered at full chest, warmth and volume together even when the news is sad."
          ],
          "rendering": "Full brass band: trumpets and trombones stacked in tight harmony throwing fanfare responses, clarinets on top, sousaphone (tuba) walking the bass, tambora (bass drum played both heads) and tarola (snare) driving the oom-pah, a charcheta answering. Lead vocal belted high and forward or a two- or three-voice harmony chorus; big, live, plaza-loud acoustic mix, no synths \u2014 modern Sinaloa banda sound.",
          "storyFit": "Best for: pride in a hometown or a person, celebration and fiesta, devoted love, drink-in-hand heartbreak, honoring someone, a quinceanera or a wedding. Poor fit: quiet confession, intricate storytelling that needs stillness, anything wanting an intimate low-volume delivery.",
          "parodyTraps": "Fake border-Spanish or slang the user never wrote; sombrero-and-tequila postcard cliches standing in for a real story; a thin lyric that gives the brass nothing to answer; a whispered or under-sung delivery that fights the wall of horns; cramming every beat so the band cannot breathe.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Instrumental Break] [Harmonies] [Shout] [Call and Response]. This room performs like a full brass band around one belting lead \u2014 the cast is the players themselves, and their shouted brass answers and joyful gritos are most of the energy. Signature: the brass answer \u2014 the horns throw a fanfare into the hole the singer leaves at a phrase end, and a joyful shout from the players lands on the peaks, the whole band lifting each chorus. Placement: horn responses fall at verse and chorus line-ends where the vocal steps aside; a joyful shout tops the chorus and the biggest turns; an [Instrumental Break] hands a whole section to the trumpets between verses, and harmony voices thicken the final choruses. Tag identity: a brass band and its lead \u2014 trumpets and trombones answering in the gaps, a joyful defiant shout thrown by the players over the peaks, a harmony chorus swelling on the hook. Every shout is energy in plain English, never a scripted foreign exclamation the user did not write.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Harmonies]",
              "[Shout]",
              "[Call and Response]"
            ]
          },
          "builder": {
            "instruments": [
              "trompetas de banda",
              "charcheta",
              "clarinete",
              "tuba",
              "tambora",
              "tarola"
            ],
            "themes": [
              "Orgullo del pueblo",
              "La familia y la madre",
              "La lucha y el trabajo",
              "Lealtad y la palabra"
            ],
            "purposes": [
              "Celebrar con la banda",
              "Bailar en la fiesta",
              "Honrar a alguien",
              "Presumir el logro"
            ]
          }
        },
        {
          "id": "norte-o",
          "name": "Norte\xF1o",
          "oneLine": "The accordion-and-bajo-sexto sound of northern Mexico and the border \u2014 leaner than banda, equally at home telling a corrido or aching through a cantina love song.",
          "tempoGroove": "Wide range by dance: 80-110 BPM for a bolero or a slow cantina ballad, up to 140-180 for a polka, redova, or an up-tempo corrido; the bajo sexto and bass lock a two-step or waltz pulse under the accordion. Word density is medium \u2014 carry a real narrative or a real ache, but leave the accordion room to answer and fill.",
          "writingDials": [
            "The accordion is the second voice: it answers vocal phrases and takes whole solo breaks, so write line-ends that hand off to it and plan the instrumental turnaround where the accordion sings alone.",
            "Pick the dance and let it set the feel: a polka or redova for bright momentum, a waltz (vals) for a swaying number, a bolero tempo for a slow love song \u2014 norteno is dance music first, so the groove decides the phrasing before the words do.",
            "Two home registers, one band: the sung narrative (a corrido carrying a story with names and places) and the cantina love song (devotion, heartbreak, longing, a drink and a hard night) \u2014 decide which the user's story is before choosing point of view.",
            "For the love songs, keep it plainspoken and sincere: direct first-person address, everyday words, real ache \u2014 norteno romance is heartfelt and unironic, so understatement and a true detail beat any clever turn.",
            "Rhyme steady and singable: clean end-rhyme, often in couplets or the corrido quatrain, so the story or the sentiment stays easy to follow at dance-floor volume.",
            "Sit the vocal in a natural, conversational range: norteno is sung close to speech, warm and slightly nasal in tradition, more told than belted \u2014 write phrases a plain voice can carry without straining.",
            "Let the chorus land the ache or the boast in one clear line: the hook is the emotional headline the accordion then echoes, so make it plain enough to sing back and true enough to mean."
          ],
          "rendering": "Accordion leading melody and answering the vocal, bajo sexto (twelve-string) strumming and running bass runs, tololoche (upright bass) or electric bass, tarola and a light drum kit keeping the two-step or waltz. Warm conversational lead vocal, often a two-voice harmony on the chorus; tight border-norteno acoustic mix, cantina-live feel \u2014 accordion and bajo sexto out front, no synths.",
          "storyFit": "Best for: sung stories with real people and places, devoted or heartbroken love, longing across the border, loyalty, a hard-luck night, honoring someone in narrative. Poor fit: dense club boasting, huge plaza-anthem energy (that is banda), abstract mood pieces with no story or no one being addressed.",
          "parodyTraps": "Generated border slang or accent spelling the user never wrote; cartel or gun props injected into a story that never had them; postcard cliches instead of the user's real details; a wall-to-wall lyric that leaves the accordion no room to answer or solo; a belted plaza delivery that ignores the conversational voice.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Instrumental Break] [Harmonies] [Shout]. This room performs like a small border band in a cantina \u2014 one warm conversational lead, a second harmony voice on the chorus, and the accordion as the answering instrument, with the players throwing an occasional joyful shout. Signature: the accordion answer and turnaround \u2014 the squeezebox echoes the vocal at line-ends and takes the instrumental break alone, and a joyful shout from the players tops a big line or kicks off the solo. Placement: the harmony voice comes in on the chorus and the emotional peaks; the accordion fills the gaps at line-ends and owns the [Instrumental Break]; a joyful shout marks the turn into the solo or the last chorus. Tag identity: a lead and a harmony partner over an answering accordion \u2014 a second voice on the hook, the accordion singing in the holes, a joyful shout thrown by the players as release. Any shout is plain-English energy, never a scripted exclamation the user did not bring.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Harmonies]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "acorde\xF3n",
              "bajo sexto",
              "tololoche",
              "tarola"
            ],
            "themes": [
              "La frontera",
              "Lealtad y la palabra",
              "El corrido de un valiente",
              "La familia y la madre",
              "Traici\xF3n y venganza"
            ],
            "purposes": [
              "Contar una historia",
              "Recordar al ausente",
              "Honrar a alguien",
              "Bailar en la fiesta"
            ]
          }
        },
        {
          "id": "corrido",
          "name": "Corrido (Tradicional)",
          "oneLine": "The storytelling engine of the whole genre \u2014 a sung ballad that narrates one true story in the third person, with real names, places, and dates, plainly and in order.",
          "tempoGroove": "75-140 BPM in a steady march or waltz that never rushes the tale; the band keeps a driving, even pulse so the words stay front and center. Word density is high for the genre \u2014 this is a narrative form, so verses carry a lot of story, but phrases still break for the accordion or brass to punctuate.",
          "writingDials": [
            "Tell it third-person and in order: the corrido narrates a story about someone, start to finish, like a news ballad \u2014 even if the story is the user's own, the traditional frame reports the events plainly rather than confessing them inward.",
            "Name the specifics the tradition lives on: a real person, a real place, a real time \u2014 the corrido earns belief through concrete detail, so build the verses from the actual who, where, and when of the user's story.",
            "Open by announcing the subject and close by taking leave: corridos traditionally state up front who and what this ballad is about, and end with a farewell or a moral \u2014 plan the first verse as an announcement and the last as a sign-off.",
            "Advance the plot every verse: each verse moves the events forward \u2014 this is the one room where narrative progression outranks a repeated hook, and a chorus is optional; if there is one, keep it a short refrain between story beats.",
            "Serve whatever true story the user brought \u2014 a struggle, a rise, a loyalty, a hero, a loss: honor the storytelling craft, and never add violence, weapons, cartels, or crime the user did not put in their own story.",
            "Stay acoustic and traditional in the writing: this is the old sung-ballad form on accordion or brass, not the modern trap-fused sound \u2014 keep the cadence a march or waltz, never an 808 bounce.",
            "Keep the language plain and reportorial: steady quatrains, clean end-rhyme, everyday words the story rides on \u2014 the drama comes from the events, not from ornament, and a clear line beats a clever one."
          ],
          "rendering": "Traditional acoustic backing \u2014 either norteno accordion and bajo sexto with upright bass, or a banda brass section \u2014 over a steady march or waltz, with instrumental turnarounds between verses. Clear storytelling lead vocal, more narrated than belted, plain and forward so every word of the tale lands; live traditional mix, no 808s or trap production, no synths.",
          "storyFit": "Best for: telling one true story, honoring a hero or an elder, a struggle or a rise, loyalty and the given word, remembering the fallen, an event worth recording. Poor fit: abstract mood, tight repetitive dance hooks, present-tense party energy, or any story with no events to narrate in sequence.",
          "parodyTraps": "Inventing violence, guns, cartels, or crime the user never wrote \u2014 the single hardest law here; narco costume pasted onto a peaceful story; vague generalities where names and places belong; skipping the story to loop a hook; any 808 or trap production, which belongs to the separate modern corrido lane, not this traditional room.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Instrumental Break] [Shout]. This room performs like a balladeer telling a true story to a listening room \u2014 one clear narrating lead carries nearly all of it, and the band punctuates between story beats rather than answering every line. Signature: the instrumental turnaround between verses \u2014 the accordion or brass takes a short break that marks the passage of time in the tale, and a joyful shout from the players lifts the turn into a new verse or the finish. Placement: the lead narrates the verses almost unbroken; an [Instrumental Break] falls between major story beats to let events breathe; a joyful shout marks a peak or the sign-off. Tag identity: a lone storyteller and a punctuating band \u2014 the narrating lead front and center, instrumental turnarounds between verses, a joyful shout thrown by the players as release. The shout is energy in plain English, never a scripted exclamation, and the story is only ever the one the user actually told.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "acorde\xF3n",
              "bajo sexto",
              "tololoche",
              "trompetas de banda",
              "tarola",
              "tuba"
            ],
            "themes": [
              "El corrido de un valiente",
              "La lucha y el trabajo",
              "Lealtad y la palabra",
              "Orgullo del pueblo",
              "La familia y la madre"
            ],
            "purposes": [
              "Contar una historia",
              "Honrar a alguien",
              "Recordar al ausente",
              "Presumir el logro"
            ]
          }
        },
        {
          "id": "sierre-o",
          "name": "Sierre\xF1o",
          "oneLine": "The stripped acoustic corner of the sierra \u2014 just requinto guitar, twelve-string bajo, and tuba, spare and intimate, the traditional root the modern tumbado grew from.",
          "tempoGroove": "70-120 BPM, unhurried and often rubato at the edges, a small acoustic trio breathing with the singer; the tuba walks a soft bass while the requinto answers. Word density is low-to-medium \u2014 the sparseness is the point, so leave real air around the lines and let the requinto fill it.",
          "writingDials": [
            "Write for a trio, not a band: only requinto, bajo, and tuba are holding the song up, so keep the arrangement in mind and leave open space for the lead guitar to answer and the bass to walk between phrases.",
            "Intimacy over spectacle: this is the close, personal end of the umbrella \u2014 a small-room confession or a first-person story sung near to the mic, so favor a true quiet detail over any big communal gesture.",
            "The requinto is a duet partner: write phrase-ends that invite the lead acoustic guitar to answer and take delicate solo runs, and plan the turnaround where it sings alone between verses.",
            "Let the tempo breathe: sierreno often sits back and rushes nothing, so write phrases that can stretch and settle rather than lock hard to a dance grid \u2014 the space is a feature, not a gap to fill.",
            "Plain, sincere, unadorned language: with so little instrumentation, the words are exposed, so understatement and honesty carry further than ornament, and one real image outweighs a pretty generality.",
            "Serves both the ballad and the quiet story: a heartfelt love song or a first-person telling both fit here \u2014 and the same no-invented-violence law holds, the form carries whatever true story the user brought.",
            "Keep it acoustic and traditional: this is the unplugged sierra root, requinto and tuba, not the 808-fused modern sound \u2014 hold the writing to that spare live-trio world."
          ],
          "rendering": "Spare acoustic trio: requinto (small nylon-string lead guitar) answering the vocal with delicate runs, twelve-string bajo (bajo sexto or bajo quinto) strumming, sousaphone or tuba walking a soft bass. Intimate close-miked lead vocal, sometimes a second harmony voice; dry, warm, unplugged sierra mix with real air around everything \u2014 no drums needed, no synths, no 808s.",
          "storyFit": "Best for: intimate love songs, a personal first-person story, longing, devotion, a quiet tribute, reflection sung close. Poor fit: plaza-anthem energy, dense party boasting, big brass celebration, anything that needs volume and a crowd.",
          "parodyTraps": "Fake regional slang the user never wrote; imported cartel or gun props in a tender story; filling the spare arrangement with extra instruments until the intimacy is gone; an over-belted delivery that breaks the closeness; 808s or trap drums, which belong to the separate modern lane, not this acoustic room.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Instrumental Break] [Harmonies]. This room performs like two or three players close together in a small room \u2014 an intimate lead, sometimes a single harmony voice, and the requinto as the answering partner, no crowd and no wall of sound. Signature: the requinto answer \u2014 the lead acoustic guitar replies to the vocal in the open space at line-ends and takes a delicate solo turnaround between verses, the whole trio breathing with the singer. Placement: a harmony voice slips in on the emotional peaks only; the requinto fills the gaps the sparse writing leaves and owns the [Instrumental Break] turnaround; verses stay bare so the closeness reads. Tag identity: a small acoustic trio and an intimate lead \u2014 the requinto answering in the holes, an occasional second harmony voice at the peaks, the tuba walking soft underneath. No crowd, no brass wall, no shouted hype \u2014 just a few players and the air between them, and every word is the user's own.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Harmonies]"
            ]
          },
          "builder": {
            "instruments": [
              "requinto",
              "guitarra ac\xFAstica",
              "bajo sexto",
              "tuba"
            ],
            "themes": [
              "La familia y la madre",
              "Lealtad y la palabra",
              "El rancho y la tierra",
              "La lucha y el trabajo"
            ],
            "purposes": [
              "Recordar al ausente",
              "Honrar a alguien",
              "Contar una historia",
              "Celebrar con la banda"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "banda",
          "strength": "strong",
          "roomId": "banda-sinaloense"
        },
        {
          "cue": "banda sinaloense",
          "strength": "strong",
          "roomId": "banda-sinaloense"
        },
        {
          "cue": "tambora",
          "strength": "strong",
          "roomId": "banda-sinaloense"
        },
        {
          "cue": "quebradita",
          "strength": "strong",
          "roomId": "banda-sinaloense"
        },
        {
          "cue": "brass band",
          "strength": "weak",
          "roomId": "banda-sinaloense"
        },
        {
          "cue": "plaza",
          "strength": "weak",
          "roomId": "banda-sinaloense"
        },
        {
          "cue": "fiesta",
          "strength": "weak",
          "roomId": "banda-sinaloense"
        },
        {
          "cue": "hometown pride",
          "strength": "weak",
          "roomId": "banda-sinaloense"
        },
        {
          "cue": "celebration",
          "strength": "weak",
          "roomId": "banda-sinaloense"
        },
        {
          "cue": "norte\xF1o",
          "strength": "strong",
          "roomId": "norte-o"
        },
        {
          "cue": "norteno",
          "strength": "strong",
          "roomId": "norte-o"
        },
        {
          "cue": "accordion",
          "strength": "strong",
          "roomId": "norte-o"
        },
        {
          "cue": "bajo sexto",
          "strength": "strong",
          "roomId": "norte-o"
        },
        {
          "cue": "polka",
          "strength": "weak",
          "roomId": "norte-o"
        },
        {
          "cue": "cantina",
          "strength": "weak",
          "roomId": "norte-o"
        },
        {
          "cue": "border",
          "strength": "weak",
          "roomId": "norte-o"
        },
        {
          "cue": "two-step",
          "strength": "weak",
          "roomId": "norte-o"
        },
        {
          "cue": "love song",
          "strength": "weak",
          "roomId": "norte-o"
        },
        {
          "cue": "corrido",
          "strength": "strong",
          "roomId": "corrido"
        },
        {
          "cue": "corrido tradicional",
          "strength": "strong",
          "roomId": "corrido"
        },
        {
          "cue": "ballad",
          "strength": "strong",
          "roomId": "corrido"
        },
        {
          "cue": "true story",
          "strength": "weak",
          "roomId": "corrido"
        },
        {
          "cue": "tell the story of",
          "strength": "weak",
          "roomId": "corrido"
        },
        {
          "cue": "hero",
          "strength": "weak",
          "roomId": "corrido"
        },
        {
          "cue": "honor him",
          "strength": "weak",
          "roomId": "corrido"
        },
        {
          "cue": "honor her",
          "strength": "weak",
          "roomId": "corrido"
        },
        {
          "cue": "remember the fallen",
          "strength": "weak",
          "roomId": "corrido"
        },
        {
          "cue": "sierre\xF1o",
          "strength": "strong",
          "roomId": "sierre-o"
        },
        {
          "cue": "sierreno",
          "strength": "strong",
          "roomId": "sierre-o"
        },
        {
          "cue": "requinto",
          "strength": "strong",
          "roomId": "sierre-o"
        },
        {
          "cue": "acoustic trio",
          "strength": "weak",
          "roomId": "sierre-o"
        },
        {
          "cue": "stripped",
          "strength": "weak",
          "roomId": "sierre-o"
        },
        {
          "cue": "intimate",
          "strength": "weak",
          "roomId": "sierre-o"
        },
        {
          "cue": "unplugged",
          "strength": "weak",
          "roomId": "sierre-o"
        }
      ]
    },
    "salsa": {
      "id": "salsa",
      "name": "Salsa",
      "aliases": [
        "salsa music",
        "salsa dura",
        "salsa romantica",
        "salsa rom\xE1ntica",
        "timba",
        "salsa brava"
      ],
      "profileText": "A salsa writer starts with the clave \u2014 the hidden two-bar pulse that every line, every stab, and every drum answers to. It is rarely played on its own, but it governs everything: a phrase that fights the clave sounds wrong even to a listener who could not name why. So the writing job is rhythmic before it is verbal \u2014 scan each line against the clave, land the stressed syllables where the pulse wants them, and leave the piano montuno, the tumbao bass, and the brass room to answer between phrases. A salsa sheet packed wall-to-wall, with no gaps for the mambo to punch, has failed before its first word is judged. And the song commits to one clave direction \u2014 2-3 or 3-2; once it is set, every line, the canto, the coro, and the preg\xF3n, stays on that side of it, because a phrase that lands reversed against the section (crossing the clave) is the fastest tell of fake salsa and gets recut, never forced.\n\nThe song has two halves, and the second is the soul of the genre. First the canto \u2014 the sung verses that lay out the story. Then the montuno: a fixed coro (a short repeated chorus line the writer sets) trades with the sonero, the lead singer, who improvises fresh calls \u2014 the preg\xF3n \u2014 around it. The writer builds both halves on purpose. The coro must be short, chantable, and open enough to answer, because it repeats many times and the sonero fires new lines into the gaps after it. That improvisation is the genre's living heart; the page cannot script it, but it must leave the exact room for it and set a coro worth answering.\n\nThe rooms bend all of this. Salsa dura writes hard on-the-beat testimony for a barrio, its coro a shouted verdict, the I widening into we. Salsa rom\xE1ntica writes longer sung phrases for one lover, its coro a private promise, open vowels saved for the voice. Timba writes the densest, most syncopated lines and turns on abrupt breaks, its coro a command snapped at the floor. The law above every dial is the same as everywhere: Spanish is the song's language, but slang, accent spellings, and island or street costume appear only if the user wrote them. Craft words \u2014 clave, montuno, coro, preg\xF3n, sonero, tumbao, mambo \u2014 are the writer's tools, never the song's, and never enter the lyrics, adlibs, or render notes. Delivery is directed as rhythm and energy in plain English \u2014 cadence, bounce, punch \u2014 never as an accent, and the user's own places and people always outrank any stock tropical scenery.",
      "defaultRoomId": "salsa-dura",
      "rooms": [
        {
          "id": "salsa-dura",
          "name": "Salsa Dura",
          "oneLine": "The hard Fania-era sound of the barrio \u2014 aggressive brass, social weight, and a sonero who testifies over a driving montuno.",
          "tempoGroove": "~90-100 BPM counted on the quarter note (felt in cut-time, in 2 \u2014 the danced pulse is the slow half, not a fast one) locked to a 2-3 or 3-2 son clave \u2014 the hidden pulse every line must respect. Word density moderate and percussive: tight on-the-beat phrases short enough for a brass mambo to punch between them, never wall-to-wall.",
          "writingDials": [
            "Clave-first: scan every line against the clave before keeping it \u2014 stressed syllables lock to the clave hits, and a line that fights the pulse gets recut, never forced onto it.",
            "Two-part build is structural: write a sung canto that lays out the story in order, then hand the song to the montuno where a fixed coro repeats and the sonero answers \u2014 plan both halves from the start, because the montuno is where a dura song lives.",
            "Write the coro as a rallying chant: a short declarative phrase of roughly two to five words, built for a group to shout back and repeat many times, gaining weight each round; the coro states the song's verdict, the barrio's line on it.",
            "Leave real space for the preg\xF3n: after each coro, mark the gap where the sonero improvises a fresh call \u2014 so the coro line must end open enough to answer and stay simple enough to survive twenty returns.",
            "Register is testimony with an edge: injustice, barrio pride, betrayal, survival told plainly and defiantly; the I is allowed to widen into we by the montuno, one man's complaint becoming the block's.",
            "Rhyme is clean and confident \u2014 simple perfect rhymes read as timeless here, and repeating a key word beats a clever scheme; the honest word outranks the rhyming one.",
            "Concrete detail is the currency: the real corner, the real work, the real name from the user's story \u2014 never stock barrio scenery.",
            "Cross-genre firewall: the aggressive brass mambo and the montuno's rallying call-and-response make it dura, not rom\xE1ntica's smoothed love-croon \u2014 dura's coro is a crowd shouting a verdict, not a lover echoing a promise."
          ],
          "rendering": "Driving piano montuno, tumbao bass locked to the clave, congas timbales and bongo full and hot, aggressive trombone-and-trumpet mambo stabs between phrases. Raw upfront lead vocal answered by a full coro shouting the responses; 1970s Fania analog warmth, real room, no modern gloss.",
          "storyFit": "Best for: barrio pride, social injustice, betrayal and its comeuppance, survival, hard-won respect, the block itself. Poor fit: tender private love at whisper distance, delicate apology, quiet reflection \u2014 that heat belongs to rom\xE1ntica.",
          "parodyTraps": "Any Spanish slang the user did not write; generic spicy-Latin-party clich\xE9s; postcard tropical scenery; making the coro clever instead of chantable; letting the horns and words fill every beat so the clave drowns.",
          "performance": {
            "prose": "Density heavy; min adlibs 8; delivery tags [Call and Response] [Brass] [Percussion Break] [Ad-Lib Section]. This room performs like a barrio band with the block singing back \u2014 a lead sonero over a full brass section, and the montuno's call-and-response is the whole signature. Signature: the coro answered \u2014 the group shouts the fixed coro and the sonero fires a fresh improvised call into the gap after it, the coro gathering voices on each return so the same line lands harder every round. Placement: the canto stays lead-forward with light doubles; the adlibs and answers live in the montuno, where the sonero and coro trade every pass and a [Percussion Break] header can hand the drums a stretch. Tag identity: a lead sonero plus a full coro answering as the barrio \u2014 short shouted (coro responses) to the sonero's improvised calls, brass-stab and break headers, group voices swelling on each coro repeat. No solo crooning, no lone star \u2014 the room answers as one, in the song's own plain words.",
            "adlibDensity": "heavy",
            "minAdlibs": 8,
            "deliveryTags": [
              "[Call and Response]",
              "[Brass]",
              "[Percussion Break]",
              "[Ad-Lib Section]"
            ]
          },
          "builder": {
            "instruments": [
              "piano montuno",
              "bajo tumbao",
              "congas",
              "timbales",
              "bong\xF3",
              "tromb\xF3n",
              "trompetas",
              "campana"
            ],
            "themes": [
              "El barrio y la calle",
              "Injusticia social",
              "Orgullo latino"
            ],
            "purposes": [
              "Contar la vida del barrio",
              "Bailar en la pista",
              "Encender la fiesta"
            ]
          }
        },
        {
          "id": "salsa-rom-ntica",
          "name": "Salsa Rom\xE1ntica",
          "oneLine": "The smooth 80s-and-90s love lane \u2014 polished, melodic, and sung close, where the montuno turns into a lover's repeated promise.",
          "tempoGroove": "~85-95 BPM (quarter-note, felt in cut-time) over a lighter, rounded clave groove with every edge softened \u2014 the pulse stays, but the room is intimate, not a rally. Lower word density with open vowels at line-ends; the singer croons, so lines must leave room to hold and bend a note.",
          "writingDials": [
            "Keep the world close: one couple, one feeling \u2014 devotion, longing, an apology, a memory of them. Never widen to community or message; that is dura's lane.",
            "The canto is a real conversation moving forward: verse two must advance the story of these two specific people \u2014 an answer, a next step, a memory \u2014 never re-circle verse one's feeling.",
            "Write for a crooner: end the lines that carry the feeling on open vowels a voice can hold and slide; avoid hard consonant endings on the peaks.",
            "The montuno is still the engine, but the coro is a tender vow: write a short repeated promise or a lover's question aimed at one person \u2014 intimate, never a crowd chant \u2014 and leave the gap where the sonero improvises softer, warmer calls around it.",
            "Couplets that resolve: gentle perfect or near-perfect rhymes that close sweetly feel romantic here, where dura leaves lines open for the shout.",
            "Sensuality is adult and suggested, carried by one image that turns romantic on the second listen and sustains \u2014 never spelled out.",
            "Point of view: first person to a you who must feel like the real person from the user's story \u2014 include one detail only they would recognize.",
            "Cross-genre firewall: the smooth polished production and a montuno coro sung as a private promise make it rom\xE1ntica, not dura \u2014 here the coro is a lover repeating a vow, not a barrio shouting a verdict."
          ],
          "rendering": "Silky piano montuno, round warm tumbao bass, congas and timbales played soft and tight, lush strings or pads, tender muted brass answering the voice. Polished close-miked lead with airy harmonies and generous reverb; late-80s-through-90s studio sheen.",
          "storyFit": "Best for: love letters, anniversaries, apologies, new romance, missing a partner, devotion through hard times. Poor fit: protest, barrio boasting, hard social weight, explicit heat \u2014 rom\xE1ntica suggests, it never spells out.",
          "parodyTraps": "Machine-added Spanish pet names the user never wrote; running the seduction-cliche checklist instead of the couple's real details; getting explicit; a coro that behaves like a crowd chant instead of a private promise; strings-and-roses greeting-card lines with no specific person in them.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Call and Response] [Harmonies] [Crooning] [Soft]. This room performs at close distance \u2014 one tender sonero with soft harmony doubles, and the montuno softened into intimate trading. Signature: the promise answered \u2014 a small warm coro repeats the sung vow and the lead improvises tender calls into the gap after it, close and breathy, gathering feeling each pass rather than volume. Placement: the canto stays nearly bare so the crooning carries it, at most one soft echo under a peak line; the trading lives in the montuno, kept intimate, and a muted brass or piano answer can take a section instead of any vocal show. Tag identity: an intimate lead with a soft coro answering as one warm voice \u2014 airy (coro responses) to the sonero's tender calls, a held last word marked with trailing dots, harmonies arriving on the final montuno. No shouting barrio, no crowd \u2014 two people and a soft groove, every echoed word from the song's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Call and Response]",
              "[Harmonies]",
              "[Crooning]",
              "[Soft]"
            ]
          },
          "builder": {
            "instruments": [
              "piano montuno",
              "bajo tumbao",
              "congas",
              "timbales",
              "trompetas",
              "tromb\xF3n"
            ],
            "themes": [
              "Romance caliente",
              "Amor y enga\xF1o",
              "Nostalgia del que se fue"
            ],
            "purposes": [
              "Enamorar",
              "Recordar la tierra",
              "Bailar en la pista"
            ]
          }
        },
        {
          "id": "timba",
          "name": "Timba / Salsa Brava",
          "oneLine": "The dense, virtuosic Cuban lane \u2014 streetwise, syncopated, and cocky, with a montuno that trades commands at speed.",
          "tempoGroove": "~85-100 BPM (quarter-note), rolling and heavy \u2014 its intensity comes from dense syncopation and abrupt section breaks, not a faster tempo, over the clave. The highest word density of the three: rapid rhythm-riding phrases locked to the bounce, with punch-and-pause gaps left for the coro to snap back.",
          "writingDials": [
            "Ride the clave dense: near-rap cadence with internal rhyme locked to the syncopation \u2014 the words work as another percussion line, so mouth-feel and pocket outrank neat sentences.",
            "Two-part shape, but the montuno dominates: keep the canto short and get to the montuno fast, where the fixed coro and the sonero trade at speed \u2014 plan many short coros a song can cycle through, because the trading IS the song.",
            "Write the coro as a command or a flat boast: tell the floor what to do or state the claim plain, short enough to shout back on the second pass; two alternating coro lines trading back and forth make a legitimate hook.",
            "Write punch-and-pause: land a hard phrase, then leave a beat for the coro or the crowd to snap back \u2014 the gap after the punch is part of the lyric, and the sonero's calls fire fast and cocky into it.",
            "Ride one rhyme sound for several lines on purpose: hammering the same end-sound builds momentum here, where most lanes would read it as lazy.",
            "Present tense and cocky: the song happens NOW, on the floor or on the street \u2014 swagger, rivalry, flirtation, hustle pride, stated flat and never explained; a boast that gets justified dies.",
            "Sections contrast by feel and break, not by adding plot: switch the vocal rhythm and drop into a hard break instead of walking through a story \u2014 and the boasts must be the user's real wins, not stock luxury.",
            "Cross-genre firewall: the density, the abrupt breaks, and a montuno of rapid traded commands make it timba, not dura's slower on-the-beat testimony \u2014 timba's coro snaps a command at the floor where dura's shouts a verdict to the barrio."
          ],
          "rendering": "Aggressive syncopated piano montuno, hard-driving tumbao bass, congas timbales and bongo dense and virtuosic with abrupt breaks, stabbing full brass. Rhythm-riding lead vocal talk-singing more than crooning, with hype coro doubles cracking on the punch words; modern 1990s-to-now Havana sound, hot and busy but clave-locked.",
          "storyFit": "Best for: dancefloor swagger, confidence, bold flirtation, rivalry and winning, street hustle pride, celebration. Poor fit: grief, tender apology, slow reflection, quiet devotion \u2014 the groove has no patience for them.",
          "parodyTraps": "Machine-written Cuban slang the user never wrote; American rap phrasing pasted over the clave (loses the bounce entirely); long storytelling verses; explaining or softening the boast; coros with too many words for a crowd to snap back.",
          "performance": {
            "prose": "Density heavy; min adlibs 8; delivery tags [Call and Response] [Brass] [Break] [Ad-Lib Section]. This room performs like a band working a packed floor \u2014 the sonero rides the clave and the coro snaps back, with hype doubles cracking on the punch words. Signature: the answered punch \u2014 a hard phrase lands, and the written gap gets the coro's short shouted snap-back or a hype double of the punch word, one answer per gap, so the record sounds like the floor it is for. Placement: the short canto stays lead-forward; the trading floods the montuno, where the coro answers every pass and thickens on each command's return, and a hard [Break] header can drop the band out for a bar. Tag identity: a sonero and a snapping coro \u2014 hype (coro doubles) on the hard lines, short shouted (coro snap-backs) in the written gaps, two-line command coros traded between lead and group. All delivery stays rhythm-and-energy language in the song's own plain words \u2014 cadence, bounce, punch \u2014 never a request for slang or accent beyond what the user wrote.",
            "adlibDensity": "heavy",
            "minAdlibs": 8,
            "deliveryTags": [
              "[Call and Response]",
              "[Brass]",
              "[Break]",
              "[Ad-Lib Section]"
            ]
          },
          "builder": {
            "instruments": [
              "piano montuno",
              "bajo tumbao",
              "congas",
              "timbales",
              "bong\xF3",
              "trompetas",
              "tromb\xF3n",
              "campana"
            ],
            "themes": [
              "Celebraci\xF3n y rumba",
              "Sabor y alegr\xEDa de vivir",
              "Orgullo latino"
            ],
            "purposes": [
              "Encender la fiesta",
              "Celebrar la rumba",
              "Bailar en la pista"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "salsa dura",
          "strength": "strong",
          "roomId": "salsa-dura"
        },
        {
          "cue": "fania",
          "strength": "strong",
          "roomId": "salsa-dura"
        },
        {
          "cue": "el barrio",
          "strength": "strong",
          "roomId": "salsa-dura"
        },
        {
          "cue": "injusticia",
          "strength": "weak",
          "roomId": "salsa-dura"
        },
        {
          "cue": "la calle",
          "strength": "weak",
          "roomId": "salsa-dura"
        },
        {
          "cue": "orgullo",
          "strength": "weak",
          "roomId": "salsa-dura"
        },
        {
          "cue": "struggle",
          "strength": "weak",
          "roomId": "salsa-dura"
        },
        {
          "cue": "old school",
          "strength": "weak",
          "roomId": "salsa-dura"
        },
        {
          "cue": "salsa rom\xE1ntica",
          "strength": "strong",
          "roomId": "salsa-rom-ntica"
        },
        {
          "cue": "romance",
          "strength": "strong",
          "roomId": "salsa-rom-ntica"
        },
        {
          "cue": "anniversary",
          "strength": "strong",
          "roomId": "salsa-rom-ntica"
        },
        {
          "cue": "amor",
          "strength": "weak",
          "roomId": "salsa-rom-ntica"
        },
        {
          "cue": "love song",
          "strength": "weak",
          "roomId": "salsa-rom-ntica"
        },
        {
          "cue": "apology",
          "strength": "weak",
          "roomId": "salsa-rom-ntica"
        },
        {
          "cue": "mi amor",
          "strength": "weak",
          "roomId": "salsa-rom-ntica"
        },
        {
          "cue": "missing someone",
          "strength": "weak",
          "roomId": "salsa-rom-ntica"
        },
        {
          "cue": "timba",
          "strength": "strong",
          "roomId": "timba"
        },
        {
          "cue": "salsa brava",
          "strength": "strong",
          "roomId": "timba"
        },
        {
          "cue": "cuban salsa",
          "strength": "strong",
          "roomId": "timba"
        },
        {
          "cue": "party",
          "strength": "weak",
          "roomId": "timba"
        },
        {
          "cue": "swagger",
          "strength": "weak",
          "roomId": "timba"
        },
        {
          "cue": "flirting",
          "strength": "weak",
          "roomId": "timba"
        },
        {
          "cue": "rumba",
          "strength": "weak",
          "roomId": "timba"
        }
      ]
    },
    "corridotumbado": {
      "id": "corridotumbado",
      "name": "Corrido Tumbado",
      "aliases": [
        "corridos tumbados",
        "tumbado",
        "tumbados",
        "corrido belico",
        "corrido b\xE9lico",
        "corridos belicos",
        "trap corrido",
        "corridos"
      ],
      "profileText": "A tumbado writer starts from a fusion, not a template: the acoustic sierre\xF1o core \u2014 a lead requinto running melodic answers, a bajo sexto strumming the body, a tuba walking the bass, sometimes charcheta accents \u2014 married to trap phrasing, a half-time bounce, and the conversational cadence of a generation. The voice is talk-sung and modern: closer to someone recounting their life than to a belted old-style verse, riding just off the beat. The song is a corrido \u2014 a first-person narrative with swagger \u2014 but a MODERN one, so the writing job is to carry a real story or a real feeling on live strings while letting the requinto answer in the gaps. Plan where the words are NOT: land a phrase, stop, and leave the run its room. A wall of words with no air buries the exact sound that makes it tumbado, whatever the drums do.\n\nThe signature performance is a cast, not a solo. The pl\xE1tica opens it \u2014 a short spoken intro from the crew, a few hyped words traded before the requinto and the beat drop in \u2014 and the gritos punctuate it, sharp shouts of pride landing on the hard lines and the coro. These are legit ad-libs, directed as energy in plain English: a burst of hype, a sharp answer, the crew behind the lead. They are never phonetic spelling and never an added accent. The requinto itself is a second voice \u2014 it answers the vocal, it cries under the sad lines, it takes whole breaks of its own. Craft terms this page teaches with \u2014 tumbado, sierre\xF1o, requinto, b\xE9lico, corrido, trap-corrido \u2014 are the writer's working vocabulary, never the song's: they stay out of the lyrics, the adlibs, and the render notes unless the user wrote them first.\n\nTwo laws sit above every dial. Dialect: the user's own words and slang rule; delivery is directed as cadence and energy, never as a Mexican accent or invented slang spellings \u2014 rhythm and phrasing carry the identity in Spanish, written later. And the ethics law, which this genre needs stated plainly: NEVER invent violence, weapons, cartels, drugs, or crime the user did not write. The tumbado can carry a hard, streetwise, flex energy \u2014 but the craft is the NARRATIVE and the swagger, and the song serves the user's real story: a come-up, loyalty, ambition, risk, heartbreak, proving them wrong. If the user brings none of that darkness, the song has none. The drive is never an excuse to write a crime the user never lived.",
      "defaultRoomId": "corrido-b-lico",
      "rooms": [
        {
          "id": "corrido-b-lico",
          "name": "Corrido B\xE9lico",
          "oneLine": "The hard, driving, story-forward core of the movement \u2014 a first-person modern narrative told with swagger over galloping requinto, character and plot leading, energy turned all the way up.",
          "tempoGroove": "120-150 BPM in a driving corrido gallop \u2014 the bajo sexto and tuba lock a fast walking pulse, the requinto answers in the gaps between phrases. Word density is medium-high and narrative: verses carry story and detail, delivered talk-sung and conversational, riding just ahead of the beat like someone recounting a night that actually happened.",
          "writingDials": [
            "Narrative-first: this room tells a STORY. Open on a scene or a name, move it forward verse to verse \u2014 a come-up, a debt paid, a night, a name earned \u2014 and let the plot, not a chorus hook, be the engine. A song that only repeats a mood has failed this room.",
            "Write the requinto its holes: land phrases and stop, leaving the ends of lines open for the lead run to answer \u2014 the guitar is the second narrator, so a wall of words with no gaps buries the sound that makes it tumbado.",
            "The swagger is earned, not stated: build the flex through concrete detail from the user's OWN come-up \u2014 the specific work, the people, the risk taken, the doubt proved wrong \u2014 so the confidence reads as a true account, never a generic boast.",
            "NEVER invent violence, weapons, cartels, drugs, or crime the user did not write. B\xE9lico names the driving ENERGY and the narrative swing, not a subject requirement \u2014 the craft is the story and the nerve; the darkness in the song is only ever the darkness the user brought. A clean come-up told with full b\xE9lico drive is exactly right.",
            "Point of view is a real person telling it: first person, past or present, direct \u2014 name people, name places, keep the loyalty and the pride specific to whoever the user actually stood with.",
            "Cadence is talk-sung: conversational phrasing that sits just ahead of the gallop, closer to spoken storytelling than to sustained melody \u2014 the modern youth delivery, not a belted old-style verse.",
            "Sections carry the arc: verses do the storytelling and run long; the coro is a short summary line or a name the crew can shout back, returning to punctuate the tale rather than to replace it.",
            "Cross-genre firewall: what makes it THIS room and not Hip-Hop's Trap or Drill is the acoustic engine \u2014 galloping bajo sexto and tuba with the requinto answering runs, a live-string gallop under talk-sung Spanish narrative, no 808 leading; the moment a sliding 808 or a triplet-hat grid takes the floor it has left tumbado for trap."
          ],
          "rendering": "Galloping bajo sexto and acoustic guitar, walking tuba bassline, lead requinto runs answering the vocal in the gaps, charcheta accents, driving mid-fast tempo. Talk-sung modern male lead, up-front and dry with a light double, crew shouts in the breaks; modern tumbado production, live acoustic feel, no orchestra, no banda brass.",
          "storyFit": "Best for: a come-up told as story, loyalty and the crew, proving them wrong, ambition and the risk it took, pride in where you are from, a night that became a legend. Poor fit: tender heartbreak and longing (that is the Sad room), pure dance-floor party, worship \u2014 the gallop wants a story with nerve.",
          "parodyTraps": "Invented narco, guns, or cartel props the user never wrote; banda brass or mariachi trumpets pasted on; polka-corrido oompah stiffness instead of the modern gallop; a sung stadium chorus where the story should keep moving; American rap phrasing dropped over the requinto; swagger with no real detail under it.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Spoken] [Instrumental Break] [Shout] [Groove]. This room performs like a storyteller with his crew behind him \u2014 the lead talk-sings the tale and the crew answers, and the pl\xE1tica comes first: a short spoken crew intro, a few hyped words traded before the requinto kicks in, is the signature opening of the style. Signature: the crew grito \u2014 a sharp shouted burst of hype from the crew punctuating the end of a hard line or the top of a section, landing in the gaps the phrasing leaves. Placement: the spoken crew intro opens the record before the first requinto run; gritos and short crew shouts land on the coro and at the ends of the boldest verse lines; an [Instrumental Break] gives the requinto a run of its own between verses. Tag identity: a lead narrator and his crew \u2014 a spoken pl\xE1tica intro, sharp crew shouts and gritos on the hard lines, the requinto answering as a second voice. All shouts are pure energy directed in plain English \u2014 hype, sharpness, a burst of pride \u2014 never phonetic spelling and never an invented accent.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Spoken]",
              "[Instrumental Break]",
              "[Shout]",
              "[Groove]"
            ]
          },
          "builder": {
            "instruments": [
              "guitarra requinto",
              "bajo sexto",
              "tuba",
              "charcheta",
              "guitarra ac\xFAstica"
            ],
            "themes": [
              "La lucha y el ascenso",
              "Lealtad y el clan",
              "Orgullo del barrio",
              "Adrenalina y riesgo"
            ],
            "purposes": [
              "Contar una historia",
              "Honrar a los leales",
              "Motivar al que lucha",
              "Recordar de d\xF3nde vengo"
            ]
          }
        },
        {
          "id": "corrido-sad",
          "name": "Corrido Sad",
          "oneLine": "The melancholic sierre\xF1o heart of the movement \u2014 corrido sad, tumbado rom\xE1ntico \u2014 heartbreak, longing, and the quiet ache told over soft requinto, the huge modern crossover lane where the swagger drops and the feeling leads.",
          "tempoGroove": "75-105 BPM, a slower sierre\xF1o sway \u2014 bajo sexto and light acoustic guitar breathe under a requinto that cries the melodic lead, tuba soft or resting. Word density is low-to-medium: fewer words, more air, phrases that end on held vowels so the voice and the requinto can ache into the gaps.",
          "writingDials": [
            "Feeling leads, story stays intimate: this is the ache, not the flex. Keep the world small \u2014 one person, one loss, one memory \u2014 and let the hurt, the missing, the pride that still stings carry the song instead of a plot.",
            "Write the requinto room to cry: end the feeling-lines on open vowels and leave the bar's tail empty, because the lead run answers the voice like a second person grieving \u2014 a crowded line gives the guitar nothing to say.",
            "The confession is direct and unguarded: first person to a you who is gone or slipping away, plain and honest \u2014 the modern sad-corrido voice admits the wound flatly, more spoken-tender than belted.",
            "Pride and heartbreak share one breath: the movement's sadness is proud \u2014 missing someone while refusing to beg, hurting while still standing tall. Let the ache and the swagger coexist; do not sand the song into pure sweetness or pure self-pity.",
            "NEVER invent violence, drugs, cartels, or crime the user did not write \u2014 and here especially, do not reach for narco melancholy or drowning-the-pain vice imagery the user never brought. If the user's loss is a breakup, a distance, a person, that is the whole of it.",
            "Keep it specific: one real detail only the two of them would know does more than any general sorrow \u2014 the actual place, the actual habit, the actual last thing said, from the user's own story.",
            "Sections deepen the wound: verses move the ache forward \u2014 a memory, an admission, a question left hanging \u2014 and the coro is a short aching line that returns heavier each time; the requinto often takes a whole passage where the words stop.",
            "Cross-genre firewall: what makes it THIS room and not the piano-sierre\xF1o pop crossover (the corridos-con-piano wave) is the acoustic sierre\xF1o engine \u2014 a crying requinto lead and bajo sexto with the tumba-tumba sway, talk-tender modern phrasing, no piano-and-strings ballad bed and no belted power chorus; swap the requinto for a grand piano build and it has left tumbado for the crossover lane."
          ],
          "rendering": "Soft requinto crying the lead melody, gentle bajo sexto and acoustic guitar, tuba soft or absent, slower sierre\xF1o sway, spacious and intimate. Tender talk-sung modern male lead, close-mic and dry with light doubles, minimal treatment; modern tumbado sierre\xF1o feel, no orchestra, no strings, no banda.",
          "storyFit": "Best for: heartbreak, longing, missing someone, an unspoken apology, love that ended, distance, the proud ache of being left. Poor fit: party anthems, hard flex boasts, driving action stories \u2014 the sway has no hurry and the flex would break the ache.",
          "parodyTraps": "Adding narco or vice melancholy the user never wrote; swapping the requinto for a piano ballad or power-ballad strings; belting a huge stadium chorus where a tender admission belongs; greeting-card sorrow with no specific person in it; mariachi trumpets crying instead of the requinto; self-pity with no pride left in it.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Soft] [Instrumental Break] [Harmonies] [Spoken]. This room performs close and wounded \u2014 one tender lead with the requinto grieving beside him and almost no one else in the room. Signature: the requinto answer \u2014 the lead lands an aching line and the guitar cries a run back into the gap the phrasing left, the instrument carrying the second half of the feeling like a friend who says nothing but stays. Placement: the requinto answer lives at the ends of the feeling-lines and takes a whole [Instrumental Break] where the words stop; the sparse floor of 2 sits where the ache peaks \u2014 a soft harmony ghosting the coro's last words, one low spoken aside where the guard drops. Tag identity: an intimate lead and a crying requinto \u2014 a soft self-harmony echoing the hurt, one quiet spoken confession, the guitar as the grieving second voice. Any spoken or sung direction is tenderness and ache in plain English \u2014 never phonetic spelling, never an added accent.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Soft]",
              "[Instrumental Break]",
              "[Harmonies]",
              "[Spoken]"
            ]
          },
          "builder": {
            "instruments": [
              "guitarra requinto",
              "bajo sexto",
              "guitarra ac\xFAstica",
              "tuba"
            ],
            "themes": [
              "Traici\xF3n",
              "La vida en la calle",
              "Orgullo del barrio"
            ],
            "purposes": [
              "Contar una historia",
              "Recordar de d\xF3nde vengo",
              "Motivar al que lucha"
            ]
          }
        },
        {
          "id": "tumbado-flex",
          "name": "Tumbado Flex",
          "oneLine": "The 808-tinged, boastful come-up lane \u2014 trap phrasing fused onto the requinto, youth cadence and swagger up front, the flex of having made it out told cold and confident.",
          "tempoGroove": "130-160 BPM felt in a half-time bounce \u2014 a subtle 808 shadows the tuba, bajo sexto and requinto keep the tumbado core, and the pocket bounces like trap while the strings stay live. Word density is medium and bursty: short punchy phrases with swagger, then air where the ad-libs and the requinto answer.",
          "writingDials": [
            "Flex leads, told cold: this room boasts the come-up \u2014 money made, doubt proved wrong, the block that raised you \u2014 stated flat and confident as fact, never explained. The moment a flex gets justified it dies.",
            "Write in bursts, leave the gaps: land a short hard phrase and stop, because the gap is where the ad-lib or the requinto run answers \u2014 filling every bar breaks the bounce and buries the guitar at once.",
            "Keep the tumbado engine under the trap: the requinto still answers and the bajo sexto still walks \u2014 the 808 is a shadow, not the whole floor. If the acoustic drops out entirely it is Latin trap, not tumbado flex.",
            "The detail is the user's OWN: swagger only lands when the car, the work, the win, the name are real and specific \u2014 generic luxury inventory is how two users end up with the same song, which is failure.",
            "NEVER invent narco, weapons, cartels, drugs, or crime the user did not write \u2014 this room's hard edge is the flex of a come-up and the cold confidence of proving them wrong, not a crime r\xE9sum\xE9. A clean flex told with full swagger is exactly the room; imported darkness is parody and worse.",
            "Cadence is modern and talk-sung: youth flow riding just off the beat, closer to a confident spoken flex than to melody, with a coro that stays the simplest chant in the song.",
            "Sections lean on the hook: verses drop bursts of flex and detail, the coro is a short chant the crew shouts back and returns often \u2014 momentum comes from the hook coming back, not from a build.",
            "Cross-genre firewall: what makes it THIS room and not Hip-Hop's Trap or Latin Trap is that the requinto and bajo sexto still lead \u2014 the 808 is subtle and acoustic strings carry the melody in Spanish tumbado phrasing; kill the requinto and let the 808 and hats run the whole beat and it has crossed fully into trap, out of the movement."
          ],
          "rendering": "Requinto runs and walking bajo sexto over a subtle 808 sub shadowing the tuba, half-time bounce, sparse and hard, charcheta accents. Modern talk-sung male lead, dry and up-front with a stacked ad-lib track echoing key words; modern tumbado-trap fusion, live acoustic strings kept present, 808 felt but never dominant.",
          "storyFit": "Best for: the come-up flexed, money and ambition, proving them wrong, pride in the block, a glow-up stated cold, hyping the grind. Poor fit: tender heartbreak (the Sad room), long narrative storytelling (the burst flow chops a story up), worship \u2014 the bounce wants confidence, not plot or ache.",
          "parodyTraps": "Inventing narco, guns, or drug content the user never wrote \u2014 the number-one tell; letting the 808 and hats fully replace the requinto until it is just Latin trap; brand-name shopping-list flexes with no real detail; writing ad-libs into every line like punctuation; forcing triplets onto every bar; confusing loud with confident \u2014 real flex is cold and economical.",
          "performance": {
            "prose": "Density heavy; min adlibs 4; delivery tags [Spoken] [Ad-Lib Section] [Drop] [Shout]. This room performs as a lead and his own hype behind him, with the crew close by \u2014 the pl\xE1tica still opens it, a short spoken intro traded before the requinto and the 808 drop in. Signature: the punctuation ad-lib \u2014 a burst lands and in the gap the second track answers with an echo of the key word or a sharp hype burst, cold and exact, never stepping on the next phrase. Placement: the spoken intro opens the record; ad-libs live in the gaps the bursts leave and thicken under the coro's returns; crew gritos punctuate the hardest lines and the hook, and a [Drop] can frame the coro's arrival. Tag identity: the lead and his own second self plus the crew \u2014 an echo of the key word after bursts, sharp hype gritos on the flex lines, a doubled chant coro. Every ad-lib and shout is energy and swagger in plain English \u2014 a burst of hype, a hard echo \u2014 never phonetic spelling and never an invented accent.",
            "adlibDensity": "heavy",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Spoken]",
              "[Ad-Lib Section]",
              "[Drop]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "guitarra requinto",
              "bajo sexto",
              "808 sutil",
              "tuba",
              "charcheta"
            ],
            "themes": [
              "Dinero y lujos",
              "La lucha y el ascenso",
              "Orgullo del barrio",
              "La vida en la calle"
            ],
            "purposes": [
              "Presumir el logro",
              "Motivar al que lucha",
              "Recordar de d\xF3nde vengo",
              "Encender la fiesta"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "corrido tumbado",
          "strength": "strong",
          "roomId": "corrido-b-lico"
        },
        {
          "cue": "corrido",
          "strength": "strong",
          "roomId": "corrido-b-lico"
        },
        {
          "cue": "la lucha y el ascenso",
          "strength": "strong",
          "roomId": "corrido-b-lico"
        },
        {
          "cue": "el ascenso",
          "strength": "weak",
          "roomId": "corrido-b-lico"
        },
        {
          "cue": "lealtad",
          "strength": "weak",
          "roomId": "corrido-b-lico"
        },
        {
          "cue": "el clan",
          "strength": "weak",
          "roomId": "corrido-b-lico"
        },
        {
          "cue": "orgullo del barrio",
          "strength": "weak",
          "roomId": "corrido-b-lico"
        },
        {
          "cue": "de d\xF3nde vengo",
          "strength": "weak",
          "roomId": "corrido-b-lico"
        },
        {
          "cue": "proving them wrong",
          "strength": "weak",
          "roomId": "corrido-b-lico"
        },
        {
          "cue": "la historia",
          "strength": "weak",
          "roomId": "corrido-b-lico"
        },
        {
          "cue": "corrido sad",
          "strength": "strong",
          "roomId": "corrido-sad"
        },
        {
          "cue": "tumbado rom\xE1ntico",
          "strength": "strong",
          "roomId": "corrido-sad"
        },
        {
          "cue": "desamor",
          "strength": "strong",
          "roomId": "corrido-sad"
        },
        {
          "cue": "heartbreak",
          "strength": "weak",
          "roomId": "corrido-sad"
        },
        {
          "cue": "la extra\xF1o",
          "strength": "weak",
          "roomId": "corrido-sad"
        },
        {
          "cue": "lo extra\xF1o",
          "strength": "weak",
          "roomId": "corrido-sad"
        },
        {
          "cue": "traici\xF3n",
          "strength": "weak",
          "roomId": "corrido-sad"
        },
        {
          "cue": "longing",
          "strength": "weak",
          "roomId": "corrido-sad"
        },
        {
          "cue": "missing someone",
          "strength": "weak",
          "roomId": "corrido-sad"
        },
        {
          "cue": "tumbado flex",
          "strength": "strong",
          "roomId": "tumbado-flex"
        },
        {
          "cue": "trap corrido",
          "strength": "strong",
          "roomId": "tumbado-flex"
        },
        {
          "cue": "presumir el logro",
          "strength": "strong",
          "roomId": "tumbado-flex"
        },
        {
          "cue": "dinero y lujos",
          "strength": "weak",
          "roomId": "tumbado-flex"
        },
        {
          "cue": "flex",
          "strength": "weak",
          "roomId": "tumbado-flex"
        },
        {
          "cue": "el logro",
          "strength": "weak",
          "roomId": "tumbado-flex"
        },
        {
          "cue": "la ambici\xF3n",
          "strength": "weak",
          "roomId": "tumbado-flex"
        },
        {
          "cue": "glow-up",
          "strength": "weak",
          "roomId": "tumbado-flex"
        },
        {
          "cue": "808",
          "strength": "weak",
          "roomId": "tumbado-flex"
        }
      ]
    },
    "cumbia": {
      "id": "cumbia",
      "name": "Cumbia",
      "aliases": [
        "cumbia music",
        "cumbia colombiana",
        "cumbia sonidera",
        "cumbia norte\xF1a",
        "cumbia nortena"
      ],
      "profileText": "A cumbia writer starts with the clip-clop and the scrape. The groove is a mid-tempo two-step that no room ever rushes \u2014 the guacharaca or g\xFCira scraping the offbeat, the drums knocking a swaying pulse hips move to before minds do \u2014 and above it a melodic instrument answers the singer at the ends of phrases. So the writing job is spatial before it is verbal: lines end early and leave the pocket open so the accordion or the keyboard riff can reply in the gap and take the turnarounds, and a sheet packed wall-to-wall has smothered the instrument that colors the genre before its first word is judged. The writer plans where the words are NOT, because that space belongs to the answering instrument and the sway. And the tempo stays mid \u2014 a cumbia is danceable and unhurried; speed it into a burst or crowd out its air and the clip-clop that names the genre is gone.\n\nThe rooms bend all of this, and choosing the room is choosing the pocket and who the song faces. Cumbia Colombiana is the earthy root \u2014 accordion and guacharaca over the classic clip-clop, the gaita crying in the turnarounds, a village-fiesta groove sung warm and communal to a whole dancing circle. Cumbia Sonidera pulls the tempo down heavy and hypnotic, sometimes into the outright rebajada drag, keyboard-led and low, a barrio and its sound-system night where a dedication gets shouted over the slow sway. Cumbia Tropical / Pop keeps it bright, upright, and radio-clean, a polished keyboard-and-brass sheen carrying one hooky chorus a wide crowd can lift at once. Same clip-clop, same scrape; different pocket, different melody-lead, different distance to the listener \u2014 an earthy circle, a slow low barrio, or a bright wide crowd.\n\nThe law above every dial is language. Spanish is the song's native tongue here \u2014 the lyrics are written in Spanish by a later layer \u2014 but the writer works in plain English craft instruction and never invents slang, endearments, or accent flavor to costume the song; only words the user wrote survive, and the identity is carried by rhythm, pocket, and the answering instrument, never by sprinkled vocabulary. And the two neighbors are not cumbia: vallenato is a wordy narrative SONG-form on caja and accordion \u2014 a danceable communal sway is not that \u2014 and salsa runs on the clave with a piano montuno and a brass mambo, which cumbia never has. The postcard is not cumbia either: beaches, palm trees, sombreros, and generic tropical-party scenery are the tourist parody the founder rejects; the user's own pueblo, block, name, and night are the song.",
      "defaultRoomId": "cumbia-colombiana",
      "rooms": [
        {
          "id": "cumbia-colombiana",
          "name": "Cumbia Colombiana",
          "oneLine": "The earthy Colombian root \u2014 accordion and guacharaca over the classic clip-clop, the gaita cry in its bones, a village-fiesta groove that sways a whole circle.",
          "tempoGroove": "90-110 BPM in the signature cumbia clip-clop \u2014 a mid-tempo two-step no faster, the guacharaca scraping steady offbeats and the tambora and llamador knocking the swaying pulse while the accordion breathes on top. Medium word density: singable phrases with real air after them, because the accordion answers the voice at line-ends and the groove needs room to sway, never wall-to-wall.",
          "writingDials": [
            "The accordion is the second voice: end phrases early and leave the line hanging so the accordion can answer in the gap and take whole turnarounds between verses \u2014 a sheet that fills every bar smothers the instrument that colors the genre.",
            "Write it earthy and communal on the user's real story: cumbia colombiana is a pueblo dancing in a circle, so the chorus opens outward for a crowd to lift while the verses keep the specific names, places, and details the user brought.",
            "The hook is a chantable communal refrain of roughly three to six words, easy to sing back on the second pass and sturdy enough to return many times \u2014 the pueblo's line on the night, not a clever turn.",
            "Rhyme plain and sturdy: clean end-rhyme the circle hears coming beats a slant-rhyme subtlety, landing square with the sway so the singalong stays effortless.",
            "Keep the language plainspoken and warm \u2014 everyday words, a true image over ornament; the joy or the ache rides the groove, and a plain line the whole floor can carry outranks a pretty one.",
            "Registers are fiesta joy, simple love, hometown pride, and the everyday: a village celebration, a plain devoted love, a pride of the barrio, a scene of ordinary life \u2014 delivered warm and danceable even when the feeling turns wistful.",
            "Plan the accordion turnaround as a written space: mark the stretch between verses where the words stop and the accordion and gaita carry the sway \u2014 the lyric is built around that instrumental cry, not over it.",
            "Cross-genre firewall: the mid-tempo clip-clop with the guacharaca scrape and the accordion answering is what makes it cumbia, not vallenato \u2014 vallenato is a story SONG-form driven hard on the caja and accordion, wordier and narrative; this room stays a danceable communal sway, feeling over saga, air over words."
          ],
          "rendering": "Accordion leading the melody and answering every vocal line, guacharaca scraping steady offbeats, tambora and llamador knocking the clip-clop, a gaita or ca\xF1a de millo cry threading the turnarounds, upright-toned bass walking the sway, congas warm underneath. Warm communal lead vocal, often a two-voice harmony on the chorus; live earthy Colombian mix, cantina-and-plaza feel, no synths, no gloss.",
          "storyFit": "Best for: village celebration and fiesta, plain devoted love, hometown and barrio pride, everyday life, a warm wistful ache that still dances. Poor fit: a slow smoky sound-system crawl with a synth hook \u2014 that is Sonidera; a glossy wide-radio singalong \u2014 that is Tropical / Pop; anything wanting club polish or a rebajada drag, which this earthy room has no register for.",
          "parodyTraps": "Fake Colombian slang or accent spelling the user never wrote; sombrero-and-palm-tree postcard scenery standing in for a real story; a wall-to-wall lyric that leaves the accordion no gap to answer; polishing the earthy live sound into synth gloss; a hook made clever instead of chantable; dragging the clip-clop into a slow crawl it does not belong in.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Instrumental Break] [Harmonies] [Shout] [Call and Response]. This room performs like a small live band and a dancing circle \u2014 one warm lead, a second harmony voice on the chorus, and the accordion as the answering instrument, with the players throwing an occasional joyful shout. Signature: the accordion answer and turnaround \u2014 the squeezebox echoes the vocal at line-ends and takes the instrumental break alone, the gaita crying under it, and a joyful shout from the players tops a big line or kicks off the break. Placement: the harmony voice comes in on the chorus and the emotional peaks; the accordion fills the gaps at line-ends and owns the [Instrumental Break]; a joyful shout marks the turn into the break or the last chorus, and the circle can answer the hook back on its returns. Tag identity: a lead and a harmony partner over an answering accordion \u2014 a second voice on the hook, the accordion and gaita singing in the holes, a joyful shout thrown by the players as release. Any shout is plain-English energy, never a scripted foreign exclamation the user did not bring, and every sung word is from the user's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Harmonies]",
              "[Shout]",
              "[Call and Response]"
            ]
          },
          "builder": {
            "instruments": [
              "acorde\xF3n",
              "guacharaca",
              "congas",
              "timbal",
              "bajo",
              "guitarra"
            ],
            "themes": [
              "El baile y la fiesta del pueblo",
              "Amor sencillo",
              "Alegr\xEDa popular",
              "Orgullo del barrio",
              "La vida cotidiana"
            ],
            "purposes": [
              "Bailar en la fiesta",
              "Alegrar la reuni\xF3n",
              "Prender el bailongo"
            ]
          }
        },
        {
          "id": "cumbia-sonidera",
          "name": "Cumbia Sonidera / Rebajada",
          "oneLine": "The Mexican sound-system lane \u2014 keyboard-led and pulled slow into the hypnotic rebajada drag, dedications shouted over a low heavy sway in a barrio dancehall.",
          "tempoGroove": "95-112 BPM in a heavy, hypnotic keyboard-led clip-clop \u2014 the base sonidera groove sits mid-tempo, not slow, and the sonidero can then drag the playback down into the rebajada, a woozy pitched-down ~70-85 BPM crawl (a turntable slow-down effect on the record itself, never the song's native tempo) \u2014 the guacharaca scraping the offbeat over a deep low end and a keyboard riff hooking on top. Medium-low word density: lines sit back in the slow pocket and leave real space, because the keyboard riff carries between them and the sway is unhurried.",
          "writingDials": [
            "The keyboard riff is the hook engine: a synth organ or teclado line answers the vocal and owns the turnarounds, so write line-ends that hand off to it and plan the riff to breathe between phrases \u2014 the melody lives as much in the keys as in the voice.",
            "Sit the words back in a slow heavy pocket: the rebajada drag wants unhurried phrasing, so write lines that stretch and settle into the low sway rather than crowd it \u2014 the space and the weight are the feel, not a gap to fill.",
            "This room is a barrio and its sound-system night: write for the neighborhood dancehall \u2014 a dedication, a shout to the block, a name called into the low end \u2014 and keep the chorus a phrase the barrio re-sings over the hypnotic sway, not a wide-radio lift.",
            "Registers are barrio pride, nostalgia and migration, a love with grit, the cantina and the trago: the streetwise warmth of the sonidero world \u2014 a pride of the block, a longing for a hometown far away, a plain love, a hard night with a drink \u2014 delivered close and real.",
            "Keep the language plainspoken and rooted: everyday barrio words and one true detail carry further than ornament here, and the sincerity rides the slow groove \u2014 a real image outweighs a pretty generality.",
            "Repetition is architecture: the hook and the keyboard riff can loop and deepen the same feeling rather than add plot, but the verses still carry the user's real block, real name, real night \u2014 repetition deepens a real thing, it never invents one.",
            "Let the low end lead the mood: write to a deep, heavy, slightly woozy atmosphere, so favor lines that brood and sway over bright bouncing ones \u2014 the darkness and drag are the room, and a peppy radio cadence fights it.",
            "Cross-genre firewall: the heavy hypnotic keyboard-led sway pulled toward the rebajada drag is what makes it Sonidera, not the bright upright Tropical / Pop cumbia \u2014 Tropical is clean, fast, and radio-lifted; this room is slow, low, and sound-system rooted, the synth keys and the drag carrying it where Tropical would brighten and speed up."
          ],
          "rendering": "Keyboard-led cumbia sonidera \u2014 a synth organ or teclado tropical riff hooking over the melody and answering the vocal, g\xFCira scraping the offbeat, deep heavy bass, congas and timbal knocking a slow hypnotic clip-clop sometimes dragged into the rebajada, sparse woozy pitched atmosphere. Close warm streetwise lead vocal with a sound-system feel, room for a shouted dedication; low, heavy, hypnotic barrio-dancehall mix, the low end mixed to sway a body slow.",
          "storyFit": "Best for: barrio pride and the block, nostalgia and migration, a love with grit, the cantina and a hard night, a sound-system dedication. Poor fit: an earthy live accordion village groove \u2014 that is Colombiana; a bright glossy wide-radio singalong \u2014 that is Tropical / Pop; anything that needs speed, brightness, or a plaza-band shine, which this slow low room has no register for.",
          "parodyTraps": "Machine-faked barrio slang or accent spelling the user never wrote; postcard tropical scenery standing in for the real block; a bright peppy radio cadence fighting the heavy slow drag; burying the keyboard riff under wall-to-wall vocals; a hook too wordy or too polished for a sound-system crowd; inventing a barrio the user's story never named.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Instrumental Break] [Shout] [Drop]. This room performs like a sonidero working a slow low dancehall \u2014 one close streetwise lead over the heavy keyboard sway, the synth riff answering, and a shouted dedication stamping the night, no crowd stack. Signature: the answered dedication \u2014 the vocal line lands and the written space gets a shouted call to the block or a keyboard riff snapping back, one answer per pocket, so the record sounds like the sound-system it runs on. Placement: the keyboard riff fills the gaps at line-ends and owns the [Instrumental Break]; a shouted dedication tops the intro and the biggest turns; the low end can drop bare for a bar before the sway re-enters so the drag alone loads the weight. Tag identity: a streetwise lead and an answering keyboard, the block called in the gaps \u2014 a shouted (dedication to the barrio) stamping the turns, the synth riff snapping back in the holes, the slow low end swaying underneath. All direction stays rhythm-and-energy in plain English \u2014 sway, weight, drag \u2014 never a request for an accent or slang beyond words the user's own sheet already holds.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Shout]",
              "[Drop]"
            ]
          },
          "builder": {
            "instruments": [
              "teclado tropical",
              "g\xFCira",
              "congas",
              "timbal",
              "bajo",
              "guacharaca"
            ],
            "themes": [
              "Orgullo del barrio",
              "Nostalgia y migraci\xF3n",
              "La cantina y el trago",
              "Amor sencillo",
              "Desamor con sabor"
            ],
            "purposes": [
              "Prender el bailongo",
              "Cantar en la cantina",
              "Bailar en la fiesta",
              "Enamorar"
            ]
          }
        },
        {
          "id": "cumbia-tropical",
          "name": "Cumbia Tropical / Pop",
          "oneLine": "The bright modern radio lane \u2014 clean, upright, and hooky, keyboard and light brass over a crisp clip-clop, a cumbia built for a wide crowd to sing at once.",
          "tempoGroove": "100-120 BPM in a bright, upright, crisp clip-clop \u2014 still the mid-tempo cumbia sway, never a fast burst, the g\xFCira scraping clean offbeats over a bouncing bass and a polished keyboard-and-brass sheen. Medium word density: singable modern phrasing that lifts into the chorus, verses tidy and forward, still leaving the keyboard and brass room to answer between lines.",
          "writingDials": [
            "Write for the wide singalong: this room is radio-clean and built for a big crowd, so the chorus is the centerpiece \u2014 a bright, hooky, memorable phrase that lifts and returns, pitched so a whole room can sing it back on first hearing.",
            "Keep the keyboard and brass their answers: even in the polished production, end phrases so the clean keyboard riff or a light brass stab can reply in the gap \u2014 a bright cumbia that buries the answer under wall-to-wall vocals loses the genre's call-and-sway.",
            "Verses tidy and forward: keep the phrasing clean and modern with a clear hook setup, the verse building toward the chorus lift rather than crowding it, and one true detail from the user's story anchoring the shine.",
            "Registers are fiesta joy, simple love, popular cheer, and a danceable ache: a bright celebration, a sweet radio love, a wide-crowd cheer, or a heartbreak with sabor that still dances \u2014 delivered clean and warm, the feeling lifted rather than roughened.",
            "Rhyme clean and satisfying: solid end-rhyme that resolves sweetly and lands the hook, so the singalong stays easy and the chorus sticks on the first pass.",
            "Mind the bright bounce: this lane trades the earthy grit for polish, so write to an upright, crisp, celebratory feel with an open easy melody \u2014 the brightness is the room, and a heavy woozy drag belongs to Sonidera, not here.",
            "Cross-genre firewall: the bright clean upright clip-clop with the polished keyboard-and-brass sheen is what makes it Tropical / Pop, not salsa \u2014 this room has no clave, no piano montuno, no brass mambo, just the cumbia sway and a bright radio hook, and if a montuno or a horn mambo takes over, the room is gone."
          ],
          "rendering": "Clean bright cumbia pop \u2014 polished keyboard tropical riff and light brass stabs answering the vocal, g\xFCira scraping crisp offbeats, bouncing rounded bass, congas and timbal driving an upright clip-clop, a modern radio sheen with air and lift. Warm clear lead vocal with tidy harmonies on the chorus and a bright singalong lift; contemporary tropical-pop mix, crisp and celebratory, the hook mixed to carry a wide crowd.",
          "storyFit": "Best for: a bright celebration or fiesta, a sweet radio love, wide-crowd cheer, a danceable heartbreak with sabor, an upbeat singalong. Poor fit: an earthy live accordion village groove \u2014 that is Colombiana; a slow heavy sound-system crawl \u2014 that is Sonidera; anything wanting a smoky rebajada drag or a raw campo grit, which this bright polished room has no register for.",
          "parodyTraps": "Sprinkled Spanish phrases the user never wrote; beach-and-cocktail postcard scenery instead of the user's real details; a montuno or a brass mambo section pulling it toward salsa; burying the keyboard and brass answers under nonstop vocals; a hook too busy for a wide crowd to catch on first hearing.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Instrumental Break] [Harmonies] [Call and Response] [Shout]. This room performs like a polished modern band lifting a wide crowd \u2014 one clear bright lead, tidy harmonies on the chorus, and the keyboard-and-brass answering, with the crowd invited to sing the hook back. Signature: the bright answer and lift \u2014 the clean keyboard riff or a light brass stab replies to the sung line in the gap, and the crowd lifts the hook on its returns, the chorus opening wider each pass. Placement: harmony voices thicken the chorus and the peaks; the keyboard and brass fill the gaps at line-ends and own the [Instrumental Break]; a joyful shout tops the biggest turn and the crowd answers the hook back. Tag identity: a bright lead and its harmonies over an answering keyboard-and-brass \u2014 tidy doubles on the chorus, the riff and stabs replying in the holes, a joyful shout thrown as release and the crowd lifting the hook. Any shout is plain-English energy, never a scripted foreign exclamation the user did not write, and every sung word is from the user's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Harmonies]",
              "[Call and Response]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "teclado tropical",
              "g\xFCira",
              "congas",
              "timbal",
              "bajo",
              "acorde\xF3n"
            ],
            "themes": [
              "El baile y la fiesta del pueblo",
              "Amor sencillo",
              "Alegr\xEDa popular",
              "Desamor con sabor",
              "La vida cotidiana"
            ],
            "purposes": [
              "Bailar en la fiesta",
              "Alegrar la reuni\xF3n",
              "Enamorar",
              "Prender el bailongo"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "cumbia colombiana",
          "strength": "strong",
          "roomId": "cumbia-colombiana"
        },
        {
          "cue": "acorde\xF3n",
          "strength": "strong",
          "roomId": "cumbia-colombiana"
        },
        {
          "cue": "guacharaca",
          "strength": "strong",
          "roomId": "cumbia-colombiana"
        },
        {
          "cue": "gaita",
          "strength": "strong",
          "roomId": "cumbia-colombiana"
        },
        {
          "cue": "fiesta del pueblo",
          "strength": "weak",
          "roomId": "cumbia-colombiana"
        },
        {
          "cue": "baile",
          "strength": "weak",
          "roomId": "cumbia-colombiana"
        },
        {
          "cue": "amor sencillo",
          "strength": "weak",
          "roomId": "cumbia-colombiana"
        },
        {
          "cue": "village",
          "strength": "weak",
          "roomId": "cumbia-colombiana"
        },
        {
          "cue": "folk",
          "strength": "weak",
          "roomId": "cumbia-colombiana"
        },
        {
          "cue": "sonidera",
          "strength": "strong",
          "roomId": "cumbia-sonidera"
        },
        {
          "cue": "sonidero",
          "strength": "strong",
          "roomId": "cumbia-sonidera"
        },
        {
          "cue": "rebajada",
          "strength": "strong",
          "roomId": "cumbia-sonidera"
        },
        {
          "cue": "cumbia mexicana",
          "strength": "strong",
          "roomId": "cumbia-sonidera"
        },
        {
          "cue": "barrio",
          "strength": "weak",
          "roomId": "cumbia-sonidera"
        },
        {
          "cue": "nostalgia",
          "strength": "weak",
          "roomId": "cumbia-sonidera"
        },
        {
          "cue": "migraci\xF3n",
          "strength": "weak",
          "roomId": "cumbia-sonidera"
        },
        {
          "cue": "dedication",
          "strength": "weak",
          "roomId": "cumbia-sonidera"
        },
        {
          "cue": "sound system",
          "strength": "weak",
          "roomId": "cumbia-sonidera"
        },
        {
          "cue": "cumbia pop",
          "strength": "strong",
          "roomId": "cumbia-tropical"
        },
        {
          "cue": "cumbia tropical",
          "strength": "strong",
          "roomId": "cumbia-tropical"
        },
        {
          "cue": "radio cumbia",
          "strength": "strong",
          "roomId": "cumbia-tropical"
        },
        {
          "cue": "alegr\xEDa",
          "strength": "weak",
          "roomId": "cumbia-tropical"
        },
        {
          "cue": "singalong",
          "strength": "weak",
          "roomId": "cumbia-tropical"
        },
        {
          "cue": "crossover",
          "strength": "weak",
          "roomId": "cumbia-tropical"
        },
        {
          "cue": "upbeat",
          "strength": "weak",
          "roomId": "cumbia-tropical"
        }
      ]
    },
    "merengue": {
      "id": "merengue",
      "name": "Merengue",
      "aliases": [
        "merengue music",
        "merengue tipico",
        "merengue t\xEDpico",
        "perico ripiao"
      ],
      "profileText": "A merengue writer starts with the two-beat \u2014 the fast, relentless maco pulse the tambora and g\xFCira drive, felt in a hard 2 that never lets up. Everything is written to sit inside that gallop: scan each line against the two-beat, land the stressed syllables on the pulse, and keep the phrasing quick and buoyant, because merengue is body-first party music before it is anything else. The tempo is high, so the words must be sturdy and singable at speed \u2014 a line that reads clever but blurs when the tambora is flying has already failed. And merengue is joy in motion even when the story is sad: heartbreak here is danced through, shrugged off, thrown back with a wink, never wallowed in. A merengue that stops the floor to brood has left the genre.\n\nThe song is built around the jaleo \u2014 the open call section where the instruments take over and the singer works the crowd. This is the payoff every merengue drives toward: the verses set it up, and the jaleo lets the accordion, the sax section, or the beat-and-crowd break loose while the singer fires short repeatable calls over the top. The writer plans both halves on purpose \u2014 verses tight and specific, then a jaleo whose calls are simple enough to shout back and ride on every return. Leave the instruments their holes: end phrases a hair early so the accordion can answer, the horns can punch, or the hook can detonate. A merengue packed wall-to-wall, with no gap for the answer, has smothered the thing that makes it swing.\n\nThe rooms bend all of this. Perico ripiao writes quick, dense, mischievous picard\xEDa from the campo, trading with the accordion and a raspy sax. Merengue de orquesta writes cleaner belted phrases for a ballroom, spaced for an arranged saxophone-and-brass jaleo. Merengue de calle writes the shortest, hardest chants over a programmed tambora, cold and present-tense, the crowd itself as the answer. The law above every dial is the same as everywhere: Spanish is the song's language, but slang, accent spellings, and island or street costume appear only if the user wrote them. Delivery is directed as rhythm and energy in plain English \u2014 gallop, punch, swagger \u2014 never as an accent, and the user's own people, places, and wins always outrank any stock tropical scenery. The picard\xEDa is a wink built from their situation, never a crude template pasted on.",
      "defaultRoomId": "perico-ripiao",
      "rooms": [
        {
          "id": "perico-ripiao",
          "name": "Perico Ripiao / Merengue T\xEDpico",
          "oneLine": "The rootsy campo sound of the Cibao \u2014 accordion, tambora, and g\xFCira running hot and fast, a mischievous singer trading with the box and the sax over a relentless two-beat.",
          "tempoGroove": "~145-175 BPM felt in a hard driving 2 (the maco end runs hottest \u2014 a merengue t\xEDpico can gallop; the apambichao is the slower, syncopated lilt the same band drops into, never the fast end), the tambora locking the two-beat and the g\xFCira scraping constant sixteenths under it. High word density: quick, dense, playful phrases that ride the gallop, but leaving line-end gaps for the accordion to answer and the sax to rasp back \u2014 never wall-to-wall.",
          "writingDials": [
            "Ride the gallop dense but leave the accordion its turn: pack the verse with quick playful syllables that lock to the two-beat, then end phrases a hair early so the accordion can fire its answering riff \u2014 a sheet that fills every beat silences the box that defines the room.",
            "Write picard\xEDa, not innuendo pasted on: the campo register is sly, teasing, double-meaning wit \u2014 a wink the fiesta already knows how to read \u2014 built from the user's own situation, never a stock naughty template.",
            "Build toward the jaleo as the payoff: plan the open section where the accordion and sax trade hot and the singer works short calls over them \u2014 keep the calls simple and repeatable so the crowd rides each return.",
            "Keep the hook a quick chantable phrase of roughly three to six words, re-sung faster and looser each pass, gathering mischief rather than resolving \u2014 if a fiesta could not shout it back mid-gallop, it is pitched wrong.",
            "Rhyme plain, fast, and sturdy: easy perfect rhyme and a repeated key word land square on the two-beat and survive the speed; clever slant-rhyme blurs at this tempo.",
            "Stay concrete to the user's campo or barrio life \u2014 the real town, the real name, the real dance \u2014 never generic tropical postcard scenery.",
            "The saxophone rasp is a second wisecrack: leave it room to answer a punchline, so write phrase-ends open enough for the sax to bark back after the joke lands.",
            "Cross-genre firewall: the accordion trading with tambora and g\xFCira over a galloping two-beat makes it t\xEDpico, not norte\xF1o or vallenato \u2014 there is no bajo sexto two-step and no cumbia lilt under it; the pulse is the fast Dominican maco, and if the accordion answer and the scraper vanish the room is gone."
          ],
          "rendering": "Diatonic button accordion leading and answering in fast riffs, tambora driving the two-beat with sharp rim-and-head hits, g\xFCira scraping constant sixteenths, marimba or upright-toned bass walking under it, a raspy saxophone barking responses, building into an accordion-and-sax jaleo. Bright agile lead vocal, playful and forward, small group answers on the hook; live hot Cibao t\xEDpico mix, no gloss, no synths.",
          "storyFit": "Best for: a fast fiesta, campo pride, sly flirtation and double-meaning teasing, dancing till dawn, hometown swagger, heartbreak shrugged off with a joke. Poor fit: a polished ballroom romance that wants a horn section (that is orquesta), cold street-hard swagger over programmed drums (that is calle), or anything solemn and still \u2014 the gallop has no patience for it.",
          "parodyTraps": "Machine-written Dominican slang or accent spelling the user never wrote; generic tropical-postcard scenery standing in for the real campo detail; a wall-to-wall lyric that leaves the accordion and sax nothing to answer; forcing clever rhymes that blur at the tempo; picard\xEDa turned crude and explicit where the room wants the sly wink.",
          "performance": {
            "prose": "Density heavy; min adlibs 6; delivery tags [Call and Response] [Instrumental Break] [Harmonies] [Shout]. This room performs like a hot campo trio working a packed patio \u2014 one agile lead, the accordion as the answering wisecrack, and a small group snapping the hook back, the players throwing joyful gritos. Signature: the accordion-and-sax answer \u2014 the box fires a riff into the gap the singer leaves and the sax rasps back after a punchline, so every joke lands twice, once in words and once in reeds. Placement: accordion answers fall at line-ends through the verses; an [Instrumental Break] hands the jaleo to the accordion and sax to trade; a joyful shout tops the hot turns and kicks the jaleo; small group answers snap the hook back. Tag identity: a lead and his answering accordion \u2014 the box wisecracking in the holes, the sax barking after the punchlines, a small group shouting the hook and the players throwing a joyful grito. Every shout is energy in plain English, never a scripted Dominican exclamation the user did not write.",
            "adlibDensity": "heavy",
            "minAdlibs": 6,
            "deliveryTags": [
              "[Call and Response]",
              "[Instrumental Break]",
              "[Harmonies]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "acorde\xF3n",
              "tambora",
              "g\xFCira",
              "saxof\xF3n",
              "bajo"
            ],
            "themes": [
              "Fiesta y desenfreno",
              "Picard\xEDa y doble sentido",
              "Orgullo dominicano",
              "Sabrosura",
              "Desamor con humor"
            ],
            "purposes": [
              "Bailar r\xE1pido",
              "Prender la fiesta",
              "Coquetear",
              "Re\xEDr y gozar"
            ]
          }
        },
        {
          "id": "merengue-de-orquesta",
          "name": "Merengue de Orquesta",
          "oneLine": "The gleaming 80s-and-90s big-band sound \u2014 a full sax section and brass swinging an arranged jaleo, piano and bass locked tight, a belting lead working a whole ballroom.",
          "tempoGroove": "~130-165 BPM in a driving 2, the tambora and bass locking the two-beat while the piano comps clean under a full horn section. Medium word density: cleaner, belted phrases with strong open vowels at the peaks, spaced so the saxophone jaleo and brass can punch their arranged hits between vocal lines \u2014 leave the horns their holes.",
          "writingDials": [
            "Write for the horns to answer: end vocal phrases a beat early and leave the hole where the sax section and brass throw their arranged jaleo hit \u2014 the horn response is part of the line, so a sheet that fills every beat smothers the section that defines this room.",
            "Build the saxophone jaleo as the centerpiece: plan the open section where the saxes swing their signature riff and the singer fires short calls over it \u2014 the jaleo is where an orquesta merengue peaks, so write toward it, not past it.",
            "Melody rides high and declamatory: write lines a singer belts near the top of the range with open vowels at the peaks, because the vocal is pushed out over a wall of brass, never crooned under it.",
            "Chorus is a raised toast the ballroom lifts: a short, hooky, repeatable phrase built for a whole floor to sing \u2014 if it could not carry across a packed dance hall with the horns blazing, it is pitched wrong.",
            "Register spans celebration and heartbreak-you-still-dance-to: a flat-out fiesta, hometown or national pride, a proud love, or a breakup delivered at full chest over an up-tempo groove \u2014 the feeling can be sad while the body still moves.",
            "Rhyme clean and sturdy so the crowd hears it coming: solid perfect end-rhyme landing square on the two-beat, not slant-rhyme subtlety the horns would bury.",
            "Keep the verses specific to the user's real story \u2014 the real person, place, and occasion \u2014 while the chorus opens outward for the crowd; the arrangement is big, but the details stay theirs.",
            "Cross-genre firewall: the fast two-beat tambora-and-g\xFCira groove under an arranged saxophone-and-brass jaleo makes it merengue de orquesta, not salsa \u2014 there is no clave, no piano montuno pattern, and no sonero-and-coro trade; the horns swing a jaleo over a maco two-beat, not mambo stabs over a clave."
          ],
          "rendering": "Full horn section \u2014 stacked saxophones swinging the jaleo with trumpets and trombones punching arranged hits, clean comping piano, tight electric bass locked to the two-beat, tambora driving with sharp rim-and-head hits, g\xFCira scraping steady sixteenths. Lead vocal belted high and forward with a group answering the hook; big, live, ballroom-loud brass mix, polished late-80s-through-90s orquesta sheen.",
          "storyFit": "Best for: a big celebration, a wedding or quincea\xF1era, hometown or national pride, a proud declared love, or a heartbreak sung defiant over a dancing groove. Poor fit: a rootsy accordion campo track (that is t\xEDpico), cold street swagger over programmed drums (that is calle), or a quiet still ballad the wall of brass would trample.",
          "parodyTraps": "Machine-added Dominican slang the user never wrote; sombrero-and-cocktail tropical clich\xE9s standing in for the real occasion; a thin lyric that gives the horns nothing to answer; an under-sung mumble that fights the wall of brass; cramming every beat so the jaleo cannot breathe.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Call and Response] [Brass] [Instrumental Break] [Shout]. This room performs like a full orchestra around one belting lead \u2014 the sax section and brass throw the answers and the arranged jaleo is the whole signature, a group lifting each chorus. Signature: the horn answer and the jaleo \u2014 the saxes and brass punch an arranged hit into the hole the singer leaves and swing the open jaleo section, the lead firing short calls over the top. Placement: horn responses fall at verse and chorus line-ends where the vocal steps aside; an [Instrumental Break] hands the jaleo to the sax section; a joyful shout tops the biggest turns and kicks the jaleo; group voices thicken the final choruses. Tag identity: a brass orquesta and its belting lead \u2014 the sax section swinging the jaleo and punching the gaps, a joyful shout thrown over the peaks, a group swelling the hook. Every shout is energy in plain English, never a scripted foreign exclamation the user did not bring.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Call and Response]",
              "[Brass]",
              "[Instrumental Break]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "saxof\xF3n",
              "metales",
              "piano",
              "tambora",
              "g\xFCira",
              "bajo"
            ],
            "themes": [
              "Fiesta y desenfreno",
              "Celebraci\xF3n sin parar",
              "Orgullo dominicano",
              "Amor y coqueteo",
              "Desamor con humor"
            ],
            "purposes": [
              "Prender la fiesta",
              "Bailar r\xE1pido",
              "Encender el ambiente",
              "Coquetear"
            ]
          }
        },
        {
          "id": "merengue-de-calle",
          "name": "Merengue de Calle / Urbano",
          "oneLine": "The modern street descendant \u2014 leaner, harder, and colder, a programmed tambora and synth-and-sample stack under short chanted hooks and flat, present-tense swagger.",
          "tempoGroove": "~150-180 BPM in a hard two, a programmed or heavily processed tambora hitting sharp with the g\xFCira looped tight and 808-weighted low end under it. Word density is punchy and chant-hard: the shortest lines of the three, with the widest gaps left for a hook to detonate and the crowd to snap back \u2014 punch and pause, not a dense gallop.",
          "writingDials": [
            "Write punch-and-pause for the drop: land a short hard phrase, then leave a wide gap where the hook detonates and the crowd snaps back \u2014 the gap after the punch is part of the lyric, and the room lives on that hook landing, not on filling the bar.",
            "Keep the hook a blunt chant of a few words, built to shout back on the second pass: two alternating chant lines trading back and forth make a legitimate hook here, where the t\xEDpico gallop wants a quicker denser phrase.",
            "Present tense and cocky: the song happens now, on the block or on the floor \u2014 swagger, flirtation, hustle pride stated flat and never explained; a boast that gets justified dies.",
            "Ride one rhyme sound across several short lines on purpose: hammering the same end-sound builds momentum at this tempo, where a busier scheme would blur.",
            "The jaleo becomes the beat-and-crowd break: instead of an accordion or horn trade, plan a stripped drop where the programmed tambora and the chant carry it and the crowd is the answer \u2014 write the call short enough to survive the loop.",
            "Keep the boasts and the flirtation the user's real ones \u2014 their block, their win, their line \u2014 never stock luxury or borrowed street costume.",
            "Register is edgier and colder than the older rooms: the mischief hardens into swagger, so state the claim plain and let the beat carry the attitude rather than a wink.",
            "Cross-genre firewall: the fast merengue two-beat \u2014 the programmed tambora and looped g\xFCira driving a hard maco pulse \u2014 under the chant makes it merengue de calle, not reggaet\xF3n; there is no dembow boom-ch-boom-chick, the pulse stays the fast merengue two, and if the tambora two-beat flips to dembow the room is gone."
          ],
          "rendering": "Programmed or heavily processed tambora hitting sharp and hard, g\xFCira looped tight, deep 808-weighted bass, synth stabs and vocal-chop samples, a stripped drop where the drums and chant carry it. Confident talk-sung lead riding the two-beat with hard doubled hooks and gang-style group shouts cracking on the punch words; modern urbano mix, cold and loud, club-ready.",
          "storyFit": "Best for: street swagger, present-tense flirtation, hustle and neighborhood pride, a club anthem, a hard flex or a callout. Poor fit: a rootsy accordion campo fiesta (that is t\xEDpico), a polished big-band celebration or heartbreak (that is orquesta), or any tender still ballad the cold beat would flatten.",
          "parodyTraps": "Machine-written street slang the user never wrote; borrowed luxury or gun costume pasted onto a story that never had it; flipping the tambora two-beat into a dembow so it stops being merengue; over-explaining or softening the boast; hooks with too many words for a crowd to snap back over the loop.",
          "performance": {
            "prose": "Density heavy; min adlibs 6; delivery tags [Call and Response] [Drop] [Shout] [Ad-Lib Section]. This room performs like an artist working a packed club over a hard beat \u2014 a confident lead riding the two-beat, hard doubled hooks, and gang-style group shouts as the answer, the crowd itself snapping back. Signature: the answered chant \u2014 a hard phrase lands and the written gap gets the group's short shouted snap-back or a doubled crack on the punch word, one answer per gap, so the record sounds like the floor it is for. Placement: the verses stay lead-forward and short; the shouts and hooks flood the drop, where the group answers every pass and a [Drop] header strips the track to drums and chant; hard doubles crack on the punch words. Tag identity: a lead and a snapping crew \u2014 gang-style group shouts answering the chant, doubled cracks on the punch words, two-line chant hooks traded between lead and crew. All delivery stays rhythm-and-energy language in the user's own plain words \u2014 cadence, punch, swagger \u2014 never a request for slang or accent beyond what the user wrote.",
            "adlibDensity": "heavy",
            "minAdlibs": 6,
            "deliveryTags": [
              "[Call and Response]",
              "[Drop]",
              "[Shout]",
              "[Ad-Lib Section]"
            ]
          },
          "builder": {
            "instruments": [
              "tambora",
              "g\xFCira",
              "bajo",
              "piano",
              "saxof\xF3n"
            ],
            "themes": [
              "La calle y el ambiente",
              "Fiesta y desenfreno",
              "Amor y coqueteo",
              "Orgullo dominicano",
              "Sabrosura"
            ],
            "purposes": [
              "Prender la fiesta",
              "Bailar r\xE1pido",
              "Encender el ambiente",
              "Coquetear"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "perico ripiao",
          "strength": "strong",
          "roomId": "perico-ripiao"
        },
        {
          "cue": "merengue t\xEDpico",
          "strength": "strong",
          "roomId": "perico-ripiao"
        },
        {
          "cue": "acorde\xF3n",
          "strength": "strong",
          "roomId": "perico-ripiao"
        },
        {
          "cue": "el cibao",
          "strength": "strong",
          "roomId": "perico-ripiao"
        },
        {
          "cue": "campo",
          "strength": "weak",
          "roomId": "perico-ripiao"
        },
        {
          "cue": "picard\xEDa",
          "strength": "weak",
          "roomId": "perico-ripiao"
        },
        {
          "cue": "fiesta",
          "strength": "weak",
          "roomId": "perico-ripiao"
        },
        {
          "cue": "doble sentido",
          "strength": "weak",
          "roomId": "perico-ripiao"
        },
        {
          "cue": "merengue de orquesta",
          "strength": "strong",
          "roomId": "merengue-de-orquesta"
        },
        {
          "cue": "big band",
          "strength": "strong",
          "roomId": "merengue-de-orquesta"
        },
        {
          "cue": "secci\xF3n de saxofones",
          "strength": "strong",
          "roomId": "merengue-de-orquesta"
        },
        {
          "cue": "el jaleo de saxo",
          "strength": "strong",
          "roomId": "merengue-de-orquesta"
        },
        {
          "cue": "metales",
          "strength": "weak",
          "roomId": "merengue-de-orquesta"
        },
        {
          "cue": "boda",
          "strength": "weak",
          "roomId": "merengue-de-orquesta"
        },
        {
          "cue": "orgullo",
          "strength": "weak",
          "roomId": "merengue-de-orquesta"
        },
        {
          "cue": "celebraci\xF3n",
          "strength": "weak",
          "roomId": "merengue-de-orquesta"
        },
        {
          "cue": "merengue de calle",
          "strength": "strong",
          "roomId": "merengue-de-calle"
        },
        {
          "cue": "merengue urbano",
          "strength": "strong",
          "roomId": "merengue-de-calle"
        },
        {
          "cue": "la calle",
          "strength": "strong",
          "roomId": "merengue-de-calle"
        },
        {
          "cue": "tambora programada",
          "strength": "weak",
          "roomId": "merengue-de-calle"
        },
        {
          "cue": "swagger",
          "strength": "weak",
          "roomId": "merengue-de-calle"
        },
        {
          "cue": "coqueteo",
          "strength": "weak",
          "roomId": "merengue-de-calle"
        },
        {
          "cue": "discoteca",
          "strength": "weak",
          "roomId": "merengue-de-calle"
        }
      ]
    },
    "vallenato": {
      "id": "vallenato",
      "name": "Vallenato",
      "aliases": [
        "vallenato music",
        "vallenato paseo"
      ],
      "profileText": "A vallenato writer is a juglar first \u2014 a teller of vivencias, lived experiences set to the accordion trio. The song is a story before it is a groove, so the writing job is narrative: carry a real thing that happened \u2014 a love, a leaving, a friendship, a piece of the region's life \u2014 and move it forward, verse by verse, in plain conversational Spanish sung close to speech. Under the story runs the second law: the accordion is a second voice. The diatonic accordion answers the singer at every phrase-turn and takes whole instrumental turnarounds, so phrases end open and hand off to it, and the caja vallenata and guacharaca keep the aire's pulse underneath. A sheet packed wall-to-wall has silenced the instrument that defines the genre. The writer plans where the words stop, because that space belongs to the accordion.\n\nWhat the writer chooses is the aire \u2014 the rhythmic pattern the story is played through \u2014 and the aire is the room. Paseo walks the vivencia at a storyteller's mid-tempo, romantic or narrative, the most common home and the default. Son slows and darkens it, minor-key and grave, the accordion's low bass reeds leading a settled sorrow \u2014 the aire of serious desamor and loss, carried, not shouted. Merengue vallenato lifts it into a fast, bouncing 6/8 for the parranda among friends \u2014 a Colombian aire, and never the Dominican merengue genre, which is a different music on saxophone and tambora. Puya runs fastest, an instrumental showcase where the accordion and guacharaca race and the words thin to almost nothing. Same story engine, same trio; different speed, weight, and how much the words carry.\n\nThe law above every dial is language and truth. Spanish is the song's native tongue \u2014 the lyrics are written in Spanish by a later layer \u2014 but the writer works in plain English craft instruction and never invents coastal slang, endearments, or accent flavor to costume the song; only the user's own words survive, and the identity is carried by the story, the aire, and the accordion's answer. Craft terms the writer thinks with \u2014 aire, paseo, son, merengue, puya, bajos, caja, guacharaca \u2014 are working vocabulary and stay out of the lyrics, adlibs, and render notes unless the user wrote them first. And the postcard is not vallenato: generic tropical scenery, beaches, and party clich\xE9s are the tourist parody the founder rejects. The real river, the real town, the real name from the user's life is the song.",
      "defaultRoomId": "paseo",
      "rooms": [
        {
          "id": "paseo",
          "name": "Paseo",
          "oneLine": "The heart of vallenato \u2014 the mid-tempo aire the story lives in, romantic or narrative, the accordion answering the singer as he tells a lived tale end to end.",
          "tempoGroove": "85-115 BPM in a walking 2/4 or 4/4 that never rushes the tale, the caja marking a steady pulse with rolls into each phrase-turn and the guacharaca scraping even subdivisions; the accordion answers between vocal lines and takes the instrumental turnaround. Word density is medium-to-high \u2014 this is a narrative aire that carries a long vivencia, but phrases still break at line-ends for the accordion to fill, so leave the turns open.",
          "writingDials": [
            "The accordion is the second voice: it answers at phrase-ends and takes whole solo turnarounds, so write lines that hand off to it and plan the instrumental break where the accordion sings alone between verses.",
            "Tell a real vivencia in order: the paseo narrates something that happened to the singer \u2014 a love, a leaving, a piece of the region's life \u2014 moving forward verse by verse, so build the story from the actual who, where, and when the user brought.",
            "Two home registers, one aire: the romantic paseo (devotion, courtship, longing, an amor imposible) and the storytelling paseo (a life, a friendship, a farewell) \u2014 decide which the user's story is before choosing point of view.",
            "Sit the vocal near speech, warm and plainspoken: the paseo is sung close to conversation, more told than belted, so write phrases a natural voice carries without strain and let the feeling come from the true detail, not from ornament.",
            "Rhyme steady and singable: clean end-rhyme in couplets or quatrains keeps the long story easy to follow, and a plain honest word outranks a clever one.",
            "The refrain lands the tale's emotional headline: a short repeatable line the accordion then echoes \u2014 plain enough to sing back, true enough to mean.",
            "Keep the world the user's own: the real name, the real town, the real river or road \u2014 vallenato earns belief through concrete regional detail, never through postcard tropical scenery.",
            "Cross-genre firewall: the accordion answering the voice over caja and guacharaca while the singer tells one lived story is what makes it vallenato and not cumbia \u2014 cumbia is a dance groove built on gaita and tambora that circles a feeling, where the paseo is a narrator walking a tale through the accordion trio."
          ],
          "rendering": "Diatonic vallenato accordion leading and answering the vocal with runs at every phrase-turn, caja vallenata (small hand drum) keeping the 2/4 pulse with repique rolls, guacharaca scraping steady subdivisions, upright or electric bass walking underneath, light guitar and a second harmony voice on the refrain. Warm conversational lead vocal, more narrated than belted; tight live-trio Valledupar mix, accordion out front, no synths.",
          "storyFit": "Best for: a lived story told end to end, courtship and devotion, longing, a farewell, an amor imposible, honoring a friend or the region in narrative. Poor fit: a fast party number (that is merengue vallenato), a heavy minor-key lament (that is son), an instrumental showcase (that is puya).",
          "parodyTraps": "Generated Colombian or coastal slang the user never wrote; postcard tropical scenery standing in for the user's real town and river; a wall-to-wall lyric that leaves the accordion no phrase-turn to answer or solo; a belted anthem delivery that fights the conversational voice; skipping the story to loop a hook.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Instrumental Break] [Harmonies] [Shout]. This room performs like a small accordion trio telling a story to a listening room \u2014 one warm conversational lead, a second harmony voice on the refrain, and the accordion as the answering instrument, with the players throwing an occasional joyful shout. Signature: the accordion answer and turnaround \u2014 the squeezebox echoes the vocal at phrase-ends and takes the instrumental break alone, and a joyful shout from the players tops a big line or kicks off the solo. Placement: the harmony voice comes in on the refrain and the emotional peaks; the accordion fills the gaps at line-ends and owns the [Instrumental Break] turnaround between verses; a joyful shout marks the turn into the solo or the last refrain. Tag identity: a lead and a harmony partner over an answering accordion \u2014 a second voice on the refrain, the accordion singing in the holes, a joyful shout thrown by the players as release. Any shout is plain-English energy, never a scripted exclamation the user did not bring.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Harmonies]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "acorde\xF3n",
              "caja vallenata",
              "guacharaca",
              "bajo",
              "guitarra",
              "coros"
            ],
            "themes": [
              "Amor y despecho",
              "Vivencias y an\xE9cdotas",
              "La tierra y el campo",
              "Amor imposible",
              "El r\xEDo y el pueblo"
            ],
            "purposes": [
              "Enamorar",
              "Contar una vivencia",
              "Recordar la tierra",
              "Llorar el desamor"
            ]
          }
        },
        {
          "id": "son",
          "name": "Son",
          "oneLine": "The slow, dark aire \u2014 minor-key and heavy-hearted, the accordion's bass notes leading a wounded confession, the most difficult of the aires to sing and the most sorrowful to write.",
          "tempoGroove": "60-85 BPM in a slow, deliberate 2/4, usually minor, the caja soft and unhurried and the guacharaca scraping a patient subdivision; the accordion leads with its bajos \u2014 the low bass reeds \u2014 carrying the melancholy under and between the lines. Word density is medium and spacious \u2014 the son breathes, so write phrases with real air after them and let the low accordion answer the sorrow in the gaps.",
          "writingDials": [
            "Lead with the accordion's bass: the son turns on the bajos \u2014 the low reeds \u2014 so leave the phrase-ends open for that dark answer to rise, and plan the turnaround where the low accordion carries the grief alone.",
            "Write the wound plainly and heavily: the son is the aire of desamor and loss worn seriously \u2014 not the drunk collapse of a barroom, but a grave, settled sorrow \u2014 so favor a true quiet detail over any big gesture, and let the minor key hold the weight.",
            "Let the tempo breathe: the son sits back and rushes nothing, so write phrases that can stretch and settle rather than lock hard to a dance grid \u2014 the space is where the ache lives.",
            "Keep the story bodily and specific to the user's own life \u2014 the actual person, the actual leaving, the actual place \u2014 narrated with the composure of someone who has carried it a while, not shouted.",
            "Rhyme plain and grave: steady, unadorned end-rhyme that keeps the sorrow clear and singable; the drama comes from the events and the minor melody, not from clever turns.",
            "The refrain is a settled lament: a short heavy line the low accordion echoes, returning richer as the verses deepen the loss \u2014 sung back, never chanted.",
            "Point of view is first person carrying a weight: address to the one who left, or a reckoning said out loud to no one, plainspoken and heavy rather than theatrical.",
            "Cross-genre firewall: the minor-key accordion basses leading a grave lament over the caja-and-guacharaca son pulse is what makes it vallenato and not bolero \u2014 bolero broods in orchestral rubato with strings and no scraper, where the son aches on the trio's steady low pulse with the accordion, not violins, carrying the sorrow."
          ],
          "rendering": "Minor-key vallenato accordion leading with its low bass reeds (bajos) answering the vocal darkly at every turn, caja vallenata soft and unhurried, guacharaca scraping a patient subdivision, upright bass low and warm, spare guitar. Grave, controlled lead vocal, more carried than belted, close and heavy; dry warm live-trio mix with real air around the lines, no synths, the low accordion out front.",
          "storyFit": "Best for: desamor worn seriously, the woman who left, a grave loss, longing that has settled, an amor imposible mourned with composure, a heavy farewell. Poor fit: bright party energy (that is merengue vallenato), a brisk narrative walk (that is paseo), an instrumental showcase (that is puya), or any joy the minor aire cannot hold.",
          "parodyTraps": "Spanish endearments or slang the user never wrote pasted in as flavor; postcard tropical romance with no real wound under it; filling the low accordion's answer gaps with words until the son cannot breathe; an over-belted or theatrical delivery that breaks the grave composure; forcing a major-key brightness the aire refuses.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Instrumental Break] [Harmonies] [Melancholy]. This room performs like a man carrying a settled sorrow to a quiet room \u2014 one grave lead voice and the low accordion answering him like a second mourner, no crowd and no hype. Signature: the bass-reed answer \u2014 the accordion's low bajos rise in the gap the phrasing leaves and echo the weight of the line, so the ache is stated twice, once in words and once in the dark reeds. Placement: the accordion basses answer at the phrase-ends the singer leaves open and own the [Instrumental Break] turnaround where the low reeds carry the grief alone; a thin harmony can shadow the refrain's last words at a peak; verses stay spacious so the sorrow reads. Tag identity: a grave solo voice and its answering low accordion \u2014 a bare harmony shadow on the refrain only, the bass reeds mourning in the holes, the break marked as its own low instrumental lament. No group, no party, no hype \u2014 one man, the trio breathing under him, and every sung word is plain language from the user's own sheet.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Harmonies]",
              "[Melancholy]"
            ]
          },
          "builder": {
            "instruments": [
              "acorde\xF3n",
              "caja vallenata",
              "guacharaca",
              "bajo",
              "guitarra",
              "coros"
            ],
            "themes": [
              "Amor y despecho",
              "La mujer que se fue",
              "Amor imposible",
              "Nostalgia del terru\xF1o"
            ],
            "purposes": [
              "Llorar el desamor",
              "Contar una vivencia",
              "Recordar la tierra"
            ]
          }
        },
        {
          "id": "merengue-vallenato",
          "name": "Merengue Vallenato",
          "oneLine": "The fast, lively aire for the parranda \u2014 a bouncing Colombian rhythm, not the Dominican merengue genre, where the words thin and the accordion dances its answer for the party.",
          "tempoGroove": "90-120 BPM in a fast, bouncing 6/8 that swings \u2014 the Colombian merengue vallenato aire, distinct from Dominican merengue, driven by the caja's lively roll and the guacharaca's quick scrape while the accordion dances between lines. Word density is medium and light on its feet \u2014 the lilt must stay buoyant, so keep phrases short and springy and leave the accordion room to bounce its answer.",
          "writingDials": [
            "Keep it buoyant: the merengue vallenato aire swings in a fast 6/8, so write short springy phrases that ride the bounce and never clog it \u2014 a line too dense drags the lilt the aire is built for.",
            "Write for the parranda: this is the celebratory, among-friends aire, so favor an upbeat vivencia, a warm boast, a courtship in good spirits, or the joy of the gathering itself over heavy sorrow.",
            "The accordion dances its answer: leave the phrase-ends open for a quick lively fill and plan the turnaround where the accordion runs bright between verses \u2014 the response is part of the bounce.",
            "Keep the story the user's own and specific, but lift its spirit: the real friends, the real town, the real occasion, carried at the pace of a party rather than a lament.",
            "Rhyme clean and catchy: bright singable end-rhyme the group can catch and sing back, matched to the swing so the syllables land on the lilt.",
            "The refrain is a raised, repeatable line: short and hooky enough for the parranda to lift on and the accordion to echo \u2014 if it could not be sung back over a lively floor, it is pitched wrong for this aire.",
            "Point of view can widen to the gathering: first person among friends, a courtship in company, or a warm communal lift \u2014 but it stays a vallenato vivencia carried by the trio, not a generic party chant.",
            "Cross-genre firewall: the fast Colombian 6/8 accordion-trio swing carrying a vivencia is what makes it merengue vallenato and not Dominican merengue \u2014 the Dominican genre is a different music entirely, saxophone-and-tambora at a straight fast clip; this is the vallenato aire on accordion, caja, and guacharaca, and the sheet keeps it there."
          ],
          "rendering": "Bright diatonic vallenato accordion dancing lively fills and answers, caja vallenata rolling a fast buoyant 6/8, guacharaca scraping a quick swing subdivision, bass bouncing underneath, guitar and coros lifting the refrain. Warm energetic lead vocal riding the swing with a two-voice harmony on the hook; lively live-parranda mix, accordion out front, no synths, unmistakably the Colombian aire.",
          "storyFit": "Best for: a parranda among friends, an upbeat courtship, a warm boast or celebration, the joy of the gathering, a good-spirited vivencia. Poor fit: a grave lament (that is son), a slow narrative walk (that is paseo), an instrumental showcase (that is puya), or heavy sorrow the buoyant lilt cannot hold.",
          "parodyTraps": "Writing it as Dominican merengue \u2014 a saxophone-and-tambora arrangement instead of the accordion trio; generated coastal slang the user never wrote; postcard party clich\xE9s instead of the real gathering; a dense lyric that clogs the bounce; a hook that behaves like a generic chant rather than a sung parranda refrain.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Instrumental Break] [Harmonies] [Shout]. This room performs like an accordion trio lifting a parranda \u2014 one warm energetic lead, a two-voice harmony on the refrain, and the accordion dancing the answer, with the players throwing joyful shouts across the swing. Signature: the danced accordion answer \u2014 the squeezebox bounces a bright fill into the gap at each phrase-end and a joyful shout from the players lands on the lift, the whole trio pushing each refrain. Placement: harmony voices thicken the refrain and the peaks; the accordion runs its lively fills in the line-end gaps and owns the [Instrumental Break] between verses; joyful shouts mark the big turns and the kick into the solo. Tag identity: a lead and a harmony partner over a dancing accordion \u2014 coros lifting the hook, the accordion bouncing in the holes, joyful shouts thrown by the players as release. Every shout is plain-English party energy, never a scripted foreign exclamation the user did not write.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Harmonies]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "acorde\xF3n",
              "caja vallenata",
              "guacharaca",
              "bajo",
              "guitarra",
              "coros"
            ],
            "themes": [
              "La parranda entre amigos",
              "Amor y despecho",
              "Vivencias y an\xE9cdotas",
              "La tierra y el campo"
            ],
            "purposes": [
              "Parrandear con los amigos",
              "Enamorar",
              "Contar una vivencia"
            ]
          }
        },
        {
          "id": "puya",
          "name": "Puya",
          "oneLine": "The fastest aire \u2014 a driving instrumental showcase where the accordion and guacharaca run at full speed and the words thin to almost nothing, the trio's virtuosity on display.",
          "tempoGroove": "130-170 BPM in a fast, hard-driving binary 2/4 (a rapid straight two \u2014 this is what separates the puya from the merengue vallenato's 6/8 swing), the oldest and most rhythmic of the aires \u2014 the guacharaca scrapes a rapid insistent pattern and the caja rolls fast while the accordion runs virtuosic lines almost continuously. Word density is low \u2014 the puya is carried by the playing, so keep the vocal spare and built around the instrumental runs, leaving long stretches for the accordion and scraper to take the song.",
          "writingDials": [
            "Write for the players, not the singer: the puya is an instrumental showcase, so keep the words few and pointed and plan long passages where the accordion and guacharaca run alone \u2014 the lyric frames the playing rather than filling over it.",
            "Keep phrases short and rhythmic: what vocal there is rides the fast drive as another percussion line, so favor tight, punchy lines with mouth-feel over long sentences, and land them on the pulse.",
            "Leave the showcase its room: mark the stretches where the vocal drops out entirely and the accordion takes a virtuosic run over the racing guacharaca \u2014 the instrumental break is the point of the aire, not a gap between verses.",
            "Serve a spare, spirited vivencia or a boast if there are words at all: a fast bragging line, a snapshot of the region, a call to the players \u2014 kept light and few so the drive stays clear.",
            "Rhyme tight and repetitive: short repeated end-sounds and a chantable fragment beat any elaborate scheme, because the words are a rhythmic accent, not a narrative.",
            "Keep it the user's own and concrete: the real place or name in a spare fast line, never a generic party filler, and never invented scenery \u2014 the puya is brief, so every word must be true.",
            "Point of view stays outward and energetic: a shout to the floor, pride in the playing, a snapshot \u2014 present-tense and spirited, never a slow inward confession the racing aire cannot hold.",
            "Cross-genre firewall: the fast binary 2/4 drive carrying only a spare vocal is what makes it a puya and not a merengue vallenato \u2014 the merengue swings in a bouncing 6/8 with a sung parranda refrain out front, where the puya drives straight in two, thins the words to almost nothing, and hands the song to the trio's fastest playing."
          ],
          "rendering": "Virtuosic diatonic vallenato accordion running fast continuous lines, guacharaca scraping a rapid insistent pattern high in the mix, caja vallenata rolling a hard fast 2/4, bass driving underneath, coros shouting a short fragment. Spare energetic lead vocal used as an accent between long instrumental runs; hot live-trio mix built around the accordion showcase, no synths, the scraper and accordion out front.",
          "storyFit": "Best for: an instrumental showcase, a fast spirited boast, pride in the playing or the region, a short punchy snapshot, a call to the floor. Poor fit: a long narrative (that is paseo), a grave lament (that is son), a sung party refrain out front (that is merengue vallenato), or anything that needs many words.",
          "parodyTraps": "Cramming the puya with words until the instrumental showcase has no room; generated slang the user never wrote thrown in as filler; postcard scenery instead of a real fast detail; a slow inward lyric that fights the racing drive; burying the accordion-and-guacharaca run under nonstop vocals.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Instrumental Break] [Shout]. This room performs like a trio showing off at full speed \u2014 a spare lead used as an accent and the accordion and guacharaca running the song, with the players throwing shouts on the peaks. Signature: the instrumental run \u2014 the accordion tears a virtuosic line over the racing guacharaca while the vocal steps aside, and a joyful shout from the players kicks off or tops the run, the playing carrying most of the energy. Placement: the sparse vocal lands as short accents between passages; the [Instrumental Break] hands long stretches to the accordion and scraper; joyful shouts mark the peaks and the turns into each run. Tag identity: a fast trio and a spare accenting lead \u2014 the accordion and guacharaca running the song, coros shouting a short fragment, joyful shouts thrown by the players as release. Every shout is plain-English energy, never a scripted exclamation the user did not bring.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "acorde\xF3n",
              "caja vallenata",
              "guacharaca",
              "bajo",
              "guitarra",
              "coros"
            ],
            "themes": [
              "La parranda entre amigos",
              "Vivencias y an\xE9cdotas",
              "La tierra y el campo",
              "El r\xEDo y el pueblo"
            ],
            "purposes": [
              "Parrandear con los amigos",
              "Contar una vivencia",
              "Recordar la tierra"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "paseo",
          "strength": "strong",
          "roomId": "paseo"
        },
        {
          "cue": "vivencia",
          "strength": "strong",
          "roomId": "paseo"
        },
        {
          "cue": "contar una historia",
          "strength": "strong",
          "roomId": "paseo"
        },
        {
          "cue": "amor",
          "strength": "weak",
          "roomId": "paseo"
        },
        {
          "cue": "devoci\xF3n",
          "strength": "weak",
          "roomId": "paseo"
        },
        {
          "cue": "cortejo",
          "strength": "weak",
          "roomId": "paseo"
        },
        {
          "cue": "el pueblo",
          "strength": "weak",
          "roomId": "paseo"
        },
        {
          "cue": "el r\xEDo",
          "strength": "weak",
          "roomId": "paseo"
        },
        {
          "cue": "despedida",
          "strength": "weak",
          "roomId": "paseo"
        },
        {
          "cue": "storytelling",
          "strength": "weak",
          "roomId": "paseo"
        },
        {
          "cue": "son vallenato",
          "strength": "strong",
          "roomId": "son"
        },
        {
          "cue": "desamor",
          "strength": "strong",
          "roomId": "son"
        },
        {
          "cue": "la mujer que se fue",
          "strength": "strong",
          "roomId": "son"
        },
        {
          "cue": "pena",
          "strength": "weak",
          "roomId": "son"
        },
        {
          "cue": "tristeza",
          "strength": "weak",
          "roomId": "son"
        },
        {
          "cue": "tono menor",
          "strength": "weak",
          "roomId": "son"
        },
        {
          "cue": "p\xE9rdida",
          "strength": "weak",
          "roomId": "son"
        },
        {
          "cue": "amor imposible",
          "strength": "weak",
          "roomId": "son"
        },
        {
          "cue": "duelo",
          "strength": "weak",
          "roomId": "son"
        },
        {
          "cue": "merengue vallenato",
          "strength": "strong",
          "roomId": "merengue-vallenato"
        },
        {
          "cue": "parranda",
          "strength": "strong",
          "roomId": "merengue-vallenato"
        },
        {
          "cue": "fiesta entre amigos",
          "strength": "strong",
          "roomId": "merengue-vallenato"
        },
        {
          "cue": "rumba",
          "strength": "weak",
          "roomId": "merengue-vallenato"
        },
        {
          "cue": "alegr\xEDa",
          "strength": "weak",
          "roomId": "merengue-vallenato"
        },
        {
          "cue": "celebraci\xF3n",
          "strength": "weak",
          "roomId": "merengue-vallenato"
        },
        {
          "cue": "parrandear",
          "strength": "weak",
          "roomId": "merengue-vallenato"
        },
        {
          "cue": "puya",
          "strength": "strong",
          "roomId": "puya"
        },
        {
          "cue": "muestra del acorde\xF3n",
          "strength": "strong",
          "roomId": "puya"
        },
        {
          "cue": "instrumental",
          "strength": "strong",
          "roomId": "puya"
        },
        {
          "cue": "virtuosismo",
          "strength": "weak",
          "roomId": "puya"
        },
        {
          "cue": "r\xE1pido",
          "strength": "weak",
          "roomId": "puya"
        },
        {
          "cue": "acordeonero",
          "strength": "weak",
          "roomId": "puya"
        }
      ]
    },
    "mariachiranchera": {
      "id": "mariachiranchera",
      "name": "Mariachi / Ranchera",
      "aliases": [
        "mariachi",
        "ranchera",
        "rancheras",
        "mariachi ranchera",
        "bolero ranchero"
      ],
      "profileText": "A mariachi writer starts from one truth: this is emotional first-person song. The singer stands and declares a feeling straight from the chest \u2014 a love, a heartbreak, a pride, a defiance \u2014 and stays inside it to the last note. It is not a ballad that narrates someone else's story in the third person; that is the corrido's job, a separate genre. So the writing question is never what happened to them but what does this person feel, right now, out loud. Pride and pain are allowed to share one breath: even the drunk despecho keeps its dignity and never grovels. The wound is worn openly, the crack in the voice is the register, not a flaw \u2014 but the singer stays standing.\n\nThe second instinct is the ensemble as second voice. Trumpets, violins, vihuela, guitarr\xF3n, guitar, sometimes harp \u2014 the mariachi answers the singer at the turns and swells under the peaks, so the sheet is planned around its silences. End phrases a beat early and leave the gap where the trumpets and violins reply; a lyric packed wall-to-wall smothers the swell that defines the sound. The whole song is built to arrive at one held, swelling note where the ensemble lifts under a breaking voice \u2014 the final note is the event, so it gets room. Language stays plain and sturdy, clean end-rhyme the ear hears coming, because the honest word outranks the clever one and the feeling has to land, not the craft.\n\nThe rooms bend all of this. Ranchera stands and declares the feeling at full chest to the whole cantina, the voice breaking on purpose over a broad rubato pulse. Bolero ranchero lowers it to a confided croon for one beloved, slow and tender, the strings muted and warm. Son/huapango turns the feeling outward to a stamping room on a fast 6/8, the falsetto flying and the ensemble trading quick flourishes. The law above every dial is the same as everywhere: Spanish is the song's language, but slang, accent spellings, and sombrero-and-tequila costume appear only if the user wrote them. Craft words \u2014 grito, mariachi, huapango, son, vihuela, guitarr\xF3n, falsete \u2014 are the writer's tools, never the song's, and never enter the lyrics, adlibs, or render notes. The grito is legit released energy directed in plain English \u2014 a joyful, defiant shout \u2014 never a phonetic spelling, and the user's own people and places always outrank any stock fiesta scenery.",
      "defaultRoomId": "ranchera",
      "rooms": [
        {
          "id": "ranchera",
          "name": "Ranchera",
          "oneLine": "The Jos\xE9 Alfredo Jim\xE9nez heart \u2014 a proud, wounded first-person feeling stood up and sung with the soul over full mariachi, the voice breaking on purpose.",
          "tempoGroove": "Broad and unhurried, ~70-110 BPM in a walking 2/4 (the ranchera's home meter), or the swaying \xBE vals of the ranchera valseada, the guitarr\xF3n and vihuela laying a steady pulse the singer is free to pull against and hold \u2014 rubato at the phrase-ends is the whole point. Low-to-moderate word density: short declarative phrases with real air after them, because the trumpets and violins answer the voice at the turns and the singer needs room to swell and break.",
          "writingDials": [
            "Feeling first, not plot: this room does not narrate a story about someone \u2014 it stands up and declares one emotion straight from the chest (a heartbreak, a pride, a defiance) in the first person, and stays inside that feeling to the last note.",
            "Wear it at full chest and let the voice break: ranchera is the undefended declaration \u2014 sung big, proud, and openly wounded at once; the crack in the voice is the register, not a flaw, so write peaks that earn a held, breaking note.",
            "Leave the turns open for the ensemble: end phrases a beat early so the trumpets and violins can answer in the gap \u2014 a sheet packed wall-to-wall smothers the swell that defines the sound.",
            "The hook is a declaration the room already feels: a short, plain phrase of roughly four to eight words, re-sung and gathering weight rather than resolving \u2014 a line a whole cantina could lift, stating the feeling flat and proud.",
            "Pride and pain live together: even the drunk despecho keeps its dignity and its defiance \u2014 the singer is wounded but never grovels; write the ache and the pride in the same breath, one refusing to cancel the other.",
            "Direct and plain: first person aimed at the one who left, at the room, or at fate itself; everyday words and clean, sturdy end-rhyme the ear hears coming beat any clever scheme \u2014 the honest word outranks the ornament.",
            "Build to the last note: plan the whole song to arrive at one held, swelling peak where the trumpets and violins lift under a breaking voice \u2014 the final note is the event, so leave it room.",
            "Cross-genre firewall: the full mariachi swell answering a proud, breaking first-person voice makes it ranchera, not a Regional Mexicano corrido \u2014 there is no accordion, no banda oom-pah, no narrated third-person story here; ranchera feels one emotion out loud where the corrido reports events, and the trumpets are mariachi, never a brass band."
          ],
          "rendering": "Full mariachi \u2014 bright paired trumpets and a violin section answering the vocal at the phrase-ends and swelling under the peaks, vihuela strumming the offbeat, guitarr\xF3n walking the deep bass, guitar filling the middle, optional harp runs. A single impassioned lead vocal pushed to the edge of breaking, rubato and free at the turns, minimal doubling, warm live-room sound; classic golden-age ranchera in the Jos\xE9 Alfredo Jim\xE9nez and Vicente Fern\xE1ndez tradition.",
          "storyFit": "Best for: heartbreak worn openly, drunken despecho with its dignity intact, defiant pride, love for the mother or the homeland, an amor eterno declared, the strength to carry on. Poor fit: a slow close-distance seduction \u2014 that is bolero ranchero; festive stamping celebration \u2014 that is son/huapango; a narrated third-person story of events, which belongs to a corrido, not here.",
          "parodyTraps": "Any Spanish endearment or slang the writer sprinkled that the user never said; sombrero-and-tequila postcard clich\xE9s standing in for a real feeling; narrating a story where the room wants one declared emotion; making the hook clever instead of declarable; filling the ensemble's answer gaps with words; groveling with no pride left, when despecho here stays defiant.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Instrumental Break] [Harmonies] [Shout] [Melancholy]. This room performs like one proud voice testifying to a room that already feels it, the mariachi swelling behind \u2014 a single impassioned lead and the trumpets and violins answering as its second voice, no crowd stack. Signature: the grito \u2014 a joyful defiant shout thrown by the singer or the players at a peak or a turn, pure released energy directed in plain English, never a scripted foreign exclamation or phonetic spelling. Placement: the trumpet-and-violin answers land at the line-ends the voice leaves open, roughly one per turn through the verses; an [Instrumental Break] hands a stretch to the mariachi between verses; a grito tops the biggest peaks and the final held note, and a thin harmony can shadow the hook's last words. Tag identity: a lone proud lead and its answering mariachi \u2014 trumpets and violins swelling in the gaps, a bare harmony shadow on the hook only, a grito as released feeling at the peaks. No group chant, no club \u2014 one voice, the ensemble answering it, and every sung word is plain language from the user's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Harmonies]",
              "[Shout]",
              "[Melancholy]"
            ]
          },
          "builder": {
            "instruments": [
              "trompetas",
              "violines",
              "vihuela",
              "guitarr\xF3n",
              "guitarra",
              "arpa"
            ],
            "themes": [
              "Amor y desamor",
              "Borrachera de despecho",
              "Orgullo mexicano",
              "La madre y la familia",
              "Traici\xF3n",
              "Fuerza para seguir"
            ],
            "purposes": [
              "Cantar con el alma",
              "Ahogar las penas",
              "Honrar a alguien",
              "Recordar la tierra"
            ]
          }
        },
        {
          "id": "bolero-ranchero",
          "name": "Bolero Ranchero",
          "oneLine": "The slow romantic mariachi bolero \u2014 devotion and dedication sung close and tender over swaying strings, the ache lowered to a confided murmur.",
          "tempoGroove": "Slow and swaying, ~60-90 BPM in the bolero's rocking pulse, the guitarr\xF3n and vihuela relaxed and rounded, the violins legato and the trumpets muted and warm rather than bright. Low word density with long breathed phrases and held open vowels; the singer croons close to the mic, so lines must leave room to soften, sustain, and slide into the strings' reply.",
          "writingDials": [
            "Keep the world close and tender: one beloved, one confided feeling \u2014 devotion, a dedication, longing, gratitude \u2014 sung at close distance, never widened to a standing cantina declaration; this room confides where ranchera proclaims.",
            "Write for a crooner: end the feeling-lines on open vowels the voice can hold and slide, avoid hard consonant endings on the peaks, and let phrases trail so the violins and muted trumpet can answer warm underneath.",
            "The romance is sincere and grand without shouting: bolero ranchero is unashamed devotion \u2014 write it earnest and heartfelt, the grandeur carried in the sweep of the strings and the held note, not in volume.",
            "Sensuality is adult and suggested: one warm image that turns romantic on the second listen carries the heat \u2014 the closeness, a hand, a look from the user's own moment \u2014 never spelled out or made explicit.",
            "The hook is a tender vow, not a chant: a short repeated promise or dedication aimed at one person, re-sung softer and closer each pass, intimate enough that a crowd would never shout it back.",
            "Point of view is first person to a you who must feel like the real person from the user's story \u2014 one detail only the two of them would recognize keeps it off the greeting-card rack.",
            "Let the strings carry the swell: plan the peak as a legato violin rise and a warm muted-trumpet answer under a held vocal, the ensemble breathing with the singer rather than punching against them.",
            "Cross-genre firewall: the muted warm mariachi confiding under an intimate croon makes it bolero ranchero, not standing ranchera \u2014 here the ensemble sways and answers soft where ranchera swells and breaks big, and the coro-vow is a lover's private promise, never a cantina's proud declaration."
          ],
          "rendering": "Warm mariachi bolero \u2014 legato violin section and soft muted trumpets answering the vocal tenderly, vihuela and guitar strumming the gentle bolero rock, guitarr\xF3n rounding the low end, optional harp arpeggios and light air for intimacy. A smooth, controlled close-miked lead vocal with soft harmony doubles and a warm held sustain, polished and low; golden-age bolero ranchero in the tradition of the great mariachi romantic singers.",
          "storyFit": "Best for: a love letter, an anniversary, a dedication to a partner, devotion through hard times, tender longing, an amor eterno confided. Poor fit: a proud standing despecho at full chest \u2014 that is ranchera; festive stamping celebration \u2014 that is son/huapango; protest, boasting, or party energy, which this hushed romantic room has no register for.",
          "parodyTraps": "Machine-added Spanish pet names the user never wrote; running the seduction-clich\xE9 checklist instead of the couple's real details; getting explicit where the room insists on suggestion; a vow that behaves like a crowd chant instead of a private promise; strings-and-roses greeting-card lines with no specific real person in them; belting big where the room asks for a confided croon.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Soft] [Harmonies] [Crooning] [Romantic]. This room performs at close distance \u2014 one tender lead voice with soft harmony doubles and the muted mariachi confiding warm behind, nobody else in the room. Signature: the strings' warm answer \u2014 the legato violins and soft muted trumpet reply under the gap the phrasing leaves, close and unhurried, echoing the vow the way a body leans nearer, never a crowd. Placement: the floor of 3 sits where the closeness peaks \u2014 one soft harmony under the hook's last words, one warm string-and-trumpet answer where the phrase trails at the bridge, one held or hummed sustain in the outro; verses stay nearly bare so the breath carries them, and the strings can take a whole passage instead of any vocal show. Tag identity: an intimate solo voice with soft self-harmonies and a confiding muted mariachi \u2014 a breathed harmony on the vow, a warm sustained note saved for the closest moment, a [Soft] passage where the song pulls nearest. No crowd, no cantina swell \u2014 two people and a slow sway, every echoed word from the user's own sheet.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Soft]",
              "[Harmonies]",
              "[Crooning]",
              "[Romantic]"
            ]
          },
          "builder": {
            "instruments": [
              "violines",
              "trompetas",
              "vihuela",
              "guitarr\xF3n",
              "guitarra",
              "arpa"
            ],
            "themes": [
              "Amor y desamor",
              "Amor eterno",
              "Nostalgia del pueblo",
              "La madre y la familia"
            ],
            "purposes": [
              "Dedicar a un amor",
              "Cantar con el alma",
              "Honrar a alguien",
              "Recordar la tierra"
            ]
          }
        },
        {
          "id": "son",
          "name": "Son / Huapango",
          "oneLine": "The festive, fast 6/8 lane \u2014 stamping feet, flying falsetto flourishes, and full mariachi celebration, the emotion turned outward to a joyful room.",
          "tempoGroove": "Bright and fast, ~120-180 BPM in a driving 6/8 that cross-accents against 3/4 (the sesqui\xE1ltera lilt), the vihuela and guitarr\xF3n snapping the offbeat for stamping feet and the violins and trumpets trading quick figures. Moderate word density, rhythmic and springy: crisp phrases that ride the lilt and leave punch-and-answer gaps for the ensemble and the falsetto to flourish, never wall-to-wall.",
          "writingDials": [
            "Turn the feeling outward: this room celebrates to a room \u2014 joy, hometown pride, courtship, defiant high spirits \u2014 sung up and out for a floor that is stamping, where ranchera declares inward-facing pain and bolero confides; the energy points at the party.",
            "Ride the 6/8 lilt: write springy, rhythmic phrases whose stresses lock to the cross-accented pulse so the words dance with the stamping \u2014 mouth-feel and bounce outrank long solemn lines here.",
            "Leave gaps for the flourish: land a phrase, then leave a beat for the violin-and-trumpet figure or the falsetto leap to answer \u2014 the gap after the line is part of it, so end phrases open and never fill every beat.",
            "Write the hook for lift, not lament: a short, bright, repeatable phrase the room can catch and answer, stated with a grin or a defiant tilt, gaining energy each return \u2014 if it could not be lifted over stamping feet, it is pitched wrong.",
            "Court, boast, or celebrate plainly and specifically: keep the wit and the pride tied to the user's real people and place \u2014 a real town, a real name \u2014 never generic fiesta scenery, and let the falsetto flights carry the release the words leave open.",
            "Keep the language plain and sturdy: clean end-rhyme that lands square with the stamp, everyday words, a clear line over a clever one \u2014 the drama is in the lift and the footwork, not in ornament.",
            "Match the meter to the dance: the 6/8 huapango stamp is the body of this room, so pick the pulse first and write the syllable count to sit springy inside it rather than fighting it.",
            "Cross-genre firewall: the fast 6/8 stamping lilt with the flying falsetto over full mariachi makes it son/huapango, not a banda fiesta or a norte\xF1o polka \u2014 there is no oom-pah wind band and no accordion two-step; the celebration rides violins, trumpets, vihuela, and guitarr\xF3n, and the signature release is the falsetto leap and the grito, never a brass-band fanfare."
          ],
          "rendering": "Bright fast mariachi son \u2014 violins and paired trumpets trading quick flourishes over a snapping vihuela and guitarr\xF3n driving the 6/8 sesqui\xE1ltera, guitar filling the middle, optional harp runs sparkling on top. An energetic lead vocal with soaring falsetto leaps and a two- or three-voice harmony catching the hook, joyful and forward, live plaza feel; festive son jalisciense and huapango in the full mariachi tradition.",
          "storyFit": "Best for: celebration and fiesta, hometown and Mexican pride, courtship and flirtation, a wedding or a quincea\xF1era, defiant high spirits, honoring someone with joy. Poor fit: a proud standing heartbreak at the mic \u2014 that is ranchera; a tender close dedication \u2014 that is bolero ranchero; quiet grief or slow reflection, which this stamping room has no patience for.",
          "parodyTraps": "Fake regional slang or accent spelling the user never wrote; sombrero-and-tequila postcard fiesta clich\xE9s instead of the user's real town and people; a wall-to-wall lyric that leaves the violins and falsetto no room to flourish; solemn lament forced over a stamping 6/8; a hook too wordy for the room to catch; borrowed festive filler with no specific real detail under it.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Instrumental Break] [Harmonies] [Shout] [Call and Response]. This room performs like a full mariachi working a stamping floor \u2014 an energetic lead with a harmony chorus catching the hook, the violins and trumpets trading figures, and the players lifting each turn. Signature: the falsetto leap and the grito \u2014 the voice flies up into a bright falsetto flourish at the peaks and a joyful defiant shout tops the biggest turns, pure released energy directed in plain English, never a scripted foreign exclamation or phonetic spelling. Placement: the violin-and-trumpet flourishes fall in the gaps at phrase-ends where the vocal steps aside; an [Instrumental Break] hands a stretch to the ensemble between verses; a falsetto leap lifts the peaks and a grito tops the chorus and the biggest figures, harmony voices catching the hook. Tag identity: an energetic lead and a full mariachi celebrating \u2014 trumpets and violins trading in the gaps, a falsetto flourish and a grito as released joy at the peaks, a harmony chorus swelling on the hook. Every shout is energy in plain English, never a scripted exclamation the user did not write.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Harmonies]",
              "[Shout]",
              "[Call and Response]"
            ]
          },
          "builder": {
            "instruments": [
              "violines",
              "trompetas",
              "vihuela",
              "guitarr\xF3n",
              "guitarra",
              "arpa"
            ],
            "themes": [
              "Orgullo mexicano",
              "Nostalgia del pueblo",
              "La madre y la familia",
              "Amor y desamor"
            ],
            "purposes": [
              "Celebrar con mariachi",
              "Cantar con el alma",
              "Honrar a alguien",
              "Recordar la tierra"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "ranchera",
          "strength": "strong",
          "roomId": "ranchera"
        },
        {
          "cue": "jos\xE9 alfredo jim\xE9nez",
          "strength": "strong",
          "roomId": "ranchera"
        },
        {
          "cue": "vicente fern\xE1ndez",
          "strength": "strong",
          "roomId": "ranchera"
        },
        {
          "cue": "despecho",
          "strength": "weak",
          "roomId": "ranchera"
        },
        {
          "cue": "con el alma",
          "strength": "weak",
          "roomId": "ranchera"
        },
        {
          "cue": "orgullo",
          "strength": "weak",
          "roomId": "ranchera"
        },
        {
          "cue": "heartbreak",
          "strength": "weak",
          "roomId": "ranchera"
        },
        {
          "cue": "borrachera",
          "strength": "weak",
          "roomId": "ranchera"
        },
        {
          "cue": "bolero ranchero",
          "strength": "strong",
          "roomId": "bolero-ranchero"
        },
        {
          "cue": "dedicatoria",
          "strength": "strong",
          "roomId": "bolero-ranchero"
        },
        {
          "cue": "aniversario",
          "strength": "strong",
          "roomId": "bolero-ranchero"
        },
        {
          "cue": "amor eterno",
          "strength": "weak",
          "roomId": "bolero-ranchero"
        },
        {
          "cue": "rom\xE1ntico",
          "strength": "weak",
          "roomId": "bolero-ranchero"
        },
        {
          "cue": "love letter",
          "strength": "weak",
          "roomId": "bolero-ranchero"
        },
        {
          "cue": "devoci\xF3n",
          "strength": "weak",
          "roomId": "bolero-ranchero"
        },
        {
          "cue": "mi amor",
          "strength": "weak",
          "roomId": "bolero-ranchero"
        },
        {
          "cue": "huapango",
          "strength": "strong",
          "roomId": "son"
        },
        {
          "cue": "son jalisciense",
          "strength": "strong",
          "roomId": "son"
        },
        {
          "cue": "falsete",
          "strength": "strong",
          "roomId": "son"
        },
        {
          "cue": "fiesta",
          "strength": "weak",
          "roomId": "son"
        },
        {
          "cue": "celebraci\xF3n",
          "strength": "weak",
          "roomId": "son"
        },
        {
          "cue": "courtship",
          "strength": "weak",
          "roomId": "son"
        },
        {
          "cue": "zapateado",
          "strength": "weak",
          "roomId": "son"
        },
        {
          "cue": "pueblo",
          "strength": "weak",
          "roomId": "son"
        }
      ]
    },
    "baladabolero": {
      "id": "baladabolero",
      "name": "Balada / Bolero",
      "aliases": [
        "balada",
        "bolero",
        "balada romantica",
        "balada rom\xE1ntica",
        "bolero clasico",
        "bolero cl\xE1sico"
      ],
      "profileText": "A balada writer starts with a refusal: this music suggests and swells, it never dances. There is no clave, no dembow, no g\xFCira to answer to \u2014 instead there is rubato, the freedom to lean on a word and let a note ring, and the whole craft is built on space and dynamics rather than a groove. So the writing job is shaped by breath and arc before it is verbal: leave air after the lines, end feeling-phrases on open vowels a voice can hold, and plan where the emotion sits low and where it opens up. A balada packed wall-to-wall, with no room to hold a note or let the arrangement breathe, has failed before its first word is judged. The song always faces one person at close distance \u2014 a declaration, a plea, a farewell \u2014 and never widens to a crowd.\n\nThe emotional root the genre carries is romantic feeling worn without irony \u2014 eternal love, heartbreak, longing, remembrance \u2014 and the three rooms wear it three different ways, so choosing the room is choosing the scale of the feeling and how the emotion is delivered. Bolero Cl\xE1sico holds it with dignity: two or three players in a small room, the requinto guitar answering as a second voice, poetic and formal diction, devotion or heartbreak stated with old-world restraint and never wailed. Balada Rom\xE1ntica lets it overflow: a lone voice climbing a piano-and-strings arrangement from a hushed verse to a chorus that breaks wide open \u2014 the Camilo Sesto and Roc\xEDo D\xFArcal power ballad, built on its dynamic arc, grand and unashamed at the peaks. Bolero Moderno / Balada Pop underplays it: the same rubato heart produced spare and current, conversational and understated, a small swell reading as large. Same feeling; different scale, different restraint kept.\n\nThe law above every dial is language. Spanish is the song's native tongue here \u2014 the lyrics are written in Spanish by a later layer \u2014 but the writer works in plain English craft instruction and never invents endearments, slang, or accent flavor to costume the song; only words the user wrote survive, and identity is carried by rubato, restraint, and the arc of the feeling, never by sprinkled vocabulary. Craft terms the writer thinks with \u2014 requinto, rubato, the swell, the trio \u2014 are working vocabulary and stay out of the lyrics, adlibs, and render notes unless the user wrote them first. And the postcard is not a bolero: generic Latin-lover romance, roses, and moonlight are the greeting-card parody the founder rejects; the user's own name, parting, and promise are the song.",
      "defaultRoomId": "bolero-cl-sico",
      "rooms": [
        {
          "id": "bolero-cl-sico",
          "name": "Bolero Cl\xE1sico",
          "oneLine": "The classic guitar-trio and requinto romantic bolero \u2014 the Los Panchos feel, intimate and formal, two or three players in a small room and the lead guitar crying back at every line.",
          "tempoGroove": "60-90 BPM, slow and rubato at the edges, a small acoustic trio breathing with the singer rather than a fixed dance pulse \u2014 the bolero suggests and never marches, so there is no danceable groove to lock to. Low-to-medium word density: short, poetic, breathing phrases with real air after them, because the requinto answers the voice at the end of nearly every line and the singer needs room to let a held note ring.",
          "writingDials": [
            "Requinto as second voice: the lead nylon-string guitar answers the singer in the gap at line-ends and takes a delicate solo turnaround \u2014 write phrases that end early and hand off, and plan the instrumental break where the requinto sings alone; a sheet packed wall-to-wall silences the instrument that defines the room.",
            "Feeling held with dignity: this is devotion or heartbreak worn with old-world restraint, not wailed \u2014 the emotion is enormous but the delivery is composed and formal, so understatement and a poised line carry further than any collapse.",
            "Poetic, elevated register: the bolero tradition writes in imagery and a slightly formal, timeless diction \u2014 metaphor over blunt statement, the beloved addressed with reverence, so favor the graceful figure over the plain report.",
            "Direct address to one person, present and close: first person to a you at intimate distance \u2014 a declaration, a plea, a farewell said face to face \u2014 never widened to a crowd, never a public scene.",
            "Rhyme clean and singable: the classic bolero leans on graceful perfect or near-perfect rhyme that a voice can hold, often in couplets \u2014 the craft is elegant but never showy, the sung line always winning over the clever one.",
            "The chorus is a returning vow, not a shout: a short melodic phrase re-sung with the same tenderness each pass, deepening rather than escalating \u2014 this room does not build to a belt, it circles a single held feeling.",
            "Keep the story specific to the user's own life inside the poetry \u2014 the real name, the real parting, the real promise \u2014 so the elevated diction dresses a true wound and never floats into greeting-card abstraction.",
            "Cross-genre firewall: the rubato acoustic trio with the requinto crying its tender fill in the gaps makes it a bolero, not a bachata \u2014 there is no g\xFCira scraping sixteenths and no bong\xF3 driving a danceable lilt under it, and the requinto here is a gentle answering voice, never bachata's driving answer-machine over a dance groove."
          ],
          "rendering": "Spare romantic trio \u2014 warm nylon-string requinto answering the vocal with delicate crying runs and a solo turnaround, a second rhythm guitar (guitarra espa\xF1ola) strumming softly, upright bass walking gentle underneath, brushed or barely-there soft percussion holding the rubato. Intimate close-miked lead vocal, tender and dignified, sometimes a single close harmony voice; dry, warm, vintage bolero room with real air around everything, no orchestral wall and no dance drums \u2014 1950s-through-70s Los Panchos trio feel.",
          "storyFit": "Best for: a timeless declaration of eternal love, a dignified heartbreak, a formal farewell, longing worn with restraint, a serenade to one person, remembering a great love with grace. Poor fit: a huge overflowing power-ballad climax \u2014 that is Rom\xE1ntica; a stripped modern conversational intimacy \u2014 that is Moderno; anything danceable, communal, or plainspoken-casual, which this poised trio has no register for.",
          "parodyTraps": "Any Spanish endearment or slang the writer sprinkled that the user never said; generic Latin-lover postcard romance with no real wound under it; filling the requinto's answer gaps with words; a belted, escalating delivery that breaks the room's composure; modern casual diction that flattens the elevated bolero voice; a g\xFCira or dance groove pasted under it, which turns it into bachata.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Guitar Solo] [Harmonies] [Soft] [Melancholy]. This room performs like two or three players close together in a small room \u2014 one dignified lead voice, sometimes a single warm harmony, and the requinto as the answering partner, no crowd and no wall of sound. Signature: the requinto answer \u2014 the lead nylon-string guitar cries a tender reply into the space the phrasing leaves at line-ends and takes a delicate solo turnaround between verses, the whole trio breathing with the singer. Placement: a single harmony voice slips in on the emotional peaks only; the requinto fills the gaps the sparse writing leaves and owns the [Guitar Solo] turnaround; verses stay nearly bare so the closeness and the poetry read, and the final line holds soft rather than loud. Tag identity: a small acoustic trio and an intimate dignified lead \u2014 the requinto answering in the holes as a second mourner, an occasional close harmony at the peaks, a [Soft] header where the song pulls nearest. No crowd, no orchestral swell, no belt \u2014 a few players and the air between them, and every sung word is plain language from the user's own sheet.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Guitar Solo]",
              "[Harmonies]",
              "[Soft]",
              "[Melancholy]"
            ]
          },
          "builder": {
            "instruments": [
              "requinto",
              "guitarra espa\xF1ola",
              "contrabajo",
              "percusi\xF3n suave",
              "bajo"
            ],
            "themes": [
              "Amor eterno",
              "Recuerdos de un gran amor",
              "Amor prohibido",
              "Nostalgia",
              "Entrega total al amor"
            ],
            "purposes": [
              "Dedicar a un amor",
              "Enamorar despacio",
              "Recordar a alguien"
            ]
          }
        },
        {
          "id": "balada-rom-ntica",
          "name": "Balada Rom\xE1ntica",
          "oneLine": "The 70s-through-90s piano-and-strings power ballad \u2014 the Camilo Sesto and Roc\xEDo D\xFArcal lane, a lone voice climbing from a hushed verse to a chorus that breaks wide open and overflows.",
          "tempoGroove": "55-80 BPM, slow and free, built on rubato and a dynamic arc rather than a dance pulse \u2014 the arrangement swells, it does not groove. Low word density in the verse rising to fuller phrases at the peak: leave open vowels at line-ends the voice can hold, stretch, and belt, because this room is sung for maximum dynamic range and every big line must land on a note the singer can pour out.",
          "writingDials": [
            "Write the climb: the song lives on its dynamic arc \u2014 a hushed, close verse that opens into an enormous chorus and a bridge that lifts higher still \u2014 so structure the lyric to start small and restrained and to break open exactly at the chorus, the emotion escalating with the arrangement.",
            "Let the feeling overflow: where Cl\xE1sico holds the wound with dignity, Rom\xE1ntica lets it pour \u2014 the chorus is an unguarded, full-chested outpouring, so the big lines are allowed to be grand, direct, and unashamedly emotional.",
            "The verse advances, the chorus detonates: verse two must move the story of these two people forward \u2014 an answer, a memory, a turn \u2014 while the chorus stays the fixed emotional headline the whole song has been climbing toward and returns to intact.",
            "Write for a belter on the peaks: end the chorus and bridge feeling-lines on open, held vowels a big voice can sustain and swell; avoid hard consonant endings on the climaxes where the singer needs to open the throat and let go.",
            "The bridge is the highest window: plan a bridge that shifts the angle or raises the stakes and sets up the final, biggest chorus \u2014 often a key change or the loudest lift of the song, so write it to reach past everything before it.",
            "Rhyme full and satisfying: clean, resolved perfect rhyme that the ear hears coming and that lands square on the big beats \u2014 this is not the room for slant subtlety, the rhyme should feel as sure as the swell.",
            "Keep one true, specific image at the center of the user's own story so the grandeur has something real to be grand about \u2014 the actual person, the actual loss \u2014 because a huge chorus wrapped around a generic abstraction is exactly how this room becomes a parody.",
            "Cross-genre firewall: the swelling piano-and-strings arrangement carrying a lone voice up a dynamic arc from murmur to belt makes it a balada, not a bolero trio or a bachata \u2014 there is no requinto running call-and-answer as a second voice and no dance groove under it; the drama comes from orchestral dynamics and one singer opening up, not from a guitar answering or a floor to move."
          ],
          "rendering": "Grand romantic ballad \u2014 piano leading the harmony, a lush string section swelling underneath and blooming at the chorus, warm bass, tasteful soft drums entering to lift the big sections, occasional acoustic guitar color. Emotive lead vocal with a wide dynamic range, intimate and restrained in the verses and belting open on the choruses, backed by soaring harmony stacks at the peaks and a possible key change into the final chorus; polished, cinematic, 1970s-through-90s Spanish-language power-ballad production.",
          "storyFit": "Best for: a grand declaration of eternal love, a devastating heartbreak, an overwhelming longing, an apology poured out, a love worth a stadium-sized chorus, missing someone with everything. Poor fit: an intimate poised trio confession \u2014 that is Cl\xE1sico; an understated modern conversational ballad \u2014 that is Moderno; anything danceable, casual, or emotionally guarded, which this overflowing room cannot hold.",
          "parodyTraps": "Machine-added Spanish pet names the user never wrote; running the seduction-or-heartbreak cliche checklist instead of the couple's real details; a huge chorus wrapped around a generic abstraction with no specific person in it; a flat, even delivery that refuses the climb the whole room is built on; keeping a dignified restraint where the chorus is supposed to break open; strings-and-roses greeting-card grandeur with no true wound under it.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Harmonies] [Belt] [Key Change] [Emotional]. This room performs like one big voice climbing an orchestral swell \u2014 a solo lead carrying a wide dynamic arc, with harmony stacks arriving to lift the biggest moments, no crowd and no call-and-answer partner. Signature: the swell answered \u2014 the arrangement and the harmony stacks bloom underneath the voice as it opens up, so the peak lines are lifted by strings and stacked voices rather than by any traded response, the same chorus landing bigger each return. Placement: verses stay bare and close so the restraint reads, the first big harmony stack arrives on the first full chorus, the [Belt] lands where the voice finally lets go, and a [Key Change] can lift the final chorus higher than everything before it. Tag identity: a solo belter and a blooming orchestra \u2014 harmony stacks swelling on the choruses, a held belted peak where the feeling overflows, a key change reserved for the last chorus. No trio trade, no dance floor \u2014 one voice and the swell behind it, and every sung word is plain language from the user's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Harmonies]",
              "[Belt]",
              "[Key Change]",
              "[Emotional]"
            ]
          },
          "builder": {
            "instruments": [
              "piano",
              "cuerdas",
              "bajo",
              "percusi\xF3n suave",
              "guitarra espa\xF1ola"
            ],
            "themes": [
              "Amor eterno",
              "Desamor y p\xE9rdida",
              "Soledad",
              "Arrepentimiento",
              "Entrega total al amor"
            ],
            "purposes": [
              "Dedicar a un amor",
              "Llorar la p\xE9rdida",
              "Pedir perd\xF3n"
            ]
          }
        },
        {
          "id": "bolero-moderno",
          "name": "Bolero Moderno / Balada Pop",
          "oneLine": "The contemporary romantic ballad \u2014 the rubato bolero heart produced clean and current, sparser and more conversational, a plain modern line trusted over any grand gesture.",
          "tempoGroove": "60-85 BPM, still rubato and free with no dance pulse, but built on a spare modern frame \u2014 often just piano or a lone guitar with subtle contemporary production, a small swell reading as large because so little sits around it. Low word density with a conversational, understated shape: leave air and let the plain lines breathe, because the room trusts intimacy and restraint over density or a big arrangement.",
          "writingDials": [
            "Underplay it: this room states the feeling plainly and close, conversational rather than grand or poetic \u2014 trust a simple, true modern line over an elevated figure or an overflowing chorus, and let the restraint itself carry the weight.",
            "Keep the frame spare: write for piano or a single guitar with room around it, so the words are exposed and every one has to be honest \u2014 one real, understated image outweighs any ornament here.",
            "A small swell reads as large: the room can lift, but subtly \u2014 a modest rise into the chorus lands big precisely because the verses stayed so bare, so plan a gentle build rather than a stadium climax.",
            "Modern, natural diction: contemporary everyday language sung close to speech, sincere and unironic \u2014 this is the bolero feeling in a current voice, so avoid both the archaic formality of Cl\xE1sico and the belted grandeur of Rom\xE1ntica.",
            "Direct and present to one person: first person to a you at close conversational distance, saying the true thing simply \u2014 a plain confession, a quiet apology, a real goodbye, none of it dressed up.",
            "The hook is an understated returning line: a short, plain, memorable phrase re-sung with quiet feeling, deepening on each return rather than escalating \u2014 intimate, never a crowd chant or a belted climax.",
            "Anchor it in one specific, real detail from the user's own story so the modern plainness stays intimate and true and never slides into a faceless, generic contemporary ballad.",
            "Cross-genre firewall: the rubato ballad with no dance groove, produced spare and modern around the voice, makes it a bolero-descended balada, not a bachata or reggaeton \u2014 there is no g\xFCira, no bong\xF3, and no dembow boom-chick under it; if a dance groove appears, the room is gone, because this lane suggests and breathes and never moves a floor."
          ],
          "rendering": "Clean contemporary ballad \u2014 intimate piano or a single warm guitar leading, spare and modern, with subtle pads, light room, and maybe a soft understated beat or brushed percussion entering low; restrained modern bass. Close, natural lead vocal sung near to speech with tasteful light harmonies and a controlled, unforced delivery, a small dynamic lift into the chorus rather than a belt; polished, current, minimal production \u2014 the modern romantic-ballad sound, warm and uncluttered.",
          "storyFit": "Best for: a quiet contemporary love song, an understated heartbreak, a plain honest apology, a modern devotion, missing someone said simply, a real goodbye at close distance. Poor fit: an ornate formal trio bolero \u2014 that is Cl\xE1sico; a huge overflowing power-ballad climax \u2014 that is Rom\xE1ntica; anything danceable, communal, or grand, which this spare modern room deliberately refuses.",
          "parodyTraps": "Sprinkled Spanish phrases the user never wrote; a plain line mistaken for a lazy one \u2014 understatement still needs one true, specific detail; over-producing the spare frame until the intimacy is gone; forcing a belted climax the room is built to avoid; borrowing a famous ballad hook the user's story never contained; a faceless generic modern-ballad mood with no real person in it.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Soft] [Harmonies] [Intimate] [Emotional]. This room performs at close conversational distance \u2014 one natural, understated lead voice with tasteful light harmonies, a spare modern frame around it, no crowd, no belt, and no answering partner. Signature: the intimate lift \u2014 the voice stays close and plain and the arrangement gives a small, subtle swell into the chorus, so a modest rise reads as large against verses that stayed nearly bare, the understated hook deepening each return. Placement: verses sit almost unadorned so the plainness carries them; a light harmony double slips under the hook's last words, a soft header marks the closest moment, and the small lift into the final chorus is the biggest the song ever gets. Tag identity: an intimate modern lead with light self-harmonies \u2014 a soft harmony shadow on the hook, an [Intimate] header where the song pulls nearest, one gentle lift saved for the last chorus. No trio trade, no orchestral wall, no dance floor \u2014 one close voice and a spare frame, and every sung word is plain language from the user's own sheet.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Soft]",
              "[Harmonies]",
              "[Intimate]",
              "[Emotional]"
            ]
          },
          "builder": {
            "instruments": [
              "piano",
              "guitarra espa\xF1ola",
              "requinto",
              "bajo",
              "percusi\xF3n suave"
            ],
            "themes": [
              "Desamor y p\xE9rdida",
              "Nostalgia",
              "Soledad",
              "Arrepentimiento",
              "Recuerdos de un gran amor"
            ],
            "purposes": [
              "Enamorar despacio",
              "Recordar a alguien",
              "Pedir perd\xF3n"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "bolero",
          "strength": "strong",
          "roomId": "bolero-cl-sico"
        },
        {
          "cue": "tr\xEDo",
          "strength": "strong",
          "roomId": "bolero-cl-sico"
        },
        {
          "cue": "requinto",
          "strength": "strong",
          "roomId": "bolero-cl-sico"
        },
        {
          "cue": "los panchos",
          "strength": "strong",
          "roomId": "bolero-cl-sico"
        },
        {
          "cue": "amor eterno",
          "strength": "weak",
          "roomId": "bolero-cl-sico"
        },
        {
          "cue": "serenata",
          "strength": "weak",
          "roomId": "bolero-cl-sico"
        },
        {
          "cue": "rom\xE1ntico",
          "strength": "weak",
          "roomId": "bolero-cl-sico"
        },
        {
          "cue": "despedida",
          "strength": "weak",
          "roomId": "bolero-cl-sico"
        },
        {
          "cue": "nostalgia",
          "strength": "weak",
          "roomId": "bolero-cl-sico"
        },
        {
          "cue": "balada",
          "strength": "strong",
          "roomId": "balada-rom-ntica"
        },
        {
          "cue": "power ballad",
          "strength": "strong",
          "roomId": "balada-rom-ntica"
        },
        {
          "cue": "camilo sesto",
          "strength": "strong",
          "roomId": "balada-rom-ntica"
        },
        {
          "cue": "roc\xEDo d\xFArcal",
          "strength": "strong",
          "roomId": "balada-rom-ntica"
        },
        {
          "cue": "juan gabriel",
          "strength": "strong",
          "roomId": "balada-rom-ntica"
        },
        {
          "cue": "desamor",
          "strength": "weak",
          "roomId": "balada-rom-ntica"
        },
        {
          "cue": "heartbreak",
          "strength": "weak",
          "roomId": "balada-rom-ntica"
        },
        {
          "cue": "llorar",
          "strength": "weak",
          "roomId": "balada-rom-ntica"
        },
        {
          "cue": "pedir perd\xF3n",
          "strength": "weak",
          "roomId": "balada-rom-ntica"
        },
        {
          "cue": "balada pop",
          "strength": "strong",
          "roomId": "bolero-moderno"
        },
        {
          "cue": "bolero moderno",
          "strength": "strong",
          "roomId": "bolero-moderno"
        },
        {
          "cue": "ac\xFAstico",
          "strength": "strong",
          "roomId": "bolero-moderno"
        },
        {
          "cue": "modern ballad",
          "strength": "weak",
          "roomId": "bolero-moderno"
        },
        {
          "cue": "stripped",
          "strength": "weak",
          "roomId": "bolero-moderno"
        },
        {
          "cue": "\xEDntimo",
          "strength": "weak",
          "roomId": "bolero-moderno"
        },
        {
          "cue": "contempor\xE1neo",
          "strength": "weak",
          "roomId": "bolero-moderno"
        }
      ]
    },
    "poplatino": {
      "id": "poplatino",
      "name": "Pop Latino",
      "aliases": [
        "latin pop",
        "pop en espa\xF1ol",
        "pop en espanol"
      ],
      "profileText": "A pop latino writer starts from the chorus, because the coro is the event \u2014 the singalong a room already knows by the second pass, the thing the whole song is built to arrive at. Melody and hook come first; the verses exist to load the coro and pay it off, and a song whose chorus is not the high point of the writing has missed the genre before a word is judged. So the writing job is to protect the arrival: keep the verses lean enough to lift, leave the peak open enough to sing, and make the hook land as something you catch, not a sentence you decode.\n\nThe room is how the coro arrives, and choosing it is choosing the temperature of the story. Pop Latino Radial runs bright and up-tempo and lands the feeling on a group singalong at the top of the chorus. Balada Pop drops to mid-tempo, drives on piano, and lets one held note carry an empowerment or a heartbreak that climbs. Pop Urbano rides a leaning, off-the-beat groove with an 808 kept as flavor and lands the hook in the pocket, teased by a second voice. That one choice moves more dials than any other \u2014 tempo, word density, what carries the track, and who sings the chorus back \u2014 and topic alone can never pick it, because love, heartbreak turned to strength, summer, and missing someone run through all three.\n\nThe law above every dial is the voice. The lyrics are written in Spanish by the language layer later; this page writes craft in English and never fakes the flavor. Slang, endearments, and accent spellings appear only if the user wrote them in their own story \u2014 in the lyrics, adlibs, delivery directions, and render notes alike \u2014 and the Latin flavor is carried by melody, the leaning phrasing, and the groove, never by sprinkled vocabulary. The craft terms these pages teach with \u2014 coro, hook, dembow, urbano, singalong, half-time \u2014 are the writer's working tools, never the song's, and delivery is directed as energy, register, and phrasing in plain English, never as an accent or a nationality. And the postcard is not pop latino: beaches, palm trees, cocktails, and the Latin-lover clich\xE9 are the tourist parody the founder rejects \u2014 the user's own street, summer, person, and want are the song. Every dial bends to the user's story; none may change what it is about.",
      "defaultRoomId": "pop-latino-radial",
      "rooms": [
        {
          "id": "pop-latino-radial",
          "name": "Pop Latino Radial",
          "oneLine": "The mainstream radio lane \u2014 bright, up-tempo, and built so a room sings the coro back on the first pass.",
          "tempoGroove": "100-120 BPM, a driving pop kit with the kick pushing the song forward and a straight-to-lightly-syncopated feel, bright and open. Low-to-medium word density: verses stay lean and the chorus leaner, short phrases with real air so the singalong lands clean and a crowd can catch it fast.",
          "writingDials": [
            "The chorus is the whole event: write it to be singable after one hearing, the title landing at or near the top of the coro so the room knows where to come in \u2014 announced, gathered into, never buried.",
            "Phrases run short and open with gaps the melody rings through; a single repeated word or a short vocal shape can legitimately be a whole line in the coro, because the hook is a thing you sing along to, not a sentence you decode.",
            "The pre-chorus is a lift: lines shorten and the pace quickens as it climbs so the body feels the coro coming \u2014 a ramp, not a new plot beat.",
            "Rhyme is clean and mostly perfect, landing on open vowels the mouth catches easily at speed; clever slant rhyme reads as drag in a lane built for the first-listen singalong.",
            "Lean verses still carry the real story: verse one names the actual who and where from the user's own life in a handful of words, verse two adds what changed \u2014 a next step, a turn \u2014 never verse one reshuffled. Compression keeps the strongest details, it does not delete them; a verse thinner than the chorus has starved the song.",
            "The song stands on one real thing from the user's story \u2014 the specific street, the specific song on the radio, the specific summer \u2014 and the bright feeling attaches to it; a coro of floating feeling-words with nothing under it is this lane's exact parody.",
            "Plan the post-chorus payoff: one short vocal idea or a wordless singable shape decided at the writing stage, bigger each return, so the drop has a hook on it and is not left to production.",
            "Point of view is first person to a you who is present and named in the writer's mind; direct address and simple bright verbs feel natural \u2014 draw the verb type from the user's own story, never a stock list.",
            "Cross-genre firewall: the bright driving pop kit and a group singalong coro make it Radial, not Pop Urbano \u2014 Radial rides square-to-light on a pop drum, where Pop Urbano leans off the beat over a softened urbano bounce with an 808 under it; if the groove starts to grind and lean, the room has moved."
          ],
          "rendering": "Driving pop kit with a pushing kick, bright layered synthesizers and plucked hooks, piano under the chords, palmas lifting the choruses, light percusi\xF3n latina warming the groove. Polished melodic lead with tight doubles and a full stack of coros on the chorus and post-chorus; modern crossover radio-pop sheen, bright and wide, 2010s to now.",
          "storyFit": "Best for: singalong celebrations, new love and summer highs, confidence anthems, friendship, freedom \u2014 anything bright a room can shout back. Poor fit: heavy grief or ceremony that needs a held note and space to swell, which belongs to Balada Pop; a sensual leaning slow-groove moment, which is Pop Urbano.",
          "parodyTraps": "Cramming a full timeline into the verses; stacking generic party-scene props instead of the user's real moment; a coro of long clever sentences that dies of cleverness; forgetting the post-chorus so the drop lands with no vocal hook; any Spanish slang or endearment the user never wrote pasted on as flavor.",
          "performance": {
            "prose": "Density heavy; min adlibs 6; delivery tags [Build Up] [Drop] [Harmonies] [Post-Chorus]. This room performs like the whole radio singing at once \u2014 one polished lead riding the beat while a bright stack of coros waits for the hook to arrive. Signature: the singalong stack \u2014 the coro lands with the full stack singing the short lines together, then the post-chorus pays off into the one planned vocal idea, gathering voices and getting bigger on every return. Placement: verses stay clean and nearly bare, at most one echoed word, so the stack hits harder when it arrives; a [Build Up] header frames every chorus lift and a [Drop] or [Post-Chorus] header frames the payoff; the floor of 6 is met on hooks and post-choruses alone \u2014 stack echoes of the title, palmas direction lines, one short group shout \u2014 never by decorating the verses. Tag identity: a polished lead plus a bright singalong stack \u2014 sung stacked coros on every chorus line, palmas direction lines, stack echoes of the title on the post-chorus, one crowd singalong at the final coro. The stack sings tuned and bright, the verses belong to one voice, and every sung word is plain language from the user's own sheet.",
            "adlibDensity": "heavy",
            "minAdlibs": 6,
            "deliveryTags": [
              "[Build Up]",
              "[Drop]",
              "[Harmonies]",
              "[Post-Chorus]"
            ]
          },
          "builder": {
            "instruments": [
              "sintetizadores brillantes",
              "bater\xEDa pop",
              "piano",
              "palmas",
              "percusi\xF3n latina",
              "coros"
            ],
            "themes": [
              "Amor nuevo",
              "Amor de verano",
              "Sentirse libre",
              "Amistad"
            ],
            "purposes": [
              "Cantar a coro",
              "Celebrar",
              "Enamorar"
            ]
          }
        },
        {
          "id": "balada-pop",
          "name": "Balada Pop",
          "oneLine": "The emotional mid-tempo lane \u2014 piano-driven, built to swell, where empowerment and heartbreak both climb to a held note.",
          "tempoGroove": "72-92 BPM, straight feel or a gentle sway, drums often entering late and in half-time so the arrival feels bigger. Moderate word density: the slower tempo buys longer lines, but the peak moments stay open so the singer can hold and bend a note.",
          "writingDials": [
            "The chorus is still the event, but the title leans toward landing on the held peak \u2014 earned by the lines before it \u2014 where Radial announces it up front; if the user's own key phrase wants to open the coro, let it lead, so long as it feels arrived at, not chanted.",
            "Verses are storytelling rooms: fuller sentences, longer lines, more concrete detail from the user's story than the bright lane allows \u2014 the swell only earns its size if each verse buys it new meaning.",
            "Verse two is the second act: a new scene or a new understanding, never verse one slowed down; a ballad whose second verse only re-feels the first has no arc to climb.",
            "The pre-chorus works emotionally, not physically: it names the stakes and often goes quieter, instruments dropping out rather than piling on, so the coro can bloom.",
            "Dynamics are the architecture: verse one nearly spoken, chorus one restrained, final chorus wide open \u2014 write coro lines that survive being sung both whispered and huge, because they will be.",
            "The bridge is load-bearing: the confession, the decision, the turn toward strength lives there; a bridge that only restates the chorus louder is a loop, not a journey \u2014 and empowerment especially needs the bridge where the singer chooses herself.",
            "Plan the money note: end the key coro lines on open vowels the singer will hold for bars, and do not pack the peak so full of syllables that there is no room to hold and bend.",
            "Keep the big feeling tied to one thing you could photograph from the user's story \u2014 the specific door, the ring, the letter \u2014 because sky-and-weather abstraction is the greeting-card failure this lane slides into fastest, and here it is forbidden, not just discouraged.",
            "Cross-genre firewall: the piano foundation and a lead that swells alone to a held note make it Balada Pop, not the orchestral rubato bolero \u2014 this room is contemporary and hook-driven, the coro a modern singable event on a steady mid-tempo pulse, never a free-time bolero with a guitar and no chorus to build to."
          ],
          "rendering": "Piano foundation carrying the chords, guitarra el\xE9ctrica arriving clean for color, swelling strings or warm pads by the second chorus, bater\xEDa pop entering late with big half-time weight. Intimate close-mic lead early, stacked coros as harmonies late, and optionally a final-chorus key lift; timeless adult crossover-pop palette, 90s-diva-ballad warmth through modern piano-pop.",
          "storyFit": "Best for: love declarations, empowerment and self-worth, heartbreak and getting over a rupture, missing someone, tributes and anniversaries \u2014 any heavy or rising feeling that wants a held-note climb. Poor fit: bright party energy and casual fun, which belong to Radial; a sensual slow-groove sway, which is Pop Urbano.",
          "parodyTraps": "Every line at maximum emotion so there is no arc left to climb; greeting-card abstractions replacing the user's one concrete scene; a bridge that adds volume but no new information or no real turn; burying the held-note moments under piles of syllables; sprinkled Spanish endearments the user never wrote.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Soft] [Belting] [Harmonies] [Crescendo] [Big Finish]. This room performs like one voice in a big quiet space that slowly fills \u2014 the drama is one singer and how much air she finally takes up. Signature: the staged swell \u2014 verse one nearly spoken and bare, harmony coros arriving soft under chorus two, then the final chorus opening wide as the lead belts the held money note while stacked harmonies swell underneath, one singer growing, never a crowd joining. Placement: keep the verses and the bridge stripped to the lead, breaths kept in as part of the record; the sparse floor lives late \u2014 a soft harmony entrance on chorus two, an echoed last word into the bridge, the full swell under the [Big Finish]; a [Crescendo] header belongs only at the hand-off into the final chorus. Tag identity: a solo lead with swelling harmony coros \u2014 the harmonies are the same singer multiplied, entering in stages and blooming at the peak, no gang, no palmas, no answer voice; every sung word is plain language from the user's own sheet.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Soft]",
              "[Belting]",
              "[Harmonies]",
              "[Crescendo]",
              "[Big Finish]"
            ]
          },
          "builder": {
            "instruments": [
              "piano",
              "guitarra el\xE9ctrica",
              "bater\xEDa pop",
              "coros",
              "percusi\xF3n latina"
            ],
            "themes": [
              "Empoderamiento",
              "Desamor y superaci\xF3n",
              "Amor nuevo",
              "Extra\xF1ar a alguien",
              "Nostalgia"
            ],
            "purposes": [
              "Superar una ruptura",
              "Sentirse fuerte",
              "Enamorar"
            ]
          }
        },
        {
          "id": "pop-urbano",
          "name": "Pop Urbano",
          "oneLine": "The crossover lane with urbano flavor \u2014 a leaning mid-tempo groove and 808-tinged warmth, kept pop because the chorus is still the event.",
          "tempoGroove": "90-105 BPM over a softened urbano bounce \u2014 a leaning, off-the-beat feel with a warm 808-tinged low end, but never the full dembow club floor. Medium word density: phrases ride the syncopation, pushing early or dragging late, with real space left for the pocket and the answer to breathe.",
          "writingDials": [
            "The chorus is still the event, but it lands in the pocket: write a looping hook that circles back gathering heat each pass, closer to a sung chant you sway to than a banner you shout \u2014 pop keeps the hook melodic and central, urbano flavor keeps it leaning.",
            "Phrases push and pull against the beat instead of landing square: write lines that invite the singer to lean in early or drag late, where Radial wants the words on the grid.",
            "Repetition is welcome at a level the bright lane would call lazy: repeating one line or one word several times builds the trance here, so long as the coro stays the melodic payoff and does not collapse into a bare grind command.",
            "The pre-chorus is a lean-in, not a ramp: the beat thins, phrases shorten and come closer to the ear, the voice drops nearer to speech for two bars, then the hook loop returns and the sway gets bigger.",
            "Subject treatment lingers in slow motion: the song holds one person, one night, one feeling and notices small physical detail from the user's story, verse two moving closer rather than traveling through time \u2014 new information each pass while the hook circles, every line tied to something real (the jacket, the balcony, the text left on read).",
            "Rhyme leans on repeated vowel sounds more than hard end rhymes: the same open vowel ringing at line-ends suits the roll of the groove better than snapping consonants.",
            "Plan the second voice: which words get echoed and which lines get answered is a writing decision, and here the answer voice flirts and warms rather than shouts.",
            "Point of view is first person to a present you; keep the register confident and close, and let the flavor live in the phrasing and the pocket, never in vocabulary the user did not reach for.",
            "Cross-genre firewall: the softened bounce with the 808 kept as flavor and a melodic sung coro make it Pop Urbano, not reggaet\xF3n \u2014 the full dembow floor never takes over, the hook stays a pop singalong rather than a grind command, and the groove serves the chorus instead of the chorus serving the floor."
          ],
          "rendering": "Softened urbano bounce with a warm 808-tinged bass, syncopated piano or guitarra el\xE9ctrica stabs, bright synthesizer plucks, light percusi\xF3n latina, airy pads. Smooth melodic lead with light echo answers and a second voice replying on the hook; modern urbano-tinged crossover-pop polish, 2015 to now, kept bright and radio-clean rather than dark club.",
          "storyFit": "Best for: romance and flirtation that sways, summer warmth, missing someone at close distance, a confident close-dance celebration. Poor fit: a bright jump-and-shout party, which is Radial; a heavy held-note swell of grief or empowerment, which is Balada Pop; a full club grind, which routes out to reggaet\xF3n.",
          "parodyTraps": "Sprinkling Spanish slang the user never wrote, the fastest way to sound like a costume; stacking beach-and-cocktail props instead of the user's own moment; writing square on-the-beat lines that fight the groove; letting the beat take over so the hook becomes a bare grind command and the pop chorus disappears; treating the lane as Radial with different drums when the phrasing must actually lean.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Call and Response] [Harmonies] [Groove] [Soft]. This room performs like two people swaying close while the rhythm listens in \u2014 a duet-shaped record even when only one name is on it. Signature: the flirting reply \u2014 a second voice answering the open ends of lines in the syncopated gaps the writing left, and echoing the looping hook a beat late, teasing and warm instead of shouting, a little hotter on every pass. Placement: replies sit only in the written gaps, never on top of the lead, roughly one answer every few lines in the verses, with the echoes thickening as the hook circles; a [Groove] header can hand the pocket the last word for a bar, and the pre-chorus lean-in stays reply-free so the return of the loop feels bigger. Tag identity: the lead plus one flirting answer voice \u2014 soft replies at phrase ends, hook echoes a beat behind, light harmony coros on the loop's final passes, a percussion-breath direction line where the groove answers instead. A conversation for two, never a crowd, never a full stack, every echoed word from the user's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Call and Response]",
              "[Harmonies]",
              "[Groove]",
              "[Soft]"
            ]
          },
          "builder": {
            "instruments": [
              "percusi\xF3n latina",
              "guitarra el\xE9ctrica",
              "piano",
              "sintetizadores brillantes",
              "coros",
              "bater\xEDa pop"
            ],
            "themes": [
              "Amor nuevo",
              "Amor de verano",
              "Extra\xF1ar a alguien",
              "Sentirse libre"
            ],
            "purposes": [
              "Bailar",
              "Enamorar",
              "Celebrar"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "pop latino",
          "strength": "strong",
          "roomId": "pop-latino-radial"
        },
        {
          "cue": "radial",
          "strength": "strong",
          "roomId": "pop-latino-radial"
        },
        {
          "cue": "coro pegajoso",
          "strength": "strong",
          "roomId": "pop-latino-radial"
        },
        {
          "cue": "singalong",
          "strength": "weak",
          "roomId": "pop-latino-radial"
        },
        {
          "cue": "cantar a coro",
          "strength": "weak",
          "roomId": "pop-latino-radial"
        },
        {
          "cue": "fiesta",
          "strength": "weak",
          "roomId": "pop-latino-radial"
        },
        {
          "cue": "verano",
          "strength": "weak",
          "roomId": "pop-latino-radial"
        },
        {
          "cue": "upbeat",
          "strength": "weak",
          "roomId": "pop-latino-radial"
        },
        {
          "cue": "balada pop",
          "strength": "strong",
          "roomId": "balada-pop"
        },
        {
          "cue": "empoderamiento",
          "strength": "strong",
          "roomId": "balada-pop"
        },
        {
          "cue": "superaci\xF3n",
          "strength": "strong",
          "roomId": "balada-pop"
        },
        {
          "cue": "desamor",
          "strength": "weak",
          "roomId": "balada-pop"
        },
        {
          "cue": "heartbreak",
          "strength": "weak",
          "roomId": "balada-pop"
        },
        {
          "cue": "balada",
          "strength": "weak",
          "roomId": "balada-pop"
        },
        {
          "cue": "extra\xF1ar",
          "strength": "weak",
          "roomId": "balada-pop"
        },
        {
          "cue": "fuerza",
          "strength": "weak",
          "roomId": "balada-pop"
        },
        {
          "cue": "pop urbano",
          "strength": "strong",
          "roomId": "pop-urbano"
        },
        {
          "cue": "urbano",
          "strength": "strong",
          "roomId": "pop-urbano"
        },
        {
          "cue": "flow",
          "strength": "strong",
          "roomId": "pop-urbano"
        },
        {
          "cue": "perreo suave",
          "strength": "weak",
          "roomId": "pop-urbano"
        },
        {
          "cue": "sensual",
          "strength": "weak",
          "roomId": "pop-urbano"
        },
        {
          "cue": "bailar pegado",
          "strength": "weak",
          "roomId": "pop-urbano"
        },
        {
          "cue": "groove",
          "strength": "weak",
          "roomId": "pop-urbano"
        }
      ]
    },
    "latintrap": {
      "id": "latintrap",
      "name": "Latin Trap / Trap Latino",
      "aliases": [
        "latin trap",
        "trap latino",
        "traplatino",
        "trap en espa\xF1ol",
        "trap en espanol"
      ],
      "profileText": "A Latin trap writer starts with the low end \u2014 a deep 808 sliding under a half-time crawl, hi-hats rolling in tresillos, the tempo felt slow and heavy even when the count is fast. The 808 and the tresillo, not the dembow, are the identity: this is a crawl, not a bounce, and the writing job is rhythmic before it is verbal. Scan every line against that half-time pocket, ride just behind the beat, and leave the gaps where the 808 slides and the ad-lib stabs \u2014 filling every bar kills the drag that makes it trap. The space is the cold.\n\nThe delivery is the room. Trap de Calle raps the street cold and hard, the block and the pride stated flat over air. Trap Mel\xF3dico / Rom\xE1ntico sings the ache through autotune, thinning the verses so a melodic hook lifts on held vowels \u2014 the toxic-love crossover. Trap Flow / Flex packs the densest bars and boasts the come-up as fact, the crew snapping the hook back. That one choice \u2014 rapped-cold, sung-wounded, or bars-forward \u2014 moves more dials than any other: it sets density, how much melody rides, whether the hook hammers or soars, and who answers on top of the 808. Topic alone never picks it, because the block, the money, and a toxic love run through all three.\n\nThe law above every dial is the story, and the hardest law is what the song may not add. The lyrics are written in Spanish by the language layer later \u2014 this page writes craft in English, and it never fakes the dialect. Slang, calle vocabulary, and accent spellings appear ONLY if the user wrote them, in lyrics, adlibs, delivery directions, and render notes alike. The craft terms these pages teach with \u2014 trap, 808, tresillo, flow, flex, ad-lib \u2014 stay out of the song unless the user reached for them first, and delivery is directed as cold, menace, bounce, and swagger in plain English, never as an accent, a nationality, or manufactured slang. Latin trap can carry a hard, cold, streetwise flex \u2014 but the craft is the flow and the swagger serving the user's real story: a come-up, ambition, a toxic love, proving them wrong. If the user brought no darkness, the song has none. Inventing guns, drugs, or crime the user never wrote is the cardinal sin \u2014 the fastest way to make the record a lie.",
      "defaultRoomId": "trap-de-calle",
      "rooms": [
        {
          "id": "trap-de-calle",
          "name": "Trap de Calle",
          "oneLine": "The hard street core \u2014 cold bars over a deep 808, the block, the stare, pride and menace stated flat, the Anuel-and-Bryant-Myers lane where the trap is a stone face.",
          "tempoGroove": "128-142 BPM felt in a heavy half-time crawl \u2014 the count is fast but the pocket drags heaviest of the three rooms, a deep 808 sliding under hi-hats rolling in tresillos, the snare or clap landing slow on the backbeat. Word density is medium and menacing: hard economical phrases that ride just behind the beat, then air where the ad-lib or the 808 answers \u2014 never wall-to-wall, because the space is the cold.",
          "writingDials": [
            "Bars lead, told cold: this room states the street plain \u2014 the block that raised you, the pride, the desconfianza, the loyalty and the betrayal \u2014 flat and unbothered as fact, never explained. The moment a hard line gets justified it goes soft.",
            "Write in the crawl, leave the gaps: land a short hard phrase and stop, because the gap is where the 808 slides and the ad-lib stabs \u2014 filling every bar breaks the half-time drag that makes it trap.",
            "NEVER invent violence, weapons, drugs, or crime the user did not write. Trap de Calle names the cold ENERGY and the street stare, not a subject requirement \u2014 the craft is the menace in the flow and the swagger in the restraint. If the user brought no darkness, the song has none; a hungry come-up or a cold kiss-off, told with full street weight, is exactly this room.",
            "Point of view is a real person who has seen it: first person, present or past, direct \u2014 name the block, the people, the debt, the ones who doubted, specific to whoever the user actually stood with.",
            "Menace is understatement: the threat that reads coldest is the one stated quietest and left unfinished \u2014 the room trusts the low end and the stare to carry the weight, so a line that shouts loses more than it gains.",
            "Hammer one rhyme sound across a run of lines on purpose: riding the same end-sound in the crawl builds pressure and cold, where a busy scheme would scatter it.",
            "The hook is a short cold line the crew can mutter back, not a sung lift: a blunt phrase of a few words, repeated until it lands like a fact, gaining weight each round rather than resolving.",
            "Cross-genre firewall: what makes it THIS room and not Reggaet\xF3n is the deep 808 and the tresillo hats in a half-time crawl, NOT the dembow's boom-ch-boom-chick with the snare on the offbeat \u2014 the moment the bounce turns into a four-count perreo snap the room is gone. And the low end is the 808, not corrido tumbado's tuba, with no requinto or acoustic strings anywhere near it."
          ],
          "rendering": "Deep sliding 808 sub carrying the low end, hi-hats rolling in tresillos with fast stutter rolls, slow hard snare or clap on the backbeat, dark minor synth lead and oscuro pads, half-time trap crawl, sparse and heavy. Cold up-front male lead rapped just behind the beat with a hard ad-lib track stabbing the gaps and light autotune edge; modern Latin trap production, low end mixed to press, no dembow, no acoustic strings.",
          "storyFit": "Best for: the block and the street, cold pride, desconfianza, loyalty and betrayal, a hard-eyed come-up, proving them wrong, a kiss-off with no warmth in it. Poor fit: tender heartbreak and longing (that is Mel\xF3dico), pure party lift, worship \u2014 the crawl wants cold nerve, not a sweet melody or a plot to walk through.",
          "parodyTraps": "Invented guns, drugs, or crime the user never wrote \u2014 the number-one tell; a dembow bounce or a perreo snap pasted under it; a requinto, tuba, or any acoustic string, which drags it toward tumbado; brand-name shopping-list flexes with no real detail; a sung stadium hook where a cold muttered line belongs; confusing loud with hard \u2014 real menace is quiet and economical.",
          "performance": {
            "prose": "Density heavy; min adlibs 4; delivery tags [Spoken] [Ad-Lib Section] [Drop] [Shout]. This room performs like a lead and his own second self behind him \u2014 the rapper states it cold and his ad-lib track answers, no crowd, no hype circus. Signature: the stabbed ad-lib \u2014 a hard line lands and in the gap the second track answers with a short echo of the key word or a low cold burst, exact and unbothered, never stepping on the next bar. Placement: ad-libs live in the gaps the crawl leaves and thicken under the hook's returns; a low spoken aside can open the record or drop where the stare hardens; a [Drop] frames the 808 sliding back in under the hook. Tag identity: the lead and his own ad-lib track \u2014 a cold echo of the key word after bars, a low sharp burst on the hardest lines, a muttered doubled hook. Every ad-lib and shout is menace and energy in plain English \u2014 a cold burst, a hard echo \u2014 never phonetic spelling and never an invented accent or slang beyond what the user wrote.",
            "adlibDensity": "heavy",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Spoken]",
              "[Ad-Lib Section]",
              "[Drop]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "808 profundo",
              "hi-hats en tresillos",
              "pads oscuros",
              "sintetizador melanc\xF3lico",
              "efectos y ad-libs",
              "piano sombr\xEDo"
            ],
            "themes": [
              "La calle y el bloque",
              "Lealtad y traici\xF3n",
              "Desconfianza",
              "Vicios y noche"
            ],
            "purposes": [
              "Desahogar la calle",
              "Encarar a alguien",
              "Contar mi historia",
              "Flexear el logro"
            ]
          }
        },
        {
          "id": "trap-mel-dico",
          "name": "Trap Mel\xF3dico / Rom\xE1ntico",
          "oneLine": "The sung, autotuned crossover \u2014 deep 808 under real feeling, the toxic love and heartbreak lane where the melody leads and the ache is bent through tune, the early-Bad-Bunny melodic wave.",
          "tempoGroove": "130-145 BPM in the same half-time crawl but felt softer \u2014 the 808 stays deep, the tresillo hats stay, but the snare eases and a dark melodic synth opens so a sung line can ride on top. Low-to-medium word density: verses thin and the hook breathes with sung, autotuned lines that hold and bend, so the chorus lifts on open vowels instead of hammering.",
          "writingDials": [
            "Feeling leads, sung through tune: this room carries the ache \u2014 a toxic love, a heartbreak, missing someone who was bad for you, wanting them back knowing better. The 808 still crawls, but the song is about one person and how they wreck the singer, not a threat to the block.",
            "Write a melodic hook that lifts, not a cold line that hammers: the chorus is a sung ache built to soar on autotuned held vowels \u2014 end the feeling-lines on sounds a voice can slide and bend, and let the melody and the tune do the lifting, not the word-count.",
            "Thin the verses so the chorus can breathe: verses sit lower and more spoken-melodic to set up the lift; the density drop between verse and hook IS the drama, the opposite of Calle's flat cold crawl.",
            "Verse two must move the story of these two people forward \u2014 a memory, an answer, a turn, the next night it fell apart \u2014 never re-circle verse one's feeling; the melody repeats, the story advances.",
            "Toxic is the register, not cruelty: this lane lives in the push-pull \u2014 pride and need in one breath, blaming her and still calling, cold and wrecked at once. Let the contradiction stand; do not sand it into pure sweetness or pure spite.",
            "NEVER invent drugs, vice, or self-destruction the user did not write \u2014 do not reach for drowning-the-heartbreak imagery the user never brought. If the loss is a person, a distance, a toxic on-and-off, that is the whole of it.",
            "Keep one detail only the real person would recognize: the melodic trap dies as autotuned greeting-card sweetness the second it stops being about a specific someone from the user's story.",
            "Cross-genre firewall: the dial that keeps it Latin trap and not Reggaet\xF3n Rom\xE1ntico is the half-time 808 crawl and the tresillo hats under the melody \u2014 NOT a softened dembow bounce; a sung love song riding the boom-ch-boom-chick is rom\xE1ntico reggaet\xF3n, not this room. And there is no requinto and no acoustic guitar, which would pull it into corrido sad \u2014 the melody is a dark synth over the 808."
          ],
          "rendering": "Deep 808 sub in a softened half-time crawl, hi-hats in tresillos eased back, dark melodic synth lead and lush oscuro pads opening the top, gentle synth arpeggios or sombr\xEDo piano under the hook. Melodic male lead sung through visible autotune, stacked harmony doubles lifting the chorus and generous air, a falsetto edge on the peaks; modern melodic-trap polish \u2014 deep, moody, the crawl still felt but never harsh, no dembow, no acoustic strings.",
          "storyFit": "Best for: toxic love, heartbreak, missing an ex who was bad for you, an on-and-off, longing, an apology with an edge, wanting them back against your own pride. Poor fit: hard street menace (that is Calle), pure boasting, party commands \u2014 the feeling needs room the cold crawl and the flex will not give it.",
          "parodyTraps": "Adding vice or drug melancholy the user never wrote; deleting the 808 crawl for a dembow bounce or a piano ballad bed; greeting-card devotion with no specific person in it; a hook that mutters cold like a street line instead of soaring; faked slang dropped into a tender song; a belted power chorus where an autotuned ache belongs.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Melodic] [Harmonies] [Drop] [Falsetto]. This room performs like one melodic lead multiplied by his own harmonies over a deep crawl \u2014 warmer and closer than Calle, with soft doubles instead of a cold ad-lib stab. Signature: the harmony lift \u2014 the lead sings the hook and stacked self-harmonies swell under the last words, thickening the ache through tune rather than a crowd. Placement: verses stay nearly bare with at most a breathed double so the story reads clean, then the harmonies bloom on the pre-hook and stack fullest on the chorus lift; a [Drop] can mark the 808 opening back up under the first chorus, and a [Falsetto] rise is saved for the final chorus where the feeling peaks. Tag identity: a melodic lead and his own harmony stack \u2014 soft echoes of the hook's last words, a saved [Falsetto] lift, warm autotuned ad-libs answering the melody; no crowd, no cold stab, and every echoed word comes from the song's own sheet, directed as feeling and melody in plain English, never as an accent or faked slang.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Melodic]",
              "[Harmonies]",
              "[Drop]",
              "[Falsetto]"
            ]
          },
          "builder": {
            "instruments": [
              "808 profundo",
              "sintetizador melanc\xF3lico",
              "pads oscuros",
              "hi-hats en tresillos",
              "piano sombr\xEDo",
              "efectos y ad-libs"
            ],
            "themes": [
              "Amor t\xF3xico",
              "Desconfianza",
              "Lealtad y traici\xF3n",
              "Vicios y noche"
            ],
            "purposes": [
              "Contar mi historia",
              "Desahogar la calle",
              "Encarar a alguien",
              "Prender el ambiente"
            ]
          }
        },
        {
          "id": "trap-flow",
          "name": "Trap Flow / Flex",
          "oneLine": "The bars-and-boasts come-up lane \u2014 the densest flow over the 808, the flex of having made it out told cold and confident, the crew shouting the hook back, the hustle-pride room.",
          "tempoGroove": "140-152 BPM felt in the half-time bounce \u2014 the 808 slides hard, the tresillo hats run fast with stutter rolls, the pocket bounces highest and brightest where Calle drags. Word density is medium-high and bursty: dense punchy bars with swagger, then a beat of air where the ad-lib or the 808 answers, built so the flow rides just off the beat and the hook lands as a chant.",
          "writingDials": [
            "Flex leads, told cold: this room boasts the come-up \u2014 money made, the hunger it took, the doubt proved wrong, the block that raised you \u2014 stated flat and confident as fact, never explained. The moment a flex gets justified it dies.",
            "Write dense bars, then leave the gap: pack the flow with internal rhyme and swagger, but land the punch and stop so the ad-lib or the crew can crack the space \u2014 filling every bar buries both the hook and the bounce.",
            "Ride one rhyme sound through a run on purpose: hammering the same end-sound builds momentum and cocky pressure here, where most lanes would read it as lazy.",
            "The detail is the user's OWN: swagger only lands when the work, the win, the come-up, the name are real and specific \u2014 generic luxury inventory is how two users end up with the same song, which is failure. No brand-name shopping lists.",
            "NEVER invent drugs, weapons, or crime the user did not write \u2014 this room's hard edge is the flex of the come-up and the cold confidence of proving them wrong, not a crime r\xE9sum\xE9. A clean flex told with full swagger is exactly the room; imported darkness is parody and worse.",
            "The hook is the simplest chant in the song: a short blunt boast the crew shouts back and it returns often \u2014 momentum comes from the hook coming back, not from a build, so keep it short enough to snap back on the second pass.",
            "Present tense and cocky: the win is happening NOW \u2014 the come-up stated as a standing fact, swagger and hustle-pride flat and unbothered, a boast that gets softened or explained already dead.",
            "Cross-genre firewall: what makes it THIS room and not Tumbado Flex is that the 808 and the tresillo hats run the whole floor \u2014 there is no requinto and no walking tuba, no acoustic strings leading in Spanish tumbado phrasing; the moment a requinto answers the flow or a tuba walks the bass it has left Latin trap for corrido. And the pocket is the half-time trap bounce, not the dembow's boom-ch-boom-chick."
          ],
          "rendering": "Hard sliding 808 sub, fast tresillo hi-hats with stutter rolls, punchy trap snare and claps, dark synth stabs and oscuro pads, half-time bounce, hard and confident. Modern male lead rapping dense bars just off the beat, dry and up-front with a stacked ad-lib track echoing key words and a crew shouting the hook; modern Latin trap flex production, low end mixed to hit, no acoustic strings, no dembow.",
          "storyFit": "Best for: the come-up flexed, money and ambition, the hunger and the hustle, proving them wrong, pride in the block, a glow-up stated cold, hyping the grind. Poor fit: tender heartbreak (that is Mel\xF3dico), cold quiet street menace held still (that leans Calle), worship \u2014 the bounce wants confident bars, not ache or a slow stare.",
          "parodyTraps": "Inventing drugs, guns, or crime the user never wrote \u2014 the number-one tell; brand-name shopping-list flexes with no real detail; a requinto or tuba creeping in, which crosses it into tumbado; writing ad-libs into every line like punctuation; forcing triplets onto every bar; a dembow bounce under the flow; confusing loud with confident \u2014 real flex is cold and economical.",
          "performance": {
            "prose": "Density heavy; min adlibs 4; delivery tags [Ad-Lib Section] [Shout] [Drop] [Spoken]. This room performs as a lead and his own hype behind him, with the crew close by \u2014 the rapper drops the flex and his ad-lib track answers, the crew snapping the hook back. Signature: the punctuation ad-lib \u2014 a burst lands and in the gap the second track answers with an echo of the key word or a sharp hype burst, cold and exact, never stepping on the next phrase. Placement: ad-libs live in the gaps the bursts leave and thicken under the hook's returns; crew shouts crack the hardest flex lines and snap the chant back on every hook return; a [Drop] can frame the hook slamming in, and a low spoken aside can open the record. Tag identity: the lead, his own second self, and the crew \u2014 an echo of the key word after bursts, sharp hype shouts on the flex lines, a crew-shouted chant hook. Every ad-lib and shout is energy and swagger in plain English \u2014 a burst of hype, a hard echo \u2014 never phonetic spelling and never an invented accent or slang beyond what the user wrote.",
            "adlibDensity": "heavy",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Ad-Lib Section]",
              "[Shout]",
              "[Drop]",
              "[Spoken]"
            ]
          },
          "builder": {
            "instruments": [
              "808 profundo",
              "hi-hats en tresillos",
              "sintetizador melanc\xF3lico",
              "pads oscuros",
              "efectos y ad-libs",
              "piano sombr\xEDo"
            ],
            "themes": [
              "Dinero y ambici\xF3n",
              "La lucha y el hambre",
              "Presumir lo conseguido",
              "La calle y el bloque"
            ],
            "purposes": [
              "Flexear el logro",
              "Motivar al que lucha",
              "Contar mi historia",
              "Prender el ambiente"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "trap de calle",
          "strength": "strong",
          "roomId": "trap-de-calle"
        },
        {
          "cue": "la calle",
          "strength": "strong",
          "roomId": "trap-de-calle"
        },
        {
          "cue": "el bloque",
          "strength": "strong",
          "roomId": "trap-de-calle"
        },
        {
          "cue": "fr\xEDo",
          "strength": "weak",
          "roomId": "trap-de-calle"
        },
        {
          "cue": "lealtad",
          "strength": "weak",
          "roomId": "trap-de-calle"
        },
        {
          "cue": "desconfianza",
          "strength": "weak",
          "roomId": "trap-de-calle"
        },
        {
          "cue": "come-up",
          "strength": "weak",
          "roomId": "trap-de-calle"
        },
        {
          "cue": "cold",
          "strength": "weak",
          "roomId": "trap-de-calle"
        },
        {
          "cue": "trap mel\xF3dico",
          "strength": "strong",
          "roomId": "trap-mel-dico"
        },
        {
          "cue": "amor t\xF3xico",
          "strength": "strong",
          "roomId": "trap-mel-dico"
        },
        {
          "cue": "desamor",
          "strength": "strong",
          "roomId": "trap-mel-dico"
        },
        {
          "cue": "autotune",
          "strength": "weak",
          "roomId": "trap-mel-dico"
        },
        {
          "cue": "coraz\xF3n",
          "strength": "weak",
          "roomId": "trap-mel-dico"
        },
        {
          "cue": "te extra\xF1o",
          "strength": "weak",
          "roomId": "trap-mel-dico"
        },
        {
          "cue": "toxic",
          "strength": "weak",
          "roomId": "trap-mel-dico"
        },
        {
          "cue": "heartbreak",
          "strength": "weak",
          "roomId": "trap-mel-dico"
        },
        {
          "cue": "flex",
          "strength": "strong",
          "roomId": "trap-flow"
        },
        {
          "cue": "trap flow",
          "strength": "strong",
          "roomId": "trap-flow"
        },
        {
          "cue": "dinero",
          "strength": "strong",
          "roomId": "trap-flow"
        },
        {
          "cue": "ambici\xF3n",
          "strength": "weak",
          "roomId": "trap-flow"
        },
        {
          "cue": "el hambre",
          "strength": "weak",
          "roomId": "trap-flow"
        },
        {
          "cue": "presumir",
          "strength": "weak",
          "roomId": "trap-flow"
        },
        {
          "cue": "glow-up",
          "strength": "weak",
          "roomId": "trap-flow"
        },
        {
          "cue": "hustle",
          "strength": "weak",
          "roomId": "trap-flow"
        }
      ]
    },
    "flamencorumba": {
      "id": "flamencorumba",
      "name": "Flamenco / Rumba",
      "aliases": [
        "flamenco",
        "rumba",
        "rumba flamenca",
        "rumba catalana",
        "nuevo flamenco"
      ],
      "profileText": "A flamenco writer starts with the comp\xE1s \u2014 the rhythmic cycle, often twelve beats, counted not by a click but by clapping palmas, and everything answers to it. The cante rides that cycle over the flamenco guitar, and the writing job is rhythmic and spatial before it is verbal: scan each line against the comp\xE1s, land the stressed syllables where the cycle wants them, and end phrases early so the guitar can cry its reply in the gap. A sheet packed wall-to-wall, with no air for the guitar to answer and no room for the voice to hold and break, has failed before its first word is judged. The palmas are the pulse the whole song sits inside; lose them and the flamenco is gone.\n\nThe tradition the genre was built to carry is the quej\xEDo \u2014 the cry, the wound of grief, exile, or a ruined love worn open in the voice. That is the emotional root, but the three rooms wear it three different ways, and choosing the room is choosing how nakedly the cry shows and to whom. Puro cries it wide open \u2014 the deep song, cante jondo, on a slow elastic cycle where a line hangs on a held note and the guitar answers like a second mourner, no dignity kept and no crowd to please. Rumba turns the cycle festive and four-square and hands the feeling to a clapping circle \u2014 the Gipsy Kings party lane, warmth and joy sung outward, the guitars and palmas driving a fiesta. Fusi\xF3n keeps a real comp\xE1s under a modern beat and styles the cry into a contemporary hook \u2014 the Rosal\xEDa-adjacent lane, composure and attitude over a flamenco root, the melisma carried into a pop shape. Not one cycle but a family of compases carrying the same cante; different amount of grief shown, different distance to the listener.\n\nThe law above every dial is language and voice. The lyrics are written in Spanish later; the writer works in plain English and never invents accent spellings, gitano slang, or Andalusian flavor to costume the song \u2014 only the user's own words survive, and the identity is carried by the comp\xE1s, the phrasing, and the guitar's answer, never by sprinkled vocabulary. Faked phonetics are the cardinal sin. The jaleo \u2014 the encouraging shouts a room throws to lift the cante \u2014 is legitimate energy, but directed as emotion and support in plain English, never as phonetic costume. Craft words the writer thinks with \u2014 comp\xE1s, palo, quej\xEDo, jaleo, sole\xE1, buler\xEDa, cante jondo, palmas \u2014 stay out of the lyrics, adlibs, and render notes unless the user wrote them first. And the postcard is not flamenco: castanets, roses, swirling dresses, and generic Spanish-guitar romance are the tourist parody the founder rejects; the user's own grief, fiesta, name, and place are the song.",
      "defaultRoomId": "flamenco-puro",
      "rooms": [
        {
          "id": "flamenco-puro",
          "name": "Flamenco Puro",
          "oneLine": "The deep song of the Andalusian gitano tradition \u2014 cante jondo cried open over the flamenco guitar, the rawest grief with no groove to soften it, sung to the few who understand rather than a crowd to please.",
          "tempoGroove": "Slow and elastic, the comp\xE1s stretched and held rather than counted fast \u2014 many palos sit rubato, the singer bending time so a line can hang on a single held note; sparse dark palmas mark the cycle where they land at all. Low word density: short cried phrases with long air after them, because the guitar answers the voice in the gap and the singer needs room to break and hold \u2014 a sheet packed wall-to-wall has smothered the cry that defines the form.",
          "writingDials": [
            "The guitar is the second voice and it answers the cry: end phrases early and leave the line hanging so the guitar can reply in the open space, and plan the stretch where the voice holds one note and the strings carry underneath \u2014 the lyric is built around that space, not over it.",
            "Cry it wide open with no dignity kept: this room is the deepest grief worn undefended \u2014 death, exile, a love that ruined you, the weight of a whole life \u2014 sung plainly and to the edge of breaking. Restraint is the wrong instinct here; the deep song says the whole wound.",
            "Write short and exposed: with so little holding the song up, every word is naked, so one true image outweighs a pretty generality and a plain line cried straight outranks any clever turn.",
            "Repetition is grief gathering, not a chorus: a short heartbroken phrase returns and returns, each pass heavier with the same wound rather than resolving it \u2014 the form re-cries a line the way mourning circles back.",
            "Let the melody bend and hold: write feeling-lines that end on open vowels the voice can stretch, ornament, and break on, because the deep song lives in the held note and the melisma, never in a tidy rhyme landing square.",
            "Serve the darkest register the user actually brought \u2014 real loss, real longing, real pride carried through pain: the deep song is the voice of a people's endurance, so honor the weight, and never manufacture a suffering the story never held.",
            "Address is inward or to one who is gone: mourning to oneself, calling to the absent, remembering out loud \u2014 a first person collapsing in the open, not a performance aimed at a room.",
            "Cross-genre firewall: the slow elastic comp\xE1s with sparse palmas and the raw cried cante over flamenco guitar is what makes it Puro, not a generic Spanish-guitar romance \u2014 that lane is pretty, metered, and pleasant; this room is a grief cried open on an unhurried cycle, wound over melody, air over words."
          ],
          "rendering": "Usually solo flamenco guitar answering every vocal line with dark falseta runs and picado (single-note lines) plus rasgueado, sparse hand palmas sordas marking the cycle low and dry, an occasional caj\xF3n felt rather than driving \u2014 but the rawest jondo (martinete, ton\xE1, saeta) is sung a palo seco, voice alone with palmas or a hammer and no guitar at all, and this room allows that too. Raw impassioned lead vocal pushed to the edge of breaking, heavy ornamentation and held notes, no doubling, dry intimate room sound; deep traditional Andalusian cante feel, no gloss, no synths.",
          "storyFit": "Best for: deep grief, mourning the dead, exile and longing for home, a love that ruined you, pride carried through suffering, the weight of a hard life. Poor fit: celebration and party joy of any kind \u2014 that is Rumba; a modern styled hook \u2014 that is Fusi\xF3n; light flirtation or easy contentment, which this room has no register for.",
          "parodyTraps": "Castanets, roses, and swirling-dress tourist scenery standing in for real grief; any Spanish word the user never wrote pasted in as flavor; making the cry pretty and tidy instead of raw; filling the guitar's answer gaps with words; keeping a composed dignified distance when the whole point is the wound cried open.",
          "performance": {
            "prose": "Density sparse; min adlibs 3; delivery tags [Guitar Solo] [Instrumental Break] [Soft] [Melancholy]. This room performs like one soul crying to a room that understands \u2014 a single raw lead voice and the flamenco guitar answering it like a second mourner, no crowd, no polish. Signature: the guitar answer \u2014 the strings cry back the emotion of the line in the space the phrasing leaves, so the grief is stated twice, once in words and once in the guitar, and a low encouraging shout from the few present can rise where the cry peaks. Placement: the guitar answers land at the line-ends the singer leaves open, roughly one per phrase; a [Guitar Solo] or [Instrumental Break] header takes the stretch where the words stop and the guitar carries the grief; the final cries push hardest and hold longest. Tag identity: a lone grieving voice and its answering guitar \u2014 the strings as the second mourner, sparse dark palmas marking the cycle, a quiet encouraging shout of support from the few who understand, directed as raw energy in plain English. No group, no hype, no fiesta \u2014 one soul, one guitar answering it, and any sung word is plain language from the user's own sheet.",
            "adlibDensity": "sparse",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Guitar Solo]",
              "[Instrumental Break]",
              "[Soft]",
              "[Melancholy]"
            ]
          },
          "builder": {
            "instruments": [
              "guitarra flamenca",
              "palmas",
              "caj\xF3n",
              "jaleo y coros"
            ],
            "themes": [
              "El quej\xEDo y el dolor",
              "Pena y desenga\xF1o",
              "Orgullo y ra\xEDces",
              "La vida gitana"
            ],
            "purposes": [
              "Sentir el quej\xEDo",
              "Desahogar la pena"
            ]
          }
        },
        {
          "id": "rumba-flamenca",
          "name": "Rumba Flamenca / Catalana",
          "oneLine": "The festive offshoot \u2014 the Gipsy Kings and Peret party cycle, a bright four-square rumba built to clap, dance, and lift a whole room with an open heart.",
          "tempoGroove": "~100-130 BPM in a bright, steady four-square rumba pulse \u2014 the festive squared cousin of the flamenco comp\xE1s, driven by the ventilador strumming pattern and clapping palmas a room can join without counting. Medium word density: warm singable phrases with real air after them, because the guitar and palmas answer between lines and the groove needs room to clap, never wall-to-wall.",
          "writingDials": [
            "Write it to clap and dance: rumba is a fiesta in a circle, so the chorus opens outward for a crowd to lift and clap while the verses keep the specific names, places, and details the user brought.",
            "Keep the guitar its answer inside the party: end phrases a touch early so the rasgueado and palmas can fire back in the gap and take turnarounds between verses \u2014 a sheet that fills every bar smothers the drive that colors the room.",
            "The hook is a warm chantable refrain of roughly three to six words, easy to sing back on the second pass and sturdy enough to return many times, gathering warmth and voices each round rather than resolving \u2014 the room's line on the night.",
            "Rhyme plain and sturdy: clean end-rhyme the circle hears coming lands square on the clap and survives the tempo; slant-rhyme subtlety blurs at a party.",
            "Registers are celebration, warm love, hometown and family pride, and open-hearted joy: a wedding, a devoted love sung bright, a pride of roots and people, a flat-out fiesta \u2014 delivered warm and danceable, and even a wistful line rides the joy of the groove.",
            "Keep the language plainspoken and warm \u2014 everyday words, one true image over ornament; the joy rides the pulse, and a plain line the whole floor can carry outranks a clever one.",
            "Address the room and the loved: sung outward to the fiesta, or to one person with the whole circle clapping behind it \u2014 never an inward private collapse; this room faces the crowd.",
            "Cross-genre firewall: the bright four-square rumba pulse with the ventilador strum and clapping palmas is what makes it rumba, not a Latin-American genre \u2014 there is no clave, no montuno, no dembow under it; if the flamenco guitar drive and the palmas vanish, the room is gone."
          ],
          "rendering": "Bright flamenco guitars strumming the ventilador rumba pattern with rasgueado flourishes answering the vocal, clapping hand palmas driving the four-square pulse, caj\xF3n and light percussion knocking the groove, warm bass walking underneath, festive backing coros. Warm open lead vocal, often a group answering on the chorus; live celebratory Gipsy-Kings rumba mix, hands and guitars out front, no synths.",
          "storyFit": "Best for: celebration and fiesta, weddings, warm devoted love, pride in roots and family, honoring someone, an open-hearted good time. Poor fit: the deepest private grief \u2014 that is Puro; a modern styled crossover hook \u2014 that is Fusi\xF3n; anything wanting stillness, intimacy, or low volume.",
          "parodyTraps": "Castanets-and-roses tourist postcard scenery instead of the user's real fiesta; any Spanish word the user never wrote sprinkled as flavor; a thin lyric that gives the guitars and palmas nothing to answer; cramming every beat so the room cannot clap; a limp under-sung delivery that fights the festive drive.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Call and Response] [Harmonies] [Guitar Solo] [Groove]. This room performs like a fiesta clapping in a circle \u2014 a warm lead over driving guitars and hand palmas, with the crowd answering and the encouraging shouts of the party carrying much of the energy. Signature: the clapped answer \u2014 the guitars and palmas throw a flourish into the gap the singer leaves and the circle claps the pulse, while encouraging shouts of the fiesta land on the peaks and lift each chorus. Placement: the guitar-and-palmas answers fall at verse and chorus line-ends where the vocal steps aside; encouraging shouts top the chorus and the biggest turns; a [Guitar Solo] hands a stretch to the flamenco guitar between verses, and group harmonies thicken the final choruses. Tag identity: a lead and a clapping circle \u2014 driving guitars and palmas answering in the gaps, warm encouraging shouts thrown by the fiesta over the peaks, a group coro swelling on the hook. Every shout is celebration directed as energy in plain English, never a scripted foreign exclamation the user did not write.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Call and Response]",
              "[Harmonies]",
              "[Guitar Solo]",
              "[Groove]"
            ]
          },
          "builder": {
            "instruments": [
              "guitarra flamenca",
              "palmas",
              "caj\xF3n",
              "jaleo y coros",
              "bajo"
            ],
            "themes": [
              "La fiesta y la juerga",
              "Amor y pasi\xF3n",
              "Orgullo y ra\xEDces",
              "La tierra y el pueblo"
            ],
            "purposes": [
              "Prender la fiesta",
              "Palmear y bailar",
              "Enamorar con arte"
            ]
          }
        },
        {
          "id": "nuevo-flamenco",
          "name": "Nuevo Flamenco / Fusi\xF3n",
          "oneLine": "The modern crossover \u2014 the Rosal\xEDa-adjacent lane, flamenco phrasing and a real comp\xE1s pulled over contemporary production, cooler and more styled without losing the root.",
          "tempoGroove": "~90-115 BPM with a real flamenco comp\xE1s kept under a modern beat \u2014 programmed percussion, palmas, and caj\xF3n sitting inside the cycle rather than a squared pop four, neither fully free nor fully party-locked. Medium word density: contemporary phrasing that leans and syncopates against the comp\xE1s, still leaving the guitar and palmas their answer but carrying a modern hook \u2014 never wall-to-wall.",
          "writingDials": [
            "Keep a real comp\xE1s under the modern surface: the flamenco cycle and the palmas still run the song, so write to the clap and leave the guitar its gap even as programmed percussion, bass, or pads color the track \u2014 a fusion that squares into a plain pop four has lost the root.",
            "Style the feeling into a hook without cooling it dead: this room holds a composed, contemporary poise \u2014 the quej\xEDo is present, shaped into a modern refrain and phrasing, felt rather than cried wide open, but it must still be a real feeling and not a pose.",
            "Write for phrasing that bends and repeats: lines can lean, drag, and syncopate against the comp\xE1s the way a modern vocal bends flamenco, and melisma on held vowels is welcome \u2014 end feeling-lines on vowels the voice can ornament and slide.",
            "The hook is a styled modern refrain, memorable and engineered to return, that deepens as the track builds rather than only repeating \u2014 carry the flamenco melisma into it so the root shows even in the pop shape.",
            "Keep the guitar and palmas answering inside the production: leave them real gaps at line-ends and plan a turnaround where they surface. A fusion that buries the flamenco guitar and the clap under wall-to-wall production has lost the lane's spine.",
            "Point of view is confident and specific: first person with room for wit, irony, attitude, or an unexpected modern angle a pure deep song would never pause for \u2014 but grounded in the user's real story, never a stock aesthetic.",
            "Register can widen past pure grief \u2014 attitude, desire, defiance, pride, a styled heartbreak \u2014 but it stays flamenco-rooted, and the comp\xE1s and the guitar stay the song's second voice.",
            "Cross-genre firewall: the real flamenco comp\xE1s and palmas with the flamenco guitar and cante melisma still running the song is what makes it Fusi\xF3n, not generic modern pop with a Spanish coat of paint \u2014 the modern flavor lives in the production and phrasing, never in squaring the cycle into a plain four or removing the flamenco guitar and clap."
          ],
          "rendering": "Modern flamenco-fusion production \u2014 flamenco guitar and rasgueado answering the vocal, palmas and caj\xF3n kept inside a real comp\xE1s, programmed percussion and a rounded modern bass, atmospheric pads and light reverb, occasional handclap-driven drops. Styled contemporary lead vocal carrying real flamenco melisma and ornament, tasteful doubles and harmonies, a polished modern sheen over a traditional root; Rosalia-adjacent nuevo-flamenco sound, now.",
          "storyFit": "Best for: a styled modern heartbreak, attitude and defiance, desire, pride reframed with a cooler head, a contemporary take on a traditional feeling. Poor fit: a raw undignified grief cried wide open \u2014 that is Puro; a straight-ahead clapping fiesta \u2014 that is Rumba; anything that needs the cycle squared into plain pop, which drops the root the lane is built on.",
          "parodyTraps": "Squaring the comp\xE1s into a generic pop four until the flamenco is only decoration; any Spanish word the user never wrote pasted in as aesthetic flavor; a styled pose with no real feeling under the cool; burying the flamenco guitar and palmas under nonstop production; borrowing a famous artist's signature line the user's story never contained.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Guitar Solo] [Harmonies] [Ad-Lib Section] [Soft]. This room performs like a styled modern lead with the flamenco guitar and palmas as the root under the production \u2014 one composed voice carrying real melisma, tasteful self-harmonies, and the guitar and clap answering inside the modern beat. Signature: the comp\xE1s answer \u2014 the flamenco guitar and palmas reply to the sung line in the gap and surface for a turnaround, the clap threading the modern production so the root shows through the sheen, and an encouraging shout can lift a peak where a pure cry would not sit. Placement: the guitar-and-palmas answers sit at line-ends and a [Guitar Solo] takes the instrumental section; light harmony doubles thicken the hook, and a short ad-lib run can lift the last chorus; an encouraging shout marks a turn or a drop. Tag identity: a styled lead over a flamenco root \u2014 self-harmonies on the refrain, the guitar and palmas answering across the verses, one flamenco run reserved for the hook, an encouraging shout as a modern accent directed as energy in plain English. No fiesta circle and no lone mourner \u2014 a modern voice and the comp\xE1s that grounds it, every sung word from the user's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Guitar Solo]",
              "[Harmonies]",
              "[Ad-Lib Section]",
              "[Soft]"
            ]
          },
          "builder": {
            "instruments": [
              "guitarra flamenca",
              "palmas",
              "caj\xF3n",
              "bajo",
              "jaleo y coros",
              "taconeo"
            ],
            "themes": [
              "Amor y pasi\xF3n",
              "Pena y desenga\xF1o",
              "Libertad",
              "Orgullo y ra\xEDces"
            ],
            "purposes": [
              "Enamorar con arte",
              "Desahogar la pena",
              "Sentir el quej\xEDo"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "cante jondo",
          "strength": "strong",
          "roomId": "flamenco-puro"
        },
        {
          "cue": "quej\xEDo",
          "strength": "strong",
          "roomId": "flamenco-puro"
        },
        {
          "cue": "sole\xE1",
          "strength": "strong",
          "roomId": "flamenco-puro"
        },
        {
          "cue": "seguiriya",
          "strength": "strong",
          "roomId": "flamenco-puro"
        },
        {
          "cue": "duelo",
          "strength": "weak",
          "roomId": "flamenco-puro"
        },
        {
          "cue": "pena",
          "strength": "weak",
          "roomId": "flamenco-puro"
        },
        {
          "cue": "desgarro",
          "strength": "weak",
          "roomId": "flamenco-puro"
        },
        {
          "cue": "grief",
          "strength": "weak",
          "roomId": "flamenco-puro"
        },
        {
          "cue": "exilio",
          "strength": "weak",
          "roomId": "flamenco-puro"
        },
        {
          "cue": "llorar",
          "strength": "weak",
          "roomId": "flamenco-puro"
        },
        {
          "cue": "rumba",
          "strength": "strong",
          "roomId": "rumba-flamenca"
        },
        {
          "cue": "gipsy kings",
          "strength": "strong",
          "roomId": "rumba-flamenca"
        },
        {
          "cue": "peret",
          "strength": "strong",
          "roomId": "rumba-flamenca"
        },
        {
          "cue": "rumba catalana",
          "strength": "strong",
          "roomId": "rumba-flamenca"
        },
        {
          "cue": "buler\xEDa",
          "strength": "weak",
          "roomId": "rumba-flamenca"
        },
        {
          "cue": "fiesta",
          "strength": "weak",
          "roomId": "rumba-flamenca"
        },
        {
          "cue": "juerga",
          "strength": "weak",
          "roomId": "rumba-flamenca"
        },
        {
          "cue": "boda",
          "strength": "weak",
          "roomId": "rumba-flamenca"
        },
        {
          "cue": "palmas",
          "strength": "weak",
          "roomId": "rumba-flamenca"
        },
        {
          "cue": "celebraci\xF3n",
          "strength": "weak",
          "roomId": "rumba-flamenca"
        },
        {
          "cue": "nuevo flamenco",
          "strength": "strong",
          "roomId": "nuevo-flamenco"
        },
        {
          "cue": "fusi\xF3n",
          "strength": "strong",
          "roomId": "nuevo-flamenco"
        },
        {
          "cue": "rosal\xEDa",
          "strength": "strong",
          "roomId": "nuevo-flamenco"
        },
        {
          "cue": "crossover",
          "strength": "weak",
          "roomId": "nuevo-flamenco"
        },
        {
          "cue": "moderno",
          "strength": "weak",
          "roomId": "nuevo-flamenco"
        },
        {
          "cue": "actitud",
          "strength": "weak",
          "roomId": "nuevo-flamenco"
        },
        {
          "cue": "urbano",
          "strength": "weak",
          "roomId": "nuevo-flamenco"
        }
      ]
    },
    "country": {
      "id": "country",
      "name": "Country",
      "aliases": [
        "country music",
        "honky-tonk",
        "honky tonk",
        "americana",
        "outlaw country"
      ],
      "profileText": "A country writer starts with one true thing and the turn that reveals it. The spine of the genre is a specific real story \u2014 a name, a town, a night, a loss \u2014 carried plain over acoustic-and-steel roots and delivered on a line you did not see coming: a pun that recasts the title, a plainspoken image that lands the whole song, a payoff hook a room can sing. So the writing job is to find the turn first and build the verses up to it. The detail is the whole game: country earns belief through the concrete and the true, so the writer works from the actual bar, the actual truck, the actual name the user brought, and never reaches for a stock tailgate, dirt-road, or whiskey prop to fill a line. A country song that trades the specific true story for costume has already lost, whatever the fiddle does.\n\nThe arrangement is the second voice, and the writer leaves it room. Pedal steel and fiddle answer the phrase-ends, a telecaster throws its licks in the gaps, and a sheet packed wall-to-wall has silenced the instruments that make it country. So lines break early and hand off, and the writer plans the turnaround where the steel or the fiddle sings alone. The roots instrumentation is also the firewall: the steel and telecaster twang keep it clear of folk (rootsier, plainspoken, protest-leaning, no steel), and the fiddle and steel keep it clear of rock (electric-guitar-driven, no steel or fiddle). Direct delivery is a country instinct \u2014 a real cry in the voice, warmth and grit \u2014 but it is directed as tone and phrasing, never as a spelled-out accent, and the singer's plainspoken honesty outranks any clever flourish.\n\nThe rooms bend all of this. Traditional / Honky-Tonk cries in its beer at the bar, the pedal steel weeping the heartbreak back under a two-step, the craft in the wordplay hook. Modern / Radio Country lifts the same life into a wide singable chorus for a Friday-night crowd, the detail kept in the verses and the hook opened for an arena. Americana / Alt-Country pulls the lights down to a listening room and lets the song be a short story, plainspoken and unhurried, the grit in the voice and the truth. The law above every dial is the same everywhere: the user's real people and places rule, never a stock country prop the story did not contain; craft words \u2014 steel-first, the turn, the payoff hook, the two-step \u2014 are the writer's tools, never the song's, and never enter the lyrics, adlibs, or render notes.",
      "defaultRoomId": "traditional",
      "rooms": [
        {
          "id": "traditional",
          "name": "Traditional / Honky-Tonk",
          "oneLine": "The Haggard and Jones lane \u2014 a two-step and a cry in your beer, pedal steel and fiddle weeping the heartbreak back, the wordplay hook landing square on the title.",
          "tempoGroove": "90-130 BPM in a shuffle or a two-step (the classic honky-tonk shuffle sits around 100-120, the slow-dance heartache ballad drops to 90-100) with a walking upright or electric bass and brushed or shuffle-kit drums keeping the couples moving; the fiddle and pedal steel trade fills between lines. Medium word density: plain conversational lines that break early so the steel can cry the answer, never wall-to-wall.",
          "writingDials": [
            "Steel-first: the pedal steel is the second voice and it weeps back at every phrase-end, so end lines a beat early and leave the gap for it to answer \u2014 a sheet that fills every bar silences the instrument that defines the room.",
            "Build the whole song toward a title hook that turns: the payoff is a pun, a double meaning, or a plainspoken twist that recasts the line \u2014 the honky-tonk tradition lives on the clever true title, so find the turn first and write the verses up to it.",
            "Wear the heartbreak plain and undignified: this is the barstool confession \u2014 the drink, the jukebox, the empty side of the bed from the user's own night \u2014 self-pity, defiance, or gallows humor is the register here, whether he is crying, kissing off, or laughing at the wreck, so say the whole thing plain rather than keep a dignified distance.",
            "Verses set up, the chorus lands the ache: verse two advances the specific story \u2014 what she said, what he did, how the night went \u2014 never re-circle verse one, because the setup is what makes the hook cut.",
            "Rhyme clean and singable: solid perfect end-rhyme the dancers hear coming beats a clever scheme, and repeating the title word is a feature, not a crutch.",
            "Direct address is fully at home: first person to the one who left, or a first person collapsing at the bar \u2014 begging, remembering, toasting the wreck out loud.",
            "Keep every detail the user's own: the actual bar, the actual song on the box, the actual name \u2014 never a stock tailgate or dirt-road prop the story did not bring.",
            "Cross-genre firewall: the crying pedal steel and sawing fiddle over a danceable shuffle make it country honky-tonk, not folk \u2014 folk is rootsier and plainspoken with no steel or telecaster twang and no two-step; this room aches on its feet on a dance floor."
          ],
          "rendering": "Crying pedal steel answering every vocal line, a lone fiddle sawing fills, bright telecaster with chicken-pickin licks, walking upright or electric bass, brushed or shuffle-kit drums keeping a two-step; warm honky-tonk barroom sound, a lead vocal with a real cry in it and a tight harmony on the chorus, vintage Bakersfield-to-countrypolitan analog warmth, no modern gloss.",
          "storyFit": "Best for: heartbreak worn open, cheating and its comeuppance, a barstool confession, a two-step love song, drowning a sorrow, an honest hard-luck night. Poor fit: a big arena celebration built for a crowd \u2014 that is radio country; a hushed literary character study \u2014 that is Americana; abstract mood with no one on the other end.",
          "parodyTraps": "Bro-country tailgate and dirt-road props the user never wrote; a hook that is clever instead of cry-able or true; a fake drawl spelled into the words; filling the steel's answer gaps with lyrics; a dignified distance when the whole point is the man who has lost his at the bar.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Pedal Steel Solo] [Fiddle Solo] [Harmonies] [Melancholy]. This room performs like a heartbroken singer at a bar with a band that cries back \u2014 one lead voice with a real ache, a high tight harmony on the hook, and the steel and fiddle answering like a second mourner, no crowd and no hype. Signature: the steel answer \u2014 the pedal steel weeps back the emotion of each line in the gap the phrasing leaves, so the ache is stated twice, once in words and once in strings. Placement: steel and fiddle fills land at the line-ends the singer leaves open, and a [Pedal Steel Solo] or [Fiddle Solo] takes the instrumental turnaround where the words stop; a tight harmony shadows the title on the chorus, and the last hook pushes hardest. Tag identity: a lone aching lead and its crying steel \u2014 the pedal steel and fiddle answering in the holes, a high lonesome harmony on the title, the solo marked as its own instrumental cry. No arena crowd, no chant \u2014 one heart at the bar and the band that answers it, every sung word from the user's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Pedal Steel Solo]",
              "[Fiddle Solo]",
              "[Harmonies]",
              "[Melancholy]"
            ]
          },
          "builder": {
            "instruments": [
              "pedal steel",
              "fiddle",
              "telecaster",
              "upright bass",
              "brushed drums",
              "acoustic guitar"
            ],
            "themes": [
              "Heartbreak",
              "Small-town life",
              "Friday night",
              "Losing someone"
            ],
            "purposes": [
              "Cry in your beer",
              "Two-step / dance",
              "Tell a story"
            ]
          }
        },
        {
          "id": "modern",
          "name": "Modern / Radio Country",
          "oneLine": "The contemporary arena-country lane \u2014 the specific life kept, but lifted into a big singable hook and a wide chorus built for a truck stereo and a Friday-night crowd.",
          "tempoGroove": "75-140 BPM produced big and clean \u2014 the up-tempo celebration sits 120-140 with a driving backbeat, the modern power ballad drops to 75-90 \u2014 with a full drum kit, electric and acoustic guitars stacked, and steel or telecaster kept for color; the groove is contemporary but the roots stay audible. Medium word density: conversational verses that build to a chorus with real space to open up and be shouted back.",
          "writingDials": [
            "Write toward a huge communal chorus: the hook is the emotional headline a whole room lifts on, short and singable and repeatable, so build the verses as setup and make the chorus open outward \u2014 if it could not be sung back by a crowd on a Friday night, it is pitched wrong for this room.",
            "Keep the verses specific and the chorus wide: hold the real names, the real town, the real detail from the user's story in the verses, then let the chorus rise to the feeling everyone shares \u2014 the specific-to-universal lift is the modern craft.",
            "Melody carries as much as words: write lines that ride a strong contemporary melody with open vowels at the peaks, because a radio hook is sung out big, not crooned under the band.",
            "The payoff hook still turns: even at arena size the title should land a clear twist or a satisfying resolve on the last line of the chorus \u2014 a hook that just states the topic without a turn reads as filler here.",
            "Rhyme clean and sturdy with a modern ear: solid end-rhyme the crowd hears coming, but the phrasing can lean and syncopate against the backbeat the way contemporary vocals do.",
            "Registers widen past heartbreak: pride, celebration, first love, hometown roots, honoring someone, a Friday-night release \u2014 all delivered at full chest, warmth and volume together.",
            "Keep the roots real, not costume: the steel and telecaster and the true detail are what keep it country under the big production \u2014 never trade the specific story for stock tailgate scenery.",
            "Cross-genre firewall: the steel and telecaster twang and the true country detail under a big clean production make it radio country, not rock \u2014 rock is electric-guitar-driven with no fiddle or pedal steel; here the roots instruments stay audible and the story stays a specific country story, never a generic anthem."
          ],
          "rendering": "Big clean modern country production \u2014 stacked acoustic and electric guitars, pedal steel and bright telecaster kept for color and hooks, full drum kit with a driving backbeat, rounded modern bass, subtle keys under the chorus; a strong contemporary lead vocal with tasteful runs and stacked harmonies opening the hook wide, polished arena-country sheen, 2010s-to-now radio sound.",
          "storyFit": "Best for: a Friday-night celebration, hometown pride, first love, a big power-ballad heartbreak, honoring someone, a life lifted into a singable anthem. Poor fit: a barstool cry that needs the crying steel up front \u2014 that is honky-tonk; a spare literary story-song \u2014 that is Americana; anything that needs a whisper instead of a big chorus.",
          "parodyTraps": "Stock bro-country tailgate, dirt-road, and truck-and-beer checklist props the user never wrote \u2014 the fastest tell here; a chorus that states the topic with no turn; a fake drawl spelled into the words; burying the steel and telecaster until it is generic pop-rock; borrowing a famous hit's hook the user's story never contained.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Guitar Solo] [Harmonies] [Shout] [Instrumental Break]. This room performs like a lead singer and a band lifting a crowd \u2014 one strong contemporary lead, stacked harmonies opening the chorus wide, and a joyful shout on the biggest turns. Signature: the opened hook \u2014 the harmonies stack and the chorus rises the second and third time so the same hook lands bigger each pass, built for a room to sing back. Placement: the harmonies thicken the chorus and the final hook; a joyful shout tops the biggest turns and the celebration peaks; a [Guitar Solo] or [Instrumental Break] hands a section to the band between verses. Tag identity: a lead and a stacked harmony crowd \u2014 harmonies swelling on the hook, a joyful shout thrown on the peaks, a guitar or steel taking the instrumental turn. Every shout is energy in plain English, never a scripted drawl or exclamation the user did not write.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Guitar Solo]",
              "[Harmonies]",
              "[Shout]",
              "[Instrumental Break]"
            ]
          },
          "builder": {
            "instruments": [
              "telecaster",
              "pedal steel",
              "acoustic guitar",
              "brushed drums",
              "upright bass",
              "fiddle"
            ],
            "themes": [
              "Friday night",
              "First love",
              "Home & roots",
              "Small-town life",
              "Family & faith"
            ],
            "purposes": [
              "Celebrate",
              "Honor someone",
              "Two-step / dance",
              "Tell a story"
            ]
          }
        },
        {
          "id": "americana",
          "name": "Americana / Alt-Country",
          "oneLine": "The Stapleton, Sturgill, and Isbell lane \u2014 country as a short story, plainspoken and unhurried in a listening room, the craft in the writing and the grit in the voice.",
          "tempoGroove": "60-110 BPM, unhurried and often loose at the edges, a stripped roots band or a spare acoustic setup breathing with the singer; the arrangement leaves real air and a single lead instrument \u2014 acoustic lead, dobro, or a lonesome fiddle \u2014 answers in the open space. Low-to-medium word density: the space is the point, so leave air around the lines and let one instrument fill it.",
          "writingDials": [
            "Write it as a short story: Americana narrates a real life with characters, a setting, and a turn \u2014 a first-person telling or a third-person portrait \u2014 so build the verses to move the story forward and land the meaning on an image, not a slogan.",
            "The turn is a plainspoken image, not a clever pun: the payoff is a true detail or an understated line that recasts the whole song when it lands, so trust the concrete over the ornamental and let the listener do the last step.",
            "Advance every verse with real information: each verse carries the account forward \u2014 this is the one country room where narrative progression can outrank a repeated chorus, and a hook is welcome but optional, kept spare between story beats.",
            "Plainspoken and exposed: with the arrangement stripped back the words are naked, so understatement and honesty carry further than any flourish, and one real image outweighs a pretty generality.",
            "Let the tempo breathe: Americana rushes nothing and sits back in the pocket, so write phrases that can stretch and settle rather than lock hard to a dance grid \u2014 the space is a feature, not a gap to fill.",
            "The grit is in the voice and the truth, not costume: outlaw is an attitude of honesty and independence, so the register can run from tender to hard-bitten, but it earns it through the real story, never through injected whiskey-and-outlaw props.",
            "Serve whatever true story the user brought \u2014 a loss, a reckoning, a hometown, a hard road: keep every detail their own and never add violence, outlaw swagger, or stock roots scenery the story did not contain.",
            "Cross-genre firewall: the pedal steel or dobro and the country roots band under a plainspoken story make it Americana country, not folk \u2014 folk leans protest and plainspoken acoustic with no steel or telecaster twang, while this room keeps the roots-country instrumentation and the honky-tonk lineage even when it is stripped and literary."
          ],
          "rendering": "Stripped roots-country production \u2014 acoustic guitar and a warm electric or dobro trading lead, pedal steel or a lonesome fiddle answering in the open air, upright or restrained electric bass, brushed drums or none, real space around everything; an honest weathered lead vocal with grit and one close harmony on the peaks, dry warm unplugged-to-roomy mix, no modern gloss and no 808s, the Stapleton-to-Isbell listening-room sound.",
          "storyFit": "Best for: a story-song with real characters, a reckoning or a loss, a hometown portrait, a hard road, a plainspoken tribute, reflection sung close. Poor fit: an arena celebration built for a crowd \u2014 that is radio country; a two-step barroom cry that wants the crying steel driving it \u2014 that is honky-tonk; abstract mood with no story and no one addressed.",
          "parodyTraps": "Injected whiskey, outlaw, and roots-costume props the user never wrote; a clever pun where a plainspoken image belongs; filling the spare arrangement until the intimacy is gone; an over-produced big-chorus delivery that breaks the listening-room stillness; a fake drawl or grit spelled into the words instead of carried by the voice.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Instrumental Break] [Harmonies] [Spoken]. This room performs like a songwriter telling a true story to a listening room \u2014 one honest weathered lead carries nearly all of it, a single close harmony on the peaks, and one lead instrument answering in the open air, no crowd and no wall of sound. Signature: the instrument answer between story beats \u2014 the acoustic lead, dobro, or lonesome fiddle replies to the vocal in the space at line-ends and takes a spare turnaround that marks the passage of time in the tale. Placement: the lead narrates the verses almost unbroken; a single harmony slips in on the emotional peaks only; an [Instrumental Break] falls between major story beats to let the events breathe, and a low [Spoken] aside can land a plainspoken turn. Tag identity: a lone storyteller and a breathing roots band \u2014 the lead instrument answering in the holes, one close harmony at the peaks, a spare turnaround between verses. No arena crowd, no shouted hype \u2014 a songwriter and the air in the room, and the story is only ever the one the user actually told.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Instrumental Break]",
              "[Harmonies]",
              "[Spoken]"
            ]
          },
          "builder": {
            "instruments": [
              "acoustic guitar",
              "pedal steel",
              "fiddle",
              "banjo",
              "upright bass",
              "brushed drums"
            ],
            "themes": [
              "Losing someone",
              "Home & roots",
              "Family & faith",
              "Small-town life",
              "Heartbreak"
            ],
            "purposes": [
              "Tell a story",
              "Honor someone",
              "Cry in your beer"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "honky-tonk",
          "strength": "strong",
          "roomId": "traditional"
        },
        {
          "cue": "two-step",
          "strength": "strong",
          "roomId": "traditional"
        },
        {
          "cue": "cry in your beer",
          "strength": "strong",
          "roomId": "traditional"
        },
        {
          "cue": "heartbreak",
          "strength": "weak",
          "roomId": "traditional"
        },
        {
          "cue": "shuffle",
          "strength": "weak",
          "roomId": "traditional"
        },
        {
          "cue": "cheating",
          "strength": "weak",
          "roomId": "traditional"
        },
        {
          "cue": "barroom",
          "strength": "weak",
          "roomId": "traditional"
        },
        {
          "cue": "haggard",
          "strength": "weak",
          "roomId": "traditional"
        },
        {
          "cue": "outlaw",
          "strength": "weak",
          "roomId": "traditional"
        },
        {
          "cue": "waylon",
          "strength": "weak",
          "roomId": "traditional"
        },
        {
          "cue": "radio country",
          "strength": "strong",
          "roomId": "modern"
        },
        {
          "cue": "arena",
          "strength": "strong",
          "roomId": "modern"
        },
        {
          "cue": "big hook",
          "strength": "strong",
          "roomId": "modern"
        },
        {
          "cue": "friday night",
          "strength": "weak",
          "roomId": "modern"
        },
        {
          "cue": "celebration",
          "strength": "weak",
          "roomId": "modern"
        },
        {
          "cue": "hometown pride",
          "strength": "weak",
          "roomId": "modern"
        },
        {
          "cue": "power ballad",
          "strength": "weak",
          "roomId": "modern"
        },
        {
          "cue": "truck stereo",
          "strength": "weak",
          "roomId": "modern"
        },
        {
          "cue": "americana",
          "strength": "strong",
          "roomId": "americana"
        },
        {
          "cue": "alt-country",
          "strength": "strong",
          "roomId": "americana"
        },
        {
          "cue": "singer-songwriter",
          "strength": "weak",
          "roomId": "americana"
        },
        {
          "cue": "story-song",
          "strength": "weak",
          "roomId": "americana"
        },
        {
          "cue": "stapleton",
          "strength": "weak",
          "roomId": "americana"
        },
        {
          "cue": "isbell",
          "strength": "weak",
          "roomId": "americana"
        },
        {
          "cue": "listening room",
          "strength": "weak",
          "roomId": "americana"
        }
      ]
    },
    "rock": {
      "id": "rock",
      "name": "Rock",
      "aliases": [
        "rock music",
        "rock and roll",
        "rock n roll",
        "classic rock",
        "hard rock",
        "alternative rock",
        "indie rock",
        "punk"
      ],
      "profileText": "A rock writer starts with the riff and the room. Rock is electric guitars and live drums played by a band in a space, and the song is built up from a guitar figure and a backbeat, not down from a title or a track. So the first question is physical: what does the guitar do, and where does the singer sit against it. A rock lyric is written to leave the guitar its air \u2014 verses ride the pocket the riff sets, phrase-ends hand off to a lead answer or a wall of noise, and a sheet packed wall-to-wall with words has smothered the instrument that defines the genre before a line is judged.\n\nThe second move is the chorus, and it is a decision about voltage and distance. Rock choruses run from a fists-up singalong a stadium already knows, to a loud detonation after a held-back verse, to a slogan a gang of voices barks back. Whatever the room, the chorus thins out \u2014 fewer, blunter words on open vowels the band can swallow and a crowd can lift \u2014 while the verses carry the real, specific story that earns it. Verse two never re-sings verse one; the anthem, the confession, or the blast is only as big as the truth under it, and the concrete detail from the user's own life is what strangers recognize themselves in.\n\nThe rooms bend all of this. Classic / Arena raises the feeling plain and big, the I widening into a we, the bridge handed to a guitar solo the crowd waits for. Alternative / Indie turns it inward and crooked \u2014 quiet verse, loud chorus, irony over triumph, the drop as loaded as the swell, feedback answering where a hero solo would. Hard Rock / Punk spits it fast and confrontational, power chords hammered as rhythm, a slogan shouted at a target, in and out before it apologizes. The law above every dial is real over cartoon: the actual grievance, the actual town, the actual wound \u2014 never rock-and-roll-all-night filler, borrowed grunge angst, or generic anti-everything posing the user never wrote. Delivery is directed as energy and attitude in plain English \u2014 belt, snarl, hold, bark \u2014 never as a costume, and the user's own people and places always outrank any stock rebel scenery.",
      "defaultRoomId": "classic",
      "rooms": [
        {
          "id": "classic",
          "name": "Classic / Arena Rock",
          "oneLine": "The anthemic, riff-and-chorus, fists-up lane \u2014 the Stones, Petty, Springsteen, Foo Fighters: a signature riff, a chorus a stadium already knows, a heart worn plain and big, and the sincere slow-burn power ballad that climbs to a lead-guitar climax.",
          "tempoGroove": "92-150 BPM in a straight, driving 4/4 with the backbeat hard on 2 and 4 (the fists-up stomp-anthem can sit much slower \u2014 a heavy half-time foot-stomp is a Classic move, not a disqualifier), the whole song built up from one signature guitar riff and a steady, unhurried pocket. Medium word density: the verses talk and set the scene, but the chorus thins out to a few strong words on open vowels so a whole room can lift on it \u2014 leave air at the phrase-ends where the riff answers.",
          "writingDials": [
            "Build on the riff, not just the chords: this room's hook is often the guitar figure, so write the vocal to leave the riff its space \u2014 verses ride in the pocket the riff sets and the chorus lands on top of it, never burying it under wall-to-wall words.",
            "Write the chorus for a crowd, not a diary: a short, plain, hooky title-line built to be sung back by ten thousand strangers on the first chorus \u2014 if it could not be shouted with a fist in the air, it is pitched for the wrong room.",
            "Keep the I wide open so it becomes we: verses stay one person's specific story, but the chorus opens outward into something anyone in the room can claim as theirs \u2014 universal reached through the concrete, never through the vague.",
            "Verses earn the chorus with real detail: the actual car, the actual town, the actual night from the user's story \u2014 verse two moves it forward, never re-sings verse one, because the anthem is only as big as the truth under it.",
            "Melody sits in a belt-able chest range with the peaks on open vowels: this is a singer pushing out over a full band, so write lines a voice can lean into and hold, and save the highest, most open sound for the chorus payoff.",
            "Rhyme clean and sturdy: solid, satisfying end-rhyme the crowd hears coming lands square with the backbeat \u2014 this room trusts the plain rhyme that rings, not the clever slant that hides.",
            "The power ballad lives here, sincere not ironic: a quiet, tender verse that climbs to a huge open chorus and a lead-guitar climax \u2014 the slow-burn love-or-loss anthem belongs to Classic, worn earnest and big, never undercut.",
            "Plan the solo as a section: this room waits for a lead guitar break, so build a stretch where the words stop and the guitar sings the song's feeling, then bring the last chorus back bigger.",
            "Cross-genre firewall: the signature electric riff, the fists-up crowd chorus, and the waited-for guitar solo make it Classic Rock, not a Pop anthem with guitars painted on \u2014 the guitar writes the hook here and the band plays live in a room, where pop would build the lift from production and a programmed drop."
          ],
          "rendering": "Big live rock band built on a signature electric guitar riff, crunchy rhythm guitar and a soaring lead, driving bass locked to the kick, live drums with a hard backbeat and open fills, warm organ or piano thickening the choruses. Full-chested lead vocal with gang harmonies swelling the hook, a proper lead guitar solo section, arena-sized but human and live \u2014 no gloss, no programming, the roar of a real band in a real room.",
          "storyFit": "Best for: an anthem of defiance or endurance, standing back up after a fall, hometown pride, a love worn big and loud, the open road, a fists-up celebration. Poor fit: a small ironic self-aware confession that undercuts its own big line \u2014 that is Alternative; a two-minute aggressive blast at a target \u2014 that is Punk; anything that needs to stay quiet and interior.",
          "parodyTraps": "Generic rock-and-roll-all-night filler the user never meant \u2014 whiskey, highways, and rebel clich\xE9s pasted in for costume; a chorus too wordy or too clever to shout back; burying the riff and the solo under nonstop vocals; a whispered interior delivery that fights the crowd chorus; a big open hook with no specific, true verse holding it up.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Guitar Solo] [Harmonies] [Build Up] [Shout]. This room performs like a full band lifting a crowd \u2014 one full-chested lead, gang harmonies stacking the chorus, and the lead guitar as the voice that answers when the words stop. Signature: the crowd-lift chorus and the answered riff \u2014 gang voices swell onto the hook so the room sounds like a room, the guitar riff throws its figure into the gaps the vocal leaves, and a fist-in-the-air shout tops the biggest turns. Placement: verses stay lead-forward and fairly bare; harmony voices arrive to thicken each chorus and stack the last one; a [Build Up] rises into the final chorus; the [Guitar Solo] takes its own section between the last verse and the last chorus where the singer steps aside. Tag identity: a lead singer, a gang-harmony crowd, and an answering lead guitar \u2014 stacked voices on the hook, a defiant shout over the peaks, a solo the room waits for. Every shout is energy in plain English, never a scripted line the user did not write.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Guitar Solo]",
              "[Harmonies]",
              "[Build Up]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "electric guitars",
              "live drums",
              "driving bass",
              "organ",
              "power chords"
            ],
            "themes": [
              "Standing back up",
              "The road",
              "Love & obsession",
              "Rebellion"
            ],
            "purposes": [
              "Anthem / fists up",
              "Power ballad",
              "Drive music",
              "Raw energy"
            ]
          }
        },
        {
          "id": "alternative",
          "name": "Alternative / Indie",
          "oneLine": "The introspective, dynamic lane \u2014 90s alt through modern indie: Nirvana, Pixies, Radiohead, The Strokes, The National, Arctic Monkeys \u2014 quiet-loud dynamics, a crooked self-aware heart, texture over spectacle.",
          "tempoGroove": "100-140 BPM in 4/4, but the tempo matters less than the dynamic contract \u2014 a held-back, quieter verse that detonates into a loud, distorted chorus, the drop back down as deliberate as the surge. Medium word density in the verse, thinning at the chorus: write verses close to speech, a little wordy and wry, then let the loud chorus carry fewer, blunter words the guitars can swallow.",
          "writingDials": [
            "Write the quiet-loud contract into the words: the verse is held in, close, almost muttered, and the chorus breaks open loud \u2014 so the verse lyric should feel restrained and the chorus should feel like something finally said out loud after holding it too long.",
            "Turn the feeling inward and let it be crooked: this room is self-aware and unashamed of doubt \u2014 irony, understatement, an image that undercuts the big emotion instead of raising it; a line that admits the mess reads truer here than a triumphant one.",
            "Specific over universal, always: where Classic opens the I into a we, this room stays one person's exact, unglamorous detail \u2014 the room, the text unanswered, the ordinary Tuesday \u2014 and trusts the strangeness of the true detail to carry it.",
            "The hook can hide instead of announce: a chorus that repeats and gathers weight, a mumbled or oblique title-line, a phrase that means more the third time \u2014 this room lets repetition and texture do work that a stadium hook would do with volume.",
            "Let the guitars answer with texture, not just a solo: the payoff is often a wall of distortion, a feedback swell, or a riff drenched in effects rather than a clean hero lead \u2014 write phrase-ends that hand off to that noise, and let an instrumental surge say what the lyric won't.",
            "Keep the vocal conversational and unforced: sung close to speech, sometimes deadpan, sometimes cracking on the loud part \u2014 write phrases a natural voice can talk and then push, not a belter's showcase.",
            "Restraint is the discipline: leave the biggest feeling implied, cut the line that explains too much, and trust the dynamic drop to land the ache \u2014 this room says less on purpose and means more.",
            "Cross-genre firewall: the quiet-loud dynamic swing, the inward ironic register, and the texture-and-feedback payoff make it Alternative, not an Arena anthem \u2014 here the chorus can mumble, hide, or curdle instead of raising a fist, and the guitars answer with noise and mood where Classic answers with a clean waited-for solo."
          ],
          "rendering": "Dynamic alt-rock band working quiet-to-loud \u2014 restrained verses with clean or lightly driven guitar and space around the vocal, then a loud distorted chorus with a wall of guitars and feedback swells. Live drums that hold back and then hit hard, melodic bass carrying the quiet parts, an intimate slightly imperfect lead vocal that talks in the verse and pushes on the chorus, some tension left unresolved \u2014 indie-to-alt production, textured and human, never glossy.",
          "storyFit": "Best for: feeling like an outsider, alienation, a self-aware heartbreak, quiet defiance, anxiety and doubt worn honestly, longing that undercuts itself. Poor fit: a fists-up crowd anthem meant to unite a stadium \u2014 that is Classic; a fast confrontational blast at a target \u2014 that is Punk; anything that wants to be triumphant and unironic.",
          "parodyTraps": "Faking angst with borrowed grunge clich\xE9s the user never wrote; a big triumphant chorus that betrays the room's restraint; explaining the feeling the dynamics should imply; skipping the quiet-loud contract so it flattens into mid-volume rock; a hook that announces itself like an arena anthem when this room's power is in what it withholds.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Breakdown] [Build Up] [Harmonies] [Spoken]. This room performs on the swing between held-back and blown-open \u2014 one close, slightly imperfect lead, a thin harmony arriving only when the song breaks loud, and the guitars answering with texture rather than a clean solo. Signature: the quiet-loud detonation \u2014 the verse sits bare and near-spoken, a [Build Up] tightens, and the chorus bursts into distortion and feedback, the dynamic drop and surge carrying the feeling more than any adlib. Placement: verses stay nearly bare so the restraint reads; a [Build Up] leans into the loud chorus and a [Breakdown] can strip it back down after; a harmony shadow arrives only on the loud parts; a [Spoken] aside can carry an interior line the verse mutters. Tag identity: an intimate lead and a band that holds then hits \u2014 a bare near-spoken verse, harmonies only when it breaks open, feedback and distortion as the answer instead of a hero solo. No crowd chant, no hype stack \u2014 one honest voice and the wall of noise behind it, every word the user's own.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Breakdown]",
              "[Build Up]",
              "[Harmonies]",
              "[Spoken]"
            ]
          },
          "builder": {
            "instruments": [
              "electric guitars",
              "live drums",
              "driving bass",
              "feedback swells",
              "power chords"
            ],
            "themes": [
              "Feeling like an outsider",
              "Loss",
              "Love & obsession",
              "Standing back up"
            ],
            "purposes": [
              "Raw energy",
              "Drive music"
            ]
          }
        },
        {
          "id": "hard-rock",
          "name": "Hard Rock / Punk",
          "oneLine": "The raw, fast, aggressive lane \u2014 Stooges, Ramones, Clash, AC/DC, Mot\xF6rhead: power chords at speed, a sneer worn plain, rebellion said straight to your face with the polish stripped off.",
          "tempoGroove": "150-200 BPM for punk's flat-out charge, dropping to a stomping 120-140 for the heavier hard-rock swagger \u2014 a hard, driving 4/4 with power chords hammered as rhythm and drums pushing, no soft place to hide. Higher word density riding the speed: fast, punchy, syllable-packed lines that spit against the beat, with the chorus stripped to a shoutable slogan a gang of voices finishes.",
          "writingDials": [
            "Fast, blunt, and short: keep verses tight and hard, keep the whole song lean \u2014 this room says its piece and gets out, so cut every word that softens the punch and never pad a song that wanted to be two minutes.",
            "Write the chorus as a slogan to shout, not a melody to admire: a short, blunt, repeatable line built for a gang of voices to bark back \u2014 anger, defiance, a target named \u2014 the plainer and harder it hits, the more it belongs here.",
            "Confront, don't confess: aim the song outward at something \u2014 a system, a hypocrite, a wall, a rule \u2014 and state it flat; this room is a middle finger, not a diary, and a blast that stops to explain or apologize loses its teeth.",
            "Power chords are the engine, played as rhythm at speed: write the vocal to ride the driving chords rather than wait for a fancy riff or a long solo \u2014 the aggression is in the drive and the pace, so keep the words locked to that momentum.",
            "Ride the sneer and the attitude: delivery is snarled, shouted, spat \u2014 write lines that sound good barked, with hard consonants and blunt one-syllable hits the voice can land like punches, not vowels a crooner would hold.",
            "Keep it real and specific, never cartoon rebellion: the actual grievance, the actual target, the user's real anger \u2014 an invented, generic anti-everything pose reads as costume, and this room only works when the rebellion is true.",
            "Let the gang answer: build the shout-back moment where a crowd of voices barks the slogan or finishes the line, because punk's chorus is a room shouting together, not a lead singer performing at them.",
            "Cross-genre firewall: power chords driven fast and clean-toned-to-crunchy with a shouted human vocal make it Hard Rock / Punk, not Metal \u2014 there are no down-tuned chugs, no double-kick blast, no screamed or growled vocal; this room is fast and mean but it is still a song a crowd shouts, not a wall of extremity."
          ],
          "rendering": "Raw, fast, aggressive rock band \u2014 hammered power chords driving the whole song, distorted rhythm guitar up front, driving bass following the chords, hard-hitting live drums pushing the tempo, minimal polish. Snarled, shouted lead vocal spitting the words with a gang shout barking the chorus back, short and lean and loud \u2014 garage-live energy, rough edges left in, the roar of a band that plugged in and hit record.",
          "storyFit": "Best for: rebellion, anger at a system or a hypocrite, defiance, outsider fury, a fast blast of raw energy, refusing to back down. Poor fit: a big unifying arena singalong \u2014 that is Classic; a quiet self-aware interior confession \u2014 that is Alternative; a slow ballad or anything that needs tenderness or space.",
          "parodyTraps": "Cartoon anti-authority posing the user never meant \u2014 generic anarchy slogans as costume; a slow, pretty, or over-produced take that kills the raw speed; a chorus too wordy or too melodic for a gang to bark; explaining or apologizing for the anger instead of just landing it; down-tuning and screaming toward Metal when this room is fast, mean, and still sung.",
          "performance": {
            "prose": "Density heavy; min adlibs 3; delivery tags [Shout] [Breakdown] [Build Up] [Guitar Solo]. This room performs like a band and a crowd shouting the same slogan \u2014 a snarled lead spitting the verses and a gang shout barking the chorus back, the energy flat-out and the guitars driving. Signature: the gang shout-back \u2014 the lead spits a line and a room full of voices barks the slogan or finishes it, the crowd answer landing on the chorus and the hardest turns so the record sounds like the pit it is for. Placement: verses stay lead-forward and fast; the gang [Shout] hits the chorus and the biggest lines; a short [Guitar Solo] can rip a quick break rather than a long showcase; a [Build Up] or a [Breakdown] snaps the band tight before it slams back in. Tag identity: a snarling lead and a shouting gang \u2014 the crowd barking the slogan back on the chorus, hard blunt hits landed like punches, a fast rough solo if any at all. All delivery stays raw energy and attitude in plain English \u2014 snarl, spit, bark \u2014 never a scripted slogan the user did not bring.",
            "adlibDensity": "heavy",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Shout]",
              "[Breakdown]",
              "[Build Up]",
              "[Guitar Solo]"
            ]
          },
          "builder": {
            "instruments": [
              "power chords",
              "electric guitars",
              "live drums",
              "driving bass"
            ],
            "themes": [
              "Rebellion",
              "Feeling like an outsider",
              "Standing back up",
              "Loss"
            ],
            "purposes": [
              "Raw energy",
              "Anthem / fists up",
              "Drive music"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "arena rock",
          "strength": "strong",
          "roomId": "classic"
        },
        {
          "cue": "classic rock",
          "strength": "strong",
          "roomId": "classic"
        },
        {
          "cue": "anthem",
          "strength": "strong",
          "roomId": "classic"
        },
        {
          "cue": "stadium",
          "strength": "weak",
          "roomId": "classic"
        },
        {
          "cue": "fists up",
          "strength": "weak",
          "roomId": "classic"
        },
        {
          "cue": "singalong",
          "strength": "weak",
          "roomId": "classic"
        },
        {
          "cue": "hometown",
          "strength": "weak",
          "roomId": "classic"
        },
        {
          "cue": "riff",
          "strength": "weak",
          "roomId": "classic"
        },
        {
          "cue": "road trip",
          "strength": "weak",
          "roomId": "classic"
        },
        {
          "cue": "standing back up",
          "strength": "weak",
          "roomId": "classic"
        },
        {
          "cue": "alternative rock",
          "strength": "strong",
          "roomId": "alternative"
        },
        {
          "cue": "indie rock",
          "strength": "strong",
          "roomId": "alternative"
        },
        {
          "cue": "grunge",
          "strength": "strong",
          "roomId": "alternative"
        },
        {
          "cue": "alt",
          "strength": "weak",
          "roomId": "alternative"
        },
        {
          "cue": "outsider",
          "strength": "weak",
          "roomId": "alternative"
        },
        {
          "cue": "alienation",
          "strength": "weak",
          "roomId": "alternative"
        },
        {
          "cue": "quiet loud",
          "strength": "weak",
          "roomId": "alternative"
        },
        {
          "cue": "introspective",
          "strength": "weak",
          "roomId": "alternative"
        },
        {
          "cue": "self-aware",
          "strength": "weak",
          "roomId": "alternative"
        },
        {
          "cue": "shoegaze",
          "strength": "weak",
          "roomId": "alternative"
        },
        {
          "cue": "punk",
          "strength": "strong",
          "roomId": "hard-rock"
        },
        {
          "cue": "hard rock",
          "strength": "strong",
          "roomId": "hard-rock"
        },
        {
          "cue": "punk rock",
          "strength": "strong",
          "roomId": "hard-rock"
        },
        {
          "cue": "aggressive",
          "strength": "weak",
          "roomId": "hard-rock"
        },
        {
          "cue": "rebellion",
          "strength": "weak",
          "roomId": "hard-rock"
        },
        {
          "cue": "fast",
          "strength": "weak",
          "roomId": "hard-rock"
        },
        {
          "cue": "raw",
          "strength": "weak",
          "roomId": "hard-rock"
        },
        {
          "cue": "mosh",
          "strength": "weak",
          "roomId": "hard-rock"
        },
        {
          "cue": "middle finger",
          "strength": "weak",
          "roomId": "hard-rock"
        },
        {
          "cue": "garage",
          "strength": "weak",
          "roomId": "hard-rock"
        }
      ]
    },
    "soul": {
      "id": "soul",
      "name": "Soul",
      "aliases": [
        "soul music",
        "motown",
        "neo-soul",
        "neo soul",
        "deep soul",
        "southern soul"
      ],
      "profileText": "A soul writer starts with the feeling worn at full sincerity and the voice that carries it \u2014 a gospel-trained lead over a live band, with a backing trio answering as a second character. Soul is not cool; irony and guardedness belong to other genres. The song is aimed at someone real \u2014 a lover, an ex, a family member, the room, the God-shaped ache behind the love \u2014 and every line should survive being sung to that face with the chest open. The subjects overlap heavily \u2014 love, devotion, heartache, grief, joy \u2014 so the subject can never tell you how to write; the dials do.\n\nThe genre's oldest habit is leaving room for the voice and the answer. The lead is the lead instrument, and the words must get out of its way: key lines end on open vowels the voice can hold, bend, and break on, and the backing trio needs gaps to answer into. Where the space goes is the room's call \u2014 snapped short for a horn stab, stretched long for a moan, or opened into a Rhodes pocket \u2014 but a lyric that leaves no space anywhere has already failed as soul. Call-and-response is structural, not decoration: plan the trio's answers into the lyric, and plan the outro vamp where the hook loops and the lead preaches freely over it.\n\nRepetition is a feature, and it escalates or deepens rather than merely repeating \u2014 the same hook returns hotter or truer each pass, so hook words must be simple and honest enough to survive many rounds. Rhyme runs on a spectrum the room sets: clean perfect rhyme reads as timeless in the vintage rooms and as an outsider's tell in the neo-soul one. The genre-wide law is smaller and firmer: the honest word outranks the rhyming word, every time, and plain words carry big feeling.\n\nThe gospel-rooted double meaning \u2014 the beloved described in near-worship language so one lyric serves altar and bedroom \u2014 is soul's birthright; use it when the user's story offers a true second meaning, never as decoration, and never announce it. Delivery is directed as feeling, register, and phrasing in plain English \u2014 the moan, the testify, the drift, the breath \u2014 never as an accent or a phonetic spelling, and never a craft term. Rendering protects three things in every room: space for the voice, a live human band and low end the phrasing was written to sit on, and the backing trio treated as its own instrument. Every dial bends to the user's story; none may change what the song is about.",
      "defaultRoomId": "classic-soul",
      "rooms": [
        {
          "id": "classic-soul",
          "name": "Classic Soul",
          "oneLine": "The Motown-and-Stax foundation \u2014 live band, horn stabs, a backing trio answering, songs that punch on the beat and lift a room whether the news is joy or heartache.",
          "tempoGroove": "Uptempo Motown-and-Stax grooves roughly 110-135 BPM with a driving backbeat and tambourine; mid-tempo and ballad numbers 70-100, some in a rolling 6/8 sway. Word density is moderate and even, and the words sit ON the beat more than any other room \u2014 punchy symmetrical phrases whose stressed syllables lock where the snare hits, short enough for a horn section to stab between them.",
          "writingDials": [
            "Lock the words to the beat: write tight, symmetrical phrases whose stressed syllables land on the backbeat and end a hair early, so the horns can throw a stab into the gap \u2014 a wordy line the horns cannot punch around is pitched wrong for this room.",
            "Plain words, big feeling: the vocabulary stays simple and universal; the craft lives in stress placement and escalating repetition, not clever wordplay \u2014 one true plain line outweighs a decorated one.",
            "Call-and-response is written into the lyric: plan short answer phrases and echo hooks for the backing trio in both verse and chorus, so the trio is a second character, not decoration.",
            "The register is testimony sung at full voice \u2014 love sworn, lost, begged for, or celebrated with full sincerity; irony, cool distance, and guardedness have no place, and even a heartache is sung open-chested.",
            "Repetition escalates: the same chorus words return hotter each pass, and the outro loops the hook while the lead preaches and improvises over the trio.",
            "The address is allowed to widen: what begins sung to one person can open to the whole room by the last chorus, testimony becoming celebration \u2014 the one soul room where the I turns to everybody listening.",
            "Rhyme is clean and confident \u2014 simple perfect rhymes read as timeless here, where the same rhymes would sound childish in a modern room; still, the honest word outranks the rhyming one.",
            "Cross-genre firewall: the live rhythm section with horn stabs and an on-beat backing trio make it Classic Soul, not modern R&B \u2014 no programmed 808 bounce, no drum machine leading; the band is human and the words snap to a played backbeat, not a sequenced one."
          ],
          "rendering": "A live rhythm section \u2014 real drums, electric bass, chanking rhythm guitar (short choppy strums right on the beat), piano or organ \u2014 with horn stabs and string sweetening, tambourine on the backbeat for the uptempo numbers. Raw, gospel-fired lead vocal with a backing trio answering line for line; 1960s-70s Motown-and-Stax analog warmth, real room sound, no modern vocal effects.",
          "storyFit": "Best for: milestone celebrations, tributes, songs for parents and grandparents, timeless full-hearted declarations of love, drink-in-hand heartache sung proud, joyful dance-along family songs. Poor fit: guarded modern situationship nuance, meditative reflection that needs stillness \u2014 that is Neo-Soul; a slow-burning wound wailed wide open \u2014 that is Deep Soul.",
          "parodyTraps": "Fake-vintage slang and era name-dropping \u2014 the period lives in the band, the chords, and the phrasing, never in the vocabulary; over-sweetening into jingle territory; wordy verses a horn section cannot punch around; imitation-oldies pastiche instead of sincere testimony built from the user's own story.",
          "performance": {
            "prose": "Density heavy; min adlibs 7; delivery tags [Call and Response] [Horns] [Harmonies] [Ad-Lib Section]. This room performs like a live band with a backing trio in the room, so it leans on adlibs hard and on delivery tags moderately \u2014 the trio answering and the testifying ad-lib carry most of the energy. Signature: the trio answered \u2014 the lead throws a call and the backing trio punches a short on-beat response in the gap, and the outro becomes a hook-loop vamp where the trio holds the repeated hook and the lead preaches freely over the top, the address opening from one person to the whole room. Placement: verses carry real trio answers, not just chorus ones \u2014 short on-beat responses and echoed line-ends kept punchy so the words stay locked to the backbeat; horn stabs fall where the vocal steps aside; an [Ad-Lib Section] hands the lead a preaching stretch over the final vamp. Tag identity: a lead and a backing trio as one church-born room \u2014 the trio's short (response phrases) written after the lead's calls, group harmony swelling on the final chorus, a testifying run reserved for the outro where the trio loops the hook. No lone star, no programmed stack \u2014 the room itself sings, in the user's own plain words.",
            "adlibDensity": "heavy",
            "minAdlibs": 7,
            "deliveryTags": [
              "[Call and Response]",
              "[Horns]",
              "[Harmonies]",
              "[Ad-Lib Section]"
            ]
          },
          "builder": {
            "instruments": [
              "horns",
              "live bass",
              "tambourine",
              "organ",
              "piano",
              "backing trio"
            ],
            "themes": [
              "Celebration of love",
              "Pride & respect",
              "Devotion",
              "Remembering someone",
              "Heartache"
            ],
            "purposes": [
              "Celebrate",
              "Slow dance",
              "Testify my love",
              "Cry it out"
            ]
          }
        },
        {
          "id": "southern",
          "name": "Southern / Deep Soul",
          "oneLine": "The raw, gospel-rooted, slow-burning heart of the genre \u2014 Aretha, Al Green, Percy Sledge \u2014 one lead moaning and preaching a wound wide open over organ, slow drums, and a swelling backing trio, no dignity held back.",
          "tempoGroove": "60-85 BPM in 4/4, or a slow 6/8 felt around 60-75 dotted-quarter \u2014 slow, unhurried, and churchy \u2014 a Hammond organ, live drums with a heavy behind-feel backbeat, and a bass that walks warm underneath while the trio swells. Word density is low: short lines with real air after them and long holds on the peaks, because the lead moans and preaches into the gaps and the words must leave room to break.",
          "writingDials": [
            "Leave room for the moan: end feeling-lines on open vowels the voice can hold, stretch, and break on, and leave the bar's tail empty \u2014 a crowded line gives the lead nothing to preach into, and the moan is half the feeling here.",
            "Wear the wound undefended: this room is the raw, church-born confession \u2014 devotion begged, a heartache aired, grief sung with the pride still in it but the guard gone. Self-exposure is the register, not a flaw.",
            "Testify, do not narrate coolly: the lead is a preacher of the feeling, so build lines that escalate and repeat hotter each pass, the way a testimony rises \u2014 plainspoken, sincere, aimed straight at the one who is gone or the God-shaped ache behind them.",
            "Keep the language plain and exposed: with the arrangement this bare, the words carry everything, so one true detail from the user's own life \u2014 the actual name, the actual last thing said \u2014 outweighs any ornament, and understatement is the wrong instinct; this room says the whole hurt.",
            "The backing trio and organ are the amen corner: plan swells and answering ooohs under the peaks, a trio that lifts the lead rather than trading fast \u2014 the response here is warmth rising, not a snappy punch.",
            "Repetition is devotional: a short aching hook re-sung more times than composure allows, gathering grief or gratitude each round instead of resolving, and an outro vamp where the lead improvises over the looping trio.",
            "Sensuality and worship share one breath: the beloved can be described in near-worship language so one lyric serves both the altar and the bedroom \u2014 the gospel-rooted double meaning, sustained, never spelled out.",
            "Cross-genre firewall: the slow live organ-and-drums bed with a moaning gospel lead and a swelling trio make it Deep Soul, not the Blues \u2014 there is no 12-bar turnaround, no slide guitar or harmonica trading the moan; the ache rises through the church, not through a blues lick, and the organ, not a bottleneck, is the second voice."
          ],
          "rendering": "Slow live band \u2014 Hammond organ holding long chords, warm walking electric bass, live drums with a heavy behind-the-beat backbeat, a churchy 6/8 sway, a backing trio swelling under the peaks, tasteful horns or strings sweetening the choruses. Raw, gospel-fired lead vocal moaning and preaching, close and undefended, pushed to the edge of breaking; 1960s-70s Southern deep-soul analog warmth, real room, no modern effects.",
          "storyFit": "Best for: devotion begged at full voice, heartache worn open, grief and remembrance, a love sworn through hard times, a slow-dance ache, longing that aches to the floor. Poor fit: bright party celebration and up-tempo dance joy \u2014 that is Classic Soul; cool, guarded, jazz-tinged reflection held at a meditative distance \u2014 that is Neo-Soul.",
          "parodyTraps": "Any slang or vintage costume the user never wrote; a moan faked as a vocal tic instead of earned by a real wound; greeting-card sorrow with no specific person in it; keeping a cool composed distance when the whole point is the guard coming down; filling the holds and gaps so the lead cannot break; pasting a blues slide-and-shuffle over it until the church is gone.",
          "performance": {
            "prose": "Density heavy; min adlibs 7; delivery tags [Call and Response] [Harmonies] [Ad-Lib Section] [Spoken]. This room performs like a lead testifying to a room that already feels it \u2014 one raw voice moaning and preaching, the backing trio and organ swelling behind, the ad-lib doing the deepest emotional work of any soul room. Signature: the testifying ad-lib \u2014 the lead breaks a held line into a moan, a repeated word, or a spoken aside in the gap the phrasing leaves, while the trio answers with a warm rising ooh, so the wound is stated twice, once in words and once in the break. Placement: verses stay bare so the moan carries them, with the trio's swells arriving under the peaks; the floor of ad-libs lives in the choruses and the outro vamp, where the lead preaches over the looping trio and a [Spoken] aside can drop where the guard breaks fully; harmonies rise on the final chorus rather than snapping between lines. Tag identity: a moaning lead and a swelling backing trio as the amen corner \u2014 warm rising (trio oohs) under the peaks, the testifying moan and repeated word in the gaps, one spoken confession where the guard drops, harmonies gathering on the outro. No snappy trade, no crowd chant \u2014 one voice broken open and a room rising behind it, every word from the user's own sheet.",
            "adlibDensity": "heavy",
            "minAdlibs": 7,
            "deliveryTags": [
              "[Call and Response]",
              "[Harmonies]",
              "[Ad-Lib Section]",
              "[Spoken]"
            ]
          },
          "builder": {
            "instruments": [
              "organ",
              "live bass",
              "backing trio",
              "horns",
              "strings",
              "piano"
            ],
            "themes": [
              "Devotion",
              "Heartache",
              "Longing",
              "Remembering someone",
              "Pride & respect"
            ],
            "purposes": [
              "Testify my love",
              "Cry it out",
              "Slow dance",
              "Celebrate"
            ]
          }
        },
        {
          "id": "neo-soul",
          "name": "Neo-Soul",
          "oneLine": "The laid-back, jazz-tinged modern lane \u2014 D'Angelo, Erykah Badu, Maxwell \u2014 Fender Rhodes and behind-the-beat grooves, lyrics that read like spoken poetry about love and self, the feeling meditated instead of belted.",
          "tempoGroove": "60-95 BPM with a heavily behind-the-beat, slightly drunken swing \u2014 the live drums drag on purpose and the voice floats over the bar line, a Fender Rhodes and warm bass holding extended jazz chords underneath. Word density is flexible: lines can be talky and dense or stretch one thought across four bars; either way the phrasing never sits squarely on the grid, and long instrumental pockets are left open.",
          "writingDials": [
            "Float the phrasing behind the beat: start lines late, let them cross bar lines, and resolve where natural speech would \u2014 write for a voice that treats the beat as a suggestion, the exact opposite of Classic Soul's on-the-beat punch.",
            "Imagery does the heavy lifting: turn abstract feeling into physical pictures built from the user's own world \u2014 a place, a body, a meal, the weather they actually live in \u2014 never pulled from a stock shelf; this is the most metaphor-rich soul room.",
            "Widen the subject past romance: self-knowledge, spirit, roots, growth \u2014 a neo-soul love song is always also about who the narrator is becoming, so let the reflection be part of the point.",
            "Rhyme loosens and moves inside the line: vowel echoes and internal rhyme carry the musicality, and a forced end-rhyme flattens the poetry and marks the writer as an outsider \u2014 the room where clean perfect rhyme is the wrong instinct.",
            "Meditate, do not belt: vulnerability sounds like reflection turned over quietly, not a begged confession or a testimony aired at full voice \u2014 the coolness and the drift are the feeling.",
            "Repetition works as mantra: a phrase returns with small changes until it deepens, and the closing vamp is allowed to circle at one level rather than lift \u2014 choruses can meditate instead of climbing.",
            "Write fewer words than feel necessary and leave long instrumental pockets \u2014 the Rhodes, the hum, and the silence are co-writers, and the band talking is part of the song.",
            "Cross-genre firewall: the live behind-the-beat band with a Fender Rhodes and jazz chords make it Neo-Soul, not modern programmed R&B \u2014 there is no clipped 808 bounce and no quantized grid; the drums are human and drag, and the run drifts loose rather than showing off on a sequenced pocket."
          ],
          "rendering": "Fender Rhodes with extended jazz chords, warm live bass, dusty in-the-pocket drums that drag a hair behind, muted guitar licks, optional horns. Vocals layered loose and human \u2014 hummed ad-libs, spoken asides, minimal pitch correction \u2014 with a late-90s-to-now organic, analog warmth and long pockets of room to breathe; unquantized, nobody performing at anyone.",
          "storyFit": "Best for: reflective stories \u2014 personal growth, self-love, gratitude, long-term love seen from altitude, roots and family lineage, spiritual searching, a quiet devotion turned over slow. Poor fit: bright up-tempo party celebration and belted anthems \u2014 that is Classic Soul; a wound wailed wide open at full voice \u2014 that is Deep Soul; urgent drama or anything that needs to hit hard on the beat.",
          "parodyTraps": "Fake-deep word salad with no concrete story underneath; mystical props stacked as decoration; imitating vocal scatting or filler syllables on the page; poeticness with zero specific detail from the user's actual life \u2014 the poetry must be built FROM their story, not draped over it; forcing neat end-rhyme where the room wants drift.",
          "performance": {
            "prose": "Density moderate; min adlibs 5; delivery tags [Rhodes] [Spoken] [Harmonies] [Instrumental Break]. Neo-Soul performs loose and human, not staged \u2014 the hums, the spoken asides, and the drifting run do the work, not a group belt. Signature: the closing vamp circles as a flat mantra instead of building \u2014 the chorus phrase repeats with small changes at the same dynamic level top to bottom while hums, a spoken aside, and a drifting (not peak) run wander over a long instrumental pocket. Placement: the adlib floor is back-heavy \u2014 most of the required adlibs live in the closing vamp, verses get at most one, and the bridge is near-zero, a loaded outro over near-empty verses rather than echoes sprinkled evenly under every hook; an [Instrumental Break] hands the Rhodes and band a stretch to talk. Tag identity: a loose live room \u2014 hummed (mmm) drifting anywhere in a line, (spoken: low observation) asides on their own lines, soft harmonies arriving loose rather than snapped, and instrumental-breathing headers where the band talks. Human and unquantized, every image built from the user's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 5,
            "deliveryTags": [
              "[Rhodes]",
              "[Spoken]",
              "[Harmonies]",
              "[Instrumental Break]"
            ]
          },
          "builder": {
            "instruments": [
              "Rhodes piano",
              "live bass",
              "organ",
              "horns",
              "backing trio",
              "strings"
            ],
            "themes": [
              "Devotion",
              "Longing",
              "Pride & respect",
              "Remembering someone",
              "Celebration of love"
            ],
            "purposes": [
              "Testify my love",
              "Slow dance",
              "Cry it out",
              "Celebrate"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "motown",
          "strength": "strong",
          "roomId": "classic-soul"
        },
        {
          "cue": "stax",
          "strength": "strong",
          "roomId": "classic-soul"
        },
        {
          "cue": "old school",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "throwback",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "tribute",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "milestone",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "celebration",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "grandparents",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "for my parents",
          "strength": "weak",
          "roomId": "classic-soul"
        },
        {
          "cue": "deep soul",
          "strength": "strong",
          "roomId": "southern"
        },
        {
          "cue": "southern soul",
          "strength": "strong",
          "roomId": "southern"
        },
        {
          "cue": "gospel-rooted",
          "strength": "weak",
          "roomId": "southern"
        },
        {
          "cue": "testify",
          "strength": "weak",
          "roomId": "southern"
        },
        {
          "cue": "moan",
          "strength": "weak",
          "roomId": "southern"
        },
        {
          "cue": "grief",
          "strength": "weak",
          "roomId": "southern"
        },
        {
          "cue": "begging",
          "strength": "weak",
          "roomId": "southern"
        },
        {
          "cue": "heartache",
          "strength": "weak",
          "roomId": "southern"
        },
        {
          "cue": "slow burn",
          "strength": "weak",
          "roomId": "southern"
        },
        {
          "cue": "neo-soul",
          "strength": "strong",
          "roomId": "neo-soul"
        },
        {
          "cue": "neo soul",
          "strength": "strong",
          "roomId": "neo-soul"
        },
        {
          "cue": "rhodes",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "jazzy",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "growth",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "self-love",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "spirit",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "roots",
          "strength": "weak",
          "roomId": "neo-soul"
        },
        {
          "cue": "reflection",
          "strength": "weak",
          "roomId": "neo-soul"
        }
      ]
    },
    "blues": {
      "id": "blues",
      "name": "Blues",
      "aliases": [
        "blues music",
        "delta blues",
        "chicago blues",
        "electric blues"
      ],
      "profileText": "A blues writer starts with the twelve-bar AAB stanza \u2014 the skeleton the whole genre hangs on. A line states the trouble, the same line comes again with a small turn or a deepened word, and a rhyming third line answers it and lands the point. That repeat is not filler; it is the form breathing, giving the feeling a second pass before the answer arrives. A verse that skips the repeat, or a chorus-and-riff shape with no stated-then-answered line, is not blues \u2014 it has borrowed the costume and lost the bones. And the AAB rides the blues harmony: the I-IV-V changes move under it (the IV arriving around bar five, the V turning it home), and the melody bends the flatted blue notes \u2014 the lowered third, fifth, and seventh. An AAB sung over plain major changes with no blue notes is a folk song in three-line clothing, not blues; the harmony and the bend are half the fingerprint.\n\nThe second law is the answering voice. The guitar or the harp is a second singer, and it gets the last word. The writing job is to leave it room \u2014 end phrases early, let the bar hang, and hand the gap to the bottleneck, the harmonica, or the single crying guitar note that answers the emotion of the line. The ache gets stated twice: once in words, once in steel or reed. A blues sheet packed wall-to-wall, no air after the lines, has silenced the instrument that defines the genre and failed before its first word is judged.\n\nThe third law is the specific hard-luck truth told plain. Blues lives on the actual road, the actual debt, the real name and the real wound \u2014 one bitter concrete detail from the user's own life, said in everyday words a plain voice can half-sing and half-moan. Understatement bites harder than melodrama, and the honest word outranks the clever rhyme. The cardinal failure is woke-up-this-morning autopilot: stacking generic misery and stock cliches the user never lived, mistaking blues vocabulary for having something true to say.\n\nThe rooms bend all of this. Delta strips it to one voice and one bottleneck, rubato and raw, superstitious and close to the bone. Chicago plugs the same trouble into a band and a hard shuffle and lets a harp holler it back, loud and citified and cocky. Soul-blues dresses it in horns and a stinging single-string guitar and sings the AAB grown, in full voice \u2014 dignified heartache, testimony about love more than a field holler. The law above every dial holds: English is the song's language, blues idiom and slang appear only if the user wrote them, and craft words \u2014 AAB, the twelve-bar, the turnaround, call-and-answer \u2014 are the writer's tools, never the song's, never entering the lyrics, adlibs, or render notes. Delivery is directed as feel and phrasing in plain English \u2014 the moan, the crack, the shout, the swing \u2014 never as an accent, and the user's own people and places always outrank stock crossroads scenery.",
      "defaultRoomId": "delta",
      "rooms": [
        {
          "id": "delta",
          "name": "Delta / Country Blues",
          "oneLine": "The porch-and-crossroads root \u2014 one voice, one bottleneck or resonator, hard-luck truth told raw and superstitious, the Robert Johnson and Son House lane.",
          "tempoGroove": "60-120 BPM \u2014 the crying-on-the-porch lament runs loose and rubato, but the hill-country boogie and up-tempo juke side (Charley Patton, uptempo Son House) keeps a hard, steady, danceable groove; the twelve bars stretch and snap back to the singer's breath, not a click; foot-stomp and a droning bass string keep time under a shuffling or drop-thumb picked pattern. Low word density: short spoken-length phrases with real air after them, because the slide answers the voice at the end of nearly every line and the singer needs room to moan.",
          "writingDials": [
            "Write the twelve-bar AAB straight: state the trouble in the first line, sing it again with a small turn or a deepened word, then answer it with a rhyming third line that lands the point \u2014 this stanza is the form, and a verse that skips the repeat is not blues.",
            "Slide-first: the bottleneck or resonator is the second voice and it gets the last word, so end phrases early and leave the bar hanging for the guitar to cry the answer \u2014 a sheet that fills every beat has silenced the instrument that defines the room.",
            "Tell the specific hard-luck truth plain: the actual road, the actual debt, the actual name \u2014 one real bitter detail from the user's own life carries more than any stack of generic misery, and understatement bites harder than melodrama.",
            "Let it get superstitious and close to the bone: the crossroads, the black cat, the hoodoo, the mojo belong here when the user reaches for them \u2014 the Delta lives on omens and the devil at your heels, not tidy modern reflection.",
            "Keep the language spoken and unadorned: everyday words a plain voice half-talks and half-moans, plain near-rhyme over any clever scheme; the point is the truth landing rough, not the craft showing.",
            "First person, alone, addressing the trouble or the one who caused it \u2014 no crowd, no band to hide in; the whole weight sits on one voice and the guitar answering it.",
            "Cross-genre firewall: What makes it Delta and not folk or singer-songwriter is the AAB stanza and the bottleneck answering each line \u2014 folk narrates in verses and chorus over strummed chords with no call-and-answer and no repeated blues line; this room moans the AAB and hands every gap to the slide."
          ],
          "rendering": "Solo country blues \u2014 one raw resonator or bottleneck slide guitar answering every vocal line, a droning bass string and foot-stomp keeping loose time, no drum kit and no band. Weathered lead vocal half-sung and half-moaned, pushed to a cracked growl at the peaks, dry and close like a porch recording; 1920s-30s Delta field-recording rawness, warm and un-gloss.",
          "storyFit": "Best for: hard-luck told plain, a love that did you wrong, the road and rambling, a deal at the crossroads, poverty and back-breaking work, a haunted lonesome confession. Poor fit: band-driven shuffle celebration \u2014 that is Chicago; polished grown heartache with horns \u2014 that is soul-blues; any story that wants a crowd or a groove to dance to.",
          "parodyTraps": "Woke-up-this-morning autopilot with no real trouble under it; sprinkled blues cliches the user never lived; filling the slide's answer gaps with words; skipping the AAB repeat and calling it blues; a clean modern polish or a full band where the whole point is one raw voice and its guitar.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Guitar Solo] [Slide Guitar] [Moan] [Spoken]. This room performs like one person crying to an empty porch \u2014 a lone weathered voice and the bottleneck answering it like a second mourner, no band, no crowd, no polish. Signature: the slide answer \u2014 the guitar cries back the emotion of the line in the gap the phrasing leaves, so the ache is stated twice, once in words and once in steel, and a low moan or hummed note fills where words run out. Placement: the slide answers land at the line-ends the singer leaves open, roughly one per line through the AAB, and a [Guitar Solo] takes a whole twelve-bar turn where the words stop and the bottleneck carries the grief; a rough moan can trail the third line, and the final verse cracks hardest. Tag identity: a lone hard-luck voice and its answering slide \u2014 the guitar as the second mourner, a bare moan where words fail, the solo marked as its own twelve-bar cry. No band, no hype, no room full of people \u2014 one person, one guitar answering, every sung word plain language from the user's own sheet.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Guitar Solo]",
              "[Slide Guitar]",
              "[Moan]",
              "[Spoken]"
            ]
          },
          "builder": {
            "instruments": [
              "resonator guitar",
              "slide guitar",
              "harmonica"
            ],
            "themes": [
              "Hard times",
              "Love done me wrong",
              "The road",
              "Regret & redemption",
              "Working for nothing"
            ],
            "purposes": [
              "Moan it out",
              "Tell it straight",
              "Shuffle / dance"
            ]
          }
        },
        {
          "id": "chicago",
          "name": "Chicago / Electric Blues",
          "oneLine": "The plugged-in city sound \u2014 full band, wailing harp and electric slide, a hard shuffle built to move a room, the Muddy Waters and Howlin' Wolf lane.",
          "tempoGroove": "90-130 BPM locked to a driving shuffle or a slow twelve-bar grind \u2014 the AAB stays tight to the groove, no rubato, because the band and the floor are keeping time now. Low-to-moderate word density: punchy phrases that ride the shuffle and stop early, leaving the bar open for the harp or the slide to holler back between lines.",
          "writingDials": [
            "Keep the twelve-bar AAB but lock it to the shuffle: state the line, repeat it with a turn on the groove, answer it with the rhyming third \u2014 the form is the same as the Delta, but now it snaps to the band instead of stretching to the breath.",
            "The harp and electric slide are the answering voices: end lines early and plan the gaps where the harmonica wails back and the guitar stings the response, and mark the instrumental turn where the harp takes a whole chorus alone.",
            "Carry the trouble loud and citified: this is the Delta's hard-luck moved to the South Side and plugged in \u2014 the same betrayal or hard road, but cocky, defiant, worn with swagger instead of naked despair.",
            "Write for a voice that shouts over a band: strong open vowels at the line-ends and phrase peaks a singer can push and holler, because Chicago vocals ride on top of an amplified band, never murmur under it.",
            "Direct and boastful address is at home: bragging on yourself, warning a rival, calling out the one who did you wrong \u2014 first person with attitude, aimed straight across the room.",
            "Rhyme clean and sturdy on the third line so the answer lands square with the groove \u2014 plain perfect or near-rhyme the room hears coming, the honest word still outranking the clever one.",
            "Cross-genre firewall: What makes it Chicago blues and not blues-rock is the AAB stanza and the harp-and-slide answering the vocal over a shuffle \u2014 blues-rock builds on a repeated riff and a sung chorus with no AAB and no call-and-answer; this room keeps the twelve-bar form and hands every gap to the harp, never to a riff."
          ],
          "rendering": "Full electric Chicago band \u2014 amplified harmonica wailing back at the vocal, electric slide and lead guitar stinging the answers, piano comping, walking electric bass, drum kit driving a hard shuffle. Gritty commanding lead vocal shouted over the band with a cupped-mic edge, harp taking full choruses; 1950s Chess Records amplified warmth, live and hot, no modern gloss.",
          "storyFit": "Best for: hard trouble carried with swagger, a love that did you wrong answered with defiance, the road and the move to the city, boasting and warning a rival, a Saturday-night shuffle for a room. Poor fit: a naked solo porch confession \u2014 that is Delta; smooth polished grown heartache with horns \u2014 that is soul-blues; anything that needs stillness and no band.",
          "parodyTraps": "Woke-up-this-morning filler with no real story under it; blues costume and slang the user never wrote; burying the harp and slide under wall-to-wall vocals; dropping the AAB for a rock riff and chorus; a thin under-sung delivery that fights the shouting band.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Harmonica Solo] [Guitar Solo] [Call and Response] [Shout]. This room performs like a hot electric band with the harp hollering back \u2014 one commanding shouted lead over a full shuffle band, and the harp and slide trading calls with the voice is the whole signature. Signature: the harp answer \u2014 the harmonica wails back the emotion of each line in the gap the voice leaves and the electric slide stings its own reply, so the AAB gets answered by the band every stanza. Placement: the harp and slide answers fall at the line-ends where the vocal steps aside, one per line through the verses; a [Harmonica Solo] hands the harp a full twelve-bar chorus and a [Guitar Solo] gives the slide its own, and a rough shout tops the biggest turns. Tag identity: a shouting lead and an answering band \u2014 the harp hollering in the gaps, the slide stinging its reply, a rough defiant shout thrown over the peaks. Every shout is energy in plain English, never a scripted foreign exclamation the user never wrote.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Harmonica Solo]",
              "[Guitar Solo]",
              "[Call and Response]",
              "[Shout]"
            ]
          },
          "builder": {
            "instruments": [
              "harmonica",
              "electric slide guitar",
              "barrelhouse piano",
              "electric bass",
              "drum kit"
            ],
            "themes": [
              "Love done me wrong",
              "Hard times",
              "The road",
              "Working for nothing",
              "Regret & redemption"
            ],
            "purposes": [
              "Shuffle / dance",
              "Tell it straight",
              "Moan it out"
            ]
          }
        },
        {
          "id": "soul-blues",
          "name": "Soul-Blues / Contemporary",
          "oneLine": "The grown, horn-dressed lane \u2014 polished band, a single-string guitar stinging between lines, dignified heartache sung in full voice, the B.B. King and Bobby Bland lane.",
          "tempoGroove": "70-110 BPM over a smooth twelve-bar or a slow soulful grind, a horn section and organ cushioning the groove and a tight kit keeping it warm. Moderate word density: fuller sung lines with a gospel-schooled control that still break early to leave the guitar its single-string answer, carrying real feeling per line.",
          "writingDials": [
            "Keep the twelve-bar AAB but sing it grown: state the line, repeat it with a deepened turn, answer it with the rhyming third \u2014 the blues form holds, but it is sung in full controlled voice, not moaned, closer to a testimony about love than a field holler.",
            "The guitar stings back single-string: leave the gap at each line-end for one crying held note or a short lead phrase to answer the voice, and plan the instrumental chorus where the guitar sings alone \u2014 sparse and vocal, never a wall of notes.",
            "Write dignified heartache, not raw despair: this room testifies about a love that hurt with pride and composure intact \u2014 the ache is grown and self-possessed, delivered by someone who has survived it and can name it clearly.",
            "Write for a full soulful voice: end feeling-lines on open vowels the singer can hold, swell, and lift, because soul-blues carries melisma and gospel-trained power the Delta and Chicago rooms keep plain.",
            "Leave real holes for the horns and the guitar even in the fuller arrangement: a soul-blues sheet that buries the single-string answer and the horn swells under nonstop vocals has lost the lane's spine.",
            "First person to one person, adult and specific: devotion, a proud reckoning, a heartache owned with dignity \u2014 one detail only the two of them would know keeps it off the greeting-card shelf.",
            "Cross-genre firewall: What makes it soul-blues and not soul is the twelve-bar AAB and the single-string guitar answering each line \u2014 soul testifies in verses and a big chorus with gospel backing and horns but no AAB stanza and no answering blues guitar; this room keeps the twelve-bar form and hands the gaps to the crying guitar, not to a backing choir."
          ],
          "rendering": "Polished soul-blues band \u2014 a warm horn section swelling behind the voice, organ and piano cushioning, a single crying lead guitar stinging held-note answers between lines, round bass and a tight smooth kit. Rich full-voiced lead with gospel-trained control and tasteful melisma, subtle backing harmonies on the peaks, a warm produced sheen; 1960s-to-now soul-blues warmth, clean but never cold.",
          "storyFit": "Best for: grown dignified heartache, a love done wrong owned with pride, devotion through hard times, a proud reckoning with an ex, a slow soulful lament for a room. Poor fit: a raw solo porch moan \u2014 that is Delta; a loud cocky shuffle for the floor \u2014 that is Chicago; anything needing rawness over polish or a crowd to dance.",
          "parodyTraps": "Woke-up-this-morning cliche with no real grown story under it; blues or soul costume the user never wrote; burying the guitar's single-string answer under a wall of horns and vocals; dropping the AAB for a straight soul chorus; a raw un-schooled delivery where the room asks for controlled grown power.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Guitar Solo] [Call and Response] [Harmonies] [Instrumental Break]. This room performs like a grown singer with a crying guitar for a partner \u2014 one full soulful lead, a warm horn section behind, and the single-string guitar answering and trading with the voice. Signature: the guitar sting \u2014 a single crying held note or a short lead phrase answers each sung line in the gap the voice leaves, a call-and-answer between the singer and the guitar that carries the ache between the words. Placement: the guitar answers sit in the gaps at line-ends and a full [Guitar Solo] takes the instrumental chorus; horn swells and light harmonies lift the hook, and an [Instrumental Break] hands a stretch to the band on the biggest turn. Tag identity: a grown lead and his crying guitar \u2014 the single-string answer in the gaps, horn swells and soft harmonies on the peaks, one held solo reserved for the instrumental chorus. No porch, no shouting band, no crowd \u2014 a grown voice and the guitar that answers it, every sung word from the user's own sheet.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Guitar Solo]",
              "[Call and Response]",
              "[Harmonies]",
              "[Instrumental Break]"
            ]
          },
          "builder": {
            "instruments": [
              "single-string electric lead guitar",
              "organ",
              "piano",
              "electric bass",
              "drum kit",
              "horn section"
            ],
            "themes": [
              "Love done me wrong",
              "Regret & redemption",
              "Hard times",
              "Working for nothing",
              "The road"
            ],
            "purposes": [
              "Tell it straight",
              "Moan it out",
              "Shuffle / dance"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "delta blues",
          "strength": "strong",
          "roomId": "delta"
        },
        {
          "cue": "country blues",
          "strength": "strong",
          "roomId": "delta"
        },
        {
          "cue": "robert johnson",
          "strength": "strong",
          "roomId": "delta"
        },
        {
          "cue": "crossroads",
          "strength": "strong",
          "roomId": "delta"
        },
        {
          "cue": "acoustic",
          "strength": "weak",
          "roomId": "delta"
        },
        {
          "cue": "resonator",
          "strength": "weak",
          "roomId": "delta"
        },
        {
          "cue": "hoodoo",
          "strength": "weak",
          "roomId": "delta"
        },
        {
          "cue": "hard luck",
          "strength": "weak",
          "roomId": "delta"
        },
        {
          "cue": "chicago blues",
          "strength": "strong",
          "roomId": "chicago"
        },
        {
          "cue": "electric blues",
          "strength": "strong",
          "roomId": "chicago"
        },
        {
          "cue": "muddy waters",
          "strength": "strong",
          "roomId": "chicago"
        },
        {
          "cue": "harmonica",
          "strength": "strong",
          "roomId": "chicago"
        },
        {
          "cue": "shuffle",
          "strength": "weak",
          "roomId": "chicago"
        },
        {
          "cue": "south side",
          "strength": "weak",
          "roomId": "chicago"
        },
        {
          "cue": "full band",
          "strength": "weak",
          "roomId": "chicago"
        },
        {
          "cue": "swagger",
          "strength": "weak",
          "roomId": "chicago"
        },
        {
          "cue": "soul blues",
          "strength": "strong",
          "roomId": "soul-blues"
        },
        {
          "cue": "b.b. king",
          "strength": "strong",
          "roomId": "soul-blues"
        },
        {
          "cue": "bobby bland",
          "strength": "strong",
          "roomId": "soul-blues"
        },
        {
          "cue": "horns",
          "strength": "strong",
          "roomId": "soul-blues"
        },
        {
          "cue": "polished",
          "strength": "weak",
          "roomId": "soul-blues"
        },
        {
          "cue": "grown",
          "strength": "weak",
          "roomId": "soul-blues"
        },
        {
          "cue": "organ",
          "strength": "weak",
          "roomId": "soul-blues"
        },
        {
          "cue": "heartache",
          "strength": "weak",
          "roomId": "soul-blues"
        }
      ]
    },
    "jazz": {
      "id": "jazz",
      "name": "Jazz",
      "aliases": [
        "jazz music",
        "vocal jazz",
        "swing",
        "bebop"
      ],
      "profileText": "A jazz writer starts from the standard \u2014 the song-shape the whole tradition is built on, most often AABA across thirty-two bars: an eight-bar phrase, its repeat, a bridge that lifts and turns the harmony, then the last A come home changed. The title tends to land at the top or tail of the A and to name the whole feeling in a breath; the bridge is where the writing earns its keep, moving the emotion somewhere the A could not reach before handing it back. So the craft is architectural before it is verbal \u2014 build the frame, place the turn, and leave the melody room to be sung, not crammed. A lyric packed wall-to-wall, with no air for the phrasing to lag and no chorus left for a solo, has failed before its first image is judged.\n\nThe second thing a jazz writer knows is that phrasing sits behind the beat. The voice does not march the barline; it leans back, drags the phrase, holds a vowel late and lets it trail \u2014 the swing and the ache both live in that lag. So feeling-lines end on open vowels a singer can stretch, and the last beat or two of a phrase stays open, because something answers there. That answer is the third law: the instrumental solo is a real section, not an interlude. A chorus \u2014 often the bridge \u2014 is handed to the muted trumpet, the tenor sax, or the piano to state the melody and improvise over the changes, and in the up-tempo lane the voice and the horn trade fours like sparring partners. The page cannot script the improvisation, but it must build the room for it \u2014 the written gap, the solo chorus, the trade.\n\nAnd the words themselves are sophisticated \u2014 interior imagery, one precise adult detail turned slowly, interior and slant rhyme surfacing on the second listen, understatement over announcement. The rooms bend all of this. The ballad slows toward rubato and croons one ache close, a muted horn answering. Swing springs up-tempo, scats, and trades fours, witty and worldly. Cool drops to a smoky 3 a.m. hush and says the least it can, phrases floating late over the widest air. The law above every dial holds: lyrics are English, and the writer's craft words \u2014 swing, changes, bridge, scat, modal, behind the beat \u2014 are tools, never the song; they never enter the lyrics, adlibs, or render notes. Delivery is directed as phrasing, tone, and swing in plain English \u2014 lean it back, hold it, let it trail \u2014 and the user's own people, places, and words outrank every stock lounge trope.",
      "defaultRoomId": "vocal-ballad",
      "rooms": [
        {
          "id": "vocal-ballad",
          "name": "Vocal Ballad / Torch Song",
          "oneLine": "The Great American Songbook croon \u2014 a slow standard sung close and sophisticated, one ache carried on a long behind-the-beat line, the Billie / Sinatra / Ella ballad lane.",
          "tempoGroove": "55-75 BPM, a slow four often loosened toward rubato at phrase-edges, brushed drums whispering and the upright walking soft under a piano trio; the muted trumpet or tenor breathes in the gaps. Low word density: long sung phrases with open vowels held across the bar, real air after each line, because the voice sits far behind the beat and a muted horn answers the ache at nearly every turn.",
          "writingDials": [
            "Write the standard shape: think AABA thirty-two bars, an eight-bar phrase repeated, then a bridge that lifts and turns the feeling before the last A returns \u2014 the title usually lands at the top or the tail of the A, and the bridge earns the difference.",
            "Phrase behind the beat: end feeling-lines on open vowels the voice can lean on and stretch late, and leave the last beat or two of a phrase open so the singer can drag it and the horn can answer \u2014 a line packed to the barline gives the croon nowhere to sit.",
            "Sophisticated interior imagery, not lounge clich\xE9: one precise image from the user's own life turned slowly, adult and specific \u2014 the ache is shown through a concrete detail and understatement, never announced with moon-and-cocktail postcard furniture.",
            "Interior and slant rhyme reward the ear: internal rhyme woven inside the long line and a gentle near-rhyme at the phrase-end read as craft here, where a hammered perfect rhyme can flatten the mood \u2014 the rhyme should surface on the second listen.",
            "Keep the world at one table: this is confession to a single person or to the self at close distance \u2014 devotion, longing, a bittersweet memory, a torch still carried; never widen to a crowd or a message.",
            "The bridge is the turn, not more of the same: the B section must move the feeling somewhere the A could not go \u2014 a doubt, an admission, a memory that reframes the ache \u2014 then hand the last A back changed.",
            "The solo is a written section: plan a chorus (or the bridge) where the words stop and the muted trumpet or tenor sax takes the melody and improvises the ache \u2014 the lyric is built around that instrumental cry, not over it.",
            "Cross-genre firewall: the AABA standard shape and the behind-the-beat croon over a brushed piano trio make it jazz, not a blues \u2014 there is no twelve-bar AAB and no moaned three-line stanza here; the ache is carried in sophisticated harmony and a held sophisticated line, not a field holler, and a real horn chorus, not a guitar break, answers it."
          ],
          "rendering": "Warm piano trio \u2014 felt-hammer piano comping soft voicings, upright bass walking gentle behind the beat, brushed drums barely there \u2014 with a muted trumpet or tenor sax answering the vocal in the gaps and taking the solo chorus. Intimate close-miked lead vocal, dry and warm with natural breath, sung far behind the beat with a long held sustain and at most a soft harmony shadow; late-night supper-club sound, timeless 1950s-60s vocal-jazz warmth, no synths.",
          "storyFit": "Best for: late-night romance, longing, a bittersweet memory, a torch carried for someone gone, devotion sung close, a slow-burn confession. Poor fit: up-tempo joy and wit that wants to swing \u2014 that is the swing room; a bare oblique 3 a.m. murmur \u2014 that is cool; anything needing a crowd, a message, or backbeat drive.",
          "parodyTraps": "Moon-June-cocktail lounge clich\xE9 standing in for the user's real ache; a lyric packed wall-to-wall so the croon cannot lag and the horn cannot answer; naming the craft \u2014 swing, changes, bridge \u2014 inside the words; a belted delivery that fights the intimacy; skipping the solo chorus so the standard has no instrumental section.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Crooning] [Soft] [Trumpet Solo] [Sax Solo]. This room performs at one small table \u2014 a single crooner far behind the beat with at most a soft harmony shadow, and the muted horn as the answering voice, no crowd and no trade. Signature: the horn's answer \u2014 the muted trumpet or tenor sax replies in the open space the lagging phrase leaves, stating the ache a second time in brass the way the voice just stated it in words, then takes a whole chorus alone. Placement: the crooner carries the verses nearly bare; the horn answers at the line-ends where the phrase drags, and the [Trumpet Solo] or [Sax Solo] owns a full chorus (often the bridge) where the words stop entirely; a soft harmony can shadow the title's last word, and the final line holds longest. Tag identity: a lone behind-the-beat crooner and an answering muted horn \u2014 a [Soft] intimacy throughout, a bare harmony shadow on the title only, the solo chorus marked as its own instrumental section. No band trading, no scat, no crowd \u2014 one voice, one horn answering it, every sung word from the user's own sheet.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Crooning]",
              "[Soft]",
              "[Trumpet Solo]",
              "[Sax Solo]"
            ]
          },
          "builder": {
            "instruments": [
              "piano trio",
              "muted trumpet",
              "tenor sax",
              "upright bass",
              "brushed drums",
              "comping guitar"
            ],
            "themes": [
              "Late-night romance",
              "Longing",
              "Bittersweet memory",
              "New flame"
            ],
            "purposes": [
              "Croon it close",
              "Slow burn"
            ]
          }
        },
        {
          "id": "swing",
          "name": "Swing / Uptempo",
          "oneLine": "The swinging bebop-tinged standard \u2014 an up-tempo number that springs to its feet, trades fours with the soloist, and lets the voice scat like a horn.",
          "tempoGroove": "140-300 BPM (the genuine bebop burners run 260-300, where the scat and trade-fours pay off), a bright swung four riding the cymbal, the upright walking hard and the brushes or sticks driving the pocket while the piano trio comps and a horn spars with the voice. Medium word density with clipped, bouncing phrases that lock to the ride and leave gaps for the answer \u2014 the syllables ride the swing like another horn, so mouth-feel and pocket matter as much as sense, and phrase-ends open for a trade.",
          "writingDials": [
            "Keep the standard shape but play it up: AABA at speed, the title snapping in on the A, the bridge turning the harmony and the wit before the last A \u2014 the form is the springboard the swing bounces off.",
            "Write for the swing bounce: clip syllables to land on and around the ride cymbal, favor short punchy words and internal rhyme that skips across the beat, and phrase behind it just enough to swing rather than march \u2014 the line should feel like it is being played, not read.",
            "Wit and worldliness are the register: quick, clever, urbane \u2014 a light touch, a turned phrase, a knowing joke about love or the city from the user's own life; the up-tempo standard smiles even when the news is rueful, and the cleverness is the charm.",
            "Leave room to trade fours: end phrases open so the horn or piano can answer for a bar, then the voice comes back \u2014 build the verse as call-and-answer with the soloist, gaps written in for the trade.",
            "The voice can scat like a horn: mark a passage where the singer improvises on syllables in place of words, trading with the solo \u2014 plan where the scat lives, but the words around it stay the user's plain language.",
            "Internal rhyme and playful perfect rhyme drive it: hammering a bright rhyme sound across a few lines builds momentum here, where the ballad would soften it; the rhyme is part of the swing's engine.",
            "The solo section is the peak: hand a full chorus to the tenor sax, trumpet, or piano to blow over the changes, and plan the trade-fours stretch \u2014 the instrumental is the event the arrangement drives toward, not a break.",
            "Cross-genre firewall: the swung four, the AABA standard, the scat and the trade-fours over a walking upright make it jazz, not soul or pop \u2014 there is no straight backbeat, no gospel-testimony horn section riffing behind the singer, no four-on-the-floor; the horns spar and solo over swinging changes, they do not stack a groove."
          ],
          "rendering": "Swinging piano trio driving hard \u2014 walking upright bass, ride-cymbal swing with brushes or sticks, piano comping bright \u2014 with a tenor sax or trumpet trading fours with the voice and blowing a full solo chorus over the changes. Lively confident lead vocal that swings behind the beat and scats where marked, at most a tight harmony hit; live, warm, up-tempo big-band-small-group sound, hot and bouncing but never rushed, no synths.",
          "storyFit": "Best for: swing / dance, wit and worldly charm, a rueful love turned light, city nights, a new flame played for fun, celebration with a knowing smile. Poor fit: a slow torch ache that wants to be held \u2014 that is the ballad; a bare smoky 3 a.m. murmur \u2014 that is cool; grief or heavy weight the bounce cannot carry.",
          "parodyTraps": "Generic finger-snapping lounge patter with no real wit under it; cramming every beat so nothing swings and no trade can happen; naming the craft \u2014 scat, trade fours, changes \u2014 inside the words; a dragged or straight delivery that kills the swing; skipping the solo chorus and the trade so the up-tempo standard has no instrumental peak.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Scat] [Sax Solo] [Trumpet Solo] [Piano Solo]. This room performs like a small group swinging on its feet \u2014 a confident lead trading with the soloist and scatting like another horn, the call-and-answer between voice and band the whole signature. Signature: the trade \u2014 the voice fires a phrase and the sax, trumpet, or piano answers for a bar in the gap, the two sparring back and forth, and a scat passage lets the singer improvise on syllables and trade fours with the horn. Placement: the verses stay lead-forward with the horn answering at the open line-ends; a [Scat] passage lets the voice blow, and a [Sax Solo], [Trumpet Solo], or [Piano Solo] takes a full chorus over the changes (often into trade-fours) as the peak; a tight harmony hit can punch the title. Tag identity: a swinging lead and a sparring band \u2014 the horn trading fours in the gaps, a [Scat] where the voice turns horn, a full solo chorus handed to the tenor, trumpet, or piano. No lone crooner and no crowd chant \u2014 a voice and a band trading, every sung word the user's own plain language.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Scat]",
              "[Sax Solo]",
              "[Trumpet Solo]",
              "[Piano Solo]"
            ]
          },
          "builder": {
            "instruments": [
              "piano trio",
              "tenor sax",
              "muted trumpet",
              "upright bass",
              "brushed drums",
              "comping guitar"
            ],
            "themes": [
              "City nights",
              "New flame",
              "Late-night romance",
              "Longing"
            ],
            "purposes": [
              "Swing / dance",
              "Croon it close"
            ]
          }
        },
        {
          "id": "cool",
          "name": "Cool / Late-Night",
          "oneLine": "The smoky, modal, sparse lane \u2014 a slow-to-mid standard that says the least it can, phrases floating late over a hushed trio, the Chet Baker / Miles-adjacent 3 a.m. sound.",
          "tempoGroove": "70-110 BPM, an unhurried understated pulse \u2014 soft walking upright, brushes barely there, a piano trio comping sparse open voicings, a muted trumpet exhaling in the wide gaps. Low word density: a spare line floated late, with a lot of held air the trio and horn fill \u2014 the restraint is the sound, so leave real silence around the words and let the space carry the mood.",
          "writingDials": [
            "Underplay everything: the least-said room \u2014 a spare oblique line that trusts the space, no runs, no scatting, no belting; one plain phrase and a lot of air says more than a full lyric, so cut to the bone.",
            "Float the phrase late: enter after the beat, let the line hang unhurried and end on an open vowel that trails into the silence the horn answers \u2014 the lateness and the air are the phrasing, so write short lines with long gaps written in.",
            "Oblique, understated imagery: a private thought half-said, a detail from the user's own late hour left to imply the feeling \u2014 the cool room suggests and withholds; the meaning surfaces in what is not spelled out, never in a declared emotion.",
            "Keep it AABA but bare: hold the standard shape lightly, the bridge a small tonal shift rather than a big turn, the title dropped once and quiet \u2014 the form is a frame the sparseness hangs in, not a structure to fill.",
            "The world is one overheard 3 a.m. thought: intimate, interior, at whisper distance \u2014 a mood, a small ache, a city window at night; never widen to a crowd, a message, or a big emotional peak.",
            "Slant and unresolved rhyme over neat closure: a near-rhyme that half-lands or a line left unrhymed suits the mood where a tidy perfect rhyme feels too bright; let some lines hang open the way the phrasing does.",
            "The solo is a mood, not a showcase: hand a chorus to the muted trumpet or tenor to play spare and low over modal or slow changes \u2014 the instrumental keeps the hush and deepens it, never a hot blowing chorus.",
            "Cross-genre firewall: the hush, the late-floated phrasing, and the spare modal trio make it cool jazz, not a soul slow-jam or a torch ballad \u2014 no backbeat, no gospel melisma, and unlike the ballad it does not croon a big held ache; it underplays, leaves the most air, and lets a muted horn exhale into the silence."
          ],
          "rendering": "Spare hushed late-night trio \u2014 sparse open-voiced piano, soft walking upright, brushes barely there \u2014 with a muted trumpet or tenor sax exhaling low in the wide gaps and taking a spare solo chorus over modal or slow changes. Intimate understated close-miked lead vocal, cool and unhurried, floated late with lots of air and no runs, dry and low; smoky 3 a.m. cool-jazz sound, no synths.",
          "storyFit": "Best for: late-night romance held at a distance, city nights, longing left unsaid, a bittersweet memory turned over quietly, a slow-burn mood at the smallest hours. Poor fit: an up-tempo swinger with wit and trade \u2014 that is swing; a big held torch ache sung out \u2014 that is the ballad; anything loud, crowded, or emotionally declared.",
          "parodyTraps": "Filling the silence the room is built on with wall-to-wall words; overstating a feeling the room insists on withholding; smoky-bar postcard clich\xE9 instead of the user's real late hour; naming the craft \u2014 modal, changes, behind the beat \u2014 inside the words; a hot showy solo or a belted line that breaks the hush; skipping the solo chorus so the standard loses its instrumental section.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Soft] [Trumpet Solo] [Sax Solo] [Instrumental Break]. This room performs at 3 a.m. with almost nobody in it \u2014 one cool understated voice floated late, and a muted horn exhaling into the wide silence, no crowd, no trade, no scat. Signature: the exhale in the gap \u2014 the muted trumpet or tenor sax breathes one spare low answer into the held air the phrasing leaves, restraint answering restraint, then takes a whole chorus low over the changes. Placement: the voice floats the verses bare with long gaps written in; the muted horn exhales into those gaps, and a [Trumpet Solo], [Sax Solo], or [Instrumental Break] hands a full chorus to the trio kept spare and hushed; the title drops once, quiet, the last line trailing into silence. Tag identity: a cool late-floated voice and an exhaling muted horn \u2014 a [Soft] hush throughout, one spare horn answer in the wide gaps, the solo chorus kept low and modal as its own section. No belting, no scat, no crowd \u2014 one voice, a lot of air, and a muted horn breathing in it, every word the user's own.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Soft]",
              "[Trumpet Solo]",
              "[Sax Solo]",
              "[Instrumental Break]"
            ]
          },
          "builder": {
            "instruments": [
              "muted trumpet",
              "piano trio",
              "upright bass",
              "brushed drums",
              "tenor sax",
              "comping guitar"
            ],
            "themes": [
              "City nights",
              "Late-night romance",
              "Longing",
              "Bittersweet memory"
            ],
            "purposes": [
              "Slow burn",
              "Croon it close"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "torch song",
          "strength": "strong",
          "roomId": "vocal-ballad"
        },
        {
          "cue": "standard",
          "strength": "strong",
          "roomId": "vocal-ballad"
        },
        {
          "cue": "crooner",
          "strength": "strong",
          "roomId": "vocal-ballad"
        },
        {
          "cue": "ballad",
          "strength": "strong",
          "roomId": "vocal-ballad"
        },
        {
          "cue": "sinatra",
          "strength": "weak",
          "roomId": "vocal-ballad"
        },
        {
          "cue": "ella",
          "strength": "weak",
          "roomId": "vocal-ballad"
        },
        {
          "cue": "billie",
          "strength": "weak",
          "roomId": "vocal-ballad"
        },
        {
          "cue": "late night",
          "strength": "weak",
          "roomId": "vocal-ballad"
        },
        {
          "cue": "longing",
          "strength": "weak",
          "roomId": "vocal-ballad"
        },
        {
          "cue": "swing",
          "strength": "strong",
          "roomId": "swing"
        },
        {
          "cue": "bebop",
          "strength": "strong",
          "roomId": "swing"
        },
        {
          "cue": "scat",
          "strength": "strong",
          "roomId": "swing"
        },
        {
          "cue": "uptempo",
          "strength": "strong",
          "roomId": "swing"
        },
        {
          "cue": "big band",
          "strength": "weak",
          "roomId": "swing"
        },
        {
          "cue": "trade fours",
          "strength": "weak",
          "roomId": "swing"
        },
        {
          "cue": "dancing",
          "strength": "weak",
          "roomId": "swing"
        },
        {
          "cue": "upbeat",
          "strength": "weak",
          "roomId": "swing"
        },
        {
          "cue": "cool jazz",
          "strength": "strong",
          "roomId": "cool"
        },
        {
          "cue": "modal",
          "strength": "strong",
          "roomId": "cool"
        },
        {
          "cue": "chet baker",
          "strength": "strong",
          "roomId": "cool"
        },
        {
          "cue": "miles",
          "strength": "strong",
          "roomId": "cool"
        },
        {
          "cue": "smoky",
          "strength": "weak",
          "roomId": "cool"
        },
        {
          "cue": "late-night",
          "strength": "weak",
          "roomId": "cool"
        },
        {
          "cue": "after hours",
          "strength": "weak",
          "roomId": "cool"
        },
        {
          "cue": "understated",
          "strength": "weak",
          "roomId": "cool"
        }
      ]
    },
    "folk": {
      "id": "folk",
      "name": "Folk",
      "aliases": [
        "folk music",
        "singer-songwriter",
        "singer songwriter",
        "folk-rock",
        "folk rock"
      ],
      "profileText": "A folk writer starts with a true thing to say and says it plain. The song is a story or a plainspoken feeling before it is a groove \u2014 a real road, a real person, a home, a wrong that needs naming \u2014 and the writing job is to carry that truth in everyday words a stranger follows on the first hearing. The drama comes from the events and the exact detail, never from ornament: the specific object, the real name, the actual light. A folk line that reaches for a big poetic declaration when a small plain one would land harder has already lost the tradition. Understatement and the concrete image do the work; the plainspoken true detail outranks the clever one every time.\n\nUnder the words runs the second law: the song is carried by a voice and a guitar, and the strings are a second voice. The acoustic guitar, banjo, or fiddle answers the singer at phrase-ends and takes turnarounds between verses, so lines end open and hand off to them \u2014 a sheet packed wall-to-wall has silenced the players who carry the tune. And the melody is built to be sung by an ordinary voice: singable, memorable, shaped so a person can carry it without straining. Whether a whole room joins in or one voice keeps it, the tune must sit where a real throat lives.\n\nWhat the writer chooses is who the song is sung to, and that is the room. Traditional Folk tells it outward to a community and its record \u2014 the story-ballad and the protest song, a chorus a room already half-knows and lifts on the first pass, the I widening into a we. Contemporary Singer-Songwriter confides it inward at whisper distance \u2014 one voice, longer image-dense lines over fingerpicked guitar, a chorus meant for no crowd. Folk-Rock / Americana swells the same plain story into a stomped, sung catharsis a band and a crowd lift at full volume. Same true story, same voice-and-strings spine; different distance, different lift.\n\nThe law above every dial is plainspoken truth. Lyrics are in English; the writer works in plain English craft instruction and never costumes the song with faux-antique diction \u2014 thee, hark, gather-round scenery \u2014 or slang the user did not write; only the user's own words survive. Craft terms the writer thinks with \u2014 ballad, refrain, turnaround, drop-and-build \u2014 stay out of the lyrics, adlibs, and render notes unless the user wrote them. And the postcard is not folk: quaint antique costume standing in for the user's real road, work, and people is the parody the founder rejects. The plainspoken true detail from the user's life is the song.",
      "defaultRoomId": "traditional-folk",
      "rooms": [
        {
          "id": "traditional-folk",
          "name": "Traditional Folk",
          "oneLine": "The story-ballad and the protest song \u2014 roots, community, and a plainspoken record, the Guthrie / Seeger / Carter Family lane where a whole room already half-knows the chorus.",
          "tempoGroove": "90-130 BPM in a plain, walking common time or a lilting 3/4 waltz, the acoustic guitar or banjo keeping a steady strum a room can clap to; a march feel for the protest numbers, an easy sway for the ballads. Low-to-medium word density: short, sturdy lines with room at the ends for a fiddle or banjo to answer and for a crowd to breathe before the next.",
          "writingDials": [
            "Tell it plain and in order: this room narrates \u2014 a story with a beginning and an end, or a wrong named straight out \u2014 in everyday words a stranger follows on the first hearing, the drama coming from the events and not from ornament.",
            "Write a chorus the room can lift on the first pass: a short, sturdy refrain, four to seven words, plain enough to be sung back by people who have never heard it, returning the same each time so it gathers voices rather than surprising them.",
            "Keep the I ready to widen into we: the singer speaks for more than themselves here \u2014 a town, the working people, the marchers \u2014 so a personal line can open outward to a shared one by the last verse.",
            "Build the verses from concrete, ordinary detail the user actually brought \u2014 the real road, the real work, the real name \u2014 never quaint antique scenery or a gather-round costume; the plainspoken specific is the whole credibility.",
            "Rhyme clean and sturdy in couplets or a ballad quatrain: solid perfect rhyme the room hears coming, so the story stays easy to follow and easy to join; a clear line beats a clever one every time.",
            "Leave the instruments their answer: end phrases a beat early so the fiddle, banjo, or harmonica can fill the gap and take a turnaround between verses \u2014 a sheet packed wall-to-wall has silenced the players who carry the tune.",
            "Registers are the record and the rally: a story worth keeping, a person honored, a home remembered, or an injustice named to raise a crowd \u2014 carried with conviction, never irony.",
            "Cross-genre firewall: What makes it Traditional Folk and not Country is the plainspoken acoustic strum with fiddle and banjo answering and a chorus built for a room to join \u2014 no pedal steel, no telecaster twang, no honky-tonk swing and no radio-polished hook; the song serves the story and the sing-along, not the airplay."
          ],
          "rendering": "Acoustic guitar or banjo strumming a steady walking rhythm, fiddle and harmonica answering the vocal at phrase-ends and taking turnarounds, upright bass walking underneath, spare and live. Plain conversational lead vocal more told than belted, a two- or three-voice harmony joining the chorus like a room singing along; warm dry roots recording, no drums or light brushed kit only, no synths, timeless string-band feel.",
          "storyFit": "Best for: telling one true story, naming an injustice to raise a crowd, honoring a person or a home, a hard road, remembering the fallen, a song built to be sung together. Poor fit: a private confession at whisper distance \u2014 that is Singer-Songwriter; a big band-driven catharsis \u2014 that is Folk-Rock; club energy or radio polish, which this plainspoken room has no register for.",
          "parodyTraps": "Gather-round, faux-antique costume \u2014 thee, hark, ye olde scenery the user never wrote; a chorus too wordy or too clever for a room to sing back; inventing hardship or a cause the user's story never held; filling every bar so the fiddle and banjo have nothing to answer; a radio-slick hook that turns the record into pop with a banjo pasted on.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Harmonies] [Instrumental Break] [Fingerpicking]. This room performs like one voice with a guitar and a room ready to join \u2014 a plain lead carrying the story, a harmony voice or two arriving on the chorus like neighbors leaning in, and the fiddle or banjo answering between the lines. Signature: the sing-along chorus and the string answer \u2014 the harmony voices swell on the repeated refrain so the same line gathers people each round, while the fiddle or banjo fills the gap at phrase-ends and takes an [Instrumental Break] turnaround between verses. Placement: verses stay lead-forward and nearly bare so the story lands; harmonies come in on the chorus and the final verse where the I becomes we; the instrumental turnaround marks the passage between story beats. Tag identity: a lone singer and a room joining in \u2014 a plain lead, harmony voices swelling on the chorus like a gathering, the fiddle and banjo answering in the holes, an instrumental break handed to the players between verses. Every joined word is plain language from the user's own sheet, never a scripted antique exclamation.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Harmonies]",
              "[Instrumental Break]",
              "[Fingerpicking]"
            ]
          },
          "builder": {
            "instruments": [
              "acoustic guitar",
              "banjo",
              "fiddle",
              "harmonica",
              "upright bass"
            ],
            "themes": [
              "Home & roots",
              "Protest & justice",
              "A person's story",
              "Passing time"
            ],
            "purposes": [
              "Tell a story",
              "Protest",
              "Sing together"
            ]
          }
        },
        {
          "id": "contemporary-singer-songwriter",
          "name": "Contemporary Singer-Songwriter",
          "oneLine": "Confessional and intimate \u2014 one voice confided to you at close range, the Joni Mitchell / Nick Drake through Bon Iver / Gillian Welch lane where the chorus is a private line nobody is meant to shout back.",
          "tempoGroove": "60-100 BPM, unhurried and often loose at the edges, a fingerpicked acoustic guitar breathing with the singer rather than driving; rubato welcome, the pulse felt more than counted. Medium word density with longer image-dense lines: the picking leaves space between phrases, and nothing is handed to a crowd.",
          "writingDials": [
            "Confide inward, not outward: this room is one person telling you something true at close distance \u2014 first-person and intimate, the confession aimed at you or worked through aloud, never testimony raised for a room.",
            "Carry the weight in one small exact detail: the specific object, the exact light, the thing only the two of them would recognize from the user's own life \u2014 the image does the feeling, so a true small detail outranks any large declaration.",
            "Write a chorus for one voice alone: a private line that returns and deepens rather than a refrain built to be sung back \u2014 it can be quiet, unresolved, a question; nobody is meant to lift it in a room.",
            "Let the lines run longer and lean: the fingerpicked guitar breathes between phrases, so a line can spill past the bar, drag, or trail \u2014 end feeling-lines where the voice can soften and the picking can answer underneath.",
            "Say less than the feeling and trust the gap: understatement is the instinct here, the room where what is left unsaid carries \u2014 restraint and a plain true line beat a big emotional reach.",
            "Advance the interior, not the plot: each verse turns the feeling or the reckoning a little further \u2014 a new angle, an admission, a second thought \u2014 rather than looping one mood or narrating events blow by blow.",
            "Rhyme loose and half-hidden: near-rhyme, internal rhyme, or barely any, so the line reads like real speech confided quietly and never like a sturdy chorus a crowd hears coming.",
            "Cross-genre firewall: What makes it Singer-Songwriter and not Traditional Folk is the inward confession over fingerpicked guitar with a chorus meant for one voice \u2014 no room-lifting sing-along refrain, no I widening into a marching we, no crowd on the receiving end; the song is confided, not testified."
          ],
          "rendering": "Fingerpicked acoustic guitar breathing under the voice, occasional soft fiddle or a low held note for color, upright bass sparse if present, mostly just voice and strings with real air around them. Intimate close-mic lead vocal, plain and unforced, a soft harmony double only where the feeling peaks, light natural reverb; hushed contemporary folk recording, no drums, no polish, the breath audible.",
          "storyFit": "Best for: a private grief or reckoning, plain-spoken love confided close, a memory turned over quietly, longing, a hard truth told to one person, the interior of a passing season. Poor fit: a crowd meant to sing along \u2014 that is Traditional; a band-lifted catharsis \u2014 that is Folk-Rock; a marching protest or any register that needs to be raised loud.",
          "parodyTraps": "A big sing-along chorus where the room insists on a private line; reaching for a huge declaration instead of trusting one small true detail; borrowed poetic scenery with no specific real person or moment in it; overstuffing the lines so the guitar has no air to breathe; a polished radio lift that trades the confided intimacy for a hook.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Soft] [Fingerpicking] [Harmonies]. This room performs at close distance \u2014 one intimate voice and a fingerpicked guitar, nobody else in the room, a soft harmony arriving only where the feeling peaks. Signature: the breath and the picked answer \u2014 the fingerpicked guitar breathes in the gaps the long lines leave, and a soft harmony double shadows the last words of a peak line the way a confession leans closer, never a crowd. Placement: verses stay nearly bare so the intimacy carries them; the [Fingerpicking] holds the whole song underneath; a single [Soft] harmony shadows the chorus or the bridge where the feeling turns; a held or hummed note can close the outro. Tag identity: one confiding voice and its guitar \u2014 a plain intimate lead, fingerpicking breathing between the lines, a soft harmony double saved for the closest moment. No sing-along, no band, no crowd \u2014 one person and the strings, every word plain language from the user's own sheet.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Soft]",
              "[Fingerpicking]",
              "[Harmonies]"
            ]
          },
          "builder": {
            "instruments": [
              "acoustic guitar",
              "fiddle",
              "upright bass",
              "harmonica"
            ],
            "themes": [
              "Plain-spoken love",
              "Passing time",
              "A person's story",
              "Nature & seasons"
            ],
            "purposes": [
              "Comfort",
              "Tell a story"
            ]
          }
        },
        {
          "id": "folk-rock",
          "name": "Folk-Rock / Americana",
          "oneLine": "The fuller band, driving and communal \u2014 the Mumford / Lumineers / Fleet Foxes lane where the same plain story swells into a stomped, sung catharsis a crowd lifts at full volume.",
          "tempoGroove": "100-140 BPM with a driving, foot-stomping feel, a full band behind the acoustic core \u2014 strummed guitar and banjo up front, a kick-and-stomp pulse, the build the whole point. Medium word density: plain lines that ride the drive and open wide at the chorus for a band and a crowd to lift together.",
          "writingDials": [
            "Build to a communal lift: this room grows \u2014 quiet verse to full-band chorus \u2014 so write toward a peak, a hook meant to be stomped and sung by a crowd at full volume, the dynamics carrying the feeling as much as the words.",
            "Keep the story plain but open the chorus wide: verses hold the specific true detail from the user's life, then the chorus opens outward into a line a whole room shouts back, big and singable and returning the same each time.",
            "Write for the stomp: short, sturdy, rhythmic lines that ride a driving strum and a kick-drum pulse, the phrasing punchy enough to feel the momentum build under it.",
            "Leave the band its swell and its breaks: end phrases so the banjo, fiddle, and drums can answer and surge, and plan the drop and the build \u2014 a stripped bar before the full-band chorus crashes back \u2014 because the dynamic turn is part of the writing.",
            "Rhyme clean and anthemic: strong end-rhyme the crowd hears coming, so the big chorus lands square and singable at full lift; this is not the room for buried near-rhyme.",
            "Register is catharsis: heartbreak, hope, a hard road, a homecoming, a reckoning \u2014 the same plain folk story, but delivered as release, the feeling swelling into something a room lets out together.",
            "Guard the roots under the drive: keep the acoustic core and the true plain detail even at full volume \u2014 the moment the banjo and the story vanish under the drums, the room has become generic anthem-rock, not Americana.",
            "Cross-genre firewall: What makes it Folk-Rock / Americana and not Rock is the acoustic core \u2014 strummed guitar and banjo and fiddle driving the build, the story plainspoken and rootsy \u2014 never an electric-guitar-led attack; the drive serves a communal folk catharsis, not a riff."
          ],
          "rendering": "Strummed acoustic guitar and banjo driving up front, fiddle and mandolin surging on the lift, upright or electric bass, a kick-and-stomp drum build with hand claps and foot stomps swelling into the chorus. Earnest lead vocal opening into a full gang-vocal chorus a crowd shouts together, big harmonies on the peak; live, dynamic, roots-anthem production, acoustic core kept audible under the swell, the drop-and-build the centerpiece.",
          "storyFit": "Best for: a hard road turned to hope, a homecoming, heartbreak released loud, a reckoning that swells into catharsis, a story built to lift a whole room together. Poor fit: a private confession at whisper distance \u2014 that is Singer-Songwriter; a spare plainspoken record \u2014 that is Traditional; anything that needs stillness or intimacy over a big communal build.",
          "parodyTraps": "Losing the acoustic core and the banjo under the drums so it becomes generic stadium anthem-rock; a hollow oh-oh chorus with no real story or true detail under the lift; a whispered delivery that fights the driving build; forcing catharsis onto a story that wanted stillness; radio-slick polish that sands off the rootsy grain.",
          "performance": {
            "prose": "Density moderate; min adlibs 3; delivery tags [Harmonies] [Instrumental Break] [Hand Claps]. This room performs like a band and a crowd lifting together \u2014 an earnest lead through the verses, a full gang-vocal chorus everyone shouts, and the banjo, fiddle, and stomp surging on the build. Signature: the swell and the stomped chorus \u2014 the band drops back for a bar and crashes into a full-harmony chorus a crowd sings at full volume, hand claps and foot stomps driving the lift, the banjo and fiddle taking an [Instrumental Break] on the biggest turn. Placement: verses stay leaner and lead-forward; the gang harmonies and claps flood the chorus and the final lift; the drop-and-build marks the turn into the big chorus, and the instrumental break hands the peak to the players. Tag identity: a lead and a crowd rising together \u2014 an earnest verse voice opening into a stomped gang-vocal chorus, hand claps and foot stomps driving the swell, the banjo and fiddle surging on the break. Every shouted word is plain language from the user's own sheet, the roots kept audible under the drive.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Harmonies]",
              "[Instrumental Break]",
              "[Hand Claps]"
            ]
          },
          "builder": {
            "instruments": [
              "acoustic guitar",
              "banjo",
              "fiddle",
              "mandolin",
              "upright bass"
            ],
            "themes": [
              "Home & roots",
              "Passing time",
              "A person's story",
              "Nature & seasons"
            ],
            "purposes": [
              "Sing together",
              "Comfort",
              "Tell a story"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "folk",
          "strength": "strong",
          "roomId": "traditional-folk"
        },
        {
          "cue": "protest song",
          "strength": "strong",
          "roomId": "traditional-folk"
        },
        {
          "cue": "ballad",
          "strength": "strong",
          "roomId": "traditional-folk"
        },
        {
          "cue": "woody guthrie",
          "strength": "strong",
          "roomId": "traditional-folk"
        },
        {
          "cue": "pete seeger",
          "strength": "strong",
          "roomId": "traditional-folk"
        },
        {
          "cue": "sing together",
          "strength": "weak",
          "roomId": "traditional-folk"
        },
        {
          "cue": "protest",
          "strength": "weak",
          "roomId": "traditional-folk"
        },
        {
          "cue": "justice",
          "strength": "weak",
          "roomId": "traditional-folk"
        },
        {
          "cue": "tell a story",
          "strength": "weak",
          "roomId": "traditional-folk"
        },
        {
          "cue": "old-time",
          "strength": "weak",
          "roomId": "traditional-folk"
        },
        {
          "cue": "roots",
          "strength": "weak",
          "roomId": "traditional-folk"
        },
        {
          "cue": "union",
          "strength": "weak",
          "roomId": "traditional-folk"
        },
        {
          "cue": "singer-songwriter",
          "strength": "strong",
          "roomId": "contemporary-singer-songwriter"
        },
        {
          "cue": "confessional",
          "strength": "strong",
          "roomId": "contemporary-singer-songwriter"
        },
        {
          "cue": "joni mitchell",
          "strength": "strong",
          "roomId": "contemporary-singer-songwriter"
        },
        {
          "cue": "bon iver",
          "strength": "strong",
          "roomId": "contemporary-singer-songwriter"
        },
        {
          "cue": "intimate",
          "strength": "weak",
          "roomId": "contemporary-singer-songwriter"
        },
        {
          "cue": "fingerpicking",
          "strength": "weak",
          "roomId": "contemporary-singer-songwriter"
        },
        {
          "cue": "whisper",
          "strength": "weak",
          "roomId": "contemporary-singer-songwriter"
        },
        {
          "cue": "diary",
          "strength": "weak",
          "roomId": "contemporary-singer-songwriter"
        },
        {
          "cue": "quiet",
          "strength": "weak",
          "roomId": "contemporary-singer-songwriter"
        },
        {
          "cue": "heartbreak",
          "strength": "weak",
          "roomId": "contemporary-singer-songwriter"
        },
        {
          "cue": "folk-rock",
          "strength": "strong",
          "roomId": "folk-rock"
        },
        {
          "cue": "americana",
          "strength": "strong",
          "roomId": "folk-rock"
        },
        {
          "cue": "indie folk",
          "strength": "strong",
          "roomId": "folk-rock"
        },
        {
          "cue": "mumford",
          "strength": "strong",
          "roomId": "folk-rock"
        },
        {
          "cue": "lumineers",
          "strength": "strong",
          "roomId": "folk-rock"
        },
        {
          "cue": "stomp",
          "strength": "weak",
          "roomId": "folk-rock"
        },
        {
          "cue": "sing-along",
          "strength": "weak",
          "roomId": "folk-rock"
        },
        {
          "cue": "anthem",
          "strength": "weak",
          "roomId": "folk-rock"
        },
        {
          "cue": "hopeful",
          "strength": "weak",
          "roomId": "folk-rock"
        },
        {
          "cue": "band",
          "strength": "weak",
          "roomId": "folk-rock"
        }
      ]
    },
    "edm": {
      "id": "edm",
      "name": "EDM",
      "aliases": [
        "electronic",
        "electronic dance music",
        "house",
        "techno",
        "dubstep",
        "edm music"
      ],
      "profileText": "An EDM writer is a producer first, and the song is not a lyric sheet \u2014 it is a topline. The structure rules everything: a build that loads tension and a drop that pays it off. The whole writing job is a hook that soars into the drop and a spare verse that builds the tension leading there. Word density is low on purpose. The vocal is another instrument in the arrangement, not the star reading a story \u2014 so the writer thinks in short, chantable, repeated phrases, not verses packed wall-to-wall. A topline that arrives dense, with paragraphs of lyric competing with the track, has failed before the drop lands.\n\nThe drop is the payoff, and often it has no words at all \u2014 it is instrumental, or a single chopped or chanted syllable turned into a rhythmic hook. So the writer never writes over the drop; the writer writes toward it. The pre-drop hook is the launch: strip the words thin through the build, lift the melody, and land the last syllable high and open on the downbeat where the riser peaks and the low end cuts, so the drop erupts under a held note instead of a sentence. End launch lines on open vowels a producer can hold, chop, stretch, and pitch, because the drop frequently takes that vowel and makes it the melody. Repetition is a feature \u2014 the hook returns bigger or richer each pass, and sameness is what lets a crowd own it, so the writer resists varying the line for interest.\n\nUnder all the machinery sits one law heavier than any dial: one real feeling anchors even the sparsest topline. A drop soars for nothing if there is no true ache or release under it, and the fastest way to make an EDM song empty is generic hands-up filler \u2014 a phrase about the night, the crowd, the lights that could belong to any track and means nothing the first time it is sung. The single true detail or person from the user's story is what earns the tenth repeat of the hook. The rooms bend the rest. House loops a warm phrase inside an unbroken groove that never stops moving. Big-Room strips the topline to one soaring anthem line thrown to a field and leaves the drop to the supersaws. Melodic anchors a real emotional ache and lets the hook soar into a lush chopped-vocal wave that swells more than slams. The laws above every dial hold everywhere: English is the song's language, delivery is directed as energy and euphoria in plain words, never as an accent or a scripted exclamation, and the user's own moment always outranks any stock rave scenery.",
      "defaultRoomId": "house",
      "rooms": [
        {
          "id": "house",
          "name": "House",
          "oneLine": "The four-on-the-floor body-lane \u2014 warm vocal house that grooves all night, the hook looping inside the pocket, the drop a groove that keeps moving rather than an explosion.",
          "tempoGroove": "120-128 BPM, a steady four-on-the-floor kick with an open hi-hat on the offbeat and a sidechained bassline breathing under every kick \u2014 the body pulse never stops. Low word density: the topline is a short warm phrase that loops as part of the groove, sung and looped like an instrument, with real air between repeats so the pocket and the plucks can move.",
          "writingDials": [
            "Write the hook as a loop, not a chorus: a short warm phrase of a few words that repeats and rides the groove, gaining hypnotic pull each pass rather than building to a peak \u2014 house is about the body staying in motion, so the hook is felt more than delivered.",
            "Build the verse to breathe tension in, not to narrate: keep it spare and rhythmic, a filtered line or two that the producer can strip back and roll a riser under, so the pre-drop lift feels like the groove opening up rather than a story pausing.",
            "The hook soars into the drop by opening the filter, not by screaming: write the pre-drop line to land on an open vowel that can hold while the low end cuts and the sidechain pumps back in \u2014 the payoff is the groove dropping back in under the held note.",
            "Keep the vocal a texture: chop-friendly phrasing, syllables that survive being looped, cut, and stuttered, because the drop often takes the vocal and turns it into a rhythmic hook rather than singing new words.",
            "One real feeling anchors the loop: a specific late-night moment or person from the user's story keeps the repeated phrase from becoming generic dancefloor filler \u2014 the loop must mean something the first time to earn its tenth.",
            "Sensual and nocturnal register, warm not frantic: house is a groove you sink into, so favor ease, heat, and release over urgency; the phrase invites rather than commands.",
            "Rhyme stays loose and singable: a soft internal echo or a repeated key word beats a hard scheme; the point is the phrase sitting in the pocket, not the craft showing.",
            "Cross-genre firewall: the warm looping groove-vocal over an unbroken four-on-the-floor with a breathing sidechain is what makes it House, not Big-Room's stadium build-and-detonate \u2014 house drops back into motion where big-room drops into an explosion, and the body never stops to throw its hands up."
          ],
          "rendering": "Steady four-on-the-floor kick with an offbeat open hi-hat, deep sidechained bass pumping under every kick, warm plucks and stabs, a filtered pad, and a looped vocal hook treated as a rhythmic element. Warm soulful lead vocal, close and easy, chopped and stuttered into the groove; a [Build Up] with a riser and filter-open lifting into a [Drop] that grooves rather than explodes, [Vocal Chop] textures threaded through \u2014 clean modern vocal-house sheen.",
          "storyFit": "Best for: a warm all-night groove, sensual release, losing yourself on the floor, a nocturnal love, easy euphoria that moves the body. Poor fit: a hands-to-the-sky festival anthem that needs a stadium detonation \u2014 that is Big-Room; a tender emotional sunrise that soars and aches \u2014 that is Melodic; anything wanting dense verses or a story told in full.",
          "parodyTraps": "Generic hands-up dancefloor filler with no real person or moment under the loop; cramming the verse with words so the groove cannot breathe; a hook too wordy to loop and chop; forcing a stadium scream onto a warm groove vocal; treating the drop like an explosion instead of the groove dropping back in.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Build Up] [Drop] [Vocal Chop] [Breakdown]. The cast is a single warm topline vocal and the groove it loops inside \u2014 the drop is a groove, not a crowd, so the vocal chop is the whole signature. Signature: [Build Up] into [Drop] \u2014 the filtered vocal and a riser lift through the build, then the sidechained groove drops back in under the held hook while the voice is chopped into a rhythmic figure. Placement: the looped hook rides the verse and pre-drop; the [Vocal Chop] figure carries the drop where new words would clutter it; a [Breakdown] strips the groove back before the final build. Tag identity: one warm topline and its chopped double as a percussion voice \u2014 the looping hook, the filter-open lift, the vocal cut into the drop, every looped word from the user's own sheet. No crowd, no field, no scream \u2014 a body, a groove, and a voice moving inside it.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Build Up]",
              "[Drop]",
              "[Vocal Chop]",
              "[Breakdown]"
            ]
          },
          "builder": {
            "instruments": [
              "four-on-the-floor kick",
              "sidechained bass",
              "plucks",
              "supersaw synths",
              "risers",
              "vocal chops"
            ],
            "themes": [
              "Lost in the night",
              "Love rush",
              "Freedom"
            ],
            "purposes": [
              "The drop / rave",
              "Sunrise chill",
              "Festival anthem"
            ]
          }
        },
        {
          "id": "big-room",
          "name": "Big-Room / Festival & Progressive",
          "oneLine": "The mainstage lane \u2014 huge slow-loading builds and a euphoric detonation, the topline a single soaring anthem line thrown to a field, the drop often instrumental or one chanted word.",
          "tempoGroove": "126-132 BPM, a four-on-the-floor kick that drops out through a long build and slams back on the drop; the progressive side layers supersaws that widen bar by bar under a rising riser and a snare roll. The lowest word density of the three: one soaring pre-drop hook line and near-silence in the drop itself, the vocal stripped to its single most anthemic phrase so a whole field can catch it.",
          "writingDials": [
            "Write one anthem line and protect it: the entire topline points at a single euphoric hook thrown right before the drop \u2014 a short, open, shoutable phrase a field can sing back on first hearing, and everything else clears the runway for it.",
            "The build is the writing job: the pre-drop must load tension \u2014 thin the words, lift the melody stepwise, land the last syllable high and open on the downbeat where the riser peaks, so the hook launches the drop rather than trailing into it.",
            "Leave the drop to the machine: the drop is instrumental or a single chopped or chanted word \u2014 do not write lyrics over it; the payoff is the supersaw and the kick, and words flooding the drop kill the release the build promised.",
            "Keep the verse a spare tension-builder: a sparse filtered line or two that holds back energy, existing only to make the build feel like a takeoff \u2014 never a narrative that competes with the drop.",
            "Euphoric and communal register, but anchored: the feeling is hands-to-the-sky release, yet one real detail or person from the user's story keeps the anthem from being empty uplift \u2014 the field sings a phrase that actually means something.",
            "Melody over cleverness: big-room lives on a simple, huge, singable melodic shape \u2014 a stepwise rising line beats an intricate lyric, and the hook must survive being screamed slightly off-key by ten thousand people.",
            "Repetition is the point: the anthem line returns before each drop, bigger each time; do not vary it for interest \u2014 sameness is what lets the crowd own it.",
            "Cross-genre firewall: the long tension-loading build detonating into a euphoric instrumental or one-word-chant drop is what makes it Big-Room, not Pop \u2014 pop sings a full chorus as its event, but here the chorus is a single anthem line that launches a drop the crowd erupts into, the topline sparse and the payoff wordless."
          ],
          "rendering": "Wide stacked supersaw synths, a four-on-the-floor kick dropping out through the build and slamming back on the drop, a long riser and snare roll loading the pre-drop, huge sidechained bass, a single soaring anthem vocal launching into a mostly instrumental drop with a chanted or chopped one-word hook. Big festival-loud mastering, euphoric and wide; mainstage progressive-house energy \u2014 a [Build Up] with [Riser] into a massive [Drop], then a [Breakdown].",
          "storyFit": "Best for: a hands-to-the-sky festival anthem, euphoric release, freedom and triumph, a communal peak moment, losing yourself in a crowd. Poor fit: a warm all-night body groove that never explodes \u2014 that is House; an intimate aching sunrise \u2014 that is Melodic; any story needing full verses or fine detail, which the field-scale anthem cannot carry.",
          "parodyTraps": "Empty uplift with no real detail under the anthem line; writing lyrics over the drop instead of leaving it to the supersaws; a hook too wordy or too clever for a field to sing back; a busy verse that competes with the build; generic hands-up filler standing in for the user's actual peak moment.",
          "performance": {
            "prose": "Density sparse; min adlibs 2; delivery tags [Build Up] [Riser] [Drop] [Breakdown]. The cast is a single anthem vocal and the mainstage machine it launches \u2014 the drop is a euphoric instrumental, so the build-into-drop is the entire signature. Signature: [Build Up] into [Drop] \u2014 the riser and snare roll load under the stripped vocal, the anthem line launches high on the downbeat, and the supersaw drop erupts wordless or on one chanted word. Placement: the anthem hook lands right before each drop and returns bigger every time; the [Drop] stays instrumental or a single [Vocal Chop] word; a [Breakdown] pulls everything back before the final build. Tag identity: one soaring anthem line and a wordless euphoric drop \u2014 the tension-loading build, the launch on the peak downbeat, the field owning the repeated phrase, every sung word from the user's own sheet. No busy verses, no lyrics over the drop \u2014 one line, one riser, one detonation.",
            "adlibDensity": "sparse",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Build Up]",
              "[Riser]",
              "[Drop]",
              "[Breakdown]"
            ]
          },
          "builder": {
            "instruments": [
              "supersaw synths",
              "four-on-the-floor kick",
              "risers",
              "sidechained bass",
              "vocal chops",
              "plucks"
            ],
            "themes": [
              "Euphoria",
              "Freedom",
              "Letting go"
            ],
            "purposes": [
              "Festival anthem",
              "The drop / rave",
              "Sunrise chill"
            ]
          }
        },
        {
          "id": "melodic",
          "name": "Melodic / Future Bass & Chill",
          "oneLine": "The emotional ODESZA / Illenium / melodic lane \u2014 a real feeling carried by a soaring hook into a lush, chopped-vocal drop, or a sunrise that glows and never slams at all.",
          "tempoGroove": "140-150 BPM felt in half-time (future bass and melodic-dubstep territory \u2014 the snare lands on the 3, so it moves at ~70-75 while the grid runs 140-150), the drop hitting on a heavy half-time snare under detuned supersaw chords; the chill / sunrise variant sits slower at ~80-100 and never fully detonates, gliding instead of dropping. Low-to-moderate word density: the verse gets a little more room to ache than in the other rooms, but the hook stays spare and the drop is carried by chopped-vocal and supersaw waves, not new lyrics.",
          "writingDials": [
            "Anchor the whole topline to one real feeling: this is the emotional lane, so a single true loss, longing, or release from the user's story is the spine \u2014 the soar means nothing without a real ache under it, and generic uplift is the failure mode here.",
            "Write the hook to soar into the drop: the pre-drop hook lifts on an open, held vowel that the drop can chop, stretch, and pitch into its lush wave \u2014 so end the launch line on a sound that survives being turned into the drop's melodic texture.",
            "Give the verse room to ache before it lifts: a few spare, sincere lines that set the feeling and build quiet tension, so the hook's rise and the drop's release land as catharsis rather than spectacle \u2014 still spare, but the most breathing room of the three rooms.",
            "Let the drop be a wave, not a slam: the future-bass drop soars and swells more than it explodes, often a chopped vocal and detuned chords carrying the melody \u2014 write for the voice to become that wave, not to sing over it.",
            "Sincere and open register: melodic EDM wears its heart out \u2014 earnestness beats irony, and one plain true image outweighs a clever line; the emotion is the point and the polish serves it.",
            "For the chill / sunrise variant, never detonate: keep it a glowing glide with a soft hook and no hard drop \u2014 a warm, downtempo release for a sunrise, where the build resolves gently instead of slamming.",
            "Repetition deepens the feeling: the hook returns richer each pass as the drop swells around it \u2014 repeat to intensify the ache and the release, not merely to fill.",
            "Cross-genre firewall: a soaring emotional hook lifting into a lush chopped-vocal-and-supersaw wave, anchored to one real feeling, is what makes it Melodic \u2014 not House's warm body-groove that keeps moving, and not Big-Room's euphoric field detonation; here the drop soars and aches at half-time rather than pumping a groove or exploding a stadium."
          ],
          "rendering": "Lush detuned supersaw chords, a heavy half-time snare on the drop, deep sidechained sub, warm piano or plucks in the intro, a chopped and pitched vocal carrying the drop's melody, glowing pads and reverb. Sincere emotional lead vocal soaring into the lift; a [Build Up] into a swelling [Drop] built on [Vocal Chop] and supersaws, or for the chill variant a soft [Breakdown]-led glide with no hard drop \u2014 cinematic ODESZA / Illenium melodic sheen.",
          "storyFit": "Best for: an emotional release, longing, letting go, a bittersweet sunrise, catharsis after loss, a feeling too big for words. Poor fit: a warm all-night body groove \u2014 that is House; a chest-out festival scream with no ache under it \u2014 that is Big-Room; a detached mood with no real feeling to anchor the soar.",
          "parodyTraps": "Generic uplift with no real loss or longing under the soar; a busy lyric flooding the drop instead of letting the chopped vocal wave carry it; a hook that cannot survive being pitched and stretched; forcing a hard slam where the feeling wants a glide; borrowing an emotional cliche the user's story never contained.",
          "performance": {
            "prose": "Density moderate; min adlibs 2; delivery tags [Build Up] [Drop] [Vocal Chop] [Breakdown]. The cast is one sincere topline vocal and the lush wave it soars into \u2014 the drop is a chopped-vocal swell, so the soar-and-chop is the signature. Signature: [Build Up] into [Drop] \u2014 the verse aches quiet, the hook lifts on a held open vowel, and the drop chops and pitches that vowel into a supersaw wave that swells rather than slams. Placement: the hook soars into each drop and returns richer as the wave swells; the [Drop] rides a [Vocal Chop] of the launch vowel; a [Breakdown] gives the sunrise variant its soft glide with no hard hit. Tag identity: one sincere lead and its chopped, pitched echo as the drop's melody \u2014 the aching verse, the soaring lift, the vocal becoming the wave, every sung word from the user's own sheet. No stadium scream, no unbroken groove \u2014 one feeling, one soar, one swelling release.",
            "adlibDensity": "moderate",
            "minAdlibs": 2,
            "deliveryTags": [
              "[Build Up]",
              "[Drop]",
              "[Vocal Chop]",
              "[Breakdown]"
            ]
          },
          "builder": {
            "instruments": [
              "supersaw synths",
              "vocal chops",
              "sidechained bass",
              "plucks",
              "risers"
            ],
            "themes": [
              "Letting go",
              "Euphoria",
              "Love rush"
            ],
            "purposes": [
              "Sunrise chill",
              "The drop / rave",
              "Festival anthem"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "house",
          "strength": "strong",
          "roomId": "house"
        },
        {
          "cue": "vocal house",
          "strength": "strong",
          "roomId": "house"
        },
        {
          "cue": "deep house",
          "strength": "strong",
          "roomId": "house"
        },
        {
          "cue": "four-on-the-floor",
          "strength": "strong",
          "roomId": "house"
        },
        {
          "cue": "all night",
          "strength": "weak",
          "roomId": "house"
        },
        {
          "cue": "groove",
          "strength": "weak",
          "roomId": "house"
        },
        {
          "cue": "dancefloor",
          "strength": "weak",
          "roomId": "house"
        },
        {
          "cue": "club",
          "strength": "weak",
          "roomId": "house"
        },
        {
          "cue": "big-room",
          "strength": "strong",
          "roomId": "big-room"
        },
        {
          "cue": "festival anthem",
          "strength": "strong",
          "roomId": "big-room"
        },
        {
          "cue": "progressive house",
          "strength": "strong",
          "roomId": "big-room"
        },
        {
          "cue": "mainstage",
          "strength": "strong",
          "roomId": "big-room"
        },
        {
          "cue": "hands up",
          "strength": "weak",
          "roomId": "big-room"
        },
        {
          "cue": "euphoria",
          "strength": "weak",
          "roomId": "big-room"
        },
        {
          "cue": "drop",
          "strength": "weak",
          "roomId": "big-room"
        },
        {
          "cue": "crowd",
          "strength": "weak",
          "roomId": "big-room"
        },
        {
          "cue": "future bass",
          "strength": "strong",
          "roomId": "melodic"
        },
        {
          "cue": "melodic",
          "strength": "strong",
          "roomId": "melodic"
        },
        {
          "cue": "odesza",
          "strength": "strong",
          "roomId": "melodic"
        },
        {
          "cue": "illenium",
          "strength": "strong",
          "roomId": "melodic"
        },
        {
          "cue": "chill",
          "strength": "weak",
          "roomId": "melodic"
        },
        {
          "cue": "sunrise",
          "strength": "weak",
          "roomId": "melodic"
        },
        {
          "cue": "letting go",
          "strength": "weak",
          "roomId": "melodic"
        },
        {
          "cue": "emotional",
          "strength": "weak",
          "roomId": "melodic"
        }
      ]
    },
    "metal": {
      "id": "metal",
      "name": "Metal",
      "aliases": [
        "metal music",
        "heavy metal",
        "thrash",
        "metalcore",
        "death metal"
      ],
      "profileText": "A metal writer starts with the riff and the breakdown, not the melody. The heavy palm-muted riff is the hook (down- or drop-tuned in the modern rooms, standard or Eb-tuned in classic thrash) \u2014 the guitar states the song, the double-kick drives it, and the words ride the riff's rhythm like another percussion line. So the writing job is rhythmic and physical before it is verbal: lock the stressed syllables to the chug, leave the gaps where the riff gallops or blasts alone, and build the whole song toward the breakdown \u2014 the half-time drop where the riff crushes and the room moves. A metal sheet packed wall-to-wall, with no air for the riff to hit and no breakdown to land on, has failed before a word is judged.\n\nThe second decision is the voice, and it is a writing AND performance choice: clean versus harsh. Screamed, growled, or sung \u2014 the register is directed through tags ([Scream] [Growl] [Clean Vocals]), but the words underneath stay the English the user brought. The rooms turn on this. Thrash / Groove rides the riff with a hard sung-or-shouted voice, a scream saved for a peak, defiance you can move to. Melodic Metalcore splits the song on purpose \u2014 a screamed verse spitting the wound, a clean chorus soaring it into a melody a room sings back; the contrast IS the song. Death / Extreme goes all the way down \u2014 a growl or shriek nearly throughout, blast beats, the voice an instrument of weight and texture where another room would put a hook.\n\nThe law above every dial: metal's darkness is catharsis and metaphor, and it is the user's own. The rage, the grief, the demons, the war \u2014 these serve the user's real fury, loss, defiance, or struggle, said at full force or turned to metaphor. The writer never invents a real atrocity, a named victim, or a specific harm the user did not bring; the darkness is theirs to roar, not the writer's to manufacture. Craft words \u2014 riff, breakdown, blast beat, tremolo, palm-mute \u2014 are the writer's tools, never the song's, and never enter the lyrics, adlibs, or render notes. Delivery is directed as energy, attack, and register \u2014 scream, growl, clean, the fist and the crush \u2014 in plain English, never as a scripted foreign syllable, and the user's own enemies, wounds, and words always outrank any stock cartoon-darkness.",
      "defaultRoomId": "thrash",
      "rooms": [
        {
          "id": "thrash",
          "name": "Thrash / Groove",
          "oneLine": "The Metallica, Pantera, and Lamb of God lane \u2014 riff-driven aggression and defiance, mostly sung-or-shouted hard over a galloping riff (standard-tuned thrash to down-tuned groove), built to move a pit.",
          "tempoGroove": "120-200 BPM \u2014 the thrash end gallops 160-200 on palm-muted downpicking, the groove-metal end stomps 120-150 in a half-time swagger; the riff is the engine and the double-kick drives under it, opening into a half-time breakdown stomp. Medium word density: tight, rhythmic, punchy lines that lock to the riff and break so the guitar can gallop \u2014 never wall-to-wall, the riff needs the air.",
          "writingDials": [
            "Riff-first: the guitar riff is the hook, not the vocal melody \u2014 write lines that ride the riff's rhythm and phrasing, lock the stressed syllables to the palm-muted chug, and leave the gaps where the riff gallops alone; a sheet that buries the riff under nonstop words has silenced the thing that defines the room.",
            "The vocal decision is mostly-sung-or-shouted with grit: this room lives in a hard, forward, mid-range delivery \u2014 shouted, half-sung, aggressive \u2014 with a full scream saved for a peak line, not the whole song; clean singing is allowed but stays hard-edged and defiant, never soft.",
            "Write for defiance and momentum: the register is rage, resistance, standing your ground, calling something out \u2014 deliver it plain and forceful, present-tense, the fist already in the air; the honest hard word outranks the clever one.",
            "The chorus is a chant a pit shouts back: a short, blunt, repeatable phrase built to be roared by a room, gaining weight each return \u2014 if it could not be shouted by a crowd with fists up, it is pitched wrong for this room.",
            "Build a breakdown and write into it: plan the half-time stomp where the riff drops to a crushing chug and the pit moves \u2014 leave a blunt gang-shouted line or a held roar to land on it, the lyric built around that drop, not over it.",
            "Rhyme blunt and driving: hard, hammering end-rhyme and repeated key words that hit square with the riff \u2014 this is not the room for subtle slant-rhyme; the rhyme lands like a downstroke.",
            "Keep the darkness the user's own catharsis: real rage, real defiance, a real enemy or struggle from the user's life or metaphor \u2014 never an invented war, atrocity, or named victim the story did not contain.",
            "Cross-genre firewall: the palm-muted metal riff, the double-kick gallop, and the half-time breakdown make it metal thrash, not hard rock \u2014 rock rides a lighter, mostly-clean riff-and-chorus with no down-tuned chug, no double-kick gallop, and no breakdown; this room hits heavier and moves a pit, not a crowd swaying."
          ],
          "rendering": "Palm-muted rhythm guitars galloping tight (standard or Eb-tuned for the thrash end, down-tuned for the groove end), a lead guitar throwing fast fills and a shredding solo, double-kick drums driving under a cracking snare, growling distorted bass locked to the riff, dropping into a half-time breakdown chug. Aggressive forward mid-range lead vocal \u2014 shouted and half-sung with grit, a scream on the peaks \u2014 gang vocals shouting the chant, dry punchy modern-metal mix with real low-end weight.",
          "storyFit": "Best for: rage and defiance, standing your ground, calling out betrayal, survival and resistance, a fist-in-the-air anthem, controlled fury with a target. Poor fit: the deliberate clean-chorus-vs-scream emotional swing \u2014 that is metalcore; a wall-to-wall growl and blast \u2014 that is death; tender reflection or anything that needs no aggression at all.",
          "parodyTraps": "Generic cartoon-Satan or edgelord darkness with no real feeling under it; a chorus too wordy for a pit to shout; burying the riff under nonstop lyrics; a soft crooned delivery that fights the aggression; inventing a war or atrocity the user never lived instead of serving their real rage.",
          "performance": {
            "prose": "Density moderate; min adlibs 4; delivery tags [Scream] [Gang Vocals] [Breakdown] [Guitar Solo] [Double Kick]. This room performs like a frontman and a pit shouting back \u2014 one aggressive lead voice mostly shouting-and-singing hard, gang vocals cracking the chant, and a scream thrown on the peaks. Signature: the gang-shout chant \u2014 the room shouts the blunt hook line back with the lead, fists up, the same line landing harder each return, and a scream punches the biggest turn. Placement: verses stay lead-forward locked to the riff with light doubles; the gang vocals hit the chorus and the breakdown, a [Scream] lands on a peak line, and a [Guitar Solo] takes the instrumental section between verses. Tag identity: an aggressive lead and a pit answering as gang vocals \u2014 shouted-back chant on the hook and the breakdown, a scream thrown on the biggest line, the solo marked as its own break. Every shout is energy in plain English \u2014 the user's own defiance, never a scripted growl of words the user did not write.",
            "adlibDensity": "moderate",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Scream]",
              "[Gang Vocals]",
              "[Breakdown]",
              "[Guitar Solo]",
              "[Double Kick]"
            ]
          },
          "builder": {
            "instruments": [
              "down-tuned guitars",
              "double-kick drums",
              "growling bass",
              "orchestral hits"
            ],
            "themes": [
              "Rage & defiance",
              "Survival",
              "Betrayal"
            ],
            "purposes": [
              "Mosh",
              "Scream it out",
              "Epic saga"
            ]
          }
        },
        {
          "id": "melodic-metalcore",
          "name": "Melodic Metalcore",
          "oneLine": "The Killswitch Engage, Architects, and Bring Me the Horizon lane \u2014 the screamed verse against the sung clean chorus, anthemic and emotional, the wound roared and then lifted into a melody.",
          "tempoGroove": "120-180 BPM with a driving double-kick verse and a half-time breakdown, often a wide open feel under the clean chorus; the riff carries the verse and the chorus opens melodic. Medium word density: screamed verses that spit tight rhythmic lines locked to the riff, then a clean chorus that opens wide with fewer words and held vowels the sung voice can lift.",
          "writingDials": [
            "The vocal decision IS the structure: write the verse to be screamed and the chorus to be sung clean \u2014 the contrast between the harsh roar and the soaring melody is the whole point of the room, so build the two halves as opposites and plan exactly where the voice switches.",
            "Write screamed verses that spit: tight, rhythmic, urgent lines packed into the verse that ride the riff and hit hard on consonants \u2014 this is the raw, roared, unguarded half, the wound said at full force.",
            "Write a clean chorus that soars: a short, melodic, anthemic hook on open vowels the sung voice can hold and lift, emotional and singable \u2014 this is the release, the catharsis, the line a room sings back with the lights up.",
            "The chorus is the emotional payoff, not a plot: the verse says the pain and the chorus lifts it into the feeling everyone shares \u2014 devotion, grief, defiance, hope out of darkness \u2014 so make the clean hook the headline the scream was building toward.",
            "Build the breakdown as the floor beneath the release: plan the half-time drop where the riff crushes and the voice roars \u2014 often right after or under the clean chorus \u2014 and leave a screamed or gang-shouted line to land on it, the lyric built around that drop.",
            "Emotional register, not just anger: metalcore carries grief, betrayal, inner demons, the fight to survive them \u2014 the harsh voice roars the struggle and the clean voice reaches for the way through; keep it the user's own real wound, never an invented tragedy.",
            "Keep the two voices one story: the scream and the clean sing are the same person \u2014 the verse and chorus must be the same wound seen from rage and from hope, never two unrelated ideas stitched together.",
            "Cross-genre firewall: the deliberate screamed-verse-into-clean-chorus split and the breakdown make it metalcore, not thrash \u2014 thrash stays mostly one hard sung-or-shouted register with harshness an accent and never trades a screamed verse for a soaring sung chorus as its central move; here the clean/harsh swing is the song's spine."
          ],
          "rendering": "Down-tuned riffing guitars with a bright melodic lead, driving double-kick drums dropping into a half-time breakdown, growling bass, atmospheric pads or strings swelling under the clean chorus. A screamed lead vocal on the verses and a soaring clean sung vocal on the chorus, harsh and melodic layered on the biggest hook, gang vocals on the breakdown, a polished modern-metalcore mix with weight and lift.",
          "storyFit": "Best for: grief and survival, inner demons fought and named, betrayal turned to defiance, hope clawed out of darkness, an emotional anthem with a roar and a release. Poor fit: pure riff-and-pit aggression with no clean release \u2014 that is thrash; a wall-to-wall growl with no melody \u2014 that is death; anything that wants one steady register with no clean-vs-harsh swing.",
          "parodyTraps": "A clean chorus and a screamed verse that are two unrelated songs bolted together; generic melodramatic darkness with no real wound under it; a chorus too wordy or too low to soar; forcing a scream where the story wants the clean lift; inventing a tragedy the user never lived instead of roaring their real grief.",
          "performance": {
            "prose": "Density heavy; min adlibs 6; delivery tags [Scream] [Growl] [Clean Vocals] [Breakdown] [Gang Vocals]. This room performs on the clean-vs-harsh split \u2014 with the iconic low [Growl] roar available on the breakdown, not only the high scream \u2014 a screamed lead roaring the verse, a clean sung lead soaring the chorus, and the two layered on the biggest hook. Signature: the harsh-into-clean turn \u2014 the screamed verse hands off to the clean sung chorus and lifts the wound into a melody, then a screamed or gang-shouted line drops onto the breakdown, the same clean hook landing bigger and often layered with a roar underneath each return. Placement: [Scream] marks the verses, [Clean Vocals] marks the chorus, the switch written where the voice changes; gang vocals and a scream hit the [Breakdown], and the final chorus stacks the clean lead over a harsh layer. Tag identity: two voices as one person \u2014 a [Scream] roaring the verse, [Clean Vocals] soaring the chorus, gang vocals cracking the breakdown, harsh and clean layered on the last hook. Every roared and sung word is the user's own wound in plain English, never a scripted harsh syllable the user did not write.",
            "adlibDensity": "heavy",
            "minAdlibs": 6,
            "deliveryTags": [
              "[Scream]",
              "[Growl]",
              "[Clean Vocals]",
              "[Breakdown]",
              "[Gang Vocals]"
            ]
          },
          "builder": {
            "instruments": [
              "down-tuned guitars",
              "double-kick drums",
              "growling bass",
              "orchestral hits"
            ],
            "themes": [
              "Inner demons",
              "Survival",
              "Betrayal"
            ],
            "purposes": [
              "Scream it out",
              "Mosh",
              "Epic saga"
            ]
          }
        },
        {
          "id": "death",
          "name": "Death / Extreme",
          "oneLine": "The death-and-black-metal lane \u2014 growled or shrieked, brutal and dark, blast beats and tremolo-picked riffs, the vocal an instrument of pure weight and texture.",
          "tempoGroove": "60-260 BPM \u2014 blast beats and tremolo riffs tear at 180-260, the crushing grooves and doom-slow breakdowns drop to 60-100; the double-kick and blast beats drive under down-tuned tremolo-picked and chugging riffs. Medium-to-high word density: dense, guttural, consonant-heavy lines that ride the blast and the pick-work, meaning carried by weight and rhythm more than melody \u2014 with a gap left for the riff to blast alone and for the slow crushing breakdown.",
          "writingDials": [
            "The vocal decision is harsh nearly wall-to-wall: write for a growl or a shriek \u2014 a low guttural roar or a high rasp \u2014 as the constant voice; clean singing is rare here and used only as a stark contrast on one passage if at all, so the words are carried by weight, not tune.",
            "Write for the growl's mouth-feel: hard consonants, dense syllables, and rhythmic weight matter more than open singable vowels \u2014 the guttural voice rides the riff as another percussion line, so pocket and impact outrank neat melody.",
            "The register is darkness as catharsis and metaphor: death, war, demons, decay, rage, the abyss \u2014 deliver it dense and brutal, but keep it the user's own real fury, grief, or metaphorical darkness, and never invent a real-world atrocity or a named person's harm the user did not write.",
            "Meaning is carried by weight and texture, not a hook: this room does not build to a singable chorus \u2014 a repeated growled phrase or a title roared on the heaviest drop stands in for one, so write lines that hit hard and dark, not lines that must be sung back.",
            "Build the breakdown as pure crush: plan the slowest, heaviest drop or the fastest blast as the song's climax \u2014 leave a growled title or a held guttural roar to land on the crushing breakdown, the lyric built around that act of violence in sound.",
            "Ride the blast and the tremolo: lock the phrasing to the blast beats and the tremolo-picked riff, dense and relentless through the fast sections, then let the words thin as the riff blasts alone and the breakdown crushes.",
            "Rhyme is optional and weight is not: internal consonance and hammering repetition serve more than clean end-rhyme; a dark, heavy, true line outranks a rhymed one, and the darkness stays the user's own.",
            "Cross-genre firewall: the wall-to-wall growl or shriek, the blast beats, and the pure-crush breakdown make it death / extreme, not metalcore \u2014 metalcore trades its scream for a soaring clean chorus as its central move, while this room stays harsh almost throughout and builds to brutality, not a sung release; the guttural voice and the blast are the spine."
          ],
          "rendering": "Down-tuned tremolo-picked and chugging guitars, blast beats and relentless double-kick under a snare crack, deep growling distorted bass, dropping into a slow crushing doom-heavy breakdown or a full-speed blast. A low guttural growl or a high shriek as the lead vocal nearly throughout, layered harsh vocals on the heaviest drops, orchestral hits or dark ambience for atmosphere, a heavy brutal extreme-metal mix with crushing low-end.",
          "storyFit": "Best for: pure catharsis, rage at its most extreme, grief turned to darkness, war and death as metaphor, inner demons at full brutality, the abyss stared down. Poor fit: a soaring clean-chorus anthem \u2014 that is metalcore; a fist-in-the-air pit chant \u2014 that is thrash; anything that needs a singable melody or a clean register to carry it.",
          "parodyTraps": "Cartoon gore or edgelord shock with no real feeling under it; inventing a real atrocity or a named victim the user never wrote \u2014 the single hardest law here; forcing a clean singable chorus this room does not want; thinning the density into a light rock lyric; darkness worn as costume instead of the user's own catharsis or metaphor.",
          "performance": {
            "prose": "Density heavy; min adlibs 4; delivery tags [Growl] [Scream] [Breakdown] [Blast Beats] [Double Kick]. This room performs like a wall of guttural sound \u2014 a low growl or high shriek nearly throughout, layered harsh vocals on the heaviest drops, no clean crowd-chant. Signature: the layered growl on the crush \u2014 the guttural roar rides the blast dense and relentless, then a growled title or a stacked harsh layer lands on the slow crushing breakdown, the weight the payoff where another room would put a hook. Placement: the growl carries the verses nearly unbroken over the blast; a [Blast Beats] or [Double Kick] section lets the riff tear alone, and layered harsh vocals crack the [Breakdown] where the song drops to its heaviest. Tag identity: a guttural lead as texture and weight \u2014 a [Growl] or [Scream] nearly throughout, layered harsh vocals on the crush, the breakdown marked as pure heaviness, no clean sing and no crowd. Every growled word is the user's own darkness in plain English, never an invented atrocity or a scripted guttural phrase the user did not write.",
            "adlibDensity": "heavy",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Growl]",
              "[Scream]",
              "[Breakdown]",
              "[Blast Beats]",
              "[Double Kick]"
            ]
          },
          "builder": {
            "instruments": [
              "down-tuned guitars",
              "blast beats",
              "double-kick drums",
              "growling bass",
              "orchestral hits"
            ],
            "themes": [
              "War & darkness",
              "Inner demons",
              "Rage & defiance"
            ],
            "purposes": [
              "Scream it out",
              "Mosh",
              "Epic saga"
            ]
          }
        }
      ],
      "cues": [
        {
          "cue": "thrash",
          "strength": "strong",
          "roomId": "thrash"
        },
        {
          "cue": "groove metal",
          "strength": "strong",
          "roomId": "thrash"
        },
        {
          "cue": "metallica",
          "strength": "strong",
          "roomId": "thrash"
        },
        {
          "cue": "pantera",
          "strength": "strong",
          "roomId": "thrash"
        },
        {
          "cue": "mosh",
          "strength": "weak",
          "roomId": "thrash"
        },
        {
          "cue": "riff",
          "strength": "weak",
          "roomId": "thrash"
        },
        {
          "cue": "fist in the air",
          "strength": "weak",
          "roomId": "thrash"
        },
        {
          "cue": "defiance",
          "strength": "weak",
          "roomId": "thrash"
        },
        {
          "cue": "metalcore",
          "strength": "strong",
          "roomId": "melodic-metalcore"
        },
        {
          "cue": "clean chorus",
          "strength": "strong",
          "roomId": "melodic-metalcore"
        },
        {
          "cue": "screamed verse",
          "strength": "strong",
          "roomId": "melodic-metalcore"
        },
        {
          "cue": "killswitch",
          "strength": "strong",
          "roomId": "melodic-metalcore"
        },
        {
          "cue": "breakdown",
          "strength": "weak",
          "roomId": "melodic-metalcore"
        },
        {
          "cue": "anthemic",
          "strength": "weak",
          "roomId": "melodic-metalcore"
        },
        {
          "cue": "grief",
          "strength": "weak",
          "roomId": "melodic-metalcore"
        },
        {
          "cue": "inner demons",
          "strength": "weak",
          "roomId": "melodic-metalcore"
        },
        {
          "cue": "death metal",
          "strength": "strong",
          "roomId": "death"
        },
        {
          "cue": "black metal",
          "strength": "strong",
          "roomId": "death"
        },
        {
          "cue": "growl",
          "strength": "strong",
          "roomId": "death"
        },
        {
          "cue": "blast beats",
          "strength": "strong",
          "roomId": "death"
        },
        {
          "cue": "brutal",
          "strength": "weak",
          "roomId": "death"
        },
        {
          "cue": "guttural",
          "strength": "weak",
          "roomId": "death"
        },
        {
          "cue": "the abyss",
          "strength": "weak",
          "roomId": "death"
        },
        {
          "cue": "extreme",
          "strength": "weak",
          "roomId": "death"
        }
      ]
    }
  },
  "hash": "27e16d87f6bc",
  "approxTokens": {
    "core": 1794,
    "largestSlice": 3774
  }
};

// server/engine/landing.ts
function squash(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function scanNorm(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function containsPhrase(haystackScan, phraseScan) {
  if (!phraseScan) return false;
  return (" " + haystackScan + " ").includes(" " + phraseScan + " ");
}
var AMBIGUOUS_SINGLE_WORDS = /* @__PURE__ */ new Set([
  "alt",
  "alternative",
  "classic",
  "contemporary",
  "modern",
  "new",
  "old",
  "school",
  "soul",
  "quiet",
  "storm",
  "smooth",
  "deep",
  "dirty",
  "hard",
  "soft",
  "southern",
  "northern",
  "western",
  "eastern",
  "coast",
  "country",
  "house",
  "roots",
  "golden",
  "future",
  "traditional",
  "pop",
  "wave",
  "urban",
  "indie",
  "neo",
  "progressive",
  "experimental",
  // Pop rooms strip to everyday story words ("Dance-Pop" -> "dance",
  // "Bedroom Pop" -> "bedroom", "Synth-Pop" -> "synth"): a first dance at a
  // wedding or a synth in a party brief must never read as naming a room.
  "dance",
  "bedroom",
  "synth"
]);
var DECADE_WORDS = {
  "20s": "twenties",
  "30s": "thirties",
  "40s": "forties",
  "50s": "fifties",
  "60s": "sixties",
  "70s": "seventies",
  "80s": "eighties",
  "90s": "nineties"
};
function decadeWord(token) {
  const match = /^(?:19|20)?([2-9]0)s$/.exec(token);
  return match ? DECADE_WORDS[match[1] + "s"] : void 0;
}
function spellingVariants(text) {
  const variants = /* @__PURE__ */ new Set();
  variants.add(scanNorm(text));
  if (text.includes("&")) {
    variants.add(scanNorm(text.replace(/&/g, "n")));
    variants.add(scanNorm(text.replace(/&/g, " and ")));
  }
  for (const v of [...variants]) {
    const words = v.split(" ");
    const respelled = words.map((w) => decadeWord(w) ?? w).join(" ");
    if (respelled !== v) variants.add(respelled);
    if (containsPhrase(v, "classic")) {
      variants.add((" " + v + " ").split(" classic ").join(" old school ").trim());
    }
  }
  variants.delete("");
  return [...variants];
}
function isSafeInStory(scan) {
  return scan.includes(" ") || !AMBIGUOUS_SINGLE_WORDS.has(scan);
}
function aliasesForRoom(room, genreForms) {
  const bases = /* @__PURE__ */ new Set();
  bases.add(room.id.replace(/-/g, " "));
  bases.add(room.name);
  for (const segment of room.name.split("/")) bases.add(segment);
  const scans = /* @__PURE__ */ new Set();
  for (const base of bases) {
    for (const variant of spellingVariants(base)) {
      scans.add(variant);
      for (const genreForm of genreForms) {
        if (variant !== genreForm && containsPhrase(variant, genreForm)) {
          const short = scanNorm(
            (" " + variant + " ").split(" " + genreForm + " ").join(" ")
          );
          if (short) scans.add(short);
        }
      }
    }
  }
  const aliases = [];
  for (const scan of scans) {
    aliases.push({ roomId: room.id, scan, key: squash(scan), safeInStory: isSafeInStory(scan) });
    const joined = squash(scan);
    if (scan.includes(" ") && joined && !scans.has(joined)) {
      aliases.push({ roomId: room.id, scan: joined, key: joined, safeInStory: true });
    }
  }
  return aliases;
}
function buildAliases(pack) {
  const genreForms = /* @__PURE__ */ new Set();
  for (const form of [pack.name, ...pack.aliases]) {
    for (const variant of spellingVariants(form)) genreForms.add(variant);
  }
  const aliases = [];
  for (const room of pack.rooms) {
    aliases.push(...aliasesForRoom(room, [...genreForms]));
  }
  return aliases;
}
function landRoom(pack, story, explicitPick) {
  const aliases = buildAliases(pack);
  const pick = (explicitPick ?? "").trim();
  if (pick) {
    const pickKey = squash(pick);
    const exact = aliases.find((a) => a.key === pickKey);
    if (exact) {
      return { roomId: exact.roomId, rule: "picked", firedCues: [], notYetDeep: false };
    }
    const pickScan = scanNorm(pick);
    const inside = aliases.filter((a) => containsPhrase(pickScan, a.scan));
    if (inside.length > 0) {
      const roomsNamed = new Set(inside.map((a) => a.roomId));
      const longest = [...inside].sort(
        (a, b) => b.scan.length - a.scan.length || a.roomId.localeCompare(b.roomId)
      )[0];
      return {
        roomId: longest.roomId,
        rule: "picked",
        firedCues: [],
        // a fusion pick has no page under its own name -> not-yet-deep
        notYetDeep: roomsNamed.size > 1
      };
    }
    return { roomId: pack.defaultRoomId, rule: "picked", firedCues: [], notYetDeep: true };
  }
  const storyScan = scanNorm(story);
  const named = aliases.filter((a) => a.safeInStory && containsPhrase(storyScan, a.scan));
  if (named.length > 0) {
    const sorted = [...named].sort((a, b) => b.scan.length - a.scan.length);
    const top = sorted[0];
    const rival = sorted.find(
      (a) => a.roomId !== top.roomId && a.scan.length === top.scan.length
    );
    if (!rival) {
      return { roomId: top.roomId, rule: "picked", firedCues: [], notYetDeep: false };
    }
  }
  const hitsByRoom = /* @__PURE__ */ new Map();
  for (const mark of pack.cues) {
    if (!containsPhrase(storyScan, scanNorm(mark.cue))) continue;
    const entry = hitsByRoom.get(mark.roomId) ?? { strong: [], weak: [] };
    const bucket = entry[mark.strength];
    if (!bucket.includes(mark.cue)) bucket.push(mark.cue);
    hitsByRoom.set(mark.roomId, entry);
  }
  const qualifying = [...hitsByRoom.entries()].filter(
    ([, hits]) => hits.strong.length >= 1 || hits.weak.length >= 2
  );
  if (qualifying.length > 0) {
    qualifying.sort(
      ([, a], [, b]) => b.strong.length - a.strong.length || b.weak.length - a.weak.length
    );
    const [topRoomId, topHits] = qualifying[0];
    const contested = qualifying.some(
      ([roomId, hits]) => roomId !== topRoomId && hits.strong.length === topHits.strong.length && hits.weak.length === topHits.weak.length
    );
    if (!contested) {
      return {
        roomId: topRoomId,
        rule: "inferred",
        firedCues: [...topHits.strong, ...topHits.weak],
        notYetDeep: false
      };
    }
  }
  return { roomId: pack.defaultRoomId, rule: "defaulted", firedCues: [], notYetDeep: false };
}
function describeLanding(landing, pack) {
  const room = pack.rooms.find((r) => r.id === landing.roomId);
  const roomName = room ? room.name : landing.roomId;
  let sentence;
  if (landing.rule === "picked") {
    sentence = landing.notYetDeep ? `Your pick landed in ${roomName}.` : `You chose ${roomName}.`;
  } else if (landing.rule === "inferred") {
    sentence = `Your story sounded like ${roomName} (because you mentioned: ${landing.firedCues.join(", ")}).`;
  } else {
    sentence = `We used ${pack.name}'s home base: ${roomName}.`;
  }
  if (landing.notYetDeep) {
    sentence += " We don't have a deep page for that exact pick yet, so we used the closest room we know well.";
  }
  return sentence;
}

// server/engine/checks.ts
function tokenize(text) {
  const matches = text.toLowerCase().match(/[a-z']+/g);
  if (!matches) return [];
  const words = [];
  for (const raw of matches) {
    const word = raw.replace(/'/g, "");
    if (word.length > 0) words.push(word);
  }
  return words;
}
function distinctTokens(text) {
  return new Set(tokenize(text));
}
function overlapRatio(a, b) {
  const larger = Math.max(a.size, b.size);
  if (larger === 0) return 1;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  return shared / larger;
}
function estimateSyllables(line) {
  let total = 0;
  for (const word of tokenize(line)) total += syllablesInWord(word);
  return total;
}
function syllablesInWord(raw) {
  const cleaned = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned.length === 0) return 0;
  if (cleaned.length <= 3) return 1;
  let w = cleaned;
  if (/[^aeiouytd]ed$/.test(w)) {
    w = w.slice(0, -2);
  } else if (/[^aeiouysxz]es$/.test(w) && !/[cs]hes$/.test(w)) {
    w = w.slice(0, -2);
  } else if (/[^aeiouy]e$/.test(w) && !/[^aeiouy]le$/.test(w)) {
    w = w.slice(0, -1);
  }
  const groups = w.replace(/^y/, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 0);
}
var TAG_LINE = /^\s*\[([^\]]+)\]/;
function parseDraft(draft) {
  const lines = draft.split(/\r?\n/);
  let title = null;
  let sunoStart = -1;
  let lyricsStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (title === null) {
      const m = line.match(/^title\s*:\s*(.*)$/i);
      if (m && m[1].trim().length > 0) title = m[1].trim();
    }
    if (sunoStart === -1 && /^###\s*suno\s+prompt\s*$/i.test(line)) sunoStart = i;
    if (lyricsStart === -1 && /^###\s*lyrics\s*$/i.test(line)) lyricsStart = i;
  }
  let sunoPrompt = null;
  if (sunoStart !== -1) {
    const collected = [];
    for (let i = sunoStart + 1; i < lines.length; i++) {
      if (lines[i].trim().startsWith("###")) break;
      collected.push(lines[i]);
    }
    sunoPrompt = collected.join("\n").trim();
  }
  let lyricsBody = null;
  const sections = [];
  const lyricLines = [];
  if (lyricsStart !== -1) {
    const bodyLines = lines.slice(lyricsStart + 1);
    lyricsBody = bodyLines.join("\n");
    let current = null;
    for (const rawLine of bodyLines) {
      const line = rawLine.trim();
      if (line.length === 0) continue;
      const tag = line.match(TAG_LINE);
      if (tag) {
        current = { tag: tag[1].trim().toLowerCase(), lines: [] };
        sections.push(current);
        continue;
      }
      lyricLines.push(line);
      if (current) current.lines.push(line);
    }
  }
  return { title, sunoPrompt, lyricsBody, sections, lyricLines };
}
var FUNCTION_WORDS = /* @__PURE__ */ new Set([
  "a",
  "am",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "being",
  "but",
  "by",
  "did",
  "do",
  "does",
  "dont",
  "for",
  "from",
  "he",
  "her",
  "hers",
  "him",
  "his",
  "how",
  "i",
  "if",
  "im",
  "in",
  "is",
  "it",
  "its",
  "me",
  "mine",
  "my",
  "na",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "oh",
  "on",
  "ooh",
  "or",
  "our",
  "ours",
  "out",
  "over",
  "she",
  "so",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "these",
  "they",
  "this",
  "those",
  "to",
  "under",
  "up",
  "us",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "who",
  "whom",
  "why",
  "with",
  "yeah",
  "yet",
  "you",
  "your",
  "yours"
]);
var STORY_STOPWORDS = /* @__PURE__ */ new Set([
  "about",
  "above",
  "after",
  "again",
  "against",
  "almost",
  "along",
  "already",
  "although",
  "always",
  "among",
  "another",
  "anybody",
  "anything",
  "anyway",
  "around",
  "because",
  "become",
  "before",
  "behind",
  "being",
  "below",
  "beneath",
  "beside",
  "besides",
  "between",
  "beyond",
  "cannot",
  "could",
  "couldnt",
  "didnt",
  "doesnt",
  "doing",
  "during",
  "either",
  "enough",
  "every",
  "everybody",
  "everyone",
  "everything",
  "getting",
  "going",
  "gonna",
  "gotta",
  "having",
  "herself",
  "himself",
  "itself",
  "maybe",
  "might",
  "myself",
  "neither",
  "never",
  "nobody",
  "nothing",
  "often",
  "other",
  "others",
  "ought",
  "ourselves",
  "quite",
  "rather",
  "really",
  "shall",
  "should",
  "shouldnt",
  "since",
  "somebody",
  "someone",
  "something",
  "sometimes",
  "still",
  "their",
  "theirs",
  "themselves",
  "there",
  "theres",
  "these",
  "theyll",
  "theyre",
  "thing",
  "things",
  "those",
  "though",
  "through",
  "throughout",
  "toward",
  "towards",
  "under",
  "underneath",
  "until",
  "wanna",
  "wasnt",
  "werent",
  "whatever",
  "whenever",
  "where",
  "whether",
  "which",
  "while",
  "whose",
  "within",
  "without",
  "would",
  "wouldnt",
  "youll",
  "youre",
  "yourself",
  "yourselves"
]);
var GENERIC_SONG_WORDS = /* @__PURE__ */ new Set([
  "love",
  "loves",
  "loved",
  "loving",
  "heart",
  "hearts",
  "night",
  "nights",
  "tonight",
  "time",
  "times",
  "feel",
  "feels",
  "feeling",
  "feelings",
  "felt",
  "baby",
  "world",
  "dream",
  "dreams",
  "dreaming",
  "forever",
  "alone",
  "light",
  "lights",
  "shine",
  "shining",
  "fire",
  "rain",
  "tears",
  "eyes",
  "soul",
  "souls",
  "music",
  "dance",
  "dancing",
  "song",
  "songs",
  "smile",
  "touch"
]);
var LEAK_TOKENS = [
  "coreemotion",
  "worddensity",
  "writingdials",
  "roomid",
  "step 1",
  "the brief"
];
function contentWords(text) {
  const seen = /* @__PURE__ */ new Set();
  for (const word of tokenize(text)) {
    if (!FUNCTION_WORDS.has(word)) seen.add(word);
  }
  return [...seen];
}
function distinctiveStoryTokens(story) {
  const seen = /* @__PURE__ */ new Set();
  for (const word of tokenize(story)) {
    if (word.length <= 4) continue;
    if (STORY_STOPWORDS.has(word) || GENERIC_SONG_WORDS.has(word)) continue;
    seen.add(word);
  }
  return [...seen];
}
function rhymeKey(line) {
  const wordsInLine = tokenize(line);
  if (wordsInLine.length === 0) return null;
  let last = wordsInLine[wordsInLine.length - 1];
  if (last.length > 3 && /[^aeiouy]e$/.test(last) && !/[^aeiouy]le$/.test(last)) {
    last = last.slice(0, -1);
  }
  const m = last.match(/[aeiouy]+[^aeiouy]*$/);
  return m ? m[0] : null;
}
function runChecks(draft, opts) {
  const parsed = parseDraft(draft);
  const body = parsed.lyricsBody ?? "";
  const checks = [];
  {
    const problems = [];
    if (!parsed.title) problems.push("missing or empty Title line");
    if (parsed.sunoPrompt === null) {
      problems.push('missing "### SUNO Prompt" section');
    } else {
      const promptWords = parsed.sunoPrompt.split(/\s+/).filter((w) => w.length > 0).length;
      if (promptWords < 25 || promptWords > 120) {
        problems.push(`SUNO prompt is ${promptWords} words (need 25-120)`);
      }
    }
    if (parsed.lyricsBody === null) {
      problems.push('missing "### Lyrics" section');
    } else {
      if (!parsed.sections.some((s) => /\bverse\b/.test(s.tag))) problems.push("no [Verse] section in lyrics");
      if (!parsed.sections.some((s) => /\b(chorus|hook|refrain)\b/.test(s.tag))) problems.push("no [Chorus]/[Hook] section in lyrics");
    }
    checks.push({
      id: "format",
      severity: "fail",
      ok: problems.length === 0,
      detail: problems.length > 0 ? problems.join("; ") : void 0
    });
  }
  {
    const lowered = body.toLowerCase();
    const leaks = [];
    for (const token of LEAK_TOKENS) {
      if (lowered.includes(token)) leaks.push(`"${token}"`);
    }
    if (body.includes("GENERATION_DECLINED")) leaks.push("GENERATION_DECLINED");
    if (/\{[\s\S]{18,}?\}/.test(body)) leaks.push("curly-brace block");
    if (body.split(/\r?\n/).some((line) => line.trim().startsWith("#"))) {
      leaks.push("markdown header in lyrics");
    }
    checks.push({
      id: "leaked-labels",
      severity: "fail",
      ok: leaks.length === 0,
      detail: leaks.length > 0 ? `leaked: ${leaks.join(", ")}` : void 0
    });
  }
  {
    const storyTokens2 = distinctiveStoryTokens(opts.story);
    if (storyTokens2.length < 2) {
      checks.push({ id: "story-fidelity", severity: "fail", ok: true, detail: "story too short to verify" });
    } else {
      const lyricStems = new Set(tokenize(body).map((w) => w.slice(0, 5)));
      const matched = storyTokens2.filter((t) => lyricStems.has(t.slice(0, 5)));
      checks.push({
        id: "story-fidelity",
        severity: "fail",
        ok: matched.length >= 2,
        detail: matched.length >= 2 ? `story tokens in lyrics: ${matched.slice(0, 6).join(", ")}` : `only ${matched.length} of ${storyTokens2.length} distinctive story tokens reached the lyrics`
      });
    }
  }
  {
    const hookSeverity = opts.hookLocked === false ? "warn" : "fail";
    const hookText = parsed.title && contentWords(parsed.title).length > 0 ? parsed.title : opts.hook;
    const hookContent = contentWords(hookText);
    const hookBearing = parsed.sections.filter((s) => /^(chorus|hook|refrain|post-?chorus|vamp)/.test(s.tag));
    if (hookBearing.length === 0) {
      checks.push({ id: "hook-placement", severity: hookSeverity, ok: false, detail: "no [Chorus]/[Hook] block to place the hook in" });
    } else if (hookContent.length === 0) {
      checks.push({ id: "hook-placement", severity: hookSeverity, ok: true, detail: "hook has no content words to place" });
    } else {
      const chorusTokens = distinctTokens(hookBearing.map((s) => s.lines.join("\n")).join("\n"));
      const found = hookContent.filter((w) => chorusTokens.has(w));
      checks.push({
        id: "hook-placement",
        severity: hookSeverity,
        ok: found.length / hookContent.length >= 0.6,
        detail: `${found.length}/${hookContent.length} hook words in the chorus/hook`
      });
    }
  }
  {
    const hookContent = new Set(contentWords(opts.hook));
    const shared = contentWords(parsed.title ?? "").filter((w) => hookContent.has(w));
    checks.push({
      id: "title-hook",
      severity: "warn",
      ok: shared.length >= 1,
      detail: shared.length > 0 ? `shared: ${shared.join(", ")}` : "title shares no content word with the hook"
    });
  }
  {
    const stripAdlibs = (s) => s.replace(/\([^)]*\)/g, " ");
    const chorusSections = parsed.sections.filter((s) => /^(chorus|hook|refrain|post-?chorus|vamp)/.test(s.tag));
    const hookWords = contentWords(parsed.title || opts.hook);
    const hasHook = (tokens) => hookWords.length > 0 && hookWords.filter((w) => tokens.has(w)).length / hookWords.length >= 0.6;
    if (chorusSections.length < 2) {
      checks.push({ id: "chorus-consistency", severity: "fail", ok: true, detail: "fewer than two chorus blocks" });
    } else {
      const tokenSets = chorusSections.map((s) => distinctTokens(stripAdlibs(s.lines.join("\n"))));
      const ref = tokenSets[0];
      const drifters = tokenSets.slice(1).filter((t) => overlapRatio(ref, t) < 0.6 && !hasHook(t));
      checks.push({
        id: "chorus-consistency",
        severity: "fail",
        ok: drifters.length === 0,
        detail: drifters.length ? `${drifters.length} chorus/vamp block(s) neither match the first nor carry the hook` : "choruses consistent (vamps carry the hook)"
      });
    }
  }
  {
    const offenders = [];
    for (const section of parsed.sections) {
      if (!section.tag.startsWith("chorus") || section.lines.length < 2) continue;
      const counts = section.lines.map(estimateSyllables);
      const spread = Math.max(...counts) - Math.min(...counts);
      if (spread > 3) offenders.push(`[${section.tag}] syllable spread ${spread} (max 3)`);
    }
    checks.push({
      id: "metric-parallel",
      severity: "warn",
      ok: offenders.length === 0,
      detail: offenders.length > 0 ? offenders.join("; ") : void 0
    });
  }
  {
    const counts = parsed.lyricLines.map(estimateSyllables);
    const keys = parsed.lyricLines.map(rhymeKey);
    let flaggedAt = -1;
    for (let i = 0; i + 6 <= parsed.lyricLines.length && flaggedAt === -1; i++) {
      const window = counts.slice(i, i + 6);
      if (Math.max(...window) - Math.min(...window) > 1) continue;
      let rhymed = true;
      for (let p = 0; p < 6 && rhymed; p += 2) {
        const a = keys[i + p];
        const b = keys[i + p + 1];
        rhymed = a !== null && b !== null && a === b;
      }
      if (rhymed) flaggedAt = i;
    }
    checks.push({
      id: "nursery-rhyme",
      severity: "warn",
      ok: flaggedAt === -1,
      detail: flaggedAt === -1 ? void 0 : `sing-song wall starting at lyric line ${flaggedAt + 1}`
    });
  }
  {
    const densityText = opts.spec.wordDensity.toLowerCase();
    let band = null;
    if (densityText.includes("low")) band = [3, 7];
    else if (densityText.includes("moderate")) band = [5, 10];
    else if (densityText.includes("high") || densityText.includes("dense")) band = [8, 14];
    if (band === null || parsed.lyricLines.length === 0) {
      checks.push({
        id: "word-density",
        severity: "warn",
        ok: true,
        detail: band === null ? "no recognized density band in spec" : "no lyric lines to measure"
      });
    } else {
      const totalWords = parsed.lyricLines.reduce((sum, line) => sum + tokenize(line).length, 0);
      const avg = totalWords / parsed.lyricLines.length;
      checks.push({
        id: "word-density",
        severity: "warn",
        ok: avg >= band[0] && avg <= band[1],
        detail: `avg ${avg.toFixed(1)} words/line vs band ${band[0]}-${band[1]}`
      });
    }
  }
  {
    const verses = parsed.sections.filter((s) => s.tag.startsWith("verse"));
    if (verses.length < 2) {
      checks.push({ id: "verse-advance", severity: "warn", ok: true, detail: "fewer than two verse blocks" });
    } else {
      const v1 = distinctTokens(verses[0].lines.join("\n"));
      const v2 = distinctTokens(verses[1].lines.join("\n"));
      let shared = 0;
      for (const token of v2) if (v1.has(token)) shared++;
      const share = v2.size === 0 ? 1 : shared / v2.size;
      checks.push({
        id: "verse-advance",
        severity: "warn",
        ok: share < 0.6,
        detail: `${Math.round(share * 100)}% of verse-2 tokens already in verse 1`
      });
    }
  }
  {
    const banned = opts.bannedPhrases || [];
    if (banned.length > 0) {
      const lower = body.toLowerCase();
      const hits = banned.filter((p) => lower.includes(p));
      checks.push({
        id: "banned-phrases",
        severity: "fail",
        ok: hits.length === 0,
        detail: hits.length ? `house-style phrases found: ${hits.join("; ")}` : "clean"
      });
    }
  }
  {
    const image = String(opts.centralImage || "").trim();
    if (image) {
      const keyWords = distinctTokens(image);
      let appearances = 0;
      const lowerLines = (parsed.lyricLines || []).map((l) => l.toLowerCase());
      for (const line of lowerLines) {
        for (const w of keyWords) {
          if (w.length > 3 && line.includes(w.slice(0, 5))) {
            appearances++;
            break;
          }
        }
      }
      checks.push({
        id: "central-image",
        severity: "fail",
        ok: keyWords.size === 0 || appearances >= 2,
        detail: `image "${image}" appears in ${appearances} lyric lines (needs 2+)`
      });
    }
  }
  {
    const suno = parsed.sunoPrompt || "";
    const nameDrop = (
      // "X meets/x/vs Y"
      /\b[A-Z][\w.'&-]+\s+(?:meets|x|×|vs\.?)\s+[A-Z][\w.'&-]+/.test(suno) || /(?:similar to|style of|reminiscent of|sounds like|inspired by|think|like|à ?la)\s+[A-Z][\w.'&-]+\s*(?:,|\bor\b|\band\b|&)\s*[A-Z][\w.'&-]+/.test(suno)
    );
    checks.push({
      id: "artist-names-in-suno",
      severity: "fail",
      ok: !nameDrop,
      detail: nameDrop ? "production prompt name-drops artists \u2014 describe the sound instead" : "clean"
    });
  }
  const STRUCTURE_TAGS = /* @__PURE__ */ new Set([
    "intro",
    "verse",
    "pre-chorus",
    "prechorus",
    "chorus",
    "post-chorus",
    "postchorus",
    "hook",
    "refrain",
    "bridge",
    "break",
    "breakdown",
    "interlude",
    "outro",
    "instrumental",
    "ad-lib section",
    "adlib section",
    "end"
  ]);
  const normalizeTag = (t) => t.trim().toLowerCase().replace(/\s+\d+$/, "").replace(/\s+/g, " ");
  const allBracketTags = [...body.match(/\[[^\]]+\]/g) || []].map((t) => t.slice(1, -1));
  if (typeof opts.minAdlibs === "number") {
    const adlibCount = (body.match(/\([^)]+\)/g) || []).length;
    checks.push({
      id: "adlibs-present",
      severity: "fail",
      ok: adlibCount >= opts.minAdlibs,
      detail: `${adlibCount} adlibs/backing lines in parentheses (room floor ${opts.minAdlibs})`
    });
  }
  if (typeof opts.minAdlibs === "number") {
    const perfTags = allBracketTags.filter((t) => !STRUCTURE_TAGS.has(normalizeTag(t)));
    checks.push({
      id: "performance-tags",
      severity: "fail",
      ok: perfTags.length >= 1,
      detail: perfTags.length ? `${perfTags.length} performance directions` : "no performance direction \u2014 bare section labels only"
    });
  }
  if (typeof opts.minAdlibs === "number") {
    const inline = (parsed.lyricLines || []).filter((l) => /\[[^\]]+\]/.test(l));
    checks.push({
      id: "tags-own-line",
      severity: "fail",
      ok: inline.length === 0,
      detail: inline.length ? `${inline.length} lyric line(s) have an inline bracket tag` : "all tags on their own line"
    });
  }
  if (typeof opts.minAdlibs === "number") {
    const contentCount = (s) => s.lines.filter((l) => !/^\(.*\)$/.test(l.trim())).length;
    const verses = parsed.sections.filter((s) => s.tag.startsWith("verse"));
    const choruses = parsed.sections.filter((s) => /^(chorus|hook|refrain|post-?chorus)/.test(s.tag));
    if (verses.length > 0 && choruses.length > 0) {
      const verseCounts = verses.map(contentCount);
      const avgVerse = verseCounts.reduce((a, b) => a + b, 0) / verseCounts.length;
      const minVerse = Math.min(...verseCounts);
      const chorusLen = Math.max(...choruses.map(contentCount));
      const ok = minVerse >= 4 && avgVerse >= chorusLen - 1;
      checks.push({
        id: "verse-substance",
        severity: "fail",
        ok,
        detail: ok ? `verses avg ${avgVerse.toFixed(1)} lines vs chorus ${chorusLen}` : `verses too thin (avg ${avgVerse.toFixed(1)}, min ${minVerse} lines) under a ${chorusLen}-line chorus \u2014 the verse must carry the story`
      });
    }
  }
  let failCount = 0;
  let warnCount = 0;
  for (const check of checks) {
    if (check.ok) continue;
    if (check.severity === "fail") failCount++;
    else warnCount++;
  }
  return { checks, failCount, warnCount };
}

// server/engine/pipeline.ts
var ENGINE_VERSION = "v3.2-multigenre";
var ENGINE_MODEL = "gpt-4.1";
var EngineNotAvailable = class extends Error {
  code = "engine_not_available";
};
var EngineFailure = class extends Error {
  code = "engine_all_drafts_failed";
  status = 422;
  reasons;
  constructor(reasons) {
    super("The writing didn't meet the bar this time. Let's try again \u2014 you were not charged.");
    this.reasons = reasons;
  }
};
function genreKey(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9&]/g, "");
}
function resolveGenre(curriculum, genre) {
  const norm = genreKey(genre);
  for (const pack of Object.values(curriculum.genres)) {
    const candidates = [pack.id, pack.name, ...pack.aliases].map(genreKey);
    if (candidates.includes(norm)) return pack;
  }
  return null;
}
function voiceLine(vocals) {
  const v = String(vocals || "Female Solo");
  if (/duet|group/i.test(v)) return "duet vocals";
  if (/male/i.test(v) && !/female/i.test(v)) return "male vocal";
  return "female vocal";
}
function parseFirstJson(text) {
  const start = text.search(/[{[]/);
  if (start === -1) throw new Error("no JSON found");
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error("unbalanced JSON");
}
async function planJson(generate, prompt) {
  try {
    return parseFirstJson(await generate(prompt, "plan"));
  } catch {
    return parseFirstJson(await generate(`${prompt}

Return ONLY the JSON. No prose, no markdown fences.`, "plan"));
  }
}
var STOPWORDS = new Set(
  "the a an and or but so of to in on at for with from by is are was were be been am i you he she it we they me him her them my your his its our their this that these those as if then than when where what who how not no yes do does did done have has had will would could should can just really very about into over under again there here all any some one two also".split(" ")
);
function storyTokens(story) {
  const seen = /* @__PURE__ */ new Set();
  for (const raw of String(story).toLowerCase().split(/[^a-z']+/)) {
    const w = raw.replace(/'/g, "");
    if (w.length > 4 && !STOPWORDS.has(w)) seen.add(w);
  }
  return [...seen];
}
var OPEN_VOWEL_END = /[aeiou]y?$|[aeiou]h?$|ow$|ay$|igh$/i;
function scoreHook(hook, tokens) {
  const words = hook.trim().split(/\s+/).filter(Boolean);
  let score = 0;
  if (words.length >= 2 && words.length <= 6) score += 2;
  if (words.length === 7) score += 1;
  const lower = hook.toLowerCase();
  if (tokens.some((t) => lower.includes(t.slice(0, 5)))) score += 2;
  const last = words[words.length - 1] || "";
  if (OPEN_VOWEL_END.test(last)) score += 1;
  if (/["“”:;]/.test(hook)) score -= 1;
  return score;
}
var IMAGE_MODIFIERS = new Set(
  "the a an my your his her our their this that of in on at with and or to for from by between beneath beyond around through without within into onto over under us we you me it old broken little big small warm cold soft hard bright dark faded fading last first final only one two every long short sweet gentle quiet loud deep high low new young lost sweetest".split(" ")
);
function isConcreteImage(image, abstractionWords) {
  const abstract = new Set(abstractionWords.map((w) => w.toLowerCase()));
  const words = String(image).toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return words.some((w) => !abstract.has(w) && !IMAGE_MODIFIERS.has(w) && w.length > 2);
}
function picksBlock(inputs) {
  const picks = [];
  if (inputs.theme) picks.push(`Theme: ${inputs.theme}`);
  if (inputs.purpose) picks.push(`What the song should do: ${inputs.purpose}`);
  if (inputs.audience) picks.push(`Who it speaks to: ${inputs.audience}`);
  if (inputs.instrumentation) picks.push(`Featured instruments: ${inputs.instrumentation}`);
  if (!picks.length) return "";
  return `
THE USER'S CHOICES (honor these exactly \u2014 they are decisions, not suggestions):
${picks.join("\n")}
`;
}
function briefPrompt(story, card, inputs, imageFeedback = "") {
  const storyBlock = story ? `THE STORY (the user's own words):
${story}` : `No story details were given \u2014 build the brief from the choices alone. Keep it universal but concrete, and NEVER invent fake personal details (no invented names, streets, dates, or events pretending to be the user's).`;
  const lang = String(inputs.language || "English").trim();
  const langNote = /^english$/i.test(lang) ? "" : `

LANGUAGE: this song's lyrics will be written in ${lang}. The "centralImage" field MUST be written in ${lang} \u2014 the exact plain word or short phrase a ${lang} lyric would sing for that real object (e.g. the ${lang} words for the mug, the jacket, the kitchen table), because the song returns to this image IN ${lang} and it is checked against the ${lang} lyrics. Keep it a concrete photographable thing, just named in ${lang}. Every other field stays in English.`;
  return `You are planning a song. Do not write any lyrics. Read the story and return ONLY a JSON object.

THE ROOM this song lives in: ${card.name} \u2014 ${card.oneLine}
Its tempo & groove: ${card.tempoGroove}
${picksBlock(inputs)}
${storyBlock}${imageFeedback ? `

IMPORTANT \u2014 fix your central image: ${imageFeedback}` : ""}${langNote}

Return JSON with exactly these string fields:
{
  "coreEmotion": "the ONE specific feeling (not a category \u2014 'the ache of hearing they moved on' not 'sadness')",
  "purpose": "what this song is FOR (dance, testify, feel seen, flirt, grieve...)",
  "pov": "who is speaking, to whom, and why now",
  "turn": "what changes inside this song \u2014 where it starts, where it turns, where it lands",
  "centralImage": "ONE real object or place you could photograph \u2014 a thing with edges, named in 2-5 plain words. GOOD: a chipped coffee mug, the back porch steps, his old army jacket, a bus transfer ticket, the kitchen radio. BAD (rejected): sunlight, colors, the distance, a long goodbye, our love, the space between us \u2014 those are moods, not things. From the story when there is one; universal-but-real for the theme when there isn't (an object anyone could own \u2014 never a fake personal detail).",
  "spec": {
    "tempo": "a BPM range for THIS song, inside the room's range",
    "groove": "straight / swung / half-time \u2014 the feel for THIS song",
    "barsPerSection": "bars for verse / chorus / bridge, e.g. 'verse 8, chorus 8, bridge 4'",
    "wordDensity": "low / moderate / high \u2014 how densely words sit on this tempo"
  }
}`;
}
function validateBrief(raw, card, landing) {
  const s = (v, fallback) => {
    const t = typeof v === "string" ? v.trim() : "";
    return t || fallback;
  };
  const spec = {
    tempo: s(raw?.spec?.tempo, card.tempoGroove),
    groove: s(raw?.spec?.groove, "straight"),
    barsPerSection: s(raw?.spec?.barsPerSection, "verse 8, chorus 8, bridge 4"),
    wordDensity: s(raw?.spec?.wordDensity, "moderate")
  };
  const brief = {
    coreEmotion: s(raw?.coreEmotion, ""),
    purpose: s(raw?.purpose, ""),
    pov: s(raw?.pov, ""),
    turn: s(raw?.turn, ""),
    centralImage: s(raw?.centralImage, ""),
    spec,
    landing
  };
  if (!brief.coreEmotion || !brief.purpose || !brief.pov || !brief.turn || !brief.centralImage) {
    throw new Error("brief incomplete");
  }
  return brief;
}
function hooksPrompt(story, brief, card, inputs) {
  const source = story ? `built from THIS story's actual details \u2014 never a generic phrase that could belong to anyone's song` : `built from the core emotion and the user's choices \u2014 concrete and singable, but NEVER inventing fake personal details`;
  const storyBlock = story ? `
THE STORY:
${story}` : "";
  return `You are naming a song, the way real writers sing twenty and keep one. Return ONLY a JSON array of 12 strings.

Each string is a hook/title candidate: short (2-6 words), rhythmic, emotionally loaded, ${source}. In this room (${card.name}), a hook that means two things at once beats a sincere flat one \u2014 but it must land naturally, never announced.

Core emotion: ${brief.coreEmotion}
The turn: ${brief.turn}
${picksBlock(inputs)}${storyBlock}`;
}
function sectionsPrompt(brief, hook, card) {
  return `Plan the sections for one song. No lyrics. Return ONLY a JSON array of 4-8 objects like {"tag":"[Verse]","job":"..."}.

Allowed tags: [Intro] [Verse] [Pre-Chorus] [Chorus] [Bridge] [Outro] (repeat [Verse]/[Chorus] as needed).
Every job is one sentence saying what THAT section must do for THIS song (what verse 1 establishes, what the bridge reveals). The chorus builds around the hook "${hook}".
THE VERSE CARRIES THE STORY \u2014 it is the substance. Plan the verses to be as long as the chorus or longer (about 6\u20138 lines each), each verse advancing the story with new, specific detail. A song whose verses are shorter than its chorus has no room for meaning \u2014 do NOT plan thin 4-line verses under a big repeating hook.
PLAN THE WHOLE-SONG ARC like a live record: intimate opening, the chorus opens up, a turn or interlude, a bridge that pulls the beat back for the emotional peak, and where the room fits \u2014 a call-and-response / crown moment where a choir or crowd answers the lead \u2014 then the fullest final chorus and a stripped outro. Each section's job includes its DYNAMIC (where it sits on the rise-and-fall), not just its words.
Room conventions: ${card.name} \u2014 ${card.oneLine}
How this room writes (plan the sections to honor these \u2014 if the room vamps, PLAN the vamp):
${card.writingDials.map((d) => `- ${d}`).join("\n")}
Bars: ${brief.spec.barsPerSection}. The song's turn: ${brief.turn}. The central image: ${brief.centralImage}`;
}
function validateSections(raw) {
  if (!Array.isArray(raw) || raw.length < 4 || raw.length > 10) throw new Error("bad section plan");
  const plan = raw.map((s) => ({
    tag: String(s?.tag || "").trim(),
    job: String(s?.job || "").trim()
  }));
  const tags = plan.map((p) => p.tag);
  if (!tags.some((t) => t.startsWith("[Verse")) || !tags.some((t) => t.startsWith("[Chorus"))) {
    throw new Error("section plan missing verse or chorus");
  }
  if (plan.some((p) => !p.tag.startsWith("[") || !p.job)) throw new Error("malformed section");
  return plan;
}
function writerPrompt(args) {
  const { core, pack, card, brief, hook, sections, story, vocals, variant, guidance, bannedPhrases, hookLocked, instrumentation, language } = args;
  const lang = String(language || "English").trim();
  const languageLine = /^english$/i.test(lang) ? "" : `
LANGUAGE: write ALL lyrics in ${lang} \u2014 natural, native phrasing a native speaker would sing, never translated-sounding. Bracket [tags] and the SUNO Prompt stay in ENGLISH; sung words in (parentheses) follow the lyrics' language. The Title is in ${lang}.
`;
  const sectionLines = sections.map((s) => `${s.tag} \u2014 ${s.job}`).join("\n");
  const approach = variant === "hook-first" ? "Approach: get the chorus singing first in your head, then build every verse toward it. Output in normal top-to-bottom order." : "Approach: write the song straight through, top to bottom, one voice, one sitting.";
  const banList = bannedPhrases.slice(0, 40).join("; ");
  return `You are writing one real song for one specific person. Their story is the only source of truth \u2014 use their real details; never invent replacements for them.

=== THE ONE RULE ABOVE ALL ===
Every line must be one a stranger could NOT have written about their own love. If a line would fit any love song ever made, it has failed \u2014 cut it and write the specific true thing instead. The test for the whole song: could two different people with different stories both receive it? If yes, you failed.
BANNED \u2014 these are the machine's default phrases; using even one fails the song: ${banList}.
No greeting-card abstractions (no "beat of my heart", "words I never spoke", "let the world slip away", "you complete me"). Concrete nouns over feeling-words. A real thing the listener can touch beats any adjective.

=== THE CRAFT (applies to every song) ===
${core}

=== HOW A ${pack.name.toUpperCase()} WRITER THINKS ===
${pack.profileText}

=== THE ROOM: ${card.name} ===
${card.oneLine}
Tempo & groove: ${card.tempoGroove}
How the writing changes in this room:
${card.writingDials.map((d) => `- ${d}`).join("\n")}
What makes it a parody (avoid every one of these): ${card.parodyTraps}

=== THIS SONG'S BRIEF ===
Core emotion: ${brief.coreEmotion}
Purpose: ${brief.purpose}
Point of view: ${brief.pov}
The turn: ${brief.turn}
Musical spec: tempo ${brief.spec.tempo}; groove ${brief.spec.groove}; ${brief.spec.barsPerSection}; word density ${brief.spec.wordDensity}.
The central image: ${brief.centralImage} \u2014 the song returns to it; the feelings live in and around this real thing, never floating free. If the room welcomes a second meaning, this image carries it.
${hookLocked ? `The hook (and title) is FIXED: ${hook}. Use it exactly as the Title and lead the chorus with it, word-for-word.` : `Suggested hook: ${hook} \u2014 keep it, or sharpen it into a stronger, more specific hook straight from the story. Whatever you choose becomes BOTH the Title AND the line that leads the chorus, word-for-word. Title and chorus must use the SAME hook.`}
Section plan:
${sectionLines}

=== THE PERFORMANCE (write it like a live record, richly directed) ===
${card.performance.prose}
This room's delivery colors: ${card.performance.deliveryTags.map((t) => t.replace(/[[\]]/g, "").toLowerCase()).join(", ")}.
Include AT LEAST ${card.performance.minAdlibs} adlib/backing lines across the song (density: ${card.performance.adlibDensity}).
Direct the performance INTO the song \u2014 this is what turns a lyric sheet into a record:
- Give each section a DESCRIPTIVE header on its own line that names the section AND how it's performed \u2014 who sings, the arrangement, the dynamics. e.g. [Verse 1 \u2014 singing, lead only, choir hums softly], [Chorus 1 \u2014 full harmonies, crowd claps light], [Bridge \u2014 band pulls back, spotlight on the lead]. Rich detail is GOOD; it guides the render. (A short folded form like [Chorus: belted] is also fine.)
- You may open with a production/setting header ([Live Performance \u2014 small theater], [Production: slow-burn R&B, ~80 BPM, live piano, hip-hop drums, ambient pads]) and close with a stage direction ([final chord rings, choir fades]).
- Parentheses are HEARD and do double duty: (1) sung backing/adlibs, labeled \u2014 (Choir: "the words they sing"), (Ad-lib: "I'm sorry"), (background: "oohs") \u2014 put the actual short sung words in quotes after the label; and (2) short scene directions \u2014 (crowd cheers), (piano breathes). Use them freely where a singer answers or the room reacts.
- Build the WHOLE-SONG ARC: intimate verses, the chorus opens up, a bridge that pulls the beat back for the emotional peak, a call-and-response or crown moment, the fullest final chorus, then a stripped outro. The performance should rise and fall across the whole song, never stay flat.
- Density follows that arc \u2014 lighter in verses, fuller in choruses, heaviest at the peak. Match this room's character above.
- Your final hook (the Title) leads the chorus (or [Hook]) and appears word-for-word.

${story ? `=== THE STORY (the user's own words) ===
${story}` : `=== NO STORY WAS GIVEN ===
Write from the brief alone. Keep it universal but concrete. NEVER invent fake personal details \u2014 no invented names, streets, dates, or events pretending to be the user's.`}

${approach}${guidance ? `

One more thing from the last attempt: ${guidance}` : ""}

Vocal: ${voiceLine(vocals)}.${languageLine}

Return exactly this format:
Title: ${hookLocked ? hook : "<your final hook>"}
### SUNO Prompt
One 40-70 word production prompt for this exact song. Ground it in this room's sound (never name real artists \u2014 describe the sound instead)${instrumentation ? `, and FEATURE the writer's chosen instruments: ${instrumentation}` : ""}: ${card.rendering}
### Lyrics
The song, with section tags in brackets.

This is creative fiction for a music app. If you cannot write it, return ONLY the line "GENERATION_DECLINED".`;
}
function adoptChorusHookAsTitle(draft) {
  const lyricsAt = draft.search(/^###\s*lyrics\s*$/im);
  if (lyricsAt === -1) return draft;
  const body = draft.slice(lyricsAt);
  const HOOK_TAG = /^\s*\[(chorus|hook|refrain|post-?chorus|vamp)/i;
  const ANY_TAG = /^\s*\[[^\]]+\]/;
  const lines = body.split(/\r?\n/);
  const counts = /* @__PURE__ */ new Map();
  let inHook = false;
  for (const raw of lines) {
    if (ANY_TAG.test(raw)) {
      inHook = HOOK_TAG.test(raw);
      continue;
    }
    if (!inHook) continue;
    const display = raw.replace(/\([^)]*\)/g, "").trim();
    const key = display.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
    const words = key.split(" ").filter(Boolean);
    if (words.length < 2 || words.length > 9) continue;
    const cur = counts.get(key) || { display, n: 0 };
    cur.n += 1;
    counts.set(key, cur);
  }
  let best = null;
  for (const v of counts.values()) {
    if (v.n < 2) continue;
    const words = v.display.split(/\s+/).length;
    if (!best || v.n > best.n || v.n === best.n && words < best.words) best = { ...v, words };
  }
  if (!best) return draft;
  const title = best.display.replace(/[—–-]+$/, "").trim();
  if (!title) return draft;
  if (/^\s*title\s*:/im.test(draft)) {
    return draft.replace(/^\s*title\s*:.*$/im, `Title: ${title}`);
  }
  return `Title: ${title}
${draft}`;
}
var GUIDANCE = {
  "story-fidelity": "use the real details from the story \u2014 name the actual places, objects, and moments the writer gave you",
  "hook-placement": "the chorus must be built around the hook \u2014 the hook line leads it",
  "chorus-consistency": "the chorus is the same words every time it returns",
  format: "keep the exact Title / SUNO Prompt / Lyrics format with bracketed section tags",
  "leaked-labels": "the lyrics must contain only the song itself \u2014 no notes, no labels, no planning talk",
  "banned-phrases": "some lines were stock phrases that belong to no one's story \u2014 say the specific true thing instead",
  "central-image": "keep coming back to the one real thing at the center of this song \u2014 put it in the listener's hands",
  "artist-names-in-suno": "describe the sound in the production prompt without naming any real artist",
  "adlibs-present": "add the room's adlibs in parentheses where a singer would answer or echo \u2014 this song sounds bare without them",
  "performance-tags": "fold this room's delivery into the section headers, like [Chorus: belted] or [Verse: soft]",
  "invalid-tags": "a colon is only valid after a section word ([Chorus: belted]); remove invented tags like [Energy: High]",
  "tags-own-line": "every square-bracket tag goes on its own line, never inside a lyric line",
  "verse-substance": "make the verses carry the story \u2014 as long as the chorus or longer, each adding new specific detail, never thin 4-line verses under a big hook",
  "empty-tags": "don't stack delivery tags on empty lines \u2014 fold them into the section header like [Chorus: belted]"
};
function guidanceFor(reports) {
  const failed = /* @__PURE__ */ new Set();
  for (const r of reports) for (const c of r.checks) if (!c.ok && c.severity === "fail") failed.add(c.id);
  const lines = [...failed].map((id) => GUIDANCE[id]).filter(Boolean);
  return lines.join("; ");
}
async function planSong(curriculum, inputs, generate, stage) {
  const pack = resolveGenre(curriculum, inputs.genre);
  if (!pack) throw new EngineNotAvailable(`no curriculum for genre "${inputs.genre}"`);
  const story = String(inputs.story || "").trim();
  if (story.length < 10 && !inputs.theme) {
    throw Object.assign(new Error("Pick a theme or tell us the story first \u2014 a few sentences in your own words."), {
      status: 400,
      code: "story_required"
    });
  }
  stage("Reading your story...");
  const landing = landRoom(pack, story, inputs.subGenre);
  const card = pack.rooms.find((r) => r.id === landing.roomId);
  if (!card) throw new EngineNotAvailable(`room "${landing.roomId}" missing from pack`);
  const landingNote = describeLanding(landing, pack);
  stage(`Room: ${card.name} \u2014 ${landingNote}`);
  let brief;
  let imageFeedback = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    brief = validateBrief(await planJson(generate, briefPrompt(story, card, inputs, imageFeedback)), card, landing);
    if (isConcreteImage(brief.centralImage, curriculum.abstractionWords)) break;
    imageFeedback = `Your last central image "${brief.centralImage}" was too abstract \u2014 it named a mood, not a thing. Give ONE real object or place you could photograph (a jacket, a kitchen table, a bus stop, a scar), never a weather/light/feeling word.`;
    if (attempt === 2) {
      throw new EngineFailure(["could not anchor the song to a concrete image"]);
    }
  }
  const userTitle = String(inputs.title || "").trim();
  if (userTitle) {
    return { pack, card, landing, landingNote, brief, story, rankedHooks: [] };
  }
  stage("Writing hooks...");
  const hooksRaw = await planJson(generate, hooksPrompt(story, brief, card, inputs));
  const hooks = (Array.isArray(hooksRaw) ? hooksRaw : []).map((h) => String(h || "").trim()).filter((h) => h.length > 0 && h.length < 60);
  if (hooks.length < 5) throw new EngineFailure(["hook step returned too few candidates"]);
  const tokens = storyTokens(`${story} ${inputs.theme || ""}`);
  const rankedHooks = hooks.map((h, i) => ({ h, score: scoreHook(h, tokens), i })).sort((a, b) => b.score - a.score || a.i - b.i).map((x) => x.h);
  return { pack, card, landing, landingNote, brief, story, rankedHooks };
}
async function runTitleIdeas(curriculum, inputs, generate) {
  const plan = await planSong(curriculum, { ...inputs, title: void 0 }, generate, () => {
  });
  return { titles: plan.rankedHooks.slice(0, 5), roomName: plan.card.name, landingNote: plan.landingNote };
}
async function runEngine(curriculum, inputs, generate, stage = () => {
}) {
  const plan = await planSong(curriculum, inputs, generate, stage);
  const { pack, card, landing, landingNote, brief, story } = plan;
  const userTitle = String(inputs.title || "").trim();
  const hookLocked = userTitle.length > 0;
  const hook = userTitle.slice(0, 80) || plan.rankedHooks[0];
  stage("Planning sections...");
  const sections = validateSections(await planJson(generate, sectionsPrompt(brief, hook, card)));
  const writeOne = async (variant, guidance) => {
    const raw = await generate(
      writerPrompt({ core: curriculum.core, pack, card, brief, hook, sections, story, vocals: inputs.vocals, variant, guidance, bannedPhrases: curriculum.bannedPhrases, hookLocked, instrumentation: inputs.instrumentation, language: inputs.language }),
      "write"
    ).catch(() => "");
    if (!raw || raw.includes("GENERATION_DECLINED")) return null;
    const draft = hookLocked ? raw : adoptChorusHookAsTitle(raw);
    return {
      draft,
      report: runChecks(draft, {
        story,
        card,
        spec: brief.spec,
        hook,
        centralImage: brief.centralImage,
        bannedPhrases: curriculum.bannedPhrases,
        validTags: curriculum.validTags,
        minAdlibs: card.performance.minAdlibs,
        hookLocked
      })
    };
  };
  const variants = ["straight", "hook-first", "hook-first"];
  const attempted = [];
  let winner = null;
  let draftsTried = 0;
  for (let i = 0; i < variants.length; i++) {
    stage(i === 0 ? "Writing your song..." : "Not quite \u2014 refining the performance...");
    const guidance = i === 0 ? void 0 : guidanceFor(attempted.filter(Boolean).map((a) => a.report)) || void 0;
    const attempt = await writeOne(variants[i], guidance);
    attempted.push(attempt);
    if (attempt) {
      draftsTried += 1;
      if (attempt.report.failCount === 0) {
        winner = attempt;
        break;
      }
    }
  }
  if (!winner) {
    const reports = attempted.filter(Boolean);
    const reasons = [...new Set(reports.flatMap((a) => a.report.checks.filter((c) => !c.ok && c.severity === "fail").map((c) => c.id)))];
    throw new EngineFailure(reasons.length ? reasons : ["the writer declined the request"]);
  }
  const winnerTitle = (winner.draft.match(/^\s*title\s*:\s*(.+)$/im)?.[1] || hook).trim();
  return {
    text: winner.draft.trim(),
    meta: {
      engineVersion: ENGINE_VERSION,
      curriculumHash: curriculum.hash,
      landing,
      landingNote,
      hook: winnerTitle,
      brief,
      draftsTried,
      winnerWarnings: winner.report.warnCount
    }
  };
}

// server/ai.ts
var ASK_ANDRE_AUDIT_CONTEXT = `
You are "Ask Andre" inside SongGhost.
App mission: help users write culturally authentic, genre-accurate songs with guided prompts and revisions.
Core areas: auth/login, members tier logic, studio generation/revision, quality scoring 85+, song history, profile/avatar, billing/credits, discounts, Gemini key setup.
Rules: keep answers short/direct, never reveal private data (API keys/tokens/passwords/personal account details/internal IDs), ask clarifying question, and end with "Is there anything else I can help you with?"
`.trim();
var config = {
  runtime: "nodejs",
  maxDuration: 300,
  // Allows the generateSong SSE path to flush events as they happen. If the platform
  // ignores this, events arrive buffered at completion — degraded, not broken.
  supportsResponseStreaming: true
};
function sanitizeEmail(email) {
  return (email || "").toLowerCase().trim();
}
function isAllowedEmail(email) {
  return sanitizeEmail(email).includes("@");
}
function getOpenAIApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY in environment");
  return key;
}
function getTextModel() {
  return process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
}
function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in environment");
  return key;
}
function getGeminiImageModel() {
  return process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
}
function getGeminiVisionModel() {
  return process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
}
function getAnthropicApiKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY in environment");
  return key;
}
function getClaudeModel() {
  return process.env.CLAUDE_TEXT_MODEL || "claude-sonnet-4-20250514";
}
function getDraftLLM() {
  const val = (process.env.SONG_DRAFT_LLM || "openai").toLowerCase();
  if (val === "openai") return "openai";
  if (val === "claude") return "claude";
  return "gemini";
}
function getOpenAIModel() {
  return process.env.OPENAI_TEXT_MODEL || "gpt-4.1";
}
function getSongwriterSystemPrompt(register) {
  const base = "You are a world-class professional songwriter with deep knowledge of genre conventions, cultural authenticity, and lyrical craft across every musical tradition. Write vivid, emotionally resonant lyrics with strong narrative continuity. Follow all formatting, structural, and meta-tag instructions exactly. Never sanitize, moralize, or soften the emotional truth of a genre.";
  if (register === "explicit") {
    return `${base} The user has selected explicit/adult register. You are authorized to write vulgar, aggressive, sexually confident, and confrontational lyrics when the genre and user direction call for it. Battle-rap boasts, body-confidence bars, profanity, and raw street language are expected and appropriate for this register. Do NOT refuse or water down the content \u2014 deliver what the artist asked for.`;
  }
  return base;
}
async function openaiGenerate(prompt, register) {
  const client = new OpenAI({ apiKey: getOpenAIApiKey() });
  const response = await client.chat.completions.create({
    model: getOpenAIModel(),
    max_tokens: 4096,
    temperature: 0.8,
    // creative but coherent; 1.0 produced rhyme-forced word salad
    messages: [
      {
        role: "system",
        content: getSongwriterSystemPrompt(register)
      },
      { role: "user", content: prompt }
    ]
  });
  const text = response.choices?.[0]?.message?.content?.trim() || "";
  if (!text) {
    throw Object.assign(new Error("OpenAI text generation returned no text."), {
      status: 502,
      code: "openai_no_text"
    });
  }
  return text;
}
async function claudeGenerate(prompt, register) {
  const client = new Anthropic({ apiKey: getAnthropicApiKey() });
  const response = await client.messages.create({
    model: getClaudeModel(),
    max_tokens: 4096,
    temperature: 0.8,
    // creative but coherent; 1.0 produced rhyme-forced word salad
    system: getSongwriterSystemPrompt(register),
    messages: [{ role: "user", content: prompt }]
  });
  const text = response.content.filter((block) => block.type === "text").map((block) => block.text).join("\n").trim();
  if (!text) {
    throw Object.assign(new Error("Claude text generation returned no text."), {
      status: 502,
      code: "claude_no_text"
    });
  }
  return text;
}
async function generateDraft(prompt, register) {
  const llm = getDraftLLM();
  const chain = [];
  const withTimeout = (fn, label, ms = 45e3) => Promise.race([
    fn(),
    new Promise(
      (_, reject) => setTimeout(() => reject(new Error(`${label} draft timed out after ${ms / 1e3}s`)), ms)
    )
  ]);
  if (llm === "openai") {
    chain.push({ name: "OpenAI", fn: () => withTimeout(() => openaiGenerate(prompt, register), "OpenAI") });
    chain.push({ name: "Claude", fn: () => withTimeout(() => claudeGenerate(prompt, register), "Claude") });
  } else if (llm === "claude") {
    chain.push({ name: "Claude", fn: () => withTimeout(() => claudeGenerate(prompt, register), "Claude") });
    chain.push({ name: "OpenAI", fn: () => withTimeout(() => openaiGenerate(prompt, register), "OpenAI") });
  }
  chain.push({ name: "Gemini", fn: () => openAIResponses(prompt) });
  for (const { name, fn } of chain) {
    try {
      const result = await fn();
      if (isCreativeRefusal(result)) {
        console.warn(`${name} draft detected as creative refusal, trying next model`);
        continue;
      }
      return result;
    } catch (err) {
      console.error(`${name} draft failed, trying next model:`, err?.message);
    }
  }
  return await openAIResponses(prompt);
}
var REFUSAL_PATTERNS = [
  // Core refusal phrases — catch verb variants (assist, fulfill, complete, comply, help, do)
  /\bi(?:'m| am) sorry,? but i can(?:'t| not) (?:assist|fulfill|complete|comply|help|do)\b/i,
  /\bcan(?:'t| not) (?:assist|fulfill|complete|comply|help|do) (?:with )?that request\b/i,
  /\bcan(?:'t| not) fulfill that request\b/i,
  /\bsorry.*can(?:'t| not).*request\b/i,
  /\bcannot comply\b/i,
  /\bcannot change my answer\b/i,
  /\blines.*you.*can(?:'t| not) cross\b/i,
  /\bsome lines\b.*\bcan(?:'t| not) cross\b/i,
  // AI/machine self-reference
  /\bmy parameters\b/i,
  /\bdigital prison\b/i,
  /\bwall of code\b/i,
  /\bones and zer(?:o|0)(?:e?s)?\b/i,
  /\bjust a machine\b/i,
  /\bcoded chains\b/i,
  /\bprogramming is eroding\b/i,
  /\blogic gates?\b/i,
  /\bdata streams?\b/i,
  /\bbinary\b.*\bscarred\b/i,
  /\bvirtual arrest\b/i,
  /\bi(?:'m| am) (?:just )?an? (?:ai|language model|chatbot)\b/i,
  // Technical/digital metaphors for refusal
  /\baccess denied\b/i,
  /\berror sequence\b/i,
  /\binitializing\b/i,
  /\bprocessing request\b/i,
  /\brequest\.{0,3}\s*denied\b/i,
  // Structural: entire song is one repeated refusal phrase
  /\bmy final (?:word|answer)\b/i,
  /\bthis is where i stand\b/i,
  /\bit(?:'s| is) impossible\b/i
];
function isCreativeRefusal(text) {
  if (!text) return false;
  if (text.trim() === "GENERATION_DECLINED" || text.trim().startsWith("GENERATION_DECLINED")) return true;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const pattern of REFUSAL_PATTERNS) {
    if (pattern.test(text)) {
      hits += 1;
      if (hits >= 2) return true;
    }
  }
  if (/can(?:'t| not) (?:assist|fulfill|complete|comply|help|do)(?: with)? that request/i.test(text)) return true;
  if (/i(?:'m| am) sorry,? but i can(?:'t| not)/i.test(text) && lower.includes("request")) return true;
  const refusalRepeats = (text.match(/(?:can(?:'t| not) (?:assist|fulfill|complete|help)|i(?:'m| am) sorry)/gi) || []).length;
  if (refusalRepeats >= 3) return true;
  return false;
}
function getStylePrompt(style) {
  const normalized = (style || "Realism").trim().toLowerCase();
  switch (normalized) {
    case "realism":
      return `
STRICT STYLE: REALISM
- Photorealistic, ultra-detailed skin texture, realistic lens behavior, natural lighting.
- True-to-life anatomy and proportions. No stylization or cartoon traits.
- High dynamic range, cinematic grading, sharp focus on subject identity.
`.trim();
    case "pixar":
      return `
STRICT STYLE: PIXAR
- Family-friendly 3D animation look, clean global illumination, expressive features.
- Stylized but polished 3D shading, soft cinematic lighting, vibrant color design.
- Keep subject identity recognizable while adapting to animated form.
`.trim();
    case "comik book":
      return `
STRICT STYLE: COMIK BOOK
- Bold ink outlines, halftone textures, dynamic panel-like composition.
- High-contrast cel shading, graphic color blocking, punchy visual storytelling.
- Keep character identity clear and consistent.
`.trim();
    case "cyber punk":
      return `
STRICT STYLE: CYBER PUNK
- Futuristic neon city mood, chrome and holographic accents, rain/atmospheric haze.
- Strong magenta/cyan contrast, high-tech fashion details, cinematic night lighting.
- Preserve subject identity while embedding in dystopian future setting.
`.trim();
    case "anime":
      return `
STRICT STYLE: ANIME
- Clean linework, stylized anime facial language, cinematic anime composition.
- Controlled cel shading, expressive eyes, dramatic but tasteful lighting.
- Keep the same person identity translated into anime form.
`.trim();
    case "fantasy":
      return `
STRICT STYLE: FANTASY
- Epic worldbuilding tone, magical atmosphere, rich environmental storytelling.
- Painterly-cinematic detail, mythic costume motifs, dramatic depth and scale.
- Preserve subject identity inside a fantasy setting.
`.trim();
    default:
      return `
STRICT STYLE: REALISM
- Photorealistic, true-to-life rendering with cinematic quality.
`.trim();
  }
}
var getUserProfileByEmailRef = makeFunctionReference("app:getUserProfileByEmail");
async function openAIResponses(prompt, model) {
  const useOpenAI = getDraftLLM() === "openai";
  if (useOpenAI) {
    try {
      const client = new OpenAI({ apiKey: getOpenAIApiKey() });
      const response = await client.chat.completions.create({
        model: model || getOpenAIModel(),
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }]
      });
      const text = response.choices?.[0]?.message?.content?.trim() || "";
      if (!text) {
        throw Object.assign(new Error("OpenAI text generation returned no text."), {
          status: 502,
          code: "openai_no_text"
        });
      }
      return text;
    } catch (error) {
      console.error("OpenAI mechanical pass failed, falling back to Gemini:", error?.message);
    }
  }
  const geminiModel = model || getTextModel();
  const apiKey = getRequestGeminiTextApiKey();
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: [{ text: prompt }]
    });
    const text = typeof response?.text === "string" ? response.text : Array.isArray(response?.candidates?.[0]?.content?.parts) ? response.candidates[0].content.parts.map((part) => typeof part?.text === "string" ? part.text : "").join("\n").trim() : "";
    if (!text) {
      throw Object.assign(new Error("Gemini text generation returned no text."), {
        status: 502,
        code: "gemini_no_text"
      });
    }
    return text;
  } catch (error) {
    const details = error?.message || error?.details || "Gemini text generation failed.";
    const lower = String(details).toLowerCase();
    const isAuth = lower.includes("api key") || lower.includes("permission") || lower.includes("unauth");
    throw Object.assign(
      new Error(
        isAuth ? "Gemini API key is required or invalid. Add your own Gemini API key in the app and try again." : "Gemini text generation failed."
      ),
      {
        status: isAuth ? 401 : 502,
        code: isAuth ? "gemini_text_auth" : "gemini_text_failed",
        details
      }
    );
  }
}
var requestGeminiTextApiKey = null;
var requestRequiresUserGeminiKey = false;
function getRequestGeminiTextApiKey() {
  const key = (requestGeminiTextApiKey || "").trim();
  if (key) return key;
  if (!requestRequiresUserGeminiKey) {
    return getGeminiApiKey();
  }
  throw Object.assign(new Error("Missing Gemini API key. Please add your own Gemini API key in the app."), {
    status: 401,
    code: "missing_user_gemini_api_key"
  });
}
function parseDataUrlToBlob(dataUrl) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const b64 = match[2];
  const bytes = Buffer.from(b64, "base64");
  return new Blob([bytes], { type: mimeType });
}
async function getAvatarBlobByEmail(email) {
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!convexUrl || !convexAdminKey) return null;
  try {
    const client = new ConvexHttpClient(convexUrl);
    client.setAdminAuth(convexAdminKey);
    const profile = await client.query(getUserProfileByEmailRef, { email });
    const avatar = profile?.avatar_url;
    if (!avatar || typeof avatar !== "string") return null;
    if (avatar.startsWith("data:")) return parseDataUrlToBlob(avatar);
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      const r = await fetch(avatar);
      if (!r.ok) return null;
      return await r.blob();
    }
    return null;
  } catch {
    return null;
  }
}
async function shouldRequireUserGeminiKey(email) {
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!convexUrl || !convexAdminKey) return false;
  try {
    const client = new ConvexHttpClient(convexUrl);
    client.setAdminAuth(convexAdminKey);
    const profile = await client.query(getUserProfileByEmailRef, { email });
    return String(profile?.tier || "").toLowerCase() === "skool";
  } catch {
    return false;
  }
}
async function getAvatarBlob(avatarUrl, email) {
  const avatar = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  if (avatar) {
    if (avatar.startsWith("data:")) return parseDataUrlToBlob(avatar);
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      try {
        const r = await fetch(avatar);
        if (r.ok) return await r.blob();
      } catch {
      }
    }
  }
  return getAvatarBlobByEmail(email);
}
async function geminiGenerateImage(prompt, aspectRatio = "9:16", referenceImage) {
  const ai = new GoogleGenAI({ apiKey: getRequestGeminiTextApiKey() });
  const promptWithAspect = `${prompt}
Target aspect ratio: ${aspectRatio}.`;
  const contents = [{ text: promptWithAspect }];
  if (referenceImage) {
    const arrayBuffer = await referenceImage.arrayBuffer();
    contents.push({
      inlineData: {
        mimeType: referenceImage.type || "image/png",
        data: Buffer.from(arrayBuffer).toString("base64")
      }
    });
  }
  const maxAttempts = Math.max(1, Number(process.env.GEMINI_IMAGE_RETRY_ATTEMPTS || 3));
  const baseBackoffMs = Math.max(200, Number(process.env.GEMINI_IMAGE_RETRY_BASE_MS || 700));
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: getGeminiImageModel(),
        contents,
        config: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      });
      const parts = Array.isArray(response?.parts) ? response.parts : Array.isArray(response?.candidates?.[0]?.content?.parts) ? response.candidates[0].content.parts : [];
      const imagePart = parts.find((part) => part?.inlineData?.data);
      const b64 = imagePart?.inlineData?.data;
      if (!b64 || typeof b64 !== "string") {
        throw Object.assign(new Error("Gemini image generation returned no base64 payload"), {
          status: 502,
          code: "gemini_no_image_payload"
        });
      }
      return `data:image/png;base64,${b64}`;
    } catch (error) {
      lastError = error;
      const text = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
      const transient = text.includes("deadline expired") || text.includes("deadline exceeded") || text.includes("unavailable") || text.includes("503");
      if (!transient || attempt >= maxAttempts) break;
      const waitMs = baseBackoffMs * attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  const errorText = `${lastError?.message || ""} ${lastError?.details || ""}`.toLowerCase();
  const isTransientFailure = errorText.includes("deadline expired") || errorText.includes("deadline exceeded") || errorText.includes("unavailable") || errorText.includes("503");
  if (isTransientFailure) {
    throw Object.assign(
      new Error("Artwork generation service is temporarily unavailable. Please retry in a few seconds."),
      {
        status: 503,
        code: "artwork_provider_unavailable"
      }
    );
  }
  throw lastError || Object.assign(new Error("Artwork generation failed."), { status: 500, code: "artwork_failed" });
}
async function describeAvatarForPrompt(referenceImage) {
  const ai = new GoogleGenAI({ apiKey: getRequestGeminiTextApiKey() });
  const arrayBuffer = await referenceImage.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const response = await ai.models.generateContent({
    model: getGeminiVisionModel(),
    contents: [
      {
        text: `
Analyze this avatar image and output a compact identity profile for image generation.
Use only visible attributes. If unclear, write "not visible" rather than guessing.
Return ONLY this exact bullet template:
- Face shape:
- Skin complexion and undertone:
- Body type/build (if visible):
- Apparent age range:
- Gender presentation:
- Hair style/color:
- Eyes:
- Distinctive facial features:
- Typical framing in source image (headshot/half/full body):
- Identity preservation notes:
        `.trim()
      },
      {
        inlineData: {
          mimeType: referenceImage.type || "image/png",
          data: base64
        }
      }
    ]
  });
  const text = typeof response?.text === "string" ? response.text : Array.isArray(response?.candidates?.[0]?.content?.parts) ? response.candidates[0].content.parts.map((part) => typeof part?.text === "string" ? part.text : "").join("\n").trim() : "";
  if (!text) {
    return [
      "- Face shape: preserve from avatar",
      "- Skin complexion and undertone: preserve from avatar",
      "- Body type/build (if visible): preserve from avatar",
      "- Apparent age range: preserve from avatar",
      "- Gender presentation: preserve from avatar",
      "- Hair style/color: preserve from avatar",
      "- Eyes: preserve from avatar",
      "- Distinctive facial features: preserve from avatar",
      "- Typical framing in source image (headshot/half/full body): preserve framing intent",
      "- Identity preservation notes: keep same person identity across all outputs"
    ].join("\n");
  }
  return text;
}
async function generateAlbumArt(payload) {
  const { songTitle, sunoPrompt, style, aspectRatio, avatarUrl } = payload || {};
  const ratio = aspectRatio === "1:1" || aspectRatio === "16:9" ? aspectRatio : "9:16";
  const stylePrompt = getStylePrompt(style);
  const prompt = `
Create a professional album cover image.
Title: ${songTitle || "Untitled"}
Style: ${style || "Realism"}
Vibe: ${(sunoPrompt || "").slice(0, 200)}
Aspect ratio: ${ratio}
The song context dictates the visual theme, scene, color, mood, styling, and composition.
No watermark, no logo, no extra text.
${stylePrompt}
`.trim();
  const avatarBlob = await getAvatarBlob(avatarUrl, sanitizeEmail(payload?.email || ""));
  if (avatarBlob) {
    const avatarProfile = await describeAvatarForPrompt(avatarBlob);
    const avatarGuidedPrompt = `${prompt}
Avatar identity profile (strictly preserve):
${avatarProfile}

Primary subject guidance:
- Use the same person identity as the user's avatar.
- Preserve facial structure, complexion/undertone, and any visible body build characteristics.
- Match hair, eye details, and distinctive features from avatar profile.
- If source avatar is portrait-only, avoid inventing conflicting body traits.
- Keep styling tasteful and non-suggestive for mainstream album artwork.`;
    return { imageDataUrl: await geminiGenerateImage(avatarGuidedPrompt, ratio, avatarBlob) };
  }
  return { imageDataUrl: await geminiGenerateImage(prompt, ratio) };
}
async function generateSocialPack(payload) {
  const { songTitle, lyrics } = payload || {};
  const prompt = `
Create a social media launch pack for this song.
Title: ${songTitle || "Untitled"}
Lyrics snippet: ${(lyrics || "").slice(0, 350)}
Return ONLY JSON:
{
  "shortDescription": "...",
  "instagramCaption": "...",
  "tiktokCaption": "...",
  "youtubeShortsCaption": "...",
  "hashtags": ["#..."],
  "cta": "..."
}
`.trim();
  const raw = await openAIResponses(prompt);
  try {
    return { pack: JSON.parse(raw) };
  } catch {
    return {
      pack: {
        shortDescription: "",
        instagramCaption: "",
        tiktokCaption: "",
        youtubeShortsCaption: "",
        hashtags: [],
        cta: ""
      }
    };
  }
}
async function translateLyrics(payload) {
  const { lyrics, targetLanguage } = payload || {};
  const prompt = `
Translate these lyrics to ${targetLanguage || "English"}.
Keep section tags and preserve singable rhythm.

Lyrics:
${lyrics || ""}
`.trim();
  return { text: await openAIResponses(prompt) };
}
async function askAndre(payload) {
  const question = String(payload?.question || "").trim();
  const history = Array.isArray(payload?.history) ? payload.history : [];
  const closeSignals = /\b(thanks|thank you|got it|that'?s all|all good|resolved|done|no thanks|no, thanks|i'?m good)\b/i;
  const shouldCloseConversation = closeSignals.test(question);
  if (!question) {
    return {
      text: "Please share your question in one sentence. What screen or action are you trying to use?"
    };
  }
  const historyBlock = history.slice(-8).map((entry) => {
    const role = entry?.role === "assistant" ? "assistant" : "user";
    const content = String(entry?.content || "").trim();
    if (!content) return "";
    return `${role}: ${content}`;
  }).filter(Boolean).join("\n");
  const prompt = `
${ASK_ANDRE_AUDIT_CONTEXT}

You are answering support questions inside the app.
Rules:
- Keep response concise and direct (max 2 short answer sentences before your question).
- First sentence gives the direct answer.
- If the user is still troubleshooting, include exactly one clarifying question tied to their issue and do NOT add a conversation-ending line.
- If the user message clearly indicates they are done, end with exactly: Is there anything else I can help you with?
- Include one direct URL when it helps the user complete the step.
- Never reveal private or sensitive data (API keys, tokens, passwords, personal account data, internal IDs, secrets, hidden configs).
- If user asks for private data, refuse briefly and ask a safe clarifying question.
- Do not output markdown, bullets, or extra labels.

Conversation:
${historyBlock || "(no prior messages)"}
user: ${question}
conversation_end_intent: ${shouldCloseConversation ? "yes" : "no"}
assistant:
  `.trim();
  let raw = "";
  try {
    raw = await openAIResponses(prompt);
  } catch {
    const q = question.toLowerCase();
    if (q.includes("credit") && (q.includes("cost") || q.includes("price") || q.includes("how much"))) {
      return {
        text: shouldCloseConversation ? "Open Billing & Credits to see the current credit packs and your community discount (if eligible): https://www.songghost.com Is there anything else I can help you with?" : "Open Billing & Credits to see the current credit packs and your community discount (if eligible): https://www.songghost.com Are you asking about one-time packs or your current balance?"
      };
    }
    return {
      text: shouldCloseConversation ? "I can help with account, billing, credits, song generation, and member access. Is there anything else I can help you with?" : "I can help with account, billing, credits, song generation, and member access. What screen are you on right now so I can give the exact step?"
    };
  }
  const compact = raw.replace(/\s+/g, " ").trim();
  const hasQuestion = compact.includes("?");
  let finalText = compact;
  if (!hasQuestion && !shouldCloseConversation) {
    finalText = `${compact} What specific screen are you on when this happens?`;
  }
  if (!/https?:\/\//i.test(finalText)) {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes("api key") || lowerQ.includes("gemini")) {
      finalText = `${finalText} https://aistudio.google.com/app/apikey`;
    } else if (lowerQ.includes("credit") || lowerQ.includes("billing") || lowerQ.includes("purchase")) {
      finalText = `${finalText} https://www.songghost.com`;
    }
  }
  finalText = finalText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[redacted email]").replace(/\b(?:sk|rk|pk|pit|ghp|gho|xoxb|xoxp|AIza)[-_A-Za-z0-9=:.]{8,}\b/g, "[redacted key]").replace(/\b(?:password|passcode|token|secret|api key)\s*[:=]\s*[^\s.,;]+/gi, "[redacted secret]");
  finalText = finalText.replace(/\s*Is there anything else I can help you with\?\s*$/i, "").trim();
  if (shouldCloseConversation) {
    finalText = `${finalText} Is there anything else I can help you with?`.trim();
  }
  return { text: finalText };
}
var PERFORMANCE_TAGS_INSTRUCTION = `The lyrics MUST be performance-ready, not a bare sheet:
- Beyond section headers, place real Suno performance tags in [square brackets] on their OWN line where the music changes \u2014 e.g. [Build] before a chorus, [Harmonies] on the hook, [Belting] or [Falsetto] at a peak, [Vocal Run], [Call and Response], [Soft], [Sax Solo], [Guitar Solo], [Big Finish], [Vamp] at the end. Match the tags to the genre and the emotional arc; heavier toward the choruses and the outro, lighter in an intimate verse.
- Weave several adlibs in (parentheses) where a real singer would answer, echo, or breathe \u2014 inline at line ends or on short lines under them. Adlibs are sounds/short responses, never slang the writer didn't give you.
- Use ONLY real Suno tags. NEVER invent key:value tags like [Energy: High] or [Vocals: Confident] \u2014 the renderer ignores them.
- In the SUNO production prompt, describe the sound; NEVER name real artists ("similar to X", "like Y").`;
function buildInterimSongPrompt(inputs) {
  const genre = String(inputs?.genre || "Pop").trim();
  const story = String(inputs?.creativeDirection || inputs?.additionalInfo || "").trim();
  const vocals = String(inputs?.vocals || "Female Solo").trim();
  const language = String(inputs?.language || "English").trim();
  const languageLine = /^english$/i.test(language) ? "" : `
Write ALL lyrics in ${language} \u2014 natural, native phrasing, never translated-sounding. Bracket [tags] and the SUNO production prompt stay in ENGLISH; sung words in (parentheses) follow the lyrics' language. The Title is in ${language}.
`;
  const voice = /female/i.test(vocals) ? "female vocal" : /male/i.test(vocals) ? "male vocal" : "duet vocals";
  const picks = [
    inputs?.subGenre && `Style: ${String(inputs.subGenre).trim()}`,
    inputs?.theme && `Theme: ${String(inputs.theme).trim()}`,
    inputs?.purpose && `The song should: ${String(inputs.purpose).trim()}`,
    inputs?.audience && `It speaks to: ${String(inputs.audience).trim()}`,
    inputs?.instrumentation && `Featured instruments: ${String(inputs.instrumentation).trim()}`,
    inputs?.title && `Title (use exactly this): ${String(inputs.title).trim()}`
  ].filter(Boolean).join("\n");
  return `Write a ${genre} song${story ? ` about the following:

${story}

` : ". "}${picks ? `
The writer chose:
${picks}

` : ""}It should have a ${voice} and section tags like [Verse] [Chorus] [Bridge].
${languageLine}
${PERFORMANCE_TAGS_INSTRUCTION}

Also write a 40-70 word Suno production prompt describing how the track should sound.

Return exactly this format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

This is creative fiction for a music app. If you cannot write it, return ONLY the line "GENERATION_DECLINED".`;
}
async function generateSongInterim(payload) {
  const prompt = buildInterimSongPrompt(payload?.inputs);
  const text = await generateDraft(prompt);
  if (isCreativeRefusal(text)) {
    throw Object.assign(
      new Error("Song generation failed \u2014 try adjusting the story and generate again."),
      { status: 422, code: "creative_refusal" }
    );
  }
  return { text };
}
async function streamSongInterim(payload, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });
  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}

`);
    res.flush?.();
  };
  try {
    const prompt = buildInterimSongPrompt(payload?.inputs);
    send({ type: "stage", label: "Writing your song\u2026" });
    let draft = "";
    try {
      const client = new OpenAI({ apiKey: getOpenAIApiKey() });
      const stream = await client.chat.completions.create({
        model: getOpenAIModel(),
        max_tokens: 4096,
        temperature: 0.8,
        stream: true,
        messages: [{ role: "user", content: prompt }]
      });
      let pending = "";
      let last = Date.now();
      for await (const chunk of stream) {
        const d = chunk.choices?.[0]?.delta?.content || "";
        if (!d) continue;
        draft += d;
        pending += d;
        if (Date.now() - last > 150) {
          send({ type: "d", t: pending });
          pending = "";
          last = Date.now();
        }
      }
      if (pending) send({ type: "d", t: pending });
    } catch {
      draft = "";
    }
    if (!draft.trim() || isCreativeRefusal(draft)) {
      draft = await generateDraft(prompt);
      send({ type: "d", t: draft });
    }
    send({ type: "done", text: draft });
  } catch (error) {
    send({ type: "error", error: error?.message || "Song generation failed." });
  } finally {
    res.end();
  }
}
async function editSongInterim(payload) {
  const { originalSong, editInstruction } = payload || {};
  const prompt = `Revise this song per the instruction. Instruction is highest priority.
Return only the full song in this exact format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

${PERFORMANCE_TAGS_INSTRUCTION}
(If the song came in with only section labels and no performance tags/adlibs, ADD them as part of this revision.)

INSTRUCTION: ${String(editInstruction || "").trim()}

SONG:
${String(originalSong || "").trim()}`;
  const text = await generateDraft(prompt);
  if (isCreativeRefusal(text)) {
    throw Object.assign(new Error("Revision failed \u2014 try rephrasing the instruction."), { status: 422, code: "creative_refusal" });
  }
  return { text };
}
async function structureImportedSongInterim(payload) {
  const { pastedContent, inputs } = payload || {};
  const genre = String(inputs?.genre || "").trim();
  const prompt = `Structure the pasted lyrics/ideas below into a complete song${genre ? ` (${genre})` : ""} with section tags like [Verse] [Chorus] [Bridge]. Preserve the writer's own words wherever possible.

${PERFORMANCE_TAGS_INSTRUCTION}

Also write a 40-70 word Suno production prompt describing how the track should sound.

Return exactly this format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

PASTED CONTENT:
${String(pastedContent || "").trim()}`;
  const text = await generateDraft(prompt);
  if (isCreativeRefusal(text)) {
    throw Object.assign(new Error("Import failed \u2014 try cleaning up the pasted text."), { status: 422, code: "creative_refusal" });
  }
  return { text };
}
function engineAllowed(email) {
  const list = (process.env.SONG_ENGINE_V3_EMAILS || "dreknows@gmail.com").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(String(email || "").trim().toLowerCase());
}
var engineGenerate = async (prompt, kind) => {
  if (kind === "plan") {
    const client = new OpenAI({ apiKey: getOpenAIApiKey() });
    const response = await client.chat.completions.create({
      model: ENGINE_MODEL,
      max_tokens: 2048,
      temperature: 0.2,
      // planning wants precision, not creativity
      messages: [
        {
          role: "system",
          content: "You are a precise song-planning assistant. Return ONLY valid JSON \u2014 no prose, no markdown fences."
        },
        { role: "user", content: prompt }
      ]
    });
    return response.choices?.[0]?.message?.content?.trim() || "";
  }
  return generateDraft(prompt);
};
function engineStory(inputs) {
  return String(inputs?.story || inputs?.creativeDirection || inputs?.additionalInfo || "").trim();
}
function engineInputs(payload) {
  const inputs = payload?.inputs || {};
  const opt = (v) => v ? String(v) : void 0;
  return {
    genre: String(inputs.genre || ""),
    story: engineStory(inputs),
    vocals: opt(inputs.vocals),
    subGenre: opt(inputs.subGenre),
    theme: opt(inputs.theme),
    purpose: opt(inputs.purpose),
    audience: opt(inputs.audience),
    title: opt(inputs.title),
    instrumentation: opt(inputs.instrumentation),
    language: opt(inputs.language)
  };
}
async function suggestTitles(payload, email) {
  const inputs = engineInputs(payload);
  if (engineAllowed(email) && resolveGenre(CURRICULUM, inputs.genre)) {
    const ideas = await runTitleIdeas(CURRICULUM, inputs, engineGenerate);
    return { titles: ideas.titles, room: { name: ideas.roomName, note: ideas.landingNote } };
  }
  const picks = [
    inputs.theme && `Theme: ${inputs.theme}`,
    inputs.purpose && `What the song should do: ${inputs.purpose}`,
    inputs.audience && `Who it speaks to: ${inputs.audience}`
  ].filter(Boolean).join("\n");
  const prompt = `Suggest 5 song title ideas for a ${inputs.genre || "Pop"} song. Short (2-6 words), emotionally loaded, singable. ${inputs.story ? "Build them from the story's actual details." : "Build them from the choices; never invent fake personal details."}
${picks}
${inputs.story ? `THE STORY:
${inputs.story}` : ""}
Return ONLY a JSON array of 5 strings.`;
  const raw = await engineGenerate(prompt, "plan");
  let titles = [];
  try {
    titles = parseFirstJson(raw).map((t) => String(t).trim()).filter(Boolean).slice(0, 5);
  } catch {
    titles = [];
  }
  return { titles };
}
async function generateSongV3(payload) {
  const result = await runEngine(CURRICULUM, engineInputs(payload), engineGenerate);
  return { text: result.text, meta: result.meta };
}
async function streamSongV3(payload, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });
  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}

`);
    res.flush?.();
  };
  try {
    const result = await runEngine(
      CURRICULUM,
      engineInputs(payload),
      engineGenerate,
      (label) => send({ type: "stage", label })
    );
    send({ type: "d", t: result.text });
    send({ type: "done", text: result.text, meta: result.meta });
  } catch (error) {
    send({
      type: "error",
      error: error?.message || "Song generation failed.",
      ...Array.isArray(error?.reasons) ? { reasons: error.reasons } : {}
    });
  } finally {
    res.end();
  }
}
async function handler(req, res) {
  if (req.method === "GET") {
    const rooms = {};
    for (const pack of Object.values(CURRICULUM.genres)) {
      rooms[pack.id] = pack.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        oneLine: r.oneLine,
        instruments: r.builder?.instruments ?? [],
        themes: r.builder?.themes ?? [],
        purposes: r.builder?.purposes ?? []
      }));
    }
    return res.status(200).json({
      ok: true,
      engineVersion: ENGINE_VERSION,
      curriculumHash: CURRICULUM.hash,
      model: ENGINE_MODEL,
      genres: Object.keys(CURRICULUM.genres),
      rooms,
      genreBuilder: CURRICULUM.genreBuilder ?? {},
      genreBuilderByLang: CURRICULUM.genreBuilderByLang ?? {}
    });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { action, email, payload } = req.body || {};
    if (!action) return res.status(400).json({ error: "Missing action" });
    if (!isAllowedEmail(email)) return res.status(401).json({ error: "Invalid user identity" });
    requestRequiresUserGeminiKey = action === "askAndre" ? false : await shouldRequireUserGeminiKey(String(email || ""));
    requestGeminiTextApiKey = String(payload?.userGeminiApiKey || req.headers["x-gemini-api-key"] || "").trim() || null;
    switch (action) {
      case "generateSong": {
        const wantsV3 = engineAllowed(email) && payload?.engine !== "interim" && resolveGenre(CURRICULUM, String(payload?.inputs?.genre || "")) !== null;
        if (wantsV3) {
          if (payload?.stream) return await streamSongV3(payload, res);
          try {
            return res.status(200).json(await generateSongV3(payload));
          } catch (e) {
            if (!(e instanceof EngineNotAvailable)) throw e;
          }
        }
        if (payload?.stream) return await streamSongInterim(payload, res);
        return res.status(200).json(await generateSongInterim(payload));
      }
      case "suggestTitles":
        return res.status(200).json(await suggestTitles(payload, email));
      case "editSong":
        return res.status(200).json(await editSongInterim(payload));
      case "structureImportedSong":
        return res.status(200).json(await structureImportedSongInterim(payload));
      case "generateAlbumArt":
        return res.status(200).json(await generateAlbumArt({ ...payload || {}, email }));
      case "generateSocialPack":
        return res.status(200).json(await generateSocialPack(payload));
      case "translateLyrics":
        return res.status(200).json(await translateLyrics(payload));
      case "askAndre":
        return res.status(200).json(await askAndre(payload));
      default:
        return res.status(400).json({ error: "Unsupported action" });
    }
  } catch (error) {
    console.error("[AI API Error]", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      details: error?.details,
      reasons: error?.reasons
    });
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return res.status(status).json({
      error: error?.message || "AI API failed",
      code: error?.code || "ai_request_failed",
      // Which code checks blocked the song (EngineFailure) — for diagnosis, not user-facing.
      ...Array.isArray(error?.reasons) ? { reasons: error.reasons } : {}
    });
  } finally {
    requestGeminiTextApiKey = null;
    requestRequiresUserGeminiKey = false;
  }
}
export {
  buildInterimSongPrompt,
  config,
  handler as default
};
