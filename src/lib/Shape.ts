import type Ball from './Ball';

import Vec2  from './Vec2';
import Rect  from './Rect';

import { min, abs, sqrt, clamp, shortestAngle, nearestPointOn, TAU } from '$lib/utils';


//
// Shape
//
// Defines the boundary and intersection rules for various shapes.
// Rendering and physical properties are handled by a parent object.
//

interface Shape {
  pos:Vec2;
  rad:number; // Not used by everyone

  // Rotate the shape in-place
  turn(delta:number):void;

  // Get vector to nearest point on the shape
  closest(point:Vec2):Vec2;

  // Whether a point lies within the shape
  intersect(point:Vec2):boolean;

  // How to push the ball so that it no longer intersects.
  // Returns a zero vector if the ball is not intersecting.
  eject(ball:Ball):Vec2;
}

export default Shape;


//
// Circle
//

export class Circle implements Shape {

  pos:Vec2;
  rad:number;
  invert: boolean = false;

  constructor(pos:Vec2, rad:number) {
    this.pos = pos;
    this.rad = rad;
  }

  turn (delta:number) {
    // no-op
  }

  closest(point:Vec2):Vec2 {
    return this.pos.towards(point, this.rad);
  }

  intersect(point:Vec2):boolean {
    if (this.invert) {
      return (this.pos.sub(point).len() >= this.rad);
    } else {
      return (this.pos.sub(point).len() <= this.rad);
    }
  }

  eject(ball:Ball):Vec2 {
    let delta = this.pos.sub(ball.pos);

    if (this.invert) {
      let dist = delta.len() - this.rad + ball.rad;
      if (dist > 0) return delta.withLen(dist);
    } else {
      let dist = delta.len() - this.rad - ball.rad;
      if (dist < 0) return delta.withLen(dist);
    }

    return Vec2.zero;
  }

  static at (x:number, y:number, rad:number) {
    return new Circle(Vec2.fromXY(x, y), rad);
  }

  static inverted (x:number, y:number, rad:number) {
    const it = new Circle(Vec2.fromXY(x, y), rad);
    it.invert = true;
    return it;
  }
}



//
// Arc
//
// Like a circle but only intersects on a certain range of angles
//

export class Arc implements Shape {

  pos:Vec2;
  rad:number;    // thickness
  radius:number; // arc radius
  range:number;
  angle:number;

  constructor(pos:Vec2, rad:number, radius:number, range:number, angle:number = 0) {
    this.pos = pos;
    this.rad = rad;
    this.range = range;
    this.angle = angle % TAU;
    this.radius = radius;
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
      return this.pos.towards(point, this.radius);
    }

    // Otherwise, return the closest endpoint
    if (shortestAngle(angle, start) < shortestAngle(angle, end)) {
      return this.pos.add(Vec2.fromAngle(this.angle, this.radius));
    } else {
      return this.pos.add(Vec2.fromAngle(this.angle + this.range, this.radius));
    }
  }

  intersect(point:Vec2):boolean {
    return this.closest(point).sub(point).len() <= 5;
  }

  eject(ball:Ball):Vec2 {
    let close = this.closest(ball.pos);
    let delta = close.sub(ball.pos);
    let dist = delta.len() - ball.rad - this.rad;
    if (dist < 0) return delta.withLen(dist);
    return Vec2.zero;
  }

  static at (x:number, y:number, rad:number, radius:number, range:number, angle:number = 0) {
    return new Arc(Vec2.fromXY(x, y), rad, radius, range, angle);
  }
}



//
// Capsule
//

export class Capsule implements Shape {

  pos:Vec2;
  tip:Vec2;
  rad:number;

  constructor(pos:Vec2, tip:Vec2, rad:number) {
    this.pos = pos;
    this.tip = tip;
    this.rad = rad;
  }

  turn(delta:number) {
    const center = this.tip.sub(this.pos).scale(0.5).add(this.pos);
    this.tip = this.tip.sub(center).rotate(delta).add(center);
    this.pos = this.pos.sub(center).rotate(delta).add(center);
  }

  pivot(delta:number) {
    this.tip = this.tip.sub(this.pos).rotate(delta).add(this.pos);
  }

  setPivot(angle:number) {
    let length = this.tip.sub(this.pos).len();
    this.tip = this.pos.add(Vec2.fromAngle(angle, length));
  }

  closest(point:Vec2):Vec2 {
    return nearestPointOn(this.pos, this.tip, point).towards(point, this.rad);
  }

  intersect(point:Vec2):boolean {
    const dir = nearestPointOn(this.pos, this.tip, point).sub(point);
    if (dir.len() >= this.rad) return false;
    return true;
  }

  eject(ball:Ball):Vec2 {
    let delta = nearestPointOn(this.pos, this.tip, ball.pos).sub(ball.pos);
    let dist = delta.len() - ball.rad - this.rad;
    if (dist < 0) return delta.withLen(dist);
    return Vec2.zero;
  }

  static at (x:number, y:number, tipX:number, tipY:number, rad:number) {
    return new Capsule(Vec2.fromXY(x, y), Vec2.fromXY(tipX, tipY), rad);
  }

