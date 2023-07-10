
import type Shape from "$lib/Shape";
import type Table from "$lib/tables";
import type Thing from "$lib/Thing";

import Vec2  from "$lib/Vec2";
import Rect  from "$lib/Rect";
import Color from "$lib/Color";

import * as Things  from "$lib/Thing";
import { Circle, Capsule, Arc, Fence, Box } from "$lib/Shape";

import type { InputState, EventQueue } from "$types";
import { EventType, Command } from "$lib/Thing";

import { PI, TAU } from "$lib/utils";


//
// Generate the Now table
//

export default ():Table => {


  const T = {
    name: "NOW",
    bounds: new Rect(-216, 768, 216, 0),
    things: {},
    ballRad: 10,
    gravity: 1500,
    template: null,
    templateSrc: "/now.png",
    process: (input:InputState, events:EventType[]) => {}
  } as Table;


  // Shorthand constructors

  const add = (thing:Thing):Thing => {
    if (T.things[thing.name]) console.warn(`Thing with name '${thing.name}' already exists`);
    T.things[thing.name] = thing;
    return thing;
  }

  //@ts-ignore
  const Deco       = (name, ...args) => add(Things.Deco.from(name, ...args));
  //@ts-ignore
  const Collider   = (name, ...args) => add(Things.Collider.from(name, ...args));
  //@ts-ignore
  const Launcher   = (name, ...args) => add(Things.Launcher.from(name, ...args));
  //@ts-ignore
  const Drain      = (name, ...args) => add(Things.Drain.from(name, ...args));
  //@ts-ignore
  const Flipper    = (name, ...args) => add(Things.Flipper.from(name, ...args));
  //@ts-ignore
  const Kicker     = (name, ...args) => add(Things.Kicker.from(name, ...args));
  //@ts-ignore
  const Rollover   = (name, ...args) => add(Things.Rollover.from(name, ...args));
  //@ts-ignore
  const Lamp       = (name, ...args) => add(Things.Lamp.from(name, ...args));
  //@ts-ignore
  const Target     = (name, ...args) => add(Things.Target.from(name, ...args));
  //@ts-ignore
  const DropTarget = (name, ...args) => add(Things.DropTarget.from(name, ...args));
  //@ts-ignore
  const Bumper     = (name, ...args) => add(Things.Bumper.from(name, ...args));


  // Wiring

  let listeners = [ ];

  const on = (thing:Thing, type:EventType, λ:() => void) => {
    listeners.push([ thing.name, type, λ ]);
  }

  const get = <T>(name:string):T => {
    return T.things[name] as T;
  }


  //
  // Setup
  //

  const BUMPER_STRENGTH = 1;
  const KICKER_STRENGTH = 2;
  const LAUNCH_STRENGTH = 400;


  // Vars

  let ballRad     = 10;
  let lampRad     = 9;
  let rolloverRad = 6;
  let postRad     = 6;
  let targetRad   = 2;


  // Shorthand dimensions

  const L = T.bounds.left;
  const R = T.bounds.right;
  const W = T.bounds.w;
  const H = T.bounds.h;

  const TW = T.bounds.w - 54; // table width except chute
  const TR = L + TW;   // rightmost position excluding chute
  const TL = L + 16;   // leftmost position excluding outer wall
  const M  = L + TW/2 + 8; // middle line of playfield (fudged)


  //
  // Playfield Elements
  // TODO: adjust positioning to correct for perspective in the graphic
  //

  // Outer walls

  Collider(`topwall`,             Arc.at(-1, 530, 6, (W - 22)/2, TAU*8/16, TAU*0/16));
  Collider(`leftwall`,            Capsule.from(TL - 5, 0, TL - 5, 530, 7));
  Collider(`rightwall_inner_btm`, Capsule.from(TR + 6, 0, TR + 6, 339, 6));
  Collider(`rightwall_inner_top`, Capsule.from(TR + 5, 394, TR + 5, 547, 7));
  Collider(`rightwall_inner_arc`, Arc.at(M + 57, 547, 6, 130, TAU*1/7, 0));


  // Launch chute
  // TODO: one-way gate at the top of the chute

  Launcher(`launcher`,      Capsule.at(R - 30, 120, ballRad+2, 36), Vec2.at(0, LAUNCH_STRENGTH));
  Collider(`chute_wall`,    Capsule.from(R - 12, 0, R - 12, 530, 6));
  Collider(`chute_bottom`,  Capsule.at(R - 30, 90, 9, 20, TAU/4));
  Collider(`stopper`, Capsule.from(L + 61, 637, L + 66, 644, 13), 2);


  // Upper lanes

  let laneStride = 42;

  for (let z = -2; z <= 2; z++) {
    let x = M + laneStride * z;
    Collider(`upper_lane_guard_${z+2}`, Capsule.from(x, 579, x, 622, 7));
  }

  for (let z = -1.5; z <= 1.5; z++) {
    let x = M + laneStride * z;

    let roll = Rollover(`upper_lane_rollover_${z+1.5}`, Capsule.from(x, 575, x, 608, rolloverRad));
    let lamp = Lamp(`upper_lane_lamp_${z+1.5}`, Circle.at(x, 630, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));

    on(roll, EventType.ACTIVATED,   () => lamp.do(Command.ACTIVATE));
    on(roll, EventType.DEACTIVATED, () => lamp.do(Command.DEACTIVATE));
  }


  // Upper targets and edge guards

  Collider(`upper_guard_left_a`,  Circle.at(TL + 39, 604, postRad));
  Collider(`upper_guard_left_b`,  Capsule.at(TL + 15, 538, postRad, 77));

  Collider(`upper_guard_right_a`, Capsule.at(TR - 48, 635, postRad, 26, TAU*14/32));
  Collider(`upper_guard_right_b`, Capsule.at(TR - 45, 612, postRad, 23, TAU*3/32));
  Collider(`upper_guard_right_c`,  Capsule.at(TR - 15, 538, postRad, 72));

  Target(`tgt_top_left`,   Capsule.at(TL + 29, 587, targetRad, 16, TAU*59/64));
  Target(`tgt_top_right`,   Capsule.at(TR - 29, 587, targetRad, 16, -TAU*59/64));
  Lamp(`tgt_lamp_top_left`,  Circle.at(TL + 39, 557, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`tgt_lamp_top_right`, Circle.at(TR - 39, 557, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));


  // Main Bumpers

  let bLeft  = Bumper(`bumper_left`,  Circle.at(M + 85, 523, 25), BUMPER_STRENGTH);
  let bRight = Bumper(`bumper_right`, Circle.at(M - 85, 523, 25), BUMPER_STRENGTH);
  let bMid   = Bumper(`bumper_mid`,   Circle.at(M     , 492, 25), BUMPER_STRENGTH);

  let lLeft  = Lamp(`bumper_lamp_left`,  Circle.at(M + 85, 523, 15), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));
  let lRight = Lamp(`bumper_lamp_right`, Circle.at(M - 85, 523, 15), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));
  let lMid   = Lamp(`bumper_lamp_mid`,   Circle.at(M     , 492, 15), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));

  on(bLeft,  EventType.BOUNCED, () => lLeft.do(Command.LAMP_FLASH));
  on(bRight, EventType.BOUNCED, () => lRight.do(Command.LAMP_FLASH));
  on(bMid,   EventType.BOUNCED, () => lMid.do(Command.LAMP_FLASH));


  // Droptarget banks & slingshots

  let dt_width  = 14;
  let dt_stride = 26;

  let redBank = {
    state: [ false, false, false, false ],
    lamp:  Lamp(`dt_lamp_red`,   Circle.at(M -  128, 440, 20), Color.fromTw('red-900'),   Color.fromTw('red-500'))
  }

  let whiteBank = {
    state: [ false, false, false, false ],
    lamp:  Lamp(`dt_lamp_white`, Circle.at(M +  128, 440, 20), Color.fromTw('gray-600'), Color.fromTw('gray-100'))
  }

  const setBankState = (bank, ix:number, state:boolean) => {
    bank.state[ix] = state;
    if (bank.state.every(v => v)) {
      bank.lamp.do(Command.ACTIVATE);
    } else {
      bank.lamp.do(Command.DEACTIVATE);
    }
  }

  for (let i = -1.5; i <= 1.5; i++) {
    let xl = M - 99 + dt_stride * i;
    let xr = M + 99 + dt_stride * i;
    let ix = i + 1.5;

    let red   = DropTarget(`dt_left_bank_${i+1.5}`,  Capsule.from(xl + dt_width/2, 408, xl - dt_width/2, 408, 2));
    let white = DropTarget(`dt_right_bank_${i+1.5}`, Capsule.from(xr + dt_width/2, 408, xr - dt_width/2, 408, 2));

    on(red,   EventType.ACTIVATED,   () => setBankState(redBank,   ix, true ));
    on(red,   EventType.DEACTIVATED, () => setBankState(redBank,   ix, false));
    on(white, EventType.ACTIVATED,   () => setBankState(whiteBank, ix, true ));
    on(white, EventType.DEACTIVATED, () => setBankState(whiteBank, ix, false));
  }

  Bumper(`dt_ss_left`,   Capsule.at(M - 100, 445, 5, 80,  TAU*22/124), BUMPER_STRENGTH);
  Bumper(`dt_ss_right`,  Capsule.at(M + 100, 445, 5, 80, -TAU*22/124), BUMPER_STRENGTH);
  Collider(`dt_bank_left`,  Fence.at([ M - 147, 419, M - 147, 465, M - 53, 419 ], 6).close());
  Collider(`dt_bank_right`, Fence.at([ M + 147, 419, M + 147, 465, M + 53, 419 ], 6).close());


  // Midfield rollovers

  Rollover(`mid_rollover_left`,   Capsule.at(TL + 16, 439, rolloverRad, 32));
  Rollover(`mid_rollover_right`,  Capsule.at(TR - 16, 439, rolloverRad, 32));
  Lamp(`mid_rollover_lamp_left`,  Circle.at(TL + 38, 493, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`mid_rollover_lamp_right`, Circle.at(TR - 38, 493, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));


  // Midfield guards (vertical part is just main wall)

  Collider(`mid_guard_left_top`,  Arc.at(TL + 20, 476, 2, 20, TAU*3/16, TAU*5/16));
  Collider(`mid_guard_left_btm`,  Arc.at(TL + 20, 411, 2, 20, TAU*3/16, TAU*8/16));
  Collider(`mid_guard_right_top`, Arc.at(TR - 24, 476, 2, 24, TAU*6/32, TAU*0/32));
  Collider(`mid_guard_right_btm`, Arc.at(TR - 24, 411, 2, 24, TAU*6/32, TAU*26/32));
  Collider(`mid_guard_right_end`, Capsule.from(TR - 16, 389, TR + 2, 389, 2));


  // Lower Targets

  Target(`tgt_left_upper`,  Capsule.at(TL + 36, 347, targetRad, 16, TAU*29/64));
  Target(`tgt_left_lower`,  Capsule.at(TL + 25, 310, targetRad, 16, TAU*29/64));
  Target(`tgt_right_upper`, Capsule.at(TR - 36, 347, targetRad, 16, TAU*35/64));
  Target(`tgt_right_lower`, Capsule.at(TR - 25, 310, targetRad, 16, TAU*35/64));

  Lamp(`tgt_lamp_left_upper`,  Circle.at(TL + 58, 331, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`tgt_lamp_right_upper`, Circle.at(TR - 58, 331, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`tgt_lamp_left_lower`,  Circle.at(TL + 53, 296, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`tgt_lamp_right_lower`, Circle.at(TR - 53, 296, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));


  // Lower Guards

  Collider(`lower_guard_left_top`,       Capsule.at(TL + 25, 376, postRad, 32, TAU*8/64));
  Collider(`lower_guard_left_mid`,       Circle.at(TL + 27, 330, postRad));
  //Collider(`lower_guard_left_out_post`,  Circle.at(TL + 42, 234, postRad));

  Collider(`lower_guard_right_top_ang`,  Capsule.at(TR - 16, 353, postRad, 50, TAU*11/64));
  Collider(`lower_guard_right_mid`,      Circle.at(TR - 27, 330, postRad));
  //Collider(`lower_guard_right_out_post`, Circle.at(TR - 42, 234, postRad));


  // Outlane rollovers

  Rollover(`out_rollover_left`,  Capsule.from(M + 136, 164, M + 136, 189, rolloverRad));
  Rollover(`out_rollover_right`, Capsule.from(M - 136, 164, M - 136, 189, rolloverRad));
  Lamp(`out_rollover_lamp_left`,  Circle.at(M + 104, 251, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`out_rollover_lamp_right`, Circle.at(M - 104, 251, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));


  // Outlane kickers and rails

  Rollover(`kicker_left_score_ro`,       Capsule.at(TL + 15, 200, rolloverRad, 30));
  Bumper(`kicker_left`, Capsule.at(TL + 13, 176, 10, 7, TAU/4), KICKER_STRENGTH);

  Rollover(`kicker_right_score_ro`,       Capsule.at(TR - 15, 200, rolloverRad, 30));
  Bumper(`kicker_right`, Capsule.at(TR - 13, 176, 10, 7, TAU/4), KICKER_STRENGTH);

  Collider(`kicker_left_rail_outer`,     Arc.at(M, 205, 4, (TW - 8)/2, TAU*5/64, TAU*27/64));
  Collider(`kicker_left_rail_inner_top`, Arc.at(TL + 90, 203, 4, 60, TAU*7/64, TAU*25/64));
  Collider(`kicker_left_rail_inner`,     Capsule.from(TL + 30, 200, TL + 30, 135, 4));

  Collider(`kicker_right_rail_outer`,     Arc.at(M, 205, 4, (TW - 6)/2, TAU*5/64, TAU*0/64));
  Collider(`kicker_right_rail_inner_top`, Arc.at(TR - 90, 203, 4, 60, TAU*7/64, TAU*0/64));
  Collider(`kicker_right_rail_inner`,     Capsule.from(TR - 30, 200, TR - 30, 135, 4));


  // Lower slingshots
  // TODO: Only bounce if hit with threshold velocity

  Bumper(`lower_ss_left`,   Capsule.at(M - 100, 176, 3, 40,  TAU*1/11), BUMPER_STRENGTH);
  Bumper(`lower_ss_right`,  Capsule.at(M + 100, 176, 3, 40, -TAU*1/11), BUMPER_STRENGTH);
  Collider(`lower_ss_left_body`,  Fence.at([ M - 89, 150, M - 119, 198, M - 119, 161 ], 6).close());
  Collider(`lower_ss_right_body`, Fence.at([ M + 89, 150, M + 119, 198, M + 119, 161 ], 6).close());


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
    flipperRestAngle * -1,
    flipperRange,
    50);

  Flipper(`flipper_right`,
    M + 25 + flipperLength,
    138,
    flipperRad,
    flipperLength,
    flipperRestAngle + TAU/2,
    -flipperRange,
    50);


  // Central drain

  Collider(`drain_wall_left`,  Capsule.from(TL, 144, M - 36, 71, 8));
  Collider(`drain_wall_right`, Capsule.from(TR, 144, M + 36, 71, 8));
  Drain(`drain`, Box.fromRect(L, 80, TR, 0));


  // Game script

  enum ScoringPhase {
    NONE,
    RED,
    WHITE,
  }

  const state = {
    score: 0,
    balls: 3,
    white: 0,
    red:   0,
    phase: ScoringPhase.NONE,
  }

  T.process = (input:InputState) => {
    get<Things.Flipper>(`flipper_left`).state.active  = input.left;
    get<Things.Flipper>(`flipper_right`).state.active = input.right;

    if (input.launch) get<Things.Launcher>(`launcher`).do(Command.ACTIVATE);

    for (let name in T.things) {
      let thing = T.things[name];

      while (thing.events.length) {
        let event = thing.events.pop();

        listeners.forEach(([ name, type, callback ]) => {
          if (name === thing.name && type === event) {
            callback();
          }
        });
      }
    }
  }


  // Done

  console.log(`Loaded table '${T.name}': ${Object.values(T.things).length} things created.`);

  return T;
}

