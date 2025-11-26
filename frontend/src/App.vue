<template>
  <v-app>
    <!-- Barra de navegación superior -->
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon 
        @click="drawer = !drawer"
        class="d-lg-none"
      ></v-app-bar-nav-icon>

      <v-toolbar-title class="d-flex align-center">
        <span class="text-h5 font-weight-bold">🐷 La Chanchona</span>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Navegación en desktop -->
      <div class="d-none d-lg-flex">
        <v-btn
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          variant="text"
          class="mx-1"
        >
          {{ item.title }}
        </v-btn>
      </div>

      <v-btn icon @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Drawer para móvil -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
      class="d-lg-none"
    >
      <v-list nav>
        <v-list-item
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
          @click="drawer = false"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Contenido principal -->
    <v-main>
      <v-container fluid class="pa-4 pa-md-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer app class="bg-surface-variant">
      <v-row justify="center" no-gutters>
        <v-col class="text-center py-2" cols="12">
          <span class="text-body-2">
            🐷 La Chanchona v1.0.0 - Panel de Administración de Usuarios Linux
          </span>
        </v-col>
      </v-row>
    </v-footer>

    <!-- Snackbar global para notificaciones -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useNotification } from './composables/useNotification'

const theme = useTheme()
const { snackbar } = useNotification()

const drawer = ref(false)

const navItems = [
  { title: 'Usuarios', path: '/users', icon: 'mdi-account-group' },
  { title: 'Grupos', path: '/groups', icon: 'mdi-account-multiple' }
]

const isDark = computed(() => theme.global.current.value.dark)

function toggleTheme() {
  theme.global.name.value = isDark.value ? 'light' : 'dark'
}
</script>

<style scoped>
.v-toolbar-title {
  cursor: default;
}
</style>
