interface MoodEntry {
  id?: number;
  mood_value: number;
  mood_label: string;
  reflection?: string;
  timestamp: string;
  created_at?: string;
}

export interface WeeklySummary {
  weekStart: Date;
  weekEnd: Date;
  totalEntries: number;
  moodDistribution: MoodDistribution[];
  reflectionInsights: ReflectionInsights;
  temporalPatterns: TemporalPatterns;
  weekLabel: string;
  supportiveMessage: string;
}

export interface MoodDistribution {
  moodLabel: string;
  count: number;
  emoji: string;
  percentage: number;
}

export interface ReflectionInsights {
  totalWithReflections: number;
  averageReflectionLength: number;
  commonWords: Array<{ word: string; count: number }>;
  daysWithReflections: number;
  totalDays: number;
}

export interface TemporalPatterns {
  timeOfDayPattern: Array<{ period: string; count: number }>;
  weekdayPattern: Array<{ day: string; count: number }>;
  hasWeekendPattern: boolean;
  weekendVsWeekdayMessage?: string;
}

const MOOD_EMOJIS: { [key: string]: string } = {
  'Angry': '😡',
  'Frustrated': '😔', 
  'Sad': '😐',
  'Neutral': '😊',
  'Content': '😄',
  'Joyful': '🤩',
  'Happy': '😆',
  'Surprised': '😲',
  'Worried': '😟',
  'Anxious': '😤'
};

// Words to filter out from common word analysis
const COMMON_WORDS = new Set([
  'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'a', 'an', 'as', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'am', 'is', 'are', 'was', 'were',
  'i', 'me', 'my', 'mine', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
  'it', 'its', 'we', 'us', 'our', 'ours', 'they', 'them', 'their', 'theirs',
  'this', 'that', 'these', 'those', 'there', 'here', 'where', 'when', 'why', 'how',
  'what', 'which', 'who', 'whom', 'whose', 'if', 'then', 'else', 'so', 'too', 'very',
  'just', 'now', 'today', 'get', 'got', 'getting', 'go', 'going', 'went'
]);

export const getWeekRange = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

export const getWeekLabel = (weekStart: Date): string => {
  const now = new Date();
  const thisWeekStart = getWeekRange(now).start;
  
  const diffDays = Math.floor((thisWeekStart.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'This Week';
  } else if (diffDays === 7) {
    return 'Last Week';
  } else if (diffDays > 0 && diffDays <= 21) {
    const weeksAgo = Math.floor(diffDays / 7);
    return `${weeksAgo} Week${weeksAgo > 1 ? 's' : ''} Ago`;
  } else {
    return weekStart.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: weekStart.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  }
};

const analyzeMoodDistribution = (entries: MoodEntry[]): MoodDistribution[] => {
  const distribution: { [key: string]: number } = {};
  
  entries.forEach(entry => {
    distribution[entry.mood_label] = (distribution[entry.mood_label] || 0) + 1;
  });
  
  const total = entries.length;
  return Object.entries(distribution)
    .map(([moodLabel, count]) => ({
      moodLabel,
      count,
      emoji: MOOD_EMOJIS[moodLabel] || '😊',
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count);
};

const analyzeReflections = (entries: MoodEntry[]): ReflectionInsights => {
  const entriesWithReflections = entries.filter(entry => 
    entry.reflection && entry.reflection.trim().length > 0
  );
  
  const totalWords = entriesWithReflections.reduce((sum, entry) => 
    sum + (entry.reflection?.split(' ').length || 0), 0
  );
  
  const averageReflectionLength = entriesWithReflections.length > 0 
    ? Math.round(totalWords / entriesWithReflections.length) 
    : 0;
  
  // Analyze common words
  const wordCounts: { [key: string]: number } = {};
  
  entriesWithReflections.forEach(entry => {
    if (!entry.reflection) return;
    
    const words = entry.reflection
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !COMMON_WORDS.has(word));
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });
  
  const commonWords = Object.entries(wordCounts)
    .filter(([word, count]) => count >= 2) // Only words that appear at least twice
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));
  
  // Count unique days with reflections
  const daysWithReflections = new Set();
  entriesWithReflections.forEach(entry => {
    const date = new Date(entry.created_at || entry.timestamp);
    const dateKey = date.toDateString();
    daysWithReflections.add(dateKey);
  });
  
  return {
    totalWithReflections: entriesWithReflections.length,
    averageReflectionLength,
    commonWords,
    daysWithReflections: daysWithReflections.size,
    totalDays: 7
  };
};

