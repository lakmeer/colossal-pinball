
import type { Tuple4 } from "$types";
import type Ball from "./Ball";

import Vec2 from "./Vec2";


//
// Rect
//
// Is in World-Y by default (Y increasing upwards);
// toBounds() returns bbox in Screen-Y (Y increasing downwards).
//

export default class Rect {

  x:number;
  y:number;
  w:number;
  h:number;

  constructor (x:number, y:number, w:number, h:number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get x1():number { return this.x - this.w/2; }
  get y1():number { return this.y + this.h/2; }
  get x2():number { return this.x + this.w/2; }
  get y2():number { return this.y - this.h/2; }

  get top():number    { return this.y1; }
  get left():number   { return this.x1; }
  get right():number  { return this.x2; }
  get bottom():number { return this.y2; }

  intersect(ball:Ball) {
    if (ball.pos.x > this.left   - ball.rad) return Vec2.fromXY((ball.pos.x - this.left) - ball.rad, 0);
    if (ball.pos.x < this.right  + ball.rad) return Vec2.fromXY(ball.rad - (ball.pos.x - this.right), 0);
    if (ball.pos.y > this.bottom - ball.rad) return Vec2.fromXY(0, (ball.pos.y - this.bottom) - ball.rad);
    if (ball.pos.y < this.top    + ball.rad) return Vec2.fromXY(0, ball.rad - (ball.pos.y - this.top));
    return null;
  }

  collide(ball:Ball) {
    let delta = this.intersect(ball);
    if (delta) ball.pos.addSelf(delta);
  }

  collideInterior(ball:Ball) {
    let delta = Vec2.zero;
    if (ball.pos.x < this.left   + ball.rad) delta.set2(ball.rad - (ball.pos.x - this.left), 0);
    if (ball.pos.x > this.right  - ball.rad) delta.set2((this.right - ball.pos.x)- ball.rad, 0);
    if (ball.pos.y < this.bottom + ball.rad) delta.set2(0, ball.rad - (ball.pos.y - this.bottom));
    if (ball.pos.y > this.top    - ball.rad) delta.set2(0, (this.top - ball.pos.y) - ball.rad);

    if (delta) ball.pos.addSelf(delta);
  }

  toBounds():Tuple4 { // Screen Y
    return [ this.x1, this.y2, this.w, this.h ];
  }

  toRange():Tuple4 { // World Y
    return [ this.x1, this.x2, this.y1, this.y2 ];
  }

  toAspect():number {
    return this.w / this.h;
  }

  static at(x:number, y:number, w:number, h:number):Rect {
    return new Rect(x + w/2, y - h/2, w, h);
  }

  static over(x1:number, x2:number, y1:number, y2:number):Rect {
    return new Rect((x1 + x2)/2, (y1 + y2)/2, x2 - x1, y1 - y2);
  }

  static from(x:number, y:number, w:number, h:number):Rect {
    return new Rect(x, y, w, h);
  }

}

