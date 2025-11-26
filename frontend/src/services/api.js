/**
 * Servicio para comunicación con la API del backend
 */

import axios from 'axios'

// Configuración base de axios
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Error desconocido'
    console.error('[API Error]', message)
    return Promise.reject(error)
  }
)

/**
 * Servicio de usuarios
 */
export const userService = {
  /**
   * Lista todos los usuarios
   * @param {boolean} all - Si incluye usuarios del sistema
   */
  async list(all = false) {
    const { data } = await api.get('/users', { params: { all } })
    return data
  },

  /**
   * Obtiene un usuario específico
   * @param {string} username
   */
  async get(username) {
    const { data } = await api.get(`/users/${username}`)
    return data
  },

  /**
   * Crea un nuevo usuario
   * @param {Object} userData - { username, password, groups }
   */
  async create(userData) {
    const { data } = await api.post('/users', userData)
    return data
  },

  /**
   * Actualiza un usuario
   * @param {string} username
   * @param {Object} updates - { password?, groups? }
   */
  async update(username, updates) {
    const { data } = await api.put(`/users/${username}`, updates)
    return data
  },

  /**
   * Actualiza los grupos de un usuario
   * @param {string} username
   * @param {Array} groups
   * @param {boolean} append
   */
  async updateGroups(username, groups, append = false) {
    const { data } = await api.put(`/users/${username}/groups`, { groups, append })
    return data
  },

  /**
   * Elimina un usuario
   * @param {string} username
   * @param {boolean} removeHome
   */
  async delete(username, removeHome = false) {
    const { data } = await api.delete(`/users/${username}`, { params: { removeHome } })
    return data
  }
}

/**
 * Servicio de grupos
 */
export const groupService = {
  /**
   * Lista todos los grupos
   * @param {boolean} all - Si incluye grupos del sistema
   */
  async list(all = true) {
    const { data } = await api.get('/groups', { params: { all } })
    return data
  },

  /**
   * Obtiene un grupo específico
   * @param {string} groupname
   */
  async get(groupname) {
    const { data } = await api.get(`/groups/${groupname}`)
    return data
  }
}

export default api
