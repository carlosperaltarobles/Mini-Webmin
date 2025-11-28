/**
 * Servicio para administración de usuarios y grupos del sistema
 * Este módulo encapsula todos los comandos de Linux para gestión de usuarios
 */

import { 
  executeCommand, 
  executeReadCommand, 
  escapeShellArg, 
  isValidUsername, 
  isValidGroupname 
} from '../utils/commandExecutor.js';

/**
 * Lista todos los usuarios del sistema
 * Usa getent passwd para obtener la información
 * @param {boolean} onlyHumans - Si es true, solo retorna usuarios con UID >= 1000
 * @returns {Promise<Array>} Lista de usuarios con su información
 */
export async function listUsers(onlyHumans = true) {
  try {
    const { stdout } = await executeReadCommand('getent passwd');
    
    const users = stdout.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [username, , uid, gid, gecos, home, shell] = line.split(':');
        return {
          username,
          uid: parseInt(uid, 10),
          gid: parseInt(gid, 10),
          fullName: gecos ? gecos.split(',')[0] : '',
          home,
          shell
        };
      });
    
    // Si onlyHumans es true, filtramos usuarios del sistema (UID < 1000)
    // Exceptuamos root (UID 0) y nobody
    if (onlyHumans) {
      return users.filter(u => u.uid >= 1000 || u.uid === 0);
    }
    
    return users;
  } catch (error) {
    console.error('[SystemUserService] Error listando usuarios:', error);
    throw new Error('No se pudo obtener la lista de usuarios');
  }
}

/**
 * Obtiene información de un usuario específico
 * @param {string} username - Nombre del usuario
 * @returns {Promise<Object>} Información del usuario
 */
export async function getUser(username) {
  if (!isValidUsername(username)) {
    throw new Error('Nombre de usuario inválido');
  }
  
  try {
    const { stdout } = await executeReadCommand(`getent passwd ${escapeShellArg(username)}`);
    
    if (!stdout) {
      throw new Error('Usuario no encontrado');
    }
    
    const [user, , uid, gid, gecos, home, shell] = stdout.split(':');
    
    // Obtener grupos del usuario
    const groups = await getUserGroups(username);
    
    return {
      username: user,
      uid: parseInt(uid, 10),
      gid: parseInt(gid, 10),
      fullName: gecos ? gecos.split(',')[0] : '',
      home,
      shell,
      groups
    };
  } catch (error) {
    console.error(`[SystemUserService] Error obteniendo usuario ${username}:`, error);
    throw error;
  }
}

/**
 * Obtiene los grupos a los que pertenece un usuario
 * @param {string} username - Nombre del usuario
 * @returns {Promise<Array<string>>} Lista de nombres de grupos
 */
export async function getUserGroups(username) {
  if (!isValidUsername(username)) {
    throw new Error('Nombre de usuario inválido');
  }
  
  try {
    const { stdout } = await executeReadCommand(`groups ${escapeShellArg(username)}`);
    // El formato es: "username : group1 group2 group3"
    const parts = stdout.split(':');
    if (parts.length < 2) return [];
    
    return parts[1].trim().split(/\s+/).filter(g => g);
  } catch (error) {
    console.error(`[SystemUserService] Error obteniendo grupos de ${username}:`, error);
    return [];
  }
}

/**
 * Crea un nuevo usuario en el sistema
 * @param {string} username - Nombre del usuario
 * @param {string} password - Contraseña del usuario
 * @param {Array<string>} groups - Lista opcional de grupos adicionales
 * @returns {Promise<Object>} Información del usuario creado
 */
