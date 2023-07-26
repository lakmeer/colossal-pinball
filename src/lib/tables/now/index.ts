
import type Shape from "$lib/Shape";
import type Thing from "$lib/Thing";

import Vec2  from "$lib/Vec2";
import Rect  from "$lib/Rect";
import Color from "$lib/Color";
import Table from "$lib/tables";

import * as Things  from "$lib/Thing";
import { Circle, Capsule, Arc, Fence, Box } from "$lib/Shape";

import type { InputState, EventQueue } from "$types";
import { EventType, Command } from "$lib/Thing";

import { PI, TAU } from "$lib/utils";


//
// Generate the Now table
//

export default class Now extends Table {

  // TODO: Collect used colors under semantic names
  // TODO: Lamp colors
  // TODO: There are slignshots in the upper vertical side guards
  // TODO: Ditch registering component names, just use variables

  onProcess: (input:InputState) => void;
  onNewBall: (fn:Function) => void;

  constructor () {

    super();

    this.name = "NOW";
    
    this.things = {},

    this.config = {
      bounds: new Rect(-256, 970, 256, 0),
      ballRad: 13,
      gravity: 1500,
    };

    this.gameState = {
      score: 0,
      ballStock: 5,
      awaitNewBall: true,
      ballsInPlay: 0,
    }
  

    const add = <T extends Thing>(thing:T):T => {
      if (this.things[thing.name]) console.warn(`Thing with name '${thing.name}' already exists`);
      this.things[thing.name] = thing;
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
      return this.things[name] as T;
    }


    //
    // Setup
    //

    const BUMPER_STRENGTH = 0.3;
    const SLINGS_STRENGTH = 0.3;
    const KICKER_STRENGTH = 0.5;
    const LAUNCH_STRENGTH = 0.01;
    const FLIPPER_SPEED   = 30;

    // TODO: Score config here as const
    // const POINTS_BUMPER_UNLIT = 1; 
    // etc


    // Vars

    let ballRad     = this.config.ballRad;
    let lampRad     = 12;
    let rolloverRad = 6;
    let postRad     = 8;
    let targetRad   = 2;


    // Shorthand dimensions

    const L = this.config.bounds.left;
    const R = this.config.bounds.right;
    const W = this.config.bounds.w;
    const H = this.config.bounds.h;

    const TL = L + 10;       // leftmost position excluding outer wall
    const TR = R - 54;       // rightmost position excluding chute
    const TW = TR - TL;      // width of playfield
    const M  = L + TW/2 + 11; // middle line of playfield (fudged)

    const BALL_DROP_POSITION = Vec2.fromXY(TR + ballRad, 120);

    const TT = H - 15;
    const TB = 90;


    // Game State

    let state = this.gameState;

    const scoreRolloverDependsOnLamp = (r:Things.Rollover, l:Things.Lamp, fn:(lit:boolean) => number) => {
      on(r, EventType.ACTIVATED, () => state.score += fn(l.state.active));
    }


    //
    // Playfield Elements
    // TODO: adjust positioning to correct for perspective in the graphic
    //

    // Outer walls

    let greatRadius = (W - 10)/2

    Collider(`topwall`,             Arc.at(0, TT - greatRadius + 5, 5, greatRadius, TAU*8/16, TAU*0/16));
    Collider(`leftwall`,            Capsule.from(TL - 5, 0, TL - 5, TT - greatRadius, 5));
    Collider(`rightwall_inner_btm`, Capsule.from(TR + 5, 0, TR + 5, 440, 5));
    Collider(`rightwall_inner_top`, Capsule.from(TR + 5, 517, TR + 5, TT - greatRadius, 5));
    Collider(`rightwall_inner_arc`, Arc.at(TR - 188, TT - greatRadius, 5, 193, TAU*1/8, 0));


    // Launch chute
    // TODO: one-way gate at the top of the chute

    let launcher = Launcher(`launcher`, Capsule.at(R - 30, 120, ballRad+2, 36), Vec2.at(0, LAUNCH_STRENGTH));
    Collider(`chute_wall`,   Capsule.from(R - 5, 0, R - 5, TT - greatRadius, 5));
    Collider(`chute_bottom`, Capsule.at(R - 30, 90, 9, 20, TAU/4));
    Collider(`stopper`, Capsule.at(TL + 56, TT - 100, 16, 10, TAU*13/32), 2);


    // Upper lanes

    let laneStride = 52;

    let laneRollovers = [];
    let laneLamps     = [];

    for (let z = -2; z <= 2; z++) {
      let x = M + laneStride * z;
      Collider(`upper_lane_guard_${z+2}`, Capsule.at(x, TT - 164, 10, 44, 0));
    }

    for (let z = -1.5; z <= 1.5; z++) {
      let x = M + laneStride * z;
      let ix = z + 1.5;

      let roll = Rollover(`upper_lane_rollover_${ix}`, Capsule.from(x, TT - 145, x, TT - 193, rolloverRad));
      let lamp = Lamp(`upper_lane_lamp_${ix}`, Circle.at(x, TT - 117, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));

      laneRollovers[ix] = roll;
      laneLamps[ix]     = lamp;

      scoreRolloverDependsOnLamp(roll, lamp, (lit) => lit ? 300 : 50);
    }


    // Upper targets and edge guards

    Collider(`upper_guard_left_a`,   Circle.at(TL + 46, 803, postRad));
    Collider(`upper_guard_left_b`,  Capsule.at(TL + 20, 712, 5, 92));

    Collider(`upper_guard_right_a`, Capsule.at(TR - 21, 712, 5, 92));
    Collider(`upper_guard_right_b`, Fence.at([TR - 53, 842, TR - 64, 820, TR - 50, 795], 5));

    // Main Bumpers

    Deco(`bumper_deco_left`,  Circle.at(M - 105, 690, 44), Color.fromTw('slate-700'));
    Deco(`bumper_deco_mid`,   Circle.at(M      , 647, 44), Color.fromTw('slate-700'));
    Deco(`bumper_deco_right`, Circle.at(M + 105, 690, 44), Color.fromTw('slate-700'));

    let bumperLeft  = Bumper(`bumper_left`,  Circle.at(M + 105, 690, 29), BUMPER_STRENGTH);
    let bumperMid   = Bumper(`bumper_mid`,   Circle.at(M      , 647, 29), BUMPER_STRENGTH);
    let bumperRight = Bumper(`bumper_right`, Circle.at(M - 105, 690, 29), BUMPER_STRENGTH);

    let lamp_bumperLeft  = Lamp(`bumper_lamp_left`,  Circle.at(M + 105, 690, 22), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));
    let lamp_bumperMid   = Lamp(`bumper_lamp_mid`,   Circle.at(M      , 647, 22), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));
    let lamp_bumperRight = Lamp(`bumper_lamp_right`, Circle.at(M - 105, 690, 22), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));

    on(bumperLeft,  EventType.BOUNCED, () => state.score += lamp_bumperLeft.state.active  ? 10 : 1);
    on(bumperMid,   EventType.BOUNCED, () => state.score += lamp_bumperMid.state.active   ? 10 : 1);
    on(bumperRight, EventType.BOUNCED, () => state.score += lamp_bumperRight.state.active ? 10 : 1);


    // Droptarget banks & slingshots

    type TargetBank = {
      targets: Things.DropTarget[],
      lamp:    Things.Lamp | null,
      multiplier: number;
    }

    let redBank:TargetBank = {
      targets: [],
      lamp: null,
      multiplier: 0,
    }

    let whiteBank:TargetBank = {
      targets: [],
      lamp: null,
      multiplier: 0,
    }

    let dt_width  = 17;
    let dt_stride = 32;

    for (let i = -1.5; i <= 1.5; i++) {
      let xl = M - 121 + dt_stride * i;
      let xr = M + 121 + dt_stride * i;
      let ix = i + 1.5;

      redBank.targets[ix]   = DropTarget(`dt_left_bank_${i+1.5}`,  Capsule.from(xl + dt_width/2, 539.5, xl - dt_width/2, 539.5, 3.5));
      whiteBank.targets[ix] = DropTarget(`dt_right_bank_${i+1.5}`, Capsule.from(xr + dt_width/2, 539.5, xr - dt_width/2, 539.5, 3.5));
    }

    redBank.lamp   = Lamp(`dt_lamp_red`,   Circle.at(M - 155, 574, 25), Color.fromTw('red-900'),   Color.fromTw('red-500'))
    whiteBank.lamp = Lamp(`dt_lamp_white`, Circle.at(M + 155, 574, 25), Color.fromTw('gray-600'), Color.fromTw('gray-100'))

    Bumper(`dt_ss_left`,   Capsule.at(M - 123, 585, 5, 100,  TAU*22/125), SLINGS_STRENGTH);
    Bumper(`dt_ss_right`,  Capsule.at(M + 123, 585, 5, 100, -TAU*22/125), SLINGS_STRENGTH);
    Collider(`dt_bank_left`,  Fence.at([ M - 178, 554, M - 177, 610, M - 69, 554 ], 5).close());
    Collider(`dt_bank_right`, Fence.at([ M + 178, 554, M + 177, 610, M + 69, 554 ], 5).close());


    // Midfield rollovers

    let midROL = Rollover(`mid_rollover_left`,   Capsule.at(TL + 22, 582, rolloverRad, 45));
    let midROR = Rollover(`mid_rollover_right`,  Capsule.at(TR - 22, 582, rolloverRad, 45));
    let midROLampL = Lamp(`mid_rollover_lamp_left`,  Circle.at(TL + 48, 655, lampRad), Color.fromTw('rose-800'), Color.fromTw('rose-400'));
    let midROLampR = Lamp(`mid_rollover_lamp_right`, Circle.at(TR - 48, 655, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));


    // Midfield guards (vertical part is just main wall)

    Collider(`mid_guard_left_top`,  Arc.at(TL + 36, 627, 2, 38, TAU*3/16, TAU*5/16));
    Collider(`mid_guard_left_btm`,  Arc.at(TL + 36, 548, 2, 38, TAU*5/32, TAU*8/16));
    Collider(`mid_guard_right_top`, Arc.at(TR - 36, 627, 2, 38, TAU*6/32, TAU*0/32));
    Collider(`mid_guard_right_btm`, Arc.at(TR - 36, 548, 2, 38, TAU*6/32, TAU*26/32));
    Collider(`mid_guard_right_end`, Capsule.from(TR - 21, 513, TR + 2, 513, 2));


    // Static Targets

    let tgtTopLeft  = Target(`tgt_top_left`,  Capsule.at(TL + 34, 778, targetRad, 24, TAU*59/64));
    let tgtMidLeft  = Target(`tgt_mid_left`,  Capsule.at(TL + 36, 457, targetRad, 24, TAU*29/64));
    let tgtBtmLeft  = Target(`tgt_btm_left`,  Capsule.at(TL + 27, 409, targetRad, 24, TAU*29/64));
    let tgtTopRight = Target(`tgt_top_right`, Capsule.at(TR - 34, 778, targetRad, 24, -TAU*59/64));
    let tgtMidRight = Target(`tgt_mid_right`, Capsule.at(TR - 36, 457, targetRad, 24, TAU*35/64));
    let tgtBtmRight = Target(`tgt_btm_right`, Capsule.at(TR - 27, 409, targetRad, 24, TAU*35/64));

    let lamp_tgtTopLeft  = Lamp(`tgt_lamp_top_left`,  Circle.at(TL + 49, 740, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
    let lamp_tgtMidLeft  = Lamp(`tgt_lamp_mid_left`,  Circle.at(TL + 73, 437, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
    let lamp_tgtBtmLeft  = Lamp(`tgt_lamp_btm_left`,  Circle.at(TL + 67, 389, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
    let lamp_tgtTopRight = Lamp(`tgt_lamp_top_right`, Circle.at(TR - 49, 740, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
    let lamp_tgtMidRight = Lamp(`tgt_lamp_mid_right`, Circle.at(TR - 73, 437, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
    let lamp_tgtBtmRight = Lamp(`tgt_lamp_btm_right`, Circle.at(TR - 67, 389, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));

    on(tgtTopLeft,  EventType.BOUNCED, () => state.score += lamp_tgtTopLeft.state.active  ? 300 : 50);
    on(tgtMidLeft,  EventType.BOUNCED, () => state.score += lamp_tgtMidLeft.state.active  ? 300 : 50);
    on(tgtBtmLeft,  EventType.BOUNCED, () => state.score += lamp_tgtBtmLeft.state.active  ? 300 : 50);
    on(tgtTopRight, EventType.BOUNCED, () => state.score += lamp_tgtTopRight.state.active ? 300 : 50);
    on(tgtMidRight, EventType.BOUNCED, () => state.score += lamp_tgtMidRight.state.active ? 300 : 50);
    on(tgtBtmRight, EventType.BOUNCED, () => state.score += lamp_tgtBtmRight.state.active ? 300 : 50);


    // Lower Guards

    Collider(`lower_guard_left_top`,       Capsule.at(TL + 28, 497, 8, 45, TAU*18/127));
    Collider(`lower_guard_left_mid`,       Circle.at(TL + 30, 433, postRad));

    Collider(`lower_guard_right_top_ang`,  Capsule.from(TR - 44, 484, TR + 5, 440, 6));
    Collider(`lower_guard_right_mid`,      Circle.at(TR - 30, 433, postRad));


    // Outlane rollovers

    let outROL = Rollover(`out_rollover_left`,  Capsule.from(M - 165, 212, M - 165, 246, rolloverRad));
    let outROR = Rollover(`out_rollover_right`, Capsule.from(M + 165, 212, M + 165, 246, rolloverRad));
    let outLampL = Lamp(`out_rollover_lamp_left`,  Circle.at(M - 127, 329, lampRad), Color.fromTw('rose-800'), Color.fromTw('rose-400'));
    let outLampR = Lamp(`out_rollover_lamp_right`, Circle.at(M + 127, 329, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));


    // Outlane kickers and rails

    let kickROL = Rollover(`kicker_left_score_ro`,  Capsule.at(TL + 22, 240, rolloverRad, 30));
    Bumper(`kicker_left`, Capsule.at(TL + 23, 208, 6, 20, TAU/4), KICKER_STRENGTH);

    let kickROR = Rollover(`kicker_right_score_ro`, Capsule.at(TR - 22, 240, rolloverRad, 30));
    Bumper(`kicker_right`, Capsule.at(TR - 23, 208, 7, 20, TAU/4), KICKER_STRENGTH);

    Collider(`kicker_left_post`,       Circle.at(TL + 52, 301, postRad));
    Collider(`kicker_left_rail_arc`,   Arc.at(TL + 260, 283, postRad, 260, TAU*4/64, TAU*28/64));
    Collider(`kicker_left_rail_outer`, Capsule.from(TL, 209, TL, 283, postRad));
    Collider(`kicker_left_rail_inner`, Capsule.from(TL + 39, 300, TL + 39, 205, 3));

    Collider(`kicker_right_post`,       Circle.at(TR - 52, 301, postRad));
    Collider(`kicker_right_rail_arc`,   Arc.at(TR - 260, 283, postRad, 260, TAU*4/64, TAU*0/64));
    Collider(`kicker_right_rail_outer`, Capsule.from(TR, 209, TR, 283, postRad));
    Collider(`kicker_right_rail_inner`, Capsule.from(TR - 39, 300, TR - 39, 205, 3));


    // Lower slingshots
    // TODO: Only bounce if hit with threshold velocity
    // TODO: Move slightly out of the wal to allow ball catching

    Bumper(`lower_ss_left`,  Capsule.at(M - 120, 228, 4, 44,  TAU*11/128), SLINGS_STRENGTH);
    Bumper(`lower_ss_right`, Capsule.at(M + 120, 228, 4, 44, -TAU*11/128), SLINGS_STRENGTH);
    Collider(`lower_ss_left_body`,  Fence.at([ M - 108, 195, M - 140, 248, M - 140, 209 ], postRad).close());
    Collider(`lower_ss_right_body`, Fence.at([ M + 108, 195, M + 140, 248, M + 140, 209 ], postRad).close());


    // Flippers

    let flipperRad = 12;
    let flipperLength = 58;
    let flipperRestAngle = TAU/11;
    let flipperRange = TAU/6;

    Flipper(`flipper_left`,
      M - 38 - flipperLength,
      178,
      flipperRad,
      flipperLength,
      flipperRestAngle * -1,
      flipperRange,
      FLIPPER_SPEED);

    Flipper(`flipper_right`,
      M + 38 + flipperLength,
      178,
      flipperRad,
      flipperLength,
      flipperRestAngle + TAU/2,
      -flipperRange,
      FLIPPER_SPEED);


    // Central drain

    Collider(`drain_wall_left`,  Capsule.from(TL, 144, M - 36, 71, 8));
    Collider(`drain_wall_right`, Capsule.from(TR, 144, M + 36, 71, 8));
   
    let drain = Drain(`drain`, Box.fromRect(L, TB, TR, 0));

    on(drain, EventType.DRAINED, () => {
      if (state.ballsInPlay == 0) {
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
    // TODO: Create score wrapper function to advance lane lamps
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

    const laneLampConfig:LaneCombo[] = [
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
    ];

    const advanceLaneSeed = () => {
      laneSeed = (laneSeed + 1) % 10;
      setLaneLamps(laneLampConfig[laneSeed]);
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

    scoreRolloverDependsOnLamp(midROL, midROLampL, lit => 100 + 100 * (lit ? redBank.multiplier   : 0));
    scoreRolloverDependsOnLamp(midROR, midROLampR, lit => 100 + 100 * (lit ? whiteBank.multiplier : 0));
    scoreRolloverDependsOnLamp(outROL, outLampL,   lit => 100 + 100 * (lit ? redBank.multiplier   : 0));
    scoreRolloverDependsOnLamp(outROR, outLampR,   lit => 100 + 100 * (lit ? whiteBank.multiplier : 0));
    scoreRolloverDependsOnLamp(kickROL,  outLampL,   lit => 100 + 100 * (lit ? redBank.multiplier   : 0));
    scoreRolloverDependsOnLamp(kickROR,  outLampR,   lit => 100 + 100 * (lit ? whiteBank.multiplier : 0));

    on(midROL, EventType.ACTIVATED, () => { if (redBank.targets.every(v => v.state.dropped)) resetBank(redBank); });
    on(midROR, EventType.ACTIVATED, () => { if (whiteBank.targets.every(v => v.state.dropped)) resetBank(whiteBank); });
    on(outROL, EventType.ACTIVATED, () => { if (redBank.targets.every(v => v.state.dropped)) resetBank(redBank); });
    on(outROR, EventType.ACTIVATED, () => { if (whiteBank.targets.every(v => v.state.dropped)) resetBank(whiteBank); });
    on(kickROL, EventType.ACTIVATED, () => { if (redBank.targets.every(v => v.state.dropped)) resetBank(redBank); });
    on(kickROR, EventType.ACTIVATED, () => { if (whiteBank.targets.every(v => v.state.dropped)) resetBank(whiteBank); });



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

      state.ballStock = 5;
    }

    function drainedLastBall () {
      if (state.ballStock > 0) {
        newRound();
      } else {
        console.log("GAME OVER");
        clearState();
      }
    }

    function clearState () {
      state.ballsInPlay = 0;
      state.score = 0;
      state.ballStock = 0;
    }

    function launchBall () {
      launcher.do(Command.ACTIVATE);
    }

    this.onProcess = (input:InputState) => {
      get<Things.Flipper>(`flipper_left`).state.active  = input.left;
      get<Things.Flipper>(`flipper_right`).state.active = input.right;

      if (input.launch) {
        //if (T.gamemode === GameMode.WAITING && T.ballsInPlay > 0) {
          launchBall();
        //}
      }

      for (let name in this.things) {
        let thing = this.things[name];

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

    this.onNewBall = (fn) => {
      if (this.gameState.awaitNewBall) {
        fn(BALL_DROP_POSITION);
        this.gameState.awaitNewBall = false;

        // TEMP
        advanceLaneSeed();
      }
    }

    // Done
    console.log(`Loaded table '${this.name}': ${Object.values(this.things).length} things created.`);
  }

  process (input:InputState) {
    this.onProcess(input);
  }

  onRequestNewBall (fn) {
    this.onNewBall(fn);
  }

}

