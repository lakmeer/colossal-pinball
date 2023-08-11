<script lang="ts">

  import { onMount } from 'svelte';

  import Ball from "$lib/Ball";
  import Vec2 from "$lib/Vec2";
  import Color from "$lib/Color";

  import CanvasRenderer from '../components/CanvasRenderer.svelte';
  import LayerRenderer from '$comp/LayerRenderer.svelte';

  import type Table from "$lib/tables/";

  import { clamp, pow, floor, min, max } from "$lib/utils";

  import type { InputState, FxConfig } from "$types";


  // Config

  const TIME_SCALE    = 0.6;
  const SUBSTEP_LIMIT = 0.8; // Limit fraction of frame time the physics can use
  const MAX_BALLS     = 100;
  const STD_FRICTION  = 0.98;


  // World

  import Now from "$lib/tables/now";

  let table:Table  = new Now();
  let balls:Ball[] = [];
  let world = table.config.bounds;

  let cameraY = 0;
  let input:InputState = {
    left:      false,
    right:     false,
    tiltLeft:  false,
    tiltRight: false,
    launch:    false,
  };

  let clientWidth;
  let clientHeight;


  //
  // Physics
  // TODO: Spatial binning
  //

  const update = (dt:number) => {
    
    score = table.gameState.score;

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
      case 'ArrowLeft':  input.tiltLeft  = true; break;
      case 'ArrowRight': input.tiltRight = true; break;
      case ' ': input.launch = true; break;
    }
  }

  const onKeyup = (event:KeyboardEvent) => {
    switch (event.key) {
      case 'a': input.left  = false; break;
      case 's': input.right = false; break;
      case 'ArrowLeft':  input.tiltLeft  = false; break;
      case 'ArrowRight': input.tiltRight = false; break;
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

  $: ballPos = balls.length
    ? Vec2.fromXY(balls[0].pos.x, balls[0].pos.y)
    : Vec2.zero;

  let score = table.gameState.score;

  let fx:FxConfig = {
    hyper: 0,
    holo: 0,
    rgb: 0,
    distort: 0,
    hypno: 0,
    beat: 0,
    face: 0
  }

  let rose = Color.fromTw('rose-950').toString();
  let red  = Color.fromTw('red-500').toString();
  let emerald = Color.fromTw('emerald-500').toString();
  let green = Color.fromTw('green-500').toString();

</script>


<svelte:window bind:innerWidth bind:innerHeight />


<div class="outer">
  <div class="debug">
    <h3>Status</h3>
    <pre>
  Balls: {balls.length}
  Steps: {substeps}
   Time: {delta.toFixed(3)}
   BtnA: {input.left  ? '🟢' : '🔴'}
   BtnB: {input.right ? '🟢' : '🔴'}
  TiltL: {input.left  ? '🟢' : '🔴'}
  TiltR: {input.right ? '🟢' : '🔴'}
    </pre>
    <h3>FX</h3>
    <div class="sliders">
      <span>HYPER</span>
      <input bind:value={fx.hyper} type="range" min="0" max="1" step="0.01" />
      <span>HYPNO</span>
      <input bind:value={fx.hypno} type="range" min="0" max="1" step="0.01" />
      <span>MELT</span>
      <input bind:value={fx.distort} type="range" min="0" max="1" step="0.01" />
      <span>RGB</span>
      <input bind:value={fx.rgb} type="range" min="0" max="1" step="0.01" />
      <span>HOLO</span>
      <input bind:value={fx.holo} type="range" min="0" max="1" step="0.01" />
      <span>BEAT</span>
      <input bind:value={fx.beat} type="range" min="0" max="1" step="0.01" />
      <span>FACE</span>
      <input bind:value={fx.face} type="range" min="0" max="1" step="0.01" />
    </div>
  </div>

  <div class="frame">
    <div class="inner" style="--aspect: {table.config.bounds.aspect}" bind:clientWidth bind:clientHeight>
      <LayerRenderer
        {fx}
        {ballPos} 
        lamps={table.gameState.lamps}
        world={world}
        width={clientWidth}
        height={clientHeight}
      />

      <div class="display">
        <span class="balls" style="color: {green}">
          {balls.length}
        </span>

        <span class="score" style="color: {red}">
          {score}
        </span>
      </div>
    </div>
  </div>
</div>


<style>
  .outer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-columns: 150px 1fr;
    background: #111111;
  }

  .frame {
    container-type: size;
    display: grid;
    box-shadow: 0 0 20px #000204 inset;
  }

  .inner {
    display: grid;
    position: relative;
    aspect-ratio: var(--aspect);
    margin: auto;
    width: auto;
    height: 100cqh;
    overflow: hidden;
  }

  /* Needs to squish vertically */
  @container (max-aspect-ratio: 0.57) {
    .inner {
      height: auto;
      width: 100cqw;
    }
  }

  .display {
    font-family: 'dseg7', monospace;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    min-height: 1vw;
    aspect-ratio: 6.16;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    container-type: size;
  }

  @container (min-width:1px) {
    .score, .balls {
      display: block;
      font-size: 10cqi;
      margin: 1cqi 2cqi;
      text-shadow: 0 0 1cqi color-mix(in srgb, currentColor 90%, yellow);
    }

    .score {
      min-width: 4cqi;
      flex: 1;
    }

    .score:after, .balls:after {
      display: block;
      width: 100%;
      height: 0.5cqi;
      background: black;
      position: absolute;
      top :0;
      left: 0;
      opacity: 1.2;
      mix-blend-mode: screen;
      text-shadow: none;
      color: color-mix(in srgb, currentColor 20%, #000022);
      z-index: 1;
    }

    .score:after {
      content: '88888888';
    }

    .balls:after {
      content: '8';
    }
  }

  .debug {
    color: white;
    font-family: monospace;
    padding: 0 1rem;
  }

  h3 {
    text-align: center;
  }

  span {
    display: block;
    text-align: right;
    transform: translateY(0.5rem);
  }

  input {
    width: 100%;
  }
</style>

