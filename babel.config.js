module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Note: react-native-reanimated/plugin is configured automatically by
    // babel-preset-expo in SDK 54. Do not add it here (it breaks Reanimated v4).
  };
};
