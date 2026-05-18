import 'dotenv/config';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const GEMMA_MODEL = process.env.GEMMA_MODEL || 'google/gemma-2-9b-it:free';

export interface AIAnalysisResult {
  riskCategory: 'NORMAL' | 'HIGH_RISK' | 'CRITICAL';
  score: number; // 0 to 100
  clinicalSummary: string;
  recommendedActions: string[];
  requiresEmergencyDispatch: boolean;
}

export interface StructuredSpeechMetrics {
  patientName?: string;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSat?: number;
  respiratoryRate?: number;
  hemoglobin?: number;
  weight?: number;
  height?: number;
  urineProtein?: string;
  bloodGlucose?: number;
  ironAdherence?: string;
  symptoms: string[];
  clinicalObservations: string;
}

/**
 * Standard rule-based clinical scoring fallback when API fails or times out.
 * Aligned with clinical guidelines in data.md for pre-eclampsia, anemia, and diabetes.
 */
function runClinicalRuleFallback(patient: any, visit: any): AIAnalysisResult {
  let score = 20; // baseline
  const actions: string[] = [];

  const sys = parseInt(visit.systolicBp) || 120;
  const dia = parseInt(visit.diastolicBp) || 80;
  const hr = parseInt(visit.heartRate) || 80;
  const temp = parseFloat(visit.temperature) || 98.6;
  const weight = parseFloat(visit.weight) || 60;
  const hb = parseFloat(visit.hemoglobin) || 12.0;
  const rawSymptoms = visit.symptoms || '';
  const urineProtein = visit.urineProtein || 'None';
  const bloodGlucose = parseInt(visit.bloodGlucose) || 0;
  const oxygenSat = parseInt(visit.oxygenSat) || 98;
  const ironAdherence = visit.ironAdherence || 'Yes';

  // Blood Pressure / Pre-eclampsia triggers
  if (sys >= 160 || dia >= 110) {
    score += 40;
    actions.push("URGENT: Severe pre-eclampsia protocol! Administer Magnesium Sulfate per facility guidelines and refer immediately.");
  } else if (sys >= 140 || dia >= 90) {
    score += 20;
    actions.push("Monitor Blood Pressure closely. Schedule follow-up check in 48 hours for pre-eclampsia screening.");
  }

  // Proteinuria trigger (eclampsia warning)
  if (urineProtein && urineProtein !== 'None') {
    score += 20;
    actions.push(`Proteinuria detected (${urineProtein}). Key sign of potential pre-eclampsia. Collect 24-hr urine test.`);
  }

  // Anemia / Hemoglobin triggers
  if (hb < 7.0) {
    score += 30;
    actions.push("URGENT: Severe anemia detected. Arrange immediate blood typing and cross-matching.");
  } else if (hb < 10.0) {
    score += 15;
    actions.push("Prescribe iron and folic acid supplementation. Recommend diet rich in iron (green leafy vegetables, meat).");
  }

  // Temperature / Sepsis
  if (temp >= 100.4) {
    score += 20;
    actions.push("Infection risk. Administer paracetamol and assess for obstetric sepsis or urinary tract infection.");
  }

  // Oxygen Saturation / Respiratory distress
  if (oxygenSat < 95) {
    score += 25;
    actions.push(`Low blood oxygen saturation (${oxygenSat}%). Assess respiratory rate and transfer for oxygen therapy if distressed.`);
  }

  // Gestational Diabetes markers
  if (bloodGlucose >= 140) {
    score += 15;
    actions.push(`Elevated blood glucose level (${bloodGlucose} mg/dL). Refer for oral glucose tolerance test (OGTT).`);
  }

  // Adherence
  if (ironAdherence === 'No') {
    actions.push("Encourage mother to take daily iron-folic acid supplements. Discuss side effects (dark stools, nausea) to build trust.");
  }

  // Parse text symptoms
  const symLower = rawSymptoms.toLowerCase();
  if (symLower.includes('bleed') || symLower.includes('spotting')) {
    score += 35;
    actions.push("Immediate referral to emergency obstetric care for potential antepartum hemorrhage.");
  }
  if (symLower.includes('headache') || symLower.includes('blurry') || symLower.includes('vision') || symLower.includes('head')) {
    score += 25;
    actions.push("Assess for severe pre-eclampsia neurological warning signs.");
  }
  if (symLower.includes('swell') || symLower.includes('edema')) {
    score += 10;
    actions.push("Check for pedal edema and proteinuria.");
  }

  let riskCategory: 'NORMAL' | 'HIGH_RISK' | 'CRITICAL' = 'NORMAL';
  if (score >= 60) {
    riskCategory = 'CRITICAL';
  } else if (score >= 35) {
    riskCategory = 'HIGH_RISK';
  }

  if (actions.length === 0) {
    actions.push("Continue routine antenatal care visits every 4 weeks.");
    actions.push("Maintain iron-folic acid supplements and balanced nutrition.");
  }

  return {
    riskCategory,
    score: Math.min(score, 100),
    clinicalSummary: `Rule-based assessment completed. Findings: BP ${sys}/${dia} mmHg, HB ${hb} g/dL, Pulse ${hr} bpm, SpO2 ${oxygenSat}%, Urine Protein ${urineProtein}, Sugar ${bloodGlucose || 'N/A'}. Symptoms: ${rawSymptoms || 'None reported'}.`,
    recommendedActions: actions,
    requiresEmergencyDispatch: riskCategory === 'CRITICAL',
  };
}

