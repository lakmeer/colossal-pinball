<script lang="ts">

  import { onMount } from 'svelte';

  import Flipper from "$lib/Flipper";
  import Ball    from "$lib/Ball";
  import Vec2    from "$lib/Vec2";
  import Rect    from "$lib/Rect";
  import Sink    from "$lib/Sink";

  import { Segment, Circle, Capsule, Arc, Fence, Box } from "$lib/Collider";
  import type { Collider } from "$lib/Collider";

  import CanvasRenderer from '../components/CanvasRenderer.svelte';

  import { clamp, pow, floor, min, max, nsin, random, sqrt, PI, TAU } from "$lib/utils";


  // Config

  const GRAVITY = 1000;
  const TIME_SCALE = 1.0;
  const SUBSTEP_FACTOR = 0.8; // Use no more than half the frame time
  const MAX_BALLS = 100;
  const COLLISION_FRICTION = 0.98;
  const GAME_ASPECT = 1/2;


  // World

  let world = new Rect(0, 200, 200, 400);

  let balls:Ball[]         = [];
  let sinks:Sink[]         = [];
  let flippers:Flipper[]   = [];
  let colliders:Collider[] = [];

  let cameraY = 0;


  //
  // Table layout
  //

  let ballRad = 5;
  let ballSize = ballRad * 2;
  let chuteWall = 6;
  let chuteWidth = ballSize + 2;

  let tableWidth = world.w - chuteWidth - chuteWall;
  let middle = tableWidth/2 + world.left;


  // Launch chute and right wall
  colliders.push(Capsule.at(world.right - chuteWidth - chuteWall/2, 290, world.right - chuteWidth - chuteWall/2, 0, chuteWall/2));
  colliders.push(Arc.at(world.right - 59, 290, 60, TAU/7));
  colliders.push(Fence.from(
    middle + tableWidth/2 - 0,  264,
    middle + tableWidth/2 - 12, 268,
    middle + tableWidth/2 - 20, 250,
    middle + tableWidth/2 - 31, 243,
    middle + tableWidth/2 - 32, 255,
    middle + tableWidth/2 - 12, 306,
    middle + tableWidth/2 - 1, 304,
    middle + tableWidth/2 + 5, 290,
  ));
  colliders.push(Circle.at(middle + 60, 242, 5));
  colliders.push(Circle.at(middle + 64, 234, 3));

  // Flippers
  let flipperSize = 27;
  let drainWidth = ballSize * 2;
  let flipperA = new Flipper(Vec2.fromXY(middle - drainWidth/2 - flipperSize, 46), 4, flipperSize, 0  - PI/6,  PI/4, 50);
  let flipperB = new Flipper(Vec2.fromXY(middle + drainWidth/2 + flipperSize, 46), 4, flipperSize, PI + PI/6, -PI/4, 50);
  flippers.push(flipperA);
  flippers.push(flipperB);

  // Lower walls
  colliders.push(Capsule.at(middle - 38, 46, middle - 57, 57, 5));
  colliders.push(Capsule.at(middle + 38, 46, middle + 74, 70, 5));

  // Drain and lower wall
  sinks.push(Sink.from(Box.from(world.left, 0, world.right - chuteWidth - chuteWall, 15)));
  colliders.push(Segment.from(middle + tableWidth/2, 57, middle + drainWidth - 3, 16, true));
  colliders.push(Segment.from(middle - tableWidth/2, 57, middle - drainWidth + 3, 16, false));

  // Lower slingshots
  colliders.push(Fence.from(middle + 46, 84, middle + 58, 128, middle + 60, 94).close());
  colliders.push(Fence.from(middle - 45, 79, middle - 57, 116, middle - 57, 94).close().invert());

  // Upper bumpers
  colliders.push(Circle.at(middle -  7, 251, 15));
  colliders.push(Circle.at(middle - 28, 286, 15));
  colliders.push(Circle.at(middle + 13, 299, 15));

  // Upper wall
  colliders.push(Arc.at(middle + 56, 352, 35, TAU/4 + TAU/14, -TAU/14));
  colliders.push(Fence.from(middle + 56, 352 + 35, world.left + 25, 352 + 35));

  // Upper rollover lanes
  let upperLaneCenter = middle - 14;
  let upperLaneStride = 22;
  colliders.push(Capsule.fromAngle(upperLaneCenter - upperLaneStride * 1.5, 315, TAU/4, 25, 5));
  colliders.push(Capsule.fromAngle(upperLaneCenter - upperLaneStride * 0.5, 320, TAU/4, 25, 5));
  colliders.push(Capsule.fromAngle(upperLaneCenter + upperLaneStride * 0.5, 325, TAU/4, 25, 5));
  colliders.push(Capsule.fromAngle(upperLaneCenter + upperLaneStride * 1.5, 330, TAU/4, 25, 5));

  // Left wall
  colliders.push(Fence.from(
    world.left, 290,
    world.left + 20, 240,
    world.left + 12, 163,
    world.left + 21, 135,
  ));
  colliders.push(Arc.at(world.left + 35, 100, 38, TAU/6, TAU/4 + TAU/16));
  colliders.push(Arc.at(world.left + 15, 84, 16, TAU/4, TAU/2));
  colliders.push(Segment.at(world.left + 15, 68, world.left + 15, 50));

  // Left outlane
  colliders.push(Capsule.at(middle - 76, 107, middle - 76, 82, 1));

  // Right outlane
  colliders.push(Capsule.at(middle + 78, 120, middle + 78, 70, 1));
  colliders.push(Arc.at(middle + 48, 93, 30, TAU/8, -TAU/8));

  // Right target assembly
  colliders.push(Capsule.at( middle + tableWidth/2 - 22, 198, middle + tableWidth/2 - 0,  240, 3));
  colliders.push(Fence.from(
    middle + tableWidth/2 - 0,  130,
    middle + tableWidth/2 - 7,  130,
    middle + tableWidth/2 - 20, 165,
    middle + tableWidth/2 - 0,  205,
    middle + tableWidth/2 - 14, 212,
  ));

  // Upper-left lock lane
  colliders.push(Capsule.at(middle - 66, 300, middle - 66, 386, 1));
  colliders.push(Capsule.at(middle - 64, 374, middle - 38, 371, 2));
  colliders.push(Arc.at(middle - 38, 341, 28, 8*TAU/32, 8*TAU/32 ));
  colliders.push(Arc.at(middle - 79, 384, 13, TAU/2, 0));

  // Upper-right target assembly
  colliders.push(Arc.at(middle + 43, 352, 25, 11*TAU/32, -1*TAU/32));
  colliders.push(Capsule.at(middle + 33, 373, middle + 66, 348, 3));

  console.log("Table complete:", colliders.length, "elements total");


  //
  // Physics
  //

  const update = (dt:number) => {

    // 'Fractional friction factor' - exponentially adjusted for number of steps
    const fff = pow(1 - (1 - COLLISION_FRICTION), 1/substeps);

    // Collisions
    for (let a of balls) {

      // Gravity
      a.impart(Vec2.fromXY(0, -GRAVITY));

      // Other balls
      for (let b of balls) {
        if (a !== b) b.collide(a);
      }
      
      // Other objects
      for (let b of flippers)  b.collide(a);
      for (let c of colliders) c.collide(a);
      for (let s of sinks)     s.collide(a);

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
  let btnA = false;
  let btnB = false;

  const render = () => {
    rafref = requestAnimationFrame(render);

    const start = performance.now();
    const now = performance.now()/1000;
    const dt = (now - lastTime) * TIME_SCALE;

    cameraY = nsin(now/2) * world.h;

    flipperA.active = btnA;
    flipperB.active = btnB;

    for (let i = 0; i < substeps; i++) {
      flipperA.update(dt/substeps);
      flipperB.update(dt/substeps);
      update(dt/substeps);
    }

    lastTime = now;
    balls = balls; // poke

    // if delta is the time taken to simulate this whole frame, then
    // we can calculate how many substeps we can pack into the next frame
    delta = performance.now() - start;
    substeps = max(8, min(100, floor(substeps * (1000/60)/delta * SUBSTEP_FACTOR)));
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

  $: viewAspect = innerWidth / innerHeight;

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

<!--
    bind:width={innerWidth}
    bind:height={innerHeight}
-->
<div>
  <CanvasRenderer
    {balls}
    {colliders}
    {flippers}
    {sinks}
    {world}
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

