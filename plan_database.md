# Plan de Base de Datos y Mini CRUD (100% Gratuito) - FATAL

Este documento detalla la arquitectura, el modelo de datos y el plan de implementación paso a paso para transformar la sección de fechas de **FATAL** en dinámica mediante un Mini CRUD administrable por el cliente, **sin costo de mantenimiento (Tier Gratuito Perpetuo)**.

---

## 1. Comparativa de Plataformas Gratuitas (Free Tier)

Ambas opciones cuentan con planes gratuitos suficientes para cubrir de sobra el tráfico y volumen de datos de una banda:

| Característica | **Supabase** (Recomendada) | **Firebase (Google Cloud)** |
| :--- | :--- | :--- |
| **Tipo de BD** | PostgreSQL relacional | NoSQL (Firestore) |
| **Límite de BD Gratis** | 500 MB (miles de fechas) | 1 GB de almacenamiento / 50k lecturas diarias |
| **Autenticación** | Hasta 50.000 usuarios activos/mes | Ilimitada / 50k llamadas/día |
| **Almacenamiento (Fotos)** | 1 GB en Supabase Storage | 5 GB en Firebase Storage (1 GB descarga/día) |
| **Facilidad para el Admin** | Panel tipo "Excel" (Table Editor) integrado | Panel de documentos JSON en consola |
| **Riesgo de Cobro** | **Cero**. Si se alcanzan límites, se pausa o frena; no cobra sin tarjeta prepaga. | Requiere plan Spark (gratis sin tarjeta). |

> **Recomendación:** **Supabase**. Ofrece SQL estándar, políticas de seguridad nativas (RLS), panel de administración visual muy intuitivo y SDK en JavaScript sumamente ligero vía CDN (`@supabase/supabase-js`), sin necesidad de Node/npm ni herramientas de compilación.

---

## 2. Modelo de Datos (`fechas`)

Tabla en PostgreSQL (Supabase) adaptada exactamente a la estructura actual de [index.html](file:///c:/Users/Juanzor/Desktop/proyects/fatal/index.html#L276-L354):

```sql
create table public.fechas (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,                      -- Fecha del evento (YYYY-MM-DD) para ordenamiento cronológico
  day varchar(2) not null,                       -- Ej: "5", "26", "18"
  month varchar(4) not null,                     -- Ej: "Jul", "Abr", "Feb"
  year varchar(4) not null,                      -- Ej: "2026"
  city varchar(100) not null,                    -- Ej: "Palermo", "San Martín"
  province varchar(100) not null,                -- Ej: "CABA", "Buenos Aires"
  venue varchar(150) not null,                   -- Ej: "Liverpool Club", "Orange"
  media jsonb default '[]'::jsonb,              -- Array de URLs de fotos/videos: ["img/...", "https://..."]
  ticket_url text,                               -- Link de entradas (opcional para futuras fechas)
  is_active boolean default true,                -- Para ocultar una fecha sin borrarla
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índice para consultar ordenado por fecha rápidamente
create index idx_fechas_event_date on public.fechas (event_date desc);
```

---

## 3. Seguridad y Permisos (Row Level Security - RLS)

Para que cualquiera pueda ver las fechas en la web pública pero **únicamente el administrador logueado pueda crear, modificar o borrar**:

```sql
-- Habilitar RLS
alter table public.fechas enable row level security;

-- 1. Lectura pública (Cualquier visitante anónimo de fatal.com.ar puede ver las fechas activas)
create policy "Lectura pública de fechas activas"
  on public.fechas for select
  using (is_active = true);

-- 2. Edición total solo para usuarios autenticados (el cliente/banda)
create policy "Admin total para usuarios autenticados"
  on public.fechas for all
  to authenticated
  using (true)
  with check (true);
```

---

## 4. Arquitectura de Archivos en el Proyecto

El sitio continuará siendo 100% estático (apto para GitHub Pages u host actual):

```text
fatal/
├── index.html           # Web pública (renderiza fechas dinámicamente)
├── script.js            # Consulta las fechas a Supabase y levanta el visor de fotos
├── style.css            # Estilos actuales
├── admin.html           # Panel de administración privado
├── js/
│   ├── supabaseClient.js # Inicialización con URL y anon-key pública
│   ├── admin.js          # Lógica del CRUD (login, listar, crear, editar, eliminar)
│   └── fechas-render.js  # Renderizado dinámico de la tabla en index.html
└── plan_database.md     # Este documento
```

---

## 5. Plan de Implementación Paso a Paso

### Fase 1: Creación del Proyecto en Supabase (5 minutos)
1. Crear cuenta gratuita en [supabase.com](https://supabase.com).
2. Crear un proyecto nuevo (ej: `fatal-web`).
3. En el **SQL Editor**, pegar y ejecutar el script del **Punto 2** y las políticas del **Punto 3**.
4. En **Authentication > Users**, crear el usuario y contraseña del cliente/administrador.
5. Copiar la `SUPABASE_URL` y la `SUPABASE_ANON_KEY` (Project Settings > API). Ambas son seguras para el frontend porque RLS protege la base.

### Fase 2: Carga Inicial de Datos (Migración)
Insertar las 4 fechas que hoy están hardcodeadas en [index.html](file:///c:/Users/Juanzor/Desktop/proyects/fatal/index.html#L277-L352):
1. **5 Jul 2026** - Liverpool Club (Palermo, CABA) - 3 fotos
2. **26 Abr 2026** - Orange (San Martín, Buenos Aires) - 6 fotos
3. **18 Abr 2026** - Rock La Ve (San Justo, Buenos Aires) - 4 fotos + 1 reel
4. **7 Feb 2026** - Vade (Morón, Buenos Aires) - 4 fotos + 1 reel

### Fase 3: Renderizado Dinámico en la Web Pública
1. Incluir el SDK de Supabase vía CDN en [index.html](file:///c:/Users/Juanzor/Desktop/proyects/fatal/index.html):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```
2. Modificar [script.js](file:///c:/Users/Juanzor/Desktop/proyects/fatal/script.js) para que al cargar el DOM:
   - Muestre un skeleton o mantenga las fechas actuales en cache mientras consulta Supabase.
   - Genere las filas `<tr class="date-row" data-venue="..." data-media="...">` conservando las clases CSS y la vinculación con el modal de fotos ya implementado.

### Fase 4: Creación de la Pantalla `admin.html`
1. **Pantalla de Login:** Simple formulario de email y password con estética oscura a tono con la banda.
2. **Dashboard / Tabla de Fechas:**
   - Lista todas las fechas cargadas.
   - Botón **"Nueva Fecha"** que abre un modal o formulario.
   - Campos: Selector de fecha, Ciudad, Provincia, Establecimiento, URLs de fotos/reels.
   - Acciones por fila: **Editar** y **Eliminar**.
3. **Botón de Cerrar Sesión**.

### Fase 5: Manejo de Fotos y Videos
* **Opción A (Sin configuración adicional):** El cliente carga las fotos en una carpeta de Drive, Imgur, o las deja en la carpeta `img/` del repo y solo pega las rutas/links en el formulario.
* **Opción B (Bucket en Supabase Storage):** Habilitar un bucket público `fechas-media` (1 GB gratis) donde el cliente sube las fotos directo desde el formulario con un `<input type="file">`.

---

## 6. Mantenimiento y Costos Futuros

* **Costo mensual:** $0.00 USD.
* **Alertas de consumo:** En el tier gratuito, Supabase no cobra por exceso de uso; si se excede el límite de transferencia (casi imposible para una landing), simplemente limita las peticiones, garantizando que nunca haya sorpresas financieras.

