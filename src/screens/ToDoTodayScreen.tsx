import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';
import { Bubble as BubbleComponent } from '../components/Bubble';
import { Bubble as BubbleType } from '../types/bubble';

export const ToDoTodayScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const today = new Date();

  // Mock data - will be replaced with real bubble store later
  const [bubbles, setBubbles] = useState<BubbleType[]>([
    {
      id: '1',
      type: 'task',
      title: 'Review PRs',
      emoji: '💻',
      content: 'Code review session',
      color: '#95E1D3',
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      urgency: 'high',
      importance: 5,
      dueDate: today,
      typeData: {
        isCompleted: false,
        priority: 'high',
        steps: [],
      },
      connections: [],
      childBubbleIds: [],
    },
    {
      id: '2',
      type: 'task',
      title: 'Update Documentation',
      emoji: '📝',
      content: 'Add API documentation',
      color: '#FFD93D',
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      urgency: 'medium',
      importance: 3,
      dueDate: today,
      typeData: {
        isCompleted: false,
        priority: 'medium',
        steps: [],
      },
      connections: [],
      childBubbleIds: [],
    },
    {
      id: '3',
      type: 'task',
      title: 'Team Standup',
      emoji: '👥',
      content: 'Daily sync meeting',
      color: '#A8E6CF',
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      urgency: 'high',
      importance: 4,
      dueDate: today,
      schedule: {
        startDate: new Date(today.setHours(9, 0, 0, 0)),
        recurrence: 'daily',
      },
      typeData: {
        isCompleted: false,
        priority: 'high',
        steps: [],
      },
      connections: [],
      childBubbleIds: [],
    },
  ]);

  // Group bubbles by urgency
  const highUrgency = bubbles.filter(b => b.urgency === 'high');
  const mediumUrgency = bubbles.filter(b => b.urgency === 'medium');
  const lowUrgency = bubbles.filter(b => b.urgency === 'low' || !b.urgency);

  const completedCount = bubbles.filter(b =>
    b.typeData && 'isCompleted' in b.typeData && b.typeData.isCompleted
  ).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>✅ To Do Today</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {completedCount} of {bubbles.length} completed
          </Text>
          <Text style={[styles.progressPercent, { color: colors.accent }]}>
            {bubbles.length > 0 ? Math.round((completedCount / bubbles.length) * 100) : 0}%
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: colors.accent,
                width: `${bubbles.length > 0 ? (completedCount / bubbles.length) * 100 : 0}%`,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* High Priority */}
        {highUrgency.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.urgencyDot}>🔴</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                High Urgency ({highUrgency.length})
              </Text>
            </View>
            {highUrgency.map(bubble => (
              <View key={bubble.id} style={styles.bubbleItem}>
                <BubbleComponent
                  bubble={bubble}
                  onPress={() => {}}
                />
              </View>
            ))}
          </View>
        )}

        {/* Medium Priority */}
        {mediumUrgency.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.urgencyDot}>🟡</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Medium Urgency ({mediumUrgency.length})
              </Text>
            </View>
            {mediumUrgency.map(bubble => (
              <View key={bubble.id} style={styles.bubbleItem}>
                <BubbleComponent
                  bubble={bubble}
                  onPress={() => {}}
                />
              </View>
            ))}
          </View>
        )}

        {/* Low Priority */}
        {lowUrgency.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.urgencyDot}>🟢</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Low Urgency ({lowUrgency.length})
              </Text>
            </View>
            {lowUrgency.map(bubble => (
              <View key={bubble.id} style={styles.bubbleItem}>
                <BubbleComponent
                  bubble={bubble}
                  onPress={() => {}}
                />
              </View>
            ))}
          </View>
        )}

        {bubbles.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyEmoji, { color: colors.textSecondary }]}>🎉</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              All done for today!
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              No tasks due today
            </Text>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    width: 60,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.title,
  },
  progressSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  progressPercent: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  urgencyDot: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
  },
  bubbleItem: {
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
  },
});
