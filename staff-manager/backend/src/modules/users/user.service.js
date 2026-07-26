const { pool } = require('../../config/store');

/**
 * ดูบัญชีผู้ใช้ทั้งหมด (Manager)
 * Query จากตาราง users + JOIN customers/staffs
 * รองรับ filter: role
 */
const getAllUsers = async ({ role } = {}) => {
  let sql = `
    SELECT
      u.user_id   AS id,
      u.user_id,
      u.username,
      u.email,
      u.role,
      s.staff_id,
      s.position,
      c.customer_id,
      c.skin_type AS skinType,
      c.phone
    FROM users u
    LEFT JOIN staffs    s ON s.user_id = u.user_id
    LEFT JOIN customers c ON c.user_id = u.user_id
    WHERE 1=1
  `;
  const params = [];

  if (role) {
    sql += ' AND u.role = ?';
    params.push(role);
  }

  sql += ' ORDER BY u.user_id ASC';

  const [rows] = await pool.query(sql, params);
  return rows.map(sanitizeUser);
};

/**
 * ดูผู้ใช้ตาม id (Manager)
 */
const getUserById = async (id) => {
  const [[user]] = await pool.query(
    `SELECT
       u.user_id   AS id,
       u.user_id,
       u.username,
       u.email,
       u.role,
       s.staff_id,
       s.position,
       c.customer_id,
       c.skin_type AS skinType,
       c.phone
     FROM users u
     LEFT JOIN staffs    s ON s.user_id = u.user_id
     LEFT JOIN customers c ON c.user_id = u.user_id
     WHERE u.user_id = ?`,
    [parseInt(id)]
  );
  if (!user) {
    const err = new Error('ไม่พบผู้ใช้');
    err.statusCode = 404;
    throw err;
  }
  return sanitizeUser(user);
};

/**
 * อัปเดตข้อมูลผู้ใช้ (Manager)
 * อนุญาตเปลี่ยน: username, role, position
 */
const updateUser = async (id, data) => {
  const user = await getUserById(id);

  const allowedUserFields  = ['username', 'role'];
  const allowedStaffFields = ['position'];

  const userClauses  = [];
  const userParams   = [];
  const staffClauses = [];
  const staffParams  = [];

  allowedUserFields.forEach((f) => {
    if (data[f] !== undefined) {
      userClauses.push(`${f} = ?`);
      userParams.push(data[f]);
    }
  });
  allowedStaffFields.forEach((f) => {
    if (data[f] !== undefined) {
      staffClauses.push(`${f} = ?`);
      staffParams.push(data[f]);
    }
  });

  if (userClauses.length > 0) {
    userParams.push(parseInt(id));
    await pool.query(`UPDATE users SET ${userClauses.join(', ')} WHERE user_id = ?`, userParams);
  }

  if (staffClauses.length > 0 && user.staff_id) {
    staffParams.push(user.staff_id);
    await pool.query(`UPDATE staffs SET ${staffClauses.join(', ')} WHERE staff_id = ?`, staffParams);
  }

  return getUserById(id);
};

/**
 * ลบบัญชีผู้ใช้ (Manager)
 */
const deleteUser = async (id) => {
  const user = await getUserById(id);

  // ลบ child records ก่อน (ถ้า DB ไม่มี CASCADE)
  await pool.query('DELETE FROM staffs    WHERE user_id = ?', [parseInt(id)]);
  await pool.query('DELETE FROM customers WHERE user_id = ?', [parseInt(id)]);
  await pool.query('DELETE FROM users     WHERE user_id = ?', [parseInt(id)]);

  return { message: `ลบบัญชีผู้ใช้ "${user.username}" สำเร็จ` };
};

// ── Helpers ──────────────────────────────────────────────
const sanitizeUser = ({ password_hash: _pw, ...rest }) => rest;

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
