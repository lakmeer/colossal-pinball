
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

#define NUM_LAMPS VADER_STATIC(u_num_lamps)

// Textures

uniform sampler2D u_tex_rtk;
uniform sampler2D u_tex_base;
uniform sampler2D u_tex_wood;
uniform sampler2D u_tex_hair;
uniform sampler2D u_tex_bump;
uniform sampler2D u_tex_logo;
uniform sampler2D u_tex_misc;
uniform sampler2D u_tex_drop;
uniform sampler2D u_tex_text;
uniform sampler2D u_tex_face1;
uniform sampler2D u_tex_face2;
uniform sampler2D u_tex_lanes;
uniform sampler2D u_tex_rails;
uniform sampler2D u_tex_walls;
uniform sampler2D u_tex_extra;
uniform sampler2D u_tex_indic;
uniform sampler2D u_tex_lights;
uniform sampler2D u_tex_labels;
uniform sampler2D u_tex_plastics;
uniform sampler2D u_tex_noise;

// Game Data

uniform vec2 u_world_size;
uniform vec2 u_ball_pos;
uniform int u_score_phase;
uniform vec3 u_lamps[NUM_LAMPS];

uniform float u_beat;
uniform float u_holo;
uniform float u_hypno;
uniform float u_hyper;
uniform float u_distort;
uniform float u_light_rainbow;


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
const vec3 PLASTIC_WHITE  = vec3(0.958, 0.958, 0.958);
const vec3 PLASTIC_LANE   = vec3(0.900, 0.920, 0.100);

const vec3 WALL_METAL  = vec3(0.3, 0.3, 0.3);
const vec3 RUBBER_RED  = vec3(0.5, 0.1, 0.2);
const vec3 SCREW_METAL = vec3(0.5, 0.5, 0.5);

const vec3 BALL_COLOR = WHITE;
const vec3 LAMP_ON    = vec3(0.99, 0.9, 0.5);
const vec3 LAMP_OFF   = vec3(0.3, 0.2, 0.1);

const vec4  LIGHT_COLOR = vec4(0.99, 0.9, 0.7, 1.0);
const vec4  LIGHT_AMBIENT = LIGHT_COLOR * 0.9;
const float LIGHT_FALLOFF = 10.0;
const float LIGHT_INTENSITY = 0.6;


//
// FUNCTIONS
//

float nsin (float x) { return sin(x) * 0.5 + 0.5; }
float ncos (float x) { return cos(x) * 0.5 + 0.5; }

vec4 layer (sampler2D source, vec2 uv, vec3 r, vec3 g, vec3 b) {
  vec4 tex = texture2D(source, uv);
  return vec4(tex.r * r + tex.g * g + tex.b * b, tex.a);
}

float cl (float x) {
  return clamp(x, 0.0, 1.0);
}

float only_r (sampler2D source, vec2 uv) { return texture2D(source, uv).r; }
float only_g (sampler2D source, vec2 uv) { return texture2D(source, uv).g; }
float only_b (sampler2D source, vec2 uv) { return texture2D(source, uv).b; }
float only_a (sampler2D source, vec2 uv) { return texture2D(source, uv).a; }
vec4 col(vec3 c) { return vec4(c, 1.0); }

float circle_at (vec2 pos, vec2 center, float radius) {
  return 1.0 - smoothstep(radius - EPS, radius + EPS, length(pos - center));
}

vec3 gamma (in vec3 col) {
	return pow(col, vec3(1.0/GAMMA));
}

float random (in vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float random2 (in vec2 st) {
  return random(st + vec2(random(st)));
}

vec4 plasma (in vec2 uv, float offset) {
  return vec4(
    0.3 + 0.7 * nsin(uv.y * 3.0 * nsin(u_time * 2.0) * PI + offset),
    0.3 + 0.7 * ncos(uv.x * 3.0 * ncos(u_time * 2.0) * PI + offset), 
    0.3 + 0.7 * nsin(uv.x * 3.0 * ncos(u_time * 2.0) * PI + offset),
    1.0);
}

// 2D Noise based on Morgan McGuire - @morgan3d - https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f*f*(3.0-2.0*f);

    return mix(a, b, u.x) +
      (c - a) * u.y * (1.0 - u.x) +
      (d - b) * u.x * u.y;
}

