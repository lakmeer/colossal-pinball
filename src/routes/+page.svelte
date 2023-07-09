<script lang="ts">

  import { onMount } from 'svelte';

  import Ball from "$lib/Ball";
  import Vec2 from "$lib/Vec2";

  import CanvasRenderer from '../components/CanvasRenderer.svelte';

  import type Table from "$lib/tables/";
  import Now from "$lib/tables/now";

  import { clamp, pow, floor, min, max, nsin, loadImage } from "$lib/utils";


  // Config

  const GRAVITY       = 500;
  const TIME_SCALE    = 1.0;
  const SUBSTEP_LIMIT = 0.8; // Limit fraction of frame time the physics can use
  const MAX_BALLS     = 100;
  const STD_FRICTION  = 0.98;


  // World

  let table:Table  = Now();
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

    // Reset Zones from last frame
    for (let z of Object.values(table.zones)) z.reset();

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

      // Collide obstacles
      for (let c of Object.values(table.colliders)) c.collide(a);

      // Measure Zones
      for (let z of Object.values(table.zones)) z.apply(a);

      // Cull dead balls
      if (a.cull) balls.splice(balls.indexOf(a), 1);

      // Table boundary
      table.bounds.collideInterior(a);

      // Components arbitrary update routines
      for (let z of Object.values(table.zones)) z.update(dt);

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

    //cameraY = nsin(now/2) * table.bounds.h;

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
      balls.push(Ball.randomAt(pos.x, pos.y, table.ballRad));
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
    let x = cx * table.bounds.w + table.bounds.left;
    let y = cy * table.bounds.h - table.bounds.top;
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

  //@ts-ignore shut up
  onMount(async () => {

    if (table.templateSrc) table.template = await loadImage(table.templateSrc);

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
    width={innerHeight * table.bounds.aspect}
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

