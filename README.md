# EduTicket 🎟️

Tickets digitales para la **Zona Literaria** — proyecto interdisciplinario.

> 📅 **Viernes 16 de octubre de 2026** · Salón de música · Aforo: **30 personas** (8vo, 9no y 10mo)

Los asistentes se registran con nombre, apellidos y curso, reciben un ticket con código QR y entran al salón mostrándolo en la puerta. Al terminar las presentaciones pueden solicitar el préstamo del libro que les interesó.

- 🎨 Identidad visual y sistema de diseño: [DESIGN.md](DESIGN.md)
- 📋 El plan de implementación por fases es un documento de trabajo del equipo y se comparte por fuera del repositorio

---

## Cómo levantar el proyecto en tu computadora

Necesitas **Node.js 20 o superior** ([descargar](https://nodejs.org)).

```bash
# 1. Instalar las dependencias (crea la carpeta node_modules, que no se sube al repo)
npm install

# 2. Crear tu archivo de variables de entorno
cp .env.example .env.local     # en Windows PowerShell: Copy-Item .env.example .env.local

# 3. Levantar el sitio
npm run dev
```

Abre <http://localhost:3000>.

> La portada funciona **sin base de datos**: mientras no configures Supabase, el catálogo se lee de [lib/site.ts](lib/site.ts). El registro de tickets sí la necesita.

### Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Compila la versión de producción (lo mismo que hace Vercel) |
| `npm start` | Sirve la versión ya compilada |
| `npm run typecheck` | Revisa que no haya errores de TypeScript |

---

## Configurar la base de datos (Supabase)

1. Crea una cuenta gratuita en [supabase.com](https://supabase.com) y un proyecto nuevo.
2. Entra a **SQL Editor** y ejecuta, en este orden:
   - [db/01_schema.sql](db/01_schema.sql) → tablas y función de reclamo de cupos
   - [db/02_seed.sql](db/02_seed.sql) → el turno, los **30 cupos** y los 3 libros
   - [db/03_ticket_token.sql](db/03_ticket_token.sql) → solo si ya habías ejecutado una versión anterior del 01: agrega el token del ticket
3. Ve a **Project Settings → API** y copia en tu `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` ← *Project URL*
   - `SUPABASE_SERVICE_ROLE_KEY` ← *service_role* ⚠️ **secreta**
4. Reinicia `npm run dev`.

> ⚠️ La `service_role key` salta todas las protecciones de la base de datos. Va **solo** en `.env.local` y en Vercel. Nunca en el código, nunca en una captura de pantalla, nunca en un chat.

---

## Publicar el sitio (Vercel)

1. Sube el repositorio a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio.
3. En **Environment Variables** agrega las cuatro variables de `.env.example` (con `NEXT_PUBLIC_SITE_URL` apuntando a la URL final).
4. **Deploy**. Cada `git push` vuelve a publicar automáticamente.

⚠️ **Supabase pausa los proyectos gratuitos tras ~1 semana sin actividad.** Hay que comprobar que el sitio responde el **miércoles 14 de octubre**, dos días antes del evento.

---

## Estructura del proyecto

```
EduTicket/
├─ app/                 Páginas (App Router de Next.js)
│  ├─ page.tsx          Portada
│  ├─ register/         Formulario de registro
│  ├─ t/[token]/        Ticket digital con QR
│  ├─ books/[slug]/     Ficha de cada libro
│  ├─ admin/            Panel del equipo (protegido con PIN)
│  ├─ api/health/       Diagnóstico de configuración
│  ├─ layout.tsx        Tipografías y metadatos del sitio
│  └─ globals.css       Sistema de diseño: colores, animaciones, utilidades
├─ components/          Piezas reutilizables de interfaz
│  ├─ admin/            Escáner QR, ingreso y préstamos del panel
│  ├─ Aurora.tsx        Fondo animado
│  ├─ BookCard.tsx      Tarjeta de libro
│  ├─ Countdown.tsx     Cuenta regresiva
│  ├─ Header.tsx        Barra superior fija
│  ├─ Logo.tsx          Marca de EduTicket (ticket + libro, en SVG)
│  ├─ RegisterForm.tsx  Formulario de registro
│  ├─ Reveal.tsx        Aparición al hacer scroll
│  ├─ TicketStub.tsx    El ticket con su QR
│  └─ TrailerEmbed.tsx  Reproductor del book trailer
├─ lib/
│  ├─ auth.ts           Sesión del panel con PIN
│  ├─ db.ts             Todas las consultas a la base (solo servidor)
│  ├─ site.ts           Datos del evento
│  └─ supabase.ts       Conexión a la base de datos (solo servidor)
├─ db/                  SQL para crear, poblar y limpiar la base
├─ public/covers/       Portadas de los libros
├─ public/trailers/     Book trailers y sus miniaturas
└─ DESIGN.md            Identidad visual
```

---

## Convenciones del proyecto

| Qué | Idioma | Por qué |
|-----|--------|---------|
| Mensajes de commit | **Inglés**, formato [Conventional Commits](https://www.conventionalcommits.org/es/) | Convención estándar de la industria |
| Comentarios en el código | **Inglés** | Buena práctica: el código se lee igual en cualquier equipo |
| Nombres en el código y la base de datos | **Inglés** (`EVENT`, `seats`, `claim_seat`) | Misma razón; se unificó antes de crear la base de datos para no arrastrar el cambio |
| Textos que ve el usuario | **Español** | Es un sitio para estudiantes hispanohablantes |
| Documentación (`.md`) | **Español** | La leen el equipo y los profesores |

Formato del commit: `tipo(alcance): descripción en minúsculas`, por ejemplo
`feat(registration): claim a seat atomically on sign-up`.
Tipos usados: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`.

> ⚠️ **No edites archivos con reemplazos de texto desde PowerShell.** `Get-Content` los lee como ANSI y destruye los acentos (`Regístrate` → `RegÃ­strate`). Usa el editor.

---

## El panel del equipo

Está en **`/admin`** y se entra con el PIN de `ADMIN_PIN`. La sesión dura 12 horas.

| Pantalla | Para qué |
|---|---|
| Resumen | Registrados, ingresos, cupos libres y préstamos |
| Puerta | Escáner QR continuo + búsqueda por nombre o código |
| Asistentes | Lista completa, búsqueda y descarga en CSV |
| Préstamos | Solicitado → entregado → devuelto |
| Libros | Expositor, book trailer y ejemplares disponibles |

**Cómo marcar ingresos el día del evento**, de más rápido a más lento:

1. **Escáner del panel** (`/admin/door` → *Encender cámara*): lee el ticket, apaga la cámara y muestra el resultado en grande, con opción de deshacer. *Escanear el siguiente* borra el aviso y vuelve a encenderla. Solo suena una alerta si el ticket ya había ingresado o no existe, y se puede silenciar con el botón de la esquina.
2. **Cámara normal del celular**: abre el ticket del estudiante y, si ese teléfono tiene sesión de equipo, muestra el botón de ingreso.
3. **Búsqueda por nombre o código**, para cuando el QR no se deja leer.

> El escáner necesita HTTPS. En la URL de Vercel funciona; en desarrollo, solo por `localhost`.

> Si se pierde un celular con la sesión abierta, cambia `ADMIN_PIN` en Vercel y vuelve a desplegar: eso cierra todas las sesiones de inmediato.

---

## Sobre los datos de los asistentes

Se recoge lo mínimo —nombres, apellidos, curso y paralelo— y **solo** para controlar el aforo y los préstamos. La lista nunca es pública: se ve desde el panel protegido con PIN, y la URL de cada ticket usa un código aleatorio que no se puede adivinar.

Después del evento y de las devoluciones, los datos se exportan para el informe y **se borran de la base** con [db/99_reset_attendees.sql](db/99_reset_attendees.sql).

## Tecnologías

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Lucide (iconos) · Supabase (Postgres) · Vercel
