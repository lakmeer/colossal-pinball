
import { Collider } from './Collider';


//
// Force Zone
//
// Can use any object; shims collision interface.
// Pushes the ball steadily.
//

export default class Zone extends Collider {

  shape: Collider;
  force: Vec2;

  constructor(shape: Collider, force: Vec2) {
    super(shape.pos);
    this.shape = shape;
    this.force = force;
  }

  get pos() { return this.shape.pos; }

  intersect(point:Vec2):boolean {
    return this.shape.intersect(point);
  }

  collide(ball:Ball) {
    if (this.shape.intersect(ball.pos)) {
      ball.impart(this.force);
    }
  }

  static from (shape: Collider, force: Vec2) {
    return new Sink(shape, force);
  }

}

