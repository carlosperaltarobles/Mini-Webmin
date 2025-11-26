/**
 * Controlador para endpoints de grupos
 */

import systemUserService from '../services/systemUserService.js';

/**
 * GET /api/groups
 * Lista todos los grupos del sistema
 */
export async function listGroups(req, res, next) {
  try {
    // Query param para mostrar todos los grupos o solo los "humanos" (GID >= 1000)
    const onlyHumans = req.query.all !== 'true';
    const groups = await systemUserService.listGroups(onlyHumans);
    
    res.json({
      success: true,
      data: groups,
      count: groups.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/groups/:groupname
 * Obtiene información de un grupo específico
 */
export async function getGroup(req, res, next) {
  try {
    const { groupname } = req.params;
    const group = await systemUserService.getGroup(groupname);
    
    res.json({
      success: true,
      data: group
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

export default {
  listGroups,
  getGroup
};
