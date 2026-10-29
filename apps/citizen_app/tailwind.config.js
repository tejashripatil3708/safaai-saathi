/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#111A14',
          text: '#14201A',
          muted: '#566259',
        },
        brand: {
          DEFAULT: '#1B7A3F',
          soft: '#E4F1DF',
          mid: '#6DB36F',
          leaf: '#B5CF8A',
        },
        accent: {
          DEFAULT: '#F0873A',
          strong: '#B34A0B',
          soft: '#FFEBD9',
        },
        page: {
          bg: '#F3F6F2',
          surface: '#FFFFFF',
          muted: '#E9F1E6',
          border: '#DCE5D9',
          borderStrong: '#74897A',
        },
        status: {
          received: {
            fill: '#B87800',
            soft: '#FFF1D1',
            text: '#8A5A00',
          },
          assigned: {
            fill: '#2F6FDE',
            soft: '#E3EDFF',
            text: '#1D4FB8',
          },
          resolved: {
            fill: '#1E8E5A',
            soft: '#DDF3E4',
            text: '#146B3A',
          },
          escalated: {
            fill: '#D93025',
            soft: '#FDE3E0',
            text: '#B3261E',
          },
        }
      },
      borderRadius: {
        'card': '28px',
        'sheet': '32px',
        'control': '20px',
        'full': '9999px',
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans Gujarati', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'elev1': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'elev2': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'elev3': '0 12px 32px rgba(0, 0, 0, 0.16)',
      }
    },
  },
  plugins: [],
}
