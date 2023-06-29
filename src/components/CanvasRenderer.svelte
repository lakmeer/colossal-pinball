<script lang="ts">
  import { Collider, Circle, Segment, Capsule } from "$lib/Collider";
  import type Vec2 from '$lib/Vec2';
  import type Rect from '$lib/Rect';
  import type Ball from '$lib/Ball';

  import { onMount } from 'svelte';

  const { max } = Math;


  // Canvas

  export let width  = 1000;
  export let height = 1000;

  let canvas:HTMLCanvasElement;
  let ctx:CanvasRenderingContext2D;


  // Objects

  export let world:Rect;
  export let balls:Ball[] = [];
  export let colliders:Collider[] = [];


  // Other Props

  export let TIME_SCALE = 1;


  // Drawing helpers

  const circleAt = (pos:Vec2, rad:number, col:string) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, rad, 0, 2 * Math.PI);
    ctx.fill();
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


  // Main render

  const render = () => {
    if (!canvas || !ctx) return;

    //ctx.fillStyle = '#555';
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width/2, height/2);
    ctx.scale(width/world.w, -height/world.h);
    ctx.lineCap = 'round';

    for (let c of colliders) {
      if (c instanceof Circle)  circleAt(c.pos, c.rad, c.color.toString());
      if (c instanceof Capsule) capsuleAt(c.pos, c.tip, c.rad, c.color.toString());
    }

    for (let ball of balls) {
      ctx.lineWidth = 1;
      ctx.fillStyle = ball.color.toString()
      ctx.beginPath();
      ctx.arc(ball.pos.x, ball.pos.y, ball.rad, 0, 2 * Math.PI);
      ctx.fill();

      // Velocity
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.moveTo(...ball.pos.spread);
      ctx.lineTo(...ball.pos.add(ball.vel.scale(10/TIME_SCALE)).spread);
      ctx.stroke();

      // Nearest
      for (let c of colliders) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(...ball.pos.spread);
        ctx.lineTo(...c.closest(ball.pos).spread);
        ctx.stroke();
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
