import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import type { Mood } from '../types';

interface JournalMoodBlockProps {
  mood?: Mood;
  onMoodChange: (mood?: Mood) => void;
  colors: any;
}

const MOOD_OPTIONS: Mood[] = [
  { emoji: '😊', label: 'Happy', colorHex: '#FFD700' },
  { emoji: '😌', label: 'Calm', colorHex: '#87CEEB' },
  { emoji: '😔', label: 'Sad', colorHex: '#4682B4' },
  { emoji: '😡', label: 'Angry', colorHex: '#FF6347' },
  { emoji: '😴', label: 'Tired', colorHex: '#9370DB' },
  { emoji: '😃', label: 'Excited', colorHex: '#FF69B4' },
];

export const JournalMoodBlock: React.FC<JournalMoodBlockProps> = ({ mood, onMoodChange, colors }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.headerText, { color: colors.text }]}>📔 Mood</Text>

      <View style={styles.moodGrid}>
        {MOOD_OPTIONS.map((moodOption) => {
          const isSelected = mood?.emoji === moodOption.emoji;
          return (
            <TouchableOpacity
              key={moodOption.emoji}
              style={[
                styles.moodButton,
                { borderColor: colors.border },
                isSelected && { backgroundColor: colors.accent + '20', borderColor: colors.accent }
              ]}
              onPress={() => onMoodChange(isSelected ? undefined : moodOption)}
            >
              <Text style={styles.moodEmoji}>{moodOption.emoji}</Text>
              <Text style={[styles.moodLabel, { color: colors.text }]}>{moodOption.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  headerText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.sm,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  moodButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 80,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  moodLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
});
