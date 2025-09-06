import { MoodEntry } from '../app/(tabs)/database/database';
import { analyzeSentiment } from './sentimentAnalysis';

interface PatternPrediction {
  predictedMood: number;
  confidence: number;
  basedOn: string;
  suggestion?: string;
}

interface PersonalPattern {
  type: 'improvement' | 'decline' | 'trigger' | 'cycle' | 'correlation';
  pattern: string;
  confidence: number;
  frequency: number;
  actionableInsight: string;
  examples: string[];
}

interface MarkovState {
  mood: number;
  context?: string; // time of day, day of week, keywords
}

interface MarkovTransition {
  fromState: MarkovState;
  toState: MarkovState;
  probability: number;
  count: number;
}

export class EnhancedPatternDetector {
  private markovTransitions: Map<string, MarkovTransition[]> = new Map();
  private contextualPatterns: Map<string, any[]> = new Map();
  private phraseFrequency: Map<string, number> = new Map();
  
  constructor(private entries: MoodEntry[]) {
    // Performance optimization: Limit entries to prevent blocking
    const maxEntries = 100; // Limit to last 100 entries for performance
    this.entries = entries.slice(0, maxEntries);
    
    this.buildMarkovModel();
    this.extractPhrasePatterns();
    this.analyzeContextualFactors();
  }
  
  // Build Markov chain model from historical entries
  private buildMarkovModel(): void {
    // Performance optimization: Process in smaller chunks
    const maxPairs = Math.min(this.entries.length - 1, 50);
    
    for (let i = 0; i < maxPairs; i++) {
      const current = this.entries[i];
      const next = this.entries[i + 1];
      
      if (!current || !next) continue;
      
      // Create state representations
      const currentState: MarkovState = {
        mood: current.mood_value,
        context: this.getStateContext(current)
      };
      
      const nextState: MarkovState = {
        mood: next.mood_value,
        context: this.getStateContext(next)
      };
      
      // Record transition
      const key = this.stateToKey(currentState);
      const transitions = this.markovTransitions.get(key) || [];
      
      const existingTransition = transitions.find(t => 
        this.stateToKey(t.toState) === this.stateToKey(nextState)
      );
      
      if (existingTransition) {
        existingTransition.count++;
      } else {
        transitions.push({
          fromState: currentState,
          toState: nextState,
          probability: 0,
          count: 1
        });
      }
      
      this.markovTransitions.set(key, transitions);
    }
    
    // Calculate probabilities
    this.markovTransitions.forEach((transitions) => {
      const total = transitions.reduce((sum, t) => sum + t.count, 0);
      transitions.forEach((t) => {
        t.probability = t.count / total;
      });
    });
  }
  
