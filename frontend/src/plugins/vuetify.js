/**
 * Configuración de Vuetify 3
 */

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        colors: {
          primary: '#E91E63',
          secondary: '#FF5722',
          accent: '#FFC107',
          error: '#F44336',
          warning: '#FF9800',
          info: '#2196F3',
          success: '#4CAF50',
          background: '#FAFAFA'
        }
      },
      dark: {
        colors: {
          primary: '#E91E63',
          secondary: '#FF5722',
          accent: '#FFC107',
          error: '#F44336',
          warning: '#FF9800',
          info: '#2196F3',
          success: '#4CAF50',
          background: '#121212'
        }
      }
    }
  },
  defaults: {
    VCard: {
      elevation: 2
    },
    VBtn: {
      variant: 'flat'
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable'
    }
  }
})

export default vuetify
