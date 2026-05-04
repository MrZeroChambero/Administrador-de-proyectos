# Administrador de Proyectos

Aplicación estilo Trello para la gestión de proyectos personales, metas, plazos y tareas. Diseñada para ayudarte a organizar tu trabajo, realizar seguimiento del progreso y, en el futuro, integrar asistencia mediante IA (Gemini u otras APIs gratuitas).

## ✨ Características actuales

- **Gestión de proyectos**  
  Crear, actualizar, eliminar y consultar proyectos. Cada proyecto tiene estado (`en espera`, `en progreso`, `pausado`, `finalizado`, `cancelado`), progreso (0‑100), fechas de inicio y fin, icono y descripción.

- **Información estructurada**  
  Registro de objetivos generales y específicos, misión y visión por proyecto.

- **Metas y dependencias**  
  Definición de metas asociadas a objetivos. Posibilidad de establecer relaciones de dependencia entre metas (una meta principal necesita de otra secundaria).

- **Personas (miembros)**  
  Administración de personas con datos de contacto, DNI, foto y estado (`activo` / `inactivo`). Asignación de personas a proyectos con un propósito específico.

- **Habilidades**  
  Catálogo de habilidades técnicas o blandas, asignables a personas.

- **Archivos adjuntos**  
  Subida de documentos, imágenes o iconos vinculados a metas.

- **Configuración personal**  
  Tamaño y color de letra, tema visual por usuario.

- **Usuarios y autenticación**  
  Tabla de usuarios con nickname y hash de contraseña. Relación entre usuarios y personas.

## 🧠 Futuras integraciones

- **Asistente con IA gratuita (Gemini)**

  - Recomendación de próximas metas según el progreso actual.
  - Sugerencia de plazos realistas basados en fechas pasadas.
  - Generación automática de descripciones para metas y tareas.
  - Resúmenes diarios/semanales de lo que deberías hacer.

- **Vista tipo Kanban (Trello)**  
  Tableros personalizables con columnas (`Por hacer`, `En progreso`, `En revisión`, `Hecho`).  
  Arrastrar y soltar metas entre columnas.

- **Notificaciones por correo**  
  Recordatorios de fechas límite cercanas.

- **Dashboard analítico**  
  Gráficos de progreso, cumplimiento de plazos y productividad personal.

## 🛠️ Tecnologías utilizadas

- **Backend:** Node.js
- **Base de datos:** MySQL / MariaDB
- **Capa de acceso a datos:** `mysql2/promise` + clases personalizadas
- **Variables de entorno:** dotenv
- **Futuro frontend:** (opcional) React / Vue / Svelte

## 📁 Estructura del proyecto (actual)

Administrador-de-proyectos/
├── .env
├── package.json
├── src/
│ ├── db/
│ │ └── database.js # Clase de conexión a MySQL
│ ├── tablas/ # Clases por tabla
│ │ ├── informacion.js
│ │ ├── meta.js
│ │ ├── objetivoMeta.js
│ │ ├── archivos.js
│ │ ├── habilidad.js
│ │ ├── personaHabilidad.js
│ │ ├── personaMetas.js
│ │ ├── usuario.js
│ │ ├── configuracion.js
│ │ ├── dependencias.js
│ │ ├── temas.js
│ │ └── usuarioPersona.js
│ ├── index.js # Exportación unificada
│ └── (futuro: rutas, controladores, frontend)
└── README.md

## 🚀 Instalación y configuración

## 1. Clonar el repositorio

```bash
git clone https://github.com/tuusuario/Administrador-de-proyectos.git
cd Administrador-de-proyectos
```

## 2. Instalar dependencias

```bash
pnpm install
```

## 3. Configurar la base de datos

1. Ejecuta el script SQL proporcionado (`proyectos (1).sql`) en tu servidor MySQL/MariaDB.
2. Crea un archivo `.env` en la raíz del proyecto con los siguientes valores (ajusta según tu entorno):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=proyectos
DB_PORT=3306
```

## 4. Iniciar la aplicación (modo desarrollo)

```bash
node src/index.js
```
