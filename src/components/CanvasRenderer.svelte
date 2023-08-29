<script lang="ts">
  import { onMount } from 'svelte';

  import type Ball  from '$lib/Ball';
  import type Rect  from "$lib/Rect";
  import type Table from "$lib/tables";
  import type Shape from "$lib/Shape";
  import type Color from "$lib/Color";

  import Vec2   from '$lib/Vec2';

  import { Circle, Arc, Capsule, Fence, Box } from "$lib/Shape";
  import { arcAt, capsuleAt, lineAt, circleAt, boxAt, textAt, arrowAt } from "$lib/draw2d";


  // Config

  const SHOW_GRIDLINES = false;

  const GRID_RES   = 10; // World space between gridlines
  const GRID_MAJOR = 10; // Landmark line every n gridlines


  // Objects

  export let table:Table;
  export let balls:Ball[] = [];
  export let spawnArrow:[Vec2, Vec2];
  export let world:Rect;
  export let beatPhase = 0;

  let cameraY = 0;


  // Canvas

  export let width  = 1000;
  export let height = 1000;

  let canvas:HTMLCanvasElement;
  let ctx:CanvasRenderingContext2D;


  // Shape draw dispatch

  const drawShape = (s:Shape, c:Color) => {
    if      (s instanceof Arc)         arcAt(ctx, s.pos, s.rad, s.radius, c.toString(), s.start, s.end);
    else if (s instanceof Circle)   circleAt(ctx, s.pos, s.rad, c.toString(), s.invert);
    else if (s instanceof Capsule) capsuleAt(ctx, s.pos, s.tip, s.rad, c.toString());
    else if (s instanceof Box)         boxAt(ctx, s.toRect(), c.toString(), s.angle);
    else if (s instanceof Fence) {
      for (let l of s.links) {
        capsuleAt(ctx, l.pos, l.tip, l.rad, c.toString());
      }
    }
  }


  // Main render

  const render = () => {
    if (!canvas || !ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#FFF';
    ctx.globalAlpha = beatPhase * 0.2;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // Transform to world space
    const aspectCorr = height/width;
    const xScaling   = width/world.w; // Assumes portrait shaped world

    ctx.save();
    ctx.scale(xScaling, -xScaling);
    ctx.translate(world.right, cameraY/world.h * (aspectCorr * world.w - world.h) - aspectCorr * world.w);

    // Grid
    if (SHOW_GRIDLINES) {

      for (let x = world.left; x <= world.right; x += GRID_RES) {
        if (x % (GRID_MAJOR * GRID_RES) === 0) {
          lineAt(ctx, Vec2.fromXY(x, world.bottom), Vec2.fromXY(x, world.top), '#444', 1);
        } else {
          lineAt(ctx, Vec2.fromXY(x, world.bottom), Vec2.fromXY(x, world.top), '#333', 0.2);
        }
      }

      for (let y = world.bottom; y <= world.top; y += GRID_RES) {
        if (y % (GRID_MAJOR * GRID_RES) === 0) {
          lineAt(ctx, Vec2.fromXY(world.left, y), Vec2.fromXY(world.right, y), '#444', 1);
          textAt(ctx, `${y}`, world.left, y, '#fff', 'left');
        } else {
          lineAt(ctx, Vec2.fromXY(world.left, y), Vec2.fromXY(world.right, y), '#333', 0.2);
        }
      }

      lineAt(ctx, Vec2.fromXY(world.left, cameraY), Vec2.fromXY(world.right, cameraY), 'red', 0.5);
    }

    // Things
    for (let t of Object.values(table.things)) {
      drawShape(t.shape, t.color);
    }

    // Balls
    for (let ball of balls) {
      circleAt(ctx, ball.pos, ball.rad, ball.color.toString());
    }

    ctx.globalAlpha = 1;

    // Spawning Arrow
    if (spawnArrow[0].dist(spawnArrow[1]) > 0.0) {
      let [a, b] = spawnArrow;
      arrowAt(ctx, a, b, 3, 8, 'rgba(0, 255, 0, 1)');
    }

    ctx.restore();
  }


  // Lifecycle

  $: balls && render();

  function toCanvasCoords(ball: Ball): [ number, number, number ] {
    let x = (ball.pos.x - world.left)   / world.w * width;
    let y = (ball.pos.y - world.bottom) / world.h * height;
    return [ ball.id, x, height - y ];
  }

  //@ts-ignore shut up
  onMount(async () => {
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D; // who cares
  });
</script>


<div class="CanvasRenderer">
  <canvas bind:this={canvas} {width} {height} />
</div>


<style>
  .CanvasRenderer {
    position: absolute;
    width:  100%;
    height: 100%;
    background: pink;
  }

  canvas {
    image-rendering: pixelated;
    max-width:  100vw;
    max-height: 100vh;
    position: absolute;
    pointer-events: none;
    z-index: 1;
  }
</style>
