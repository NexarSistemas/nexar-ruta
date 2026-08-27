# Nexar Ruta

Juego de lógica de **Nexar Play** en el que el jugador debe conectar los números en orden y completar todas las casillas de la grilla sin repetir ninguna.

## Versión actual

**v0.2.0 — mejoras de jugabilidad**

## Cómo jugar

1. Comenzá por la casilla marcada con el número `1`.
2. Usá `Iniciar partida` para activar la partida y el cronómetro.
3. Avanzá únicamente a casillas vecinas en horizontal o vertical.
4. Podés jugar con clic o manteniendo presionado y arrastrando.
5. Pasá por los números en orden.
6. No repitas casillas.
7. Completá toda la grilla para ganar.

## Funcionalidades de v0.2.0

- Tablero 5x5.
- Tres puzzles con solución garantizada.
- Inicio explícito de la partida.
- Estados visibles de lista, activa, pausada y terminada.
- Cronómetro con pausa y reanudación.
- Validación de movimientos.
- Interacción por clic y arrastre con validación centralizada.
- Checkpoints numéricos obligatorios.
- Contador de movimientos.
- Sistema de pistas deterministas basado en la solución codificada.
- Puntaje proyectado durante la partida y puntaje final congelado al completar.
- Récord local persistido con `localStorage`.
- Pausa automática al perder foco o visibilidad.
- Deshacer movimiento.
- Reiniciar partida.
- Selección de un nuevo tablero.
- Diseño responsive.
- Sin backend ni dependencias externas.

## Puntaje y récord

- Fórmula de puntaje final: `max(0, 10000 - segundos*10 - movimientos*5 - pistas*500)`.
- El puntaje mostrado durante la partida usa la misma fórmula como valor proyectado y se congela al completar.
- El récord local prioriza mayor puntaje; en caso de empate, menor tiempo y luego menor cantidad de movimientos.

## Tecnologías

- HTML5
- CSS3
- JavaScript Vanilla

## Próximos pasos

Las mejoras posteriores a v0.2.0 se desarrollarán de forma incremental. La generación dinámica o procedural de tableros sigue fuera de alcance por ahora.

## Ejecución local

No requiere instalación. Abrí `index.html` en un navegador moderno.

## Estado

Proyecto en desarrollo.
