
import type Vec2  from './Vec2';
import type Ball  from './Ball';
import type Shape from './Shape';


//
// Force Zone
//
// Can use any object; shims collision interface.
// Pushes the ball steadily.
//

export default class Zone {

  shape: Shape;
  force: Vec2;

  constructor(shape:Shape, force:Vec2) {
    this.shape = shape;
    this.force = force;
  }

  intersect(point:Vec2):boolean {
    return this.shape.intersect(point);
  }

  collide(ball:Ball) {
    if (this.shape.intersect(ball.pos)) {
      ball.impart(this.force);
    }
  }

  static from (shape:Shape, force:Vec2) {
    return new Zone(shape, force);
  }

}

