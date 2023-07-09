
import type Shape from "$lib/Shape";
import type Table from "$lib/tables";

import Vec2  from "$lib/Vec2";
import Rect  from "$lib/Rect";
import Color from "$lib/Color";
import Thing from "$lib/Thing";

import { Circle, Capsule, Arc, Fence, Box } from "$lib/Shape";
import * as Things  from "$lib/Thing";

import type { InputState, EventQueue } from "$types";
import type { EventType, Command } from "$lib/Thing";

import { PI, TAU } from "$lib/utils";


// FX Ideas
// - chromatic ball trails
// - move stripes
// - cycle face colors
// - cycle hair colors
// - basic strobing
// - paint splashes
// - paint trails from eyes
// - background dropout to stripe tunnel, or starfield
// - face animation
// - hair animation
// - particles
// - silhouette mode
// - smoke trails on ball
// - smoke UV offset in bg
// - target banks get brighter as multiplier increases
// - e^-x glow outlines

// Music sync (If Only)
//
// Instrumental - 0:00 - 0:08
// - Bass throb only
// - Static
// Verse 1 - 0:08 - 0:23
// - Static
// Verse 2 - 0:23 - 0:39
// - Kick drum enters
// - Pulse ball
// Chorus 1 (soft) - 0:39 - 1:10 - 2x
// - Pads enter
// - Smoke trail on ball
// - Smoke bg
// - Strobe lights gently
// Intrumental - 1:10 - 1:26
// - Snare enters, hard synths
// - Snap color changes
//  - Face colors
//  - Ring colors
// Verse 3 - 1:26 - 1:42
// - Pulse traget banks
// Verse 4 - 1:42 - 1:58
// - Paint splash
// Chorus 2 (full) - 1:58 - 2:29 - 2x
// - Portal bg
// - Fade face colors
// - Technicolor lamps
// - Rainbow ball trail
// Break - 2:30 - 2:37
// - Pulse everything
// Solo - 2:37 - 2:53
// - Starburst
// - Drop background for starfield
// - Screaming face
// - Hair swirling
// Solo + High bells - 2:53 - 3:09
// - Smoke puffs on snare
// Chorus 3 (full) - 3:09 - 3:40 - 2x
// - Technicolor art lines
// - Fireworks
// Instrumental - 3:40 - 3:56
// Fadeout

//
// Generate the Now table
//

