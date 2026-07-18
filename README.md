# BookMy · Panel de administración (Next.js) — integrado con BookMyBackend

Frontend del panel multi-empresa de BookMy, **integrado al 100 % con el API oficial** (BookMyBackend · NestJS + Prisma + PostgreSQL). No existe ningún dato mockeado: toda la información proviene exclusivamente de los endpoints del backend.

## Puesta en marcha

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=YOUR_API_URL → URL real del backend
npm install
npm run dev
```

> La variable de entorno queda con placeholder (`YOUR_API_URL`); sin ella el login lo indica y ninguna vista inventa datos.

## Análisis del Backend (resumen)

- **Arquitectura**: NestJS 11 modular — cada dominio es un módulo `module/controller/service/DTO`; Prisma 6 como capa de repositorio sobre PostgreSQL (`prisma/schema.prisma`); `ValidationPipe` global con whitelist (los DTOs son contrato estricto); Swagger en `/api`; estáticos en `/uploads`.
- **Autenticación**: `POST /auth/login` → `{ user, token }` y cookie httpOnly `access_token`; `jwt.strategy.ts` acepta cookie **o** Bearer; guards `JwtAuthGuard` + `RolesGuard` con `@Roles/@Public`. Payload: `id, email, name, idioma, role, empresaId, sedeId`.
- **Roles (enum de BD)**: `SUPER_ADMIN, COMPANY_ADMIN, BRANCH_ADMIN, EMPLOYEE, CLIENT`.
- **Relaciones**: `Empresa 1─N Sede 1─N Profesional`; `Service N─N (Sede, Profesional)` vía `service_sede_profesional`, con `ServiceTranslation` (i18n por `?language=`) y `Price (amount, duration)`; `Appointment` referencia sede/servicio/profesional/usuario y genera `Payment (CARD|CASH)`; `Resena`, `HorarioSede`, chat (`chat`, `chat_contact`) con REST + gateway Socket.IO; `user_data.idioma` = parámetro de idioma por usuario.
- **Flujo de negocio**: el cliente final (CLIENT) reserva una cita → se valida disponibilidad/horario → se crea el `Payment` con el precio del servicio → estados `PENDING→CONFIRMED→COMPLETED/CANCELLED/NO_SHOW`.

## Configuración HTTP (única vía de comunicación)

`src/api/` es la única capa de comunicación y se reutiliza en todo el proyecto:

- `config.ts` — URL base (`NEXT_PUBLIC_API_URL`) y almacenamiento del token.
- `http.ts` — cliente `fetch`: JSON, `credentials: "include"` (cookie httpOnly) + `Authorization: Bearer` de respaldo, errores normalizados (`ApiError`), query-string builder.
- `endpoints.ts` — mapa 1:1 de los `@Controller` del backend.
- `types.ts` — tipos espejo del `schema.prisma` y de los DTOs.
- `modules.ts` — un módulo por dominio (Auth, Empresas, Sedes, Profesionales, Services, Categories, Appointments, Resenas, Payments, Chat), documentado con JSDoc.
- `mappers.ts` — traducción backend ⇄ modelos del panel (roles, estados, citas).

## Arquitectura del Frontend (MVC)

```
src/
├── api/           # Única capa HTTP (espejo del backend)
├── models/        # M · Interfaces del panel
├── controllers/   # C · Lógica de negocio: orquestan src/api y mapean
├── app/           # V · Páginas (App Router) — solo pintan y llaman controladores
├── components/    # Design system + layout + popup de reserva
├── hooks/         # useData (carga asíncrona unificada)
├── context/       # Theme · Session · Ui (toast/confirm)
├── i18n/          # Idiomas ES/EN ampliables + parámetro de BD
├── constants/     # Rutas, navegación por rol, helpers
└── styles/        # Design system global (claro/oscuro)
```

## Pantalla → Endpoints oficiales

| Pantalla | Endpoints |
|---|---|
| Login | `POST /auth/login` (token + cookie; idioma de `user_data.idioma`) |
| Empresas (solo superadmin) | `GET/POST /empresas` |
| Dashboard | `GET /appointments/branches/:sedeId/latest`, `GET /appointments?sedeId`, KPIs de `/payments`, `/auth/users`, `/resenas` |
| Reservas | `GET /appointments?sedeId` (`{items,pagination}`), `POST /appointments` (DTO exacto con `paymentMethod CARD|CASH`, tarjeta si CARD, `paymentAmount` = precio del servicio) |
| Flujo de agendado | clientes `GET /auth/users` (CLIENT) · sedes `GET /sedes/empresa/:id` · empleados `GET /profesionales/by-sede/:id` · servicios `GET /services/by-sede/:id?language=` (precio de `Price.amount`) |
| Calendario | Mismas citas agrupadas por fecha (mes actual real) |
| Clientes | `GET /auth/users` (solo lectura; el alta es `POST /auth/register` desde la app de clientes) |
| Servicios | `GET /services?language=`, `GET /categories?language=`, `POST /services` (translations + prices), `DELETE /services/:id` |
| Personal | `GET /profesionales`, `POST /profesionales` (phone único + sedeId), `DELETE /profesionales/:id` |
| Sedes | `GET /sedes/empresa/:empresaId`, `POST /sedes` |
| Reseñas | `GET /resenas`, `PATCH /resenas/:id/aprobar` |
| Facturación | `GET /payments` (estados mapeados) |
| Comunicación | `GET /ChatMessage/contacts/:userId`, `GET /ChatMessage/messages/:a/:b`, `POST /ChatMessage/messages`, `POST /ChatMessage/messages/read` (REST con sondeo; el backend también expone Socket.IO) |
| Estadísticas | Agregados calculados de `/payments`, `/auth/users`, `/resenas` y citas |
| Configuración | `PATCH /auth/users/:id` (nombre e **idioma** — parámetro de BD), `PATCH /auth/users/:id/password` |

## Roles e i18n

- Mapeo de roles: `SUPER_ADMIN→superadmin`, `COMPANY_ADMIN→owner (dueño)`, `BRANCH_ADMIN→admin (sede)`, `EMPLOYEE→employee`; `CLIENT` no accede al panel. Cada rol solo ve su menú; **Empresas** es exclusivo de superadmin (oculto del menú + guard en la página).
- El **selector de idioma** del topbar persiste la preferencia en la BD (`PATCH /auth/users/:id { idioma }`) y en `localStorage`; al iniciar sesión, el parámetro `user_data.idioma` de la BD manda. Para agregar un idioma: `src/i18n/config.ts` (los `⚙️ PUNTOS DE CONFIGURACIÓN` están comentados en el código).

## Notas de alcance

- **Stock/insumos** se eliminó del panel: el backend no tiene módulo de inventario (sin endpoint = sin pantalla, cero datos inventados).
- La comunicación usa la vía REST del chat con sondeo de 5 s; migrar al gateway Socket.IO del backend es el siguiente paso natural.
