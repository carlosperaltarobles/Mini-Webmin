<template>
  <div>
    <!-- Encabezado -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          <v-icon size="large" class="mr-2">mdi-account-group</v-icon>
          Usuarios del Sistema
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Gestiona los usuarios de tu sistema Linux
        </p>
      </div>
      
      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-account-plus"
        @click="openCreateDialog"
      >
        Crear Usuario
      </v-btn>
    </div>

    <!-- Filtros y controles -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Buscar usuario..."
              clearable
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="d-flex justify-end">
            <v-switch
              v-model="showAllUsers"
              label="Mostrar usuarios del sistema"
              color="primary"
              hide-details
              @update:model-value="loadUsers"
            ></v-switch>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla de usuarios -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredUsers"
        :loading="loading"
        :search="search"
        class="elevation-0"
        hover
      >
        <!-- Columna Username -->
        <template v-slot:item.username="{ item }">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="32" class="mr-2">
              <span class="text-white text-body-2">{{ item.username.charAt(0).toUpperCase() }}</span>
            </v-avatar>
            <strong>{{ item.username }}</strong>
          </div>
        </template>

        <!-- Columna UID -->
        <template v-slot:item.uid="{ item }">
          <v-chip size="small" :color="item.uid < 1000 ? 'warning' : 'default'">
            {{ item.uid }}
          </v-chip>
        </template>

        <!-- Columna Shell -->
        <template v-slot:item.shell="{ item }">
          <code class="text-body-2">{{ item.shell }}</code>
        </template>

        <!-- Columna Home -->
        <template v-slot:item.home="{ item }">
          <code class="text-body-2">{{ item.home }}</code>
        </template>

        <!-- Columna Acciones -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            color="info"
            @click="openEditDialog(item)"
            title="Editar usuario"
          ></v-btn>
          <v-btn
            icon="mdi-account-multiple"
            size="small"
            variant="text"
            color="secondary"
            @click="openGroupsDialog(item)"
            title="Gestionar grupos"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="openDeleteDialog(item)"
            title="Eliminar usuario"
            :disabled="isProtectedUser(item.username)"
          ></v-btn>
        </template>

        <!-- Estado de carga -->
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
        </template>

        <!-- Sin datos -->
        <template v-slot:no-data>
          <div class="text-center py-6">
            <v-icon size="64" color="grey">mdi-account-off</v-icon>
            <p class="text-h6 mt-2">No hay usuarios</p>
            <v-btn color="primary" @click="loadUsers">Recargar</v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Diálogo: Crear Usuario -->
    <v-dialog v-model="createDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-primary">
          <v-icon class="mr-2">mdi-account-plus</v-icon>
          Crear Nuevo Usuario
        </v-card-title>
        
        <v-card-text class="pt-4">
          <v-form ref="createForm" v-model="createFormValid">
            <v-text-field
              v-model="newUser.username"
              label="Nombre de usuario"
              :rules="usernameRules"
              prepend-inner-icon="mdi-account"
              hint="Solo letras minúsculas, números, guiones"
              persistent-hint
            ></v-text-field>

            <v-text-field
              v-model="newUser.password"
              label="Contraseña"
              :type="showPassword ? 'text' : 'password'"
              :rules="passwordRules"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              class="mt-3"
            ></v-text-field>

            <v-text-field
              v-model="newUser.confirmPassword"
              label="Confirmar contraseña"
              :type="showPassword ? 'text' : 'password'"
              :rules="confirmPasswordRules"
              prepend-inner-icon="mdi-lock-check"
              class="mt-3"
            ></v-text-field>

            <v-select
              v-model="newUser.groups"
              :items="availableGroups"
              item-title="groupname"
              item-value="groupname"
              label="Grupos adicionales (opcional)"
              prepend-inner-icon="mdi-account-multiple"
              multiple
              chips
              closable-chips
              class="mt-3"
            ></v-select>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn @click="createDialog = false" :disabled="creating">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            @click="createUser"
            :loading="creating"
            :disabled="!createFormValid"
          >
            Crear Usuario
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo: Editar Usuario (Cambiar Contraseña) -->
    <v-dialog v-model="editDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-info">
          <v-icon class="mr-2">mdi-pencil</v-icon>
          Editar Usuario: {{ selectedUser?.username }}
        </v-card-title>
        
        <v-card-text class="pt-4">
          <v-form ref="editForm" v-model="editFormValid">
            <v-text-field
              v-model="editUser.password"
              label="Nueva contraseña"
              :type="showEditPassword ? 'text' : 'password'"
              :rules="editPasswordRules"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showEditPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showEditPassword = !showEditPassword"
              hint="Dejar vacío para no cambiar"
              persistent-hint
            ></v-text-field>

            <v-text-field
              v-model="editUser.confirmPassword"
              label="Confirmar nueva contraseña"
              :type="showEditPassword ? 'text' : 'password'"
              :rules="editConfirmPasswordRules"
              prepend-inner-icon="mdi-lock-check"
              class="mt-3"
              :disabled="!editUser.password"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn @click="editDialog = false" :disabled="updating">
            Cancelar
          </v-btn>
          <v-btn
            color="info"
            @click="updateUser"
            :loading="updating"
            :disabled="!editFormValid || !editUser.password"
          >
            Guardar Cambios
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo: Gestionar Grupos -->
    <v-dialog v-model="groupsDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-secondary">
          <v-icon class="mr-2">mdi-account-multiple</v-icon>
          Grupos de: {{ selectedUser?.username }}
        </v-card-title>
        
        <v-card-text class="pt-4">
          <p class="text-body-2 mb-4">
            Selecciona los grupos a los que pertenecerá el usuario:
          </p>
          
          <v-select
            v-model="userGroups"
            :items="availableGroups"
            item-title="groupname"
            item-value="groupname"
            label="Grupos"
            prepend-inner-icon="mdi-account-multiple"
            multiple
            chips
            closable-chips
          ></v-select>

          <v-alert type="info" variant="tonal" class="mt-4">
            <strong>Nota:</strong> Al guardar, se reemplazarán todos los grupos suplementarios del usuario.
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn @click="groupsDialog = false" :disabled="updatingGroups">
            Cancelar
          </v-btn>
          <v-btn
            color="secondary"
            @click="updateUserGroups"
            :loading="updatingGroups"
          >
            Guardar Grupos
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo: Confirmar Eliminación -->
    <v-dialog v-model="deleteDialog" max-width="450">
      <v-card>
        <v-card-title class="text-h5 bg-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          Confirmar Eliminación
        </v-card-title>
        
        <v-card-text class="pt-4">
          <p>¿Estás seguro de que deseas eliminar al usuario <strong>{{ selectedUser?.username }}</strong>?</p>
          
          <v-checkbox
            v-model="removeHomeOnDelete"
            label="Eliminar también el directorio home"
            color="error"
            class="mt-2"
          ></v-checkbox>

          <v-alert type="warning" variant="tonal" class="mt-2">
            Esta acción no se puede deshacer.
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn @click="deleteDialog = false" :disabled="deleting">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            @click="deleteUser"
            :loading="deleting"
          >
            Eliminar Usuario
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { userService, groupService } from '../services/api'
import { useNotification } from '../composables/useNotification'

