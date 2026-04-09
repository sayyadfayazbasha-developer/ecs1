import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

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

interface UseRealtimeTranscriptionOptions {
  onTranscript?: (result: TranscriptionResult) => void;
  onAnalysis?: (analysis: AnalysisResult, transcript: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'error') => void;
}

export const useRealtimeTranscription = (options: UseRealtimeTranscriptionOptions = {}) => {
  const { onTranscript, onAnalysis, onError, onStatusChange } = options;
  
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [committedTranscripts, setCommittedTranscripts] = useState<TranscriptionResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const fullTranscriptRef = useRef<string>('');
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateStatus = useCallback((newStatus: 'idle' | 'connecting' | 'connected' | 'error') => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const analyzeTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-transcript', {
        body: { transcript }
      });

      if (error) throw error;

      const analysis = data as AnalysisResult;
      setCurrentAnalysis(analysis);
      onAnalysis?.(analysis, transcript);
      
      console.log('Analysis result:', analysis);
    } catch (err: any) {
      console.error('Error analyzing transcript:', err);
    }
  }, [onAnalysis]);

  const scheduleAnalysis = useCallback(() => {
    // Clear existing timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    // Schedule analysis after 2 seconds of stability
    analysisTimeoutRef.current = setTimeout(() => {
      analyzeTranscript(fullTranscriptRef.current);
    }, 2000);
  }, [analyzeTranscript]);

  const connect = useCallback(async () => {
    try {
      updateStatus('connecting');
      
      // Get token from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');
      
      if (error || !data?.token) {
        throw new Error(error?.message || 'Failed to get transcription token');
      }

      console.log('Got ElevenLabs Scribe token');

      // Connect to ElevenLabs WebSocket with token
      const ws = new WebSocket(`wss://api.elevenlabs.io/v1/convai/scribe?token=${data.token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to ElevenLabs Scribe');
        
        // Send session config
        ws.send(JSON.stringify({
          type: 'configure',
          model_id: 'scribe_v2_realtime',
          language_code: 'en',
          sample_rate: 16000,
          encoding: 'pcm_s16le'
        }));
        
        updateStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Scribe message:', message.type, message);

          if (message.type === 'transcript' && message.is_partial) {
            const text = message.text || '';
            setPartialTranscript(text);
            onTranscript?.({ text, isFinal: false, timestamp: Date.now() });
          } else if (message.type === 'transcript' && !message.is_partial) {
            const text = message.text || '';
            fullTranscriptRef.current += ' ' + text;
            fullTranscriptRef.current = fullTranscriptRef.current.trim();
            
            const result: TranscriptionResult = { 
              text, 
              isFinal: true, 
              timestamp: Date.now() 
            };
            
            setCommittedTranscripts(prev => [...prev, result]);
            setPartialTranscript('');
            onTranscript?.(result);
            
            // Schedule analysis after new committed transcript
            scheduleAnalysis();
          } else if (message.type === 'error') {
            console.error('Scribe error:', message);
            onError?.(message.message || 'Transcription error');
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        updateStatus('error');
        onError?.('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        if (status !== 'idle') {
          updateStatus('idle');
        }
      };
    } catch (err: any) {
      console.error('Error connecting to transcription:', err);
      updateStatus('error');
      onError?.(err.message || 'Failed to connect');
    }
  }, [updateStatus, onTranscript, onError, status, scheduleAnalysis]);

  const disconnect = useCallback(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    updateStatus('idle');
    setPartialTranscript('');
    fullTranscriptRef.current = '';
  }, [updateStatus]);

  const sendAudio = useCallback((audioData: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'audio_data',
        audio_data: audioData
      }));
    }
  }, []);

  const getFullTranscript = useCallback(() => {
    return fullTranscriptRef.current;
  }, []);

  const reset = useCallback(() => {
    setPartialTranscript('');
    setCommittedTranscripts([]);
    setCurrentAnalysis(null);
    fullTranscriptRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    partialTranscript,
    committedTranscripts,
    currentAnalysis,
    connect,
    disconnect,
    sendAudio,
    getFullTranscript,
    reset
  };
};
