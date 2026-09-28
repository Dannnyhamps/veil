const expoPreset = require('jest-expo/jest-preset');

/**
 * Jest setup for the mobile app.
 *
 * `jest-expo` supplies the React Native transform, module mocks, and test
 * environment. The only change is the transform allow-list: `@noble/ciphers`,
 * `@noble/hashes` and the `@walletconnect` packages ship ESM only, and Jest
 * cannot `require` them untransformed. Metro handles them natively, so this
 * affects tests alone. `@walletconnect` is on the list because `walletStore`
 * imports the WalletConnect session-key constant from its owner; that already
 * loads `lib/polyfills`, so the package has to be transformable from there too.
 *
 * `setupFiles` appends `jest.setup.js` to the preset's own setup files rather
 * than replacing them, so the React Native and Expo environment stubs still
 * run first. It registers the AsyncStorage mock — see that file for why.
 */
module.exports = {
  ...expoPreset,
  setupFiles: [...expoPreset.setupFiles, '<rootDir>/jest.setup.js'],
  modulePaths: ['<rootDir>/node_modules'],
  transformIgnorePatterns: expoPreset.transformIgnorePatterns.map((pattern) =>
    pattern.startsWith('/node_modules/(?!(')
      ? pattern.replace('(?!(', '(?!(@noble|@walletconnect|')
      : pattern
  ),
  moduleNameMapper: {
    ...(expoPreset.moduleNameMapper ?? {}),
    '^@veil/agent/assets$': '<rootDir>/../../packages/agent/src/assets.ts',
    '^@stellar/stellar-sdk$': '<rootDir>/node_modules/@stellar/stellar-sdk',
    // The shared asset package lives outside the mobile app. Pin Babel helpers
    // to this app's install so resolution does not depend on repo-root modules.
    '^@babel/runtime/(.*)$': '<rootDir>/node_modules/@babel/runtime/$1',
  },
};
