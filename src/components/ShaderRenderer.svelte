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

      vec3 c = vec3(0.0);

      for (int i = 0; i < MAX_BALLS; i++) {
        vec3 ball = u_balls[i];
        vec3 col = u_colors[i].xyz;
        float intensity =
          exp(-pow(length(uv - ball.xy) / ball.z, 2.0))
          + 1.0 - smoothstep(ball.z, ball.z + px, length(uv - ball.xy));

        c += col * intensity;
      }

      gl_FragColor = vec4(c, 1.0);
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