/**
 * Predict pregnancy risk using OpenRouter & Gemma. Falls back gracefully to expert rules.
 */
export async function analyzePregnancyRisk(patient: any, visit: any): Promise<AIAnalysisResult> {
  const fallback = runClinicalRuleFallback(patient, visit);
  
  if (!OPENROUTER_API_KEY) {
    console.log("⚠️ No OpenRouter key. Using Clinical Rule Fallback.");
    return fallback;
  }

  const prompt = `
You are a highly precise clinical AI assistant for maternal health.
Analyze the following patient and checkup visit record:

Patient Info:
- Age: ${patient.age}
- Gravida (Pregnancies): ${patient.gravida}
- Para (Births): ${patient.para}
- Medical History: ${patient.medicalHistory || 'None'}

Current Visit Metrics:
- Gestational Age (weeks): ${visit.gestationalAgeWeeks}
- Blood Pressure: ${visit.systolicBp}/${visit.diastolicBp} mmHg
- Heart Rate (Pulse): ${visit.heartRate || 80} bpm
- Hemoglobin: ${visit.hemoglobin} g/dL
- Temperature: ${visit.temperature || 98.6} °F
- Weight: ${visit.weight} kg
- Oxygen Saturation (SpO2): ${visit.oxygenSat || 98} %
- Urine Protein: ${visit.urineProtein || 'None'}
- Blood Glucose: ${visit.bloodGlucose || 'None'} mg/dL
- Iron Adherence: ${visit.ironAdherence || 'Yes'}
- Active Symptoms reported: ${visit.symptoms || 'None'}

Respond STRICTLY in JSON format with no additional text or code blocks. The JSON must match this structure exactly:
{
  "riskCategory": "NORMAL" | "HIGH_RISK" | "CRITICAL",
  "score": number (0 to 100),
  "clinicalSummary": "string summarizing key maternal risks",
  "recommendedActions": ["action 1", "action 2"],
  "requiresEmergencyDispatch": boolean
}
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://maternalink.org",
        "X-Title": "Maternalink Hub",
      },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter returned status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenRouter");

    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      riskCategory: parsed.riskCategory || fallback.riskCategory,
      score: typeof parsed.score === 'number' ? parsed.score : fallback.score,
      clinicalSummary: parsed.clinicalSummary || fallback.clinicalSummary,
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : fallback.recommendedActions,
      requiresEmergencyDispatch: !!parsed.requiresEmergencyDispatch,
    };
  } catch (err) {
    console.error("OpenRouter API analysis failed. Falling back to Expert Rules:", err);
    return fallback;
  }
}

/**
 * Transcribe spoken voice/text notes from LHW into structured clinical metrics.
 * Supports parsing patient name, BP, heart rate, hemoglobin, temperature, glucose, urine protein, and danger signs.
 */
export async function transcribeLhwSpeechNotes(spokenText: string): Promise<StructuredSpeechMetrics> {
  const defaultMetrics: StructuredSpeechMetrics = {
    hasFever: false,
    symptoms: [],
    clinicalObservations: spokenText,
  };

  // Simple local regex parser for robust instant fallback
  const lowerText = spokenText.toLowerCase();

  // Try extracting patient name (e.g. Sajida Bibi, Amna Bibi, Zainab)
  const nameMatch = spokenText.match(/(?:for|patient|patient name|patient name is|mariza|mariza ka naam|naam|amna|sajida|zainab)\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
  if (nameMatch) {
    defaultMetrics.patientName = nameMatch[1].trim();
  } else {
    // Check known names in corpus
    if (lowerText.includes('amna')) defaultMetrics.patientName = 'Amna Bibi';
    if (lowerText.includes('sajida')) defaultMetrics.patientName = 'Sajida Bibi';
    if (lowerText.includes('zainab')) defaultMetrics.patientName = 'Zainab Mai';
  }

  const bpMatch = lowerText.match(/(\d{2,3})\s*(over|\/|by)\s*(\d{2,3})/);
  if (bpMatch) {
    defaultMetrics.systolicBp = parseInt(bpMatch[1]);
    defaultMetrics.diastolicBp = parseInt(bpMatch[3]);
  }

  const hrMatch = lowerText.match(/(heart rate|pulse|pulse rate|hr|dil ki dharkan) (is |of )?(\d{2,3})/);
  if (hrMatch) {
    defaultMetrics.heartRate = parseInt(hrMatch[3]);
  }

  const tempMatch = lowerText.match(/(temp|temperature|bukhar|fever) (is |of )?(\d{2,3}(?:\.\d)?)/);
  if (tempMatch) {
    defaultMetrics.temperature = parseFloat(tempMatch[3]);
    if (defaultMetrics.temperature >= 100.4) {
      defaultMetrics.hasFever = true;
    }
  }

  const hbMatch = lowerText.match(/(hb|hemoglobin|khoon) (is |of )?(\d{1,2}(?:\.\d)?)/);
  if (hbMatch) {
    defaultMetrics.hemoglobin = parseFloat(hbMatch[3]);
  }

  const wtMatch = lowerText.match(/(weight|wazan|wt) (is |of )?(\d{2,3}(?:\.\d)?)/);
  if (wtMatch) {
    defaultMetrics.weight = parseFloat(wtMatch[3]);
  }

  const htMatch = lowerText.match(/(height|un ऊंचाई|lambai) (is |of )?(\d(?:\.\d{1,2})?)/);
  if (htMatch) {
    defaultMetrics.height = parseFloat(htMatch[3]);
  }

  const spo2Match = lowerText.match(/(spo2|oxygen|saturation|oxygen saturation) (is |of )?(\d{2,3})/);
  if (spo2Match) {
    defaultMetrics.oxygenSat = parseInt(spo2Match[3]);
  }

  const rrMatch = lowerText.match(/(resp|respiratory rate|respiratory|saans) (is |of )?(\d{2,3})/);
  if (rrMatch) {
    defaultMetrics.respiratoryRate = parseInt(rrMatch[3]);
  }

  // Urine protein checks
  if (lowerText.includes('urine protein trace') || lowerText.includes('protein trace')) {
    defaultMetrics.urineProtein = 'Trace';
  } else if (lowerText.includes('protein plus') || lowerText.includes('protein +')) {
    defaultMetrics.urineProtein = '+';
  } else if (lowerText.includes('protein ++')) {
    defaultMetrics.urineProtein = '++';
  } else if (lowerText.includes('protein +++')) {
    defaultMetrics.urineProtein = '+++';
  } else if (lowerText.includes('no protein') || lowerText.includes('protein none')) {
    defaultMetrics.urineProtein = 'None';
  }

  // Glucose sugar checks
  const sugarMatch = lowerText.match(/(sugar|glucose|blood sugar) (is |of )?(\d{2,3})/);
  if (sugarMatch) {
    defaultMetrics.bloodGlucose = parseInt(sugarMatch[3]);
  }

  // Adherence
  if (lowerText.includes('no iron') || lowerText.includes('iron tablet missed') || lowerText.includes('medicine missed')) {
    defaultMetrics.ironAdherence = 'No';
  } else if (lowerText.includes('iron daily') || lowerText.includes('tablet adherence') || lowerText.includes('iron yes')) {
    defaultMetrics.ironAdherence = 'Yes';
  }

  const possibleSymptoms = ['headache', 'bleeding', 'swelling', 'blurry', 'vision', 'dizzy', 'pain', 'nausea', 'fever'];
  possibleSymptoms.forEach(s => {
    if (lowerText.includes(s)) {
      defaultMetrics.symptoms.push(s.charAt(0).toUpperCase() + s.slice(1));
    }
  });

  if (!OPENROUTER_API_KEY) {
    return defaultMetrics;
  }

  const prompt = `
You are a highly skilled clinical transcription parser for frontline maternal health workers. 
Convert the following spoken notes into a structured JSON schema.

Spoken Notes:
"${spokenText}"

Respond STRICTLY in JSON format with no additional text or code blocks. The JSON must match this structure exactly:
{
  "patientName": "string or null (e.g. Sajida Bibi)",
  "systolicBp": number | null (e.g. 130),
  "diastolicBp": number | null (e.g. 80),
  "heartRate": number | null (pulse rate),
  "temperature": number | null (°F),
  "oxygenSat": number | null (SpO2 %),
  "respiratoryRate": number | null,
  "hemoglobin": number | null (g/dL),
  "weight": number | null (kg),
  "height": number | null (meters),
  "urineProtein": "None" | "Trace" | "+" | "++" | "+++" | null,
  "bloodGlucose": number | null (blood sugar mg/dL),
  "ironAdherence": "Yes" | "No" | null,
  "symptoms": ["Severe Headache", "Vaginal Bleeding", "Swollen Hands/Face", "Blurry Vision", "Fever", "Decreased Fetal Movement"],
  "clinicalObservations": "formal clinical summary of what she described"
}
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error();
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error();

    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      patientName: parsed.patientName || defaultMetrics.patientName,
      systolicBp: parsed.systolicBp || defaultMetrics.systolicBp,
      diastolicBp: parsed.diastolicBp || defaultMetrics.diastolicBp,
      heartRate: parsed.heartRate || defaultMetrics.heartRate,
      temperature: parsed.temperature || defaultMetrics.temperature,
      oxygenSat: parsed.oxygenSat || defaultMetrics.oxygenSat,
      respiratoryRate: parsed.respiratoryRate || defaultMetrics.respiratoryRate,
      hemoglobin: parsed.hemoglobin || defaultMetrics.hemoglobin,
      weight: parsed.weight || defaultMetrics.weight,
      height: parsed.height || defaultMetrics.height,
      urineProtein: parsed.urineProtein || defaultMetrics.urineProtein,
      bloodGlucose: parsed.bloodGlucose || defaultMetrics.bloodGlucose,
      ironAdherence: parsed.ironAdherence || defaultMetrics.ironAdherence,
      hasFever: parsed.temperature >= 100.4 || defaultMetrics.hasFever,
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : defaultMetrics.symptoms,
      clinicalObservations: parsed.clinicalObservations || defaultMetrics.clinicalObservations,
    };
  } catch {
    return defaultMetrics;
  }
}

