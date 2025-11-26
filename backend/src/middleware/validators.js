/**
 * Validadores para las rutas de la API
 * Usa express-validator para validación de entrada
 */

import { body, param, validationResult } from 'express-validator';

/**
 * Middleware para procesar errores de validación
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Error de validación',
      details: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
}

/**
 * Validaciones para crear usuario
 */
export const createUserValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .isLength({ min: 1, max: 32 }).withMessage('El nombre debe tener entre 1 y 32 caracteres')
    .matches(/^[a-z][a-z0-9_-]*$/).withMessage('El nombre debe iniciar con letra minúscula y solo contener letras minúsculas, números, guiones y guiones bajos'),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('groups')
    .optional()
    .isArray().withMessage('Los grupos deben ser un array')
    .custom((groups) => {
      if (groups && groups.length > 0) {
        for (const group of groups) {
          if (!/^[a-z][a-z0-9_-]*$/.test(group)) {
            throw new Error(`Nombre de grupo inválido: ${group}`);
          }
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validaciones para actualizar usuario
 */
export const updateUserValidation = [
  param('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .matches(/^[a-z][a-z0-9_-]*$/).withMessage('Nombre de usuario inválido'),
  
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('groups')
    .optional()
    .isArray().withMessage('Los grupos deben ser un array'),
  
  handleValidationErrors
];

/**
 * Validaciones para actualizar grupos de usuario
 */
export const updateUserGroupsValidation = [
  param('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .matches(/^[a-z][a-z0-9_-]*$/).withMessage('Nombre de usuario inválido'),
  
  body('groups')
    .isArray().withMessage('Los grupos deben ser un array')
    .notEmpty().withMessage('Debe proporcionar al menos un grupo'),
  
  body('append')
    .optional()
    .isBoolean().withMessage('append debe ser un booleano'),
  
  handleValidationErrors
];

/**
 * Validaciones para eliminar usuario
 */
export const deleteUserValidation = [
  param('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .matches(/^[a-z][a-z0-9_-]*$/).withMessage('Nombre de usuario inválido'),
  
  handleValidationErrors
];

/**
 * Validaciones para obtener usuario específico
 */
export const getUserValidation = [
  param('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .matches(/^[a-z][a-z0-9_-]*$/).withMessage('Nombre de usuario inválido'),
  
  handleValidationErrors
];
