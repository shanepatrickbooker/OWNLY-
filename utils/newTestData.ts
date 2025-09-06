import { MoodEntry, saveMoodEntry, clearAllMoodData } from '../app/(tabs)/database/database';

export const generateEnhancedTestData = async (): Promise<void> => {
  try {
    if (__DEV__) console.log('🚀 Generating NEW Enhanced Pattern Test Data...');
    
    // Clear existing data first
    await clearAllMoodData();
    
    const now = new Date();
    
    const testEntries: Omit<MoodEntry, 'id' | 'created_at'>[] = [
      // PATTERN: Exercise consistently helps (will trigger improvement pattern)
      {
        mood_value: 2,
        mood_label: 'Stressed',
        reflection: 'Feeling really stressed about the deadline tomorrow. Maybe I should go for a run.',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 4,
        mood_label: 'Better',
        reflection: 'Went for a run after work and feel so much better. The exercise really cleared my head.',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString()
      },
      
      // PATTERN: "Can't sleep" predicts difficult next day
      {
        mood_value: 3,
        mood_label: 'Tired',
        reflection: 'Can\'t sleep properly lately. Tossing and turning all night thinking about work.',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 2,
        mood_label: 'Exhausted',
        reflection: 'Terrible day. So tired from not sleeping well. Made mistakes at work because can\'t focus.',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // Repeat the sleep pattern to strengthen it
      {
        mood_value: 3,
        mood_label: 'Restless',
        reflection: 'Can\'t sleep again. Mind racing with tomorrow\'s presentation.',
        timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 1,
        mood_label: 'Awful',
        reflection: 'Worst day in weeks. No energy, snapped at everyone. This lack of sleep is killing me.',
        timestamp: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // PATTERN: Meditation helps with anxiety
      {
        mood_value: 2,
        mood_label: 'Anxious',
        reflection: 'Anxiety building up about the family gathering this weekend.',
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 4,
        mood_label: 'Calm',
        reflection: 'Did a 20 minute meditation session. Feeling much more centered and ready to handle whatever comes.',
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString()
      },
      
      // PATTERN: Thursday productivity boost
      {
        mood_value: 5,
        mood_label: 'Accomplished',
        reflection: 'Thursday productivity strikes again! Finished all my tasks and even got ahead on next week.',
        timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 4,
        mood_label: 'Productive',
        reflection: 'Another great Thursday. Something about this day makes me super focused and energetic.',
        timestamp: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 5,
        mood_label: 'Energized',
        reflection: 'Thursday magic! Crushed my goals today. Best day of the week as usual.',
        timestamp: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // PATTERN: Social isolation leads to mood decline
      {
        mood_value: 3,
        mood_label: 'Lonely',
        reflection: 'Haven\'t seen friends in a while. Working from home is getting isolating.',
        timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 2,
        mood_label: 'Down',
        reflection: 'Feeling really disconnected. Need to reach out to someone but don\'t have the energy.',
        timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 5,
        mood_label: 'Happy',
        reflection: 'Finally met up with friends for coffee! Feel like myself again. Social connection is so important.',
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString()
      },
      
      // PATTERN: Sunday anxiety about Monday
      {
        mood_value: 2,
        mood_label: 'Worried',
        reflection: 'Sunday scaries hitting hard. Can\'t stop thinking about Monday\'s meetings.',
        timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 2,
        mood_label: 'Anxious',
        reflection: 'Another Sunday ruined by work anxiety. Why does this always happen?',
        timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 3,
        mood_label: 'Tense',
        reflection: 'Sunday evening and the dread is setting in. Tomorrow\'s going to be rough.',
        timestamp: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // PATTERN: Morning routine sets the tone
      {
        mood_value: 4,
        mood_label: 'Good',
        reflection: 'Started with morning yoga and healthy breakfast. Feel ready for anything.',
        timestamp: new Date(new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).setHours(7, 0, 0, 0)).toISOString()
      },
      {
        mood_value: 5,
        mood_label: 'Great',
        reflection: 'Kept the good morning momentum all day. Note to self: morning routine is key!',
        timestamp: new Date(new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).setHours(20, 0, 0, 0)).toISOString()
      },
      
      // PATTERN: Nature improves mood
      {
        mood_value: 2,
        mood_label: 'Stuck',
        reflection: 'Feeling trapped in the apartment. Everything feels heavy and difficult.',
        timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 4,
        mood_label: 'Refreshed',
        reflection: 'Spent an hour in the park. Nature always helps me reset. Why do I forget this?',
        timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString()
      },
      
      // PATTERN: Creative expression helps process emotions
      {
        mood_value: 1,
        mood_label: 'Overwhelmed',
        reflection: 'Everything is too much. Can\'t process all these feelings.',
        timestamp: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 3,
        mood_label: 'Processing',
        reflection: 'Spent time journaling and drawing. Getting the feelings out on paper really helps.',
        timestamp: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString()
      },
      
      // PATTERN: Work stress recurring phrase
      {
        mood_value: 2,
        mood_label: 'Stressed',
        reflection: 'Project deadline coming up and feeling the pressure. Team is counting on me.',
        timestamp: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 2,
        mood_label: 'Pressured',
        reflection: 'Another project deadline looming. Why is it always like this?',
        timestamp: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 1,
        mood_label: 'Burned out',
        reflection: 'Project deadline tomorrow and I\'m not ready. This cycle is exhausting.',
        timestamp: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // More exercise patterns
      {
        mood_value: 2,
        mood_label: 'Sluggish',
        reflection: 'Feel so tired and unmotivated today. Should probably exercise but don\'t want to.',
        timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 4,
        mood_label: 'Energized',
        reflection: 'Forced myself to go to the gym and glad I did! Exercise really does work.',
        timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString()
      },
      
      // Recent positive trend
      {
        mood_value: 3,
        mood_label: 'Okay',
        reflection: 'Starting to feel more stable. The new habits are beginning to work.',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 4,
        mood_label: 'Hopeful',
        reflection: 'Three good days in a row. Maybe I\'m finally turning a corner.',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Add all test entries
    for (const entry of testEntries) {
      await saveMoodEntry(entry);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    if (__DEV__) console.log(`🚀 Generated ${testEntries.length} Enhanced Pattern entries!`);
    if (__DEV__) console.log('🧠 Expected patterns:');
    if (__DEV__) console.log('• Exercise consistently improves mood');
    if (__DEV__) console.log('• "Can\'t sleep" predicts difficult next day');  
    if (__DEV__) console.log('• Meditation helps with anxiety');
    if (__DEV__) console.log('• Thursday productivity patterns');
    if (__DEV__) console.log('• Social isolation → mood decline');
    if (__DEV__) console.log('• Sunday anxiety about Monday');
    if (__DEV__) console.log('• Morning routine sets daily tone');
    if (__DEV__) console.log('• Nature resets mood');
    if (__DEV__) console.log('• Creative expression processes emotions');
    if (__DEV__) console.log('• "Project deadline" stress trigger');
    
  } catch (error) {
    if (__DEV__) console.error('Error generating enhanced test data:', error);
    throw error;
  }
};