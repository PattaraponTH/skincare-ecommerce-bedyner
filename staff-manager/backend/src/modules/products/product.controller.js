const productService = require('./product.service');

/**
 * POST /api/manager/products/upload-image
 * รับไฟล์รูปจริง (multipart/form-data, field name "image") แล้วเก็บลง server
 * คืนค่า imageUrl ที่เอาไปใส่ตอน create/update product ต่อได้เลย
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('กรุณาแนบไฟล์รูปภาพ (field name: image)');
      err.statusCode = 400;
      throw err;
    }
    const imageUrl = `/uploads/products/${req.file.filename}`;
    res.status(201).json({ success: true, data: { imageUrl } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/manager/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { category, brand } = req.query;
    const products = await productService.getAllProducts({ category, brand });
    res.json({ success: true, data: products, total: products.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/manager/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/manager/products
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/manager/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const updated = await productService.updateProduct(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/manager/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, uploadImage };
