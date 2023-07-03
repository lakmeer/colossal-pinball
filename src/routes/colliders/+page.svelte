<script lang="ts">

  import { onMount } from 'svelte';

  import CanvasRenderer from '$comp/CanvasRenderer.svelte';

  import Vec2 from "$lib/Vec2";
  import Ball from "$lib/Ball";
  import Rect from "$lib/Rect";
  import Sink from "$lib/Sink";

  import { Collider, Circle, Arc, Segment, Capsule } from "$lib/Collider";

  const { PI, pow, floor, min, max, abs, random, sqrt } = Math;


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
        if (a === b) continue;
        b.collide(a);
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
    rafref = requestAnimationFrame(render);

    const now = performance.now()/1000 * TIME_SCALE;
    const dt = (now - lastTime);

    if (now - lastEmit > 0.7) {
      if (balls.length < 50) {
        lastEmit = now;
        balls.push(Ball.randomAt(-30, 90));
        balls.push(Ball.randomAt(60, 90));
        balls.push(Ball.randomAt(-90, 90));
      }
    }

    colliders[0].turn(PI * dt);
    //colliders[0].pos.x = 30 + 30 * Math.cos(-now);
    //colliders[0].pos.y = 30 + 30 * Math.sin(-now);
    //colliders[0].tip.x = 30 + 30 * Math.cos(-now + PI);
    //colliders[0].tip.y = 30 + 30 * Math.sin(-now + PI);

    for (let i = 0; i < 8; i++) {
      update(dt/8);
    }

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


    colliders.push(Arc.at(50, 50, 30, -PI*2/3, 0));

    //colliders.push(new Circle(Vec2.fromXY(-100, -100), 10));
    //colliders.push(new Circle(Vec2.fromXY(0, 0), 30));
    //colliders.push(Circle.inverted(0, 0, 30));

    colliders.push(new Capsule(Vec2.fromXY(-40, 10), Vec2.fromXY(40, -10), 10));

    colliders.push(new Segment(Vec2.fromXY(-100, 80), Vec2.fromXY(-80, 70)));
    colliders.push(new Segment(Vec2.fromXY(-50,  60), Vec2.fromXY(-70, 50)));
    colliders.push(new Segment(Vec2.fromXY(-100, 40), Vec2.fromXY(-80, 30)));
    colliders.push(new Segment(Vec2.fromXY(-50,  20), Vec2.fromXY(-70, 10)));

    sinks.push(Sink.from(Circle.at( 100, -100, 20)));
    sinks.push(Sink.from(Circle.at(-100, -100, 20)));

    render();

    // Destroy
    return () => cancelAnimationFrame(rafref);
  });

</script>


<svelte:window bind:innerWidth bind:innerHeight />

<div>
  <CanvasRenderer {sinks} {balls} {colliders} {world} {TIME_SCALE} bind:width={innerHeight} bind:height={innerHeight} />
</div>



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
</style>

