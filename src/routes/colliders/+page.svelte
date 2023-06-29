<script lang="ts">

  import { onMount } from 'svelte';

  import CanvasRenderer from '$comp/CanvasRenderer.svelte';

  import Vec2 from "$lib/Vec2";
  import Ball from "$lib/Ball";
  import Rect from "$lib/Rect";

  import { Collider, Circle, Segment, Capsule } from "$lib/Collider";

  const { PI, pow, floor, min, max, abs, random, sqrt } = Math;


  // World

  let world = new Rect(0, 0, 200, 200);
  let balls:Ball[] = [ ];
  let colliders:Collider[] = [ ];


  // Main physics updater

  const updateVertlet = (dt:number) => {
    for (let a of balls) {
      a.impart(Vec2.fromXY(0, -1000));

      for (let b of balls) {
        if (a === b) continue;
        b.collide(a);
      }

      for (let c of colliders) {
        c.collide(a);
      }

      world.collideInterior(a);
      a.simulate(dt);
    }
  }


  // Render loop

  const TIME_SCALE = 0.1;

  let lastTime = performance.now()/1000 * TIME_SCALE;
  let rafref = 0;

  const render = () => {
    rafref = requestAnimationFrame(render);

    const now = performance.now()/1000 * TIME_SCALE;
    const dt = (now - lastTime);

    colliders[0].pos.x = 50 * Math.cos(10 * now);
    colliders[0].pos.y = 50 * Math.sin(10 * now);
    colliders[0].tip.x = 50 * Math.cos(10 * now + PI);
    colliders[0].tip.y = 50 * Math.sin(10 * now + PI);

    colliders[1].pos.x = 50 * Math.cos(PI/2 + 10 * now);
    colliders[1].pos.y = 50 * Math.sin(PI/2 + 10 * now);
    colliders[1].tip.x = 50 * Math.cos(PI/2 + 10 * now + PI);
    colliders[1].tip.y = 50 * Math.sin(PI/2 + 10 * now + PI);

    if (balls.length < 10) {
      balls.push(Ball.randomAt(0, 190));
    }

    for (let i = 0; i < 8; i++) {
      for (let b of balls) {
        updateVertlet(dt/8);
      }
    }

    lastTime = now;
    balls = balls; // poke
  }


  // Lifecycle stuff

  let innerWidth = 0;
  let innerHeight = 0;

  onMount(() => {

    // Create Scene
    //balls.push(Ball.randomAt(0, 190));
    //balls.push(Ball.randomAt(0, -20));

    //colliders.push(new Circle(Vec2.fromXY(-10, -50), 10));
    //colliders.push(new Circle(Vec2.fromXY( 10, 50), 10));
    
    colliders.push(new Capsule(Vec2.fromXY(50, 50), Vec2.fromXY(-50,  -50), 10));
    colliders.push(new Segment(Vec2.fromXY(-50,  50), Vec2.fromXY(50, -50)));

    render();

    // Destroy
    return () => cancelAnimationFrame(rafref);
  });

</script>


<svelte:window bind:innerWidth bind:innerHeight />

<div>
  <CanvasRenderer {balls} {colliders} {world} {TIME_SCALE} bind:width={innerHeight} bind:height={innerHeight} />
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

