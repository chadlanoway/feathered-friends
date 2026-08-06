import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/feathered-friends/",

    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                adoption: resolve(__dirname, "adoption.html"),
                about: resolve(__dirname, "about.html"),
                volunteer: resolve(__dirname, "volunteer.html"),
                surrender: resolve(__dirname, "surrender.html"),
                birds: resolve(__dirname, "birds.html"),
                bird: resolve(__dirname, "bird.html"),

            },
        },
    },
});