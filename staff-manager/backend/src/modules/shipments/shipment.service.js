const { pool } = require('../../config/store');

const CARRIERS = ['Kerry Express', 'Flash Express', 'Thailand Post'];
// glowtime.sql seed data ใช้: Pending, Shipping, Delivered (Capitalized)
const SHIPMENT_STATUSES = ['pending', 'shipping', 'delivered'];

/**
 * บันทึกข้อมูลการจัดส่ง (Staff)
 * INSERT INTO shipments
 */
const createShipment = async ({ orderId, trackingNumber, carrier }) => {
  if (!orderId || !trackingNumber || !carrier) {
    const err = new Error('กรุณาระบุ orderId, trackingNumber และ carrier');
    err.statusCode = 400;
    throw err;
  }

  if (!CARRIERS.includes(carrier)) {
    const err = new Error(`carrier ไม่ถูกต้อง ต้องเป็นหนึ่งใน: ${CARRIERS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // ตรวจสอบ order มีอยู่จริง
  const [[order]] = await pool.query(
    'SELECT order_id FROM orders WHERE order_id = ?',
    [parseInt(orderId)]
  );
  if (!order) {
    const err = new Error(`ไม่พบออเดอร์ ${orderId}`);
    err.statusCode = 404;
    throw err;
  }

  // ตรวจสอบว่า shipment ซ้ำหรือไม่
  const [[existing]] = await pool.query(
    'SELECT shipment_id FROM shipments WHERE order_id = ?',
    [parseInt(orderId)]
  );
  if (existing) {
    const err = new Error(`ออเดอร์ ${orderId} มีข้อมูลการจัดส่งอยู่แล้ว`);
    err.statusCode = 409;
    throw err;
  }

  const now = new Date();
  const [result] = await pool.query(
    `INSERT INTO shipments (order_id, tracking_number, carrier, status, shipped_at, delivered_at)
     VALUES (?, ?, ?, 'Shipping', ?, NULL)`,
    [parseInt(orderId), trackingNumber, carrier, now]
  );

  const [[shipment]] = await pool.query(
    `SELECT
       shipment_id   AS id,
       order_id      AS orderId,
       tracking_number AS trackingNumber,
       carrier,
       status,
       shipped_at    AS shippedAt,
       delivered_at  AS deliveredAt
     FROM shipments WHERE shipment_id = ?`,
    [result.insertId]
  );
  return shipment;
};

/**
 * ดูข้อมูลการจัดส่งทั้งหมด
 */
const getAllShipments = async () => {
  const [rows] = await pool.query(
    `SELECT
       shipment_id   AS id,
       order_id      AS orderId,
       tracking_number AS trackingNumber,
       carrier,
       status,
       shipped_at    AS shippedAt,
       delivered_at  AS deliveredAt
     FROM shipments
     ORDER BY shipped_at DESC`
  );
  return rows;
};

/**
 * ดูข้อมูลการจัดส่งตาม orderId
 */
const getShipmentByOrderId = async (orderId) => {
  const [[shipment]] = await pool.query(
    `SELECT
       shipment_id   AS id,
       order_id      AS orderId,
       tracking_number AS trackingNumber,
       carrier,
       status,
       shipped_at    AS shippedAt,
       delivered_at  AS deliveredAt
     FROM shipments WHERE order_id = ?`,
    [parseInt(orderId)]
  );
  if (!shipment) {
    const err = new Error('ไม่พบข้อมูลการจัดส่ง');
    err.statusCode = 404;
    throw err;
  }
  return shipment;
};

module.exports = { createShipment, getAllShipments, getShipmentByOrderId, CARRIERS, SHIPMENT_STATUSES };
