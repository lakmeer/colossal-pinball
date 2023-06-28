
import type { Capsule } from "$types";
import Vec2 from "$lib/Vec2";

const { sin, cos, min, max } = Math;


//
// Flipper
//

export default class Flipper {

  capsule: Capsule;
  length: number;
  angle: number;
  angle_: number;
  maxAngle: number;
  restAngle: number;
  flipSpeed: number;
  angVel: number;
  sign: number;
  active: boolean;

  constructor (pos: Vec2, rad: number, length: number, restAngle: number, maxAngle:number, flipSpeed:number) {
    this.capsule = {
      rad: rad,
      a: pos,
      b: pos.clone()
    };

    this.length    = length;
    this.restAngle = restAngle;
    this.maxAngle  = maxAngle;
    this.flipSpeed = flipSpeed;
    this.angle     = 0;
    this.angVel    = 0;
    this.sign      = restAngle < maxAngle ? 1 : -1;
    this.active    = false;
    this.angle_    = this.angle;

    this.setAngle(restAngle);
  }

  get pos (): Vec2   { return this.capsule.a; }
  get a (): Vec2     { return this.capsule.a; }
  get b (): Vec2     { return this.capsule.b; }
  get rad (): number { return this.capsule.rad; }

  contactPoint (p: Vec2) {
    const { a, b, rad } = this.capsule;
    const ab = b.sub(a);
    const ap = p.sub(a);
    const t = ap.dot(ab) / ab.dot(ab);
    const d = ab.scale(t).add(a);
    const n = p.sub(d).norm();
    const c = d.add(n.scale(rad));
    return c;
  }

  activate (state = true) {
    this.active = state;
  }

  setAngle (angle: number) {
    this.angle = max(0, min(angle, this.maxAngle));
    this.capsule.b = this.capsule.a.add(Vec2.fromAngle(this.restAngle + angle * this.sign, this.length));
  }

  update (Δt: number) {
    this.angle_ = this.angle; // Do we need to store this?

    if (this.active) {
      this.setAngle(this.angle + this.flipSpeed * Δt * this.sign);
    } else {
      this.setAngle(this.angle - this.flipSpeed * Δt * this.sign);
    }

    this.angVel = (this.angle - this.angle_) / Δt;
  }

}

