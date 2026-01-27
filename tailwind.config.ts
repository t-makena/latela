
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px"
			}
		},
	extend: {
			fontFamily: {
				'cooper': ['Cooper BT', 'serif'],
			},
			fontSize: {
				'heading-main': 'var(--text-heading-main)',
				'heading-card': 'var(--text-heading-card)',
				'balance-primary': 'var(--text-balance-primary)',
				'balance-secondary': 'var(--text-balance-secondary)',
				'label': 'var(--text-label)',
				'table-header': 'var(--text-table-header)',
				'table-body': 'var(--text-table-body)',
				'percentage': 'var(--text-percentage)',
				'transaction': 'var(--text-transaction)',
				'transaction-date': 'var(--text-transaction-date)',
				'chart-axis': 'var(--text-chart-axis)',
				'chart-legend': 'var(--text-chart-legend)',
				'button': 'var(--text-button)',
				'pie-percentage': 'var(--text-pie-percentage)',
			},
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))"
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))"
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))"
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))"
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))"
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))"
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))"
				},
				// Semantic text colors
				'text-primary': "hsl(var(--color-text-primary))",
				'text-secondary': "hsl(var(--color-text-secondary))",
				'text-muted': "hsl(var(--color-text-muted))",
				'text-faint': "hsl(var(--color-text-faint))",
				'positive': "hsl(var(--color-positive))",
				'negative': "hsl(var(--color-negative))",
				// Budget app specific colors
				budget: {
					primary: "#000000",
					secondary: "#41b883",
					expense: "#f85f00",
					income: "#000000",
					neutral: "#6c757d",
					dark: "#2d3748",
					light: "#f8fafc"
				}
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)"
			},
			keyframes: {
				"accordion-down": {
					from: {
						height: "0"
					},
					to: {
						height: "var(--radix-accordion-content-height)"
					}
				},
				"accordion-up": {
					from: {
						height: "var(--radix-accordion-content-height)"
					},
					to: {
						height: "0"
					}
				},
				"fade-in": {
					from: {
						opacity: "0"
					},
					to: {
						opacity: "1"
					}
				},
				"fade-in-up": {
					from: {
						opacity: "0",
						transform: "translateY(8px)"
					},
					to: {
						opacity: "1",
						transform: "translateY(0)"
					}
				},
				"slide-down": {
					from: {
						opacity: "0",
						maxHeight: "0",
						transform: "translateY(-8px)"
					},
					to: {
						opacity: "1",
						maxHeight: "500px",
						transform: "translateY(0)"
					}
				},
				"scale-fade-in": {
					from: {
						opacity: "0",
						transform: "scale(0.97)"
					},
					to: {
						opacity: "1",
						transform: "scale(1)"
					}
				},
				"bounce-in": {
					"0%": {
						opacity: "0",
						transform: "scale(0)"
					},
					"50%": {
						transform: "scale(1.2)"
					},
					"100%": {
						opacity: "1",
						transform: "scale(1)"
					}
				},
				"glow-pulse": {
					"0%, 100%": {
						boxShadow: "0 0 4px hsl(var(--primary) / 0.4)"
					},
					"50%": {
						boxShadow: "0 0 16px hsl(var(--primary) / 0.6)"
					}
				},
				"ping-slow": {
					"75%, 100%": {
						transform: "scale(2)",
						opacity: "0"
					}
				}
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"fade-in": "fade-in 0.3s ease-in-out",
				"fade-in-up": "fade-in-up 0.4s ease-out forwards",
				"slide-down": "slide-down 0.3s ease-out forwards",
				"scale-fade-in": "scale-fade-in 0.3s ease-out forwards",
				"bounce-in": "bounce-in 0.4s ease-out forwards",
				"glow-pulse": "glow-pulse 2s ease-in-out infinite",
				"ping-slow": "ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite"
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
