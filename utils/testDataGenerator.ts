import { saveMoodEntry } from '../app/(tabs)/database/database';

interface TestEntry {
  mood_value: number;
  mood_label: string;
  reflection: string;
  daysAgo: number;
  preferredTime?: 'morning' | 'evening' | 'any';
  preferredDay?: 'weekday' | 'weekend' | 'monday' | 'any';
}

const testEntries: TestEntry[] = [
  // Happy/Content entries (mood 4-5) - Weekend focused
  {
    mood_value: 5,
    mood_label: 'Happy',
    reflection: "Had such a great day at work today! Finally finished that project I've been working on for months. My manager was really impressed with the results and mentioned it might lead to a promotion. Feeling so accomplished and proud of what I've achieved. The whole team celebrated with lunch and it just felt amazing to be recognized for all the hard work.",
    daysAgo: 1,
    preferredTime: 'evening',
    preferredDay: 'weekday'
  },
  {
    mood_value: 4,
    mood_label: 'Content',
    reflection: "Spent quality time with family today. We went to the park and had a picnic. The kids were laughing and playing, and for once everyone's phones were put away. These simple moments remind me what really matters in life.",
    daysAgo: 3,
    preferredTime: 'evening',
    preferredDay: 'weekend'
  },
  {
    mood_value: 5,
    mood_label: 'Joyful',
    reflection: "Best sleep I've had in weeks! Woke up naturally at 7am feeling completely refreshed. Sometimes it's the simple things like good sleep that make everything else fall into place. Ready to tackle whatever today brings.",
    daysAgo: 5,
    preferredTime: 'morning',
    preferredDay: 'weekend'
  },
  {
    mood_value: 4,
    mood_label: 'Content',
    reflection: "Cooked a delicious dinner from scratch tonight. Tried that new recipe I bookmarked months ago. Turned out even better than expected and the house smells amazing. Small wins like this make me feel capable and creative.",
    daysAgo: 8,
    preferredTime: 'evening',
    preferredDay: 'weekend'
  },
  {
    mood_value: 4,
    mood_label: 'Happy',
    reflection: "Friend called unexpectedly and we talked for hours. Haven't laughed that hard in ages. Connection with good people is everything.",
    daysAgo: 12,
    preferredTime: 'evening',
    preferredDay: 'weekend'
  },

  // Monday blues and work stress (mood 1-2) - Weekday focused, especially Mondays
  {
    mood_value: 1,
    mood_label: 'Frustrated',
    reflection: "Another Monday, another impossible deadline at work. Management keeps piling on more tasks without considering the time needed to do them properly. I'm starting to feel like I'm just spinning my wheels and nothing I do is ever good enough. The constant pressure is exhausting and I can feel my work quality suffering because there's just no time to do things right.",
    daysAgo: 2,
    preferredTime: 'morning',
    preferredDay: 'monday'
  },
  {
    mood_value: 2,
    mood_label: 'Frustrated',
    reflection: "Stuck in traffic for over an hour today because of construction they didn't bother announcing. Was already running late for an important meeting and this just made everything worse. Why can't they coordinate these things better? Lost an entire afternoon because of poor planning. Work days are so stressful.",
    daysAgo: 4,
    preferredTime: 'morning',
    preferredDay: 'weekday'
  },
  {
    mood_value: 1,
    mood_label: 'Frustrated',
    reflection: "Had a disagreement with my colleague today that really bothered me. They took credit for work I did and when I brought it up, they acted like it was no big deal. I hate office politics and feeling like I have to fight for basic recognition. Makes me question if this workplace is right for me. Work stress is getting to me.",
    daysAgo: 7,
    preferredTime: 'evening',
    preferredDay: 'weekday'
  },
  {
    mood_value: 2,
    mood_label: 'Frustrated',
    reflection: "Technology failed me again today at work. Computer crashed right before saving important work, then the backup wasn't working either. Lost three hours of progress. These tools are supposed to make life easier, not create more stress.",
    daysAgo: 15,
    preferredTime: 'morning',
    preferredDay: 'monday'
  },

  // Sad entries (mood 1-2) - Evening reflection pattern
  {
    mood_value: 2,
    mood_label: 'Sad',
    reflection: "Feeling really lonely lately. Most of my friends are busy with their own lives and I spend too many evenings alone. Social media makes it worse - everyone looks so happy and connected while I'm just sitting here by myself. Sometimes I wonder if I'm the only one who feels this disconnected from everyone else. Maybe I need to make more effort to reach out, but it's hard when you feel like you're always the one initiating.",
    daysAgo: 6,
    preferredTime: 'evening',
    preferredDay: 'weekday'
  },
  {
    mood_value: 1,
    mood_label: 'Sad',
    reflection: "Didn't get the promotion I was hoping for at work. They gave it to someone with less experience but better connections. All that extra work and staying late meant nothing in the end. Feeling like I'm not valued and wondering what the point of trying so hard is if politics matter more than performance.",
    daysAgo: 9,
    preferredTime: 'evening',
    preferredDay: 'weekday'
  },
  {
    mood_value: 2,
    mood_label: 'Sad',
    reflection: "Doctor's appointment didn't go as well as I hoped. Need more tests and the uncertainty is weighing on me. Health issues always make you realize how fragile everything is. Trying to stay positive but it's hard not to worry about what might be wrong.",
    daysAgo: 11,
    preferredTime: 'evening',
    preferredDay: 'any'
  },
  {
    mood_value: 1,
    mood_label: 'Sad',
    reflection: "Missing my grandmother today. Would have been her birthday. Sometimes grief hits you when you least expect it.",
    daysAgo: 18,
    preferredTime: 'evening',
    preferredDay: 'any'
  },

  // Recovery patterns - showing mood improvement after low periods
  {
    mood_value: 3,
    mood_label: 'Neutral',
    reflection: "Feeling a bit better today. Yesterday's work stress is behind me and I got some good sleep. Taking things one day at a time.",
    daysAgo: 1, // Day after Monday frustration
    preferredTime: 'morning',
    preferredDay: 'weekday'
  },

  // Anxious/Worried entries (mood 1-2) - Work focused
  {
    mood_value: 1,
    mood_label: 'Anxious',
    reflection: "Big presentation at work next week and I'm already losing sleep over it. Keep thinking about all the things that could go wrong - what if the technology fails, what if I forget important points, what if they ask questions I can't answer? My mind keeps spiraling through worst-case scenarios and I can't seem to focus on actually preparing. The more I worry, the less prepared I feel, which makes me worry even more. It's a vicious cycle.",
    daysAgo: 10,
    preferredTime: 'evening',
    preferredDay: 'weekday'
  },
  {
    mood_value: 2,
    mood_label: 'Worried',
    reflection: "Looked at my bank account today and the numbers aren't good. Bills keep going up but my salary stays the same. Started calculating monthly expenses and realized I'm barely breaking even. What happens if there's an emergency? Or if I lose my job? Financial stress keeps me awake at night thinking about all the what-ifs.",
    daysAgo: 13,
    preferredTime: 'evening',
    preferredDay: 'any'
  },
  {
    mood_value: 1,
    mood_label: 'Anxious',
    reflection: "Relationship feels strained lately. We've been arguing more and communicating less. I keep overthinking every conversation, wondering if this is the beginning of the end. Are we growing apart or just going through a rough patch? The uncertainty is killing me - I'd almost rather know for sure than live in this constant state of worry.",
    daysAgo: 14,
    preferredTime: 'evening',
    preferredDay: 'any'
  },
  {
    mood_value: 2,
    mood_label: 'Worried',
    reflection: "Job security feels uncertain with all the layoffs happening in our industry. Company meetings have that ominous tone lately. Everyone's walking on eggshells. Work is becoming a source of constant anxiety.",
    daysAgo: 16,
    preferredTime: 'morning',
    preferredDay: 'weekday'
  },

  // Neutral entries showing progress in reflection length
  {
    mood_value: 3,
    mood_label: 'Neutral',
    reflection: "Regular day at work. Got through my tasks, nothing particularly exciting or stressful. Sometimes these routine days are exactly what you need after a chaotic week. Just existing without drama feels peaceful.",
    daysAgo: 17,
    preferredTime: 'evening',
    preferredDay: 'weekday'
  },
  {
    mood_value: 3,
    mood_label: 'Neutral',
    reflection: "Watched a decent movie tonight. Wasn't amazing but killed some time. Feeling pretty average about everything lately - not great, not terrible, just fine.",
    daysAgo: 19,
    preferredTime: 'evening',
    preferredDay: 'weekend'
  },
  {
    mood_value: 3,
    mood_label: 'Neutral',
    reflection: "Work okay today.",
    daysAgo: 20,
    preferredTime: 'any',
    preferredDay: 'weekday'
  }
];

