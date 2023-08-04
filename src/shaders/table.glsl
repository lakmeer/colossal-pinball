
// SETUP

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D u_tex_rtk;
uniform sampler2D u_tex_base;
uniform sampler2D u_tex_face;
uniform sampler2D u_tex_hair;
uniform sampler2D u_tex_bump;
uniform sampler2D u_tex_logo;
uniform sampler2D u_tex_misc;
uniform sampler2D u_tex_drop;
uniform sampler2D u_tex_text;
uniform sampler2D u_tex_rings;
uniform sampler2D u_tex_lanes;
uniform sampler2D u_tex_labels;
uniform sampler2D u_tex_plastics;

uniform vec2 u_ball_pos;

const float PI  = 3.1415926535897932384626433832795;
const float EPS = 0.0001;

const float BALL_RAD = 20.0;

const vec3 WHITE = vec3(1.000, 1.000, 1.000);
const vec3 BLACK = vec3(0.000, 0.000, 0.000);

const vec3 BG_WHITE  = vec3(0.991, 0.991, 0.991);
const vec3 BG_GREEN  = vec3(0.588, 0.757, 0.082);
const vec3 BG_ORANGE = vec3(0.949, 0.588, 0.082);
const vec3 BG_BLUE   = vec3(0.365, 0.643, 0.659);
const vec3 BG_RED    = vec3(0.780, 0.184, 0.325);

const vec3 BG_BROWN = vec3(0.824, 0.682, 0.416);

const vec3 BUMPER_GREEN = vec3(0.090, 0.467, 0.216);
const vec3 BUMPER_BLUE  = vec3(0.223, 0.306, 0.623);
const vec3 BUMPER_WHITE = vec3(0.951, 0.951, 0.951);

const vec3 PLASTIC_RED    = vec3(0.892, 0.000, 0.000);
const vec3 PLASTIC_YELLOW = vec3(0.958, 0.915, 0.139);
const vec3 PLASTIC_BLUE   = vec3(0.398, 0.582, 0.833);

const vec3 BALL_COLOR = WHITE;
const vec3 LAMP_ON    = vec3(0.99, 0.9, 0.5);


// FUNCTIONS

float nsin (float x) {
  return sin(x) * 0.5 + 0.5;
}

vec4 layer (sampler2D source, vec2 uv, vec3 r, vec3 g, vec3 b) {
  vec4 tex = texture2D(source, uv);
  return vec4(tex.r * r + tex.g * g + tex.b * b, tex.a);
}

float only_r (sampler2D source, vec2 uv) { return texture2D(source, uv).r; }
float only_g (sampler2D source, vec2 uv) { return texture2D(source, uv).g; }
float only_b (sampler2D source, vec2 uv) { return texture2D(source, uv).b; }


// MAIN

void main () {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv = vec2(uv.x, 1.0 - uv.y);

  vec4 rainbow = vec4(
    nsin(uv.x + u_time * 2.5),
    nsin(uv.y + u_time * 3.0),
    0.5,
    1.0);


  // Ball radius

  float ball = 1.0 - smoothstep(BALL_RAD - EPS, BALL_RAD + EPS, length(gl_FragCoord.xy - u_ball_pos));


  // Colorize layers

  vec4 base   = layer(u_tex_base,   uv, BG_ORANGE, BG_GREEN, BG_WHITE);
  vec4 face   = layer(u_tex_face,   uv, BG_RED,
                      mix(BG_GREEN, BG_BLUE, nsin(u_time * 5.0)),
                      mix(BG_BLUE, BG_GREEN, nsin(u_time * 5.0 + PI/2.0)));
  vec4 hair     = layer(u_tex_hair,   uv, BG_WHITE, BG_ORANGE, BG_RED);
  vec4 drop     = layer(u_tex_drop,   uv, BG_WHITE, BG_BROWN, BLACK);
  vec4 bump     = layer(u_tex_bump,   uv, BUMPER_WHITE, BUMPER_GREEN, BUMPER_BLUE);
  vec4 logo     = layer(u_tex_logo,   uv, BG_WHITE, BG_GREEN, BLACK);
  vec4 rtk      = layer(u_tex_rtk,    uv, BG_BROWN, BG_BROWN, BG_BROWN);
  vec4 rings    = layer(u_tex_rings,  uv, BG_ORANGE, BG_WHITE, BG_WHITE);
  vec4 lanes    = layer(u_tex_lanes,  uv, BG_ORANGE, BG_GREEN, BG_BLUE);
  vec4 plastics = layer(u_tex_plastics, uv, PLASTIC_RED, PLASTIC_YELLOW, PLASTIC_BLUE);
  vec4 labels   = layer(u_tex_labels, uv,
                        uv.y < 0.3 ? BG_WHITE : BG_ORANGE,
                        BG_RED,
                        uv.y < 0.3 ? BG_WHITE : BG_BLUE);
  vec4 misc     = layer(u_tex_misc,   uv, WHITE, WHITE, WHITE);


  // Alphas

  float playfield_alpha = base.a;
  float plastics_alpha  = bump.a;
  float eyes_alpha      = only_g(u_tex_misc, uv);
  float lamp_alpha      = only_b(u_tex_misc, uv);
  float plastic_white   = only_r(u_tex_misc, uv);
  float text_low        = only_b(u_tex_text, uv);
  float text_high       = only_r(u_tex_text, uv);


  // Blended layers

  vec4 playfield = mix(
    vec4(nsin(uv.y * 2.0 * nsin(u_time) * PI + u_time),
         nsin(uv.x * 2.0 * nsin(u_time) * PI + u_time), 0.5, 1.0),
    mix(base,
        mix(face, hair, hair.a), face.a + hair.a),
    playfield_alpha 
  );


  // Output

  vec4 final = playfield;

  // Playfield layer
  //final = mix(final, rings, base.a);
  final = mix(final, logo, logo.a);
  final = mix(final, labels, labels.a);
  final = mix(final, drop, drop.a);
  final = mix(final, lanes, lanes.a);
  final = mix(final, vec4(BLACK, 1.0),       text_low  * clamp((-0.5 + 2.0 * nsin(u_time * 2.0)), 0.0, 1.0));
  final = mix(final, vec4(PLASTIC_RED, 1.0), text_high * clamp((-0.5 + 2.0 * nsin(u_time * 2.0 + PI)), 0.0, 1.0));

  // Mid layer
  final = mix(final, rtk, rtk.a);
  final = mix(final, vec4(LAMP_ON, 1.0) * nsin(uv.y * 4.0 + u_time * 4.0), lamp_alpha);
  final = mix(final, vec4(BALL_COLOR, 1.0), ball);

  // Top layer
  final = mix(final, bump, bump.a);
  final = mix(final, plastics, plastics.a);
  final = mix(final, vec4(WHITE, 1.0), plastic_white);
  final = mix(final, rainbow, eyes_alpha);

  gl_FragColor = vec4(final.rgb, 1.0);

}
