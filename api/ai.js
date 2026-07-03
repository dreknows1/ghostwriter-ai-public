// server/ai.ts
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// server/engine/curriculum.generated.ts
var CURRICULUM = {
  "core": `What a song IS, and the job of every section

A song is a felt emotion delivered through structure, repetition, and melody over time.
Sections are not labels; they are jobs:

- **Intro** \u2014 sets the world in seconds; earns the first verse.
- **Verse** \u2014 advances the story. Each verse must add new information; verse 2 is never verse 1 reworded.
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
  - hearts entwined; two hearts beat as one; the beat of my heart; beat inside my heart
  - shadows flicker; shadows dance; silhouette; neon
  - you complete me; my missing piece; meant to be; written in the stars
  - more than words can say; words can't express; honest truth
  - forever and always; till the end of time; take my breath away
  - moth to a flame; fire in my veins; electricity between us; gravity pulls
  - love like ours; heart on my sleeve; lose me too
- **Hook** \u2014 short, rhythmic, emotionally loaded, placed at the lift; the title lives here; a listener can sing it after one listen. In R&B and hip-hop, the hook is where the double entendre or flipped phrase pays rent \u2014 a hook that means two things beats a sincere flat one.
- **Rhyme** \u2014 a choice, not a duty: perfect rhyme closes a thought, slant rhyme keeps it moving, internal rhyme builds momentum (rap's engine), and NO rhyme is a legitimate choice when the honest line matters more. Rhyme density is a genre decision, never a fixed rule.
- **Emotion** \u2014 every craft decision above serves ONE core feeling with an arc (where it starts \u2192 where it turns \u2192 where it lands).`,
  "bannedPhrases": [
    "hearts entwined",
    "two hearts beat as one",
    "the beat of my heart",
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
    "lose me too"
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
            "prose": "Density sparse; min adlibs 4; delivery tags [Harmonies] [Spoken] [Soft] [Falsetto] [Crooning]. This room performs like a late-night text thread set to music \u2014 one intimate lead talking as much as singing, so bracket tags stay light and the adlibs do the emotional work. Signature: A quiet answer vocal tucked in parentheses under the end of a lead line \u2014 echoing or gently commenting on the last few words the way a lover would murmur back over a text thread, never a full-voiced group response. Placement: The floor of 4 is reachable without ever filling the empty space the writing leaves: roughly 2 under the hook, 1 at a verse line-end, and 1 in a short repeated-hook outro tag.",
            "adlibDensity": "sparse",
            "minAdlibs": 4,
            "deliveryTags": [
              "[Harmonies]",
              "[Spoken]",
              "[Soft]",
              "[Falsetto]",
              "[Crooning]"
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
            "prose": "Density heavy; min adlibs 8; delivery tags [Call and Response] [Harmonies] [Vocal Run] [Belting] [Ad-Lib Section] [Choir enters]. This is the loudest, most vocally crowded room in R&B, so it leans hardest on adlibs and backing-vocal tags of all the siblings. Signature: A four-voice backing stack belting a chant-simple, metrically parallel chorus together while answering the lead line for line under the verses \u2014 a call-and-response conversation with the address locked on one person, opening into a final vamp where the whole stack holds the chorus and the lead runs freely over the top. Placement: Structure tags ([Verse], [Chorus], [Bridge]) go bare on their own lines.",
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
            "prose": "Density moderate; min adlibs 5; delivery tags [Vocal Run] [Falsetto] [Crescendo] [Big Finish]. This room performs like a solo star narrating the night everything changed, so nearly all the vocal texture bends around one lead voice. Signature: At the emotional peak, the single star voice breaks into a solo run over the doubled hook while the backgrounds echo its last word behind it \u2014 one voice showing off, never a group trading lines. Placement: Verses stay bare and story-forward \u2014 set the scene, the event, the fallout with almost no adlibs so the narrative reads clean; at most a single echoed last-word under the line that ends the scene.",
            "adlibDensity": "moderate",
            "minAdlibs": 5,
            "deliveryTags": [
              "[Vocal Run]",
              "[Falsetto]",
              "[Crescendo]",
              "[Big Finish]"
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
            "prose": "Density moderate; min adlibs 5; delivery tags [Crooning] [Spoken] [Vocal Run] [Instrumental Break] [Soft]. Neo-Soul performs loose and human, not staged. Signature: The closing vamp circles as a flat mantra instead of building \u2014 the chorus phrase repeats with small changes at the SAME dynamic level top to bottom while hums, a spoken aside, and a drifting (not peak) [Vocal Run] wander over a long instrumental pocket. Placement: The adlib floor is back-heavy: most of the required adlibs live in the closing vamp, verses get at most one, and the bridge is near-zero \u2014 a loaded outro over near-empty verses is what makes this room, not echoes sprinkled evenly under every hook (that is the Contemporary pattern).",
            "adlibDensity": "moderate",
            "minAdlibs": 5,
            "deliveryTags": [
              "[Crooning]",
              "[Spoken]",
              "[Vocal Run]",
              "[Instrumental Break]",
              "[Soft]"
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
            "prose": "Density moderate; min adlibs 3; delivery tags [Whispered] [Spoken] [Soft] [Crooning]. This room performs by murmur, not by run. Signature: A single doubled voice murmuring an echo of its own last word \u2014 the same phrase looping while a low ad-lib breathes back at the end of each pass, tone carrying the feeling instead of a run. Placement: Two placements, kept strictly apart so a writer never confuses them: bracket meta tags ([Spoken], [Whispered], [Soft]) only ever sit on their own line before a section, never mid-line and never inside a phrase; parenthetical adlibs only ever sit at a phrase END, in parentheses, never mid-line and never inside the dead air the writing protects.",
            "adlibDensity": "moderate",
            "minAdlibs": 3,
            "deliveryTags": [
              "[Whispered]",
              "[Spoken]",
              "[Soft]",
              "[Crooning]"
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
            "prose": "Density sparse; min adlibs 3; delivery tags [Soft] [Crooning] [Falsetto] [Sax Solo] [Vocal Run] [Harmonies]. This room performs by holding back. Signature: The final chorus becomes a vamp that stays close-miked and solo: the simple chorus words loop while one lead voice ascends over the top \u2014 climbing into falsetto and spending its saved-up tasteful runs \u2014 without ever raising the room's volume, without a background trio answering, without a group belt. Placement: Intro and verses stay almost bare \u2014 no run cues, at most a single soft hummed or breathed adlib tucked under a line where a lover would sigh; keep the pre-chorus bare too so the lift is felt, not announced.",
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
            "prose": "Density heavy; min adlibs 7; delivery tags [Call and Response] [Belting] [Harmonies] [Vocal Run] [Big Finish] [Instrumental Break]. This room performs like a live band with a backing trio in the room, so it leans on adlibs harder than most siblings and on delivery tags moderately. Signature: The outro becomes a hook-loop vamp where the backing trio holds the repeated hook and the lead preaches freely over the top \u2014 but the move that most says this room is that the address opens up here: what began as testimony sung to one person widens into celebration sung to the whole room, so the vamp lands as a crowd lifting the hook, not one voice still fixed on one person. Placement: Verses carry real trio answers, not just chorus ones: short on-beat parenthetical responses and echoed line-ends, kept punchy so the words stay locked to the backbeat.",
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
    }
  },
  "hash": "3453b6facd34",
  "approxTokens": {
    "core": 1632,
    "largestSlice": 3333
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
      if (!parsed.sections.some((s) => s.tag.startsWith("verse"))) problems.push("no [Verse] tag in lyrics");
      if (!parsed.sections.some((s) => s.tag.startsWith("chorus"))) problems.push("no [Chorus] tag in lyrics");
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
    const hookText = parsed.title && contentWords(parsed.title).length > 0 ? parsed.title : opts.hook;
    const hookContent = contentWords(hookText);
    const hookBearing = parsed.sections.filter((s) => /^(chorus|hook|refrain|post-?chorus)/.test(s.tag));
    if (hookBearing.length === 0) {
      checks.push({ id: "hook-placement", severity: "fail", ok: false, detail: "no [Chorus]/[Hook] block to place the hook in" });
    } else if (hookContent.length === 0) {
      checks.push({ id: "hook-placement", severity: "fail", ok: true, detail: "hook has no content words to place" });
    } else {
      const chorusTokens = distinctTokens(hookBearing.map((s) => s.lines.join("\n")).join("\n"));
      const found = hookContent.filter((w) => chorusTokens.has(w));
      checks.push({
        id: "hook-placement",
        severity: "fail",
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
    const chorusSections = parsed.sections.filter((s) => s.tag.startsWith("chorus"));
    if (chorusSections.length < 2) {
      checks.push({ id: "chorus-consistency", severity: "fail", ok: true, detail: "fewer than two chorus blocks" });
    } else {
      const tokenSets = chorusSections.map((s) => distinctTokens(s.lines.join("\n")));
      let worst = 1;
      for (let i = 0; i < tokenSets.length; i++) {
        for (let j = i + 1; j < tokenSets.length; j++) {
          worst = Math.min(worst, overlapRatio(tokenSets[i], tokenSets[j]));
        }
      }
      checks.push({
        id: "chorus-consistency",
        severity: "fail",
        ok: worst >= 0.7,
        detail: `worst chorus-pair overlap ${Math.round(worst * 100)}%`
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
    const nameDrop = /\b(?:think|like|sounds like|reminiscent of|in the style of)\s+[A-Z][\w.]+(?:\s+[A-Z][\w.]+)?\s*(?:meets|x|×|vs)\s+[A-Z]/.test(suno) || /\b[A-Z][\w.]+\s+meets\s+[A-Z][\w.]+/.test(suno);
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
      detail: `${adlibCount} adlibs in parentheses (room floor ${opts.minAdlibs})`
    });
  }
  if (typeof opts.minAdlibs === "number") {
    const perfTags = allBracketTags.filter((t) => !STRUCTURE_TAGS.has(normalizeTag(t)) && !t.includes(":"));
    checks.push({
      id: "performance-tags",
      severity: "fail",
      ok: perfTags.length >= 1,
      detail: perfTags.length ? `${perfTags.length} performance tags: ${perfTags.slice(0, 5).join(", ")}` : "no delivery/dynamics tags"
    });
  }
  if (typeof opts.minAdlibs === "number") {
    const junk = allBracketTags.filter((t) => t.includes(":") || t.trim().split(/\s+/).length > 4);
    checks.push({
      id: "invalid-tags",
      severity: "fail",
      ok: junk.length === 0,
      detail: junk.length ? `invented tags (renderer ignores these): ${[...new Set(junk)].slice(0, 5).map((t) => `[${t}]`).join(", ")}` : "no invented tags"
    });
    if (opts.validTags && opts.validTags.length > 0) {
      const valid = new Set(opts.validTags.map((t) => normalizeTag(t.replace(/^\[|\]$/g, ""))));
      const unknown = [...new Set(allBracketTags.filter((t) => !t.includes(":") && !valid.has(normalizeTag(t))))];
      checks.push({
        id: "unknown-tags",
        severity: "warn",
        ok: unknown.length === 0,
        detail: unknown.length ? `off-list tags: ${unknown.slice(0, 6).map((t) => `[${t}]`).join(", ")}` : "all tags on the valid list"
      });
    }
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
  const { core, pack, card, brief, hook, sections, story, vocals, variant, guidance, bannedPhrases, hookLocked } = args;
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

=== HOW AN R&B WRITER THINKS ===
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

=== THE PERFORMANCE (tags & adlibs \u2014 this is what makes it a real song, not a page) ===
${card.performance.prose}
Adlib density for this room: ${card.performance.adlibDensity}. Use AT LEAST ${card.performance.minAdlibs} adlibs in parentheses () across the song.
Delivery/dynamics tags that fit this room: ${card.performance.deliveryTags.join(" ")}.
HOW to place them (never random \u2014 placement follows the emotional arc):
- Meta tags go in [square brackets] on their OWN line, in the gap between lyric lines. Never inline inside a lyric line.
- Keep every bracket tag SHORT (1-3 words), no colons, no descriptions: [Belting] not [Belting with full power], [Harmonies] not [Harmonies swell]. NEVER invent key:value tags like [Energy: High] or [Vocals: Confident]; the renderer ignores them and they ruin the song. Use ONLY real Suno tags \u2014 the section tags plus this room's delivery tags above.
- Your final hook (the Title) must lead the chorus (or [Hook]) section and appear in it word-for-word \u2014 the chorus is built around it.
- Adlibs go in (parentheses) and MAY sit inline at a line's end or on their own short line right under it \u2014 exactly where a real singer would answer, echo, or breathe. Adlibs are SOUNDS/short responses, never slang or dialect the user didn't write.
- Density rises and falls with the dynamics: sparse in an intimate verse/bridge, fuller on the hook, heaviest at the final vamp/outro. Match this room's character above.

${story ? `=== THE STORY (the user's own words) ===
${story}` : `=== NO STORY WAS GIVEN ===
Write from the brief alone. Keep it universal but concrete. NEVER invent fake personal details \u2014 no invented names, streets, dates, or events pretending to be the user's.`}

${approach}${guidance ? `

One more thing from the last attempt: ${guidance}` : ""}

Vocal: ${voiceLine(vocals)}.

Return exactly this format:
Title: ${hookLocked ? hook : "<your final hook>"}
### SUNO Prompt
One 40-70 word production prompt for this exact song. Ground it in this room's sound (never name real artists \u2014 describe the sound instead): ${card.rendering}
### Lyrics
The song, with section tags in brackets.

This is creative fiction for a music app. If you cannot write it, return ONLY the line "GENERATION_DECLINED".`;
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
  "performance-tags": "place this room's delivery tags on their own lines where the vocal changes or the song builds",
  "invalid-tags": "remove any invented tags like [Energy: High] \u2014 use only real Suno section and delivery tags",
  "tags-own-line": "every square-bracket tag goes on its own line, never inside a lyric line"
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
    const draft = await generate(
      writerPrompt({ core: curriculum.core, pack, card, brief, hook, sections, story, vocals: inputs.vocals, variant, guidance, bannedPhrases: curriculum.bannedPhrases, hookLocked }),
      "write"
    ).catch(() => "");
    if (!draft || draft.includes("GENERATION_DECLINED")) return null;
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
        minAdlibs: card.performance.minAdlibs
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
function buildInterimSongPrompt(inputs) {
  const genre = String(inputs?.genre || "Pop").trim();
  const story = String(inputs?.creativeDirection || inputs?.additionalInfo || "").trim();
  const vocals = String(inputs?.vocals || "Female Solo").trim();
  const voice = /female/i.test(vocals) ? "female vocal" : /male/i.test(vocals) ? "male vocal" : "duet vocals";
  const picks = [
    inputs?.subGenre && `Style: ${String(inputs.subGenre).trim()}`,
    inputs?.theme && `Theme: ${String(inputs.theme).trim()}`,
    inputs?.purpose && `The song should: ${String(inputs.purpose).trim()}`,
    inputs?.audience && `It speaks to: ${String(inputs.audience).trim()}`,
    inputs?.title && `Title (use exactly this): ${String(inputs.title).trim()}`
  ].filter(Boolean).join("\n");
  return `Write a ${genre} song${story ? ` about the following:

${story}

` : ". "}${picks ? `
The writer chose:
${picks}

` : ""}It should have a ${voice} and section tags like [Verse] [Chorus] [Bridge].

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
    title: opt(inputs.title)
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
      rooms[pack.id] = pack.rooms.map((r) => ({ id: r.id, name: r.name, oneLine: r.oneLine }));
    }
    return res.status(200).json({
      ok: true,
      engineVersion: ENGINE_VERSION,
      curriculumHash: CURRICULUM.hash,
      model: ENGINE_MODEL,
      genres: Object.keys(CURRICULUM.genres),
      rooms
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
