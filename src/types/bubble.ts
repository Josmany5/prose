// ============================================
// PROSE - Bubble Type Definitions
// Enhanced for Unified Bubble System
// ============================================

export type BubbleType =
  | 'note'
  | 'task'
  | 'project'
  | 'goal'
  | 'journal'
  | 'library'
  | 'ideas'
  | 'document'
  | 'planner'
  | 'tracker'
  | 'meeting'
  | 'workout'  // NEW: Exercise logs
  | 'budget';  // NEW: Financial tracking

export type ConnectionType =
  | 'inspired_by'
  | 'depends_on'
  | 'part_of'
  | 'related_to'
  | 'blocks'
  | 'references'
  | 'evolved_from'; // NEW: Track bubble transformations

export type Priority = 'low' | 'medium' | 'high';

export interface BubbleConnection {
  id: string;
  targetBubbleId: string;
  connectionType: ConnectionType;
  label?: string;
  strength?: number; // NEW: Visual thickness for connection lines (0-1)
}

export interface TaskStep {
  id: string;
  description: string;
  isCompleted: boolean;
  createdAt: Date;
}

export interface TaskData {
  isCompleted: boolean;
  dueDate?: Date;
  priority: Priority;
  steps: TaskStep[];
}

export interface Milestone {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: Date;
}

export interface ProjectData {
  progress: number; // 0-100
  milestones: Milestone[];
  teamMembers?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface GoalData {
  progress: number; // 0-100
  target: string;
  deadline?: Date;
  milestones: string[];
}

export interface JournalEntry {
  timestamp: Date;
  content: string;
  mood?: string;
}

export interface JournalData {
  entries: JournalEntry[];
  currentMood?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  url?: string;
  type: 'article' | 'book' | 'video' | 'podcast';
  isRead: boolean;
}

export interface LibraryData {
  items: LibraryItem[];
}

export interface IdeasData {
  ideas: string[];
}

export interface DocumentData {
  content: string; // Rich text HTML or Markdown
  wordCount: number;
  readingTimeMinutes: number;
}

export interface PlannerEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  isAllDay: boolean;
}

export interface PlannerData {
  events: PlannerEvent[];
}

export interface TrackerMetric {
  date: Date;
  value: number;
}

export interface TrackerData {
  metricName: string;
  unit: string;
  metrics: TrackerMetric[];
  goal?: number;
}

export interface MeetingData {
  attendees: string[];
  date: Date;
  duration: number; // minutes
  agenda?: string[];
  notes: string;
}

export interface NoteEntry {
  timestamp: Date;
  content: string;
}

export interface NoteData {
  entries: NoteEntry[];
}

// ============================================
// NEW: Additional Format Data Types
// ============================================

