
import type { Capsule } from "$types";
import Vec2 from "$lib/Vec2";

const { sin, cos, min, max, sign, abs } = Math;


//
// Flipper
//

export default class Flipper {

  capsule: Capsule;

  length: number;
  restAngle: number;
  flipDir:   number;
  flipRange: number;
  flipSpeed: number;

  angle: number;
  angVel: number;
  active: boolean;

  constructor (pos: Vec2, rad: number, length: number, restAngle: number, flipRange:number, flipSpeed:number) {
    this.capsule = {
      rad: rad,
      a: pos,
      b: pos.clone()
    };

    this.length    = length;
    this.restAngle = restAngle;
    this.flipDir   = sign(flipRange);
    this.flipRange = abs(flipRange);
    this.flipSpeed = flipSpeed;

    this.angle  = 0;
    this.angVel = 0;
    this.active = false;

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
    this.angle = max(0, min(angle, this.flipRange));
    this.updateTipPos();
  }

  updateTipPos () {
    const angle = this.restAngle + this.angle * this.flipDir;
    this.capsule.b = this.capsule.a.add(Vec2.fromAngle(angle, this.length));
  }

  update (Δt: number) {
    const prevAngle = this.angle;

    if (this.active) {
      this.setAngle(this.angle + this.flipSpeed * Δt);
    } else {
      this.setAngle(this.angle - this.flipSpeed * Δt);
    }

    this.angVel = (this.angle - prevAngle) / Δt;
  }

}

