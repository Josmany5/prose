import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Bubble as BubbleType } from '../types/bubble';
import { BUBBLE_TYPE_INFO } from '../data/sampleBubbles';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CreateBubbleScreenParams {
  bubble?: BubbleType;
  onSave?: (bubble: Partial<BubbleType>) => void;
}

export const CreateBubbleScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { bubble, onSave } = (route.params as CreateBubbleScreenParams) || {};

  // Form state
  const [selectedType, setSelectedType] = useState<BubbleType['type']>(bubble?.type || 'note');
  const [title, setTitle] = useState(bubble?.title || '');
  const [content, setContent] = useState(bubble?.content || '');
  const [urgency, setUrgency] = useState<'none' | 'low' | 'medium' | 'high'>(bubble?.urgency || 'none');
  const [importance, setImportance] = useState<1 | 2 | 3 | 4 | 5 | undefined>(bubble?.importance);

  // Scheduling state
  const [hasSchedule, setHasSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [scheduleTime, setScheduleTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [enableNotifications, setEnableNotifications] = useState(false);

  const bubbleTypes: BubbleType['type'][] = [
    'note',
    'task',
    'project',
    'goal',
    'journal',
    'library',
    'ideas',
    'document',
    'workout',
    'budget',
  ];

  const handleTypeSelect = (type: BubbleType['type']) => {
    setSelectedType(type);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your bubble');
      return;
    }

    const typeInfo = BUBBLE_TYPE_INFO[selectedType];
    const bubbleData: Partial<BubbleType> = {
      type: selectedType,
      title: title.trim(),
      emoji: typeInfo.emoji,
      content: content.trim(),
      color: typeInfo.color,
      urgency: urgency,
      importance: importance,
    };

    // Add schedule if enabled
    if (hasSchedule) {
      const scheduledDateTime = new Date(scheduleDate);
      scheduledDateTime.setHours(scheduleTime.getHours());
      scheduledDateTime.setMinutes(scheduleTime.getMinutes());

      bubbleData.schedule = {
        startDate: scheduledDateTime,
        recurrence: recurrence,
        notifications: enableNotifications,
      };
    }

    if (onSave) {
      onSave(bubbleData);
    }

    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[styles.headerButton, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {bubble ? 'Edit Bubble' : 'Create Bubble'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.headerButton, { color: colors.accent }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bubble Type Selection */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Type</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeScroll}
          contentContainerStyle={styles.typeScrollContent}
        >
          {bubbleTypes.map((type) => {
            const typeInfo = BUBBLE_TYPE_INFO[type];
            const isSelected = selectedType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: isSelected ? typeInfo.color : colors.surfaceVariant,
                    borderColor: typeInfo.color,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => handleTypeSelect(type)}
              >
                <Text style={styles.typeEmoji}>{typeInfo.emoji}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    { color: isSelected ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {typeInfo.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Title Input */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Title <Text style={{ color: '#FF3B30' }}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.titleInput,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter bubble title..."
          placeholderTextColor={colors.textSecondary}
          autoFocus={!bubble}
        />

        {/* Content Input */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Content</Text>
        <TextInput
          style={[
            styles.contentInput,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={content}
          onChangeText={setContent}
          placeholder="Enter content or description..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        {/* Urgency Selector */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Urgency</Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity onPress={() => setUrgency('none')}>
            <Text style={[styles.urgencyDot, urgency === 'none' && styles.selected]}>⚪</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setUrgency('low')}>
            <Text style={[styles.urgencyDot, urgency === 'low' && styles.selected]}>🟢</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setUrgency('medium')}>
            <Text style={[styles.urgencyDot, urgency === 'medium' && styles.selected]}>🟡</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setUrgency('high')}>
            <Text style={[styles.urgencyDot, urgency === 'high' && styles.selected]}>🔴</Text>
          </TouchableOpacity>
          <Text style={[styles.selectedLabel, { color: colors.textSecondary }]}>
            {urgency === 'none' && 'None'}
            {urgency === 'low' && 'Low'}
            {urgency === 'medium' && 'Medium'}
            {urgency === 'high' && 'High'}
          </Text>
        </View>

        {/* Importance Selector */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Importance</Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity onPress={() => setImportance(undefined)}>
            <Text style={[styles.importanceStar, importance === undefined && styles.selected]}>⚪</Text>
          </TouchableOpacity>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setImportance(level as 1 | 2 | 3 | 4 | 5)}
            >
              <Text style={styles.importanceStar}>
                {importance && importance >= level ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scheduling Section */}
        <View style={[styles.schedulingSection, { borderTopColor: colors.border }]}>
          <View style={styles.schedulingHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule</Text>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                { backgroundColor: hasSchedule ? colors.accent : colors.surfaceVariant },
              ]}
              onPress={() => setHasSchedule(!hasSchedule)}
            >
              <Text style={[styles.toggleButtonText, { color: hasSchedule ? '#FFFFFF' : colors.text }]}>
                {hasSchedule ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          {hasSchedule && (
            <View style={styles.scheduleContent}>
              {/* Date Picker */}
              <Text style={[styles.scheduleLabel, { color: colors.text }]}>Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  📅 {scheduleDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={scheduleDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) setScheduleDate(date);
                  }}
                />
              )}

              {/* Time Picker */}
              <Text style={[styles.scheduleLabel, { color: colors.text }]}>Time</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  🕐 {scheduleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={scheduleTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, time) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (time) setScheduleTime(time);
                  }}
                />
              )}

              {/* Recurrence */}
              <Text style={[styles.scheduleLabel, { color: colors.text }]}>Recurrence</Text>
              <View style={styles.recurrenceRow}>
                {(['none', 'daily', 'weekly', 'monthly'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.recurrenceButton,
                      {
                        backgroundColor: recurrence === freq ? colors.accent : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setRecurrence(freq)}
                  >
                    <Text
                      style={[
                        styles.recurrenceButtonText,
                        { color: recurrence === freq ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notifications Toggle */}
              <View style={styles.notificationRow}>
                <Text style={[styles.scheduleLabel, { color: colors.text }]}>Notifications</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    { backgroundColor: enableNotifications ? colors.accent : colors.surfaceVariant },
                  ]}
                  onPress={() => setEnableNotifications(!enableNotifications)}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      { color: enableNotifications ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {enableNotifications ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Bottom padding for scroll */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.title,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  typeScroll: {
    marginBottom: SPACING.md,
  },
  typeScrollContent: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  typeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
  },
  titleInput: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.title,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  contentInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    minHeight: 150,
    marginBottom: SPACING.md,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  urgencyDot: {
    fontSize: 32,
    opacity: 0.5,
  },
  importanceStar: {
    fontSize: 32,
  },
  selected: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  selectedLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    marginLeft: SPACING.sm,
  },
  schedulingSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
  },
  schedulingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  toggleButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  scheduleContent: {
    gap: SPACING.sm,
  },
  scheduleLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
    marginTop: SPACING.sm,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  dateButtonText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
  },
  recurrenceRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  recurrenceButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  recurrenceButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
});
