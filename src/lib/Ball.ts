
import type Rect from './Rect';
import Vec2  from './Vec2';
import Color from './Color';

import { rand } from '$lib/utils';

const MAX_VEL = 1000;


//
// Ball
//

export default class Ball {

  pos:   Vec2;
  vel:   Vec2;
  acc:   Vec2;

  rad:   number;
  mass:  number;
  color: Color;

  #lastPos: Vec2;

  cull: boolean = false;
  friction: number = 1;

  constructor (pos:Vec2, vel:Vec2, rad:number, mass:number, color:Color) {
    this.pos   = pos;
    this.vel   = vel;
    this.acc   = Vec2.fromXY(0, 0);
    this.rad   = rad;
    this.mass  = mass;
    this.color = color;
    this.#lastPos = pos.clone();
  }

  impart(force:Vec2) {
    this.acc.addSelf(force);
  }

  collide(ball:Ball) {
    const delta = ball.pos.sub(this.pos);
    const dist = delta.len();
    if (dist === 0 || dist > this.rad + ball.rad) return;
    const corr = delta.withLen((this.rad + ball.rad) - dist).jitter();
    ball.pos.addSelf(corr.scale(0.5));
    this.pos.subSelf(corr.scale(0.5));
  }

  simulate(dt:number) {
    const disp = this.pos.sub(this.#lastPos);
    this.#lastPos = this.pos.clone();
    this.vel.set(disp.add(this.acc.scale(dt * dt)).scale(this.friction));
    if (this.vel.len() > MAX_VEL * dt) this.vel.setLen(MAX_VEL * dt);
    this.pos.addSelf(this.vel);
    this.acc = Vec2.fromXY(0, 0);
    this.friction = 1;
  }


  // Static

  static randomAt(x:number, y:number, r:number = 5) {
    const z = rand(r, r);
    return new Ball(
      Vec2.fromXY(x, y),
      Vec2.fromXY(0, 0),
      z,
      z,
      new Color(1, 1, 1, 1) // Color.random()
    )
  }
}

