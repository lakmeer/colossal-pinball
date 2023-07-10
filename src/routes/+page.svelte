<script lang="ts">

  import { onMount } from 'svelte';

  import Ball from "$lib/Ball";
  import Vec2 from "$lib/Vec2";

  import CanvasRenderer from '../components/CanvasRenderer.svelte';

  import type Table from "$lib/tables/";

  import { clamp, pow, floor, min, max, nsin, loadImage } from "$lib/utils";

  import type { InputState, EventQueue } from "$types";


  // Config

  const TIME_SCALE    = 1;
  const SUBSTEP_LIMIT = 0.8; // Limit fraction of frame time the physics can use
  const MAX_BALLS     = 100;
  const STD_FRICTION  = 0.98;


  // World

  import Now from "$lib/tables/now";

  let table:Table  = Now();
  let balls:Ball[] = [];

  let cameraY = 0;
  let input:InputState = {
    left:  false,
    right: false,
  };

  let game:GameState = {
    score: 0,
    balls: 3,
  }


  //
  // Physics
  //
  // TODO: Spatial binning
  //
  // + Gravity
  // + Collide balls with table bounds
  // + Collide balls with each other
  // + Collide balls with Things
  // - Run table script
  //   - Collect events from things
  //   - Run callbacks against registered events
  // - Cull balls
  // - Apply verlet integration

  const update = (dt:number) => {

    // 'Fractional friction factor' - exponentially adjusted for number of steps
    const fff = pow(1 - (1 - STD_FRICTION), 1/substeps);

    for (let a of balls) {
      a.impart(Vec2.fromXY(0, -table.gravity));
      table.bounds.collideInterior(a);

      for (let b of balls) {
        if (a !== b) b.collide(a);
      }

      for (let t of Object.values(table.things)) {
        t.collide(a, dt, fff);
      }

      if (a.cull) balls.splice(balls.indexOf(a), 1);

      a.simulate(dt);
    }

    for (let t of Object.values(table.things)) {
      t.update(dt);
    }

    // Run game script
    table.process(input);

    // Launcher only stays active for one frame
    input.launch = false;

  }


  // Render loop

  let lastTime = performance.now()/1000;
  let rafref   = 0;
  let substeps = 8;
  let delta    = 0;

  const render = () => {
    rafref = requestAnimationFrame(render);

    const start = performance.now();
    const now = performance.now()/1000;
    const dt = (now - lastTime) * TIME_SCALE;

    //cameraY = nsin(now/2) * table.bounds.h;
    cameraY = 1.3 * 100;

    for (let i = 0; i < substeps; i++) {
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

  type Arrow = [Vec2, Vec2];
  let clicked = false;
  let erasing = false;
  let spawnArrow:Arrow = [Vec2.zero, Vec2.zero];

  const spawn = (arrow: Arrow) => {
    let span = arrow[1].sub(arrow[0]);
    let pos = arrow[0];
    let vel = span.scale(100000);

    if (balls.length < MAX_BALLS) {
      balls.push(Ball.withVel(pos, vel, table.ballRad));
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

  const eraseAt = (event:MouseEvent) => erase(mouse2world(event), 20);

  const onMouseDown = (event:MouseEvent) => {
    //@ts-ignore
    if (event.target.tagName !== 'CANVAS') return;

    let pos = mouse2world(event);

    switch (event.button) {
      case 0:
        spawnArrow[0].set(pos);
        spawnArrow[1].set(pos);
        clicked = true;
        break;
      case 1: 
        spawn(spawnArrow);
        break;
    }
  }

  const onMouseUp = (event:MouseEvent) => {
    switch (event.button) {
      case 0:
        spawn(spawnArrow);
        break;
    }
    clicked = false;
    erasing = false;
  }

  const onMouseMove = (event:MouseEvent) => {
    //@ts-ignore
    if (event.target.tagName !== 'CANVAS') return;
    let pos = mouse2world(event);
    if (clicked) spawnArrow[0].set(pos);
    if (erasing) eraseAt(event);
  }

  const onKeydown = (event:KeyboardEvent) => {
    switch (event.key) {
      case 'a': input.left  = true; break;
      case 's': input.right = true; break;
      case ' ': input.launch = true; break;
    }
  }

  const onKeyup = (event:KeyboardEvent) => {
    switch (event.key) {
      case 'a': input.left  = false; break;
      case 's': input.right = false; break;
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
    {spawnArrow}
    width={innerWidth}
    height={innerWidth}
  />
</div>

<pre class="debug">
Balls: {balls.length}
Steps: {substeps}
 Time: {delta.toFixed(3)}
 BtnA: {input.left  ? '🟢' : '🔴'}
 BtnB: {input.right ? '🟢' : '🔴'}
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

