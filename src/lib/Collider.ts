
import type Ball from './Ball';
import { clamp } from '$lib/utils';
import Vec2 from './Vec2';
import Color from './Color';


//
// Collider
//
// Anything that can be collided.
// Because this is pinball, we can assume all collisions will be vs Ball.
//

export class Collider {

  pos:Vec2;
  color:Color;

  friction = 1;    // Generic friction coefficient for collisions with this thing
  bounceForce = 1; // All energy goes to other (Immovable)

  constructor(pos:Vec2) {
    this.pos = pos;
    this.color = Color.random();
  }

  // returns closest point on this shape to given point
  closest(point:Vec2):Vec2 {
    return this.pos;
  }

  // returns distance to point as a vector
  distance(point:Vec2):Vec2 {
    return point.sub(this.closest(point));
  }

  // returns a correction vector, or null
  intersect(ball:Ball):Vec2|null {
    return null; // No interaction
  }

  // applies correction vector to ball
  collide(ball:Ball) {
    let delta = this.intersect(ball);
    if (delta) {
      ball.pos.addSelf(delta);
    }
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
    return this.pos.sub(point).withLen(this.rad);
  }

  intersect(ball:Ball):Vec2|null {
    let axis = this.distance(ball.pos);
    let dist = axis.len();
    if (dist === 0 || dist > ball.rad + this.rad) return null;
    return axis.withLen((ball.rad + this.rad) - dist);
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

  closest(point:Vec2):Vec2 {
    const ap = point.sub(this.pos);
    const ab = this.tip.sub(this.pos);
    const t = clamp(ap.dot(ab) / ab.dot(ab), 0, 1);
    return this.pos.add(ab.scale(t)).towards(point, this.rad);
  }

  intersect(ball:Ball):Vec2|null {
    let dir = this.distance(ball.pos);
    let dist = dir.len();
    if (dist === 0 || dist > ball.rad) return null;
    return dir.withLen(ball.rad - dist);
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
    this.normal = this.tip.sub(this.pos).norm().perp();
  }

}

