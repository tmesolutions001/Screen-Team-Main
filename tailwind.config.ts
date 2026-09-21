import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				glass: {
					DEFAULT: 'var(--glass-fill)',
					hover: 'var(--glass-fill-hover)',
					strong: 'var(--glass-fill-strong)',
					border: 'var(--glass-border)',
					'border-strong': 'var(--glass-border-strong)'
				},
				ok: 'var(--ok)',
				miss: 'var(--miss)'
			},
			fontFamily: {
				sans: ['var(--font-sans)'],
				mono: ['var(--font-mono)']
			},
			borderRadius: {
				glass: 'var(--radius)',
				pill: 'var(--radius-pill)'
			},
			backdropBlur: {
				glass: 'var(--glass-blur)',
				'glass-strong': 'var(--glass-blur-strong)'
			},
			boxShadow: {
				glass: 'var(--glass-shadow)',
				'glow-accent': '0 0 40px -8px var(--accent-2), inset 0 1px 0 var(--glass-highlight)',
				'glow-ok': '0 0 32px -6px var(--ok), inset 0 1px 0 var(--glass-highlight)',
				'glow-miss': '0 0 32px -6px var(--miss), inset 0 1px 0 var(--glass-highlight)'
			}
		}
	},
	plugins: [],
} satisfies Config;
