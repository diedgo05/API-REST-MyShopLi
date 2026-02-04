const { v4: uuid } = require('uuid');
const Purchase = require('../models/purchase.model');
const Product = require('../models/product.model');

/**
 * @route   GET /api/purchases
 * @desc    Obtener historial de compras
 * @access  Private
 */
exports.getPurchases = async (req, res) => {
  try {
    const { month, limit = 10, offset = 0 } = req.query;

    let purchases;

    if (month) {
      // Validar formato de mes (YYYY-MM)
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(month)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de mes inválido. Use YYYY-MM (ej: 2026-02)'
        });
      }
      purchases = await Purchase.findByMonth(req.user.id, month, limit, offset);
    } else {
      purchases = await Purchase.findAllByUser(req.user.id, limit, offset);
    }

    // Obtener productos de cada compra
    for (let purchase of purchases) {
      purchase.products = await Purchase.getProducts(purchase.id);
      purchase.itemCount = purchase.products.length;
    }

    res.status(200).json({
      success: true,
      data: purchases,
      count: purchases.length
    });

  } catch (error) {
    console.error('Error en getPurchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de compras',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   GET /api/purchases/:id
 * @desc    Obtener detalle de una compra
 * @access  Private
 */
exports.getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await Purchase.findById(id, req.user.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // Obtener productos de la compra
    purchase.products = await Purchase.getProducts(purchase.id);
    purchase.itemCount = purchase.products.length;

    res.status(200).json({
      success: true,
      data: purchase
    });

  } catch (error) {
    console.error('Error en getPurchaseById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener compra'
    });
  }
};

/**
 * @route   POST /api/purchases
 * @desc    Registrar nueva compra
 * @access  Private
 */
