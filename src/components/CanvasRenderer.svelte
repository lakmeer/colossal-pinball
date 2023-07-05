<script lang="ts">
  import { onMount } from 'svelte';

  import type Zone from "$lib/Zone";
  import type Sink from "$lib/Sink";
  import type Rect from '$lib/Rect';
  import type Ball from '$lib/Ball';
  import type Flipper from '$lib/Flipper';

  import Vec2   from '$lib/Vec2';
  import Color  from '$lib/Color';
  import Pixels from '$lib/Pixels';

  import type { Collider } from "$lib/Collider";
  import { Circle, Arc, Segment, Capsule, Fence, Box } from "$lib/Collider";
  import { arcAt, capsuleAt, lineAt, circleAt, boxAt, textAt } from "$lib/draw2d";

  const { floor } = Math;

  const loadImage = (src:string):Promise<HTMLImageElement> =>
    new Promise((resolve) => {
      let i = new Image();
      i.src = src;
      i.onload = () => resolve(i);
    });


  // Config

  const SHOW_TRACES    = false;
  const SHOW_VELOCITY  = false;
  const SHOW_OVERLAY   = false;
  const SHOW_GRIDLINES = true;
  const SHOW_TEMPLATE  = true;

  const INTERSECTION_RES = 64; // Resolution of collision overlay

  const GRID_RES   = 10; // World space between gridlines
  const GRID_MAJOR = 10; // Landmark line every n gridlines


  // Objects

  export let world:Rect;
  export let balls:Ball[]       = [];
  export let colliders:any[]    = [];
  export let sinks:Sink[]       = [];
  export let flippers:Flipper[] = [];


  // Canvas

  export let width  = 1000;
  export let height = 1000;

  let canvas:HTMLCanvasElement;
  let ctx:CanvasRenderingContext2D;

  let intersectionOverlay:Pixels;
  let template:HTMLImageElement;


  // Other Props

  export let TIME_SCALE = 1;
  export let cameraY = 0;


  // Shape draw dispatch

  const drawShape = (c:Collider) => {
    if      (c instanceof Arc)     arcAt(ctx, c.pos, c.rad, 'magenta', c.start, c.end);
    else if (c instanceof Circle)  circleAt(ctx, c.pos, c.rad, c.color.toString(), c.inverted);
    else if (c instanceof Segment) capsuleAt(ctx, c.pos, c.tip, 1, c.color.toString(), c.normal);
    else if (c instanceof Capsule) capsuleAt(ctx, c.pos, c.tip, c.rad, c.color.toString());
    else if (c instanceof Box)     boxAt(ctx, c.toRect(), c.color.toString(), c.angle);
    else if (c instanceof Fence) {
      for (let l of c.links) {
        capsuleAt(ctx, l.pos, l.tip, 1, c.color.toString(), l.normal);
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
      if (template) {
        ctx.scale(1, -1);
        ctx.globalAlpha = 0.3;
        ctx.drawImage(template, world.left, -world.top, world.w, world.h);
        ctx.globalAlpha = 1.0;
        ctx.scale(1, -1);
      }
    }

    // Grid
    if (SHOW_GRIDLINES) {

      for (let x = world.left; x <= world.right; x += GRID_RES) {
        if (x % (GRID_MAJOR * GRID_RES) === 0) {
          lineAt(ctx, Vec2.fromXY(x, world.bottom), Vec2.fromXY(x, world.top), '#444', 2);
        } else {
          lineAt(ctx, Vec2.fromXY(x, world.bottom), Vec2.fromXY(x, world.top), '#333', 1);
        }
      }

      for (let y = world.bottom; y <= world.top; y += GRID_RES) {
        if (y % (GRID_MAJOR * GRID_RES) === 0) {
          lineAt(ctx, Vec2.fromXY(world.left, y), Vec2.fromXY(world.right, y), '#444', 2);
          textAt(ctx, `${y}`, world.left, y, '#555', 'left');
        } else {
          lineAt(ctx, Vec2.fromXY(world.left, y), Vec2.fromXY(world.right, y), '#333', 1);
        }
      }

      lineAt(ctx, Vec2.fromXY(world.left, cameraY), Vec2.fromXY(world.right, cameraY), 'red', 0.5);
    }

    // Static Colliders
    if (SHOW_TEMPLATE) ctx.globalAlpha = 0.5;

    for (let c of colliders) {
      drawShape(c);
    }

    // Sink
    for (let sink of sinks) {
      drawShape(sink.shape);
    }

    // Flippers
    for (let flipper of flippers) {
      capsuleAt(ctx, flipper.pos, flipper.tip, flipper.rad, '#d37');
    }

    // Balls
    for (let ball of balls) {

      // Trace paths
      if (SHOW_TRACES) {

        // To Sink
        for (let s of sinks) {
          lineAt(ctx, ball.pos, s.shape.closest(ball.pos), 'rgba(0, 0, 0, 0.5)', 1);
        }

        // Nearest
        for (let c of colliders) {
          lineAt(ctx, ball.pos, c.closest(ball.pos), 'rgba(255, 255, 255, 0.3)', 1);
        }
      }

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

          for (let c of colliders) hits += c.intersect(Vec2.fromXY(x + dx/2, y + dy/2)) ? 1 : 0;

          if (hits) intersectionOverlay.setp(px, py, new Color(1, 1, 1, 0.2 * hits));
        }
      }

      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(intersectionOverlay.canvas, world.left, world.bottom, world.w, world.h);
    }

    ctx.restore();
  }


  $: balls && render();
  $: colliders && render();

  onMount(async () => {
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D; // who cares
    template = await loadImage('/template.jpg');

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
