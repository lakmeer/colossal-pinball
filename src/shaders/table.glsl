
// SETUP

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D u_tex_base;
uniform sampler2D u_tex_face;
uniform sampler2D u_tex_hair;
uniform sampler2D u_tex_bump;
uniform sampler2D u_tex_misc;

const vec3 WHITE = vec3(1.000, 1.000, 1.000);
const vec3 BLACK = vec3(0.000, 0.000, 0.000);

const vec3 BG_WHITE  = vec3(0.991, 0.991, 0.991);
const vec3 BG_GREEN  = vec3(0.588, 0.757, 0.082);
const vec3 BG_ORANGE = vec3(0.949, 0.588, 0.082);
const vec3 BG_BLUE   = vec3(0.365, 0.643, 0.659);
const vec3 BG_RED    = vec3(0.780, 0.184, 0.325);

const vec3 BUMPER_GREEN = vec3(0.090, 0.467, 0.216);
const vec3 BUMPER_BLUE  = vec3(0.223, 0.306, 0.623);
const vec3 BUMPER_WHITE = vec3(0.851, 0.851, 0.851);


// FUNCTIONS

float nsin (float x) {
  return sin(x) * 0.5 + 0.5;
}

vec4 layer (sampler2D source, vec2 uv, vec3 r, vec3 g, vec3 b) {
  vec4 tex = texture2D(source, uv);
  return vec4(tex.r * r + tex.g * g + tex.b * b, tex.a);
}


// MAIN

void main () {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv = vec2(uv.x, 1.0 - uv.y);

  vec4 rainbow = vec4(
    nsin(uv.x + u_time * 2.5),
    nsin(uv.y + u_time * 3.0),
    0.5,
    1.0);


  // Colorize layers

  vec4 base = layer(u_tex_base, uv, BG_ORANGE, BG_GREEN, BG_WHITE);
  vec4 face = layer(u_tex_face, uv, BG_RED, BG_GREEN, BG_BLUE);
  vec4 hair = layer(u_tex_hair, uv, BG_RED, BG_ORANGE, BG_WHITE);
  vec4 bump = layer(u_tex_bump, uv, BUMPER_WHITE, BUMPER_GREEN, BUMPER_BLUE);

  float playfield_alpha = base.a;
  float plastics_alpha  = bump.a;


  // Blended layers

  vec4 playfield = mix(
    vec4(uv.y, 0.5, 0.5, 1.0),
    mix(base,
      mix(face, hair, hair.a), face.a + hair.a),
    playfield_alpha 
  );

  vec4 plastics = bump;


  // Output

  vec4 final = mix(playfield, plastics, plastics_alpha);

  gl_FragColor = vec4(final.rgb, 1.0);

}
