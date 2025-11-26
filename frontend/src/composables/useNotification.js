/**
 * Composable para manejar notificaciones (snackbar)
 */

import { ref } from 'vue'

// Estado global de notificaciones
const snackbar = ref({
  show: false,
  message: '',
  color: 'info',
  timeout: 3000
})

export function useNotification() {
  /**
   * Muestra una notificación de éxito
   * @param {string} message
   */
  function showSuccess(message) {
    snackbar.value = {
      show: true,
      message,
      color: 'success',
      timeout: 3000
    }
  }

  /**
   * Muestra una notificación de error
   * @param {string} message
   */
  function showError(message) {
    snackbar.value = {
      show: true,
      message,
      color: 'error',
      timeout: 5000
    }
  }

  /**
   * Muestra una notificación de información
   * @param {string} message
   */
  function showInfo(message) {
    snackbar.value = {
      show: true,
      message,
      color: 'info',
      timeout: 3000
    }
  }

  /**
   * Muestra una notificación de advertencia
   * @param {string} message
   */
  function showWarning(message) {
    snackbar.value = {
      show: true,
      message,
      color: 'warning',
      timeout: 4000
    }
  }

  /**
   * Cierra la notificación actual
   */
  function close() {
    snackbar.value.show = false
  }

  return {
    snackbar,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    close
  }
}
