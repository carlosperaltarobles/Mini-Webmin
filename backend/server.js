/**
 * La Chanchona - Backend Server
 * Servidor Express para administración de usuarios y grupos en Linux
 */

import express from 'express';
import cors from 'cors';
import apiRoutes from './src/routes/api.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite dev server
  credentials: true
}));
app.use(express.json());

// Rutas de la API
app.use('/api', apiRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'La Chanchona está corriendo 🐷' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Error interno del servidor'
  });
});

// Manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Ruta no encontrada'
  });
});

app.listen(PORT, () => {
  console.log(`
  🐷 La Chanchona Backend
  ========================
  Servidor corriendo en: http://localhost:${PORT}
  Health check: http://localhost:${PORT}/health
  API base: http://localhost:${PORT}/api
  `);
});
