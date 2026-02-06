const { v4: uuid } = require('uuid');
const Purchase = require('../models/purchase.model');
const Product = require('../models/product.model');

// Utilidad para logs en formato JSON
const logJSON = (label, data) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    label: label,
    data: data
  }, null, 2));
};

/**
 * @route   GET /api/purchases
 * @desc    Obtener historial de compras
 * @access  Private
 */
exports.getPurchases = async (req, res) => {
  try {
    const { month, limit = 10, offset = 0 } = req.query;

    logJSON('🔵 GET PURCHASES - Inicio', {
      endpoint: '/api/purchases',
      method: 'GET',
      userId: req.user.id,
      filters: { month, limit, offset }
    });

    let purchases;

    if (month) {
      // Validar formato de mes (YYYY-MM)
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(month)) {
        logJSON('🔴 GET PURCHASES - Validación fallida', {
          error: 'Formato de mes inválido',
          receivedMonth: month,
          expectedFormat: 'YYYY-MM'
        });
        
        return res.status(400).json({
          success: false,
          message: 'Formato de mes inválido. Use YYYY-MM (ej: 2026-02)'
        });
      }

      logJSON('🔍 GET PURCHASES - Buscando por mes', {
        userId: req.user.id,
        month,
        limit,
        offset
      });

      purchases = await Purchase.findByMonth(req.user.id, month, limit, offset);
    } else {
      logJSON('🔍 GET PURCHASES - Buscando todas las compras', {
        userId: req.user.id,
        limit,
        offset
      });

      purchases = await Purchase.findAllByUser(req.user.id, limit, offset);
    }

    logJSON('📦 GET PURCHASES - Obteniendo productos de cada compra', {
      purchaseCount: purchases.length
    });

    // Obtener productos de cada compra
    for (let purchase of purchases) {
      purchase.products = await Purchase.getProducts(purchase.id);
      purchase.itemCount = purchase.products.length;

      logJSON('📋 GET PURCHASES - Productos de compra', {
        purchaseId: purchase.id,
        productCount: purchase.products.length
      });
    }

    logJSON('✅ GET PURCHASES - Compras obtenidas exitosamente', {
      userId: req.user.id,
      totalPurchases: purchases.length,
      month: month || 'todas'
    });

    res.status(200).json({
      success: true,
      data: purchases,
      count: purchases.length
    });

  } catch (error) {
    logJSON('❌ GET PURCHASES - Error del servidor', {
      errorMessage: error.message,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.user?.id
    });
    
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

    logJSON('🔵 GET PURCHASE BY ID - Inicio', {
      endpoint: `/api/purchases/${id}`,
      method: 'GET',
      purchaseId: id,
      userId: req.user.id
    });

    const purchase = await Purchase.findById(id, req.user.id);

    if (!purchase) {
      logJSON('🔴 GET PURCHASE BY ID - Compra no encontrada', {
        purchaseId: id,
        userId: req.user.id
      });
      
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    logJSON('📦 GET PURCHASE BY ID - Obteniendo productos', {
      purchaseId: purchase.id
    });

    // Obtener productos de la compra
    purchase.products = await Purchase.getProducts(purchase.id);
    purchase.itemCount = purchase.products.length;

    logJSON('✅ GET PURCHASE BY ID - Compra encontrada', {
      purchaseId: purchase.id,
      totalAmount: purchase.total_amount,
      productCount: purchase.products.length,
      purchaseDate: purchase.purchase_date
    });

    res.status(200).json({
      success: true,
      data: purchase
    });

  } catch (error) {
    logJSON('❌ GET PURCHASE BY ID - Error del servidor', {
      errorMessage: error.message,
      purchaseId: req.params.id
    });
    
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

    logJSON('🔵 CREATE PURCHASE - Inicio', {
      endpoint: '/api/purchases',
      method: 'POST',
      userId: req.user.id,
      body: {
        totalAmount,
        purchaseDate,
        productCount: products?.length
      }
    });

    // 1. Validar campos requeridos
    if (!totalAmount || !purchaseDate || !products || !Array.isArray(products)) {
      logJSON('🔴 CREATE PURCHASE - Validación fallida', {
        error: 'Campos faltantes o inválidos',
        received: {
          totalAmount: !!totalAmount,
          purchaseDate: !!purchaseDate,
          products: !!products,
          isArray: Array.isArray(products)
        }
      });
      
      return res.status(400).json({
        success: false,
        message: 'Total, fecha y productos son requeridos'
      });
    }

    // 2. Validar que haya al menos un producto
    if (products.length === 0) {
      logJSON('🔴 CREATE PURCHASE - Validación fallida', {
        error: 'Lista de productos vacía',
        productCount: products.length
      });
      
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto en la compra'
      });
    }

    // 3. Validar total (debe ser número positivo)
    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) {
      logJSON('🔴 CREATE PURCHASE - Validación fallida', {
        error: 'Total inválido',
        receivedTotal: totalAmount,
        parsedTotal: total
      });
      
      return res.status(400).json({
        success: false,
        message: 'El total debe ser un número positivo'
      });
    }

    // 4. Validar fecha
    const date = new Date(purchaseDate);
    if (isNaN(date.getTime())) {
      logJSON('🔴 CREATE PURCHASE - Validación fallida', {
        error: 'Fecha inválida',
        receivedDate: purchaseDate
      });
      
      return res.status(400).json({
        success: false,
        message: 'Fecha de compra inválida'
      });
    }

    logJSON('🔍 CREATE PURCHASE - Validando productos', {
      productCount: products.length
    });

    // 5. Validar cada producto
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      logJSON('🔍 CREATE PURCHASE - Validando producto', {
        index: i + 1,
        productId: product.productId,
        productName: product.productName,
        category: product.category,
        price: product.price
      });

      if (!product.productId) {
        logJSON('🔴 CREATE PURCHASE - Validación de producto fallida', {
          error: 'productId faltante',
          index: i + 1
        });
        
        return res.status(400).json({
          success: false,
          message: `El producto en posición ${i + 1} debe tener un productId`
        });
      }

      if (!product.productName || !product.category) {
        logJSON('🔴 CREATE PURCHASE - Validación de producto fallida', {
          error: 'Nombre o categoría faltante',
          index: i + 1,
          productName: product.productName,
          category: product.category
        });
        
        return res.status(400).json({
          success: false,
          message: `El producto en posición ${i + 1} debe tener nombre y categoría`
        });
      }

      const price = parseFloat(product.price);
      if (isNaN(price) || price < 0) {
        logJSON('🔴 CREATE PURCHASE - Validación de producto fallida', {
          error: 'Precio inválido',
          productName: product.productName,
          receivedPrice: product.price,
          parsedPrice: price
        });
        
        return res.status(400).json({
          success: false,
          message: `El precio del producto "${product.productName}" debe ser un número positivo`
        });
      }

      // Verificar que el producto existe y pertenece al usuario
      logJSON('🔍 CREATE PURCHASE - Verificando existencia del producto', {
        productId: product.productId,
        userId: req.user.id
      });

      const existingProduct = await Product.findById(product.productId, req.user.id);
      
      if (!existingProduct) {
        logJSON('🔴 CREATE PURCHASE - Producto no encontrado', {
          productId: product.productId,
          productName: product.productName,
          userId: req.user.id
        });
        
        return res.status(404).json({
          success: false,
          message: `El producto "${product.productName}" no existe o no pertenece a tu lista`
        });
      }

      // Verificar que no haya sido comprado anteriormente
      if (existingProduct.is_purchased) {
        logJSON('🔴 CREATE PURCHASE - Producto ya comprado', {
          productId: product.productId,
          productName: product.productName
        });
        
        return res.status(400).json({
          success: false,
          message: `El producto "${product.productName}" ya fue registrado en otra compra`
        });
      }

      logJSON('✅ CREATE PURCHASE - Producto validado', {
        productId: product.productId,
        productName: product.productName
      });
    }

    // 6. Validar que el total coincida con la suma de productos
    const sumProducts = products.reduce((sum, p) => sum + parseFloat(p.price), 0);
    const difference = Math.abs(total - sumProducts);
    
    logJSON('🧮 CREATE PURCHASE - Verificando suma de productos', {
      totalAmount: total,
      sumProducts: sumProducts,
      difference: difference,
      tolerance: 0.1
    });
    
    if (difference > 0.1) {
      logJSON('🔴 CREATE PURCHASE - Total no coincide', {
        totalAmount: total,
        sumProducts: sumProducts.toFixed(2),
        difference: difference
      });
      
      return res.status(400).json({
        success: false,
        message: `El total (${total}) no coincide con la suma de productos (${sumProducts.toFixed(2)})`
      });
    }

    // 7. Crear la compra
    logJSON('💾 CREATE PURCHASE - Creando compra en BD', {
      userId: req.user.id,
      totalAmount: total,
      purchaseDate,
      productCount: products.length
    });

    const purchaseId = await Purchase.create(
      req.user.id,
      total,
      purchaseDate
    );

    logJSON('✅ CREATE PURCHASE - Compra creada', {
      purchaseId,
      totalAmount: total
    });

    // 8. Agregar productos a la compra
    logJSON('💾 CREATE PURCHASE - Agregando productos a la compra', {
      purchaseId,
      productCount: products.length
    });

    await Purchase.addProducts(purchaseId, products);

    logJSON('✅ CREATE PURCHASE - Productos agregados', {
      purchaseId,
      productCount: products.length
    });

    // 9. Obtener la compra creada con sus productos
    const newPurchase = await Purchase.findById(purchaseId, req.user.id);
    newPurchase.products = await Purchase.getProducts(purchaseId);
    newPurchase.itemCount = newPurchase.products.length;

    logJSON('✅ CREATE PURCHASE - Compra registrada exitosamente', {
      purchaseId: newPurchase.id,
      totalAmount: newPurchase.total_amount,
      productCount: newPurchase.itemCount,
      purchaseDate: newPurchase.purchase_date
    });

    res.status(201).json({
      success: true,
      message: 'Compra registrada exitosamente',
      data: newPurchase
    });

  } catch (error) {
    logJSON('❌ CREATE PURCHASE - Error del servidor', {
      errorMessage: error.message,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.user?.id,
      body: req.body
    });
    
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

    logJSON('🔵 UPDATE PURCHASE - Inicio', {
      endpoint: `/api/purchases/${id}`,
      method: 'PUT',
      purchaseId: id,
      userId: req.user.id,
      body: { totalAmount, purchaseDate }
    });

    // 1. Verificar que la compra existe y pertenece al usuario
    const existingPurchase = await Purchase.findById(id, req.user.id);
    
    if (!existingPurchase) {
      logJSON('🔴 UPDATE PURCHASE - Compra no encontrada', {
        purchaseId: id,
        userId: req.user.id
      });
      
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    logJSON('✅ UPDATE PURCHASE - Compra encontrada', {
      purchaseId: existingPurchase.id,
      currentTotal: existingPurchase.total_amount,
      currentDate: existingPurchase.purchase_date
    });

    // 2. Validar que no sea una compra muy antigua (30 días)
    const purchaseAge = Date.now() - new Date(existingPurchase.purchase_date).getTime();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    
    logJSON('🔍 UPDATE PURCHASE - Verificando antigüedad', {
      purchaseDate: existingPurchase.purchase_date,
      ageInDays: Math.floor(purchaseAge / (24 * 60 * 60 * 1000)),
      maxDays: 30
    });
    
    if (purchaseAge > thirtyDaysInMs) {
      logJSON('🔴 UPDATE PURCHASE - Compra muy antigua', {
        purchaseId: id,
        ageInDays: Math.floor(purchaseAge / (24 * 60 * 60 * 1000))
      });
      
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

    logJSON('📝 UPDATE PURCHASE - Datos a actualizar', {
      purchaseId: id,
      newTotal: updateData.totalAmount,
      newDate: updateData.purchaseDate
    });

    // 4. Validaciones
    if (isNaN(updateData.totalAmount) || updateData.totalAmount <= 0) {
      logJSON('🔴 UPDATE PURCHASE - Validación fallida', {
        error: 'Total inválido',
        receivedTotal: totalAmount,
        parsedTotal: updateData.totalAmount
      });
      
      return res.status(400).json({
        success: false,
        message: 'El total debe ser un número positivo'
      });
    }

    const date = new Date(updateData.purchaseDate);
    if (isNaN(date.getTime())) {
      logJSON('🔴 UPDATE PURCHASE - Validación fallida', {
        error: 'Fecha inválida',
        receivedDate: updateData.purchaseDate
      });
      
      return res.status(400).json({
        success: false,
        message: 'Fecha de compra inválida'
      });
    }

    // 5. Actualizar compra
    logJSON('💾 UPDATE PURCHASE - Actualizando en BD', {
      purchaseId: id,
      userId: req.user.id
    });

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

    logJSON('✅ UPDATE PURCHASE - Compra actualizada exitosamente', {
      purchaseId: updatedPurchase.id,
      totalAmount: updatedPurchase.total_amount,
      purchaseDate: updatedPurchase.purchase_date,
      productCount: updatedPurchase.itemCount
    });

    res.status(200).json({
      success: true,
      message: 'Compra actualizada exitosamente',
      data: updatedPurchase
    });

  } catch (error) {
    logJSON('❌ UPDATE PURCHASE - Error del servidor', {
      errorMessage: error.message,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      purchaseId: req.params.id
    });
    
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

    logJSON('🔵 DELETE PURCHASE - Inicio', {
      endpoint: `/api/purchases/${id}`,
      method: 'DELETE',
      purchaseId: id,
      userId: req.user.id
    });

    // 1. Verificar que la compra existe y pertenece al usuario
    const purchase = await Purchase.findById(id, req.user.id);
    
    if (!purchase) {
      logJSON('🔴 DELETE PURCHASE - Compra no encontrada', {
        purchaseId: id,
        userId: req.user.id
      });
      
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    logJSON('✅ DELETE PURCHASE - Compra encontrada', {
      purchaseId: purchase.id,
      totalAmount: purchase.total_amount,
      purchaseDate: purchase.purchase_date
    });

    // 2. Validar que no sea una compra muy antigua (7 días)
    const purchaseAge = Date.now() - new Date(purchase.purchase_date).getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    logJSON('🔍 DELETE PURCHASE - Verificando antigüedad', {
      purchaseDate: purchase.purchase_date,
      ageInDays: Math.floor(purchaseAge / (24 * 60 * 60 * 1000)),
      maxDays: 7
    });
    
    if (purchaseAge > sevenDaysInMs) {
      logJSON('🔴 DELETE PURCHASE - Compra muy antigua', {
        purchaseId: id,
        ageInDays: Math.floor(purchaseAge / (24 * 60 * 60 * 1000))
      });
      
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar compras de los últimos 7 días'
      });
    }

    // 3. Obtener productos de la compra antes de eliminar
    logJSON('📦 DELETE PURCHASE - Obteniendo productos', {
      purchaseId: id
    });

    const products = await Purchase.getProducts(id);

    logJSON('📋 DELETE PURCHASE - Productos obtenidos', {
      purchaseId: id,
      productCount: products.length,
      products: products.map(p => ({
        productId: p.product_id,
        name: p.name
      }))
    });

    // 4. Eliminar la compra
    logJSON('🗑️ DELETE PURCHASE - Eliminando compra de BD', {
      purchaseId: id,
      userId: req.user.id
    });

    await Purchase.delete(id, req.user.id);

    logJSON('✅ DELETE PURCHASE - Compra eliminada', {
      purchaseId: id
    });

    // 5. Marcar productos como no comprados
    logJSON('🔄 DELETE PURCHASE - Marcando productos como no comprados', {
      productCount: products.length
    });

    for (const product of products) {
      if (product.product_id) {
        logJSON('🔄 DELETE PURCHASE - Actualizando producto', {
          productId: product.product_id,
          productName: product.name
        });

        await Product.markAsNotPurchased(product.product_id);

        logJSON('✅ DELETE PURCHASE - Producto actualizado', {
          productId: product.product_id
        });
      }
    }

    logJSON('✅ DELETE PURCHASE - Compra eliminada exitosamente', {
      purchaseId: id,
      productsRestored: products.length
    });

    res.status(200).json({
      success: true,
      message: 'Compra eliminada exitosamente'
    });

  } catch (error) {
    logJSON('❌ DELETE PURCHASE - Error del servidor', {
      errorMessage: error.message,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      purchaseId: req.params.id
    });
    
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
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    logJSON('🔵 GET MONTHLY TOTAL - Inicio', {
      endpoint: '/api/purchases/total',
      method: 'GET',
      userId: req.user.id,
      month: targetMonth
    });

    // Validar formato de mes (YYYY-MM)
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(targetMonth)) {
      logJSON('🔴 GET MONTHLY TOTAL - Validación fallida', {
        error: 'Formato de mes inválido',
        receivedMonth: targetMonth,
        expectedFormat: 'YYYY-MM'
      });
      
      return res.status(400).json({
        success: false,
        message: 'Formato de mes inválido. Use YYYY-MM (ej: 2026-02)'
      });
    }

    // Obtener total del mes
    logJSON('🔍 GET MONTHLY TOTAL - Consultando estadísticas', {
      userId: req.user.id,
      month: targetMonth
    });

    const stats = await Purchase.getMonthlyTotal(req.user.id, targetMonth);

    logJSON('✅ GET MONTHLY TOTAL - Estadísticas obtenidas', {
      month: targetMonth,
      totalSpent: stats.totalSpent,
      purchaseCount: stats.purchaseCount,
      averagePerPurchase: stats.averagePerPurchase
    });

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
    logJSON('❌ GET MONTHLY TOTAL - Error del servidor', {
      errorMessage: error.message,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.user?.id
    });
    
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
    const targetYear = year || new Date().getFullYear();

    logJSON('🔵 GET YEARLY STATS - Inicio', {
      endpoint: '/api/purchases/stats/yearly',
      method: 'GET',
      userId: req.user.id,
      year: targetYear
    });

    logJSON('🔍 GET YEARLY STATS - Consultando estadísticas anuales', {
      userId: req.user.id,
      year: targetYear
    });

    const stats = await Purchase.getYearlyStats(req.user.id, targetYear);

    logJSON('✅ GET YEARLY STATS - Estadísticas obtenidas', {
      year: parseInt(targetYear),
      monthsWithData: stats.length,
      stats: stats
    });

    res.status(200).json({
      success: true,
      data: {
        year: parseInt(targetYear),
        monthlyBreakdown: stats
      }
    });

  } catch (error) {
    logJSON('❌ GET YEARLY STATS - Error del servidor', {
      errorMessage: error.message,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.user?.id
    });
    
    console.error('Error en getYearlyStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas anuales'
    });
  }
};