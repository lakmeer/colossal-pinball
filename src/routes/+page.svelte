<script lang="ts">

  import { onMount, afterUpdate } from 'svelte';

  import Vec2 from "$lib/Vec2";
  import Ball from "$lib/Ball";
  import Rect from "$lib/Rect";

  import CanvasRenderer from '../components/CanvasRenderer.svelte';
  import ShaderRenderer from '../components/ShaderRenderer.svelte';

  const { pow, random, min, max, abs, sqrt, floor } = Math;

  type Circle = {
    pos:Vec2,
    rad:number
  }

  type Capsule ={
    a:Vec2,
    b:Vec2,
    rad:number
  }


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
  //const BOUNDARY_FRICTION = 0.9;
  const COLLISION_FRICTION = 0.98;
  const MAX_VEL = 1000;


  // World

  let world = new Rect(0, 0, 100, 100);
  //let boundary = world.w/2;
  let balls:Ball[] = [ ];

  for (let i = 0; i < MAX_BALLS; i++) {
    balls.push(Ball.random(world));
  }

  let capsules:Capsule[] = [
    {
      a: Vec2.from(-25, -40),
      b: Vec2.from(-45, -30),
      rad: 5
    },
    {
      a: Vec2.from(25, -40),
      b: Vec2.from(45, -30),
      rad: 5
    }
  ]


  // Physics

  // Collision functions should return the correction vector from object A to object B.
  // It's up to the caller to apply the correction to the objects however they wish.

  const collideCircleCircle = (a:Circle, b:Circle):Vec2|false => {
    let axis = a.pos.sub(b.pos);
    let dist = axis.len();
    if (dist < a.rad + b.rad) return axis.withLen((a.rad + b.rad) - dist);
    return false;
  }

  const collideCircleCapsule = (a:Circle, b:Capsule):Vec2|false => {
    let closest = closestPointOnLine(a.pos, b.a, b.b);
    let axis = a.pos.sub(closest);
    let dist = axis.len();
    if (dist < a.rad + b.rad) return axis.withLen((a.rad + b.rad) - dist);
    return false;
  }

  const collideCircleRectInterior = (a:Circle, b:Rect):Vec2|false => {
    if (a.pos.x < b.left   + a.rad) return Vec2.from( a.rad - (a.pos.x - b.left), 0);
    if (a.pos.x > b.right  - a.rad) return Vec2.from((b.right - a.pos.x) - a.rad, 0);
    if (a.pos.y < b.bottom + a.rad) return Vec2.from(0, a.rad - (a.pos.y - b.bottom));
    if (a.pos.y > b.top    - a.rad) return Vec2.from(0, (b.top  -  a.pos.y) - a.rad);
    return false;
  }


  const closestPointOnLine = (p:Vec2, a:Vec2, b:Vec2):Vec2 => {
    const ap = p.sub(a);
    const ab = b.sub(a);

    const ab2 = ab.dot(ab);
    const ap_ab = ap.dot(ab);

    const t = ap_ab / ab2;

    if (t < 0) return a;
    if (t > 1) return b;

    return new Vec2( a[0] + ab[0] * t, a[1] + ab[1] * t);
  }


  const updateVertlet = (dt:number) => {

    // Gravity
    for (let ball of balls) {
      ball.acc.addSelf(Vec2.from(0, -GRAVITY));
      ball.friction = 1;
    }

    // Collisions
    for (let a of balls) {

      // With other balls
      for (let b of balls) {
        if (a === b) continue;
        let delta = collideCircleCircle(a, b);
        // Apply correction half each
        if (delta) {
          a.pos.addSelf(delta.scale(1/2));
          b.pos.subSelf(delta.scale(1/2));
          a.friction *= pow(1 - (1 - COLLISION_FRICTION), 1/substeps);
          b.friction *= pow(1 - (1 - COLLISION_FRICTION), 1/substeps);
        }
      }

      // With capsules
      for (let b of capsules) {
        let delta = collideCircleCapsule(a, b);
        // Whole correction goes to the ball cos the capsule is immovable
        if (delta) {
          a.pos.addSelf(delta);
          a.friction *= pow(1 - (1 - COLLISION_FRICTION), 1/substeps);
        }
      }
    }

    // Circular boundary
    /*
    for (let ball of balls) {
      if (ball.pos.len() > boundary - ball.rad) {
        ball.pos.set(ball.pos.norm().scale(boundary - ball.rad));
        ball.friction *= pow(1 - (1 - BOUNDARY_FRICTION), 1/substeps);
      }
    }
    */

    // Recangular boundary

    for (let ball of balls) {
      let delta = collideCircleRectInterior(ball, world);
      if (delta) {
        ball.pos.addSelf(delta);
        ball.friction *= pow(1 - (1 - COLLISION_FRICTION), 1/substeps);
      }
    }

    for (let ball of balls) {
      const displacement = ball.pos.sub(ball.pos_);
      ball.pos_.set(ball.pos.clone());
      ball.vel.set(displacement.add(ball.acc.scale(dt * dt)).scale(ball.friction));
      if (ball.vel.len() > MAX_VEL * dt) ball.vel.normSelf().scaleSelf(MAX_VEL * dt);
      ball.pos.addSelf(ball.vel);
    }

    // Reset
    for (let ball of balls) {
      ball.acc.set2(0, 0);
    }
  }


  // Render loop

  let lastTime = performance.now()/1000 * TIME_SCALE;
  let rafref = 0;
  let substeps = 8;
  let delta = 0;
  let clicked = false;

  const render = () => {
    let start = performance.now();

    rafref = requestAnimationFrame(render);

    const now = performance.now()/1000 * TIME_SCALE;
    const dt = now - lastTime;

    for (let i = 0; i < substeps; i++) {
      updateVertlet(dt/substeps);
    }

    lastTime = now;

    // poke
    balls = balls;

    // if delta is the time taken to simulate this whole frame, then
    // we can calculate how many substeps we can pack into the next frame
    delta = performance.now() - start;
    substeps = max(8, min(100, floor(substeps * (1000/60)/delta * SUBSTEP_FACTOR)));
  }

  onMount(() => {
    render();

    // Spawn new balls
    document.addEventListener('mousedown', () => { clicked = true; });
    document.addEventListener('mouseup',   () => { clicked = false; });
    document.addEventListener('mousemove', (event) => {
      if (clicked) {
        let x = event.clientX / innerWidth  - 0.5;
        let y = event.clientY / innerHeight - 0.5;
        let b = Ball.at(world.w * x, world.h * -y);
        balls.push(b);
      }
    });

    return () => cancelAnimationFrame(rafref);
  });

  let innerWidth = 0;
  let innerHeight = 0;

</script>


<svelte:window bind:innerWidth bind:innerHeight />


<CanvasRenderer {balls} {capsules} {world} bind:width={innerWidth} bind:height={innerHeight} />
<!--
<ShaderRenderer {balls} {capsules} {world} bind:width={innerWidth} bind:height={innerHeight} />
-->

<pre class="debug">
Balls: {balls.length}
Steps: {substeps}
Time: {delta.toFixed(3)}
</pre>


<style>
  :global(.Vader) {
    z-index: 0;
  }

  :global(.TwoDee) {
    z-index: 1;
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

