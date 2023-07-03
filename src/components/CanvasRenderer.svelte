<script lang="ts">
  import { Collider, Circle, Arc, Segment, Capsule } from "$lib/Collider";
  import type { Sink } from "$lib/Sink";
  import { shortestAngle } from "$lib/utils";
  import Vec2 from '$lib/Vec2';
  import type Rect from '$lib/Rect';
  import type Ball from '$lib/Ball';

  import { onMount } from 'svelte';

  const { max, PI } = Math;


  // Config

  const TRACES = true;


  // Canvas

  export let width  = 1000;
  export let height = 1000;

  let canvas:HTMLCanvasElement;
  let ctx:CanvasRenderingContext2D;


  // Objects

  export let world:Rect;
  export let balls:Ball[] = [];
  export let colliders:Collider[] = [];
  export let sinks:Sink[];


  // Other Props

  export let TIME_SCALE = 1;


  // Drawing helpers

  const circleAt = (pos:Vec2, rad:number, col:string, invert:boolean) => {
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, rad, 0, 2 * Math.PI);
    if (invert) ctx.stroke(); else ctx.fill();
  }

  const arcAt = (pos:Vec2, rad:number, col:string, start = 0, end = PI*2, cc = false) => {
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, rad, start, end, cc);
    ctx.stroke();
  }

  const shortArcAt = (pos:Vec2, rad:number, col:string, start = 0, end = PI*2) => {
    arcAt(pos, rad, col, start, end, (end - start) < 0);
  }

  const capsuleAt = (a:Vec2, b:Vec2, rad:number, col:string) => {
    ctx.lineCap = 'round';
    ctx.lineWidth = max(1, rad * 2);
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  const lineAt = (a:Vec2, b:Vec2, col:string, width:number) => {
    ctx.lineCap = 'round';
    ctx.lineWidth = width;
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  const rectAt = (r:Rect, col:string) => {
    ctx.fillStyle = col;
    ctx.fillRect(...r.toBounds());
  }


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
      if      (c instanceof Arc)     arcAt(c.pos, c.rad, 'magenta', c.start, c.end);
      else if (c instanceof Circle)  circleAt(c.pos, c.rad, c.color.toString(), c.inverted);
      else if (c instanceof Capsule) capsuleAt(c.pos, c.tip, c.rad, c.color.toString());
      else if (c instanceof Segment) capsuleAt(c.pos, c.tip, 1, c.color.toString());
    }

    // Sink
    for (let sink of sinks) {
      circleAt(sink.shape.pos, sink.shape.rad, 'black');
    }

    // Balls
    for (let ball of balls) {

      // Trace paths
      if (TRACES) {

        // To Sink
        for (let s of sinks) {
          lineAt(ball.pos, s.shape.closest(ball.pos), 'rgba(0, 0, 0, 0.5)', 1);
        }

        // Nearest
        for (let c of colliders) {
          lineAt(ball.pos, c.closest(ball.pos), 'rgba(255, 255, 255, 0.3)', 1);
        }
      }

      // Body
      circleAt(ball.pos, ball.rad, ball.color.toString());

      // Velocity
      lineAt(ball.pos, ball.pos.add(ball.vel.scale(10/TIME_SCALE)), 'rgba(255, 63, 31, 0.7)', 2);
    }

    // Debug dots

    const RES = 50;
    let dx = world.w/RES/2;
    let dy = world.h/RES/2;

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'white';

    for (let x = world.left; x < world.right; x += dx) {
      for (let y = world.bottom; y < world.top; y += dy) {
        let px = x + dx/2;
        let py = y + dy/2;
        let hits = 0;

        for (let c of colliders) hits += c.intersect(Vec2.fromXY(px, py)) ? 1 : 0;

        if (hits) {
          ctx.globalAlpha = 0.3 * hits;
          ctx.fillRect(x, y, dx, dy);
        }
      }
    }

    ctx.restore();
  }


  $: balls && render();
  $: colliders && render();

  onMount(async () => {
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D; // who cares
  });
</script>


<canvas bind:this={canvas} {width} {height} />

<style>
  canvas {
    background: #212121;
    image-rendering: pixelated;
  }
</style>
