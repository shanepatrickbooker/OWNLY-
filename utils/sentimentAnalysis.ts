import Sentiment from 'sentiment';

const sentiment = new Sentiment();

export interface SentimentResult {
  score: number;
  comparative: number;
  positive: string[];
  negative: string[];
  wordCount: number;
}

export interface MoodInsight {
  type: 'nuanced_emotions' | 'contextual_patterns' | 'length_variation' | 'temporal_patterns' | 
        'day_of_week_patterns' | 'time_of_day_patterns' | 'trigger_identification' | 
        'progress_recognition' | 'coping_recognition' | 'environmental_awareness';
  observation: string;
  supportingData?: any;
  priority: 'high' | 'medium' | 'low'; // For sorting by relevance
  actionableSuggestion?: string; // Optional follow-up suggestion
}

export const analyzeSentiment = (text: string): SentimentResult => {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      comparative: 0,
      positive: [],
      negative: [],
      wordCount: 0
    };
  }

  const result = sentiment.analyze(text);
  
  return {
    score: result.score,
    comparative: result.comparative,
    positive: result.positive,
    negative: result.negative,
    wordCount: result.tokens.length
  };
};

export const generateInsights = (entries: Array<{
  mood_value: number;
  mood_label: string;
  reflection?: string;
  sentiment_data?: SentimentResult;
  created_at: string;
}>): MoodInsight[] => {
  const insights: MoodInsight[] = [];
  
  if (entries.length < 3) {
    return insights; // Need at least 3 entries for meaningful patterns
  }

  const entriesWithReflections = entries.filter(e => e.reflection && e.reflection.trim().length > 0);
  
  if (entriesWithReflections.length < 2) {
    return insights; // Need reflections to analyze
  }

  // 1. Nuanced emotions insight - compare mood ratings vs sentiment
  const moodVsSentimentDiscrepancies = entriesWithReflections.filter(entry => {
    if (!entry.sentiment_data) return false;
    
    const moodNormalized = (entry.mood_value - 1) / 4;
    const sentimentNormalized = Math.max(-1, Math.min(1, entry.sentiment_data.comparative * 5));
    const sentimentPositive = (sentimentNormalized + 1) / 2;
    
    return Math.abs(moodNormalized - sentimentPositive) > 0.3;
  });

  if (moodVsSentimentDiscrepancies.length >= 2) {
    insights.push({
      type: 'nuanced_emotions',
      observation: 'Your written reflections reveal more complexity than your mood ratings suggest',
      priority: 'low',
      actionableSuggestion: 'Trust the depth of your written reflections - they capture nuances that simple ratings might miss'
    });
  }

  // 2. Day of week patterns
  const dayPatterns = analyzeDayOfWeekPatterns(entries);
  if (dayPatterns) {
    insights.push(dayPatterns);
  }

  // 3. Time of day patterns
  const timePatterns = analyzeTimeOfDayPatterns(entries);
  if (timePatterns) {
    insights.push(timePatterns);
  }

  // 4. Trigger identification
  const triggers = identifyTriggers(entriesWithReflections);
  if (triggers) {
    insights.push(triggers);
  }

  // 5. Progress recognition
  const progress = recognizeProgress(entries, entriesWithReflections);
  if (progress) {
    insights.push(progress);
  }

  // 6. Coping recognition
  const coping = recognizeCopingPatterns(entries);
  if (coping) {
    insights.push(coping);
  }

  // 7. Environmental awareness
  const environmental = analyzeEnvironmentalPatterns(entries);
  if (environmental) {
    insights.push(environmental);
  }

  // 8. Length variation patterns (existing)
  const reflectionLengths = entriesWithReflections.map(e => e.reflection!.split(' ').length);
  const avgLength = reflectionLengths.reduce((a, b) => a + b, 0) / reflectionLengths.length;
  const lengthVariation = Math.max(...reflectionLengths) - Math.min(...reflectionLengths);
  
  if (lengthVariation > avgLength * 0.8) {
    const longEntries = entriesWithReflections.filter(e => e.reflection!.split(' ').length > avgLength * 1.3);
    const difficultExperiences = longEntries.filter(e => 
      e.sentiment_data && e.sentiment_data.comparative < 0
    );
    
    if (difficultExperiences.length >= 1) {
      insights.push({
        type: 'length_variation',
        observation: 'You tend to write more when working through difficult experiences',
        priority: 'low',
        actionableSuggestion: 'Writing more during tough times is a healthy way to process emotions'
      });
    }
  }

  // 9. Contextual patterns (existing)
  const negativeEntries = entriesWithReflections.filter(entry => 
    entry.sentiment_data && entry.sentiment_data.comparative < -0.1
  );
  
  if (negativeEntries.length >= 2) {
    const commonWords = findCommonContextWords(negativeEntries);
    const topWord = commonWords[0];
    
    if (topWord && topWord.count >= 2) {
      insights.push({
        type: 'contextual_patterns',
        observation: `${topWord.word} comes up often during more challenging times`,
        priority: 'medium',
        actionableSuggestion: `Pay attention to how different ${topWord.word} situations affect you`,
        supportingData: { word: topWord.word, frequency: topWord.count }
      });
    }
  }

  // Sort insights by priority (high first, then medium, then low)
  const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
};

