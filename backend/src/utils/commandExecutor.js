/**
 * Utilidad para ejecutar comandos del sistema de forma segura
 * IMPORTANTE: Todos los comandos se ejecutan con sudo
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Ejecuta un comando del sistema con sudo
 * @param {string} command - Comando a ejecutar (sin sudo, se agrega automáticamente)
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function executeCommand(command) {
  try {
    // Agregamos sudo al comando
    const fullCommand = `sudo ${command}`;
    console.log(`[CommandExecutor] Ejecutando: ${fullCommand}`);
    
    const { stdout, stderr } = await execAsync(fullCommand, {
      timeout: 30000, // 30 segundos máximo
      maxBuffer: 1024 * 1024 // 1MB de buffer
    });
    
    return { stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    console.error(`[CommandExecutor] Error ejecutando comando: ${command}`, error);
    throw new Error(`Error ejecutando comando: ${error.message}`);
  }
}

/**
 * Ejecuta un comando sin sudo (para lectura de archivos públicos)
 * @param {string} command - Comando a ejecutar
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function executeReadCommand(command) {
  try {
    console.log(`[CommandExecutor] Ejecutando (sin sudo): ${command}`);
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 10000,
      maxBuffer: 1024 * 1024
    });
    
    return { stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    console.error(`[CommandExecutor] Error ejecutando comando: ${command}`, error);
    throw new Error(`Error ejecutando comando: ${error.message}`);
  }
}

/**
 * Escapa caracteres especiales para evitar inyección de comandos
 * @param {string} input - String a escapar
 * @returns {string} - String escapado
 */
export function escapeShellArg(input) {
  if (!input) return '';
  // Reemplaza caracteres peligrosos
  return input.replace(/[`$\\;"'|&<>(){}[\]!\n\r\t]/g, '');
}

/**
 * Valida que un nombre de usuario sea seguro
 * @param {string} username - Nombre de usuario a validar
 * @returns {boolean}
 */
export function isValidUsername(username) {
  // Solo permite letras minúsculas, números, guiones y guiones bajos
  // Debe comenzar con letra y tener entre 1 y 32 caracteres
  const regex = /^[a-z][a-z0-9_-]{0,31}$/;
  return regex.test(username);
}

/**
 * Valida que un nombre de grupo sea seguro
 * @param {string} groupname - Nombre de grupo a validar
 * @returns {boolean}
 */
export function isValidGroupname(groupname) {
  const regex = /^[a-z][a-z0-9_-]{0,31}$/;
  return regex.test(groupname);
}
