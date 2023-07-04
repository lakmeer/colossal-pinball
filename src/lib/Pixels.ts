
import type Color from '$lib/Color';


//
// Pixels
//
// An offscreen canvas with a per-pixel, Color-aware interface.
//

export default class Pixels {

  canvas_:  HTMLCanvasElement;
  context: CanvasGameRenderer;
  pixels:  ImageData;

  constructor (width:number, height:number) {
    this.canvas_ = document.createElement('canvas');
    this.canvas_.width  = width;
    this.canvas_.height = height;

    this.context = this.canvas_.getContext('2d') as CanvasRenderingContext2D;
    this.reset();
  }

  get width ():number {
    return this.canvas_.width;
  }

  get height ():number {
    return this.canvas_.height;
  }

  get canvas ():HTMLCanvasElement {
    this.context.putImageData(this.pixels, 0, 0);
    return this.canvas_;
  }

  reset ():void {
    this.context.clearRect(0, 0, this.width, this.height);
    this.pixels = this.context.getImageData(0, 0, this.width, this.height);
  }

  commit ():void {
    this.context.putImageData(intersectionPixels, 0, 0);
  }

  setp (x:number, y:number, color:Color):void {
    let [ r, g, b, a ] = color.to8bit();
    let p = 4 * (x + y * this.pixels.width);
    this.pixels.data[p + 0] = r;
    this.pixels.data[p + 1] = g;
    this.pixels.data[p + 2] = b;
    this.pixels.data[p + 3] = a;
  }

}

