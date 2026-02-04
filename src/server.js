// ========================================
// server.js - Punto de entrada de la aplicación
// ========================================

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3000;

const checkDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a MySQL exitosa');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al conectar a MySQL:', error.message);
    return false;
  }
};

const startServer = async () => {
  const isDbConnected = await checkDatabaseConnection();
  
  if (!isDbConnected) {
    console.error('No se pudo conectar a la base de datos. Verifica la configuración.');
    process.exit(1);
  }

  // Iniciar servidor
  app.listen(PORT, () => {
    console.log('');
    console.log('====================================');
    console.log(`   MyShopLi corriendo en puerto ${PORT}`);
    console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log('====================================');
    console.log('');
    console.log('Endpoints disponibles:');
    console.log(`   POST http://localhost:${PORT}/api/auth/register`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log('');
  });
};

// ========================================
// MANEJO DE ERRORES NO CAPTURADOS
// ========================================

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⚠️  SIGINT recibido. Cerrando servidor...');
  await pool.end();
  process.exit(0);
});

// Iniciar aplicación
startServer();