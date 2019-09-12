export default {
  entry: 'ui.tsx',
  umd: {
    name: 'tasks',
    minFile: false,
    globals: {
      window: 'window',
    },
  },
  typescriptOpts: {
    check: false,
  },
};
