
import type Ball from './Ball';

import Vec2  from './Vec2';
import Rect  from '$lib/Rect';
import Color from './Color';

import { abs, clamp, shortestAngle, nearestPointOn, TAU } from '$lib/utils';



//
// Collider
//
// Anything that can be collided.
// Because this is pinball, we can assume all collisions will be vs Ball.
//

export class Collider {

  pos:Vec2;
  color:Color;

  inverted = false; // Reverse corrections
  friction = 1;     // Generic friction coefficient for collisions with this thing
  bounceForce = 1;  // All energy goes to other (Immovable)

  constructor(pos:Vec2) {
    this.pos = pos;
    this.color = Color.random();
  }

  // returns closest point on this shape to given point
  closest(point:Vec2):Vec2 {
    return this.pos;
  }

  // returns distance between ball and this shape
  distance(ball:Ball):number {
    return ball.pos.sub(this.pos).len() - ball.rad;
  }

  // returns whether a point is contained by this shape
  intersect(vec2:Vec):boolean {
    return false; // No interaction
  }

  // applies correction vector to ball
  collide(ball:Ball) {
    let delta = this.closest(ball).sub(this.pos);
    if (delta > ball.rad) ball.pos.addSelf(delta.jitter());
  }

  // use as a container
  invert() {
    this.inverted = !this.inverted;
  }
}


//
// Circle
//

export class Circle extends Collider {

  rad:number;

  constructor(pos:Vec2, rad:number) {
    super(pos);
    this.rad = rad;
  }

  closest(point:Vec2):Vec2 {
    return this.pos.towards(point, this.rad);
  }

  distance(ball:Ball):number {
    return ball.pos.sub(this.pos).len() - ball.rad - this.rad;
  }

  intersect(point:Vec2):Vec2|false {
    if (this.inverted) {
      return (this.pos.sub(point).len() >= this.rad);
    } else {
      return (this.pos.sub(point).len() <= this.rad);
    }
  }

  collide(ball:Ball) {
    let delta = this.pos.sub(ball.pos);

    if (this.inverted) {
      let dist = delta.len() - this.rad + ball.rad;
      if (dist > 0) ball.pos.addSelf(delta.withLen(dist).jitter());
    } else {
      let dist = delta.len() - this.rad - ball.rad;
      if (dist < 0) ball.pos.addSelf(delta.withLen(dist).jitter());
    }
  }

  static at (x:number, y:number, rad:number) {
    return new Circle(Vec2.fromXY(x, y), rad);
  }

  static inverted (x:number, y:number, rad:number) {
    const it = new Circle(Vec2.fromXY(x, y), rad);
    it.inverted = true;
    return it;
  }

}


//
// Arc
//
// Only collides a certain range of angles
//

import { debug } from "$src/stores/debug";

export class Arc extends Circle {

  angle:number;
  range:number;

  constructor(pos:Vec2, rad:number, range:number, angle:number = 0) {
    super(pos, rad);
    this.angle = angle % TAU;
    this.range = range;
  }

  get start() {
    return this.angle;
  }

  get end() {
    return (this.angle + this.range) % TAU;
  }

  turn (delta:number) {
    this.angle = (this.angle + delta) % TAU;
  }

  closest(point:Vec2):Vec2 {
    // Bump everything up by tau so we don't have to deal with negative angles
    let start = TAU;
    let end   = TAU + this.range;
    let angle = TAU + ((point.sub(this.pos).angle() + TAU - this.angle) % TAU);

    // If the angle is within the range, return the point
    if (start < angle && angle < end) {
      return this.pos.towards(point, this.rad);
    }

    // Otherwise, return the closest endpoint
    if (shortestAngle(angle, start) < shortestAngle(angle, end)) {
      return this.pos.add(Vec2.fromAngle(this.angle, this.rad));
    } else {
      return this.pos.add(Vec2.fromAngle(this.angle + this.range, this.rad));
    }
  }

  intersect(point:Vec2):boolean {
    return this.closest(point).sub(point).len() <= 5;
    return (this.pos.sub(point).len() <= this.rad);
  }

  collide(ball:Ball) {
    let close = this.closest(ball.pos);
    let delta = close.sub(ball.pos);
    let dist = delta.len() - ball.rad;
    if (dist < 0) ball.pos.addSelf(delta.withLen(dist).jitter());
  }

  static at (x:number, y:number, ...rest) {
    return new Arc(Vec2.fromXY(x, y), ...rest);
  }

}


//
// Capsule
//

export class Capsule extends Collider {

  tip:Vec2;
  rad:number;

  constructor(pos:Vec2, tip:Vec2, rad:number) {
    super(pos);
    this.tip = tip;
    this.rad = rad;
  }

