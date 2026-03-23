import type { GenreGuide } from './types';

export const LATIN_GUIDE: GenreGuide = {
  id: 'latin',
  name: 'Latin Music',
  language: 'Spanish',

  sonicPalette: {
    overview: 'Richly textured and rhythmically electric — from acoustic Bachata warmth and Salsa brass fire to 808-driven Reggaeton dembow pulse. The groove and the heart are always central.',
    timbre: [
      'nylon-string acoustic guitar (Bachata, Bolero)',
      'requinto lead guitar with melodic ornamentation',
      'congas, bongos, and timbales',
      'brass section: trumpets and trombones (Salsa)',
      'accordion (Norteño, Cumbia)',
      'TR-808 and synth bass (Reggaeton, Urbano)',
    ],
    texture: 'Layered and rhythmically dense. Acoustic sub-genres feature interlocking guitar, bass, and percussion. Urban sub-genres build from synthetic rhythmic foundation outward into melodic hooks.',
    tonality: 'Primarily minor — Reggaeton, Bachata, and Bolero gravitate toward minor keys for emotional intensity. Latin Pop pivots to major for uplifting choruses. Phrygian mode in flamenco-adjacent sounds.',
    signatureSounds: [
      'dembow kick-snare pattern (Reggaeton)',
      'Bachata requinto double-stop guitar licks',
      'Salsa brass montuno stabs',
      'tumbao bass pattern (Son, Salsa)',
      'clave pattern (2-3 or 3-2)',
    ],
  },

  rhythmAndGroove: {
    overview: 'Rhythm is the spine of Latin music. The clave underpins Cuban-derived styles. Dembow defines Reggaeton. Cumbia employs a hypnotic tropical pulse. Every sub-genre is built for dancing.',
    bpmRange: { min: 65, max: 160, sweet: 96 },
    feel: 'Dance-forward and physically urgent. Even slow Bachata has underlying sensuality tied to movement. Reggaeton\'s dembow creates relentless forward motion.',
    swing: 'Sub-genre dependent. Salsa has subtle clave-derived swing. Cumbia has lazy behind-the-beat grace. Reggaeton is straight-quantized with interest from layered hi-hats.',
    syncopation: 'Pervasive and sophisticated. The tumbao bass in Son/Salsa anticipates the beat. The clave itself is built on rhythmic displacement.',
    grooveArchetype: 'Clave-driven Afro-Cuban two-feel (Salsa), dembow loop (Reggaeton), Cumbia tropical swing, Merengue two-step, Bachata sensual undertow.',
    rhythmicSignatures: [
      '2-3 or 3-2 son clave',
      'dembow: kick on 1, snare on "and" of 2',
      'tumbao: bass anticipates beat 3',
      'merengue palito: fast 16th-note güira pattern',
      'Bachata syncopated guitar chop on beat 4',
    ],
  },

  harmonicLanguage: {
    overview: 'Emotionally expressive and often deceptively simple. Minor key progressions dominate romantic and urban styles. Reggaeton uses minimal two-chord loops where rhythmic energy compensates.',
    scales: [
      'natural minor (Aeolian)',
      'harmonic minor',
      'Phrygian (flamenco-influenced)',
      'major (Latin Pop choruses)',
      'pentatonic minor',
    ],
    chordProgressions: [
      'i – VII – VI – VII (Reggaeton backbone)',
      'i – iv – V – i (Bachata and Bolero standard)',
      'i – VI – III – VII (romantic minor loop)',
      'I – IV – ii – V (Latin jazz and Salsa)',
    ],
    harmonyNotes: 'Chord changes are often few and repetitive — the groove does the heavy lifting. In Salsa, piano montuno creates constant harmonic motion through inversions over simple progressions.',
    modality: 'Strongly minor-oriented. Even celebratory music uses minor keys with uplifting rhythmic energy. Latin Pop pivots between minor verses and major choruses.',
  },

  songStructure: {
    overview: 'Balances Western pop conventions with genre-specific demands for extended instrumental sections and call-and-response. Salsa features the coro-pregón as its defining section.',
    form: 'Intro – Verse – Pre-Chorus – Chorus – Verse 2 – Chorus – Bridge – Final Chorus – Outro',
    sections: [
      'Intro (rhythm established, 4-8 bars)',
      'Verse (narrative setup)',
      'Pre-Chorus (harmonic tension builds)',
      'Chorus/Coro (hook, maximum energy)',
      'Mambo/Montuno (Salsa instrumental improvisation)',
    ],
    arrangement: 'Reggaeton: beat first, verses ride groove, chorus lifts with added layers. Salsa: full band throughout with peaks in mambo section. Bachata: solo guitar intro, band enters gradually.',
    introOutro: 'Intros: rhythmic pattern, guitar riff, or brass fanfare (4-8 bars). Outros: repeated chorus with vocal improvisation or percussion ride-out.',
    barLengths: 'Verse: 8-16 bars. Chorus: 8 bars. Bridge: 4-8 bars. Total: 3-5 minutes; Salsa dura can reach 6-8 minutes.',
    hookPlacement: 'Chorus arrives early (before 1-minute mark) in Reggaeton and Latin Pop. Hook is short, rhythmically locked to the groove, and maximally singable.',
  },

  vocalDelivery: {
    overview: 'Rooted in operatic expressiveness filtered through African rhythmic feeling. The voice is an instrument of seduction, celebration, and sorrow. Singers bend notes with authority and use timbre as expressive vocabulary.',
    phrasing: 'Conversational in verses, expansive in choruses. Vocal phrases anticipate or delay the beat — never metronomically precise.',
    affect: 'Passion is the baseline. Heartbreak, desire, pride, joy delivered with full commitment. The voice should sound like it costs the singer something.',
    techniques: [
      'portamento slides between pitches (Bachata, Bolero)',
      'melismatic runs at phrase endings',
      'falsetto in romantic passages',
      'rhythmic staccato delivery in Reggaeton verses',
      'call-and-response with coro in Salsa',
    ],
    adlibStyle: '¡Ay! / ¡Oye! / ¡Dale! / ¡Fuego! — interjections punctuate phrases. In Salsa, the sonero improvises against the coro.',
    harmony: 'Three-part harmonies in Salsa. Close parallel thirds and sixths in Bachata. Vocal stacks with tuned layers on Urbano hooks.',
    grit: 'Moderate to high. Salsa singers growl at climaxes. Corrido singers have masculine directness. Bachata deploys controlled vulnerability.',
  },

  lyricalConventions: {
    overview: 'Rich literary tradition in Spanish. Dominant subjects are love, desire, heartbreak, celebration, and street life. Imagery is vivid and corporeal — fire, heat, the sea, flowers, the night.',
    themes: [
      'romantic love — pursuit, union, loss',
      'desire and physical attraction',
      'heartbreak and desamor',
      'celebration and dancing',
      'street life and loyalty (Corridos, Trap)',
      'material aspiration and success',
    ],
    perspective: 'First-person confessional dominant. Second-person address (tú) creates intimacy. Corridos use third-person ballad narration.',
    figurativeLanguage: 'Fire and heat for passion. The sea for longing. Night as space of desire. Biblical imagery (paraíso, infierno). Hyperbole is expected and appreciated.',
    vocabulary: 'Rich regional variation: Caribbean, Mexican, River Plate Spanish. Key words: amor, corazón, fuego, noche, cuerpo. Urban slang: perreo, flow, jangueo. Code-switching to English in Urbano.',
    storytellingApproach: 'Emotional arc over narrative detail. Chorus distills the emotional truth; verses provide context. Corridos are the exception — specific stories with characters and consequences.',
    cliches: [
      '"Sin ti no puedo vivir"',
      'comparing lovers to fire or heaven',
      '"Tu cuerpo es un pecado"',
      'the night as romance accomplice',
    ],
  },

  productionFingerprint: {
    overview: 'Spans analog warmth and digital precision. Traditional styles prize live musicianship. Reggaeton/Urbano are DAW-built with punchy 808s. The goal: make the body move and the heart feel simultaneously.',
    mixAesthetic: 'Bass-forward and rhythmically punchy. Vocals present and clear. Percussion forward in mix. In Reggaeton, kick and 808 are physically felt.',
    era: '2020s: Urbano and Latin Pop dominate global streaming. Corridos Tumbados fusion, Afrobeats crossovers. Spanish-language music has achieved global hegemony without requiring English.',
    signalChain: 'Reggaeton: FL Studio/Logic → 808 sub → dembow programming → melodic synths → vocal chain with pitch correction. Salsa: live ensemble → multi-track → analog warmth.',
    modernTrends: 'Corridos Tumbados fusing Mexican tradition with trap. Latin Afrobeats crossover. Genre-fluid Urbano incorporating R&B, amapiano, and drill.',
  },

  instrumentation: {
    coreInstruments: [
      'acoustic guitar (Bachata, Bolero, Corridos)',
      'electric bass',
      'congas, bongos, timbales',
      'trumpet and trombone section (Salsa)',
      'accordion (Cumbia, Norteño)',
      'drum machine / TR-808 (Reggaeton, Urbano)',
    ],
    signatureSounds: [
      'clave woodblock strike',
      'congas tumbao pattern',
      'requinto guitar melismatic runs',
      'güira metallic scrape (Merengue)',
    ],
    layering: 'Traditional: percussion bottom-up (bass drum → congas → timbales → cowbell), melody above. Urban: dembow first, 808 bass, melodic hooks, then atmospheric details.',
    avoidInstruments: [
      'heavy distorted electric guitar',
      'rock drum kit with heavy reverb',
      'bluegrass banjo or dobro',
      'industrial textures',
    ],
  },

  culturalContext: {
    overview: 'Inseparable from the histories of colonization, slavery, migration, and cultural resistance that shaped the Americas. A living archive of Afro-Caribbean, indigenous, and European influences fused over centuries.',
    origin: 'Cuba and Puerto Rico (Son, Salsa, Reggaeton). Mexico (Corridos, Mariachi, Norteño). Colombia (Cumbia, Vallenato). Dominican Republic (Merengue, Bachata). The Spanish Caribbean is the mother node of Afro-Latin traditions.',
    identity: 'Regional origin matters enormously — Puerto Rican Reggaeton and Mexican Norteño occupy radically different cultural spaces despite sharing Spanish. Afro-Latin identity is central to Cuban-derived styles.',
    community: 'Music soundtracks quinceañeras, weddings, block parties, protests. Miami, New York, LA, Mexico City, San Juan, Bogotá, and Medellín are all active creative centres.',
    socialFunction: 'Dancing and physical communion are primary. Beyond dance: cultural memory (corrido narrative), political voice, romantic mediation (serenata), and communal solidarity.',
    authenticityMarkers: [
      'rhythmic authenticity — clave or dembow executed correctly',
      'Spanish delivered with appropriate regional accent',
      'correct use of traditional instruments',
      'understanding of regional distinctions',
      'emotional commitment — genuine feeling over technical polish',
    ],
  },

  historicalLineage: {
    overview: 'A 500-year history of cultural encounter between Spanish colonizers, African enslaved peoples, and indigenous populations. African rhythmic traditions fused with Spanish melodic sensibility to produce Son, Bolero, Mambo.',
    roots: [
      'Son Cubano — foundational Afro-Cuban form',
      'Bolero — shared romantic tradition of Cuba and Mexico',
      'Corrido — Mexican narrative ballad form',
      'Cumbia — Colombian coastal rhythm of African origin',
      'Jamaican dancehall as Reggaeton precursor',
    ],
    evolution: 'Son/Afro-Cuban roots (1920s-40s) → Mambo explosion (1950s) → Salsa New York (1970s) → Latin Pop crossover (1980s-90s) → Reggaeton breakthrough (2000s) → Urban Latin streaming dominance (2010s) → Bad Bunny era and Corridos Tumbados (2017-present).',
    keyEras: [
      '1920s-40s: Son Cubano and Bolero foundations',
      '1960s-70s: Salsa born in New York (Fania Records)',
      '2000s: Reggaeton mainstream breakthrough',
      '2010s: Urban Latin dominates streaming',
      '2017-present: Bad Bunny era, Corridos Tumbados',
    ],
    influencedBy: [
      'West African rhythmic traditions',
      'Spanish musical heritage',
      'Jamaican dancehall and reggae',
      'US hip-hop and R&B',
      'jazz (on Latin jazz)',
    ],
    influenced: [
      'global pop through massive crossover artists',
      'hip-hop sampling traditions',
      'Afrobeats rhythmic exchange',
      'K-Pop structural borrowings',
    ],
  },

  subGenres: [
    {
      name: 'Reggaeton',
      description: 'The dominant global Latin urban sound from Puerto Rico and Panama. The dembow rhythm — kick on 1, snare on the "and" of 2 — locks the body into motion. Raw, sexual, and commercially massive.',
      distinguishingFeatures: ['dembow rhythm pattern', '808 sub-bass', 'Spanish melody-rap blend', 'perreo dance culture'],
      bpmRange: { min: 85, max: 100 },
      keyArtists: ['Daddy Yankee', 'Bad Bunny', 'J Balvin', 'Don Omar'],
      productionNotes: 'Build from dembow outward. 808 kick with long sub tail. Snare on off-beat crisp and punchy. Layered hi-hats with varied velocity.',
      lyricNotes: 'Sexual desire, club energy, material flexing, romantic pursuit. Code-switching Spanish/English. Hook locked rhythmically to the dembow.',
      sunoPromptKeywords: ['reggaeton', 'dembow', 'urban Latin', 'perreo', '808 bass', 'dancehall Latino'],
      embodiedDelta: {
        microTimingAndFeel: {
          quantizationDeviation: 'Grid-locked — dembow pattern is machine-precise; human feel comes from vocal placement, not rhythm deviation',
          genreSpecificFeel: 'Asymmetric dembow bounce creates lopsided swagger; kick on 1, snare on the "and" of 2',
          aheadBehindBeat: 'Vocals sit slightly behind the grid for lazy confidence; the beat never waits',
        },
        silenceAndSpace: {
          negativeSpaceRole: 'Dembow drops as tension device — pulling the beat for 2-4 bars before bass returns',
          dynamicContrast: 'Low — everything loud, compressed, and present; dynamic range sacrificed for club impact',
        },
        regionalDialectSpecificity: {
          phoneticMarkers: ['Puerto Rican velarized "r"', 'Aspirated or dropped final "s"', 'Caribbean vowel reduction'],
          dialectVocabulary: ['perreo', 'jangueo', 'bellaqueo', 'bichiyal', 'cangri'],
          accentInfluence: 'Puerto Rican Spanish cadence is the default; Colombian and Dominican variants carry distinct rhythmic speech patterns',
        },
        genderAndBodyConventions: {
          physicalityInPerformance: 'Perreo (grinding dance) is the defining body convention — the music is incomplete without physical movement',
          genderNarratives: 'Traditional machismo coexists with disruption — Bad Bunny in gender-fluid presentation, Ivy Queen demanding consent',
          subversionExamples: ['Bad Bunny in drag/gender-fluid presentation', 'Ivy Queen\'s consent anthem "Yo Quiero Bailar"', 'Karol G claiming aggressive sexual agency'],
        },
        tempoFeelVsNumber: {
          psychologicalTempo: '88-95 BPM feels heavier and slower than anything else at that tempo — 808 sub-bass weight and asymmetric dembow create gravitational drag',
          weightAndMomentum: 'Maximum weight, moderate momentum — the music thuds rather than drives',
        },
      },
    },
    {
      name: 'Salsa',
      description: 'The incandescent Afro-Cuban-New York synthesis — full band with brass, percussion, piano, bass, organized around the sacred clave. Built for dancing and immigrant pride.',
      distinguishingFeatures: ['son clave foundation', 'brass section arrangements', 'piano montuno', 'coro-pregón call-and-response'],
      bpmRange: { min: 160, max: 220 },
      keyArtists: ['Celia Cruz', 'Tito Puente', 'Ruben Blades', 'Willie Colón'],
      productionNotes: 'Live ensemble recording essential. Percussion tight and clave-aware. Brass bright and punchy. Should feel like live performance captured.',
      lyricNotes: 'Social commentary, romantic storytelling, barrio life, Afro-Latin pride. Sonero improvises against the coro.',
      sunoPromptKeywords: ['salsa', 'Afro-Cuban', 'clave rhythm', 'brass Latin', 'montuno piano', 'Fania Records'],
      embodiedDelta: {
        microTimingAndFeel: {
          quantizationDeviation: 'Very high — every instrument sits at a different relationship to the beat; the tension between them IS the groove',
          genreSpecificFeel: 'Clave-organized polyrhythm — piano montuno, bass tumbao, and percussion each follow their own time stream around the clave',
          humanizationMarkers: ['Conga slaps slightly ahead', 'Bass tumbao locked to clave', 'Piano montuno syncopation against everything else'],
        },
        callAndResponse: {
          vocalInstrumentalDialogue: 'Coro-pregón is the beating heart — sonero improvises, chorus responds with fixed refrain in the montuno section',
          patterns: ['Sonero call / coro response', 'Trumpet section answering vocalist in mambo', 'Percussion conversations between conga and timbale'],
          audienceParticipation: 'Active — dancers are participants, not audience; the dance floor IS the show',
        },
        performancePractice: {
          improvisationConventions: 'Mandatory — sonero must improvise in the montuno; pre-written improvisation is an insult to the tradition',
          livVsRecordedDifferences: '4-minute recordings become 12-minute live jams; the montuno section extends as long as the energy demands',
          whatMakesAGoodShow: 'When the sonero and the coro achieve spiritual communion and the dance floor moves as one organism',
        },
        mistakeConventions: {
          overproductionRisks: ['Quantizing percussion kills the clave feel', 'Over-compressing brass removes live energy', 'Click tracks destroy the organic push-pull'],
          celebratedFlaws: ['Héctor Lavoe\'s vocal cracks as emotional peaks', 'Slightly out-of-tune brass as rawness', 'Crowd noise bleeding into recording'],
          authenticRoughness: 'Salsa should sound like it was recorded in a sweaty club, not a sterile studio',
        },
      },
    },
    {
      name: 'Bachata',
      description: 'Deeply romantic guitar-driven genre from the Dominican Republic. Requinto lead guitar, syncopated bass, bongos — intimate, sensual, and heartbreaking.',
      distinguishingFeatures: ['requinto guitar melodic runs', 'syncopated thumb-bass pattern', 'bongos and güira', 'desamor as primary register'],
      bpmRange: { min: 100, max: 130 },
      keyArtists: ['Romeo Santos', 'Juan Luis Guerra', 'Prince Royce', 'Aventura'],
      productionNotes: 'Guitar is central voice — requinto must be expressive with vibrato and slides. Bass syncopated. Vocals warm with romantic reverb.',
      lyricNotes: 'Heartbreak, longing, romantic obsession. Dominican Spanish. The singer is almost always the wronged party.',
      sunoPromptKeywords: ['bachata', 'Dominican romance', 'requinto guitar', 'heartbreak Latin', 'sensual guitar'],
      embodiedDelta: {
        microTimingAndFeel: {
          genreSpecificFeel: 'Behind-the-beat requinto drag — the lead guitar leans back creating aching suspense; syncopated bass chop maps to the dance step',
          aheadBehindBeat: 'Everything behind the beat — the music drags with longing, never rushing toward resolution',
        },
        regionalDialectSpecificity: {
          phoneticMarkers: ['Dominican dropped final "s"', '"L" for "r" substitution (puelta for puerta)', 'Rapid-fire speech rhythm'],
          dialectVocabulary: ['desamor', 'amargue', 'despecho', 'corazón partío'],
          accentInfluence: 'Dominican Spanish is non-negotiable — the accent IS bachata; other accents signal inauthenticity',
          regionWithinCulture: 'Born in the barrios of Santo Domingo, stigmatized as "música de amargue" (music of bitterness) before global acceptance',
        },
        socioeconomicSubtext: {
          materialConditions: 'Barrio and colmado origins — the music of Dominican working-class heartbreak, not elite salons',
          classIdentity: 'Once stigmatized as lower-class music; Aventura elevated it without erasing its roots',
        },
        genderAndBodyConventions: {
          physicalityInPerformance: 'Intimate partner dance — bodies close, hips locked, the music demands physical closeness',
          genderNarratives: 'Male vulnerability as strength — the bachatero cries openly about love; machismo is suspended',
        },
      },
    },
    {
      name: 'Cumbia',
      description: 'Colombia\'s great rhythmic gift to Latin America — hypnotic, infectious dance rhythm of African origin. Joyful, working-class, and endlessly adaptable across regional variants.',
      distinguishingFeatures: ['distinctive African-derived groove', 'accordion or marimba melody', 'laid-back behind-the-beat feel', 'regional variants across Latin America'],
      bpmRange: { min: 80, max: 110 },
      keyArtists: ['Carlos Vives', 'Totó la Momposina', 'Los Ángeles Azules', 'Selena'],
      productionNotes: 'Establish the groove early and maintain. Accordion warm and present. Percussion organic. Energy celebratory, tempo relaxed.',
      lyricNotes: 'Celebration, love, community, the joy of dancing. Unpretentious and warm. Working-class Spanish.',
      sunoPromptKeywords: ['cumbia', 'Colombian cumbia', 'accordion cumbia', 'tropical Latin', 'carnival rhythm'],
      embodiedDelta: {
        microTimingAndFeel: {
          genreSpecificFeel: 'Behind-the-beat drag with bombo silence-as-rhythm — the bass drum\'s deliberate absence on certain beats defines the groove',
          aheadBehindBeat: 'Everything leans back — cumbia never rushes; the groove is a gentle sway, not a push',
        },
        silenceAndSpace: {
          negativeSpaceRole: 'The bombo silence IS the groove — where the bass drum is NOT defines cumbia as much as where it is',
          dynamicContrast: 'Very low — cumbia maintains a steady, even energy throughout; no dramatic builds or drops',
        },
        regionalDialectSpecificity: {
          accentInfluence: 'Colombian costeño is the origin accent, but Mexican cumbia has its own vocabulary and delivery; Argentine cumbia villera is yet another dialect entirely',
          dialectVocabulary: ['cumbiambero', 'cumbia sonidera', 'rebajada', 'wepa'],
          regionWithinCulture: 'Colombian Caribbean coast origin, but adopted and transformed across all of Latin America — each country claims its own cumbia',
        },
        tempoFeelVsNumber: {
          psychologicalTempo: '90 BPM feels slower than R&B at the same tempo — the behind-beat drag and repetitive groove create a hypnotic, swaying quality',
          weightAndMomentum: 'Light and swaying — cumbia floats rather than drives; the weight is in the hips, not the chest',
        },
        socioeconomicSubtext: {
          classIdentity: 'Working-class across all variants — cumbia has never been gentrified; it remains the music of the pueblo',
          materialConditions: 'Carnival, street party, and dance hall origins; the sound of communal joy without pretension',
        },
      },
    },
    {
      name: 'Merengue',
      description: 'Dominican Republic\'s national dance music — relentless, joyful güira scraper and tambora drum creating a driving two-feel that demands immediate physical response.',
      distinguishingFeatures: ['güira constant 16th-note pulse', 'tambora two-sided drum', 'extremely fast driving two-feel', 'minimal syncopation'],
      bpmRange: { min: 120, max: 160 },
      keyArtists: ['Juan Luis Guerra', 'Wilfrido Vargas', 'Johnny Ventura'],
      productionNotes: 'Güira must be relentless. Tambora in the pocket beneath. Accordion or horn carries melody with bright tone.',
      lyricNotes: 'Celebration, dancing, love, humour. Dominican Spanish. Generally joyful — the music of joy in motion.',
      sunoPromptKeywords: ['merengue', 'Dominican merengue', 'güira rhythm', 'tropical fast', 'party Latin'],
    },
    {
      name: 'Latin Trap',
      description: 'American trap aesthetics fused with Spanish vocals — 808s, hi-hat rolls, minimalist melodies, and confessional introspection. Emotional vulnerability rarely found in US trap.',
      distinguishingFeatures: ['trap hi-hat triplet rolls', '808 sub-bass with melodic pitch', 'heavy Autotune as texture', 'darker atmospheric soundscapes'],
      bpmRange: { min: 70, max: 90 },
      keyArtists: ['Bad Bunny', 'Anuel AA', 'Jhay Cortez', 'Eladio Carrión'],
      productionNotes: 'Half-time feel common. Atmospheric pads, minimal melodic elements. Darkness and introspection in sonic character. Space carries weight.',
      lyricNotes: 'Street life, loyalty, love, existential vulnerability. Bad Bunny pioneered emotional openness within trap framework.',
      sunoPromptKeywords: ['Latin trap', 'trap en español', 'dark urban Latin', '808 Latin', 'Bad Bunny style'],
      embodiedDelta: {
        microTimingAndFeel: {
          genreSpecificFeel: 'Grid-locked 808s with half-time paradox — urgency and lethargy coexist; the beat drags while hi-hats race',
          aheadBehindBeat: 'Vocals float behind in Autotune haze; beat is mechanical while delivery is languid',
        },
        regionalDialectSpecificity: {
          accentInfluence: 'Most accent-diverse Latin genre — Puerto Rican, Dominican, Argentine, Colombian artists each bring regional cadence; Autotune partly flattens accent differences',
          phoneticMarkers: ['Heavy code-switching Spanish/English mid-line', 'Autotune as accent-flattening tool', 'Mumbled delivery borrowing from US trap'],
        },
        silenceAndSpace: {
          negativeSpaceRole: 'Space weaponized for isolation — long reverb tails and sparse production create loneliness; audible breaths between lines as intimacy markers',
          dynamicContrast: 'Moderate — drops and builds exist but are atmospheric rather than percussive',
        },
        genderAndBodyConventions: {
          genderNarratives: 'Machismo cracking open — Bad Bunny pioneered emotional vulnerability; crying, confusion, and tenderness are valid',
          vocalGenderCodes: 'Autotune as gender-blurring tool — pitch-shifted vocals create androgynous vocal space',
        },
        intertextualityAndSampling: {
          canonKnowledge: 'US trap is the sonic foundation, but emotional vulnerability is the Latin innovation — knowing both traditions is required',
          lineageSignifiers: ['808 Mafia production DNA', 'Bad Bunny\'s emotional trap blueprint', 'Reggaeton dembow fragments as cultural anchor'],
        },
      },
    },
    {
      name: 'Regional Mexicano',
      description: 'Umbrella for traditional Mexican genres — Corridos, Norteño, Banda, Mariachi. Corridos Tumbados (Peso Pluma) fuse corrido narrative with trap production and 808 bass.',
      distinguishingFeatures: ['acoustic guitar or bajo sexto', 'accordion (Norteño)', 'corrido narrative storytelling', 'trap fusion in Corridos Tumbados'],
      bpmRange: { min: 75, max: 130 },
      keyArtists: ['Peso Pluma', 'Natanael Cano', 'Fuerza Regida', 'Los Tigres del Norte'],
      productionNotes: 'Acoustic elements alongside digital production. Let the contrast be the strength. Northern Mexican accent is part of authenticity.',
      lyricNotes: 'Corrido demands specificity: names, places, events. Loyalty, betrayal, narco lifestyle. Northern Mexican Spanish — güey, compa, jefe.',
      sunoPromptKeywords: ['corridos tumbados', 'regional mexicano', 'norteño', 'acoustic trap corrido', 'Peso Pluma style'],
      embodiedDelta: {
        microTimingAndFeel: {
          genreSpecificFeel: 'Analog-digital timing collision — polka bounce of traditional norteño against trap 808 gravity in Corridos Tumbados',
          humanizationMarkers: ['Bajo sexto strum slightly ahead of grid', 'Tuba/bass following trap quantization', 'Vocal timing following corrido storytelling pace, not beat'],
        },
        regionalDialectSpecificity: {
          accentInfluence: 'Northern Mexican / Sinaloan accent is non-negotiable — the drawl, the slang, the cadence ARE the genre',
          phoneticMarkers: ['Sinaloan vowel elongation', 'Northern Mexican "ch" softening', 'Rapid-fire narco-corrido delivery'],
          dialectVocabulary: ['compa', 'plebes', 'jefe', 'plebada', 'fierro', 'güey'],
          regionWithinCulture: 'Sinaloa/Sonora/Chihuahua heartland — the border region between traditional rancho and modern urban',
        },
        callAndResponse: {
          patterns: ['Requinto guitar interludes as narrative punctuation', 'Audience singing refrains at live shows', 'Accordion answering vocal lines in norteño'],
          audienceParticipation: 'Crowd sings along to corrido refrains — knowledge of lyrics signals cultural belonging',
        },
        socioeconomicSubtext: {
          materialConditions: 'Narco economics documented but not moralized — the corrido reports, it does not judge',
          classIdentity: 'Rancho-urban straddling — traditional rural roots meeting urban trap aesthetics without abandoning either',
          politicalUndercurrent: 'Government bans on corridos tumbados only increase their cultural power and street credibility',
        },
        mistakeConventions: {
          authenticRoughness: 'Rough vocal timbre signals authenticity — too-polished voices sound fake in this context',
          overproductionRisks: ['Over-polishing acoustic guitar removes rancho feel', 'Too much Autotune contradicts corrido storytelling tradition', 'Excessive layering buries the narrative'],
        },
      },
    },
    {
      name: 'Dembow',
      description: 'The foundational Reggaeton rhythm as a distinct Dominican genre — faster, rawer, and more stripped-down. Pure rhythm distilled to mechanical essence.',
      distinguishingFeatures: ['faster than mainstream Reggaeton', 'minimal production', 'Dominican street slang', 'street credibility over radio polish'],
      bpmRange: { min: 115, max: 135 },
      keyArtists: ['El Alfa', 'Rochy RD', 'Chimbala'],
      productionNotes: 'Sparse and rhythmically aggressive. Dembow pattern relentless. Vocal production raw — no excessive polish.',
      lyricNotes: 'Street life, sexual expression, neighbourhood pride. Dominican slang heavy. Raw and unfiltered.',
      sunoPromptKeywords: ['dembow', 'Dominican dembow', 'street reggaeton', 'raw urban Latin'],
    },
    {
      name: 'Latin Pop',
      description: 'The most globally accessible form — melodically driven fusion of Latin rhythm with international pop production. From Shakira to Rosalía. Melody and emotion supreme.',
      distinguishingFeatures: ['strong memorable hooks', 'Western pop structure', 'Latin rhythmic feel beneath pop production', 'crossover appeal'],
      bpmRange: { min: 80, max: 130 },
      keyArtists: ['Shakira', 'Ricky Martin', 'Enrique Iglesias', 'Rosalía'],
      productionNotes: 'Melody is king. Blend live Latin percussion with programmed drums. Vocals centred and upfront.',
      lyricNotes: 'Love — romantic, universal. Bright accessible imagery. Bilingual code-switching for crossover. Emotional universality in Spanish.',
      sunoPromptKeywords: ['Latin pop', 'pop en español', 'romantic Latin', 'crossover Latin', 'melodic Latin'],
    },
    {
      name: 'Vallenato',
      description: 'Colombian accordion-driven folk-pop from the Caribbean coast. Narrative storytelling over accordion, caja drum, and guacharaca. The bard tradition of Colombia.',
      distinguishingFeatures: ['accordion as lead melodic voice', 'caja drum rhythm', 'narrative storytelling tradition', 'four rhythms: paseo, merengue, son, puya'],
      bpmRange: { min: 90, max: 140 },
      keyArtists: ['Carlos Vives', 'Diomedes Díaz', 'Silvestre Dangond'],
      productionNotes: 'Accordion must be warm and expressive. Caja drum provides rhythmic identity. Modern Vallenato adds pop production.',
      lyricNotes: 'Love stories, regional pride, social commentary. Colombian Caribbean Spanish. Poetic and narrative-driven.',
      sunoPromptKeywords: ['vallenato', 'Colombian accordion', 'Caribbean Colombian', 'tropical folk'],
    },
  ],

  sceneAndAudienceCodes: {
    overview: 'The Latin music audience is vast, diverse, and fiercely proud. Regional identity creates distinct communities — Mexican, Caribbean, Colombian — united by deep emotional relationship with the music.',
    fanExpectations: [
      'authentic rhythmic feel — wrong patterns detected by body',
      'Spanish with appropriate regional accent',
      'emotional commitment from the vocalist',
      'dance-floor readiness',
      'cultural specificity, not generic "Latin flavor"',
    ],
    gatekeeping: 'Moderate to high in traditional styles (Salsa purists exacting about clave). Lower in Reggaeton where hybridization is celebrated. Language is a primary gate.',
    livePerformance: 'Central to the culture. Latin audiences sing every word, dance throughout, expect full physical and emotional energy. Quinceañeras and weddings are real performance contexts.',
    fashionAndAesthetic: 'Reggaeton: streetwear luxury. Corridos Tumbados: cowboy hats meets narco-chic. Salsa: elegant eveningwear. Latin Pop: high-fashion with Latin colour.',
    crossoverPotential: 'At a historic peak. Bad Bunny sold out US stadiums singing exclusively in Spanish. Spanish-language music has achieved global dominance without requiring English crossover.',
  },

  // ── Relational & Embodied Dimensions ──────────────────────────────

  microTimingAndFeel: {
    overview: 'Clave is everything — the asymmetric rhythmic pattern that organizes time differently from Western 4/4. Every instrument in Cuban-derived styles must be "in clave" or the groove collapses. This is a fundamentally different relationship to time than European music.',
    quantizationDeviation: 'High in salsa where the tumbao bass deliberately anticipates beat 3. Moderate in cumbia where the lazy behind-the-beat feel is the soul. Low in reggaeton where the dembow is machine-locked for physical impact.',
    aheadBehindBeat: 'Salsa musicians play around the clave — some instruments push, others pull, creating a web of tension. Cumbia sits behind the beat with unhurried grace. Reggaeton is grid-locked but hi-hat variations create micro-timing interest.',
    humanizationMarkers: [
      'tumbao bass anticipation of beat 3 creating forward momentum in salsa',
      'conga player\'s subtle rush on the open tone creating urgency',
      'cumbia\'s lazy güiro scrape sitting behind the kick drum',
      'bachata guitarist\'s slight drag on the syncopated chop',
      'sonero\'s vocal phrasing floating freely against the rigid coro pattern',
    ],
    genreSpecificFeel: 'The clave is not a rhythm — it is a time-organizing principle. Playing "in clave" means every rhythmic event aligns with an invisible asymmetric grid. This creates the hypnotic, compelling quality of Afro-Cuban music that quantized Western music cannot replicate.',
  },

  silenceAndSpace: {
    overview: 'Latin music is generally dense and rhythmically saturated, but strategic silence creates devastating impact — the break before the mambo section, the percussion drop before the coro enters.',
    negativeSpaceRole: 'Silence functions as rhythmic punctuation — the bombo (bass drum hit followed by silence) in cumbia creates the genre\'s hypnotic swing. In salsa, the brief pause before the mambo section builds unbearable anticipation.',
    breathingPatterns: 'Vocal breathing is rarely exposed in Latin music — the rhythmic density fills every moment. When breath is audible in bachata ballads, it signals intimate vulnerability.',
    dynamicContrast: 'High in salsa (montuno builds to mambo explosion). Moderate in reggaeton (consistent energy with subtle layering changes). Low in cumbia and merengue (steady-state groove is the point).',
    whatIsDeliberatelyAbsent: [
      'percussion drops before mambo section to make re-entry explosive',
      'bass silence before the coro to make the hook land harder',
      'all instruments except clave to expose the rhythmic skeleton',
      'melody during pregón sections to let the sonero improvise freely',
      'dembow pattern momentary breaks to create tension in reggaeton',
    ],
  },

  callAndResponse: {
    overview: 'Call-and-response is foundational to Latin music — the coro/pregón structure of salsa is the purest form, where the lead singer (sonero) improvises against a fixed chorus response. This is directly inherited from West African and Yoruba tradition.',
    vocalInstrumentalDialogue: 'In salsa, the trumpet section and the vocalist trade phrases in the mambo section. The piano montuno and the bass tumbao interlock in constant dialogue. Every instrument is talking to every other instrument.',
    sectionInternal: 'The coro-pregón structure is the defining call-and-response: the coro sings a fixed refrain, and the sonero improvises against it, creating spontaneous emotional commentary that can last for minutes.',
    audienceParticipation: 'Latin audiences are physically involved — they dance, they sing the coro, they shout "¡Azúcar!" or "¡Wepa!" at key moments. The boundary between performer and audience dissolves on the dance floor.',
    patterns: [
      'coro sings hook, sonero improvises pregón against it (salsa)',
      'MC calls "¡Dale!" and crowd responds with movement (reggaeton)',
      'lead singer calls verse, backing vocals answer in chorus (cumbia)',
      'brass section answers vocal melody in montuno section (salsa)',
      'DJ drops the beat, crowd fills the silence with shouting (dembow)',
      'corrido narrator pauses, audience sings the refrain (regional mexicano)',
    ],
  },

  regionalDialectSpecificity: {
    overview: 'This is MASSIVE — Mexican Spanish, Puerto Rican Spanish, Colombian Spanish, Cuban Spanish, and Dominican Spanish are culturally different worlds with distinct phonetics, slang, and musical associations. Using the wrong accent in the wrong genre is immediately detected.',
    phoneticMarkers: [
      'Puerto Rican: velarized "r" (almost like French "r"), aspirated final "s"',
      'Mexican: clear, precise consonants, diminutive "-ito" usage, "güey" cadence',
      'Cuban: dropped intervocalic "d", seseo, rhythmic speech patterns',
      'Dominican: dropped final "s", "l" for "r" substitution, rapid-fire delivery',
      'Colombian coastal: dropped final consonants, melodic Caribbean intonation',
    ],
    accentInfluence: 'Puerto Rican Spanish gives reggaeton its characteristic flow — the velarized "r" and aspirated "s" create a softer, more rhythmic vocal texture. Mexican Spanish gives corridos their clarity and narrative authority. Dominican Spanish gives dembow its machine-gun verbal speed.',
    dialectVocabulary: [
      'Puerto Rican: "perreo" (grinding dance), "jangueo" (hanging out), "broki" (bro)',
      'Mexican: "güey/wey" (dude), "chido" (cool), "neta" (truth), "compa" (buddy)',
      'Cuban: "asere" (buddy), "acere" (friend), "¿qué bolá?" (what\'s up)',
      'Dominican: "vaina" (thing), "tiguere" (tough guy), "jevi" (cool)',
      'Colombian: "parce/parcero" (friend), "bacano" (cool), "chimba" (awesome)',
    ],
    regionWithinCulture: 'Puerto Rico owns reggaeton. Mexico owns corridos and regional. Cuba owns son and salsa roots. Dominican Republic owns bachata, merengue, and dembow. Colombia owns cumbia and vallenato. These are not interchangeable — each region guards its genre with pride.',
  },

  performancePractice: {
    overview: 'Dance is inseparable from Latin music performance — salsa, reggaeton, cumbia, bachata, and merengue each have specific body movements that the music is designed to facilitate. A Latin concert without dancing is a failed event.',
    improvisationConventions: 'Salsa demands improvisation — the sonero must improvise pregón against the coro, and instrumentalists solo during the mambo section. Reggaeton is more fixed but DJs improvise transitions. Corrido performance is narrative-faithful.',
    crowdInteraction: 'Latin audiences are co-performers. In salsa, the dance floor IS the show. In reggaeton, the crowd\'s perreo creates the visual spectacle. The artist must feed energy to the crowd and receive it back in a continuous loop.',
    stagePresence: 'Physical and kinetic. Salsa bandleaders conduct the energy with their bodies. Reggaeton artists command with swagger and movement. Even ballad singers sway and gesture with the rhythm. Stillness reads as disconnection.',
    livVsRecordedDifferences: 'Salsa live extends songs dramatically — 3-minute recordings become 10-minute jams with extended mambo sections. Reggaeton live shows add crowd energy but songs stay closer to studio length. Corridos live maintain faithful narrative delivery.',
    whatMakesAGoodShow: 'The dance floor is packed and moving. The sonero or MC is connecting with every section of the crowd. The energy builds continuously. People are sweating, singing, and living inside the groove. The music and the bodies become one thing.',
  },

  socioeconomicSubtext: {
    overview: 'Latin music maps onto class, race, and geography with precision. Salsa was born from Afro-Caribbean working-class immigrant communities in New York. Reggaeton emerged from Puerto Rican caseríos (housing projects). Corridos chronicle narco economics. Bachata was stigmatized as music of the Dominican poor.',
    materialConditions: 'Reggaeton emerged from public housing complexes where sound systems and MCs created entertainment from nothing. Bachata was born in Dominican barrios and brothels, shunned by the middle class for decades. Corridos narrate the economic logic of the drug trade in regions with no legal alternatives.',
    classIdentity: 'Salsa carries working-class Afro-Caribbean pride — the barrio is home, not shame. Reggaeton has moved from marginal to mainstream but retains caserio credibility. Latin Pop occupies aspirational middle-class space. Corridos Tumbados blend narco-aspirational with working-class Mexican identity.',
    politicalUndercurrent: 'Rubén Blades made salsa explicitly political. Calle 13 used reggaeton/rap for Latin American solidarity. Bad Bunny addresses gender norms and Puerto Rican independence. Corridos have always chronicled power, corruption, and resistance on the US-Mexico border.',
    implicitReferences: [
      'the barrio/caserio as origin story and identity anchor in reggaeton',
      'brand names and luxury goods as escape narrative in trap latino',
      'immigration and diaspora experience in salsa and Latin pop',
      'la calle (the street) as school of life in urban Latin genres',
      'narco economy as backdrop to Regional Mexicano storytelling',
    ],
  },

  intertextualityAndSampling: {
    overview: 'Latin music has deep intertextual traditions — reggaeton directly descends from Jamaican dancehall, salsa is in constant conversation with Cuban Son, and every corrido references a lineage of narrative ballads stretching back centuries.',
    canonKnowledge: 'Knowledge of Héctor Lavoe, Celia Cruz, and the Fania Records catalog is expected in salsa. In reggaeton, Daddy Yankee\'s "Gasolina" and Tego Calderón\'s underground roots are foundational. In corridos, Los Tigres del Norte are the patriarchs.',
    samplingTradition: 'Reggaeton frequently samples classic salsa and Latin pop — Bad Bunny sampling Héctor Lavoe connects generations. Corridos Tumbados sample corrido classics over trap beats. Latin pop samples bolero melodies for romantic authority.',
    quotationPractice: 'Lyrical references to classic songs are recognized and appreciated — quoting Lavoe or Rubén Blades in salsa signals cultural literacy. Reggaeton artists name-drop predecessors to claim lineage.',
    expectedReferences: [
      'Héctor Lavoe\'s tragic genius as the emotional benchmark for salsa',
      'Celia Cruz\'s "¡Azúcar!" as the ultimate Latin music catchphrase',
      'Daddy Yankee\'s "Gasolina" as the reggaeton big bang',
      'Los Tigres del Norte as the conscience of corrido tradition',
      'Bad Bunny as the genre-transcending modern standard',
    ],
    lineageSignifiers: [
      'clave pattern connecting any song to Afro-Cuban roots',
      'dembow pattern declaring reggaeton identity immediately',
      'requinto guitar opening identifying bachata within seconds',
      'accordion entrada signaling cumbia or norteño tradition',
      'tumbao bass pattern connecting to Son Cubano origins',
      'Jamaican dancehall riddim echoes in early reggaeton production',
    ],
  },

  genderAndBodyConventions: {
    overview: 'Latin music has strong gendered traditions — the male sonero as improviser-commander in salsa, the male MC as alpha narrator in reggaeton, the female body as dance subject. These conventions are being challenged by artists like Ivy Queen, Bad Bunny, and Rosalía.',
    vocalGenderCodes: 'Male salsa singers project powerful, authoritative tenor voices. Male reggaeton MCs use rhythmic aggression and bravado. Female voices in bachata and bolero convey romantic vulnerability. Female reggaeton artists (Ivy Queen, Karol G) claim aggressive vocal space traditionally reserved for men.',
    physicalityInPerformance: 'Dance is central and gendered — perreo in reggaeton involves specific male-female partnered movement. Salsa partner dancing has defined lead-follow roles. Solo female dancing in reggaeton has been both celebrated and debated. Male performers command space through swagger and gesture.',
    genderNarratives: 'Traditional Latin lyrics position men as romantic pursuers or heartbroken sufferers and women as objects of desire. Reggaeton\'s sexual narratives have been both criticized and reclaimed by female artists. Bad Bunny has challenged machismo by performing in drag and addressing gender fluidity.',
    subversionExamples: [
      'Ivy Queen\'s "Yo Quiero Bailar" asserting female sexual agency in reggaeton',
      'Bad Bunny performing in drag and challenging Latin masculinity norms',
      'Rosalía fusing flamenco femininity with urban aggression',
      'Karol G claiming commercial dominance in a male-dominated genre',
      'Calle 13\'s gender-conscious lyrics within reggaeton framework',
    ],
  },

  tempoFeelVsNumber: {
    overview: 'Latin music\'s relationship to tempo is radically different from Western pop because the clave and dembow organize time in asymmetric patterns that make BPM an incomplete description of rhythmic feel.',
    psychologicalTempo: 'Salsa at 180 BPM feels exhilarating rather than frantic because the clave provides a steady organizational framework within the speed. Reggaeton at 92 BPM feels heavier and more insistent than rock at the same tempo because the dembow\'s off-beat snare creates relentless forward push.',
    weightAndMomentum: 'Bachata at 115 BPM feels slow and sensual because the guitar pattern and vocal phrasing create a languorous undertow. Merengue at 140 BPM feels lighter and more joyful than metal at the same tempo because the güira creates frictionless forward motion.',
    urgencyScale: 'Low urgency in bolero (intimate, suspended time), moderate in bachata (sensual pull), high in reggaeton (physical command), extreme in salsa dura (transcendent energy), frantic in dembow (raw kinetic explosion).',
    comparisonToSameBPM: 'Salsa at 180 BPM feels completely different from punk at 180 BPM — salsa\'s clave creates organized complexity while punk creates linear aggression. Reggaeton at 92 BPM feels heavier than R&B at the same tempo because the dembow\'s asymmetric accents create a body-locking groove that R&B\'s swing doesn\'t.',
  },

  mistakeConventions: {
    overview: 'In Latin music, rhythmic mistakes are catastrophic — playing against the clave in salsa is the worst sin a musician can commit. But emotional rawness, vocal imperfection, and improvisational risk-taking are celebrated.',
    toleratedImperfections: [
      'vocal strain at emotional peaks in bachata and bolero as proof of feeling',
      'pitch variation in sonero improvisation when the rhythmic delivery is perfect',
      'rough vocal timbre in corrido singing as masculine authenticity',
      'slightly out-of-tune horn sections in live salsa as real-band credibility',
      'imperfect Spanish pronunciation by diaspora artists as authentic identity',
    ],
    celebratedFlaws: [
      'Héctor Lavoe\'s vocal cracks that made audiences weep',
      'improvised pregón that goes off-script and creates magic in salsa',
      'the raw, unpolished sound of underground reggaeton before commercial production',
      'bachata\'s humble, almost amateur recording quality as genre authenticity marker',
    ],
    overproductionRisks: [
      'quantizing salsa percussion to a click track and killing the clave feel',
      'Auto-Tune that removes the grain from a bachata singer\'s heartbreak',
      'sterile digital horn samples replacing the bite of live brass',
      'beat-correcting cumbia\'s behind-the-beat groove into rigid time',
      'over-compressing the dynamic range that gives salsa its explosive contrasts',
    ],
    authenticRoughness: 'The best Latin music sounds like human beings playing for dancers — slightly imperfect, emotionally committed, and rhythmically alive. The groove must feel organic, like a living thing breathing and sweating, not like a machine executing a program.',
  },

  sunoPromptGuide: {
    essentialKeywords: [
      'reggaeton', 'dembow', 'Latin', 'Spanish vocals',
      'bachata', 'salsa', 'cumbia', 'corridos tumbados',
      'Latin percussion', 'sensual', 'passionate',
    ],
    avoidKeywords: [
      'country twang', 'bluegrass', 'heavy metal',
      'ambient drone', 'industrial noise', 'grunge',
    ],
    promptTemplate: '[sub-genre] Latin music, [BPM] BPM, [mood], [key instrument], Spanish vocals, [regional origin] style',
    tips: [
      'Always specify the sub-genre — "Latin" is too broad; "Reggaeton" or "Bachata" gives precise target.',
      'Name the rhythm pattern: dembow, son clave, cumbia groove, merengue two-feel.',
      'Specify regional identity: Puerto Rican, Mexican, Dominican, Colombian.',
      'BPM precision: Bachata 110-120, Reggaeton 88-95, Merengue 130-155, Bolero 65-80, Salsa 160-210.',
    ],
  },
};
