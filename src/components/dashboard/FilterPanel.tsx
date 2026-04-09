import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface FilterState {
  urgency: string[];
  sentiment: string[];
  emotionalTone: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const urgencyOptions = [
  { value: 'critical', label: 'Critical', color: 'bg-urgency-critical text-white' },
  { value: 'high', label: 'High', color: 'bg-urgency-high text-white' },
  { value: 'medium', label: 'Medium', color: 'bg-urgency-medium text-foreground' },
  { value: 'low', label: 'Low', color: 'bg-urgency-low text-white' },
];

const sentimentOptions = [
  { value: 'negative', label: 'Negative', color: 'bg-sentiment-negative text-white' },
  { value: 'neutral', label: 'Neutral', color: 'bg-sentiment-neutral text-white' },
  { value: 'positive', label: 'Positive', color: 'bg-sentiment-positive text-white' },
];

const emotionalToneOptions = [
  { value: 'panicked', label: 'Panicked', color: 'bg-sentiment-negative/80 text-white' },
  { value: 'distressed', label: 'Distressed', color: 'bg-sentiment-neutral/80 text-white' },
  { value: 'neutral', label: 'Neutral', color: 'bg-sentiment-positive/80 text-white' },
];

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const toggleFilter = (category: keyof FilterState, value: string) => {
    const currentValues = filters[category];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({
      ...filters,
      [category]: newValues,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      urgency: [],
      sentiment: [],
      emotionalTone: [],
    });
  };

  const hasActiveFilters = 
    filters.urgency.length > 0 || 
    filters.sentiment.length > 0 || 
    filters.emotionalTone.length > 0;

  return (
    <Card className="glass border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Interactive Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Urgency Level Filters */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Urgency Level
          </label>
          <div className="flex flex-wrap gap-2">
            {urgencyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleFilter('urgency', option.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filters.urgency.includes(option.value)
                    ? option.color + ' ring-2 ring-ring ring-offset-2 ring-offset-background'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sentiment Filters */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Sentiment Type
          </label>
          <div className="flex flex-wrap gap-2">
            {sentimentOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleFilter('sentiment', option.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filters.sentiment.includes(option.value)
                    ? option.color + ' ring-2 ring-ring ring-offset-2 ring-offset-background'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emotional Tone Filters */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Emotional Tone
          </label>
          <div className="flex flex-wrap gap-2">
            {emotionalToneOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleFilter('emotionalTone', option.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filters.emotionalTone.includes(option.value)
                    ? option.color + ' ring-2 ring-ring ring-offset-2 ring-offset-background'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-border/40">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Active Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.urgency.map((v) => (
                <Badge
                  key={`urgency-${v}`}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleFilter('urgency', v)}
                >
                  {v} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {filters.sentiment.map((v) => (
                <Badge
                  key={`sentiment-${v}`}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleFilter('sentiment', v)}
                >
                  {v} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {filters.emotionalTone.map((v) => (
                <Badge
                  key={`tone-${v}`}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleFilter('emotionalTone', v)}
                >
                  {v} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
