import { View } from 'react-native';
import { MD3Colors } from 'react-native-paper';
import { createContext, useContext, useMemo } from 'react';
import { useAppPreferences } from './AppPreferences';

const GridContext = createContext();

const Grid = ({ children, style, columns, columnGap, rowGap }) => {
  const mergedStyles = { ...style, flex: columns, rowGap };
  const val = useMemo(() => ({ columnGap }), [columnGap]);

  return (
    <GridContext.Provider value={val}>
      <View style={mergedStyles}>{children}</View>
    </GridContext.Provider>
  );
};

const Row = ({ children, style, highlight }) => {
  const { columnGap } = useContext(GridContext);
  const { darkMode } = useAppPreferences();

  const mergedStyles = {
    ...style,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap,
  };
  let styles = [mergedStyles];
  if (highlight) {
    const hlStyle = {
      borderRadius: 8,
      padding: 2,
      backgroundColor: darkMode ? MD3Colors.error10 : MD3Colors.error90,
    };

    styles = [...styles, hlStyle];
  }
  return <View style={styles}>{children}</View>;
};

const Column = ({ children, colsCount, style }) => {
  const mergedStyles = { ...style, flex: colsCount };
  return <View style={mergedStyles}>{children}</View>;
};

Grid.Row = Row;
Grid.Column = Column;

export default Grid;
