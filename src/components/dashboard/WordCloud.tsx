import { topicWordCloud } from '@/data/sampleData';
import { cn } from '@/lib/utils';

export function WordCloud() {
  const maxWeight = Math.max(...topicWordCloud.map(w => w.weight));
  
  const getWordSize = (weight: number) => {
    const ratio = weight / maxWeight;
    if (ratio > 0.8) return 'text-3xl font-bold';
    if (ratio > 0.6) return 'text-2xl font-semibold';
    if (ratio > 0.4) return 'text-xl font-medium';
    if (ratio > 0.2) return 'text-lg';
    return 'text-base';
  };

  const getWordColor = (weight: number) => {
    const ratio = weight / maxWeight;
    if (ratio > 0.8) return 'text-primary';
    if (ratio > 0.6) return 'text-accent';
    if (ratio > 0.4) return 'text-urgency-high';
    if (ratio > 0.2) return 'text-urgency-medium';
    return 'text-muted-foreground';
  };

  // Shuffle words for random positioning
  const shuffledWords = [...topicWordCloud].sort(() => Math.random() - 0.5);

  return (
    <div className="glass rounded-xl p-6 border border-border/50 animate-slide-up" style={{ animationDelay: '400ms' }}>
      <h3 className="text-lg font-semibold mb-4">Topic Word Cloud</h3>
      <div className="flex flex-wrap gap-3 items-center justify-center min-h-[200px] py-4">
        {shuffledWords.map((word, index) => (
          <span
            key={word.text}
            className={cn(
              "transition-all duration-300 hover:scale-110 cursor-default",
              getWordSize(word.weight),
              getWordColor(word.weight)
            )}
            style={{ 
              animationDelay: `${index * 50}ms`,
              opacity: 0,
              animation: `fadeIn 0.5s ease-out ${index * 50}ms forwards`
            }}
          >
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
}
