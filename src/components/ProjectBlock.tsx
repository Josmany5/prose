import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { PipelineStage, type ProjectPipeline } from '../types';

interface ProjectBlockProps {
  pipeline: ProjectPipeline;
  onPipelineChange: (pipeline: ProjectPipeline) => void;
  colors: any;
}

const PIPELINE_STAGES = [
  { stage: PipelineStage.CAPTURE, emoji: '💭', label: 'Capture' },
  { stage: PipelineStage.DEVELOP, emoji: '🌱', label: 'Develop' },
  { stage: PipelineStage.BUILD, emoji: '🔨', label: 'Build' },
  { stage: PipelineStage.EXECUTE, emoji: '🚀', label: 'Execute' },
  { stage: PipelineStage.COMPLETE, emoji: '✅', label: 'Complete' },
];

export const ProjectBlock: React.FC<ProjectBlockProps> = ({ pipeline, onPipelineChange, colors }) => {
  const handleStageClick = (stage: PipelineStage) => {
    onPipelineChange({
      ...pipeline,
      currentStage: stage,
      completedAt: stage === PipelineStage.COMPLETE ? new Date() : undefined,
    });
  };

  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.stage === pipeline.currentStage);

  return (
    <View style={styles.container}>
      <Text style={[styles.headerText, { color: colors.text }]}>🚀 Project Pipeline</Text>

      {/* Project Name Input */}
      <TextInput
        style={[styles.projectNameInput, { color: colors.text, borderColor: colors.border }]}
        placeholder="Project name (optional)"
        placeholderTextColor={colors.textSecondary}
        value={pipeline.projectName || ''}
        onChangeText={(projectName) => onPipelineChange({ ...pipeline, projectName })}
      />

      {/* Pipeline Stages */}
      <View style={styles.pipelineContainer}>
        {PIPELINE_STAGES.map((stageInfo, index) => {
          const isActive = stageInfo.stage === pipeline.currentStage;
          const isPast = index < currentStageIndex;
          const isFuture = index > currentStageIndex;

          return (
            <React.Fragment key={stageInfo.stage}>
              <TouchableOpacity
                style={[
                  styles.stageButton,
                  { borderColor: colors.border },
                  isActive && { backgroundColor: colors.accent, borderColor: colors.accent },
                  isPast && { backgroundColor: colors.accent + '40', borderColor: colors.accent },
                ]}
                onPress={() => handleStageClick(stageInfo.stage)}
              >
                <Text style={[
                  styles.stageEmoji,
                  isActive && { fontSize: 24 }
                ]}>
                  {stageInfo.emoji}
                </Text>
                <Text style={[
                  styles.stageLabel,
                  { color: isActive ? '#FFFFFF' : colors.text },
                  isFuture && { opacity: 0.5 }
                ]}>
                  {stageInfo.label}
                </Text>
              </TouchableOpacity>

              {/* Arrow between stages */}
              {index < PIPELINE_STAGES.length - 1 && (
                <Text style={[styles.arrow, { color: colors.textSecondary }]}>→</Text>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Project Notes */}
      <TextInput
        style={[styles.notesInput, { color: colors.text, borderColor: colors.border }]}
        placeholder="Project notes..."
        placeholderTextColor={colors.textSecondary}
        value={pipeline.notes || ''}
        onChangeText={(notes) => onPipelineChange({ ...pipeline, notes })}
        multiline
      />
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
  projectNameInput: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: SPACING.md,
  },
  pipelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  stageButton: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 70,
  },
  stageEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  stageLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  arrow: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  notesInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: 4,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
