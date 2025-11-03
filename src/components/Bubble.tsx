import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bubble as BubbleType } from '../types/bubble';
import { BUBBLE_TYPE_INFO } from '../data/sampleBubbles';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';

interface BubbleProps {
  bubble: BubbleType;
  onPress?: (bubble: BubbleType) => void;
  onExpand?: (bubble: BubbleType) => void;
  onConnect?: (bubble: BubbleType) => void;
  onTransform?: (bubble: BubbleType) => void;
  onDelete?: (bubble: BubbleType) => void;
  onEdit?: (bubble: BubbleType) => void;
  onLongPress?: (bubble: BubbleType) => void;
  isExpanded?: boolean;
  compact?: boolean;
}

export const Bubble: React.FC<BubbleProps> = ({
  bubble,
  onPress,
  onExpand,
  onConnect,
  onTransform,
  onDelete,
  onEdit,
  onLongPress,
  isExpanded = false,
  compact = false,
}) => {
  const { colors } = useTheme();
  const typeInfo = BUBBLE_TYPE_INFO[bubble.type];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderTypeSpecificPreview = () => {
    switch (bubble.type) {
      case 'task':
        const taskData = bubble.typeData as any;
        return (
          <View style={styles.previewSection}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              {taskData.steps.filter((s: any) => s.isCompleted).length}/{taskData.steps.length} steps •
              {taskData.priority} priority
            </Text>
          </View>
        );

      case 'project':
        const projectData = bubble.typeData as any;
        return (
          <View style={styles.previewSection}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              Progress: {projectData.progress}%
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: bubble.color, width: `${projectData.progress}%` }
                ]}
              />
            </View>
          </View>
        );

      case 'goal':
        const goalData = bubble.typeData as any;
        return (
          <View style={styles.previewSection}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              {goalData.target} • {goalData.progress}% complete
            </Text>
          </View>
        );

      case 'journal':
        const journalData = bubble.typeData as any;
        return (
          <View style={styles.previewSection}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              {journalData.entries.length} entries • Mood: {journalData.currentMood}
            </Text>
          </View>
        );

      case 'ideas':
        const ideasData = bubble.typeData as any;
        return (
          <View style={styles.previewSection}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              {ideasData.ideas.length} ideas
            </Text>
          </View>
        );

      case 'library':
        const libraryData = bubble.typeData as any;
        return (
          <View style={styles.previewSection}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              {libraryData.items.length} items
            </Text>
          </View>
        );

      case 'document':
        const documentData = bubble.typeData as any;
        return (
          <View style={styles.previewSection}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              {documentData.wordCount} words • {documentData.readingTimeMinutes} min read
            </Text>
          </View>
        );

      case 'note':
        const noteData = bubble.typeData as any;
        return (
          <View style={styles.previewSection}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              {noteData.entries.length} entries
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  // Compact mode: Show only emoji centered
  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          {
            backgroundColor: colors.surface,
            borderColor: bubble.color,
            borderWidth: 2,
          },
        ]}
        onPress={() => onPress?.(bubble)}
        onLongPress={() => onLongPress?.(bubble)}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <Text style={styles.compactEmoji}>{bubble.emoji}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: bubble.color,
          borderWidth: 2,
        },
        isExpanded && styles.expandedContainer,
      ]}
      onPress={() => onPress?.(bubble)}
      onLongPress={() => onLongPress?.(bubble)}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{bubble.emoji}</Text>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {bubble.title}
            </Text>
            <View style={styles.indicators}>
              {/* NEW: Urgency Dots (matches notes system) */}
              {bubble.urgency && bubble.urgency !== 'none' && (
                <Text style={styles.urgency}>
                  {bubble.urgency === 'high' && '🔴'}
                  {bubble.urgency === 'medium' && '🟡'}
                  {bubble.urgency === 'low' && '🟢'}
                </Text>
              )}
              {/* NEW: Importance Stars */}
              {bubble.importance && (
                <Text style={styles.importance}>
                  {'⭐'.repeat(bubble.importance)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.typeContainer}>
            <View style={[styles.typeBadge, { backgroundColor: bubble.color }]}>
              <Text style={styles.typeText}>{typeInfo.label}</Text>
            </View>
            {/* NEW: Hierarchy Type Badge */}
            {bubble.hierarchyType && (
              <View style={[styles.hierarchyBadge, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.hierarchyText, { color: colors.textSecondary }]}>
                  {bubble.hierarchyType === 'goal' && '🎯'}
                  {bubble.hierarchyType === 'project' && '📋'}
                  {bubble.hierarchyType === 'task' && '✓'}
                  {bubble.hierarchyType === 'standalone' && '📌'}
                  {' '}{bubble.hierarchyType}
                </Text>
              </View>
            )}
            {/* NEW: Depth Indicator */}
            {bubble.depth !== undefined && bubble.depth > 0 && (
              <View style={[styles.depthBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.depthText}>↓ {bubble.depth}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Content Preview */}
      <Text
        style={[styles.content, { color: colors.textSecondary }]}
        numberOfLines={isExpanded ? undefined : 2}
      >
        {bubble.content}
      </Text>

      {/* Type-Specific Preview */}
      {renderTypeSpecificPreview()}

      {/* Metadata */}
      <View style={styles.metadata}>
        <Text style={[styles.metadataText, { color: colors.textSecondary }]}>
          Updated {formatDate(bubble.updatedAt)}
        </Text>
        {bubble.connections.length > 0 && (
          <Text style={[styles.metadataText, { color: colors.textSecondary }]}>
            🔗 {bubble.connections.length}
          </Text>
        )}
        {bubble.childBubbleIds.length > 0 && (
          <Text style={[styles.metadataText, { color: colors.textSecondary }]}>
            🫧 {bubble.childBubbleIds.length}
          </Text>
        )}
      </View>

      {/* Tags */}
      {bubble.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {bubble.tags.slice(0, 3).map((tag, index) => (
            <View
              key={index}
              style={[styles.tag, { backgroundColor: colors.surfaceVariant }]}
            >
              <Text style={[styles.tagText, { color: colors.text }]}>#{tag}</Text>
            </View>
          ))}
          {bubble.tags.length > 3 && (
            <Text style={[styles.moreTagsText, { color: colors.textSecondary }]}>
              +{bubble.tags.length - 3}
            </Text>
          )}
        </View>
      )}

      {/* Action Buttons (shown when expanded) */}
      {isExpanded && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => onEdit?.(bubble)}
          >
            <Text style={styles.actionButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => onConnect?.(bubble)}
          >
            <Text style={styles.actionButtonText}>🔗 Connect</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => onTransform?.(bubble)}
          >
            <Text style={styles.actionButtonText}>🔄 Transform</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
            onPress={() => onDelete?.(bubble)}
          >
            <Text style={styles.actionButtonText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  compactContainer: {
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactEmoji: {
    fontSize: 48,
  },
  expandedContainer: {
    borderWidth: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  emoji: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  title: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    flex: 1,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgency: {
    fontSize: 14,
  },
  importance: {
    fontSize: 14,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  typeText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
    color: '#FFFFFF',
  },
  hierarchyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  hierarchyText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
  },
  depthBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  depthText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
    color: '#FFFFFF',
  },
  content: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.4,
    marginBottom: SPACING.sm,
  },
  previewSection: {
    marginBottom: SPACING.sm,
  },
  previewLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  metadataText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
  },
  moreTagsText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
    alignSelf: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
    color: '#FFFFFF',
  },
});
