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

export const PlannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const today = new Date();

  // Mock data - will be replaced with real bubble store later
  const [bubbles] = useState<BubbleType[]>([
    {
      id: '1',
      type: 'workout',
      title: 'Morning Run',
      emoji: '🏃',
      content: '5km jog',
      color: '#4ECDC4',
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      urgency: 'high',
      importance: 4,
      schedule: {
        startDate: new Date(today.setHours(6, 30, 0, 0)),
        recurrence: 'daily',
        notifications: true,
      },
      typeData: {
        exercises: [],
        totalDuration: 30,
      },
      connections: [],
      childBubbleIds: [],
    },
    {
      id: '2',
      type: 'task',
      title: 'Review PRs',
      emoji: '💻',
      content: 'Code review session',
      color: '#95E1D3',
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      urgency: 'medium',
      importance: 3,
      schedule: {
        startDate: new Date(today.setHours(9, 0, 0, 0)),
      },
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
      title: 'Team Meeting',
      emoji: '👥',
      content: 'Discuss Q1 goals',
      color: '#FF6B6B',
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      urgency: 'high',
      importance: 5,
      schedule: {
        startDate: new Date(today.setHours(10, 0, 0, 0)),
        recurrence: 'weekly',
      },
      typeData: {
        isCompleted: false,
        priority: 'high',
        steps: [],
      },
      connections: [],
      childBubbleIds: [],
    },
    {
      id: '4',
      type: 'task',
      title: 'Lunch Break',
      emoji: '🍽️',
      content: 'Take a break',
      color: '#F8B500',
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      schedule: {
        startDate: new Date(today.setHours(12, 0, 0, 0)),
        recurrence: 'daily',
      },
      typeData: {
        isCompleted: false,
        priority: 'low',
        steps: [],
      },
      connections: [],
      childBubbleIds: [],
    },
    {
      id: '5',
      type: 'task',
      title: 'Client Call',
      emoji: '📞',
      content: 'Project update',
      color: '#A8E6CF',
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      urgency: 'high',
      importance: 5,
      schedule: {
        startDate: new Date(today.setHours(14, 30, 0, 0)),
      },
      typeData: {
        isCompleted: false,
        priority: 'high',
        steps: [],
      },
      connections: [],
      childBubbleIds: [],
    },
    {
      id: '6',
      type: 'workout',
      title: 'Evening Workout',
      emoji: '💪',
      content: 'Gym session',
      color: '#FFD93D',
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      urgency: 'medium',
      importance: 3,
      schedule: {
        startDate: new Date(today.setHours(18, 0, 0, 0)),
        recurrence: 'daily',
      },
      typeData: {
        exercises: [],
        totalDuration: 60,
      },
      connections: [],
      childBubbleIds: [],
    },
  ]);

  // Filter bubbles for today
  const todayBubbles = bubbles
    .filter(b => {
      if (!b.schedule?.startDate) return false;
      const scheduleDate = new Date(b.schedule.startDate);
      return scheduleDate.toDateString() === today.toDateString() ||
        b.schedule.recurrence === 'daily';
    })
    .sort((a, b) => {
      const timeA = a.schedule?.startDate ? new Date(a.schedule.startDate).getHours() * 60 +
        new Date(a.schedule.startDate).getMinutes() : 0;
      const timeB = b.schedule?.startDate ? new Date(b.schedule.startDate).getHours() * 60 +
        new Date(b.schedule.startDate).getMinutes() : 0;
      return timeA - timeB;
    });

  // Generate timeline hours (6 AM to 10 PM)
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

  const getTimeLabel = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${period}`;
  };

  const getBubblesForHour = (hour: number) => {
    return todayBubbles.filter(bubble => {
      if (!bubble.schedule?.startDate) return false;
      const scheduleHour = new Date(bubble.schedule.startDate).getHours();
      return scheduleHour === hour;
    });
  };

  const currentHour = new Date().getHours();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🕐 Today's Planner</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Date Header */}
      <View style={styles.dateHeader}>
        <Text style={[styles.dateText, { color: colors.text }]}>
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {todayBubbles.length} scheduled
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timeline */}
        <View style={styles.timeline}>
          {hours.map(hour => {
            const bubblesAtHour = getBubblesForHour(hour);
            const isCurrentHour = hour === currentHour;

            return (
              <View key={hour} style={styles.hourBlock}>
                <View style={styles.timeColumn}>
                  <Text
                    style={[
                      styles.timeLabel,
                      { color: colors.textSecondary },
                      isCurrentHour && { color: colors.accent, fontWeight: 'bold' },
                    ]}
                  >
                    {getTimeLabel(hour)}
                  </Text>
                  {isCurrentHour && (
                    <View style={[styles.currentIndicator, { backgroundColor: colors.accent }]} />
                  )}
                </View>

                <View style={styles.bubbleColumn}>
                  {bubblesAtHour.length > 0 ? (
                    bubblesAtHour.map(bubble => (
                      <View key={bubble.id} style={styles.bubbleItem}>
                        <BubbleComponent
                          bubble={bubble}
                          onPress={() => {}}
                        />
                      </View>
                    ))
                  ) : (
                    <View style={[styles.emptySlot, { borderColor: colors.border }]} />
                  )}
                </View>
              </View>
            );
          })}
        </View>

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
  dateHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  dateText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
  },
  countText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  timeline: {
    paddingHorizontal: SPACING.lg,
  },
  hourBlock: {
    flexDirection: 'row',
    minHeight: 80,
    marginBottom: SPACING.sm,
  },
  timeColumn: {
    width: 80,
    paddingRight: SPACING.md,
    position: 'relative',
  },
  timeLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  currentIndicator: {
    position: 'absolute',
    right: 0,
    top: 8,
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  bubbleColumn: {
    flex: 1,
    gap: SPACING.sm,
  },
  bubbleItem: {
    marginBottom: SPACING.xs,
  },
  emptySlot: {
    height: 60,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    opacity: 0.3,
  },
});
