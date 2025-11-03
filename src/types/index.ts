// ============================================
// NOTED - TypeScript Type Definitions
// ============================================

export enum UrgencyLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum PipelineStage {
  CAPTURE = 'capture',   // 💭 Ideas inbox
  DEVELOP = 'develop',   // 🌱 Research/planning
  BUILD = 'build',       // 🔨 Active work
  EXECUTE = 'execute',   // 🚀 In progress
  COMPLETE = 'complete', // ✅ Done
}

export enum SaveMode {
  LINK_ONLY = 'link_only',
  READER_MODE = 'reader_mode',
  FULL_SNAPSHOT = 'full_snapshot',
}

export enum LinkType {
  ARTICLE = 'article',
  VIDEO = 'video',
  TWEET = 'tweet',
  PDF = 'pdf',
  IMAGE = 'image',
  OTHER = 'other',
}

export enum TemplateRecurrence {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum NoteFormat {
  NOTE = 'note',         // 📝 Regular note
  TASK = 'task',         // ✅ Task with checkboxes
  PROJECT = 'project',   // 🚀 Project (future: timeline/milestones)
  GOAL = 'goal',         // 👑 Goal (future: progress tracker)
  JOURNAL = 'journal',   // 📔 Journal (future: date-based)
  LIBRARY = 'library',   // 📚 Library (future: reading list)
  IDEAS = 'ideas',       // 🔥 Ideas brainstorm list
}

// Format emoji mapping
export const FORMAT_EMOJIS: Record<NoteFormat, string> = {
  [NoteFormat.NOTE]: '📝',
  [NoteFormat.TASK]: '✅',
  [NoteFormat.PROJECT]: '🚀',
  [NoteFormat.GOAL]: '👑',
  [NoteFormat.JOURNAL]: '📔',
  [NoteFormat.LIBRARY]: '📚',
  [NoteFormat.IDEAS]: '🔥',
};

// 28 Predefined emojis for note customization
export const PREDEFINED_EMOJIS = [
  '📝', '✅', '🚀', '👑', '📔', '📚', '🔥',
  '💡', '🎯', '📋', '🗂️', '📌', '🔖', '💼',
  '🏠', '💪', '🎨', '🎵', '🍎', '✈️', '💰',
  '🧠', '❤️', '⚡', '🌟', '🎓', '🔬', '⚙️',
];

// Emoji labels for better UX
export const EMOJI_LABELS: Record<string, string> = {
  '📝': 'Note',
  '✅': 'Task',
  '🚀': 'Project',
  '👑': 'Goal',
  '📔': 'Journal',
  '📚': 'Library',
  '🔥': 'Ideas',
  '💡': 'Idea',
  '🎯': 'Target',
  '📋': 'List',
  '🗂️': 'Folder',
  '📌': 'Pin',
  '🔖': 'Bookmark',
  '💼': 'Work',
  '🏠': 'Home',
  '💪': 'Fitness',
  '🎨': 'Creative',
  '🎵': 'Music',
  '🍎': 'Health',
  '✈️': 'Travel',
  '💰': 'Finance',
  '🧠': 'Learning',
  '❤️': 'Personal',
  '⚡': 'Urgent',
  '🌟': 'Important',
  '🎓': 'Study',
  '🔬': 'Research',
  '⚙️': 'System',
};

// ============================================
// Core Data Models
// ============================================

export interface Note {
  id: string;
  title: string;
  createdAt: Date;
  lastModified: Date;

  // Format
  noteFormat: NoteFormat; // Determines how note is displayed/behaves

  // Customization
  selectedEmoji?: string; // Custom emoji for note (28 predefined options)
  systemTemplate?: string; // Template used (e.g., 'gtd', 'para', 'kanban')

  // Hierarchy
  parentNoteId?: string; // Parent note in hierarchy
  childNoteIds: string[]; // Child notes

  // Organization
  folderId?: string;
  hashtags: string[];
  linkedNoteIds: string[]; // [[linked notes]]
  systemIds?: string[]; // System tags for filtering (e.g., ['planner', 'misc'])

  // Priority
  urgency: UrgencyLevel;
  importance: number; // 0-5 stars

  // Pipeline
  pipelineStage?: PipelineStage;
  progressPercentage: number; // 0-100
  pipelineGroupId?: string; // Links notes in same project

  // Content
  entries: Entry[];
  tasks: Task[];

  // Stats
  totalDeepWorkTime: number; // milliseconds
  deepWorkSessionCount: number;
}

export type ContentBlock = {
  id: string;
  type: 'text' | 'format';
  content: string;
  formatType?: NoteFormat;

  // Hierarchy for format blocks
  parentBlockId?: string;
  childBlockIds?: string[];
};

export interface Entry {
  id: string;
  timestamp: Date; // When created
  content: string; // Rich text (could be markdown or HTML)

  // Entry naming
  entryName?: string; // User-defined name for entry (acts as folder/file name)

  // Format - NEW: Entry-level formatting
  entryFormats: NoteFormat[]; // Can have multiple formats (e.g., [NOTE, TASK, GOAL])
  formatData?: EntryFormatData; // Data for each format type

