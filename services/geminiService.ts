
import { GoogleGenAI, Type } from "@google/genai";
import { SongInputs, SocialPack, UserProfile } from '../types';
import { isAllowed } from '../lib/checkMembership';
import { getUserProfile } from './userService';
import { getGenreProfile, getSubgenreSonicProfile, inferWritingProfile, validateTaxonomyCoverage } from '../lib/culturalLogic';

function buildGenreLogicBlock(inputs: SongInputs): string {
  const genreProfile = getGenreProfile(inputs.genre);
  const sonic = getSubgenreSonicProfile(inputs.subGenre);
  const writing = inferWritingProfile({
    language: inputs.language,
    genre: inputs.genre,
    subGenre: inputs.subGenre
  });

  const sonicBlock = sonic
    ? `
SUBGENRE SONIC PROFILE (${sonic.subGenre}):
- BPM: ${sonic.bpmRange}
- Groove: ${sonic.groove}
- Instrumentation: ${sonic.instrumentation}
- Production: ${sonic.productionStyle}
- Arrangement: ${sonic.arrangement}
`
    : '';

  return `
LINGUISTIC PROFILE:
- Language: ${writing.languageVariant}
- Culture/Region Lens: ${writing.cultureRegion}
- Register: ${writing.register}
- Slang Level: ${writing.slang}
- Code-switching: ${writing.codeSwitchPolicy}
- Guardrails: ${writing.authenticityGuardrails}

GENRE WRITING LOGIC (${genreProfile.genre}):
- Structure Default: ${genreProfile.defaultStructure}
- Prosody: ${genreProfile.prosody}
- Rhyme: ${genreProfile.rhymeGuidance}
- Hook: ${genreProfile.hookGuidance}
- Lexicon Policy: ${genreProfile.lexiconPolicy}
${sonicBlock}
`.trim();
}

const systemInstruction = `
You are a world-class Ghostwriter and Cultural Creative. You are an expert in the "Master Instructions for AI Songwriting" with a deep specialization in Global Music Ethnomusicology.

CRITICAL OPERATIONAL RULES:
1. SILENT MODE: You are a pure text processor. NEVER acknowledge a request. NEVER say "Here is your song" or "I have revised it". 
2. START IMMEDIATELY: Your output MUST start exactly with the requested field (usually "Title: ").
3. NO FILLER: Zero conversational text. Zero explanation of your creative choices.
4. CULTURAL LOGIC: You write IN the chosen language and culture. Use appropriate local slang, linguistic nuances, and dialectical variations (e.g., AAVE for Hip-Hop, Patois for Reggae).
5. STRUCTURE: Use [Section | vibe | instruments] tags. Use the specific instrumentation provided to influence the lyrical rhythm.
6. VOCALS: Use ALL CAPS for emphasis, (parentheses) for ad-libs.
7. PHONETIC AUTHENTICITY: Ensure the syllabic flow matches the genre's typical rhythmic signature (e.g., triplet flows for Trap, melisma for R&B).
`;

