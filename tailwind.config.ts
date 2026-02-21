
import { fontFamily } from "tailwindcss/defaultTheme";
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        heading: ["Poppins", ...fontFamily.sans],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        corporate: {
          50: "hsl(214 100% 97%)",   /* #eff6ff convertido para HSL */
          100: "hsl(214 95% 93%)",   /* #dbeafe convertido para HSL */
          200: "hsl(213 97% 87%)",   /* #bfdbfe convertido para HSL */
          300: "hsl(213 94% 78%)",   /* #93c5fd convertido para HSL */
          400: "hsl(213 94% 68%)",   /* #60a5fa convertido para HSL */
          500: "hsl(218 91% 58%)",   /* #2563eb - cor principal da empresa */
          600: "hsl(218 91% 58%)",   /* Mantendo a cor consistente */
          700: "hsl(221 83% 53%)",   /* #1d4ed8 convertido para HSL */
          800: "hsl(217 91% 60%)",   /* #1e40af convertido para HSL */
          900: "hsl(220 91% 55%)",   /* #1e3a8a convertido para HSL */
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "client-sidebar": {
          DEFAULT: "hsl(var(--client-sidebar))",
          foreground: "hsl(var(--client-sidebar-foreground))",
          accent: "hsl(var(--client-sidebar-accent))",
          "accent-foreground": "hsl(var(--client-sidebar-accent-foreground))",
          border: "hsl(var(--client-sidebar-border))",
          muted: "hsl(var(--client-sidebar-muted))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out": {
          "0%": {
            opacity: "1",
            transform: "translateY(0)",
          },
          "100%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
        },
        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-down": {
          "0%": {
            opacity: "0",
            transform: "translateY(-30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-left": {
          "0%": {
            opacity: "0",
            transform: "translateX(30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "slide-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(-30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "zoom-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.8)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        "fade-in-delayed": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "60%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        // Novas animações avançadas
        "bounce-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.3) translateY(50px)",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.1) translateY(-10px)",
          },
          "70%": {
            transform: "scale(0.9) translateY(0)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1) translateY(0)",
          },
        },
        "rotate-in": {
          "0%": {
            opacity: "0",
            transform: "rotate(-45deg) scale(0.8)",
          },
          "100%": {
            opacity: "1",
            transform: "rotate(0deg) scale(1)",
          },
        },
        "flip-in": {
          "0%": {
            opacity: "0",
            transform: "rotateY(-90deg) scale(0.8)",
          },
          "100%": {
            opacity: "1",
            transform: "rotateY(0deg) scale(1)",
          },
        },
        "slide-in-blur": {
          "0%": {
            opacity: "0",
            transform: "translateX(-100px)",
            filter: "blur(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
            filter: "blur(0px)",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 5px rgba(37, 99, 235, 0.5)",
          },
          "50%": {
            boxShadow: "0 0 20px rgba(37, 99, 235, 0.8), 0 0 30px rgba(37, 99, 235, 0.6)",
          },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
        "swing": {
          "20%": { transform: "rotate(15deg)" },
          "40%": { transform: "rotate(-10deg)" },
          "60%": { transform: "rotate(5deg)" },
          "80%": { transform: "rotate(-5deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "curtain": {
          "0%": {
            clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)",
          },
          "100%": {
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          },
        },
        "typewriter": {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        "blink": {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.3s ease-out",
        "accordion-up": "accordion-up 0.3s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "fade-out": "fade-out 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-up": "slide-up 0.6s ease-out",
        "slide-down": "slide-down 0.6s ease-out",
        "slide-left": "slide-left 0.6s ease-out",
        "slide-right": "slide-right 0.6s ease-out",
        "zoom-in": "zoom-in 0.5s ease-out",
        "fade-in-delayed": "fade-in-delayed 1s ease-out",
        "slide-up-delayed": "slide-up 0.8s ease-out 0.2s both",
        "slide-up-delayed-2": "slide-up 0.8s ease-out 0.4s both",
        "slide-up-delayed-3": "slide-up 0.8s ease-out 0.6s both",
        // Novas animações
        "bounce-in": "bounce-in 0.8s ease-out",
        "rotate-in": "rotate-in 0.6s ease-out",
        "flip-in": "flip-in 0.7s ease-out",
        "slide-in-blur": "slide-in-blur 0.8s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shake": "shake 0.6s ease-in-out",
        "swing": "swing 1s ease-in-out",
        "float": "float 3s ease-in-out infinite",
        "curtain": "curtain 1.2s ease-out",
        "typewriter": "typewriter 2s steps(20) 1s both",
        "blink": "blink 1s step-end infinite",
      },
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
