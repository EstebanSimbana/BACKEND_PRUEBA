# Backend BDProductos

API REST en Node.js, Express 5 y PostgreSQL. Implementa la arquitectura del archivo ARQUITECTURA_BACKEND_BDProductos.md: capas Route -> Controller -> Model -> Repository, modelo y pool Singleton por proceso y Factory al iniciar.

## Requisitos y configuración

- Node.js 22 o superior y PostgreSQL en ejecución.
- Base existente BDProductos con dbo."Producto" y las columnas "ID", nombre, descripcion, "URLimagen", pvp y stock descritas en la arquitectura.
- No se crean tablas, no se cargan datos y no se modifican permisos automáticamente.

El archivo .env local ya está creado sin contraseña. Edita DB_USER y DB_PASSWORD; verifica DB_HOST, DB_PORT y DB_NAME. .env está excluido de Git. Si clonas el proyecto, copia .env.example a .env primero. Todas las opciones se validan al iniciar. DB_SSL=true exige certificados válidos; DB_SSL_CA_FILE permite especificar una CA privada. TRUST_PROXY=false por defecto; usa un número de saltos únicamente si conoces la topología del proxy.

Desde la carpeta backend, instala con npm.cmd install y arranca con:

~~~powershell
node server.js
~~~

Para reiniciar al cambiar archivos:

~~~powershell
node --watch server.js
~~~

También están disponibles npm start, npm run dev y npm test. En este equipo, npm.ps1 está bloqueado y el lanzador npm.cmd apunta a una instalación incompleta del perfil. Para instalar o actualizar dependencias, se verificó esta alternativa sin modificar la configuración de Windows:

~~~powershell
& 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' install
~~~

El servidor comprueba SELECT 1 antes de escuchar en http://127.0.0.1:5050. Si falta la contraseña o la BD no responde, no declara disponibilidad. SIGINT y SIGTERM cierran HTTP y el pool; Ctrl+C detiene el servidor.

## Contrato HTTP

| Método | Ruta | Resultado |
|---|---|---|
| GET | /api/v1/productos | 200: data y meta |
| GET | /api/v1/productos/:id | 200 o 404 |
| POST | /api/v1/productos | 201 y Location |
| PUT | /api/v1/productos/:id | 200: reemplazo completo o 404 |
| PATCH | /api/v1/productos/:id | 200: cambio parcial o 404 |
| DELETE | /api/v1/productos/:id | 204 sin cuerpo o 404 |
| GET | /health | 200: proceso activo |
| GET | /ready | 200: BD accesible, 503 si no disponible |

API_PREFIX y API_VERSION determinan el prefijo de rutas y Location. La única versión implementada es v1; otras versiones responden 404.

POST, PUT y PATCH requieren Content-Type: application/json. Ejemplo de cuerpo completo:

~~~json
{
  "nombre": "Auriculares Bluetooth",
  "descripcion": "Auriculares con estuche de carga",
  "URLimagen": "https://example.com/auriculares.webp",
  "pvp": "34.90",
  "stock": 25
}
~~~

PATCH admite, por ejemplo, {"stock":5}. PUT exige los cinco campos. No se admiten ID ni propiedades adicionales. nombre tiene de 2 a 250 caracteres; descripcion de 1 a 4000; URLimagen debe ser HTTPS y tener hasta 2048 caracteres. Los textos se normalizan a Unicode NFC y se recortan. Se rechazan controles no permitidos. El backend no descarga imágenes.

pvp debe ser una cadena decimal de 0 a 99999999.99, sin notación exponencial ni signo; se normaliza a dos decimales. stock es un entero JSON de 0 a 2147483647. ID se devuelve como cadena y se valida sin convertirlo a Number, hasta el máximo BIGINT positivo de PostgreSQL. PostgreSQL genera el ID automáticamente.

Listado:

~~~text
GET /api/v1/productos?page=2&limit=10&nombre=auriculares&orden=pvp_asc
~~~

page empieza en 1; limit vale 20 por defecto y admite hasta 100. El offset máximo es 1000000. nombre busca una subcadena sin distinguir mayúsculas: %, _ y barra inversa son caracteres literales. orden admite id_asc, id_desc, nombre_asc, nombre_desc, pvp_asc y pvp_desc; por defecto id_asc. Los empates se ordenan por ID. Parámetros desconocidos o repetidos son inválidos. La BD aplica LIMIT/OFFSET y COUNT con el mismo filtro. meta contiene page, limit, total y totalPages; totalPages es 0 si no hay coincidencias. Las consultas de filas y conteo son independientes, por lo que escrituras simultáneas pueden cambiar el catálogo entre ambas consultas.

