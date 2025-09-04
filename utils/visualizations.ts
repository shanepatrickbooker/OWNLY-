import { MoodEntry } from '../app/(tabs)/database/database';

// Color mapping for mood values and sentiment
export const getMoodColors = (mood_value: number, sentiment_data?: any) => {
  // Base mood colors - soft, nature-inspired palette
  const moodColors: Record<number, { primary: string; background: string; accent: string }> = {
    5: { // Great
      primary: '#059669', // emerald-600
      background: '#ECFDF5', // emerald-50
      accent: '#10B981'  // emerald-500
    },
    4: { // Good
      primary: '#0891B2', // cyan-600
      background: '#ECFEFF', // cyan-50
      accent: '#06B6D4'  // cyan-500
    },
    3: { // Okay
      primary: '#7C3AED', // violet-600
      background: '#F5F3FF', // violet-50
      accent: '#8B5CF6'  // violet-500
    },
    2: { // Low
      primary: '#EA580C', // orange-600
      background: '#FFF7ED', // orange-50
      accent: '#F97316'  // orange-500
    },
    1: { // Tough
      primary: '#BE123C', // rose-600
      background: '#FFF1F2', // rose-50
      accent: '#F43F5E'  // rose-500
    }
  };

  const baseColors = moodColors[mood_value] || moodColors[3];

  // Modify colors based on sentiment if available
  if (sentiment_data) {
    const { compound, pos, neu, neg } = sentiment_data;
    
    // Adjust saturation and brightness based on sentiment
    if (compound > 0.1) {
      // More positive sentiment - brighter, more saturated
      return {
        primary: baseColors.primary,
        background: adjustColorIntensity(baseColors.background, 0.1),
        accent: baseColors.accent,
        border: baseColors.accent + '40' // 25% opacity
      };
    } else if (compound < -0.1) {
      // More negative sentiment - softer, more muted
      return {
        primary: adjustColorIntensity(baseColors.primary, -0.2),
        background: adjustColorIntensity(baseColors.background, -0.05),
        accent: adjustColorIntensity(baseColors.accent, -0.2),
        border: baseColors.accent + '20' // 12% opacity
      };
    }
  }

  return {
    primary: baseColors.primary,
    background: baseColors.background,
    accent: baseColors.accent,
    border: baseColors.accent + '30' // 19% opacity
  };
};

// Helper function to adjust color intensity
const adjustColorIntensity = (color: string, intensity: number): string => {
  // Simple intensity adjustment - in a real app you might use a color manipulation library
  if (color.startsWith('#')) {
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    const adjust = (value: number) => {
      const adjusted = value + (intensity * 255);
      return Math.max(0, Math.min(255, Math.round(adjusted)));
    };
    
    return `#${adjust(r).toString(16).padStart(2, '0')}${adjust(g).toString(16).padStart(2, '0')}${adjust(b).toString(16).padStart(2, '0')}`;
  }
  return color;
};

// Circadian pattern utilities
export const getCircadianData = (entries: MoodEntry[]) => {
  // Ensure entries is an array
  const safeEntries = Array.isArray(entries) ? entries : [];
  
  const hourCounts: Record<number, { count: number; moodSum: number; moods: number[] }> = {};
  
  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourCounts[i] = { count: 0, moodSum: 0, moods: [] };
  }
  
  // Process entries
  safeEntries.forEach(entry => {
    const date = new Date(entry.timestamp || entry.created_at || '');
    const hour = date.getHours();
    
    hourCounts[hour].count++;
    hourCounts[hour].moodSum += entry.mood_value;
    hourCounts[hour].moods.push(entry.mood_value);
  });
  
  // Calculate averages and create visualization data
  const circadianData = Object.keys(hourCounts).map(hour => {
    const hourNum = parseInt(hour);
    const data = hourCounts[hourNum];
    const avgMood = data.count > 0 ? data.moodSum / data.count : 0;
    
    // Convert hour to clock position (12 o'clock is top)
    const angle = (hourNum - 6) * 15; // -6 to start at 6AM at bottom, * 15 degrees per hour
    const radius = 80; // Base radius
    const intensity = Math.min(data.count / Math.max(...Object.values(hourCounts).map(h => h.count)), 1);
    
    return {
      hour: hourNum,
      count: data.count,
      avgMood,
      intensity,
      angle,
      x: Math.cos(angle * Math.PI / 180) * radius,
      y: Math.sin(angle * Math.PI / 180) * radius,
      color: avgMood > 0 ? getMoodColors(Math.round(avgMood)).accent : '#E5E7EB',
      size: Math.max(4, intensity * 12) // Dot size based on frequency
    };
  });
  
  return circadianData;
};

// Emotional flow utilities
export const getEmotionalFlowData = (entries: MoodEntry[], days: number = 30) => {
  // Ensure entries is an array
  const safeEntries = Array.isArray(entries) ? entries : [];
  
  // Get last N days of data
  const now = new Date();
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  
  const recentEntries = safeEntries.filter(entry => {
    const entryDate = new Date(entry.timestamp || entry.created_at || '');
    return entryDate >= startDate;
  });
  
  // Group by date
  const dailyData: Record<string, { moods: number[], date: Date, avgMood: number }> = {};
  
  recentEntries.forEach(entry => {
    const date = new Date(entry.timestamp || entry.created_at || '');
    const dateKey = date.toDateString();
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { moods: [], date, avgMood: 0 };
    }
    
    dailyData[dateKey].moods.push(entry.mood_value);
  });
  
  // Calculate daily averages
  Object.keys(dailyData).forEach(dateKey => {
    const data = dailyData[dateKey];
    data.avgMood = data.moods.reduce((sum, mood) => sum + mood, 0) / data.moods.length;
  });
  
  // Create flow data
  const flowData = Object.values(dailyData)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((data, index) => ({
      date: data.date,
      avgMood: data.avgMood,
      entryCount: data.moods.length,
      color: getMoodColors(Math.round(data.avgMood)).accent,
      x: index,
      y: data.avgMood
    }));
  
  return flowData;
};

// Trend analysis
export const getTrendDirection = (flowData: ReturnType<typeof getEmotionalFlowData>) => {
  if (flowData.length < 2) return 'stable';
  
  const recent = flowData.slice(-7); // Last 7 data points
  const firstHalf = recent.slice(0, Math.ceil(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.avgMood, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.avgMood, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  
  if (difference > 0.3) return 'improving';
  if (difference < -0.3) return 'declining';
  return 'stable';
};

// Get peak energy times
export const getPeakEnergyTimes = (circadianData: ReturnType<typeof getCircadianData>) => {
  const energyTimes = circadianData
    .filter(d => d.count > 0 && d.avgMood >= 4) // Good or great moods
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3);
  
  return energyTimes.map(t => ({
    hour: t.hour,
    timeLabel: formatHour(t.hour),
    avgMood: t.avgMood,
    frequency: t.count
  }));
};

const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};