import type { GenreGuide } from './types';

export const MANDOPOP_GUIDE: GenreGuide = {
  id: 'mandopop',
  name: 'Mandopop',
  language: 'Mandarin Chinese',

  sonicPalette: {
    overview: 'Melodically driven, emotionally earnest, and production-polished. Mandopop centres the vocal melody above all else — lush arrangements serve the singer\'s emotional delivery. The palette ranges from acoustic balladry to electronic pop, always with crystalline vocal clarity.',
    timbre: [
      'clean acoustic guitar (fingerpicking and strumming)',
      'warm piano and electric piano',
      'orchestral strings (lush, cinematic)',
      'bright synth pads and leads',
      'electric guitar with light overdrive',
      'traditional Chinese instruments (erhu, pipa, guzheng) in fusion',
    ],
    texture: 'Mid-forward and vocal-centred. Arrangements create a warm bed beneath the voice without competing. Ballads are spacious; dance-pop is denser but still vocally clear.',
    tonality: 'Predominantly minor for emotional depth. Pentatonic melodies are deeply embedded. Major keys for uplifting anthems. Harmonic language is generally simpler than J-Pop but melodically strong.',
    signatureSounds: [
      'piano arpeggios under vocal ballad',
      'erhu melody doubled with vocal',
      'string section crescendo at final chorus',
      'R&B-influenced synth bass grooves',
      'guzheng glissando as ornament',
    ],
  },

  rhythmAndGroove: {
    overview: 'Mandopop rhythm serves the melody — grooves are supportive rather than attention-grabbing. Ballads float freely; dance tracks adopt global pop and EDM patterns.',
    bpmRange: { min: 60, max: 140, sweet: 80 },
    feel: 'Gentle and flowing in ballads. Crisp and modern in dance-pop. R&B-influenced tracks have a laid-back groove.',
    swing: 'Generally straight. R&B tracks may introduce light swing. Traditional-influenced pieces follow rubato phrasing.',
    syncopation: 'Low to moderate. The tonal nature of Mandarin Chinese constrains vocal syncopation — syllable tones must be preserved for intelligibility.',
    grooveArchetype: 'Power ballad half-time, four-on-the-floor dance pop, R&B shuffle, acoustic fingerpick pattern.',
    rhythmicSignatures: [
      'power ballad: kick on 1 and 3, snare on 2 and 4',
      'C-Pop dance: four-on-the-floor with synth bass',
      'R&B groove: programmed drums with swing feel',
      'guofeng: traditional percussion patterns adapted',
    ],
  },

  harmonicLanguage: {
    overview: 'Mandopop harmony is melodically rich but harmonically straightforward. Pentatonic melodies over diatonic progressions create the signature sound. Jay Chou introduced more chromatic and R&B-influenced harmony.',
    scales: [
      'pentatonic major',
      'pentatonic minor',
      'natural minor',
      'major (Ionian)',
      'Dorian mode (R&B influence)',
    ],
    chordProgressions: [
      'I – V – vi – IV (pop standard, extremely common)',
      'vi – IV – I – V (emotional minor start)',
      'I – IV – vi – V (gentle ballad)',
      'i – bVI – bIII – bVII (minor descent)',
    ],
    harmonyNotes: 'Chord progressions are functional and clear. Extended chords (7ths, 9ths) appear in R&B-influenced tracks. Pentatonic vocal melodies over Western harmony create Mandopop\'s distinctive East-meets-West flavour.',
    modality: 'Major-minor contrast between verse and chorus is standard. Pentatonic melodies naturally create modal ambiguity. Jay Chou\'s innovations brought more chromatic movement.',
  },

  songStructure: {
    overview: 'Mandopop follows conventional pop structure with emphasis on the emotional arc of the vocal performance. Key changes at the final chorus are common and expected.',
    form: 'Intro – Verse 1 – Verse 2 – Chorus – Verse 3 – Chorus – Bridge – Final Chorus (often key-changed) – Outro',
    sections: [
      'Intro (piano or guitar, atmospheric)',
      'Verse (intimate, lower register)',
      'Chorus (emotional peak, melodic climax)',
      'Bridge (harmonic departure, spoken or soft)',
      'Final Chorus (key modulation up, full arrangement)',
    ],
    arrangement: 'Builds from sparse verse to full chorus. Strings and backing vocals added progressively. The final chorus is the emotional summit.',
    introOutro: 'Piano or guitar intros are standard. The intro melody often previews the chorus. Outros fade on the chorus melody or end with a solo instrument.',
    barLengths: 'Verse: 8-16 bars. Chorus: 8 bars. Bridge: 4-8 bars. Total: 4-5 minutes.',
    hookPlacement: 'Chorus is the hook — it must be immediately memorable and singable. KTV (karaoke) singability is a design requirement.',
  },

  vocalDelivery: {
    overview: 'The Mandopop vocal is everything. Clarity, emotional authenticity, and technical control are paramount. Mandarin\'s four tones shape melodic contour — good Mandopop melodies work with tonal speech patterns, not against them.',
    phrasing: 'Follows Mandarin speech rhythm closely. Phrases tend to be four-character or eight-character units reflecting Chinese poetic tradition. Breath marks align with linguistic phrases.',
    affect: 'Earnest emotion without ironic distance. Heartbreak, devotion, nostalgia, and determination are delivered with full sincerity. The audience expects to be moved.',
    techniques: [
      'clear chest voice with controlled vibrato',
      'falsetto for vulnerability and emotional peaks',
      'spoken or whispered bridge sections',
      'powerful belt at final chorus climax',
    ],
    adlibStyle: 'Restrained. Short vocal fills between phrases. Backing vocals echo key words. Less improvisation than Western pop.',
    harmony: 'Simple thirds and octave doubling in backing vocals. Group harmonies in idol pop. Solo vocal is usually the uncontested focus.',
    grit: 'Minimal — clean, smooth vocals are the commercial standard. Rock-influenced artists add edge. Hip-hop artists bring more rawness.',
  },

  lyricalConventions: {
    overview: 'Mandopop lyrics draw from Chinese literary tradition — classical poetry, four-character idioms (chengyu), and poetic imagery are woven into modern love songs. Fang Wenshan\'s lyrics for Jay Chou represent the pinnacle.',
    themes: [
      'romantic love and heartbreak',
      'nostalgia and memory',
      'personal growth and perseverance',
      'Chinese cultural pride and history',
      'friendship and family bonds',
      'urban loneliness and modern life',
    ],
    perspective: 'First-person romantic confession dominant. The singer addresses a past or present love directly.',
    figurativeLanguage: 'Classical Chinese imagery: moon, rain, autumn leaves, flowing water. Historical references (ancient dynasties, warriors, poets). Nature as emotional mirror. Four-character idioms for literary depth.',
    vocabulary: 'Standard Mandarin with classical Chinese poetic vocabulary. Guofeng tracks incorporate wenyanwen (classical Chinese). Pop tracks use conversational Mandarin. Hip-hop introduces slang.',
    storytellingApproach: 'Emotional arc centred on a single relationship or feeling. Fang Wenshan\'s approach: cinematic imagery creating a visual-emotional world. The best lyrics paint scenes rather than explain feelings.',
    cliches: [
      '"huí yì" (memories) as universal emotional trigger',
      'rain as melancholy metaphor',
      'the moon as witness to love',
      '"wǒ yuàn yì" (I\'m willing to) as devotion hook',
    ],
  },

  productionFingerprint: {
    overview: 'Mandopop production is polished and vocal-forward. Taiwan (historically) and mainland China (increasingly) are production centres. K-Pop influence has raised production standards.',
    mixAesthetic: 'Vocals dominant and crystal-clear. Warm mid-range. Controlled low end. Spacious reverb for ballads. Punchy and bright for dance tracks.',
    era: 'Current era: streaming-driven, influenced by K-Pop production standards. C-Pop idol groups competing with soloists. Guofeng (Chinese folk-pop) revival.',
    signalChain: 'Professional studios in Taipei, Beijing, Shanghai. Clean vocal chains. Orchestral samples or live strings for ballads. Programmed drums with live feel.',
    modernTrends: 'K-Pop production influence. Guofeng revival blending traditional instruments with pop. Chinese hip-hop mainstream breakthrough. C-Pop idol group system expanding. Douyin (TikTok) driving short-form song hits.',
  },

  instrumentation: {
    coreInstruments: [
      'piano (acoustic and electric)',
      'acoustic guitar',
      'orchestral strings',
      'synthesizer pads and leads',
      'programmed drums',
      'electric bass',
    ],
    signatureSounds: [
      'piano arpeggio ballad introduction',
      'erhu melody line',
      'guzheng glissando accent',
      'string crescendo at key change',
    ],
    layering: 'Verse: sparse (piano/guitar + voice). Pre-chorus: add strings. Chorus: full band. Final chorus: everything plus key change. Each layer serves the vocal arc.',
    avoidInstruments: [
      'heavy distorted guitars (unless rock fusion)',
      'country instruments',
      'aggressive electronic bass drops',
      'West African percussion',
    ],
  },

  culturalContext: {
    overview: 'Mandopop is the shared pop music of the Mandarin-speaking world — mainland China, Taiwan, Singapore, and diaspora communities globally. It carries enormous cultural weight as entertainment, identity expression, and soft power.',
    origin: 'Shanghai (1920s-40s jazz-influenced popular song) → Taiwan (post-1949 cultural centre) → Hong Kong Cantopop crossover → mainland China market opening (1990s-present). Taiwan\'s role as creative centre is being overtaken by mainland China\'s massive market.',
    identity: 'Mandarin Chinese language is the unifying element. Regional differences (Taiwanese vs. mainland vs. Singaporean) exist but the market is increasingly unified. Chinese cultural identity — history, poetry, family values — is embedded in the music.',
    community: 'Massive market: 1+ billion potential listeners. KTV (karaoke) culture makes singability paramount. Weibo, Bilibili, and Douyin are key platforms. Fan culture increasingly K-Pop influenced.',
    socialFunction: 'KTV social bonding. Emotional processing through ballads. Cultural pride through guofeng. Idol worship and parasocial connection. Mandopop soundtracks life milestones — weddings, graduations, heartbreaks.',
    authenticityMarkers: [
      'Mandarin lyrics with correct tonal-melodic alignment',
      'emotional sincerity in vocal delivery',
      'KTV-singable melodies',
      'Chinese cultural references where appropriate',
      'production quality matching international standards',
    ],
  },

  historicalLineage: {
    overview: 'From 1920s Shanghai jazz-pop through Teresa Teng\'s pan-Chinese stardom to Jay Chou\'s genre revolution and today\'s streaming-era C-Pop.',
    roots: [
      'Shanghai shidaiqu (1920s-40s jazz-influenced pop)',
      'Taiwanese campus folk song movement (1970s)',
      'Cantopop crossover (1980s-90s)',
      'Western pop, rock, and R&B influence',
    ],
    evolution: 'Shanghai shidaiqu (1920s-40s) → Teresa Teng era (1970s-80s) → Taiwanese pop golden age (1990s) → Jay Chou revolution (2000s) → streaming and idol era (2010s-present).',
    keyEras: [
      '1920s-40s: Shanghai golden age',
      '1970s-80s: Teresa Teng pan-Asian stardom',
      '1990s: Taiwanese pop boom',
      '2000s: Jay Chou era — R&B and guofeng innovation',
      '2010s-present: Mainland market dominance, idol groups',
    ],
    influencedBy: [
      'American jazz and pop (Shanghai era)',
      'Japanese enka and pop',
      'K-Pop (production and idol system)',
      'American R&B and hip-hop',
    ],
    influenced: [
      'Southeast Asian pop markets',
      'Cantopop',
      'K-Pop (market and fan culture exchange)',
      'global Chinese diaspora music',
    ],
  },

  subGenres: [
    {
      name: 'C-Pop Ballad',
      description: 'The dominant Mandopop form — emotionally powerful vocal ballads with piano/string arrangements. The backbone of KTV culture and the commercial heart of the industry.',
      distinguishingFeatures: ['piano-driven arrangement', 'powerful vocal delivery', 'key change at final chorus', 'KTV-optimized singability'],
      bpmRange: { min: 60, max: 80 },
      keyArtists: ['Jay Chou', 'JJ Lin', 'Eason Chan', 'Hebe Tien'],
      productionNotes: 'Piano foundation, strings build through song. Vocal pristine and forward. Dynamic arc from intimate verse to powerful final chorus.',
      lyricNotes: 'Romantic love, heartbreak, nostalgia. Poetic Mandarin. Fang Wenshan-style cinematic imagery as gold standard.',
      sunoPromptKeywords: ['Mandopop ballad', 'Chinese ballad', 'C-Pop emotional', 'Jay Chou style ballad', 'KTV song'],
    },
    {
      name: 'Chinese R&B',
      description: 'R&B filtered through Mandarin vocal and lyrical sensibility. Jay Chou pioneered the fusion; it\'s now a mainstream Mandopop sound. Smooth, groovy, and vocally sophisticated.',
      distinguishingFeatures: ['R&B groove and production', 'Mandarin vocals over Western R&B beds', 'pentatonic-R&B melodic fusion', 'laid-back groove'],
      bpmRange: { min: 70, max: 100 },
      keyArtists: ['Jay Chou', 'JJ Lin', 'Eric Chou', 'Khalil Fong'],
      productionNotes: 'Programmed drums with swing. Rhodes and synth pads. Bass prominent. Vocal smooth and rhythmically fluid.',
      lyricNotes: 'Urban romance, nightlife, self-expression. More colloquial Mandarin. English phrases natural.',
      sunoPromptKeywords: ['Chinese R&B', 'Mandopop R&B', 'Jay Chou R&B', 'C-Pop smooth', 'Mandarin soul'],
      embodiedDelta: {
        microTimingAndFeel: {
          genreSpecificFeel: 'Western R&B swing feel adapted for Mandarin — the groove must accommodate tonal language rhythm without losing R&B pocket',
          aheadBehindBeat: 'Behind-beat vocal placement (R&B tradition) but adjusted for Mandarin syllable weight — tones need more time than English',
        },
        regionalDialectSpecificity: {
          accentInfluence: 'Code-switching between Mandarin verses and English hooks is naturalized; Taiwanese Mandarin accent dominates (softer than Beijing)',
          dialectVocabulary: ['English R&B slang mixed into Mandarin', 'Urban Mandarin colloquialisms'],
        },
        intertextualityAndSampling: {
          canonKnowledge: 'Jay Chou\'s R&B fusion is the foundational reference; Western R&B (Usher, Aaliyah, Frank Ocean) is the sonic reference point',
          lineageSignifiers: ['Jay Chou\'s rhythmic Mandarin delivery', 'Khalil Fong\'s pure R&B vocal approach', 'JJ Lin\'s melodic R&B balladry'],
        },
        vocalDelivery: {
          phrasing: 'R&B melisma adapted for Mandarin — runs and riffs adjusted to maintain tonal clarity; less ornamental than English-language R&B',
          techniques: ['Light falsetto transitions', 'Breathy verse delivery', 'Controlled runs that respect tonal structure'],
        },
      },
    },
    {
      name: 'Chinese Hip-Hop',
      description: 'Mandarin-language hip-hop that broke mainstream through The Rap of China (2017). Ranges from trap to boom-bap, with distinctly Chinese lyrical approaches.',
      distinguishingFeatures: ['Mandarin rap flow', 'trap and boom-bap production', 'Chinese cultural references', 'battle rap culture'],
      bpmRange: { min: 75, max: 100 },
      keyArtists: ['Higher Brothers', 'GAI', 'PG One', 'Vava'],
      productionNotes: 'Trap 808s adapted for Mandarin flow. Beat must accommodate tonal language. Bass-heavy, hi-hat-driven.',
      lyricNotes: 'Street life, flex, Chinese cultural pride, social commentary. Mandarin wordplay within tonal constraints.',
      sunoPromptKeywords: ['Chinese hip-hop', 'Mandarin rap', 'C-rap', 'Rap of China style', 'trap Chinese'],
    },
    {
      name: 'Chinese Rock',
      description: 'Rock music in Mandarin — from Cui Jian\'s revolutionary 1986 debut through 1990s Beijing rock to modern indie. Carries political weight unique among Mandopop sub-genres.',
      distinguishingFeatures: ['guitar-driven arrangements', 'Mandarin vocals over rock', 'political and social themes', 'live band format'],
      bpmRange: { min: 100, max: 160 },
      keyArtists: ['Cui Jian', 'Beyond (Cantopop-rock)', 'Mayday', 'Second Hand Rose'],
      productionNotes: 'Live band recording. Guitar forward. Drums punchy. Vocal raw and passionate. Less polished than mainstream Mandopop.',
      lyricNotes: 'Social commentary, rebellion, youth angst, personal freedom. More direct and confrontational than ballad Mandopop.',
      sunoPromptKeywords: ['Chinese rock', 'C-rock', 'Mandarin rock', 'Mayday style', 'Beijing rock'],
    },
    {
      name: 'C-Electronic',
      description: 'Chinese electronic pop and dance music — EDM-influenced production with Mandarin vocals. Growing through festival culture and streaming.',
      distinguishingFeatures: ['EDM production framework', 'Mandarin vocal hooks', 'festival-ready drops', 'electronic dance grooves'],
      bpmRange: { min: 120, max: 140 },
      keyArtists: ['Lu Han', 'Lay Zhang', 'Jackson Wang'],
      productionNotes: 'International EDM production standards. Supersaw drops. Bright synths. Mandarin vocal hooks over electronic beds.',
      lyricNotes: 'Party, self-expression, empowerment. Bilingual Mandarin-English. Simple, hook-driven.',
      sunoPromptKeywords: ['C-electronic', 'Chinese EDM', 'Mandarin dance pop', 'C-Pop electronic'],
    },
    {
      name: 'Guofeng (Chinese Folk Pop)',
      description: 'The revival of traditional Chinese musical elements within modern pop production. Erhu, pipa, guzheng, and pentatonic melodies meet contemporary beats. A cultural pride movement.',
      distinguishingFeatures: ['traditional Chinese instruments', 'pentatonic melodies', 'classical Chinese literary references', 'ancient Chinese aesthetic'],
      bpmRange: { min: 70, max: 120 },
      keyArtists: ['Jay Chou (guofeng tracks)', 'HITA', 'Yin Lin', 'Winky'],
      productionNotes: 'Traditional instruments (erhu, pipa, guzheng, dizi) over modern production. Balance ancient and contemporary. Pentatonic melodies essential.',
      lyricNotes: 'Classical Chinese poetry, historical narratives, ancient dynasty references, wuxia (martial arts) imagery. Wenyanwen (classical Chinese) mixed with modern Mandarin.',
      sunoPromptKeywords: ['guofeng', 'Chinese folk pop', 'traditional Chinese modern', 'erhu pop', 'ancient Chinese style pop'],
      embodiedDelta: {
        harmonicLanguage: {
          scales: ['Chinese pentatonic (gong, shang, jue, zhi, yu modes)', 'Anhemitonic pentatonic', 'Traditional Chinese modes'],
          modality: 'Pentatonic-dominant — Western chord progressions are subordinate to pentatonic melodic identity',
        },
        instrumentation: {
          coreInstruments: ['Erhu (Chinese violin)', 'Pipa (Chinese lute)', 'Guzheng (Chinese zither)', 'Dizi (bamboo flute)', 'Modern production elements'],
          signatureSounds: ['Erhu portamento slides', 'Pipa tremolo picking', 'Guzheng glissando sweeps', 'Dizi ornamental trills'],
        },
        intertextualityAndSampling: {
          canonKnowledge: 'Classical Chinese poetry (Tang/Song dynasty) and wuxia (martial arts) literature are primary references; Western pop is deliberately subordinated',
          lineageSignifiers: ['Jay Chou\'s "Blue and White Porcelain" as guofeng template', 'Fang Wenshan\'s classical Chinese lyric writing', 'Traditional Chinese opera vocal ornaments'],
          expectedReferences: ['Tang dynasty poetry', 'Wuxia novel imagery', 'Chinese landscape painting aesthetics', 'Ancient dynasty court culture'],
        },
        lyricalConventions: {
          vocabulary: 'Wenyanwen (classical Chinese) mixed with modern Mandarin — literary register signals cultural sophistication',
          figurativeLanguage: 'Classical Chinese imagery: falling petals, moonlight, ink wash landscapes, jade, silk — nature metaphors over urban imagery',
        },
      },
    },
    {
      name: 'Hokkien Pop',
      description: 'Pop music in Hokkien (Southern Min Chinese) — a distinct tradition from Taiwan and Southeast Asian Chinese communities. Emotionally raw and working-class.',
      distinguishingFeatures: ['Hokkien language', 'working-class themes', 'enka influence from Japan', 'emotional directness'],
      bpmRange: { min: 65, max: 110 },
      keyArtists: ['Jody Chiang', 'Hong Yi-feng', 'A-Lin (Hokkien tracks)'],
      productionNotes: 'Similar to Mandopop ballad production but with distinct Hokkien vocal character. Enka-influenced arrangements.',
      lyricNotes: 'Working-class life, heartbreak, maternal love, drinking. Hokkien dialect — earthier than Mandarin pop.',
      sunoPromptKeywords: ['Hokkien pop', 'Taiwanese Hokkien', 'Southern Min pop', 'Taiwan folk pop'],
      embodiedDelta: {
        regionalDialectSpecificity: {
          accentInfluence: 'Hokkien (Southern Min) tonal system — distinct from both Mandarin and Cantonese; Japanese enka influence on vocal delivery',
          phoneticMarkers: ['Hokkien tone sandhi (tones change in context)', 'Nasal vowels characteristic of Southern Min', 'Japanese-influenced vocal ornaments from enka tradition'],
          dialectVocabulary: ['Taiwanese working-class slang', 'Southern Min emotional vocabulary (heavier, earthier than Mandarin)'],
          regionWithinCulture: 'Taiwan and Southeast Asian Chinese diaspora — carries Taiwanese identity distinct from Mandarin mainstream',
        },
        vocalDelivery: {
          affect: 'Raw emotional directness — less polished than Mandopop; the voice carries working-class authenticity',
          grit: 'More vocal grit tolerated — enka influence allows crying, breaking, and raw emotional sounds',
        },
        socioeconomicSubtext: {
          classIdentity: 'Working-class Taiwanese identity — Hokkien pop was stigmatized as lower-class before cultural reclamation',
          materialConditions: 'Blue-collar themes: factory work, fishing villages, maternal sacrifice, drinking to forget',
        },
        genderAndBodyConventions: {
          genderNarratives: 'Strong female vocal tradition (Jody Chiang) carrying working-class women\'s stories; male vocalists more emotionally raw than Mandopop counterparts',
        },
      },
    },
    {
      name: 'Cantopop Crossover',
      description: 'Cantonese-Mandarin bilingual pop bridging Hong Kong and mainland/Taiwan markets. Historically dominant in the 1980s-90s, now more niche but culturally significant.',
      distinguishingFeatures: ['Cantonese and/or Mandarin versions', 'Hong Kong urban sophistication', 'melodramatic ballad tradition', 'film and drama tie-ins'],
      bpmRange: { min: 60, max: 120 },
      keyArtists: ['Eason Chan', 'Joey Yung', 'Jacky Cheung', 'Faye Wong'],
      productionNotes: 'Polished Hong Kong production. Orchestral arrangements. Dual-language versions common. Cinematic quality.',
      lyricNotes: 'Cantonese lyrics by masters like Lin Xi. Romantic, philosophical, melancholic. Cantonese\'s nine tones create unique melodic constraints.',
      sunoPromptKeywords: ['Cantopop', 'Hong Kong pop', 'Cantonese pop', 'Eason Chan style'],
      embodiedDelta: {
        regionalDialectSpecificity: {
          accentInfluence: 'Cantonese nine-tone system creates fundamentally different melodic constraints — melody must follow tonal contour or risk changing word meaning',
          phoneticMarkers: ['Nine lexical tones vs Mandarin\'s four', 'Final consonant stops (-p, -t, -k) creating rhythmic precision', 'Nasal finals creating warm resonance'],
          dialectVocabulary: ['Hong Kong urban slang', 'Cantonese romantic vocabulary distinct from Mandarin equivalents'],
          regionWithinCulture: 'Hong Kong identity — distinct from mainland and Taiwan; carries the cultural weight of pre-handover cosmopolitanism',
        },
        vocalDelivery: {
          phrasing: 'Tonal melody writing — the vocal melody must respect Cantonese tones far more strictly than Mandarin, constraining composition',
          affect: 'Hong Kong urban sophistication — emotionally restrained compared to Mandopop\'s directness; melancholy expressed through understatement',
        },
        socioeconomicSubtext: {
          classIdentity: 'Hong Kong middle-class urban culture — cosmopolitan, bilingual, caught between East and West',
          materialConditions: 'Post-handover cultural anxiety — Cantopop carries the weight of Hong Kong\'s changing identity',
        },
        intertextualityAndSampling: {
          canonKnowledge: '1980s-90s Cantopop golden era (Leslie Cheung, Anita Mui, Beyond) is the sacred canon; modern artists must acknowledge this lineage',
          lineageSignifiers: ['Leslie Cheung\'s androgynous vocal style', 'Beyond\'s rock-Cantopop fusion', 'Sam Hui\'s social commentary tradition'],
        },
      },
    },
    {
      name: 'Chinese Indie',
      description: 'Independent music scene across Beijing, Shanghai, Chengdu, and other cities. Diverse genres from folk to post-punk to electronic, united by artistic independence.',
      distinguishingFeatures: ['artistic independence', 'genre diversity', 'live music scene', 'alternative aesthetics'],
      bpmRange: { min: 70, max: 140 },
      keyArtists: ['Carsick Cars', 'Chui Wan', 'Faye Wong (indie era)', 'Ma Di'],
      productionNotes: 'Intentionally less polished. Lo-fi or alternative production aesthetics. Live recording feel. Guitar or electronic-driven.',
      lyricNotes: 'Introspective, poetic, sometimes political (coded). Urban alienation, youth, identity. Literary Mandarin.',
      sunoPromptKeywords: ['Chinese indie', 'Beijing indie', 'C-indie', 'Chinese alternative', 'underground Chinese'],
    },
    {
      name: 'C-Idol Pop',
      description: 'K-Pop-influenced idol group music from China — trained groups with choreography, fan engagement, and high production values. Rapidly growing sector.',
      distinguishingFeatures: ['K-Pop-influenced production', 'group format with choreography', 'fan engagement system', 'high-gloss production'],
      bpmRange: { min: 100, max: 140 },
      keyArtists: ['TFBOYS', 'THE9', 'INTO1', 'BonBon Girls'],
      productionNotes: 'K-Pop production standards applied with Mandarin vocals. Bright, punchy, choreography-optimized. Multiple vocal colours within the group.',
      lyricNotes: 'Youth, friendship, dreams, love. Mandarin with English hooks. Accessible and fan-oriented.',
      sunoPromptKeywords: ['C-idol pop', 'Chinese idol', 'TFBOYS style', 'Chinese group pop'],
    },
  ],

  sceneAndAudienceCodes: {
    overview: 'The Mandopop audience spans 1+ billion Mandarin speakers. KTV culture makes singability paramount. Fan culture is increasingly K-Pop-influenced with organized streaming campaigns.',
    fanExpectations: [
      'crystal-clear vocal delivery',
      'memorable, singable melodies (KTV test)',
      'emotional sincerity',
      'polished production quality',
      'Mandarin lyrics as primary language',
    ],
    gatekeeping: 'Low in mainstream — commercial success is respected. Higher in guofeng (cultural accuracy matters) and Chinese rock (authenticity valued). Hip-hop community values lyrical skill.',
    livePerformance: 'Large-scale concerts and TV galas (Spring Festival Gala is the biggest). KTV is the everyday music experience. Music variety shows drive discovery.',
    fashionAndAesthetic: 'K-Pop influenced for idol groups. Guofeng: hanfu (traditional clothing) revival. Hip-hop: international streetwear. Ballad artists: sophisticated casual.',
    crossoverPotential: 'Massive domestic market reduces crossover pressure. Jay Chou has pan-Asian reach. Chinese hip-hop gaining international attention. Language barrier limits Western crossover but diaspora market is significant.',
  },

  // ── Relational & Embodied Dimensions ──────────────────────────────

  microTimingAndFeel: {
    overview: 'Mandopop production is precise and vocal-forward, but less obsessively grid-locked than K-Pop or J-Pop. The timing serves the singer\'s emotional delivery — subtle rubato in ballad vocals is not only tolerated but expected.',
    quantizationDeviation: 'Low in dance-pop and idol tracks. Moderate in ballads where vocal timing follows emotional phrasing rather than the grid. Traditional-influenced (guofeng) tracks allow rubato aligned with Chinese musical aesthetics.',
    aheadBehindBeat: 'Ballad vocals sit slightly behind the beat for emotional weight — this is a defining Mandopop characteristic. Dance tracks lock vocals to the grid. Bass and rhythm section are generally on-grid.',
    humanizationMarkers: [
      'vocal timing stretching at phrase endings in ballads',
      'piano rubato in acoustic intros reflecting classical training',
      'erhu and pipa timing following traditional Chinese musical phrasing',
      'live string section natural ensemble variation in orchestral passages',
      'acoustic guitar fingerpicking maintaining performer-natural timing',
    ],
    genreSpecificFeel: 'The Mandopop feel prioritizes the vocal line\'s emotional arc over rhythmic precision. The accompaniment exists to support the singer\'s timing, not to constrain it — the vocalist leads, the track follows.',
  },

  silenceAndSpace: {
    overview: 'Mandopop uses space to frame the voice. Ballads are built around vocal isolation — moments where the singer is nearly unaccompanied carry the deepest emotional weight.',
    negativeSpaceRole: 'The sparse verse exists to make the chorus bloom. But the most powerful moments are often the quietest — a held note with only piano, or a pause before the final chorus key change.',
    breathingPatterns: 'Vocal breaths are sometimes left in ballad recordings as markers of human emotion. Instrumental breathing between sections is gradual rather than abrupt — crossfades and gentle transitions preferred.',
    dynamicContrast: 'Significant between verse and chorus, but less extreme than K-Pop. The arc is more gradual — Mandopop prefers crescendo over explosion. The key change at the final chorus provides the biggest dynamic shift.',
    whatIsDeliberatelyAbsent: [
      'heavy percussion in ballad verses — gentle pulse only',
      'synth layers in guofeng tracks — traditional instruments stand alone',
      'backing vocals during verse solo vocal moments',
      'electronic production elements in acoustic/classical passages',
      'bass guitar in intimate piano-and-voice intros',
    ],
  },

  callAndResponse: {
    overview: 'Call-and-response in Mandopop manifests through the KTV (karaoke) sing-along tradition, duet culture, and the antiphonal relationship between vocal and instrumental sections.',
    vocalInstrumentalDialogue: 'Erhu or string lines frequently mirror the vocal melody — the instrument "sings back" to the vocalist. Piano interludes respond to vocal phrases. Interlude solos answer the mukhda hook.',
    sectionInternal: 'Duets are a major Mandopop tradition — male-female vocal exchanges create natural call-and-response. Within solo songs, the verse poses an emotional question the chorus answers.',
    audienceParticipation: 'KTV culture is the ultimate call-and-response — audiences sing along in real-time at concerts and in karaoke rooms. Concert audiences routinely sing entire choruses. This sing-along function is a primary design requirement.',
    patterns: [
      'concert audiences singing the chorus while the artist sings harmony above',
      'KTV duet format where audience takes one part, performer the other',
      'erhu or pipa melodic phrase echoing the vocal line',
      'verse-chorus emotional question-and-answer arc',
      'fan phone flashlights swaying in unison as visual response to ballads',
    ],
  },

  regionalDialectSpecificity: {
    overview: 'Mandopop\'s regional landscape is vast — Mandarin (with Taiwanese and mainland accents), Cantonese, Hokkien, and Shanghainese each have distinct musical traditions. The dialect a song is sung in carries cultural and political weight.',
    phoneticMarkers: [
      'Taiwanese Mandarin\'s softer retroflex consonants (sh/ch/zh pronounced closer to s/c/z)',
      'mainland standard Mandarin (Putonghua) with full retroflex and erhua',
      'Cantonese nine-tone system constraining melody differently than Mandarin four-tone',
      'Hokkien nasal vowels and tonal patterns creating a distinct vocal colour',
      'Shanghainese Wu dialect tones in Shanghai indie rock',
    ],
    accentInfluence: 'Mandarin\'s four tones fundamentally shape melody writing — the best Mandopop melodies align melodic contour with tonal speech patterns. Forced tone misalignment is noticed and criticized by native speakers.',
    dialectVocabulary: [
      '"wǒ ài nǐ" vs Cantonese "ngo oi nei" as market-defining language choices',
      'Taiwanese slang and expressions marking songs as culturally Taiwanese',
      'mainland internet slang entering hip-hop lyrics',
      'classical Chinese (wenyanwen) vocabulary in guofeng as literary register marker',
      'Hokkien proverbs in Hokkien pop as cultural identity assertion',
    ],
    regionWithinCulture: 'Taiwan was the historical creative centre (1970s-2000s). Mainland China now dominates commercially through market size. Hong Kong\'s Cantopop is a distinct tradition. Singapore is a smaller but culturally significant market. Each region\'s Mandopop carries distinct cultural identity.',
  },

  performancePractice: {
    overview: 'Mandopop performance spans intimate concert balladry, variety show spectacle, C-Pop idol choreography, and the uniquely Chinese phenomenon of mega-concerts in stadium settings.',
    improvisationConventions: 'Minimal in idol and pop contexts. Concert ballad performances may include extended vocal ad-libs at the final chorus. Hip-hop allows freestyle. Guofeng artists may add traditional instrumental improvisation.',
    crowdInteraction: 'Concert audiences sing along extensively — artists often hold the microphone to the crowd for chorus sections. Phone flashlight waves are universal. Fan gifts and banners are displayed. MC segments are conversational.',
    stagePresence: 'Solo artists command through vocal power and emotional connection. Idol groups follow K-Pop choreography models. Rock artists use energetic band performance. Guofeng artists may incorporate hanfu (traditional costume) and traditional movement.',
    livVsRecordedDifferences: 'Solo artists are expected to deliver strong live vocals — lip-syncing is less accepted than in K-Pop. Idol groups may use backing tracks. Live concerts often include extended arrangements and different key choices.',
    whatMakesAGoodShow: 'Powerful live vocals that match or exceed the recording. Emotional connection through MC segments. Audience sing-along participation. Concert-specific arrangements. Encores with fan-requested deep cuts.',
  },

  socioeconomicSubtext: {
    overview: 'Mandopop reflects the rapid economic transformation of Chinese-speaking societies — from Taiwan\'s post-martial-law cultural flowering to mainland China\'s economic boom and its attendant anxieties.',
    materialConditions: 'The mainland China market\'s enormous scale drives commercial decisions. Streaming platforms (QQ Music, NetEase Cloud Music) dominate distribution. Concert revenue and brand endorsements are primary income for top artists.',
    classIdentity: 'Jay Chou\'s background (working-class single-parent household) became a narrative template for aspiration. Guofeng appeals to cultural pride across classes. Hokkien pop has historically served working-class Taiwanese audiences.',
    politicalUndercurrent: 'Mandopop navigates complex political terrain — cross-strait relations affect artist careers, mainland censorship shapes content, and Hong Kong\'s political situation impacts Cantopop. These pressures are rarely addressed directly in lyrics.',
    implicitReferences: [
      'nostalgia themes coding unspoken political sentiment in Taiwan',
      'guofeng cultural pride movement as soft nationalism',
      'urban loneliness lyrics reflecting mass migration to megacities',
      'Hokkien pop\'s working-class identity as counterpoint to mainland Mandarin dominance',
      'hip-hop artists navigating censorship while maintaining street credibility',
    ],
  },

  intertextualityAndSampling: {
    overview: 'Mandopop\'s intertextual web centers on Jay Chou\'s revolutionary catalog, Teresa Teng\'s foundational legacy, and the classical Chinese literary tradition that infuses lyrics with centuries of poetic reference.',
    canonKnowledge: 'Jay Chou and Fang Wenshan\'s partnership is the central reference point — their guofeng innovations and R&B fusions define the modern era. Teresa Teng represents the pre-modern Mandopop canon. Eason Chan bridges Cantopop and Mandopop.',
    samplingTradition: 'Direct sampling is uncommon. Remake culture is prevalent — classic songs are re-recorded with modern production. Classical Chinese poetry is "sampled" lyrically, with Tang and Song dynasty poems appearing in guofeng tracks.',
    quotationPractice: 'Cover versions of classic songs are a sign of respect. TV singing competition shows feature classic Mandopop reinterpretations. Fang Wenshan\'s lyrical style is widely imitated as a marker of literary ambition.',
    expectedReferences: [
      'Jay Chou\'s R&B-guofeng fusion as the innovation benchmark',
      'Teresa Teng\'s "The Moon Represents My Heart" as cultural touchstone',
      'Fang Wenshan\'s lyrical style as poetic gold standard',
      'Eason Chan\'s emotional ballad delivery as vocal reference',
      'Beyond\'s "Boundless Oceans, Vast Skies" as rock-Cantopop anthem',
    ],
    lineageSignifiers: [
      'pentatonic melody over Western harmony as East-meets-West DNA',
      'the key-change final chorus as Mandopop structural inheritance',
      'KTV singability as design principle passed through generations',
      'guofeng traditional instrument integration as cultural continuity',
      'the "Taiwan sound" — warm, intimate, acoustic-leaning production',
      'the "mainland sound" — grander, more produced, market-optimized',
    ],
  },

  genderAndBodyConventions: {
    overview: 'Mandopop has distinct gender presentation traditions shaped by Chinese cultural aesthetics, the Taiwanese entertainment industry, and increasingly by K-Pop influence on the mainland idol system.',
    vocalGenderCodes: 'Female Mandopop vocals traditionally emphasize sweetness, clarity, and emotional purity. Male vocals range from the "little fresh meat" (xiǎo xiān ròu) youthful lightness to mature baritone balladry. Powerful female vocalists (like Na Ying) command through chest-voice authority.',
    physicalityInPerformance: 'Solo artists perform relatively statically, focusing attention on vocal delivery. C-Pop idol groups adopt K-Pop choreography models. Guofeng performance incorporates traditional Chinese movement aesthetics and hanfu.',
    genderNarratives: 'Female-perspective ballads often explore devotion, sacrifice, and emotional endurance. Male-perspective songs cover protection, devotion, and romantic pursuit. Jay Chou\'s tough-tender duality became a template for male Mandopop artists.',
    subversionExamples: [
      'the "little fresh meat" male aesthetic challenging traditional Chinese masculinity',
      'Faye Wong\'s ethereal, emotionally detached persona in contrast to earnest ballad convention',
      'Chinese rock\'s raw female vocalists rejecting sweet-voiced stereotypes',
      'mainland female rappers (VaVa, Lexie Liu) operating in male-dominated hip-hop spaces',
      'non-binary styling in C-Pop idol groups influenced by K-Pop trends',
    ],
  },

  tempoFeelVsNumber: {
    overview: 'Mandopop tempo is closely tied to emotional function — the genre\'s dominance of ballads means that even mid-tempo songs often feel slower than their BPM due to spacious arrangement and emotional weight.',
    psychologicalTempo: 'A Mandopop ballad at 80 BPM can feel almost motionless in its verse — the sparse arrangement and vocal focus create a sense of suspended time. The same BPM feels more propulsive when the full arrangement enters at the chorus.',
    weightAndMomentum: 'Mandopop tends to feel heavier and more emotionally weighted than its tempo suggests. The emphasis on vocal performance over rhythmic drive means the listener focuses on melodic arc rather than groove momentum.',
    urgencyScale: 'Low in ballads — emotional spaciousness is valued. Moderate in R&B tracks. High in dance-pop and C-idol tracks. Guofeng tracks have a meditative quality regardless of tempo.',
    comparisonToSameBPM: 'Mandopop at 80 BPM feels dramatically more spacious and emotionally charged than Western pop at 80 BPM. The vocal-forward mix, sparse arrangement, and emotional commitment create a sense of time expanding around the singer\'s performance.',
  },

  mistakeConventions: {
    overview: 'Mandopop values polished vocal delivery above all. Production imperfections are generally not tolerated in mainstream releases, but emotional authenticity in live performance is deeply valued.',
    toleratedImperfections: [
      'vocal emotion causing slight pitch deviation at climactic moments',
      'rubato timing in ballad vocal delivery',
      'live concert vocal strain during powerful passages (shows effort)',
      'acoustic instrument natural resonance and string noise',
    ],
    celebratedFlaws: [
      'Chinese rock\'s deliberately raw vocal delivery as authenticity marker',
      'Cui Jian\'s rough voice as the sound of rebellion',
      'Faye Wong\'s breathy, unconventional tone as artistic signature',
      'indie lo-fi production as anti-commercial statement',
    ],
    overproductionRisks: [
      'auto-tune obscuring a vocalist\'s natural emotional expression',
      'K-Pop-style maximalism overwhelming the vocal melody',
      'electronic processing removing the warmth from guofeng instruments',
      'compression flattening the dynamic arc from verse to key-change climax',
      'Western production techniques erasing Mandopop\'s vocal-forward identity',
    ],
    authenticRoughness: 'Reserved for Chinese rock, indie, and underground hip-hop. Mainstream Mandopop — especially ballads — demands crystalline vocal quality. The roughness that validates Chinese rock would undermine a ballad.',
  },

  sunoPromptGuide: {
    essentialKeywords: [
      'Mandopop', 'C-Pop', 'Chinese pop',
      'Mandarin vocals', 'piano ballad', 'guofeng',
      'pentatonic melody', 'emotional Chinese',
    ],
    avoidKeywords: [
      'K-Pop (unless deliberately hybrid)',
      'country', 'reggaeton', 'heavy metal',
      'African percussion', 'Latin rhythm',
    ],
    promptTemplate: '[sub-genre] Mandopop, [BPM] BPM, [mood], [key instruments], Mandarin Chinese vocals, [cultural reference]',
    tips: [
      'Specify "Mandarin Chinese vocals" explicitly.',
      'For ballads: "piano", "strings", "emotional climax", "key change".',
      'For guofeng: "erhu", "pipa", "guzheng", "pentatonic", "ancient Chinese".',
      'Jay Chou is the universal reference point — specify "Jay Chou style" for R&B-guofeng fusion.',
    ],
  },
};
