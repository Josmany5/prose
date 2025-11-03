import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import type { SavedLink } from '../types';

interface LibraryBlockProps {
  links: SavedLink[];
  onLinksChange: (links: SavedLink[]) => void;
  colors: any;
}

export const LibraryBlock: React.FC<LibraryBlockProps> = ({ links, onLinksChange, colors }) => {
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;

    const newLink: SavedLink = {
      id: `link_${Date.now()}`,
      url: newLinkUrl.trim(),
      title: newLinkTitle.trim() || newLinkUrl.trim(),
      saveMode: 'link_only' as any,
      highlights: [],
      hashtags: [],
      domain: new URL(newLinkUrl).hostname || '',
      savedAt: new Date(),
      isFavorite: false,
      isRead: false,
      isArchived: false,
      type: 'other' as any,
    };

    onLinksChange([...links, newLink]);
    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  const handleRemoveLink = (linkId: string) => {
    onLinksChange(links.filter(l => l.id !== linkId));
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.headerText, { color: colors.text }]}>📚 Library</Text>

      {/* Links List */}
      {links.map((link) => (
        <View key={link.id} style={[styles.linkRow, { borderColor: colors.border }]}>
          <View style={styles.linkContent}>
            <Text style={[styles.linkTitle, { color: colors.text }]} numberOfLines={1}>
              {link.title}
            </Text>
            <Text style={[styles.linkUrl, { color: colors.textSecondary }]} numberOfLines={1}>
              {link.url}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleRemoveLink(link.id)} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Link Input */}
      <View style={styles.addLinkContainer}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="URL"
          placeholderTextColor={colors.textSecondary}
          value={newLinkUrl}
          onChangeText={setNewLinkUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Title (optional)"
          placeholderTextColor={colors.textSecondary}
          value={newLinkTitle}
          onChangeText={setNewLinkTitle}
        />
        <TouchableOpacity
          onPress={handleAddLink}
          disabled={!newLinkUrl.trim()}
          style={[
            styles.addButton,
            { backgroundColor: newLinkUrl.trim() ? colors.accent : colors.border }
          ]}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  headerText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: SPACING.xs,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    marginBottom: 2,
  },
  linkUrl: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  deleteButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  addLinkContainer: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  input: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: 4,
  },
  addButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 4,
    alignItems: 'center',
  },
  addButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
});
