<template>
  <div>
    <!-- Encabezado -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          <v-icon size="large" class="mr-2">mdi-account-multiple</v-icon>
          Grupos del Sistema
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Visualiza los grupos y sus miembros
        </p>
      </div>
      
      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-refresh"
        @click="loadGroups"
        :loading="loading"
      >
        Actualizar
      </v-btn>
    </div>

    <!-- Filtros -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Buscar grupo..."
              clearable
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="d-flex justify-end">
            <v-switch
              v-model="showAllGroups"
              label="Mostrar grupos del sistema"
              color="primary"
              hide-details
              @update:model-value="loadGroups"
            ></v-switch>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla de grupos -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredGroups"
        :loading="loading"
        :search="search"
        class="elevation-0"
        hover
        :items-per-page="15"
      >
        <!-- Columna Nombre del grupo -->
        <template v-slot:item.groupname="{ item }">
          <div class="d-flex align-center">
            <v-avatar color="secondary" size="32" class="mr-2">
              <v-icon size="small">mdi-account-group</v-icon>
            </v-avatar>
            <strong>{{ item.groupname }}</strong>
          </div>
        </template>

        <!-- Columna GID -->
        <template v-slot:item.gid="{ item }">
          <v-chip size="small" :color="item.gid < 1000 ? 'warning' : 'default'">
            {{ item.gid }}
          </v-chip>
        </template>

        <!-- Columna Miembros -->
        <template v-slot:item.members="{ item }">
          <div v-if="item.members && item.members.length > 0">
            <v-chip
              v-for="member in item.members.slice(0, 5)"
              :key="member"
              size="small"
              color="primary"
              variant="outlined"
              class="ma-1"
            >
              <v-icon start size="small">mdi-account</v-icon>
              {{ member }}
            </v-chip>
            <v-chip
              v-if="item.members.length > 5"
              size="small"
              color="grey"
              variant="flat"
              class="ma-1"
            >
              +{{ item.members.length - 5 }} más
            </v-chip>
          </div>
          <span v-else class="text-medium-emphasis text-body-2">
            Sin miembros adicionales
          </span>
        </template>

        <!-- Columna Cantidad -->
        <template v-slot:item.count="{ item }">
          <v-badge
            :content="item.members?.length || 0"
            :color="item.members?.length > 0 ? 'primary' : 'grey'"
            inline
          ></v-badge>
        </template>

        <!-- Columna Acciones -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="text"
            color="info"
            @click="openDetailsDialog(item)"
            title="Ver detalles"
          ></v-btn>
        </template>

        <!-- Estado de carga -->
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
        </template>

        <!-- Sin datos -->
        <template v-slot:no-data>
          <div class="text-center py-6">
            <v-icon size="64" color="grey">mdi-account-multiple-remove</v-icon>
            <p class="text-h6 mt-2">No hay grupos</p>
            <v-btn color="primary" @click="loadGroups">Recargar</v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Diálogo: Detalles del Grupo -->
    <v-dialog v-model="detailsDialog" max-width="600">
      <v-card v-if="selectedGroup">
        <v-card-title class="text-h5 bg-secondary">
          <v-icon class="mr-2">mdi-account-group</v-icon>
          Grupo: {{ selectedGroup.groupname }}
        </v-card-title>
        
        <v-card-text class="pt-4">
          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon>mdi-identifier</v-icon>
              </template>
              <v-list-item-title>GID</v-list-item-title>
              <v-list-item-subtitle>{{ selectedGroup.gid }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon>mdi-account-multiple</v-icon>
              </template>
              <v-list-item-title>Total de miembros</v-list-item-title>
              <v-list-item-subtitle>{{ selectedGroup.members?.length || 0 }} usuarios</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-divider class="my-4"></v-divider>

          <h4 class="text-h6 mb-3">Miembros del grupo:</h4>
          
          <div v-if="selectedGroup.members && selectedGroup.members.length > 0">
            <v-chip
              v-for="member in selectedGroup.members"
              :key="member"
              color="primary"
              variant="tonal"
              class="ma-1"
            >
              <v-icon start>mdi-account</v-icon>
              {{ member }}
            </v-chip>
          </div>
          <v-alert v-else type="info" variant="tonal">
            Este grupo no tiene miembros adicionales asignados.
            Los usuarios que tienen este grupo como grupo primario no aparecen aquí.
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="detailsDialog = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Estadísticas rápidas -->
    <v-row class="mt-6">
      <v-col cols="12" md="4">
        <v-card color="primary" variant="tonal">
          <v-card-text class="d-flex align-center">
            <v-avatar color="primary" size="56" class="mr-4">
              <v-icon size="large">mdi-account-group</v-icon>
            </v-avatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ totalGroups }}</div>
              <div class="text-body-2">Grupos totales</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card color="secondary" variant="tonal">
          <v-card-text class="d-flex align-center">
            <v-avatar color="secondary" size="56" class="mr-4">
              <v-icon size="large">mdi-account-multiple-check</v-icon>
            </v-avatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ groupsWithMembers }}</div>
              <div class="text-body-2">Grupos con miembros</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card color="info" variant="tonal">
          <v-card-text class="d-flex align-center">
            <v-avatar color="info" size="56" class="mr-4">
              <v-icon size="large">mdi-account-supervisor</v-icon>
            </v-avatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ userGroups }}</div>
              <div class="text-body-2">Grupos de usuario (GID ≥ 1000)</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { groupService } from '../services/api'
import { useNotification } from '../composables/useNotification'

const { showError } = useNotification()

// Estado
const groups = ref([])
const loading = ref(false)
const search = ref('')
const showAllGroups = ref(true)

// Diálogo de detalles
const detailsDialog = ref(false)
const selectedGroup = ref(null)

// Columnas de la tabla
const headers = [
  { title: 'Grupo', key: 'groupname', sortable: true },
  { title: 'GID', key: 'gid', sortable: true },
  { title: 'Miembros', key: 'members', sortable: false },
  { title: 'Cant.', key: 'count', sortable: false, align: 'center' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
]

// Grupos filtrados
const filteredGroups = computed(() => {
  return groups.value
})

// Estadísticas
const totalGroups = computed(() => groups.value.length)

const groupsWithMembers = computed(() => {
  return groups.value.filter(g => g.members && g.members.length > 0).length
})

const userGroups = computed(() => {
  return groups.value.filter(g => g.gid >= 1000).length
})

// Cargar datos al montar
onMounted(() => {
  loadGroups()
})

// Funciones
async function loadGroups() {
  loading.value = true
  try {
    const response = await groupService.list(showAllGroups.value)
    groups.value = response.data || []
  } catch (error) {
    showError('Error al cargar grupos: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

function openDetailsDialog(group) {
  selectedGroup.value = group
  detailsDialog.value = true
}
</script>
