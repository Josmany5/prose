/* eslint-disable @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any,@typescript-eslint/no-empty-function */
// @ts-nocheck
// @ts-ignore
import * as SQLite from 'expo-sqlite';
import type {
  Note,
  Entry,
  Folder,
  SavedLink,
  PipelineGroup,
  DeepWorkSession,
  Template,
  StandaloneTask,
} from '../types';
import { UrgencyLevel } from '../types';

const DB_NAME = 'noted.db';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;

  // ============================================
  // Initialize Database
  // ============================================

  async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.initPromise) {
      this.initPromise = this.init();
    }

    await this.initPromise;
    this.isInitialized = true;
  }

  async init() {
    let dbOpened = false;
    let tablesCreated = false;
    let migrationsRun = false;

    try {
      console.log('📱 Opening database...');
      this.db = SQLite.openDatabaseSync(DB_NAME);
      dbOpened = true;
      console.log('✅ Database opened successfully');

      console.log('📝 Creating tables...');
      await this.createTables();
      tablesCreated = true;
      console.log('✅ Tables created successfully');

      console.log('🔄 Running migrations...');
      await this.migrateSchemas();
      migrationsRun = true;
      console.log('✅ Migrations completed successfully');

      console.log('✅ Database initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Database initialization failed:', error);

      // Log specific failure points for debugging
      if (!dbOpened) {
        console.error('❌ Failed to open database');
      } else if (!tablesCreated) {
        console.error('❌ Failed to create tables');
      } else if (!migrationsRun) {
        console.error('❌ Failed to run migrations');
      }

      throw error;
    }
  }

  // ============================================
  // Schema Migration
  // ============================================

  private async migrateSchemas() {
    console.log('🔍 Checking existing schema...');

    if (!this.db) throw new Error('Database not initialized');

    try {
      // MIGRATE FOLDERS TABLE
      let folderColumns: { name: string; type: string }[] = [];
      try {
        const result = this.db.getAllSync('PRAGMA table_info(folders)');
        folderColumns = result as { name: string; type: string }[];

        if (folderColumns.length > 0) {
          // Check if systemId column exists
          const hasSystemId = folderColumns.some(col => col.name === 'systemId');
          if (!hasSystemId) {
            console.log('📝 Adding systemId column to folders table...');
            this.db.execSync('ALTER TABLE folders ADD COLUMN systemId TEXT');
            console.log('✅ Added systemId column to folders table');
          }

          // Check if updatedAt column exists
          const hasUpdatedAt = folderColumns.some(col => col.name === 'updatedAt');
          if (!hasUpdatedAt) {
            console.log('📝 Adding updatedAt column to folders table...');
            this.db.execSync('ALTER TABLE folders ADD COLUMN updatedAt INTEGER NOT NULL DEFAULT 0');
            console.log('✅ Added updatedAt column to folders table');
          }

          // Check if isActive column exists
          const hasIsActive = folderColumns.some(col => col.name === 'isActive');
          if (!hasIsActive) {
            console.log('📝 Adding isActive column to folders table...');
            this.db.execSync('ALTER TABLE folders ADD COLUMN isActive INTEGER DEFAULT 1');
            console.log('✅ Added isActive column to folders table');
          }
        }
      } catch (error) {
        console.log('📝 Folders table does not exist yet - skipping folder migrations');
      }

      // MIGRATE NOTES TABLE
      let noteColumns: { name: string; type: string }[] = [];
      try {
        const result = this.db.getAllSync('PRAGMA table_info(notes)');
        noteColumns = result as { name: string; type: string }[];

        if (noteColumns.length > 0) {
          // Check if selectedEmoji column exists
          const hasSelectedEmoji = noteColumns.some(col => col.name === 'selectedEmoji');
          if (!hasSelectedEmoji) {
            console.log('📝 Adding selectedEmoji column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN selectedEmoji TEXT');
            console.log('✅ Added selectedEmoji column to notes table');
          }

          // Check if noteFormat column exists
          const hasNoteFormat = noteColumns.some(col => col.name === 'noteFormat');
          if (!hasNoteFormat) {
            console.log('📝 Adding noteFormat column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN noteFormat TEXT DEFAULT \'NOTE\'');
            console.log('✅ Added noteFormat column to notes table');
          }

          // Check if updatedAt column exists
          const hasUpdatedAt = noteColumns.some(col => col.name === 'updatedAt');
          if (!hasUpdatedAt) {
            console.log('📝 Adding updatedAt column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN updatedAt INTEGER NOT NULL DEFAULT 0');
            console.log('✅ Added updatedAt column to notes table');
          }

          // Check if systemTemplate column exists
          const hasSystemTemplate = noteColumns.some(col => col.name === 'systemTemplate');
          if (!hasSystemTemplate) {
            console.log('📝 Adding systemTemplate column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN systemTemplate TEXT');
            console.log('✅ Added systemTemplate column to notes table');
          }

          // Check if systemIds column exists
          const hasSystemIds = noteColumns.some(col => col.name === 'systemIds');
          if (!hasSystemIds) {
            console.log('📝 Adding systemIds column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN systemIds TEXT DEFAULT \'[]\'');
            console.log('✅ Added systemIds column to notes table');
          }

          // Check if parentNoteId column exists
          const hasParentNoteId = noteColumns.some(col => col.name === 'parentNoteId');
          if (!hasParentNoteId) {
            console.log('📝 Adding parentNoteId column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN parentNoteId TEXT');
            console.log('✅ Added parentNoteId column to notes table');
          }

          // Check if childNoteIds column exists
          const hasChildNoteIds = noteColumns.some(col => col.name === 'childNoteIds');
          if (!hasChildNoteIds) {
            console.log('📝 Adding childNoteIds column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN childNoteIds TEXT DEFAULT \'[]\'');
            console.log('✅ Added childNoteIds column to notes table');
          }

          // Check if pipelineStage column exists
          const hasPipelineStage = noteColumns.some(col => col.name === 'pipelineStage');
          if (!hasPipelineStage) {
            console.log('📝 Adding pipelineStage column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN pipelineStage TEXT');
            console.log('✅ Added pipelineStage column to notes table');
          }

          // Check if progressPercentage column exists
          const hasProgressPercentage = noteColumns.some(col => col.name === 'progressPercentage');
          if (!hasProgressPercentage) {
            console.log('📝 Adding progressPercentage column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN progressPercentage INTEGER DEFAULT 0');
            console.log('✅ Added progressPercentage column to notes table');
          }

          // Check if pipelineGroupId column exists
          const hasPipelineGroupId = noteColumns.some(col => col.name === 'pipelineGroupId');
          if (!hasPipelineGroupId) {
            console.log('📝 Adding pipelineGroupId column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN pipelineGroupId TEXT');
            console.log('✅ Added pipelineGroupId column to notes table');
          }

          // Check if totalDeepWorkTime column exists
          const hasTotalDeepWorkTime = noteColumns.some(col => col.name === 'totalDeepWorkTime');
          if (!hasTotalDeepWorkTime) {
            console.log('📝 Adding totalDeepWorkTime column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN totalDeepWorkTime INTEGER DEFAULT 0');
            console.log('✅ Added totalDeepWorkTime column to notes table');
          }

          // Check if deepWorkSessionCount column exists
          const hasDeepWorkSessionCount = noteColumns.some(col => col.name === 'deepWorkSessionCount');
          if (!hasDeepWorkSessionCount) {
            console.log('📝 Adding deepWorkSessionCount column to notes table...');
            this.db.execSync('ALTER TABLE notes ADD COLUMN deepWorkSessionCount INTEGER DEFAULT 0');
            console.log('✅ Added deepWorkSessionCount column to notes table');
          }
        }
      } catch (error) {
        console.log('📝 Notes table does not exist yet - skipping note migrations');
      }

      // MIGRATE ENTRIES TABLE
      let entryColumns: { name: string; type: string }[] = [];
      try {
        const result = this.db.getAllSync('PRAGMA table_info(entries)');
        entryColumns = result as { name: string; type: string }[];

        if (entryColumns.length > 0) {
          // Check if entryName column exists
          const hasEntryName = entryColumns.some(col => col.name === 'entryName');
          if (!hasEntryName) {
            console.log('📝 Adding entryName column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN entryName TEXT');
            console.log('✅ Added entryName column to entries table');
          }

          // Check if parentEntryId column exists
          const hasParentEntryId = entryColumns.some(col => col.name === 'parentEntryId');
          if (!hasParentEntryId) {
            console.log('📝 Adding parentEntryId column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN parentEntryId TEXT');
            console.log('✅ Added parentEntryId column to entries table');
          }

          // Check if childEntryIds column exists
          const hasChildEntryIds = entryColumns.some(col => col.name === 'childEntryIds');
          if (!hasChildEntryIds) {
            console.log('📝 Adding childEntryIds column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN childEntryIds TEXT DEFAULT \'[]\'');
            console.log('✅ Added childEntryIds column to entries table');
          }

          // Check if editedAt column exists
          const hasEditedAt = entryColumns.some(col => col.name === 'editedAt');
          if (!hasEditedAt) {
            console.log('📝 Adding editedAt column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN editedAt INTEGER');
            console.log('✅ Added editedAt column to entries table');
          }

          // Check if location column exists
          const hasLocation = entryColumns.some(col => col.name === 'location');
          if (!hasLocation) {
            console.log('📝 Adding location column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN location TEXT');
            console.log('✅ Added location column to entries table');
          }

          // Check if mood column exists
          const hasMood = entryColumns.some(col => col.name === 'mood');
          if (!hasMood) {
            console.log('📝 Adding mood column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN mood TEXT');
            console.log('✅ Added mood column to entries table');
          }

          // Check if isDeepWorkSession column exists
          const hasIsDeepWorkSession = entryColumns.some(col => col.name === 'isDeepWorkSession');
          if (!hasIsDeepWorkSession) {
            console.log('📝 Adding isDeepWorkSession column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN isDeepWorkSession INTEGER DEFAULT 0');
            console.log('✅ Added isDeepWorkSession column to entries table');
          }

          // Check if deepWorkSessionId column exists
          const hasDeepWorkSessionId = entryColumns.some(col => col.name === 'deepWorkSessionId');
          if (!hasDeepWorkSessionId) {
            console.log('📝 Adding deepWorkSessionId column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN deepWorkSessionId TEXT');
            console.log('✅ Added deepWorkSessionId column to entries table');
          }

          // Check if isEdited column exists
          const hasIsEdited = entryColumns.some(col => col.name === 'isEdited');
          if (!hasIsEdited) {
            console.log('📝 Adding isEdited column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN isEdited INTEGER DEFAULT 0');
            console.log('✅ Added isEdited column to entries table');
          }

          // Check if editHistory column exists
          const hasEditHistory = entryColumns.some(col => col.name === 'editHistory');
          if (!hasEditHistory) {
            console.log('📝 Adding editHistory column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN editHistory TEXT');
            console.log('✅ Added editHistory column to entries table');
          }

          // Check if embeddedLinks column exists
          const hasEmbeddedLinks = entryColumns.some(col => col.name === 'embeddedLinks');
          if (!hasEmbeddedLinks) {
            console.log('📝 Adding embeddedLinks column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN embeddedLinks TEXT');
            console.log('✅ Added embeddedLinks column to entries table');
          }

          // Check if imageUrls column exists
          const hasImageUrls = entryColumns.some(col => col.name === 'imageUrls');
          if (!hasImageUrls) {
            console.log('📝 Adding imageUrls column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN imageUrls TEXT');
            console.log('✅ Added imageUrls column to entries table');
          }

          // Check if contentBlocks column exists
          const hasContentBlocks = entryColumns.some(col => col.name === 'contentBlocks');
          if (!hasContentBlocks) {
            console.log('📝 Adding contentBlocks column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN contentBlocks TEXT');
            console.log('✅ Added contentBlocks column to entries table');
          }

          // Check if entryFormats column exists
          const hasEntryFormats = entryColumns.some(col => col.name === 'entryFormats');
          if (!hasEntryFormats) {
            console.log('📝 Adding entryFormats column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN entryFormats TEXT DEFAULT \'["NOTE"]\'');
            console.log('✅ Added entryFormats column to entries table');
          }

          // Check if formatData column exists
          const hasFormatData = entryColumns.some(col => col.name === 'formatData');
          if (!hasFormatData) {
            console.log('📝 Adding formatData column to entries table...');
            this.db.execSync('ALTER TABLE entries ADD COLUMN formatData TEXT DEFAULT \'{}\'');
            console.log('✅ Added formatData column to entries table');
          }
        }
      } catch (error) {
        console.log('📝 Entries table does not exist yet - skipping entry migrations');
      }

      console.log('✅ Schema migrations complete');

    } catch (error) {
      console.error('❌ Migration error:', error);
      throw new Error(`Schema migration failed: ${error}`);
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Use execSync for table creation (simpler and works with new API)
      this.db.execSync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          lastModified INTEGER NOT NULL,
          selectedEmoji TEXT,
          systemTemplate TEXT,
          systemIds TEXT DEFAULT '[]',
          parentNoteId TEXT,
          childNoteIds TEXT DEFAULT '[]',
          folderId TEXT,
          hashtags TEXT,
          linkedNoteIds TEXT,
          urgency TEXT DEFAULT 'none',
          importance INTEGER DEFAULT 0,
          pipelineStage TEXT,
          progressPercentage INTEGER DEFAULT 0,
          pipelineGroupId TEXT,
          totalDeepWorkTime INTEGER DEFAULT 0,
          deepWorkSessionCount INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY,
          noteId TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          content TEXT NOT NULL,
          entryName TEXT,
          parentEntryId TEXT,
          childEntryIds TEXT DEFAULT '[]',
          editedAt INTEGER,
          location TEXT,
          mood TEXT,
          isDeepWorkSession INTEGER DEFAULT 0,
          deepWorkSessionId TEXT,
          isEdited INTEGER DEFAULT 0,
          editHistory TEXT,
          embeddedLinks TEXT,
          imageUrls TEXT,
          contentBlocks TEXT,
          entryFormats TEXT DEFAULT '["NOTE"]',
          formatData TEXT DEFAULT '{}',
          FOREIGN KEY (noteId) REFERENCES notes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS folders (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          systemId TEXT,
          parentFolderId TEXT,
          colorHex TEXT,
          icon TEXT,
          isAutoGenerated INTEGER DEFAULT 0,
          createdAt INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS savedLinks (
          id TEXT PRIMARY KEY,
          entryId TEXT NOT NULL,
          url TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          previewImageUrl TEXT,
          saveMode TEXT DEFAULT 'link_only',
          readerModeContent TEXT,
          highlights TEXT,
          userNotes TEXT,
          hashtags TEXT,
          domain TEXT,
          savedAt INTEGER NOT NULL,
          isFavorite INTEGER DEFAULT 0,
          isRead INTEGER DEFAULT 0,
          isArchived INTEGER DEFAULT 0,
          type TEXT DEFAULT 'other',
          videoDuration INTEGER,
          readTimeMinutes INTEGER,
          FOREIGN KEY (entryId) REFERENCES entries(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS pipelineGroups (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          noteIds TEXT,
          currentStage TEXT,
          overallProgress INTEGER DEFAULT 0,
          totalDeepWorkTime INTEGER DEFAULT 0,
          createdAt INTEGER NOT NULL,
          completedAt INTEGER
        );

        CREATE TABLE IF NOT EXISTS deepWorkSessions (
          id TEXT PRIMARY KEY,
          noteId TEXT,
          pipelineGroupId TEXT,
          startTime INTEGER NOT NULL,
          endTime INTEGER,
          plannedDuration INTEGER NOT NULL,
          actualDuration INTEGER DEFAULT 0,
          focusDescription TEXT,
          wasCompleted INTEGER DEFAULT 0,
          accomplishment TEXT
        );

        CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          structure TEXT NOT NULL,
          recurrence TEXT DEFAULT 'none',
          reminderSettings TEXT
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          noteId TEXT NOT NULL,
          description TEXT NOT NULL,
          isCompleted INTEGER DEFAULT 0,
          completedAt INTEGER,
          createdAt INTEGER NOT NULL,
          FOREIGN KEY (noteId) REFERENCES notes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS taskSteps (
          id TEXT PRIMARY KEY,
          taskId TEXT NOT NULL,
          description TEXT NOT NULL,
          isCompleted INTEGER DEFAULT 0,
          completedAt INTEGER,
          createdAt INTEGER NOT NULL,
          FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS standaloneTasks (
          id TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          isCompleted INTEGER DEFAULT 0,
          completedAt INTEGER,
          createdAt INTEGER NOT NULL,
          lastEditedAt INTEGER,
          urgency TEXT DEFAULT 'none',
          importance INTEGER DEFAULT 0,
          hashtags TEXT,
          dueDate INTEGER,
          reminderTime INTEGER,
          notificationEnabled INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS standaloneTaskSteps (
          id TEXT PRIMARY KEY,
          taskId TEXT NOT NULL,
          description TEXT NOT NULL,
          isCompleted INTEGER DEFAULT 0,
          completedAt INTEGER,
          createdAt INTEGER NOT NULL,
          FOREIGN KEY (taskId) REFERENCES standaloneTasks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS systems (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          isActive INTEGER DEFAULT 0,
          activatedAt INTEGER,
          config TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_notes_lastModified ON notes(lastModified);
        CREATE INDEX IF NOT EXISTS idx_notes_urgency ON notes(urgency);
        CREATE INDEX IF NOT EXISTS idx_notes_importance ON notes(importance);
        CREATE INDEX IF NOT EXISTS idx_entries_noteId ON entries(noteId);
        CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp);
      `);

      console.log('✅ Tables created successfully');
    } catch (error) {
      console.error('❌ Table creation failed:', error);
      throw error;
    }
  }

  // ============================================
  // NOTES CRUD Operations
  // ============================================

  async createNote(note: Omit<Note, 'id' | 'entries' | 'tasks'>): Promise<string> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.db.runSync(
        `INSERT INTO notes (
          id, title, createdAt, lastModified, selectedEmoji, noteFormat, systemTemplate, systemIds,
          parentNoteId, childNoteIds, folderId, hashtags, linkedNoteIds,
          urgency, importance, pipelineStage, progressPercentage, pipelineGroupId,
          totalDeepWorkTime, deepWorkSessionCount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          note.title,
          note.createdAt.getTime(),
          note.lastModified.getTime(),
          note.selectedEmoji || null,
          (note as any).noteFormat || 'NOTE',
          note.systemTemplate || null,
          JSON.stringify((note as any).systemIds || []),
          note.parentNoteId || null,
          JSON.stringify(note.childNoteIds || []),
          note.folderId || null,
          JSON.stringify(note.hashtags),
          JSON.stringify(note.linkedNoteIds),
          note.urgency,
          note.importance,
          note.pipelineStage || null,
          note.progressPercentage,
          note.pipelineGroupId || null,
          note.totalDeepWorkTime,
          note.deepWorkSessionCount,
        ]
      );
      return id;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  async getAllNotes(): Promise<Note[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const notes: Note[] = [];
      const result = this.db.getAllSync('SELECT * FROM notes ORDER BY lastModified DESC');

      for (const row of result as Array<{
        id: string;
        title: string;
        createdAt: number;
        lastModified: number;
        selectedEmoji: string | null;
        noteFormat: string | null;
        systemTemplate: string | null;
        systemIds: string | null;
        parentNoteId: string | null;
        childNoteIds: string;
        folderId: string | null;
        hashtags: string;
        linkedNoteIds: string;
        urgency: string;
        importance: number;
        pipelineStage: string | null;
        progressPercentage: number;
        pipelineGroupId: string | null;
        totalDeepWorkTime: number;
        deepWorkSessionCount: number;
      }>) {
        const entries = await this.getEntriesByNoteId(row.id);
        const tasks = await this.getTasksByNoteId(row.id);

        notes.push({
          id: row.id,
          title: row.title,
          createdAt: new Date(row.createdAt),
          lastModified: new Date(row.lastModified),
          selectedEmoji: row.selectedEmoji || undefined,
          noteFormat: (row.noteFormat as any) || 'NOTE',
          systemTemplate: row.systemTemplate || undefined,
          systemIds: JSON.parse(row.systemIds || '[]'),
          parentNoteId: row.parentNoteId || undefined,
          childNoteIds: JSON.parse(row.childNoteIds || '[]'),
          folderId: row.folderId,
          hashtags: JSON.parse(row.hashtags || '[]'),
          linkedNoteIds: JSON.parse(row.linkedNoteIds || '[]'),
          urgency: row.urgency,
          importance: row.importance,
          pipelineStage: row.pipelineStage,
          progressPercentage: row.progressPercentage,
          pipelineGroupId: row.pipelineGroupId,
          entries,
          tasks,
          totalDeepWorkTime: row.totalDeepWorkTime,
          deepWorkSessionCount: row.deepWorkSessionCount,
        });
      }

      return notes;
    } catch (error) {
      console.error('Error getting all notes:', error);
      throw error;
    }
  }

  async getNoteById(id: string): Promise<Note | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = this.db.getAllSync('SELECT * FROM notes WHERE id = ?', [id]);

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0] as {
        id: string;
        title: string;
        createdAt: number;
        lastModified: number;
        selectedEmoji: string | null;
        noteFormat: string | null;
        systemTemplate: string | null;
        systemIds: string | null;
        parentNoteId: string | null;
        childNoteIds: string;
        folderId: string | null;
        hashtags: string;
        linkedNoteIds: string;
        urgency: string;
        importance: number;
        pipelineStage: string | null;
        progressPercentage: number;
        pipelineGroupId: string | null;
        totalDeepWorkTime: number;
        deepWorkSessionCount: number;
      };

      const entries = await this.getEntriesByNoteId(row.id);
      const tasks = await this.getTasksByNoteId(row.id);

      return {
        id: row.id,
        title: row.title,
        createdAt: new Date(row.createdAt),
        lastModified: new Date(row.lastModified),
        selectedEmoji: row.selectedEmoji || undefined,
        noteFormat: (row.noteFormat as any) || 'NOTE',
        systemTemplate: row.systemTemplate || undefined,
        systemIds: JSON.parse(row.systemIds || '[]'),
        parentNoteId: row.parentNoteId || undefined,
        childNoteIds: JSON.parse(row.childNoteIds || '[]'),
        folderId: row.folderId,
        hashtags: JSON.parse(row.hashtags || '[]'),
        linkedNoteIds: JSON.parse(row.linkedNoteIds || '[]'),
        urgency: row.urgency,
        importance: row.importance,
        pipelineStage: row.pipelineStage,
        progressPercentage: row.progressPercentage,
        pipelineGroupId: row.pipelineGroupId,
        entries,
        tasks,
        totalDeepWorkTime: row.totalDeepWorkTime,
        deepWorkSessionCount: row.deepWorkSessionCount,
      };
    } catch (error) {
      console.error('Error getting note by ID:', error);
      throw error;
    }
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.lastModified !== undefined) {
      fields.push('lastModified = ?');
      values.push(updates.lastModified.getTime());
    }
    if (updates.urgency !== undefined) {
      fields.push('urgency = ?');
      values.push(updates.urgency);
    }
    if (updates.importance !== undefined) {
      fields.push('importance = ?');
      values.push(updates.importance);
    }
    if (updates.pipelineStage !== undefined) {
      fields.push('pipelineStage = ?');
      values.push(updates.pipelineStage);
    }
    if (updates.progressPercentage !== undefined) {
      fields.push('progressPercentage = ?');
      values.push(updates.progressPercentage);
    }
    if (updates.hashtags !== undefined) {
      fields.push('hashtags = ?');
      values.push(JSON.stringify(updates.hashtags));
    }
    if (updates.linkedNoteIds !== undefined) {
      fields.push('linkedNoteIds = ?');
      values.push(JSON.stringify(updates.linkedNoteIds));
    }
    if (updates.folderId !== undefined) {
      fields.push('folderId = ?');
      values.push(updates.folderId);
    }
    if (updates.systemIds !== undefined) {
      fields.push('systemIds = ?');
      values.push(JSON.stringify(updates.systemIds));
    }
    if (updates.selectedEmoji !== undefined) {
      fields.push('selectedEmoji = ?');
      values.push(updates.selectedEmoji);
    }
    if (updates.noteFormat !== undefined) {
      fields.push('noteFormat = ?');
      values.push(updates.noteFormat);
    }

    if (fields.length === 0) {
      return; // No updates to make
    }

    values.push(id);

    try {
      this.db.runSync(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, values);
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.runSync('DELETE FROM notes WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  // ============================================
  // ENTRIES CRUD Operations
  // ============================================

  async createEntry(noteId: string, entry: Omit<Entry, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.db.runSync(
        `INSERT INTO entries (
          id, noteId, timestamp, content, entryName, parentEntryId, childEntryIds,
          entryFormats, formatData, contentBlocks, location, mood,
          isDeepWorkSession, deepWorkSessionId, isEdited, editHistory, editedAt,
          embeddedLinks, imageUrls
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          noteId,
          entry.timestamp.getTime(),
          entry.content,
          entry.entryName || null,
          entry.parentEntryId || null,
          JSON.stringify(entry.childEntryIds || []),
          JSON.stringify(entry.entryFormats || ['NOTE']),
          JSON.stringify(entry.formatData || {}),
          JSON.stringify(entry.contentBlocks || []),
          entry.location ? JSON.stringify(entry.location) : null,
          entry.mood ? JSON.stringify(entry.mood) : null,
          entry.isDeepWorkSession ? 1 : 0,
          entry.deepWorkSessionId || null,
          entry.isEdited ? 1 : 0,
          JSON.stringify(entry.editHistory || []),
          entry.editedAt ? entry.editedAt.getTime() : null,
          JSON.stringify(entry.embeddedLinks || []),
          JSON.stringify(entry.imageUrls || []),
        ]
      );
      return id;
    } catch (error) {
      console.error('Error creating entry:', error);
      throw error;
    }
  }

  async updateEntry(noteId: string, entryId: string, updates: Partial<Entry>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.entryFormats !== undefined) {
      fields.push('entryFormats = ?');
      values.push(JSON.stringify(updates.entryFormats));
    }
    if (updates.formatData !== undefined) {
      fields.push('formatData = ?');
      values.push(JSON.stringify(updates.formatData));
    }
    if (updates.contentBlocks !== undefined) {
      fields.push('contentBlocks = ?');
      values.push(JSON.stringify(updates.contentBlocks));
    }
    if (updates.editedAt !== undefined) {
      fields.push('editedAt = ?');
      values.push(updates.editedAt.getTime());
    }
    if (updates.isEdited !== undefined) {
      fields.push('isEdited = ?');
      values.push(updates.isEdited ? 1 : 0);
    }
    if (updates.location !== undefined) {
      fields.push('location = ?');
      values.push(updates.location ? JSON.stringify(updates.location) : null);
    }
    if (updates.mood !== undefined) {
      fields.push('mood = ?');
      values.push(updates.mood ? JSON.stringify(updates.mood) : null);
    }
    if (updates.isDeepWorkSession !== undefined) {
      fields.push('isDeepWorkSession = ?');
      values.push(updates.isDeepWorkSession ? 1 : 0);
    }
    if (updates.deepWorkSessionId !== undefined) {
      fields.push('deepWorkSessionId = ?');
      values.push(updates.deepWorkSessionId);
    }
    if (updates.editHistory !== undefined) {
      fields.push('editHistory = ?');
      values.push(JSON.stringify(updates.editHistory));
    }
    if (updates.embeddedLinks !== undefined) {
      fields.push('embeddedLinks = ?');
      values.push(JSON.stringify(updates.embeddedLinks));
    }
    if (updates.imageUrls !== undefined) {
      fields.push('imageUrls = ?');
      values.push(JSON.stringify(updates.imageUrls));
    }

    if (fields.length === 0) {
      return; // No updates to make
    }

    values.push(entryId, noteId);

    try {
      this.db.runSync(`UPDATE entries SET ${fields.join(', ')} WHERE id = ? AND noteId = ?`, values);
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  }

  async getEntriesByNoteId(noteId: string): Promise<Entry[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = this.db.getAllSync('SELECT * FROM entries WHERE noteId = ? ORDER BY timestamp ASC', [noteId]);
      const entries: Entry[] = [];

      for (const row of rows as Array<{
        id: string;
        timestamp: number;
        content: string;
        entryName: string | null;
        parentEntryId: string | null;
        childEntryIds: string;
        entryFormats: string;
        formatData: string;
        contentBlocks: string;
        editedAt: number | null;
        location: string | null;
        mood: string | null;
        isDeepWorkSession: number;
        deepWorkSessionId: string | null;
        isEdited: number;
        editHistory: string;
        embeddedLinks: string;
        imageUrls: string;
      }>) {
        entries.push({
          id: row.id,
          timestamp: new Date(row.timestamp),
          content: row.content,
          entryName: row.entryName || undefined,
          parentEntryId: row.parentEntryId || undefined,
          childEntryIds: JSON.parse(row.childEntryIds || '[]'),
          entryFormats: JSON.parse(row.entryFormats || '["NOTE"]'),
          formatData: JSON.parse(row.formatData || '{}'),
          contentBlocks: JSON.parse(row.contentBlocks || '[]'),
          editedAt: row.editedAt ? new Date(row.editedAt) : undefined,
          location: row.location ? JSON.parse(row.location) : undefined,
          mood: row.mood ? JSON.parse(row.mood) : undefined,
          isDeepWorkSession: row.isDeepWorkSession === 1,
          deepWorkSessionId: row.deepWorkSessionId,
          isEdited: row.isEdited === 1,
          editHistory: JSON.parse(row.editHistory || '[]'),
          embeddedLinks: JSON.parse(row.embeddedLinks || '[]'),
          imageUrls: JSON.parse(row.imageUrls || '[]'),
        });
      }

      return entries;
    } catch (error) {
      console.error('Error getting entries:', error);
      throw error;
    }
  }

  // ============================================
  // TASKS CRUD Operations
  // ============================================

  async createTask(noteId: string, description: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.db.runSync(
        'INSERT INTO tasks (id, noteId, description, isCompleted, createdAt) VALUES (?, ?, ?, 0, ?)',
        [id, noteId, description, Date.now()]
      );
      return id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async getTasksByNoteId(noteId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = this.db.getAllSync('SELECT * FROM tasks WHERE noteId = ?', [noteId]);
      const tasks = [];

      for (const row of rows as Array<{
        id: string;
        description: string;
        isCompleted: number;
        completedAt: number | null;
        createdAt: number;
      }>) {
        const steps = await this.getTaskSteps(row.id);
        tasks.push({
          id: row.id,
          description: row.description,
          isCompleted: row.isCompleted === 1,
          completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
          createdAt: new Date(row.createdAt),
          steps,
        });
      }

      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  async getTaskSteps(taskId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = this.db.getAllSync('SELECT * FROM taskSteps WHERE taskId = ? ORDER BY createdAt ASC', [taskId]);
      const steps = [];

      for (const row of rows as Array<{
        id: string;
        description: string;
        isCompleted: number;
        completedAt: number | null;
        createdAt: number;
      }>) {
        steps.push({
          id: row.id,
          description: row.description,
          isCompleted: row.isCompleted === 1,
          completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
          createdAt: new Date(row.createdAt),
        });
      }

      return steps;
    } catch (error) {
      console.error('Error getting task steps:', error);
      throw error;
    }
  }

  async toggleTask(taskId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = this.db.getAllSync('SELECT isCompleted FROM tasks WHERE id = ?', [taskId]);
      if (rows.length > 0) {
        const isCompleted = (rows[0] as { isCompleted: number }).isCompleted === 1;
        const newState = !isCompleted;
        const completedAt = newState ? Date.now() : null;

        this.db.runSync(
          'UPDATE tasks SET isCompleted = ?, completedAt = ? WHERE id = ?',
          [newState ? 1 : 0, completedAt, taskId]
        );
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      throw error;
    }
  }

  async addTaskStep(noteId: string, taskId: string, description: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.db.runSync(
        'INSERT INTO taskSteps (id, taskId, description, isCompleted, createdAt) VALUES (?, ?, ?, 0, ?)',
        [stepId, taskId, description, Date.now()]
      );
      return stepId;
    } catch (error) {
      console.error('Error adding task step:', error);
      throw error;
    }
  }

  async toggleTaskStep(taskId: string, stepId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Toggle the step
      const stepRows = this.db.getAllSync('SELECT isCompleted FROM taskSteps WHERE id = ?', [stepId]);
      if (stepRows.length > 0) {
        const isCompleted = (stepRows[0] as { isCompleted: number }).isCompleted === 1;
        const newState = !isCompleted;
        const completedAt = newState ? Date.now() : null;

        this.db.runSync(
          'UPDATE taskSteps SET isCompleted = ?, completedAt = ? WHERE id = ?',
          [newState ? 1 : 0, completedAt, stepId]
        );

        // Check if all steps are completed
        const allSteps = this.db.getAllSync('SELECT id, isCompleted FROM taskSteps WHERE taskId = ?', [taskId]) as Array<{ isCompleted: number }>;
        let allCompleted = allSteps.length > 0;
        for (const step of allSteps) {
          if (step.isCompleted === 0) {
            allCompleted = false;
            break;
          }
        }

        // Get current task state
        const taskRows = this.db.getAllSync('SELECT isCompleted FROM tasks WHERE id = ?', [taskId]);
        if (taskRows.length > 0) {
          const taskCompleted = (taskRows[0] as { isCompleted: number }).isCompleted === 1;

          // Auto-complete task if all steps are done
          if (allCompleted && !taskCompleted) {
            this.db.runSync(
              'UPDATE tasks SET isCompleted = 1, completedAt = ? WHERE id = ?',
              [Date.now(), taskId]
            );
          } else if (!allCompleted && taskCompleted) {
            // Un-complete task if not all steps are done
            this.db.runSync(
              'UPDATE tasks SET isCompleted = 0, completedAt = NULL WHERE id = ?',
              [taskId]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error toggling task step:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // First delete all steps
      this.db.runSync('DELETE FROM taskSteps WHERE taskId = ?', [taskId]);
      // Then delete the task
      this.db.runSync('DELETE FROM tasks WHERE id = ?', [taskId]);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // ============================================
  // FOLDERS CRUD Operations
  // ============================================

  async createFolder(name: string, isAutoGenerated: boolean = false): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.db.runSync(
        'INSERT INTO folders (id, name, icon, isAutoGenerated, createdAt, updatedAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, '📁', isAutoGenerated ? 1 : 0, Date.now(), Date.now(), 1]
      );
      return id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async getAllFolders(): Promise<Folder[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = this.db.getAllSync('SELECT * FROM folders WHERE isActive = 1 ORDER BY name ASC');
      const folders: Folder[] = [];

      for (const row of rows as Array<{
        id: string;
        name: string;
        parentFolderId: string | null;
        colorHex: string | null;
        icon: string | null;
        isAutoGenerated: number;
        createdAt: number;
      }>) {
        folders.push({
          id: row.id,
          name: row.name,
          parentFolderId: row.parentFolderId,
          colorHex: row.colorHex,
          icon: row.icon,
          isAutoGenerated: row.isAutoGenerated === 1,
          createdAt: new Date(row.createdAt),
        });
      }

      return folders;
    } catch (error) {
      console.error('Error getting folders:', error);
      throw error;
    }
  }

  async deleteFolder(folderId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.runSync('DELETE FROM folders WHERE id = ?', [folderId]);
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  async deleteEntry(noteId: string, entryId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.runSync('DELETE FROM entries WHERE id = ? AND noteId = ?', [entryId, noteId]);
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }

  // ============================================
  // STANDALONE TASKS Operations
  // ============================================

  async createStandaloneTask(description: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `standalone_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.db.runSync(
        `INSERT INTO standaloneTasks (
          id, description, isCompleted, createdAt, urgency, importance, hashtags, notificationEnabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, description, 0, Date.now(), UrgencyLevel.NONE, 0, JSON.stringify([]), 1]
      );
      return id;
    } catch (error) {
      console.error('Error creating standalone task:', error);
      throw error;
    }
  }

  async getAllStandaloneTasks(): Promise<StandaloneTask[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = this.db.getAllSync('SELECT * FROM standaloneTasks ORDER BY createdAt DESC');
      const tasks: StandaloneTask[] = [];

      for (const row of rows as Array<{
        id: string;
        description: string;
        isCompleted: number;
        completedAt: number | null;
        createdAt: number;
        lastEditedAt: number | null;
        urgency: string;
        importance: number;
        hashtags: string;
        dueDate: number | null;
        reminderTime: number | null;
        notificationEnabled: number;
      }>) {
        const steps = await this.getStandaloneTaskSteps(row.id);
        tasks.push({
          id: row.id,
          description: row.description,
          isCompleted: row.isCompleted === 1,
          completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
          createdAt: new Date(row.createdAt),
          lastEditedAt: row.lastEditedAt ? new Date(row.lastEditedAt) : undefined,
          urgency: row.urgency,
          importance: row.importance,
          hashtags: JSON.parse(row.hashtags || '[]'),
          dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
          reminderTime: row.reminderTime ? new Date(row.reminderTime) : undefined,
          notificationEnabled: row.notificationEnabled === 1,
          steps,
        });
      }

      return tasks;
    } catch (error) {
      console.error('Error getting standalone tasks:', error);
      throw error;
    }
  }

  async getStandaloneTaskSteps(taskId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = this.db.getAllSync('SELECT * FROM standaloneTaskSteps WHERE taskId = ? ORDER BY createdAt ASC', [taskId]);
      const steps = [];

      for (const row of rows as Array<{
        id: string;
        description: string;
        isCompleted: number;
        completedAt: number | null;
        createdAt: number;
      }>) {
        steps.push({
          id: row.id,
          description: row.description,
          isCompleted: row.isCompleted === 1,
          completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
          createdAt: new Date(row.createdAt),
        });
      }

      return steps;
    } catch (error) {
      console.error('Error getting standalone task steps:', error);
      throw error;
    }
  }

  async updateStandaloneTask(taskId: string, updates: Partial<StandaloneTask>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.urgency !== undefined) {
      fields.push('urgency = ?');
      values.push(updates.urgency);
    }
    if (updates.importance !== undefined) {
      fields.push('importance = ?');
      values.push(updates.importance);
    }
    if (updates.hashtags !== undefined) {
      fields.push('hashtags = ?');
      values.push(JSON.stringify(updates.hashtags));
    }

    if (fields.length === 0) {
      return; // No updates to make
    }

    values.push(taskId);

    try {
      this.db.runSync(`UPDATE standaloneTasks SET ${fields.join(', ')} WHERE id = ?`, values);
    } catch (error) {
      console.error('Error updating standalone task:', error);
      throw error;
    }
  }

  async toggleStandaloneTask(taskId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = this.db.getAllSync('SELECT isCompleted FROM standaloneTasks WHERE id = ?', [taskId]);
      if (rows.length > 0) {
        const isCompleted = (rows[0] as { isCompleted: number }).isCompleted === 1;
        const newState = !isCompleted;
        const completedAt = newState ? Date.now() : null;

        this.db.runSync(
          'UPDATE standaloneTasks SET isCompleted = ?, completedAt = ? WHERE id = ?',
          [newState ? 1 : 0, completedAt, taskId]
        );
      }
    } catch (error) {
      console.error('Error toggling standalone task:', error);
      throw error;
    }
  }

  async deleteStandaloneTask(taskId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.runSync('DELETE FROM standaloneTasks WHERE id = ?', [taskId]);
    } catch (error) {
      console.error('Error deleting standalone task:', error);
      throw error;
    }
  }

  async addStandaloneTaskStep(taskId: string, description: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.db.runSync(
        'INSERT INTO standaloneTaskSteps (id, taskId, description, isCompleted, createdAt) VALUES (?, ?, ?, 0, ?)',
        [stepId, taskId, description, Date.now()]
      );
      return stepId;
    } catch (error) {
      console.error('Error adding standalone task step:', error);
      throw error;
    }
  }

  async toggleStandaloneTaskStep(taskId: string, stepId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Toggle the step
      const stepRows = this.db.getAllSync('SELECT isCompleted FROM standaloneTaskSteps WHERE id = ?', [stepId]);
      if (stepRows.length > 0) {
        const isCompleted = (stepRows[0] as { isCompleted: number }).isCompleted === 1;
        const newState = !isCompleted;
        const completedAt = newState ? Date.now() : null;

        this.db.runSync(
          'UPDATE standaloneTaskSteps SET isCompleted = ?, completedAt = ? WHERE id = ?',
          [newState ? 1 : 0, completedAt, stepId]
        );

        // Check if all steps are completed
        const allSteps = this.db.getAllSync('SELECT id, isCompleted FROM standaloneTaskSteps WHERE taskId = ?', [taskId]) as Array<{ isCompleted: number }>;
        let allCompleted = allSteps.length > 0;
        for (const step of allSteps) {
          if (step.isCompleted === 0) {
            allCompleted = false;
            break;
          }
        }

        // Get current task state
        const taskRows = this.db.getAllSync('SELECT isCompleted FROM standaloneTasks WHERE id = ?', [taskId]);
        if (taskRows.length > 0) {
          const taskCompleted = (taskRows[0] as { isCompleted: number }).isCompleted === 1;

          // Auto-complete task if all steps are done
          if (allCompleted && !taskCompleted) {
            this.db.runSync(
              'UPDATE standaloneTasks SET isCompleted = 1, completedAt = ? WHERE id = ?',
              [Date.now(), taskId]
            );
          } else if (!allCompleted && taskCompleted) {
            // Un-complete task if not all steps are done
            this.db.runSync(
              'UPDATE standaloneTasks SET isCompleted = 0, completedAt = NULL WHERE id = ?',
              [taskId]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error toggling standalone task step:', error);
      throw error;
    }
  }

  async deleteStandaloneTaskStep(taskId: string, stepId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.runSync('DELETE FROM standaloneTaskSteps WHERE id = ?', [stepId]);
    } catch (error) {
      console.error('Error deleting standalone task step:', error);
      throw error;
    }
  }

  // ============================================
  // Systems Methods
  // ============================================

  async getActiveSystems(): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const systems = this.db.getAllSync('SELECT * FROM systems WHERE isActive = 1 ORDER BY activatedAt DESC');
      return systems || [];
    } catch (error) {
      console.error('Error getting active systems:', error);
      return [];
    }
  }

  async activateSystem(systemId: string, systemData: any): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Insert or update system as active
      this.db.runSync(
        `INSERT OR REPLACE INTO systems (id, name, type, isActive, activatedAt, config)
         VALUES (?, ?, ?, 1, ?, ?)`,
        [systemId, systemData.name, systemData.type, Date.now(), JSON.stringify({})]
      );

      // Restore all folders belonging to this system (mark as active)
      this.db.runSync('UPDATE folders SET isActive = 1 WHERE systemId = ?', [systemId]);

      console.log(`✅ Activated system ${systemId} and restored its folders`);
    } catch (error) {
      console.error('Error activating system:', error);
      throw error;
    }
  }

  async deactivateSystem(systemId: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Deactivate the system
      this.db.runSync('UPDATE systems SET isActive = 0 WHERE id = ?', [systemId]);

      // Mark all folders belonging to this system as inactive
      this.db.runSync('UPDATE folders SET isActive = 0 WHERE systemId = ?', [systemId]);

      console.log(`✅ Deactivated system ${systemId} and marked its folders as inactive`);
    } catch (error) {
      console.error('Error deactivating system:', error);
      throw error;
    }
  }

  async getFoldersBySystem(systemId: string): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const folders = this.db.getAllSync(
        'SELECT * FROM folders WHERE systemId = ? AND isActive = 1 ORDER BY name ASC',
        [systemId]
      );
      return folders || [];
    } catch (error) {
      console.error('Error getting folders by system:', error);
      return [];
    }
  }

  async getAllFoldersBySystemIncludingInactive(systemId: string): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const folders = this.db.getAllSync(
        'SELECT * FROM folders WHERE systemId = ? ORDER BY name ASC',
        [systemId]
      );
      return folders || [];
    } catch (error) {
      console.error('Error getting all folders by system:', error);
      return [];
    }
  }

  async getAllFolders(): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const folders = this.db.getAllSync('SELECT * FROM folders WHERE isActive = 1 ORDER BY systemId, name ASC');
      return folders || [];
    } catch (error) {
      console.error('Error getting all folders:', error);
      return [];
    }
  }

  async getFolderById(folderId: string): Promise<any | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const folders = this.db.getAllSync('SELECT * FROM folders WHERE id = ?', [folderId]);
      return folders && folders.length > 0 ? folders[0] : null;
    } catch (error) {
      console.error('Error getting folder by id:', error);
      return null;
    }
  }

  async createFolderWithSystem(name: string, icon: string, systemId: string | null, parentFolderId: string | null = null): Promise<string> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      this.db.runSync(
        `INSERT INTO folders (id, name, icon, systemId, parentFolderId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, icon, systemId, parentFolderId, now, now]
      );

      return id;
    } catch (error) {
      console.error('Error creating folder with system:', error);
      throw error;
    }
  }

  async getNotesBySystem(systemId: string): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const allNotes = this.db.getAllSync('SELECT * FROM notes ORDER BY updatedAt DESC');
      // Filter notes that have this systemId in their systemIds JSON array
      return (allNotes || []).filter((note: any) => {
        try {
          const systemIds = JSON.parse(note.systemIds || '[]');
          return systemIds.includes(systemId);
        } catch {
          return false;
        }
      });
    } catch (error) {
      console.error('Error getting notes by system:', error);
      return [];
    }
  }

  async addSystemToNote(noteId: string, systemId: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const notes = this.db.getAllSync('SELECT systemIds FROM notes WHERE id = ?', [noteId]);
      if (!notes || notes.length === 0) return;

      const currentSystemIds = JSON.parse(notes[0].systemIds || '[]');
      if (!currentSystemIds.includes(systemId)) {
        currentSystemIds.push(systemId);
        this.db.runSync(
          'UPDATE notes SET systemIds = ? WHERE id = ?',
          [JSON.stringify(currentSystemIds), noteId]
        );
      }
    } catch (error) {
      console.error('Error adding system to note:', error);
      throw error;
    }
  }

  async removeSystemFromNote(noteId: string, systemId: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const notes = this.db.getAllSync('SELECT systemIds FROM notes WHERE id = ?', [noteId]);
      if (!notes || notes.length === 0) return;

      const currentSystemIds = JSON.parse(notes[0].systemIds || '[]');
      const filtered = currentSystemIds.filter((id: string) => id !== systemId);

      this.db.runSync(
        'UPDATE notes SET systemIds = ? WHERE id = ?',
        [JSON.stringify(filtered), noteId]
      );
    } catch (error) {
      console.error('Error removing system from note:', error);
      throw error;
    }
  }

  async getNotesByFolder(folderId: string): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const notes = this.db.getAllSync(
        'SELECT * FROM notes WHERE folderId = ? ORDER BY updatedAt DESC',
        [folderId]
      );
      return notes || [];
    } catch (error) {
      console.error('Error getting notes by folder:', error);
      return [];
    }
  }

  async getSubFolders(parentFolderId: string): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const folders = this.db.getAllSync(
        'SELECT * FROM folders WHERE parentFolderId = ? AND isActive = 1 ORDER BY name ASC',
        [parentFolderId]
      );
      return folders || [];
    } catch (error) {
      console.error('Error getting subfolders:', error);
      return [];
    }
  }
}

export const db = new DatabaseService();