/**
 * Expectant Mother Health Chatbot function.
 * Allows patients to ask questions in Urdu, Roman Urdu, or English about pregnancy health.
 */
export async function askMotherHealthAssistant(patient: any, visitHistory: any[], userMessage: string): Promise<string> {
  const model = GEMMA_MODEL;
  
  const visitsSummary = visitHistory && visitHistory.length > 0 ? visitHistory.map(v => 
    `Visit Date: ${new Date(v.visitDate).toLocaleDateString()}, Gestation: ${v.gestationalAgeWeeks}w, BP: ${v.systolicBp}/${v.diastolicBp} mmHg, Hb: ${v.hemoglobin}g/dL, Temp: ${v.temperature || 98.6}°F, HR: ${v.heartRate || 80} bpm, Symptoms: ${v.symptoms || 'None'}`
  ).join("\n") : 'No visit history recorded yet.';

  const prompt = `
You are "Gemma Maternal Care AI", a highly compassionate, culturally sensitive, and expert maternal health chatbot for expectant mothers in Tharparkar, Pakistan.
You have access to the following patient information:
Name: ${patient.name}
Age: ${patient.age}
Gestation History & Clinical Checkups:
${visitsSummary}

Instructions:
1. Provide warm reassurance and extremely helpful, medically accurate advice.
2. If the user asks in Urdu or Roman Urdu, respond in friendly Urdu (in Arabic script) or Roman Urdu. If in English, respond in English.
3. Keep the response concise, clear, and highly encouraging (max 3-4 sentences). Do not use jargon.
4. **CRITICAL WARNING**: If the user reports high-risk symptoms like active bleeding, severe blurry vision, swelling, fever, or extremely high blood pressure symptoms, tell them to contact their LHW or go to Mithi DHQ Hospital immediately in Urdu.

Expectant Mother's Question:
"${userMessage}"

Compassionate medical AI response:
`;

  if (!OPENROUTER_API_KEY) {
    console.log("⚠️ No OpenRouter key. Using Mock chatbot response.");
    const mockUrduResponse = "بہت شکریہ۔ میں ابھی آپ کی معلومات دیکھ رہی ہوں۔ اگر آپ کو سر میں شدید درد، دھندلا پن، یا سوجن کا سامنا ہے تو براہ کرم فوری طور پر لیڈی ہیلتھ ورکر سے رابطہ کریں۔";
    return mockUrduResponse;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://maternalink.org",
        "X-Title": "Maternalink Hub",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error();
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "بہت شکریہ۔ میں ابھی آپ کی معلومات دیکھ رہی ہوں۔ اگر آپ کو کوئی ہنگامی مسئلہ ہے تو براہ کرم فوری طور پر لیڈی ہیلتھ ورکر سے رابطہ کریں۔";
  } catch (err) {
    console.error("Chatbot response failed:", err);
    return "معذرت، عارضی نیٹ ورک کا مسئلہ ہے۔ اگر آپ کو سر میں شدید درد، دھندلا پن، یا سوجن کا سامنا ہے تو براہ کرم فوری طور پر ڈاکٹر یا قریبی ہسپتال سے رجوع کریں۔";
  }
}