const findCommonContextWords = (entries: Array<{ reflection?: string }>): Array<{ word: string; count: number }> => {
  const wordCounts: Record<string, number> = {};
  
  // Common context words to look for
  const contextWords = [
    'work', 'job', 'boss', 'colleague', 'meeting', 'deadline', 'project',
    'family', 'partner', 'friend', 'relationship', 'parent', 'child',
    'school', 'study', 'exam', 'homework', 'teacher', 'class',
    'money', 'financial', 'bills', 'budget', 'expense', 'income',
    'health', 'sick', 'tired', 'sleep', 'doctor', 'pain',
    'weather', 'rain', 'sunny', 'cold', 'hot',
    'home', 'house', 'apartment', 'room', 'kitchen'
  ];
  
  entries.forEach(entry => {
    if (entry.reflection) {
      const words = entry.reflection.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (contextWords.includes(cleanWord) && cleanWord.length > 2) {
          wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
        }
      });
    }
  });
  
  return Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

const calculateAverageSentiment = (entries: Array<{ sentiment_data?: SentimentResult }>): number => {
  const validEntries = entries.filter(e => e.sentiment_data);
  if (validEntries.length === 0) return 0;
  
  const sum = validEntries.reduce((acc, entry) => acc + entry.sentiment_data!.comparative, 0);
  return sum / validEntries.length;
};

// New insight analysis functions

const analyzeDayOfWeekPatterns = (entries: Array<{ mood_value: number; created_at: string }>): MoodInsight | null => {
  if (entries.length < 7) return null;

  const dayMoods: Record<string, number[]> = {
    'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 
    'Friday': [], 'Saturday': [], 'Sunday': []
  };

  entries.forEach(entry => {
    const date = new Date(entry.created_at);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    dayMoods[dayName].push(entry.mood_value);
  });

  // Calculate average mood for each day
  const dayAverages: Record<string, number> = {};
  Object.entries(dayMoods).forEach(([day, moods]) => {
    if (moods.length > 0) {
      dayAverages[day] = moods.reduce((a, b) => a + b, 0) / moods.length;
    }
  });

  // Find patterns
  const sortedDays = Object.entries(dayAverages).sort(([,a], [,b]) => a - b);
  if (sortedDays.length < 3) return null;

  const lowestDay = sortedDays[0];
  const highestDay = sortedDays[sortedDays.length - 1];
  
  if (Math.abs(lowestDay[1] - highestDay[1]) > 0.8) {
    if (lowestDay[0] === 'Monday' && lowestDay[1] < 3) {
      return {
        type: 'day_of_week_patterns',
        observation: 'Mondays tend to be tougher for you',
        priority: 'medium',
        actionableSuggestion: 'Consider preparing something positive for Monday mornings',
        supportingData: { lowestDay: lowestDay[0], average: lowestDay[1].toFixed(1) }
      };
    } else {
      return {
        type: 'day_of_week_patterns',
        observation: `${lowestDay[0]}s tend to be lower energy while ${highestDay[0]}s are typically brighter`,
        priority: 'medium',
        supportingData: { lowestDay: lowestDay[0], highestDay: highestDay[0] }
      };
    }
  }

  return null;
};

const analyzeTimeOfDayPatterns = (entries: Array<{ mood_value: number; sentiment_data?: SentimentResult; created_at: string }>): MoodInsight | null => {
  if (entries.length < 6) return null;

  const morningEntries = entries.filter(e => {
    const hour = new Date(e.created_at).getHours();
    return hour >= 6 && hour < 12;
  });

  const eveningEntries = entries.filter(e => {
    const hour = new Date(e.created_at).getHours();
    return hour >= 18 && hour <= 23;
  });

  if (morningEntries.length < 2 || eveningEntries.length < 2) return null;

  const morningAvgSentiment = calculateAverageSentiment(morningEntries);
  const eveningAvgSentiment = calculateAverageSentiment(eveningEntries);

  if (Math.abs(morningAvgSentiment - eveningAvgSentiment) > 0.3) {
    const pattern = morningAvgSentiment > eveningAvgSentiment ? 
      'Morning check-ins tend to show more forward-looking language while evening entries are more reflective' :
      'Evening check-ins show different emotional processing patterns compared to morning entries';
    
    return {
      type: 'time_of_day_patterns',
      observation: pattern,
      priority: 'medium',
      supportingData: { morningCount: morningEntries.length, eveningCount: eveningEntries.length }
    };
  }

  return null;
};

