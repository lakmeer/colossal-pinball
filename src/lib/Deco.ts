
import type Shape from './Shape';

import Color from './Color';


//
// Deco
//
// Doesn't do anything except host a shape.
// Keeps colours and materials.
//

export default class Deco {

  shape: Shape;
  color: Color;

  constructor (shape:Shape, color:Color) {
    this.shape = shape;
    this.color = color;
  }

}

