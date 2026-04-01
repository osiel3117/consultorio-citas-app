# Consultorio Psicológico — App de Gestión de Citas

Aplicación web para gestión de pacientes y citas de un consultorio psicológico en Reynosa, Tamaulipas.  
Funciona en laptop y celular.

---

## Stack

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Backend    | Node.js + Express 5                 |
| Base datos | PostgreSQL + Prisma ORM             |
| Frontend   | React 19 + Vite 8                   |
| Calendario | FullCalendar v6                     |

---

## Requisitos previos

- Node.js >= 18
- PostgreSQL corriendo localmente (o en la nube)
- npm

---

## Configuración inicial

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repo>
cd consultorio-citas-app

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configurar la base de datos (backend)

```bash
cd backend
cp .env.example .env
```

Edita `.env` y escribe tu cadena de conexión PostgreSQL:

```
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/consultorio"
```

### 3. Ejecutar migraciones

```bash
cd backend
npx prisma migrate deploy
```

> Si es la primera vez o en desarrollo:
> ```bash
> npx prisma migrate dev
> ```

---

## Ejecutar el proyecto

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

El servidor queda en: `http://localhost:3000`

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

La app queda en: `http://localhost:5173`

---

## Estructura del proyecto

```
consultorio-citas-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Modelos: Paciente, Cita
│   └── src/
│       ├── server.js              # Express app
│       ├── config/prisma.js       # PrismaClient singleton
│       ├── routes/
│       │   ├── paciente.routes.js
│       │   └── cita.routes.js
│       └── controllers/
│           ├── paciente.controller.js
│           └── cita.controller.js
└── frontend/
    └── src/
        ├── App.jsx                # Layout principal con tabs
        ├── App.css                # Estilos (dark theme, responsive)
        ├── CalendarioCitas.jsx    # FullCalendar v6
        └── components/
            ├── PacienteForm.jsx
            ├── PacienteList.jsx
            ├── CitaForm.jsx
            └── CitaList.jsx
```

---

## API endpoints

| Método | Ruta             | Descripción           |
|--------|------------------|-----------------------|
| GET    | /api/pacientes   | Listar pacientes      |
| POST   | /api/pacientes   | Crear paciente        |
| GET    | /api/citas       | Listar citas          |
| POST   | /api/citas       | Crear cita            |

---

## Zona horaria

Las citas se guardan con `fecha` (YYYY-MM-DD), `hora` (HH:MM) y `zonaHoraria` (America/Matamoros) como campos de texto independientes.  
Esto garantiza que la hora pactada **nunca cambie** por horario de verano ni por la zona horaria del navegador del usuario.
