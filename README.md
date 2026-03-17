# 🏖️ TarifaMv — Motor de Cotización Hotelera

**TarifaMv** es una herramienta web integral de cotización de tarifas hoteleras desarrollada para **Margarita Village**. Permite a los agentes de ventas generar cotizaciones profesionales en PDF con distribución inteligente de huéspedes en habitaciones, tarifas escaladas por cantidad de adultos, gestión de niños gratuitos y conexión directa con el CRM **Kommo**.

---

## 🧩 Funciones y Servicios Implementados

### 🔢 Motor Matemático de Distribución
- Distribución automática de adultos y niños en habitaciones respetando la capacidad máxima por habitación.
- Regla obligatoria: **mínimo 1 adulto por habitación** (los niños no pueden estar solos).
- Tarifas escaladas: precio por persona varía según cuántos adultos compartan la habitación (`adult_price_1`, `adult_price_2`, `adult_price_3`, `adult_price_4`).
- Soporte para **niños gratuitos** configurables: aplica solo cuando hay más de 1 adulto en la habitación.
- Campo **"Habitaciones (Opcional)"**: permite forzar manualmente la cantidad de habitaciones para la distribución.
- Mascotas: distribución de 1 mascota por habitación con tarifa adicional.

### 📊 Interfaz de Cotización (Frontend)
- Formulario interactivo con campos de adultos, niños, mascotas, habitaciones, fechas de entrada/salida.
- **Modo Inteligente**: selecciona automáticamente la tarifa más económica entre las activas.
- **Modo Manual**: permite elegir una tarifa específica.
- Tabla de resultados con desglose por habitación (adultos, niños, tarifas individuales, total por noche).
- Descuentos configurables (protegidos por contraseña).
- Datos del cliente (nombre, cédula/RIF, teléfono).
- Condiciones generales del hotel integradas en la cotización.

### 📄 Generación de PDF
- Exportación profesional de la cotización completa a PDF usando `html2canvas` + `jsPDF`.
- Incluye logo, tabla de habitaciones, condiciones del hotel y totales.
- Generación automática vía URL con parámetro `autoPdf=true`.

### 🔗 Integración con Kommo CRM
- Carga automática de datos del lead (nombre, teléfono, adultos, niños, mascotas, fechas) desde Kommo usando el ID del lead.
- Mapeo de campos personalizados configurados en `FIELD_MAP`.

### ⚙️ Panel de Administración
- CRUD completo de tarifas (crear, editar, eliminar, activar/desactivar).
- Configuración de tipo de habitación (`estandar`, `suite`, etc.) y tipo de plan (`AI`, `EP`, etc.).
- Vigencia de tarifas por fechas o disponibilidad permanente.
- Acceso protegido por login.

### 🔌 API REST para Integraciones Externas
- Endpoint `/api/quote` que permite calcular cotizaciones desde sistemas externos (CRM, bots, etc.) y recibir el resultado + enlace al PDF.

### 🐳 Despliegue Monolítico Docker
- Arquitectura monolítica: Node.js sirve tanto la API como el frontend de React desde un solo contenedor.
- Compatible con **EasyPanel** y cualquier entorno Docker.

---

## 📁 Estructura del Proyecto

```
CotizadorMv/
├── Dockerfile                    # Build monolítico (React + Node)
├── docker-compose.yml            # Dev local con PostgreSQL
├── package.json                  # Dependencias del frontend (React)
│
├── public/
│   ├── index.html                # HTML base (título: TarifaMv, favicon: Margarita.png)
│   ├── Margarita.png             # Logo de Margarita Village
│   └── manifest.json
│
├── src/
│   ├── App.js                    # Componente principal y lógica de cotización
│   ├── App.css                   # Estilos globales
│   ├── utils/
│   │   └── pricing.js            # Motor matemático de distribución y precios
│   ├── hooks/
│   │   └── useRates.js           # Hook de gestión de tarifas (fetch, add, delete, toggle)
│   ├── pages/
│   │   ├── QuotePage.js          # Página de cotización y generación de PDF
│   │   ├── AdminPage.js          # Panel de administración de tarifas
│   │   └── LoginPage.js          # Página de login
│   └── components/
│       └── Navbar.js             # Barra de navegación
│
└── backend/
    ├── server.js                 # Servidor Express (API + Frontend estático)
    ├── db.js                     # Conexión PostgreSQL y creación de tablas
    ├── package.json              # Dependencias del backend
    ├── .env                      # Variables de entorno (DB, puerto)
    ├── routes/
    │   └── api.js                # Router central de endpoints
    ├── controllers/
    │   ├── rateController.js     # CRUD de tarifas
    │   ├── kommoController.js    # Integración con Kommo CRM
    │   └── quoteController.js    # API de cotización externa
    └── utils/
        └── pricing.js            # Motor de precios (copia CommonJS para backend)
```

