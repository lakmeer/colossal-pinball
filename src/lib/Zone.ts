
import type Vec2 from './Vec2';
import type Ball from './Ball';

import type { Collider } from './Collider';


//
// Force Zone
//
// Can use any object; shims collision interface.
// Pushes the ball steadily.
//

export default class Zone {

  shape: Collider;
  force: Vec2;

  constructor(shape: Collider, force: Vec2) {
    this.shape = shape;
    this.force = force;
  }

  get pos() { return this.shape.pos; }
  get rad() { return this.shape.rad; }

  intersect(point:Vec2):boolean {
    return this.shape.intersect(point);
  }

  collide(ball:Ball) {
    if (this.intersect(ball.pos)) {
      ball.impart(this.force);
    }
  }

  static from (shape: Collider, force: Vec2) {
    return new Zone(shape, force);
  }

}