export default ():Table => {

  const it = {
    name: "NOW",
    bounds: new Rect(-216, 768, 216, 0),
    things: {},
    ballRad: 9,
    template: null,
    templateSrc: "/now.png",
    process: (input:InputState, events:EventType[]) => {}
  } as Table;


  // Settings

  const SLINGSHOT_STRENGTH = Vec2.fromAngle(0, 8);
  const KICKER_STRENGTH    = Vec2.fromAngle(TAU/4, 8);


  // Vars

  let ballRad    = 9;
  let ballSize   = ballRad * 2;
  let chuteWidth = ballSize + 2;
  let lampRad    = ballRad;


  // Shorthands

  const L  = it.bounds.left;
  const R  = it.bounds.right;
  const W  = it.bounds.w;
  const H  = it.bounds.h;

  const TW = it.bounds.w - 54; // table width except chute
  const TR = L + TW;   // rightmost position excluding chute
  const TL = L + 16;   // leftmost position excluding outer wall
  const M  = L + TW/2 + 8; // middle line of playfield (fudged)



  // Shorthand constructors

  const add = (thing:Thing) => {
    if (it.things[thing.name]) console.warn(`Thing with name '${thing.name}' already exists`);
    it.things[thing.name] = thing;
  }

  const Deco      = (name, ...args) => add(Things.Deco.from(name, ...args));
  const Collider  = (name, ...args) => add(Things.Collider.from(name, ...args));
  const Drain     = (name, ...args) => add(Things.Drain.from(name, ...args));
  const Flipper   = (name, ...args) => add(Things.Flipper.from(name, ...args));
  const Kicker    = (name, ...args) => add(Things.Kicker.from(name, ...args));
  const Rollover  = (name, ...args) => add(Things.Rollover.from(name, ...args));
  const Lamp      = (name, ...args) => add(Things.Lamp.from(name, ...args));
  //const Slingshot = (name, shape) => add(name, Things.Slingshot.from(name, shape));
  //const Target    = (name, shape) => add(name, Things.Target.from(name, shape));
  //const Bumper    = (name, shape) => add(name, Things.Bumper.from(name, shape));


  //
  // Playfield Elements
  // TODO: adjust positioning to correct for perspective in the graphic
  //

  // Outer walls
  Collider(`topwall`,             Arc.at(-1, 530, 6, (W - 22)/2, TAU*8/16, TAU*0/16));
  Collider(`leftwall`,            Capsule.from(TL - 6, 0, TL - 6, 530, 6));
  Collider(`rightwall_inner_btm`, Capsule.from(TR + 6,   0, TR + 6, 339, 6));
  Collider(`rightwall_inner_top`, Capsule.from(TR + 6, 398, TR + 6, 547, 6));
  Collider(`rightwall_inner_arc`, Arc.at(M + 57, 547, 6, 130, TAU*1/7, 0));


  // Launch chute

  // TODO: one-way gate at the top of the chute
  Collider(`chute_wall`,    Capsule.from(R - 12, 0, R - 12, 530, 6));
  Collider(`chute_bottom`,  Capsule.at(R - 30, 90, 9, 20, TAU/4));


  // Stopper

  Collider(`stopper`, Capsule.from(L + 61, 637, L + 66, 644, 13));


  // Upper lanes

  let laneMiddle = M;
  let laneStride = 42;

  for (let z = -2; z <= 2; z++) {
    let x = laneMiddle + laneStride * z;
    Collider(`upper_lane_guard_${z+2}`, Capsule.from(x, 582, x, 622, 8));
  }

  for (let z = -1.5; z <= 1.5; z++) {
    let x = laneMiddle + laneStride * z;
    Rollover(`upper_lane_rollover_${z+1.5}`, Capsule.from(x, 575, x, 608, 6));
    Lamp(`upper_lane_lamp_${z+1.5}`, Circle.at(x, 630, lampRad), Color.fromTw('rose-300'), Color.fromTw('rose-600'));
  }


  // Upper guards

  Collider(`upper_guard_left_a`,  Circle.at(M - 143, 612, 9));
  Collider(`upper_guard_left_b`,  Capsule.from(M - 167, 509, M - 167, 575, 9));

  Collider(`upper_guard_right_a`, Capsule.from(M + 139, 644, M + 133, 627, 9));
  Collider(`upper_guard_right_b`, Capsule.from(M + 143, 612, M + 133, 627, 9));
  Collider(`upper_guard_right_c`, Capsule.from(M + 167, 509, M + 167, 575, 9));


  // Main Bumpers

  Collider(`bumper_left`,  Circle.at(M + 85, 523, 25));
  Collider(`bumper_right`, Circle.at(M - 85, 523, 25));
  Collider(`bumper_mid`,   Circle.at(M     , 492, 25));


  // Upper Targets

  Collider(`tgt_top_left`,   Capsule.from(TL + 32, 600, TL + 23, 584));
  Collider(`tgt_top_right`,  Capsule.from(TR - 32, 600, TR - 23, 584));
  Lamp(`tgt_lamp_top_left`,  Circle.at(TL + 39, 557, lampRad), Color.fromTw('lime-400'), Color.fromTw('lime-800'));
  Lamp(`tgt_lamp_top_right`, Circle.at(TR - 39, 557, lampRad), Color.fromTw('lime-400'), Color.fromTw('lime-800'));


  // Droptarget banks & slingshots

  let dt_width  = 14;
  let dt_stride = 26;

  for (let i = -1.5; i <= 1.5; i++) {
    let xl = M - 99 + dt_stride * i;
    let xr = M + 99 + dt_stride * i;
    Collider(`dt_left_bank_${i+1.5}`,  Capsule.from(xl + dt_width/2, 408, xl - dt_width/2, 408));
    Collider(`dt_right_bank_${i+1.5}`, Capsule.from(xr + dt_width/2, 408, xr - dt_width/2, 408));
  }

  Collider(`dt_ss_left`,  Fence.at([ M - 147, 419, M - 147, 465, M -  56, 419 ], 6).close());
  Collider(`dt_ss_right`, Fence.at([ M + 147, 419, M + 147, 465, M +  56, 419 ], 6).close());


  // Midfield rollovers

  Rollover(`mid_rollover_left`,   Capsule.from(TL + 16, 424, TL + 16, 455, 6));
  Rollover(`mid_rollover_right`,  Capsule.from(TR - 16, 424, TR - 16, 455, 6));
  Lamp(`mid_rollover_lamp_left`,  Circle.at(TL + 38, 493, lampRad), Color.fromTw('lime-400'), Color.fromTw('lime-800'));
  Lamp(`mid_rollover_lamp_right`, Circle.at(TR - 38, 493, lampRad), Color.fromTw('lime-400'), Color.fromTw('lime-800'));


  // Midfield guards

  Collider(`mid_guard_left_top`, Arc.at(TL + 22, 482, 1, 20, TAU*3/16, TAU*5/16));
  Collider(`mid_guard_left_mid`, Capsule.from(TL + 2, 482, TL + 2, 412));
  Collider(`mid_guard_left_btm`, Arc.at(TL + 22, 412, 1, 20, TAU*3/16, TAU*8/16));
  Collider(`mid_guard_left_end`, Capsule.from(TL + 14, 393, TL + 0, 393, 1));

  Collider(`mid_guard_right_top`, Arc.at(TR - 22, 482, 1, 20, TAU*3/16, TAU*0/16));
  Collider(`mid_guard_right_mid`, Capsule.from(TR - 2, 412, TR - 2, 482));
  Collider(`mid_guard_right_btm`, Arc.at(TR - 22, 412, 1, 20, TAU*3/16, TAU*13/16));
  Collider(`mid_guard_right_end`, Capsule.from(TR - 14, 393, TR + 6, 393, 1));


  // Lower Targets

  Collider(`tgt_left_upper`,  Capsule.from(TL + 32, 360, TL + 28, 344));
  Collider(`tgt_right_upper`, Capsule.from(TR - 32, 360, TR - 28, 344));
  Collider(`tgt_left_lower`,  Capsule.from(TL + 27, 324, TL + 21, 307));
  Collider(`tgt_right_lower`, Capsule.from(TR - 27, 324, TR - 21, 307));
  Lamp(`tgt_lamp_left_upper`,  Circle.at(TL + 58, 331, lampRad), Color.fromTw('lime-500'), Color.fromTw('lime-400'));
  Lamp(`tgt_lamp_right_upper`, Circle.at(TR - 58, 331, lampRad), Color.fromTw('lime-500'), Color.fromTw('lime-400'));
  Lamp(`tgt_lamp_left_lower`,  Circle.at(TL + 53, 296, lampRad), Color.fromTw('blue-500'), Color.fromTw('lime-400'));
  Lamp(`tgt_lamp_right_lower`, Circle.at(TR - 53, 296, lampRad), Color.fromTw('blue-500'), Color.fromTw('lime-400'));


  // Lower Guards

  Collider(`lower_guard_left_top`,       Capsule.from(TL + 11, 386, TL + 31, 372, 9));
  Collider(`lower_guard_left_mid`,       Circle.at(TL + 21, 334, 9));
  Collider(`lower_guard_left_btm`,       Circle.at(TL + 14, 299, 9));
  Collider(`lower_guard_left_out_post`,  Circle.at(TL + 39, 238, 9));

  Collider(`lower_guard_right_top`,      Circle.at(TR - 31, 372, 9));
  Collider(`lower_guard_right_top_ang`,  Capsule.at(TR - 8, 359, 2, 47, TAU*2/15));
  Collider(`lower_guard_right_mid`,      Circle.at(TR - 21, 334, 9));
  Collider(`lower_guard_right_btm`,      Circle.at(TR - 14, 299, 9));
  Collider(`lower_guard_right_out_post`, Circle.at(TR - 39, 238, 9));


  // Outlane rollovers

  Rollover(`out_rollover_left`,  Capsule.from(M + 137, 164, M + 137, 189, 6));
  Rollover(`out_rollover_right`, Capsule.from(M - 137, 164, M - 137, 189, 6));
  Deco(`out_rollover_lamp_left`,  Circle.at(M + 104, 251, lampRad), Color.fromTw('orange-500'));
  Deco(`out_rollover_lamp_right`, Circle.at(M - 104, 251, lampRad), Color.fromTw('orange-500'));


  // Outlane kickers

  Collider(`kicker_left_rail_outer`,  Arc.at(M, 208, 3, (TW - 9)/2, TAU*5/64, TAU*27/64));
  Collider(`kicker_left_rail_inner`,  Capsule.from(TL + 32, 238, TL + 32, 160, 2));
  Collider(`kicker_left_stopper`,     Circle.at(TL + 25, 157, 9));
  Rollover(`kicker_left_score_ro`, Capsule.at(TL + 15, 200, 6, 30));
  Kicker(`kicker_left`,            Capsule.at(TL + 15, 176, 10, 10, TAU/4), KICKER_STRENGTH);

  Collider(`kicker_right_rail_outer`, Arc.at(M, 208, 3, (TW - 9)/2, TAU*5/64, TAU*0/64));
  Collider(`kicker_right_rail_inner`, Capsule.from(TR - 32, 238, TR - 32, 160, 2));
  Collider(`kicker_right_stopper`,    Circle.at(TR - 25, 157, 9));
  Rollover(`kicker_right_score_ro`, Capsule.at(TR - 15, 200, 6, 30));
  Kicker(`kicker_right`,            Capsule.at(TR - 15, 176, 10, 10, TAU/4), KICKER_STRENGTH);


  // Lower slingshots

  Collider(`lower_ss_left`,  Fence.at([ M - 89, 150, M - 119, 198, M - 119, 161 ], 6).close());
  Collider(`lower_ss_right`, Fence.at([ M + 89, 150, M + 119, 198, M + 119, 161 ], 6).close());


  // Flippers

  let flipperRad = 9;
  let flipperLength = 51;
  let flipperRestAngle = TAU/12;
  let flipperRange = TAU/6;

  Flipper(`flipper_left`,
    M - 25 - flipperLength,
    138,
    flipperRad,
    flipperLength,
    0 - flipperRestAngle,
    flipperRange,
    50);

  Flipper(`flipper_right`,
    M + 25 + flipperLength,
    138,
    flipperRad,
    flipperLength,
    PI + flipperRestAngle,
    -flipperRange,
    50);


  // Central drain

  Collider(`drain_wall_left`,  Capsule.from(TL, 144, M - 36, 71, 8));
  Collider(`drain_wall_right`, Capsule.from(TR, 144, M + 36, 71, 8));
  Drain(`drain`, Box.fromRect(L, 80, TR, 0));


  // Game script

  let listeners = [
  ]

  const on = (name, type, λ) => {
    listeners.push([ name, type, λ ]);
  }

  const get = <T>(name:string):T => {
    return it.things[name] as T;
  }


  it.process = (input:InputState, events:EventQueue) => {
    get<Flipper>(`flipper_left`).state.active  = input.left;
    get<Flipper>(`flipper_right`).state.active = input.right;

    while (events.length) {
      let [ origin, event ] = events.pop();

      listeners.forEach(([ name, type, callback ]) => {
        console.log(name, type);
      });
    }
  }


  // Done

  console.log(`Loaded table '${it.name}': ${Object.values(it.things).length} things created.`);

  return it;
}

