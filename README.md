# La chanchona

**Mini herramienta tipo Webmin para administración de usuarios y grupos en Debian/Ubuntu Linux**

## Descripción

La chanchona es un panel web sencillo pero funcional para administrar usuarios y grupos del sistema operativo Linux, usando los comandos nativos del sistema (`adduser`, `deluser`, `usermod`, `groups`, etc.).

## Arquitectura

```
Mini-Webmin/
├── backend/                    # Node.js + Express API (puerto 3000)
│   ├── src/
│   │   ├── controllers/        # Controladores de la API
│   │   ├── services/           # Servicios del sistema
│   │   ├── routes/             # Definición de rutas REST
│   │   ├── middleware/         # Validadores y middlewares
│   │   └── utils/              # Utilidades (ejecutor de comandos)
│   ├── server.js               # Punto de entrada
│   └── package.json
├── frontend/                   # Vue 3 + Vuetify 3 (puerto 5173)
│   ├── src/
│   │   ├── views/              # Vistas principales
│   │   ├── services/           # Cliente API
│   │   ├── composables/        # Hooks de Vue
│   │   ├── plugins/            # Configuración de Vuetify
│   │   └── router/             # Vue Router
│   ├── vite.config.js
│   └── package.json
├── README.md                   # Este archivo
└── SECURITY.md                 # Configuración de seguridad
```

## Requisitos

- **Node.js** >= 24.0.0
- **Sistema operativo**: Debian 11+ o Ubuntu 22.04+ (funciona en WSL2)
- **Usuario**: Debe tener permisos sudo configurados (ver [SECURITY.md](SECURITY.md))

## Instalación

### 1. Clonar o descargar el proyecto

```bash
cd /home/carlos/Proyectos/Mini-Webmin
```

### 2. Configurar permisos de sudo (importante)

Antes de ejecutar la aplicación, debes configurar los permisos de sudo. Lee el archivo [SECURITY.md](SECURITY.md) y ejecuta:

```bash
# Crear archivo de sudoers para la aplicación
sudo visudo -f /etc/sudoers.d/la-chanchona
```

Agrega las líneas indicadas en SECURITY.md.

### 3. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 4. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

## Ejecución

### Iniciar el backend (terminal 1)

```bash
cd backend
npm run dev
# El servidor estará en http://localhost:3000
```

### Iniciar el frontend (terminal 2)

```bash
cd frontend
npm run dev
# La aplicación estará en http://localhost:5173
```

### Acceder a la aplicación

Abre tu navegador en: **http://localhost:5173**

## API REST

### Endpoints de usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/users` | Lista todos los usuarios |
| `GET` | `/api/users/:username` | Obtiene un usuario específico |
| `POST` | `/api/users` | Crea un nuevo usuario |
| `PUT` | `/api/users/:username` | Actualiza usuario (contraseña/grupos) |
| `PUT` | `/api/users/:username/groups` | Actualiza solo los grupos |
| `DELETE` | `/api/users/:username` | Elimina un usuario |

### Endpoints de grupos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/groups` | Lista todos los grupos |
| `GET` | `/api/groups/:groupname` | Obtiene un grupo específico |

### Ejemplos de uso con curl

```bash
# Listar usuarios (solo humanos, UID >= 1000)
curl http://localhost:3000/api/users

# Listar todos los usuarios (incluyendo sistema)
curl http://localhost:3000/api/users?all=true

# Obtener un usuario específico
curl http://localhost:3000/api/users/carlos

# Crear un usuario
curl -X POST http://localhost:3000/api/users \
    -H "Content-Type: application/json" \
    -d '{"username": "testuser", "password": "password123", "groups": ["sudo"]}'

# Cambiar contraseña de un usuario
curl -X PUT http://localhost:3000/api/users/testuser \
    -H "Content-Type: application/json" \
    -d '{"password": "newpassword456"}'

# Actualizar grupos de un usuario
curl -X PUT http://localhost:3000/api/users/testuser/groups \
    -H "Content-Type: application/json" \
    -d '{"groups": ["sudo", "docker"], "append": false}'

# Eliminar un usuario
curl -X DELETE http://localhost:3000/api/users/testuser

# Eliminar usuario con su home
curl -X DELETE "http://localhost:3000/api/users/testuser?removeHome=true"

# Listar grupos
curl http://localhost:3000/api/groups

# Listar todos los grupos (incluyendo sistema)
curl http://localhost:3000/api/groups?all=true
```

## Interfaz de usuario

### Vista de usuarios
- Tabla con lista de usuarios del sistema
- Filtro para mostrar/ocultar usuarios del sistema
- Búsqueda por nombre de usuario
- Acciones:
    - Crear usuario nuevo
    - Editar (cambiar contraseña)
    - Gestionar grupos
    - Eliminar usuario

### Vista de grupos
- Tabla con lista de grupos del sistema
- Visualización de miembros por grupo
- Estadísticas de grupos
- Búsqueda y filtros

## Seguridad

**Importante**: Esta herramienta ejecuta comandos del sistema con privilegios de root. Lee detenidamente el archivo [SECURITY.md](SECURITY.md) antes de usar en producción.

### Medidas de seguridad implementadas:

1. Validación de entrada: todos los parámetros se validan con `express-validator`
2. Escape de caracteres: se escapan caracteres peligrosos antes de ejecutar comandos
3. Usuarios protegidos: no se pueden eliminar usuarios críticos del sistema
4. Sudoers restrictivo: solo se permiten los comandos necesarios

## Solución de problemas

### Error: "sudo: no tty present"
Asegúrate de que el archivo `/etc/sudoers.d/la-chanchona` esté configurado correctamente.

### Error: "adduser: command not found"
Verifica que estás usando Debian/Ubuntu. En otras distribuciones, los comandos pueden ser diferentes.

### Error de CORS
Verifica que el frontend está corriendo en `http://localhost:5173` y que el backend permite este origen.

### Los cambios no se reflejan
La información viene directamente del sistema operativo. Recarga la página para ver los cambios.

## Notas para desarrollo

- El backend usa ES Modules (type: "module" en package.json)
- El frontend usa Vite como bundler
- No hay base de datos, toda la información viene del sistema operativo
- Los comandos se ejecutan con `sudo` sin contraseña (requiere configuración)

## Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear pull request

## Licencia

MIT License - ver archivo LICENSE para más detalles.

---

Hecho por el equipo de La chanchona