export const generateTestData = async (): Promise<void> => {
  try {
    console.log('🧪 Starting test data generation...');
    
    for (const entry of testEntries) {
      // Calculate timestamp (days ago from now)
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - entry.daysAgo);
      
      // Adjust day of week if specified
      if (entry.preferredDay === 'monday') {
        const currentDay = timestamp.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to Monday
        timestamp.setDate(timestamp.getDate() + mondayOffset);
      } else if (entry.preferredDay === 'weekday') {
        const currentDay = timestamp.getDay();
        if (currentDay === 0 || currentDay === 6) { // If weekend, move to Friday
          const fridayOffset = currentDay === 0 ? -2 : -1;
          timestamp.setDate(timestamp.getDate() + fridayOffset);
        }
      } else if (entry.preferredDay === 'weekend') {
        const currentDay = timestamp.getDay();
        if (currentDay >= 1 && currentDay <= 5) { // If weekday, move to Saturday
          const saturdayOffset = 6 - currentDay;
          timestamp.setDate(timestamp.getDate() + saturdayOffset);
        }
      }
      
      // Set time based on preference
      let hour: number;
      if (entry.preferredTime === 'morning') {
        hour = Math.floor(Math.random() * 4) + 7; // 7am-10am
      } else if (entry.preferredTime === 'evening') {
        hour = Math.floor(Math.random() * 4) + 19; // 7pm-10pm
      } else {
        hour = Math.floor(Math.random() * 14) + 8; // 8am-10pm
      }
      
      timestamp.setHours(
        hour,
        Math.floor(Math.random() * 60), // Random minute
        0,
        0
      );

      await saveMoodEntry({
        mood_value: entry.mood_value,
        mood_label: entry.mood_label,
        reflection: entry.reflection,
        timestamp: timestamp.toISOString()
      });

      console.log(`✅ Added ${entry.mood_label} entry (${entry.daysAgo} days ago)`);
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`🎉 Successfully generated ${testEntries.length} test entries!`);
    console.log('📊 You can now check the Insights tab to see patterns in the data');
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  }
};

export const getTestDataStats = () => {
  const stats = {
    total: testEntries.length,
    byMood: {
      happy: testEntries.filter(e => e.mood_value >= 4).length,
      neutral: testEntries.filter(e => e.mood_value === 3).length,
      frustrated_sad: testEntries.filter(e => e.mood_value === 2).length,
      anxious: testEntries.filter(e => e.mood_value === 1).length
    },
    withReflections: testEntries.filter(e => e.reflection.trim().length > 0).length,
    avgReflectionLength: Math.round(
      testEntries.reduce((acc, e) => acc + e.reflection.split(' ').length, 0) / testEntries.length
    )
  };
  
  return stats;
};