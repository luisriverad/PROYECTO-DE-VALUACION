/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  // Estas clases se arman en tiempo de ejecución (text-${align}) y el scanner no las ve.
  safelist: ["text-left", "text-right", "text-center"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2225",
        profit: "#71B248",
        grafito: "#3C4045",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
