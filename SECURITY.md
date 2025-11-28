# Guía de seguridad - La Chanchona

## Advertencia importante

Esta aplicación ejecuta comandos del sistema operativo con privilegios de root. **No** la uses en entornos de producción sin tomar las medidas de seguridad adecuadas.

## Configuración de sudoers

Para que la aplicación funcione, el usuario que ejecuta el servidor Node.js debe poder ejecutar ciertos comandos con `sudo` sin necesidad de contraseña.

### Paso 1: Identificar el usuario

Primero, identifica con qué usuario se ejecutará el servidor:

```bash
whoami
# Ejemplo de salida: carlos
```

### Paso 2: Crear archivo de sudoers

```bash
sudo visudo -f /etc/sudoers.d/la-chanchona
```

### Paso 3: Agregar las reglas

Copia y pega el siguiente contenido, reemplazando `TU_USUARIO` con tu nombre de usuario:

```sudoers
# La Chanchona - Permisos para administración de usuarios y grupos
# Archivo: /etc/sudoers.d/la-chanchona
# 
# Importante: Reemplaza TU_USUARIO con el usuario que ejecuta la aplicación
#

# ==================== GESTIÓN DE USUARIOS ====================

# Permitir adduser sin contraseña (crear usuarios)
TU_USUARIO ALL=(root) NOPASSWD: /usr/sbin/adduser

# Permitir deluser sin contraseña (eliminar usuarios)
TU_USUARIO ALL=(root) NOPASSWD: /usr/sbin/deluser

# Permitir usermod sin contraseña (modificar usuarios)
TU_USUARIO ALL=(root) NOPASSWD: /usr/sbin/usermod

# Permitir chpasswd sin contraseña (cambiar contraseñas)
TU_USUARIO ALL=(root) NOPASSWD: /usr/sbin/chpasswd

# ==================== GESTIÓN DE GRUPOS ====================

# Permitir addgroup sin contraseña (crear grupos)
TU_USUARIO ALL=(root) NOPASSWD: /usr/sbin/addgroup

# Permitir delgroup sin contraseña (eliminar grupos)
TU_USUARIO ALL=(root) NOPASSWD: /usr/sbin/delgroup

# Permitir gpasswd sin contraseña (administrar miembros de grupos)
TU_USUARIO ALL=(root) NOPASSWD: /usr/bin/gpasswd

# ==================== UTILIDADES ====================

# Permitir bash para pipes de chpasswd
TU_USUARIO ALL=(root) NOPASSWD: /bin/bash
```

### Ejemplo concreto para el usuario "carlos":

```sudoers
# La Chanchona - Permisos para administración de usuarios y grupos
carlos ALL=(root) NOPASSWD: /usr/sbin/adduser
carlos ALL=(root) NOPASSWD: /usr/sbin/deluser
carlos ALL=(root) NOPASSWD: /usr/sbin/usermod
carlos ALL=(root) NOPASSWD: /usr/sbin/chpasswd
carlos ALL=(root) NOPASSWD: /usr/sbin/addgroup
carlos ALL=(root) NOPASSWD: /usr/sbin/delgroup
carlos ALL=(root) NOPASSWD: /usr/bin/gpasswd
carlos ALL=(root) NOPASSWD: /bin/bash
```

### Paso 4: Verificar permisos del archivo

```bash
sudo chmod 440 /etc/sudoers.d/la-chanchona
```

### Paso 5: Verificar la configuración

```bash
# Debe ejecutarse sin pedir contraseña
sudo adduser --help
sudo deluser --help
sudo usermod --help
sudo addgroup --help
sudo delgroup --help
sudo gpasswd --help
```

## Medidas de seguridad implementadas

### 1. Validación de entrada

Todos los datos de entrada se validan antes de procesarse:

- **Username**: Solo letras minúsculas, números, guiones y guiones bajos. Debe comenzar con letra. Máximo 32 caracteres.
- **Password**: Mínimo 6 caracteres.
- **Grupos**: Solo nombres de grupo válidos.

### 2. Escape de caracteres

Se escapan caracteres peligrosos para prevenir inyección de comandos:

```javascript
// Caracteres eliminados:
// ` $ \ ; " ' | & < > ( ) { } [ ] ! \n \r \t
```

### 3. Usuarios protegidos

No se pueden eliminar usuarios críticos del sistema:

- root
- nobody
- www-data
- systemd-network
- systemd-resolve

### 4. Timeout de comandos

Los comandos tienen un timeout máximo de 30 segundos para prevenir bloqueos.

### 5. Validación de nombres de usuario

```javascript
// Regex de validación
const regex = /^[a-z][a-z0-9_-]{0,31}$/;
```

## Riesgos conocidos

### 1. Acceso local
Esta aplicación está diseñada para uso local o en redes internas confiables. **No** expongas el puerto 3000 a Internet.

### 2. Sin autenticación
La aplicación no implementa autenticación. Cualquiera con acceso a la red puede administrar usuarios.

### 3. Logs
Los comandos ejecutados se logean en la consola. Considera deshabilitar esto en producción o redirigir a un archivo seguro.

### 4. Https
La comunicación no está cifrada. Para producción, coloca un proxy reverso (nginx) con ssl.


### Ejemplo de configuración nginx con ssl:

```nginx
server {
    listen 443 ssl;
    server_name la-chanchona.local;
    
    ssl_certificate /etc/letsencrypt/live/la-chanchona.local/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/la-chanchona.local/privkey.pem;
    
    # Solo permitir desde red local
    allow 192.168.1.0/24;
    deny all;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Comandos del sistema utilizados

| Comando | Uso | Ejemplo |
|---------|-----|---------|
| `getent passwd` | Listar usuarios | `getent passwd` |
| `getent group` | Listar grupos | `getent group` |
| `groups` | Ver grupos de usuario | `groups carlos` |
| `adduser` | Crear usuario | `sudo adduser --disabled-password --gecos "" newuser` |
| `chpasswd` | Cambiar contraseña | `echo "user:pass" \| sudo chpasswd` |
| `usermod` | Modificar usuario | `sudo usermod -aG sudo newuser` |
| `deluser` | Eliminar usuario | `sudo deluser newuser` |
| `addgroup` | Crear grupo | `sudo addgroup nuevo-grupo` |
| `delgroup` | Eliminar grupo | `sudo delgroup mi-grupo` |
| `gpasswd -a` | Añadir usuario a grupo | `sudo gpasswd -a usuario grupo` |
| `gpasswd -d` | Remover usuario de grupo | `sudo gpasswd -d usuario grupo` |

## Checklist de seguridad

Antes de usar la aplicación, verifica:

- [ ] Archivo `/etc/sudoers.d/la-chanchona` creado con permisos correctos (440)
- [ ] Usuario correcto configurado en sudoers
- [ ] Aplicación solo accesible desde red local
- [ ] Firewall configurado (puertos 3000 y 5173)
- [ ] Entendidos los riesgos de seguridad
- [ ] No expuesto a Internet

## Soporte

.

---

**Recuerda**: Con gran poder viene gran responsabilidad xD.