vec4 starfield (in vec2 uv) {
	vec3 ray;
	ray.xy = 2.0*uv - vec2(1.0);
	ray.z = 1.0;

	float offset = u_time * 2.0;
	float speed  = 0.4; // length
	float speed2 = 0.7; // abberation

	vec3 col = vec3(0);
	vec3 stp = ray/max(abs(ray.x),abs(ray.y));
	vec3 pos = 2.0*stp+.5;

	for ( int i=0; i < 20; i++ ) {
		float z = noise(pos.xy + vec2(u_time));
		z = fract(z - offset);
		float d = 10.0*z - pos.z;
		float w = pow(max(0.0,1.0-8.0*length(fract(pos.xy)-.5)),2.0);
		vec3 c = max(
        vec3(0),
        vec3(1.5 - abs(d+speed2*.5)/speed,
             1.5 - abs(d)/speed,
             1.5 - abs(d-speed2*.5)/speed));
		col += 1.5*(1.0-z)*c*w;
		pos += stp;
	}

	return vec4(uv.x > 0.5 ? col : gamma(col), 1.0);
}


//
// MAIN
//

void main () {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.y = 1.0 - uv.y;

  // UV but adjusted for aspect ratio
  vec2 uvr = vec2(uv.x, uv.y * u_resolution.y/u_resolution.x);
  // Table coords
  vec2 uvt = vec2(
      u_world_size.x * (uv.x - 0.5),
      u_world_size.y * (1.0 - uv.y));

  // Distort

  uv.x += sin(100.0 * uv.y + u_time * 2.0) * 0.01 * u_distort;
  uv.y += cos(50.0 * uv.x + u_time * 2.0) * 0.01 * u_distort;


  // Ball radius

  float ball = circle_at(uvt, u_ball_pos, BALL_RAD);


  // Lamp locations

  float lamp_alpha_upper_target_left = circle_at(uvt, vec2(56.0, 705.0), LAMP_RAD);


  // State calculations

  float SCORE_PHASE_ALPHA = float(u_score_phase == 0);
  float SCORE_PHASE_BETA  = float(u_score_phase == 1);


  // Colorize layers

  vec4 wood     = texture2D(u_tex_wood, uv);
  vec4 base     = layer(u_tex_base,     uv, BG_RED, BG_GREEN, BG_WHITE);
  vec4 hair     = layer(u_tex_hair,     uv, BG_WHITE, BG_ORANGE, BG_RED);
  vec4 drop     = layer(u_tex_drop,     uv, BG_WHITE, BG_BROWN, BLACK);
  vec4 bump     = layer(u_tex_bump,     uv, BUMPER_WHITE, BUMPER_GREEN, BUMPER_BLUE);
  vec4 logo     = layer(u_tex_logo,     uv, BG_WHITE, BG_GREEN, BLACK);
  vec4 rtk      = layer(u_tex_rtk,      uv, BG_BROWN, BG_BROWN, BG_BROWN);
  vec4 misc     = layer(u_tex_misc,     uv, WHITE, WHITE, WHITE);
  vec4 lanes    = layer(u_tex_lanes,    uv, BG_ORANGE, BG_GREEN, BG_BLUE);
  vec4 rails    = layer(u_tex_rails,    uv, WALL_METAL, PLASTIC_LANE, SCREW_METAL);
  vec4 walls    = layer(u_tex_walls,    uv, WALL_METAL, WALL_METAL, WALL_METAL);
  //vec4 extra    = layer(u_tex_extra,    uv, RUBBER_RED, WALL_METAL, SCREW_METAL);
  vec4 labels   = layer(u_tex_labels,   uv, BG_ORANGE, BG_WHITE, uv.y < 0.5 ? BG_BLUE : BG_ORANGE);


  // Alphas

  float playfield_alpha = base.a;
  float plastics_alpha  = bump.a;
  float eyes_alpha      = only_g(u_tex_misc, uv);
  float lamp_alpha      = only_b(u_tex_misc, uv);
  float plastic_white   = only_r(u_tex_misc, uv);
  float text_low        = only_b(u_tex_text, uv);
  float text_high       = only_r(u_tex_text, uv);
  float skirts_alpha    = only_g(u_tex_text, uv);
  float beat_alpha      = (1.0 - u_beat) * (1.0 - u_beat) * (1.0 - u_beat);
  float indic_normal    = only_g(u_tex_indic, uv);
  float indic_normal_a  = only_a(u_tex_indic, uv);
  float indic_hidden    = only_r(u_tex_indic, uv);
  float indic_hidden_a  = only_b(u_tex_indic, uv);
  float inner_rings     = only_b(u_tex_base, uv) + only_r(u_tex_base, uv) + only_g(u_tex_base, uv);


  // FX layers

  vec4 rainbow    = vec4(nsin(uv.x + u_time * 2.5), nsin(uv.y + u_time * 3.0), 0.5, 1.0);
  vec4 hyperspeed = vec4(u_hyper);
  vec4 hypernull  = vec4(1.0) - hyperspeed;
  vec4 stars      = starfield(uv);
  vec4 pulse      = vec4(vec3(beat_alpha), 1.0);


  // Lighting

  const int NUM_LIGHTS = 19;
  vec3 lights[NUM_LIGHTS];

  float light_mask_r = only_r(u_tex_lights, uv);
  float light_mask_g = only_g(u_tex_lights, uv);
  float light_mask_b = only_b(u_tex_lights, uv);

  // Lanes
  lights[ 0] = vec3(0.312, 0.33, light_mask_g);
  lights[ 1] = vec3(0.405, 0.33, light_mask_g);
  lights[ 2] = vec3(0.500, 0.33, light_mask_g);
  lights[ 3] = vec3(0.595, 0.33, light_mask_g);
  lights[ 4] = vec3(0.688, 0.33, light_mask_g);
  // Upper guards
  lights[ 5] = vec3(0.148, 0.34, light_mask_r);
  lights[ 8] = vec3(0.852, 0.34, light_mask_r);
  lights[ 6] = vec3(0.133, 0.41, light_mask_r);
  lights[ 9] = vec3(0.867, 0.41, light_mask_r);
  lights[ 7] = vec3(0.133, 0.52, light_mask_r);
  lights[10] = vec3(0.867, 0.52, light_mask_r);
  // Droptarget banks
  lights[11] = vec3(0.22,  0.72, light_mask_b);
  lights[12] = vec3(0.78,  0.72, light_mask_b);
  // Lower Guards
  lights[13] = vec3(0.15,  0.92, light_mask_g);
  lights[14] = vec3(0.85,  0.92, light_mask_g);
  lights[15] = vec3(0.13,  1.01, light_mask_g);
  lights[16] = vec3(0.87,  1.01, light_mask_g);
  // Slingshots
  lights[17] = vec3(0.27,  1.36, light_mask_b);
  lights[18] = vec3(0.73,  1.36, light_mask_b);

  vec4 lc = mix(LIGHT_COLOR, rainbow, u_light_rainbow);

  vec4 lighting = (1.0 - length(uv - vec2(0.5, 0.5))) * LIGHT_AMBIENT;
  for (int i = 0; i < NUM_LIGHTS; i++) {
    lighting +=
      (0.2 * beat_alpha + LIGHT_INTENSITY)
        * lc
        * lights[i].z
        * exp(-(LIGHT_FALLOFF + LIGHT_FALLOFF/2.0 * u_beat) * length(uvr - lights[i].xy));
  }


  // Dynamic Layers

  // Ball depends on state
  vec3 ball_color  = mix(BALL_COLOR, rainbow.rgb, hyperspeed.x);

  // Build playfield surface
  vec4 playfield = mix(wood, base, base.a);

  // HypnoRings
  float hypno = u_hypno * 0.3; // looks best
  vec2  ring_center = vec2(0.355, 0.9215);
  vec2  ring_offset = vec2(cos(u_time * 0.5), sin(u_time * 0.5)) * 0.2;
  vec2  ring_squish = vec2(0.929, 1.0);
  float ring_fuzziness = 0.05;
  float ring_thickness = 0.0214;
  vec4 rings =
      mix(col(BG_ORANGE), col(BG_WHITE),
        smoothstep(-ring_fuzziness - EPS, ring_fuzziness + EPS, sin(
            length(ring_squish * uvr - ring_center- ring_offset * hypno)
            * PI / ring_thickness + PI * 1.4
            + u_time * hypno * hypno * 20.0
        ))
      );
  rings = mix(col(BG_RED), rings,
      smoothstep(-EPS, hypno + EPS,
        -0.3344 + hypno * 0.1 + 0.5 * hypno + length(ring_squish * uvr - ring_center - ring_offset * hypno))
        
    );
  rings = mix(rings, col(BG_GREEN),
      smoothstep(-EPS, hypno + EPS, 
        -0.3333 - 7.0 * ring_thickness + 0.3 * hypno + length(ring_squish * uvr - ring_center + ring_offset * hypno))
        
    );
  playfield = mix(playfield, rings, inner_rings);

  // Faces
  float face_masks[4];
  face_masks[0] = only_g(u_tex_face1, uv);
  face_masks[1] = only_b(u_tex_face1, uv);
  face_masks[2] = only_g(u_tex_face2, uv);
  face_masks[3] = only_b(u_tex_face2, uv);

  vec3 face_color_a = mix(BG_GREEN, BG_BLUE, ncos(uvr.x * 0.25 + u_time * 2.5 + PI * 0.0/4.0));
  vec3 face_color_b = mix(BG_GREEN, BG_BLUE, ncos(uvr.x * 0.25 + u_time * 2.5 + PI * 1.0/4.0));
  vec3 face_color_c = mix(BG_GREEN, BG_BLUE, ncos(uvr.x * 0.25 + u_time * 2.5 + PI * 2.0/4.0));
  vec3 face_color_d = mix(BG_GREEN, BG_BLUE, ncos(uvr.x * 0.25 + u_time * 2.5 + PI * 3.0/4.0));

  vec4 faces =
    mix(
      layer(u_tex_face2, uv, BG_RED, face_color_c, face_color_d),
      layer(u_tex_face1, uv, BG_RED, face_color_a, face_color_b),
      only_a(u_tex_face1, uv));

  // Lamp indicators
  vec4 lamps = vec4(0.0, 0.0, 0.0, 0.0);
  for (int i = 0; i < NUM_LAMPS; i++) {
    lamps += vec4(
        mix(LAMP_OFF, LAMP_ON, u_lamps[i].z) *
          circle_at(uvt, u_lamps[i].xy, 10.0),
          circle_at(uvt, u_lamps[i].xy, 10.0));
  }

  // Plastics layer / Holographic effect
  float plasma_factor = u_holo;
  vec4 plastics = 
    layer(u_tex_plastics, uv, 
        mix(PLASTIC_RED,    plasma(uv, u_time + 3.0).rgb, plasma_factor),
        mix(PLASTIC_YELLOW, plasma(uv, u_time + 2.0).rgb, plasma_factor),
        mix(PLASTIC_BLUE,   plasma(uv, u_time + 1.0).rgb, plasma_factor)); 
  plastics = mix(plastics, col(mix(PLASTIC_WHITE, plasma(uv, u_time).rgb, plasma_factor)), plastic_white);

  // Add indicators into labels layer
  labels = mix(labels, col(BLACK), indic_normal_a
      * smoothstep(-EPS, EPS, sin((uvr.y + 0.75) * PI * 2.7)));
  labels = mix(labels, col(BG_RED), indic_normal);

  // Create hidden indicators
  vec4 hidden = mix(vec4(BLACK, indic_hidden_a), col(BG_RED), indic_hidden);


  //
  // Output
  //

  vec4 final = mix(playfield, stars, u_hyper);

  // Playfield layer
  final = mix(final, faces, faces.a);
  final = mix(final, col(BG_WHITE), eyes_alpha);
  final = mix(final, hair, hair.a), 
  final = mix(final, logo, logo.a * hypernull);
  final = mix(final, lanes, lanes.a * hypernull);
  final = mix(final, labels, labels.a * hypernull);
  final = mix(final, hyperspeed + drop, drop.a);
  final = mix(final, vec4(BLACK, 1.0), text_low  * cl(3.0 * sin(u_time * 2.0 + 0.)) * hypernull);
  final = mix(final, vec4(BLACK, 1.0), text_high * cl(3.0 * sin(u_time * 2.0 + PI)) * hypernull);

  // Mid layer
  final = mix(final, rtk, rtk.a * hypernull);
  //final = mix(final, vec4(LAMP_ON, 1.0) * nsin(uv.y * 4.0 + u_time * 4.0), lamp_alpha);
  final = mix(final, vec4(ball_color, 1.0), ball);

  // Lighting layer
  final *= lighting;

  // Top layer
  final = mix(final, hyperspeed + bump, bump.a);  // bumper caps
  final = mix(final, walls, walls.a * hypernull);
  //final = mix(final, extra, extra.a * hypernull);
  final = mix(final, hyperspeed + rails, rails.a);
  final = mix(final, col(PLASTIC_WHITE), skirts_alpha * (0.4 + beat_alpha * 3.0)); // skirts
  final = mix(final, hyperspeed + plastics, plastics.a); // plastics

  // Hyperskirts
  for (int i = 0; i < 10; i++) {
    float p = float(i) / 10.0;
    float uvx = 0.50 - (0.01 * cos(u_time) * p + 0.50 - uv.x)*(1.0 - 0.04 * float(i));
    float uvy = 0.44 - (0.01 * sin(u_time) * p + 0.44 - uv.y)*(1.0 - 0.04 * float(i));
    final += 0.4 * hyperspeed *
      (nsin(p * PI - u_time * 3.0) + 0.3 * nsin(u_time )) *
      (only_g(u_tex_text, vec2(uvx, uvy)) +
       0.3 * only_a(u_tex_rails, vec2(uvx, uvy))
    );
  }

  // Special
  // Hidden indicators
  // Eyes
  //final = mix(final, mix(col(BG_WHITE), rainbow, hyperspeed), eyes_alpha); // eyes
  //final = mix(final, lamps, lamps.a);

  gl_FragColor = uv.y < 0.9075
    ? vec4(final.rgb, 1.0) + lamp_alpha_upper_target_left * (hyperspeed + vec4(LAMP_ON, 1.0)) * lamp_alpha * SCORE_PHASE_ALPHA
    : vec4(BLACK, 1.0);

}

