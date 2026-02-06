const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const User = require('../models/user.model');

// Utilidad para logs en formato JSON
const logJSON = (label, data) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    label: label,
    data: data
  }, null, 2));
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    logJSON('🔵 REGISTER - Inicio', {
      endpoint: '/api/auth/register',
      method: 'POST',
      body: {
        name: req.body.name,
        email: req.body.email,
        passwordLength: req.body.password?.length
      }
    });

    const { name, email, password } = req.body;

    // 1. Validar que todos los campos estén presentes
    if (!name || !email || !password) {
      logJSON('🔴 REGISTER - Validación fallida', {
        error: 'Campos faltantes',
        received: { name: !!name, email: !!email, password: !!password }
      });
      
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // 2. Validar nombre (mínimo 2 caracteres)
    if (name.trim().length < 2) {
      logJSON('🔴 REGISTER - Validación fallida', {
        error: 'Nombre muy corto',
        nameLength: name.trim().length
      });
      
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    // 3. Validar formato de email
    if (!isValidEmail(email)) {
      logJSON('🔴 REGISTER - Validación fallida', {
        error: 'Email inválido',
        email: email
      });
      
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    // 4. Validar contraseña (mínimo 6 caracteres)
    if (!isValidPassword(password)) {
      logJSON('🔴 REGISTER - Validación fallida', {
        error: 'Contraseña muy corta',
        passwordLength: password.length
      });
      
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // 5. Verificar si el email ya existe
    logJSON('🔍 REGISTER - Verificando email existente', {
      email: email.toLowerCase()
    });
    
    const existingUser = await User.findByEmail(email.toLowerCase());
    
    if (existingUser) {
      logJSON('🔴 REGISTER - Email duplicado', {
        email: email.toLowerCase(),
        existingUserId: existingUser.id
      });
      
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    logJSON('✅ REGISTER - Email disponible', {
      email: email.toLowerCase()
    });

    // 6. Hash de la contraseña
    logJSON('🔐 REGISTER - Generando hash de contraseña', {
      algorithm: 'bcrypt',
      rounds: 10
    });
    
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Crear usuario
    const userId = uuid();
    
    logJSON('💾 REGISTER - Creando usuario en BD', {
      userId: userId,
      name: name.trim(),
      email: email.toLowerCase()
    });
    
    await User.create(
      userId,
      name.trim(),
      email.toLowerCase(),
      hashedPassword
    );

    logJSON('✅ REGISTER - Usuario creado exitosamente', {
      userId: userId
    });

    // 8. Generar token JWT
    logJSON('🎫 REGISTER - Generando token JWT', {
      userId: userId,
      expiresIn: '7d'
    });
    
    const token = jwt.sign(
      { id: userId, email: email.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 9. Respuesta exitosa
    const responseData = {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase(),
      token: token.substring(0, 20) + '...' // Solo primeros 20 caracteres para el log
    };

    logJSON('✅ REGISTER - Registro completado exitosamente', {
      userId: userId,
      email: email.toLowerCase()
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase(),
        token
      }
    });

  } catch (error) {
    logJSON('❌ REGISTER - Error del servidor', {
      errorMessage: error.message,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    logJSON('🔵 LOGIN - Inicio', {
      endpoint: '/api/auth/login',
      method: 'POST',
      body: {
        email: req.body.email,
        passwordProvided: !!req.body.password
      }
    });

    const { email, password } = req.body;

    // 1. Validar que todos los campos estén presentes
    if (!email || !password) {
      logJSON('🔴 LOGIN - Validación fallida', {
        error: 'Campos faltantes',
        received: { email: !!email, password: !!password }
      });
      
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // 2. Validar formato de email
    if (!isValidEmail(email)) {
      logJSON('🔴 LOGIN - Validación fallida', {
        error: 'Email inválido',
        email: email
      });
      
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    // 3. Buscar usuario por email
    logJSON('🔍 LOGIN - Buscando usuario', {
      email: email.toLowerCase()
    });
    
    const user = await User.findByEmail(email.toLowerCase());
    
    if (!user) {
      logJSON('🔴 LOGIN - Usuario no encontrado', {
        email: email.toLowerCase()
      });
      
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    logJSON('✅ LOGIN - Usuario encontrado', {
      userId: user.id,
      email: user.email
    });

    // 4. Verificar contraseña
    logJSON('🔐 LOGIN - Verificando contraseña', {
      userId: user.id
    });
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      logJSON('🔴 LOGIN - Contraseña incorrecta', {
        userId: user.id,
        email: user.email
      });
      
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    logJSON('✅ LOGIN - Contraseña válida', {
      userId: user.id
    });

    // 5. Generar token JWT
    logJSON('🎫 LOGIN - Generando token JWT', {
      userId: user.id,
      expiresIn: '7d'
    });
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 6. Respuesta exitosa
    logJSON('✅ LOGIN - Inicio de sesión exitoso', {
      userId: user.id,
      email: user.email,
      name: user.name
    });

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token
      }
    });

  } catch (error) {
    logJSON('❌ LOGIN - Error del servidor', {
      errorMessage: error.message,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    logJSON('🔵 GET PROFILE - Inicio', {
      endpoint: '/api/auth/profile',
      method: 'GET',
      userId: req.user.id
    });

    const user = await User.findById(req.user.id);
    
    if (!user) {
      logJSON('🔴 GET PROFILE - Usuario no encontrado', {
        userId: req.user.id
      });
      
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    logJSON('✅ GET PROFILE - Perfil obtenido', {
      userId: user.id,
      email: user.email,
      name: user.name
    });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    logJSON('❌ GET PROFILE - Error del servidor', {
      errorMessage: error.message,
      userId: req.user?.id
    });
    
    console.error('Error en getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
};