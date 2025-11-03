import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SAMPLE_BUBBLES, BUBBLE_TYPE_INFO } from '../data/sampleBubbles';
import { Bubble as BubbleType } from '../types/bubble';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [bubbles] = useState<BubbleType[]>(SAMPLE_BUBBLES);

  // Calculate stats
  const stats = {
    total: bubbles.length,
    tasks: bubbles.filter(b => b.type === 'task').length,
    projects: bubbles.filter(b => b.type === 'project').length,
    goals: bubbles.filter(b => b.type === 'goal').length,
    notes: bubbles.filter(b => b.type === 'note').length,
  };

  // Get recent bubbles (last 5)
  const recentBubbles = bubbles
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const navigateToBubblePlayground = () => {
    navigation.navigate('BubblePlayground' as never);
  };

  const navigateToCreateBubble = () => {
    navigation.navigate('CreateBubble' as never);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🫧 Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Welcome Section */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome to Bubbles</Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
            Your unified workspace for notes, tasks, projects, and more
          </Text>
        </View>

        {/* Stats Cards */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>🫧</Text>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Bubbles</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.tasks}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tasks</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>📋</Text>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.projects}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Projects</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.goals}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Goals</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
          onPress={navigateToCreateBubble}
        >
          <Text style={styles.actionButtonText}>➕ Create New Bubble</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          onPress={navigateToBubblePlayground}
        >
          <Text style={[styles.actionButtonTextAlt, { color: colors.text }]}>🫧 View All Bubbles</Text>
        </TouchableOpacity>

        {/* Recent Bubbles */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Bubbles</Text>
        <View style={styles.recentList}>
          {recentBubbles.map((bubble) => {
            const typeInfo = BUBBLE_TYPE_INFO[bubble.type];
            return (
              <TouchableOpacity
                key={bubble.id}
                style={[styles.recentBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={navigateToBubblePlayground}
              >
                <Text style={styles.recentEmoji}>{bubble.emoji}</Text>
                <View style={styles.recentContent}>
                  <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>
                    {bubble.title}
                  </Text>
                  <View style={styles.recentMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: bubble.color }]}>
                      <Text style={styles.typeBadgeText}>{typeInfo.label}</Text>
                    </View>
                    {bubble.urgency && bubble.urgency !== 'none' && (
                      <Text style={styles.urgencyIndicator}>
                        {bubble.urgency === 'high' && '🔴'}
                        {bubble.urgency === 'medium' && '🟡'}
                        {bubble.urgency === 'low' && '🟢'}
                      </Text>
                    )}
                    {bubble.importance && (
                      <Text style={styles.importanceIndicator}>
                        {'⭐'.repeat(bubble.importance)}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dashboard Widgets */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dashboard</Text>

        {/* Calendar Widget */}
        <TouchableOpacity
          style={[styles.widgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Calendar' as never)}
        >
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetIcon}>📅</Text>
            <Text style={[styles.widgetTitle, { color: colors.text }]}>Calendar</Text>
          </View>
          <Text style={[styles.widgetSubtitle, { color: colors.textSecondary }]}>
            View scheduled bubbles and upcoming events
          </Text>
        </TouchableOpacity>

        {/* Today's Planner Widget */}
        <TouchableOpacity
          style={[styles.widgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Planner' as never)}
        >
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetIcon}>🕐</Text>
            <Text style={[styles.widgetTitle, { color: colors.text }]}>Today's Planner</Text>
          </View>
          <Text style={[styles.widgetSubtitle, { color: colors.textSecondary }]}>
            Time-based schedule for today's tasks
          </Text>
        </TouchableOpacity>

        {/* Pending Widget */}
        <TouchableOpacity
          style={[styles.widgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Pending' as never)}
        >
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetIcon}>⏸️</Text>
            <Text style={[styles.widgetTitle, { color: colors.text }]}>Pending</Text>
          </View>
          <Text style={[styles.widgetSubtitle, { color: colors.textSecondary }]}>
            Waiting and blocked tasks
          </Text>
        </TouchableOpacity>

        {/* To Do Today Widget */}
        <TouchableOpacity
          style={[styles.widgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('ToDoToday' as never)}
        >
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetIcon}>✅</Text>
            <Text style={[styles.widgetTitle, { color: colors.text }]}>To Do Today</Text>
          </View>
          <Text style={[styles.widgetSubtitle, { color: colors.textSecondary }]}>
            Tasks due today and priorities
          </Text>
        </TouchableOpacity>

        {/* Analytics Widget */}
        <TouchableOpacity
          style={[styles.widgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Analytics' as never)}
        >
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetIcon}>📊</Text>
            <Text style={[styles.widgetTitle, { color: colors.text }]}>Analytics</Text>
          </View>
          <Text style={[styles.widgetSubtitle, { color: colors.textSecondary }]}>
            Completion rates, streaks, and insights
          </Text>
        </TouchableOpacity>
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
  headerTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
  },
  backButton: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  welcomeCard: {
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  welcomeTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.title,
    marginBottom: SPACING.xs,
  },
  welcomeText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  statNumber: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.large,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
  },
  actionButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  actionButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  actionButtonTextAlt: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  recentList: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  recentBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: SPACING.md,
  },
  recentEmoji: {
    fontSize: 32,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.xs,
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
    color: '#FFFFFF',
  },
  urgencyIndicator: {
    fontSize: 14,
  },
  importanceIndicator: {
    fontSize: 12,
  },
  chevron: {
    ...FONTS.bold,
    fontSize: 24,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  typeCard: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeCardEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  typeCardLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  widgetCard: {
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  widgetIcon: {
    fontSize: 28,
    marginRight: SPACING.sm,
  },
  widgetTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
  },
  widgetSubtitle: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    lineHeight: FONT_SIZES.small * 1.4,
  },
});
