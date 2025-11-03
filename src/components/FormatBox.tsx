import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { NoteFormat, FORMAT_EMOJIS, type EntryFormatData } from '../types';
import { TaskBlock } from './TaskBlock';
import { ProjectBlock } from './ProjectBlock';
import { GoalBlock } from './GoalBlock';
import { JournalMoodBlock } from './JournalMoodBlock';
import { LibraryBlock } from './LibraryBlock';
import { IdeasBlock } from './IdeasBlock';

interface FormatBoxProps {
  activeFormats: NoteFormat[];
  formatData: EntryFormatData;
  onFormatDataChange: (formatData: EntryFormatData) => void;
  onAddFormat: () => void;
  onRemoveFormat: (format: NoteFormat) => void;
  colors: any;
}

export const FormatBox: React.FC<FormatBoxProps> = ({
  activeFormats,
  formatData,
  onFormatDataChange,
  onAddFormat,
  onRemoveFormat,
  colors,
}) => {
  // If no formats are active, show the add button
  if (activeFormats.length === 0) {
    return (
      <TouchableOpacity
        style={[styles.addFormatButton, { borderColor: colors.border }]}
        onPress={onAddFormat}
      >
        <Text style={[styles.addFormatText, { color: colors.accent }]}>
          + Add Format Block
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.formatBoxContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Format Pills Header */}
      <View style={styles.formatPillsContainer}>
        {activeFormats.map((format) => (
          <View key={format} style={[styles.formatPill, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}>
            <Text style={[styles.formatPillText, { color: colors.text }]}>
              {FORMAT_EMOJIS[format]} {format.toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => onRemoveFormat(format)} style={styles.removePillButton}>
              <Text style={styles.removePillText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={onAddFormat} style={styles.addMoreButton}>
          <Text style={[styles.addMoreText, { color: colors.accent }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Format Blocks */}
      <View style={styles.formatBlocksContainer}>
        {activeFormats.map((format) => {
          switch (format) {
            case NoteFormat.TASK:
              return (
                <View key={format} style={styles.formatBlock}>
                  <TaskBlock
                    tasks={formatData.tasks || []}
                    onTasksChange={(tasks) => onFormatDataChange({ ...formatData, tasks })}
                    colors={colors}
                  />
                </View>
              );

            case NoteFormat.PROJECT:
              return (
                <View key={format} style={styles.formatBlock}>
                  <ProjectBlock
                    pipeline={formatData.projectPipeline || {
                      currentStage: 'capture' as any,
                      projectName: '',
                      notes: '',
                    }}
                    onPipelineChange={(pipeline) => onFormatDataChange({ ...formatData, projectPipeline: pipeline })}
                    colors={colors}
                  />
                </View>
              );

            case NoteFormat.GOAL:
              return (
                <View key={format} style={styles.formatBlock}>
                  <GoalBlock
                    goalData={formatData.goalProgress || { description: '', progress: 0 }}
                    onGoalChange={(goalData) => onFormatDataChange({ ...formatData, goalProgress: goalData })}
                    colors={colors}
                  />
                </View>
              );

            case NoteFormat.JOURNAL:
              return (
                <View key={format} style={styles.formatBlock}>
                  <JournalMoodBlock
                    mood={formatData.journalMood}
                    onMoodChange={(mood) => onFormatDataChange({ ...formatData, journalMood: mood })}
                    colors={colors}
                  />
                </View>
              );

            case NoteFormat.LIBRARY:
              return (
                <View key={format} style={styles.formatBlock}>
                  <LibraryBlock
                    links={formatData.libraryLinks || []}
                    onLinksChange={(links) => onFormatDataChange({ ...formatData, libraryLinks: links })}
                    colors={colors}
                  />
                </View>
              );

            case NoteFormat.IDEAS:
              return (
                <View key={format} style={styles.formatBlock}>
                  <IdeasBlock
                    ideas={formatData.ideas || []}
                    onIdeasChange={(ideas) => onFormatDataChange({ ...formatData, ideas })}
                    colors={colors}
                  />
                </View>
              );

            default:
              return null;
          }
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  addFormatButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  addFormatText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  formatBoxContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  formatPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  formatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 16,
    borderWidth: 1,
  },
  formatPillText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
    marginRight: SPACING.xs,
  },
  removePillButton: {
    marginLeft: SPACING.xs,
  },
  removePillText: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  addMoreButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  addMoreText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  formatBlocksContainer: {
    gap: SPACING.md,
  },
  formatBlock: {
    // Each format block container
  },
});
