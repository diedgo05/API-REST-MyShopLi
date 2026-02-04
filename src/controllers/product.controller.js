const { v4: uuid } = require('uuid');
const Product = require('../models/product.model');

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
    const { isPurchased } = req.query;

    // Obtener productos según el filtro
    let products;
    if (isPurchased === 'true') {
      products = await Product.findPurchasedByUser(req.user.id);
    } else if (isPurchased === 'false') {
      products = await Product.findAllByUser(req.user.id);
    } else {
      // Si no se especifica, traer todos
      products = await Product.findAllProductsByUser(req.user.id);
    }

    res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });

  } catch (error) {
    console.error('Error en getProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
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

    const product = await Product.findById(id, req.user.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
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

    // 1. Validar campos requeridos
    if (!name || !category || estimatedPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, categoría y precio estimado son requeridos'
      });
    }

    // 2. Validar nombre (mínimo 2 caracteres)
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    // 3. Validar categoría
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Categoría no válida',
        validCategories: VALID_CATEGORIES
      });
    }

    // 4. Validar precio (debe ser número positivo)
    const price = parseFloat(estimatedPrice);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número positivo'
      });
    }

    // 5. Verificar que el producto no esté duplicado (mismo nombre y categoría)
    const existingProduct = await Product.findByNameAndCategory(
      req.user.id,
      name.trim(),
      category
    );

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con ese nombre en esta categoría'
      });
    }

    // 6. Crear producto
    const productId = uuid();
    await Product.create(
      productId,
      req.user.id,
      name.trim(),
      category,
      price
    );

    // 7. Obtener el producto creado
    const newProduct = await Product.findById(productId, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Producto agregado a la lista',
      data: newProduct
    });

  } catch (error) {
    console.error('Error en addProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // 1. Verificar que el producto existe y pertenece al usuario
    const existingProduct = await Product.findById(id, req.user.id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // 2. Verificar que el producto no haya sido comprado
    if (existingProduct.is_purchased) {
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

    // 4. Validaciones
    if (updateData.name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    if (!VALID_CATEGORIES.includes(updateData.category)) {
      return res.status(400).json({
        success: false,
        message: 'Categoría no válida',
        validCategories: VALID_CATEGORIES
      });
    }

    if (isNaN(updateData.estimatedPrice) || updateData.estimatedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número positivo'
      });
    }

    // 5. Verificar duplicados (si cambiaron nombre o categoría)
    if (updateData.name !== existingProduct.name || updateData.category !== existingProduct.category) {
      const duplicate = await Product.findByNameAndCategory(
        req.user.id,
        updateData.name,
        updateData.category
      );

      if (duplicate && duplicate.id !== id) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un producto con ese nombre en esta categoría'
        });
      }
    }

    // 6. Actualizar producto
    await Product.update(
      id,
      req.user.id,
      updateData.name,
      updateData.category,
      updateData.estimatedPrice
    );

    // 7. Obtener producto actualizado
    const updatedProduct = await Product.findById(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });

  } catch (error) {
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

    // 1. Verificar que el producto existe y pertenece al usuario
    const product = await Product.findById(id, req.user.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // 2. Verificar que el producto no esté en una compra registrada
    if (product.is_purchased) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un producto que ya fue comprado. Pertenece al historial.'
      });
    }

    // 3. Eliminar producto
    await Product.delete(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Producto eliminado de la lista'
    });

  } catch (error) {
    console.error('Error en deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   PATCH /api/products/:id/toggle
 * @desc    Marcar/desmarcar producto como comprado (sin registrar compra)
 * @access  Private
 */
exports.togglePurchased = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Verificar que el producto existe
    const product = await Product.findById(id, req.user.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // 2. Alternar estado
    await Product.togglePurchased(id, req.user.id);

    // 3. Obtener producto actualizado
    const updatedProduct = await Product.findById(id, req.user.id);

    res.status(200).json({
      success: true,
      message: updatedProduct.is_purchased ? 'Producto marcado como comprado' : 'Producto marcado como pendiente',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Error en togglePurchased:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del producto'
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