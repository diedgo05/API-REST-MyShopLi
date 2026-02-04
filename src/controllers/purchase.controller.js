const Purchase = require('../models/purchase.model');

exports.createPurchase = async (req, res) => {
  const { totalAmount, purchaseDate, products } = req.body;

  const purchaseId = await Purchase.create(
    req.user.id,
    totalAmount,
    purchaseDate
  );

  await Purchase.addProducts(purchaseId, products);

  res.status(201).json({ message: 'Compra registrada' });
};
