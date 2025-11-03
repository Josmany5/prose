import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import type { Task } from '../types';

interface TaskBlockProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  colors: any;
}

export const TaskBlock: React.FC<TaskBlockProps> = ({ tasks, onTasksChange, colors }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [lastTaskChecked, setLastTaskChecked] = useState<string>('');
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Debounced save function
  const debouncedSave = (updatedTasks: Task[]) => {
    setLocalTasks(updatedTasks);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onTasksChange(updatedTasks);
    }, 800); // Wait 800ms after last keystroke
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      description: newTaskText.trim(),
      isCompleted: false,
      createdAt: new Date(),
      steps: [],
    };

    const updated = [...tasks, newTask];
    setLocalTasks(updated);
    onTasksChange(updated); // Immediate save for new task
    setNewTaskText('');
    setLastTaskChecked('');
  };

  const handleTaskTextChange = (taskId: string, newText: string) => {
    // Check if this is a temporary task (not in localTasks)
    const existingTask = localTasks.find(t => t.id === taskId);

    if (!existingTask) {
      // This is a new task being created - add it to localTasks
      const newTask: Task = {
        id: taskId,
        description: newText,
        isCompleted: false,
        createdAt: new Date(),
        steps: [],
      };
      const updated = [...localTasks, newTask];
      setLocalTasks(updated);

      // Only save if there's actual text
      if (newText.trim()) {
        debouncedSave(updated);
      }
    } else {
      // Update existing task
      const updated = localTasks.map(task =>
        task.id === taskId
          ? { ...task, description: newText }
          : task
      );
      setLocalTasks(updated);

      // Remove task if text becomes empty (but keep debounced save)
      if (!newText.trim()) {
        const filtered = localTasks.filter(t => t.id !== taskId);
        setLocalTasks(filtered);
        debouncedSave(filtered);
      } else {
        debouncedSave(updated);
      }
    }
  };

  const handleQuickToggle = (taskId: string) => {
    setLastTaskChecked(lastTaskChecked === taskId ? '' : taskId);
  };

  const handleToggleTask = (taskId: string) => {
    const updated = localTasks.map(task =>
      task.id === taskId
        ? { ...task, isCompleted: !task.isCompleted, completedAt: !task.isCompleted ? new Date() : undefined }
        : task
    );
    setLocalTasks(updated);
    onTasksChange(updated); // Immediate save for toggle
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = localTasks.filter(t => t.id !== taskId);
    setLocalTasks(updated);
    onTasksChange(updated); // Immediate save for delete
  };

  // Ensure there's always one empty task at the end for input
  const displayTasks = [...localTasks];
  const lastTask = displayTasks[displayTasks.length - 1];
  if (!lastTask || lastTask.description.trim()) {
    displayTasks.push({
      id: `temp_${Date.now()}`,
      description: '',
      isCompleted: false,
      createdAt: new Date(),
      steps: [],
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.text }]}>✅ Tasks</Text>
      </View>

      {/* Task List - All editable */}
      {displayTasks.map((task, index) => {
        const isEmpty = !task.description.trim();
        const isLast = index === displayTasks.length - 1;

        return (
          <View key={task.id} style={styles.taskRow}>
            <TouchableOpacity onPress={() => !isEmpty && handleToggleTask(task.id)}>
              <View style={[
                styles.checkbox,
                { borderColor: colors.border },
                task.isCompleted && { backgroundColor: colors.accent }
              ]}>
                {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>

            <TextInput
              style={[
                styles.taskInput,
                { color: colors.text },
                task.isCompleted && styles.taskCompleted
              ]}
              placeholder={isLast ? "Add task..." : "Task"}
              placeholderTextColor={colors.textSecondary}
              value={task.description}
              onChangeText={(text) => {
                handleTaskTextChange(task.id, text);
              }}
            />

            {!isEmpty && (
              <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
                <Text style={styles.deleteButton}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  header: {
    marginBottom: SPACING.sm,
  },
  headerText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
  },
  taskInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    color: '#FF3B30',
    fontSize: 18,
    padding: SPACING.xs,
  },
  addTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  inputCheckboxContainer: {
    padding: SPACING.xs,
  },
  inputCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputCheckmark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  input: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    minWidth: 150, // Shorten the input length
    // Removed: borderWidth: 1, borderRadius: 4 - eliminates blue highlights
  },
  addButton: {
    fontSize: 24,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
});
