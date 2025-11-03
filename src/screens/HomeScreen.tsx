// ============================================
// NOTED - Home Screen
// ============================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  ScrollView,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore } from '../store';
import { COLORS, FONTS, FONT_SIZES, SPACING, ICONS, getThemedColors, getUrgencyColor } from '../theme';
import { formatRelativeTime, sortNotesByUrgencyAndImportance } from '../utils';
import type { Note, StandaloneTask, EntryFormatData } from '../types';
import { UrgencyLevel, NoteFormat, FORMAT_EMOJIS, PREDEFINED_EMOJIS } from '../types';
import { FormatBox } from '../components/FormatBox';
import { EmojiSelector } from '../components/EmojiSelector';

// Helper functions for due dates
const getDueDateStatus = (dueDate: Date | undefined): 'overdue' | 'today' | 'upcoming' | 'none' => {
  if (!dueDate) return 'none';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  if (dueDateOnly < today) return 'overdue';
  if (dueDateOnly.getTime() === today.getTime()) return 'today';
  return 'upcoming';
};

const formatDueDate = (dueDate: Date | undefined): string => {
  if (!dueDate) return '';

  const status = getDueDateStatus(dueDate);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (status === 'overdue') {
    const overdueDays = Math.abs(diffDays);
    return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`;
  }
  if (status === 'today') return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;

  return `Due ${dueDate.toLocaleDateString()}`;
};

const sortTasksByPriority = (tasks: StandaloneTask[]): StandaloneTask[] => {
  return [...tasks].sort((a, b) => {
    // Sort by urgency first (HIGH > MEDIUM > LOW > NONE)
    const urgencyOrder = { [UrgencyLevel.HIGH]: 3, [UrgencyLevel.MEDIUM]: 2, [UrgencyLevel.LOW]: 1, [UrgencyLevel.NONE]: 0 };
    const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;

    // Then by importance
    if (b.importance !== a.importance) return b.importance - a.importance;

    // Then by due date (sooner first)
    if (a.dueDate && b.dueDate) {
      const aTime = a.dueDate instanceof Date ? a.dueDate.getTime() : new Date(a.dueDate).getTime();
      const bTime = b.dueDate instanceof Date ? b.dueDate.getTime() : new Date(b.dueDate).getTime();
      return aTime - bTime;
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // Finally by creation date (newest first)
    const aCreated = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const bCreated = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return bCreated - aCreated;
  });
};

export const HomeScreen = ({ navigation }: any) => {
  const {
    notes,
    folders,
    activeSystems,
    standaloneTasks,
    loadNotes,
    loadFolders,
    loadStandaloneTasks,
    createNote,
    createFolder,
    createStandaloneTask,
    updateStandaloneTask,
    updateNote,
    deleteNote,
    deleteFolder,
    toggleStandaloneTask,
    deleteStandaloneTask,
    addStandaloneTaskStep,
    toggleStandaloneTaskStep,
    deleteStandaloneTaskStep,
    // Note-level task methods
    addTaskStep,
    toggleTaskStep,
    deleteTask,
    isDarkMode,
    searchQuery,
    setSearchQuery,
    migrateTasksToNotes,
  } = useStore();

  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<NoteFormat | null>(null); // Format filter
  const [sortByUrgency, setSortByUrgency] = useState(true); // true = urgency/importance, false = date
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [showFormatSelector, setShowFormatSelector] = useState<boolean>(false);

  // Unified Note Editing States
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [draftTitle, setDraftTitle] = useState('New Note');
  const [draftContent, setDraftContent] = useState('');
  const [draftHashtags, setDraftHashtags] = useState('');
  const [activeDraftFormats, setActiveDraftFormats] = useState<NoteFormat[]>([]);
  const [draftFormatData, setDraftFormatData] = useState<EntryFormatData>({});

  // Task Detail Modal states
  const [selectedTask, setSelectedTask] = useState<StandaloneTask | null>(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [newStepInput, setNewStepInput] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<{ [taskId: string]: boolean }>({});
  const [expandedNoteTasks, setExpandedNoteTasks] = useState<{ [noteId: string]: boolean }>({});

  // Date picker states
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(undefined);
  const [tempReminderTime, setTempReminderTime] = useState<Date | undefined>(undefined);

  // Emoji selector states
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [emojiSelectorNoteId, setEmojiSelectorNoteId] = useState<string | null>(null);

  // Action menu states
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
    const initializeApp = async () => {
      // Run migration first (converts standalone tasks to notes)
      await migrateTasksToNotes();
      // Then load data
      await loadNotes();
      await loadFolders();
      await loadStandaloneTasks();
    };
    initializeApp();
  }, []);

  useEffect(() => {
    // Filter by search query
    let filtered = notes.filter(note => {
      const query = searchQuery.toLowerCase();

      // Search in title
      if (note.title.toLowerCase().includes(query)) return true;

      // Search in entry content
      const hasMatchingEntry = note.entries.some(entry =>
        entry.content.toLowerCase().includes(query)
      );
      if (hasMatchingEntry) return true;

      // Search in hashtags
      const hasMatchingHashtag = note.hashtags.some(tag =>
        tag.toLowerCase().includes(query)
      );
      if (hasMatchingHashtag) return true;

      return false;
    });

    // Filter by selected format (check both note format AND entries)
    if (selectedFormat) {
      filtered = filtered.filter(note =>
        note.noteFormat === selectedFormat || // Check main note format
        note.entries.some(e => e.entryFormats?.includes(selectedFormat)) // Check entry formats
      );
    }

    // Sort by urgency/importance or by date
    const sorted = sortByUrgency
      ? sortNotesByUrgencyAndImportance(filtered)
      : [...filtered].sort((a, b) => {
          // Sort by lastModified descending (newest first)
          const aTime = a.lastModified.getTime();
          const bTime = b.lastModified.getTime();
          return bTime - aTime;
        });

    setSortedNotes(sorted);
  }, [notes, searchQuery, selectedFormat, sortByUrgency]);

  // Combine standalone tasks with tasks from notes
  const allTasks = React.useMemo(() => {
    const noteTasks = notes.flatMap(note =>
      note.tasks.map(task => ({
        ...task,
        noteId: note.id,
        noteTitle: note.title,
        // Convert Task to StandaloneTask format
        urgency: note.urgency,
        importance: note.importance,
        hashtags: note.hashtags,
        notificationEnabled: true,
        // Ensure dates are Date objects
        createdAt: task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt),
        completedAt: task.completedAt ? (task.completedAt instanceof Date ? task.completedAt : new Date(task.completedAt)) : undefined,
      }))
    );

    // Return standalone tasks and note tasks combined
    return [...standaloneTasks, ...noteTasks] as (StandaloneTask & { noteId?: string; noteTitle?: string })[];
  }, [standaloneTasks, notes]);

  const colors = getThemedColors(isDarkMode);

  const handleCreateNote = async () => {
    try {
      const id = await createNote('New Note');
      navigation.navigate('NoteDetail', { noteId: id });
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  // Unified note editing handlers
  const handleStartQuickNote = () => {
    setIsCreatingNote(true);
  };

  const handleSaveQuickNote = async () => {
    try {
      const hashtags = draftHashtags
        .split(/\s+/)
        .map(tag => tag.replace(/^#/, '').trim())
        .filter(tag => tag.length > 0);

      // Create note with draft content
      const id = await createNote(draftTitle);

      // Create entry with formats
      const { addEntry } = useStore.getState();
      await addEntry(id, draftContent, activeDraftFormats.length > 0 ? activeDraftFormats : [NoteFormat.NOTE], draftFormatData);

      // Update title and hashtags
      const { updateNote } = useStore.getState();
      if (hashtags.length > 0) {
        await updateNote(id, { title: draftTitle, hashtags });
      }

      // Clear draft and reset UI
      setIsCreatingNote(false);
      setDraftTitle('New Note');
      setDraftContent('');
      setDraftHashtags('');
      setActiveDraftFormats([]);
      setDraftFormatData({});

      // Reload notes to show the new one
      await loadNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note');
    }
  };

  const handleCancelQuickNote = () => {
    setIsCreatingNote(false);
    setDraftTitle('New Note');
    setDraftContent('');
    setDraftHashtags('');
    setActiveDraftFormats([]);
    setDraftFormatData({});
  };

  const handleAddFormat = (format: NoteFormat) => {
    setActiveDraftFormats(prev => {
      if (!prev.includes(format)) {
        return [...prev, format];
      }
      return prev;
    });
  };

  const handleRemoveFormat = (format: NoteFormat) => {
    setActiveDraftFormats(prev => prev.filter(f => f !== format));
    // Clean up format data when removing format
    const newFormatData = { ...draftFormatData };
    switch (format) {
      case NoteFormat.TASK:
        delete newFormatData.tasks;
        break;
      case NoteFormat.PROJECT:
        delete newFormatData.projectPipeline;
        break;
      case NoteFormat.GOAL:
        delete newFormatData.goalProgress;
        break;
      case NoteFormat.JOURNAL:
        delete newFormatData.journalMood;
        break;
      case NoteFormat.LIBRARY:
        delete newFormatData.libraryLinks;
        break;
      case NoteFormat.IDEAS:
        delete newFormatData.ideas;
        break;
    }
    setDraftFormatData(newFormatData);
  };

  const handleCreateTask = async () => {
    const description = prompt('Enter task description:');

    if (!description || !description.trim()) return;

    try {
      await createStandaloneTask(description.trim());
      await loadStandaloneTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    }
  };

  const handleOpenTaskDetail = (task: StandaloneTask) => {
    setSelectedTask(task);
    setEditTaskDescription(task.description);
    setTempDueDate(task.dueDate);
    setTempReminderTime(task.reminderTime);
    setShowTaskDetailModal(true);
  };

  const handleCloseTaskDetail = async () => {
    // Auto-save description before closing
    if (selectedTask && editTaskDescription.trim() && editTaskDescription !== selectedTask.description) {
      try {
        await updateStandaloneTask(selectedTask.id, {
          description: editTaskDescription.trim(),
          lastEditedAt: new Date(),
        });
      } catch (error) {
        console.error('Failed to save task description on close:', error);
      }
    }

    setShowTaskDetailModal(false);
    setSelectedTask(null);
    setEditTaskDescription('');
    setNewStepInput('');
    setTempDueDate(undefined);
    setTempReminderTime(undefined);
  };

  const handleSaveTaskDescription = async () => {
    if (!selectedTask || !editTaskDescription.trim()) return;

    try {
      await updateStandaloneTask(selectedTask.id, {
        description: editTaskDescription.trim(),
        lastEditedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to update task description:', error);
      alert('Failed to update task description');
    }
  };

  const handleSaveDueDate = async () => {
    if (!selectedTask) return;

    try {
      await updateStandaloneTask(selectedTask.id, {
        dueDate: tempDueDate,
        lastEditedAt: new Date(),
      });
      setShowDueDatePicker(false);
    } catch (error) {
      console.error('Failed to update due date:', error);
      alert('Failed to update due date');
    }
  };

  const handleSaveReminderTime = async () => {
    if (!selectedTask) return;

    try {
      await updateStandaloneTask(selectedTask.id, {
        reminderTime: tempReminderTime,
        lastEditedAt: new Date(),
      });
      setShowReminderPicker(false);
    } catch (error) {
      console.error('Failed to update reminder:', error);
      alert('Failed to update reminder');
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;

    try {
      await toggleStandaloneTask(selectedTask.id);
      handleCloseTaskDetail();
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task');
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    // Check if this task belongs to a note
    const isNoteTask = (selectedTask as any).noteId !== undefined;

    Alert.alert(
      'Delete Task',
      'Delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isNoteTask) {
                // Task belongs to a note - use note-level delete
                await deleteTask(selectedTask.id);
                loadNotes(); // Reload notes to update
              } else {
                // Standalone task - use standalone delete
                await deleteStandaloneTask(selectedTask.id);
                loadStandaloneTasks();
              }
              handleCloseTaskDetail();
            } catch (error) {
              console.error('Failed to delete task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const handleAddStep = async () => {
    if (!selectedTask || !newStepInput.trim()) return;

    // Check if this task belongs to a note
    const isNoteTask = (selectedTask as any).noteId !== undefined;
    const noteId = (selectedTask as any).noteId;

    const stepDescription = newStepInput.trim();
    const originalTask = { ...selectedTask };

    // OPTIMISTIC UPDATE: Add step to UI immediately
    const newStep = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary ID
      description: stepDescription,
      isCompleted: false,
      createdAt: new Date(),
    };

    setSelectedTask({
      ...selectedTask,
      steps: [...selectedTask.steps, newStep],
    });
    setNewStepInput('');

    // THEN: Save to database in background (use different method based on task type)
    try {
      let realStepId: string;
      if (isNoteTask && noteId) {
        // Task belongs to a note
        realStepId = await addTaskStep(noteId, selectedTask.id, stepDescription);
        loadNotes();
      } else {
        // Standalone task
        realStepId = await addStandaloneTaskStep(selectedTask.id, stepDescription);
        loadStandaloneTasks();
      }

      // Replace temp ID with real ID
      setSelectedTask(prev => prev ? {
        ...prev,
        steps: prev.steps.map(s => s.id === newStep.id ? { ...s, id: realStepId } : s),
      } : prev);
    } catch (error) {
      // Revert on error
      setSelectedTask(originalTask);
      setNewStepInput(stepDescription);
      console.error('Failed to add step:', error);
      alert('Failed to add step');
    }
  };

  const handleToggleStep = async (stepId: string) => {
    if (!selectedTask) return;

    // Check if this task belongs to a note
    const isNoteTask = (selectedTask as any).noteId !== undefined;

    // Store original state for rollback
    const originalTask = { ...selectedTask };

    // OPTIMISTIC UPDATE: Update UI immediately
    const updatedSteps = selectedTask.steps.map(step =>
      step.id === stepId
        ? {
            ...step,
            isCompleted: !step.isCompleted,
            completedAt: !step.isCompleted ? new Date() : undefined,
          }
        : step
    );

    // Check if all steps are completed (auto-complete logic)
    const allStepsCompleted = updatedSteps.length > 0 && updatedSteps.every(s => s.isCompleted);

    // Update local state immediately for instant UI feedback
    setSelectedTask({
      ...selectedTask,
      steps: updatedSteps,
      isCompleted: allStepsCompleted ? true : (updatedSteps.some(s => !s.isCompleted) ? false : selectedTask.isCompleted),
      completedAt: allStepsCompleted ? new Date() : (updatedSteps.some(s => !s.isCompleted) ? undefined : selectedTask.completedAt),
    });

    // THEN: Save to database in background (use different method based on task type)
    try {
      if (isNoteTask) {
        // Task belongs to a note - use note-level methods
        await toggleTaskStep(selectedTask.id, stepId);
        loadNotes(); // Reload notes to update the task
      } else {
        // Standalone task - use standalone methods
        await toggleStandaloneTaskStep(selectedTask.id, stepId);
        loadStandaloneTasks();
      }
    } catch (error) {
      // Revert to original state on error
      setSelectedTask(originalTask);
      console.error('Failed to toggle step:', error);
      alert('Failed to toggle step');
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!selectedTask) return;

    const originalTask = { ...selectedTask };

    // OPTIMISTIC UPDATE: Remove step from UI immediately
    const updatedSteps = selectedTask.steps.filter(s => s.id !== stepId);

    setSelectedTask({
      ...selectedTask,
      steps: updatedSteps,
    });

    // THEN: Delete from database in background
    try {
      await deleteStandaloneTaskStep(selectedTask.id, stepId);
      // Reload in background
      loadStandaloneTasks();
    } catch (error) {
      // Revert on error
      setSelectedTask(originalTask);
      console.error('Failed to delete step:', error);
      alert('Failed to delete step');
    }
  };

  const toggleStepsExpanded = (taskId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleQuickCreateTask = async () => {
    if (!newTaskInput.trim()) return;

    try {
      await createStandaloneTask(newTaskInput.trim());
      setNewTaskInput('');
      await loadStandaloneTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    }
  };

  const handleCreateItem = (type: 'note' | 'task' | 'project' | 'goal' | 'library' | 'journal') => {
    switch (type) {
      case 'note':
        handleCreateNote();
        break;
      case 'task':
        handleCreateTask();
        break;
      default:
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} feature coming soon!`);
    }
  };

  // Removed handleDeleteNote - now handled by long-press action menu

  const handleSetUrgency = async (noteId: string, urgency: UrgencyLevel, event: any) => {
    event.stopPropagation();

    try {
      await updateNote(noteId, { urgency });
    } catch (error) {
      console.error('Failed to update urgency:', error);
    }
  };

  const handleSetImportance = async (noteId: string, importance: number, event: any) => {
    event.stopPropagation();

    try {
      await updateNote(noteId, { importance });
    } catch (error) {
      console.error('Failed to update importance:', error);
    }
  };

  const handleNoteLongPress = (note: Note) => {
    setSelectedNote(note);
    setShowActionMenu(true);
  };

  const handleDeleteNoteFromMenu = async () => {
    if (!selectedNote) return;
    Alert.alert('Delete Note', `Delete "${selectedNote.title || 'Untitled'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteNote(selectedNote.id);
          await loadNotes();
          setShowActionMenu(false);
          setSelectedNote(null);
        } catch (error) {
          Alert.alert('Error', 'Failed to delete note');
        }
      }}
    ]);
  };

  const handleExportNote = async () => {
    if (!selectedNote) return;
    try {
      let exportText = `${selectedNote.title || 'Untitled'}\n\n`;
      selectedNote.entries.forEach(entry => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        exportText += `--- ${date} ---\n${entry.content}\n\n`;
      });
      await Share.share({ message: exportText, title: selectedNote.title || 'Note Export' });
      setShowActionMenu(false);
      setSelectedNote(null);
    } catch (error) {
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
      Alert.alert('Error', 'Failed to update folder');
    }
  };

  const handleOpenEmojiSelector = (noteId: string, event: any) => {
    event.stopPropagation();
    setEmojiSelectorNoteId(noteId);
    setShowEmojiSelector(true);
  };

  const handleSelectEmoji = async (emoji: string) => {
    if (emojiSelectorNoteId) {
      try {
        await updateNote(emojiSelectorNoteId, { selectedEmoji: emoji });
      } catch (error) {
        console.error('Failed to update emoji:', error);
      }
    }
  };

  const handleDeleteFolder = async (folderId: string, event: any) => {
    event.stopPropagation();

    Alert.alert(
      'Delete Folder',
      'Delete this folder? Notes will not be deleted, only the folder.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFolder(folderId);
              // Clear selection if we deleted the selected folder
              setSelectedFolder(null);
            } catch (error) {
              console.error('Failed to delete folder:', error);
              Alert.alert('Error', 'Failed to delete folder');
            }
          }
        }
      ]
    );
  };

  const handleQuickCreateFolder = async (folderName: string) => {
    const name = folderName.trim();

    if (!name) {
      alert('Please enter a folder name');
      return;
    }

    // Auto-add # prefix if not present
    const folderNameWithHash = name.startsWith('#') ? name.substring(1) : name;

    // Check for duplicates (case-insensitive)
    const folderExists = folders.some(f => f.name.toLowerCase() === folderNameWithHash.toLowerCase());

    if (folderExists) {
      alert(`Folder #${folderNameWithHash} already exists`);
      return;
    }

    try {
      await createFolder(folderNameWithHash, false); // false = manually created
      await loadFolders();
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  };

  const handleCreateFolder = async () => {
    const folderName = newFolderName.trim();

    if (!folderName) {
      alert('Please enter a folder name');
      return;
    }

    // Auto-add # prefix if not present
    const folderNameWithHash = folderName.startsWith('#') ? folderName.substring(1) : folderName;

    // Check for duplicates (case-insensitive)
    const folderExists = folders.some(f => f.name.toLowerCase() === folderNameWithHash.toLowerCase());

    if (folderExists) {
      alert(`Folder #${folderNameWithHash} already exists`);
      return;
    }

    try {
      await createFolder(folderNameWithHash, false); // false = manually created
      setNewFolderName('');
      setShowCreateFolderModal(false);
      await loadFolders();
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  };

  const renderNoteCard = ({ item }: { item: Note }) => {
    const lastEntry = item.entries[item.entries.length - 1];
    const urgencyColor = getUrgencyColor(item.urgency);

    // Get urgency icon
    const getUrgencyIcon = () => {
      if (item.urgency === UrgencyLevel.HIGH) return '🔴';
      if (item.urgency === UrgencyLevel.MEDIUM) return '🟡';
      if (item.urgency === UrgencyLevel.LOW) return '🟢';
      return '';
    };

    // Get importance stars display
    const getImportanceStars = () => {
      if (item.importance === 0) return '';
      return '⭐'.repeat(item.importance);
    };

    // Get unique formats from all entries (excluding the primary note format)
    const entryFormats = new Set<NoteFormat>();
    item.entries.forEach(entry => {
      if (entry.entryFormats) {
        entry.entryFormats.forEach(format => {
          if (format !== item.noteFormat) {
            entryFormats.add(format);
          }
        });
      }
    });
    const uniqueEntryFormats = Array.from(entryFormats);

    // Get format-specific preview based on selected filter
    const getFormatPreview = () => {
      if (!selectedFormat || !lastEntry) return lastEntry?.content || '';

      // Find first entry with the selected format
      const entryWithFormat = item.entries.find(e => e.entryFormats?.includes(selectedFormat));
      if (!entryWithFormat || !entryWithFormat.formatData) return lastEntry.content;

      // Generate preview based on format type
      switch (selectedFormat) {
        case NoteFormat.TASK:
          const tasks = entryWithFormat.formatData.tasks || [];
          if (tasks.length === 0) return lastEntry.content;
          const taskPreview = tasks.slice(0, 2).map((t: any) =>
            `${t.isCompleted ? '✓' : '□'} ${t.description}`
          ).join(' • ');
          return `✅ ${taskPreview}${tasks.length > 2 ? ` (+${tasks.length - 2} more)` : ''}`;

        case NoteFormat.PROJECT:
          const milestones = entryWithFormat.formatData.projectMilestones || [];
          if (milestones.length === 0) return lastEntry.content;
          const completedCount = milestones.filter((m: any) => m.isCompleted).length;
          const milestonePreview = milestones.slice(0, 2).map((m: any) =>
            `${m.isCompleted ? '✓' : '□'} ${m.description}`
          ).join(' • ');
          return `🚀 Phase ${completedCount}/${milestones.length} • ${milestonePreview}`;

        case NoteFormat.GOAL:
          const goal = entryWithFormat.formatData.goalProgress;
          if (!goal) return lastEntry.content;
          return `👑 ${goal.description || 'Goal'} • ${goal.progress}% complete`;

        default:
          return lastEntry.content;
      }
    };

    return (
      <TouchableOpacity
        style={[styles.noteCard, { borderBottomColor: colors.border }]}
        onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
        onLongPress={() => handleNoteLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.noteHeader}>
          {/* Selected Emoji (if set) or Format Icon */}
          <TouchableOpacity onPress={(e) => handleOpenEmojiSelector(item.id, e)}>
            <Text style={styles.formatIcon}>
              {item.selectedEmoji || FORMAT_EMOJIS[item.noteFormat]}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {/* Entry Format Emojis (from entries) - Clickable */}
          {uniqueEntryFormats.length > 0 && (
            <View style={styles.entryFormatEmojisContainer}>
              {uniqueEntryFormats.map(format => (
                <TouchableOpacity
                  key={format}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('NoteDetail', { noteId: item.id, filterFormat: format });
                  }}
                  style={styles.formatEmojiButton}
                >
                  <Text style={styles.entryFormatEmojis}>{FORMAT_EMOJIS[format]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Interactive Priority Controls */}
          <View style={styles.priorityControls}>
            {/* Urgency Selector */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                const urgencies = [UrgencyLevel.NONE, UrgencyLevel.LOW, UrgencyLevel.MEDIUM, UrgencyLevel.HIGH];
                const currentIndex = urgencies.indexOf(item.urgency);
                const nextUrgency = urgencies[(currentIndex + 1) % urgencies.length];
                handleSetUrgency(item.id, nextUrgency, e);
              }}
              style={styles.priorityButton}
            >
              <Text style={styles.priorityIconText}>
                {item.urgency === UrgencyLevel.HIGH ? '🔴' : item.urgency === UrgencyLevel.MEDIUM ? '🟡' : item.urgency === UrgencyLevel.LOW ? '🟢' : ''}
              </Text>
            </TouchableOpacity>

            {/* Importance Selector */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                const nextImportance = (item.importance + 1) % 6; // Cycle 0-5
                handleSetImportance(item.id, nextImportance, e);
              }}
              style={styles.priorityButton}
            >
              <Text style={styles.priorityIconText}>
                {'⭐'.repeat(Math.min(item.importance, 5))}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Note Preview */}
        {lastEntry && (
          <Text style={[styles.notePreview, { color: colors.textSecondary }]} numberOfLines={2}>
            {getFormatPreview()}
          </Text>
        )}

        {/* Meta Info */}
        <View style={styles.noteMeta}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {`${formatRelativeTime(item.lastModified)} • ${item.entries.length} ${item.entries.length === 1 ? 'entry' : 'entries'}`}
          </Text>
        </View>

        {/* Folder and System Badges */}
        {(item.folderId || (item.systemIds && item.systemIds.length > 0)) && (
          <View style={styles.badgesRow}>
            {/* Folder Badge - Full Path */}
            {item.folderId && (
              <View style={[styles.folderBadge, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.folderBadgeText, { color: colors.text }]} numberOfLines={1}>
                  {getFolderPath(item.folderId)}
                </Text>
              </View>
            )}
            {/* System Badges */}
            {item.systemIds && Array.isArray(item.systemIds) && item.systemIds.slice(0, 2).map((sysId: string) => {
              const system = activeSystems.find(s => s.id === sysId);
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
            {item.systemIds && Array.isArray(item.systemIds) && item.systemIds.length > 2 && (
              <Text style={[styles.moreSystemsText, { color: colors.textSecondary }]}>
                +{item.systemIds.length - 2}
              </Text>
            )}
          </View>
        )}

        {/* Hashtags */}
        {item.hashtags.length > 0 && (
          <View style={styles.hashtagsRow}>
            {item.hashtags.slice(0, 3).map(tag => (
              <Text key={tag} style={[styles.hashtag, { color: colors.textSecondary }]}>
                #{tag}
              </Text>
            ))}
            {item.hashtags.length > 3 && (
              <Text style={[styles.hashtag, { color: colors.textSecondary }]}>
                +{item.hashtags.length - 3}
              </Text>
            )}
          </View>
        )}

        {/* Compact Task Preview */}
        {item.tasks && item.tasks.length > 0 && (
          <View style={styles.noteTaskPreview}>
            <TouchableOpacity
              style={styles.noteTaskPreviewHeader}
              onPress={(e) => {
                e.stopPropagation();
                setExpandedNoteTasks(prev => ({
                  ...prev,
                  [item.id]: !prev[item.id],
                }));
              }}
            >
              <Text style={[styles.noteTaskPreviewText, { color: colors.textSecondary }]}>
                {expandedNoteTasks[item.id] ? '▼' : '▶'} Tasks: {item.tasks.filter(t => t.isCompleted).length}/{item.tasks.length} completed
              </Text>
            </TouchableOpacity>

            {/* Expanded Task List */}
            {expandedNoteTasks[item.id] && (
              <View style={styles.noteTaskList}>
                {item.tasks.map(task => (
                  <View key={task.id} style={styles.noteTaskItem}>
                    <Text
                      style={[
                        styles.noteTaskItemText,
                        { color: colors.text },
                        task.isCompleted && styles.noteTaskItemCompleted,
                      ]}
                    >
                      {task.isCompleted ? '✓' : '○'} {task.description}
                    </Text>
                    {task.steps && task.steps.length > 0 && (
                      <Text style={[styles.noteTaskStepsCount, { color: colors.textSecondary }]}>
                        {task.steps.filter(s => s.isCompleted).length}/{task.steps.length} steps
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.sortToggleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setSortByUrgency(!sortByUrgency)}
        >
          <Text style={styles.sortToggleIcon}>{sortByUrgency ? '🔥' : '📅'}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.headerButtonText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('BubblePlayground')}
          >
            <Text style={styles.headerButtonText}>🫧</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('Systems')}
          >
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('AllFolders', { showAllSystems: true })}
          >
            <Text style={styles.headerButtonText}>📁</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.searchIcon}>{ICONS.general.search}</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }, FONTS.regular]}
          placeholder="Search notes..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Permanent Emoji Format Toolbar */}
      <View style={styles.emojiToolbarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiToolbarScroll}>
          {/* All Notes option */}
          <TouchableOpacity
            style={[
              styles.emojiToolbarChip,
              !selectedFormat ? { backgroundColor: colors.accent } : { backgroundColor: colors.surface, borderColor: colors.border }
            ]}
            onPress={() => setSelectedFormat(null)}
          >
            <Text style={[styles.emojiToolbarText, !selectedFormat ? { color: '#FFFFFF' } : { color: colors.text }]}>
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
            const count = notes.filter(n =>
              n.noteFormat === formatKey || // Count notes with this main format
              n.entries.some(e => e.entryFormats?.includes(formatKey)) // Count notes with entries of this format
            ).length;
            const isSelected = selectedFormat === formatKey;

            return (
              <TouchableOpacity
                key={format}
                style={[
                  styles.emojiToolbarChip,
                  isSelected && styles.emojiToolbarChipSelected,
                  !isSelected && { backgroundColor: colors.surface, borderColor: colors.border }
                ]}
                onPress={() => setSelectedFormat(formatKey)}
              >
                <Text style={[
                  styles.emojiToolbarText,
                  isSelected ? { color: '#FFFFFF' } : { color: colors.text }
                ]}>
                  {emoji} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Area */}
      {isCreatingNote ? (
        /* Unified Note Editing Interface */
        <View style={styles.unifiedEditingContainer}>
          {/* Title Input */}
          <View style={[styles.titleInputContainer, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.titleInput, { color: colors.text }]}
              placeholder="Note title..."
              placeholderTextColor={colors.textSecondary}
              value={draftTitle}
              onChangeText={setDraftTitle}
              autoFocus
            />
          </View>

          {/* Content Input */}
          <View style={styles.contentInputContainer}>
            <TextInput
              style={[styles.contentInput, { color: colors.text }]}
              placeholder="Start writing..."
              placeholderTextColor={colors.textSecondary}
              value={draftContent}
              onChangeText={setDraftContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Active Formats Display */}
          {activeDraftFormats.length > 0 && (
            <View style={styles.activeFormatsContainer}>
              <Text style={[styles.activeFormatsLabel, { color: colors.textSecondary }]}>
                Formats:
              </Text>
              <View style={styles.activeFormatsList}>
                {activeDraftFormats.map(format => (
                  <TouchableOpacity
                    key={format}
                    style={styles.activeFormatChip}
                    onPress={() => handleRemoveFormat(format)}
                  >
                    <Text style={styles.activeFormatEmoji}>{FORMAT_EMOJIS[format]}</Text>
                    <Text style={[styles.activeFormatClose, { color: '#FF3B30' }]}>×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Unified FormatBox Integration */}
          {activeDraftFormats.length > 0 && (
            <View style={styles.formatBoxContainer}>
            <FormatBox
              activeFormats={activeDraftFormats}
              formatData={draftFormatData}
              onFormatDataChange={setDraftFormatData}
              onAddFormat={() => setShowFormatSelector(true)}
              onRemoveFormat={handleRemoveFormat}
              colors={colors}
            />
            </View>
          )}

          {/* Add Format Button */}
          {activeDraftFormats.length === 0 && (
            <TouchableOpacity
              style={styles.editingFormatToolbar}
              onPress={handleStartQuickNote}
            >
              <Text style={[styles.editingFormatEmoji, { fontSize: 16 }]}>
                + Add Format Block
              </Text>
            </TouchableOpacity>
          )}

          {/* Hashtags Input */}
          <View style={[styles.hashtagsInputContainer, { borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.hashtagsInput, { color: colors.text }]}
              placeholder="Add hashtags (space separated)..."
              placeholderTextColor={colors.textSecondary}
              value={draftHashtags}
              onChangeText={setDraftHashtags}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.editingActions}>
            <TouchableOpacity
              style={[styles.cancelEditButton, { borderColor: colors.border }]}
              onPress={handleCancelQuickNote}
            >
              <Text style={[styles.cancelEditButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveEditButton, { backgroundColor: colors.accent }]}
              onPress={handleSaveQuickNote}
              disabled={!draftTitle.trim() && !draftContent.trim()}
            >
              <Text style={styles.saveEditButtonText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={sortedNotes}
          renderItem={renderNoteCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'No notes found' : 'No notes yet'}
              </Text>
              {!searchQuery && (
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  Tap [ + ] to create your first note
                </Text>
              )}
            </View>
          }
        />
      )}

      {/* Tasks Tab Content - Now Hidden (migrated to notes with format) */}
      {false && (
        <>
          {/* Quick Add Input */}
          <View style={[styles.quickAddContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.quickAddInput, { color: colors.text }]}
              placeholder="Add a task..."
              placeholderTextColor={colors.textSecondary}
              value={newTaskInput}
              onChangeText={setNewTaskInput}
              onSubmitEditing={handleQuickCreateTask}
            />
            <TouchableOpacity onPress={handleQuickCreateTask} disabled={!newTaskInput.trim()}>
              <Text style={[styles.quickAddButton, { color: newTaskInput.trim() ? colors.accent : colors.textSecondary }]}>
                +
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active Tasks Section */}
          <ScrollView style={styles.tasksScrollView} contentContainerStyle={styles.listContent}>
            {sortTasksByPriority(allTasks.filter(t => !t.isCompleted)).length > 0 ? (
              <>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Active Tasks</Text>
                {sortTasksByPriority(allTasks.filter(t => !t.isCompleted)).map(task => {
                  const completedSteps = task.steps.filter(s => s.isCompleted).length;
                  const totalSteps = task.steps.length;
                  const dueStatus = getDueDateStatus(task.dueDate);

                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={[styles.taskCardClickable, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
                      onPress={() => handleOpenTaskDetail(task)}
                      activeOpacity={0.7}
                    >
                      {/* Task Header */}
                      <View style={styles.taskHeader}>
                        <Text style={[styles.taskDescription, { color: colors.text }]} numberOfLines={2}>
                          {task.description}
                        </Text>
                      </View>

                      {/* Priority Indicators */}
                      {(task.urgency !== UrgencyLevel.NONE || task.importance > 0) && (
                        <View style={styles.taskPriorityRow}>
                          {task.urgency === UrgencyLevel.HIGH && <Text style={styles.taskPriorityIcon}>🔴</Text>}
                          {task.urgency === UrgencyLevel.MEDIUM && <Text style={styles.taskPriorityIcon}>🟡</Text>}
                          {task.urgency === UrgencyLevel.LOW && <Text style={styles.taskPriorityIcon}>🟢</Text>}
                          {task.importance > 0 && (
                            <Text style={styles.taskPriorityIcon}>{'⭐'.repeat(task.importance)}</Text>
                          )}
                        </View>
                      )}

                      {/* Steps Progress */}
                      {totalSteps > 0 && (
                        <View style={styles.stepsPreviewContainer}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleStepsExpanded(task.id);
                            }}
                            style={styles.stepsToggle}
                          >
                            <Text style={[styles.stepsProgressText, { color: colors.textSecondary }]}>
                              {expandedSteps[task.id] ? '▼' : '▶'} {completedSteps}/{totalSteps} steps
                            </Text>
                          </TouchableOpacity>

                          {expandedSteps[task.id] && (
                            <View style={styles.stepsExpandedList}>
                              {task.steps.map((step, index) => (
                                <View key={step.id} style={styles.stepPreviewRow}>
                                  <Text style={[
                                    styles.stepPreviewText,
                                    { color: colors.textSecondary },
                                    step.isCompleted && styles.stepCompletedText
                                  ]}>
                                    {step.isCompleted ? '✓' : '○'} {index + 1}. {step.description}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}

                      {/* Task Meta Info */}
                      <View style={styles.taskMeta}>
                        {/* Note Badge - show if task belongs to a note */}
                        {(task as any).noteTitle && (
                          <View style={[styles.noteBadge, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}>
                            <Text style={[styles.noteBadgeText, { color: colors.accent }]}>
                              📝 {(task as any).noteTitle}
                            </Text>
                          </View>
                        )}

                        <Text style={[styles.taskTimestamp, { color: colors.textSecondary }]}>
                          Created {formatRelativeTime(task.createdAt)}
                        </Text>

                        {/* Due Date Badge */}
                        {task.dueDate && (
                          <View style={[
                            styles.dueDateBadge,
                            dueStatus === 'overdue' && styles.dueDateOverdue,
                            dueStatus === 'today' && styles.dueDateToday,
                            dueStatus === 'upcoming' && styles.dueDateUpcoming,
                          ]}>
                            <Text style={[
                              styles.dueDateText,
                              dueStatus === 'overdue' && styles.dueDateTextOverdue,
                              dueStatus === 'today' && styles.dueDateTextToday,
                            ]}>
                              {formatDueDate(task.dueDate)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No active tasks
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  Add a task above to get started
                </Text>
              </View>
            )}

            {/* Completed Tasks Section - Always Visible */}
            {allTasks.filter(t => t.isCompleted).length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                  ✅ Completed Tasks ({allTasks.filter(t => t.isCompleted).length})
                </Text>

                {allTasks.filter(t => t.isCompleted).map(task => {
                  const completedSteps = task.steps.filter(s => s.isCompleted).length;
                  const totalSteps = task.steps.length;

                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={[styles.taskCardClickable, styles.taskCardCompleted, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
                      onPress={() => handleOpenTaskDetail(task)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.taskHeader}>
                        <Text style={[styles.taskDescription, styles.taskCompletedText, { color: colors.textSecondary }]} numberOfLines={2}>
                          {task.description}
                        </Text>
                      </View>

                      {totalSteps > 0 && (
                        <Text style={[styles.stepsProgressText, { color: colors.textSecondary }]}>
                          {completedSteps}/{totalSteps} steps
                        </Text>
                      )}

                      <View style={styles.taskMeta}>
                        <Text style={[styles.taskTimestamp, { color: colors.textSecondary }]}>
                          Completed {formatRelativeTime(task.completedAt!)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>
        </>
      )}


      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.accent }]}
        onPress={handleCreateNote}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>{ICONS.general.add}</Text>
      </TouchableOpacity>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateFolderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Folder</Text>

            <View style={[styles.modalInputContainer, { borderColor: colors.border }]}>
              <Text style={[styles.hashSymbol, { color: colors.textSecondary }]}>#</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                placeholder="Folder name"
                placeholderTextColor={colors.textSecondary}
                value={newFolderName}
                onChangeText={setNewFolderName}
                autoFocus
                onSubmitEditing={handleCreateFolder}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createButton2, { backgroundColor: colors.accent }]}
                onPress={handleCreateFolder}
              >
                <Text style={styles.createButtonText2}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        visible={showTaskDetailModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseTaskDetail}
      >
        <View style={[styles.editTaskModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.editTaskHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.editTaskTitle, { color: colors.text }]}>Task Details</Text>
            <TouchableOpacity onPress={handleCloseTaskDetail}>
              <Text style={[styles.closeButton, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editTaskContent}>
            {/* Task Description */}
            <View style={[styles.editTaskSection, { borderBottomColor: colors.border }]}>
              <Text style={[styles.editTaskLabel, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.editTaskDescriptionInput, { color: colors.text }]}
                placeholder="Task description"
                placeholderTextColor={colors.textSecondary}
                value={editTaskDescription}
                onChangeText={setEditTaskDescription}
                onBlur={handleSaveTaskDescription}
              />
            </View>

            {/* Steps Section */}
            <View style={styles.editTaskSection}>
              <Text style={[styles.editTaskLabel, { color: colors.textSecondary }]}>Steps</Text>

              {/* Existing Steps */}
              {selectedTask && selectedTask.steps && selectedTask.steps.map((step, index) => (
                <View key={step.id} style={[styles.editStepRow, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity onPress={() => handleToggleStep(step.id)}>
                    <View
                      style={[
                        styles.editStepCheckbox,
                        { borderColor: colors.border },
                        step.isCompleted && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                    >
                      {step.isCompleted && <Text style={styles.editStepCheckmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  <Text style={[styles.editStepNumber, { color: colors.textSecondary }]}>{index + 1}.</Text>
                  <Text
                    style={[
                      styles.editStepText,
                      { color: colors.text },
                      step.isCompleted && styles.editStepCompletedText,
                    ]}
                  >
                    {step.description}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteStep(step.id)}>
                    <Text style={[styles.editStepDelete, { color: '#FF3B30' }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Step Input */}
              <View style={[styles.editAddStepRow, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.editAddStepInput, { color: colors.text }]}
                  placeholder="Add a step..."
                  placeholderTextColor={colors.textSecondary}
                  value={newStepInput}
                  onChangeText={setNewStepInput}
                  onSubmitEditing={handleAddStep}
                />
                <TouchableOpacity
                  onPress={handleAddStep}
                  disabled={!newStepInput.trim()}
                >
                  <Text style={[styles.editAddStepButton, { color: newStepInput.trim() ? colors.accent : colors.textSecondary }]}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.taskActionButtons}>
              {/* Complete Task Button */}
              {selectedTask && !selectedTask.isCompleted && (
                <TouchableOpacity
                  style={[styles.completeTaskButton, { backgroundColor: colors.accent }]}
                  onPress={handleCompleteTask}
                >
                  <Text style={styles.completeTaskButtonText}>✓ Mark Complete</Text>
                </TouchableOpacity>
              )}

              {/* Reopen Task Button (if completed) */}
              {selectedTask && selectedTask.isCompleted && (
                <TouchableOpacity
                  style={[styles.completeTaskButton, { backgroundColor: colors.accent }]}
                  onPress={handleCompleteTask}
                >
                  <Text style={styles.completeTaskButtonText}>↺ Reopen Task</Text>
                </TouchableOpacity>
              )}

              {/* Delete Task Button */}
              <TouchableOpacity
                style={[styles.deleteTaskButton, { borderColor: '#FF3B30' }]}
                onPress={handleDeleteTask}
              >
                <Text style={[styles.deleteTaskButtonText, { color: '#FF3B30' }]}>🗑️ Delete Task</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Emoji Selector Modal */}
      <EmojiSelector
        visible={showEmojiSelector}
        selectedEmoji={emojiSelectorNoteId ? notes.find(n => n.id === emojiSelectorNoteId)?.selectedEmoji : undefined}
        onSelect={handleSelectEmoji}
        onClose={() => setShowEmojiSelector(false)}
        colors={colors}
      />

      {/* Action Menu Modal */}
      <Modal visible={showActionMenu} transparent animationType="fade" onRequestClose={() => setShowActionMenu(false)}>
        <TouchableOpacity style={styles.actionMenuOverlay} activeOpacity={1} onPress={() => setShowActionMenu(false)}>
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
              onPress={handleDeleteNoteFromMenu}
            >
              <Text style={[styles.actionMenuText, { color: '#FF3B30' }]}>Delete Note</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Folder Selector Modal */}
      <Modal visible={showFolderSelector} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFolderSelector(false)}>
        <SafeAreaView style={[styles.folderSelectorModal, { backgroundColor: colors.background }]}>
          <View style={[styles.folderSelectorHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.folderSelectorTitle, { color: colors.text }]}>Select Folder</Text>
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

            <TouchableOpacity style={[styles.folderItem, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => handleSelectFolder(null)}>
              <Text style={[styles.folderItemText, { color: colors.textSecondary }]}>✕ No Folder</Text>
            </TouchableOpacity>
            {folders.map((folder) => (
              <TouchableOpacity key={folder.id} style={[styles.folderItem, { backgroundColor: colors.surface, borderColor: colors.border }, selectedNote?.folderId === folder.id && { backgroundColor: colors.accent + '20', borderColor: colors.accent }]} onPress={() => handleSelectFolder(folder.id)}>
                <Text style={[styles.folderItemText, { color: colors.text }]}>{folder.icon || '📁'} {folder.name}</Text>
                {folder.systemId && (() => { const system = activeSystems.find(s => s.id === folder.systemId); return system ? <Text style={[styles.folderSystemBadge, { color: colors.textSecondary }]}>{system.icon} {system.name}</Text> : null; })()}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: 28,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  sortToggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  sortToggleIcon: {
    fontSize: 18,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    gap: 4,
  },
  headerButtonIcon: {
    fontSize: 16,
  },
  headerButtonLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
    color: '#FFFFFF',
  },
  headerButtonText: {
    fontSize: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: 8,
  },
  searchIcon: {
    fontSize: FONT_SIZES.bodyLarge,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.bodyLarge,
    padding: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  activeTabText: {
    ...FONTS.medium,
  },
  folderFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  folderChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  folderChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    borderWidth: 1,
  },
  folderChipText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  deleteFolderButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteFolderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addFolderButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addFolderText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: 100,
  },
  noteCard: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  noteTitle: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
    flexShrink: 1,
  },
  priorityIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  priorityIconText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  priorityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginLeft: 'auto',
  },
  priorityButton: {
    padding: SPACING.xs,
  },
  notePreview: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  noteMeta: {
    marginBottom: SPACING.xs,
  },
  metaText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    opacity: 0.6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs,
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
    marginRight: 2,
  },
  systemBadgeText: {
    fontSize: 12,
  },
  moreSystemsText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.tiny,
  },
  hashtagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  hashtag: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  noteTaskPreview: {
    marginTop: SPACING.sm,
  },
  noteTaskPreviewHeader: {
    paddingVertical: SPACING.xs,
  },
  noteTaskPreviewText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  noteTaskList: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
    gap: SPACING.xs,
  },
  noteTaskItem: {
    paddingVertical: 2,
  },
  noteTaskItemText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  noteTaskItemCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  noteTaskStepsCount: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp - 1,
    marginLeft: SPACING.md,
    opacity: 0.7,
  },
  formatIcon: {
    fontSize: 18,
    marginRight: SPACING.xs,
  },
  entryFormatEmojisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: SPACING.xs,
  },
  formatEmojiButton: {
    padding: 2,
  },
  entryFormatEmojis: {
    fontSize: 14,
    opacity: 0.8,
  },
  formatFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  formatFilterLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  formatFilterScroll: {
    flex: 1,
  },
  formatChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  formatChipText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
    marginBottom: SPACING.sm,
  },
  emptyHint: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    textAlign: 'center',
  },
  createButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  createButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 12,
    padding: SPACING.lg,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  modalTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.bodyLarge,
    marginBottom: SPACING.md,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  hashSymbol: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
    marginRight: SPACING.xs,
  },
  modalInput: {
    flex: 1,
    ...FONTS.regular,
    fontSize: FONT_SIZES.bodyLarge,
    paddingVertical: SPACING.sm,
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
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  createButton2: {
    // backgroundColor handled by accent color
  },
  createButtonText2: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  // Plus Menu styles
  plusMenuContent: {
    width: 250,
    borderRadius: 12,
    padding: SPACING.md,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  plusMenuTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.bodyLarge,
    marginBottom: SPACING.md,
  },
  plusMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
  },
  plusMenuEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  plusMenuText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
  },
  // Task card styles
  taskCard: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
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
    fontSize: FONT_SIZES.bodyLarge,
  },
  taskCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskPriorityRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: SPACING.xs,
  },
  taskPriorityIcon: {
    fontSize: 14,
  },
  taskDeleteButton: {
    padding: SPACING.xs,
  },
  taskDeleteButtonText: {
    fontSize: 20,
  },
  taskEditButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  taskEditButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  quickAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  quickAddInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
  },
  quickAddButton: {
    fontSize: 28,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  editTaskModalContainer: {
    flex: 1,
    marginTop: 60,
  },
  editTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  editTaskTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.header,
  },
  closeButton: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  editTaskContent: {
    flex: 1,
  },
  editTaskSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  editTaskLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
    marginBottom: SPACING.sm,
  },
  editTaskDescriptionInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.sm,
  },
  editStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  editStepCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editStepCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editStepNumber: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    width: 24,
  },
  editStepText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
  },
  editStepCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  editStepDelete: {
    fontSize: 18,
    padding: SPACING.xs,
  },
  editAddStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  editAddStepInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
  },
  editAddStepButton: {
    fontSize: 28,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  // New task card styles
  sectionHeader: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.bodyLarge,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  tasksScrollView: {
    flex: 1,
  },
  taskCardClickable: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    marginHorizontal: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskHeader: {
    marginBottom: SPACING.xs,
  },
  stepsPreviewContainer: {
    marginTop: SPACING.xs,
  },
  stepsToggle: {
    paddingVertical: SPACING.xs,
  },
  stepsProgressText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  stepsExpandedList: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
  },
  stepPreviewRow: {
    paddingVertical: 2,
  },
  stepPreviewText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  stepCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskTimestamp: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    color: '#666',
  },
  dueDateBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  dueDateOverdue: {
    backgroundColor: '#FFEBEE',
  },
  dueDateToday: {
    backgroundColor: '#FFF3E0',
  },
  dueDateUpcoming: {
    backgroundColor: '#E8F5E9',
  },
  dueDateText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
    color: '#666',
  },
  dueDateTextOverdue: {
    color: '#D32F2F',
  },
  dueDateTextToday: {
    color: '#F57C00',
  },
  completedSectionHeader: {
    marginTop: SPACING.lg,
  },
  noteBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteBadgeText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  taskActionButtons: {
    padding: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  completeTaskButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeTaskButtonText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  deleteTaskButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  deleteTaskButtonText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
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
  emojiToolbarText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  emojiToolbarItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    position: 'relative',
  },
  emojiToolbarEmoji: {
    fontSize: 24,
    marginBottom: 2,
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
  emojiToolbarBadgeSelected: {
    backgroundColor: '#007AFF',
  },
  emojiToolbarBadgeText: {
    ...FONTS.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  emojiToolbarBadgeTextSelected: {
    color: '#FFFFFF',
  },
  emojiToolbarChipDefault: {
    // No additional styles needed for default state
  },
  emojiToolbarChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  emojiToolbarEmojiBadge: {
    fontSize: 20,
  },
  // Unified editing styles
  unifiedEditingContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  titleInputContainer: {
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  titleInput: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.header,
    paddingVertical: SPACING.sm,
  },
  contentInputContainer: {
    flex: 1,
    marginVertical: SPACING.md,
  },
  contentInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: 24,
    minHeight: 120,
  },
  activeFormatsContainer: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  activeFormatsLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
    marginBottom: SPACING.xs,
  },
  activeFormatsList: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  activeFormatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeFormatEmoji: {
    fontSize: 16,
  },
  activeFormatClose: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editingFormatToolbar: {
    paddingVertical: SPACING.sm,
  },
  editingFormatItem: {
    marginRight: SPACING.sm,
  },
  editingFormatEmoji: {
    fontSize: 24,
  },
  formatBoxContainer: {
    marginTop: SPACING.sm,
  },
  hashtagsInputContainer: {
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
  },
  hashtagsInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.sm,
  },
  editingActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelEditButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  saveEditButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveEditButtonText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  // Action menu modal styles
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
  // Folder selector modal styles
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
