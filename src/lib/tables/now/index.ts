
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
  // TODO: There are slignshots in the upper vertical side guards
  // TODO: Ditch registering component names, just use variables
  // Counterpoint: names are handy as labels when making adjustments

  onProcess: (input:InputState) => void;
  onNewBall: (fn:Function) => void;

  constructor () {

    super();

    this.name = "NOW";
    
    this.things = {},

    this.config = {
      bounds: new Rect(-256, 898, 256, 0),
      ballRad: 13,
      gravity: 2000,
    };

    this.gameState = {
      score: 0,
      ballStock: 5,
      awaitNewBall: true,
      ballsInPlay: 0,
      lamps:{
      },
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
    //@ts-ignore
    const Gate       = (name, ...args) => add(Things.Gate.from(name, ...args));


    // Wiring

    let listeners = [ ];

    const on = (thing:Thing, type:EventType, λ:() => void) => {
      listeners.push([ thing.name, type, λ ]);
    }

    const BUMPER_STRENGTH = 0.3;
    const SLINGS_STRENGTH = 0.3;
    const KICKER_STRENGTH = 0.5;
    const LAUNCH_STRENGTH = 0.01;
    const FLIPPER_SPEED   = 30;

    // TODO: Score config here as const
    // const POINTS_BUMPER_UNLIT = 1; 
    // etc


    //
    // Setup
    //

    // Vars

    let ballRad     = this.config.ballRad;
    let lampRad     = 10;
    let rolloverRad = 6;
    let postRad     = 7;
    let targetRad   = 2;


    // Shorthand dimensions

    const L = this.config.bounds.left;
    const R = this.config.bounds.right;
    const W = this.config.bounds.w;
    const H = this.config.bounds.h;

    const TL = L + 48;       // leftmost position excluding outer wall
    const TR = R - 50;       // rightmost position excluding chute
    const TW = TR - TL;      // width of playfield
    const M  = 0;            // middle of playfield

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
    //

    // Outer walls

    let greatRadius = (W - 48)/2

    Collider(`stopper`, Capsule.at(TL + 52, TT - 92, 15, 9, TAU*13/32), 2);
    Gate(`launch_gate`, Capsule.at(TR - 28, TT - 88, 8, 35, TAU*23/63), Vec2.at(1, -1).norm());

    Collider(`topwall`,             Arc.at(19, TT - greatRadius + 5, 5, greatRadius, TAU*8/16, TAU*0/16));
    Collider(`leftwall`,            Capsule.from(TL - 5, 0, TL - 5, TT - greatRadius + 5, 5));
    Collider(`rightwall_inner_btm`, Capsule.from(TR + 5, 0, TR + 5, 408, 5));
    Collider(`rightwall_inner_top`, Capsule.from(TR + 5, 477, TR + 5, TT - greatRadius + 5, 5));
    Collider(`rightwall_inner_arc`, Arc.at(TR - 173, TT - greatRadius + 5, 5, 178, TAU*1/8, 0));


    // Launch chute

    let launcher = Launcher(`launcher`, Capsule.at(R - 25, 105, ballRad+2, 26), Vec2.at(0, LAUNCH_STRENGTH));
    Collider(`chute_wall`,   Capsule.from(R - 5, 0, R - 5, TT - greatRadius + 5, 5));
    Collider(`chute_bottom`, Capsule.at(R - 25, 82, 8, 26, TAU/4));


    // Upper lanes

    let laneStride = 48;

    let laneRollovers = [];
    let laneLamps     = [];

    for (let z = -2; z <= 2; z++) {
      let x = M + laneStride * z;
      Collider(`upper_lane_guard_${z+2}`, Capsule.at(x, TT - 152, 10, 39, 0));
    }

    for (let z = -1.5; z <= 1.5; z++) {
      let x = M + laneStride * z;
      let ix = z + 1.5;

      let roll = Rollover(`upper_lane_rollover_${ix}`, Capsule.from(x, TT - 134, x, TT - 178, rolloverRad));
      let lamp = Lamp(`upper_lane_lamp_${ix}`, Circle.at(x, TT - 108, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));

      laneRollovers[ix] = roll;
      laneLamps[ix]     = lamp;

      this.gameState.lamps['lane' + ix] = lamp;

      scoreRolloverDependsOnLamp(roll, lamp, (lit) => lit ? 300 : 50);
    }


    // Upper targets and edge guards

    Collider(`upper_guard_left_a`,   Circle.at(TL + 42.5, 742.5, postRad));
    Collider(`upper_guard_left_b`,  Capsule.at(TL + 19, 662, 6, 91));

    Collider(`upper_guard_right_a`, Capsule.at(TR - 19, 662, 6, 91));
    Collider(`upper_guard_right_b`, Fence.at([TR - 50, 782, TR - 60, 760, TR - 47, 735], 5));

    // Main Bumpers

    Deco(`bumper_deco_left`,  Circle.at(M - 97, 638, 41), Color.fromTw('slate-700'));
    Deco(`bumper_deco_mid`,   Circle.at(M     , 598, 41), Color.fromTw('slate-700'));
    Deco(`bumper_deco_right`, Circle.at(M + 97, 639, 41), Color.fromTw('slate-700'));

    let bumperLeft  = Bumper(`bumper_left`,  Circle.at(M + 97, 638, 27), BUMPER_STRENGTH);
    let bumperMid   = Bumper(`bumper_mid`,   Circle.at(M     , 598, 27), BUMPER_STRENGTH);
    let bumperRight = Bumper(`bumper_right`, Circle.at(M - 97, 638, 27), BUMPER_STRENGTH);

    let lamp_bumperLeft  = Lamp(`bumper_lamp_left`,  Circle.at(M + 97, 638, 20), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));
    let lamp_bumperMid   = Lamp(`bumper_lamp_mid`,   Circle.at(M     , 598, 20), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));
    let lamp_bumperRight = Lamp(`bumper_lamp_right`, Circle.at(M - 97, 638, 20), Color.fromTw('yellow-700'), Color.fromTw('yellow-400'));

    this.gameState.lamps.bumperLeft  = lamp_bumperLeft;
    this.gameState.lamps.bumperMid   = lamp_bumperMid;
    this.gameState.lamps.bumperRight = lamp_bumperRight;

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

    let dt_width  = 16;
    let dt_stride = 29.6;

    for (let i = -1.5; i <= 1.5; i++) {
      let xl = M - 112 + dt_stride * i;
      let xr = M + 112 + dt_stride * i;
      let ix = i + 1.5;

      redBank.targets[ix]   = DropTarget(`dt_left_bank_${i+1.5}`,  Capsule.from(xl + dt_width/2, 499, xl - dt_width/2, 499, 3));
      whiteBank.targets[ix] = DropTarget(`dt_right_bank_${i+1.5}`, Capsule.from(xr + dt_width/2, 499, xr - dt_width/2, 499, 3));
    }

    redBank.lamp   = Lamp(`dt_lamp_red`,   Circle.at(M - 140, 533, 25), Color.fromTw('red-900'),   Color.fromTw('red-500'))
    whiteBank.lamp = Lamp(`dt_lamp_white`, Circle.at(M + 140, 533, 25), Color.fromTw('gray-600'), Color.fromTw('gray-100'))

    Bumper(`dt_ss_left`,   Capsule.at(M - 112, 541, 5, 100,  TAU*22/125), SLINGS_STRENGTH);
    Bumper(`dt_ss_right`,  Capsule.at(M + 112, 541, 5, 100, -TAU*22/125), SLINGS_STRENGTH);
    Collider(`dt_bank_left`,  Fence.at([ M - 165, 512, M - 165, 566, M - 63, 512 ], 5).close());
    Collider(`dt_bank_right`, Fence.at([ M + 165, 512, M + 165, 566, M + 63, 512 ], 5).close());


    // Midfield rollovers

    let midROL = Rollover(`mid_rollover_left`,   Capsule.at(TL + 20, 538, rolloverRad, 43));
    let midROR = Rollover(`mid_rollover_right`,  Capsule.at(TR - 20, 538, rolloverRad, 43));
    let midROLampL = Lamp(`mid_rollover_lamp_left`,  Circle.at(TL + 44, 606, lampRad), Color.fromTw('rose-800'), Color.fromTw('rose-400'));
    let midROLampR = Lamp(`mid_rollover_lamp_right`, Circle.at(TR - 44, 606, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
    this.gameState.lamps.midRollLeft  = midROLampL;
    this.gameState.lamps.midRollRight = midROLampR;


    // Midfield guards (vertical part is just main wall)

    Collider(`mid_guard_left_top`,  Arc.at(TL + 36, 579, 2, 38, TAU*3/16, TAU*5/16));
    Collider(`mid_guard_left_btm`,  Arc.at(TL + 36, 509, 2, 38, TAU*5/32, TAU*8/16));
    Collider(`mid_guard_right_top`, Arc.at(TR - 36, 579, 2, 38, TAU*6/32, TAU*0/32));
    Collider(`mid_guard_right_btm`, Arc.at(TR - 36, 509, 2, 38, TAU*6/32, TAU*26/32));
    Collider(`mid_guard_right_end`, Capsule.from(TR - 21, 474, TR + 2, 474, 2));


    // Static Targets

    let tgtTopLeft  = Target(`tgt_top_left`,  Capsule.at(TL + 34, 718, targetRad, 24, TAU*59/64));
    let tgtMidLeft  = Target(`tgt_mid_left`,  Capsule.at(TL + 34, 427, targetRad, 24, TAU*29/64));
    let tgtBtmLeft  = Target(`tgt_btm_left`,  Capsule.at(TL + 25, 379, targetRad, 24, TAU*29/64));
    let tgtTopRight = Target(`tgt_top_right`, Capsule.at(TR - 34, 718, targetRad, 24, -TAU*59/64));
    let tgtMidRight = Target(`tgt_mid_right`, Capsule.at(TR - 34, 427, targetRad, 24, TAU*35/64));
    let tgtBtmRight = Target(`tgt_btm_right`, Capsule.at(TR - 25, 379, targetRad, 24, TAU*35/64));

    let lamp_tgtTopLeft  = Lamp(`tgt_lamp_top_left`,  Circle.at(TL + 45, 685, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
    let lamp_tgtMidLeft  = Lamp(`tgt_lamp_mid_left`,  Circle.at(TL + 67, 404, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
    let lamp_tgtBtmLeft  = Lamp(`tgt_lamp_btm_left`,  Circle.at(TL + 62, 360, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
    let lamp_tgtTopRight = Lamp(`tgt_lamp_top_right`, Circle.at(TR - 45, 685, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
    let lamp_tgtMidRight = Lamp(`tgt_lamp_mid_right`, Circle.at(TR - 67, 404, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));
    let lamp_tgtBtmRight = Lamp(`tgt_lamp_btm_right`, Circle.at(TR - 62, 360, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));

    this.gameState.lamps.tgtTopLeft  = lamp_tgtTopLeft;
    this.gameState.lamps.tgtMidLeft  = lamp_tgtMidLeft;
    this.gameState.lamps.tgtBtmLeft  = lamp_tgtBtmLeft;
    this.gameState.lamps.tgtTopRight = lamp_tgtTopRight;
    this.gameState.lamps.tgtMidRight = lamp_tgtMidRight;
    this.gameState.lamps.tgtBtmRight = lamp_tgtBtmRight;

    on(tgtTopLeft,  EventType.BOUNCED, () => state.score += lamp_tgtTopLeft.state.active  ? 300 : 50);
    on(tgtMidLeft,  EventType.BOUNCED, () => state.score += lamp_tgtMidLeft.state.active  ? 300 : 50);
    on(tgtBtmLeft,  EventType.BOUNCED, () => state.score += lamp_tgtBtmLeft.state.active  ? 300 : 50);
    on(tgtTopRight, EventType.BOUNCED, () => state.score += lamp_tgtTopRight.state.active ? 300 : 50);
    on(tgtMidRight, EventType.BOUNCED, () => state.score += lamp_tgtMidRight.state.active ? 300 : 50);
    on(tgtBtmRight, EventType.BOUNCED, () => state.score += lamp_tgtBtmRight.state.active ? 300 : 50);


    // Lower Guards

    Collider(`lower_guard_left_top`,       Capsule.at(TL + 23, 463, 8, 45, TAU*18/127));
    Collider(`lower_guard_left_mid`,       Circle.at(TL + 29, 403, postRad));

    Collider(`lower_guard_right_top_ang`,  Capsule.from(TR - 40, 447, TR + 4, 408, 6));
    Collider(`lower_guard_right_mid`,      Circle.at(TR - 29, 403, postRad));


    // Outlane rollovers

    let outROL = Rollover(`out_rollover_left`,  Capsule.from(M - 153, 196, M - 153, 228, rolloverRad));
    let outROR = Rollover(`out_rollover_right`, Capsule.from(M + 153, 196, M + 153, 228, rolloverRad));
    let outLampL = Lamp(`out_rollover_lamp_left`,  Circle.at(M - 117, 304, lampRad), Color.fromTw('rose-800'), Color.fromTw('rose-400'));
    let outLampR = Lamp(`out_rollover_lamp_right`, Circle.at(M + 117, 304, lampRad), Color.fromTw('lime-800'), Color.fromTw('lime-400'));

    this.gameState.lamps.outLampL = outLampL;
    this.gameState.lamps.outLampR = outLampR;

    // Outlane kickers and rails

    let kickROL = Rollover(`kicker_left_score_ro`,  Capsule.at(TL + 20, 220, rolloverRad, 30));
    Bumper(`kicker_left`,  Capsule.at(TL + 20, 194, 6, 25, TAU/4), KICKER_STRENGTH);

    let kickROR = Rollover(`kicker_right_score_ro`, Capsule.at(TR - 20, 220, rolloverRad, 30));
    Bumper(`kicker_right`, Capsule.at(TR - 20, 194, 6, 25, TAU/4), KICKER_STRENGTH);

    Collider(`kicker_left_post`,       Circle.at(TL + 46, 278, postRad));
    Collider(`kicker_left_rail_arc`,   Arc.at(TL + 240, 264, postRad, 240, TAU*4/64, TAU*28/64));
    Collider(`kicker_left_rail_outer`, Capsule.from(TL, 193, TL, 283, postRad));
    Collider(`kicker_left_rail_inner`, Capsule.from(TL + 36, 280, TL + 36, 190, 3));

    Collider(`kicker_right_post`,       Circle.at(TR - 46, 278, postRad));
    Collider(`kicker_right_rail_arc`,   Arc.at(TR - 240, 264, postRad, 240, TAU*4/64, TAU*0/64));
    Collider(`kicker_right_rail_outer`, Capsule.from(TR, 193, TR, 283, postRad));
    Collider(`kicker_right_rail_inner`, Capsule.from(TR - 36, 280, TR - 36, 190, 3));


    // Lower slingshots
    // TODO: Only bounce if hit with threshold velocity
    // TODO: Move slightly out of the wal to allow ball catching

    Bumper(`lower_ss_left`,  Capsule.from(M - 123, 226, M - 103, 190, 4), SLINGS_STRENGTH);
    Bumper(`lower_ss_right`, Capsule.from(M + 123, 226, M + 103, 190, 4), SLINGS_STRENGTH);
    Collider(`lower_ss_left_body`,  Fence.at([ M - 98, 175, M - 131, 234, M - 131, 190 ], 4).close());
    Collider(`lower_ss_right_body`, Fence.at([ M + 98, 175, M + 131, 234, M + 131, 190 ], 4).close());


    // Flippers

    let flipperRad = 8;
    let flipperLength = 58;
    let flipperRestAngle = TAU/11;
    let flipperRange = TAU/6;

    let leftFlipper = Flipper(`flipper_left`,
      M - 33 - flipperLength,
      169,
      flipperRad,
      flipperLength,
      flipperRestAngle * -1,
      flipperRange,
      FLIPPER_SPEED);

    let rightFlipper = Flipper(`flipper_right`,
      M + 33 + flipperLength,
      169,
      flipperRad,
      flipperLength,
      flipperRestAngle + TAU/2,
      -flipperRange,
      FLIPPER_SPEED);


    // Central drain

    Collider(`drain_wall_left`,  Capsule.from(TL, 132, M - 36, 65, 8));
    Collider(`drain_wall_right`, Capsule.from(TR, 132, M + 36, 65, 8));
   
    let drain = Drain(`drain`, Box.fromRect(L, TB, TR, 0));

    on(drain, EventType.DRAINED, () => {
      if (state.ballsInPlay == 0) {
        drainedLastBall();
      }
    });


    // Game script

    // [ ] Red & White bonuses
    //   [ ] Gets awarded by Red and White rollovers (outlane, kicker and midfield)
    //   [ ] Bonus pays out when used by a rollover
    //   [ ] Resets when used
    // [ ] Bumpers don't award except when lit (10pts) (or award 1 pt? or 5?)
    // [ ] Slingshots dont award (?? probably)
    // [ ] Replay balls
    //   [ ] Score matching - random digit generated at start of game
    //   [ ] If final score matches last digit, get a free ball
    // [ ] Seed Roller
    //   [ ] Called at zero when new game starts
    //   [ ] Incremented when score increases and tens column doesn't match??
    // [ ] Alternationg Relay
    //   [ ] MIGHT only trigger when tens column of score changes (not sure)
    // [ ] Tilting doesn't lock the game
    //   [ ] But implement tilting for ball control
    // [ ] Max 15 balls
    // [ ] Extra ball awarded at score milestones
    // [ ] Create score wrapper function to advance lane lamps


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

    scoreRolloverDependsOnLamp(midROL,   midROLampL, lit => 100 + 100 * (lit ?   redBank.multiplier : 0));
    scoreRolloverDependsOnLamp(midROR,   midROLampR, lit => 100 + 100 * (lit ? whiteBank.multiplier : 0));
    scoreRolloverDependsOnLamp(outROL,   outLampL,   lit => 100 + 100 * (lit ?   redBank.multiplier : 0));
    scoreRolloverDependsOnLamp(outROR,   outLampR,   lit => 100 + 100 * (lit ? whiteBank.multiplier : 0));
    scoreRolloverDependsOnLamp(kickROL,  outLampL,   lit => 100 + 100 * (lit ?   redBank.multiplier : 0));
    scoreRolloverDependsOnLamp(kickROR,  outLampR,   lit => 100 + 100 * (lit ? whiteBank.multiplier : 0));

    on(midROL,  EventType.ACTIVATED, () => { if (  redBank.targets.every(v => v.state.dropped)) resetBank(redBank); });
    on(midROR,  EventType.ACTIVATED, () => { if (whiteBank.targets.every(v => v.state.dropped)) resetBank(whiteBank); });
    on(outROL,  EventType.ACTIVATED, () => { if (  redBank.targets.every(v => v.state.dropped)) resetBank(redBank); });
    on(outROR,  EventType.ACTIVATED, () => { if (whiteBank.targets.every(v => v.state.dropped)) resetBank(whiteBank); });
    on(kickROL, EventType.ACTIVATED, () => { if (  redBank.targets.every(v => v.state.dropped)) resetBank(redBank); });
    on(kickROR, EventType.ACTIVATED, () => { if (whiteBank.targets.every(v => v.state.dropped)) resetBank(whiteBank); });


    //
    // Game Flow
    //

    function newRound () {
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
      advanceLaneSeed();
    }

    this.onProcess = (input:InputState) => {
      leftFlipper.state.active  = input.left;
      rightFlipper.state.active = input.right;

      if (input.launch) {
        //if (T.gamemode === GameMode.WAITING && T.ballsInPlay > 0) {
          launchBall();
        //}
      }

      // Process acuumulated events
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
      }
    }

    // Done
    console.info(`Loaded table '${this.name}': ${Object.values(this.things).length} things created.`);
  }

  process (input:InputState) {
    this.onProcess(input);
  }

  onRequestNewBall (fn) {
    this.onNewBall(fn);
  }

}

