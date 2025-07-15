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
        light: {
          mainbg1: '#F4F2FF',
          mainbg2: '#E5D9FF',
          usermessage: '#FFFFFF',
          assistantmessage: '#DBFDF7',
          text: '#00000F',
        },
        dark: {
          mainbg1: '#1b1b1b',
          mainbg2: '#1C1C1C',
          usermessage: '#1C1C1C',
          assistantmessage: '#2D2D2D',
          text: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
} 