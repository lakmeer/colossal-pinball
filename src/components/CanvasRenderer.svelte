<script lang="ts">
  import type { Circle, Capsule } from "$types";
  import type Vec2 from '$lib/Vec2';
  import type Ball from '$lib/Ball';
  import type Rect from '$lib/Rect';
  import type Flipper from '$lib/Flipper';

  import { onMount } from 'svelte';

  const TRACE_BALLS = false;

  export let balls:Ball[] = [];
  export let capsules:Capsule[] = [];
  export let world:Rect;
  export let sink:Circle;
  export let flippers:Flipper[];
  export let width:number = 100;
  export let height:number = 100;

  let canvas:HTMLCanvasElement;
  let ctx:CanvasRenderingContext2D;


  const circleAt = (pos:Vec2, rad:number, col:string) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, rad, 0, 2 * Math.PI);
    ctx.fill();
  }

  const capsuleAt = (a:Vec2, b:Vec2, rad:number, col:string) => {
    ctx.lineCap = 'round';
    ctx.lineWidth = rad * 2;
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

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
    // Circular boundary
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(0, 0, world.w/2, 0, 2 * Math.PI);
    ctx.fill();
    */

    // Draw sink zone
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(sink.pos.x, sink.pos.y, sink.rad, 0, 2 * Math.PI);
    ctx.fill();

    for (let capsule of capsules) {
      //capsuleAt(capsule.a, capsule.b, capsule.rad, '#7d3');
    }

    for (let flipper of flippers) {
      capsuleAt(flipper.a, flipper.b, flipper.rad, '#d37');
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
