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

// ⚡ Endpoints API
app.post('/api/cloudinary/eliminar', async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ error: 'Falta publicId' });

    const result = await cloudinary.uploader.destroy(publicId);
    res.json({ ok: true, result });
  } catch (err) {
    console.error('Error eliminando en Cloudinary:', err);
    res.status(500).json({ error: 'Error eliminando en Cloudinary' });
  }
});

// 🔹 Servir frontend (SPA)
app.use(express.static(DIST_DIR));

// Todas las rutas que no sean API y no tengan extensión van al index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});


// 🚀 Levantar server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
