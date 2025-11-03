import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';

interface IdeasBlockProps {
  ideas: string[];
  onIdeasChange: (ideas: string[]) => void;
  colors: any;
}

export const IdeasBlock: React.FC<IdeasBlockProps> = ({ ideas, onIdeasChange, colors }) => {
  const [localIdeas, setLocalIdeas] = useState<string[]>(ideas);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalIdeas(ideas);
  }, [ideas]);

  // Debounced save function
  const debouncedSave = (updatedIdeas: string[]) => {
    setLocalIdeas(updatedIdeas);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      onIdeasChange(updatedIdeas);
    }, 800); // Wait 800ms after last keystroke
  };

  const handleIdeaChange = (index: number, newText: string) => {
    const updatedIdeas = [...localIdeas];

    // Check if this is the temporary empty idea at the end
    if (index >= localIdeas.length) {
      // This is a new idea being created
      updatedIdeas.push(newText);
      setLocalIdeas(updatedIdeas);

      // Only save if there's actual text
      if (newText.trim()) {
        debouncedSave(updatedIdeas);
      }
    } else {
      // Update existing idea
      updatedIdeas[index] = newText;
      setLocalIdeas(updatedIdeas);

      // Save all changes (debounced)
      debouncedSave(updatedIdeas);
    }
  };

  const handleRemoveIdea = (index: number) => {
    const updatedIdeas = localIdeas.filter((_, i) => i !== index);
    setLocalIdeas(updatedIdeas);
    // Immediate save for deletions
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    onIdeasChange(updatedIdeas);
  };

  // Ensure there's always one empty idea at the end for input
  const displayIdeas = [...localIdeas];
  const lastIdea = displayIdeas[displayIdeas.length - 1];
  if (!lastIdea || lastIdea.trim()) {
    displayIdeas.push('');
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.headerText, { color: colors.text }]}>🔥 IDEAS</Text>

      {/* Ideas List - All editable */}
      {displayIdeas.map((idea, index) => {
        const isEmpty = !idea.trim();
        const isLast = index === displayIdeas.length - 1;

        return (
          <View key={index} style={styles.ideaRow}>
            <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
            <TextInput
              style={[styles.ideaInput, { color: colors.text }]}
              placeholder={isLast ? "Add an idea..." : "Idea"}
              placeholderTextColor={colors.textSecondary}
              value={idea}
              onChangeText={(text) => {
                handleIdeaChange(index, text);
              }}
              multiline
            />
            {!isEmpty && (
              <TouchableOpacity onPress={() => handleRemoveIdea(index)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>×</Text>
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
  headerText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.sm,
  },
  ideaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  bullet: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    marginRight: SPACING.xs,
    width: 20,
  },
  ideaText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
  },
  ideaInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
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
  addIdeaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  addIdeaInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  addButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 4,
  },
  addButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
});
