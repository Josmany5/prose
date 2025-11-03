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

export const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  // Mock analytics data
  const [analytics] = useState({
    totalBubbles: 47,
    completedToday: 8,
    completedThisWeek: 24,
    completedThisMonth: 89,
    currentStreak: 12,
    longestStreak: 28,
    completionRate: 76,
    productivityScore: 8.4,
    typeBreakdown: [
      { type: 'Tasks', count: 18, percentage: 38 },
      { type: 'Projects', count: 12, percentage: 26 },
      { type: 'Goals', count: 8, percentage: 17 },
      { type: 'Notes', count: 5, percentage: 11 },
      { type: 'Other', count: 4, percentage: 8 },
    ],
    weeklyActivity: [
      { day: 'Mon', completed: 5 },
      { day: 'Tue', completed: 7 },
      { day: 'Wed', completed: 4 },
      { day: 'Thu', completed: 6 },
      { day: 'Fri', completed: 8 },
      { day: 'Sat', completed: 3 },
      { day: 'Sun', completed: 2 },
    ],
  });

  const maxWeeklyActivity = Math.max(...analytics.weeklyActivity.map(d => d.completed));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>📊 Analytics</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricValue, { color: colors.accent }]}>
              {analytics.completedToday}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Completed Today
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricValue, { color: colors.accent }]}>
              {analytics.completedThisWeek}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              This Week
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricValue, { color: colors.accent }]}>
              {analytics.currentStreak} 🔥
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Day Streak
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricValue, { color: colors.accent }]}>
              {analytics.completionRate}%
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Completion Rate
            </Text>
          </View>
        </View>

        {/* Productivity Score */}
        <View style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Productivity Score
          </Text>
          <View style={styles.scoreDisplay}>
            <Text style={[styles.scoreValue, { color: colors.accent }]}>
              {analytics.productivityScore}
            </Text>
            <Text style={[styles.scoreMax, { color: colors.textSecondary }]}>/10</Text>
          </View>
          <View style={[styles.scoreBarBg, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.scoreBarFill,
                {
                  backgroundColor: colors.accent,
                  width: `${(analytics.productivityScore / 10) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Weekly Activity */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Weekly Activity
          </Text>
          <View style={styles.chartContainer}>
            {analytics.weeklyActivity.map(day => {
              const barHeight = (day.completed / maxWeeklyActivity) * 100;
              return (
                <View key={day.day} style={styles.chartBar}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${barHeight}%`,
                          backgroundColor: colors.accent,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barValue, { color: colors.text }]}>
                    {day.completed}
                  </Text>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                    {day.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Type Breakdown */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Bubble Types
          </Text>
          {analytics.typeBreakdown.map((item, index) => (
            <View key={index} style={styles.typeItem}>
              <View style={styles.typeHeader}>
                <Text style={[styles.typeName, { color: colors.text }]}>
                  {item.type}
                </Text>
                <Text style={[styles.typePercentage, { color: colors.accent }]}>
                  {item.percentage}%
                </Text>
              </View>
              <View style={[styles.typeBarBg, { backgroundColor: colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.typeBarFill,
                    {
                      backgroundColor: colors.accent,
                      width: `${item.percentage}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.typeCount, { color: colors.textSecondary }]}>
                {item.count} bubbles
              </Text>
            </View>
          ))}
        </View>

        {/* Achievements */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Achievements
          </Text>
          <View style={styles.achievementGrid}>
            <View style={styles.achievement}>
              <Text style={styles.achievementEmoji}>🏆</Text>
              <Text style={[styles.achievementLabel, { color: colors.text }]}>
                Longest Streak
              </Text>
              <Text style={[styles.achievementValue, { color: colors.accent }]}>
                {analytics.longestStreak} days
              </Text>
            </View>
            <View style={styles.achievement}>
              <Text style={styles.achievementEmoji}>💯</Text>
              <Text style={[styles.achievementLabel, { color: colors.text }]}>
                This Month
              </Text>
              <Text style={[styles.achievementValue, { color: colors.accent }]}>
                {analytics.completedThisMonth}
              </Text>
            </View>
            <View style={styles.achievement}>
              <Text style={styles.achievementEmoji}>📈</Text>
              <Text style={[styles.achievementLabel, { color: colors.text }]}>
                Total Bubbles
              </Text>
              <Text style={[styles.achievementValue, { color: colors.accent }]}>
                {analytics.totalBubbles}
              </Text>
            </View>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  metricCard: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    ...FONTS.bold,
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  metricLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.tiny,
    textAlign: 'center',
  },
  scoreCard: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    marginBottom: SPACING.md,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  scoreValue: {
    ...FONTS.bold,
    fontSize: 48,
  },
  scoreMax: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.subtitle,
    marginLeft: SPACING.xs,
  },
  scoreBarBg: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  section: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 100,
    width: 24,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
    marginTop: SPACING.xs,
  },
  barLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.tiny,
    marginTop: SPACING.xs,
  },
  typeItem: {
    marginBottom: SPACING.md,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  typeName: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  typePercentage: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
  },
  typeBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  typeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  typeCount: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.tiny,
  },
  achievementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  achievement: {
    alignItems: 'center',
    flex: 1,
  },
  achievementEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  achievementLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.tiny,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  achievementValue: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
  },
});
