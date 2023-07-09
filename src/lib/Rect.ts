
import type { Tuple4 } from "$types";
import type Ball from "./Ball";

import Vec2 from "./Vec2";

import { abs } from "./utils";



//
// Rect
//
// In world space (Y+ going up)
// X and Y are always centered
//

export default class Rect {

  top:number;
  left:number;
  right:number;
  bottom:number;

  constructor (left:number, top:number, right:number, bottom:number) {
    this.top    = top;
    this.left   = left;
    this.right  = right;
    this.bottom = bottom;
  }

  get x1():number { return this.left }
  get y1():number { return this.top }
  get x2():number { return this.right }
  get y2():number { return this.bottom }

  get aspect():number { return this.w / this.h }

  get w():number { return abs(this.right - this.left) }
  get h():number { return abs(this.top - this.bottom) }
  get x():number { return this.left + this.w/2 }
  get y():number { return this.top  + this.h/2 }

  intersect(point:Vec2):boolean {
    return (
      point.x > this.left   ||
      point.x < this.right  ||
      point.y > this.bottom ||
      point.y < this.top);
  }

  collide(ball:Ball) {
    throw new Error("Not implemented");
  }

  collideInterior(ball:Ball) {
    let delta = Vec2.zero;
    if (ball.pos.x < this.left   + ball.rad) delta.set2(ball.rad - (ball.pos.x - this.left), 0);
    if (ball.pos.x > this.right  - ball.rad) delta.set2((this.right - ball.pos.x)- ball.rad, 0);
    if (ball.pos.y < this.bottom + ball.rad) delta.set2(0, ball.rad - (ball.pos.y - this.bottom));
    if (ball.pos.y > this.top    - ball.rad) delta.set2(0, (this.top - ball.pos.y) - ball.rad);
    ball.pos.addSelf(delta);
  }

  asTuple():Tuple4 {
    return [this.left, this.top, this.w, this.h];
  }

  toScreen():Tuple4 {
    return [this.left, this.bottom, this.w, this.h];
  }

}

