interface EngagementData {
  totalEntries: number;
  showMessage: boolean;
  message: string;
  weeksActive: number;
  monthsActive: number;
  averageReflectionLength: number;
  emotionalVocabularyGrowth: boolean;
}

interface MoodEntry {
  created_at: string | undefined;
  reflection?: string;
  mood_label?: string;
}

export const calculateEngagement = (entries: MoodEntry[]): EngagementData => {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      showMessage: false,
      message: '',
      weeksActive: 0,
      monthsActive: 0,
      averageReflectionLength: 0,
      emotionalVocabularyGrowth: false
    };
  }

  // Filter entries with valid timestamps and sort by date
  const validEntries = entries.filter(entry => entry.created_at);
  const sortedEntries = validEntries.sort((a, b) => 
    new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
  );

  const totalEntries = validEntries.length;
  const now = new Date();
  
  if (sortedEntries.length === 0) {
    return {
      totalEntries: 0,
      showMessage: false,
      message: '',
      weeksActive: 0,
      monthsActive: 0,
      averageReflectionLength: 0,
      emotionalVocabularyGrowth: false
    };
  }
  
  const firstEntry = new Date(sortedEntries[0].created_at!);
  
  // Calculate time periods
  const daysSinceFirst = Math.floor((now.getTime() - firstEntry.getTime()) / (1000 * 60 * 60 * 24));
  const weeksActive = Math.max(1, Math.floor(daysSinceFirst / 7));
  const monthsActive = Math.max(1, Math.floor(daysSinceFirst / 30));

  // Calculate average reflection length
  const reflections = validEntries.filter(entry => entry.reflection && entry.reflection.trim().length > 0);
  const totalWords = reflections.reduce((sum, entry) => 
    sum + (entry.reflection?.split(' ').length || 0), 0
  );
  const averageReflectionLength = reflections.length > 0 ? Math.round(totalWords / reflections.length) : 0;

  // Check for emotional vocabulary growth (diverse mood labels)
  const uniqueMoodLabels = new Set(validEntries.map(entry => entry.mood_label).filter(Boolean));
  const emotionalVocabularyGrowth = uniqueMoodLabels.size >= 5;

  // Generate supportive message
  let message = '';
  let showMessage = false;

  if (totalEntries >= 20) {
    showMessage = true;
    if (monthsActive >= 2) {
      message = `Your emotional awareness practice has been developing beautifully over ${monthsActive} month${monthsActive > 1 ? 's' : ''}`;
    } else if (weeksActive >= 3) {
      message = `${totalEntries} thoughtful reflections - your self-awareness journey is growing`;
    } else {
      message = `${totalEntries} reflections completed - you're building meaningful awareness`;
    }
  } else if (totalEntries >= 10) {
    showMessage = true;
    if (emotionalVocabularyGrowth) {
      message = `You're exploring the full spectrum of your emotions with ${totalEntries} reflections`;
    } else {
      message = `${totalEntries} check-ins completed - you're developing a caring routine`;
    }
  } else if (totalEntries >= 5) {
    showMessage = true;
    message = `${totalEntries} moments of self-reflection - your awareness practice is taking shape`;
  }

  return {
    totalEntries,
    showMessage,
    message,
    weeksActive,
    monthsActive,
    averageReflectionLength,
    emotionalVocabularyGrowth
  };
};

export const getEngagementInsight = (engagementData: EngagementData): string => {
  if (engagementData.totalEntries === 0) {
    return "Ready to begin your emotional awareness journey";
  }

  if (engagementData.emotionalVocabularyGrowth && engagementData.totalEntries >= 15) {
    return "You're developing a rich understanding of your emotional landscape";
  }

  if (engagementData.averageReflectionLength > 50 && engagementData.totalEntries >= 10) {
    return "Your reflections show deep, thoughtful self-exploration";
  }

  if (engagementData.monthsActive >= 2) {
    return "Your commitment to emotional awareness spans multiple months";
  }

  return "Your self-reflection practice is growing with each entry";
};