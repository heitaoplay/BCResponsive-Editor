import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// GitHub Pages 部署在 /BCResponsive-Editor/ 子路径下
export default defineConfig({
    base: "/BCResponsive-Editor/",
    plugins: [react()],
    build: {
        outDir: "dist",
    },
});
