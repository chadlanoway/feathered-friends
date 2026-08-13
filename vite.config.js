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
                adoptionForm: resolve(__dirname, "adoption-form.html"),
                dashboard: resolve(__dirname, "dashboard.html"),
                volunteerForm: resolve(__dirname, "volunteer-form.html"),
                boarding: resolve(__dirname, "boarding.html"),
                contact: resolve(__dirname, "contact.html"),
                faq: resolve(__dirname, "faq.html"),
                donate: resolve(__dirname, "donate.html"),

            },
        },
    },
});