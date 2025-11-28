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
          Administra los grupos y sus miembros
        </p>
      </div>
      
      <v-row v-cols="12" class="d-flex justify-end">
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
          class="mr-3"
        >
          Crear Grupo
        </v-btn>
        <v-btn
          color="secondary"
          size="large"
          prepend-icon="mdi-refresh"
          @click="loadGroups"
          :loading="loading"
        >
          Actualizar
        </v-btn>
      </v-row>
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
          <v-btn
            icon="mdi-account-edit"
            size="small"
            variant="text"
            color="warning"
            @click="openMembersDialog(item)"
            title="Editar miembros"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="openDeleteDialog(item)"
            title="Eliminar grupo"
            :disabled="isProtectedGroup(item)"
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

    <!-- Diálogo: Crear Grupo -->
    <v-dialog v-model="createDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-primary">
          <v-icon class="mr-2">mdi-plus-circle</v-icon>
          Crear Nuevo Grupo
        </v-card-title>
        
        <v-card-text class="pt-6">
          <v-form ref="createForm" @submit.prevent="handleCreateGroup">
            <v-text-field
              v-model="newGroupName"
              label="Nombre del grupo"
              placeholder="mi-grupo"
              :rules="groupNameRules"
              prepend-icon="mdi-account-group"
              hint="Solo letras minúsculas, números, guiones y guiones bajos. Debe iniciar con letra."
              persistent-hint
              autofocus
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="createDialog = false"
            :disabled="creating"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="handleCreateGroup"
            :loading="creating"
          >
            Crear Grupo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo: Eliminar Grupo -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card v-if="selectedGroup">
        <v-card-title class="text-h5 bg-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          Confirmar Eliminación
        </v-card-title>
        
        <v-card-text class="pt-6">
          <v-alert type="warning" variant="tonal" class="mb-4">
            Esta acción no se puede deshacer.
          </v-alert>
          
          <p class="text-body-1">
            ¿Estás seguro de que deseas eliminar el grupo 
            <strong>"{{ selectedGroup.groupname }}"</strong>?
          </p>
          
          <p v-if="selectedGroup.members && selectedGroup.members.length > 0" class="text-body-2 text-medium-emphasis mt-2">
            Este grupo tiene {{ selectedGroup.members.length }} miembro(s) que serán desasociados.
          </p>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteDialog = false"
            :disabled="deleting"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="handleDeleteGroup"
            :loading="deleting"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo: Editar Miembros -->
    <v-dialog v-model="membersDialog" max-width="700" persistent>
      <v-card v-if="selectedGroup">
        <v-card-title class="text-h5 bg-warning">
          <v-icon class="mr-2">mdi-account-edit</v-icon>
          Editar Miembros: {{ selectedGroup.groupname }}
        </v-card-title>
        
        <v-card-text class="pt-6">
          <v-alert type="info" variant="tonal" class="mb-4" density="compact">
            Selecciona los usuarios que deben pertenecer a este grupo.
            Los usuarios no seleccionados serán removidos del grupo.
          </v-alert>
          
          <v-autocomplete
            v-model="selectedMembers"
            :items="availableUsers"
            item-title="username"
            item-value="username"
            label="Miembros del grupo"
            placeholder="Buscar usuarios..."
            prepend-icon="mdi-account-multiple-plus"
            multiple
            chips
            closable-chips
            clearable
            :loading="loadingUsers"
          >
            <template v-slot:chip="{ props, item }">
              <v-chip
                v-bind="props"
                color="primary"
                variant="outlined"
              >
                <v-icon start size="small">mdi-account</v-icon>
                {{ item.raw.username }}
              </v-chip>
            </template>
            
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :subtitle="`UID: ${item.raw.uid} | ${item.raw.fullName || 'Sin nombre'}`"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" size="32">
                    <v-icon size="small">mdi-account</v-icon>
                  </v-avatar>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
          
          <v-divider class="my-4"></v-divider>
          
          <div class="d-flex justify-space-between align-center">
            <span class="text-body-2 text-medium-emphasis">
              Miembros actuales: {{ selectedGroup.members?.length || 0 }}
            </span>
            <span class="text-body-2 text-medium-emphasis">
              Seleccionados: {{ selectedMembers.length }}
            </span>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="membersDialog = false"
            :disabled="updatingMembers"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="warning"
            variant="elevated"
            @click="handleUpdateMembers"
            :loading="updatingMembers"
          >
            Guardar Cambios
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

    <!-- Snackbar para mensajes -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="bottom right"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { groupService, userService } from '../services/api'
