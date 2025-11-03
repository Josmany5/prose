// ============================================
// NOTED - Web Database Service (localStorage)
// Fallback for web browsers
// ============================================

import type {
  Note,
  Entry,
  Folder,
  StandaloneTask,
} from '../types';
import { UrgencyLevel, NoteFormat } from '../types';

const STORAGE_KEYS = {
  NOTES: 'noted_notes',
  FOLDERS: 'noted_folders',
  STANDALONE_TASKS: 'noted_standalone_tasks',
  SYSTEMS: 'noted_systems',
};

class WebDatabaseService {
  async init() {
    try {
      // Initialize storage if not exists
      if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.FOLDERS)) {
        localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.STANDALONE_TASKS)) {
        localStorage.setItem(STORAGE_KEYS.STANDALONE_TASKS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SYSTEMS)) {
        localStorage.setItem(STORAGE_KEYS.SYSTEMS, JSON.stringify([]));
      }
      console.log('✅ Web Database initialized successfully');
    } catch (error) {
      console.error('❌ Web Database initialization failed:', error);
      throw error;
    }
  }

  // ============================================
  // NOTES Operations
  // ============================================

  async createNote(note: Omit<Note, 'id' | 'entries' | 'tasks'>): Promise<string> {
    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newNote: Note = {
      ...note,
      id,
      entries: [],
      tasks: [],
    };

    const notes = await this.getAllNotes();
    notes.push(newNote);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));

    return id;
  }

  async getAllNotes(): Promise<Note[]> {
    const notesJson = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!notesJson) return [];

    const notes = JSON.parse(notesJson);

    // Convert date strings back to Date objects
    return notes.map((note: any) => {
      // Parse systemIds if it's stored as a string
      let parsedSystemIds;
      if (Array.isArray(note.systemIds)) {
        parsedSystemIds = note.systemIds;
      } else if (typeof note.systemIds === 'string') {
        parsedSystemIds = note.systemIds ? JSON.parse(note.systemIds) : [];
      } else {
        parsedSystemIds = note.systemIds || [];
      }

      return {
        ...note,
        noteFormat: note.noteFormat || NoteFormat.NOTE, // Backwards compatibility: default to 'note'
        systemIds: parsedSystemIds,
        createdAt: new Date(note.createdAt),
        lastModified: new Date(note.lastModified),
        entries: note.entries.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
          entryFormats: entry.entryFormats || [NoteFormat.NOTE], // Backwards compatibility
          formatData: entry.formatData || {}, // Backwards compatibility
          editHistory: entry.editHistory.map((edit: any) => ({
            ...edit,
            editedAt: new Date(edit.editedAt),
          })),
        })),
        tasks: note.tasks.map((task: any) => ({
          ...task,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        })),
      };
    });
  }

  async getNoteById(id: string): Promise<Note | null> {
    const notes = await this.getAllNotes();
    return notes.find(note => note.id === id) || null;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    const notes = await this.getAllNotes();
    const index = notes.findIndex(note => note.id === id);

    if (index === -1) throw new Error('Note not found');

    notes[index] = {
      ...notes[index],
      ...updates,
      lastModified: new Date(),
    };

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }

  async deleteNote(id: string): Promise<void> {
    const notes = await this.getAllNotes();
    const filtered = notes.filter(note => note.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));
  }

  // ============================================
  // ENTRIES Operations
  // ============================================

  async createEntry(noteId: string, entry: Omit<Entry, 'id'>): Promise<string> {
    const id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newEntry: Entry = {
      ...entry,
      id,
    };

    const notes = await this.getAllNotes();
    const note = notes.find(n => n.id === noteId);

    if (!note) throw new Error('Note not found');

    note.entries.push(newEntry);
    note.lastModified = new Date();

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));

    return id;
  }

  async getEntriesByNoteId(noteId: string): Promise<Entry[]> {
    const note = await this.getNoteById(noteId);
    return note?.entries || [];
  }

  async updateEntry(noteId: string, entryId: string, updates: Partial<Entry>): Promise<void> {
    const notes = await this.getAllNotes();
    const note = notes.find(n => n.id === noteId);

    if (!note) throw new Error('Note not found');

    const entryIndex = note.entries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) throw new Error('Entry not found');

    note.entries[entryIndex] = {
      ...note.entries[entryIndex],
      ...updates,
      isEdited: true,
      editedAt: new Date(),
    };
    note.lastModified = new Date();

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }

  async deleteEntry(noteId: string, entryId: string): Promise<void> {
    const notes = await this.getAllNotes();
    const note = notes.find(n => n.id === noteId);

    if (!note) throw new Error('Note not found');

    note.entries = note.entries.filter(entry => entry.id !== entryId);
    note.lastModified = new Date();

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }

  // ============================================
  // TASKS Operations
  // ============================================

  async createTask(noteId: string, description: string): Promise<string> {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notes = await this.getAllNotes();
    const note = notes.find(n => n.id === noteId);

    if (!note) throw new Error('Note not found');

    note.tasks.push({
      id,
      description,
      isCompleted: false,
      createdAt: new Date(),
      steps: [],
    });

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));

    return id;
  }

  async getTasksByNoteId(noteId: string): Promise<any[]> {
    const note = await this.getNoteById(noteId);
    return note?.tasks || [];
  }

  async toggleTask(taskId: string): Promise<void> {
    const notes = await this.getAllNotes();

    for (const note of notes) {
      const task = note.tasks.find(t => t.id === taskId);
      if (task) {
        task.isCompleted = !task.isCompleted;
        task.completedAt = task.isCompleted ? new Date() : undefined;
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
        return;
      }
    }

    throw new Error('Task not found');
  }

  async addTaskStep(noteId: string, taskId: string, description: string): Promise<string> {
    const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notes = await this.getAllNotes();

    for (const note of notes) {
      if (note.id === noteId) {
        const task = note.tasks.find(t => t.id === taskId);
        if (task) {
          task.steps.push({
            id: stepId,
            description,
            isCompleted: false,
            createdAt: new Date(),
          });
          localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
          return stepId;
        }
      }
    }

    throw new Error('Task not found');
  }

  async toggleTaskStep(taskId: string, stepId: string): Promise<void> {
    const notes = await this.getAllNotes();

    for (const note of notes) {
      const task = note.tasks.find(t => t.id === taskId);
      if (task) {
        const step = task.steps.find(s => s.id === stepId);
        if (step) {
          step.isCompleted = !step.isCompleted;
          step.completedAt = step.isCompleted ? new Date() : undefined;

          // Check if all steps are completed
          const allStepsCompleted = task.steps.length > 0 && task.steps.every(s => s.isCompleted);
          if (allStepsCompleted && !task.isCompleted) {
            task.isCompleted = true;
            task.completedAt = new Date();
          } else if (!allStepsCompleted && task.isCompleted) {
            task.isCompleted = false;
            task.completedAt = undefined;
          }

          localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
          return;
        }
      }
    }

    throw new Error('Step not found');
  }

  async deleteTask(taskId: string): Promise<void> {
    const notes = await this.getAllNotes();

    for (const note of notes) {
      const taskIndex = note.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        note.tasks.splice(taskIndex, 1);
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
        return;
      }
    }

    throw new Error('Task not found');
  }

  // ============================================
  // FOLDERS Operations
  // ============================================

  async createFolder(name: string, isAutoGenerated: boolean = false): Promise<string> {
    const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newFolder: Folder = {
      id,
      name,
      isAutoGenerated,
      createdAt: new Date(),
    };

    const foldersJson = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    const folders: Folder[] = foldersJson ? JSON.parse(foldersJson) : [];

    folders.push(newFolder);
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));

    return id;
  }

  async getAllFolders(): Promise<Folder[]> {
    const foldersJson = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    if (!foldersJson) return [];

    const folders = JSON.parse(foldersJson);

    return folders.map((folder: any) => ({
      ...folder,
      createdAt: new Date(folder.createdAt),
    }));
  }

  async deleteFolder(folderId: string): Promise<void> {
    console.log('🗑️ Deleting folder:', folderId);

    const foldersJson = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    if (!foldersJson) {
      console.log('❌ No folders found in localStorage');
      return;
    }

    const folders: Folder[] = JSON.parse(foldersJson);
    console.log('📁 Total folders before delete:', folders.length);

    // Get all folder IDs to delete (this folder + all descendants)
    const getFolderAndDescendants = (parentId: string): string[] => {
      const result = [parentId];
      const children = folders.filter(f => f.parentFolderId === parentId);
      children.forEach(child => {
        result.push(...getFolderAndDescendants(child.id));
      });
      return result;
    };

    const foldersToDelete = getFolderAndDescendants(folderId);
    console.log('🗑️ Deleting folders:', foldersToDelete);

    // Filter out all folders to delete
    const updatedFolders = folders.filter(folder => !foldersToDelete.includes(folder.id));
    console.log('📁 Total folders after delete:', updatedFolders.length);

    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(updatedFolders));

    // Also clear folderId from notes that were in deleted folders
    const notesJson = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (notesJson) {
      const notes = JSON.parse(notesJson);
      const updatedNotes = notes.map((note: any) => {
        if (note.folderId && foldersToDelete.includes(note.folderId)) {
          return { ...note, folderId: undefined };
        }
        return note;
      });
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes));
      console.log('✅ Notes updated to remove deleted folder references');
    }

    console.log('✅ Folder deleted successfully');
  }

  async getSubFolders(parentFolderId: string): Promise<any[]> {
    const folders = await this.getAllFolders();
    return folders.filter(folder => folder.parentFolderId === parentFolderId);
  }

  async getNotesByFolder(folderId: string): Promise<any[]> {
    const notes = await this.getAllNotes();
    return notes.filter(note => note.folderId === folderId);
  }

  // ============================================
  // STANDALONE TASKS Operations
  // ============================================

  async createStandaloneTask(description: string): Promise<string> {
    const id = `standalone_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newTask: StandaloneTask = {
      id,
      description,
      isCompleted: false,
      createdAt: new Date(),
      urgency: UrgencyLevel.NONE,
      importance: 0,
      hashtags: [],
      steps: [],
      notificationEnabled: true, // Default to enabled
    };

    const tasksJson = localStorage.getItem(STORAGE_KEYS.STANDALONE_TASKS);
    const tasks: StandaloneTask[] = tasksJson ? JSON.parse(tasksJson) : [];
    tasks.push(newTask);

    localStorage.setItem(STORAGE_KEYS.STANDALONE_TASKS, JSON.stringify(tasks));
    return id;
  }

  async getAllStandaloneTasks(): Promise<StandaloneTask[]> {
    const tasksJson = localStorage.getItem(STORAGE_KEYS.STANDALONE_TASKS);
    if (!tasksJson) return [];

    const tasks = JSON.parse(tasksJson);

    return tasks.map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      lastEditedAt: task.lastEditedAt ? new Date(task.lastEditedAt) : undefined,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      reminderTime: task.reminderTime ? new Date(task.reminderTime) : undefined,
      notificationEnabled: task.notificationEnabled ?? true, // Default to true for backward compatibility
      steps: task.steps || [], // Ensure steps array exists for backward compatibility
    }));
  }

  async updateStandaloneTask(taskId: string, updates: Partial<StandaloneTask>): Promise<void> {
    const tasksJson = localStorage.getItem(STORAGE_KEYS.STANDALONE_TASKS);
    if (!tasksJson) return;

    const tasks: StandaloneTask[] = JSON.parse(tasksJson);
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) throw new Error('Task not found');

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
    };

    localStorage.setItem(STORAGE_KEYS.STANDALONE_TASKS, JSON.stringify(tasks));
  }

  async toggleStandaloneTask(taskId: string): Promise<void> {
    const tasksJson = localStorage.getItem(STORAGE_KEYS.STANDALONE_TASKS);
    if (!tasksJson) return;

    const tasks: StandaloneTask[] = JSON.parse(tasksJson);
    const task = tasks.find(t => t.id === taskId);

    if (!task) throw new Error('Task not found');

    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : undefined;

    localStorage.setItem(STORAGE_KEYS.STANDALONE_TASKS, JSON.stringify(tasks));
  }

  async deleteStandaloneTask(taskId: string): Promise<void> {
    const tasksJson = localStorage.getItem(STORAGE_KEYS.STANDALONE_TASKS);
    if (!tasksJson) return;

    const tasks: StandaloneTask[] = JSON.parse(tasksJson);
    const updatedTasks = tasks.filter(t => t.id !== taskId);

    localStorage.setItem(STORAGE_KEYS.STANDALONE_TASKS, JSON.stringify(updatedTasks));
  }

  async addStandaloneTaskStep(taskId: string, description: string): Promise<string> {
    const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tasksJson = localStorage.getItem(STORAGE_KEYS.STANDALONE_TASKS);
    if (!tasksJson) throw new Error('Tasks not found');

    const tasks: StandaloneTask[] = JSON.parse(tasksJson);
    const task = tasks.find(t => t.id === taskId);

    if (!task) throw new Error('Task not found');

    // Initialize steps array if it doesn't exist (for backward compatibility)
    if (!task.steps) {
      task.steps = [];
    }

    task.steps.push({
      id: stepId,
      description,
      isCompleted: false,
      createdAt: new Date(),
    });

    localStorage.setItem(STORAGE_KEYS.STANDALONE_TASKS, JSON.stringify(tasks));
    return stepId;
  }

  async toggleStandaloneTaskStep(taskId: string, stepId: string): Promise<void> {
    const tasksJson = localStorage.getItem(STORAGE_KEYS.STANDALONE_TASKS);
    if (!tasksJson) return;

    const tasks: StandaloneTask[] = JSON.parse(tasksJson);
    const task = tasks.find(t => t.id === taskId);

    if (!task) return;

    const step = task.steps.find(s => s.id === stepId);
    if (!step) return;

    step.isCompleted = !step.isCompleted;
    step.completedAt = step.isCompleted ? new Date() : undefined;

    // Check if all steps are completed - AUTO-COMPLETION LOGIC
    const allStepsCompleted = task.steps.length > 0 && task.steps.every(s => s.isCompleted);
    if (allStepsCompleted && !task.isCompleted) {
      task.isCompleted = true;
      task.completedAt = new Date();
    } else if (!allStepsCompleted && task.isCompleted) {
      task.isCompleted = false;
      task.completedAt = undefined;
    }

    localStorage.setItem(STORAGE_KEYS.STANDALONE_TASKS, JSON.stringify(tasks));
  }

  async deleteStandaloneTaskStep(taskId: string, stepId: string): Promise<void> {
    const tasksJson = localStorage.getItem(STORAGE_KEYS.STANDALONE_TASKS);
    if (!tasksJson) return;

    const tasks: StandaloneTask[] = JSON.parse(tasksJson);
    const task = tasks.find(t => t.id === taskId);

    if (!task) return;

    task.steps = task.steps.filter(s => s.id !== stepId);

    localStorage.setItem(STORAGE_KEYS.STANDALONE_TASKS, JSON.stringify(tasks));
  }

  // ============================================
  // MIGRATION Operations
  // ============================================

  async migrateStandaloneTasksToNotes(): Promise<number> {
    try {
      const standaloneTasks = await this.getAllStandaloneTasks();

      if (standaloneTasks.length === 0) {
        console.log('✅ No standalone tasks to migrate');
        return 0;
      }

      console.log(`🔄 Migrating ${standaloneTasks.length} standalone tasks to notes...`);

      // Convert each standalone task to a note with task format
      for (const task of standaloneTasks) {
        const taskNote: Note = {
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: task.description,
          createdAt: task.createdAt,
          lastModified: task.lastEditedAt || task.createdAt,
          noteFormat: NoteFormat.TASK,
          folderId: undefined,
          hashtags: task.hashtags || [],
          linkedNoteIds: [],
          urgency: task.urgency,
          importance: task.importance,
          pipelineStage: undefined,
          progressPercentage: 0,
          pipelineGroupId: undefined,
          entries: [],
          tasks: [{
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            description: task.description,
            isCompleted: task.isCompleted,
            completedAt: task.completedAt,
            createdAt: task.createdAt,
            steps: task.steps || [],
          }],
          totalDeepWorkTime: 0,
          deepWorkSessionCount: 0,
        };

        // Save the new note
        const notes = await this.getAllNotes();
        notes.push(taskNote);
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      }

      // Clear standalone tasks after migration
      localStorage.setItem(STORAGE_KEYS.STANDALONE_TASKS, JSON.stringify([]));

      console.log(`✅ Successfully migrated ${standaloneTasks.length} tasks to notes`);
      return standaloneTasks.length;
    } catch (error) {
      console.error('❌ Failed to migrate tasks:', error);
      throw error;
    }
  }

  // ============================================
  // SYSTEMS Operations
  // ============================================

  async getActiveSystems(): Promise<any[]> {
    const systemsJson = localStorage.getItem(STORAGE_KEYS.SYSTEMS);
    if (!systemsJson) return [];

    const systems = JSON.parse(systemsJson);
    return systems.filter((system: any) => system.isActive);
  }

  async activateSystem(systemId: string, systemData: any): Promise<void> {
    const systemsJson = localStorage.getItem(STORAGE_KEYS.SYSTEMS);
    const systems = systemsJson ? JSON.parse(systemsJson) : [];

    // Check if system already exists
    const existingIndex = systems.findIndex((s: any) => s.id === systemId);

    if (existingIndex >= 0) {
      // Update existing system
      systems[existingIndex] = {
        ...systems[existingIndex],
        ...systemData,
        id: systemId,
        isActive: true,
        activatedAt: Date.now(),
      };
    } else {
      // Add new system
      systems.push({
        ...systemData,
        id: systemId,
        isActive: true,
        activatedAt: Date.now(),
      });
    }

    localStorage.setItem(STORAGE_KEYS.SYSTEMS, JSON.stringify(systems));
    console.log(`✅ System ${systemId} activated (web)`);
  }

  async deactivateSystem(systemId: string): Promise<void> {
    // Deactivate the system
    const systemsJson = localStorage.getItem(STORAGE_KEYS.SYSTEMS);
    if (systemsJson) {
      const systems = JSON.parse(systemsJson);
      const systemIndex = systems.findIndex((s: any) => s.id === systemId);

      if (systemIndex >= 0) {
        systems[systemIndex].isActive = false;
        localStorage.setItem(STORAGE_KEYS.SYSTEMS, JSON.stringify(systems));
      }
    }

    // DELETE all folders belonging to this system (web doesn't support soft delete)
    // This matches native behavior where folders become inactive/hidden
    const foldersJson = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    if (foldersJson) {
      const folders = JSON.parse(foldersJson);
      const updatedFolders = folders.filter((folder: any) => folder.systemId !== systemId);
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(updatedFolders));
    }

    // Clear systemIds and folderId from notes that belong to this system
    const notesJson = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (notesJson) {
      const notes = JSON.parse(notesJson);
      const updatedNotes = notes.map((note: any) => {
        const shouldUpdate = note.systemIds && Array.isArray(note.systemIds) && note.systemIds.includes(systemId);

        if (shouldUpdate) {
          // Remove this systemId from the note
          const systemIds = note.systemIds.filter((id: string) => id !== systemId);
          // Also remove folderId if the folder belonged to this system (folder will be deleted)
          return { ...note, systemIds, folderId: undefined };
        }
        return note;
      });
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes));
    }

    console.log(`✅ System ${systemId} deactivated, folders deleted, and notes unassigned (web)`);
  }

  async createFolderWithSystem(name: string, icon: string, systemId: string | null, parentFolderId: string | null = null): Promise<string> {
    const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newFolder: Folder = {
      id,
      name,
      icon,
      systemId: systemId || undefined,
      parentFolderId: parentFolderId || undefined,
      isAutoGenerated: false,
      createdAt: new Date(),
    };

    const foldersJson = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    const folders: Folder[] = foldersJson ? JSON.parse(foldersJson) : [];

    folders.push(newFolder);
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));

    return id;
  }

  async getFoldersBySystem(systemId: string): Promise<any[]> {
    const folders = await this.getAllFolders();
    return folders.filter(folder => folder.systemId === systemId);
  }

  async getAllFoldersBySystemIncludingInactive(systemId: string): Promise<any[]> {
    // Same as getFoldersBySystem for web (no active/inactive distinction)
    return this.getFoldersBySystem(systemId);
  }

  async getNotesBySystem(systemId: string): Promise<any[]> {
    const notes = await this.getAllNotes();
    return notes.filter((note: any) => {
      const systemIds = note.systemIds || [];
      return systemIds.includes(systemId);
    });
  }

  async addSystemToNote(noteId: string, systemId: string): Promise<void> {
    const notes = await this.getAllNotes();
    const note = notes.find(n => n.id === noteId);

    if (!note) throw new Error('Note not found');

    const systemIds = note.systemIds || [];
    if (!systemIds.includes(systemId)) {
      systemIds.push(systemId);
      await this.updateNote(noteId, { systemIds });
    }
  }

  async removeSystemFromNote(noteId: string, systemId: string): Promise<void> {
    const notes = await this.getAllNotes();
    const note = notes.find(n => n.id === noteId);

    if (!note) throw new Error('Note not found');

    const systemIds = (note.systemIds || []).filter(id => id !== systemId);
    await this.updateNote(noteId, { systemIds });
  }
}

export const webDb = new WebDatabaseService();
