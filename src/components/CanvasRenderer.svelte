<script lang="ts">
  import { onMount } from 'svelte';

  import type Zone from "$lib/Zone";
  import type Sink from "$lib/Sink";
  import type Rect from '$lib/Rect';
  import type Ball from '$lib/Ball';

  import Vec2   from '$lib/Vec2';
  import Color  from '$lib/Color';
  import Pixels from '$lib/Pixels';

  import { Collider, Circle, Arc, Segment, Capsule, Fence } from "$lib/Collider";
  import { arcAt, capsuleAt, lineAt, circleAt } from "$lib/draw2d";

  const { floor, PI } = Math;


  // Config

  const SHOW_TRACES   = false;
  const SHOW_VELOCITY = false;
  const SHOW_OVERLAY  = false;
  const INTERSECTION_RES = 32;


  // Canvas

  export let width  = 1000;
  export let height = 1000;

  let canvas:HTMLCanvasElement;
  let ctx:CanvasRenderingContext2D;

  let intersectionOverlay:Pixels;


  // Objects

  export let world:Rect;
  export let balls:Ball[] = [];
  export let colliders:Collider[] = [];
  export let sinks:Sink[];


  // Other Props

  export let TIME_SCALE = 1;


  // Main render

  const render = () => {
    if (!canvas || !ctx) return;

    // Clear
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);

    // Transform to world space
    ctx.save();
    ctx.translate(width/2, height/2);
    ctx.scale(width/world.w, -height/world.h);

    // Static Colliders
    for (let c of colliders) {
      if      (c instanceof Arc)     arcAt(ctx, c.pos, c.rad, 'magenta', c.start, c.end);
      else if (c instanceof Circle)  circleAt(ctx, c.pos, c.rad, c.color.toString(), c.inverted);
      else if (c instanceof Segment) capsuleAt(ctx, c.pos, c.tip, 1, c.color.toString(), c.normal);
      else if (c instanceof Capsule) capsuleAt(ctx, c.pos, c.tip, c.rad, c.color.toString());
      else if (c instanceof Fence) {
        for (let l of c.links) {
          capsuleAt(ctx, l.pos, l.tip, 1, c.color.toString(), l.normal);
        }
      }
    }

    // Sink
    for (let sink of sinks) {
      circleAt(ctx, sink.shape.pos, sink.shape.rad, 'black');
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

    // Debug dots

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

          if (hits) {
            intersectionOverlay.setp(px, py, new Color(1, 1, 1, 0.3 * hits));
          }
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
  }
</style>
