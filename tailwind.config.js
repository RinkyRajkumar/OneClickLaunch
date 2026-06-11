/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#09090b",
          900: "#111114",
          800: "#19191e",
          700: "#25252c"
        },
        accent: {
          300: "#8ff3d2",
          400: "#5de0b5",
          500: "#36c79a",
          600: "#25a980"
        }
      },
      boxShadow: {
        glow: "0 0 30px rgba(54, 199, 154, 0.16)"
      }
    }
  },
  plugins: []
};
