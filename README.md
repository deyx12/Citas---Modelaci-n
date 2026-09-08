# Portal de citas ? Cl?nica Bel?n

Portal funcional de pacientes construido con Next.js 16 y React 19.

## Iniciar

Requiere Node.js 24 (utiliza `node:sqlite`).

```bash
npm install
npm run dev
```

Abra http://localhost:3000 y seleccione **Registrar paciente**. Cree una cuenta con documento y contrase?a; no existen credenciales predeterminadas. Despu?s seleccione especialidad, profesional, d?a y hora.

## Funcionalidades

- Registro validado en cliente y servidor; documentos ?nicos, fechas de nacimiento reales, tel?fono, correo y contrase?a.
- Acceso mediante documento y contrase?a, sesi?n de ocho horas en cookie HttpOnly, cierre de sesi?n y l?mite de intentos de acceso.
- Calendario navegable, semanas de lunes a domingo y disponibilidad consultada al servidor. Agenda de lunes a viernes, cada 30 minutos, 08:00?12:00 y 14:00?17:00, hasta 180 d?as; todas las horas corresponden a Colombia.
- Selecci?n de profesional por especialidad o asignaci?n autom?tica.
- Reserva persistente con c?digo ?nico, consulta y filtro por estado, confirmaci?n de asistencia, reprogramaci?n y cancelaci?n con confirmaci?n.
- Transacciones y restricciones ?nicas para impedir reservar simult?neamente el mismo profesional o paciente. Cancelar libera el horario.
- Cuenta y resumen personal de citas. Men? adaptable a m?viles.

## Persistencia y alcance

Los datos se guardan en `data/clinic.sqlite`, en el servidor local, y sobreviven a recargas y reinicios. `CLINIC_DB_PATH` permite elegir otra ubicaci?n. No borre esta base si necesita conservar los registros. Los archivos de datos y las variables privadas se excluyen mediante `.gitignore`.

El cat?logo de profesionales y el horario son datos de demostraci?n definidos en `lib/clinic.ts`; deben reemplazarse por la agenda oficial antes de usar el portal con pacientes reales. No se env?an correos ni SMS. No hay recuperaci?n de contrase?a ni administraci?n de agendas por empleados.

La configuraci?n previa de Prisma/Supabase permanece en el repositorio como base para una integraci?n futura; el portal usa SQLite y no requiere esas credenciales. Este almacenamiento requiere un servidor Node con disco persistente: no es adecuado para instancias serverless con disco ef?mero. Para desplegar varias instancias, integrar PostgreSQL y la autenticaci?n de producci?n. En producci?n la cookie requiere HTTPS.

Las rutas heredadas se conectan al portal: `/login` acceso, `/cuenta` y `/usuarios` cuenta del paciente, `/historial` y `/ventas` consulta, `/productos` especialidades, `/proveedores` profesionales, `/inventario` inicio de agendamiento, `/reportes` y `/dashboard` resumen personal. No son paneles administrativos ni exponen datos de otros pacientes.

## Verificaci?n

```bash
npx tsc --noEmit
npx vitest run
npm run build
npx playwright install chromium
npm run test:e2e
```

En Windows puede usar Microsoft Edge ya instalado:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

Playwright inicia un servidor independiente en el puerto 3100 y usa `data/clinic-e2e.sqlite`, separado de los datos del portal. Comprueba registro, validaciones, navegaci?n del calendario, persistencia tras recargar, reprogramaci?n, cancelaci?n, acceso y conflictos de reservas simult?neas.
