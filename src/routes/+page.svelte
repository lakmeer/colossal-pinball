<script lang="ts">

  import { onMount } from 'svelte';

  import Ball from "$lib/Ball";
  import Vec2 from "$lib/Vec2";
  import Rect from "$lib/Rect";

  import Color from "$lib/Color";
  import Collider from "$lib/Collider";
  import { Circle }    from "$lib/Shape";
  import { Rollover, Force } from "$lib/Zone";

  import CanvasRenderer from '../components/CanvasRenderer.svelte';

  import type Table from "$lib/tables/";
  import { TattooMystique } from "$lib/tables/";

  import { clamp, pow, floor, min, max, nsin } from "$lib/utils";


  // Config

  const GRAVITY       = 500;
  const TIME_SCALE    = 1.0;
  const SUBSTEP_LIMIT = 0.8; // Limit fraction of frame time the physics can use
  const MAX_BALLS     = 100;
  const STD_FRICTION  = 0.98;
  const GAME_ASPECT   = 1/2;


  // World

  let world:Rect   = new Rect(0, 200, 200, 400);
  let table:Table  = TattooMystique(world);
  let balls:Ball[] = [];

  let cameraY = 0;
  let btnA = false;
  let btnB = false;


  //
  // Physics
  //

  const update = (dt:number) => {

    // 'Fractional friction factor' - exponentially adjusted for number of steps
    const fff = pow(1 - (1 - STD_FRICTION), 1/substeps);

    // Collisions
    for (let a of balls) {

      // Gravity
      a.impart(Vec2.fromXY(0, -GRAVITY));

      // Other balls
      for (let b of balls) {
        if (a !== b) b.collide(a);
      }

      // Flippers
      table.flippers.left.collide(a);
      table.flippers.right.collide(a);

      // Playfield obstacles
      for (let c of table.colliders) c.collide(a);

      // Zones
      for (let z of table.zones) z.apply(a);

      // Cull dead balls
      if (a.cull) balls.splice(balls.indexOf(a), 1);

      // World boundary
      world.collideInterior(a);

      // Apply verlet integration
      a.simulate(dt);
    }
  }


  // Render loop

  let lastTime = performance.now()/1000;
  let rafref = 0;
  let substeps = 8;
  let delta = 0;

  const render = () => {
    rafref = requestAnimationFrame(render);

    const start = performance.now();
    const now = performance.now()/1000;
    const dt = (now - lastTime) * TIME_SCALE;

    cameraY = nsin(now/2) * world.h;

    table.flippers.left.active  = btnA;
    table.flippers.right.active = btnB;

    for (let i = 0; i < substeps; i++) {
      table.flippers.left.update(dt/substeps);
      table.flippers.right.update(dt/substeps);
      update(dt/substeps);
    }

    lastTime = now;
    balls = balls; // poke

    // if delta is the time taken to simulate this whole frame, then
    // we can calculate how many substeps we can pack into the next frame
    delta = performance.now() - start;
    substeps = max(8, min(100, floor(substeps * (1000/60)/delta * SUBSTEP_LIMIT)));
  }


  // Interaction Events

  let clicked = false;
  let erasing = false;

  const spawn = (pos:Vec2) => {
    if (balls.length < MAX_BALLS) {
      balls.push(Ball.randomAt(pos.x, pos.y));
    }
  }

  const erase = (pos:Vec2, rad = 20) => {
    for (let i = balls.length - 1; i >= 0; i--) {
      let b = balls[i];
      if (b.pos.dist(pos) < rad) {
        balls.splice(i, 1);
      }
    }
  }

  const mouse2world = ({ clientX, clientY, target }:MouseEvent) => {
    let el = target as HTMLElement;
    let rect = el.getBoundingClientRect();
    let cx = clamp((clientX - rect.left) / rect.width);
    let cy = clamp((clientY - rect.top) / rect.height);
    let x = cx * world.w + world.left;
    let y = cy * world.h - world.top;
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


  // Init

  let innerWidth = 0;
  let innerHeight = 0;

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

</script>


<svelte:window bind:innerWidth bind:innerHeight />

<div>
  <CanvasRenderer
    {balls}
    {table}
    {cameraY}
    width={innerHeight * GAME_ASPECT}
    height={innerHeight}
  />
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

