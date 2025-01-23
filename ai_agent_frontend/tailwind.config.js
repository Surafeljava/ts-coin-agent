/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        tsPrimaryBlue: '#1698D5',
        tsDarkBg: '#1B1933',
        tsDarkBg2: '#2d2a56',
        tstheme1: '#bd2785',
        tstheme2: '#7f2f87',
        tstheme3: '#1698D5',
        tstheme4: '#0a74ba',
        tstheme5: '#514d9a'
      },
    },
  },
  plugins: [],
}

