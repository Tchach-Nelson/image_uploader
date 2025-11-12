import express from "express";
import multer from "multer";
import sharp from "sharp";
import cors from "cors";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const app = express();
const __dirname = path.resolve();

// --- Middleware CORS ---
app.use(cors());
app.use(express.static("uploads")); // pour servir les fichiers

// --- Connexion MySQL ---
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "ciop_uploader",
  waitForConnections: true,
  connectionLimit: 10,  //pour ne plus perdre la connexion
  queueLimit: 0
});
console.log("✅ Connecté à MySQL");

// --- Configuration de multer ---
const storage = multer.memoryStorage(); // garde l’image en mémoire
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Fichier non valide. Images uniquement."));
    }
    cb(null, true);
  },
});

// --- Dossier uploads ---
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// --- Route d’upload ---
app.post("/upload", upload.single("images"), async (req, res) => {
  try {
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const outputPath = path.join("uploads", fileName);

    // Redimensionner l’image (max 800px)
    await sharp(req.file.buffer)
      .resize(800, 500) // 👈 Modifier ici : largeur, hauteur
      .toFile(outputPath);

    // Récupère la taille du fichier enregistré
    const stats = fs.statSync(outputPath);
    const taille = stats.size; // en octets
    const url = `http://localhost:3000/${fileName}`;

    // --- Enregistrement en base ---
    await db.execute(
      `INSERT INTO images (file_name, url, width, height, taille) VALUES (?, ?, ?, ?, ?)`,
      [fileName, url, 800, 800, taille]
    );

    res.json({
      success: true,
      url: `http://localhost:3000/${fileName}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// --- LISTER LES IMAGES ---
app.get("/images", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM images ORDER BY uploaded_at DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la récupération des images" });
  }
});

// --- SUPPRIMER UNE IMAGE ---
app.delete("/images/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l’image pour supprimer aussi le fichier
    const [rows] = await db.execute("SELECT file_name FROM images WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Image introuvable" });

    const filePath = path.join("./uploads", rows[0].file_name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Supprime le fichier

    // Supprime la ligne en base
    await db.execute("DELETE FROM images WHERE id = ?", [id]);

    res.json({ success: true, message: "Image supprimée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});




app.listen(3000, () => console.log("✅ Serveur démarré sur http://localhost:3000"));
