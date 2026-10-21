# Sistema de Gestión Administrativa y de Caja — Frontend (Angular)

Estructura inicial del proyecto (ProyectoGrupo5), generada a partir del
documento de requisitos y del resumen de API. Angular 17+, componentes
standalone, routing con `provideRouter`, Bootstrap 5 y formularios reactivos.

## Requisitos previos

- Node.js 18+ y **pnpm** (no usar `npm install`).
- Angular CLI (`pnpm add -g @angular/cli`, o usar `pnpm dlx @angular/cli`).

## Instalación

```bash
pnpm install
```

## Levantar en desarrollo

```bash
pnpm start
# equivalente a: ng serve
```

Por defecto sirve en `http://localhost:4200` y espera el backend en
`http://localhost:8080` (ver `src/environments/environment.ts`).

> ⚠️ El backend necesita permitir CORS desde `http://localhost:4200`
> (ver observación 1 del resumen de API: falta el bean `CorsConfigurationSource`).

## Build de producción

```bash
pnpm run build:prod
```

## Estructura de carpetas

```
src/
├── environments/            # RNF-11: URL de API centralizada por ambiente
├── app/
│   ├── app.component.ts     # Componente raíz (solo <router-outlet>)
│   ├── app.config.ts        # providers: router + HttpClient con interceptor
│   ├── app.routes.ts        # Rutas raíz: /login (pública) y shell protegida
│   ├── core/                # Transversal a todos los módulos
│   │   ├── models/          # DTOs de cada entidad + auth.model.ts, enums.model.ts
│   │   ├── services/        # un servicio por entidad + auth.service.ts, reporte.service.ts
│   │   ├── interceptors/    # auth.interceptor.ts (JWT + manejo de 401/403)
│   │   ├── guards/          # auth.guard.ts (sesión) y role.guard.ts (por rol)
│   │   └── utils/           # descargar-archivo.util.ts (blobs de Reportes)
│   ├── shared/
│   │   ├── layout/          # shell.component.ts (header + sidebar) y nav-icon.component.ts
│   │   └── validators/      # fecha-pasada.validator.ts
│   └── features/
│       ├── auth/login/      # Módulo de autenticación
│       ├── home/            # Pantalla de inicio tras loguearse
│       └── socios|puestos|giros|bancos|servicios|cuentas-por-cobrar|
│           recibos|egresos|reportes|usuarios/   # Un feature por módulo,
│           cada uno con su servicio + componentes + rutas propias.
```

## Layout general (header + sidebar)

Todo lo que vive bajo la ruta raíz protegida por `authGuard` se renderiza
dentro de `ShellComponent` (`shared/layout/shell.component.ts`):

- **Header** (`app-header`, fijo arriba con `position: sticky`): a la
  izquierda el nombre de la app (con un botón hamburguesa que solo se ve
  en mobile, `d-lg-none`, para abrir la navegación); a la derecha, si hay
  sesión, un avatar circular con las iniciales del usuario
  (`iniciales(nombres, apellidos)`), su nombre completo + badge de rol
  (ocultos en pantallas muy chicas, `d-none d-sm-flex`), y el botón de
  cerrar sesión (ícono, llama a `authService.logout()` + redirige a
  `/login`).
- **Sidebar** (`app-sidebar`, a la izquierda, fondo oscuro): la lista de
  navegación está centralizada en un único array (`NAV_ITEMS`, dentro de
  `shell.component.ts`) — cada entrada define su `path`, `label`, ícono y
  si es `soloAdministrador` (hoy solo "Usuarios"). El template arma la
  lista una sola vez dentro de un `<ng-template #navLinks>` y la reusa
  con `NgTemplateOutlet` tanto en el sidebar fijo de escritorio como en
  el offcanvas de Bootstrap que aparece en mobile (`< lg`) — así ambos
  quedan siempre sincronizados sin duplicar markup. El link activo se
  resalta con un borde de acento + fondo más claro
  (`routerLinkActive="app-nav__link--active"`).
