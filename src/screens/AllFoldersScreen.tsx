import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';
import { useStore } from '../store';
import { getSystemById } from '../services/systemsRegistry';
import { getDatabase } from '../services';

interface Folder {
  id: string;
  name: string;
  icon: string;
  systemId: string | null;
  parentFolderId: string | null;
  createdAt: number;
  updatedAt: number;
}

interface FolderNode extends Folder {
  children: FolderNode[];
  isExpanded: boolean;
  depth: number;
}

interface SystemGroup {
  systemId: string | null;
  systemName: string;
  systemIcon: string;
  folders: FolderNode[];
}

export const AllFoldersScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { folders, loadFolders, notes } = useStore();
  const { systemId, showAllSystems } = route.params as { systemId?: string; showAllSystems?: boolean };

  const [folderGroups, setFolderGroups] = useState<SystemGroup[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    buildGroupedFolders();
  }, [folders, systemId, showAllSystems, expandedFolders, searchQuery]);

  const buildGroupedFolders = () => {
    let filteredFolders = folders;

    // Only filter by system if explicitly requested (not showing all systems)
    // When showAllSystems is true, show ALL folders regardless of systemId
    if (!showAllSystems && systemId) {
      filteredFolders = folders.filter(f => f.systemId === systemId);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredFolders = filteredFolders.filter(f =>
        f.name.toLowerCase().includes(query)
      );
    }

    // Group folders by system
    const systemMap = new Map<string | null, Folder[]>();

    filteredFolders.forEach(folder => {
      const key = folder.systemId;
      if (!systemMap.has(key)) {
        systemMap.set(key, []);
      }
      systemMap.get(key)!.push(folder);
    });

    // Build groups with proper ordering
    const categoryOrder = ['functional', 'management', 'purpose', 'analysis'];
    const groups: SystemGroup[] = [];

    // Sort system IDs by category order
    const systemIds = Array.from(systemMap.keys()).sort((a, b) => {
      // null (Miscellaneous) always goes first
      if (a === null) return -1;
      if (b === null) return 1;

      const systemA = getSystemById(a);
      const systemB = getSystemById(b);

      if (!systemA || !systemB) return 0;

      const categoryIndexA = categoryOrder.indexOf(systemA.category);
      const categoryIndexB = categoryOrder.indexOf(systemB.category);

      return categoryIndexA - categoryIndexB;
    });

    // Build folder trees for each system group
    systemIds.forEach(sysId => {
      const systemFolders = systemMap.get(sysId)!;
      const system = sysId ? getSystemById(sysId) : null;

      const tree = buildFolderTree(systemFolders);

      groups.push({
        systemId: sysId,
        systemName: system?.name || 'Miscellaneous',
        systemIcon: system?.icon || '📦',
        folders: tree,
      });
    });

    setFolderGroups(groups);
  };

  const buildFolderTree = (folderList: Folder[]): FolderNode[] => {
    const folderMap = new Map<string, FolderNode>();
    const rootFolders: FolderNode[] = [];

    // First pass: Create folder nodes
    folderList.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        isExpanded: expandedFolders.has(folder.id),
        depth: 0,
      });
    });

    // Second pass: Build tree structure
    folderList.forEach(folder => {
      const node = folderMap.get(folder.id)!;

      if (folder.parentFolderId && folderMap.has(folder.parentFolderId)) {
        const parent = folderMap.get(folder.parentFolderId)!;
        parent.children.push(node);
        node.depth = parent.depth + 1;
      } else {
        rootFolders.push(node);
      }
    });

    // Sort by updatedAt DESC (most recent first)
    const sortByUpdatedAt = (nodes: FolderNode[]) => {
      nodes.sort((a, b) => b.updatedAt - a.updatedAt);
      nodes.forEach(node => sortByUpdatedAt(node.children));
    };
    sortByUpdatedAt(rootFolders);

    return rootFolders;
  };

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFolderTap = (folderId: string) => {
    // Navigate to FolderDetailScreen
    navigation.navigate('FolderDetail' as never, { folderId } as never);
  };

  const handleViewAllNotes = () => {
    // Navigate to AllNotesScreen
    navigation.navigate('AllNotes' as never, { systemId } as never);
  };

  const handleBackToSystems = () => {
    navigation.goBack();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      const database = await getDatabase();
      await database.createFolderWithSystem(
        newFolderName.trim(),
        '📁', // Default folder icon
        systemId || null, // Use current system if viewing system folders
        null // No parent folder (root level)
      );
      await loadFolders();
      setShowCreateModal(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
      Alert.alert('Error', 'Failed to create folder');
    }
  };

  // Recursively count all notes in a folder and its subfolders
  const getRecursiveNotesCount = (node: FolderNode): number => {
    // Count notes directly in this folder
    let count = notes.filter(note => note.folderId === node.id).length;

    // Add notes from all child folders recursively
    for (const child of node.children) {
      count += getRecursiveNotesCount(child);
    }

    return count;
  };

  // Recursively count all subfolders in a folder
  const getRecursiveSubfoldersCount = (node: FolderNode): number => {
    let count = node.children.length; // Direct children

    // Add subfolders from all child folders recursively
    for (const child of node.children) {
      count += getRecursiveSubfoldersCount(child);
    }

    return count;
  };

  const renderFolderNode = (node: FolderNode): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const folderNotes = notes.filter(note => note.folderId === node.id);
    const hasContent = hasChildren || folderNotes.length > 0;
    const isExpanded = expandedFolders.has(node.id);
    const indentation = node.depth * 20;

    // Calculate recursive counts for display
    const totalNotesCount = getRecursiveNotesCount(node);
    const totalSubfoldersCount = getRecursiveSubfoldersCount(node);

    return (
      <View key={node.id}>
        <View style={[styles.folderRow, { paddingLeft: SPACING.md + indentation }]}>
          {/* Expand/Collapse Arrow */}
          {hasContent && (
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => toggleFolderExpansion(node.id)}
            >
              <Text style={[styles.arrow, { color: colors.textSecondary }]}>
                {isExpanded ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
          )}
          {!hasContent && <View style={styles.arrowSpacer} />}

          {/* Folder Icon and Name */}
          <TouchableOpacity
            style={styles.folderInfo}
            onPress={() => handleFolderTap(node.id)}
          >
            <Text style={styles.folderIcon}>{node.icon}</Text>
            <View style={styles.folderTextContainer}>
              <Text style={[styles.folderName, { color: colors.text }]}>{node.name}</Text>
              {node.systemId && (
                <Text style={[styles.systemBadge, { color: colors.textSecondary }]}>
                  {getSystemById(node.systemId)?.name || node.systemId}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Folder Count - show recursive subfolders and notes count */}
          <Text style={[styles.folderCount, { color: colors.textSecondary }]}>
            {totalSubfoldersCount > 0 && `📁${totalSubfoldersCount} `}
            {totalNotesCount > 0 && `📝${totalNotesCount}`}
          </Text>
        </View>

        {/* Render children and notes if expanded */}
        {isExpanded && hasContent && (
          <View>
            {/* Render notes first */}
            {folderNotes.map(note => (
              <TouchableOpacity
                key={`note-${note.id}`}
                style={[styles.noteRow, { paddingLeft: SPACING.md + indentation + 20, backgroundColor: colors.surface, borderLeftColor: colors.border }]}
                onPress={() => navigation.navigate('NoteDetail' as never, { noteId: note.id } as never)}
              >
                <Text style={styles.noteIcon}>📝</Text>
                <Text style={[styles.noteName, { color: colors.text }]} numberOfLines={1}>
                  {note.title || 'Untitled'}
                </Text>
                <Text style={[styles.noteEntryCount, { color: colors.textSecondary }]}>
                  {note.entries?.length || 0}
                </Text>
              </TouchableOpacity>
            ))}
            {/* Then render subfolders */}
            {node.children.map(child => renderFolderNode(child))}
          </View>
        )}
      </View>
    );
  };

  const getHeaderTitle = (): string => {
    if (systemId && !showAllSystems) {
      const system = getSystemById(systemId);
      return system ? `${system.icon} ${system.name} Folders` : 'Folders';
    }
    return 'All Folders';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBackToSystems}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{getHeaderTitle()}</Text>
        <TouchableOpacity
          style={[styles.notesButton, { backgroundColor: colors.accent }]}
          onPress={handleViewAllNotes}
        >
          <Text style={styles.notesButtonText}>📝 Notes</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search folders..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Folder Groups */}
      <ScrollView style={styles.content}>
        {folderGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {searchQuery.trim()
                ? 'No folders match your search'
                : systemId && !showAllSystems
                ? 'No folders in this system yet'
                : 'No folders yet. Activate a system to get started!'}
            </Text>
          </View>
        ) : (
          <View style={styles.groupsContainer}>
            {folderGroups.map(group => (
              <View key={group.systemId || 'misc'} style={styles.systemGroup}>
                {/* Section Header */}
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>
                    {group.systemIcon} {group.systemName}
                  </Text>
                  <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
                </View>

                {/* Folders in this system */}
                <View style={styles.foldersInGroup}>
                  {group.folders.map(node => renderFolderNode(node))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Folder Button */}
      <TouchableOpacity
        style={[styles.addFolderButton, { backgroundColor: colors.accent }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.addFolderButtonText}>+ Add Folder</Text>
      </TouchableOpacity>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Folder</Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Folder name"
              placeholderTextColor={colors.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewFolderName('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={handleCreateFolder}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: FONT_SIZES.subtitle,
    flex: 1,
    textAlign: 'center',
  },
  notesButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  notesButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  searchInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  groupsContainer: {
    paddingVertical: SPACING.md,
  },
  systemGroup: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  sectionHeaderText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.small,
    marginHorizontal: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  foldersInGroup: {
    // Container for folders in a system group
  },
  treeContainer: {
    paddingVertical: SPACING.md,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.md,
  },
  arrowButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  arrow: {
    ...FONTS.regular,
    fontSize: 12,
  },
  arrowSpacer: {
    width: 24,
    marginRight: SPACING.xs,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  folderTextContainer: {
    flex: 1,
  },
  folderName: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  systemBadge: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.tiny,
    marginTop: 2,
  },
  folderCount: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    minWidth: 24,
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyStateText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
  },
  addFolderButton: {
    margin: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  addFolderButtonText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: SPACING.lg,
  },
  modalTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  // Note row styles
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.md,
    borderLeftWidth: 2,
    marginVertical: 2,
  },
  noteIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  noteName: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
  },
  noteEntryCount: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    marginLeft: SPACING.sm,
  },
});
