
import type Ball  from './Ball';
import type Shape from './Shape';

import Vec2  from './Vec2';
import Color from './Color';


//
// Zone
//
// Applies varieus effects to the ball while it intersects the shape.
//
// TODO: `apply` and `update` might be the same thing
//

interface Zone {

  shape: Shape;
  color: Color;

  // Proxy the shape's intersection function (TODO: Delete?)
  intersect(point:Vec2):boolean;

  // Apply the zone's effect to the ball
  apply(ball:Ball):void;

  // Any other per-frame behaviour
  update(dt:number):void;

  // Clear any state accumulated this frame
  reset():void;
}



//
// Drain Zone
//
// Kills the ball
//

export class Drain implements Zone {

  shape:Shape;
  color:Color;

  constructor(shape:Shape) {
    this.shape = shape;
    this.color = new Color(0, 0, 0, 1);
  }

  intersect(point:Vec2):boolean {
    return this.shape.intersect(point);
  }

  apply(ball:Ball) {
    if (this.shape.intersect(ball.pos)) ball.cull = true;
  }

  update(dt:number) {}

  reset() {}

  static from (shape:Shape) {
    return new Drain(shape);
  }

}


//
// Rollover
//
// Detects when ball enters or leaves (rollovers)
// TODO: Give zones and colliders some state for gameplay
//

export class Rollover implements Zone {

  shape:Shape;
  color:Color;
  state: { // will be checked and cleared next frame
    active: boolean;
    entered: boolean;
  }

  constructor(shape:Shape) {
    this.shape = shape;
    this.color = Color.fromTw('white');
    this.state = {
      active:  false,
      entered: false,
    }
  }

  intersect(point:Vec2):boolean {
    return this.shape.intersect(point);
  }

  apply(ball:Ball) {
    if (this.shape.intersect(ball.pos)) {
      if (!this.state.active) console.log("Rollover: ping!");
      this.state.active = true;
      this.color = Color.fromTw('red-400');
    }
  }

  update(dt:number) {}

  reset() {
    this.state.active = false;
    this.color = Color.fromTw('white');
  }

  static from (shape:Shape) {
    return new Rollover(shape);
  }

}



//
// Force Zone
//
// Pushes the ball steadily.
//

export class Force implements Zone {

  shape: Shape;
  color: Color;
  force: Vec2;

  constructor(shape:Shape, force:Vec2) {
    this.shape = shape;
    this.force = force;
    this.color = Color.fromTw('green-400').alpha(0.3);
  }

  intersect(point:Vec2):boolean {
    return this.shape.intersect(point);
  }

  apply(ball:Ball) {
    if (this.shape.intersect(ball.pos)) {
      ball.impart(this.force);
    }
  }

  update(dt:number) {}

  reset () {}

  static from (shape:Shape, force:Vec2) {
    return new Force(shape, force);
  }
}



//
// Kicker
//
// Imparts a large force instantaneously
// TODO: Should this be an animated collider like a flipper?
//

export class Kicker implements Zone {

  shape: Shape;
  color: Color;
  force: Vec2;
  active: boolean;

  constructor(shape:Shape, force:Vec2) {
    this.shape = shape;
    this.force = force;
    this.color = Color.fromTw('red-500').alpha(1.5);
    this.active = false;
  }

  intersect(point:Vec2):boolean {
    return this.shape.intersect(point);
  }

  apply(ball:Ball) {
    if (this.shape.intersect(ball.pos)) {
      if (this.active) {
        // Just move the ball, PBD will work out the forces
        ball.pos.addSelf(this.force);
        this.active = false;
      }
    }
  }

  update(dt:number) {}

  reset () {
    this.active = false;
  }

  static from (shape:Shape, force:Vec2) {
    return new Kicker(shape, force);
  }

}



//
// Magnet
// Attract (or repel) the ball to a single point (ie: magents)
//


//
// Lamp
// Doesn't intersect, just changes color
//

export class Lamp implements Zone {

  shape:Shape;
  hue:string;
  color:Color;
  flashTime:number;

  // TW shades
  static ON  = 300;
  static OFF = 800;

  constructor (shape:Shape, hue:string) {
    this.shape = shape;
    this.hue = hue;
    this.color = Color.fromTw(hue + '-800').alpha(0.3);
  }

  flash() {
    this.flashTime = 1; // seconds
    this.color = this.litColor;
  }

  update(dt:number) {
    if (this.flashTime > 0) {
      this.flashTime -= dt;
    }

    if (this.flashTime <= 0) {
      this.color = this.unlitColor;
    }
  }

  intersect(point:Vec2):boolean { return false; }

  apply(ball:Ball) {}

  reset() {}

  get litColor():Color   { return Color.fromTw(this.hue + '-' + Lamp.ON); }
  get unlitColor():Color { return Color.fromTw(this.hue + '-' + Lamp.OFF); }

  static from (shape:Shape, hue:string) {
    return new Lamp(shape, hue);
  }
}



//
// Slow
// Change the simulation time factor
// TODO: apply() should take a copy of the gamestate, when it exists
//




// Export Zone interface for typescript

export default Zone;

