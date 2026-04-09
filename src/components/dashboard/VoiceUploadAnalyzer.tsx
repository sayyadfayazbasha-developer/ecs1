import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileAudio, Loader2, AlertTriangle, CheckCircle2, X, History, Clock, Trash2, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

interface PastTranscript {
  id: string;
  transcript: string;
  urgency: string;
  sentiment: string;
  emotional_tone: string;
  incident_type: string | null;
  keywords: string[] | null;
  sentiment_score: number;
  created_at: string;
}

export const VoiceUploadAnalyzer: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'idle' | 'uploading' | 'transcribing' | 'analyzing'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [pastTranscripts, setPastTranscripts] = useState<PastTranscript[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedTranscript, setSelectedTranscript] = useState<PastTranscript | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPastTranscripts();
  }, [user]);

  const fetchPastTranscripts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('emergency_calls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPastTranscripts(data || []);
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/mp4'];
      if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
        toast.error('Please upload a valid audio file (MP3, WAV, WebM, OGG, M4A)');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        return;
      }
      setSelectedFile(file);
      setTranscript('');
      setAnalysis(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const clearFile = () => {
    setSelectedFile(null);
    setTranscript('');
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processAudio = async () => {
    if (!selectedFile || !user) return;

    setIsProcessing(true);
    setProcessingStep('uploading');

    try {
      setProcessingStep('transcribing');
      
      const formData = new FormData();
      formData.append('audio', selectedFile);

      const transcribeResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-transcribe`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!transcribeResponse.ok) {
        const error = await transcribeResponse.json();
        throw new Error(error.error || 'Transcription failed');
      }

      const transcriptionResult = await transcribeResponse.json();
      const transcriptText = transcriptionResult.text || '';
      
      if (!transcriptText.trim()) {
        throw new Error('No speech detected in the audio file');
      }
      
      setTranscript(transcriptText);
      toast.success('Transcription complete');

      setProcessingStep('analyzing');
      
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-transcript', {
        body: { transcript: transcriptText }
      });

      if (analysisError) {
        throw new Error(analysisError.message || 'Analysis failed');
      }

      const result = analysisData as AnalysisResult;
      setAnalysis(result);

      // Save to database
      const { error: insertError } = await supabase
        .from('emergency_calls')
        .insert({
          user_id: user.id,
          transcript: transcriptText,
          urgency: result.urgency,
          sentiment: result.sentiment,
          sentiment_score: result.distressScore,
          emotional_tone: result.emotionalTone,
          incident_type: result.incidentType,
          keywords: result.matchedKeywords,
          status: 'pending',
        });

      if (insertError) {
        console.error('Failed to save transcript:', insertError);
      } else {
        fetchPastTranscripts();
      }

      toast.success('Analysis complete & saved');

    } catch (error: any) {
      console.error('Processing error:', error);
      toast.error(error.message || 'Failed to process audio');
    } finally {
      setIsProcessing(false);
      setProcessingStep('idle');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('emergency_calls').delete().eq('id', id);
      if (error) throw error;
      setPastTranscripts(prev => prev.filter(t => t.id !== id));
      if (selectedTranscript?.id === id) setSelectedTranscript(null);
      toast.success('Transcript deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleReanalyze = async (item: PastTranscript) => {
    setIsReanalyzing(true);
    try {
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-transcript', {
        body: { transcript: item.transcript }
      });

      if (analysisError) throw new Error(analysisError.message || 'Re-analysis failed');

      const result = analysisData as AnalysisResult;

      const { error: updateError } = await supabase
        .from('emergency_calls')
        .update({
          urgency: result.urgency,
          sentiment: result.sentiment,
          sentiment_score: result.distressScore,
          emotional_tone: result.emotionalTone,
          incident_type: result.incidentType,
          keywords: result.matchedKeywords,
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      const updated = {
        ...item,
        urgency: result.urgency,
        sentiment: result.sentiment,
        sentiment_score: result.distressScore,
        emotional_tone: result.emotionalTone,
        incident_type: result.incidentType,
        keywords: result.matchedKeywords,
      };
      setPastTranscripts(prev => prev.map(t => t.id === item.id ? updated : t));
      setSelectedTranscript(updated);
      toast.success('Re-analysis complete & saved');
    } catch (error: any) {
      toast.error(error.message || 'Re-analysis failed');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'negative': return 'text-red-500';
      case 'positive': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getAlertBorderColor = (alertLevel: string) => {
    switch (alertLevel) {
      case 'red': return 'border-red-500 bg-red-500/10';
      case 'orange': return 'border-orange-500 bg-orange-500/10';
      case 'yellow': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Voice Recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
              id="audio-upload"
            />
            
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <FileAudio className="h-10 w-10 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile} disabled={isProcessing}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={processAudio} disabled={isProcessing} className="w-full max-w-xs">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {processingStep === 'transcribing' ? 'Transcribing...' : 'Analyzing...'}
                    </>
                  ) : (
                    'Analyze Recording'
                  )}
                </Button>
              </div>
            ) : (
              <label htmlFor="audio-upload" className="cursor-pointer">
                <FileAudio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-1">Drop your audio file here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse (MP3, WAV, WebM, OGG, M4A - Max 20MB)
                </p>
                <Button variant="outline" asChild>
                  <span>Select File</span>
                </Button>
              </label>
            )}
          </div>

          {isProcessing && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{processingStep === 'transcribing' ? '50%' : '90%'}</span>
              </div>
              <Progress value={processingStep === 'transcribing' ? 50 : 90} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Transcript */}
      {transcript && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card className={`border-2 ${getAlertBorderColor(analysis.alertLevel)}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {analysis.shouldAlert && <AlertTriangle className="h-5 w-5 text-destructive" />}
                Analysis Results
              </span>
              <Badge className={getUrgencyColor(analysis.urgency)}>
                {analysis.urgency.toUpperCase()} URGENCY
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Distress Score</span>
                <span className="text-sm font-bold">{analysis.distressScore}%</span>
              </div>
              <Progress 
                value={analysis.distressScore} 
                className={analysis.distressScore > 70 ? '[&>div]:bg-red-500' : analysis.distressScore > 40 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
                <p className={`font-semibold capitalize ${getSentimentColor(analysis.sentiment)}`}>
                  {analysis.sentiment}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Emotional Tone</p>
                <p className="font-semibold capitalize">{analysis.emotionalTone}</p>
              </div>
              {analysis.incidentType && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Incident Type</p>
                  <p className="font-semibold capitalize">{analysis.incidentType}</p>
                </div>
              )}
            </div>

            {analysis.matchedKeywords.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Detected Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.matchedKeywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-destructive border-destructive">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.shouldAlert && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-semibold text-destructive">
                    Alert Level: {analysis.alertLevel.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  This recording contains indicators of an emergency situation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Past Transcripts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Past Transcripts
            <Badge variant="secondary" className="ml-2">{pastTranscripts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : pastTranscripts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transcripts yet. Upload an audio file to get started.
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {pastTranscripts.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getUrgencyColor(item.urgency)} >{item.urgency}</Badge>
                          <Badge variant="outline" className={getSentimentColor(item.sentiment)}>{item.sentiment}</Badge>
                          <Badge variant="outline">{item.emotional_tone}</Badge>
                        </div>
                        <p className="text-sm text-foreground/90 line-clamp-2">{item.transcript}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                          {item.incident_type && (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {item.incident_type}
                            </span>
                          )}
                        </div>
                        {item.keywords && item.keywords.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {item.keywords.slice(0, 5).map((kw, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedTranscript(item)}
                          className="text-muted-foreground hover:text-primary shrink-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedTranscript} onOpenChange={(open) => !open && setSelectedTranscript(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTranscript && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Transcript Details</span>
                  <div className="flex items-center gap-2">
                    <Badge className={getUrgencyColor(selectedTranscript.urgency)}>
                      {selectedTranscript.urgency.toUpperCase()}
                    </Badge>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(new Date(selectedTranscript.created_at), 'MMMM d, yyyy HH:mm:ss')}
                </div>

                {/* Full Transcript */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Full Transcript</h4>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedTranscript.transcript}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Urgency</p>
                    <p className="font-semibold capitalize">{selectedTranscript.urgency}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
                    <p className={`font-semibold capitalize ${getSentimentColor(selectedTranscript.sentiment)}`}>{selectedTranscript.sentiment}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Emotional Tone</p>
                    <p className="font-semibold capitalize">{selectedTranscript.emotional_tone}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Distress Score</p>
                    <p className="font-semibold">{selectedTranscript.sentiment_score}%</p>
                  </div>
                  {selectedTranscript.incident_type && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Incident Type</p>
                      <p className="font-semibold capitalize">{selectedTranscript.incident_type}</p>
                    </div>
                  )}
                </div>

                {/* Distress Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Distress Score</span>
                    <span className="text-sm font-bold">{selectedTranscript.sentiment_score}%</span>
                  </div>
                  <Progress 
                    value={selectedTranscript.sentiment_score} 
                    className={selectedTranscript.sentiment_score > 70 ? '[&>div]:bg-red-500' : selectedTranscript.sentiment_score > 40 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}
                  />
                </div>

                {/* Keywords */}
                {selectedTranscript.keywords && selectedTranscript.keywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Detected Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTranscript.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-destructive border-destructive">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Re-analyze Button */}
                <Button
                  onClick={() => handleReanalyze(selectedTranscript)}
                  disabled={isReanalyzing}
                  variant="outline"
                  className="w-full"
                >
                  {isReanalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Re-analyzing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-analyze Transcript
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
