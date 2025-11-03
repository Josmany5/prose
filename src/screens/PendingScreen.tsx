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

export const PendingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  // Mock data - will be replaced with real bubble store later
  const [bubbles] = useState<BubbleType[]>([
    {
      id: '1',
      type: 'task',
      title: 'Waiting for Design Review',
      emoji: '⏸️',
      content: 'Blocked by design team approval',
      color: '#FFA07A',
      position: { x: 0, y: 0 },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      tags: ['blocked'],
      urgency: 'medium',
      importance: 3,
      typeData: {
        isCompleted: false,
        priority: 'medium',
        steps: [],
      },
      connections: [],
      childBubbleIds: [],
    },
    {
      id: '2',
      type: 'project',
      title: 'API Integration',
      emoji: '🔌',
      content: 'Waiting for API credentials from client',
      color: '#98D8C8',
      position: { x: 0, y: 0 },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      tags: ['waiting', 'external'],
      urgency: 'high',
      importance: 4,
      typeData: {
        progress: 30,
        milestones: [],
      },
      connections: [],
      childBubbleIds: [],
    },
    {
      id: '3',
      type: 'task',
      title: 'Code Review Pending',
      emoji: '👀',
      content: 'PR submitted, waiting for team review',
      color: '#B4A7D6',
      position: { x: 0, y: 0 },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      tags: ['waiting'],
      urgency: 'low',
      importance: 2,
      typeData: {
        isCompleted: false,
        priority: 'low',
        steps: [],
      },
      connections: [],
      childBubbleIds: [],
    },
  ]);

  const getDaysWaiting = (createdAt: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>⏸️ Pending</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryText, { color: colors.text }]}>
            You have <Text style={{ fontWeight: 'bold' }}>{bubbles.length} pending bubbles</Text> waiting for action
          </Text>
        </View>

        {/* Pending Bubbles List */}
        <View style={styles.bubbleList}>
          {bubbles.map(bubble => {
            const daysWaiting = getDaysWaiting(bubble.createdAt);
            const isStale = daysWaiting > 3;

            return (
              <View key={bubble.id} style={styles.bubbleItem}>
                <BubbleComponent
                  bubble={bubble}
                  onPress={() => {}}
                />
                <View style={styles.bubbleInfo}>
                  <Text style={[styles.waitingText, { color: isStale ? '#FF6B6B' : colors.textSecondary }]}>
                    ⏱️ Waiting {daysWaiting} day{daysWaiting !== 1 ? 's' : ''}
                    {isStale && ' (Stale)'}
                  </Text>
                  <Text style={[styles.contentPreview, { color: colors.textSecondary }]}>
                    {bubble.content}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {bubbles.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyEmoji, { color: colors.textSecondary }]}>✨</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No pending bubbles!
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              All tasks are active or completed
            </Text>
          </View>
        )}
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  summary: {
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  summaryText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
  },
  bubbleList: {
    marginTop: SPACING.md,
  },
  bubbleItem: {
    marginBottom: SPACING.lg,
  },
  bubbleInfo: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
  },
  waitingText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  contentPreview: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    marginTop: SPACING.xs,
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
