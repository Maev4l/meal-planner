import { List, Switch } from 'react-native-paper';

import { useAppPreferences } from '../components';

const Appearance = () => {
  const { darkMode, setDarkMode } = useAppPreferences();
  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      <List.Item
        title="Night mode"
        right={({ color }) => (
          <Switch color={color} value={darkMode} onValueChange={() => setDarkMode(!darkMode)} />
        )}
      />
    </>
  );
};

export default Appearance;