Formato de error uniforme: {"error":{"codigo":422,"mensaje":"..."}}. Códigos: 400 para JSON o parámetros malformados, 403 para origen CORS no permitido, 404 para recurso/ruta/versión ausente, 409 para conflictos de persistencia, 413 para cuerpo excesivo, 415 para tipo de contenido incompatible, 422 para datos inválidos, 429 para límite de solicitudes, 500 para fallo interno y 503 para dependencia no disponible. Cada respuesta incluye X-Request-Id. No se envían SQL, contraseñas ni stacks al cliente.

## Pruebas

~~~powershell
node --test
~~~

Las pruebas HTTP usan Supertest y un repositorio en memoria. Verifican CRUD, PUT/PATCH, paginación, filtros, BIGINT, precios, JSON, errores, CORS, rate limit y prefijo configurable. Las pruebas de Repository comprueban parametrización, columnas permitidas, orden y escape de filtros; no requieren PostgreSQL.

Para ejecutar la prueba real después de completar .env:

~~~powershell
$env:TEST_DATABASE = 'true'
node --test tests/postgres.integration.test.js
Remove-Item Env:TEST_DATABASE
~~~

Esta prueba usa la tabla existente, crea un producto de prueba y verifica CRUD dentro de una transacción que termina en ROLLBACK. No deja registros; la secuencia de IDs puede avanzar, ya que PostgreSQL no revierte sus valores. Requiere permisos de lectura, escritura y uso de la secuencia. No la actives contra una base donde triggers tengan efectos externos. La prueba se omite por defecto.

Validación realizada al entregar: 12 pruebas aprobadas y 1 integración PostgreSQL omitida por falta de credenciales. La conexión real y los permisos de dbo."Producto" quedan por comprobar al completar .env.

## Estructura

- server.js: entorno validado, composición, conexión inicial, escucha y cierre.
- app.js: construcción de Express sin iniciar sockets ni conexiones.
- config.js: configuración tipada y TLS verificado.
- route/: rutas de Producto y orden de validaciones.
- middleware/: CORS, JSON, sanitización, validación, paginación, versión, rate limit, logs y errores.
- controller/: semántica HTTP y representación JSON.
- modelo/: reglas y esquemas de dominio, repositorio SQL y pool compartido.
- factory/: construcción e inyección de dependencias.
- tests/: pruebas de configuración, modelo, repositorio, HTTP e integración PostgreSQL optativa.

El modelo no depende de Express ni recibe req/res. Las reglas de Producto se comparten desde modelo/producto.schema.js; los errores de dominio se traducen a HTTP en middleware. Todas las variables SQL se parametrizan y las columnas dinámicas de PATCH proceden de un mapa cerrado.

## Operación

Los logs JSON registran método, patrón de ruta, estado, duración e identificador, sin query strings ni cuerpos. LOG_LEVEL admite info, error o silent. Los errores internos solo registran metadatos seguros. requestTimeout y los tiempos de consulta/conexión limitan recursos. /health verifica proceso y /ready consulta PostgreSQL.

Esta entrega tiene el alcance local indicado: autenticación y autorización están fuera del alcance inicial. Antes de habilitar escrituras fuera del entorno local, incorpora los controles de acceso correspondientes, HTTPS y un usuario PostgreSQL con permisos restringidos. CORS no autentica usuarios. Los contadores del rate limit son por proceso; múltiples réplicas necesitan almacenamiento compartido si se requiere un límite global.

Referencias utilizadas: [errores asíncronos de Express 5](https://expressjs.com/en/guide/error-handling/) y [consultas parametrizadas de node-postgres](https://node-postgres.com/features/queries).

## Despliegue en Render

El archivo `render.yaml` de la raíz crea:

- Una base PostgreSQL administrada llamada `bdproductos-db`.
- Un Web Service Node.js llamado `bdproductos-api`.
- La variable `DATABASE_URL` compartida entre ambos servicios.
- La migración automática `npm run db:migrate` antes de iniciar la aplicación.

Antes de desplegar, configura manualmente `CORS_ORIGINS` en Render con los orígenes HTTPS reales del frontend. No uses `*` ni direcciones locales en producción.

Para aplicar el esquema desde una terminal local o desde Render Shell:

~~~powershell
cd backend
$env:DATABASE_URL='postgresql://usuario:contraseña@host:5432/bdproductos'
$env:DB_SSL='true'
npm run db:migrate
~~~

El script `database/init.sql` crea el esquema `dbo`, la tabla `dbo."Producto"` y sus índices. Es idempotente y no elimina datos existentes.

