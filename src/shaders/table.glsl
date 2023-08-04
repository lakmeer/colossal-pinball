
//
// SETUP
//

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_mouse;

#define PI    3.14159265358979323846
#define TAU   6.28318530717958647692
#define EPS   0.0001
#define GAMMA 2.2


// Textures

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
uniform sampler2D u_tex_noise;

// Game Data

uniform vec2 u_ball_pos;
uniform int white_bonus;
uniform int red_bonus;
uniform int active_lane;
uniform int active_bumper;
uniform int score_phase;


// Config

const float BALL_RAD = 12.0;
const float LAMP_RAD = 12.0;

// Palette

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


//
// FUNCTIONS
//

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

float circle_at (vec2 pos, vec2 center, float radius) {
  return 1.0 - smoothstep(radius - EPS, radius + EPS, length(pos - center));
}

vec3 gamma (in vec3 col) {
	return pow(col, vec3(1.0/GAMMA));
}

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
     u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

vec4 starfield (in vec2 uv) {
	vec3 ray;
	ray.xy = 2.0*uv - vec2(1.0);
	ray.z = 1.0;

	float offset = u_time;
	float speed  = 1.0;
	float speed2 = 1.2;

	vec3 col = vec3(0);
	vec3 stp = ray/max(abs(ray.x),abs(ray.y));
	vec3 pos = 2.0*stp+.5;

	for ( int i=0; i < 20; i++ ) {
		float z = noise(pos.xy);
		z = fract(z-offset);
		float d = 50.0*z-pos.z;
		float w = pow(max(0.0,1.0-8.0*length(fract(pos.xy)-.5)),2.0);
		vec3 c = max(
        vec3(0),
        vec3(1.0 - abs(d+speed2*.5)/speed,
             1.0 - abs(d)/speed,
             1.0 - abs(d-speed2*.5)/speed));
		col += 1.5*(1.0-z)*c*w;
		pos += stp;
	}

	return vec4(gamma(col), 1.0);
}


//
// MAIN
//

void main () {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv = vec2(uv.x, 1.0 - uv.y);

  // Ball radius

  float ball = circle_at(gl_FragCoord.xy, u_ball_pos, BALL_RAD);


  // Lamp locations

  float lamp_alpha_upper_target_left = circle_at(gl_FragCoord.xy, vec2(56.0, 705.0), LAMP_RAD);



  // State calculations

  float SCORE_PHASE_ALPHA = float(score_phase == 0);
  float SCORE_PHASE_BETA  = float(score_phase == 1);


  // Colorize layers

  vec4 base     = layer(u_tex_base,   uv, BG_ORANGE, BG_GREEN, BG_WHITE);
  vec4 face     = layer(u_tex_face,   uv, BG_RED, BG_GREEN, BG_BLUE);
  vec4 hair     = layer(u_tex_hair,   uv, BG_WHITE, BG_ORANGE, BG_RED);
  vec4 drop     = layer(u_tex_drop,   uv, BG_WHITE, BG_BROWN, BLACK);
  vec4 bump     = layer(u_tex_bump,   uv, BUMPER_WHITE, BUMPER_GREEN, BUMPER_BLUE);
  vec4 logo     = layer(u_tex_logo,   uv, BG_WHITE, BG_GREEN, BLACK);
  vec4 rtk      = layer(u_tex_rtk,    uv, BG_BROWN, BG_BROWN, BG_BROWN);
  vec4 rings    = layer(u_tex_rings,  uv, BG_ORANGE, BG_WHITE, BG_WHITE);
  vec4 lanes    = layer(u_tex_lanes,  uv, BG_ORANGE, BG_GREEN, BG_BLUE);
  vec4 plastics = layer(u_tex_plastics, uv, PLASTIC_RED, PLASTIC_YELLOW, PLASTIC_BLUE);
  vec4 labels   = layer(u_tex_labels, uv,
                        uv.y < 0.3 ? BG_WHITE : BG_WHITE,
                        BG_RED,
                        uv.y < 0.3 ? BG_WHITE : BG_WHITE);
  vec4 misc     = layer(u_tex_misc,   uv, WHITE, WHITE, WHITE);


  // Alphas

  float playfield_alpha = base.a;
  float plastics_alpha  = bump.a;
  float eyes_alpha      = only_g(u_tex_misc, uv);
  float lamp_alpha      = only_b(u_tex_misc, uv);
  float plastic_white   = only_r(u_tex_misc, uv);
  float text_low        = only_b(u_tex_text, uv);
  float text_high       = only_r(u_tex_text, uv);


  // FX layers

  vec4 plasma = vec4(nsin(uv.y * 2.0 * nsin(u_time) * PI + u_time),
         nsin(uv.x * 2.0 * nsin(u_time) * PI + u_time), 0.5, 1.0);

  vec4 rainbow = vec4(
    nsin(uv.x + u_time * 2.5),
    nsin(uv.y + u_time * 3.0),
    0.5,
    1.0);

  vec4 hyperspeed = vec4(u_mouse.y);
  vec4 hypernull = vec4(1.0) - hyperspeed;

  vec4 stars = starfield(uv);


  // Dynamic Colors

  vec3 ball_color = mix(BALL_COLOR, rainbow.rgb, hyperspeed.x);


  // Output

  vec4 final = mix(vec4(BLACK, 1.0), stars, hyperspeed);

  // Playfield layer
  final = mix(final, plasma, 0.0); //base.a);
  //final = mix(final, rings, base.a);
  final = mix(final, face, face.a);
  final = mix(final, hair, hair.a), 
  final = mix(final, logo, logo.a * hypernull);
  final = mix(final, labels, labels.a * hypernull);
  final = mix(final, hyperspeed + drop, drop.a);
  final = mix(final, lanes, lanes.a * hypernull);
  final = mix(final, vec4(BLACK, 1.0),       text_low  * clamp((-0.5 + 2.0 * nsin(u_time * 2.0)), 0.0, 1.0) * hypernull);
  final = mix(final, vec4(PLASTIC_RED, 1.0), text_high * clamp((-0.5 + 2.0 * nsin(u_time * 2.0 + PI)), 0.0, 1.0) * hypernull);

  // Mid layer
  final = mix(final, rtk, rtk.a * hypernull);
  //final = mix(final, vec4(LAMP_ON, 1.0) * nsin(uv.y * 4.0 + u_time * 4.0), lamp_alpha);
  final = mix(final, vec4(ball_color, 1.0), ball);

  // Top layer
  final = mix(final, hyperspeed + bump, bump.a);
  final = mix(final, hyperspeed + plastics, plastics.a);
  final = mix(final, vec4(WHITE, 1.0), plastic_white * hypernull);
  final = mix(final, mix(vec4(WHITE, 1.0), rainbow, hyperspeed), eyes_alpha);

  gl_FragColor = vec4(final.rgb, 1.0)
    + lamp_alpha_upper_target_left * (hyperspeed + vec4(LAMP_ON, 1.0)) * lamp_alpha * SCORE_PHASE_ALPHA;
}

