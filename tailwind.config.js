/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
  
    theme: {
      extend: {
        gridTemplateColumns: {
          24: "repeat(24, minmax(100px, 1fr))",
        },
      },
    },
  
    plugins: [],
  };