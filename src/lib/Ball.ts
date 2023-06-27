
import type Rect from './Rect';
import Vec2  from './Vec2';
import Color from './Color';

import { rand } from '$lib/utils';


//
// Ball
//

export default class Ball {

  pos   : Vec2;
  vel   : Vec2;
  rad   : number;
  mass  : number;
  color : Color;
  pos_  : Vec2;
  acc   : Vec2;

  constructor (pos:Vec2, vel:Vec2, rad:number, mass:number, color:Color) {
    this.pos   = pos;
    this.vel   = vel;
    this.rad   = rad;
    this.mass  = 1;
    this.color = color;
    this.pos_  = pos.clone();
    this.acc   = Vec2.from(0, 0);
  }   


  // Static

  static random (bounds:Rect) {
    const m = rand(1, 1);
    return new Ball(
      Vec2.random(...bounds.toRange()),
      Vec2.from(0, 0),
      m,
      m,
      Color.random()
    )
  }
}

