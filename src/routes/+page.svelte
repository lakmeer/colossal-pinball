<script lang="ts">

  import { onMount } from 'svelte';

  import Flipper from "$lib/Flipper";
  import Ball    from "$lib/Ball";
  import Vec2    from "$lib/Vec2";
  import Rect    from "$lib/Rect";

  import { Collider, Capsule, Circle } from "$lib/Collider";

  import CanvasRenderer from '../components/CanvasGameRenderer.svelte';
  import ShaderRenderer from '../components/ShaderRenderer.svelte';

  const { PI, pow, floor, min, max, abs, random, sqrt } = Math;


  //
  // TODO
  //
  // - Whole game state as object, pass to renderer, make reactive
  //


  // Config

  const GRAVITY = 1000;
  const TIME_SCALE = 0.5;
  const SUBSTEP_FACTOR = 0.8; // Use no more than half the frame time
  const MAX_BALLS = 1;
  const COLLISION_FRICTION = 0.98;
  const MAX_VEL = 1000;


  // World

  let world = new Rect(0, 0, 100, 100);
  let balls:Ball[] = [ ];
  let sink = new Circle(Vec2.fromXY(0, -70), 30);
  let colliders:Collider[] = [];

  const spawn = (pos:Vec2) => {
    balls.push(Ball.randomAt(pos.x, pos.y));
  }

  const erase = (pos:Vec2, rad = 20) => {
    for (let i = balls.length - 1; i >= 0; i--) {
      let b = balls[i];
      if (b.pos.dist(pos) < rad) {
        balls.splice(i, 1);
      }
    }
  }
                                        //  pos, rad, len, rest, range, speed
  let flipperA = new Flipper(Vec2.fromXY(-50, -30), 3, 25, 0  - PI/8,  PI/4, 40);
  let flipperB = new Flipper(Vec2.fromXY( 50, -30), 3, 25, PI + PI/8, -PI/4, 40);

  const flippers = [ flipperA, flipperB ];
  const bumpers  = [];


  // Physics

  const updateVertlet = (dt:number) => {

    // 'Fractional friction factor' - adjusted for number of steps
    const fff = pow(1 - (1 - COLLISION_FRICTION), 1/substeps);

    // Gravity
    for (let ball of balls) {
      ball.impart(Vec2.fromXY(0, -GRAVITY));
    }

    // Collisions
    for (let a of balls) {
      for (let b of balls) {
        if (a === b) continue;
        b.collide(a, fff);
      }

      for (let b of flippers) {
        b.collide(a, fff);
      }

      for (let b of bumpers) {
        b.collide(a);
      }

      // With straight walls
      // With curved walls

      // World boundary
      world.collideInterior(a, fff);

      // Apply verlet integration
      a.simulate(dt);
    }
  }


  // Render loop

  let lastTime = performance.now()/1000;
  let rafref = 0;
  let substeps = 8;
  let delta = 0;
  let btnA = false;
  let btnB = false;

  const render = () => {
    rafref = requestAnimationFrame(render);

    const start = performance.now();
    const now = performance.now()/1000;
    const dt = (now - lastTime) * TIME_SCALE;

    flipperA.active = btnA;
    flipperB.active = btnB;

    for (let i = 0; i < substeps; i++) {
      flipperA.update(dt/substeps);
      flipperB.update(dt/substeps);
      updateVertlet(dt/substeps);
    }

    erase(sink.pos, sink.rad);

    lastTime = now;
    balls = balls; // poke

    // if delta is the time taken to simulate this whole frame, then
    // we can calculate how many substeps we can pack into the next frame
    delta = performance.now() - start;
    substeps = max(8, min(100, floor(substeps * (1000/60)/delta * SUBSTEP_FACTOR)));
  }


  let clicked = false;
  let erasing = false;

  const mouse2world = ({ clientX, clientY, target }:MouseEvent) => {
    let el = target as HTMLElement;
    let rect = el.getBoundingClientRect();
    let x = (clientX - rect.left) / rect.width  * world.w - world.w/2;
    let y = (clientY - rect.top)  / rect.height * world.h - world.h/2;
    return Vec2.fromXY(x, -y);
  }

  const spawnAt = (event:MouseEvent) => spawn(mouse2world(event));
  const eraseAt = (event:MouseEvent) => erase(mouse2world(event), 20);

  const onMouseDown = (event:MouseEvent) => {
    //@ts-ignore
    if (event.target.tagName !== 'CANVAS') return;
    switch (event.button) {
      case 0: spawnAt(event); clicked = true; break;
      case 1: eraseAt(event); erasing = true; break;
    }
  }

  const onMouseUp = () => {
    clicked = false;
    erasing = false;
  }

  const onMouseMove = (event:MouseEvent) => {
    //@ts-ignore
    if (event.target.tagName !== 'CANVAS') return;
    if (clicked) spawnAt(event);
    if (erasing) eraseAt(event);
  }

  const onKeydown = (event:KeyboardEvent) => {
    switch (event.key) {
      case 'a': btnA = true; break;
      case 's': btnB = true; break;
    }
  }

  const onKeyup = (event:KeyboardEvent) => {
    switch (event.key) {
      case 'a': btnA = false; break;
      case 's': btnB = false; break;
    }
  }

  onMount(() => {
    render();

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup',   onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown',   onKeydown);
    document.addEventListener('keyup',     onKeyup);

    return () => {
      cancelAnimationFrame(rafref);

      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup',   onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('keydown',   onKeydown);
      document.removeEventListener('keyup',     onKeyup);
    }
  });

  let innerWidth = 0;
  let innerHeight = 0;

</script>


<svelte:window bind:innerWidth bind:innerHeight />


<div>
  <CanvasRenderer {balls} {flippers} {sink} {world} bind:width={innerHeight} bind:height={innerHeight} />
  <!--
  <ShaderRenderer {balls} {flippers} {sink} {world} bind:width={innerWidth} bind:height={innerHeight} />
  -->
</div>

<pre class="debug">
Balls: {balls.length}
Steps: {substeps}
 Time: {delta.toFixed(3)}
 BtnA: {btnA ? '🟢' : '🔴'}
 BtnB: {btnB ? '🟢' : '🔴'}
</pre>


<style>
  :global(.Vader) {
    z-index: 0;
  }

  :global(.TwoDee) {
    z-index: 1;
  }

  div {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: grid;
    background: #111;
    place-items: center;
  }

  pre {
    position: fixed;
    top: 0;
    left: 0;
    color: white;
    font-family: monospace;
    pointer-events: none;
    z-index: 2;
    background: rgba(0,0,0,0.3);
    margin: 0;
    padding: 1rem;
  }
</style>

