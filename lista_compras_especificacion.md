# 🛒 Lista de Compras Inteligente - Especificación Completa

## 📋 Resumen del Proyecto

**Nombre:** MyShopLi - Lista de Compras Inteligente

**Descripción:** Aplicación móvil Android para gestionar compras del hogar, permitiendo planificar productos, registrar compras realizadas y controlar el presupuesto mensual.

**Proceso de Negocio:** Planificación → Compra → Registro → Análisis

---

## 🎯 Objetivo del Negocio

Facilitar la gestión de compras del hogar mediante:
- Planificación de productos necesarios
- Lista digital accesible en el supermercado
- Registro de compras realizadas
- Control de gastos mensuales
- Histórico de compras para análisis

---

## 📊 Modelo de Datos

### 1. Usuario (User)
```json
{
  "id": "string (UUID)",
  "name": "string",
  "email": "string (unique)",
  "password": "string (hashed)",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### 2. Producto (Product)
```json
{
  "id": "string (UUID)",
  "userId": "string (FK)",
  "name": "string",
  "category": "string (Frutas, Verduras, Lácteos, Carnes, Limpieza, etc.)",
  "estimatedPrice": "decimal",
  "isPurchased": "boolean (false por defecto)",
  "createdAt": "datetime"
}
```

### 3. Compra (Purchase)
```json
{
  "id": "string (UUID)",
  "userId": "string (FK)",
  "totalAmount": "decimal",
  "purchaseDate": "datetime",
  "products": [
    {
      "productName": "string",
      "category": "string",
      "price": "decimal"
    }
  ],
  "createdAt": "datetime"
}
```

---

## 🔌 API REST - Especificación Detallada

### Base URL
```
https://api.MyShopLi.com/v1
```

### Headers Requeridos (excepto login/register)
```
Authorization: Bearer {token}
Content-Type: application/json
```

---

### 1. AUTENTICACIÓN

#### POST /api/register
**Descripción:** Registrar nuevo usuario

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": "uuid-123",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "El email ya está registrado"
}
```

---

#### POST /api/login
**Descripción:** Iniciar sesión

**Request Body:**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "id": "uuid-123",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

---

### 2. PRODUCTOS (Lista de Compras)

#### GET /api/products
**Descripción:** Obtener lista de productos pendientes

