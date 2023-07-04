<script lang="ts">
  import CanvasRenderer from '$comp/CanvasRenderer.svelte';

  import { onMount } from 'svelte';

  import Vec2 from "$lib/Vec2";
  import Ball from "$lib/Ball";
  import Rect from "$lib/Rect";
  import type Sink from "$lib/Sink";

  import type { Collider } from "$lib/Collider";
  import { Circle, Arc, Segment, Capsule, Fence, Box } from "$lib/Collider";

  import { TAU, last, pow, floor, min, max, abs, random, sqrt } from "$lib/utils";

  import store, { debug, reset } from "$src/stores/debug";


  // World

  let world = new Rect(0, 0, 200, 200);
  let balls:Ball[] = [];
  let colliders:Collider[] = [];
  let sinks:Sink[] = [];

  const spawn = (pos:Vec2) => {
    balls.push(Ball.randomAt(pos.x, pos.y));
  }


  // Main physics updater

  const update = (dt:number) => {
    for (let ix in balls) {

      const a = balls[ix];

      a.impart(Vec2.fromXY(0, -1000));

      for (let b of balls) {
        if (a !== b) b.collide(a);
      }

      for (let c of colliders) {
        c.collide(a);
      }

      for (let s of sinks) {
        s.collide(a);
      }

      world.collideInterior(a);
      a.simulate(dt);

      if (a.cull) {
        balls.splice(parseInt(ix), 1);
      }
    }
  }


  // Render loop

  const TIME_SCALE = 1.0;

  let lastTime = performance.now()/1000 * TIME_SCALE;
  let rafref = 0;
  let lastEmit = lastTime;

  const render = () => {
    reset();

    rafref = requestAnimationFrame(render);

    const now = performance.now()/1000 * TIME_SCALE;
    const dt = (now - lastTime);

    if (now - lastEmit > 0.7) {
      if (balls.length < 50) {
        lastEmit = now;
        balls.push(Ball.randomAt(60, 90));
      }
    }

    for (let i = 0; i < 8; i++) {
      update(dt/8);
    }

    //debug( last(colliders).closest(Vec2.fromXY(0, 0)) );

    colliders[2].turn(0.15);
    colliders[3].turn(0.15);
    colliders[4].turn(0.15);
    colliders[5].turn(-0.15);
    colliders[6].turn(0.15);
    colliders[8].turn(0.15);

    lastTime = now;
    balls = balls; // poke
  }


  // Lifecycle stuff

  let innerWidth = 0;
  let innerHeight = 0;

  onMount(() => {
    console.clear();

    // Gallery of collider types

    colliders.push(Circle.at(-66, 66, 25));
    colliders.push(Circle.invert(0, 66, 25));
    colliders.push(Capsule.at(66 - 12, 66 - 12, 66 + 12, 66 + 12, 12.5));

    colliders.push(Arc.at(-66, 0, 25, TAU * 2/8, 0));
    colliders.push(Arc.at(  0, 0, 25, TAU * 4/8, 0));
    colliders.push(Arc.at( 66, 0, 25, TAU * 6/8, 0));

    colliders.push(Segment.at(-66 - 12, -66 + 12, -66 + 12, -66 + 12));
    colliders.push(Segment.at(-66 + 12, -66 - 12, -66 - 12, -66 - 12));

    colliders.push(Box.at(0, -66, 35, 35, 0));

    let fenceVertices = [];
    for (let i = 0; i >= -8; i--) { // Go backwards cos segment normals are right-handed
      fenceVertices.push(Vec2.fromXY(66, -66).add(Vec2.fromAngle(TAU * i/8, 25)));
    }
    colliders.push(Fence.at(...fenceVertices));

    render();

    // Destroy
    return () => cancelAnimationFrame(rafref);
  });

</script>


<svelte:window bind:innerWidth bind:innerHeight />

<div>
  <CanvasRenderer {sinks} {balls} {colliders} {world} {TIME_SCALE} bind:width={innerHeight} bind:height={innerHeight} />
</div>

<pre>
🟢 {$store.join('\n🟢 ')}
</pre>


<style>

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

