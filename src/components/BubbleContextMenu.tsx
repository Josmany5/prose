import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Bubble as BubbleType } from '../types/bubble';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';

interface BubbleContextMenuProps {
  visible: boolean;
  bubble: BubbleType | null;
  onClose: () => void;
  onEdit: (bubble: BubbleType) => void;
  onDelete: (bubble: BubbleType) => void;
  onConnect: (bubble: BubbleType) => void;
  onTransform: (bubble: BubbleType) => void;
}

export const BubbleContextMenu: React.FC<BubbleContextMenuProps> = ({
  visible,
  bubble,
  onClose,
  onEdit,
  onDelete,
  onConnect,
  onTransform,
}) => {
  const { colors } = useTheme();

  if (!bubble) return null;

  const handleAction = (action: () => void) => {
    onClose();
    // Small delay to let modal close before action
    setTimeout(action, 100);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.headerText, { color: colors.text }]}>
              {bubble.emoji} {bubble.title}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => handleAction(() => onEdit(bubble))}
          >
            <Text style={styles.menuIcon}>✏️</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => handleAction(() => onDelete(bubble))}
          >
            <Text style={styles.menuIcon}>🗑️</Text>
            <Text style={[styles.menuText, { color: '#FF3B30' }]}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => handleAction(() => onConnect(bubble))}
          >
            <Text style={styles.menuIcon}>🔗</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Connect</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => handleAction(() => onTransform(bubble))}
          >
            <Text style={styles.menuIcon}>🔄</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Transform</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
  menu: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  menuText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  cancelButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  cancelText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
});
