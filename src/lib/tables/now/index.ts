
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

  const BUMPER_STRENGTH = 1;
  const KICKER_STRENGTH = 2;


  // Vars

  let ballRad    = 9;
  let ballSize   = ballRad * 2;
  let chuteWidth = ballSize + 2;
  let lampRad    = ballRad;


  // Shorthand dimensions

  const L = it.bounds.left;
  const R = it.bounds.right;
  const W = it.bounds.w;
  const H = it.bounds.h;

  const TW = it.bounds.w - 54; // table width except chute
  const TR = L + TW;   // rightmost position excluding chute
  const TL = L + 16;   // leftmost position excluding outer wall
  const M  = L + TW/2 + 8; // middle line of playfield (fudged)


  // Shorthand constructors

  const add = (thing:Thing):Thing => {
    if (it.things[thing.name]) console.warn(`Thing with name '${thing.name}' already exists`);
    it.things[thing.name] = thing;
    return thing;
  }

  //@ts-ignore
  const Deco       = (name, ...args) => add(Things.Deco.from(name, ...args));
  //@ts-ignore
  const Collider   = (name, ...args) => add(Things.Collider.from(name, ...args));
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
    return it.things[name] as T;
  }


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

  Collider(`stopper`, Capsule.from(L + 61, 637, L + 66, 644, 13), 2);


  // Upper lanes

  let laneMiddle = M;
  let laneStride = 42;

  for (let z = -2; z <= 2; z++) {
    let x = laneMiddle + laneStride * z;
    Collider(`upper_lane_guard_${z+2}`, Capsule.from(x, 582, x, 622, 8));
  }

  for (let z = -1.5; z <= 1.5; z++) {
    let x = laneMiddle + laneStride * z;

    let roll = Rollover(`upper_lane_rollover_${z+1.5}`, Capsule.from(x, 575, x, 608, 8));
    let lamp = Lamp(`upper_lane_lamp_${z+1.5}`, Circle.at(x, 630, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));

    on(roll, EventType.ACTIVATED,   () => lamp.do(Command.ACTIVATE));
    on(roll, EventType.DEACTIVATED, () => lamp.do(Command.DEACTIVATE));
  }


  // Upper guards

  Collider(`upper_guard_left_a`,  Circle.at(M - 143, 612, 9));
  Collider(`upper_guard_left_b`,  Capsule.from(M - 167, 509, M - 167, 575, 9));

  Collider(`upper_guard_right_a`, Capsule.from(M + 139, 644, M + 133, 627, 9));
  Collider(`upper_guard_right_b`, Capsule.from(M + 143, 612, M + 133, 627, 9));
  Collider(`upper_guard_right_c`, Capsule.from(M + 167, 509, M + 167, 575, 9));


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


  // Upper Targets

  Target(`tgt_top_left`,   Capsule.from(TL + 32, 600, TL + 23, 584, 2));
  Target(`tgt_top_right`,  Capsule.from(TR - 32, 600, TR - 23, 584, 2));
  Lamp(`tgt_lamp_top_left`,  Circle.at(TL + 39, 557, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`tgt_lamp_top_right`, Circle.at(TR - 39, 557, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));


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

  Bumper(`dt_ss_left`,   Capsule.at(M - 100, 444, 5, 80,  TAU*11/63), BUMPER_STRENGTH);
  Bumper(`dt_ss_right`,  Capsule.at(M + 100, 444, 5, 80, -TAU*11/63), BUMPER_STRENGTH);
  Collider(`dt_bank_left`,  Fence.at([ M - 147, 419, M - 147, 465, M -  56, 419 ], 6).close());
  Collider(`dt_bank_right`, Fence.at([ M + 147, 419, M + 147, 465, M +  56, 419 ], 6).close());


  // Not a real playfield component



  // Midfield rollovers

  Rollover(`mid_rollover_left`,   Capsule.from(TL + 16, 424, TL + 16, 455, 8));
  Rollover(`mid_rollover_right`,  Capsule.from(TR - 16, 424, TR - 16, 455, 8));
  Lamp(`mid_rollover_lamp_left`,  Circle.at(TL + 38, 493, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`mid_rollover_lamp_right`, Circle.at(TR - 38, 493, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));


  // Midfield guards

  Collider(`mid_guard_left_top`, Arc.at(TL + 22, 482, 1, 20, TAU*3/16, TAU*5/16));
  Collider(`mid_guard_left_mid`, Capsule.from(TL + 2, 482, TL + 2, 412, 1));
  Collider(`mid_guard_left_btm`, Arc.at(TL + 22, 412, 1, 20, TAU*3/16, TAU*8/16));

  Collider(`mid_guard_right_top`, Arc.at(TR - 22, 482, 1, 20, TAU*3/16, TAU*0/16));
  Collider(`mid_guard_right_mid`, Capsule.from(TR - 2, 412, TR - 2, 482, 1));
  Collider(`mid_guard_right_btm`, Arc.at(TR - 22, 412, 1, 20, TAU*3/16, TAU*13/16));
  Collider(`mid_guard_right_end`, Capsule.from(TR - 14, 393, TR + 6, 393, 1));


  // Lower Targets

  Target(`tgt_left_upper`,  Capsule.from(TL + 32, 360, TL + 28, 344, 2));
  Target(`tgt_right_upper`, Capsule.from(TR - 32, 360, TR - 28, 344, 2));
  Target(`tgt_left_lower`,  Capsule.from(TL + 27, 324, TL + 21, 307, 2));
  Target(`tgt_right_lower`, Capsule.from(TR - 27, 324, TR - 21, 307, 2));

  Lamp(`tgt_lamp_left_upper`,  Circle.at(TL + 58, 331, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`tgt_lamp_right_upper`, Circle.at(TR - 58, 331, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`tgt_lamp_left_lower`,  Circle.at(TL + 53, 296, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`tgt_lamp_right_lower`, Circle.at(TR - 53, 296, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));


  // Lower Guards

  Collider(`lower_guard_left_top`,       Capsule.from(TL + 11, 386, TL + 31, 372, 9));
  Collider(`lower_guard_left_mid`,       Circle.at(TL + 21, 334, 9));
  Collider(`lower_guard_left_btm`,       Circle.at(TL + 14, 299, 9));
  Collider(`lower_guard_left_out_post`,  Circle.at(TL + 39, 238, 9));

  Collider(`lower_guard_right_top`,      Circle.at(TR - 31, 372, 9));
  Collider(`lower_guard_right_top_ang`,  Capsule.at(TR - 11, 357, 6, 47, TAU*2/16));
  Collider(`lower_guard_right_mid`,      Circle.at(TR - 21, 334, 9));
  Collider(`lower_guard_right_btm`,      Circle.at(TR - 14, 299, 9));
  Collider(`lower_guard_right_out_post`, Circle.at(TR - 39, 238, 9));


  // Outlane rollovers

  Rollover(`out_rollover_left`,  Capsule.from(M + 136, 164, M + 136, 189, 8));
  Rollover(`out_rollover_right`, Capsule.from(M - 136, 164, M - 136, 189, 8));
  Lamp(`out_rollover_lamp_left`,  Circle.at(M + 104, 251, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  Lamp(`out_rollover_lamp_right`, Circle.at(M - 104, 251, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));


  // Outlane kickers

  Collider(`kicker_left_rail_outer`,  Arc.at(M, 208, 3, (TW - 9)/2, TAU*5/64, TAU*27/64));
  Collider(`kicker_left_rail_inner`,  Capsule.from(TL + 32, 238, TL + 32, 160, 2));
  Collider(`kicker_left_stopper`,     Circle.at(TL + 25, 157, 9));
  Rollover(`kicker_left_score_ro`, Capsule.at(TL + 15, 200, 8, 30));
  Bumper(`kicker_left`,            Capsule.at(TL + 15, 176, 10, 10, TAU/4), KICKER_STRENGTH);

  Collider(`kicker_right_rail_outer`, Arc.at(M, 208, 3, (TW - 9)/2, TAU*5/64, TAU*0/64));
  Collider(`kicker_right_rail_inner`, Capsule.from(TR - 32, 238, TR - 32, 160, 2));
  Collider(`kicker_right_stopper`,    Circle.at(TR - 25, 157, 9));
  Rollover(`kicker_right_score_ro`, Capsule.at(TR - 15, 200, 8, 30));
  Bumper(`kicker_right`,            Capsule.at(TR - 15, 176, 10, 10, TAU/4), KICKER_STRENGTH);


  // Lower slingshots

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

  it.process = (input:InputState) => {
    get<Things.Flipper>(`flipper_left`).state.active  = input.left;
    get<Things.Flipper>(`flipper_right`).state.active = input.right;

    for (let name in it.things) {
      let thing = it.things[name];

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

  console.log(`Loaded table '${it.name}': ${Object.values(it.things).length} things created.`);

  return it;
}