const analyzeTemporalPatterns = (entries: MoodEntry[]): TemporalPatterns => {
  const timeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const weekdays = { 
    Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 
  };
  let weekendCount = 0;
  let weekdayCount = 0;
  
  entries.forEach(entry => {
    const date = new Date(entry.created_at || entry.timestamp);
    const hour = date.getHours();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Time of day analysis
    if (hour >= 6 && hour < 12) {
      timeOfDay.morning++;
    } else if (hour >= 12 && hour < 17) {
      timeOfDay.afternoon++;
    } else if (hour >= 17 && hour < 22) {
      timeOfDay.evening++;
    } else {
      timeOfDay.night++;
    }
    
    // Day of week analysis
    weekdays[dayName as keyof typeof weekdays]++;
    
    if (dayName === 'Saturday' || dayName === 'Sunday') {
      weekendCount++;
    } else {
      weekdayCount++;
    }
  });
  
  const timeOfDayPattern = Object.entries(timeOfDay)
    .map(([period, count]) => ({ period, count }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);
  
  const weekdayPattern = Object.entries(weekdays)
    .map(([day, count]) => ({ day, count }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);
  
  const hasWeekendPattern = weekendCount > 0 && weekdayCount > 0;
  let weekendVsWeekdayMessage: string | undefined;
  
  if (hasWeekendPattern) {
    const weekendAvg = weekendCount / 2; // 2 weekend days
    const weekdayAvg = weekdayCount / 5;   // 5 weekdays
    
    if (weekendAvg > weekdayAvg * 1.5) {
      weekendVsWeekdayMessage = "You tend to check in more often on weekends";
    } else if (weekdayAvg > weekendAvg * 1.5) {
      weekendVsWeekdayMessage = "You check in more regularly during weekdays";
    }
  }
  
  return {
    timeOfDayPattern,
    weekdayPattern,
    hasWeekendPattern,
    weekendVsWeekdayMessage
  };
};

const generateSupportiveMessage = (summary: WeeklySummary): string => {
  const { totalEntries, moodDistribution } = summary;
  
  if (totalEntries === 0) {
    return "Every week is different - there's no pressure to track daily. Your emotional awareness journey happens at your own pace.";
  }
  
  if (totalEntries === 1) {
    return "One check-in this week shows mindful attention to your inner experience. Each moment of self-awareness matters.";
  }
  
  const messages = [
    "Every week includes a natural range of emotions - this variety is healthy and human.",
    "Your weekly patterns show the normal ebb and flow of emotional life.",
    "This week's emotional landscape reflects the complex, authentic experience of being human.",
    "Like weather patterns, emotions naturally shift and change throughout the week.",
    "Your check-ins this week capture the beautiful complexity of human emotional experience."
  ];
  
  // Choose message based on mood diversity
  const uniqueMoods = moodDistribution.length;
  if (uniqueMoods <= 2) {
    return "Your check-ins this week show focused emotional experiences. Both consistency and variety in emotions are completely natural.";
  }
  
  return messages[Math.floor(Math.random() * messages.length)];
};

export const generateWeeklySummary = (entries: MoodEntry[], weekStart?: Date): WeeklySummary => {
  const targetWeekStart = weekStart || getWeekRange(new Date()).start;
  const { start, end } = getWeekRange(targetWeekStart);
  
  // Filter entries for this week
  const weekEntries = entries.filter(entry => {
    const entryDate = new Date(entry.created_at || entry.timestamp);
    return entryDate >= start && entryDate <= end;
  });
  
  const moodDistribution = analyzeMoodDistribution(weekEntries);
  const reflectionInsights = analyzeReflections(weekEntries);
  const temporalPatterns = analyzeTemporalPatterns(weekEntries);
  const weekLabel = getWeekLabel(start);
  
  const summary: WeeklySummary = {
    weekStart: start,
    weekEnd: end,
    totalEntries: weekEntries.length,
    moodDistribution,
    reflectionInsights,
    temporalPatterns,
    weekLabel,
    supportiveMessage: '' // Will be filled below
  };
  
  summary.supportiveMessage = generateSupportiveMessage(summary);
  
  return summary;
};

export const getAvailableWeeks = (entries: MoodEntry[]): Date[] => {
  if (entries.length === 0) return [];
  
  const weeks = new Set<string>();
  
  entries.forEach(entry => {
    const entryDate = new Date(entry.created_at || entry.timestamp);
    const weekStart = getWeekRange(entryDate).start;
    weeks.add(weekStart.toISOString());
  });
  
  return Array.from(weeks)
    .map(dateStr => new Date(dateStr))
    .sort((a, b) => b.getTime() - a.getTime()); // Most recent first
};