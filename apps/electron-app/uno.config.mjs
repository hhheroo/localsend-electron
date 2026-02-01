import { defineConfig, presetWind4 } from 'unocss';

export default defineConfig({
  presets: [presetWind4()],
  theme: {
    colors: {
      primary: '#1b8b7d',
      'primary-light': '#c5e0dc',
      'sidebar-bg': '#e8eeed',
      'content-bg': '#f5f7f7'
    },
    fontFamily: {
      mono: [
        'JetBrains Mono',
        'Fira Code',
        'SF Mono',
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace'
      ]
    }
  }
});