const identifyTriggers = (entriesWithReflections: Array<{ mood_value: number; reflection?: string }>): MoodInsight | null => {
  if (entriesWithReflections.length < 5) return null;

  const frustratedEntries = entriesWithReflections.filter(e => e.mood_value <= 2);
  const happyEntries = entriesWithReflections.filter(e => e.mood_value >= 4);

  if (frustratedEntries.length < 2) return null;

  // Analyze frustrated entries for common themes
  const triggerWords = findCommonContextWords(frustratedEntries);
  const topTrigger = triggerWords[0];

  if (topTrigger && topTrigger.count >= Math.ceil(frustratedEntries.length * 0.6)) {
    return {
      type: 'trigger_identification',
      observation: `${topTrigger.word} seems to be on your mind during tougher days`,
      priority: 'high',
      actionableSuggestion: `Consider noting what specific ${topTrigger.word} situations affect your mood most`,
      supportingData: { trigger: topTrigger.word, frequency: topTrigger.count }
    };
  }

  // Check for positive correlations too
  if (happyEntries.length >= 2) {
    const positiveWords = findCommonContextWords(happyEntries);
    const topPositive = positiveWords[0];

    if (topPositive && topPositive.count >= Math.ceil(happyEntries.length * 0.6)) {
      return {
        type: 'trigger_identification',
        observation: `${topPositive.word} often appears in your brighter moments`,
        priority: 'high',
        actionableSuggestion: `Notice what it is about ${topPositive.word} that lifts your mood`,
        supportingData: { positiveContext: topPositive.word, frequency: topPositive.count }
      };
    }
  }

  return null;
};

const recognizeProgress = (allEntries: Array<any>, entriesWithReflections: Array<{ reflection?: string }>): MoodInsight | null => {
  if (allEntries.length < 7) return null;

  // Calculate tracking consistency (entries over time)
  const oldestEntry = allEntries[allEntries.length - 1];
  if (!oldestEntry?.created_at) return null;
  
  const daysSinceFirst = Math.max(1, Math.floor((Date.now() - new Date(oldestEntry.created_at).getTime()) / (1000 * 60 * 60 * 24)));
  const consistencyRate = allEntries.length / daysSinceFirst;

  if (consistencyRate > 0.3 && daysSinceFirst > 1) { // More than every 3 days on average, and at least 2 days
    return {
      type: 'progress_recognition',
      observation: `You've been consistent with tracking for ${daysSinceFirst} days - building this habit of self-awareness`,
      priority: 'medium',
      actionableSuggestion: 'Celebrate this consistency - it shows your commitment to understanding yourself',
      supportingData: { days: daysSinceFirst, entries: allEntries.length }
    };
  }

  // Check for increasing reflection detail over time
  if (entriesWithReflections.length >= 10) {
    const recentReflections = entriesWithReflections.slice(0, 5);
    const olderReflections = entriesWithReflections.slice(-5);

    const recentAvgLength = recentReflections.reduce((acc, e) => acc + e.reflection!.split(' ').length, 0) / recentReflections.length;
    const olderAvgLength = olderReflections.reduce((acc, e) => acc + e.reflection!.split(' ').length, 0) / olderReflections.length;

    if (recentAvgLength > olderAvgLength * 1.3) {
      return {
        type: 'progress_recognition',
        observation: 'You\'re writing more detailed reflections as time goes on - your self-awareness is deepening',
        priority: 'medium',
        supportingData: { recentAvg: Math.round(recentAvgLength), olderAvg: Math.round(olderAvgLength) }
      };
    }

    // Check for emotional vocabulary expansion
    const recentWords = new Set(recentReflections.flatMap(e => e.reflection!.toLowerCase().split(/\s+/)));
    const olderWords = new Set(olderReflections.flatMap(e => e.reflection!.toLowerCase().split(/\s+/)));
    
    const vocabularyGrowth = (recentWords.size - olderWords.size) / olderWords.size;
    
    if (vocabularyGrowth > 0.2) {
      return {
        type: 'progress_recognition',
        observation: 'Your emotional vocabulary is expanding - you\'re finding new ways to express your experiences',
        priority: 'low',
        supportingData: { vocabularyExpansion: Math.round(vocabularyGrowth * 100) }
      };
    }
  }

  return null;
};

