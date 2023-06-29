
import { Capsule } from "$lib/Collider";
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
    this.capsule = new Capsule(pos, pos.clone(), rad);

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

  get pos (): Vec2   { return this.capsule.pos; }
  get tip (): Vec2   { return this.capsule.tip; }
  get rad (): number { return this.capsule.rad; }

  setAngle (angle: number) {
    this.angle = max(0, min(angle, this.flipRange));
    this.updateTipPos();
  }

  updateTipPos () {
    const angle = this.restAngle + this.angle * this.flipDir;
    this.capsule.tip = this.capsule.pos.add(Vec2.fromAngle(angle, this.length));
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

  collide(ball: Ball) {
    let delta = this.capsule.intersect(ball);
    if (delta) ball.pos.addSelf(delta);
  }

}

