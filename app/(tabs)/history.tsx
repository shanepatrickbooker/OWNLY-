import { useFocusEffect, router } from 'expo-router';
import React, { useState, useCallback, useMemo, memo } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  RefreshControl,
  TouchableOpacity,
  TextInput,
  FlatList,
  Share,
  Alert
} from 'react-native';
import { getAllMoodEntries } from './database/database';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout, getColors } from '../../constants/Design';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FREE_TIER_LIMITS } from '../../types/subscription';
import { getMoodColors } from '../../utils/visualizations';
import EmotionalFlow from '../../components/EmotionalFlow';
import HeaderLogo from '../../components/HeaderLogo';

interface MoodEntry {
  id?: number;
  mood_value: number;
  mood_label: string;
  reflection?: string;
  timestamp: string;
  created_at?: string;
}

interface GroupedEntries {
  title: string;
  data: MoodEntry[];
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

const MOOD_FILTERS = [
  { label: 'All Moods', value: 'all' },
  { label: 'Happy', value: 'positive', moods: ['Happy', 'Joyful', 'Content'] },
  { label: 'Neutral', value: 'neutral', moods: ['Neutral'] },
  { label: 'Difficult', value: 'negative', moods: ['Sad', 'Frustrated', 'Angry', 'Worried', 'Anxious'] }
];

export default function HistoryScreen() {
  const { hasPremium } = useSubscription();
  const { isDark } = useTheme();
  
  // Get theme-appropriate colors
  const colors = getColors(isDark);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const allEntries = await getAllMoodEntries();
      // Sort by created_at descending (newest first)
      const sortedEntries = allEntries.sort((a, b) => {
        const dateA = new Date(a.created_at || a.timestamp).getTime();
        const dateB = new Date(b.created_at || b.timestamp).getTime();
        return dateB - dateA;
      });
      setEntries(sortedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Unable to load your history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadEntries();
  }, [loadEntries]));

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let filtered = entries;
    
    // Apply date filter for free users (limit to last 30 days)
    if (!hasPremium) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - FREE_TIER_LIMITS.maxHistoryDays);
      
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.created_at || entry.timestamp);
        return entryDate >= thirtyDaysAgo;
      });
    }

    // Apply mood filter
    if (selectedMoodFilter !== 'all') {
      const filter = MOOD_FILTERS.find(f => f.value === selectedMoodFilter);
      if (filter && filter.moods) {
        filtered = filtered.filter(entry => filter.moods!.includes(entry.mood_label));
      }
    }

    // Apply text search
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.mood_label.toLowerCase().includes(searchLower) ||
        (entry.reflection && entry.reflection.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [entries, selectedMoodFilter, searchText, hasPremium]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: GroupedEntries[] = [];
    const now = new Date();
    
    filteredEntries.forEach(entry => {
      const entryDate = new Date(entry.created_at || entry.timestamp);
      const diffTime = now.getTime() - entryDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let groupTitle: string;
      if (diffDays === 0) {
        groupTitle = 'Today';
      } else if (diffDays === 1) {
        groupTitle = 'Yesterday';
      } else if (diffDays <= 7) {
        groupTitle = 'This Week';
      } else if (diffDays <= 30) {
        groupTitle = 'This Month';
      } else if (diffDays <= 90) {
        groupTitle = 'Last 3 Months';
      } else {
        groupTitle = 'Older';
      }

      let existingGroup = groups.find(g => g.title === groupTitle);
      if (!existingGroup) {
        existingGroup = { title: groupTitle, data: [] };
        groups.push(existingGroup);
      }
      existingGroup.data.push(entry);
    });

    return groups;
  }, [filteredEntries]);

  const formatDateTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const exportEntries = async (entriesToExport: MoodEntry[]) => {
    if (entriesToExport.length === 0) {
      Alert.alert('No Entries', 'No entries to export.');
      return;
    }

    const exportText = entriesToExport.map(entry => {
      const date = formatDateTime(entry.created_at || entry.timestamp);
      return `${date} - ${MOOD_EMOJIS[entry.mood_label] || '😊'} ${entry.mood_label}${entry.reflection ? `\n${entry.reflection}` : ''}\n`;
    }).join('\n');

    try {
      await Share.share({
        message: `My Mood History (${entriesToExport.length} entries)\n\n${exportText}`,
        title: 'Mood History Export'
      });
    } catch (error) {
      console.error('Error sharing entries:', error);
      Alert.alert('Error', 'Unable to export entries. Please try again.');
    }
  };

  const EntryRow = memo(function EntryRow({ item }: { item: MoodEntry }) {
    const colors = getMoodColors(item.mood_value, (item as any).sentiment_data);
    
    return (
      <View style={[
        styles.entryCard,
        { 
          backgroundColor: colors.background,
          borderLeftColor: colors.accent,
        }
      ]}>
        <View style={styles.entryHeader}>
          <View style={styles.moodInfo}>
            <Text style={styles.moodEmoji}>{MOOD_EMOJIS[item.mood_label] || '😊'}</Text>
            <View>
              <Text style={styles.moodLabel}>{item.mood_label}</Text>
              <Text style={styles.entryTime}>{formatDateTime(item.created_at || item.timestamp)}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => exportEntries([item])}
          >
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
        {item.reflection && item.reflection.trim() && (
          <Text style={styles.reflectionText}>{item.reflection}</Text>
        )}
      </View>
    );
  });

  const renderEntry = ({ item }: { item: MoodEntry }) => (
    <EntryRow item={item} />
  );

  const renderGroup = ({ item }: { item: GroupedEntries }) => (
    <View style={styles.groupContainer}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{item.title}</Text>
        <Text style={styles.groupCount}>({item.data.length} entries)</Text>
        {item.data.length > 1 && (
          <TouchableOpacity 
            style={styles.exportGroupButton}
            onPress={() => exportEntries(item.data)}
          >
            <Text style={styles.exportGroupButtonText}>Export All</Text>
          </TouchableOpacity>
        )}
      </View>
      {item.data.map((entry, index) => (
        <EntryRow key={entry.id || index} item={entry} />
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📖</Text>
      <Text style={styles.emptyTitle}>No entries found</Text>
      <Text style={styles.emptyText}>
        {searchText || selectedMoodFilter !== 'all' 
          ? 'Try adjusting your search or filters to see more entries.'
          : 'Start tracking your moods to see your journey unfold here.'}
      </Text>
    </View>
  );

  // Create theme-aware styles
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <HeaderLogo />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Your Journey</Text>
        <Text style={styles.subtitle}>
          {entries.length} reflection{entries.length !== 1 ? 's' : ''} recorded
        </Text>
      </View>

      {/* Premium Banner for Free Users */}
      {!hasPremium && entries.length > 0 && (
        <TouchableOpacity 
          style={styles.premiumBanner}
          onPress={() => router.push('/paywall?trigger=history_access')}
        >
          <Text style={styles.bannerIcon}>🔓</Text>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>See Your Complete Journey</Text>
            <Text style={styles.bannerText}>
              Viewing last 30 days • Upgrade to access unlimited history
            </Text>
          </View>
          <Text style={styles.bannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Emotional Flow Chart */}
      {entries.length > 1 && (
        <View style={styles.flowContainer}>
          <Text style={styles.flowTitle}>Recent Emotional Flow</Text>
          <EmotionalFlow 
            entries={filteredEntries} 
            width={320} 
            height={120} 
            days={hasPremium ? 30 : 14} 
            showTrend={true} 
          />
        </View>
      )}

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search reflections..."
          value={searchText}
          onChangeText={setSearchText}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity 
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Options */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodFilters}>
            {MOOD_FILTERS.map(filter => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.moodFilterButton,
                  selectedMoodFilter === filter.value && styles.moodFilterButtonActive
                ]}
                onPress={() => setSelectedMoodFilter(filter.value)}
              >
                <Text style={[
                  styles.moodFilterText,
                  selectedMoodFilter === filter.value && styles.moodFilterTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {filteredEntries.length > 0 && (
            <TouchableOpacity 
              style={styles.exportAllButton}
              onPress={() => exportEntries(filteredEntries)}
            >
              <Text style={styles.exportAllButtonText}>Export All ({filteredEntries.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Entries List */}
      <FlatList
        data={groupedEntries}
        keyExtractor={(item) => item.title}
        renderItem={renderGroup}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEntries} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        initialNumToRender={4}
        maxToRenderPerBatch={3}
        windowSize={8}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={16}
        getItemLayout={undefined}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    color: colors.text.primary,
    ...Shadows.card,
  },
  filterButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.card,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
    ...Shadows.brand,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.secondary,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  moodFilters: {
    flexDirection: 'row',
  },
  moodFilterButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moodFilterButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  moodFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  moodFilterTextActive: {
    color: '#ffffff',
  },
  exportAllButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  exportAllButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  groupCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  exportGroupButton: {
    backgroundColor: '#059669',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 'auto',
  },
  exportGroupButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  entryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    borderLeftWidth: 4, // Colored left border
    ...Shadows.card,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moodEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  moodLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  entryTime: {
    fontSize: Typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  exportButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  exportButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  reflectionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary[700],
    marginBottom: Spacing.xs / 2,
  },
  bannerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  bannerArrow: {
    fontSize: Typography.fontSize.xl,
    color: Colors.primary[600],
    marginLeft: Spacing.sm,
  },
  flowContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  flowTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
});