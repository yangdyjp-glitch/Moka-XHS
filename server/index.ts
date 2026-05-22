import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers/index.js";
import { createContext, verifyUploadAuth } from "./_core/trpc.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(UPLOADS_DIR));

// File upload endpoint
app.post("/api/upload", async (req, res) => {
  try {
    const user = await verifyUploadAuth(req);
    if (!user) {
      res.status(401).json({ error: "请先登录" });
      return;
    }

    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      const contentType = req.headers["content-type"] || "";

      if (!contentType.startsWith("image/")) {
        res.status(400).json({ error: "只支持上传图片" });
        return;
      }

      const ext = contentType.split("/")[1]?.split(";")[0] || "png";
      const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filepath, body);
      res.json({ url: `/uploads/${filename}` });
    });
  } catch {
    res.status(500).json({ error: "上传失败" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => createContext(req, res),
  })
);

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const clientDist = path.resolve(__dirname, "../dist/client");
    app.use(express.static(clientDist));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
    console.log(`[Compass] Serving production build from ${clientDist}`);
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, "../vite.config.ts"),
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      try {
        const htmlPath = path.resolve(__dirname, "../client/index.html");
        let html = fs.readFileSync(htmlPath, "utf-8");
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const host = process.env.HOST || "0.0.0.0";
  app.listen(PORT, host, () => {
    console.log(`[Compass] Server running at http://${host}:${PORT} (${process.env.NODE_ENV || "development"})`);
  });
}

startServer();
