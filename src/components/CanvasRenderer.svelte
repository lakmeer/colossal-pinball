<script lang="ts">
  import { onMount } from 'svelte';

  import type Ball  from '$lib/Ball';
  import type Table from "$lib/tables";
  import type Shape from "$lib/Shape";

  import Vec2   from '$lib/Vec2';
  import Color  from '$lib/Color';

  //import FluidBG from '$comp/FluidBG.svelte';
  import LayerRenderer from '$comp/LayerRenderer.svelte';

  import { Circle, Arc, Capsule, Fence, Box } from "$lib/Shape";
  import { arcAt, capsuleAt, lineAt, circleAt, boxAt, textAt, arrowAt } from "$lib/draw2d";
  import { ceil, lerp, loadImage } from "$lib/utils";


  // Config

  const SHOW_VELOCITY  = false;
  const SHOW_GRIDLINES = false;

  const GRID_RES   = 10; // World space between gridlines
  const GRID_MAJOR = 10; // Landmark line every n gridlines


  // Objects

  export let table:Table;
  export let balls:Ball[] = [];
  export let spawnArrow:[ Vec2, Vec2];
  export let currentScore = table.gameState.score;


  // Canvas

  export let width  = 1000;
  export let height = 1000;

  let canvas:HTMLCanvasElement;
  let ctx:CanvasRenderingContext2D;


  // Other Props

  export let TIME_SCALE = 1;
  export let cameraY = 0;

  let world = table.config.bounds;


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

    // Update shader

    if (balls.length) {
      let pos = balls[0].pos;
      ballPos = Vec2.fromXY(
        (pos.x - world.left) / world.w,
        (world.top  - pos.y) / world.h
      );
    }

    // Clear
    ctx.clearRect(0, 0, width, height);

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
      ctx.globalAlpha = 0.0;
      //drawShape(t.shape, t.color);
      ctx.globalAlpha = 1.0;
    }

    // Balls
    for (let ball of balls) {
      //circleAt(ctx, ball.pos, ball.rad, ball.color.toString());
      textAt(ctx, `${ball.id}`, ball.pos.x, ball.pos.y, '#000', 'center', '10px dseg7');

      if (SHOW_VELOCITY) {
        lineAt(ctx, ball.pos, ball.pos.add(ball.vel.scale(10/TIME_SCALE)), 'rgba(255, 63, 31, 0.7)', 2);
      }
    }

    ctx.globalAlpha = 1;

    // Score
    currentScore = lerp(currentScore, table.gameState.score, 0.1);
    textAt(ctx, `888888`, 140, 40, Color.fromTw('rose-950').toString(), 'right', '50px dseg7');
    textAt(ctx, `${ceil(currentScore)}`, 140, 40, Color.fromTw('red-500').toString(), 'right', '50px dseg7');

    // Ball count
    textAt(ctx, `8`, -190, 40, Color.fromTw('emerald-950').toString(), 'left', '50px dseg7');
    textAt(ctx, `${table.gameState.ballStock}`, -190, 40, Color.fromTw('green-500').toString(),   'left', '50px dseg7');

    // Spawning Arrow
    if (spawnArrow[0].dist(spawnArrow[1]) > 0.0) {
      let [a, b] = spawnArrow;
      arrowAt(ctx, a, b, 3, 8, 'rgba(0, 255, 0, 1)');
    }

    ctx.restore();

    // Top layer
    if (topImg) {
      //ctx.globalAlpha = 0.5;
      //ctx.globalCompositeOperation = 'color-burn';
      //ctx.drawImage(topImg, 0, 0, width, height);
      //ctx.globalAlpha = 1.0;
      //ctx.globalCompositeOperation = 'source-over';
    }

  }


  // Lifecycle

  $: balls && render();

  function toCanvasCoords(ball: Ball): [ number, number, number ] {
    let x = (ball.pos.x - world.left)   / world.w * width;
    let y = (ball.pos.y - world.bottom) / world.h * height;
    return [ ball.id, x, height - y ];
  }

  // temp
  let topImg:HTMLImageElement;

  //@ts-ignore shut up
  onMount(async () => {
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D; // who cares
    //topImg = await loadImage('/alignment.png');

  });

  let ballPos = Vec2.zero;
</script>


<div class="CanvasRenderer">
  <canvas bind:this={canvas} {width} {height} />
  <!--
  <FluidBG src="/now_old.png" ballCoords={balls.map(toCanvasCoords)} {width} {height} />
  <FluidBG src="/playfield.png" ballCoords={balls.map(toCanvasCoords)} {width} {height} />
  -->
  <LayerRenderer lamps={table.gameState.lamps} {ballPos} {width} {height} />
</div>


<style>
  canvas {
    image-rendering: pixelated;
    max-width:  100vw;
    max-height: 100vh;
    background: #0004;
    z-index: 2;
    position: relative;
    pointer-events: none;
  }

  .CanvasRenderer :global(.FluidBG) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
</style>
