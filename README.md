# Plataforma de Evaluación de Inversión

Herramienta de evaluación financiera de proyectos para el aula: cada alumno captura su empresa
—manufactura, retail o servicios— y la plataforma construye el costeo, el presupuesto, el estado
de resultados, el flujo de efectivo libre y la valuación.

Profit120 · www.profit120.com

---

## Arrancar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve la compilación de producción |

## Entrada y cuentas

La plataforma abre en una página de entrada: correo y contraseña. La autenticación corre en
[Supabase](https://supabase.com) —las contraseñas se cifran y se validan del lado del servidor, nunca
tocan el bundle— y cada cuenta tiene un rol: `admin` o `alumno`. Hay un solo administrador, quien da
el curso.

### Qué ve cada quien

El **alumno** entra directo a la plataforma. Su trabajo se guarda solo contra su cuenta, así que lo
recupera desde cualquier computadora.

El **administrador** ve además una macro pestaña **Administración** con dos tableros: el padrón
—quién tiene cuenta, cuándo entró y cuándo guardó por última vez— y el avance de cada proyecto, con
el nombre, la inversión, el VPN y la TIR con los que va cada alumno en este momento.

Esconder esa pestaña es cortesía, no seguridad: el candado está en las políticas de RLS. Si un alumno
llamara a esas consultas a mano, la base le devolvería únicamente su propia fila.

### Montarlo la primera vez

1. Crea un proyecto gratuito en Supabase.
2. Abre **SQL Editor → New query**, pega `supabase/esquema.sql` completo y córrelo. Crea la tabla de
   perfiles, la de avances, el alta automática de cada usuario nuevo y todas las políticas de acceso.
   El guion es idempotente: se puede volver a correr sin romper nada.
3. Ve a **Project Settings → API** y copia *Project URL* y la llave *anon public*. Escríbelas en las
   constantes `URL_FIJA` y `ANON_FIJA` al principio de `src/lib/auth.ts` (y su espejo en
   `jsx-version/src/lib/auth.js`), o defínelas al compilar como `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY`, que tienen prioridad.
4. Crea tu cuenta en **Authentication → Users → Add user**, con *Auto Confirm User* activado.
5. Vuelve al SQL Editor y nómbrate administrador:
   `update public.perfiles set rol = 'admin' where correo = 'tu@correo.com';`

La llave *anon* sí puede ir en el código: está diseñada para ser pública y no abre nada por sí sola,
porque cada tabla está protegida con RLS. No la confundas con la *service_role*, que sí es secreta y
no debe salir nunca del panel de Supabase.

### Dar de alta al grupo

Las cuentas se crean desde **Authentication → Users** en el panel de Supabase, una por alumno, con
*Auto Confirm User* activado para que puedan entrar sin confirmar correo. Cada alta genera sola su
fila de perfil como `alumno`. El nombre y el grupo se editan en **Table Editor → perfiles**.

Mientras no captures el proyecto de Supabase, la página de entrada se ve pero avisa que el acceso no
está configurado y no deja pasar a nadie.

### Dónde vive el trabajo

Los tres módulos se guardan en la tabla `avances`, una fila por alumno y módulo, con el modelo
completo en `estado` y las cifras del tablero en `resumen`. El guardado es automático: se dispara al
cambiar el modelo y espera a que el alumno deje de teclear, para no escribir en cada tecla. El
encabezado dice si está guardando, si ya guardó o si algo falló.

Antes de esto sólo el módulo de activos recordaba algo, y sólo en el navegador donde se capturó:
cerrar la pestaña costaba el avance de empresa y servicios.

## IA: cada quien con su propia llave

Las funciones de IA —parámetros de Damodaran en Costo de capital, el diagnóstico ejecutivo, los
supuestos del módulo de activos, la Investigación profunda y CONTRASTE— usan la llave de quien
está trabajando. Se carga en un solo lugar: el botón amarillo **CARGA DE API KEY** del encabezado.

- **Es de la cuenta, no del navegador.** Se guarda bajo el id de la cuenta que entró. Si otra
  persona entra con su cuenta en la misma computadora, no la ve ni la puede usar.
- **Se borra al salir.** En una computadora compartida no queda nada para el siguiente.
- **No se vuelve a mostrar.** Una vez guardada, la pantalla sólo enseña una máscara
  (`sk-ant-…a1b2`) para reconocerla.
- **No pasa por nuestro servidor.** La llamada va directo del equipo del usuario a su proveedor.
- **No hay llave de respaldo compartida.** Ni compilada en el bundle ni inyectada por un proxy: una
  llave común la pagaría una sola persona y la usarían todas. Por eso `vite.config.ts` ya no trae
  proxy y no existe `VITE_ANTHROPIC_API_KEY`.

Sirven llaves de Anthropic, OpenAI, Google o cualquier servicio compatible con OpenAI, pero sólo
la de Anthropic busca en internet en vivo; con las demás la IA contesta de memoria y lo advierte.

Sin llave, el resto de la plataforma funciona completo; sólo los botones de IA piden cargarla.

## Estructura

```
src/
  main.tsx                 Punto de entrada: monta la puerta
  App.tsx                  Shell: encabezado, menú lateral, ruteo de pestañas
  lib/
    auth.ts                Sesión de Supabase y roles
    avances.ts             Guardado del trabajo en la nube y lectura del tablero
    theme.ts               Paleta Profit120 y logotipo
    format.ts              Formato de números, TIR y valor presente
    model.ts               Estado inicial (ejemplo MI ZAPATO) y motor de cálculo
    excel.ts               Exportación del libro de diez pestañas
    ia.ts                  Puente con la IA y llave por cuenta
    investigacion.ts       Frentes de investigación y contraste contra el modelo
  components/
    ui.tsx                 Card, Btn, tablas, inputs, KPI, botón CARGA DE API KEY
    Investigacion.tsx      Pestañas Investigación profunda y CONTRASTE
    Login.tsx              Página de entrada
    Puerta.tsx             Decide entre la entrada y la plataforma
    PanelAdmin.tsx         Pestaña de administración
  tabs/                    Una pestaña por archivo
supabase/esquema.sql       Perfiles, avances, roles y políticas de acceso
jsx-version/               La misma app sin TypeScript (ver jsx-version/LEEME.md)
```

## El motor

`computeModel(estado)` es una función pura: recibe el estado completo y devuelve todos los
resultados. No guarda nada, no toca el DOM y no depende de React. Por eso el análisis de
sensibilidad puede recalcular el modelo entero veinticinco veces sin efectos colaterales, y por eso
se puede probar sin montar la interfaz.

Cadena de cálculo:

```
Insumos + Mano de obra + Costos de producción
        → Costo de producción unitario
        → + Absorción de gasto = Costo estándar
        → Precio y margen
        → Presupuesto mensual y anual
        → EBIT → NOPAT → Flujo de efectivo libre
        → VPN, TIR, payback, valuación
```

Dos reglas que conviene no romper al modificar:

1. **El Año 1 anual es la suma exacta del detalle mensual.** Si alguna vez las dos vistas dejan de
   amarrar, el error está en `computeModel`, no en la pantalla.
2. **La inversión requerida es el punto más bajo de la utilidad acumulada**, no la suma de los
   activos. Es la caja que el proyecto necesita antes de generar la suya.

## Notas de implementación

- Tailwind necesita el `safelist` de `tailwind.config.js`: las clases `text-left` y `text-right` se
  arman en tiempo de ejecución y el scanner no las detecta en el código fuente.
- El logotipo va embebido en base64 dentro de `lib/theme.ts` para que no dependa de rutas.
- La exportación a Excel usa SheetJS y arma el libro en memoria; no requiere servidor.
