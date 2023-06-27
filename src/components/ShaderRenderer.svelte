<script lang="ts">
  import type Ball from '$lib/Ball';
  import type Rect from '$lib/Rect';

  import Vader from '../vader';

  export let balls:Ball[] = [];
  export let world:Rect;

  export let width:number;
  export let height:number;

  const toVec3 = ({ pos, rad }:Ball) => [ pos.x, pos.y, rad ];

</script>


<Vader scale={1} pixelated aspect={width/height}
  u_world={[ world.w, world.h ]}
  u_balls={balls.map(toVec3)}
  u_num_balls={balls.length}
  u_colors={balls.map(b => b.color)}
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
    uniform vec4 u_colors[MAX_BALLS];

    float nsin (float n) {
      return 0.5 + 0.5 * sin(n * PI);
    }

    float limit (float n) {
      return clamp(n, 0.0, 1.0);
    }

    void main () {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy * u_world - u_world/2.0;
      float px = 2.0 / u_resolution.x * u_world.x;

      vec3 bg = vec3(0.1); // mix(vec3(0.3), vec3(0.1), 1.0 - smoothstep(u_world.x/2.0, u_world.x/2.0 + px, length(uv)));
      vec3 c = vec3(0.0);
      vec3 bloom = vec3(0.0);
      float mask = 0.0;

      for (int i = 0; i < MAX_BALLS; i++) {
        vec3 ball = u_balls[i];
        vec3 col = u_colors[i].xyz;

        float a = 1.0 - smoothstep(ball.z - px, ball.z + px, length(uv - ball.xy));
        mask = clamp(mask + a, 0.0, 1.0);
        c += col * a;

        bloom += exp(-pow(length(uv - ball.xy) / ball.z, 4.0)) * col * (1.0 - mask);
      }

      vec3 base = mix(bg, c, mask);

      gl_FragColor = vec4(base, 1.0);
    }
  </script>
</Vader>


<style>

  :global(.Vader) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #212121;
    z-index: 0;
  }

</style>
