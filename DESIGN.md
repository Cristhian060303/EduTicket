# Identidad visual de EduTicket

**Concepto: "Biblioteca nocturna".**
La sensación de abrir un libro bajo una lámpara cuando ya oscureció: penumbra azulada alrededor, una luz dorada y cálida en el centro, y el papel como única superficie clara. Es lo contrario al sitio escolar blanco y plano — y encaja con un salón ambientado y decorado por los propios expositores.

La paleta además **nace de los libros**: el turquesa abisal y el magenta salen de la portada de *Veinte mil leguas*; el oro, del Smaug de *El Hobbit*.

---

## Paleta

| Token | Color | Uso |
|-------|-------|-----|
| `midnight` | `#060a16` | Fondo general |
| `night` | `#0b1228` | Superficie de tarjetas |
| `ink` | `#141d3c` | Superficie elevada |
| `edge` | `#263257` | Bordes y separadores |
| `parchment` | `#f7f1e4` | Texto principal (papel cálido, no blanco puro) |
| `mist` | `#a7b0cc` | Texto secundario |
| **`gold`** | `#f0b429` | **Acento principal**: botones, ticket, énfasis |
| `gold-light` | `#ffd670` | Degradados y brillos |
| `abyss` | `#2bb3a3` | *Veinte mil leguas* · datos y estados informativos |
| `magenta` | `#ff4d9d` | *Enciclopedia de dinosaurios* · destellos y alertas suaves |

Cada libro tiene un acento asignado (`accent` en la base de datos y en `lib/site.ts`), así que su ficha, su tarjeta y su ambientación comparten color.

**Contraste:** `parchment` sobre `midnight` supera holgadamente AA; `mist` se reserva para texto secundario de 14 px o más. El oro nunca se usa como texto pequeño sobre fondo oscuro sin al menos 14 px y peso semibold.

Los tokens se definen una sola vez en el bloque `@theme` de [app/globals.css](app/globals.css) y Tailwind genera las utilidades (`bg-gold`, `text-mist`, `border-edge`…). **No hay colores sueltos en los componentes.**

Utilidades propias del proyecto: `card` (tarjeta de vidrio), `gilded` (texto con degradado dorado), `sheen` (barrido de luz) y `grain` (grano de papel).

---

## Tipografía

| Rol | Fuente | Por qué |
|-----|--------|---------|
| Titulares | **Fraunces** (serif) | Tiene el carácter de una portada de libro; le da voz editorial a la página |
| Texto e interfaz | **Plus Jakarta Sans** | Humanista, muy legible en celulares |
| Códigos de ticket | **JetBrains Mono** | Cifras que no se confunden al leerlas en voz alta en la puerta |

Se cargan con `next/font`, que las descarga en el momento de compilar y las sirve desde el mismo dominio: no hay peticiones a Google desde el celular del estudiante y no hay salto de texto al cargar.

---

## Logo

Un **ticket con un libro abierto dentro** — las dos cosas que es el proyecto, en un solo trazo. Vive en [components/Logo.tsx](components/Logo.tsx) como SVG vectorial: pesa ~1 KB, se ve nítido a cualquier tamaño y se pinta con `currentColor`, así que el mismo dibujo sirve en oro sobre fondo oscuro o en oscuro sobre la placa dorada de la barra.

Partió de un boceto del equipo que además tenía birrete y calendario; se quitaron porque el logo se muestra a 36 px y tres símbolos apilados a ese tamaño se vuelven una mancha. También es el favicon ([app/icon.svg](app/icon.svg)).

**No usar imágenes JPG/PNG como logo:** no tienen transparencia y el recuadro de fondo aparece sobre el azul del sitio.

---

## Iconos

