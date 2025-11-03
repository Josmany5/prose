// ============================================
// PROSE - Systems Registry
// Predefined productivity and organizational systems
// ============================================

export type SystemType = 'folder' | 'canvas' | 'matrix' | 'timeline' | 'table';
export type SystemCategory = 'management' | 'purpose' | 'analysis' | 'functional';

export interface FolderDefinition {
  name: string;
  icon: string;
  description?: string;
}

export interface FolderTemplate {
  folders: FolderDefinition[];
}

export interface CanvasZone {
  id: string;
  name: string;
  position: { x: number; y: number; width: number; height: number };
  color?: string;
}

export interface CanvasLayout {
  zones: CanvasZone[];
  type: 'circles' | 'wheel' | 'freeform';
}

export interface MatrixCell {
  id: string;
  label: string;
  position: { row: number; col: number };
  color?: string;
}

export interface MatrixConfig {
  rows: number;
  cols: number;
  cells: MatrixCell[];
}

export interface SystemDefinition {
  id: string;
  name: string;
  icon: string;
  category: SystemCategory;
  type: SystemType;
  description: string;
  learnMoreContent: string;
  templateStructure: FolderTemplate | CanvasLayout | MatrixConfig | any;
}

// ============================================
// Predefined Systems Library
// ============================================

