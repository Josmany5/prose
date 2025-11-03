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

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  // Mock data - will be replaced with real bubble store later
  const [bubbles] = useState<BubbleType[]>([
    {
      id: '1',
      type: 'task',
      title: 'Team Meeting',
      emoji: '👥',
      content: 'Discuss Q1 goals',
      color: '#FF6B6B',
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      schedule: {
        startDate: new Date(new Date().setHours(10, 0, 0, 0)),
        recurrence: 'weekly',
        notifications: true,
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
      id: '2',
      type: 'workout',
      title: 'Morning Run',
      emoji: '🏃',
      content: '5km jog',
      color: '#4ECDC4',
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      schedule: {
        startDate: new Date(new Date().setHours(6, 30, 0, 0)),
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
  ]);

  // Get current month and year
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Generate calendar days
  const getDaysInMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth, currentYear);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getBubblesForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return bubbles.filter(bubble => {
      if (!bubble.schedule?.startDate) return false;
      const scheduleDate = new Date(bubble.schedule.startDate);

      // Check if it's the same day
      if (scheduleDate.toDateString() === date.toDateString()) {
        return true;
      }

      // Check recurring bubbles
      if (bubble.schedule.recurrence === 'daily') {
        return scheduleDate <= date;
      }

      if (bubble.schedule.recurrence === 'weekly') {
        return scheduleDate <= date && scheduleDate.getDay() === date.getDay();
      }

      if (bubble.schedule.recurrence === 'monthly') {
        return scheduleDate <= date && scheduleDate.getDate() === date.getDate();
      }

      return false;
    });
  };

  const scheduledBubbles = bubbles.filter(b => b.schedule?.startDate);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>📅 Calendar</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <Text style={[styles.navButtonText, { color: colors.accent }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Text style={[styles.navButtonText, { color: colors.accent }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Day Labels */}
        <View style={styles.dayLabels}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={[styles.dayLabel, { color: colors.textSecondary }]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            const isToday = day === today.getDate() &&
                           currentMonth === today.getMonth() &&
                           currentYear === today.getFullYear();
            const bubblesForDay = day ? getBubblesForDay(day) : [];

            return (
              <View
                key={index}
                style={[
                  styles.dayCell,
                  { borderColor: colors.border },
                  isToday && { backgroundColor: colors.accent + '20' },
                ]}
              >
                {day && (
                  <>
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: colors.text },
                        isToday && { color: colors.accent, fontWeight: 'bold' },
                      ]}
                    >
                      {day}
                    </Text>
                    {bubblesForDay.length > 0 && (
                      <View style={styles.bubbleDots}>
                        {bubblesForDay.slice(0, 3).map((bubble, i) => (
                          <View
                            key={i}
                            style={[
                              styles.bubbleDot,
                              { backgroundColor: bubble.color },
                            ]}
                          />
                        ))}
                        {bubblesForDay.length > 3 && (
                          <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                            +{bubblesForDay.length - 3}
                          </Text>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          })}
        </View>

        {/* Scheduled Bubbles List */}
        <View style={styles.scheduledSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Scheduled Bubbles ({scheduledBubbles.length})
          </Text>
          {scheduledBubbles.map(bubble => (
            <View key={bubble.id} style={styles.bubbleItem}>
              <BubbleComponent
                bubble={bubble}
                onPress={() => {}}
              />
              <Text style={[styles.scheduleInfo, { color: colors.textSecondary }]}>
                {bubble.schedule?.startDate &&
                  new Date(bubble.schedule.startDate).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }
                {bubble.schedule?.recurrence && bubble.schedule.recurrence !== 'none' &&
                  ` • Repeats ${bubble.schedule.recurrence}`
                }
              </Text>
            </View>
          ))}
        </View>
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
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  navButton: {
    padding: SPACING.sm,
  },
  navButtonText: {
    ...FONTS.bold,
    fontSize: 24,
  },
  monthTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.sm,
  },
  dayLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
    width: '14.28%',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 0.5,
    padding: SPACING.xs,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  dayNumber: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  bubbleDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  bubbleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  moreText: {
    ...FONTS.medium,
    fontSize: 8,
  },
  scheduledSection: {
    marginTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    marginBottom: SPACING.md,
  },
  bubbleItem: {
    marginBottom: SPACING.md,
  },
  scheduleInfo: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.tiny,
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
  },
});
