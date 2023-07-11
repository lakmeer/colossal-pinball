
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
    process: (input:InputState, events:EventType[]) => {},
    score: 0,
    ballsInPlay: 0,
    balls: 0,
  } as Table;


  // TODO: Collect used colors under semantic names
  // TODO: Define presets of Thing primitives for this table
  // TODO: Move table def to now/index.ts
  // TODO: Make Table a class
  // TODO: There are slignshots in the upper vertical side guards
  // TODO: Ditch registering component names, just use variables
  // TODO: Lamp colors


  // Shorthand constructors

  const add = <T extends Thing>(thing:T):T => {
    if (T.things[thing.name]) console.warn(`Thing with name '${thing.name}' already exists`);
    T.things[thing.name] = thing;
    return thing as T;
  }

  // TODO: A better type-safe way of doing this pattern
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
  const SLINGS_STRENGTH = 0.3;
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

  const BALL_DROP_POSITION = Vec2.fromXY(TR + ballRad, 120);


  // Game State

  const state = {
    score: 0,
    balls: 5,
    awaitNewBall: true
  }

  const scoreRolloverDependsOnLamp = (r:Things.Rollover, l:Things.Lamp, fn:(lit:boolean) => number) => {
    on(r, EventType.ACTIVATED, () => state.score += fn(l.state.active));
  }


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

  let laneRollovers = [];
  let laneLamps     = [];

  for (let z = -2; z <= 2; z++) {
    let x = M + laneStride * z;
    Collider(`upper_lane_guard_${z+2}`, Capsule.from(x, 579, x, 622, 7));
  }

  for (let z = -1.5; z <= 1.5; z++) {
    let x = M + laneStride * z;
    let ix = z + 1.5;

    let roll = Rollover(`upper_lane_rollover_${ix}`, Capsule.from(x, 575, x, 608, rolloverRad));
    let lamp = Lamp(`upper_lane_lamp_${ix}`, Circle.at(x, 630, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));

    laneRollovers[ix] = roll;
    laneLamps[ix]     = lamp;

    scoreRolloverDependsOnLamp(roll, lamp, (lit) => lit ? 300 : 50);
  }


  // Upper targets and edge guards

  Collider(`upper_guard_left_a`,  Circle.at(TL + 39, 604, postRad));
  Collider(`upper_guard_left_b`,  Capsule.at(TL + 15, 538, postRad, 77));

  Collider(`upper_guard_right_a`, Capsule.at(TR - 48, 635, postRad, 26, TAU*14/32));
  Collider(`upper_guard_right_b`, Capsule.at(TR - 45, 612, postRad, 23, TAU*3/32));
  Collider(`upper_guard_right_c`,  Capsule.at(TR - 15, 538, postRad, 72));


  // Main Bumpers

  Deco(`bumper_deco_left`,  Circle.at(M - 85, 523, 36), Color.fromTw('slate-700'));
  Deco(`bumper_deco_mid`,   Circle.at(M     , 492, 36), Color.fromTw('slate-700'));
  Deco(`bumper_deco_right`, Circle.at(M + 85, 523, 36), Color.fromTw('slate-700'));

  let bumperLeft  = Bumper(`bumper_left`,  Circle.at(M + 85, 523, 25), BUMPER_STRENGTH);
  let bumperRight = Bumper(`bumper_right`, Circle.at(M - 85, 523, 25), BUMPER_STRENGTH);
  let bumperMid   = Bumper(`bumper_mid`,   Circle.at(M     , 492, 25), BUMPER_STRENGTH);

  let lamp_bumperLeft  = Lamp(`bumper_lamp_left`,  Circle.at(M + 85, 523, 15), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));
  let lamp_bumperRight = Lamp(`bumper_lamp_right`, Circle.at(M - 85, 523, 15), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));
  let lamp_bumperMid   = Lamp(`bumper_lamp_mid`,   Circle.at(M     , 492, 15), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));

  on(bumperLeft,  EventType.BOUNCED, () => console.log("TODO: Bumper score based on lamp"));
  on(bumperRight, EventType.BOUNCED, () => console.log("TODO: Bumper score based on lamp"));
  on(bumperMid,   EventType.BOUNCED, () => console.log("TODO: Bumper score based on lamp"));


  // Droptarget banks & slingshots

  type TargetBank = {
    targets: [ Things.DropTarget ],
    lamp:  Things.Lamp | null,
    multiplier: number;
  }

  let redBank:TargetBank = {
    targets: [],
    lamp: null,
    multiplier: 0,
  }

  let whiteBank = {
    targets: [],
    lamp: null,
    multiplier: 0,
  }

  let dt_width  = 14;
  let dt_stride = 26;

  for (let i = -1.5; i <= 1.5; i++) {
    let xl = M - 99 + dt_stride * i;
    let xr = M + 99 + dt_stride * i;
    let ix = i + 1.5;

    redBank.targets[ix]   = DropTarget(`dt_left_bank_${i+1.5}`,  Capsule.from(xl + dt_width/2, 408, xl - dt_width/2, 408, 2));
    whiteBank.targets[ix] = DropTarget(`dt_right_bank_${i+1.5}`, Capsule.from(xr + dt_width/2, 408, xr - dt_width/2, 408, 2));
  }

  redBank.lamp   = Lamp(`dt_lamp_red`,   Circle.at(M -  128, 440, 20), Color.fromTw('red-900'),   Color.fromTw('red-500'))
  whiteBank.lamp = Lamp(`dt_lamp_white`, Circle.at(M +  128, 440, 20), Color.fromTw('gray-600'), Color.fromTw('gray-100'))

  Bumper(`dt_ss_left`,   Capsule.at(M - 100, 445, 5, 80,  TAU*22/124), SLINGS_STRENGTH);
  Bumper(`dt_ss_right`,  Capsule.at(M + 100, 445, 5, 80, -TAU*22/124), SLINGS_STRENGTH);
  Collider(`dt_bank_left`,  Fence.at([ M - 147, 419, M - 147, 465, M - 53, 419 ], 6).close());
  Collider(`dt_bank_right`, Fence.at([ M + 147, 419, M + 147, 465, M + 53, 419 ], 6).close());


  // Midfield rollovers

  let midROL = Rollover(`mid_rollover_left`,   Capsule.at(TL + 16, 439, rolloverRad, 32));
  let midROR = Rollover(`mid_rollover_right`,  Capsule.at(TR - 16, 439, rolloverRad, 32));
  let midROLampL = Lamp(`mid_rollover_lamp_left`,  Circle.at(TL + 38, 493, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  let midROLampR = Lamp(`mid_rollover_lamp_right`, Circle.at(TR - 38, 493, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));

  scoreRolloverDependsOnLamp(midROL, midROLampL, lit => 100 + (lit ? state.red   : 0));
  scoreRolloverDependsOnLamp(midROR, midROLampR, lit => 100 + (lit ? state.white : 0));


  // Midfield guards (vertical part is just main wall)

  Collider(`mid_guard_left_top`,  Arc.at(TL + 20, 476, 2, 20, TAU*3/16, TAU*5/16));
  Collider(`mid_guard_left_btm`,  Arc.at(TL + 20, 411, 2, 20, TAU*3/16, TAU*8/16));
  Collider(`mid_guard_right_top`, Arc.at(TR - 24, 476, 2, 24, TAU*6/32, TAU*0/32));
  Collider(`mid_guard_right_btm`, Arc.at(TR - 24, 411, 2, 24, TAU*6/32, TAU*26/32));
  Collider(`mid_guard_right_end`, Capsule.from(TR - 16, 389, TR + 2, 389, 2));


  // Static Targets

  let tgtTopLeft  = Target(`tgt_top_left`,  Capsule.at(TL + 29, 587, targetRad, 16, TAU*59/64));
  let tgtMidLeft  = Target(`tgt_mid_left`,  Capsule.at(TL + 36, 347, targetRad, 16, TAU*29/64));
  let tgtBtmLeft  = Target(`tgt_btm_left`,  Capsule.at(TL + 25, 310, targetRad, 16, TAU*29/64));
  let tgtTopRight = Target(`tgt_top_right`, Capsule.at(TR - 29, 587, targetRad, 16, -TAU*59/64));
  let tgtMidRight = Target(`tgt_mid_right`, Capsule.at(TR - 36, 347, targetRad, 16, TAU*35/64));
  let tgtBtmRight = Target(`tgt_btm_right`, Capsule.at(TR - 25, 310, targetRad, 16, TAU*35/64));

  let lamp_tgtTopLeft  = Lamp(`tgt_lamp_top_left`,  Circle.at(TL + 39, 557, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  let lamp_tgtMidLeft  = Lamp(`tgt_lamp_mid_left`,  Circle.at(TL + 58, 331, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  let lamp_tgtBtmLeft  = Lamp(`tgt_lamp_btm_left`,  Circle.at(TL + 53, 296, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  let lamp_tgtTopRight = Lamp(`tgt_lamp_top_right`, Circle.at(TR - 39, 557, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  let lamp_tgtMidRight = Lamp(`tgt_lamp_mid_right`, Circle.at(TR - 58, 331, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  let lamp_tgtBtmRight = Lamp(`tgt_lamp_btm_right`, Circle.at(TR - 53, 296, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));

  on(tgtTopLeft,  EventType.BOUNCED, () => state.score += lamp_tgtTopLeft.state.active  ? 300 : 50);
  on(tgtMidLeft,  EventType.BOUNCED, () => state.score += lamp_tgtMidLeft.state.active  ? 300 : 50);
  on(tgtBtmLeft,  EventType.BOUNCED, () => state.score += lamp_tgtBtmLeft.state.active  ? 300 : 50);
  on(tgtTopRight, EventType.BOUNCED, () => state.score += lamp_tgtTopRight.state.active ? 300 : 50);
  on(tgtMidRight, EventType.BOUNCED, () => state.score += lamp_tgtMidRight.state.active ? 300 : 50);
  on(tgtBtmRight, EventType.BOUNCED, () => state.score += lamp_tgtBtmRight.state.active ? 300 : 50);


  // Lower Guards

  Collider(`lower_guard_left_top`,       Capsule.at(TL + 25, 376, postRad, 32, TAU*8/64));
  Collider(`lower_guard_left_mid`,       Circle.at(TL + 27, 330, postRad));

  Collider(`lower_guard_right_top_ang`,  Capsule.at(TR - 16, 353, postRad, 50, TAU*11/64));
  Collider(`lower_guard_right_mid`,      Circle.at(TR - 27, 330, postRad));


  // Outlane rollovers

  let outROL = Rollover(`out_rollover_left`,  Capsule.from(M + 136, 164, M + 136, 189, rolloverRad));
  let outROR = Rollover(`out_rollover_right`, Capsule.from(M - 136, 164, M - 136, 189, rolloverRad));
  let outLampL = Lamp(`out_rollover_lamp_left`,  Circle.at(M - 104, 251, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
  let outLampR = Lamp(`out_rollover_lamp_right`, Circle.at(M + 104, 251, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));


  // Outlane kickers and rails

  let kickL = Rollover(`kicker_left_score_ro`,  Capsule.at(TL + 15, 200, rolloverRad, 30));
  Bumper(`kicker_left`, Capsule.at(TL + 13, 176, 10, 7, TAU/4), KICKER_STRENGTH);

  let kickR = Rollover(`kicker_right_score_ro`, Capsule.at(TR - 15, 200, rolloverRad, 30));
  Bumper(`kicker_right`, Capsule.at(TR - 13, 176, 10, 7, TAU/4), KICKER_STRENGTH);

  Collider(`kicker_left_rail_outer`,     Arc.at(M, 205, 4, (TW - 8)/2, TAU*5/64, TAU*27/64));
  Collider(`kicker_left_rail_inner_top`, Arc.at(TL + 90, 203, 4, 60, TAU*7/64, TAU*25/64));
  Collider(`kicker_left_rail_inner`,     Capsule.from(TL + 30, 200, TL + 30, 135, 4));

  Collider(`kicker_right_rail_outer`,     Arc.at(M, 205, 4, (TW - 6)/2, TAU*5/64, TAU*0/64));
  Collider(`kicker_right_rail_inner_top`, Arc.at(TR - 90, 203, 4, 60, TAU*7/64, TAU*0/64));
  Collider(`kicker_right_rail_inner`,     Capsule.from(TR - 30, 200, TR - 30, 135, 4));



  // Lower slingshots
  // TODO: Only bounce if hit with threshold velocity

  Bumper(`lower_ss_left`,   Capsule.at(M - 100, 176, 3, 40,  TAU*1/11), SLINGS_STRENGTH);
  Bumper(`lower_ss_right`,  Capsule.at(M + 100, 176, 3, 40, -TAU*1/11), SLINGS_STRENGTH);
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
 
  let drain = Drain(`drain`, Box.fromRect(L, 80, TR, 0));

  on(drain, EventType.DRAINED, () => {
    if (T.ballsInPlay == 0) {
      drainedLastBall();
    }
  });


  // Game script

  // TODO:
  // - Red & White bonuses
  //   - Gets awarded by Red and White rollovers (outlane, kicker and midfield)
  //   - Bonus pays out when used by a rollover
  //   - Resets when used
  // - Bumpers don't award except when lit (10pts) (or award 1 pt? or 5?)
  // - Slingshots dont award (?? probably)
  // - Replay balls
  //   - Score matching - random digit generated at start of game
  //   - If final score matches last digit, get a free ball
  // - Seed Roller
  //   - Called at zero when new game starts
  //   - Incremented when score increases and tens column doesn't match??
  // - Alternationg Relay
  //   - MIGHT only trigger when tens column of score changes (not sure)
  // - Tilting doesn't lock the game
  //   - But implement tilting for ball control
  // - Max 15 balls
  // - Extra ball awarded at score milestones


  //
  // Target and Bumper Lamp Logic
  //

  enum ScoreMode { MODE_A, MODE_B }
  type LaneCombo = [ number, number, number, number ];

  let laneSeed    = 0; // 0 -> 9
  let scoreMode = ScoreMode.MODE_A;

  const setLaneLamps = (combo:LaneCombo) => {
    for (let ix in laneLamps) {
      laneLamps[ix].do(combo[ix] ? Command.ACTIVATE : Command.DEACTIVATE);
    }
  }

  const advanceLaneSeed = () => {
    laneSeed = (laneSeed + 1) % 10;
    setLaneLamps([
      [ 1,0,0,0 ],
      [ 0,1,0,0 ],
      [ 0,0,1,0 ],
      [ 0,0,0,1 ],
      [ 1,0,0,0 ],
      [ 0,1,0,0 ],
      [ 0,0,1,0 ],
      [ 0,0,0,1 ],
      [ 1,0,0,0 ],
      [ 0,0,0,1 ],
    ][laneSeed]);
    switchScoreMode();
  }

  function switchScoreMode () {
    if (scoreMode == ScoreMode.MODE_A) {
      scoreMode = ScoreMode.MODE_B;
      lamp_bumperLeft.do(Command.DEACTIVATE);
      lamp_bumperMid.do(Command.ACTIVATE);
      lamp_bumperRight.do(Command.DEACTIVATE);
      lamp_tgtTopLeft.do(Command.ACTIVATE);
      lamp_tgtMidLeft.do(Command.DEACTIVATE);
      lamp_tgtBtmLeft.do(Command.ACTIVATE);
      lamp_tgtTopRight.do(Command.DEACTIVATE);
      lamp_tgtMidRight.do(Command.ACTIVATE);
      lamp_tgtBtmRight.do(Command.DEACTIVATE);
    } else {
      scoreMode = ScoreMode.MODE_A;
      lamp_bumperLeft.do(Command.ACTIVATE);
      lamp_bumperMid.do(Command.DEACTIVATE);
      lamp_bumperRight.do(Command.ACTIVATE);
      lamp_tgtTopLeft.do(Command.DEACTIVATE);
      lamp_tgtMidLeft.do(Command.ACTIVATE);
      lamp_tgtBtmLeft.do(Command.DEACTIVATE);
      lamp_tgtTopRight.do(Command.ACTIVATE);
      lamp_tgtMidRight.do(Command.DEACTIVATE);
      lamp_tgtBtmRight.do(Command.ACTIVATE);
    }
  }


  //
  // Droptarget Bonus Logic and Rollovers
  //

  const updateBank = (bank:TargetBank) => {
    bank.multiplier = bank.targets.map(v => v.state.dropped).filter(v => v).length;

    if (bank.targets.every(v => v.state.dropped)) {
      bank.lamp.do(Command.ACTIVATE);
    } else {
      bank.lamp.do(Command.DEACTIVATE);
    }
  }

  const resetBank = (bank:TargetBank) => {
    bank.targets.forEach(tgt => tgt.do(Command.DEACTIVATE));
    updateBank(bank);
  }

  redBank.targets.forEach(tgt => {
    on(tgt, EventType.ACTIVATED, () => {
      updateBank(redBank);
      state.score += 100;
    });
  })

  whiteBank.targets.forEach(tgt => {
    on(tgt, EventType.ACTIVATED, () => {
      updateBank(whiteBank);
      state.score += 100;
    });
  })

  outLampL.do(Command.ACTIVATE);

  scoreRolloverDependsOnLamp(outROL, outLampL, lit => 100 + 100 * (lit ? redBank.multiplier   : 0));
  scoreRolloverDependsOnLamp(outROR, outLampR, lit => 100 + 100 * (lit ? whiteBank.multiplier : 0));
  scoreRolloverDependsOnLamp(kickL,  outLampL, lit => 100 + 100 * (lit ? redBank.multiplier   : 0));
  scoreRolloverDependsOnLamp(kickR,  outLampR, lit => 100 + 100 * (lit ? whiteBank.multiplier : 0));


  //
  // Game Flow
  //

  function newRound () {

    // TODO: How to communicate to the main game to spawn a new ball and
    //  where to put it? Should probably put this control with the table.
    //  In which case almost all the state moves inside to Table, and only
    //  the physics loop lives outside.
    //
    // NOTE: Prioritise Table as consumer of the API

    state.awaitNewBall = true;
  }

  function newGame () {
    clearState();

    state.balls = 5;
  }

  function drainedLastBall () {
    if (state.balls > 0) {
      newRound();
    } else {
      console.log("GAME OVER");
      clearState();
    }
  }

  function clearState () {
    T.ballsInPlay = 0;
    T.score = 0;
    T.balls = 0;
  }

  function launchBall () {
    get<Things.Launcher>(`launcher`).do(Command.ACTIVATE);
  }


  // TODO: Table.newGameState()?

  T.process = (input:InputState) => {
    get<Things.Flipper>(`flipper_left`).state.active  = input.left;
    get<Things.Flipper>(`flipper_right`).state.active = input.right;

    if (input.launch) {
      //if (T.gamemode === GameMode.WAITING && T.ballsInPlay > 0) {
        launchBall();
      //}
    }

    T.score = state.score;

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

  T.onRequestNewBall = (fn) => {
    if (state.awaitNewBall) {
      fn(BALL_DROP_POSITION);
      state.awaitNewBall = false;
    }
  }


  // Done

  console.log(`Loaded table '${T.name}': ${Object.values(T.things).length} things created.`);

  return T;
}

