<script lang="ts">
  import CanvasRenderer from '$comp/CanvasRenderer.svelte';

  import { onMount } from 'svelte';

  import Vec2 from "$lib/Vec2";
  import Ball from "$lib/Ball";
  import Rect from "$lib/Rect";
  import Sink from "$lib/Sink";
  import Zone from "$lib/Zone";

  import { Collider, Circle, Arc, Segment, Capsule, Fence } from "$lib/Collider";

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
        balls.splice(ix, 1);
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
        //balls.push(Ball.randomAt(-74, 90));
        //balls.push(Ball.randomAt(60, 90));
        //balls.push(Ball.randomAt(-90, 90));
      }
    }

    for (let i = 0; i < 8; i++) {
      update(dt/8);
    }

    //debug( last(colliders).closest(Vec2.fromXY(0, 0)) );

    colliders[3].end = (now * TAU * 3/8) % TAU;
    colliders[4].end = (now * TAU * 3/8) % TAU;
    colliders[5].turn(0.25);

    lastTime = now;
    balls = balls; // poke
  }


  // Lifecycle stuff

  let innerWidth = 0;
  let innerHeight = 0;

  onMount(() => {
    console.clear();

    // Create Scene
    //balls.push(Ball.randomAt(0, 190));
    //balls.push(Ball.randomAt(30, 0));

    // subsemi
    colliders.push(Arc.at(-60,  60, 25, 0, TAU * 2/8));
    // semi
    colliders.push(Arc.at(  0,  60, 25, 0, TAU * 4/8));
    // supersemi
    colliders.push(Arc.at( 60,  60, 25, 0, TAU * 6/8));

    // subsemi over boundary
    colliders.push(Arc.at(-60,   0, 25, TAU * 0/8, TAU * 4/8));
    // animated negative
    colliders.push(Arc.at(  0,   0, 25, TAU * 4/8, TAU * 8/8));
    // supersemi over boundary
    colliders.push(Arc.at( 60,   0, 25, TAU * 0/8, TAU * 2/8));

    // subsemi negative
    //colliders.push(Arc.at(-60, -60, 25, TAU * 6/8, TAU * 4/8));
    // semi negative
    //colliders.push(Arc.at(  0, -60, 25, TAU * 4/8, TAU * 0/8));
    // supersemi negative
    //colliders.push(Arc.at( 60, -60, 25, TAU * 4/8, TAU * 2/8));


/*
    colliders.push(Arc.at(-50, 50, 30, 0, TAU * 3/9));
    last(colliders).turn(TAU * 4/8);
    colliders.push(Segment.at(-35, 23, 30, 70));
    colliders.push(Segment.at(-79, 80, -80, 50));

    colliders.push(Arc.at(25, -30, 50, 0, TAU * 6/8));
    last(colliders).turn(TAU * 2/8);

    colliders.push(new Zone(Circle.at(0, 0, Vec2.fromXY(200, 200))));

    //colliders.push(new Circle(Vec2.fromXY(-100, -100), 10));
    //colliders.push(new Circle(Vec2.fromXY(0, 0), 30));
    //colliders.push(Circle.inverted(0, 0, 30));

    //colliders.push(new Capsule(Vec2.fromXY(-40, 10), Vec2.fromXY(40, -10), 10));

    //colliders.push(new Segment(Vec2.fromXY(-100, 80), Vec2.fromXY(-80, 70)));
    //colliders.push(new Segment(Vec2.fromXY(-70,  50), Vec2.fromXY(-50, 60)));
    //colliders.push(new Segment(Vec2.fromXY(-100, 40), Vec2.fromXY(-80, 30)));
    //colliders.push(new Segment(Vec2.fromXY(-70,  10), Vec2.fromXY(-50, 20)));
    //colliders.push(new Segment(Vec2.fromXY(-100,  0), Vec2.fromXY(-80,-10)));

    //colliders.push(new Segment(Vec2.fromXY(100, 20), Vec2.fromXY(80,  20)));

    //colliders.push(Fence.at( Vec2.fromXY(-70, -40), Vec2.fromXY(-30, -60), Vec2.fromXY( 30, -60), Vec2.fromXY( 70, -80),));

    sinks.push(Sink.from(Circle.at( 100, -100, 20)));
    //sinks.push(Sink.from(Circle.at(-100, -100, 20)));
*/

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

