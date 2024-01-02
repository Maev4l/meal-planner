/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */
const developmentEnvironments = ['development', 'test'];

const developmentPlugins = [];

const productionPlugins = [
  require('babel-plugin-dev-expression'),

  // babel-preset-react-optimize
  require('@babel/plugin-transform-react-constant-elements'),
  require('@babel/plugin-transform-react-inline-elements'),
  require('babel-plugin-transform-react-remove-prop-types'),
];

module.exports = (api) => {
  // See docs about api at https://babeljs.io/docs/en/config-files#apicache

  const development = api.env(developmentEnvironments);

  return {
    presets: [
      // @babel/preset-env will automatically target our browserslist targets
      require('@babel/preset-env'),
      [
        require('@babel/preset-react'),
        {
          development,
          runtime: 'automatic',
          importSource: '@emotion/react',
        },
      ],
      require('@emotion/babel-preset-css-prop'),
    ],
    plugins: [
      require('@babel/plugin-transform-runtime'),
      /*
      [
        require('babel-plugin-direct-import'),
        { modules: ['@mui/material', '@mui/icons-material'] },
      ], 
      */
      // Stage 0
      require('@babel/plugin-proposal-function-bind'),

      // Stage 1
      require('@babel/plugin-proposal-export-default-from'),
      require('@babel/plugin-transform-logical-assignment-operators'),
      [require('@babel/plugin-transform-optional-chaining')],
      [require('@babel/plugin-proposal-pipeline-operator'), { proposal: 'minimal' }],
      [require('@babel/plugin-transform-nullish-coalescing-operator'), { loose: false }],
      require('@babel/plugin-proposal-do-expressions'),

      // Stage 2
      [require('@babel/plugin-proposal-decorators'), { legacy: true }],
      require('@babel/plugin-proposal-function-sent'),
      require('@babel/plugin-transform-export-namespace-from'),
      require('@babel/plugin-transform-numeric-separator'),
      require('@babel/plugin-proposal-throw-expressions'),

      // Stage 3
      require('@babel/plugin-syntax-dynamic-import'),
      require('@babel/plugin-syntax-import-meta'),
      [require('@babel/plugin-transform-class-properties')],
      require('@babel/plugin-transform-json-strings'),

      require('@emotion/babel-plugin'),

      ...(development ? developmentPlugins : productionPlugins),
    ],
  };
};
