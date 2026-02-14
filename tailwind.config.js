import defaultTheme from "tailwindcss/defaultTheme";
import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
        "./storage/framework/views/*.php",
        "./resources/views/**/*.blade.php",
        "./resources/js/**/*.jsx",
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ["Figtree", ...defaultTheme.fontFamily.sans],
            },
            maxWidth: {
                "4xl": "56rem",
                "5xl": "64rem",
                "6xl": "72rem",
                "8xl": "90rem", // 1440px
                "9xl": "100rem", // 1600px
                "10xl": "110rem", // 1700px
                "11xl": "120rem", // 1800px
            },
        },
    },

    plugins: [forms],
};
