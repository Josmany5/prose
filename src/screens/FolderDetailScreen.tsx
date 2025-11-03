import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';
import { useStore } from '../store';
import { getDatabase } from '../services';
import { getSystemById } from '../services/systemsRegistry';
import { NoteFormat, FORMAT_EMOJIS } from '../types';

interface Folder {
  id: string;
  name: string;
  icon: string;
  systemId: string | null;
  parentFolderId: string | null;
  createdAt: number;
  updatedAt: number;
}

interface Note {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  folderId: string | null;
  selectedEmoji: string | null;
  noteFormat: NoteFormat;
}

interface SubFolder {
  id: string;
  name: string;
  icon: string;
  childCount: number;
  notesCount: number;
}

export const FolderDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { folders, loadFolders } = useStore();
  const { folderId } = route.params as { folderId: string };

  const [folder, setFolder] = useState<Folder | null>(null);
  const [subFolders, setSubFolders] = useState<SubFolder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showCreateSubfolderModal, setShowCreateSubfolderModal] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showFolderSelector, setShowFolderSelector] = useState(false);

  useEffect(() => {
    loadFolderDetails();
  }, [folderId, folders]);

  // Reload when screen comes into focus (after returning from NoteDetailScreen)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFolderDetails();
    });
    return unsubscribe;
  }, [navigation]);

  const loadFolderDetails = async () => {
    try {
      // Find folder in the store
      const folderData = folders.find(f => f.id === folderId);
      setFolder(folderData || null);

      // Load subfolders
      const db = await getDatabase();
      const subFoldersData = await db.getSubFolders(folderId);

      // Count children and notes for each subfolder
      const subFoldersWithCounts = await Promise.all(
        subFoldersData.map(async (sf: any) => {
          const children = await db.getSubFolders(sf.id);
          const subfolderNotes = await db.getNotesByFolder(sf.id);
          return {
            id: sf.id,
            name: sf.name,
            icon: sf.icon,
            childCount: children.length,
            notesCount: subfolderNotes.length,
          };
        })
      );
      setSubFolders(subFoldersWithCounts);

      // Load notes in this folder
      const notesData = await db.getNotesByFolder(folderId);
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading folder details:', error);
    }
  };

  const handleSubFolderTap = (subFolderId: string) => {
    navigation.push('FolderDetail' as never, { folderId: subFolderId } as never);
  };

  const handleNoteTap = (noteId: string) => {
    navigation.navigate('NoteDetail' as never, { noteId } as never);
  };

  const handleNoteLongPress = (note: Note) => {
    setSelectedNote(note);
    setShowActionMenu(true);
  };

  const handleOpenFolderSelector = () => {
    setShowActionMenu(false);
    setShowFolderSelector(true);
  };

  const handleSelectFolder = async (selectedFolderId: string | null) => {
    if (!selectedNote) return;
    try {
      const { updateNote } = useStore.getState();
      await updateNote(selectedNote.id, { folderId: selectedFolderId });
      await loadFolderDetails();
      setShowFolderSelector(false);
      setSelectedNote(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to move note to folder');
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    Alert.alert('Delete Note', `Delete "${selectedNote.title || 'Untitled'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { deleteNote } = useStore.getState();
            await deleteNote(selectedNote.id);
            await loadFolderDetails();
            setShowActionMenu(false);
            setSelectedNote(null);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete note');
          }
        }
      }
    ]);
  };

  const handleExportNote = async () => {
    if (!selectedNote) return;
    try {
      const db = await getDatabase();
      const fullNote = await db.getNoteById(selectedNote.id);
      let exportText = `${fullNote.title || 'Untitled'}\n\n`;
      fullNote.entries.forEach((entry: any) => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        exportText += `--- ${date} ---\n${entry.content}\n\n`;
      });
      await Share.share({ message: exportText, title: fullNote.title || 'Note Export' });
      setShowActionMenu(false);
      setSelectedNote(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to export note');
    }
  };

  const handleAddSubFolder = () => {
    setShowCreateSubfolderModal(true);
  };

  const handleCreateSubFolder = async () => {
    if (!newSubfolderName.trim()) {
      Alert.alert('Error', 'Please enter a subfolder name');
      return;
    }

    try {
      const database = await getDatabase();
      await database.createFolderWithSystem(
        newSubfolderName.trim(),
        '📁', // Default folder icon
        folder?.systemId || null,
        folderId // Parent folder ID
      );
      await loadFolders();
      await loadFolderDetails();
      setShowCreateSubfolderModal(false);
      setNewSubfolderName('');
    } catch (error) {
      console.error('Failed to create subfolder:', error);
      Alert.alert('Error', 'Failed to create subfolder');
    }
  };

  const handleAddNote = () => {
    // Just navigate to NoteDetailScreen with folderId
    // NoteDetailScreen will handle creating the note if needed
    navigation.navigate('NoteDetail' as never, { folderId, systemId: folder?.systemId } as never);
  };

  const handleDeleteFolder = async () => {
    // Use window.confirm for web, Alert for native
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Delete Folder\n\nAre you sure you want to delete "${folder?.name}"? This will also delete all subfolders and notes inside.`
      );

      if (confirmed) {
        try {
          const db = await getDatabase();
          await db.deleteFolder(folderId);
          await loadFolders();
          navigation.goBack();
        } catch (error) {
          console.error('Error deleting folder:', error);
          window.alert('Error: Failed to delete folder');
        }
      }
    } else {
      Alert.alert(
        'Delete Folder',
        `Are you sure you want to delete "${folder?.name}"? This will also delete all subfolders and notes inside.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const db = await getDatabase();
                await db.deleteFolder(folderId);
                await loadFolders();
                navigation.goBack();
              } catch (error) {
                console.error('Error deleting folder:', error);
                Alert.alert('Error', 'Failed to delete folder');
              }
            },
          },
        ]
      );
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  if (!folder) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Folder not found
        </Text>
      </View>
    );
  }

  const system = folder.systemId ? getSystemById(folder.systemId) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {folder.icon} {folder.name}
        </Text>
        <TouchableOpacity onPress={handleDeleteFolder}>
          <Text style={[styles.deleteButton, { color: '#FF3B30' }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Folder Info */}
        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>System:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {system ? `${system.icon} ${system.name}` : 'None'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Created:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatDate(folder.createdAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Modified:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatDate(folder.updatedAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Subfolders:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {subFolders.length}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Notes:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {notes.length}
            </Text>
          </View>
        </View>

        {/* Subfolders Section */}
        {(subFolders.length > 0 || true) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Subfolders</Text>
              <TouchableOpacity onPress={handleAddSubFolder}>
                <Text style={[styles.addButton, { color: colors.accent }]}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {subFolders.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No subfolders yet
              </Text>
            ) : (
              <View style={styles.listContainer}>
                {subFolders.map(sf => (
                  <TouchableOpacity
                    key={sf.id}
                    style={[styles.listItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleSubFolderTap(sf.id)}
                  >
                    <Text style={styles.listItemIcon}>{sf.icon}</Text>
                    <Text style={[styles.listItemName, { color: colors.text }]}>
                      {sf.name}
                    </Text>
                    <View style={styles.countsContainer}>
                      {sf.childCount > 0 && (
                        <Text style={[styles.listItemCount, { color: colors.textSecondary }]}>
                          📁{sf.childCount}
                        </Text>
                      )}
                      {sf.notesCount > 0 && (
                        <Text style={[styles.listItemCount, { color: colors.textSecondary }]}>
                          📝{sf.notesCount}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <TouchableOpacity onPress={handleAddNote}>
              <Text style={[styles.addButton, { color: colors.accent }]}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {notes.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No notes yet
            </Text>
          ) : (
            <View style={styles.listContainer}>
              {notes.map(note => {
                const emoji = note.selectedEmoji || FORMAT_EMOJIS[note.noteFormat] || '📝';
                return (
                  <TouchableOpacity
                    key={note.id}
                    style={[styles.listItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleNoteTap(note.id)}
                    onLongPress={() => handleNoteLongPress(note)}
                  >
                    <Text style={styles.listItemIcon}>{emoji}</Text>
                    <View style={styles.noteContent}>
                      <Text style={[styles.listItemName, { color: colors.text }]} numberOfLines={1}>
                        {note.title || 'Untitled'}
                      </Text>
                      <Text style={[styles.noteDate, { color: colors.textSecondary }]}>
                        {formatDate(note.lastModified instanceof Date ? note.lastModified.getTime() : new Date(note.lastModified).getTime())}
                      </Text>
                    </View>
                    <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Note Button */}
      <TouchableOpacity
        style={[styles.addNoteButton, { backgroundColor: colors.accent }]}
        onPress={handleAddNote}
      >
        <Text style={styles.addNoteButtonText}>+ Add Note</Text>
      </TouchableOpacity>

      {/* Create Subfolder Modal */}
      <Modal
        visible={showCreateSubfolderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateSubfolderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Subfolder</Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Subfolder name"
              placeholderTextColor={colors.textSecondary}
              value={newSubfolderName}
              onChangeText={setNewSubfolderName}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => {
                  setShowCreateSubfolderModal(false);
                  setNewSubfolderName('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={handleCreateSubFolder}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Note Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowActionMenu(false);
          setSelectedNote(null);
        }}
      >
        <TouchableOpacity
          style={styles.actionMenuOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowActionMenu(false);
            setSelectedNote(null);
          }}
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
            {folders.map((folderOption) => (
              <TouchableOpacity
                key={folderOption.id}
                style={[
                  styles.folderItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedNote?.folderId === folderOption.id && { backgroundColor: colors.accent + '20', borderColor: colors.accent }
                ]}
                onPress={() => handleSelectFolder(folderOption.id)}
              >
                <Text style={[styles.folderItemText, { color: colors.text }]}>
                  {folderOption.icon || '📁'} {folderOption.name}
                </Text>
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
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  deleteButton: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  infoLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
  },
  infoValue: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
  },
  addButton: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  listContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  listItemIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  listItemName: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    flex: 1,
  },
  countsContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  listItemCount: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
  },
  noteContent: {
    flex: 1,
  },
  noteDate: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    marginLeft: SPACING.sm,
  },
  emptyText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  errorText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    marginTop: SPACING.xl,
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
  actionMenuOverlay: {
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
  folderSelectorModal: {
    flex: 1,
  },
  folderSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  folderSelectorTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
  },
  closeButton: {
    ...FONTS.bold,
    fontSize: 24,
  },
  foldersList: {
    flex: 1,
    padding: SPACING.md,
  },
  folderItem: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  folderItemText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
});