- **Iconos** (`shared/layout/nav-icon.component.ts`): como Bootstrap 5 no
  trae un set de iconos incluido, se armó un componente `<app-nav-icon>`
  chiquito con ~12 iconos de línea dibujados a mano con primitivas SVG
  simples (círculos, rectángulos, líneas), sin agregar ninguna
  dependencia nueva al proyecto.
- **Contenido** (`app-content`): el `<router-outlet>` de los módulos,
  padeado y con su propio scroll independiente del sidebar (layout flex,
  sin posicionamiento `fixed` ni cálculos de márgenes mágicos).

### Estilos base (`src/styles.css`)

Además de las reglas del shell, el archivo define un pequeño sistema de
tokens en `:root` (`--app-header-height`, `--app-sidebar-width`,
`--app-accent` —tomado de `--bs-primary` con fallback, para no introducir
un segundo tono que compita con los botones `btn-primary` ya usados en
todos los formularios—, colores del sidebar oscuro, etc.), más:

- Un estado de foco visible consistente (`:focus-visible`) en toda la
  app, pensado para que se note también sobre el fondo oscuro del
  sidebar (RNF-15).
- Un *skip link* (`Saltar al contenido`, oculto hasta que recibe foco por
  teclado) que salta directo a `#main-content`, para no obligar a
  tabular por los ~10 links del sidebar en cada página.

## Modelos (DTOs)

`core/models/` contiene la interface TypeScript de cada DTO del backend,
un archivo por entidad (además de `index.ts`, que los reexporta todos):

| Archivo | Contenido |
| --- | --- |
| `auth.model.ts` | `LoginRequest`, `LoginResponse`, `SesionUsuario`, `RolUsuario` |
| `enums.model.ts` | `CargoA`, `EstadoCuenta`, `EstadoEgreso`, `Moneda`, `Recurrencia`, `TipoRecibo` |
| `socio.model.ts` | `SocioDTO` |
| `puesto.model.ts` | `PuestoDTO` |
| `giro.model.ts` | `GiroDTO` |
| `banco.model.ts` | `BancoDTO` |
| `servicio.model.ts` | `ServicioDTO` |
| `cuenta-por-cobrar.model.ts` | `CuentaPorCobrarDTO` + requests de generación (`GenerarCuentasPuestoRequest`, `GenerarCuentaConsumoRequest`, `GenerarCuentasSocioRequest`, `TotalCuentasRequest`, `TotalResponse`) |
| `recibo.model.ts` | `ReciboDTO`, `ProcesarPagoRequest`, `CanjeBancoRequest` |
| `resumen-cuentas.model.ts` | `ResumenCuentasDTO` (usa `CuentaPorCobrarDTO` y `ReciboDTO`) |
| `egreso.model.ts` | `EgresoDTO`, `EgresoCargaMasivaResultado` |
| `usuario.model.ts` | `UsuarioDTO` |
| `error-response.model.ts` | `ErrorResponse` (cuerpo estándar de error de la API) |

Todos los campos opcionales/obligatorios y sus límites (`max`, `min`, `≥ 0`,
etc.) siguen exactamente lo indicado en el resumen de API, sección 4. Se
pueden importar individualmente o todos juntos desde el barril:

```ts
import { SocioDTO, PuestoDTO, EstadoCuenta } from '../../core/models';
```

## Catálogos CRUD (Socios, Giros, Bancos)

Implementados end-to-end, siguiendo siempre el mismo patrón:

- **Servicio** en `core/services/<entidad>.service.ts` (`SocioService`,
  `GiroService`, `BancoService`): `listar()`, `obtener(id)`, `crear()`,
  `actualizar(id, dto)`, `eliminar(id)`, contra los endpoints
  `/api/socios`, `/api/giros`, `/api/bancos`. `SocioService` además expone
  `listarPorEtapas()` y `obtenerResumen()`.
