<script lang="ts">
  import type Ball from '$lib/Ball';
  import type Rect from '$lib/Rect';

  import { tick, onMount } from 'svelte';

  const TRACE_BALLS = false;

  export let balls:Ball[] = [];
  export let lines = [];
  export let world:Rect;
  export let width:number = 100;
  export let height:number = 100;

  let canvas:HTMLCanvasElement;
  let ctx:CanvasRenderingContext2D;

  const render = () => {
    if (!canvas || !ctx) return;

    //ctx.fillStyle = '#555';
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width/2, height/2);
    ctx.scale(width/world.w, -height/world.h);
    ctx.lineCap = 'round';

    /*
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(0, 0, world.w/2, 0, 2 * Math.PI);
    ctx.fill();
    */

    for (let line of lines) {
      ctx.lineWidth = line.r * 2;
      ctx.strokeStyle = '#d37';
      ctx.beginPath();
      ctx.moveTo(...line.a.spread);
      ctx.lineTo(...line.b.spread);
      //ctx.moveTo(...line.b.add(line.a.sub(line.b).norm().scale(line.r).rotate(-Math.PI/2)).spread);
      //ctx.arc(...line.a.spread, line.r, line.a.sub(line.b).angle() - Math.PI/2, line.a.sub(line.b).angle() + Math.PI/2);
      //ctx.arc(...line.b.spread, line.r, line.b.sub(line.a).angle() - Math.PI/2, line.b.sub(line.a).angle() + Math.PI/2);
      ctx.stroke();
    }

    for (let ball of balls) {
      ctx.lineWidth = 1;
      ctx.fillStyle = ball.color.toString()
      ctx.beginPath();
      ctx.arc(ball.pos.x, ball.pos.y, ball.rad, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.moveTo(...ball.pos.spread);
      ctx.lineTo(...ball.pos.add(ball.vel.scale(10)).spread);
      ctx.stroke();

      if (TRACE_BALLS) {
        ctx.strokeStyle = '#f36';
        ctx.moveTo(...ball.pos.spread);
        ctx.lineTo(0, 0);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
  
  $: balls && render();

  onMount(async () => {
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D; // who cares
  });
</script>


<canvas bind:this={canvas} {width} {height} class="TwoDee" />


<style>
  canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #212121;
    image-rendering: pixelated;
  }
</style>
