import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import type { Entry } from '../types';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { formatTime } from '../utils';

interface EntryTreeViewProps {
  entries: Entry[];
  onEntryPress: (entryId: string) => void;
  currentEntryId?: string;
  colors: any;
}

interface TreeNode {
  entry: Entry;
  children: TreeNode[];
  level: number;
}

export const EntryTreeView: React.FC<EntryTreeViewProps> = ({
  entries,
  onEntryPress,
  currentEntryId,
  colors,
}) => {
  // Build tree structure from flat entry list
  const buildTree = (): TreeNode[] => {
    const entryMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // First pass: create all nodes
    entries.forEach(entry => {
      entryMap.set(entry.id, {
        entry,
        children: [],
        level: 0,
      });
    });

    // Second pass: build relationships and set levels
    entries.forEach(entry => {
      const node = entryMap.get(entry.id)!;

      if (entry.parentEntryId && entryMap.has(entry.parentEntryId)) {
        // Has parent - add to parent's children
        const parent = entryMap.get(entry.parentEntryId)!;
        parent.children.push(node);
        node.level = parent.level + 1;
      } else {
        // No parent - it's a root node
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  // Render tree with ASCII characters
  const renderTreeNode = (
    node: TreeNode,
    isLast: boolean,
    prefix: string = ''
  ): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    const isCurrentEntry = node.entry.id === currentEntryId;

    // ASCII branch characters
    const branch = isLast ? '└─ ' : '├─ ';
    const verticalLine = isLast ? '   ' : '│  ';

    // Entry name or fallback
    const displayName = node.entry.entryName ||
      (node.entry.content ?
        node.entry.content.substring(0, 30) + (node.entry.content.length > 30 ? '...' : '') :
        `Entry ${formatTime(node.entry.timestamp)}`);

    // Folder/file icon
    const icon = node.children.length > 0 ? '📁' : '📄';
    const childCount = node.children.length > 0 ? ` (${node.children.length})` : '';

    elements.push(
      <TouchableOpacity
        key={node.entry.id}
        onPress={() => onEntryPress(node.entry.id)}
        style={[
          styles.treeRow,
          isCurrentEntry && {
            backgroundColor: colors.accent + '20',
            borderLeftWidth: 3,
            borderLeftColor: colors.accent,
          }
        ]}
      >
        <Text style={[styles.treeText, { color: colors.textSecondary }]}>
          {prefix}
          <Text style={styles.branch}>{branch}</Text>
        </Text>
        <Text style={styles.icon}>{icon}</Text>
        <Text
          style={[
            styles.entryName,
            { color: isCurrentEntry ? colors.accent : colors.text }
          ]}
          numberOfLines={1}
        >
          {displayName}{childCount}
        </Text>
      </TouchableOpacity>
    );

    // Render children
    node.children.forEach((child, index) => {
      const isLastChild = index === node.children.length - 1;
      const childPrefix = prefix + verticalLine;
      elements.push(...renderTreeNode(child, isLastChild, childPrefix));
    });

    return elements;
  };

  const tree = buildTree();

  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No entries yet. Create your first entry!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      contentContainerStyle={styles.content}
    >
      {tree.map((node, index) => {
        const isLast = index === tree.length - 1;
        return renderTreeNode(node, isLast);
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
    borderRadius: 8,
    borderWidth: 1,
  },
  content: {
    padding: SPACING.sm,
  },
  emptyContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    fontStyle: 'italic',
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 4,
  },
  treeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: FONT_SIZES.timestamp,
  },
  branch: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  icon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  entryName: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    flex: 1,
  },
});