export const SYSTEMS_REGISTRY: Record<string, SystemDefinition> = {
  // ============================================
  // MANAGEMENT SYSTEMS
  // ============================================

  para: {
    id: 'para',
    name: 'PARA',
    icon: '📂',
    category: 'management',
    type: 'folder',
    description: 'Organize by Projects, Areas, Resources, Archives',
    learnMoreContent: `The PARA Method is a universal system for organizing digital information.

**How it works:**
- **Projects:** Short-term efforts with deadlines (e.g., "Launch mobile app")
- **Areas:** Ongoing responsibilities (e.g., "Health", "Finance", "Career")
- **Resources:** Topics of interest and reference materials
- **Archives:** Inactive items from other categories

**Benefits:**
- Clear organization structure
- Easy to find information
- Separates active from inactive work
- Works for both work and personal life`,
    templateStructure: {
      folders: [
        { name: 'Projects', icon: '🚀', description: 'Short-term efforts with deadlines' },
        { name: 'Areas', icon: '🏠', description: 'Ongoing responsibilities' },
        { name: 'Resources', icon: '📚', description: 'Reference materials and topics of interest' },
        { name: 'Archives', icon: '📦', description: 'Completed or inactive items' },
      ]
    }
  },

  pala: {
    id: 'pala',
    name: 'PALA',
    icon: '🌱',
    category: 'management',
    type: 'folder',
    description: 'Life-focused variant: Projects, Areas, Life, Archives',
    learnMoreContent: `PALA is a life-focused adaptation of PARA, emphasizing personal growth.

**How it works:**
- **Projects:** Active initiatives with clear outcomes
- **Areas:** Key life responsibilities (career, health, relationships)
- **Life:** Personal development, aspirations, values
- **Archives:** Completed or paused items

**Best for:**
- Personal life organization
- Balancing work and life goals
- Long-term personal development`,
    templateStructure: {
      folders: [
        { name: 'Projects', icon: '🚀', description: 'Active initiatives' },
        { name: 'Areas', icon: '🏠', description: 'Life responsibilities' },
        { name: 'Life', icon: '🌱', description: 'Personal growth and aspirations' },
        { name: 'Archives', icon: '📦', description: 'Inactive items' },
      ]
    }
  },

  gtd: {
    id: 'gtd',
    name: 'GTD',
    icon: '⚡',
    category: 'management',
    type: 'folder',
    description: 'Getting Things Done - Capture, Process, Organize, Review',
    learnMoreContent: `GTD (Getting Things Done) is a proven productivity system by David Allen.

**The Five Steps:**
1. **Capture:** Collect everything that needs attention
2. **Clarify:** Process what it means
3. **Organize:** Put it where it belongs
4. **Reflect:** Review regularly
5. **Engage:** Get it done

**Folders:**
- **Inbox:** Unprocessed items
- **Next Actions:** Immediate actionable tasks
- **Waiting For:** Delegated or dependent tasks
- **Someday/Maybe:** Future possibilities
- **Reference:** Non-actionable information`,
    templateStructure: {
      folders: [
        { name: 'Inbox', icon: '📥', description: 'Unprocessed captures' },
        { name: 'Next Actions', icon: '⚡', description: 'Actionable tasks' },
        { name: 'Waiting For', icon: '⏳', description: 'Delegated or blocked' },
        { name: 'Someday/Maybe', icon: '💭', description: 'Future possibilities' },
        { name: 'Reference', icon: '📚', description: 'Non-actionable information' },
      ]
    }
  },

  zettelkasten: {
    id: 'zettelkasten',
    name: 'Zettelkasten',
    icon: '🗃️',
    category: 'management',
    type: 'folder',
    description: 'Slip-box method for connected knowledge building',
    learnMoreContent: `Zettelkasten (German for "slip box") is a knowledge management system.

**Core Principles:**
- Atomic notes (one idea per note)
- Link notes together
- Add unique identifiers
- Build a network of ideas

**Best for:**
- Research and writing
- Building connected knowledge
- Long-term learning`,
    templateStructure: {
      folders: [
        { name: 'Fleeting Notes', icon: '💭', description: 'Quick captures and ideas' },
        { name: 'Literature Notes', icon: '📖', description: 'Notes from reading' },
        { name: 'Permanent Notes', icon: '💎', description: 'Refined, atomic ideas' },
        { name: 'Index', icon: '🗂️', description: 'Entry points and maps of content' },
      ]
    }
  },

  johnny_decimal: {
    id: 'johnny_decimal',
    name: 'Johnny Decimal',
    icon: '🔢',
    category: 'management',
    type: 'folder',
    description: 'Numerical folder organization system',
    learnMoreContent: `Johnny Decimal is a system to organize projects using numbers.

**Structure:**
- 10-19: Category 1
  - 11: Subcategory
    - 11.01: Individual item
- 20-29: Category 2
  - 21: Subcategory
    - 21.01: Individual item

**Benefits:**
- Easy to find anything with a number
- Forced limitation (10 categories max)
- Clean, organized structure`,
    templateStructure: {
      folders: [
        { name: '10-19 Administration', icon: '📋' },
        { name: '20-29 Finance', icon: '💰' },
        { name: '30-39 Projects', icon: '🚀' },
        { name: '40-49 Resources', icon: '📚' },
        { name: '50-59 Archive', icon: '📦' },
      ]
    }
  },

  // ============================================
  // PURPOSE SYSTEMS
  // ============================================

  ikigai: {
    id: 'ikigai',
    name: 'Ikigai',
    icon: '🎯',
    category: 'purpose',
    type: 'canvas',
    description: 'Japanese concept - Find your reason for being',
    learnMoreContent: `Ikigai is a Japanese concept meaning "reason for being."

**Four Circles:**
1. What you LOVE
2. What you're GOOD AT
3. What you can be PAID FOR
4. What the WORLD NEEDS

**The Center (Ikigai):**
Where all four circles intersect - your purpose.

**Use for:**
- Career decisions
- Life purpose discovery
- Balancing passion and practicality`,
    templateStructure: {
      type: 'circles',
      zones: [
        { id: 'love', name: 'What You Love', position: { x: 0, y: 0, width: 200, height: 200 }, color: '#FF6B6B' },
        { id: 'good_at', name: 'What You\'re Good At', position: { x: 200, y: 0, width: 200, height: 200 }, color: '#4ECDC4' },
        { id: 'paid_for', name: 'What You Can Be Paid For', position: { x: 0, y: 200, width: 200, height: 200 }, color: '#45B7D1' },
        { id: 'world_needs', name: 'What the World Needs', position: { x: 200, y: 200, width: 200, height: 200 }, color: '#96CEB4' },
        { id: 'ikigai', name: 'IKIGAI', position: { x: 100, y: 100, width: 100, height: 100 }, color: '#FFD93D' },
      ]
    }
  },

  life_wheel: {
    id: 'life_wheel',
    name: 'Life Wheel',
    icon: '⭕',
    category: 'purpose',
    type: 'canvas',
    description: 'Balance across 8 key life areas',
    learnMoreContent: `The Life Wheel helps visualize and balance different life areas.

**8 Life Areas:**
1. Career
2. Finance
3. Health
4. Family & Friends
5. Romance
6. Personal Growth
7. Fun & Recreation
8. Physical Environment

**How to use:**
- Rate satisfaction in each area (1-10)
- Identify imbalances
- Set goals for improvement`,
    templateStructure: {
      type: 'wheel',
      zones: [
        { id: 'career', name: 'Career', position: { x: 0, y: 0, width: 100, height: 100 } },
        { id: 'finance', name: 'Finance', position: { x: 100, y: 0, width: 100, height: 100 } },
        { id: 'health', name: 'Health', position: { x: 200, y: 0, width: 100, height: 100 } },
        { id: 'family', name: 'Family & Friends', position: { x: 200, y: 100, width: 100, height: 100 } },
        { id: 'romance', name: 'Romance', position: { x: 200, y: 200, width: 100, height: 100 } },
        { id: 'growth', name: 'Personal Growth', position: { x: 100, y: 200, width: 100, height: 100 } },
        { id: 'fun', name: 'Fun & Recreation', position: { x: 0, y: 200, width: 100, height: 100 } },
        { id: 'environment', name: 'Environment', position: { x: 0, y: 100, width: 100, height: 100 } },
      ]
    }
  },

  // ============================================
  // ANALYSIS SYSTEMS
  // ============================================

  eisenhower: {
    id: 'eisenhower',
    name: 'Eisenhower Matrix',
    icon: '📊',
    category: 'analysis',
    type: 'matrix',
    description: 'Prioritize by Urgent/Important quadrants',
    learnMoreContent: `The Eisenhower Matrix helps prioritize tasks based on urgency and importance.

**Four Quadrants:**
1. **Urgent & Important:** DO FIRST (crises, deadlines)
2. **Not Urgent & Important:** SCHEDULE (planning, growth)
3. **Urgent & Not Important:** DELEGATE (interruptions)
4. **Not Urgent & Not Important:** ELIMINATE (time wasters)

**Best for:**
- Task prioritization
- Time management
- Focus on what matters`,
    templateStructure: {
      rows: 2,
      cols: 2,
      cells: [
        { id: 'do_first', label: 'DO FIRST\n(Urgent & Important)', position: { row: 0, col: 0 }, color: '#FF6B6B' },
        { id: 'schedule', label: 'SCHEDULE\n(Important, Not Urgent)', position: { row: 0, col: 1 }, color: '#4ECDC4' },
        { id: 'delegate', label: 'DELEGATE\n(Urgent, Not Important)', position: { row: 1, col: 0 }, color: '#FFE66D' },
        { id: 'eliminate', label: 'ELIMINATE\n(Not Urgent, Not Important)', position: { row: 1, col: 1 }, color: '#95E1D3' },
      ]
    }
  },

  swot: {
    id: 'swot',
    name: 'SWOT Analysis',
    icon: '🎯',
    category: 'analysis',
    type: 'matrix',
    description: 'Strengths, Weaknesses, Opportunities, Threats',
    learnMoreContent: `SWOT Analysis is a strategic planning framework.

**Four Quadrants:**
- **Strengths:** Internal positive factors
- **Weaknesses:** Internal negative factors
- **Opportunities:** External positive factors
- **Threats:** External negative factors

**Use for:**
- Business strategy
- Project planning
- Personal development`,
    templateStructure: {
      rows: 2,
      cols: 2,
      cells: [
        { id: 'strengths', label: 'STRENGTHS\n(Internal Positive)', position: { row: 0, col: 0 }, color: '#4ECDC4' },
        { id: 'weaknesses', label: 'WEAKNESSES\n(Internal Negative)', position: { row: 0, col: 1 }, color: '#FF6B6B' },
        { id: 'opportunities', label: 'OPPORTUNITIES\n(External Positive)', position: { row: 1, col: 0 }, color: '#95E1D3' },
        { id: 'threats', label: 'THREATS\n(External Negative)', position: { row: 1, col: 1 }, color: '#FFE66D' },
      ]
    }
  },

  // ============================================
  // FUNCTIONAL SYSTEMS
  // ============================================

  planner: {
    id: 'planner',
    name: 'Planner',
    icon: '📅',
    category: 'functional',
    type: 'folder',
    description: 'Calendar, tasks, and event management',
    learnMoreContent: `The Planner system organizes time-based activities.

**Features:**
- Daily, weekly, monthly views
- Task management
- Event scheduling
- Reminders

**Best for:**
- Time management
- Scheduling
- Deadline tracking`,
    templateStructure: {
      folders: [
        { name: 'Today', icon: '📅' },
        { name: 'This Week', icon: '📆' },
        { name: 'This Month', icon: '🗓️' },
        { name: 'Tasks', icon: '✅' },
        { name: 'Events', icon: '📍' },
        { name: 'Reminders', icon: '🔔' },
      ]
    }
  },

  tracker: {
    id: 'tracker',
    name: 'Tracker',
    icon: '📊',
    category: 'functional',
    type: 'folder',
    description: 'Metrics, habits, and progress monitoring',
    learnMoreContent: `The Tracker system helps monitor progress and metrics.

**Features:**
- Habit tracking
- Goal progress
- Metrics and KPIs
- Charts and visualizations

**Best for:**
- Personal development
- Fitness tracking
- Business metrics`,
    templateStructure: {
      folders: [
        { name: 'Habits', icon: '✓' },
        { name: 'Goals Progress', icon: '📈' },
        { name: 'Metrics Dashboard', icon: '📊' },
        { name: 'Analytics', icon: '📉' },
      ]
    }
  },

  journal: {
    id: 'journal',
    name: 'Journal',
    icon: '📔',
    category: 'functional',
    type: 'folder',
    description: 'Personal diary and reflection',
    learnMoreContent: `The Journal system is for personal reflection and life documentation.

**Features:**
- Daily entries
- Mood tracking
- Gratitude logging
- Memory keeping

**Best for:**
- Self-reflection
- Mental health
- Life documentation`,
    templateStructure: {
      folders: [
        { name: 'Daily Entries', icon: '📝' },
        { name: 'Mood Tracker', icon: '😊' },
        { name: 'Gratitude Log', icon: '🙏' },
        { name: 'Memories', icon: '💭' },
      ]
    }
  },

  logbook: {
    id: 'logbook',
    name: 'Logbook',
    icon: '📋',
    category: 'functional',
    type: 'folder',
    description: 'Professional work log and documentation',
    learnMoreContent: `The Logbook system tracks professional work and decisions.

**Features:**
- Work logs
- Meeting notes
- Decision records
- Project updates

**Best for:**
- Work documentation
- Team communication
- Historical reference`,
    templateStructure: {
      folders: [
        { name: 'Daily Work Log', icon: '🗓️' },
        { name: 'Meetings', icon: '🤝' },
        { name: 'Decisions', icon: '💡' },
        { name: 'Project Updates', icon: '📊' },
        { name: 'Issues & Blockers', icon: '🐛' },
      ]
    }
  },

  miscellaneous: {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    icon: '📦',
    category: 'functional',
    type: 'folder',
    description: 'General-purpose catch-all for uncategorized content',
    learnMoreContent: `The Miscellaneous system provides a flexible home for notes and folders that don't fit into specific organizational frameworks.

**How it works:**
- **General:** Everyday notes and quick captures
- **Random:** Spontaneous ideas and thoughts
- **Unsorted:** Items waiting to be organized
- **Temporary:** Short-lived or experimental content

**Benefits:**
- No pressure to categorize everything
- Safe space for brainstorming
- Easy cleanup and sorting later
- Reduces organizational anxiety

**Best for:**
- Quick note-taking
- Temporary storage
- Ideas in progress
- Personal miscellany`,
    templateStructure: {
      folders: [
        { name: 'General', icon: '📝', description: 'Everyday notes' },
        { name: 'Random', icon: '🎲', description: 'Spontaneous thoughts' },
        { name: 'Unsorted', icon: '📥', description: 'Items to organize later' },
        { name: 'Temporary', icon: '⏱️', description: 'Short-lived content' },
      ]
    }
  },
};

// ============================================
// Helper Functions
// ============================================

export function getSystemById(id: string): SystemDefinition | undefined {
  return SYSTEMS_REGISTRY[id];
}

export function getSystemsByCategory(category: SystemCategory): SystemDefinition[] {
  return Object.values(SYSTEMS_REGISTRY).filter(s => s.category === category);
}

export function getAllSystems(): SystemDefinition[] {
  return Object.values(SYSTEMS_REGISTRY);
}

export function getSystemCategories(): SystemCategory[] {
  return ['functional', 'management', 'purpose', 'analysis'];
}
