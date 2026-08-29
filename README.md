# Nexar Ruta

Juego de lógica de **Nexar Play** en el que el jugador debe conectar los números en orden y completar todas las casillas de la grilla sin repetir ninguna.

## Versión actual

**v0.4.0 — dificultades y banco ampliado**

## Cómo jugar

1. Comenzá por la casilla marcada con el número `1`.
2. Usá `Iniciar partida` para activar la partida y el cronómetro.
3. Avanzá únicamente a casillas vecinas en horizontal o vertical.
4. Podés jugar con clic o manteniendo presionado y arrastrando.
5. Pasá por los números en orden.
6. No repitas casillas.
7. Completá toda la grilla para ganar.

## Funcionalidades de v0.4.0

- Tablero 5x5.
- Banco fijo de 30 puzzles 5x5, cada uno con identidad estable, solución garantizada y checkpoints en orden.
- Diez puzzles por dificultad: `easy`, `medium` y `hard`.
- Selector con los modos Aleatorio, Fácil, Media y Difícil; el puzzle presentado muestra también su dificultad real.
- Selección sin repetición dentro de cada modo: 30 puzzles en Aleatorio y 10 en cada dificultad.
- Ciclos y sesiones independientes por modo, persistidos localmente. Al volver a un modo se restauran su puzzle, recorrido, tiempo y estado.
- La recarga restaura el puzzle presentado sin consumir uno nuevo; solo `Nueva partida` avanza el ciclo activo.
- Al agotarse un ciclo comienza otro sin repetir de inmediato el último puzzle anterior.
- Inicio explícito de la partida.
- Estados visibles de lista, activa, pausada y terminada.
- Cronómetro con pausa y reanudación.
- Validación de movimientos.
- Interacción por clic y arrastre con validación centralizada.
- Checkpoints numéricos obligatorios.
- Contador de movimientos.
- Sistema de pistas deterministas basado en la solución codificada.
- Puntaje proyectado durante la partida y puntaje final congelado al completar.
- Récord local persistido por puzzle con `localStorage`.
- Pausa automática al perder foco o visibilidad.
- Deshacer movimiento.
- Reiniciar partida.
- Selección de un nuevo tablero.
- Diseño responsive.
- Sin backend ni dependencias externas.

## Puntaje y récord

- Fórmula de puntaje final: `max(0, 10000 - segundos*10 - movimientos*5 - pistas*500)`.
- El puntaje mostrado durante la partida usa la misma fórmula como valor proyectado y se congela al completar.
- Cada puzzle conserva un único récord local mediante su identidad estable, sin duplicarlo por dificultad o modo. El criterio prioriza mayor puntaje; en caso de empate, menor tiempo y luego menor cantidad de movimientos.

## Criterio de dificultad

La clasificación es explícita y evita un sistema de scoring innecesario:

- `easy`: 6 checkpoints y recorridos de hasta 13 giros, con menor ambigüedad visual.
- `medium`: 6 checkpoints y recorridos más sinuosos, de 15 a 19 giros.
- `hard`: 5 checkpoints, tramos más largos y menos referencias visibles.

Los tres niveles conservan exactamente la misma mecánica: movimientos ortogonales, checkpoints consecutivos y uso obligatorio de las 25 casillas.

## Tecnologías

- HTML5
- CSS3
- JavaScript Vanilla

## Próximos pasos

Las mejoras posteriores a v0.4.0 se desarrollarán de forma incremental. La generación procedural, tableros 6x6, obstáculos, backend, usuarios, rankings y puzzle diario siguen fuera de alcance.

## Ejecución local

No requiere instalación. Abrí `index.html` en un navegador moderno.

## Estado

Proyecto en desarrollo.
