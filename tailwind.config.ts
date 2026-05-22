import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans JP", "sans-serif"],
        display: ["Bebas Neue", "sans-serif"],
      },
      colors: {
        ink: {
          900: "#0F0A1F",
          800: "#1A1035",
          700: "#261845",
          600: "#3D2B6B",
          500: "#6B7280",
          400: "#9CA3AF",
          300: "#D1D5DB",
          200: "#E5E7EB",
          100: "#F3F4F6",
        },
        brand: {
          purple: "#6B46C1",
          pink: "#EC4899",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #6B46C1, #EC4899)",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "16px",
        xl: "20px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.3)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
        "glow-pink": "0 0 20px rgba(236,72,153,0.4)",
        "glow-purple": "0 0 20px rgba(107,70,193,0.4)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(16px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
