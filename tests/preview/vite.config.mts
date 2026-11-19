import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  define: { "process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY": JSON.stringify("") },
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../public", import.meta.url)),
  resolve: {
    alias: [
      {
        find: "next/navigation",
        replacement: fileURLToPath(new URL("./router.tsx", import.meta.url)),
      },
      {
        find: "next/link",
        replacement: fileURLToPath(new URL("./link.tsx", import.meta.url)),
      },
      {
        find: "next/image",
        replacement: fileURLToPath(new URL("./image.tsx", import.meta.url)),
      },
      {
        find: "@clerk/nextjs",
        replacement: fileURLToPath(new URL("./clerk.tsx", import.meta.url)),
      },
      {
        find: "@/lib/actions/question.action",
        replacement: fileURLToPath(new URL("./actions.ts", import.meta.url)),
      },
      {
        find: "@/lib/actions/answer.action",
        replacement: fileURLToPath(new URL("./actions.ts", import.meta.url)),
      },
      {
        find: "@/lib/actions/user.action",
        replacement: fileURLToPath(new URL("./actions.ts", import.meta.url)),
      },
      {
        find: "@/lib/actions/general.action",
        replacement: fileURLToPath(new URL("./actions.ts", import.meta.url)),
      },
      {
        find: "@/lib/actions/interaction.action",
        replacement: fileURLToPath(new URL("./actions.ts", import.meta.url)),
      },
      {
        find: "@/lib/api/google",
        replacement: fileURLToPath(new URL("./actions.ts", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("../..", import.meta.url)),
      },
    ],
  },
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
  esbuild: { jsx: "automatic" },
});
