/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#ff6b35",
          "orange-dark": "#c05a2b",
          teal: "#1a535c",
          cream: "#fff8f3",
          sand: "#f6efe7",
        },
      },
      boxShadow: {
        card: "0 10px 40px -12px rgba(45, 52, 54, 0.1)",
        "card-hover": "0 20px 50px -15px rgba(45, 52, 54, 0.16)",
      },
    },
  },
  plugins: [],
};
