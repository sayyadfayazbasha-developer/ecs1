import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EmergencyCall {
  id: string;
  transcript: string;
  urgency: string;
  sentiment: string;
  sentiment_score: number;
  emotional_tone: string;
  incident_type: string | null;
  location: string | null;
  keywords: string[] | null;
  created_at: string;
  user_id: string | null;
  recipient_id: string | null;
  status?: string;
}

const urgencyConfig = {
  critical: { title: '🚨 CRITICAL EMERGENCY', variant: 'destructive' as const, sound: 'critical' },
  high: { title: '⚠️ High Priority Call', variant: 'destructive' as const, sound: 'high' },
  medium: { title: '📞 New Emergency Call', variant: 'default' as const, sound: 'medium' },
  low: { title: '📋 Low Priority Call', variant: 'default' as const, sound: 'low' },
};

// Simple beep sound generator using Web Audio API
const playNotificationSound = (urgency: string) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different urgency levels
    const frequencies: Record<string, number[]> = {
      critical: [880, 660, 880, 660, 880], // Rapid alternating high tones
      high: [660, 550, 660], // Triple beep
      medium: [550, 440], // Double beep
      low: [440], // Single beep
    };
    
    const freq = frequencies[urgency] || frequencies.low;
    const duration = urgency === 'critical' ? 0.15 : 0.2;
    
    let currentTime = audioContext.currentTime;
    
    freq.forEach((f, index) => {
      oscillator.frequency.setValueAtTime(f, currentTime + index * duration);
    });
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + freq.length * duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + freq.length * duration);
    
    // Cleanup
    setTimeout(() => {
      audioContext.close();
    }, freq.length * duration * 1000 + 100);
  } catch (error) {
    console.log('Audio notification not supported:', error);
  }
};

export const useEmergencyCallNotifications = (enabled: boolean = true) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!enabled || !user || isSubscribed.current) return;

    const channel = supabase
      .channel('emergency-calls-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergency_calls',
        },
        async (payload) => {
          const newCall = payload.new as EmergencyCall;
          
          // Only notify if current user is the recipient
          if (newCall.recipient_id !== user.id) return;

          const config = urgencyConfig[newCall.urgency as keyof typeof urgencyConfig] || urgencyConfig.low;
          
          // Fetch caller info
          let callerEmail = 'Unknown caller';
          if (newCall.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('user_id', newCall.user_id)
              .single();
            if (profile) {
              callerEmail = profile.email;
            }
          }
          
          // Play sound effect
          playNotificationSound(newCall.urgency);
          
          // Show toast notification
          toast({
            title: `${config.title} - Incoming Call!`,
            description: `From: ${callerEmail}. ${newCall.incident_type || 'Emergency'} - ${newCall.location || 'Unknown location'}`,
            variant: config.variant,
          });
          
          console.log('New emergency call received:', newCall);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emergency_calls',
        },
        async (payload) => {
          const updatedCall = payload.new as EmergencyCall;
          const oldCall = payload.old as EmergencyCall;
          
          // Only notify the caller when their call status changes
          if (updatedCall.user_id !== user.id) return;
          if (updatedCall.status === oldCall.status) return;

          // Fetch recipient info
          let recipientEmail = 'Contact';
          if (updatedCall.recipient_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('user_id', updatedCall.recipient_id)
              .single();
            if (profile) {
              recipientEmail = profile.email;
            }
          }

          const statusMessages: Record<string, { title: string; description: string }> = {
            'acknowledged': {
              title: '✓ Call Acknowledged',
              description: `${recipientEmail} has acknowledged your emergency call`
            },
            'resolved': {
              title: '✓✓ Call Resolved',
              description: `Your emergency call to ${recipientEmail} has been resolved`
            }
          };

          const message = statusMessages[updatedCall.status || ''];
          if (message) {
            playNotificationSound('low');
            toast({
              title: message.title,
              description: message.description,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribed.current = true;
          console.log('Subscribed to emergency calls realtime updates');
        }
      });

    return () => {
      isSubscribed.current = false;
      supabase.removeChannel(channel);
    };
  }, [enabled, user, toast]);
};