---

## 🚀 Instalación y Desarrollo Local

### Prerrequisitos
- Node.js v18+
- PostgreSQL 15+

### Variables de Entorno (`backend/.env`)

```env
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=margaritavillage
DB_HOST=localhost
DB_PORT=5432
PORT=5001
```

### Iniciar en Desarrollo

```bash
# Frontend (React)
npm install
npm start
# → http://localhost:3000

# Backend (Express) — en otra terminal
cd backend
npm install
node server.js
# → http://localhost:5001
```

### Iniciar con Docker Compose

```bash
docker-compose up -d --build
# Frontend: http://localhost:80
# Backend:  http://localhost:5001
```

### Despliegue en EasyPanel

1. Crear una nueva aplicación apuntando al repositorio Git.
2. Seleccionar el `Dockerfile` de la raíz como fuente.
3. Configurar las variables de entorno de la base de datos en el panel.
4. El puerto interno expuesto es `5001`.
5. Hacer clic en **Build/Deploy**.

---

## 📡 Documentación de la API REST

**URL Base:** `http://localhost:5001/api` (desarrollo) o `https://tu-dominio.com/api` (producción)

---

### 🟢 `GET /api/debug-ping`

Verifica que el servidor esté activo.

**Respuesta:**
```json
{
  "status": "ok",
  "time": "2026-03-17T04:00:00.000Z",
  "message": "Server is responding"
}
```

---

### 🟢 `GET /api/rates`

Obtiene todas las tarifas registradas, ordenadas por fecha de creación (más recientes primero).

**Respuesta:** Array de objetos tarifa.
```json
[
  {
    "id": 1,
    "name": "Temporada Alta 2026",
    "adult_price_1": 120.00,
    "adult_price_2": 100.00,
    "adult_price_3": 85.00,
    "adult_price_4": 75.00,
    "child_price": 50.00,
    "pet_price": 10.00,
    "max_people_per_room": 4,
    "free_children_count": 1,
    "is_active": true,
    "always_available": true,
    "room_type": "estandar",
    "plan_type": "AI",
    "created_at": "2026-03-15T10:00:00.000Z"
  }
]
```

---

### 🟡 `POST /api/rates`

Crea una nueva tarifa.

**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "name": "Temporada Baja 2026",
  "adult_price_1": 100.00,
  "adult_price_2": 90.00,
  "adult_price_3": 80.00,
  "adult_price_4": 70.00,
  "child_price": 40.00,
  "pet_price": 10.00,
  "max_people_per_room": 4,
  "max_pets": 1,
  "free_children_count": 1,
  "always_available": true,
  "valid_from": null,
  "valid_until": null,
  "room_type": "estandar",
  "plan_type": "AI"
}
```

**Respuesta (201):** El objeto tarifa creado con `id` y `created_at`.

---

### 🔵 `PUT /api/rates/:id`

Actualiza una tarifa existente.

**Parámetros URL:** `id` — ID numérico de la tarifa.

**Body:** Mismo formato que `POST /api/rates`, con campo adicional `is_active` (boolean).

**Respuesta:** El objeto tarifa actualizado.

---

### 🔴 `DELETE /api/rates/:id`

Elimina una tarifa.

**Parámetros URL:** `id` — ID numérico de la tarifa.

**Respuesta:**
```json
{ "message": "Rate deleted" }
```

---

### 🟢 `GET /api/lead/:id`

Obtiene los datos de un lead desde **Kommo CRM**.

**Parámetros URL:** `id` — ID numérico del lead en Kommo.

**Respuesta:**
```json
{
  "leadId": 18404150,
  "customerName": "Juan Pérez",
  "customerPhone": "+58 412 1234567",
  "adults": 2,
  "children": 1,
  "pets": 0,
  "checkIn": "2026-04-01",
  "checkOut": "2026-04-05"
}
```

---

### 🟢 `GET /api/quote` | 🟡 `POST /api/quote`

**Calcula una cotización completa** con el motor matemático del backend. Soporta tanto query params (GET) como body JSON (POST).

#### Parámetros

| Parámetro  | Tipo   | Requerido | Default | Descripción                          |
|------------|--------|-----------|---------|--------------------------------------|
| `rateId`   | number | ✅ Sí     | —       | ID de la tarifa en la BD             |
| `adults`   | number | No        | 1       | Cantidad de adultos                  |
| `children` | number | No        | 0       | Cantidad de niños                    |
| `pets`     | number | No        | 0       | Cantidad de mascotas                 |
| `rooms`    | number | No        | auto    | Cantidad de habitaciones (forzado)   |
| `checkIn`  | date   | No        | —       | Fecha de entrada (`YYYY-MM-DD`)      |
| `checkOut` | date   | No        | —       | Fecha de salida (`YYYY-MM-DD`)       |

#### Ejemplo GET

```
GET /api/quote?rateId=1&adults=6&children=2&pets=0&rooms=3&checkIn=2026-04-01&checkOut=2026-04-04
```

#### Ejemplo POST

```json
POST /api/quote
Content-Type: application/json