**Query Parameters:**
- `isPurchased` (optional): true/false

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod-001",
      "name": "Leche",
      "category": "Lácteos",
      "estimatedPrice": 25.50,
      "isPurchased": false,
      "createdAt": "2026-02-01T10:00:00Z"
    },
    {
      "id": "prod-002",
      "name": "Pan integral",
      "category": "Panadería",
      "estimatedPrice": 35.00,
      "isPurchased": false,
      "createdAt": "2026-02-01T10:05:00Z"
    }
  ],
  "count": 2
}
```

---

#### POST /api/products
**Descripción:** Agregar producto a la lista

**Request Body:**
```json
{
  "name": "Manzanas",
  "category": "Frutas",
  "estimatedPrice": 45.00
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Producto agregado a la lista",
  "data": {
    "id": "prod-003",
    "name": "Manzanas",
    "category": "Frutas",
    "estimatedPrice": 45.00,
    "isPurchased": false,
    "createdAt": "2026-02-04T15:30:00Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "El nombre del producto es requerido"
}
```

---

#### DELETE /api/products/{id}
**Descripción:** Eliminar producto de la lista

**Response Success (200):**
```json
{
  "success": true,
  "message": "Producto eliminado de la lista"
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Producto no encontrado"
}
```

---

### 3. COMPRAS (Historial)

#### GET /api/purchases
**Descripción:** Obtener historial de compras

**Query Parameters:**
- `month` (optional): "2026-02" (formato YYYY-MM)
- `limit` (optional): número de resultados (default: 10)

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "purchase-001",
      "totalAmount": 385.50,
      "purchaseDate": "2026-02-03T18:30:00Z",
      "products": [
        {
          "productName": "Leche",
          "category": "Lácteos",
          "price": 26.00
        },
        {
          "productName": "Pan integral",
          "category": "Panadería",
          "price": 35.00
        }
      ],
      "itemCount": 2
    }
  ],
  "count": 1
}
```

---

#### POST /api/purchases
**Descripción:** Registrar compra realizada

**Request Body:**
```json
{
  "totalAmount": 385.50,
  "purchaseDate": "2026-02-04T19:00:00Z",
  "products": [
    {
      "productId": "prod-001",
      "productName": "Leche",
      "category": "Lácteos",
      "price": 26.00
    },
    {
      "productId": "prod-002",
      "productName": "Pan integral",
      "category": "Panadería",
      "price": 35.00
    }
  ]
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Compra registrada exitosamente",
  "data": {
    "id": "purchase-002",
    "totalAmount": 385.50,
    "purchaseDate": "2026-02-04T19:00:00Z",
    "itemCount": 2
  }
}
```

**Nota:** Al registrar una compra, los productos asociados cambian su estado `isPurchased` a `true` y se eliminan de la lista activa.

---

#### GET /api/purchases/total
**Descripción:** Obtener total gastado en el mes actual

**Query Parameters:**
- `month` (optional): "2026-02" (default: mes actual)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "month": "2026-02",
    "totalSpent": 1250.75,
    "purchaseCount": 5,
    "averagePerPurchase": 250.15
  }
}
```

---

## 🎨 Diseño de Pantallas

### 1. Login (LoginActivity)

**Elementos:**
- Logo de la app
- Campo: Email
- Campo: Contraseña
- Botón: "Iniciar Sesión"
- Enlace: "¿No tienes cuenta? Regístrate"

**Validaciones:**
- Email formato válido
- Contraseña mínimo 6 caracteres

**Estados:**
- Loading (CircularProgressIndicator)
- Error (Snackbar o Toast)
- Success (navegar a MainActivity)

---

### 2. Registro (RegisterActivity)

**Elementos:**
- Campo: Nombre completo
- Campo: Email
- Campo: Contraseña
- Campo: Confirmar contraseña
- Botón: "Crear Cuenta"
- Enlace: "¿Ya tienes cuenta? Inicia sesión"

**Validaciones:**
- Nombre no vacío
- Email formato válido y único
- Contraseña mínimo 6 caracteres
- Contraseñas coinciden

---

### 3. Lista de Compras (MainActivity)

**Layout:**
- **Toolbar:** 
  - Título: "Mi Lista de Compras"
  - Menú: Perfil, Cerrar sesión
  
- **FloatingActionButton:** "+" para agregar producto

- **RecyclerView:**
  - Cada item muestra:
    - Checkbox (para marcar como comprado)
    - Nombre del producto
    - Categoría (chip pequeño)
    - Precio estimado
    - Botón eliminar (icono)

- **Bottom Bar:**
  - Botón: "Finalizar Compra" (solo visible si hay productos marcados)
  - Total estimado de productos marcados

**Funcionalidades:**
- Marcar/desmarcar productos
- Eliminar productos (deslizar o botón)
- Filtrar por categoría
- Calcular total de seleccionados en tiempo real

---

### 4. Agregar Producto (AddProductActivity o BottomSheet)

**Elementos:**
- Campo: Nombre del producto
- Spinner/Dropdown: Categoría
  - Frutas y Verduras
  - Lácteos
  - Carnes y Pescados
  - Panadería
  - Limpieza
  - Otros
- Campo: Precio estimado (numérico)
- Botón: "Agregar a mi lista"
- Botón: "Cancelar"

**Validaciones:**
- Nombre no vacío
- Categoría seleccionada
- Precio mayor a 0

---

### 5. Finalizar Compra (CheckoutActivity)

**Elementos:**
- **Título:** "Finalizar Compra"

- **Lista de productos seleccionados:**
  - Cada item editable con precio real
  - Nombre
  - Precio estimado → Precio real (editable)

- **Resumen:**
  - Subtotal estimado
  - Total real (suma de precios reales)
  - Diferencia (+/- del estimado)

- **Campo:** Fecha de compra (default: hoy)

- **Botón:** "Registrar Compra"

**Funcionalidades:**
- Editar precios reales de cada producto
- Calcular automáticamente totales
- Validar que todos tengan precio real
- Registrar compra y limpiar lista

---

### 6. Historial (HistoryActivity)

**Layout:**
- **Toolbar:** "Historial de Compras"

- **Card de Resumen Mensual:**
  - Mes actual
  - Total gastado
  - Número de compras
  - Promedio por compra

- **RecyclerView de Compras:**
  - Cada item muestra:
    - Fecha de compra
    - Total gastado
    - Número de productos
    - Botón "Ver Detalle" (expande/colapsa productos)

- **Filtros:**
  - Selector de mes

**Funcionalidades:**
- Ver detalle de cada compra
- Filtrar por mes
- Mostrar gráfica simple (opcional)

---

## 🏗️ Arquitectura - MVVM + Clean Architecture

```
app/
├── data/
│   ├── remote/
│   │   ├── api/
│   │   │   └── MyShopLiApi.kt
│   │   ├── dto/
│   │   │   ├── LoginRequest.kt
│   │   │   ├── RegisterRequest.kt
│   │   │   ├── ProductDto.kt
│   │   │   └── PurchaseDto.kt
│   │   └── RetrofitClient.kt
│   ├── local/ (opcional - Room Database)
│   │   ├── dao/
│   │   └── database/
│   └── repository/
│       ├── AuthRepositoryImpl.kt
│       ├── ProductRepositoryImpl.kt
│       └── PurchaseRepositoryImpl.kt
│
├── domain/
│   ├── model/
│   │   ├── User.kt
│   │   ├── Product.kt
│   │   └── Purchase.kt
│   ├── repository/
│   │   ├── AuthRepository.kt
│   │   ├── ProductRepository.kt
│   │   └── PurchaseRepository.kt
│   └── usecase/
│       ├── LoginUseCase.kt
│       ├── RegisterUseCase.kt
│       ├── GetProductsUseCase.kt
│       ├── AddProductUseCase.kt
│       ├── DeleteProductUseCase.kt
│       ├── GetPurchasesUseCase.kt
│       ├── RegisterPurchaseUseCase.kt
│       └── GetMonthlyTotalUseCase.kt
│
├── presentation/
│   ├── auth/
│   │   ├── login/
│   │   │   ├── LoginActivity.kt
│   │   │   ├── LoginViewModel.kt
│   │   │   └── res/layout/activity_login.xml
│   │   └── register/
│   │       ├── RegisterActivity.kt
│   │       ├── RegisterViewModel.kt
│   │       └── res/layout/activity_register.xml
│   │
│   ├── main/
│   │   ├── MainActivity.kt
│   │   ├── MainViewModel.kt
│   │   ├── ProductAdapter.kt
│   │   └── res/layout/activity_main.xml
│   │
│   ├── addproduct/
│   │   ├── AddProductActivity.kt
│   │   ├── AddProductViewModel.kt
│   │   └── res/layout/activity_add_product.xml
│   │
│   ├── checkout/
│   │   ├── CheckoutActivity.kt
│   │   ├── CheckoutViewModel.kt
│   │   ├── CheckoutAdapter.kt
│   │   └── res/layout/activity_checkout.xml
│   │
│   └── history/
│       ├── HistoryActivity.kt
│       ├── HistoryViewModel.kt
│       ├── PurchaseAdapter.kt
│       └── res/layout/activity_history.xml
│
├── di/ (Dependency Injection - Koin o Hilt)
│   └── AppModule.kt
│
└── utils/
    ├── Constants.kt
    ├── SharedPrefsManager.kt
    ├── DateUtils.kt
    └── Extensions.kt
