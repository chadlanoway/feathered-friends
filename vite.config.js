import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/feathered-friends/",

    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                adoption: resolve(__dirname, "adoption.html"),
                about: resolve(__dirname, "about.html")
            },
        },
    },
});