- **Listado** (`<entidad>-list.component`): tabla Bootstrap, filtro de
  texto en cliente (RNF-07), botón "Nuevo", "Editar" por fila y "Eliminar"
  con confirmación (RF-07) y feedback de carga/error (RNF-08).
- **Formulario** (`<entidad>-form.component`): un solo componente para
  crear y editar (según el parámetro de ruta `:id`, o `nuevo`), reactive
  forms con validación visual `is-invalid`/`invalid-feedback` respetando
  los límites de cada DTO (`max`, `required`, etc.). El de Socios además
  valida que `fechaNacimiento` sea una fecha pasada
  (`shared/validators/fecha-pasada.validator.ts`).
- **Rutas** (`<modulo>.routes.ts`): `''` (listado), `'nuevo'` (crear),
  `':id'` (editar), registradas en `app.routes.ts` vía `loadChildren`
  bajo la ruta protegida por `authGuard`.
- El sidebar del shell (`shared/layout/shell.component.ts`, array `NAV_ITEMS`) ya enlaza a
  `/socios`, `/giros` y `/bancos`.

Puestos, Servicios, Cuentas por cobrar, Recibos, Egresos, Reportes y
Usuarios quedan pendientes; pueden construirse siguiendo exactamente este
mismo patrón (servicio + list + form + routes).

## Puestos y Servicios cobrables

Mismo patrón que Socios/Giros/Bancos, con dos particularidades:

- **Puestos** (`features/puestos/`): el formulario carga los catálogos de
  Giros y Socios (`forkJoin`) para poblar dos `<select>` — `giroId`
  (obligatorio) y `socioId` (opcional, "Sin socio asociado"). El listado
  resuelve y muestra el nombre del giro y del socio en vez del id crudo.
  Valida que `fechaFinVigencia` no sea anterior a `fechaInicioVigencia`.
- **Servicios** (`features/servicios/`): el checkbox `esConsumo` controla
  dinámicamente los validadores de `costoUnitario` (`core/models` /
  `ServicioDTO`) — se suscribe a `valueChanges` del control `esConsumo` y
  agrega `required` + `min(0)` a `costoUnitario` solo cuando está
  marcado, limpiando el valor y los validadores cuando se desmarca. El
  campo `costoUnitario` solo se muestra en el formulario (y solo se
  envía al backend) cuando `esConsumo = true`.

## Catálogos y roles (ADMINISTRADOR vs OPERADOR_CAJA)

Socios, Giros, Bancos, Puestos y Servicios están protegidos por rol en el
backend (`GET` para ambos roles, `POST`/`PUT`/`DELETE` solo
`ADMINISTRADOR`). Todos sus listados usan `authService.esAdministrador()`
para ocultar el botón "Nuevo" y la columna "Editar"/"Eliminar" a un
`OPERADOR_CAJA`. Ver la sección de autenticación más abajo para el
detalle de cómo se maneja el `403` en el interceptor.

## Cuentas por cobrar (RF-16 a RF-22)

A diferencia de los catálogos anteriores, este módulo **no está
restringido por rol**: tanto `ADMINISTRADOR` como `OPERADOR_CAJA` pueden
generar, consultar, abonar, exonerar y calcular totales (ver resumen de
API, sección 1) — por eso ninguno de sus componentes usa
`esAdministrador()`.

- **Servicio** (`core/services/cuenta-por-cobrar.service.ts`):
  `generarPorPuestos()`, `generarPorConsumo()`, `generarPorSocios()`,
  `listarPorSocio()` / `listarPorPuesto()`, `abonar()` / `exonerar()`
  (PATCH) y `calcularTotal()`, contra `/api/cuentas-por-cobrar/**`.
