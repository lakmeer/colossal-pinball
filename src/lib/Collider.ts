import type Ball  from './Ball';
import type Shape from './Shape';

import Vec2  from './Vec2';
import Color from './Color';


//
// Collider
//
// Anything that can be collided with.
// Because this is pinball, we can assume all collisions will be vs Ball.
//

export default class Collider {

  shape:Shape;
  color:Color;
  friction?:number;
  bounceForce?:number;

  constructor (shape:Shape, color:Color) {
    this.shape = shape;
    this.color = color ?? Color.static();
  }

  collide (ball:Ball) {
    ball.pos.addSelf(this.shape.eject(ball).jitter());
  }

  static from (shape:Shape, color:Color) {
    return new Collider(shape, color);
  }

}

