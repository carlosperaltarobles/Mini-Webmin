/**
 * Composable para manejar el estado de carga y errores
 */

import { ref } from 'vue'

export function useLoading() {
  const loading = ref(false)
  const error = ref(null)

  /**
   * Ejecuta una función async manejando loading y errores
   * @param {Function} fn - Función async a ejecutar
   * @returns {Promise<any>}
   */
  async function withLoading(fn) {
    loading.value = true
    error.value = null
    
    try {
      return await fn()
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error desconocido'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    loading,
    error,
    withLoading,
    clearError
  }
}
