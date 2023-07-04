import type Vec2 from './Vec2';
import type Ball from './Ball';

import type { Collider } from './Collider';


//
// Sink
//
// Can use any object; shims collision interface.
// Marks any intersecting balls for deletion.
//

export default class Sink {

  shape: Collider;

  constructor(shape: Collider) {
    this.shape = shape;
  }

  get pos() { return this.shape.pos; }
  get rad() { return this.shape.rad; }

  closest(point:Vec2):Vec2 {
    return this.shape.closest(point);
  }

  intersect(point:Vec2):boolean {
    return this.shape.intersect(point);
  }

  collide(ball:Ball) {
    if (this.shape.intersect(ball.pos)) ball.cull = true;
  }

  static from (shape: Collider) {
    return new Sink(shape);
  }

}

