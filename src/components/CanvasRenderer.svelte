<script lang="ts">
  import { onMount } from 'svelte';

  import type Ball  from '$lib/Ball';
  import type Table from "$lib/tables";
  import type Shape from "$lib/Shape";

  import Vec2   from '$lib/Vec2';
  import Color  from '$lib/Color';
  import Pixels from '$lib/Pixels';

  import type Thing from "$lib/Thing";

  import { Circle, Arc, Capsule, Fence, Box } from "$lib/Shape";
  import { arcAt, capsuleAt, lineAt, circleAt, boxAt, textAt } from "$lib/draw2d";

  import { floor } from "$lib/utils";


  // Config

  const SHOW_VELOCITY  = false;
  const SHOW_OVERLAY   = false;
  const SHOW_GRIDLINES = false;
  const SHOW_TEMPLATE  = false;

  const INTERSECTION_RES = 64; // Resolution of collision overlay

  const GRID_RES   = 10; // World space between gridlines
  const GRID_MAJOR = 10; // Landmark line every n gridlines


  // Objects

  export let table:Table;
  export let balls:Ball[] = [];


  // Canvas

  export let width  = 1000;
  export let height = 1000;

  let canvas:HTMLCanvasElement;
  let ctx:CanvasRenderingContext2D;

  let intersectionOverlay:Pixels;


  // Other Props

  export let TIME_SCALE = 1;
  export let cameraY = 0;

  let world = table.bounds;


  // Shape draw dispatch

  const drawShape = (s:Shape, c:Color) => {
    if      (s instanceof Arc)         arcAt(ctx, s.pos, s.rad, s.radius, c.toString(), s.start, s.end);
    else if (s instanceof Circle)   circleAt(ctx, s.pos, s.rad, c.toString(), s.invert);
    //else if (s instanceof Segment) capsuleAt(ctx, s.pos, s.tip, 1, c.toString(), s.normal);
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
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);

    // Transform to world space
    const aspectCorr = height/width;
    const xScaling   = width/world.w; // Assumes portrait shaped world

    ctx.save();
    ctx.scale(xScaling, -xScaling);
    ctx.translate(world.right, cameraY/world.h * (aspectCorr * world.w - world.h) - aspectCorr * world.w);

    // Table template
    if (SHOW_TEMPLATE) {
      if (table.template && typeof table.template != 'string') {
        ctx.scale(1, -1);
        ctx.globalAlpha = 0.7;
        ctx.drawImage(table.template, world.left, -world.top, world.w, world.h);
        ctx.globalAlpha = 1.0;
        ctx.scale(1, -1);
      }
    }

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

    if (SHOW_TEMPLATE) ctx.globalAlpha = 0.6;

    // Things
    for (let t of Object.values(table.things)) {
      drawShape(t.shape, t.color);
    }

    if (SHOW_TEMPLATE) ctx.globalAlpha = 1.0;

    // Balls
    for (let ball of balls) {

      // Body
      circleAt(ctx, ball.pos, ball.rad, ball.color.toString());

      // Velocity
      if (SHOW_VELOCITY) {
        lineAt(ctx, ball.pos, ball.pos.add(ball.vel.scale(10/TIME_SCALE)), 'rgba(255, 63, 31, 0.7)', 2);
      }
    }

    // Intersection overlay
    if (SHOW_OVERLAY) {
      const RES = INTERSECTION_RES;
      let dx = world.w/RES/2;
      let dy = world.h/RES/2;

      intersectionOverlay.reset();

      for (let x = world.left; x < world.right; x += dx) {
        for (let y = world.bottom; y < world.top; y += dy) {
          let px = floor((x - world.left)/world.w * RES);
          let py = floor((y + world.top)/world.h * RES);
          let hits = 0;

          for (let t of Object.values(table.things)) {
            hits += t.shape.intersect(Vec2.fromXY(x + dx/2, y + dy/2)) ? 1 : 0;
          }

          if (hits) intersectionOverlay.setp(px, py, new Color(1, 1, 1, 0.2 * hits));
        }
      }

      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(intersectionOverlay.canvas, world.left, world.bottom, world.w, world.h);
    }

    ctx.restore();
  }


  // Lifecycle

  $: balls && render();

  onMount(async () => {
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D; // who cares

    if (SHOW_OVERLAY) {
      intersectionOverlay = new Pixels(INTERSECTION_RES, INTERSECTION_RES);
    }
  });
</script>


<canvas bind:this={canvas} {width} {height} />


<style>
  canvas {
    background: #212121;
    image-rendering: pixelated;
    max-width: 100vw;
    max-height: 100vh;
  }
</style>
