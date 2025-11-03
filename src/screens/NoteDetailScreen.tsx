// ============================================
// NOTED - Note Detail Screen with Timeline Navigator
// ============================================

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { COLORS, FONTS, FONT_SIZES, SPACING, ICONS, getThemedColors } from '../theme';
import { formatDate, formatTime, groupEntriesByDate } from '../utils';
import type { Entry, EntryFormatData } from '../types';
import { UrgencyLevel, NoteFormat, FORMAT_EMOJIS, PipelineStage } from '../types';
import { TaskBlock } from '../components/TaskBlock';
import { ProjectBlock } from '../components/ProjectBlock';
import { GoalBlock } from '../components/GoalBlock';
import { JournalMoodBlock } from '../components/JournalMoodBlock';
import { LibraryBlock } from '../components/LibraryBlock';
import { IdeasBlock } from '../components/IdeasBlock';
import { FormatBox } from '../components/FormatBox';
import { EmojiSelector } from '../components/EmojiSelector';
import { PREDEFINED_EMOJIS } from '../types';

export const NoteDetailScreen = ({ route, navigation }: any) => {
  const { noteId: paramNoteId, filterFormat, folderId: initialFolderId, systemId: initialSystemId } = route.params || {};
  const {
    currentNote,
    setCurrentNote,
    addEntry,
    updateEntry,
    updateNote,
    deleteNote,
    deleteEntry,
    createTask,
    addTaskStep,
    toggleTaskStep,
    deleteTask,
    createNote,
    folders,
    loadFolders,
    createFolder,
    activeSystems,
    isDarkMode
  } = useStore();

  const [noteId, setNoteId] = useState<string | undefined>(paramNoteId);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(true); // Start in edit mode for new notes
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null); // Track which entry is being edited
  const [showNavigator, setShowNavigator] = useState(false);
  const [reverseOrder, setReverseOrder] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null); // Track which task is expanded
  const [newStepText, setNewStepText] = useState(''); // New step input
  const scrollViewRef = useRef<ScrollView>(null);

  // NEW: Entry-level format states
  const [activeFormats, setActiveFormats] = useState<NoteFormat[]>([]);
  const [currentFormatData, setCurrentFormatData] = useState<EntryFormatData>({});
  // Removed collapsedEntries - all entries now show full content by default
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [hashtagInput, setHashtagInput] = useState<string>('');
  const [unifiedExpanded, setUnifiedExpanded] = useState<boolean>(true); // Start expanded by default

  // NEW: Multiple text inputs for flexible editing
  const [contentAreas, setContentAreas] = useState<string[]>(['']); // Start with one empty text area

  // Emoji selector
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);

  // Folder selector
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId || null);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderNameInSelector, setNewFolderNameInSelector] = useState('');

  // Header title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Autosave states
  const [autosaveTimers, setAutosaveTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});

  // Autosave function
  const autosave = async (key: string, saveFn: () => Promise<void>) => {
    // Clear existing timer
    if (autosaveTimers[key]) {
      clearTimeout(autosaveTimers[key]);
    }

    // Set new timer for 1 second
    const timer = setTimeout(async () => {
      try {
        await saveFn();
        console.log(`✅ Auto-saved: ${key}`);
      } catch (error) {
        console.error(`❌ Auto-save failed: ${key}`, error);
      }

      // Remove timer from state
      setAutosaveTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[key];
        return newTimers;
      });
    }, 1000);

    setAutosaveTimers(prev => ({ ...prev, [key]: timer }));
  };

  const colors = getThemedColors(isDarkMode);


  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    // If no noteId, create a new note
    const initializeNote = async () => {
      if (!noteId) {
        try {
          console.log('🔵 Creating new note with folderId:', initialFolderId, 'systemId:', initialSystemId);
          const newNoteId = await createNote();
          setNoteId(newNoteId);
          console.log('✅ Created note:', newNoteId);

          // If we have folderId or systemId, update the note
          if (initialFolderId || initialSystemId) {
            console.log('📝 Updating note with folderId:', initialFolderId, 'systemIds:', initialSystemId ? [initialSystemId] : []);
            await updateNote(newNoteId, {
              folderId: initialFolderId || null,
              systemIds: initialSystemId ? [initialSystemId] : []
            });
            console.log('✅ Note updated with folder/system');
          }
        } catch (error) {
          console.error('Failed to create note:', error);
        }
      }
    };

    initializeNote();
  }, []);

  useEffect(() => {
    if (!noteId) return; // Wait for note to be created

    // Load note
    const loadNote = async () => {
      const { notes } = useStore.getState();
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setCurrentNote(note);
        setNoteTitle(note.title);
        // Load folder ID
        if (note.folderId && !selectedFolderId) {
          setSelectedFolderId(note.folderId);
        }
        // Load hashtags
        setHashtagInput(note.hashtags.join(' '));

        // If note has entries, we're viewing it (not editing)
        if (note.entries.length > 0) {
          setIsEditing(false);
        }

        // Auto-expand entries with the filtered format
        // Collapsed entries functionality removed - all entries always expanded
      }
    };
    loadNote();

    return () => setCurrentNote(null);
  }, [noteId, filterFormat]);

  const handleSaveEntry = async () => {
    // Create content blocks from current UI state
    const contentBlocks = [];

    // Add the first text area
    if (contentAreas[0]?.trim()) {
      contentBlocks.push({
        id: `text-${Date.now()}-${Math.random()}`,
        type: 'text' as const,
        content: contentAreas[0],
      });
    }

    // Add format blocks interspersed with text areas
    activeFormats.forEach((formatType, index) => {
      contentBlocks.push({
        id: `format-${formatType}-${Date.now()}-${Math.random()}`,
        type: 'format' as const,
        content: '',
        formatType: formatType,
      });

      // Add the text area after each format (if it exists)
      const textAreaIndex = index + 1;
      if (contentAreas[textAreaIndex]?.trim()) {
        contentBlocks.push({
          id: `text-after-${formatType}-${Date.now()}-${Math.random()}`,
          type: 'text' as const,
          content: contentAreas[textAreaIndex],
        });
      }
    });

    // Combine all content for backward compatibility (legacy content field)
    const combinedContent = contentAreas.filter(area => area.trim().length > 0).join('\n\n');

    // Don't save if there's no content at all
    if (!combinedContent.trim() && activeFormats.length === 0) {
      return;
    }
    if (!currentNote) return;

    try {
      // Parse hashtags from input (space-separated, remove # if present)
      const hashtags = hashtagInput
        .split(/\s+/)
        .map(tag => tag.replace(/^#/, '').trim())
        .filter(tag => tag.length > 0);

      // Update title if changed
      if (noteTitle !== currentNote.title) {
        await updateNote(currentNote.id, { title: noteTitle });
      }

      // Update hashtags (this will auto-create folders)
      if (JSON.stringify(hashtags.sort()) !== JSON.stringify(currentNote.hashtags.sort())) {
        await updateNote(currentNote.id, { hashtags });
      }

      // Use activeFormats directly (no text parsing)
      const formats: NoteFormat[] = activeFormats.length > 0 ? activeFormats : [NoteFormat.NOTE];

      if (editingEntryId) {
        // Update existing entry - use NEW contentBlocks from the edit
        await updateEntry(currentNote.id, editingEntryId, combinedContent, formats, currentFormatData, contentBlocks);
        setEditingEntryId(null);
      } else {
        await addEntry(currentNote.id, combinedContent, formats, currentFormatData, contentBlocks);
      }

      // Clear and reset
      setContentAreas(['']);
      setActiveFormats([]);
      setCurrentFormatData({});
      setIsEditing(false);

      // Reload note
      const { notes } = useStore.getState();
      const updatedNote = notes.find(n => n.id === noteId);
      if (updatedNote) {
        setCurrentNote(updatedNote);
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setNoteContent('');
    setEditingEntryId(null);
  };

  const handleEditEntry = (entry: Entry) => {
    // Load existing entry content AND formats for editing
    setIsEditing(true);
    setNoteContent(entry.content);
    setEditingEntryId(entry.id);
    // Load the entry's formats
    setActiveFormats(entry.entryFormats || []);
    setCurrentFormatData(entry.formatData || {});

    // Load contentBlocks if they exist (convert to contentAreas)
    if (entry.contentBlocks && entry.contentBlocks.length > 0) {
      // Convert contentBlocks back to contentAreas format
      const contentAreasFromBlocks: string[] = [];

      // Filter out the text blocks and add their content
      const textBlocks = entry.contentBlocks.filter(block => block.type === 'text');
      textBlocks.forEach(block => contentAreasFromBlocks.push(block.content));
      setContentAreas(contentAreasFromBlocks.length > 0 ? contentAreasFromBlocks : [entry.content || '']);
    } else {
      // Fallback to legacy content if no contentBlocks
      setContentAreas([entry.content || '']);
    }
  };

  const handleToggleFormat = (format: NoteFormat) => {
    setActiveFormats(prev => {
      if (prev.includes(format)) {
        // Remove format (allow removing all formats)
        const filtered = prev.filter(f => f !== format);
        return filtered.length > 0 ? filtered : [];
      } else {
        // Add format
        return [...prev, format];
      }
    });
  };

  // Toggle format on/off - format buttons in toolbar handle this now

  const handleBack = () => {
    if (isEditing) {
      // If editing, cancel edit and return to view mode
      setIsEditing(false);
      setContentAreas(['']);
      setEditingEntryId(null);
      setActiveFormats([]);
      setCurrentFormatData({});
    } else {
      // If viewing, go back to home
      navigation.goBack();
    }
  };

  const handleSetUrgency = async (urgency: UrgencyLevel) => {
    if (!currentNote) return;

    try {
      await updateNote(currentNote.id, { urgency });
    } catch (error) {
      console.error('Failed to update urgency:', error);
    }
  };

  const handleSetImportance = async (importance: number) => {
    if (!currentNote) return;

    try {
      await updateNote(currentNote.id, { importance });
    } catch (error) {
      console.error('Failed to update importance:', error);
    }
  };

  const handleSetFormat = async (format: NoteFormat) => {
    if (!currentNote) return;

    try {
      await updateNote(currentNote.id, { noteFormat: format });
    } catch (error) {
      console.error('Failed to update format:', error);
    }
  };

  const handleSelectEmoji = async (emoji: string) => {
    if (!currentNote) return;

    try {
      await updateNote(currentNote.id, { selectedEmoji: emoji });
      // Reload note to show updated emoji
      const { notes } = useStore.getState();
      const updatedNote = notes.find(n => n.id === noteId);
      if (updatedNote) {
        setCurrentNote(updatedNote);
      }
    } catch (error) {
      console.error('Failed to update emoji:', error);
    }
  };

  const handleCreateNewFolderFromSelector = async () => {
    if (!newFolderNameInSelector.trim() || !currentNote) return;
    try {
      const folderName = newFolderNameInSelector.trim();

      // Create the folder
      await createFolder(folderName, false);

      // Reload folders to get the updated list
      await loadFolders();

      // Get the fresh folders list from the store
      const { folders: updatedFolders } = useStore.getState();

      // Find the newly created folder
      const newFolder = updatedFolders.find(f => f.name === folderName);

      console.log('Created folder:', folderName);
      console.log('Found folder:', newFolder);

      if (newFolder) {
        // Assign the note to the new folder
        await handleSelectFolder(newFolder.id);
      } else {
        console.error('Could not find newly created folder');
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
    if (!currentNote) return;

    try {
      setSelectedFolderId(folderId);

      // REPLACE systemIds based on the folder (don't accumulate)
      let systemIds: string[] = [];
      if (folderId) {
        const folder = folders.find(f => f.id === folderId);
        if (folder && folder.systemId) {
          systemIds = [folder.systemId]; // Only set the folder's systemId
        }
      }
      // If no folder selected (removing from folder), clear systemIds

      await updateNote(currentNote.id, { folderId, systemIds });
      setShowFolderSelector(false);
      // Reload note to show updated folder
      const { notes } = useStore.getState();
      const updatedNote = notes.find(n => n.id === noteId);
      if (updatedNote) {
        setCurrentNote(updatedNote);
      }
    } catch (error) {
      console.error('Failed to update folder:', error);
    }
  };

  const handleDeleteNote = async () => {
    if (!currentNote) return;

    Alert.alert(
      'Delete Note',
      'Delete this note? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(currentNote.id);
              navigation.goBack();
            } catch (error) {
              console.error('Failed to delete note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          }
        }
      ]
    );
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!currentNote) return;

    Alert.alert(
      'Delete Entry',
      'Delete this entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(currentNote.id, entryId);

              // Reload note after deletion
              const { notes } = useStore.getState();
              const updatedNote = notes.find(n => n.id === noteId);
              if (updatedNote) {
                setCurrentNote(updatedNote);
              }
            } catch (error) {
              console.error('Failed to delete entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          }
        }
      ]
    );
  };

  const handleCreateTask = async () => {
    if (!currentNote) return;

    const taskDescription = prompt('Task description:');
    if (!taskDescription || !taskDescription.trim()) return;

    try {
      await createTask(currentNote.id, taskDescription.trim());
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!currentNote) return;

    const task = currentNote.tasks.find(t => t.id === taskId);
    if (!task) return;

    // If task has steps, only toggle via steps completion
    if (task.steps && task.steps.length > 0) {
      alert('Complete all steps to finish this task');
      return;
    }

    // For tasks without steps, toggle directly
    try {
      await toggleTaskStep(taskId, ''); // Empty stepId toggles the task itself
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleToggleStep = async (taskId: string, stepId: string) => {
    try {
      await toggleTaskStep(taskId, stepId);
    } catch (error) {
      console.error('Failed to toggle step:', error);
    }
  };

  const handleAddStep = async (taskId: string) => {
    if (!currentNote || !newStepText.trim()) return;

    try {
      await addTaskStep(currentNote.id, taskId, newStepText.trim());
      setNewStepText('');
    } catch (error) {
      console.error('Failed to add step:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Delete this task? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              setExpandedTaskId(null);

              // Reload note after deletion
              const { notes } = useStore.getState();
              const updatedNote = notes.find(n => n.id === noteId);
              if (updatedNote) {
                setCurrentNote(updatedNote);
              }
            } catch (error) {
              console.error('Failed to delete task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const handleJumpToEntry = (entryId: string) => {
    setShowNavigator(false);

    if (!currentNote) return;

    // Find the index of the entry to scroll to
    const entryIndex = currentNote.entries.findIndex(entry => entry.id === entryId);

    if (entryIndex !== -1) {
      // Calculate scroll position based on entry index
      // Each entry has approximate height - adjust as needed
      const entryHeight = 100; // Approximate height per entry including padding
      const headerOffset = 200; // Space for headers/title area

      const scrollPosition = headerOffset + (entryIndex * entryHeight);

      // Collapsed entries functionality removed - just scroll to entry
      // Scroll to the entry
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: scrollPosition,
          animated: true,
        });
      }
    }
  };

  if (!currentNote) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  const groupedEntries = groupEntriesByDate(currentNote.entries);

  // Reverse order if needed (latest first)
  const displayedGroups = reverseOrder ? [...groupedEntries].reverse() : groupedEntries;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={[styles.backText, { color: colors.accent }]}>
              {ICONS.general.back}
            </Text>
          </TouchableOpacity>
          {currentNote && (
            isEditingTitle ? (
              <TextInput
                style={[styles.headerTitleInput, { color: colors.text }]}
                value={noteTitle}
                onChangeText={setNoteTitle}
                onBlur={async () => {
                  setIsEditingTitle(false);
                  if (noteTitle !== currentNote.title) {
                    await updateNote(currentNote.id, { title: noteTitle });
                    const { notes } = useStore.getState();
                    const updatedNote = notes.find(n => n.id === noteId);
                    if (updatedNote) {
                      setCurrentNote(updatedNote);
                    }
                  }
                }}
                autoFocus
                maxLength={100}
                placeholder="Note Title"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <TouchableOpacity onPress={() => setIsEditingTitle(true)} style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                  {currentNote.title || 'Untitled'}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <View style={styles.headerButtons}>
          {isEditing && (
            <TouchableOpacity
              onPress={handleSaveEntry}
              disabled={!contentAreas.some(area => area.trim()) && activeFormats.length === 0}
            >
        <Text style={[styles.saveText, { color: (contentAreas.some(area => area.trim()) || activeFormats.length > 0) ? colors.accent : colors.textSecondary }]}>
          Save
        </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isEditing ? (
        /* EDITING MODE - Unified Text and Format Box */
        <ScrollView style={styles.editContainer} contentContainerStyle={styles.editContent}>
          {/* Title moved to header - edit by clicking title next to back button */}

          {/* Format Toolbar */}
          <View style={styles.formatToolbar}>
            <View style={styles.toolbarRow}>
              <View style={styles.toolbarSection}>
                <Text style={[styles.toolbarLabel, { color: colors.textSecondary }]}>Note Emoji:</Text>
                <TouchableOpacity
                  style={[styles.emojiPickerButton, { borderColor: colors.border }]}
                  onPress={() => setShowEmojiSelector(true)}
                >
                  <Text style={styles.emojiPickerButtonText}>
                    {currentNote?.selectedEmoji || FORMAT_EMOJIS[currentNote?.noteFormat || NoteFormat.NOTE]}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.toolbarSection}>
                <Text style={[styles.toolbarLabel, { color: colors.textSecondary }]}>Add Formats:</Text>
                <View style={styles.formatButtons}>
                  {Object.entries({
                    [NoteFormat.TASK]: '✅',
                    [NoteFormat.PROJECT]: '🚀',
                    [NoteFormat.GOAL]: '👑',
                    [NoteFormat.IDEAS]: '🔥',
                    [NoteFormat.LIBRARY]: '📚',
                    [NoteFormat.JOURNAL]: '📓'
                  }).map(([format, emoji]) => {
                    const isActive = activeFormats.includes(format as NoteFormat);
                    return (
                      <TouchableOpacity
                        key={format}
                        style={[
                          styles.toolbarFormatButton,
                          { borderColor: colors.border },
                          isActive && { backgroundColor: colors.accent, borderColor: colors.accent }
                        ]}
                        onPress={() => handleToggleFormat(format as NoteFormat)}
                      >
                        <Text style={isActive ? { color: '#FFFFFF' } : { color: colors.text }}>
                          {emoji}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Unified Content Box - Text and Formats Together */}
          <View style={[styles.unifiedContentBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            {/* Box Header with Toggle */}
            <View style={styles.unifiedBoxHeader}>
              <TouchableOpacity
                onPress={() => setUnifiedExpanded(!unifiedExpanded)}
                style={styles.unifiedExpandToggle}
              >
                <Text style={[styles.unifiedExpandIcon, { color: colors.textSecondary }]}>
                  {unifiedExpanded ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.unifiedBoxTitle, { color: colors.text }]}>
                Note Content {activeFormats.length > 0 && `• ${activeFormats.length} format(s)`}
              </Text>
            </View>

            {/* Content - Only show when expanded */}
            {unifiedExpanded && (
              <View style={styles.unifiedBoxContent}>
                {/* Automatic text inputs interspersed with format blocks */}
                {(() => {
                  // Create an array that alternates between text inputs and format blocks
                  const elements = [];

                  // Always start with a text input (contentAreas[0])
                  elements.push(
                    <TextInput
                      key="text-0"
                      style={[styles.unifiedTextInput, { color: colors.text }, FONTS.regular]}
                      placeholder="Write your note here..."
                      placeholderTextColor={colors.textSecondary}
                      value={contentAreas[0] || ''}
                      onChangeText={(text) => {
                        const newAreas = [...contentAreas];
                        newAreas[0] = text;
                        setContentAreas(newAreas);
                      }}
                      multiline
                      textAlignVertical="top"
                    />
                  );

                  // Add format blocks, each followed by a text input
                  activeFormats.forEach((format, index) => {
                    // Add the format block
                    let formatBlock;
                    switch (format) {
                      case NoteFormat.TASK:
                        formatBlock = (
                          <View key={`format-${format}-${index}`} style={styles.formatBlock}>
                            <TaskBlock
                              tasks={currentFormatData.tasks || []}
                              onTasksChange={(tasks) => setCurrentFormatData({ ...currentFormatData, tasks })}
                              colors={colors}
                            />
                          </View>
                        );
                        break;

                      case NoteFormat.PROJECT:
                        formatBlock = (
                          <View key={`format-${format}-${index}`} style={styles.formatBlock}>
                            <ProjectBlock
                              pipeline={currentFormatData.projectPipeline || {
                                currentStage: 'capture' as any,
                                projectName: '',
                                notes: '',
                              }}
                              onPipelineChange={(pipeline) => setCurrentFormatData({ ...currentFormatData, projectPipeline: pipeline })}
                              colors={colors}
                            />
                          </View>
                        );
                        break;

                      case NoteFormat.GOAL:
                        formatBlock = (
                          <View key={`format-${format}-${index}`} style={styles.formatBlock}>
                            <GoalBlock
                              goalData={currentFormatData.goalProgress || { description: '', progress: 0 }}
                              onGoalChange={(goalData) => setCurrentFormatData({ ...currentFormatData, goalProgress: goalData })}
                              colors={colors}
                            />
                          </View>
                        );
                        break;

                      case NoteFormat.JOURNAL:
                        formatBlock = (
                          <View key={`format-${format}-${index}`} style={styles.formatBlock}>
                            <JournalMoodBlock
                              mood={currentFormatData.journalMood}
                              onMoodChange={(mood) => setCurrentFormatData({ ...currentFormatData, journalMood: mood })}
                              colors={colors}
                            />
                          </View>
                        );
                        break;

                      case NoteFormat.LIBRARY:
                        formatBlock = (
                          <View key={`format-${format}-${index}`} style={styles.formatBlock}>
                            <LibraryBlock
                              links={currentFormatData.libraryLinks || []}
                              onLinksChange={(links) => setCurrentFormatData({ ...currentFormatData, libraryLinks: links })}
                              colors={colors}
                            />
                          </View>
                        );
                        break;

                      case NoteFormat.IDEAS:
                        formatBlock = (
                          <View key={`format-${format}-${index}`} style={styles.formatBlock}>
                            <IdeasBlock
                              ideas={currentFormatData.ideas || []}
                              onIdeasChange={(ideas) => setCurrentFormatData({ ...currentFormatData, ideas })}
                              colors={colors}
                            />
                          </View>
                        );
                        break;

                      default:
                        formatBlock = null;
                    }

                    if (formatBlock) {
                      elements.push(formatBlock);

                      // Add a text input after each format block
                      const textIndex = index + 1;
                      elements.push(
                        <TextInput
                          key={`text-${textIndex}`}
                          style={[styles.unifiedTextInput, { color: colors.text }, FONTS.regular]}
                          placeholder={`Write more content here...`}
                          placeholderTextColor={colors.textSecondary}
                          value={contentAreas[textIndex] || ''}
                          onChangeText={(text) => {
                            const newAreas = [...contentAreas];
                            // Ensure array is long enough
                            while (newAreas.length <= textIndex) {
                              newAreas.push('');
                            }
                            newAreas[textIndex] = text;
                            setContentAreas(newAreas);
                          }}
                          multiline
                          textAlignVertical="top"
                        />
                      );
                    }
                  });

                  return elements;
                })()}
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        /* VIEW MODE - Timeline */
        <>
          {/* Title moved to header - Right side controls */}
          <View style={[styles.titleDisplay, { borderBottomColor: colors.border }]}>
            <View style={styles.titleControls}>
              {/* Two-Row Layout for Controls */}
              {currentNote && (
                <>
                  {/* TOP ROW: Emoji, Urgency, Entry Finder */}
                  <View style={styles.controlsTopRow}>
                    {/* Emoji Selector with Label */}
                    <View style={styles.controlGroup}>
                      <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Note Emoji</Text>
                      <TouchableOpacity
                        style={[styles.emojiPickerButtonSmall, { borderColor: colors.border }]}
                        onPress={() => setShowEmojiSelector(true)}
                      >
                        <Text style={styles.emojiPickerButtonTextSmall}>
                          {currentNote?.selectedEmoji || FORMAT_EMOJIS[currentNote?.noteFormat || NoteFormat.NOTE]}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Urgency with Label */}
                    <View style={styles.controlGroup}>
                      <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Urgency</Text>
                      <View style={styles.urgencyButtons}>
                        <TouchableOpacity
                          onPress={() => handleSetUrgency(UrgencyLevel.HIGH)}
                          style={[
                            styles.urgencyButton,
                            currentNote.urgency === UrgencyLevel.HIGH && styles.urgencyButtonActive
                          ]}
                        >
                          <Text style={styles.urgencyEmoji}>🔴</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleSetUrgency(UrgencyLevel.MEDIUM)}
                          style={[
                            styles.urgencyButton,
                            currentNote.urgency === UrgencyLevel.MEDIUM && styles.urgencyButtonActive
                          ]}
                        >
                          <Text style={styles.urgencyEmoji}>🟡</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleSetUrgency(UrgencyLevel.LOW)}
                          style={[
                            styles.urgencyButton,
                            currentNote.urgency === UrgencyLevel.LOW && styles.urgencyButtonActive
                          ]}
                        >
                          <Text style={styles.urgencyEmoji}>🟢</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Entry Finder */}
                    {groupedEntries.length > 0 && (
                      <View style={styles.controlGroup}>
                        <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Entry Finder</Text>
                        <TouchableOpacity onPress={() => setShowNavigator(true)} style={styles.entryFinderButton}>
                          <Text style={styles.watchIcon}>{ICONS.general.navigator}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* BOTTOM ROW: Folder, Importance, Order */}
                  <View style={styles.controlsBottomRow}>
                    {/* Folder with Label */}
                    <View style={styles.controlGroup}>
                      <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Folder</Text>
                      <TouchableOpacity
                        style={[styles.folderButtonCompact, { borderColor: colors.border, backgroundColor: colors.surface }]}
                        onPress={() => setShowFolderSelector(true)}
                      >
                        <Text style={[styles.folderButtonText, { color: colors.text }]}>
                          {(() => {
                            if (currentNote.folderId) {
                              const folder = folders.find(f => f.id === currentNote.folderId);
                              return folder ? `${folder.icon || '📁'}` : '📁';
                            }
                            return '📁';
                          })()}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Importance with Label */}
                    <View style={styles.controlGroup}>
                      <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Importance</Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => handleSetImportance(star)}
                          >
                            <Text style={styles.starIcon}>
                              {star <= currentNote.importance ? '⭐' : '☆'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Entry Order Toggle */}
                    {groupedEntries.length > 0 && (
                      <View style={styles.controlGroup}>
                        <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Entry Order</Text>
                        <TouchableOpacity onPress={() => setReverseOrder(!reverseOrder)} style={styles.orderToggleButton}>
                          <Text style={[styles.orderToggleText, { color: colors.accent }]}>
                            {reverseOrder ? '↓' : '↑'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Emoji Format Toolbar */}
          <View style={styles.emojiToolbarContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiToolbarScroll}>
              {/* All Types option */}
              <TouchableOpacity
                style={[
                  styles.emojiToolbarChip,
                  !filterFormat ? { backgroundColor: colors.accent } : { backgroundColor: colors.surface, borderColor: colors.border }
                ]}
                onPress={() => navigation.setParams({ filterFormat: null })}
              >
                <Text style={[styles.emojiToolbarText, !filterFormat ? { color: '#FFFFFF' } : { color: colors.text }]}>
                  📝 All
                </Text>
              </TouchableOpacity>

              {/* Format Emojis */}
              {Object.entries({
                [NoteFormat.NOTE]: '📝',
                [NoteFormat.IDEAS]: '🔥',
                [NoteFormat.TASK]: '✅',
                [NoteFormat.PROJECT]: '🚀',
                [NoteFormat.GOAL]: '👑',
                [NoteFormat.LIBRARY]: '📚',
                [NoteFormat.JOURNAL]: '📓'
              }).map(([format, emoji]) => {
                const formatKey = format as NoteFormat;
                const entryFilterCount = currentNote.entries.filter(e =>
                  format === 'NOTE' || // "All" includes NOTE
                  e.entryFormats?.includes(formatKey)
                ).length;
                const isSelected = filterFormat === formatKey;

                return (
                  <TouchableOpacity
                    key={format}
                    style={[
                      styles.emojiToolbarChip,
                      isSelected && styles.emojiToolbarChipSelected,
                      !isSelected && { backgroundColor: colors.surface, borderColor: colors.border }
                    ]}
                    onPress={() => navigation.setParams({ filterFormat: formatKey })}
                  >
                    <Text style={[
                      styles.emojiToolbarText,
                      isSelected ? { color: '#FFFFFF' } : { color: colors.text }
                    ]}>
                      {emoji} ({entryFilterCount})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Tasks Section - Only show for TASK format */}
          {currentNote.noteFormat === NoteFormat.TASK && currentNote.tasks && currentNote.tasks.length > 0 && (
            <View style={[styles.tasksSection, { borderBottomColor: colors.border }]}>
              {currentNote.tasks.map((task, index) => {
                const isExpanded = expandedTaskId === task.id;
                const completedSteps = task.steps?.filter(s => s.isCompleted).length || 0;
                const totalSteps = task.steps?.length || 0;
                const hasSteps = totalSteps > 0;

                return (
                  <View key={task.id} style={[styles.taskCard, { borderBottomColor: colors.border }]}>
                    {/* Task Header */}
                    <TouchableOpacity
                      style={styles.taskHeader}
                      onPress={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    >
                      {/* Checkbox - Hidden for completed tasks */}
                      {!task.isCompleted && (
                        <TouchableOpacity
                          onPress={() => hasSteps ? null : handleToggleTask(task.id)}
                          disabled={hasSteps}
                        >
                          <View
                            style={[
                              styles.taskCheckbox,
                              { borderColor: colors.border },
                            ]}
                          >
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* Task Description */}
                      <View style={styles.taskContent}>
                        <Text
                          style={[
                            styles.taskDescription,
                            { color: colors.text },
                            task.isCompleted && styles.taskCompletedText,
                          ]}
                        >
                          {task.description}
                        </Text>

                        {/* Timestamps */}
                        <Text style={[styles.taskTimestamp, { color: colors.textSecondary }]}>
                          Created {formatTime(task.createdAt)}
                          {task.completedAt && ` • Completed ${formatTime(task.completedAt)}`}
                        </Text>

                        {/* Progress if has steps */}
                        {hasSteps && (
                          <Text style={[styles.taskProgress, { color: colors.textSecondary }]}>
                            {completedSteps}/{totalSteps} steps completed
                          </Text>
                        )}
                      </View>

                      {/* Expand indicator */}
                      <Text style={[styles.expandIndicator, { color: colors.textSecondary }]}>
                        {isExpanded ? '▼' : '▶'}
                      </Text>
                    </TouchableOpacity>

                    {/* Expanded: Steps */}
                    {isExpanded && (
                      <View style={styles.taskSteps}>
                        {task.steps && task.steps.map((step, stepIndex) => (
                          <View key={step.id} style={styles.stepRow}>
                            {/* Step Checkbox */}
                            <TouchableOpacity onPress={() => handleToggleStep(task.id, step.id)}>
                              <View
                                style={[
                                  styles.stepCheckbox,
                                  { borderColor: colors.border },
                                  step.isCompleted && { backgroundColor: colors.accent, borderColor: colors.accent },
                                ]}
                              >
                                {step.isCompleted && <Text style={styles.stepCheckmark}>✓</Text>}
                              </View>
                            </TouchableOpacity>

                            {/* Step Description */}
                            <View style={styles.stepContent}>
                              <Text
                                style={[
                                  styles.stepDescription,
                                  { color: colors.text },
                                  step.isCompleted && styles.stepCompletedText,
                                ]}
                              >
                                {stepIndex + 1}. {step.description}
                              </Text>
                              <Text style={[styles.stepTimestamp, { color: colors.textSecondary }]}>
                                Created {formatTime(step.createdAt)}
                                {step.completedAt && ` • Completed ${formatTime(step.completedAt)}`}
                              </Text>
                            </View>
                          </View>
                        ))}

                        {/* Add Step Input */}
                        <View style={styles.addStepRow}>
                          <TextInput
                            style={[styles.addStepInput, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Add a step..."
                            placeholderTextColor={colors.textSecondary}
                            value={newStepText}
                            onChangeText={setNewStepText}
                            onSubmitEditing={() => handleAddStep(task.id)}
                          />
                          <TouchableOpacity
                            onPress={() => handleAddStep(task.id)}
                            disabled={!newStepText.trim()}
                          >
                            <Text style={[styles.addStepButton, { color: newStepText.trim() ? colors.accent : colors.textSecondary }]}>
                              +
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Delete Task */}
                        <TouchableOpacity
                          onPress={() => handleDeleteTask(task.id)}
                          style={styles.deleteTaskButton}
                        >
                          <Text style={styles.deleteTaskText}>Delete Task</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Timeline */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.timeline}
            contentContainerStyle={styles.timelineContent}
          >
            {groupedEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No entries yet
                </Text>
              </View>
            ) : (
              displayedGroups.map(group => {
              const displayedEntries = reverseOrder ? [...group.entries].reverse() : group.entries;
              return (
                <View key={group.dateLabel} style={styles.dateGroup}>
                  {/* Date Header */}
                  <View style={[styles.dateHeader, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.dateText, { color: colors.text }]}>
                      {ICONS.general.calendar} {group.dateLabel}
                    </Text>
                  </View>

                  {/* Entries for this date */}
                  {displayedEntries.map(entry => {
                    const entryFormats = entry.entryFormats || [NoteFormat.NOTE];
                    const isHighlighted = filterFormat && entry.entryFormats?.includes(filterFormat);

                    return (
                      <View
                        key={entry.id}
                        style={[
                          styles.entry,
                          isHighlighted && { backgroundColor: colors.accent + '10', borderLeftWidth: 3, borderLeftColor: colors.accent }
                        ]}
                      >
                        <View style={styles.entryHeader}>
                          <Text style={[styles.formatEmojis, { color: colors.text }]}>
                            [{entryFormats.map(f => FORMAT_EMOJIS[f]).join('')}]
                          </Text>

                          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                            {formatTime(entry.timestamp)}
                            {entry.isEdited && entry.editedAt && (
                              <Text style={{ opacity: 0.7 }}> • Edited {formatTime(entry.editedAt)}</Text>
                            )}
                          </Text>

                          <View style={styles.entryActions}>
                            <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)}>
                              <Text style={[styles.deleteEntryButton, { color: '#FF3B30' }]}>
                                🗑️
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Always show full content - no collapsing */}
                        <TouchableOpacity activeOpacity={0.7} style={styles.entryContent} onPress={() => handleEditEntry(entry)}>
                            {/* In-view content rendering - shows original saved content */}
                            {(() => {
                              // Check if this specific entry is being edited inline
                              const isThisEntryEditing = false; // TODO: Add state for inline editing

                              if (isThisEntryEditing) {
                                // Inline editing mode
                                return (
                                  <TextInput
                                    style={[styles.entryText, { color: colors.text }]}
                                    value={entry.content}
                                    multiline
                                    onBlur={() => {
                                      // Save on blur
                                      handleEditEntry(entry);
                                    }}
                                    autoFocus
                                  />
                                );
                              } else {
                                // Display original saved content
                                // Check if entry has ANY content at all
                                const hasContentBlocks = entry.contentBlocks && entry.contentBlocks.length > 0;
                                const hasLegacyContent = entry.content && entry.content.trim();
                                const hasFormatData = entry.formatData && Object.keys(entry.formatData).length > 0;

                                return hasContentBlocks ? (
                                  (() => {
                                    // Render contentBlocks with proper interleaving
                                    const renderedBlocks = entry.contentBlocks.map((block, index) => {
                                      if (block.type === 'text') {
                                        return (
                                          <Text key={block.id} style={[styles.entryText, styles.clickableText, { color: block.content?.trim() ? colors.text : colors.textSecondary, fontStyle: block.content?.trim() ? 'normal' : 'italic' }]}>
                                            {block.content?.trim() || '(Empty text - tap to edit)'}
                                          </Text>
                                        );
                                      } else if (block.type === 'format') {
                                        // Render the format block
                                        let formatBlock = null;
                                        switch (block.formatType) {
                                          case NoteFormat.TASK:
                                            if (entry.formatData?.tasks) {
                                              formatBlock = (
                                                <View key={block.id} style={[
                                                  styles.entryFormatBlock,
                                                  filterFormat === NoteFormat.TASK && styles.highlightedFormatBlock
                                                ]}>
                                                  <Text style={[styles.formatBlockTitle, { color: colors.text }]}>✅ Tasks:</Text>
                                                  {entry.formatData.tasks.map((task: any) => (
                                                    <Text key={task.id} style={[
                                                      styles.formatBlockItem,
                                                      { color: colors.text },
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
                                            if (entry.formatData?.projectMilestones) {
                                              formatBlock = (
                                                <View key={block.id} style={[
                                                  styles.entryFormatBlock,
                                                  filterFormat === NoteFormat.PROJECT && styles.highlightedFormatBlock
                                                ]}>
                                                  <Text style={[styles.formatBlockTitle, { color: colors.text }]}>🚀 Project:</Text>
                                                  {entry.formatData.projectMilestones.map((m: any) => (
                                                    <Text key={m.id} style={[
                                                      styles.formatBlockItem,
                                                      { color: colors.text },
                                                      m.isCompleted && styles.completedItem
                                                    ]}>
                                                      {m.isCompleted ? '✓' : '□'} {m.description}
                                                    </Text>
                                                  ))}
                                                </View>
                                              );
                                            }
                                            break;

                                          case NoteFormat.GOAL:
                                            if (entry.formatData?.goalProgress) {
                                              formatBlock = (
                                                <View key={block.id} style={[
                                                  styles.entryFormatBlock,
                                                  filterFormat === NoteFormat.GOAL && styles.highlightedFormatBlock
                                                ]}>
                                                  <Text style={[styles.formatBlockTitle, { color: colors.text }]}>👑 Goal:</Text>
                                                  <Text style={[styles.formatBlockItem, { color: colors.text }]}>
                                                    {entry.formatData.goalProgress.description}
                                                  </Text>
                                                  <Text style={[styles.formatBlockItem, { color: colors.textSecondary }]}>
                                                    Progress: {entry.formatData.goalProgress.progress}%
                                                  </Text>
                                                </View>
                                              );
                                            }
                                            break;

                                          case NoteFormat.JOURNAL:
                                            if (entry.formatData?.journalMood) {
                                              formatBlock = (
                                                <View key={block.id} style={[
                                                  styles.entryFormatBlock,
                                                  filterFormat === NoteFormat.JOURNAL && styles.highlightedFormatBlock
                                                ]}>
                                                  <Text style={[styles.formatBlockTitle, { color: colors.text }]}>
                                                    📓 Mood: {entry.formatData.journalMood.emoji} {entry.formatData.journalMood.label || ''}
                                                  </Text>
                                                </View>
                                              );
                                            }
                                            break;

                                          case NoteFormat.LIBRARY:
                                            if (entry.formatData?.libraryLinks && entry.formatData.libraryLinks.length > 0) {
                                              formatBlock = (
                                                <View key={block.id} style={[
                                                  styles.entryFormatBlock,
                                                  filterFormat === NoteFormat.LIBRARY && styles.highlightedFormatBlock
                                                ]}>
                                                  <Text style={[styles.formatBlockTitle, { color: colors.text }]}>📚 Links ({entry.formatData.libraryLinks.length}):</Text>
                                                  {entry.formatData.libraryLinks.slice(0, 3).map((link: any) => (
                                                    <Text key={link.id} style={[styles.formatBlockItem, { color: colors.text }]}>
                                                      {link.title || link.url}
                                                    </Text>
                                                  ))}
                                                  {entry.formatData.libraryLinks.length > 3 && (
                                                    <Text style={[styles.formatBlockItem, { color: colors.textSecondary }]}>
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
                                                <View key={block.id} style={[
                                                  styles.entryFormatBlock,
                                                  filterFormat === NoteFormat.IDEAS && styles.highlightedFormatBlock
                                                ]}>
                                                  <Text style={[styles.formatBlockTitle, { color: colors.text }]}>🔥 Ideas ({entry.formatData.ideas.length}):</Text>
                                                  {entry.formatData.ideas.map((idea: string, i: number) => (
                                                    <Text key={i} style={[styles.formatBlockItem, { color: colors.text }]}>
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
                                    });

                                    // If all blocks were empty/null, show placeholder
                                    const hasAnyContent = renderedBlocks.some(block => block !== null);
                                    if (!hasAnyContent) {
                                      return (
                                        <Text style={[styles.entryText, styles.clickableText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                                          (Empty entry - tap to edit)
                                        </Text>
                                      );
                                    }

                                    return renderedBlocks;
                                  })()
                                ) : (
                                  // Fallback to legacy rendering if no contentBlocks
                                  <>
                                    {/* Text Content */}
                                    {entry.content ? (
                                      <Text style={[styles.entryText, styles.clickableText, { color: colors.text }]}>
                                        {entry.content}
                                      </Text>
                                    ) : (
                                      <Text style={[styles.entryText, styles.clickableText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                                        (Empty entry - tap to edit)
                                      </Text>
                                    )}

                                    {/* Format Blocks (Read-only) */}
                                    {entry.entryFormats?.includes(NoteFormat.TASK) && entry.formatData?.tasks && (
                                      <View style={[
                                        styles.entryFormatBlock,
                                        filterFormat === NoteFormat.TASK && styles.highlightedFormatBlock
                                      ]}>
                                        <Text style={[styles.formatBlockTitle, { color: colors.text }]}>✅ Tasks:</Text>
                                        {entry.formatData.tasks.map((task: any) => (
                                          <Text key={task.id} style={[
                                            styles.formatBlockItem,
                                            { color: colors.text },
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
                                        <Text style={[styles.formatBlockTitle, { color: colors.text }]}>🚀 Project:</Text>
                                        {entry.formatData.projectMilestones.map((m: any) => (
                                          <Text key={m.id} style={[
                                            styles.formatBlockItem,
                                            { color: colors.text },
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
                                        <Text style={[styles.formatBlockTitle, { color: colors.text }]}>👑 Goal:</Text>
                                        <Text style={[styles.formatBlockItem, { color: colors.text }]}>
                                          {entry.formatData.goalProgress.description}
                                        </Text>
                                        <Text style={[styles.formatBlockItem, { color: colors.textSecondary }]}>
                                          Progress: {entry.formatData.goalProgress.progress}%
                                        </Text>
                                      </View>
                                    )}
                                  </>
                                );
                              }
                            })()}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              );
            })
            )}
          </ScrollView>

          {/* Add Entry Button - Invisible */}
          <TouchableOpacity
            style={styles.invisibleAddButton}
            onPress={handleStartEditing}
          >
            <Text style={[styles.addEntryText, { color: colors.textSecondary }]}>+ Add Entry</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Timeline Navigator Modal */}
      <Modal
        visible={showNavigator}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNavigator(false)}
      >
        <View style={[styles.navigatorModal, { backgroundColor: colors.background }]}>
          <View style={[styles.navigatorHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.navigatorTitle, { color: colors.text }]}>
              Jump to Entry
            </Text>
            <TouchableOpacity onPress={() => setShowNavigator(false)}>
              <Text style={[styles.closeText, { color: colors.accent }]}>
                {ICONS.general.close}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.navigatorList}>
            {currentNote.entries.map((entry, index) => {
              const preview = entry.content.substring(0, 80) + (entry.content.length > 80 ? '...' : '');
              const isFirst = index === 0;
              const isLatest = index === currentNote.entries.length - 1;
              const dateLabel = formatDate(entry.timestamp);

              // Count formats for entry finder display
              const formatCounts: { [key: string]: number } = {};
              const entryFormats = entry.entryFormats || [NoteFormat.NOTE];

              entryFormats.forEach(format => {
                formatCounts[format] = (formatCounts[format] || 0) + 1;
              });

              // Format display string: limit to one emoji per type with count in parentheses
              const formatDisplay = Object.entries(formatCounts)
                .map(([format, count]) => `${FORMAT_EMOJIS[format as NoteFormat]}${count > 1 ? `(${count})` : ''}`)
                .join('');

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.navigatorItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleJumpToEntry(entry.id)}
                >
                  <View style={styles.navigatorItemHeader}>
                    <View style={styles.navigatorLeftSide}>
                      <Text style={[styles.navigatorFormats, { color: colors.textSecondary }]}>
                        {formatDisplay}
                      </Text>
                      <Text style={[styles.navigatorDate, { color: colors.textSecondary }]}>
                        {ICONS.general.calendar} {dateLabel}
                      </Text>
                      <Text style={[styles.navigatorTime, { color: colors.textSecondary }]}>
                        {ICONS.general.clock} {formatTime(entry.timestamp)}
                        {entry.isEdited && entry.editedAt && (
                          <Text style={{ opacity: 0.7 }}> • Edited {formatTime(entry.editedAt)}</Text>
                        )}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.navigatorPreview, { color: colors.text }]} numberOfLines={2}>
                    {preview}
                  </Text>

                  {(isFirst || isLatest) && (
                    <View style={styles.navigatorBadges}>
                      {isFirst && (
                        <Text style={[styles.navigatorBadge, { color: colors.accent }]}>
                          [ first ]
                        </Text>
                      )}
                      {isLatest && (
                        <Text style={[styles.navigatorBadge, { color: colors.accent }]}>
                          [ latest ]
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Emoji Selector Modal */}
      <EmojiSelector
        visible={showEmojiSelector}
        selectedEmoji={currentNote?.selectedEmoji}
        onSelect={handleSelectEmoji}
        onClose={() => setShowEmojiSelector(false)}
        colors={colors}
      />

      {/* Folder Selector Modal */}
      <Modal
        visible={showFolderSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFolderSelector(false)}
      >
        <SafeAreaView style={[styles.navigatorModal, { backgroundColor: colors.background }]}>
          <View style={[styles.navigatorHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.navigatorTitle, { color: colors.text }]}>
              Select Folder
            </Text>
            <TouchableOpacity onPress={() => setShowFolderSelector(false)}>
              <Text style={[styles.closeText, { color: colors.accent }]}>
                {ICONS.general.close}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.navigatorList}>
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
                  selectedFolderId === folder.id && { backgroundColor: colors.accent + '20', borderColor: colors.accent }
                ]}
                onPress={() => handleSelectFolder(folder.id)}
              >
                <Text style={[styles.folderItemText, { color: colors.text }]}>
                  {folder.icon || '📁'} {folder.name}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 70,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    zIndex: 10,
  },
  backText: {
    fontSize: 24,
  },
  headerTitle: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
    flex: 1,
  },
  headerTitleInput: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
    flex: 1,
    padding: 0,
    margin: 0,
  },
  appName: {
    ...FONTS.bold,
    fontSize: 32,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 70,
    textAlign: 'center',
    zIndex: 1,
  },
  headerButtons: {
    width: 60,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  controlsBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  priorityControlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  controlGroup: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  controlLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    textAlign: 'center',
  },
  entryFinderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderToggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityControls: {
    flexDirection: 'column',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  prioritySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  priorityLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    minWidth: 70,
  },
  urgencyButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  urgencyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  urgencyButtonActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  urgencyEmoji: {
    fontSize: 16,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontSize: 16,
  },
  saveText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    padding: SPACING.md,
  },
  dateGroup: {
    marginBottom: SPACING.md,
  },
  dateHeader: {
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  dateText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
    opacity: 0.6,
  },
  entry: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  editEntryButton: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  deleteEntryButton: {
    fontSize: FONT_SIZES.timestamp,
  },
  timeText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    opacity: 0.6,
  },
  entryText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.6,
  },
  clickableText: {
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(0, 122, 255, 0.3)',
    textDecorationStyle: 'solid',
  },
  entryPreview: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    marginTop: SPACING.xs,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  expandToggle: {
    paddingRight: SPACING.xs,
  },
  expandIcon: {
    fontSize: 14,
  },
  formatEmojis: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.timestamp,
    marginRight: SPACING.sm,
  },
  entryContent: {
    marginTop: SPACING.xs,
  },
  entryFormatBlock: {
    marginTop: SPACING.sm,
    paddingLeft: SPACING.md,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  highlightedFormatBlock: {
    backgroundColor: '#FFD70030',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  formatBlockTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.xs,
  },
  formatBlockItem: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    marginBottom: 4,
  },
  completedItem: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deepWorkBadge: {
    marginTop: SPACING.sm,
  },
  deepWorkText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.sm,
  },
  emptyHint: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.meta,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  navigatorModal: {
    flex: 1,
  },
  navigatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 90,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  navigatorTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.header,
  },
  closeText: {
    fontSize: 28,
  },
  quickJumpContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
  },
  quickJumpButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickJumpText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  navigatorList: {
    flex: 1,
    padding: SPACING.md,
  },
  navigatorDateHeader: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.meta,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  navigatorItem: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  navigatorItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  navigatorLeftSide: {
    flex: 1,
  },
  navigatorFormats: {
    marginLeft: SPACING.sm,
    textAlign: 'right',
  },
  navigatorDate: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
  },
  navigatorTime: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  navigatorPreview: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.meta,
    marginTop: SPACING.xs,
    lineHeight: FONT_SIZES.meta * 1.4,
  },
  navigatorBadges: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  navigatorBadge: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  loadingText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    marginTop: 100,
  },
  // EDITING MODE STYLES
  editContainer: {
    flex: 1,
  },
  editContent: {
    padding: SPACING.md,
    paddingBottom: 400, // Extra space for keyboard
  },
  titleInput: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.header,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    marginBottom: SPACING.sm,
  },
  entryNameInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  hashtagInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  contentInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.5,
    paddingTop: SPACING.md,
    minHeight: 150,
  },
  entryFormatButtons: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  formatButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  formatButtonEmoji: {
    fontSize: 20,
  },
  // Big text input that fills the whole page
  bigTextInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.6,
    flex: 1,
    padding: SPACING.md,
    textAlignVertical: 'top',
  },
  // New unified format box styles
  addTextButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  addTextButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  textInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.6,
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 120,
    marginVertical: SPACING.sm,
  },
  // Format Selector Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  modalTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.header,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  formatSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  formatSelectorButton: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  formatSelectorEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  formatSelectorLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    textAlign: 'center',
  },
  modalCloseButton: {
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  // VIEW MODE STYLES
  titleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  titleText: {
    fontSize: FONT_SIZES.bodyLarge,
    flex: 1,
  },
  titleControls: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  entryControls: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  entryFinder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  entryFinderLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  watchIcon: {
    fontSize: 18,
  },
  orderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  orderToggleLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  orderToggleText: {
    fontSize: 22,
  },
  addEntryButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.md,
    borderRadius: 6,
  },
  invisibleAddButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  addEntryText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  // TASK STYLES
  tasksSection: {
    borderBottomWidth: 1,
    paddingBottom: SPACING.md,
  },
  taskCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderBottomWidth: 1,
    paddingBottom: SPACING.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskDescription: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  taskCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskTimestamp: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    marginTop: SPACING.xs,
  },
  taskProgress: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    marginTop: 2,
  },
  expandIndicator: {
    fontSize: 12,
  },
  taskSteps: {
    marginLeft: 36,
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  stepCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
  },
  stepCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  stepTimestamp: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    marginTop: 2,
  },
  addStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  addStepInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    // Removed: borderWidth: 1, borderRadius: 4 - eliminates blue highlights
  },
  addStepButton: {
    fontSize: 24,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  deleteTaskButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  deleteTaskText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    color: '#FF3B30',
  },
  // New unified editing interface styles
  toolbarLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
    marginBottom: SPACING.xs,
  },
  formatToolbar: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    alignItems: 'flex-start',
  },
  toolbarSection: {
    flex: 1,
  },
  emojiPickerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  emojiPickerButtonText: {
    fontSize: 32,
  },
  emojiPickerButtonSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  emojiPickerButtonTextSmall: {
    fontSize: 24,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  toolbarFormatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unifiedContentBox: {
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: SPACING.sm,
    minHeight: 200,
  },
  unifiedBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  unifiedExpandToggle: {
    paddingRight: SPACING.sm,
  },
  unifiedExpandIcon: {
    fontSize: 16,
  },
  unifiedBoxTitle: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    flex: 1,
  },
  unifiedBoxContent: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  unifiedTextInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.6,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  unifiedFormatBlocks: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  formatBlock: {
    // Format blocks inside the unified box
  },
  // Emoji toolbar styles
  emojiToolbarContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  emojiToolbarScroll: {
    flex: 1,
  },
  emojiToolbarChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  emojiToolbarChipDefault: {
    // No additional styles needed for default state
  },
  emojiToolbarChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  emojiToolbarText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  emojiToolbarEmojiBadge: {
    fontSize: 20,
  },
  emojiToolbarBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  emojiToolbarBadgeText: {
    ...FONTS.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  // Entry Tree View styles
  entryTreeSection: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  entryTreeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  entryTreeToggle: {
    flex: 1,
  },
  entryTreeTitle: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  entryTreeContainer: {
    paddingLeft: SPACING.sm,
  },
  // Parent selector styles
  parentSelectorSection: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  parentSelectorScroll: {
    marginTop: SPACING.xs,
  },
  parentSelectorChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  parentSelectorText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  // Folder button and selector styles
  folderButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
  },
  folderButtonCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderButtonText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    textAlign: 'center',
  },
  folderItem: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  folderItemText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    marginBottom: 4,
  },
  folderSystemBadge: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
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
