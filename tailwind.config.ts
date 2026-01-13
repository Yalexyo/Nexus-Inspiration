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
            },
            borderRadius: {
                lg: "0",
                md: "0",
                sm: "0",
                DEFAULT: "0",
            },
        },
    },
    plugins: [],
};
export default config;
