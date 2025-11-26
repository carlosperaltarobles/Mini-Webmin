/**
 * Controlador para endpoints de usuarios
 */

import systemUserService from '../services/systemUserService.js';

/**
 * GET /api/users
 * Lista todos los usuarios del sistema
 */
export async function listUsers(req, res, next) {
  try {
    // Query param para mostrar todos los usuarios o solo los "humanos"
    const onlyHumans = req.query.all !== 'true';
    const users = await systemUserService.listUsers(onlyHumans);
    
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:username
 * Obtiene información de un usuario específico
 */
export async function getUser(req, res, next) {
  try {
    const { username } = req.params;
    const user = await systemUserService.getUser(username);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        error: true,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * POST /api/users
 * Crea un nuevo usuario
 */
export async function createUser(req, res, next) {
  try {
    const { username, password, groups = [] } = req.body;
    
    const user = await systemUserService.createUser(username, password, groups);
    
    res.status(201).json({
      success: true,
      message: `Usuario ${username} creado exitosamente`,
      data: user
    });
  } catch (error) {
    if (error.message.includes('ya existe')) {
      return res.status(409).json({
        error: true,
        message: error.message
      });
    }
    if (error.message.includes('inválido')) {
      return res.status(400).json({
        error: true,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * PUT /api/users/:username
 * Actualiza un usuario existente (contraseña y/o grupos)
 */
export async function updateUser(req, res, next) {
  try {
    const { username } = req.params;
    const { password, groups } = req.body;
    
    // Al menos uno debe estar presente
    if (!password && !groups) {
      return res.status(400).json({
        error: true,
        message: 'Debe proporcionar al menos password o groups para actualizar'
      });
    }
    
    const user = await systemUserService.updateUser(username, { password, groups });
    
    res.json({
      success: true,
      message: `Usuario ${username} actualizado exitosamente`,
      data: user
    });
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        error: true,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * PUT /api/users/:username/groups
 * Actualiza los grupos de un usuario
 */
export async function updateUserGroups(req, res, next) {
  try {
    const { username } = req.params;
    const { groups, append = false } = req.body;
    
    const user = await systemUserService.updateUserGroups(username, groups, append);
    
    res.json({
      success: true,
      message: `Grupos de ${username} actualizados exitosamente`,
      data: user
    });
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        error: true,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * DELETE /api/users/:username
 * Elimina un usuario
 */
export async function deleteUser(req, res, next) {
  try {
    const { username } = req.params;
    // Query param para eliminar también el home
    const removeHome = req.query.removeHome === 'true';
    
    await systemUserService.deleteUser(username, removeHome);
    
    res.json({
      success: true,
      message: `Usuario ${username} eliminado exitosamente`
    });
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        error: true,
        message: error.message
      });
    }
    if (error.message.includes('No se puede eliminar')) {
      return res.status(403).json({
        error: true,
        message: error.message
      });
    }
    next(error);
  }
}

export default {
  listUsers,
  getUser,
  createUser,
  updateUser,
  updateUserGroups,
  deleteUser
};
