import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { NoteFormat, FORMAT_EMOJIS, type EntryFormatData } from '../types';
import { TaskBlock } from './TaskBlock';
import { ProjectBlock } from './ProjectBlock';
import { GoalBlock } from './GoalBlock';
import { JournalMoodBlock } from './JournalMoodBlock';
import { LibraryBlock } from './LibraryBlock';
import { IdeasBlock } from './IdeasBlock';

export type ContentBlock =
  | { type: 'text'; id: string; content: string }
  | { type: 'format'; id: string; format: NoteFormat };

interface UnifiedContentBoxProps {
  blocks: ContentBlock[];
  formatData: EntryFormatData;
  onBlocksChange: (blocks: ContentBlock[]) => void;
  onFormatDataChange: (formatData: EntryFormatData) => void;
  onAddTextBlock: (afterId?: string) => void;
  onAddFormatBlock: (format: NoteFormat, afterId?: string) => void;
  colors: any;
}

export const UnifiedContentBox: React.FC<UnifiedContentBoxProps> = ({
  blocks,
  formatData,
  onBlocksChange,
  onFormatDataChange,
  onAddTextBlock,
  onAddFormatBlock,
  colors,
}) => {
  const handleTextChange = (blockId: string, text: string) => {
    const updatedBlocks = blocks.map(block =>
      block.type === 'text' && block.id === blockId
        ? { ...block, content: text }
        : block
    );
    onBlocksChange(updatedBlocks);
  };

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    onBlocksChange(updatedBlocks);
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    if (block.type === 'text') {
      return (
        <View key={block.id} style={styles.textBlockContainer}>
          <TextInput
            style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Write here..."
            placeholderTextColor={colors.textSecondary}
            value={block.content}
            onChangeText={(text) => handleTextChange(block.id, text)}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.deleteBlockButton}
            onPress={() => handleDeleteBlock(block.id)}
          >
            <Text style={styles.deleteBlockText}>×</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Format block
      return (
        <View key={block.id} style={styles.formatBlockContainer}>
          {renderFormatBlock(block.format)}
          <TouchableOpacity
            style={styles.deleteBlockButton}
            onPress={() => handleDeleteBlock(block.id)}
          >
            <Text style={styles.deleteBlockText}>×</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  const renderFormatBlock = (format: NoteFormat) => {
    switch (format) {
      case NoteFormat.TASK:
        return (
          <TaskBlock
            tasks={formatData.tasks || []}
            onTasksChange={(tasks) => onFormatDataChange({ ...formatData, tasks })}
            colors={colors}
          />
        );
      case NoteFormat.PROJECT:
        return (
          <ProjectBlock
            pipeline={formatData.projectPipeline || {
              currentStage: 'capture' as any,
              projectName: '',
              notes: '',
            }}
            onPipelineChange={(pipeline) => onFormatDataChange({ ...formatData, projectPipeline: pipeline })}
            colors={colors}
          />
        );
      case NoteFormat.GOAL:
        return (
          <GoalBlock
            goalData={formatData.goalProgress || { description: '', progress: 0 }}
            onGoalChange={(goalData) => onFormatDataChange({ ...formatData, goalProgress: goalData })}
            colors={colors}
          />
        );
      case NoteFormat.JOURNAL:
        return (
          <JournalMoodBlock
            mood={formatData.journalMood}
            onMoodChange={(mood) => onFormatDataChange({ ...formatData, journalMood: mood })}
            colors={colors}
          />
        );
      case NoteFormat.LIBRARY:
        return (
          <LibraryBlock
            links={formatData.libraryLinks || []}
            onLinksChange={(links) => onFormatDataChange({ ...formatData, libraryLinks: links })}
            colors={colors}
          />
        );
      case NoteFormat.IDEAS:
        return (
          <IdeasBlock
            ideas={formatData.ideas || []}
            onIdeasChange={(ideas) => onFormatDataChange({ ...formatData, ideas })}
            colors={colors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {blocks.map((block, index) => renderBlock(block, index))}

      {/* Add Block Button */}
      <TouchableOpacity
        style={[styles.addBlockButton, { borderColor: colors.border }]}
        onPress={() => onAddTextBlock()}
      >
        <Text style={[styles.addBlockText, { color: colors.textSecondary }]}>+ Add Text Block</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  textBlockContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  textInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.6,
    padding: SPACING.sm,
    borderWidth: 1,
    borderRadius: 4,
    minHeight: 80,
  },
  formatBlockContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  deleteBlockButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBlockText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  addBlockButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
  },
  addBlockText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
});
