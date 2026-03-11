import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                accent: "var(--accent)",
                muted: "var(--muted)",
                border: "var(--border)",
                indigo: {
                    50: '#fdf3f3',
                    100: '#fce4e4',
                    200: '#fbcdcc',
                    300: '#f7a9a6',
                    400: '#f07672',
                    500: '#e64c45',
                    600: '#c0392b',
                    700: '#a52f24',
                    800: '#882a21',
                    900: '#712921',
                    950: '#3d110d',
                },
            },
            borderRadius: {
                sm: '2px',
                DEFAULT: '4px',
                md: '4px',
                lg: '6px',
                xl: '8px',
                '2xl': '10px',
                '3xl': '12px',
            },
        },
    },
    plugins: [],
};
export default config;
