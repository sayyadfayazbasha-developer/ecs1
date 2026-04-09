import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useRealtimeTranscription } from "@/hooks/useRealtimeTranscription";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  AlertTriangle,
  Activity,
  Zap,
  Save,
  RotateCcw,
  Volume2,
  AlertCircle,
  CheckCircle,
  Clock,
  Radio,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveCallAnalyzerProps {
  onCallSaved?: () => void;
}

export const LiveCallAnalyzer = ({ onCallSaved }: LiveCallAnalyzerProps) => {
  const { user } = useAuth();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alertFlash, setAlertFlash] = useState<
    "red" | "orange" | "yellow" | null
  >(null);
  const alertSoundRef = useRef<AudioContext | null>(null);

  const playAlertSound = useCallback((level: "red" | "orange" | "yellow") => {
    try {
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      alertSoundRef.current = audioContext;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const frequencies: Record<string, number[]> = {
        red: [880, 660, 880, 660, 880, 660],
        orange: [660, 550, 660, 550],
        yellow: [550, 440, 550],
      };

      const freq = frequencies[level];
      const duration = level === "red" ? 0.12 : 0.15;

      let currentTime = audioContext.currentTime;
      freq.forEach((f, index) => {
        oscillator.frequency.setValueAtTime(f, currentTime + index * duration);
      });

      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + freq.length * duration,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + freq.length * duration);

      setTimeout(
        () => {
          audioContext.close();
        },
        freq.length * duration * 1000 + 100,
      );
    } catch (error) {
      console.log("Alert sound not supported:", error);
    }
  }, []);

  const handleAnalysis = useCallback(
    (analysis: any, transcript: string) => {
      console.log("Received analysis:", analysis);

      if (analysis.shouldAlert && analysis.alertLevel !== "none") {
        setAlertFlash(analysis.alertLevel);
        playAlertSound(analysis.alertLevel);

        // Clear flash after animation
        setTimeout(() => {
          setAlertFlash(null);
        }, 2000);

        // Show toast for critical/high priority
        if (analysis.alertLevel === "red") {
          toast.error("🚨 CRITICAL EMERGENCY DETECTED", {
            description: `Keywords: ${analysis.matchedKeywords.join(", ")}`,
          });
        } else if (analysis.alertLevel === "orange") {
          toast.warning("⚠️ High Priority Alert", {
            description: `Keywords: ${analysis.matchedKeywords.join(", ")}`,
          });
        }
      }
    },
    [playAlertSound],
  );

  const transcription = useRealtimeTranscription({
    onAnalysis: handleAnalysis,
    onError: (error) => {
      toast.error("Transcription error: " + error);
    },
  });

  const audioRecorder = useAudioRecorder({
    onAudioData: transcription.sendAudio,
    sampleRate: 16000,
  });

  const startSession = useCallback(async () => {
    try {
      // Connect to transcription service first
      await transcription.connect();

      // Then start audio recording
      await audioRecorder.startRecording();

      setIsSessionActive(true);
      toast.success("Live call analysis started");
    } catch (error: any) {
      toast.error("Failed to start session: " + error.message);
      transcription.disconnect();
    }
  }, [transcription, audioRecorder]);

  const stopSession = useCallback(() => {
    audioRecorder.stopRecording();
    transcription.disconnect();
    setIsSessionActive(false);
    toast.info("Call analysis session ended");
  }, [audioRecorder, transcription]);

  const resetSession = useCallback(() => {
    transcription.reset();
    setAlertFlash(null);
  }, [transcription]);

  const saveCall = useCallback(async () => {
    if (!user) {
      toast.error("You must be logged in to save calls");
      return;
    }

    const transcript = transcription.getFullTranscript();
    if (!transcript.trim()) {
      toast.error("No transcript to save");
      return;
    }

    const analysis = transcription.currentAnalysis;

    setSaving(true);
    try {
      const { data: insertedCall, error } = await supabase
        .from("emergency_calls")
        .insert({
          user_id: user.id,
          transcript: transcript.trim(),
          urgency: analysis?.urgency || "low",
          sentiment: analysis?.sentiment || "neutral",
          sentiment_score: analysis
            ? (analysis.distressScore / 10) *
              (analysis.sentiment === "negative" ? -1 : 1)
            : 0,
          emotional_tone: analysis?.emotionalTone || "neutral",
          incident_type: analysis?.incidentType || null,
          keywords: analysis?.matchedKeywords || [],
          status: "pending",
        } as any)
        .select()
        .single();

      if (error) throw error;

      const { data: alertData, error: alertError } = await supabase.functions.invoke(
        "send-emergency-alerts",
        {
          body: {
            userId: user.id,
            callDetails: {
              transcript: transcript.trim(),
              urgency: analysis?.urgency || "low",
              location: null,
              incident_type: analysis?.incidentType || null,
              created_at: insertedCall.created_at,
            },
          },
        },
      );

      if (alertError) {
        console.error("Alert error:", alertError);
        toast.info("Call saved, but alerts could not be sent");
      } else {
        const emailSent = alertData?.results?.email?.sent ?? 0;
        const emailFailed = alertData?.results?.email?.failed ?? 0;
        const emailSkipped = alertData?.results?.email?.skipped ?? 0;
        toast.success(`Mail alerts: ${emailSent} sent/${emailFailed} failed/${emailSkipped} skipped`);
      }

      toast.success("Emergency call saved successfully");
      resetSession();
      onCallSaved?.();
    } catch (error: any) {
      toast.error("Failed to save call: " + error.message);
    } finally {
      setSaving(false);
    }
  }, [user, transcription, resetSession, onCallSaved]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSessionActive) {
        audioRecorder.stopRecording();
        transcription.disconnect();
      }
    };
  }, [isSessionActive, audioRecorder, transcription]);

  const analysis = transcription.currentAnalysis;
  const distressPercent = analysis ? (analysis.distressScore / 10) * 100 : 0;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-urgency-critical text-white";
      case "high":
        return "bg-urgency-high text-white";
      case "medium":
        return "bg-urgency-medium text-black";
      case "low":
        return "bg-urgency-low text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getAlertFlashClass = () => {
    switch (alertFlash) {
      case "red":
        return "animate-pulse border-red-500 shadow-red-500/50 shadow-2xl bg-red-500/10";
      case "orange":
        return "animate-pulse border-orange-500 shadow-orange-500/50 shadow-xl bg-orange-500/10";
      case "yellow":
        return "animate-pulse border-yellow-500 shadow-yellow-500/30 shadow-lg bg-yellow-500/5";
      default:
        return "border-border/50";
    }
  };

  return (
    <Card
      className={cn("glass transition-all duration-300", getAlertFlashClass())}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                isSessionActive
                  ? "bg-red-500/20 animate-pulse"
                  : "bg-primary/10",
              )}
            >
              {isSessionActive ? (
                <Radio className="h-5 w-5 text-red-500" />
              ) : (
                <Mic className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Live Call Analyzer</CardTitle>
              <CardDescription>
                Real-time transcription & sentiment analysis
              </CardDescription>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {transcription.status === "connected" && (
              <Badge
                variant="outline"
                className="bg-green-500/20 text-green-500 border-green-500/50"
              >
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
                Live
              </Badge>
            )}
            {transcription.status === "connecting" && (
              <Badge
                variant="outline"
                className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
              >
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                Connecting
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2">
          {!isSessionActive ? (
            <Button onClick={startSession} className="flex-1 gap-2" size="lg">
              <Mic className="h-5 w-5" />
              Start Live Analysis
            </Button>
          ) : (
            <Button
              onClick={stopSession}
              variant="destructive"
              className="flex-1 gap-2"
              size="lg"
            >
              <MicOff className="h-5 w-5" />
              Stop Session
            </Button>
          )}

          <Button
            onClick={resetSession}
            variant="outline"
            disabled={!transcription.committedTranscripts.length}
            title="Reset transcript"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            onClick={saveCall}
            variant="secondary"
            disabled={saving || !transcription.getFullTranscript().trim()}
            title="Save to database"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Analysis Dashboard */}
        {analysis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Distress Score */}
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Distress</span>
              </div>
              <div className="text-2xl font-bold">
                {analysis.distressScore.toFixed(1)}/10
              </div>
              <Progress value={distressPercent} className="h-1 mt-1" />
            </div>

            {/* Urgency */}
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Urgency</span>
              </div>
              <Badge
                className={cn("text-sm", getUrgencyColor(analysis.urgency))}
              >
                {analysis.urgency.toUpperCase()}
              </Badge>
            </div>

            {/* Emotional Tone */}
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Tone</span>
              </div>
              <span className="text-sm font-medium capitalize">
                {analysis.emotionalTone}
              </span>
            </div>

            {/* Incident Type */}
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Type</span>
              </div>
              <span className="text-sm font-medium">
                {analysis.incidentType || "Unknown"}
              </span>
            </div>
          </div>
        )}

        {/* Matched Keywords */}
        {analysis?.matchedKeywords && analysis.matchedKeywords.length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                High-Risk Keywords Detected
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.matchedKeywords.map((keyword, i) => (
                <Badge key={i} variant="destructive" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Live Transcript */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Live Transcript</span>
            {transcription.partialTranscript && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Processing...
              </Badge>
            )}
          </div>

          <ScrollArea className="h-48 rounded-lg border border-border/50 bg-background/50 p-3">
            {transcription.committedTranscripts.length === 0 &&
            !transcription.partialTranscript ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                {isSessionActive
                  ? "Listening for speech..."
                  : "Start a session to begin transcription"}
              </div>
            ) : (
              <div className="space-y-2">
                {transcription.committedTranscripts.map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{t.text}</span>
                  </div>
                ))}
                {transcription.partialTranscript && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mt-0.5 flex-shrink-0" />
                    <span className="text-sm italic">
                      {transcription.partialTranscript}
                    </span>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Audio Error */}
        {audioRecorder.error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {audioRecorder.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
