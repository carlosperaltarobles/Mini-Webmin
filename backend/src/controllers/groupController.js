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

/**
 * POST /api/groups
 * Crea un nuevo grupo
 */
export async function createGroup(req, res, next) {
  try {
    const { name } = req.body;
    const group = await systemUserService.createGroup(name);
    
    res.status(201).json({
      success: true,
      message: `Grupo '${name}' creado exitosamente`,
      data: group
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
 * DELETE /api/groups/:groupname
 * Elimina un grupo del sistema
 */
export async function deleteGroup(req, res, next) {
  try {
    const { groupname } = req.params;
    await systemUserService.deleteGroup(groupname);
    
    res.json({
      success: true,
      message: `Grupo '${groupname}' eliminado exitosamente`
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

/**
 * PUT /api/groups/:groupname/members
 * Actualiza los miembros de un grupo
 */
export async function updateGroupMembers(req, res, next) {
  try {
    const { groupname } = req.params;
    const { members } = req.body;
    
    const group = await systemUserService.updateGroupMembers(groupname, members);
    
    res.json({
      success: true,
      message: `Miembros del grupo '${groupname}' actualizados exitosamente`,
      data: group
    });
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
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

export default {
  listGroups,
  getGroup,
  createGroup,
  deleteGroup,
  updateGroupMembers
};
