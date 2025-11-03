import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { PREDEFINED_EMOJIS, EMOJI_LABELS } from '../types';
import { FONTS, FONT_SIZES, SPACING } from '../theme';

interface EmojiSelectorProps {
  visible: boolean;
  selectedEmoji?: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  colors: any;
}

export const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  visible,
  selectedEmoji,
  onSelect,
  onClose,
  colors,
}) => {
  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modal, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Select Emoji
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, { color: colors.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.emojiGrid}
            showsVerticalScrollIndicator={false}
          >
            {PREDEFINED_EMOJIS.length === 0 ? (
              <Text style={{ color: colors.text, padding: 20 }}>
                No emojis available
              </Text>
            ) : (
              PREDEFINED_EMOJIS.map((emoji) => {
                const isSelected = emoji === selectedEmoji;
                const label = EMOJI_LABELS[emoji] || '';
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      { borderColor: colors.border },
                      isSelected && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                    ]}
                    onPress={() => handleSelect(emoji)}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                    <Text
                      style={[
                        styles.emojiLabel,
                        { color: isSelected ? '#FFFFFF' : colors.text }
                      ]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    height: '70%',
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.header,
  },
  closeButton: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: '22%',
    aspectRatio: 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 4,
    textAlign: 'center',
  },
  emojiLabel: {
    ...FONTS.medium,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
});