**[Lucide](https://lucide.dev)** (`lucide-react`). Todos sus iconos están dibujados sobre la misma rejilla de 24×24 con el mismo grosor de trazo, así que alinean entre sí sin ajustes manuales.

Regla de tamaño: **se miden en `em`, no en píxeles** (`size-[1.25em]`). Así el icono crece con el texto que acompaña y su altura coincide con la de las mayúsculas, en vez de quedar flotando. El texto que va al lado lleva `leading-none` para que ambos centros coincidan.

---

## Movimiento

El movimiento aquí **cuenta algo**; no es decoración por sí sola.

| Animación | Dónde | Qué comunica |
|-----------|-------|--------------|
| `drift` | Manchas de luz del fondo | Ambiente vivo, como luz de pecera. 22 s: lento, nunca distrae de la lectura |
| `reveal` | Cada bloque al hacer scroll | Guía la mirada y da ritmo de lectura |
| `shimmer` | Portadas y botón principal en hover | Reacción al cursor: el elemento "responde" |
| `float` | Icono del trailer | Señala que ahí hay algo que va a pasar |
| `heartbeat` | Puntos de estado | Llama la atención sobre lo que está en vivo (cupos, registro) |
| Inclinación 3D | Tarjetas de libro en hover | Hace que la portada se sienta un objeto, no una imagen |

### Ligadas al scroll

Este segundo grupo no se dispara y corre solo: avanza y retrocede con la posición del scroll, así que responde al dedo en vez de actuar por su cuenta.

| Efecto | Dónde | Qué comunica |
|--------|-------|--------------|
| `progress-bar` | Línea bajo la barra superior | Cuánta página queda |
| `parallax-back` | Manchas de luz del fondo | Suben más lento que el contenido: esa diferencia de velocidad es lo que se lee como profundidad |
| `hero-exit` | Portada al salir de pantalla | La disuelve en vez de simplemente empujarla hacia arriba |
| `cover-drift` | Portadas dentro de su tarjeta | Se deslizan levemente en su marco mientras la tarjeta cruza la pantalla |

### El teatro del trailer

Al presionar play, el video **se abre a pantalla completa**: la página se oscurece y se desenfoca (`curtain-in`) mientras el video escala hasta su sitio (`stage-in`). Al terminar, se cierra solo y devuelve al lector exactamente donde estaba.

La pantalla completa se resuelve en dos capas, a propósito:

1. **La capa que siempre funciona:** la superposición cubre la ventana por sí sola, con CSS.
2. **La capa extra:** además se pide la API nativa de pantalla completa, y si el navegador la rechaza no pasa nada. Safari en iPhone la niega para cualquier elemento que no sea un `<video>`, y ahí la primera capa ya resolvió el efecto.

Se cierra de cuatro maneras: al terminar el video, con la ✕, tocando fuera, o con Esc. Mientras está abierto, la página de atrás queda bloqueada para que no se desplace, y al cerrar el foco del teclado vuelve al botón que lo abrió.

Están hechas con **animaciones CSS ligadas al scroll** (`animation-timeline`), no con JavaScript: no hay que sincronizar nada con un listener, y el navegador las ejecuta fuera del hilo principal, así que no compiten con el resto de la página.

Cada una lleva sus propios candados: `@supports` para el navegador que aún no soporta la propiedad, y `prefers-reduced-motion: no-preference` para quien pidió menos movimiento. Si cualquiera de los dos falla, el efecto sencillamente no existe y la página se ve quieta y completa — las animaciones de aparición ya sostienen la experiencia por sí solas.

### Reglas

1. **Nada dura más de 700 ms.** Las transiciones de interfaz van entre 300 y 500 ms con `cubic-bezier(0.22, 1, 0.36, 1)` (arranca rápido, frena suave).
2. **Solo se anima `transform` y `opacity`**, que el navegador resuelve sin recalcular la página. Por eso no se traba en celulares modestos.
3. **`prefers-reduced-motion` se respeta siempre.** Quien configuró su teléfono para menos movimiento ve la página completa y quieta, no vacía. Está resuelto de una vez en `globals.css`.
   > Nota de convención: los nombres de tokens, clases y animaciones están en inglés, igual que el resto del código. Solo los textos visibles están en español.
4. **Ninguna información depende de una animación.** Si el JavaScript falla, todo el contenido sigue ahí.

---

## Composición

- **Ancho máximo 1152 px** (`max-w-6xl`), con 20 px de margen lateral mínimo en celular.
- **Diseño primero para celular:** casi todos los asistentes abrirán el sitio desde el teléfono, muchas veces caminando por el pasillo.
- **Tarjetas de vidrio** (`card`): fondo semitransparente + desenfoque, para que el fondo animado se insinúe sin restar legibilidad.
- **Capa de grano** sobre el fondo: evita el aspecto de degradado plano y aporta textura de papel.
- **Radios generosos** (12–20 px): amable, no corporativo.

## Accesibilidad

- Foco visible en dorado sobre cualquier elemento navegable con teclado.
- Los elementos decorativos llevan `aria-hidden`; la cuenta regresiva se anuncia como `role="timer"`.
- El color nunca es el único portador de significado: siempre hay texto o icono acompañando.
- Estilos de impresión: el ticket debe poder imprimirse en blanco y negro y seguir siendo legible (plan B si falla el internet del colegio).
