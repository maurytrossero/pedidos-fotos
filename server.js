const express = require('express');
const path = require('path');

const app = express();
const DIST_DIR = path.join(__dirname, 'dist');

// 1️⃣ Servir archivos estáticos
app.use(express.static(DIST_DIR));

// 2️⃣ Redirigir todas las rutas SPA (history mode) a index.html
app.use((req, res, next) => {
  // Solo para rutas GET que no sean archivos existentes
  if (req.method === 'GET' && !req.path.includes('.')) {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  } else {
    next();
  }
});

// 3️⃣ Levantar servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