- **`CuentasPorCobrarComponent`** (`features/cuentas-por-cobrar/`): página
  contenedora con pestañas (`nav-pills` de Bootstrap, estado en un
  signal local — no son rutas hijas porque las 4 vistas no necesitan URL
  propia) que aloja a los siguientes cuatro subcomponentes:
  - **`GenerarPuestosComponent`** (RF-16): selecciona servicio y período,
    y una lista de puestos con checkboxes (+ "Seleccionar todos"/"Limpiar").
    Genera una cuenta por cada puesto marcado, con el costo del servicio.
  - **`GenerarConsumoComponent`** (RF-17): el select de servicio se filtra
    a los que tienen `esConsumo = true`; pide puesto, lectura inicial y
    final, con validación de que la final no sea menor a la inicial. El
    monto lo calcula el backend (diferencia × costo unitario).
  - **`GenerarSociosComponent`** (RF-18 / RN-06): servicio, período, monto
    opcional (si se omite usa el costo del servicio), checkboxes de etapas
    1/2/3 (opcional — sin marcar ninguna incluye todas) y "solo únicos"
    para evitar repetidos por nombre y apellido.
  - **`ConsultaCuentasComponent`** (RF-19 a RF-22): buscador por
    socio o puesto (resolviendo también el nombre del servicio de cada
    cuenta vía un mapa `Map<id, ServicioDTO>`, igual que se resuelven
    giro/socio en el listado de Puestos). Cada cuenta `PENDIENTE` tiene
    checkbox de selección y botones "Abonar"/"Exonerar" (RF-21); las
    `ABONADA`/`EXONERADA` solo muestran su badge de estado, ya no se
    pueden volver a marcar. El botón "Calcular total" llama a
    `POST /total` con las cuentas seleccionadas (RF-22).

> El procesamiento del pago en sí (`POST /api/recibos/pagos`, que genera
> el recibo) queda para el módulo de **Recibos**, que puede reusar
> directamente `ConsultaCuentasComponent` (o su lógica de selección) como
> paso previo a "Procesar pago".

## Recibos y cobranza (RF-23 a RF-26, RF-29, RF-31)

Tampoco está restringido por rol (mismo caso que Cuentas por cobrar).

- **`ReciboService`** (`core/services/recibo.service.ts`): `procesarPago()`,
  `canjearBanco()`, `registrarIngresoExterno()`, `listar(filtro)` (con
  `tipo` obligatorio y `desde`/`hasta` opcionales, ya en formato
  `LocalDateTime` ISO) y `obtener(id)`, contra `/api/recibos/**`.
- **`RecibosComponent`** (`features/recibos/`): misma idea de pestañas que
  `CuentasPorCobrarComponent` (signal local, sin rutas hijas):
  - **`ProcesarPagoComponent`** (RF-23): busca cuentas `PENDIENTE` por
    socio o puesto (mismo patrón que la Consulta de Cuentas por cobrar),
    permite seleccionar varias con checkbox, muestra el total en vivo y
    llama a `POST /recibos/pagos`. Al terminar, vuelve a buscar para
    reflejar el nuevo estado `ABONADA` de las cuentas pagadas.
  - **`CanjeBancoComponent`** (RF-24): busca las cuentas pendientes de UN
    socio, elige **una sola** por radio button (el canje es 1 a 1), banco
    y fecha de depósito.
  - **`IngresoExternoComponent`** (RF-25): formulario simple con
    depositante, categoría, concepto (opcional), monto y fecha de
    depósito (opcional). Llama a `POST /recibos/ingresos-externos` con
    `tipo: 'INGRESO'` fijo.
  - **`ListadoRecibosComponent`** (RF-29 / RF-31): filtro por `tipo`
    (select) y rango `desde`/`hasta` (inputs `date`, convertidos a
    `LocalDateTime` con `T00:00:00`/`T23:59:59`). Cada fila tiene un botón
    "Ver voucher" que trae el detalle completo (`GET /recibos/{id}`) y lo
    muestra en un panel tipo comprobante (no hay generación de PDF real,
    es una vista de los campos del `ReciboDTO`).

### ✅ `usuarioId` — limitación resuelta (antes requería `UsuarioIdFieldComponent`)

