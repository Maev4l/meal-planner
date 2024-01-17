module.exports = {
  settings: {
    react: {
      version: '17.0.2',
    },
  },
  env: {
    browser: true,
  },
  extends: ['airbnb', 'prettier'],
  parser: '@babel/eslint-parser',
  rules: {
    'react/forbid-prop-types': 'off',
    'react/require-default-props': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/label-has-for': 'off',
    'jsx-a11y/alt-text': 'off',
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/prop-types': 'off',
    'import/prefer-default-export': 'off',
    'react/function-component-definition': [2, { namedComponents: 'arrow-function' }],
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'react/jsx-fragments': 'off',
  },
};