  static att (x:number, y:number, rad:number, length:number, angle = 0) {
    const middle = Vec2.fromXY(x, y);
    const half = Vec2.fromAngle(angle + TAU/4, length/2);
    return new Capsule(middle.add(half), middle.sub(half), rad);
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

export class Segment implements Shape {

  pos:Vec2;
  tip:Vec2;
  rad:number;
  flip:number;
  normal:Vec2;

  constructor(pos:Vec2, tip:Vec2, flip = false) {
    this.pos = pos;
    this.tip = tip;
    this.rad = 0;
    this.flip = flip ? -1 : 1;
    this.normal = this.pos.sub(this.tip).norm().perp().scale(this.flip);
  }

  turn(delta:number) {
    const center = this.tip.sub(this.pos).scale(0.5).add(this.pos);
    this.tip = this.tip.sub(center).rotate(delta).add(center);
    this.pos = this.pos.sub(center).rotate(delta).add(center);
  }

  closest(point:Vec2):Vec2 {
    return nearestPointOn(this.pos, this.tip, point).towards(point, this.rad);
  }

  intersect(point:Vec2):boolean {
    return this.normal.dot(this.tip.sub(point)) < 0
      && nearestPointOn(this.pos, this.tip, point).sub(point).len() < 5;
  }

  eject(ball:Ball):Vec2 {
    const delta = nearestPointOn(this.pos, this.tip, ball.pos).sub(ball.pos);
    let dist = delta.len() - ball.rad;
    if (dist > 0) return Vec2.zero;
    if (this.normal.dot(this.tip.sub(ball.pos)) > 0) {
      return this.normal.withLen(dist);
    }
    return Vec2.zero;
  }

  flipNormal () {
    this.flip = -this.flip;
    this.normal = this.pos.sub(this.tip).norm().perp().scale(this.flip);
    return this;
  }

  static at (x:number, y:number, tipX:number, tipY:number, flip = false) {
    return new Segment(Vec2.fromXY(x, y), Vec2.fromXY(tipX, tipY), flip);
  }

}


//
// Fence
//
// Chain of line segments.
// Directional; only pushes from one side.
//

export class Fence implements Shape {

  pos:Vec2;
  rad:number;
  links: Capsule[] = [];
  vertices: Vec2[] = [];

  constructor(vertices:Vec2[], rad = 1) {
    this.pos = vertices[0];
    this.rad = rad;
    this.vertices = vertices;

    for (let i = 0; i < vertices.length - 1; i++) {
      this.links.push(new Capsule(vertices[i], vertices[i + 1], rad));
    }
  }

  turn (delta:number) {
    // no-op
  }

  closest(point:Vec2):Vec2 {
    let closest = this.links[0].closest(point);
    let dist = closest.sub(point).len();
    for (let link of this.links) {
      let test = link.closest(point);
      let testDist = test.sub(point).len();
      if (testDist < dist) {
        closest = test;
        dist = testDist;
      }
    }
    return closest;
  }

  intersect(point:Vec2):boolean {
    for (let link of this.links) {
      if (link.intersect(point)) return true;
    }
    return false;
  }

  eject(ball:Ball):Vec2 {
    let delta = Vec2.zero;
    for (let link of this.links) {
      delta.addSelf(link.eject(ball));
    }
    return delta;
  }

  close () {
    return new Fence([ ...this.vertices, this.vertices[0] ], this.rad);
  }

  withRad (rad:number) {
    return new Fence(this.vertices, rad);
  }

  static at (coords:number[], rad:number) {
    let vertices = [];
    for (let i = 0; i < coords.length - 1; i += 2) {
      vertices.push(new Vec2(coords[i], coords[i + 1]));
    }
    return new Fence(vertices, rad);
  }
}



//
// Box
//
// Like a Rect but can be rotated.
// TODO: Collision untested
//

export class Box implements Shape {

  pos:Vec2;
  rad:number;
  w: number;
  h: number;
  angle: number;

  constructor(pos:Vec2, w:number, h:number, angle:number = 0) {
    this.pos = pos;
    this.w = w;
    this.h = h;
    this.rad = sqrt(w * w + h * h) / 2;
    this.angle = angle;
  }

  turn (delta:number) {
    this.angle += delta;
  }

  closest(point:Vec2):Vec2 {
    const dir = point.sub(this.pos).rotate(-this.angle);
    return this.pos.add(Vec2.fromXY(
      clamp(dir.x, -this.w / 2, this.w / 2),
      clamp(dir.y, -this.h / 2, this.h / 2)
    ).rotate(this.angle));
  }

  intersect(point:Vec2):boolean {
    const dir = point.sub(this.pos).rotate(-this.angle);
    return Math.abs(dir.x) < this.w / 2 && Math.abs(dir.y) < this.h / 2;
  }

  eject(ball:Ball):Vec2 {
    const dir = ball.pos.sub(this.pos).rotate(-this.angle);
    const dist = Vec2.fromXY( Math.abs(dir.x) - this.w / 2, Math.abs(dir.y) - this.h / 2);
    if (dist.x < 0 && dist.y < 0) {
      if (dist.x > dist.y) {
        return Vec2.fromXY(dist.x * Math.sign(dir.x), 0);
      } else {
        return Vec2.fromXY(0, dist.y * Math.sign(dir.y));
      }
    }
    return Vec2.zero;
  }

  toRect():Rect {
    return new Rect(this.pos.x - this.w / 2, this.pos.y - this.h / 2, this.pos.x + this.w / 2, this.pos.y + this.h / 2);
  }

  static at (x:number, y:number, w:number, h:number, angle:number = 0) {
    return new Box(Vec2.fromXY(x, y), w, h, angle);
  }

  static fromRect (left:number, top:number, right:number, bottom:number, angle:number = 0) {
    const w = abs(right - left);
    const h = abs(bottom - top);
    return new Box(Vec2.fromXY(left + w / 2, min(top, bottom)+ h / 2), w, h, angle);
  }

}

