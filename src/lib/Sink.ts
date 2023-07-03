
import { Collider } from './Collider';


//
// Sink
//
// Can use any object; shims collision interface
//

export default class Sink extends Collider {

  shape: Collider;

  constructor(shape: Collider) {
    super(shape.pos);
    this.shape = shape;
  }

  get pos() { return this.shape.pos; }
  get rad() { return this.shape.rad; }

  closest(point:Vec2):Vec2 {
    return this.shape.closest(point);
  }

  intersect(point:Vec2):Vec2|null {
    return this.shape.intersect(point);
  }

  collide(ball:Ball) {
    if (this.shape.intersect(ball.pos)) ball.cull = true;
  }

  static from (shape: Collider) {
    return new Sink(shape);
  }

}

