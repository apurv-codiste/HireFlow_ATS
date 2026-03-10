import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey && process.env.NODE_ENV !== "test") {
  console.warn(
    "[Gemini] GEMINI_API_KEY is not set. AI CV screening will fail. Get a key at https://aistudio.google.com/apikey"
  );
}

const genAI = new GoogleGenerativeAI(apiKey || "");

interface CVAnalysisResult {
  score: number;
  summary: string;
  keySkills: string[];
  matchReasons: string[];
  concerns: string[];
}

/** Model supported by Google AI Studio (https://aistudio.google.com) */
const GEMINI_MODEL = "gemini-1.5-flash";

export async function analyzeCV(
  resumeBase64: string,
  mimeType: string,
  jobDescription: string
): Promise<CVAnalysisResult> {
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env (get a key at https://aistudio.google.com/apikey)"
    );
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `You are an expert HR recruiter AI. Analyze this resume against the following job description.

Job Description:
${jobDescription}

Instructions:
1. Score the candidate from 1 to 5 (1 = poor match, 5 = excellent match)
2. Provide a 3-sentence summary of the candidate's fit
3. List key skills found in the resume
4. List reasons the candidate matches the job
5. List any concerns or gaps

Return ONLY valid JSON in this exact format, no other text:
{
  "score": <number 1-5>,
  "summary": "<3 sentence summary>",
  "keySkills": ["skill1", "skill2"],
  "matchReasons": ["reason1", "reason2"],
  "concerns": ["concern1", "concern2"]
}`;

  let result;
  try {
    result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: resumeBase64,
          mimeType: mimeType || "application/pdf",
        },
      },
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/API_KEY_INVALID|403|401|invalid.*key/i.test(msg)) {
      throw new Error(
        "Invalid GEMINI_API_KEY. Check your key at https://aistudio.google.com/apikey"
      );
    }
    throw err;
  }

  const response = result.response;
  let text: string;
  try {
    text = response.text();
  } catch {
    const blockReason =
      result.response?.promptFeedback?.blockReason ||
      "empty or blocked response";
    throw new Error(`Gemini returned no text (${blockReason}). Try another resume or check API quota.`);
  }

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  const parsed: CVAnalysisResult = JSON.parse(jsonMatch[0]);

  // Validate score range
  if (parsed.score < 1 || parsed.score > 5) {
    parsed.score = Math.max(1, Math.min(5, Math.round(parsed.score)));
  }

  return parsed;
}
