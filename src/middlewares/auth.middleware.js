const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // 1. Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    // 2. Verificar formato "Bearer TOKEN"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer {token}'
      });
    }

    const token = parts[1];

    // 3. Verificar y decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    // 5. Continuar con la siguiente función
    next();

  } catch (error) {
    // Manejar diferentes tipos de errores de JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor inicie sesión nuevamente'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Error genérico
    return res.status(401).json({
      success: false,
      message: 'Error de autenticación'
    });
  }
};

module.exports = authMiddleware;