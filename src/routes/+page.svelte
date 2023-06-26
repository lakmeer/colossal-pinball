<script lang="ts">
  import { onMount } from 'svelte';

  // Renderer

  import Vader from '../vader';

  let innerWidth = 0;
  let innerHeight = 0;


  // Config

  const GRAVITY = 0.001;
  const TIME_SCALE = 0.1;
  const BOUNCE_DAMPING = 0.7;


  // World

  let world = {
    height: 100,
    width: 100,
  }


  // Ball

  let balls = [
    { x: 10, y: 0,  dx: -1, dy: 0, r: 2,  m: 10 },
    { x: 20, y: 10, dx: -1, dy: 0, r: 4,  m: 20 },
    { x: 30, y: 20, dx: -1, dy: 0, r: 6,  m: 30 },
    { x: 40, y: 20, dx: -1, dy: 0, r: 8,  m: 40 },
    { x: 50, y: 30, dx: -1, dy: 0, r: 10, m: 50 },
  ]


  // Loop

  let lastTime = performance.now() * TIME_SCALE;
  let rafref = 0;

  const updateBall = (ball, dt) => {

    // Physics
    ball.dy -= GRAVITY * dt * ball.m;
    ball.x += ball.dx * dt;
    ball.y += ball.dy * dt;

    // Left collision
    if (ball.x < -world.width/2 + ball.r) {
      ball.x = -world.width/2 + ball.r;
      ball.dx *= -BOUNCE_DAMPING;
    }

    // Right collision
    if (ball.x > world.width/2 - ball.r) {
      ball.x = world.width/2 - ball.r;
      ball.dx *= -BOUNCE_DAMPING;
    }

    // Bottom collision
    if (ball.y < -world.height/2 + ball.r) {
      ball.y = -world.height/2 + ball.r;
      ball.dy *= -BOUNCE_DAMPING;
    }

    // Other balls collision
    for (let other of balls) {
      if (other === ball) continue;

      let dir = { x: other.x - ball.x, y: other.y - ball.y };
      let d = length(dir);

      dir = scale(dir, 1/d); // normalize

      if (d === 0 || d > ball.r + other.r) continue;

      const corr = (ball.r + other.r - d) / 2;

      ball.x -= dir.x * corr;
      ball.y -= dir.y * corr;
      other.x += dir.x * corr;
      other.y += dir.y * corr;

      let v1 = dot2d({ x: ball.dx, y: ball.dy }, dir);
      let v2 = dot2d({ x: other.dx, y: other.dy }, dir);

      let m1 = ball.m;
      let m2 = other.m;

      let newV1 = (m1 * v1 + m2 * v2 - m2 * (v2 - v1) * BOUNCE_DAMPING) / (m1 + m2);
      let newV2 = (m1 * v1 + m2 * v2 - m1 * (v2 - v1) * BOUNCE_DAMPING) / (m1 + m2);

      ball.dx += (newV1 - v1) * dir.x;
      ball.dy += (newV1 - v1) * dir.y;
      other.dx += (newV2 - v2) * dir.x;
      other.dy += (newV2 - v2) * dir.y;
    }
  }

  const render = () => {
    cancelAnimationFrame(rafref);
    rafref = requestAnimationFrame(render);

    const now = performance.now() * TIME_SCALE;
    const dt = now - lastTime;

    ctx.fillStyle = '#004';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.save();
    ctx.translate(innerWidth/2, innerHeight/2);
    ctx.scale(innerWidth/world.width, -innerHeight/world.height);
    ctx.fillStyle = '#ff0';

    for (let ball of balls) {
      updateBall(ball, dt);
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r + 0.5, 0, 2 * Math.PI);
      ctx.fill();
    }

    lastTime = now;

    ctx.restore();

    // poke
    balls = balls;
  }

  const toVec3 = ({ x, y, r }) => [x, y, r];
  const dot2d  = (a, b) => a.x * b.x + a.y * b.y;
  const length = (a) => Math.sqrt(a.x * a.x + a.y * a.y);
  const scale  = (v, a) => ({ x: v.x * a, y: v.y * a });

  onMount(() => {
    cancelAnimationFrame(rafref);
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    ctx = canvas.getContext('2d');
    render();
  });



  // 2d renderer

  let canvas;
  let ctx;

</script>


<svelte:window bind:innerWidth bind:innerHeight />

<Vader scale={1} pixelated auto aspect={innerWidth/innerHeight}
  u_world={[ world.width, world.height ]}
  u_balls={balls.map(toVec3)}
  u_num_balls={balls.length}
  >

  <script type="x-shader/fragment+glsl">
    precision mediump float;

    uniform float u_time;
    uniform vec2 u_resolution;

    #define PI 3.141592653589
    #define MAX_BALLS VADER_STATIC(u_num_balls)

    uniform vec2 u_world;
    uniform int  u_num_balls;
    uniform vec3 u_balls[MAX_BALLS];

    float nsin (float n) {
      return 0.5 + 0.5 * sin(n * PI);
    }

    float limit (float n) {
      return clamp(n, 0.0, 1.0);
    }

    void main () {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy * u_world - u_world/2.0;
      float px = 2.0 / u_resolution.x * u_world.x;

      float c = 0.0;

      for (int i = 0; i < MAX_BALLS; i++) {
        vec3 ball = u_balls[i];
        c += exp(-pow(length(uv - ball.xy) / ball.z, 2.0))
          + 1.0 - smoothstep(ball.z, ball.z + px, length(uv - ball.xy));
      }

      gl_FragColor = vec4(c, c, 0.3, 1.0);
    }
  </script>
</Vader>

<canvas bind:this={canvas} class="TwoDee" />


<style>

  .TwoDee,
  :global(.Vader) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #212121;
    z-index: 0;
  }

  :global(.Vader) {
    opacity: 1.0;
  }

  .TwoDee {
    opacity: 0.0;
    z-index: 1;
  }

</style>
