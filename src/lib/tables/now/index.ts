
import type Shape from "$lib/Shape";
import type Table from "$lib/tables";
import type Zone  from "$lib/Zone";

import Vec2     from "$lib/Vec2";
import Rect     from "$lib/Rect";
import Deco     from "$lib/Deco";
import Color    from "$lib/Color";
import Flipper  from "$lib/Flipper";
import Collider from "$lib/Collider";

import { Segment, Circle, Capsule, Arc, Fence, Box } from "$lib/Shape";
import { Drain, Rollover } from "$lib/Zone";

import { PI, TAU } from "$lib/utils";


//
// Generate the Now table
//

export default ():Table => {

  const name = "NOW";
  const bounds = new Rect(-216, 768, 216, 0);
  const colliders:Record<string,Collider> = {};
  const zones:Record<string,Zone> = {};
  const decos:Record<string,Shape> = {};
  const flippers = {} as Table["flippers"];


  // Vars

  let ballRad    = 9;
  let ballSize   = ballRad * 2;
  let chuteWidth = ballSize + 2;
  let lampRad    = ballRad;


  // Shorthands

  const L  = bounds.left;
  const R  = bounds.right;
  const W  = bounds.w;
  const H  = bounds.h;

  const TW = bounds.w - 54; // table width except chute
  const TR = L + TW;   // rightmost position excluding chute
  const TL = L + 16;   // leftmost position excluding outer wall
  const M  = L + TW/2 + 8; // middle line of playfield (fudged)


  // Adds a collider to the field based on the shape
  // TODO: Formalise this

  const C = (name:string, shape:Shape, color = Color.static()) => {
    if (colliders[name]) console.warn(`Collider '${name}' already exists`);
    colliders[name] = new Collider(shape, color);
  }

  const Z = (name:string, zone:Zone, color = Color.static()) => {
    if (zones[name]) console.warn(`Zone '${name}' already exists`);
    zones[name] = zone;
  }

  const D = (name:string, shape:Shape, color = Color.static()) => {
    if (decos[name]) console.warn(`Deco '${name}' already exists`);
    decos[name] = new Deco(shape, color);
  }




  //
  // Playfield Elements
  //

  // Launch chute and outer walls

  C(`chutewall_inner_btm`, Capsule.at(TR + 6,   0, TR + 6, 339, 6));
  C(`chutewall_inner_top`, Capsule.at(TR + 6, 398, TR + 6, 547, 6));
  C(`chutewall_inner_arc`, Arc.at(M + 57, 547, 6, 130, TAU*1/7, 0));
  C(`chutewall_outer`,     Capsule.at(R - 12, 0, R - 12, 530, 6));
  C(`leftwall`,            Capsule.at(TL - 6, 0, TL - 6, 530, 6));
  C(`topwall`,             Arc.at(-1, 530, 6, (W - 22)/2, TAU*8/16, TAU*0/16));


  // Stopper

  C(`stopper`, Capsule.at(L + 61, 637, L + 66, 644, 13), Color.fromTw('white'));


  // Upper lanes

  let laneMiddle = M;
  let laneStride = 42;

  for (let z = -2; z <= 2; z++) {
    let x = laneMiddle + laneStride * z;
    C(`upper_lane_guard_${z+2}`, Capsule.at(x, 582, x, 622, 8), Color.fromTw('teal-500'));
  }

  for (let z = -1.5; z <= 1.5; z++) {
    let x = laneMiddle + laneStride * z;
    Z(`upper_lane_rollover_${z+1.5}`, Rollover.from(Capsule.at(x, 575, x, 608, 6), Color.fromTw('pink-500')));
    D(`upper_lane_lamp_${z+1.5}`,     Circle.at(x, 630, lampRad), Color.fromTw('yellow-500'));
  }


  // Upper guards

  C(`upper_guard_left_a`,  Circle.at(M - 143, 608, 7), Color.fromTw('violet-500'));
  C(`upper_guard_left_b`,  Capsule.at(M - 167, 509, M - 167, 575, 9), Color.fromTw('violet-500'));

  C(`upper_guard_right_a`, Capsule.at(M + 139, 644, M + 133, 627, 9), Color.fromTw('violet-500'));
  C(`upper_guard_right_b`, Capsule.at(M + 143, 612, M + 133, 627, 9), Color.fromTw('violet-500'));
  C(`upper_guard_right_c`, Capsule.at(M + 167, 509, M + 167, 575, 9), Color.fromTw('violet-500'));


  // Main Bumpers

  C(`bumper_left`,      Circle.at(M + 85, 523, 25));
  C(`bumper_right`,     Circle.at(M - 85, 523, 25));
  C(`bumper_mid`,       Circle.at(M     , 492, 25));
  D(`bumper_mid_top`,   Circle.at(M     , 509, 32), Color.fromTw('cyan-600').alpha(0.5));
  D(`bumper_left_top`,  Circle.at(M + 85, 540, 32), Color.fromTw('cyan-600').alpha(0.5));
  D(`bumper_right_top`, Circle.at(M - 85, 540, 32), Color.fromTw('cyan-600').alpha(0.5));


  // Upper Targets

  C(`tgt_top_left`,       Segment.at(TL + 32, 600, TL + 23, 584), Color.fromTw('red-500'));
  C(`tgt_top_right`,      Segment.at(TR - 32, 600, TR - 23, 584).flipNormal(), Color.fromTw('red-500'));
  D(`tgt_lamp_top_left`,  Circle.at(TL + 39, 557, lampRad), Color.fromTw('lime-500'));
  D(`tgt_lamp_top_right`, Circle.at(TR - 39, 557, lampRad), Color.fromTw('lime-500'));


  // Droptarget banks & slingshots

  let dt_width  = 14;
  let dt_stride = 26;

  for (let i = -1.5; i <= 1.5; i++) {
    let xl = M - 99 + dt_stride * i;
    let xr = M + 99 + dt_stride * i;
    C(`dt_left_bank_${i+1.5}`,  Segment.at(xl + dt_width/2, 408, xl - dt_width/2, 408), Color.fromTw('white'));
    C(`dt_right_bank_${i+1.5}`, Segment.at(xr + dt_width/2, 408, xr - dt_width/2, 408), Color.fromTw('white'));
  }
 
  C(`dt_ss_left`,      Fence.at([ M - 147, 419, M - 147, 465, M -  56, 419 ], 6).close(), Color.fromTw('indigo-500'));
  D(`dt_ss_left_top`,  Fence.at([ M - 147, 429, M - 147, 475, M -  56, 429 ], 6).close(), Color.fromTw('cyan-500').alpha(0.5));

  C(`dt_ss_right`,     Fence.at([ M + 147, 419, M + 147, 465, M +  56, 419 ], 6).close(), Color.fromTw('indigo-500'));
  D(`dt_ss_right_top`, Fence.at([ M + 147, 429, M + 147, 475, M +  56, 429 ], 6).close(), Color.fromTw('cyan-500').alpha(0.5));


  // Midfield rollovers

  Z(`mid_rollover_left`,  Rollover.from(Capsule.at(TL + 16, 424, TL + 16, 455, 6), Color.fromTw('amber-500')));
  Z(`mid_rollover_right`, Rollover.from(Capsule.at(TR - 16, 424, TR - 16, 455, 6), Color.fromTw('amber-500')));
  D(`mid_rollover_lamp_left`,  Circle.at(TL + 38, 493, lampRad), Color.fromTw('lime-500'));
  D(`mid_rollover_lamp_right`, Circle.at(TR - 38, 493, lampRad), Color.fromTw('lime-500'));

  C(`mid_guard_left_top`, Arc.at(TL + 22, 482, 1, 20, TAU*3/16, TAU*5/16), Color.fromTw('white'));
  C(`mid_guard_left_mid`, Segment.at(TL + 2, 482, TL + 2, 412), Color.fromTw('white'));
  C(`mid_guard_left_btm`, Arc.at(TL + 22, 412, 1, 20, TAU*3/16, TAU*8/16), Color.fromTw('white'));
  C(`mid_guard_left_end`, Capsule.at(TL + 14, 393, TL + 0, 393, 1), Color.fromTw('white'));

  C(`mid_guard_right_top`, Arc.at(TR - 22, 482, 1, 20, TAU*3/16, TAU*0/16), Color.fromTw('white'));
  C(`mid_guard_right_mid`, Segment.at(TR - 2, 412, TR - 2, 482), Color.fromTw('white'));
  C(`mid_guard_right_btm`, Arc.at(TR - 22, 412, 1, 20, TAU*3/16, TAU*13/16), Color.fromTw('white'));
  C(`mid_guard_right_end`, Capsule.at(TR - 14, 393, TR + 6, 393, 1), Color.fromTw('white'));


  // Lower Targets

  C(`tgt_left_upper`,       Segment.at(TL + 32, 360, TL + 28, 344), Color.fromTw('yellow-500'));
  C(`tgt_right_upper`,      Segment.at(TR - 32, 360, TR - 28, 344).flipNormal(), Color.fromTw('yellow-500'));
  D(`tgt_lamp_left_upper`,  Circle.at(TL + 58, 331, lampRad), Color.fromTw('lime-500'));
  D(`tgt_lamp_right_upper`, Circle.at(TR - 58, 331, lampRad), Color.fromTw('lime-500'));
  C(`tgt_left_lower`,       Segment.at(TL + 27, 324, TL + 21, 307), Color.fromTw('purple-500'));
  C(`tgt_right_lower`,      Segment.at(TR - 27, 324, TR - 21, 307).flipNormal(), Color.fromTw('purple-500'));
  D(`tgt_lamp_left_lower`,  Circle.at(TL + 53, 296, lampRad), Color.fromTw('blue-500'));
  D(`tgt_lamp_right_lower`, Circle.at(TR - 53, 296, lampRad), Color.fromTw('blue-500'));

  
  // Lower Guards

  C(`lower_guard_left_top`, Capsule.at(TL + 11, 383, TL + 31, 374, 9), Color.fromTw('emerald-500'));
  C(`lower_guard_left_mid`, Circle.at(TL + 21, 334, 9), Color.fromTw('emerald-500'));
  C(`lower_guard_left_btm`, Circle.at(TL + 14, 299, 9), Color.fromTw('emerald-500'));


  // Outlane rollovers

  Z(`out_rollover_left`,  Rollover.from(Capsule.at(M + 137, 164, M + 137, 189, 6), Color.fromTw('amber-500')));
  Z(`out_rollover_right`, Rollover.from(Capsule.at(M - 137, 164, M - 137, 189, 6), Color.fromTw('amber-500')));
  D(`out_rollover_lamp_left`,  Circle.at(M + 104, 251, lampRad), Color.fromTw('orange-500')); 
  D(`out_rollover_lamp_right`, Circle.at(M - 104, 251, lampRad), Color.fromTw('orange-500'));


  // Outlane hidden

  C(`out_hidden_left`,  Arc.at(M, 208, 3, (TW - 9)/2, TAU*5/64, TAU*27/64), Color.fromTw('pink-500'));
  C(`out_hidden_right`, Arc.at(M, 208, 3, (TW - 9)/2, TAU*5/64, TAU*0/64), Color.fromTw('pink-500'));


  // Lower slingshots

  C(`lower_ss_left`,      Fence.at([ M - 89, 150, M - 119, 198, M - 119, 161 ], 6).close(), Color.fromTw('red-500'));
  D(`lower_ss_left_top`,  Fence.at([ M - 89, 157, M - 119, 205, M - 119, 168 ], 6).close(), Color.fromTw('yellow-500').alpha(0.5));
  C(`lower_ss_right`,     Fence.at([ M + 89, 150, M + 119, 198, M + 119, 161 ], 6).close(), Color.fromTw('red-500'));
  D(`lower_ss_right_top`, Fence.at([ M + 89, 157, M + 119, 205, M + 119, 168 ], 6).close(), Color.fromTw('yellow-500').alpha(0.5));


  // Flippers

  let flipperRad = 9;
  let flipperLength = 51;
  let flipperRestAngle = TAU/12;
  let flipperRange = TAU/6;

  flippers.left  = new Flipper(Vec2.fromXY(M - 25 - flipperLength, 138), 
    flipperRad,
    flipperLength,
    0  - flipperRestAngle,
    flipperRange, 50);

  flippers.right = new Flipper(Vec2.fromXY(M + 25 + flipperLength, 138), 
    flipperRad,
    flipperLength,
    PI + flipperRestAngle,
    -flipperRange, 50);


  // Central drain

  C(`drain_left`,  Segment.at(TL, 153, M - 34, 80));
  C(`drain_right`, Segment.at(TR, 153, M + 34, 80).flipNormal());
  Z(`drain`, Drain.from(Box.fromRect(L, 80, TR, 0)));


  // Done

  console.log(`Loaded table '${name}':
  ${Object.values(zones).length} zones
  ${Object.values(colliders).length} colliders
  ${Object.values(flippers).length} flippers`);

  return {
    bounds,
    zones,
    decos,
    flippers,
    colliders,
    template: null,
    templateSrc: "/now.png",
    ballRad: ballSize/2,
  }
}

