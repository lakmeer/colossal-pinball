<script lang="ts">

  import { onMount } from 'svelte';

  import Ball from "$lib/Ball";
  import Vec2 from "$lib/Vec2";

  import CanvasRenderer from '../components/CanvasRenderer.svelte';

  import type Table from "$lib/tables/";

  import { clamp, pow, floor, min, max, nsin, loadImage } from "$lib/utils";

  import type { InputState, EventQueue, FxConfig } from "$types";


  // Config

  const TIME_SCALE    = 0.6;
  const SUBSTEP_LIMIT = 0.8; // Limit fraction of frame time the physics can use
  const MAX_BALLS     = 100;
  const STD_FRICTION  = 0.98;


  // World

  import Now from "$lib/tables/now";

  let table:Table  = new Now();
  let balls:Ball[] = [];

  let cameraY = 0;
  let input:InputState = {
    left:   false,
    right:  false,
    launch: false,
  };

  let clientWidth;
  let clientHeight;


  //
  // Physics
  // TODO: Spatial binning
  //

  const update = (dt:number) => {

    // 'Fractional friction factor' - exponentially adjusted for number of steps
    const fff = pow(1 - (1 - STD_FRICTION), 1/substeps);

    for (let a of balls) {
      a.impart(Vec2.fromXY(0, -table.config.gravity));
      a.simulate(dt);

      for (let b of balls) {
        if (a !== b) b.collide(a);
      }

      for (let t of Object.values(table.things)) {
        t.collide(a, dt, fff);
      }

      if (a.cull) balls.splice(balls.indexOf(a), 1);

      table.config.bounds.collideInterior(a);
    }

    for (let t of Object.values(table.things)) {
      t.update(dt);
    }

    // Run game script
    table.process(input);

    // Add new balls when the game calls for it
    table.onRequestNewBall((pos:Vec2) => {
      if (balls.length < MAX_BALLS) {
        balls.push(Ball.withVel(pos, Vec2.fromXY(0, 0), table.config.ballRad));
      }
    });

    // Launch button only stays active for one frame
    input.launch = false;

  }


  // Render loop

  let lastTime = performance.now()/1000;
  let rafref   = 0;
  let substeps = 8;
  let delta    = 0;
  let running = false;

  const render = () => {
    if (running) rafref = requestAnimationFrame(render);

    const start = performance.now();
    const now = performance.now()/1000;
    const dt = (now - lastTime) * TIME_SCALE;

    //cameraY = 3.6 * 100;
    //cameraY = balls[0] ? balls[0].pos.y : 0;

    for (let i = 0; i < substeps; i++) {
      update(dt/substeps);
    }

    lastTime = now;
    balls = balls; // poke

    // If delta is the time taken to simulate this whole frame, then we can
    // calculate how many substeps we can afford to pack into the next frame
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
      balls.push(Ball.withVel(pos, vel, table.config.ballRad));
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
    let x = cx * table.config.bounds.w + table.config.bounds.left;
    let y = cy * table.config.bounds.h - table.config.bounds.top;
    return Vec2.fromXY(x, -y);
  }
    //const aspectCorr = height/width;
    //ctx.translate(world.right, cameraY/world.h * (aspectCorr * world.w - world.h) - aspectCorr * world.w);

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

    running = true;
    render();

    //document.addEventListener('mousedown', onMouseDown);
    //document.addEventListener('mouseup',   onMouseUp);
    //document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown',   onKeydown);
    document.addEventListener('keyup',     onKeyup);

    return () => {
      running = false;
      cancelAnimationFrame(rafref);

      //document.removeEventListener('mousedown', onMouseDown);
      //document.removeEventListener('mouseup',   onMouseUp);
      //document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('keydown',   onKeydown);
      document.removeEventListener('keyup',     onKeyup);
    }
  });

  let fx:FxConfig = {
    hyper: 0,
    holo: 0,
    rainbow: 0,
    distort: 0,
    hypno: 0,
  }
</script>


<svelte:window bind:innerWidth bind:innerHeight />


<div class="outer">
  <div class="inner" style="--aspect: {table.config.bounds.aspect}" bind:clientWidth bind:clientHeight>
    <CanvasRenderer
      {balls}
      {table}
      {cameraY}
      {spawnArrow}
      {fx}
      width={clientWidth}
      height={clientHeight}
    />
  </div>
</div>

<div class="debug">
  <pre>
Balls: {balls.length}
Steps: {substeps}
 Time: {delta.toFixed(3)}
 BtnA: {input.left  ? '🟢' : '🔴'}
 BtnB: {input.right ? '🟢' : '🔴'}
  </pre>
  <div class="sliders">
    <label>HYPER</label>
    <input bind:value={fx.hyper} type="range" min="0" max="1" step="0.01" />
    <label>HYPNO</label>
    <input bind:value={fx.hypno} type="range" min="0" max="1" step="0.01" />
    <label>MELT</label>
    <input bind:value={fx.distort} type="range" min="0" max="1" step="0.01" />
    <label>RGB</label>
    <input bind:value={fx.rainbow} type="range" min="0" max="1" step="0.01" />
    <label>HOLO</label>
    <input bind:value={fx.holo} type="range" min="0" max="1" step="0.01" />
  </div>
</div>


<style>
  :global(.Vader) {
    z-index: 0;
  }

  :global(.TwoDee) {
    z-index: 1;
  }

  .outer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: grid;
    background: #111111;
    place-items: end;
  }

  .inner {
    position: relative;
    width:      100vw; 
    height:     calc(100vw/var(--aspect));
    max-width:  calc(100vh*var(--aspect));
    max-height: 100vh;
  }

  .debug {
    position: fixed;
    top: 0;
    left: 0;
    color: white;
    font-family: monospace;
    z-index: 2;
    background: rgba(0,0,0,0.3);
    margin: 0;
    padding: 0 1rem;
  }

  .sliders {
    max-width: 100px;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 1rem;
  }

  label {
    display: block;
    text-align: right;
    margin-bottom: -0.7rem;
  }
  input {
    width: 100%;
  }
</style>

