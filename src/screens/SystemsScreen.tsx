import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';
import { useStore } from '../store';
import {
  getAllSystems,
  getSystemsByCategory,
  getSystemById,
  type SystemDefinition,
  type SystemCategory,
} from '../services/systemsRegistry';

export const SystemsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { activeSystems, loadActiveSystems, activateSystem, deactivateSystem } = useStore();
  const [selectedSystem, setSelectedSystem] = useState<SystemDefinition | null>(null);
  const [showLearnMore, setShowLearnMore] = useState(false);

  useEffect(() => {
    loadActiveSystems();
  }, []);

  const handleActivateSystem = async (systemId: string) => {
    const system = getSystemById(systemId);
    if (!system) return;

    try {
      await activateSystem(systemId, system);
      setShowLearnMore(false);
    } catch (error) {
      console.error('Error activating system:', error);
    }
  };

  const handleDeactivateSystem = async (systemId: string) => {
    const system = getSystemById(systemId);
    if (!system) return;

    console.log('🔴 Deactivating system:', systemId, system.name);

    // Use window.confirm for web, Alert for native
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Deactivate System\n\nThis action will deactivate "${system.name}" and remove all its folders and organization structure. Your notes will NOT be deleted, but they will no longer be organized by this system.\n\nAre you sure you want to deactivate this system?`
      );

      if (confirmed) {
        try {
          console.log('🔴 Confirmed deactivation of:', systemId);
          await deactivateSystem(systemId);
          await loadActiveSystems();
          console.log('✅ System deactivated successfully');
        } catch (error) {
          console.error('❌ Error deactivating system:', error);
          window.alert('Error: Failed to deactivate system');
        }
      }
    } else {
      Alert.alert(
        'Deactivate System',
        `This action will deactivate "${system.name}" and remove all its folders and organization structure. Your notes will NOT be deleted, but they will no longer be organized by this system.\n\nAre you sure you want to deactivate this system?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Deactivate',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🔴 Confirmed deactivation of:', systemId);
                await deactivateSystem(systemId);
                await loadActiveSystems();
                console.log('✅ System deactivated successfully');
              } catch (error) {
                console.error('❌ Error deactivating system:', error);
                Alert.alert('Error', 'Failed to deactivate system');
              }
            }
          }
        ]
      );
    }
  };

  const handleSystemTap = (systemId: string) => {
    // Navigate to AllFoldersScreen filtered by this system
    navigation.navigate('AllFolders' as never, { systemId, showAllSystems: false } as never);
  };

  const handleViewAllFolders = () => {
    // Navigate to AllFoldersScreen showing all systems
    navigation.navigate('AllFolders' as never, { showAllSystems: true } as never);
  };

  const handleLearnMore = (system: SystemDefinition) => {
    setSelectedSystem(system);
    setShowLearnMore(true);
  };

  const isSystemActive = (systemId: string): boolean => {
    return activeSystems.some(s => s.id === systemId);
  };

  const renderSystemCard = (system: SystemDefinition, isActive: boolean) => (
    <TouchableOpacity
      key={system.id}
      style={[
        styles.systemCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isActive && styles.activeSystemCard,
      ]}
      onPress={() => isActive ? handleSystemTap(system.id) : null}
      onLongPress={() => isActive ? handleDeactivateSystem(system.id) : null}
    >
      <Text style={styles.systemIcon}>{system.icon}</Text>
      <Text style={[styles.systemName, { color: colors.text }]}>{system.name}</Text>
      <Text style={[styles.systemDescription, { color: colors.textSecondary }]} numberOfLines={2}>
        {system.description}
      </Text>
      {isActive && (
        <View style={[styles.activeBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCategorySection = (category: SystemCategory, title: string) => {
    const systems = getSystemsByCategory(category);
    if (systems.length === 0) return null;

    return (
      <View key={category} style={styles.categorySection}>
        <Text style={[styles.categoryTitle, { color: colors.text }]}>{title}</Text>
        {systems.map(system => {
          const isActive = isSystemActive(system.id);
          return (
            <View key={system.id} style={styles.librarySystemRow}>
              <View style={styles.librarySystemInfo}>
                <Text style={styles.librarySystemIcon}>{system.icon}</Text>
                <View style={styles.librarySystemText}>
                  <Text style={[styles.librarySystemName, { color: colors.text }]}>
                    {system.name}
                  </Text>
                  <Text style={[styles.librarySystemDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                    {system.description}
                  </Text>
                </View>
              </View>
              <View style={styles.librarySystemActions}>
                <TouchableOpacity
                  style={[styles.learnMoreButton, { borderColor: colors.border }]}
                  onPress={() => handleLearnMore(system)}
                >
                  <Text style={[styles.learnMoreText, { color: colors.accent }]}>Learn More</Text>
                </TouchableOpacity>
                {!isActive ? (
                  <TouchableOpacity
                    style={[styles.activateButton, { backgroundColor: colors.accent }]}
                    onPress={() => handleActivateSystem(system.id)}
                  >
                    <Text style={styles.activateButtonText}>Activate</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.activeLabel, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[styles.activeLabelText, { color: colors.text }]}>Active</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Home</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Systems</Text>
        <TouchableOpacity
          style={[styles.foldersButton, { backgroundColor: colors.accent }]}
          onPress={handleViewAllFolders}
        >
          <Text style={styles.foldersButtonText}>📁 Folders</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Active Systems Section */}
        {activeSystems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Systems</Text>
            <View style={styles.systemsGrid}>
              {activeSystems.map(activeSystem => {
                const systemDef = getSystemById(activeSystem.id);
                return systemDef ? renderSystemCard(systemDef, true) : null;
              })}
            </View>
          </View>
        )}

        {/* System Library Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>System Library</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Choose from proven organizational frameworks
          </Text>

          {renderCategorySection('functional', 'Functional Tools')}
          {renderCategorySection('management', 'Management Systems')}
          {renderCategorySection('purpose', 'Purpose & Vision')}
          {renderCategorySection('analysis', 'Analysis & Planning')}
        </View>
      </ScrollView>

      {/* Learn More Modal */}
      <Modal
        visible={showLearnMore}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLearnMore(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowLearnMore(false)}>
              <Text style={[styles.modalCloseButton, { color: colors.accent }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedSystem?.icon} {selectedSystem?.name}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.learnMoreContent, { color: colors.text }]}>
              {selectedSystem?.learnMoreContent}
            </Text>

            {selectedSystem && !isSystemActive(selectedSystem.id) && (
              <TouchableOpacity
                style={[styles.modalActivateButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  handleActivateSystem(selectedSystem.id);
                  setShowLearnMore(false);
                }}
              >
                <Text style={styles.modalActivateButtonText}>Activate {selectedSystem.name}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  backButton: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.title,
    flex: 1,
    textAlign: 'center',
  },
  foldersButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  foldersButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    marginBottom: SPACING.md,
  },
  systemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  systemCard: {
    width: '47%',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  activeSystemCard: {
    borderWidth: 2,
  },
  systemIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  systemName: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.xs,
  },
  systemDescription: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    lineHeight: FONT_SIZES.small * 1.4,
  },
  activeBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
    color: '#FFFFFF',
  },
  categorySection: {
    marginTop: SPACING.lg,
  },
  categoryTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.md,
  },
  librarySystemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  librarySystemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  librarySystemIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  librarySystemText: {
    flex: 1,
  },
  librarySystemName: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  librarySystemDescription: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
  },
  librarySystemActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  learnMoreButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    borderWidth: 1,
  },
  learnMoreText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  activateButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  activateButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
    color: '#FFFFFF',
  },
  activeLabel: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  activeLabelText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  modalTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  learnMoreContent: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.6,
    marginBottom: SPACING.xl,
  },
  modalActivateButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  modalActivateButtonText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  addNoteButton: {
    margin: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  addNoteButtonText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
});