export async function createUser(username, password, groups = []) {
  // Validaciones
  if (!isValidUsername(username)) {
    throw new Error('Nombre de usuario inválido. Solo letras minúsculas, números, guiones y guiones bajos.');
  }
  
  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  
  // Validar grupos
  for (const group of groups) {
    if (!isValidGroupname(group)) {
      throw new Error(`Nombre de grupo inválido: ${group}`);
    }
  }
  
  try {
    // Verificar si el usuario ya existe
    try {
      await executeReadCommand(`getent passwd ${escapeShellArg(username)}`);
      throw new Error('El usuario ya existe');
    } catch (e) {
      // Si no existe, continuamos (getent falla si no encuentra el usuario)
      if (e.message === 'El usuario ya existe') throw e;
    }
    
    // Crear el usuario con adduser (modo no interactivo)
    // --disabled-password: no establece contraseña inicial
    // --gecos "": evita preguntas interactivas
    const safeUsername = escapeShellArg(username);
    await executeCommand(`adduser --disabled-password --gecos "" ${safeUsername}`);
    
    // Establecer la contraseña usando chpasswd
    // Usamos echo y pipe para pasar la contraseña de forma segura
    const safePassword = escapeShellArg(password);
    await executeCommand(`bash -c 'echo "${safeUsername}:${safePassword}" | chpasswd'`);
    
    // Agregar a grupos adicionales si se especificaron
    if (groups.length > 0) {
      const safeGroups = groups.map(g => escapeShellArg(g)).join(',');
      await executeCommand(`usermod -aG ${safeGroups} ${safeUsername}`);
    }
    
    // Retornar información del usuario creado
    return await getUser(username);
  } catch (error) {
    console.error(`[SystemUserService] Error creando usuario ${username}:`, error);
    throw error;
  }
}

/**
 * Actualiza un usuario existente
 * @param {string} username - Nombre del usuario
 * @param {Object} options - Opciones de actualización
 * @param {string} options.password - Nueva contraseña (opcional)
 * @param {Array<string>} options.groups - Nuevos grupos (opcional)
 * @returns {Promise<Object>} Información del usuario actualizado
 */
export async function updateUser(username, { password, groups } = {}) {
  if (!isValidUsername(username)) {
    throw new Error('Nombre de usuario inválido');
  }
  
  try {
    // Verificar que el usuario existe
    await getUser(username);
    
    const safeUsername = escapeShellArg(username);
    
    // Cambiar contraseña si se proporcionó
    if (password) {
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      const safePassword = escapeShellArg(password);
      await executeCommand(`bash -c 'echo "${safeUsername}:${safePassword}" | chpasswd'`);
    }
    
    // Actualizar grupos si se proporcionaron
    if (groups && Array.isArray(groups)) {
      // Validar grupos
      for (const group of groups) {
        if (!isValidGroupname(group)) {
          throw new Error(`Nombre de grupo inválido: ${group}`);
        }
      }
      
      if (groups.length > 0) {
        const safeGroups = groups.map(g => escapeShellArg(g)).join(',');
        // -G establece los grupos suplementarios (reemplaza los existentes)
        // -a agrega sin eliminar los existentes
        await executeCommand(`usermod -G ${safeGroups} ${safeUsername}`);
      }
    }
    
    return await getUser(username);
  } catch (error) {
    console.error(`[SystemUserService] Error actualizando usuario ${username}:`, error);
    throw error;
  }
}

/**
 * Actualiza solo los grupos de un usuario
 * @param {string} username - Nombre del usuario
 * @param {Array<string>} groups - Lista de grupos
 * @param {boolean} append - Si es true, agrega a los grupos existentes
 * @returns {Promise<Object>} Información del usuario actualizado
 */
export async function updateUserGroups(username, groups, append = false) {
  if (!isValidUsername(username)) {
    throw new Error('Nombre de usuario inválido');
  }
  
  // Validar grupos
  for (const group of groups) {
    if (!isValidGroupname(group)) {
      throw new Error(`Nombre de grupo inválido: ${group}`);
    }
  }
  
  try {
    const safeUsername = escapeShellArg(username);
    const safeGroups = groups.map(g => escapeShellArg(g)).join(',');
    
    if (append) {
      // Agregar a grupos sin eliminar los existentes
      await executeCommand(`usermod -aG ${safeGroups} ${safeUsername}`);
    } else {
      // Reemplazar grupos suplementarios
      await executeCommand(`usermod -G ${safeGroups} ${safeUsername}`);
    }
    
    return await getUser(username);
  } catch (error) {
    console.error(`[SystemUserService] Error actualizando grupos de ${username}:`, error);
    throw error;
  }
}

