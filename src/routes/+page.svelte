<script lang="ts">

  import { onMount, afterUpdate } from 'svelte';

  import Vec2 from "$lib/Vec2";
  import Ball from "$lib/Ball";
  import Rect from "$lib/Rect";

  import CanvasRenderer from '../components/CanvasRenderer.svelte';
  import ShaderRenderer from '../components/ShaderRenderer.svelte';

  const { pow, random, min, max, abs, sqrt, floor } = Math;


  //
  // TODO
  //
  // - Whole game state as object, pass to renderer, make reactive
  //


  // Config

  const MODE = 'canvas' as 'canvas' | 'shader';
  const GRAVITY = 1000;
  const TIME_SCALE = 1.1;
  const BOUNCE_DAMPING = 1;
  const ROLL_DAMPING = 0.99;
  const SUBSTEP_FACTOR = 0.5; // Use no more than half the frame time
  const MAX_BALLS = 20;
  const BOUNDARY_FRICTION = 0.9;
  const COLLISION_FRICTION = 0.98;


  // World

  let world = new Rect(0, 0, 100, 100);
  let boundary = world.w/2;
  let balls:Ball[] = [ ];

  for (let i = 0; i < MAX_BALLS; i++) {
    balls.push(Ball.random(world));
  }


  // Physics

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

  const updateVertlet = (ball:Ball, dt:number) => {

    // Gravity
    ball.acc.addSelf(Vec2.from(0, -GRAVITY * ball.mass));

    // Friction
    let friction = 1;

    // Collisions
    for (let i in balls) {
      const other = balls[i];
      if (other === ball) continue;

      let axis = other.pos.sub(ball.pos);
      let dist = axis.len();
      axis.normSelf();

      if (dist < ball.rad + other.rad) {
        let delta = (ball.rad + other.rad) - dist;
        ball.pos.addSelf(axis.scale(-delta/2));
        other.pos.addSelf(axis.scale(delta/2));
      }
    }

    // Circular boundary
    if (ball.pos.len() > boundary - ball.rad) {
      ball.pos.set(ball.pos.norm().scale(boundary - ball.rad));
      friction *= pow(1 - (1 - BOUNDARY_FRICTION), 1/substeps);
    }

    // Update
    const displacement = ball.pos.sub(ball.pos_);
    ball.pos_.set(ball.pos.clone());
    ball.vel.set(displacement.add(ball.acc.scale(dt * dt)).scale(friction));
    ball.pos.addSelf(ball.vel);
    ball.acc.set2(0, 0);

    // Recangular boundary
    /*
    // Left collision
    if (ball.pos.x < world.left + ball.rad) {
      ball.pos.x = world.left + ball.rad;
      ball.vel.x *= -BOUNCE_DAMPING;
    }

    // Right collision
    if (ball.pos.x > world.right - ball.rad) {
      ball.pos.x = world.right - ball.rad;
      ball.vel.x *= -BOUNCE_DAMPING;
    }

    // Bottom collision
    if (ball.pos.y < world.bottom + ball.rad) {
      ball.pos.y = world.bottom + ball.rad;
      ball.vel.y *= -BOUNCE_DAMPING;
    }

    // Top collision
    if (ball.pos.y > world.top - ball.rad) {
      ball.pos.y = world.top - ball.rad;
      ball.vel.y *= -BOUNCE_DAMPING;
    }
    */
  }


  // Render loop

  let running = true;
  let lastTime = performance.now()/1000 * TIME_SCALE;
  let rafref = 0;
  let substeps = 8;
  let delta = 0;

  const render = () => {
    let start = performance.now();

    rafref = requestAnimationFrame(render);

    const now = performance.now()/1000 * TIME_SCALE;
    const dt = now - lastTime;

    for (let i = 0; i < substeps; i++) {
      for (let ball of balls) {
        updateVertlet(ball, dt/substeps);
      }
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

    document.addEventListener('click', (event) => {
      let x = event.clientX / innerWidth  * 2;
      let y = event.clientY / innerHeight * 2;
      let b = Ball.at(0, 0);
      balls.push(b);
    });
  
    return () => cancelAnimationFrame(rafref);
  });

  let innerWidth = 0;
  let innerHeight = 0;

</script>


<svelte:window bind:innerWidth bind:innerHeight />


<CanvasRenderer {balls} {world} bind:width={innerWidth} bind:height={innerHeight} />
<!--
<ShaderRenderer {balls} {world} bind:width={innerWidth} bind:height={innerHeight} />
-->

<pre class="debug">
Balls: {balls.length}
Steps: {substeps}
Time: {delta.toFixed(3)}
Mntm: {balls.reduce((acc, ball) => acc + ball.vel.len() * ball.mass, 0).toFixed(2)}
Heat: ??
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

