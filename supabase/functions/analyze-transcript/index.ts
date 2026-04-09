import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// High-risk keywords database for emergency calls
const HIGH_RISK_KEYWORDS = {
  critical: [
    'gun', 'shooting', 'shot', 'stabbed', 'stabbing', 'knife', 'weapon',
    'bomb', 'explosion', 'terrorist', 'hostage', 'kidnap', 'murder',
    'not breathing', 'no pulse', 'unconscious', 'dying', 'dead',
    'suicide', 'overdose', 'heart attack', 'stroke', 'seizure',
    'choking', 'drowning', 'bleeding out', 'severe bleeding'
  ],
  high: [
    'fire', 'burning', 'flames', 'smoke', 'trapped', 'collapsed',
    'accident', 'crash', 'collision', 'rollover', 'hit and run',
    'assault', 'attack', 'fight', 'violence', 'beating',
    'broken', 'fracture', 'head injury', 'fell', 'fall',
    'chest pain', 'difficulty breathing', 'allergic reaction',
    'child', 'baby', 'infant', 'elderly', 'pregnant'
  ],
  medium: [
    'injury', 'hurt', 'pain', 'bleeding', 'wound', 'cut',
    'dizzy', 'faint', 'weak', 'sick', 'vomiting',
    'theft', 'robbery', 'burglary', 'break-in', 'intruder',
    'suspicious', 'threatening', 'harassment', 'domestic'
  ],
  low: [
    'minor', 'small', 'slight', 'mild', 'bruise', 'scratch',
    'noise', 'disturbance', 'complaint', 'dispute'
  ]
};

const DISTRESS_INDICATORS = {
  extreme: [
    'help me', 'please help', 'hurry', 'emergency', 'dying',
    'save', 'scared', 'terrified', 'panic', 'screaming'
  ],
  high: [
    'need help', 'come quick', 'urgent', 'serious', 'bad',
    'worried', 'afraid', 'nervous', 'anxious', 'crying'
  ],
  moderate: [
    'need', 'want', 'concern', 'issue', 'problem', 'trouble'
  ]
};

interface AnalysisResult {
  distressScore: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  sentiment: 'negative' | 'neutral' | 'positive';
  emotionalTone: 'panicked' | 'distressed' | 'neutral';
  matchedKeywords: string[];
  incidentType: string | null;
  shouldAlert: boolean;
  alertLevel: 'red' | 'orange' | 'yellow' | 'none';
}

function analyzeTranscript(text: string): AnalysisResult {
  const lowerText = text.toLowerCase();
  const matchedKeywords: string[] = [];
  let distressScore = 0;
  let maxUrgencyLevel = 0;

  for (const keyword of HIGH_RISK_KEYWORDS.critical) {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      distressScore += 3;
      maxUrgencyLevel = Math.max(maxUrgencyLevel, 4);
    }
  }

  for (const keyword of HIGH_RISK_KEYWORDS.high) {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      distressScore += 2;
      maxUrgencyLevel = Math.max(maxUrgencyLevel, 3);
    }
  }

  for (const keyword of HIGH_RISK_KEYWORDS.medium) {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      distressScore += 1;
      maxUrgencyLevel = Math.max(maxUrgencyLevel, 2);
    }
  }

  for (const keyword of HIGH_RISK_KEYWORDS.low) {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      distressScore += 0.5;
      maxUrgencyLevel = Math.max(maxUrgencyLevel, 1);
    }
  }

  let emotionalScore = 0;
  for (const indicator of DISTRESS_INDICATORS.extreme) {
    if (lowerText.includes(indicator)) {
      emotionalScore += 3;
      distressScore += 2;
    }
  }

  for (const indicator of DISTRESS_INDICATORS.high) {
    if (lowerText.includes(indicator)) {
      emotionalScore += 2;
      distressScore += 1;
    }
  }

  for (const indicator of DISTRESS_INDICATORS.moderate) {
    if (lowerText.includes(indicator)) {
      emotionalScore += 1;
      distressScore += 0.5;
    }
  }

  const exclamationCount = (text.match(/!/g) || []).length;
  distressScore += exclamationCount * 0.5;
  emotionalScore += exclamationCount * 0.3;

  const capsWords = text.match(/\b[A-Z]{2,}\b/g) || [];
  distressScore += capsWords.length * 0.5;
  emotionalScore += capsWords.length * 0.5;

  distressScore = Math.min(10, distressScore);

  let urgency: 'critical' | 'high' | 'medium' | 'low';
  if (maxUrgencyLevel >= 4 || distressScore >= 8) {
    urgency = 'critical';
  } else if (maxUrgencyLevel >= 3 || distressScore >= 5) {
    urgency = 'high';
  } else if (maxUrgencyLevel >= 2 || distressScore >= 3) {
    urgency = 'medium';
  } else {
    urgency = 'low';
  }

  let sentiment: 'negative' | 'neutral' | 'positive';
  if (distressScore >= 3 || emotionalScore >= 3) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  let emotionalTone: 'panicked' | 'distressed' | 'neutral';
  if (emotionalScore >= 5 || urgency === 'critical') {
    emotionalTone = 'panicked';
  } else if (emotionalScore >= 2 || urgency === 'high') {
    emotionalTone = 'distressed';
  } else {
    emotionalTone = 'neutral';
  }

  let incidentType: string | null = null;
  if (lowerText.includes('fire') || lowerText.includes('burning') || lowerText.includes('smoke')) {
    incidentType = 'Fire';
  } else if (lowerText.includes('accident') || lowerText.includes('crash') || lowerText.includes('collision')) {
    incidentType = 'Accident';
  } else if (lowerText.includes('medical') || lowerText.includes('heart') || lowerText.includes('breathing') || lowerText.includes('seizure')) {
    incidentType = 'Medical';
  } else if (lowerText.includes('assault') || lowerText.includes('attack') || lowerText.includes('fight') || lowerText.includes('violence')) {
    incidentType = 'Assault';
  } else if (lowerText.includes('theft') || lowerText.includes('robbery') || lowerText.includes('burglary')) {
    incidentType = 'Theft';
  } else if (lowerText.includes('gun') || lowerText.includes('shooting') || lowerText.includes('weapon')) {
    incidentType = 'Armed Incident';
  } else if (matchedKeywords.length > 0) {
    incidentType = 'Emergency';
  }

  let alertLevel: 'red' | 'orange' | 'yellow' | 'none';
  let shouldAlert = false;

  if (urgency === 'critical') {
    alertLevel = 'red';
    shouldAlert = true;
  } else if (urgency === 'high') {
    alertLevel = 'orange';
    shouldAlert = true;
  } else if (urgency === 'medium') {
    alertLevel = 'yellow';
    shouldAlert = distressScore >= 4;
  } else {
    alertLevel = 'none';
    shouldAlert = false;
  }

  return {
    distressScore,
    urgency,
    sentiment,
    emotionalTone,
    matchedKeywords: [...new Set(matchedKeywords)],
    incidentType,
    shouldAlert,
    alertLevel
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return new Response(
        JSON.stringify({ error: "Transcript is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing transcript, length:", transcript.length);

    const analysis = analyzeTranscript(transcript);

    console.log("Analysis complete:", analysis.urgency, analysis.alertLevel);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing transcript");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
