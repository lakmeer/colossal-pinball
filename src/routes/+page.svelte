<script lang="ts">

  import { onMount } from 'svelte';

  import type Table from "$lib/tables/";
  import type { InputState, FxConfig } from "$types";

  import { lerp, clamp, pow, floor, min, max } from "$lib/utils";

  import Ball from "$lib/Ball";
  import Vec2 from "$lib/Vec2";

  import FxPanel        from '$comp/FxPanel.svelte';
  import ScoreDisplay   from '$comp/ScoreDisplay.svelte';
  import AspectLayout   from '$comp/AspectLayout.svelte';
  import CanvasRenderer from '$comp/CanvasRenderer.svelte';
  import LayerRenderer  from '$comp/LayerRenderer.svelte';


  // Config

  const SIMPLE_RENDER = true;

  const TIME_SCALE    = 0.6;
  const SUBSTEP_LIMIT = 0.8; // Limit fraction of frame time the physics can use
  const MAX_BALLS     = 100;
  const STD_FRICTION  = 0.98;


  // World

  import Now from "$lib/tables/now";

  let table:Table  = new Now();
  let balls:Ball[] = [];
  let world = table.config.bounds;

  let input:InputState = {
    left:      false,
    right:     false,
    tiltLeft:  false,
    tiltRight: false,
    launch:    false,
  };



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

    // Rollover score
    displayScore = lerp(displayScore, table.gameState.score, 0.1);
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
      case 'a':
      case 'z': input.left  = true; break;
      case 'x': input.tiltLeft  = true; break;
      case ',': input.tiltRight = true; break;
      case 's':
      case '.': input.right = true; break;
      case ' ': input.launch = true; break;
    }
  }

  const onKeyup = (event:KeyboardEvent) => {
    switch (event.key) {
      case 'a':
      case 'z': input.left  = false; break;
      case 'x': input.tiltLeft  = false; break;
      case ',': input.tiltRight = false; break;
      case 's':
      case '.': input.right = false; break;
    }
  }


  // Init

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


  // Score display ETC

  let fx:FxConfig = {
    light: 1,
    holo: 0,
    rgb: 0,
    distort: 0,
    hypno: 0,
    beat: 0,
    face: 0,
    swim: 0,
    hyper: 0,
  }

  let width:number;
  let height:number;
  let displayScore = 0;

</script>


<div class="frame">

  <div class="debug-panel">
    <h3>Status</h3>
    <pre>
  Balls: {balls.length}
  Steps: {substeps}
   Time: {delta.toFixed(2)}
   BtnA: {input.left      ? '🟢' : '🔴'}
   BtnB: {input.right     ? '🟢' : '🔴'}
  TiltL: {input.tiltLeft  ? '🟢' : '🔴'}
  TiltR: {input.tiltRight ? '🟢' : '🔴'}
    </pre>

    <h3>FX</h3>
    <FxPanel bind:fx={fx} />
  </div>

  <AspectLayout aspect={table.config.bounds.aspect} bgColor="#112233" bind:width bind:height>

    {#if SIMPLE_RENDER}
      <CanvasRenderer
        {balls}
        {table}
        gameState={table.gameState}
        spawnArrow={spawnArrow}
        world={world}
        width={width}
        height={height}
      />
    {:else}
      <LayerRenderer
        {fx}
        {ballPos}
        gameState={table.gameState}
        world={world}
      />
    {/if}

    <ScoreDisplay balls={balls.length} score={floor(displayScore)} />

  </AspectLayout>
</div>


<style>
  .frame {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-columns: 150px 1fr;
    background: #111111;
  }

  .debug-panel {
    color: white;
    font-family: monospace;
    padding: 0 1rem;
  }

  .debug-panel h3 {
    text-align: center;
  }
</style>