/**
 * Elimina un usuario del sistema
 * @param {string} username - Nombre del usuario a eliminar
 * @param {boolean} removeHome - Si es true, elimina también el directorio home
 * @returns {Promise<boolean>}
 */
export async function deleteUser(username, removeHome = false) {
  if (!isValidUsername(username)) {
    throw new Error('Nombre de usuario inválido');
  }
  
  // Proteger usuarios críticos del sistema
  const protectedUsers = ['root', 'nobody', 'www-data', 'systemd-network', 'systemd-resolve'];
  if (protectedUsers.includes(username)) {
    throw new Error('No se puede eliminar este usuario del sistema');
  }
  
  try {
    const safeUsername = escapeShellArg(username);
    
    // Verificar que el usuario existe
    await getUser(username);
    
    // Usar deluser para eliminar el usuario
    // --remove-home elimina también el directorio home
    const flags = removeHome ? '--remove-home' : '';
    await executeCommand(`deluser ${flags} ${safeUsername}`);
    
    return true;
  } catch (error) {
    console.error(`[SystemUserService] Error eliminando usuario ${username}:`, error);
    throw error;
  }
}

/**
 * Lista todos los grupos del sistema
 * @param {boolean} onlyHumans - Si es true, solo retorna grupos con GID >= 1000
 * @returns {Promise<Array>} Lista de grupos
 */
export async function listGroups(onlyHumans = false) {
  try {
    const { stdout } = await executeReadCommand('getent group');
    
    const groups = stdout.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [groupname, , gid, members] = line.split(':');
        return {
          groupname,
          gid: parseInt(gid, 10),
          members: members ? members.split(',').filter(m => m) : []
        };
      });
    
    if (onlyHumans) {
      return groups.filter(g => g.gid >= 1000);
    }
    
    return groups;
  } catch (error) {
    console.error('[SystemUserService] Error listando grupos:', error);
    throw new Error('No se pudo obtener la lista de grupos');
  }
}

/**
 * Obtiene información de un grupo específico
 * @param {string} groupname - Nombre del grupo
 * @returns {Promise<Object>} Información del grupo
 */
