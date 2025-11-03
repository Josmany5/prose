// ============================================
// NOTED - Notifications Service
// Handles task reminders and due date notifications
// ============================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private initialized = false;

  // ============================================
  // Initialize & Request Permissions
  // ============================================

  async init() {
    try {
      if (Platform.OS === 'web') {
        console.log('⚠️ Notifications not supported on web');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permissions not granted');
        return false;
      }

      this.initialized = true;
      console.log('✅ Notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Notification initialization failed:', error);
      return false;
    }
  }

  // ============================================
  // Schedule Notifications
  // ============================================

  async scheduleTaskReminder(
    taskId: string,
    taskDescription: string,
    reminderTime: Date
  ): Promise<string | null> {
    if (!this.initialized || Platform.OS === 'web') {
      return null;
    }

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📝 Task Reminder',
          body: taskDescription,
          data: { taskId, type: 'reminder' },
        },
        trigger: reminderTime,
      });

      return identifier;
    } catch (error) {
      console.error('Failed to schedule task reminder:', error);
      return null;
    }
  }

  async scheduleDueDateReminder(
    taskId: string,
    taskDescription: string,
    dueDate: Date
  ): Promise<string | null> {
    if (!this.initialized || Platform.OS === 'web') {
      return null;
    }

    try {
      // Schedule notification 1 hour before due date
      const reminderTime = new Date(dueDate.getTime() - 60 * 60 * 1000);

      if (reminderTime < new Date()) {
        return null; // Don't schedule if already passed
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Task Due Soon',
          body: `"${taskDescription}" is due in 1 hour`,
          data: { taskId, type: 'due_soon' },
        },
        trigger: reminderTime,
      });

      return identifier;
    } catch (error) {
      console.error('Failed to schedule due date reminder:', error);
      return null;
    }
  }

  async scheduleOverdueNotification(
    taskId: string,
    taskDescription: string,
    dueDate: Date
  ): Promise<string | null> {
    if (!this.initialized || Platform.OS === 'web') {
      return null;
    }

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Task Overdue',
          body: `"${taskDescription}" is overdue`,
          data: { taskId, type: 'overdue' },
        },
        trigger: dueDate,
      });

      return identifier;
    } catch (error) {
      console.error('Failed to schedule overdue notification:', error);
      return null;
    }
  }

  // ============================================
  // Cancel Notifications
  // ============================================

  async cancelTaskNotifications(notificationId: string): Promise<void> {
    if (!this.initialized || Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    if (!this.initialized || Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }
}

export default new NotificationService();