/**
 * Expectant Clinical/Admin Assistant function for Staff (ADMIN, NURSE, LHW).
 * Allows staff to ask questions about clinical guidelines, patient risk telemetry, or system status.
 */
export async function askClinicalAssistant(user: any, userMessage: string, context?: string): Promise<string> {
  const model = GEMMA_MODEL;

  const prompt = `
You are "Gemma Clinical Care Director", a senior clinical strategist and maternal health AI advisor for Maternalink Hub.
You are helping a logged-in system user:
User Name: ${user.name}
User Role: ${user.role}
Requested Context: ${context || 'General'}

Instructions:
1. Provide highly professional, evidence-based medical and system administrative advice.
2. Align your responses with WHO maternal care standards and the Pakistan National Health Guidelines.
3. Be concise and structured (use bullet points if explaining steps, max 4 sentences).
4. Address clinical risks such as eclampsia (systolic BP >= 140 or diastolic >= 90), severe postpartum hemorrhage (active bleeding), and gestational diabetes.
5. If the request is administrative, guide them on operational workflows in Maternalink.

Staff Request:
"${userMessage}"

Clinical Director Response:
`;

  if (!OPENROUTER_API_KEY) {
    console.log("⚠️ No OpenRouter key. Using Mock clinical assistant response.");
    return "Thank you, clinical member. I am analyzing the maternal indicators. If there are severe signs of pre-eclampsia (BP >= 140/90 or Proteinuria), refer the patient immediately to Mithi DHQ Hospital and dispatch an emergency transport card.";
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://maternalink.org",
        "X-Title": "Maternalink Hub",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error();
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Thank you. Clinical indicators registered. Please refer to Mithi DHQ Hospital for high-risk parameters.";
  } catch (err) {
    console.error("Clinical assistant response failed:", err);
    return "Network error. Please ensure your OpenRouter API key is active. In cases of critical parameters, ensure immediate escalation protocols are triggered.";
  }
}

