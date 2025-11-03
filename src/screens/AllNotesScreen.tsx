import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';
import { useStore } from '../store';
import { getSystemById } from '../services/systemsRegistry';
import { NoteFormat, FORMAT_EMOJIS, UrgencyLevel, Note } from '../types';

export const AllNotesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { notes, loadNotes, createNote, folders, deleteNote, updateNote, activeSystems, createFolder, loadFolders } = useStore();
  const { systemId } = route.params as { systemId?: string };

  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderNameInSelector, setNewFolderNameInSelector] = useState('');

  // Helper function to build full folder path (parent/child/grandchild)
  const getFolderPath = (folderId: string): string => {
    const path: string[] = [];
    let currentFolder = folders.find(f => f.id === folderId);

    while (currentFolder) {
      path.unshift(`${currentFolder.icon || '📁'} ${currentFolder.name}`);
      if (currentFolder.parentFolderId) {
        currentFolder = folders.find(f => f.id === currentFolder!.parentFolderId);
      } else {
        currentFolder = undefined;
      }
    }

    return path.join(' / ');
  };

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, systemId, searchQuery]);

  const filterNotes = () => {
    let filtered: Note[];

    if (systemId) {
      // Filter notes that have ONLY this systemId (exclusive filter)
      // Don't show notes from other systems, even if they somehow have multiple systemIds
      filtered = notes.filter(note => {
        // systemIds might be an array or need to be parsed
        const systemIdsArray = Array.isArray(note.systemIds)
          ? note.systemIds
          : (typeof note.systemIds === 'string' ? JSON.parse(note.systemIds || '[]') : []);

        // Only show notes that:
        // 1. Have this exact systemId
        // 2. AND either have ONLY this systemId, OR don't have any other system's ID
        // This ensures Miscellaneous notes don't show in Planner view, etc.
        if (!systemIdsArray.includes(systemId)) {
          return false; // Note doesn't belong to this system at all
        }

        // If the note has multiple systemIds, only show it if this is the primary one
        // (We consider the first systemId as primary, or if it only has this one)
        if (systemIdsArray.length === 1) {
          return true; // Only has this systemId
        }

        // For notes with multiple systemIds, only show if this is the first/primary one
        return systemIdsArray[0] === systemId;
      });
    } else {
      filtered = notes;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => {
        // Search in title
        if (note.title?.toLowerCase().includes(query)) return true;

        // Search in content
        if (note.content?.toLowerCase().includes(query)) return true;

        // Search in format name
        if (note.noteFormat?.toLowerCase().includes(query)) return true;

        // Search in tags (if exists)
        if (note.tags) {
          const tagsArray = Array.isArray(note.tags)
            ? note.tags
            : (typeof note.tags === 'string' ? JSON.parse(note.tags || '[]') : []);
          if (tagsArray.some((tag: string) => tag.toLowerCase().includes(query))) return true;
        }

        return false;
      });
    }

    // Sort by lastModified descending (newest first)
    const sorted = [...filtered].sort((a, b) => {
      const aTime = a.lastModified instanceof Date ? a.lastModified.getTime() : new Date(a.lastModified).getTime();
      const bTime = b.lastModified instanceof Date ? b.lastModified.getTime() : new Date(b.lastModified).getTime();
      return bTime - aTime;
    });
    setFilteredNotes(sorted);
  };

  const handleNoteTap = (noteId: string) => {
    navigation.navigate('NoteDetail' as never, { noteId } as never);
  };

  const handleNoteLongPress = (note: Note) => {
    setSelectedNote(note);
    setShowActionMenu(true);
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${selectedNote.title || 'Untitled'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(selectedNote.id);
              await loadNotes();
              setShowActionMenu(false);
              setSelectedNote(null);
            } catch (error) {
              console.error('Failed to delete note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          }
        }
      ]
    );
  };

  const handleExportNote = async () => {
    if (!selectedNote) return;

    try {
      let exportText = `${selectedNote.title || 'Untitled'}\n\n`;

      // Add all entries
      selectedNote.entries.forEach(entry => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        exportText += `--- ${date} ---\n${entry.content}\n\n`;
      });

      await Share.share({
        message: exportText,
        title: selectedNote.title || 'Note Export'
      });

      setShowActionMenu(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Failed to export note:', error);
      Alert.alert('Error', 'Failed to export note');
    }
  };

  const handleOpenFolderSelector = () => {
    setShowActionMenu(false);
    setShowFolderSelector(true);
  };

  const handleCreateNewFolderFromSelector = async () => {
    if (!newFolderNameInSelector.trim() || !selectedNote) return;
    try {
      // Create the folder
      await createFolder(newFolderNameInSelector.trim(), false);

      // Wait a moment for the folder to be created
      await loadFolders();

      // Find the newly created folder
      const newFolder = folders.find(f => f.name === newFolderNameInSelector.trim());

      if (newFolder) {
        // Assign the note to the new folder
        await handleSelectFolder(newFolder.id);
      }

      // Reset states
      setNewFolderNameInSelector('');
      setShowNewFolderInput(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      Alert.alert('Error', 'Failed to create folder');
    }
  };

  const handleSelectFolder = async (folderId: string | null) => {
    if (!selectedNote) return;

    try {
      // REPLACE systemIds based on the folder (don't accumulate)
      let systemIds: string[] = [];
      if (folderId) {
        const folder = folders.find(f => f.id === folderId);
        if (folder && folder.systemId) {
          systemIds = [folder.systemId]; // Only set the folder's systemId
        }
      }
      // If no folder selected (removing from folder), clear systemIds

      await updateNote(selectedNote.id, { folderId, systemIds });
      await loadNotes();
      setShowFolderSelector(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Failed to update folder:', error);
      Alert.alert('Error', 'Failed to update folder');
    }
  };

  const handleBackToFolders = () => {
    navigation.goBack();
  };

  const formatDate = (dateValue: Date | number | string): string => {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently';
    }

    // Always show actual date
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getUrgencyColor = (urgency: UrgencyLevel): string => {
    if (urgency === UrgencyLevel.HIGH) return '#FF3B30';
    if (urgency === UrgencyLevel.MEDIUM) return '#FF9500';
    if (urgency === UrgencyLevel.LOW) return '#FFCC00';
    return colors.textSecondary;
  };

  const getImportanceColor = (importance: number): string => {
    if (importance >= 3) return '#007AFF';
    if (importance >= 2) return '#5AC8FA';
    return colors.textSecondary;
  };

  const getHeaderTitle = (): string => {
    if (systemId) {
      const system = getSystemById(systemId);
      return system ? `${system.icon} ${system.name} Notes` : 'Notes';
    }
    return 'All Notes';
  };

  const renderNoteRow = (note: Note) => {
    const emoji = note.selectedEmoji || FORMAT_EMOJIS[note.noteFormat] || '📝';
    const systemIdsArray = Array.isArray(note.systemIds)
      ? note.systemIds
      : (typeof note.systemIds === 'string' ? JSON.parse(note.systemIds || '[]') : []);

    return (
      <TouchableOpacity
        key={note.id}
        style={[styles.noteRow, { borderBottomColor: colors.border }]}
        onPress={() => handleNoteTap(note.id)}
        onLongPress={() => handleNoteLongPress(note)}
      >
        <View style={styles.noteLeft}>
          <Text style={styles.noteEmoji}>{emoji}</Text>
          <View style={styles.noteInfo}>
            <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
              {note.title || 'Untitled'}
            </Text>
            <View style={styles.noteMetadata}>
              <Text style={[styles.noteDate, { color: colors.textSecondary }]}>
                {formatDate(note.lastModified)}
              </Text>
              {/* Folder Badge - Full Path */}
              {note.folderId && (
                <View style={[styles.folderBadge, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.folderBadgeText, { color: colors.text }]} numberOfLines={1}>
                    {getFolderPath(note.folderId)}
                  </Text>
                </View>
              )}
              {/* System Badges */}
              {systemIdsArray.length > 0 && (
                <View style={styles.systemBadges}>
                  {systemIdsArray.slice(0, 2).map((sysId: string) => {
                    const system = getSystemById(sysId);
                    return system ? (
                      <View
                        key={sysId}
                        style={[styles.systemBadge, { backgroundColor: colors.surfaceVariant }]}
                      >
                        <Text style={[styles.systemBadgeText, { color: colors.text }]}>
                          {system.icon}
                        </Text>
                      </View>
                    ) : null;
                  })}
                  {systemIdsArray.length > 2 && (
                    <Text style={[styles.moreSystemsText, { color: colors.textSecondary }]}>
                      +{systemIdsArray.length - 2}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.noteRight}>
          {note.urgency && note.urgency !== UrgencyLevel.NONE && (
            <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(note.urgency) }]} />
          )}
          {note.importance > 0 && (
            <View style={styles.priorityIndicator}>
              <Text style={styles.starsText}>
                {'⭐'.repeat(note.importance)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBackToFolders}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{getHeaderTitle()}</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search notes..."
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

      {/* Notes List */}
      <ScrollView style={styles.content}>
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {searchQuery.trim()
                ? 'No notes match your search'
                : systemId
                ? 'No notes in this system yet'
                : 'No notes yet. Create your first note!'}
            </Text>
          </View>
        ) : (
          <View style={styles.notesList}>
            {filteredNotes.map(note => renderNoteRow(note))}
          </View>
        )}
      </ScrollView>

      {/* Add Note Button */}
      <TouchableOpacity
        style={[styles.addNoteButton, { backgroundColor: colors.accent }]}
        onPress={async () => {
          try {
            const noteId = await createNote('New Note');
            navigation.navigate('NoteDetail' as never, { noteId } as never);
          } catch (error) {
            console.error('Failed to create note:', error);
          }
        }}
      >
        <Text style={styles.addNoteButtonText}>+ Add Note</Text>
      </TouchableOpacity>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={[styles.actionMenuContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={handleOpenFolderSelector}
            >
              <Text style={[styles.actionMenuText, { color: colors.text }]}>Add to Folder</Text>
            </TouchableOpacity>

            <View style={[styles.actionMenuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={handleExportNote}
            >
              <Text style={[styles.actionMenuText, { color: colors.text }]}>Export Note</Text>
            </TouchableOpacity>

            <View style={[styles.actionMenuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={handleDeleteNote}
            >
              <Text style={[styles.actionMenuText, { color: '#FF3B30' }]}>Delete Note</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Folder Selector Modal */}
      <Modal
        visible={showFolderSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFolderSelector(false)}
      >
        <SafeAreaView style={[styles.folderSelectorModal, { backgroundColor: colors.background }]}>
          <View style={[styles.folderSelectorHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.folderSelectorTitle, { color: colors.text }]}>
              Select Folder
            </Text>
            <TouchableOpacity onPress={() => setShowFolderSelector(false)}>
              <Text style={[styles.closeButton, { color: colors.accent }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.foldersList}>
            {/* New Folder Option */}
            {!showNewFolderInput ? (
              <TouchableOpacity
                style={[styles.newFolderButton, { backgroundColor: colors.accent }]}
                onPress={() => setShowNewFolderInput(true)}
              >
                <Text style={styles.newFolderButtonText}>+ New Folder</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.newFolderInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.newFolderInput, { color: colors.text }]}
                  placeholder="Folder name"
                  placeholderTextColor={colors.textSecondary}
                  value={newFolderNameInSelector}
                  onChangeText={setNewFolderNameInSelector}
                  autoFocus={true}
                  onSubmitEditing={handleCreateNewFolderFromSelector}
                />
                <TouchableOpacity onPress={handleCreateNewFolderFromSelector}>
                  <Text style={[styles.createFolderIcon, { color: colors.accent }]}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setShowNewFolderInput(false);
                  setNewFolderNameInSelector('');
                }}>
                  <Text style={[styles.createFolderIcon, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* None option */}
            <TouchableOpacity
              style={[styles.folderItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleSelectFolder(null)}
            >
              <Text style={[styles.folderItemText, { color: colors.textSecondary }]}>
                ✕ No Folder
              </Text>
            </TouchableOpacity>

            {/* All folders */}
            {folders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={[
                  styles.folderItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedNote?.folderId === folder.id && { backgroundColor: colors.accent + '20', borderColor: colors.accent }
                ]}
                onPress={() => handleSelectFolder(folder.id)}
              >
                <Text style={[styles.folderItemText, { color: colors.text }]} numberOfLines={1}>
                  {getFolderPath(folder.id)}
                </Text>
                {folder.systemId && (() => {
                  const system = activeSystems.find(s => s.id === folder.systemId);
                  return system ? (
                    <Text style={[styles.folderSystemBadge, { color: colors.textSecondary }]}>
                      {system.icon} {system.name}
                    </Text>
                  ) : null;
                })()}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
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
    width: 80,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    flex: 1,
    textAlign: 'center',
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
  notesList: {
    paddingVertical: SPACING.sm,
  },
  noteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  noteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noteEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    marginBottom: 4,
  },
  noteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  noteDate: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
  },
  systemBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  folderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  folderBadgeText: {
    ...FONTS.regular,
    fontSize: 11,
  },
  systemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemBadgeText: {
    fontSize: 12,
  },
  moreSystemsText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.tiny,
  },
  noteRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityIcon: {
    fontSize: 14,
  },
  priorityValue: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  priorityText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  starsText: {
    fontSize: 12,
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
  addNoteButton: {
    margin: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  addNoteButtonText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  // Action Menu styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  actionMenuContent: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionMenuItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  actionMenuText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  actionMenuDivider: {
    height: 1,
  },
  // Folder Selector styles
  folderSelectorModal: {
    flex: 1,
  },
  folderSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  folderSelectorTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.large,
  },
  closeButton: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  foldersList: {
    flex: 1,
  },
  folderItem: {
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 8,
    borderWidth: 1,
  },
  folderItemText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  folderSystemBadge: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    marginTop: 4,
  },
  newFolderButton: {
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 8,
    alignItems: 'center',
  },
  newFolderButtonText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  newFolderInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 8,
    borderWidth: 1,
  },
  newFolderInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
  },
  createFolderIcon: {
    ...FONTS.bold,
    fontSize: 24,
    marginLeft: SPACING.sm,
  },
});
