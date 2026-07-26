const userService = require('./user.service');

/**
 * GET /api/manager/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const users = await userService.getAllUsers({ role });
    res.json({ success: true, data: users, total: users.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/manager/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/manager/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const updated = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/manager/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
