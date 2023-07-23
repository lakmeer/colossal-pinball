
import type Rect from './Rect';
import Vec2  from './Vec2';
import Color from './Color';

import { rand, PI } from '$lib/utils';

const MAX_VEL = 100000;


//
// Ball
//

export default class Ball {

  id: number;

  pos:   Vec2;
  vel:   Vec2;
  acc:   Vec2;

  rad:   number;
  mass:  number;
  color: Color;

  #lastPos: Vec2;

  cull: boolean = false;
  friction: number = 1;

  static #id = 0;

  constructor (pos:Vec2, vel:Vec2, rad:number, mass:number, color:Color) {
    this.id    = Ball.#id++;
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
    // TODO: velocity being lost? Check PBD videos
    // Vertlet

    const disp = this.pos.sub(this.#lastPos);
    this.#lastPos.set(this.pos);
    this.vel.set(disp.add(this.acc.scale(dt * dt)).scale(this.friction));
    if (this.vel.len() > MAX_VEL * dt) this.vel.setLen(MAX_VEL * dt);
    this.pos.addSelf(this.vel);
    this.acc = Vec2.fromXY(0, 0);
    this.friction = 1;

    /*
    const disp = this.pos.sub(this.#lastPos);
    this.#lastPos.set(this.pos);
    this.vel.addSelf(disp * dt * dt);
    this.vel.addSelf(this.acc.scale(dt));
    if (this.vel.len() > MAX_VEL * dt) this.vel.setLen(MAX_VEL * dt);
    this.pos.addSelf(this.vel.scale(dt));
    this.acc = Vec2.fromXY(0, 0);
    this.friction = 1;
*/
  }


  // Static

  static randomAt(x:number, y:number, r:number = 5) {
    return new Ball(
      Vec2.fromXY(x, y),
      Vec2.fromXY(0, 0),
      r,
      r*r*PI,
      new Color(1, 1, 1, 1) // Color.random()
    )
  }

  static withVel (pos:Vec2, vel:Vec2, r:number = 5) {
    let b = new Ball(
      pos.clone(),
      Vec2.zero,
      r,
      r*r*PI,
      new Color(1, 1, 1, 1)
    )
    b.impart(vel);
    return b;
  }

}

