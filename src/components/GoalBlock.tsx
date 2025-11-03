import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import type { GoalData } from '../types';

interface GoalBlockProps {
  goalData: GoalData;
  onGoalChange: (goalData: GoalData) => void;
  colors: any;
}

export const GoalBlock: React.FC<GoalBlockProps> = ({ goalData, onGoalChange, colors }) => {
  const handleProgressChange = (delta: number) => {
    const newProgress = Math.max(0, Math.min(100, goalData.progress + delta));
    onGoalChange({ ...goalData, progress: newProgress });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.text }]}>👑 Goal</Text>
      </View>

      {/* Goal Description */}
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholder="What's your goal?"
        placeholderTextColor={colors.textSecondary}
        value={goalData.description}
        onChangeText={(text) => onGoalChange({ ...goalData, description: text })}
      />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress:</Text>

        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[
            styles.progressFill,
            { width: `${goalData.progress}%`, backgroundColor: colors.accent }
          ]} />
        </View>

        <Text style={[styles.progressText, { color: colors.text }]}>{goalData.progress}%</Text>
      </View>

      {/* Progress Controls */}
      <View style={styles.progressControls}>
        <TouchableOpacity
          style={[styles.progressButton, { borderColor: colors.border }]}
          onPress={() => handleProgressChange(-10)}
        >
          <Text style={[styles.progressButtonText, { color: colors.text }]}>-10%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.progressButton, { borderColor: colors.border }]}
          onPress={() => handleProgressChange(-5)}
        >
          <Text style={[styles.progressButtonText, { color: colors.text }]}>-5%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.progressButton, { borderColor: colors.border }]}
          onPress={() => handleProgressChange(5)}
        >
          <Text style={[styles.progressButtonText, { color: colors.text }]}>+5%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.progressButton, { borderColor: colors.border }]}
          onPress={() => handleProgressChange(10)}
        >
          <Text style={[styles.progressButtonText, { color: colors.text }]}>+10%</Text>
        </TouchableOpacity>
      </View>

      {/* Target */}
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholder="Target (optional)"
        placeholderTextColor={colors.textSecondary}
        value={goalData.target}
        onChangeText={(text) => onGoalChange({ ...goalData, target: text })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  header: {
    marginBottom: SPACING.sm,
  },
  headerText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
  },
  input: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  progressLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  progressBar: {
    flex: 1,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    minWidth: 45,
    textAlign: 'right',
  },
  progressControls: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  progressButton: {
    flex: 1,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
  },
  progressButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
});
