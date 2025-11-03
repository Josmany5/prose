import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Entry } from '../types';
import { NoteFormat } from '../types';

interface BlockRendererProps {
  entry: Entry;
  colors: any;
  filterFormat?: NoteFormat;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ entry, colors, filterFormat }) => {
  // Local styles for the block renderer
  const styles = StyleSheet.create({
    entryText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      fontFamily: 'System',
    },
    entryFormatBlock: {
      marginTop: 8,
      paddingLeft: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    highlightedFormatBlock: {
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      borderLeftColor: '#FFD700',
    },
    formatBlockTitle: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
      marginBottom: 8,
    },
    formatBlockItem: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
      lineHeight: 20,
    },
    formatBlockItemSecondary: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
      lineHeight: 20,
    },
    completedItem: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
    },
  });

  if (entry.contentBlocks && entry.contentBlocks.length > 0) {
    // Render contentBlocks with proper interleaving
    return (
      <View>
        {entry.contentBlocks.map((block) => {
          if (block.type === 'text') {
            return (
              <Text key={block.id} style={[styles.entryText]}>
                {block.content}
              </Text>
            );
          } else if (block.type === 'format') {
            // Render the format block
            let formatBlock = null;
            switch (block.formatType) {
              case NoteFormat.TASK:
                if (entry.formatData?.tasks) {
                  formatBlock = (
                    <View style={[
                      styles.entryFormatBlock,
                      filterFormat === NoteFormat.TASK && styles.highlightedFormatBlock
                    ]}>
                      <Text style={[styles.formatBlockTitle]}>
                        ✅ Tasks:
                      </Text>
                      {entry.formatData.tasks.map((task: any) => (
                        <Text key={task.id} style={[
                          styles.formatBlockItem,
                          task.isCompleted && styles.completedItem
                        ]}>
                          {task.isCompleted ? '✓' : '□'} {task.description}
                        </Text>
                      ))}
                    </View>
                  );
                }
                break;

              case NoteFormat.PROJECT:
                if (entry.formatData?.projectMilestones || entry.formatData?.projectPipeline) {
                  formatBlock = (
                    <View style={[
                      styles.entryFormatBlock,
                      filterFormat === NoteFormat.PROJECT && styles.highlightedFormatBlock
                    ]}>
                      <Text style={[styles.formatBlockTitle]}>
                        🚀 Project:
                      </Text>
                      {entry.formatData.projectPipeline && (
                        <View>
                          <Text style={[styles.formatBlockItem]}>
                            {entry.formatData.projectPipeline.projectName || 'Unnamed Project'}
                          </Text>
                          {entry.formatData.projectPipeline.notes && (
                            <Text style={[styles.formatBlockItemSecondary]}>
                              {entry.formatData.projectPipeline.notes}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                }
                break;

              case NoteFormat.GOAL:
                if (entry.formatData?.goalProgress) {
                  formatBlock = (
                    <View style={[
                      styles.entryFormatBlock,
                      filterFormat === NoteFormat.GOAL && styles.highlightedFormatBlock
                    ]}>
                      <Text style={[styles.formatBlockTitle]}>
                        👑 Goal:
                      </Text>
                      <Text style={[styles.formatBlockItem]}>
                        {entry.formatData.goalProgress.description}
                      </Text>
                      <Text style={[styles.formatBlockItemSecondary]}>
                        Progress: {entry.formatData.goalProgress.progress}%
                      </Text>
                    </View>
                  );
                }
                break;

              case NoteFormat.JOURNAL:
                if (entry.formatData?.journalMood) {
                  formatBlock = (
                    <View style={[
                      styles.entryFormatBlock,
                      filterFormat === NoteFormat.JOURNAL && styles.highlightedFormatBlock
                    ]}>
                      <Text style={[styles.formatBlockTitle]}>
                        📓 Mood: {entry.formatData.journalMood.emoji} {entry.formatData.journalMood.label || ''}
                      </Text>
                    </View>
                  );
                }
                break;

              case NoteFormat.LIBRARY:
                if (entry.formatData?.libraryLinks && entry.formatData.libraryLinks.length > 0) {
                  formatBlock = (
                    <View style={[
                      styles.entryFormatBlock,
                      filterFormat === NoteFormat.LIBRARY && styles.highlightedFormatBlock
                    ]}>
                      <Text style={[styles.formatBlockTitle]}>
                        📚 Links ({entry.formatData.libraryLinks.length}):
                      </Text>
                      {entry.formatData.libraryLinks.slice(0, 3).map((link: any) => (
                        <Text key={link.id} style={[styles.formatBlockItem]}>
                          {link.title || link.url}
                        </Text>
                      ))}
                      {entry.formatData.libraryLinks.length > 3 && (
                        <Text style={[styles.formatBlockItemSecondary]}>
                          and {entry.formatData.libraryLinks.length - 3} more...
                        </Text>
                      )}
                    </View>
                  );
                }
                break;

              case NoteFormat.IDEAS:
                if (entry.formatData?.ideas && entry.formatData.ideas.length > 0) {
                  formatBlock = (
                    <View style={[
                      styles.entryFormatBlock,
                      filterFormat === NoteFormat.IDEAS && styles.highlightedFormatBlock
                    ]}>
                      <Text style={[styles.formatBlockTitle]}>
                        🔥 Ideas ({entry.formatData.ideas.length}):
                      </Text>
                      {entry.formatData.ideas.map((idea: string, i: number) => (
                        <Text key={i} style={[styles.formatBlockItem]}>
                          • {idea}
                        </Text>
                      ))}
                    </View>
                  );
                }
                break;

              default:
                formatBlock = null;
            }
            return formatBlock;
          }
          return null;
        })}
      </View>
    );
  } else {
    // Fallback to legacy rendering if no contentBlocks
    return (
      <View>
        {/* Text Content */}
        {entry.content && (
          <Text style={[styles.entryText]}>
            {entry.content}
          </Text>
        )}

        {/* Legacy format blocks... */}
        {/* Copy the existing JSX for TASK, PROJECT, GOAL from previous version */}
        {entry.entryFormats?.includes(NoteFormat.TASK) && entry.formatData?.tasks && (
          <View style={[
            styles.entryFormatBlock,
            filterFormat === NoteFormat.TASK && styles.highlightedFormatBlock
          ]}>
            <Text style={[styles.formatBlockTitle]}>✅ Tasks:</Text>
            {entry.formatData.tasks.map((task: any) => (
              <Text key={task.id} style={[
                styles.formatBlockItem,
                task.isCompleted && styles.completedItem
              ]}>
                {task.isCompleted ? '✓' : '□'} {task.description}
              </Text>
            ))}
          </View>
        )}

        {entry.entryFormats?.includes(NoteFormat.PROJECT) && entry.formatData?.projectMilestones && (
          <View style={[
            styles.entryFormatBlock,
            filterFormat === NoteFormat.PROJECT && styles.highlightedFormatBlock
          ]}>
            <Text style={[styles.formatBlockTitle]}>🚀 Project:</Text>
            {entry.formatData.projectMilestones.map((m: any) => (
              <Text key={m.id} style={[
                styles.formatBlockItem,
                m.isCompleted && styles.completedItem
              ]}>
                {m.isCompleted ? '✓' : '□'} {m.description}
              </Text>
            ))}
          </View>
        )}

        {entry.entryFormats?.includes(NoteFormat.GOAL) && entry.formatData?.goalProgress && (
          <View style={[
            styles.entryFormatBlock,
            filterFormat === NoteFormat.GOAL && styles.highlightedFormatBlock
          ]}>
            <Text style={[styles.formatBlockTitle]}>👑 Goal:</Text>
            <Text style={[styles.formatBlockItem]}>
              {entry.formatData.goalProgress.description}
            </Text>
            <Text style={[styles.formatBlockItemSecondary]}>
              Progress: {entry.formatData.goalProgress.progress}%
            </Text>
          </View>
        )}
      </View>
    );
  }
};

export default BlockRenderer;