```

---

## 📱 Navegación de la App

```
Splash Screen (opcional)
    ↓
Login ←→ Register
    ↓
MainActivity (Lista de Compras)
    ├── FAB → AddProduct
    ├── Bottom Button → Checkout → [Registra] → MainActivity (actualizada)
    ├── Menu → History
    └── Menu → Logout → Login
```

---

## 🔐 Seguridad

1. **Autenticación:**
   - JWT Token almacenado en SharedPreferences (encriptado)
   - Token incluido en header de cada petición

2. **Validaciones:**
   - Cliente: Validación de formularios
   - Servidor: Validación de datos y permisos

3. **Contraseñas:**
   - Mínimo 6 caracteres
   - Hasheadas en el servidor (bcrypt)

---

## 📦 Dependencias Principales

```gradle
// Networking
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
implementation 'com.squareup.okhttp3:logging-interceptor:4.11.0'

// ViewModel y LiveData
implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2'
implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.6.2'

// Coroutines
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'

// Material Design
implementation 'com.google.android.material:material:1.11.0'

// RecyclerView
implementation 'androidx.recyclerview:recyclerview:1.3.2'

// Dependency Injection (Koin)
implementation 'io.insert-koin:koin-android:3.5.0'

// Room Database (opcional para cache local)
implementation 'androidx.room:room-runtime:2.6.1'
kapt 'androidx.room:room-compiler:2.6.1'
implementation 'androidx.room:room-ktx:2.6.1'
```

---

## 🎯 Casos de Uso Principales

### 1. Agregar Producto a Lista
```
ACTOR: Usuario
PRECONDICIÓN: Usuario autenticado
FLUJO:
1. Usuario abre la app
2. Usuario presiona FAB "+"
3. Sistema muestra formulario
4. Usuario ingresa nombre, categoría, precio
5. Usuario presiona "Agregar"
6. Sistema valida datos
7. Sistema envía POST /api/products
8. Sistema recibe confirmación
9. Sistema actualiza lista
10. Sistema muestra mensaje de éxito
```

### 2. Realizar Compra
```
ACTOR: Usuario
PRECONDICIÓN: Hay productos en la lista
FLUJO:
1. Usuario marca productos comprados (checkbox)
2. Sistema calcula total estimado
3. Usuario presiona "Finalizar Compra"
4. Sistema muestra pantalla de checkout
5. Usuario ajusta precios reales
6. Sistema calcula total real
7. Usuario presiona "Registrar Compra"
8. Sistema envía POST /api/purchases
9. Sistema elimina productos de lista activa
10. Sistema muestra confirmación
11. Sistema regresa a lista principal
```

### 3. Consultar Historial
```
ACTOR: Usuario
PRECONDICIÓN: Usuario tiene compras registradas
FLUJO:
1. Usuario abre menú
2. Usuario selecciona "Historial"
3. Sistema consulta GET /api/purchases
4. Sistema consulta GET /api/purchases/total
5. Sistema muestra resumen mensual
6. Sistema muestra lista de compras
7. Usuario puede expandir para ver detalle
```

---

## 🎨 Paleta de Colores Sugerida

```xml
<!-- res/values/colors.xml -->
<resources>
    <!-- Primary Colors -->
    <color name="primary">#4CAF50</color>          <!-- Verde -->
    <color name="primary_dark">#388E3C</color>
    <color name="primary_light">#C8E6C9</color>
    
    <!-- Accent Colors -->
    <color name="accent">#FF9800</color>           <!-- Naranja -->
    <color name="accent_light">#FFE0B2</color>
    
    <!-- Background -->
    <color name="background">#F5F5F5</color>
    <color name="surface">#FFFFFF</color>
    
    <!-- Text -->
    <color name="text_primary">#212121</color>
    <color name="text_secondary">#757575</color>
    
    <!-- Status -->
    <color name="success">#4CAF50</color>
    <color name="error">#F44336</color>
    <color name="warning">#FFC107</color>
