import { useMemo } from 'react';
import { EmergencyCall, emergencyCalls } from '@/data/sampleData';
import { syntheticEmergencyCalls, SyntheticEmergencyCall } from '@/data/emergencyDatasets';
import { FilterState } from '@/components/dashboard/FilterPanel';

export function useFilteredData(filters: FilterState) {
  const filteredEmergencyCalls = useMemo(() => {
    return emergencyCalls.filter((call) => {
      const urgencyMatch =
        filters.urgency.length === 0 || filters.urgency.includes(call.urgency);
      const sentimentMatch =
        filters.sentiment.length === 0 || filters.sentiment.includes(call.sentiment);
      return urgencyMatch && sentimentMatch;
    });
  }, [filters.urgency, filters.sentiment]);

  const filteredSyntheticCalls = useMemo(() => {
    return syntheticEmergencyCalls.filter((call) => {
      const urgencyMatch =
        filters.urgency.length === 0 || filters.urgency.includes(call.urgencyLevel);
      const toneMatch =
        filters.emotionalTone.length === 0 || filters.emotionalTone.includes(call.emotionalTone);
      return urgencyMatch && toneMatch;
    });
  }, [filters.urgency, filters.emotionalTone]);

  // Calculate filtered statistics
  const filteredStats = useMemo(() => {
    const totalCalls = filteredEmergencyCalls.length;
    const criticalCalls = filteredEmergencyCalls.filter(c => c.urgency === 'critical').length;
    const highCalls = filteredEmergencyCalls.filter(c => c.urgency === 'high').length;
    const mediumCalls = filteredEmergencyCalls.filter(c => c.urgency === 'medium').length;
    const lowCalls = filteredEmergencyCalls.filter(c => c.urgency === 'low').length;
    
    const avgSentiment = totalCalls > 0
      ? filteredEmergencyCalls.reduce((acc, c) => acc + c.sentimentScore, 0) / totalCalls
      : 0;

    const negativeCalls = filteredEmergencyCalls.filter(c => c.sentiment === 'negative').length;
    const neutralCalls = filteredEmergencyCalls.filter(c => c.sentiment === 'neutral').length;
    const positiveCalls = filteredEmergencyCalls.filter(c => c.sentiment === 'positive').length;

    return {
      totalCalls,
      criticalCalls,
      highCalls,
      mediumCalls,
      lowCalls,
      avgSentiment,
      negativeCalls,
      neutralCalls,
      positiveCalls,
      urgencyDistribution: [
        { name: 'Critical', value: criticalCalls, color: 'hsl(0, 85%, 60%)' },
        { name: 'High', value: highCalls, color: 'hsl(25, 95%, 55%)' },
        { name: 'Medium', value: mediumCalls, color: 'hsl(45, 95%, 55%)' },
        { name: 'Low', value: lowCalls, color: 'hsl(142, 70%, 45%)' },
      ],
      sentimentDistribution: [
        { name: 'Negative', value: negativeCalls, color: 'hsl(0, 72%, 55%)' },
        { name: 'Neutral', value: neutralCalls, color: 'hsl(220, 15%, 50%)' },
        { name: 'Positive', value: positiveCalls, color: 'hsl(142, 70%, 45%)' },
      ],
    };
  }, [filteredEmergencyCalls]);

  // Calculate filtered synthetic stats
  const filteredSyntheticStats = useMemo(() => {
    const byTone = {
      neutral: filteredSyntheticCalls.filter(c => c.emotionalTone === 'neutral').length,
      distressed: filteredSyntheticCalls.filter(c => c.emotionalTone === 'distressed').length,
      panicked: filteredSyntheticCalls.filter(c => c.emotionalTone === 'panicked').length,
    };

    const byUrgency = {
      critical: filteredSyntheticCalls.filter(c => c.urgencyLevel === 'critical').length,
      high: filteredSyntheticCalls.filter(c => c.urgencyLevel === 'high').length,
      medium: filteredSyntheticCalls.filter(c => c.urgencyLevel === 'medium').length,
      low: filteredSyntheticCalls.filter(c => c.urgencyLevel === 'low').length,
    };

    return {
      totalCalls: filteredSyntheticCalls.length,
      byEmotionalTone: byTone,
      byUrgency,
    };
  }, [filteredSyntheticCalls]);

  return {
    filteredEmergencyCalls,
    filteredSyntheticCalls,
    filteredStats,
    filteredSyntheticStats,
  };
}