  turn (delta:number) {
    const center = this.tip.sub(this.pos).scale(0.5).add(this.pos);
    this.tip = this.tip.sub(center).rotate(delta).add(center);
    this.pos = this.pos.sub(center).rotate(delta).add(center);
  }

  pointAlong(t:number):Vec2 {
    return this.tip.sub(this.pos).scale(t);
  }

  closest(point:Vec2):Vec2 {
    return nearestPointOn(this.pos, this.tip, point).towards(point, this.rad);
  }

  intersect(point:Vec2):boolean {
    const dir = nearestPointOn(this.pos, this.tip, point).sub(point);
    if (dir.len() >= this.rad) return false;
    return true;
  }

  collide(ball:Ball) {
    let delta = nearestPointOn(this.pos, this.tip, ball.pos).sub(ball.pos);
    let dist = delta.len() - ball.rad - this.rad;
    if (dist < 0) ball.pos.addSelf(delta.withLen(dist).jitter());
  }

  static at (x:number, y:number, tipX:number, tipY:number, rad:number) {
    return new Capsule(Vec2.fromXY(x, y), Vec2.fromXY(tipX, tipY), rad);
  }

  static fromAngle (x:number, y:number, angle:number, length:number, rad:number) {
    const pos = Vec2.fromXY(x, y);
    return new Capsule(pos, pos.add(Vec2.fromAngle(angle, length)), rad);
  }

}


//
// Segment
//
// A line segment between two points.
// Just a special case of capsule with no radius, except that it will always intersect on
// the back side (of the normal) so that it can be used for unclippable walls.
//

export class Segment extends Capsule {

  normal:Vec2;

  constructor(pos:Vec2, tip:Vec2) {
    super(pos, tip, 0);
    this.normal = this.pos.sub(this.tip).norm().perp();
  }
 
  turn (delta:number) {
    super.turn(delta);
    this.normal = this.pos.sub(this.tip).norm().perp();
  }

  intersect(point:Vec2):boolean {
    return this.normal.dot(this.tip.sub(point)) < 0
      && nearestPointOn(this.pos, this.tip, point).sub(point).len() < 5;
  }

  collide(ball:Ball) {
    const delta = nearestPointOn(this.pos, this.tip, ball.pos).sub(ball.pos);
    let dist = delta.len() - ball.rad;
    if (dist > 0) return;

    if (this.normal.dot(this.tip.sub(ball.pos)) > 0) {
      ball.pos.addSelf(this.normal.withLen(dist).jitter());
    }
  }

  static at (x:number, y:number, tipX:number, tipY:number) {
    return new Segment(Vec2.fromXY(x, y), Vec2.fromXY(tipX, tipY));
  }

}


//
// Fence
//
// Chain of line segments.
// Directional; only pushes from one side.
//

export class Fence extends Collider {

  links: Segment[] = [];

  constructor(...vertices:Vec2[]) {
    super(vertices[0]);

    for (let i = 0; i < vertices.length - 1; i++) {
      this.links.push(new Segment(vertices[i], vertices[i + 1]));
    }
  }

  intersect(point:Vec2):boolean {
    for (let link of this.links) {
      if (link.intersect(point)) return true;
    }
    return false;
  }

  collide(ball:Ball):boolean {
    for (let link of this.links) {
      link.collide(ball);
    }
  }

  static at (...vertices:Vec2[]) {
    return new Fence(...vertices);
  }

}


//
// Box
//
// Like a rect but can be rotated.
// TODO: Collision untested
//

export class Box extends Collider {

  w: number;
  h: number;
  angle: number;

  constructor(pos:Vec2, w:number, h:number, angle:number = 0) {
    super(pos);
    this.w = w;
    this.h = h;
    this.angle = angle;
  }

  turn (delta:number) {
    this.angle += delta;
  }

  intersect(point:Vec2):boolean {
    const dir = point.sub(this.pos).rotate(-this.angle);
    return Math.abs(dir.x) < this.w / 2 && Math.abs(dir.y) < this.h / 2;
  }

  collide(ball:Ball) {
    const dir = ball.pos.sub(this.pos).rotate(-this.angle);
    const dist = Vec2.fromXY( Math.abs(dir.x) - this.w / 2, Math.abs(dir.y) - this.h / 2);
    if (dist.x < 0 && dist.y < 0) {
      if (dist.x > dist.y) {
        ball.pos.x += dist.x * Math.sign(dir.x);
      } else {
        ball.pos.y += dist.y * Math.sign(dir.y);
      }
    }
  }

  toRect():Rect {
    return new Rect(this.pos.x, this.pos.y, this.w, this.h);
  }

  static at (x:number, y:number, w:number, h:number) {
    return new Box(Vec2.fromXY(x, y), w, h);
  }

}