  // Extract contextual information from entry
  private getStateContext(entry: MoodEntry): string {
    const date = new Date(entry.timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // Time of day context
    let timeContext = 'night';
    if (hour >= 5 && hour < 12) timeContext = 'morning';
    else if (hour >= 12 && hour < 17) timeContext = 'afternoon';
    else if (hour >= 17 && hour < 21) timeContext = 'evening';
    
    // Day context
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayContext = isWeekend ? 'weekend' : 'weekday';
    
    // Extract key themes from reflection
    const themes = this.extractThemes(entry.reflection || '');
    const themeContext = themes.length > 0 ? themes[0] : 'general';
    
    return `${timeContext}_${dayContext}_${themeContext}`;
  }
  
  // Convert state to string key for map storage
  private stateToKey(state: MarkovState): string {
    return `${state.mood}_${state.context || 'unknown'}`;
  }
  
  // Extract common phrases and n-grams
  private extractPhrasePatterns(): void {
    const ngrams: string[] = [];
    
    // Performance optimization: Limit entries processed
    const maxEntries = Math.min(this.entries.length, 30);
    
    for (let entryIndex = 0; entryIndex < maxEntries; entryIndex++) {
      const entry = this.entries[entryIndex];
      if (!entry.reflection) continue;
      
      const text = entry.reflection.toLowerCase();
      const words = text.split(/\s+/);
      
      // Limit word processing for performance
      const maxWords = Math.min(words.length, 50);
      
      // Extract 2-grams only (skip 3-grams for performance)
      for (let i = 0; i < maxWords - 1; i++) {
        ngrams.push(words.slice(i, i + 2).join(' ')); // 2-gram
      }
    }
    
    // Count frequencies
    ngrams.forEach(ngram => {
      this.phraseFrequency.set(ngram, (this.phraseFrequency.get(ngram) || 0) + 1);
    });
    
    // Filter to meaningful phrases (appearing at least 2 times)
    const meaningfulPhrases = new Map();
    this.phraseFrequency.forEach((count, phrase) => {
      if (count >= 2 && !this.isCommonPhrase(phrase)) {
        meaningfulPhrases.set(phrase, count);
      }
    });
    this.phraseFrequency = meaningfulPhrases;
  }
  
  // Check if phrase is too common to be meaningful
  private isCommonPhrase(phrase: string): boolean {
    const common = ['i am', 'i feel', 'it was', 'to be', 'and i', 'in the', 'on the'];
    return common.includes(phrase);
  }
  
  // Analyze contextual factors (activities, triggers, etc.)
  private analyzeContextualFactors(): void {
    const activities = ['walk', 'exercise', 'workout', 'meditation', 'sleep', 'rest', 'work', 'meeting'];
    
    // Performance optimization: Limit activities and entries processed
    const maxActivities = 6;
    const maxEntries = Math.min(this.entries.length - 1, 40);
    
    activities.slice(0, maxActivities).forEach(activity => {
      const afterActivity: any[] = [];
      
      for (let i = 0; i < maxEntries; i++) {
        const current = this.entries[i];
        const next = this.entries[i + 1];
        
        if (current.reflection?.toLowerCase().includes(activity)) {
          const moodChange = next.mood_value - current.mood_value;
          afterActivity.push({
            activity,
            moodChange,
            fromMood: current.mood_value,
            toMood: next.mood_value,
            example: current.reflection?.substring(0, 100)
          });
        }
      }
      
      if (afterActivity.length > 0) {
        this.contextualPatterns.set(`activity_${activity}`, afterActivity);
      }
    });
  }
  
  // Extract themes from text
  private extractThemes(text: string): string[] {
    const themes: string[] = [];
    const lowerText = text.toLowerCase();
    
    const themeKeywords = {
      work: ['work', 'job', 'boss', 'colleague', 'meeting', 'deadline', 'project'],
      family: ['family', 'parent', 'sibling', 'child', 'partner', 'spouse'],
      health: ['health', 'sick', 'tired', 'sleep', 'exercise', 'pain'],
      social: ['friend', 'party', 'event', 'people', 'social'],
      finance: ['money', 'bill', 'expense', 'budget', 'financial']
    };
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        themes.push(theme);
      }
    });
    
    return themes;
  }
  
  // Predict next mood based on current state
  public predictNextMood(currentMood: number, currentReflection?: string): PatternPrediction {
    const currentState: MarkovState = {
      mood: currentMood,
      context: currentReflection ? this.getStateContext({ 
        mood_value: currentMood, 
        mood_label: '',
        reflection: currentReflection,
        timestamp: new Date().toISOString()
      }) : undefined
    };
    
    const key = this.stateToKey(currentState);
    const transitions = this.markovTransitions.get(key) || [];
    
    if (transitions.length === 0) {
      // No exact match, find similar states
      return this.predictFromSimilarStates(currentState);
    }
    
    // Find most likely transition
    const mostLikely = transitions.reduce((best, current) => 
      current.probability > best.probability ? current : best
    );
    
    let suggestion: string | undefined;
    if (mostLikely.toState.mood < currentMood) {
      suggestion = this.generatePreventiveSuggestion(currentState, mostLikely.toState);
    }
    
    return {
      predictedMood: mostLikely.toState.mood,
      confidence: mostLikely.probability,
      basedOn: `Based on ${transitions.reduce((sum, t) => sum + t.count, 0)} similar past situations`,
      suggestion
    };
  }
  
  // Predict from similar states when exact match not found
  private predictFromSimilarStates(targetState: MarkovState): PatternPrediction {
    const allTransitions: MarkovTransition[] = [];
    
    this.markovTransitions.forEach((transitions) => {
      transitions.forEach((t) => {
        if (Math.abs(t.fromState.mood - targetState.mood) <= 1) {
          allTransitions.push(t);
        }
      });
    });
    
    if (allTransitions.length === 0) {
      return {
        predictedMood: targetState.mood,
        confidence: 0.1,
        basedOn: 'Insufficient data for prediction'
      };
    }
    
    // Average the predictions
    const avgMood = allTransitions.reduce((sum, t) => sum + t.toState.mood, 0) / allTransitions.length;
    
    return {
      predictedMood: Math.round(avgMood),
      confidence: 0.5,
      basedOn: `Based on ${allTransitions.length} similar situations`
    };
  }
  
  // Generate preventive suggestions
  private generatePreventiveSuggestion(current: MarkovState, predicted: MarkovState): string {
    const suggestions: string[] = [];
    
    // Check what has helped in the past
    this.contextualPatterns.forEach((patterns, key) => {
      if (key.startsWith('activity_')) {
        const activity = key.replace('activity_', '');
        const improvements = patterns.filter(p => p.moodChange > 0);
        
        if (improvements.length > patterns.length * 0.6) {
          suggestions.push(`Consider ${activity} - it has helped ${Math.round(improvements.length / patterns.length * 100)}% of the time`);
        }
      }
    });
    
    if (suggestions.length === 0) {
      suggestions.push('Take a moment for self-care - your patterns suggest this might be a challenging transition');
    }
    
    return suggestions[0];
  }
  
  // Get personal patterns with actionable insights
  public getPersonalPatterns(): PersonalPattern[] {
    // Guard clause: Need at least 5 entries for meaningful patterns
    if (this.entries.length < 5) {
      return [];
    }
    
    const patterns: PersonalPattern[] = [];
    
    // Pattern 1: Improvement patterns
    this.contextualPatterns.forEach((contextPatterns, key) => {
      if (key.startsWith('activity_')) {
        const activity = key.replace('activity_', '');
        const improvements = contextPatterns.filter(p => p.moodChange > 0);
        const declines = contextPatterns.filter(p => p.moodChange < 0);
        
        if (improvements.length > contextPatterns.length * 0.7) {
          patterns.push({
            type: 'improvement',
            pattern: `${activity} consistently improves your mood`,
            confidence: improvements.length / contextPatterns.length,
            frequency: contextPatterns.length,
            actionableInsight: `When feeling down, try ${activity}`,
            examples: improvements.slice(0, 2).map(p => p.example || '')
          });
        }
      }
    });
    
    // Pattern 2: Recurring phrases and their outcomes
    this.phraseFrequency.forEach((count, phrase) => {
      if (count >= 3) {
        const entriesWithPhrase = this.entries.filter(e => 
          e.reflection?.toLowerCase().includes(phrase)
        );
        
        const avgMood = entriesWithPhrase.reduce((sum, e) => sum + e.mood_value, 0) / entriesWithPhrase.length;
        
        if (avgMood <= 2) {
          patterns.push({
            type: 'trigger',
            pattern: `"${phrase}" appears when you're struggling`,
            confidence: 0.8,
            frequency: count,
            actionableInsight: `This phrase appears ${count} times, usually indicating challenging times. Consider addressing the root cause.`,
            examples: entriesWithPhrase.slice(0, 2).map(e => e.reflection?.substring(0, 50) || '')
          });
        }
      }
    });
    
    // Pattern 3: Cycles (weekly patterns)
    const dayPatterns = this.analyzeDayPatterns();
    dayPatterns.forEach(pattern => patterns.push(pattern));
    
    // Pattern 4: Mood progression patterns
    const progressionPatterns = this.analyzeProgressionPatterns();
    progressionPatterns.forEach(pattern => patterns.push(pattern));
    
    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }
  
  // Analyze patterns by day of week
  private analyzeDayPatterns(): PersonalPattern[] {
    const patterns: PersonalPattern[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMoods: Map<number, number[]> = new Map();
    
    this.entries.forEach(entry => {
      const day = new Date(entry.timestamp).getDay();
      const moods = dayMoods.get(day) || [];
      moods.push(entry.mood_value);
      dayMoods.set(day, moods);
    });
    
    dayMoods.forEach((moods, day) => {
      if (moods.length >= 3) {
        const avgMood = moods.reduce((sum, m) => sum + m, 0) / moods.length;
        
        if (avgMood <= 2.5) {
          patterns.push({
            type: 'cycle',
            pattern: `${dayNames[day]}s tend to be challenging`,
            confidence: 0.7,
            frequency: moods.length,
            actionableInsight: `Plan extra self-care for ${dayNames[day]}s when you tend to struggle`,
            examples: [`Average mood: ${avgMood.toFixed(1)}`, `Tracked ${moods.length} ${dayNames[day]}s`]
          });
        } else if (avgMood >= 4) {
          patterns.push({
            type: 'cycle',
            pattern: `${dayNames[day]}s are typically your best days`,
            confidence: 0.7,
            frequency: moods.length,
            actionableInsight: `Schedule important activities on ${dayNames[day]}s when you feel best`,
            examples: [`Average mood: ${avgMood.toFixed(1)}`, `Tracked ${moods.length} ${dayNames[day]}s`]
          });
        }
      }
    });
    
    return patterns;
  }
  
  // Analyze mood progression patterns
  private analyzeProgressionPatterns(): PersonalPattern[] {
    const patterns: PersonalPattern[] = [];
    let improvementStreaks = 0;
    let declineStreaks = 0;
    let currentStreak = 0;
    let streakType: 'improvement' | 'decline' | null = null;
    
    // Performance optimization: Limit entries processed
    const maxEntries = Math.min(this.entries.length, 50);
    
    for (let i = 1; i < maxEntries; i++) {
      const change = this.entries[i].mood_value - this.entries[i - 1].mood_value;
      
      if (change > 0) {
        if (streakType === 'improvement') {
          currentStreak++;
        } else {
          if (currentStreak >= 2 && streakType === 'decline') declineStreaks++;
          streakType = 'improvement';
          currentStreak = 1;
        }
      } else if (change < 0) {
        if (streakType === 'decline') {
          currentStreak++;
        } else {
          if (currentStreak >= 2 && streakType === 'improvement') improvementStreaks++;
          streakType = 'decline';
          currentStreak = 1;
        }
      }
    }
    
    if (improvementStreaks > 3) {
      patterns.push({
        type: 'improvement',
        pattern: 'You show resilience with mood rebounds',
        confidence: 0.8,
        frequency: improvementStreaks,
        actionableInsight: `Trust your resilience - you've recovered from difficult times before`,
        examples: ['Multiple recovery patterns detected']
      });
    }
    
    if (declineStreaks > 3) {
      patterns.push({
        type: 'decline',
        pattern: 'Watch for cascading mood declines',
        confidence: 0.7,
        frequency: declineStreaks,
        actionableInsight: 'When mood starts dropping, take preventive action early - you\'ve experienced mood cascades before',
        examples: [`${declineStreaks} decline sequences detected`]
      });
    }
    
    return patterns;
  }
  
  // Get correlation insights
  public getCorrelationInsights(): string[] {
    const insights: string[] = [];
    
    // Analyze what precedes good moods
    const goodMoodPrecursors: Map<string, number> = new Map();
    
    // Performance optimization: Limit entries processed
    const maxEntries = Math.min(this.entries.length - 1, 30);
    
    for (let i = 0; i < maxEntries; i++) {
      if (this.entries[i + 1].mood_value >= 4) {
        const themes = this.extractThemes(this.entries[i].reflection || '');
        themes.forEach(theme => {
          goodMoodPrecursors.set(theme, (goodMoodPrecursors.get(theme) || 0) + 1);
        });
      }
    }
    
    goodMoodPrecursors.forEach((count, theme) => {
      if (count >= 3) {
        insights.push(`${theme.charAt(0).toUpperCase() + theme.slice(1)} activities often precede good moods (${count} times)`);
      }
    });
    
    return insights;
  }
}