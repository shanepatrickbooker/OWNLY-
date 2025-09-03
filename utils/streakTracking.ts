interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
  streakStartDate: string | null;
  isMilestone: boolean;
  milestoneMessage?: string;
  showEncouragement: boolean;
  encouragementMessage?: string;
}

interface MoodEntry {
  created_at: string;
}

const GRACE_PERIOD_HOURS = 4; // Entries after midnight within 4 hours count for previous day

// Milestone definitions with gentle, encouraging messages
const MILESTONES = [
  { days: 3, message: "Building consistency - three days of mindful self-reflection" },
  { days: 7, message: "A week of self-awareness - consistency is taking root" },
  { days: 14, message: "Two weeks of mindful tracking - you're developing a caring routine" },
  { days: 30, message: "A month of self-reflection - this practice is becoming part of you" },
  { days: 60, message: "Two months of emotional awareness - your consistency is remarkable" },
  { days: 100, message: "100 days of mindful tracking - you've built a beautiful habit of self-care" }
];

// Get local date string (YYYY-MM-DD) accounting for grace period
const getLocalDateString = (date: Date, applyGracePeriod: boolean = false): string => {
  const adjustedDate = new Date(date);
  
  if (applyGracePeriod && adjustedDate.getHours() < GRACE_PERIOD_HOURS) {
    // If it's within grace period (0-4am), count it as previous day
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }
  
  return adjustedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
};

// Check if two dates are consecutive days
const areConsecutiveDays = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

export const calculateStreak = (entries: MoodEntry[]): StreakData => {
  if (entries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastEntryDate: null,
      streakStartDate: null,
      isMilestone: false,
      showEncouragement: false
    };
  }

  // Group entries by local date (accounting for grace period)
  const entriesByDate: Record<string, number> = {};
  
  entries.forEach(entry => {
    const entryDate = new Date(entry.created_at);
    const dateKey = getLocalDateString(entryDate, true);
    entriesByDate[dateKey] = (entriesByDate[dateKey] || 0) + 1;
  });

  // Get sorted unique dates
  const uniqueDates = Object.keys(entriesByDate).sort();
  
  if (uniqueDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastEntryDate: null,
      streakStartDate: null,
      isMilestone: false,
      showEncouragement: false
    };
  }

  const today = getLocalDateString(new Date());
  const yesterday = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
  
  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let currentStreakStartDate: string | null = null;

  // Check if user has entry today or yesterday (to maintain streak)
  const hasEntryToday = entriesByDate[today] > 0;
  const hasEntryYesterday = entriesByDate[yesterday] > 0;
  
  if (!hasEntryToday && !hasEntryYesterday) {
    // Streak is broken, but calculate historical longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0 || areConsecutiveDays(uniqueDates[i - 1], uniqueDates[i])) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return {
      currentStreak: 0,
      longestStreak,
      lastEntryDate: uniqueDates[uniqueDates.length - 1],
      streakStartDate: null,
      isMilestone: false,
      showEncouragement: true,
      encouragementMessage: longestStreak > 0 ? 
        `Starting fresh - your previous best was ${longestStreak} days` :
        "Starting fresh - every journey begins with a single step"
    };
  }

  // Calculate current streak working backwards from today/yesterday
  let startIndex = uniqueDates.length - 1;
  
  // Start from most recent entry
  if (hasEntryToday) {
    currentStreak = 1;
    currentStreakStartDate = today;
  } else if (hasEntryYesterday) {
    currentStreak = 1;
    currentStreakStartDate = yesterday;
    startIndex = uniqueDates.findIndex(date => date === yesterday);
  }

  // Continue streak backwards
  for (let i = startIndex - 1; i >= 0; i--) {
    const currentDate = uniqueDates[i + 1];
    const prevDate = uniqueDates[i];
    
    if (areConsecutiveDays(prevDate, currentDate)) {
      currentStreak++;
      currentStreakStartDate = prevDate;
    } else {
      break;
    }
  }

  // Calculate longest streak in history
  tempStreak = 0;
  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0 || areConsecutiveDays(uniqueDates[i - 1], uniqueDates[i])) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  // Check for milestone
  const milestone = MILESTONES.find(m => m.days === currentStreak);
  
  return {
    currentStreak,
    longestStreak,
    lastEntryDate: uniqueDates[uniqueDates.length - 1],
    streakStartDate: currentStreakStartDate,
    isMilestone: !!milestone,
    milestoneMessage: milestone?.message,
    showEncouragement: false
  };
};

export const getStreakDisplayText = (streakData: StreakData): string => {
  if (streakData.showEncouragement) {
    return streakData.encouragementMessage || "Starting fresh";
  }

  if (streakData.currentStreak === 0) {
    return "Ready to begin your mindful tracking journey";
  }

  if (streakData.currentStreak === 1) {
    return "Day 1 of mindful tracking";
  }

  // After 30 days, use more subtle language to avoid obsession
  if (streakData.currentStreak > 30) {
    return "Consistent mindful tracking - well done";
  }

  return `Day ${streakData.currentStreak} of mindful tracking`;
};

export const shouldShowStreakPromptly = (streakData: StreakData): boolean => {
  // Don't show streak prominently if it's very long (to avoid pressure)
  if (streakData.currentStreak > 60) {
    return false;
  }
  
  // Always show if it's a milestone or encouragement
  if (streakData.isMilestone || streakData.showEncouragement) {
    return true;
  }
  
  // Show normally for reasonable streaks
  return streakData.currentStreak > 0;
};

export const getMilestoneEmoji = (days: number): string => {
  if (days >= 100) return "💎";
  if (days >= 60) return "🌟";
  if (days >= 30) return "🏆";
  if (days >= 14) return "🌱";
  if (days >= 7) return "✨";
  if (days >= 3) return "🌿";
  return "";
};

// For debugging/testing
export const formatStreakData = (streakData: StreakData): string => {
  return `Current: ${streakData.currentStreak}, Longest: ${streakData.longestStreak}, Last: ${streakData.lastEntryDate || 'None'}`;
};