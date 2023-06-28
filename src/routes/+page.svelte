<script lang="ts">

  import type { Circle, Capsule } from "$types";

  import { onMount } from 'svelte';

  import Flipper from "$lib/Flipper";
  import Vec2    from "$lib/Vec2";
  import Ball    from "$lib/Ball";
  import Rect    from "$lib/Rect";

  import CanvasRenderer from '../components/CanvasRenderer.svelte';
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
  //const BOUNDARY_FRICTION = 0.9;
  const COLLISION_FRICTION = 0.98;
  const MAX_VEL = 1000;


  // World

  //let boundary = world.w/2;
  let world = new Rect(0, 0, 100, 100);
  let balls:Ball[] = [ ];
  let sink:Circle = { pos: Vec2.fromXY(0, -70), rad: 30 };

  const spawn = (pos:Vec2) => {
    balls.push(Ball.at(pos.x, pos.y));
  }

  const erase = (pos:Vec2, rad = 20) => {
    for (let i = balls.length - 1; i >= 0; i--) {
      let b = balls[i];
      if (b.pos.dist(pos) < rad) {
        balls.splice(i, 1);
      }
    }
  }

  for (let i = 0; i < MAX_BALLS; i++) {
    balls.push(Ball.random(world));
  }

  let capsules:Capsule[] = [];
                                        //  pos, rad, len, rest, range, speed
  let flipperA = new Flipper(Vec2.fromXY(-50, -30), 3, 25, 0  - PI/8,  PI/4, 40);
  let flipperB = new Flipper(Vec2.fromXY( 50, -30), 3, 25, PI + PI/8, -PI/4, 40);

  const flippers = [ flipperA, flipperB ];


  // Physics

  // Collision functions should return the correction vector from object A to object B.
  // It's up to the caller to apply the correction to the objects however they wish.

  const collideCircleCircle = (a:Circle, b:Circle):Vec2|false => {
    let axis = a.pos.sub(b.pos);
    let dist = axis.len();
    if (dist === 0 || dist > a.rad + b.rad) return false;
    return axis.withLen((a.rad + b.rad) - dist);
  }

  const collideCircleCapsule = (a:Circle, b:Capsule):Vec2|false => {
    return collideCircleCircle(a, { pos: closestPointOnLine(a.pos, b.a, b.b), rad: b.rad });
  }

  const collideCircleRectInterior = (a:Circle, b:Rect):Vec2|false => {
    if (a.pos.x < b.left   + a.rad) return Vec2.fromXY(a.rad - (a.pos.x - b.left), 0);
    if (a.pos.x > b.right  - a.rad) return Vec2.fromXY((b.right - a.pos.x)- a.rad, 0);
    if (a.pos.y < b.bottom + a.rad) return Vec2.fromXY(0, a.rad - (a.pos.y - b.bottom));
    if (a.pos.y > b.top    - a.rad) return Vec2.fromXY(0, (b.top - a.pos.y) - a.rad);
    return false;
  }

  const closestPointOnLine = (p:Vec2, a:Vec2, b:Vec2):Vec2 => {
    const ap = p.sub(a);
    const ab = b.sub(a);
    const t  = ap.dot(ab) / ab.dot(ab);
    if (t < 0) return a;
    if (t > 1) return b;
    return new Vec2( a[0] + ab[0] * t, a[1] + ab[1] * t);
  }


  // Main physics updater

  const updateVertlet = (dt:number) => {

    // 'Fractional friction factor' - adjusted for number of steps
    const fff = pow(1 - (1 - COLLISION_FRICTION), 1/substeps);

    // Gravity
    for (let ball of balls) {
      ball.acc.addSelf(Vec2.fromXY(0, -GRAVITY));
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
          a.friction *= fff;
          b.friction *= fff;
        }
      }

      // With flippers
      for (let flipper of flippers) {
        let delta = collideCircleCapsule(a, flipper.capsule);
        // Whole correction goes to the ball cos the flipper is immovable
        if (delta) {
          a.pos.addSelf(delta);
          a.friction *= fff;
        }
      }

      // With capsules
      for (let b of capsules) {
        let delta = collideCircleCapsule(a, b);
        // Whole correction goes to the ball cos the capsule is immovable
        if (delta) {
          a.pos.addSelf(delta);
          a.friction *= fff;
        }
      }
    }

    // Circular boundary
    // for (let ball of balls) {
    //   if (ball.pos.len() > boundary - ball.rad) {
    //     ball.pos.set(ball.pos.norm().scale(boundary - ball.rad));
    //     ball.friction *= pow(1 - (1 - BOUNDARY_FRICTION), 1/substeps);
    //   }
    // }

    // Recangular boundary
    for (let ball of balls) {
      let delta = collideCircleRectInterior(ball, world);
      if (delta) {
        ball.pos.addSelf(delta);
        ball.friction *= pow(1 - (1 - COLLISION_FRICTION), 1/substeps);
      }
    }

    // Apply verlet integration
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

  onMount(() => {
    render();

    // Spawn new balls
    document.addEventListener('mousedown', (event) => {
      switch (event.button) {
        case 0: spawnAt(event); clicked = true; break;
        case 1: eraseAt(event); erasing = true; break;
      }
    });
    document.addEventListener('mouseup',   () => { clicked = false; erasing = false; });
    document.addEventListener('mousemove', (event) => {
      if (clicked) spawnAt(event);
      if (erasing) eraseAt(event);
    });

    // Flip paddles
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'a': btnA = true; break;
        case 's': btnB = true; break;
      }
    });

    document.addEventListener('keyup', (event) => {
      switch (event.key) {
        case 'a': btnA = false; break;
        case 's': btnB = false; break;
      }
    });

    return () => cancelAnimationFrame(rafref);
  });

  let innerWidth = 0;
  let innerHeight = 0;

</script>


<svelte:window bind:innerWidth bind:innerHeight />


<div>
  <CanvasRenderer {balls} {flippers} {capsules} {sink} {world} bind:width={innerHeight} bind:height={innerHeight} />
  <!--
  <ShaderRenderer {balls} {flippers} {capsules} {sink} {world} bind:width={innerWidth} bind:height={innerHeight} />
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

