
import type Vec2  from './Vec2';
import type Ball  from './Ball';
import type Shape from './Shape';

import Color from './Color';


//
// Zone
//
// Can use any object; shims collision interface.
// Applies varieus effects to the ball while it intersects the shape.
//

interface Zone {

  shape: Shape;
  color: Color;

  // Proxy the shape's intersection function (TODO: Delete?)
  intersect(point:Vec2):boolean;

  // Apply the zone's effect to the ball
  apply(ball:Ball):void;
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
  state: { // will be checked and cleared this frame
    active: boolean;
    entered: boolean;
    exited: boolean; 
  }

  constructor(shape:Shape) {
    this.shape = shape;
    this.color = Color.fromTw('white');
    this.state = {
      active:  false,
      entered: false,
      exited:  false,
    }
  }

  intersect(point:Vec2):boolean {
    return this.shape.intersect(point);
  }

  apply(ball:Ball) {
    if (this.shape.intersect(ball.pos)) {
      if (!this.state.active) {
        this.state.active = true;
        this.state.entered = true;
        this.color = Color.fromTw('red-400');
      }
    } else {
      if (this.state.active) {
        this.state.active = false;
        this.state.exited = true;
        this.color = Color.fromTw('white');
      }
    }
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

  static from (shape:Shape, force:Vec2) {
    return new Force(shape, force);
  }
}


//
// Magnet
// Attract (or repel) the ball to a single point (ie: magents)
//


//
// Slow
// Change the simulation time factor
// TODO: apply() should take a copy of the gamestate, when it exists
//




// Export Zone interface for typescript

export default Zone;

