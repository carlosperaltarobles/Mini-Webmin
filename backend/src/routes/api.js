/**
 * Definición de rutas de la API REST
 */

import { Router } from 'express';
import userController from '../controllers/userController.js';
import groupController from '../controllers/groupController.js';
import {
  createUserValidation,
  updateUserValidation,
  updateUserGroupsValidation,
  deleteUserValidation,
  getUserValidation,
  createGroupValidation,
  getGroupValidation,
  deleteGroupValidation,
  updateGroupMembersValidation
} from '../middleware/validators.js';

const router = Router();

// ==================== RUTAS DE USUARIOS ====================

/**
 * GET /api/users
 * Lista todos los usuarios del sistema
 * Query params:
 *   - all=true: incluye usuarios del sistema (UID < 1000)
 */
router.get('/users', userController.listUsers);

/**
 * GET /api/users/:username
 * Obtiene información de un usuario específico
 */
router.get('/users/:username', getUserValidation, userController.getUser);

/**
 * POST /api/users
 * Crea un nuevo usuario
 * Body: { username, password, groups?: string[] }
 */
router.post('/users', createUserValidation, userController.createUser);

/**
 * PUT /api/users/:username
 * Actualiza un usuario (contraseña y/o grupos)
 * Body: { password?: string, groups?: string[] }
 */
router.put('/users/:username', updateUserValidation, userController.updateUser);

/**
 * PUT /api/users/:username/groups
 * Actualiza solo los grupos de un usuario
 * Body: { groups: string[], append?: boolean }
 */
router.put('/users/:username/groups', updateUserGroupsValidation, userController.updateUserGroups);

/**
 * DELETE /api/users/:username
 * Elimina un usuario
 * Query params:
 *   - removeHome=true: elimina también el directorio home
 */
router.delete('/users/:username', deleteUserValidation, userController.deleteUser);

// ==================== RUTAS DE GRUPOS ====================

/**
 * GET /api/groups
 * Lista todos los grupos del sistema
 * Query params:
 *   - all=true: incluye grupos del sistema (GID < 1000)
 */
router.get('/groups', groupController.listGroups);

/**
 * GET /api/groups/:groupname
 * Obtiene información de un grupo específico
 */
router.get('/groups/:groupname', getGroupValidation, groupController.getGroup);

/**
 * POST /api/groups
 * Crea un nuevo grupo
 * Body: { name: string }
 */
router.post('/groups', createGroupValidation, groupController.createGroup);

/**
 * PUT /api/groups/:groupname/members
 * Actualiza los miembros de un grupo
 * Body: { members: string[] }
 */
router.put('/groups/:groupname/members', updateGroupMembersValidation, groupController.updateGroupMembers);

/**
 * DELETE /api/groups/:groupname
 * Elimina un grupo
 */
router.delete('/groups/:groupname', deleteGroupValidation, groupController.deleteGroup);

export default router;