export interface BudgetData {
  transactions: {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    date: Date;
    description: string;
  }[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export interface WorkoutData {
  exercises: {
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    duration?: number; // minutes
    completed: boolean;
  }[];
  totalDuration: number;
  caloriesBurned?: number;
}

export interface TableData {
  columns: { id: string; name: string; type: string }[];
  rows: { id: string; cells: Record<string, any> }[];
}

export type BubbleTypeData =
  | TaskData
  | ProjectData
  | GoalData
  | JournalData
  | LibraryData
  | IdeasData
  | DocumentData
  | PlannerData
  | TrackerData
  | MeetingData
  | NoteData
  | BudgetData    // NEW
  | WorkoutData   // NEW
  | TableData;    // NEW

export interface Bubble {
  id: string;
  type: BubbleType;
  title: string;
  content: string; // Preview/summary

  // Visual
  emoji: string;
  color: string;
  position: { x: number; y: number };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tags: string[];

  // Type-specific data
  typeData: BubbleTypeData;

  // Connections & Hierarchy
  connections: BubbleConnection[];
  parentBubbleId?: string;
  childBubbleIds: string[];

  // ============================================
  // NEW: Enhanced Bubble System Fields
  // ============================================

  // Hierarchy metadata
  hierarchyType?: 'goal' | 'project' | 'task' | 'standalone';
  depth?: number; // 0=top-level, 1=project, 2=task, 3=subtask
  importance?: 1 | 2 | 3 | 4 | 5; // Star rating
  urgency?: 'none' | 'low' | 'medium' | 'high'; // Urgency level (matches notes system)

  // Multi-format entries
  entries?: BubbleEntry[];

  // Scheduling
  schedule?: BubbleSchedule;
  dueDate?: Date; // For tasks
  completedAt?: Date;

  // Organization
  systemId?: string; // GTD, PARA, Kanban, etc.
  timelineStage?: 'past' | 'present' | 'future';

  // Assignment & Collaboration
  assignedTo?: string[]; // User IDs

  // Media attachments
  attachments?: MediaAttachment[];
}

// Helper type for bubble creation
export interface CreateBubbleInput {
  type: BubbleType;
  title: string;
  content?: string;
  emoji?: string;
  tags?: string[];
}

// ============================================
// NEW: Multi-Format Entry System
// ============================================

export type EntryType =
  | 'text'      // Free text
  | 'task'      // Checklist with progress
  | 'goal'      // Goal with milestones
  | 'project'   // Project with steps
  | 'idea'      // Brainstorming
  | 'journal'   // Reflection + mood
  | 'link'      // URL bookmarks
  | 'budget'    // Income/expenses
  | 'workout'   // Exercise log
  | 'library'   // File attachments
  | 'table'     // Data tables
  | 'tracker';  // Metrics

export interface BubbleEntry {
  id: string;
  type: EntryType;
  content: string;
  position: number; // Order within bubble
  timestamp: Date;
  formatData?: any; // Type-specific data (TaskData, GoalData, etc.)
}

// ============================================
// NEW: Media Attachment System
// ============================================

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'link';

export interface MediaAttachment {
  id: string;
  type: MediaType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string; // Storage URL
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// ============================================
// NEW: Timeline/Blockchain System
// ============================================

export interface TimelineBlock {
  id: string;
  action: 'created' | 'edited' | 'connected' | 'shared' | 'completed' | 'evolved';
  bubbleId: string;
  changes: {
    before: Partial<Bubble>;
    after: Partial<Bubble>;
  };
  timestamp: Date;
  userId?: string; // For collaboration
}

// ============================================
// NEW: Scheduling System
// ============================================

export interface BubbleSchedule {
  id?: string;
  bubbleId?: string;
  startDate?: Date; // When the bubble is scheduled
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  notifications?: boolean; // Enable/disable notifications
  type?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  date?: Date; // For one-time
  time?: string; // HH:MM format
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  customPattern?: string; // Cron-like pattern
  reminderMinutesBefore?: number;
  createdAt?: Date;
  isActive?: boolean;
}

// ============================================
// NEW: Recurring Template System (Business Use Case)
// ============================================

export interface RecurringBubbleTemplate {
  id: string;
  templateBubbleId: string; // The master template

  // Recurrence settings
  schedule: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    time: string; // HH:MM
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
    customPattern?: string; // Cron-like
  };

  // Instance behavior
  instanceBehavior: 'persistent_template' | 'single_instance';

  // Automation triggers
  onComplete?: {
    emailTo?: string[]; // ["boss@company.com"]
    notifyUsers?: string[];
    webhook?: string;
    customAction?: string; // Function name to run
  };

  // Archiving
  archiveOnComplete: boolean;
  retentionDays?: number; // How long to keep archives

  // Assignment
  assignedTo?: string[]; // User IDs

  // Real-time tracking
  enableRealtimeUpdates: boolean; // Boss sees live progress
}

export interface BubbleInstance {
  id: string;
  templateId: string; // Links to template
  instanceDate: Date; // Which day this instance is for

  // Completion tracking
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string; // User ID

  // Content (copied from template)
  content: BubbleEntry[]; // Fresh copy each time

  // Status
  status: 'active' | 'completed' | 'archived' | 'overdue';

  // Triggers fired
  triggersFired: {
    type: string;
    firedAt: Date;
    success: boolean;
  }[];
}

// ============================================
// NEW: Organization System Templates
// ============================================

export type OrganizationSystem =
  | 'gtd'          // Getting Things Done
  | 'para'         // Projects, Areas, Resources, Archives
  | 'kanban'       // Visual workflow
  | 'zettelkasten' // Knowledge building
  | 'bullet'       // Bullet Journal
  | 'custom';      // User-defined

export interface SystemTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  bubbles: {
    title: string;
    recommendedType: BubbleType;
    allowCustomization: boolean;
    reasoning: string; // Why this type is recommended
    children?: SystemTemplate['bubbles'];
  }[];
}
