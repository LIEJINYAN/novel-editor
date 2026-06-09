/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: 'var(--editor-bg)',
          sidebar: 'var(--editor-sidebar)',
          surface: 'var(--editor-surface)',
          border: 'var(--editor-border)',
          text: 'var(--editor-text)',
          muted: 'var(--editor-muted)',
          accent: 'var(--editor-accent)',
          green: 'var(--editor-green)',
          red: 'var(--editor-red)',
        }
      }
    },
  },
  darkMode: 'class',
  plugins: [],
}
