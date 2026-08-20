# Plataforma de Evaluación de la Inversión

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

## Botones de IA

Dos funciones llaman a la API de Claude: la búsqueda de parámetros de Damodaran en Costo de capital
y el diagnóstico ejecutivo en Diagnóstico y datos. Para habilitarlas:

```bash
cp .env.example .env
```

y escribe tu llave en `ANTHROPIC_API_KEY`. En desarrollo la petición pasa por el proxy declarado en
`vite.config.ts`, así que la llave se queda en el servidor y nunca llega al navegador.

Para publicar la app, levanta tu propio backend que reciba la petición y agregue la llave, y apunta
`VITE_API_URL` a ese endpoint. **Nunca compiles la llave dentro del bundle.**

Sin llave, el resto de la plataforma funciona completo; solo esos dos botones devuelven error.

## Estructura

```
src/
  App.tsx                  Shell: encabezado, menú lateral, ruteo de pestañas
  lib/
    theme.ts               Paleta Profit120 y logotipo
    format.ts              Formato de números, TIR y valor presente
    model.ts               Estado inicial (ejemplo MI ZAPATO) y motor de cálculo
    excel.ts               Exportación del libro de diez pestañas
    claude.ts              Puente con la API de Claude
  components/ui.tsx        Card, Btn, tablas, inputs, KPI
  tabs/                    Una pestaña por archivo
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