`ProcesarPagoRequest`, `CanjeBancoRequest` y `ReciboDTO` (ingresos
externos) exigen un `usuarioId` numérico. **Esto ya no es un problema**:
el backend agregó el campo `id` a `LoginResponse` (login y el nuevo
`GET /api/auth/me`), resuelto para cualquier rol — el viejo rodeo por
`GET /api/usuarios` (exclusivo de `ADMINISTRADOR`) quedó eliminado.

- `AuthService.usuarioId()` expone directamente `sesion()?.id`, sin
  ninguna llamada adicional: el `id` ya viene en la respuesta del login
  y se persiste en `sessionStorage` junto con el resto de la sesión.
- Cada formulario de escritura (Recibos: pago, canje, ingreso externo;
  Egresos: registro y carga masiva) lee `authService.usuarioId()`
  directo al hacer submit, y muestra una línea informativa ("Se
  registrará con tu usuario: Nombre Apellido") — ya no hace falta pedir
  el dato a mano en ningún caso.
- El componente `UsuarioIdFieldComponent` (que antes vivía en
  `shared/components/`) **se eliminó**: con el `id` siempre resuelto, ya
  no tenía sentido el input numérico de respaldo ni el estado de
  "no se pudo resolver automáticamente".
- **Compatibilidad hacia atrás**: si un usuario tenía una sesión guardada
  en `sessionStorage` de *antes* de este cambio (sin `id`),
  `AuthService` lo detecta al arrancar y llama una sola vez a
  `GET /api/auth/me` (con el token que ya tiene) para completar el `id`
  faltante, sin pedirle que vuelva a loguearse. En el uso normal (sesión
  creada después de este cambio) no se hace ninguna llamada extra: el
  `id` ya está en `sessionStorage` desde el login.

## Egresos (RF-27 a RF-30)

Tampoco está restringido por rol. La particularidad de este módulo es
que, a diferencia de todo el resto de la API, **`usuarioId` no va en el
body**: va como **query param** tanto en el registro individual como en
la carga masiva (`POST /api/egresos?usuarioId=1`,
`POST /api/egresos/masivo?usuarioId=1`) — por eso `EgresoService.registrar()`
y `cargarMasivo()` reciben `usuarioId` como segundo parámetro separado,
en vez de como parte del DTO.

- **`EgresoService`** (`core/services/egreso.service.ts`): `registrar()`,
  `cargarMasivo()` (arma un `FormData` con el archivo bajo la clave
  `archivo`, y el `usuarioId` va en los `HttpParams` de la petición, no
  dentro del `FormData`), `listarPorMes()` (convierte el `yyyy-MM` del
  `<input type="month">` a `yyyy-MM-01` antes de pedirlo), `obtener()`,
  `anular()` y `procesar()` (`PATCH`).
- **`EgresosComponent`** (`features/egresos/`): pestañas (mismo patrón
  que Cuentas por cobrar y Recibos):
  - **`ListadoEgresosComponent`** (RF-30): selector de mes
    (`<input type="month">`, precargado con el mes actual y buscado
    automáticamente al abrir la pestaña), tabla con badge de estado
    (`Registrado`/`Procesado`/`Anulado`), botón "Ver" (detalle inline,
    incluye el link a `comprobanteUrl` si el backend lo llena) y, solo
    para egresos en estado `REGISTRADO`, los botones "Procesar" y
    "Anular" (este último con confirmación, ya que la acción no se puede
    deshacer).
  - **`RegistroEgresoComponent`** (RF-27): formulario con número de
    documento, proveedor, fecha, importe, documento asociado y motivo.
  - **`CargaMasivaComponent`** (RF-28): `<input type="file">` (acepta
    `.xlsx`/`.csv`) + botón "Subir archivo"; el resultado
    (`EgresoCargaMasivaResultado`) se muestra como éxito si no hay
    errores o como advertencia con el detalle de errores por fila si los
    hay.
  - Ambos formularios de escritura toman `usuarioId` directo de
    `authService.usuarioId()` (ver sección anterior).

## Reportes (RF-32, RF-33)

Tampoco está restringido por rol. Todos los endpoints de este módulo son
distintos al resto de la API: **devuelven un `.xlsx` binario, no JSON**.

- **`ReporteService`** (`core/services/reporte.service.ts`): un método
  por cada uno de los 7 endpoints (`movimientosDiarios(fecha)`,
  `bancos(fecha)`, `totales(mes)`, `mensual(mes)`, `socios(mes)`,
  `noSocios(mes)`, `egresos(mes)`), todos delegando en un `descargar()`
  privado común. Cada petición pide `responseType: 'blob'` **y**
  `observe: 'response'` — esto último es necesario para poder leer los
  headers de la respuesta (`Content-Disposition`), no solo el `Blob`.
- **`core/utils/descargar-archivo.util.ts`**: dos funciones puras,
  reutilizables para cualquier descarga futura:
  - `extraerNombreArchivo(headers, nombrePorDefecto)`: parsea
    `Content-Disposition` (soporta tanto `filename="..."` como
    `filename*=UTF-8''...`) y devuelve el nombre real del archivo: si no
    encuentra el header, devuelve el nombre por defecto que le pase el
    llamador.
  - `descargarBlob(blob, nombreArchivo)`: dispara la descarga en el
    navegador con un `<a download>` temporal (`URL.createObjectURL` +
    click + `revokeObjectURL`), sin ninguna librería externa.
- **`ReportesComponent`** (`features/reportes/`): en vez de pestañas,
  dos secciones con un selector de filtro compartido cada una — un
  `<input type="date">` arriba de los 2 reportes **diarios**
  (Movimientos diarios, Bancos) y un `<input type="month">` arriba de
  los 5 reportes **mensuales** (Totales, Mensual, Socios, No socios,
  Egresos) — cada reporte es una tarjeta con su botón "Descargar .xlsx"
  independiente (con su propio estado de carga). Los 7 reportes están
  definidos de forma declarativa en dos arrays (`reportesDiarios`,
  `reportesMensuales`) para no repetir la lógica de descarga por cada uno.
- **Manejo de error especial**: como la petición pide `responseType: 'blob'`,
  si el backend devuelve un error (4xx/5xx) el `error.error` que llega al
  interceptor/componente **también es un `Blob`** (no un `ErrorResponse`
  ya parseado como en el resto de la API) — `ReportesComponent` lo
  detecta (`error.error instanceof Blob`) y lo lee con `.text()` antes de
  intentar parsear el JSON, con un mensaje genérico de respaldo si
  tampoco eso funciona.

### ⚠️ A confirmar con el equipo de backend: `Content-Disposition` y CORS

El resumen de API solo confirma que el backend expone
`allowedHeaders: "Authorization", "Content-Type"` en su configuración
CORS — **no** confirma `exposedHeaders`. Para que el navegador deje leer
`Content-Disposition` desde JavaScript en una respuesta cross-origin
(Angular en `:4200`, API en `:8080`), el backend necesita agregarlo
explícitamente a `Access-Control-Expose-Headers` (en Spring:
`.exposedHeaders("Content-Disposition")` en el mismo
`CorsConfigurationSource` que ya tienen armado). Si no lo hacen,
`headers.get('Content-Disposition')` va a dar `null` en el navegador
aunque el header sí venga en la respuesta cruda — por eso
`extraerNombreArchivo()` siempre recibe un nombre por defecto como
respaldo (`movimientos-diarios-2026-08-01.xlsx`, etc.) y la descarga
nunca se rompe por esto, solo el nombre del archivo sería menos prolijo
de lo que el backend querría darle.

## Usuarios (exclusivo de ADMINISTRADOR)

A diferencia de todos los módulos anteriores, acá **todos** los métodos
(incluido `GET`) son exclusivos de `ADMINISTRADOR` — no solo la
escritura. Por eso este es el único módulo protegido con un guard de
ruta además del ocultamiento de botones:

- **`roleGuardFactory(rol)`** (`core/guards/role.guard.ts`): guard
  funcional genérico (a diferencia de `authGuard`, que solo exige "estar
  logueado") — recibe el rol requerido y devuelve un `CanActivateFn`. Si
  no hay sesión, redirige a `/login` (igual que `authGuard`); si hay
  sesión pero el rol no coincide, redirige a `/` con
  `?sinPermiso=true`. `HomeComponent` lee ese query param y muestra un
  aviso ("No tenés permiso para acceder a esa sección"). Se usa como
  `roleGuardFactory('ADMINISTRADOR')` en las tres rutas de
  `usuarios.routes.ts` — así un `OPERADOR_CAJA` que navegue directo a
  `/usuarios` por URL nunca llega a pedirle datos al backend (que de
  todos modos le respondería 403).
- **`UsuarioService`** (`core/services/usuario.service.ts`): CRUD
  completo (`listar`, `obtener`, `crear`, `actualizar`, `eliminar`)
  contra `/api/usuarios`. (Antes solo tenía `listar()`, usado por
  `AuthService` para el rodeo del `usuarioId` — ya no aplica, ver la
  sección de Recibos/Egresos más abajo.)
- **`UsuarioListComponent`**: mismo patrón de tabla + filtro que los
  catálogos, con una protección extra: el botón "Eliminar" se deshabilita
  en la propia fila del usuario logueado (comparando contra
  `authService.usuarioId()`), para que un administrador no se elimine a
  sí mismo por error — el botón queda gris con un `title` explicando por qué.
- **`UsuarioFormComponent`** — el punto pedido, manejo especial de
  `password`:
  - **Al crear**: obligatorio, mínimo 6 caracteres (`Validators.required`
    + `Validators.minLength(6)`).
  - **Al editar**: el campo arranca **vacío** (nunca se precarga con lo
    que devuelve el backend — que además ya lo limpia antes de responder,
    ver observación 3 del resumen de API) y es **opcional**: solo lleva
    `Validators.minLength(6)`, sin `required`. La etiqueta muestra
    "(dejar vacío para no cambiarla)".
  - Los validadores se arman una sola vez en la declaración del
    `FormGroup`, ramificando según `esEdicion` (que no cambia durante la
    vida del componente, a diferencia del caso de `esConsumo` en
    Servicios, que si necesitaba reaccionar a cambios en vivo).
  - Al armar el payload: si el campo `password` quedó vacío (después de
    `trim()`), no se incluye la clave `password` en el objeto enviado —
    así nunca se corre el riesgo de pisar la contraseña actual con un
    valor vacío por accidente.
- El sidebar solo muestra el link "Usuarios" cuando
  `esAdministrador()` es `true` (mismo patrón que el resto, pero acá
  además está reforzado por el guard de ruta).

## Módulo de autenticación

- **Modelos** (`core/models/auth.model.ts`): `LoginRequest`, `LoginResponse`
  (incluye `id`; `token` es `string | null` porque `/me` siempre lo
  devuelve en `null`), `SesionUsuario` (`id` obligatorio).
- **AuthService** (`core/services/auth.service.ts`): hace `POST /api/auth/login`,
  guarda la sesión completa (incluido `id`) en `sessionStorage` (sobrevive
  a un refresh, se borra al cerrar la pestaña) y expone el estado de
  autenticación como señal, junto con `usuarioId()` (ver más abajo).
- **Interceptor** (`core/interceptors/auth.interceptor.ts`): agrega el header
  `Authorization` con el token **tal cual** llega del login (ya incluye el
  prefijo `"Bearer "` — no se debe volver a anteponer). Ante un `401`
  (token ausente, inválido o expirado) limpia la sesión y redirige a `/login`.
- **Guard** (`core/guards/auth.guard.ts`): protege las rutas que requieren
  sesión iniciada (RF-02).
- **Componente de login** (`features/auth/login/`): card centrada con
  Bootstrap, formulario reactivo con validación visual (`is-invalid` /
  `invalid-feedback`), spinner de carga y mensaje de error.

### Puntos a tener en cuenta (según el resumen de API)

- El **token dura 1 hora** y no hay refresh token: cualquier operación
  larga puede terminar en 401; el interceptor ya redirige a login en ese caso.
- No existe endpoint de **logout** en el backend: cerrar sesión es solo
  limpiar el storage local (ya implementado en `AuthService.logout()`).
- **`GET /api/auth/me`** reconstruye la sesión (`id`/`username`/`nombres`/
  `apellidos`/`rol`) a partir de los claims del token ya enviado —
  requiere el header `Authorization`, no recibe body, y devuelve
  `token: null` siempre (no reemite uno nuevo). El frontend casi nunca
  necesita llamarlo directamente: la sesión completa ya se guarda en
  `sessionStorage` desde el login. Se usa solo como respaldo en
  `AuthService` para rehidratar el `id` de una sesión guardada por una
  versión anterior de la app (ver la sección "`usuarioId` — limitación
  resuelta" más arriba).
- La API **sí aplica autorización por rol** a nivel de endpoint:
  `/api/usuarios/**` → solo `ADMINISTRADOR`; en los catálogos (Socios,
  Puestos, Giros, Bancos, Servicios) el `GET` es para ambos roles pero
  `POST`/`PUT`/`DELETE` son solo `ADMINISTRADOR`. Un `OPERADOR_CAJA` que
  intente una de esas acciones recibe `403 Forbidden`.
  - `AuthService` expone `rol()`, `esAdministrador()` y `usuarioId()`
    como señales, accesibles desde cualquier componente inyectando
    `AuthService`.
  - El interceptor (`auth.interceptor.ts`) normaliza el mensaje del 403:
    usa `message` del `ErrorResponse` del backend si viene, o el mensaje
    de respaldo fijo `"No tiene permisos para realizar esta acción."` si
    no. No cierra sesión ni redirige en un 403 (a diferencia del 401):
    el usuario sigue autenticado, solo no tiene el permiso.
  - Los listados de Socios, Giros, Bancos, Puestos y Servicios ocultan
    el botón "Nuevo" y la columna "Opciones" (editar/eliminar) cuando
    `esAdministrador()` es `false`. Esto es solo UX: si un
    `OPERADOR_CAJA` navega manualmente a `/socios/nuevo` (por URL
    directa) igual verá el formulario y recibirá el 403 del backend al
    guardar, con el mensaje ya normalizado por el interceptor. Si se
    quiere bloquear también la navegación directa, se puede agregar un
    guard por rol (`roleGuard`) análogo a `authGuard`.

## Próximos pasos sugeridos

1. **Todos los módulos de requisitos funcionales están implementados**:
   catálogos (Socios, Giros, Bancos, Puestos, Servicios), Cuentas por
   cobrar (generación + consulta/gestión), Recibos (pagos, canje,
   ingresos externos, listado), Egresos (registro, carga masiva, listado
   por mes, anular/procesar), Reportes (las 7 descargas de `.xlsx`) y
   Usuarios (CRUD con password condicional), todos conectados en
   `app.routes.ts` y en el sidebar.
2. Confirmar con el equipo de backend el punto de CORS/`exposedHeaders`
   para `Content-Disposition` en Reportes (ver esa sección más arriba).
3. Con la app funcionalmente completa, los siguientes pasos naturales
   son de calidad más que de features: agregar tests (unitarios de
   servicios/guards, e2e de los flujos críticos como login → generar
   cuenta → procesar pago), y revisar accesibilidad (RNF-15) en los
   formularios más grandes (Servicios, Puestos, Cuentas por cobrar).
