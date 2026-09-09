# Portal de citas — Clínica Belén

Portal de pacientes construido con Next.js 16 y React 19, conectado a PostgreSQL de Supabase.

## Iniciar

Requiere Node.js 24 y la conexión PostgreSQL de Supabase en `.env`.

```bash
npm install
npm run dev
```

Abra http://localhost:3000 y seleccione **Registrar paciente**. Cree una cuenta con documento y contraseña; no existen credenciales predeterminadas. Después seleccione especialidad, profesional, día y hora.

## Configuración de Supabase

Configure `DATABASE_URL` con la conexión **Transaction pooler** del panel **Connect** de Supabase. La contraseña de la base debe estar codificada para una URL. El servidor verifica TLS usando `certs/supabase-ca.crt`; si cambia el certificado, puede indicar `DATABASE_SSL_CA_PATH`. Nunca use una variable `NEXT_PUBLIC_` para la conexión PostgreSQL.

En Supabase Table Editor seleccione el esquema `clinic` para ver las tablas activas: `patients`, `sessions`, `appointments` y `attempts`.

La integración comienza sin pacientes ni citas. El archivo anterior `data/clinic.sqlite` se conserva y no se importa. Las cuentas anteriores de SQLite no dan acceso al portal conectado a Supabase: debe registrar una cuenta nueva.

La autenticación conserva el acceso con documento y contraseña del portal. Las contraseñas se guardan con scrypt y las sesiones mediante hashes; no se usa Supabase Auth. El navegador accede a `/api/portal`, que verifica la sesión y la propiedad de cada cita. Las tablas tienen RLS habilitado y no conceden acceso a los roles de API `anon` o `authenticated`. La conexión del servidor realiza las operaciones con transacciones, bloqueos e índices únicos para evitar reservas duplicadas.

La conexión activa utiliza Postgres.js directamente y no necesita Supabase Auth ni una clave `SUPABASE_SERVICE_ROLE_KEY`. En producción la cookie requiere HTTPS. Las credenciales van en `.env` local o en las variables privadas del proveedor de alojamiento.

## Funcionalidades

- Registro validado en cliente y servidor; documentos únicos, fechas de nacimiento reales, teléfono, correo y contraseña.
- Acceso mediante documento y contraseña, sesión de ocho horas en cookie HttpOnly, cierre de sesión y límite de intentos de acceso.
- Calendario navegable, semanas de lunes a domingo y disponibilidad consultada al servidor. Agenda cada 30 minutos: lunes a viernes, 08:00–12:00 y 14:00–17:00; sábados, 08:00–14:00; hasta 180 días y en hora de Colombia.
- Selección de profesional por especialidad o asignación automática.
- Reserva persistente con código único, consulta y filtro por estado, confirmación de asistencia, reprogramación y cancelación con confirmación.
- Transacciones y restricciones únicas para impedir reservar simultáneamente el mismo profesional o paciente. Cancelar libera el horario.
- Cuenta y resumen personal de citas. Menú adaptable a móviles.

El catálogo de profesionales y el horario son datos de demostración definidos en `lib/clinic.ts`; deben reemplazarse por la agenda oficial antes de usar el portal con pacientes reales. No se envían correos ni SMS. No hay recuperación de contraseña ni administración de agendas por empleados.

Las rutas del portal usan nombres clínicos: `/acceso`, `/perfil`, `/citas`, `/agendar`, `/especialidades`, `/profesionales` y `/resumen`. Las direcciones antiguas redirigen a su equivalente para conservar enlaces existentes.

## Verificación

```bash
npx tsc --noEmit
npx vitest run
npm run build
npx playwright install chromium
npx playwright test
```

En Windows puede usar Microsoft Edge ya instalado:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npx playwright test
```

Playwright comprueba el flujo del navegador y la API utilizando la conexión PostgreSQL configurada. Inicia un servidor independiente en el puerto 3100.