const recognizeCopingPatterns = (entries: Array<{ mood_value: number; sentiment_data?: SentimentResult; created_at: string }>): MoodInsight | null => {
  if (entries.length < 10) return null;

  // Look for recovery patterns after difficult periods
  const lowMoodEntries = entries.filter(e => e.mood_value <= 2 && e.created_at);
  if (lowMoodEntries.length < 2) return null;

  let recoveryTimes: number[] = [];
  
  lowMoodEntries.forEach(lowEntry => {
    if (!lowEntry.created_at) return;
    
    const lowDate = new Date(lowEntry.created_at);
    const futureEntries = entries.filter(e => {
      if (!e.created_at) return false;
      const entryDate = new Date(e.created_at);
      return entryDate > lowDate && e.mood_value >= 3;
    });
    
    if (futureEntries.length > 0) {
      const recoveryEntry = futureEntries[0];
      const recoveryDays = Math.max(1, Math.floor((new Date(recoveryEntry.created_at).getTime() - lowDate.getTime()) / (1000 * 60 * 60 * 24)));
      if (recoveryDays <= 7) { // Only count recoveries within a week
        recoveryTimes.push(recoveryDays);
      }
    }
  });

  if (recoveryTimes.length >= 2) {
    const avgRecovery = Math.max(1, recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length);
    if (avgRecovery <= 3) {
      return {
        type: 'coping_recognition',
        observation: `You naturally bounce back from difficult moments - usually within ${Math.round(avgRecovery)} ${Math.round(avgRecovery) === 1 ? 'day' : 'days'}`,
        priority: 'high',
        actionableSuggestion: 'You might reflect on what helps you process difficult experiences',
        supportingData: { averageDays: Math.round(avgRecovery), instances: recoveryTimes.length }
      };
    }
  }

  // Look for activity-mood correlations
  const positiveEntries = entries.filter(e => e.mood_value >= 4 && e.sentiment_data);
  const commonPositiveWords = findCommonContextWords(positiveEntries.map(e => ({ reflection: e.created_at }))); // Placeholder for actual reflection analysis

  return null;
};

const analyzeEnvironmentalPatterns = (entries: Array<{ mood_value: number; reflection?: string; created_at: string }>): MoodInsight | null => {
  if (entries.length < 10) return null;

  const weekdayEntries = entries.filter(e => {
    const day = new Date(e.created_at).getDay();
    return day >= 1 && day <= 5; // Monday to Friday
  });

  const weekendEntries = entries.filter(e => {
    const day = new Date(e.created_at).getDay();
    return day === 0 || day === 6; // Saturday and Sunday
  });

  if (weekdayEntries.length < 3 || weekendEntries.length < 2) return null;

  // Analyze reflection topics
  const weekdayWords = findCommonContextWords(weekdayEntries);
  const weekendWords = findCommonContextWords(weekendEntries);

  const weekdayTopics = weekdayWords.slice(0, 2).map(w => w.word);
  const weekendTopics = weekendWords.slice(0, 2).map(w => w.word);

  // Check if topics are distinctly different
  const commonTopics = weekdayTopics.filter(topic => weekendTopics.includes(topic));
  
  if (commonTopics.length === 0 && weekdayTopics.length > 0 && weekendTopics.length > 0) {
    return {
      type: 'environmental_awareness',
      observation: 'Your weekdays and weekends bring out different sides of your emotional world',
      priority: 'low',
      supportingData: { weekdayFocus: weekdayTopics[0], weekendFocus: weekendTopics[0] }
    };
  }

  // Check mood differences
  const weekdayAvg = weekdayEntries.reduce((acc, e) => acc + e.mood_value, 0) / weekdayEntries.length;
  const weekendAvg = weekendEntries.reduce((acc, e) => acc + e.mood_value, 0) / weekendEntries.length;

  if (Math.abs(weekdayAvg - weekendAvg) > 0.5) {
    const pattern = weekendAvg > weekdayAvg ? 
      'Your mood patterns vary between weekdays and weekends - weekend entries tend to reflect different energy levels' :
      'Your mood patterns show interesting differences between weekdays and weekends';
    
    return {
      type: 'environmental_awareness',
      observation: pattern,
      priority: 'low',
      supportingData: { weekdayAvg: weekdayAvg.toFixed(1), weekendAvg: weekendAvg.toFixed(1) }
    };
  }

  return null;
};