  // New flexible content blocks (Phase 2)
  contentBlocks?: ContentBlock[]; // Optional for backward compatibility

  // Hierarchy for entries
  parentEntryId?: string; // Parent entry (for folder-like structure)
  childEntryIds: string[]; // Child entries (sub-entries)

  // Context
  location?: Location;
  mood?: Mood;
  isDeepWorkSession: boolean;
  deepWorkSessionId?: string;

  // Edit tracking
  isEdited: boolean;
  editedAt?: Date; // When last edited (simple timestamp)
  editHistory: EditVersion[]; // Full history (Phase 2)

  // Embedded content
  embeddedLinks: SavedLink[];
  imageUrls: string[];
}

// Data structure for each format type within an entry
export interface EntryFormatData {
  tasks?: Task[]; // For TASK format
  projectMilestones?: ProjectMilestone[]; // For PROJECT format (legacy)
  projectPipeline?: ProjectPipeline; // For PROJECT format (new pipeline system)
  goalProgress?: GoalData; // For GOAL format
  journalMood?: Mood; // For JOURNAL format
  libraryLinks?: SavedLink[]; // For LIBRARY format
  ideas?: string[]; // For IDEAS format
}

// New types for format-specific data
export interface ProjectMilestone {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Date;
  dueDate?: Date;
}

export interface ProjectPipeline {
  currentStage: PipelineStage;
  projectName?: string;
  notes?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface GoalData {
  description: string;
  progress: number; // 0-100
  target?: string;
  deadline?: Date;
}

export interface EditVersion {
  originalContent: string;
  editedAt: Date;
  editReason: 'typo' | 'major_edit';
  isDeletedByUser: boolean; // User can remove from history
}

export interface SavedLink {
  id: string;
  url: string;
  title: string;
  description?: string;
  previewImageUrl?: string;

  // Content
  saveMode: SaveMode;
  readerModeContent?: string; // Clean text
  highlights: Highlight[];
  userNotes?: string;

  // Organization
  hashtags: string[]; // Inherits from note + auto-detected
  domain: string; // For grouping by source
  savedAt: Date;

  // Status
  isFavorite: boolean;
  isRead: boolean;
  isArchived: boolean;

  // Media
  type: LinkType;
  videoDuration?: number; // seconds
  readTimeMinutes?: number;
}

export interface Highlight {
  id: string;
  text: string;
  color: string; // yellow, green, pink, etc.
  createdAt: Date;
  annotation?: string; // User's note on highlight
}

export interface Folder {
  id: string;
  name: string;
  parentFolderId?: string; // For subfolders
  systemId?: string; // System this folder belongs to (e.g., 'planner', 'para')
  colorHex?: string;
  icon?: string;
  isAutoGenerated: boolean; // From hashtag
  createdAt: Date;
}

export interface PipelineGroup {
  id: string;
  name: string;
  noteIds: string[]; // All notes in this pipeline
  currentStage: PipelineStage;
  overallProgress: number; // Calculated from all notes
  totalDeepWorkTime: number; // milliseconds
  createdAt: Date;
  completedAt?: Date;
}

export interface Mood {
  emoji: string; // 😊, 😔, 😡, etc.
  colorHex?: string;
  label?: string;
}

export interface Location {
  name: string; // "Coffee Shop", "Home", etc.
  latitude?: number;
  longitude?: number;
  isUserNamed: boolean; // vs auto-detected
}

export interface TaskStep {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
}

export interface Task {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;

  // Steps (sub-tasks)
  steps: TaskStep[];
}

export interface StandaloneTask {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  lastEditedAt?: Date;

  // Priority (like notes)
  urgency: UrgencyLevel;
  importance: number; // 0-5 stars

  // Organization
  hashtags: string[];

  // Due date & reminders
  dueDate?: Date;
  reminderTime?: Date;
  notificationEnabled: boolean;

  // Steps (sub-tasks)
  steps: TaskStep[];
}

export interface DeepWorkSession {
  id: string;
  noteId?: string;
  pipelineGroupId?: string;
  startTime: Date;
  endTime?: Date;
  plannedDuration: number; // milliseconds
  actualDuration: number; // milliseconds
  focusDescription?: string; // "Writing chapter 3"
  wasCompleted: boolean;
  accomplishment?: string; // What was done
}

export interface Template {
  id: string;
  name: string;
  structure: string; // Predefined sections
  recurrence: TemplateRecurrence;
  reminderSettings?: ReminderSettings;
}

export interface ReminderSettings {
  time: string; // "09:00" format
  daysOfWeek: number[]; // 0-6 for Sun-Sat
  isEnabled: boolean;
}

// ============================================
// UI State Types
// ============================================

export interface TimelineNavigatorEntry {
  entryId: string;
  timestamp: Date;
  preview: string; // First line of entry
  isCurrentPosition: boolean;
}

export interface SortOption {
  id: string;
  label: string;
  field: keyof Note;
  direction: 'asc' | 'desc';
}

export interface FilterOption {
  urgency?: UrgencyLevel[];
  importance?: number[]; // Array of star ratings
  pipelineStage?: PipelineStage[];
  hasDeepWork?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
