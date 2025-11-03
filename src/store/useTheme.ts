import { useStore } from './index';
import { COLORS } from '../theme';

export const useTheme = () => {
  const isDarkMode = useStore(state => state.isDarkMode);
  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  return {
    isDarkMode,
    colors: {
      ...colors,
      surfaceVariant: isDarkMode ? '#353535' : '#F5F5F5',
    },
  };
};
