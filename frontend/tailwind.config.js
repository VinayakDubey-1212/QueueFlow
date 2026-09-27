/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0D1F1B',
          soft: '#15302A',
          line: '#264039',
        },
        paper: {
          DEFAULT: '#EFEBE1',
          soft: '#F6F3EC',
          line: '#DCD5C4',
        },
        amber: {
          DEFAULT: '#FFB300',
          soft: '#FFD166',
          dim: '#8A5E00',
        },
        confirm: '#2FB673',
        alert: '#E5484D',
        muteOnDark: '#9FB3AC',
        muteOnLight: '#5B6B63',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        panel: '18px',
        chip: '999px',
      },
    },
  },
  plugins: [],
};