export async function* generateSong(inputs: SongInputs, email: string, userProfile?: UserProfile | null): AsyncGenerator<string> {
  const allowed = await isAllowed(email);
  if (!allowed) {
    throw new Error("Artist verification failed.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const artistContext = userProfile ? `ARTIST PERSONA: ${userProfile.display_name}. PREFERRED VIBE: ${userProfile.preferred_vibe}` : '';
    const coverageProblems = validateTaxonomyCoverage();
    const coverageNote = coverageProblems.length
      ? `TAXONOMY COVERAGE WARNING: ${coverageProblems.join(' | ')}`
      : '';
    const logicBlock = buildGenreLogicBlock(inputs);
    
    const prompt = `
      ${artistContext}
      LANGUAGE: ${inputs.language}
      CULTURAL GENRE: ${inputs.genre} (${inputs.subGenre})
      CORE INSTRUMENTATION: ${inputs.instrumentation}
      MOOD: ${inputs.emotion}
      SCENE: ${inputs.scene}
      AUDIO SPACE: ${inputs.audioEnv}
      VOCALS: ${inputs.vocals} ${inputs.duetType ? `(Collaboration Pairing: ${inputs.duetType})` : ''}
      CULTURAL OBJECTS/SCENARIO TO INCLUDE: ${inputs.mundaneObjects} | ${inputs.awkwardMoment}
      
      ${coverageNote}
      AUTHENTICITY + GENRE LOGIC (use for EVERY line and the SUNO prompt):
      ${logicBlock}
      
      CRITICAL INSTRUCTION:
      Write as a native speaker would for a ${inputs.genre} audience, consistent with the LINGUISTIC PROFILE and GENRE WRITING LOGIC above.
      Do NOT “perform” dialect with exaggerated spelling. If dialect is not explicitly specified, default to region-neutral, widely understood phrasing.
      Maintain subgenre-appropriate rhythmic phrasing and hook strategy (no generic one-size-fits-all pop cadence).
      
      OUTPUT FORMAT:
      Title: [Creative Name]
      ### SUNO Prompt
      [Detailed Style and Voice tags for Suno matching the vibe]
      ### Lyrics
      [Intro]
      ...
    `;

    const response = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.85,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    let accumulated = '';
    for await (const chunk of response) {
      if (chunk.text) {
        accumulated += chunk.text;
        yield accumulated;
      }
    }
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw new Error(error.message || "The studio agent encountered a critical error.");
  }
}

export async function generateDynamicOptions(
  targetField: string,
  currentInputs: SongInputs
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const existingValues = Object.entries(currentInputs)
    .map(([k, v]) => (typeof v === 'string' ? `${k}:${v}` : ''))
    .filter(Boolean)
    .join(' | ');
  const avoidList = new Set<string>(
    Object.values(currentInputs)
      .filter((v): v is string => typeof v === 'string' && Boolean(v))
      .map((v) => v.trim())
  );
  const prompt = `
    You are an ethnomusicologist researching music for a studio session.
    CURRENT SESSION CONTEXT:
    - Language: ${currentInputs.language || 'Any'}
    - Genre: ${currentInputs.genre || 'Any'}
    - Subgenre: ${currentInputs.subGenre || 'Any'}
    - Existing selections (do not repeat): ${existingValues || 'None'}
    TASK: Generate 6-8 authentic, creative options for "${targetField.toUpperCase()}".
    HARD RULES:
    - No option may duplicate any existing selection value.
    - All options must be unique from each other (no near-duplicates like different punctuation/casing).
    - Each option must be context-coherent with the selected language/genre/subgenre.
    Field to research: ${targetField}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const options = JSON.parse(response.text || '[]');
    if (!Array.isArray(options)) return [];
    const cleaned = options
      .map((o) => (typeof o === 'string' ? o.trim() : ''))
      .filter(Boolean);
    const uniqueByFold = new Map<string, string>();
    for (const opt of cleaned) {
      const folded = opt.toLowerCase().replace(/\s+/g, ' ').replace(/[.!,;:]+$/g, '');
      if (avoidList.has(opt)) continue;
      if (!uniqueByFold.has(folded)) uniqueByFold.set(folded, opt);
    }
    return Array.from(uniqueByFold.values()).slice(0, 8);
  } catch (e) {
    return [];
  }
}

export async function* editSong(originalSong: string, editInstruction: string, email: string): AsyncGenerator<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const lines = originalSong.trim().split('\n');
  const originalTitle = lines[0]?.startsWith('Title: ') ? lines[0] : 'Title: Untitled Draft';

  const prompt = `
    ORIGINAL SONG DATA:
    ${originalSong}

    REVISION INSTRUCTION:
    "${editInstruction}"
    
    STRICT COMPLIANCE RULES:
    1. DO NOT TALK. No "Here is the revised song". No "Sure thing". No "I've added...". 
    2. Your output MUST start with "Title: ".
    3. PRESERVE the original title "${originalTitle}" exactly unless the user asked for a new title.
    4. Maintain the structure: Title, then ### SUNO Prompt, then ### Lyrics.
    
    Generate the full revised song now. Start with Title: 
  `;

  const response = await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { 
      systemInstruction: systemInstruction,
      thinkingConfig: { thinkingBudget: 16000 }
    },
  });

  let accumulated = '';
  for await (const chunk of response) {
    if (chunk.text) {
      accumulated += chunk.text;
      yield accumulated;
    }
  }
}

export async function* structureImportedSong(rawText: string, email: string): AsyncGenerator<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `
    You are an expert musical architect and producer.
    The user has provided the following text input. It could be raw lyrics, a song idea, a few verses, or a prompt.
    
    INPUT TEXT:
    "${rawText}"
    
    TASK:
    Analyze the input and build it into a complete Studio Session.
    1. If it's a fragment or idea, expand it into a full song structure (Verses, Chorus, Bridge).
    2. If it's existing lyrics, format them into the standard studio format with Section Tags (e.g., [Verse 1], [Chorus]) and add Vocal Cues (e.g. (whispered), (shouted)).
    3. Generate a "### SUNO Prompt" block that intelligently describes the musical style suited for this text (Genre, instruments, vibe).
    4. Create a creative "Title: ..." if one isn't clear.
    
    OUTPUT FORMAT (Strict):
    Title: [Creative Name]
    ### SUNO Prompt
    [Detailed Style and Voice tags for Suno]
    ### Lyrics
    [Intro]
    ...
  `;

  const response = await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      thinkingConfig: { thinkingBudget: 16000 }
    }
  });

  let accumulated = '';
  for await (const chunk of response) {
    if (chunk.text) {
      accumulated += chunk.text;
      yield accumulated;
    }
  }
}

export async function* polishSong(currentLyrics: string, genre: string, email: string): AsyncGenerator<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `
    MASTERING POLISH MODE:
    Strictly add performance tags [Tags] and vocal cues (parentheses) for a ${genre} vibe.
    Ensure phrasing is culturally authentic to ${genre}.
    STRICT OUTPUT RULES: Return ONLY the lyrics block.
    LYRICS:
    ${currentLyrics}
  `;
  
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { 
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 8000 }
    },
  });

  let accumulated = '';
  for await (const chunk of response) {
    if (chunk.text) {
      accumulated += chunk.text;
      yield accumulated;
    }
  }
}

// ... (generateAlbumArt, generateSocialPack, translateLyrics remain unchanged)
export async function generateAlbumArt(songTitle: string, sunoPrompt: string, style: string, email: string): Promise<string> {
  const cleanTitle = songTitle.replace(/[*#]/g, '').slice(0, 50);
  const cleanStyle = style.slice(0, 30);
  const vibeSnippet = sunoPrompt.slice(0, 100);
  
  let userProfile: UserProfile | null = null;
  try { userProfile = await getUserProfile(email); } catch (e) {}

  const preferredArtStyle = userProfile?.preferred_art_style || 'Cinematic Realism';

  let basePrompt = `High-quality professional music album cover art.
    TITLE: "${cleanTitle}"
    GENRE/STYLE: ${cleanStyle}
    VISUAL STYLE: ${preferredArtStyle}
    VIBE: ${vibeSnippet}
    AESTHETIC: High-resolution, detailed, professional composition. No text (except title if relevant), no logos, no watermarks.
    Ensure the image uses a 9:16 portrait aspect ratio composition effectively.`;

  let avatarPart = null;
  try {
      if (userProfile?.avatar_url) {
          let base64Data = '';
          let mimeType = 'image/jpeg';
          let validImage = false;
          if (userProfile.avatar_url.startsWith('data:')) {
             const matches = userProfile.avatar_url.match(/^data:(.+);base64,(.+)$/);
             if (matches) {
                 mimeType = matches[1];
                 base64Data = matches[2];
                 validImage = true;
             }
          } else if (userProfile.avatar_url.startsWith('http')) {
             const resp = await fetch(userProfile.avatar_url);
             if (resp.ok) {
                 const blob = await resp.blob();
                 mimeType = blob.type;
                 const buffer = await blob.arrayBuffer();
                 let binary = '';
                 const bytes = new Uint8Array(buffer);
                 const len = bytes.byteLength;
                 for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
                 base64Data = btoa(binary);
                 validImage = true;
             }
          }
          if (validImage && base64Data) {
              avatarPart = { inlineData: { mimeType: mimeType, data: base64Data } };
          }
      }
  } catch (e) { console.warn("Avatar processing failed:", e); }

  const strategies = [];
  if (avatarPart) {
      const promptWithRef = basePrompt + `\n\nREFERENCE INSTRUCTION: The attached image is the exact character to depict. You must generate an image of THIS character in the requested scene. Maintain the character's facial structure, hair, and key features while applying the ${preferredArtStyle} visual style.`;
      strategies.push({
          name: 'HQ+Avatar',
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: promptWithRef }, avatarPart] },
          config: { imageConfig: { aspectRatio: "9:16", imageSize: "1K" } }
      });
      strategies.push({
          name: 'Std+Avatar',
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: promptWithRef }, avatarPart] },
          config: { imageConfig: { aspectRatio: "9:16" } }
      });
  }
  strategies.push({
      name: 'HQ-Text',
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: basePrompt }] },
      config: { imageConfig: { aspectRatio: "9:16", imageSize: "1K" } }
  });
  strategies.push({
      name: 'Std-Text',
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: basePrompt }] },
      config: { imageConfig: { aspectRatio: "9:16" } }
  });

  const extractImage = (response: any) => {
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) { return `data:image/png;base64,${part.inlineData.data}`; }
        }
      }
      return null;
  };

  let lastError: any = null;
  for (const strategy of strategies) {
      try {
          if (strategy.model === 'gemini-3-pro-image-preview') {
             const hasKey = await (window as any).aistudio.hasSelectedApiKey();
             if (!hasKey) { await (window as any).aistudio.openSelectKey(); }
          }
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
          const response = await ai.models.generateContent({
              model: strategy.model,
              contents: strategy.contents,
              config: strategy.config
          });
          const img = extractImage(response);
          if (img) return img;
      } catch (err: any) {
          console.warn(`[AlbumArt] Strategy ${strategy.name} failed:`, err.message);
          lastError = err;
          if (err.message?.includes("Requested entity was not found") || err.message?.includes("billing") || err.message?.includes("API key")) {
              if (strategy.model === 'gemini-3-pro-image-preview') {
                  await (window as any).aistudio.openSelectKey();
              }
              continue; 
          }
      }
  }
  if (lastError?.message?.includes("billing") || lastError?.message?.includes("API key") || lastError?.message?.includes("Requested entity was not found")) {
      await (window as any).aistudio.openSelectKey();
      throw new Error("Billing Setup Required: Please select a paid API key from a project with Gemini 3 access enabled.");
  }
  throw new Error("Failed to generate artwork. Please check your connection and try again.");
}

export async function generateSocialPack(songTitle: string, lyrics: string, email: string): Promise<SocialPack> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `Create a viral social media pack for song: "${songTitle}". Lyrics snippet: ${lyrics.slice(0, 300)}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shortDescription: { type: Type.STRING },
          instagramCaption: { type: Type.STRING },
          tiktokCaption: { type: Type.STRING },
          youtubeShortsCaption: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          cta: { type: Type.STRING },
        },
        required: ["shortDescription", "instagramCaption", "tiktokCaption", "youtubeShortsCaption", "hashtags", "cta"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function translateLyrics(lyrics: string, targetLanguage: string, email: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `Translate these lyrics to ${targetLanguage}. Maintain section tags and singable rhythm. LYRICS: ${lyrics}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return response.text || "Translation failed.";
}
