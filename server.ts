import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("cecyte.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    user_name TEXT NOT NULL,
    video_url TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Seed data
  INSERT INTO experiences (user_name, user_role, content, image_url) 
  SELECT 'Juan Pérez', 'Alumno', 'Increíble mi primer mes en la empresa automotriz. He aprendido mucho sobre procesos de calidad.', 'https://picsum.photos/seed/dual1/800/600'
  WHERE NOT EXISTS (SELECT 1 FROM experiences);

  INSERT INTO experiences (user_name, user_role, content, image_url) 
  SELECT 'María García', 'Egresada', 'Gracias al Modelo Dual, hoy trabajo en la empresa donde hice mis prácticas. ¡Altamente recomendado!', 'https://picsum.photos/seed/dual2/800/600'
  WHERE NOT EXISTS (SELECT 1 FROM experiences WHERE user_name = 'María García');

  INSERT INTO videos (title, user_name, video_url, description)
  SELECT 'Mi primer día en Continental', 'Carlos Rodríguez', 'https://www.w3schools.com/html/mov_bbb.mp4', 'Un pequeño recorrido por las instalaciones.'
  WHERE NOT EXISTS (SELECT 1 FROM videos);
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  app.use(express.json());

  // API Routes
  app.get("/api/experiences", (req, res) => {
    const experiences = db.prepare("SELECT * FROM experiences ORDER BY created_at DESC").all();
    res.json(experiences);
  });

  app.post("/api/experiences", (req, res) => {
    const { user_name, user_role, content, image_url } = req.body;
    const info = db.prepare(
      "INSERT INTO experiences (user_name, user_role, content, image_url) VALUES (?, ?, ?, ?)"
    ).run(user_name, user_role, content, image_url);
    
    const newExperience = db.prepare("SELECT * FROM experiences WHERE id = ?").get(info.lastInsertRowid);
    io.emit("new_experience", newExperience);
    res.json(newExperience);
  });

  app.get("/api/videos", (req, res) => {
    const videos = db.prepare("SELECT * FROM videos ORDER BY created_at DESC").all();
    res.json(videos);
  });

  app.post("/api/videos", (req, res) => {
    const { title, user_name, video_url, description } = req.body;
    const info = db.prepare(
      "INSERT INTO videos (title, user_name, video_url, description) VALUES (?, ?, ?, ?)"
    ).run(title, user_name, video_url, description);
    
    const newVideo = db.prepare("SELECT * FROM videos WHERE id = ?").get(info.lastInsertRowid);
    io.emit("new_video", newVideo);
    res.json(newVideo);
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
