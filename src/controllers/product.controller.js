const { v4: uuid } = require('uuid');
const Product = require('../models/product.model');

// Utilidad para logs en formato JSON
const logJSON = (label, data) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    label: label,
    data: data
  }, null, 2));
};

// Categorías válidas
const VALID_CATEGORIES = [
  'Frutas y Verduras',
  'Lácteos',
  'Carnes y Pescados',
  'Panadería',
  'Limpieza',
  'Bebidas',
  'Despensa',
  'Congelados',
  'Higiene Personal',
  'Otros'
];

/**
 * @route   GET /api/products
 * @desc    Obtener lista de productos del usuario
 * @access  Private
 */
exports.getProducts = async (req, res) => {
  try {
    logJSON('🔵 GET PRODUCTS - Inicio', {
      endpoint: '/api/products',
      method: 'GET',
      userId: req.user.id,
      description: 'Obteniendo solo productos pendientes (no comprados)'
    });

    // Llamamos al método que obtiene productos donde is_purchased = false
    const products = await Product.findAllByUser(req.user.id);

    logJSON('✅ GET PRODUCTS - Éxito', {
      userId: req.user.id,
      count: products.length,
      status: 'Pendientes obtenidos correctamente'
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    logJSON('❌ GET PRODUCTS - Error', {
      errorMessage: error.message,
      userId: req.user?.id,
      stack: error.stack
    });

    console.error('Error en getProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos pendientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Obtener un producto específico
 * @access  Private
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    logJSON('🔵 GET PRODUCT BY ID - Inicio', {
      endpoint: `/api/products/${id}`,
      method: 'GET',
      productId: id,
      userId: req.user.id
    });

    const product = await Product.findById(id, req.user.id);

    if (!product) {
      logJSON('🔴 GET PRODUCT BY ID - Producto no encontrado', {
        productId: id,
        userId: req.user.id
      });
      
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    logJSON('✅ GET PRODUCT BY ID - Producto encontrado', {
      productId: product.id,
      name: product.name,
      category: product.category
    });

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    logJSON('❌ GET PRODUCT BY ID - Error del servidor', {
      errorMessage: error.message,
      productId: req.params.id
    });
    
    console.error('Error en getProductById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto'
    });
  }
};

/**
 * @route   POST /api/products
 * @desc    Agregar producto a la lista
 * @access  Private
 */
exports.addProduct = async (req, res) => {
  try {
    const { name, category, estimatedPrice } = req.body;

    logJSON('🔵 ADD PRODUCT - Inicio', {
      endpoint: '/api/products',
      method: 'POST',
      userId: req.user.id,
      body: { name, category, estimatedPrice }
    });

    // 1. Validar campos requeridos
    if (!name || !category || estimatedPrice === undefined) {
      logJSON('🔴 ADD PRODUCT - Validación fallida', {
        error: 'Campos faltantes',
        received: { name: !!name, category: !!category, estimatedPrice: estimatedPrice !== undefined }
      });
      
      return res.status(400).json({
        success: false,
        message: 'Nombre, categoría y precio estimado son requeridos'
      });
    }

    // 2. Validar nombre (mínimo 2 caracteres)
    if (name.trim().length < 2) {
      logJSON('🔴 ADD PRODUCT - Validación fallida', {
        error: 'Nombre muy corto',
        nameLength: name.trim().length
      });
      
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    // 3. Validar categoría
    if (!VALID_CATEGORIES.includes(category)) {
      logJSON('🔴 ADD PRODUCT - Validación fallida', {
        error: 'Categoría inválida',
        receivedCategory: category,
        validCategories: VALID_CATEGORIES
      });
      
      return res.status(400).json({
        success: false,
        message: 'Categoría no válida',
        validCategories: VALID_CATEGORIES
      });
    }

    // 4. Validar precio (debe ser número positivo)
    const price = parseFloat(estimatedPrice);
    if (isNaN(price) || price < 0) {
      logJSON('🔴 ADD PRODUCT - Validación fallida', {
        error: 'Precio inválido',
        receivedPrice: estimatedPrice,
        parsedPrice: price
      });
      
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número positivo'
      });
    }

    // 5. Verificar que el producto no esté duplicado
    logJSON('🔍 ADD PRODUCT - Verificando duplicados', {
      userId: req.user.id,
      name: name.trim(),
      category
    });
    
    const existingProduct = await Product.findByNameAndCategory(
      req.user.id,
      name.trim(),
      category
    );

    if (existingProduct) {
      logJSON('🔴 ADD PRODUCT - Producto duplicado', {
        existingProductId: existingProduct.id,
        name: name.trim(),
        category
      });
      
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con ese nombre en esta categoría'
      });
    }

    // 6. Crear producto
    const productId = uuid();
    
    logJSON('💾 ADD PRODUCT - Creando producto en BD', {
      productId,
      userId: req.user.id,
      name: name.trim(),
      category,
      price
    });
    
    await Product.create(
      productId,
      req.user.id,
      name.trim(),
      category,
      price
    );

    // 7. Obtener el producto creado
    const newProduct = await Product.findById(productId, req.user.id);

    logJSON('✅ ADD PRODUCT - Producto creado exitosamente', {
      productId: newProduct.id,
      name: newProduct.name,
      category: newProduct.category,
      estimatedPrice: newProduct.estimated_price
    });

    res.status(201).json({
      success: true,
      message: 'Producto agregado a la lista',
      data: newProduct
    });

  } catch (error) {
    logJSON('❌ ADD PRODUCT - Error del servidor', {
      errorMessage: error.message,
      userId: req.user?.id,
      body: req.body
    });
    
    console.error('Error en addProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   PATCH /api/products/:id/toggle
 * @desc    Marcar/desmarcar producto como comprado
 * @access  Private
 */
exports.togglePurchased = async (req, res) => {
  try {
    const { id } = req.params;

    logJSON('🔵 TOGGLE PURCHASED - Inicio', {
      endpoint: `/api/products/${id}/toggle`,
      method: 'PATCH',
      productId: id,
      userId: req.user.id
    });

    // 1. Verificar que el producto existe
    const product = await Product.findById(id, req.user.id);
    
    if (!product) {
      logJSON('🔴 TOGGLE PURCHASED - Producto no encontrado', {
        productId: id,
        userId: req.user.id
      });
      
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    logJSON('🔄 TOGGLE PURCHASED - Alternando estado', {
      productId: id,
      currentState: product.is_purchased,
      newState: !product.is_purchased
    });

    // 2. Alternar estado
    await Product.togglePurchased(id, req.user.id);

    // 3. Obtener producto actualizado
    const updatedProduct = await Product.findById(id, req.user.id);

    logJSON('✅ TOGGLE PURCHASED - Estado actualizado', {
      productId: updatedProduct.id,
      name: updatedProduct.name,
      isPurchased: updatedProduct.is_purchased
    });

    res.status(200).json({
      success: true,
      message: updatedProduct.is_purchased ? 'Producto marcado como comprado' : 'Producto marcado como pendiente',
      data: updatedProduct
    });

  } catch (error) {
    logJSON('❌ TOGGLE PURCHASED - Error del servidor', {
      errorMessage: error.message,
      productId: req.params.id
    });
    
    console.error('Error en togglePurchased:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del producto'
    });
  }
};

// Continúa con los demás métodos siguiendo el mismo patrón...

/**
 * @route   GET /api/products/stats
 * @desc    Obtener estadísticas de productos
 * @access  Private
 */
exports.getStats = async (req, res) => {
  try {
    const stats = await Product.getStats(req.user.id);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error en getStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar producto
 * @access  Private
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, estimatedPrice } = req.body;

    logJSON('🔵 UPDATE PRODUCT - Inicio', {
      endpoint: `/api/products/${id}`,
      method: 'PUT',
      productId: id,
      userId: req.user.id,
      body: { name, category, estimatedPrice }
    });

    // 1. Verificar que el producto existe y pertenece al usuario
    const existingProduct = await Product.findById(id, req.user.id);
    
    if (!existingProduct) {
      logJSON('🔴 UPDATE PRODUCT - Producto no encontrado', {
        productId: id,
        userId: req.user.id
      });
      
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    logJSON('✅ UPDATE PRODUCT - Producto encontrado', {
      productId: existingProduct.id,
      currentName: existingProduct.name,
      currentCategory: existingProduct.category,
      currentPrice: existingProduct.estimated_price,
      isPurchased: existingProduct.is_purchased
    });

    // 2. Verificar que el producto no haya sido comprado
    if (existingProduct.is_purchased) {
      logJSON('🔴 UPDATE PRODUCT - Producto ya comprado', {
        productId: id,
        name: existingProduct.name
      });
      
      return res.status(400).json({
        success: false,
        message: 'No se puede editar un producto que ya fue comprado'
      });
    }

    // 3. Preparar datos a actualizar
    const updateData = {
      name: name ? name.trim() : existingProduct.name,
      category: category || existingProduct.category,
      estimatedPrice: estimatedPrice !== undefined ? parseFloat(estimatedPrice) : existingProduct.estimated_price
    };

    logJSON('📝 UPDATE PRODUCT - Datos a actualizar', {
      productId: id,
      newName: updateData.name,
      newCategory: updateData.category,
      newPrice: updateData.estimatedPrice
    });

    // 4. Validaciones
    if (updateData.name.length < 2) {
      logJSON('🔴 UPDATE PRODUCT - Validación fallida', {
        error: 'Nombre muy corto',
        nameLength: updateData.name.length
      });
      
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    if (!VALID_CATEGORIES.includes(updateData.category)) {
      logJSON('🔴 UPDATE PRODUCT - Validación fallida', {
        error: 'Categoría inválida',
        receivedCategory: updateData.category,
        validCategories: VALID_CATEGORIES
      });
      
      return res.status(400).json({
        success: false,
        message: 'Categoría no válida',
        validCategories: VALID_CATEGORIES
      });
    }

    if (isNaN(updateData.estimatedPrice) || updateData.estimatedPrice < 0) {
      logJSON('🔴 UPDATE PRODUCT - Validación fallida', {
        error: 'Precio inválido',
        receivedPrice: estimatedPrice,
        parsedPrice: updateData.estimatedPrice
      });
      
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número positivo'
      });
    }

    // 5. Verificar duplicados (si cambiaron nombre o categoría)
    if (updateData.name !== existingProduct.name || updateData.category !== existingProduct.category) {
      logJSON('🔍 UPDATE PRODUCT - Verificando duplicados', {
        newName: updateData.name,
        newCategory: updateData.category
      });

      const duplicate = await Product.findByNameAndCategory(
        req.user.id,
        updateData.name,
        updateData.category
      );

      if (duplicate && duplicate.id !== id) {
        logJSON('🔴 UPDATE PRODUCT - Producto duplicado', {
          duplicateProductId: duplicate.id,
          name: updateData.name,
          category: updateData.category
        });
        
        return res.status(400).json({
          success: false,
          message: 'Ya existe un producto con ese nombre en esta categoría'
        });
      }
    }

    // 6. Actualizar producto
    logJSON('💾 UPDATE PRODUCT - Actualizando en BD', {
      productId: id,
      userId: req.user.id
    });

    await Product.update(
      id,
      req.user.id,
      updateData.name,
      updateData.category,
      updateData.estimatedPrice
    );

    // 7. Obtener producto actualizado
    const updatedProduct = await Product.findById(id, req.user.id);

    logJSON('✅ UPDATE PRODUCT - Producto actualizado exitosamente', {
      productId: updatedProduct.id,
      name: updatedProduct.name,
      category: updatedProduct.category,
      estimatedPrice: updatedProduct.estimated_price
    });

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });

  } catch (error) {
    logJSON('❌ UPDATE PRODUCT - Error del servidor', {
      errorMessage: error.message,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      productId: req.params.id
    });
    
    console.error('Error en updateProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar producto de la lista
 * @access  Private
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    logJSON('🔵 DELETE PRODUCT - Inicio', {
      endpoint: `/api/products/${id}`,
      method: 'DELETE',
      productId: id,
      userId: req.user.id
    });

    // 1. Verificar que el producto existe y pertenece al usuario
    const product = await Product.findById(id, req.user.id);
    
    if (!product) {
      logJSON('🔴 DELETE PRODUCT - Producto no encontrado', {
        productId: id,
        userId: req.user.id
      });
      
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    logJSON('✅ DELETE PRODUCT - Producto encontrado', {
      productId: product.id,
      name: product.name,
      category: product.category,
      isPurchased: product.is_purchased
    });

    // 2. Verificar que el producto no esté en una compra registrada
    if (product.is_purchased) {
      logJSON('🔴 DELETE PRODUCT - Producto ya comprado', {
        productId: id,
        name: product.name
      });
      
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un producto que ya fue comprado. Pertenece al historial.'
      });
    }

    // 3. Eliminar producto
    logJSON('🗑️ DELETE PRODUCT - Eliminando producto de BD', {
      productId: id,
      userId: req.user.id
    });

    await Product.delete(id, req.user.id);

    logJSON('✅ DELETE PRODUCT - Producto eliminado exitosamente', {
      productId: id,
      name: product.name
    });

    res.status(200).json({
      success: true,
      message: 'Producto eliminado de la lista'
    });

  } catch (error) {
    logJSON('❌ DELETE PRODUCT - Error del servidor', {
      errorMessage: error.message,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      productId: req.params.id
    });
    
    console.error('Error en deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   GET /api/products/stats
 * @desc    Obtener estadísticas de productos
 * @access  Private
 */
exports.getStats = async (req, res) => {
  try {
    logJSON('🔵 GET PRODUCT STATS - Inicio', {
      endpoint: '/api/products/stats',
      method: 'GET',
      userId: req.user.id
    });

    const stats = await Product.getStats(req.user.id);

    logJSON('✅ GET PRODUCT STATS - Estadísticas obtenidas', {
      userId: req.user.id,
      stats: stats
    });

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logJSON('❌ GET PRODUCT STATS - Error del servidor', {
      errorMessage: error.message,
      userId: req.user?.id
    });
    
    console.error('Error en getStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

exports.unpurchaseProduct = async (req, res) => {
  try {
    const { id } = req.params;

    logJSON('🔵 UNPURCHASE PRODUCT - Inicio', {
      endpoint: `/api/products/${id}/unpurchase`,
      method: 'PATCH',
      productId: id,
      userId: req.user.id
    });

    // 1. Verificar existencia y pertenencia
    const product = await Product.findById(id, req.user.id);
    
    if (!product) {
      logJSON('🔴 UNPURCHASE PRODUCT - No encontrado', { productId: id, userId: req.user.id });
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // 2. Cambiar estado a is_purchased = false
    logJSON('🔄 UNPURCHASE PRODUCT - Ejecutando markAsNotPurchased', {
      productId: id,
      currentStatus: product.is_purchased
    });

    await Product.markAsNotPurchased(id);

    logJSON('✅ UNPURCHASE PRODUCT - Éxito', {
      productId: id,
      name: product.name,
      newStatus: 'is_purchased = false'
    });

    res.status(200).json({
      success: true,
      message: 'Producto movido a la lista de pendientes',
      data: {
        id: product.id,
        is_purchased: false
      }
    });

  } catch (error) {
    logJSON('❌ UNPURCHASE PRODUCT - Error', {
      errorMessage: error.message,
      productId: req.params.id
    });
    
    console.error('Error en unpurchaseProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del producto'
    });
  }
};