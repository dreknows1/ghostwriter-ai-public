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
    }
  },
  "hash": "20cdf83cfe46",
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
  return `You are planning a song. Do not write any lyrics. Read the story and return ONLY a JSON object.

THE ROOM this song lives in: ${card.name} \u2014 ${card.oneLine}
Its tempo & groove: ${card.tempoGroove}
${picksBlock(inputs)}
${storyBlock}${imageFeedback ? `

IMPORTANT \u2014 fix your central image: ${imageFeedback}` : ""}

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
