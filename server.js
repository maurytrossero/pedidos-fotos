const express = require('express');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

// ⚡ Configuración Cloudinary
cloudinary.config({
  cloud_name: "dqnpmxts5",
  api_key: "533987243254169",
  api_secret: "w3qIvl8k1GZ4Ug2uYVcdthcCp6U",
});

const app = express();
const DIST_DIR = path.join(__dirname, 'dist');

// 👇 Necesario para leer JSON
app.use(express.json());

// ⚡ Endpoint para eliminar en Cloudinary
app.post('/api/cloudinary/eliminar', async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ error: 'Falta publicId' });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    res.json({ ok: true, result });
  } catch (err) {
    console.error('Error eliminando en Cloudinary:', err);
    res.status(500).json({ error: 'Error eliminando en Cloudinary' });
  }
});

// 🔹 Servir frontend
app.use(express.static(DIST_DIR));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.')) {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  } else {
    next();
  }
});

// 🚀 Levantar server
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
);
