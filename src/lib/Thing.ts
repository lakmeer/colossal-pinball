
import type Ball  from "./Ball";
import type Shape from "./Shape";
//import type Event from "./Event";
import type Vec2  from "./Vec2";

import Color from './Color';


// From things to table
enum Event {
  BALL_ENTER,
  BALL_LEAVE,
  ACTIVATED,
  DEACTIVATED,
}

// From table script to things
enum Command {
  ACTIVATE,
  DEACTIVATE,
  LAMP_FLASH,
  LAMP_STROBE,
}


//
// Thing
//
// A thing is any object that gets interacted with. It is in charge of a shape and
// has a generic per-frame update function that returns a list of events to be processed.
//

type ThingState = Record<string, any>;

export default class Thing {

  name:    string;
  shape:   Shape;
  color:   Color;
  state:   ThingState;
  events:  Array<Event>;
  f_coeff: number = 1.0;

  constructor (name: string, shape: Shape, color: Color, state:ThingState = {}) {
    this.name   = name;
    this.shape  = shape;
    this.color  = color;
    this.state  = state;
    this.events = [];
  }

  emit (event:Event):void {
    this.events.push(event);
  }

  do(cmd:Command, args:any[] = []):void {
    // No-op
  }

  update (dt:number):Array<Event> {
    const events = this.events.slice();
    this.events = [];
    return events;
  }

  pushBall (ball:Ball, dt:number, fff:number):void {
    let delta = this.shape.eject(ball);
    ball.pos.addSelf(delta.scale(fff * this.f_coeff));
  }
}


//
// Drain Zone
// Kills the ball
//

export class Drain extends Thing {

  collide(ball) {
    if (this.shape.intersect(ball.pos)) ball.cull = true;
  }

  static from (name:string, shape:Shape, color:Color):Drain {
    return new Drain(name, shape, Color.fromTw('black'));
  }

}


//
// Rollover
//
// Emits when ball enters or leaves (rollovers)
// TODO: Track which balls are intersecting and only count each once per rollover
//

interface RolloverState extends ThingState {
  active: boolean;
  intersectedThisFrame: boolean;
}

export class Rollover extends Thing {

  collide(ball) {
    if (this.shape.intersect(ball.pos)) {
      this.state.intersectedThisFrame = true;
    }
  }

  update(dt) {
    this.state.active = false;

    if (this.state.intersectedThisFrame && !this.state.active) {
      this.state.active = true;
      this.emit(Event.ACTIVATED);
    }

    if (!this.state.intersectedThisFrame && this.state.active) {
      this.state.active = false;
      this.emit(Event.DEACTIVATED);
    }

    this.state.intersectedThisFrame = false;

    return super.update(dt);
  }

  static from (name:string, shape:Shape, color:Color) {
    return new Rollover(name, shape, color, {
      active: false,
      intersectedThisFrame: false
    } as RolloverState);
  }

}


//
// Lamp
// Doesn't intersect, just changes color
//

interface LampState extends ThingState {
  lit:   Color;
  unlit: Color;
  timer: number;
} 

export class Lamp extends Thing {

  do(cmd, args = []) {
    switch (cmd) {
      case Command.LAMP_FLASH:
        const [ sec ] = args;
        if (typeof sec !== 'number') return console.warn("Lamp can't flash with", sec);
        this.state.flashTime = sec as number;
        this.on();
        return;

      case Command.LAMP_STROBE:
        // TODO
        return;

      case Command.ACTIVATE:
        this.state.flashTime = 0;
        this.on();
        return;

      case Command.DEACTIVATE:
        this.state.flashTime = 0;
        this.off();
        return;

      default:
        console.warn("Lamp can't handle", cmd);
    }
  }

  on() {
    this.color = this.state.lit;
    this.emit(Event.ACTIVATED);
  }

  off() {
    this.color = this.state.unlit;
    this.emit(Event.DEACTIVATED);
  }

  update(dt) {
    if (this.state.flashTime > 0) {
      this.state.flashTime -= dt;
    }

    if (this.state.flashTime <= 0) {
      this.off();
    }

    return super.update(dt);
  }

  static from (name: string, shape:Shape, unlit:Color, lit:Color) {
    return new Lamp(name, shape, unlit, { unlit, lit } as LampState);
  }
}


//
// Kicker
// Imparts an instantenous impulse to the ball.
// TODO: Should this be an animated collider like a flipper?
//

type KickerState = {
  force: Vec2;
}

export class Kicker extends Thing {

  collide(ball:Ball, dt:number) {
    if (this.shape.intersect(ball.pos)) {
      ball.pos.addSelf(this.state.force);
      this.emit(Event.ACTIVATED);
    }
  }

  static from (name:string, shape:Shape, color:Color, force:Vec2) {
    return new Kicker(name, shape, color, { force } as KickerState);
  }

}