import { useNotification } from '../composables/useNotification'

const { showError } = useNotification()

// Estado
const groups = ref([])
const loading = ref(false)
const search = ref('')
const showAllGroups = ref(true)

// Lista de usuarios disponibles para asignar a grupos
const availableUsers = ref([])
const loadingUsers = ref(false)

// Estados de operaciones
const creating = ref(false)
const deleting = ref(false)
const updatingMembers = ref(false)

// Diálogos
const detailsDialog = ref(false)
const createDialog = ref(false)
const deleteDialog = ref(false)
const membersDialog = ref(false)
const selectedGroup = ref(null)

// Formulario de crear grupo
const createForm = ref(null)
const newGroupName = ref('')

// Formulario de editar miembros
const selectedMembers = ref([])

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Reglas de validación
const groupNameRules = [
  v => !!v || 'El nombre es requerido',
  v => /^[a-z][a-z0-9_-]*$/.test(v) || 'Solo letras minúsculas, números, guiones y guiones bajos. Debe iniciar con letra.',
  v => v.length <= 32 || 'Máximo 32 caracteres'
]

// Grupos protegidos que no se pueden eliminar
const protectedGroups = ['root', 'sudo', 'adm', 'www-data', 'shadow', 'disk', 'wheel', 'staff', 'users']

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
  loadUsers()
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

async function loadUsers() {
  loadingUsers.value = true
  try {
    const response = await userService.list(true)
    availableUsers.value = response.data || []
  } catch (error) {
    console.error('Error cargando usuarios:', error)
  } finally {
    loadingUsers.value = false
  }
}

function isProtectedGroup(group) {
  return protectedGroups.includes(group.groupname) || group.gid < 1000
}

function showMessage(message, color = 'success') {
  snackbar.value = { show: true, message, color }
}

// Diálogo: Detalles
function openDetailsDialog(group) {
  selectedGroup.value = group
  detailsDialog.value = true
}

// Diálogo: Crear Grupo
function openCreateDialog() {
  newGroupName.value = ''
  createDialog.value = true
}

async function handleCreateGroup() {
  const { valid } = await createForm.value.validate()
  if (!valid) return
  
  creating.value = true
  try {
    await groupService.create(newGroupName.value)
    showMessage(`Grupo '${newGroupName.value}' creado exitosamente`)
    createDialog.value = false
    newGroupName.value = ''
    await loadGroups()
  } catch (error) {
    showMessage(error.response?.data?.message || 'Error al crear el grupo', 'error')
  } finally {
    creating.value = false
  }
}

// Diálogo: Eliminar Grupo
function openDeleteDialog(group) {
  selectedGroup.value = group
  deleteDialog.value = true
}

async function handleDeleteGroup() {
  if (!selectedGroup.value) return
  
  deleting.value = true
  try {
    await groupService.delete(selectedGroup.value.groupname)
    showMessage(`Grupo '${selectedGroup.value.groupname}' eliminado exitosamente`)
    deleteDialog.value = false
    selectedGroup.value = null
    await loadGroups()
  } catch (error) {
    showMessage(error.response?.data?.message || 'Error al eliminar el grupo', 'error')
  } finally {
    deleting.value = false
  }
}

// Diálogo: Editar Miembros
function openMembersDialog(group) {
  selectedGroup.value = group
  selectedMembers.value = [...(group.members || [])]
  membersDialog.value = true
}

async function handleUpdateMembers() {
  if (!selectedGroup.value) return
  
  updatingMembers.value = true
  try {
    await groupService.updateMembers(selectedGroup.value.groupname, selectedMembers.value)
    showMessage(`Miembros del grupo '${selectedGroup.value.groupname}' actualizados`)
    membersDialog.value = false
    selectedGroup.value = null
    await loadGroups()
  } catch (error) {
    showMessage(error.response?.data?.message || 'Error al actualizar miembros', 'error')
  } finally {
    updatingMembers.value = false
  }
}
</script>
