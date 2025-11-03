import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, PanResponder, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Bubble } from '../components/Bubble';
import { CreateBubbleModal } from '../components/CreateBubbleModal';
import { BubbleContextMenu } from '../components/BubbleContextMenu';
import { SAMPLE_BUBBLES } from '../data/sampleBubbles';
import { Bubble as BubbleType } from '../types/bubble';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';

type ViewMode = 'list' | 'grid';

export const BubblePlaygroundScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [bubbles, setBubbles] = useState<BubbleType[]>(SAMPLE_BUBBLES);
  const [expandedBubbleId, setExpandedBubbleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [selectedBubble, setSelectedBubble] = useState<BubbleType | null>(null);

  const handleBubblePress = (bubble: BubbleType) => {
    setExpandedBubbleId(expandedBubbleId === bubble.id ? null : bubble.id);
  };

  const handleExpand = (bubble: BubbleType) => {
    Alert.alert(
      `${bubble.emoji} ${bubble.title}`,
      `This would open the full detail view for this ${bubble.type} bubble.\n\nType: ${bubble.type}\nCreated: ${new Date(bubble.createdAt).toLocaleDateString()}\nConnections: ${bubble.connections.length}\nChild Bubbles: ${bubble.childBubbleIds.length}`,
      [{ text: 'OK' }]
    );
  };

  const handleConnect = (bubble: BubbleType) => {
    Alert.alert(
      '🔗 Connect Bubbles',
      `This would allow you to create a connection from "${bubble.title}" to another bubble.\n\nConnection types:\n• Inspired by 💡\n• Depends on 🔗\n• Part of 🧩\n• Related to ↔️\n• Blocks 🚧\n• References 📎`,
      [{ text: 'OK' }]
    );
  };

  const handleTransform = (bubble: BubbleType) => {
    Alert.alert(
      '🔄 Transform Bubble',
      `This would transform "${bubble.title}" from a ${bubble.type} bubble to another type.\n\nFor example:\n• Note → Task (when you want to take action)\n• Task → Project (when it grows bigger)\n• Project → Goal (when you complete it and want to track achievement)`,
      [{ text: 'OK' }]
    );
  };

  const handleDelete = (bubble: BubbleType) => {
    Alert.alert(
      '🗑️ Delete Bubble',
      `Are you sure you want to delete "${bubble.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setBubbles(bubbles.filter((b) => b.id !== bubble.id));
            setExpandedBubbleId(null);
            Alert.alert('Deleted', `Bubble "${bubble.title}" has been deleted.`);
          },
        },
      ]
    );
  };

  const handleEdit = (bubble: BubbleType) => {
    navigation.navigate('CreateBubble' as never, {
      bubble: bubble,
      onSave: (updatedBubble: Partial<BubbleType>) => {
        setBubbles(bubbles.map(b => b.id === bubble.id ? { ...b, ...updatedBubble } : b));
      }
    } as never);
  };

  const handleCreateBubble = () => {
    navigation.navigate('CreateBubble' as never, {
      onSave: (bubbleData: Partial<BubbleType>) => {
        const newBubble: BubbleType = {
          id: `bubble-${Date.now()}`,
          type: bubbleData.type!,
          title: bubbleData.title!,
          emoji: bubbleData.emoji!,
          content: bubbleData.content || '',
          color: bubbleData.color!,
          position: { x: 0, y: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          urgency: bubbleData.urgency,
          importance: bubbleData.importance,
          schedule: bubbleData.schedule,
          typeData: getDefaultTypeData(bubbleData.type!),
          connections: [],
          childBubbleIds: [],
        };
        setBubbles([newBubble, ...bubbles]);
        Alert.alert('Success', `Created new ${bubbleData.type} bubble: "${bubbleData.title}"`);
      }
    } as never);
  };

  const handleCreateBubbleSubmit = (bubbleData: {
    type: BubbleType['type'];
    title: string;
    emoji: string;
    content: string;
    color: string;
    urgency?: 'none' | 'low' | 'medium' | 'high';
    importance?: 1 | 2 | 3 | 4 | 5;
  }) => {
    const newBubble: BubbleType = {
      id: `bubble-${Date.now()}`,
      type: bubbleData.type,
      title: bubbleData.title,
      emoji: bubbleData.emoji,
      content: bubbleData.content,
      color: bubbleData.color,
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      urgency: bubbleData.urgency,
      importance: bubbleData.importance,
      typeData: getDefaultTypeData(bubbleData.type),
      connections: [],
      childBubbleIds: [],
    };

    setBubbles([newBubble, ...bubbles]);
    setCreateModalVisible(false);
    Alert.alert('Success', `Created new ${bubbleData.type} bubble: "${bubbleData.title}"`);
  };

  const getDefaultTypeData = (type: BubbleType['type']): any => {
    switch (type) {
      case 'task':
        return { isCompleted: false, priority: 'medium' as const, steps: [] };
      case 'project':
        return { progress: 0, milestones: [] };
      case 'goal':
        return { progress: 0, target: '', milestones: [] };
      case 'journal':
        return { entries: [] };
      case 'library':
        return { items: [] };
      case 'ideas':
        return { ideas: [] };
      case 'document':
        return { content: '', wordCount: 0, readingTimeMinutes: 0 };
      case 'workout':
        return { exercises: [], totalDuration: 0 };
      case 'budget':
        return { transactions: [], totalIncome: 0, totalExpenses: 0, balance: 0 };
      case 'note':
      default:
        return { entries: [] };
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newBubbles = [...bubbles];
    const [movedBubble] = newBubbles.splice(fromIndex, 1);
    newBubbles.splice(toIndex, 0, movedBubble);
    setBubbles(newBubbles);
  };

  const handleLongPress = (bubble: BubbleType) => {
    console.log('Long press triggered for bubble:', bubble.title);
    setSelectedBubble(bubble);
    setContextMenuVisible(true);
  };

  const renderBubble = (bubble: BubbleType, index: number) => (
    <View key={bubble.id} style={viewMode === 'grid' && styles.gridItem}>
      <Bubble
        bubble={bubble}
        onPress={handleBubblePress}
        onExpand={handleExpand}
        onConnect={handleConnect}
        onTransform={handleTransform}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onLongPress={handleLongPress}
        isExpanded={expandedBubbleId === bubble.id}
        compact={viewMode === 'grid'}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Home</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🫧 Bubble Playground</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.surfaceVariant }]}>
        <Text style={[styles.infoBannerText, { color: colors.text }]}>
          🎨 This is a prototype space to explore bubbles - the core building blocks of NOTED.
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.accent }]}
          onPress={handleCreateBubble}
        >
          <Text style={styles.controlButtonText}>➕ Create Bubble</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          onPress={toggleViewMode}
        >
          <Text style={[styles.controlButtonTextAlt, { color: colors.text }]}>
            {viewMode === 'list' ? '⊞ Grid' : '☰ List'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bubbles Display */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          viewMode === 'grid' && styles.gridContainer,
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Sample Bubbles ({bubbles.length})
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Tap to expand • Long press for menu
        </Text>

        {viewMode === 'list' ? (
          <View style={styles.listContainer}>
            {bubbles.map((bubble, index) => renderBubble(bubble, index))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gridScrollContent}
          >
            <View style={styles.gridView}>
              {bubbles.map((bubble, index) => renderBubble(bubble, index))}
            </View>
          </ScrollView>
        )}

        {/* Feature Info */}
        <View style={[styles.featureInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.featureInfoTitle, { color: colors.text }]}>
            🌟 What are Bubbles?
          </Text>
          <Text style={[styles.featureInfoText, { color: colors.textSecondary }]}>
            Bubbles are polymorphic containers that can represent any type of content:
            notes, tasks, projects, goals, journals, ideas, documents, and more.
          </Text>
          <Text style={[styles.featureInfoText, { color: colors.textSecondary }]}>
            Key features:{'\n'}
            • 🔗 Connect bubbles to show relationships{'\n'}
            • 🫧 Nest bubbles inside other bubbles{'\n'}
            • 🔄 Transform between types as needs evolve{'\n'}
            • 📍 Position in 2D space (Universe View){'\n'}
            • ⏳ View evolution over time (Timeline View)
          </Text>
        </View>
      </ScrollView>

      {/* Create Bubble Modal */}
      <CreateBubbleModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreateBubble={handleCreateBubbleSubmit}
      />

      {/* Context Menu */}
      <BubbleContextMenu
        visible={contextMenuVisible}
        bubble={selectedBubble}
        onClose={() => setContextMenuVisible(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onConnect={handleConnect}
        onTransform={handleTransform}
      />
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
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.title,
    flex: 1,
    textAlign: 'center',
  },
  infoBanner: {
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 8,
  },
  infoBannerText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    textAlign: 'center',
    lineHeight: FONT_SIZES.small * 1.4,
  },
  controls: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  controlButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  controlButtonTextAlt: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    marginBottom: SPACING.lg,
  },
  listContainer: {
    gap: SPACING.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridScrollContent: {
    paddingRight: SPACING.lg,
  },
  gridView: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  gridItem: {
    width: 120, // Small iPhone icon size
    height: 120, // Make it square
    minWidth: 120,
    maxWidth: 120,
  },
  featureInfo: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureInfoTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    marginBottom: SPACING.sm,
  },
  featureInfoText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.5,
    marginBottom: SPACING.sm,
  },
});