export async function getGroup(groupname) {
  if (!isValidGroupname(groupname)) {
    throw new Error('Nombre de grupo inválido');
  }
  
  try {
    const { stdout } = await executeReadCommand(`getent group ${escapeShellArg(groupname)}`);
    
    if (!stdout) {
      throw new Error('Grupo no encontrado');
    }
    
    const [name, , gid, members] = stdout.split(':');
    
    return {
      groupname: name,
      gid: parseInt(gid, 10),
      members: members ? members.split(',').filter(m => m) : []
    };
  } catch (error) {
    console.error(`[SystemUserService] Error obteniendo grupo ${groupname}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo grupo en el sistema
 * @param {string} groupname - Nombre del grupo a crear
 * @returns {Promise<Object>} Información del grupo creado
 */
export async function createGroup(groupname) {
  if (!isValidGroupname(groupname)) {
    throw new Error('Nombre de grupo inválido. Solo letras minúsculas, números, guiones y guiones bajos.');
  }
  
  try {
    // Verificar si el grupo ya existe
    try {
      await executeReadCommand(`getent group ${escapeShellArg(groupname)}`);
      throw new Error('El grupo ya existe');
    } catch (e) {
      // Si no existe, continuamos (getent falla si no encuentra el grupo)
      if (e.message === 'El grupo ya existe') throw e;
    }
    
    const safeGroupname = escapeShellArg(groupname);
    
    // Crear el grupo con addgroup
    await executeCommand(`addgroup ${safeGroupname}`);
    
    // Retornar información del grupo creado
    return await getGroup(groupname);
  } catch (error) {
    console.error(`[SystemUserService] Error creando grupo ${groupname}:`, error);
    throw error;
  }
}

/**
 * Elimina un grupo del sistema
 * @param {string} groupname - Nombre del grupo a eliminar
 * @returns {Promise<boolean>}
 */
export async function deleteGroup(groupname) {
  if (!isValidGroupname(groupname)) {
    throw new Error('Nombre de grupo inválido');
  }
  
  // Proteger grupos críticos del sistema
  const protectedGroups = ['root', 'sudo', 'adm', 'www-data', 'shadow', 'disk', 'wheel', 'staff', 'users'];
  if (protectedGroups.includes(groupname)) {
    throw new Error('No se puede eliminar este grupo del sistema');
  }
  
  try {
    const safeGroupname = escapeShellArg(groupname);
    
    // Verificar que el grupo existe
    await getGroup(groupname);
    
    // Usar delgroup para eliminar el grupo
    await executeCommand(`delgroup ${safeGroupname}`);
    
    return true;
  } catch (error) {
    console.error(`[SystemUserService] Error eliminando grupo ${groupname}:`, error);
    throw error;
  }
}

/**
 * Actualiza los miembros de un grupo
 * Calcula diferencias y añade/remueve usuarios según corresponda
 * @param {string} groupname - Nombre del grupo
 * @param {Array<string>} newMembers - Lista de usuarios que deben ser miembros del grupo
 * @returns {Promise<Object>} Información del grupo actualizado
 */
export async function updateGroupMembers(groupname, newMembers) {
  if (!isValidGroupname(groupname)) {
    throw new Error('Nombre de grupo inválido');
  }
  
  // Validar nombres de usuario
  for (const member of newMembers) {
    if (!isValidUsername(member)) {
      throw new Error(`Nombre de usuario inválido: ${member}`);
    }
  }
  
  try {
    // Obtener estado actual del grupo
    const group = await getGroup(groupname);
    const currentMembers = group.members || [];
    
    const safeGroupname = escapeShellArg(groupname);
    
    // Calcular usuarios a añadir (están en newMembers pero no en currentMembers)
    const toAdd = newMembers.filter(m => !currentMembers.includes(m));
    
    // Calcular usuarios a remover (están en currentMembers pero no en newMembers)
    const toRemove = currentMembers.filter(m => !newMembers.includes(m));
    
    console.log(`[SystemUserService] Grupo ${groupname}: añadir [${toAdd.join(', ')}], remover [${toRemove.join(', ')}]`);
    
    // Añadir usuarios al grupo usando gpasswd -a
    for (const username of toAdd) {
      const safeUsername = escapeShellArg(username);
      try {
        await executeCommand(`gpasswd -a ${safeUsername} ${safeGroupname}`);
      } catch (e) {
        console.error(`[SystemUserService] Error añadiendo ${username} a ${groupname}:`, e);
        // Continuar con los demás usuarios
      }
    }
    
    // Remover usuarios del grupo usando gpasswd -d
    for (const username of toRemove) {
      const safeUsername = escapeShellArg(username);
      try {
        await executeCommand(`gpasswd -d ${safeUsername} ${safeGroupname}`);
      } catch (e) {
        console.error(`[SystemUserService] Error removiendo ${username} de ${groupname}:`, e);
        // Continuar con los demás usuarios
      }
    }
    
    // Retornar estado actualizado del grupo
    return await getGroup(groupname);
  } catch (error) {
    console.error(`[SystemUserService] Error actualizando miembros de ${groupname}:`, error);
    throw error;
  }
}

// Exportar todas las funciones como un objeto para uso conveniente
export default {
  listUsers,
  getUser,
  getUserGroups,
  createUser,
  updateUser,
  updateUserGroups,
  deleteUser,
  listGroups,
  getGroup,
  createGroup,
  deleteGroup,
  updateGroupMembers
};
