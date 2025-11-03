// ============================================
// NOTED - Utility Functions
// ============================================

import { format, formatDistanceToNow, isToday, isYesterday, isSameDay } from 'date-fns';
import type { Note, Entry } from '../types';

// ============================================
// Date Formatting
// ============================================

export const formatTimestamp = (date: Date): string => {
  if (isToday(date)) {
    return `Today ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  } else {
    return format(date, 'MMM d, yyyy h:mm a');
  }
};

export const formatDate = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d, yyyy');
  }
};

export const formatTime = (date: Date): string => {
  return format(date, 'h:mm a');
};

export const formatRelativeTime = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true });
};

// ============================================
// Hashtag Detection & Extraction
// ============================================

export const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];

  // Remove duplicates and '#' symbol
  return Array.from(new Set(matches.map(tag => tag.substring(1).toLowerCase())));
};

export const detectNewHashtags = (oldTags: string[], newText: string): string[] => {
  const newTags = extractHashtags(newText);
  return newTags.filter(tag => !oldTags.includes(tag));
};

// ============================================
// Linked Notes Detection
// ============================================

export const extractLinkedNotes = (text: string): string[] => {
  const linkRegex = /\[\[(.*?)\]\]/g;
  const matches = text.match(linkRegex);
  if (!matches) return [];

  return matches.map(match => match.replace(/\[\[|\]\]/g, ''));
};

export const findSimilarNotes = (
  currentNote: Note,
  allNotes: Note[],
  minMatchingKeywords: number = 3
): Note[] => {
  const currentKeywords = new Set([
    ...currentNote.hashtags,
    ...currentNote.title.toLowerCase().split(' '),
  ]);

  return allNotes
    .filter(note => note.id !== currentNote.id)
    .map(note => {
      const noteKeywords = new Set([
        ...note.hashtags,
        ...note.title.toLowerCase().split(' '),
      ]);

      const matchingKeywords = Array.from(currentKeywords).filter(keyword =>
        noteKeywords.has(keyword)
      );

      return {
        note,
        matchCount: matchingKeywords.length,
      };
    })
    .filter(({ matchCount }) => matchCount >= minMatchingKeywords)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map(({ note }) => note);
};

// ============================================
// Entry Grouping (by Date)
// ============================================

export interface GroupedEntries {
  date: Date;
  dateLabel: string;
  entries: Entry[];
}

export const groupEntriesByDate = (entries: Entry[]): GroupedEntries[] => {
  const groups: Map<string, GroupedEntries> = new Map();

  entries.forEach(entry => {
    const dateKey = format(entry.timestamp, 'yyyy-MM-dd');

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        date: entry.timestamp,
        dateLabel: formatDate(entry.timestamp),
        entries: [],
      });
    }

    groups.get(dateKey)!.entries.push(entry);
  });

  return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
};

// ============================================
// Search & Filtering
// ============================================

export const searchNotes = (notes: Note[], query: string): Note[] => {
  if (!query.trim()) return notes;

  const lowerQuery = query.toLowerCase();

  return notes.filter(note => {
    // Search in title
    if (note.title.toLowerCase().includes(lowerQuery)) return true;

    // Search in hashtags
    if (note.hashtags.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;

    // Search in entries content
    if (note.entries.some(entry => entry.content.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    return false;
  });
};

// ============================================
// Progress Calculation
// ============================================

export const calculateNoteProgress = (note: Note): number => {
  if (note.tasks.length === 0) {
    // If no tasks, use manual progress
    return note.progressPercentage;
  }

  // Calculate from tasks
  const completedTasks = note.tasks.filter(task => task.isCompleted).length;
  return Math.round((completedTasks / note.tasks.length) * 100);
};

export const calculatePipelineProgress = (notes: Note[]): number => {
  if (notes.length === 0) return 0;

  const totalProgress = notes.reduce((sum, note) => sum + calculateNoteProgress(note), 0);
  return Math.round(totalProgress / notes.length);
};

// ============================================
// Text Preview
// ============================================

export const getTextPreview = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const getFirstLine = (text: string): string => {
  const firstLineEnd = text.indexOf('\n');
  if (firstLineEnd === -1) return getTextPreview(text, 80);
  return getTextPreview(text.substring(0, firstLineEnd), 80);
};

// ============================================
// Sorting
// ============================================

export const sortNotesByLastModified = (notes: Note[]): Note[] => {
  return [...notes].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
};

export const sortNotesByUrgencyAndImportance = (notes: Note[]): Note[] => {
  const urgencyWeight: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
    none: 0,
  };

  return [...notes].sort((a, b) => {
    // First by urgency
    const urgencyDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;

    // Then by importance
    const importanceDiff = b.importance - a.importance;
    if (importanceDiff !== 0) return importanceDiff;

    // Finally by last modified
    return b.lastModified.getTime() - a.lastModified.getTime();
  });
};

// ============================================
// ID Generation
// ============================================

export const generateId = (prefix: string = ''): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

// ============================================
// Time Duration Formatting
// ============================================

export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

// ============================================
// URL Domain Extraction
// ============================================

export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
};
