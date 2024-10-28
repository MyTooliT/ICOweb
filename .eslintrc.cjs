module.exports = {
  extends: ['plugin:vue/vue3-recommended', '@vue/eslint-config-typescript'],
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    'max-len': ['warn', 80],
    'quotes': ['error', 'single'],
    'vue/multi-word-component-names': 'off',
    'vue/object-curly-spacing': [2, 'always'],
    'vue/html-closing-bracket-spacing': [
      2,
      {
        selfClosingTag: 'always',
      },
    ],
    'vue/html-closing-bracket-newline': 'off'
  }
};
