
import type Ball  from "./Ball";
import type Shape from "./Shape";
//import type Event from "./Event";
import type Vec2  from "./Vec2";

import Color from './Color';


// From things to table
enum EventType {
  BALL_ENTER,
  BALL_LEAVE,
  BOUNCED,
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
  events:  Array<EventType>;
  f_coeff: number = 1.0;

  constructor (name: string, shape: Shape, color: Color, state:ThingState = {}) {
    this.name   = name;
    this.shape  = shape;
    this.color  = color;
    this.state  = state;
    this.events = [];
  }

  do (cmd:Command, args:any[] = []):void {}

  collide (ball:Ball, Δt:number, fff?:number):void {}

  emit (event:EventType):void {
    this.events.push(event);
  }

  update (Δt:number):Array<EventType> {
    const events = this.events.slice();
    this.events = [];
    return events;
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

  static from (name:string, shape:Shape):Drain {
    return new Drain(name, shape, Color.fromTw('black'));
  }

}


//
// Collider
// Generic collider that emits events when a ball hits it
//

interface ColliderState extends ThingState {
  f_coeff: number;
}

export class Collider extends Thing {

  collide(ball, Δt, fff) {
    let delta = this.shape.eject(ball);
    if (delta.len() === 0) return;
    this.emit(EventType.BOUNCED);
    ball.pos.addSelf(delta.scale(fff * this.state.f_coeff));
  }

  static from (name:string, shape:Shape, f:number = 1.0):Collider {
    return new Collider(name, shape, Color.fromTw('blue-500'), {
      f_coeff: f
    } as ColliderState);
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
  activeColor: Color;
  inactiveColor: Color;
}

export class Rollover extends Thing {

  collide(ball) {
    if (this.shape.intersect(ball.pos)) {
      this.state.intersectedThisFrame = true;
    }
  }

  update(Δt) {
    if (this.state.intersectedThisFrame && !this.state.active) {
      this.state.active = true;
      this.emit(EventType.ACTIVATED);
    }

    if (!this.state.intersectedThisFrame && this.state.active) {
      this.state.active = false;
      this.emit(EventType.DEACTIVATED);
    }

    this.state.intersectedThisFrame = false;
    this.color = this.state.active ? this.state.activeColor : this.state.inactiveColor;

    return super.update(Δt);
  }

  static from (name:string, shape:Shape):Rollover {
    return new Rollover(name, shape, Color.fromTw('emerald-600'), {
      active: false,
      intersectedThisFrame: false,
      activeColor: Color.fromTw('emerald-300'),
      inactiveColor: Color.fromTw('emerald-600'),
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
    this.emit(EventType.ACTIVATED);
  }

  off() {
    this.color = this.state.unlit;
    this.emit(EventType.DEACTIVATED);
  }

  update(Δt) {
    if (this.state.flashTime > 0) {
      this.state.flashTime -= Δt;
    }

    if (this.state.flashTime <= 0) {
      this.off();
    }

    return super.update(Δt);
  }

  static from (name: string, shape:Shape, unlit:Color, lit:Color):Lamp {
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

  collide(ball:Ball, Δt:number) {
    if (this.shape.intersect(ball.pos)) {
      ball.pos.addSelf(this.state.force);
      this.emit(EventType.ACTIVATED);
    }
  }

  static from (name:string, shape:Shape, force:Vec2) {
    return new Kicker(name, shape, Color.fromTw('red-600'), { 
      force
    } as KickerState);
  }

}



//
// Flipper
//

import { Capsule } from "$lib/Shape";
import { sin, cos, min, max, abs } from "$lib/utils";

interface FlipperState extends ThingState {
  angle: number;
  angVel: number;
  active: boolean;
  locked: boolean;
  restAngle: number;
  flipRange: number;
  flipSpeed: number;
}

export class Flipper extends Thing {

  update (Δt) {
    const prevAngle = this.state.angle;

    // TODO: Some easing here
    if (this.state.active) {
      this.setAngle(this.state.angle + this.state.flipSpeed * Δt);
    } else {
      this.setAngle(this.state.angle - this.state.flipSpeed * Δt);
    }

    this.state.angVel = (this.state.angle - prevAngle) / Δt;

    return super.update(Δt);
  }

  collide(ball, Δt, fff) {
    let delta = this.shape.eject(ball);
    if (delta.len() === 0) return;
    this.emit(EventType.BOUNCED);
    ball.pos.addSelf(delta).scale(fff);
  }

  setAngle (angle: number) {
    this.state.angle = max(0, min(angle, this.state.flipRange));
    angle = this.state.restAngle + this.state.angle;
    let shape = this.shape as Capsule;
    shape.setPivot(angle);
  }

  static from (name:string, x:number, y:number, rad:number, len:number, restAngle: number, flipRange:number, flipSpeed:number) {
    const shape = Capsule.at(x, y, x - len, y, rad);
    shape.setPivot(restAngle);

    return new Flipper(name, shape, Color.fromTw('rose-500'), {
      restAngle: restAngle,
      flipRange: flipRange,
      flipSpeed: flipSpeed,
      angle:  restAngle,
      angVel: 0,
      active: false,
      locked: false,
    } as FlipperState);
  }

}

