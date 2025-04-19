/** @type {import('tailwindcss').Config} */
        export default {
          content: [
            "./index.html",
            "./src/**/*.{js,ts,jsx,tsx}",
          ],
          theme: {
            extend: {
              colors: {
                primary: '#6366F1', // Indigo-500
                secondary: '#EC4899', // Pink-500
                background: '#F9FAFB', // Gray-50
                card: '#FFFFFF',
                textPrimary: '#1F2937', // Gray-800
                textSecondary: '#6B7280', // Gray-500
                correct: '#10B981', // Emerald-500
                incorrect: '#EF4444', // Red-500
              },
              fontFamily: {
                sans: ['Inter', 'sans-serif'],
              },
            },
          },
          plugins: [],
        }