exports.createPurchase = async (req, res) => {
  try {
    const { totalAmount, purchaseDate, products } = req.body;

    // 1. Validar campos requeridos
    if (!totalAmount || !purchaseDate || !products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Total, fecha y productos son requeridos'
      });
    }

    // 2. Validar que haya al menos un producto
    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto en la compra'
      });
    }

    // 3. Validar total (debe ser número positivo)
    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El total debe ser un número positivo'
      });
    }

    // 4. Validar fecha
    const date = new Date(purchaseDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de compra inválida'
      });
    }

    // 5. Validar cada producto
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      if (!product.productId) {
        return res.status(400).json({
          success: false,
          message: `El producto en posición ${i + 1} debe tener un productId`
        });
      }

      if (!product.productName || !product.category) {
        return res.status(400).json({
          success: false,
          message: `El producto en posición ${i + 1} debe tener nombre y categoría`
        });
      }

      const price = parseFloat(product.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: `El precio del producto "${product.productName}" debe ser un número positivo`
        });
      }

      // Verificar que el producto existe y pertenece al usuario
      const existingProduct = await Product.findById(product.productId, req.user.id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: `El producto "${product.productName}" no existe o no pertenece a tu lista`
        });
      }

      // Verificar que no haya sido comprado anteriormente
      if (existingProduct.is_purchased) {
        return res.status(400).json({
          success: false,
          message: `El producto "${product.productName}" ya fue registrado en otra compra`
        });
      }
    }

    // 6. Validar que el total coincida aproximadamente con la suma de productos
    const sumProducts = products.reduce((sum, p) => sum + parseFloat(p.price), 0);
    const difference = Math.abs(total - sumProducts);
    
    if (difference > 0.1) { // Tolerancia de 10 centavos por redondeo
      return res.status(400).json({
        success: false,
        message: `El total (${total}) no coincide con la suma de productos (${sumProducts.toFixed(2)})`
      });
    }

    // 7. Crear la compra (con transacción para asegurar integridad)
    const purchaseId = await Purchase.create(
      req.user.id,
      total,
      purchaseDate
    );

    // 8. Agregar productos a la compra
    await Purchase.addProducts(purchaseId, products);

    // 9. Obtener la compra creada con sus productos
    const newPurchase = await Purchase.findById(purchaseId, req.user.id);
    newPurchase.products = await Purchase.getProducts(purchaseId);
    newPurchase.itemCount = newPurchase.products.length;

    res.status(201).json({
      success: true,
      message: 'Compra registrada exitosamente',
      data: newPurchase
    });

  } catch (error) {
    console.error('Error en createPurchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar compra',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   PUT /api/purchases/:id
 * @desc    Actualizar compra (solo total y fecha, no productos)
 * @access  Private
 */
exports.updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalAmount, purchaseDate } = req.body;

    // 1. Verificar que la compra existe y pertenece al usuario
    const existingPurchase = await Purchase.findById(id, req.user.id);
    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // 2. Validar que no sea una compra muy antigua (opcional - 30 días)
    const purchaseAge = Date.now() - new Date(existingPurchase.purchase_date).getTime();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    
    if (purchaseAge > thirtyDaysInMs) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden editar compras con más de 30 días de antigüedad'
      });
    }

    // 3. Preparar datos a actualizar
    const updateData = {
      totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : existingPurchase.total_amount,
      purchaseDate: purchaseDate || existingPurchase.purchase_date
    };

    // 4. Validaciones
    if (isNaN(updateData.totalAmount) || updateData.totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El total debe ser un número positivo'
      });
    }

    const date = new Date(updateData.purchaseDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de compra inválida'
      });
    }

    // 5. Actualizar compra
    await Purchase.update(
      id,
      req.user.id,
      updateData.totalAmount,
      updateData.purchaseDate
    );

    // 6. Obtener compra actualizada
    const updatedPurchase = await Purchase.findById(id, req.user.id);
    updatedPurchase.products = await Purchase.getProducts(id);
    updatedPurchase.itemCount = updatedPurchase.products.length;

    res.status(200).json({
      success: true,
      message: 'Compra actualizada exitosamente',
      data: updatedPurchase
    });

  } catch (error) {
    console.error('Error en updatePurchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar compra',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   DELETE /api/purchases/:id
 * @desc    Eliminar compra
 * @access  Private
 */
exports.deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Verificar que la compra existe y pertenece al usuario
    const purchase = await Purchase.findById(id, req.user.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // 2. Validar que no sea una compra muy antigua (opcional - 7 días)
    const purchaseAge = Date.now() - new Date(purchase.purchase_date).getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    if (purchaseAge > sevenDaysInMs) {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar compras de los últimos 7 días'
      });
    }

    // 3. Obtener productos de la compra antes de eliminar
    const products = await Purchase.getProducts(id);

    // 4. Eliminar la compra (esto también eliminará los productos asociados por CASCADE)
    await Purchase.delete(id, req.user.id);

    // 5. Marcar productos como no comprados (para que vuelvan a la lista)
    for (const product of products) {
      if (product.product_id) {
        await Product.markAsNotPurchased(product.product_id);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Compra eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en deletePurchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar compra',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   GET /api/purchases/total
 * @desc    Obtener total gastado en el mes
 * @access  Private
 */
exports.getMonthlyTotal = async (req, res) => {
  try {
    const { month } = req.query;

    // Si no se especifica mes, usar el mes actual
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    // Validar formato de mes (YYYY-MM)
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(targetMonth)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de mes inválido. Use YYYY-MM (ej: 2026-02)'
      });
    }

    // Obtener total del mes
    const stats = await Purchase.getMonthlyTotal(req.user.id, targetMonth);

    res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        totalSpent: parseFloat(stats.totalSpent) || 0,
        purchaseCount: parseInt(stats.purchaseCount) || 0,
        averagePerPurchase: parseFloat(stats.averagePerPurchase) || 0
      }
    });

  } catch (error) {
    console.error('Error en getMonthlyTotal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener total mensual',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   GET /api/purchases/stats/yearly
 * @desc    Obtener estadísticas anuales
 * @access  Private
 */
exports.getYearlyStats = async (req, res) => {
  try {
    const { year } = req.query;
    
    // Si no se especifica año, usar el año actual
    const targetYear = year || new Date().getFullYear();

    const stats = await Purchase.getYearlyStats(req.user.id, targetYear);

    res.status(200).json({
      success: true,
      data: {
        year: parseInt(targetYear),
        monthlyBreakdown: stats
      }
    });

  } catch (error) {
    console.error('Error en getYearlyStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas anuales'
    });
  }
};