# Línea Directa al Polo Norte

La línea mágica de Sophie y Alana para hablar con sus elfos, recibir mensajes de Santa y contar los días hasta Navidad. Pixel art retro, música chiptune y voces, todo en una sola página.

## Qué hay adentro

- **El teléfono rojo.** Se toca, marca el 12-25, suena, hay estática y contesta el Polo Norte.
- **¿Quién llama?** Sophie, Alana o las dos.
- **El bautizo.** La primera vez, los 3 elfos de la casa piden que las niñas les pongan nombre.
- **El taller de Santa.** Los elfos se mueven, parpadean, saltan, bailan y hablan cuando los tocan. Se pueden tocar el árbol, la ventana, la chimenea y la Lista de los Buenos.
- **Hablar con los elfos.** Chat con micrófono, botones rápidos y voz. Si piden un regalo, el elfo lo anota para Santa sin prometerlo, y el deseo aparece en el panel de papás.
- **Calendario mágico.** Un regalo por día desde el lanzamiento hasta el 25 de diciembre: datos del Polo Norte, misiones de bondad, chistes y retos. Hay días especiales para el 15 de diciembre de Sophie, el 21 de diciembre de Alana, Nochebuena y Navidad.
- **Mensaje de Santa.** Santa aparece en su oficina, se ríe, saluda y lee una carta nueva cada vez.
- **Mis estrellas.** Frascos de estrellas y medidor de bondad de cada una.
- **Panel de papás** (candado abajo a la derecha, con PIN).

## Panel de papás

La primera vez pide crear un PIN de 4 números.

- **Hoy:** escriban qué pasó en el día y den estrellas con premio opcional. Escriban en tercera persona, por ejemplo "ayudó a Alana a recoger los juguetes". Los elfos lo mencionan como si lo hubieran visto con su magia, y al entrar a la línea aparece un "Reporte especial" con cada estrella nueva.
- **Calendario:** dejen una pista de algo escondido en casa, como "busca debajo del cojín azul", o un mensaje especial para cualquier día.
- **Deseos:** lo que las niñas le pidieron a Santa en el chat.
- **Ajustes:** API key de Kimi, nombres de los elfos, voz, fecha del primer día, respaldo, cambio de PIN y borrar todo.

### Kimi

En Ajustes peguen la API key de Kimi y toquen **Probar y guardar**. La página detecta sola el servidor, .ai o .cn, y el mejor modelo disponible. La key se guarda solo en ese dispositivo, nunca va al repositorio y solo viaja a Kimi.

Sin key, los elfos y Santa usan respuestas ya escritas. Todo funciona igual, solo que menos personalizado.

### Varios dispositivos

Cada dispositivo guarda sus propios datos. Para tener lo mismo en el iPad y en el teléfono, usen **Descargar respaldo** en uno y **Cargar respaldo** en el otro. La key de Kimi no viaja en el respaldo.

## Voces

- Las frases fijas tienen voces grabadas con Fish Audio en la carpeta `audio/`: llamada, saludos, bautizo, calendario, días especiales y "jo, jo, jo". Cada archivo se llama por un hash de voz y texto, y `audio/manifest.json` los lista.
- Lo que cambia en cada conversación, como el chat con Kimi o las cartas de Santa, usa la voz del navegador con tono de elfo o de Santa.
- Si cambian un texto fijo, ese texto pasa a la voz del navegador hasta que se vuelva a grabar.

## Publicar en GitHub Pages

1. En GitHub: **Settings → Pages**.
2. En **Source** elijan "Deploy from a branch".
3. Elijan la rama, `main` cuando se haga el merge o esta rama mientras tanto, y la carpeta `/ (root)`. Guarden.
4. En un par de minutos queda en `https://<usuario>.github.io/Santa-s-exclusive-line/`.

En el iPad, ábranla en Safari y toquen **Compartir → Agregar a pantalla de inicio**. Queda como una app con el ícono del elfo, a pantalla completa.

## Para probar en la compu

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

`?go=hub`, `?go=cal`, `?go=santa`, etc. saltan directo a una pantalla para probar.

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html`, `css/style.css` | Estructura y estilo pixel art |
| `js/app.js` | Pantallas y flujo completo |
| `js/sprites.js`, `js/pix.js` | Elfos, Santa, renos, regalos e íconos dibujados con código |
| `js/actors.js` | Animaciones de elfos y Santa |
| `js/sky.js` | Cielo con auroras, nieve, aldea, trineo, fuegos artificiales |
| `js/workshop.js` | El taller de Santa |
| `js/audio.js` | Villancicos chiptune, efectos y voces |
| `js/brain.js` | Conversación con Kimi y reglas de seguridad para niñas |
| `js/content.js` | Sorpresas del calendario y respuestas sin internet |
| `js/i18n.js` | Textos en español e inglés |
| `js/store.js` | Datos guardados en el dispositivo |