</resources>
```

---

## ✅ Checklist de Implementación

### Backend (API REST)
- [ ] Configurar servidor (Node.js/Express o Spring Boot)
- [ ] Implementar autenticación JWT
- [ ] Crear endpoints de autenticación
- [ ] Crear endpoints de productos
- [ ] Crear endpoints de compras
- [ ] Validaciones y manejo de errores
- [ ] Documentación API (Postman/Swagger)
- [ ] Testing de endpoints

### Frontend (Android)
- [ ] Configurar proyecto Android Studio
- [ ] Configurar Retrofit y dependencias
- [ ] Implementar login y registro
- [ ] Implementar lista de productos
- [ ] Implementar agregar producto
- [ ] Implementar finalizar compra
- [ ] Implementar historial
- [ ] Manejo de estados (loading, error, success)
- [ ] Validaciones de formularios
- [ ] UI/UX pulido
- [ ] Testing básico

---

## 📝 Documentación para Entrega

### Contenido del Informe

1. **Portada**
   - Nombre del proyecto
   - Integrantes
   - Matrícula
   - Fecha

2. **Introducción**
   - Descripción del problema
   - Objetivo del proyecto

3. **Proceso de Negocio**
   - Diagrama de flujo del proceso
   - Descripción de cada fase

4. **Arquitectura**
   - Diagrama de arquitectura MVVM
   - Explicación de capas

5. **Modelo de Datos**
   - Diagrama de clases
   - Descripción de entidades

6. **API REST**
   - Listado de endpoints
   - Ejemplos de request/response

7. **Capturas de Pantalla**
   - Todas las pantallas de la app
   - Flujo de usuario

8. **Manual de Usuario**
   - Cómo usar la app
   - Funcionalidades principales

9. **Conclusiones**

---

## 🚀 Tips para Máxima Calificación

### Propuesta (5 pts)
✅ Explicar claramente el proceso completo de negocio
✅ Mencionar problema real que resuelve
✅ Definir alcance y limitaciones

### Producto (5 pts)
✅ Todas las funcionalidades CRUD operativas
✅ Login/Registro funcionando
✅ Sin errores críticos
✅ Manejo de errores gracioso

### Interfaz (10 pts)
✅ Material Design consistente
✅ Paleta de colores armoniosa
✅ Navegación intuitiva
✅ Estados de carga visibles
✅ Mensajes de error claros
✅ Responsive

### Informe (5 pts)
✅ Información clara y concisa
✅ Diagramas bien elaborados
✅ Capturas de pantalla de calidad
✅ Sin errores ortográficos

### Evaluación en Aula (5 pts)
✅ Conocer el código fuente
✅ Explicar patrón MVVM implementado
✅ Demostrar flujo completo
✅ Responder dudas con confianza

---

## 📞 Base de datos con MySQL Workbench

CREATE DATABASE myshopli;
USE myshopli;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  name VARCHAR(100),
  category VARCHAR(50),
  estimated_price DECIMAL(10,2),
  is_purchased BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE purchases (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  total_amount DECIMAL(10,2),
  purchase_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE purchase_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id CHAR(36),
  product_name VARCHAR(100),
  category VARCHAR(50),
  price DECIMAL(10,2),
  FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);



---

