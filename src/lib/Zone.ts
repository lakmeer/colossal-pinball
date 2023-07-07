
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
    this.color = Color.zone();
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



// Export Zone interface for typescript

export default Zone;

