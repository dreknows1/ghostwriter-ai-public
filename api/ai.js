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
        "Celebration"
      ],
      "purposes": [
        "Uplift the people",
        "Protest",
        "Romance",
        "Skank / dance",
        "Give thanks"
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
    }
  },
  "hash": "a93f759df8e5",
  "approxTokens": {
    "core": 1794,
    "largestSlice": 3667
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
  "experimental"
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
var ENGINE_VERSION = "v3.0-rnb";
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
function resolveGenre(curriculum, genre) {
  const norm = String(genre || "").toLowerCase().replace(/[^a-z0-9&]/g, "");
  for (const pack of Object.values(curriculum.genres)) {
    const candidates = [pack.id, pack.name.toLowerCase(), ...pack.aliases].map(
      (a) => a.toLowerCase().replace(/[^a-z0-9&]/g, "")
    );
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
      genreBuilder: CURRICULUM.genreBuilder ?? {}
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