{
  "rateId": 1,
  "adults": 6,
  "children": 2,
  "pets": 0,
  "rooms": 3,
  "checkIn": "2026-04-01",
  "checkOut": "2026-04-04"
}
```

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "data": {
    "rateInfo": {
      "name": "Temporada Alta 2026",
      "room_type": "estandar",
      "plan_type": "AI"
    },
    "nights": 3,
    "total": 1620.00,
    "roomDetails": [
      {
        "adults": 2,
        "children": 1,
        "pets": 0,
        "adultPricePerPerson": 90.00,
        "adultTotal": 180.00,
        "billableChildren": 0,
        "freeChildren": 1,
        "childTotal": 0,
        "petTotal": 0,
        "freeChild": true,
        "cost": 180.00
      },
      {
        "adults": 2,
        "children": 1,
        "pets": 0,
        "adultPricePerPerson": 90.00,
        "adultTotal": 180.00,
        "billableChildren": 0,
        "freeChildren": 1,
        "childTotal": 0,
        "petTotal": 0,
        "freeChild": true,
        "cost": 180.00
      },
      {
        "adults": 2,
        "children": 0,
        "pets": 0,
        "adultPricePerPerson": 90.00,
        "adultTotal": 180.00,
        "billableChildren": 0,
        "freeChildren": 0,
        "childTotal": 0,
        "petTotal": 0,
        "freeChild": false,
        "cost": 180.00
      }
    ]
  },
  "pdf_link": "https://tu-dominio.com/?rateId=1&adults=6&children=2&pets=0&rooms=3&checkIn=2026-04-01&checkOut=2026-04-04&autoPdf=true"
}
```

> 💡 El campo `pdf_link` es un enlace que al abrirlo en un navegador, carga la interfaz web, ejecuta el cálculo automáticamente y descarga el PDF.

#### Respuesta de Error (400)

```json
{
  "error": "Se requieren al menos 3 adultos para ocupar 3 habitaciones."
}
```

---

## 📐 Reglas del Motor de Precios

1. **Capacidad máxima por habitación**: configurable por tarifa (`max_people_per_room`, default: 4).
2. **Mínimo 1 adulto por habitación**: los niños nunca pueden quedar solos en una habitación.
3. **Tarifa escalonada por adultos**: a más adultos por habitación, menor el precio por persona.
4. **Niños gratuitos**: se aplica solo si la habitación tiene > 1 adulto. La cantidad de niños gratuitos se configura en `free_children_count`.
5. **Mascotas**: máximo 1 por habitación, con tarifa fija adicional.
6. **Habitaciones manuales**: si el usuario especifica el campo `rooms`, el algoritmo distribuye a los huéspedes en esa cantidad exacta de habitaciones (validando que sea factible).

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | React 18 |
| Backend | Node.js + Express 5 |
| Base de Datos | PostgreSQL 15 |
| PDF | html2canvas + jsPDF |
| CRM | Kommo API v4 |
| Contenedor | Docker (Multi-stage build) |
| Hosting | EasyPanel |

---

## 📝 Licencia

Proyecto privado — ** Hotel Margarita Village — Todos los derechos reservados.
Elaborado por: Juan Diego Cadavid y Cesar Diaz.