const { showSuccess, showError } = useNotification()

// Estado
const users = ref([])
const availableGroups = ref([])
const loading = ref(false)
const search = ref('')
const showAllUsers = ref(false)

// Diálogos
const createDialog = ref(false)
const editDialog = ref(false)
const groupsDialog = ref(false)
const deleteDialog = ref(false)

// Formularios
const createForm = ref(null)
const editForm = ref(null)
const createFormValid = ref(false)
const editFormValid = ref(false)

// Estado de operaciones
const creating = ref(false)
const updating = ref(false)
const updatingGroups = ref(false)
const deleting = ref(false)

// Usuario seleccionado para editar/eliminar
const selectedUser = ref(null)

// Mostrar contraseñas
const showPassword = ref(false)
const showEditPassword = ref(false)

// Datos del formulario de creación
const newUser = ref({
  username: '',
  password: '',
  confirmPassword: '',
  groups: []
})

// Datos del formulario de edición
const editUser = ref({
  password: '',
  confirmPassword: ''
})

// Grupos del usuario seleccionado
const userGroups = ref([])

// Eliminar home al borrar
const removeHomeOnDelete = ref(false)

// Columnas de la tabla
const headers = [
  { title: 'Usuario', key: 'username', sortable: true },
  { title: 'UID', key: 'uid', sortable: true },
  { title: 'GID', key: 'gid', sortable: true },
  { title: 'Home', key: 'home', sortable: false },
  { title: 'Shell', key: 'shell', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
]

// Usuarios filtrados
const filteredUsers = computed(() => {
  return users.value
})

// Usuarios protegidos (no se pueden eliminar)
const protectedUsers = ['root', 'nobody', 'www-data', 'systemd-network', 'systemd-resolve']

function isProtectedUser(username) {
  return protectedUsers.includes(username)
}

// Reglas de validación
const usernameRules = [
  v => !!v || 'El nombre de usuario es requerido',
  v => /^[a-z][a-z0-9_-]*$/.test(v) || 'Solo letras minúsculas, números, guiones y guiones bajos',
  v => v.length <= 32 || 'Máximo 32 caracteres'
]

const passwordRules = [
  v => !!v || 'La contraseña es requerida',
  v => v.length >= 6 || 'Mínimo 6 caracteres'
]

const confirmPasswordRules = [
  v => !!v || 'Confirma la contraseña',
  v => v === newUser.value.password || 'Las contraseñas no coinciden'
]

const editPasswordRules = [
  v => !v || v.length >= 6 || 'Mínimo 6 caracteres'
]

const editConfirmPasswordRules = [
  v => !editUser.value.password || v === editUser.value.password || 'Las contraseñas no coinciden'
]

// Cargar datos al montar
onMounted(async () => {
  await Promise.all([loadUsers(), loadGroups()])
})

// Funciones de carga
async function loadUsers() {
  loading.value = true
  try {
    const response = await userService.list(showAllUsers.value)
    users.value = response.data || []
  } catch (error) {
    showError('Error al cargar usuarios: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

async function loadGroups() {
  try {
    const response = await groupService.list(true)
    availableGroups.value = response.data || []
  } catch (error) {
    console.error('Error al cargar grupos:', error)
  }
}

// Funciones de diálogos
function openCreateDialog() {
  newUser.value = {
    username: '',
    password: '',
    confirmPassword: '',
    groups: []
  }
  showPassword.value = false
  createDialog.value = true
}

function openEditDialog(user) {
  selectedUser.value = user
  editUser.value = {
    password: '',
    confirmPassword: ''
  }
  showEditPassword.value = false
  editDialog.value = true
}

function openGroupsDialog(user) {
  selectedUser.value = user
  // Cargar grupos actuales del usuario
  loadUserGroups(user.username)
  groupsDialog.value = true
}

async function loadUserGroups(username) {
  try {
    const response = await userService.get(username)
    userGroups.value = response.data?.groups || []
  } catch (error) {
    console.error('Error al cargar grupos del usuario:', error)
    userGroups.value = []
  }
}

function openDeleteDialog(user) {
  selectedUser.value = user
  removeHomeOnDelete.value = false
  deleteDialog.value = true
}

// Operaciones CRUD
async function createUser() {
  if (!createFormValid.value) return

  creating.value = true
  try {
    await userService.create({
      username: newUser.value.username,
      password: newUser.value.password,
      groups: newUser.value.groups
    })
    showSuccess(`Usuario ${newUser.value.username} creado exitosamente`)
    createDialog.value = false
    await loadUsers()
  } catch (error) {
    showError('Error al crear usuario: ' + (error.response?.data?.message || error.message))
  } finally {
    creating.value = false
  }
}

async function updateUser() {
  if (!editFormValid.value || !editUser.value.password) return

  updating.value = true
  try {
    await userService.update(selectedUser.value.username, {
      password: editUser.value.password
    })
    showSuccess(`Usuario ${selectedUser.value.username} actualizado`)
    editDialog.value = false
    await loadUsers()
  } catch (error) {
    showError('Error al actualizar usuario: ' + (error.response?.data?.message || error.message))
  } finally {
    updating.value = false
  }
}

async function updateUserGroups() {
  updatingGroups.value = true
  try {
    await userService.updateGroups(selectedUser.value.username, userGroups.value)
    showSuccess(`Grupos de ${selectedUser.value.username} actualizados`)
    groupsDialog.value = false
    await loadUsers()
  } catch (error) {
    showError('Error al actualizar grupos: ' + (error.response?.data?.message || error.message))
  } finally {
    updatingGroups.value = false
  }
}

async function deleteUser() {
  deleting.value = true
  try {
    await userService.delete(selectedUser.value.username, removeHomeOnDelete.value)
    showSuccess(`Usuario ${selectedUser.value.username} eliminado`)
    deleteDialog.value = false
    await loadUsers()
  } catch (error) {
    showError('Error al eliminar usuario: ' + (error.response?.data?.message || error.message))
  } finally {
    deleting.value = false
  }
}
</script>
