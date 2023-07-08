
import type Vec2  from "$lib/Vec2";
import type Rect  from "$lib/Rect";
import type Color from "$lib/Color";

import { max, floor, TAU } from "$lib/utils";


// Drawing helpers

export const lineAt = (ctx:CanvasRenderingContext2D, a:Vec2, b:Vec2, col:string, width:number, cap = 'round') => {
  ctx.lineCap = cap;
  ctx.lineWidth = width;
  ctx.strokeStyle = col;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

export const rectAt = (ctx:CanvasRenderingContext2D, r:Rect, col:string) => {
  ctx.fillStyle = col;
  ctx.fillRect(...r.asTuple());
}

export const boxAt = (ctx:CanvasRenderingContext2D, r:Rect, col:string, a:number = 0) => {
  ctx.fillStyle = col;
  ctx.save();
  ctx.translate(r.left, r.top);
  ctx.rotate(a);
  ctx.fillRect(0, 0, r.w, r.h);
  ctx.restore();
}

export const circleAt = (ctx:CanvasRenderingContext2D, pos:Vec2, rad:number, col:string, invert:boolean = false) => {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, rad, 0, TAU);
  if (invert) ctx.stroke(); else ctx.fill();
}

export const arcAt = (ctx:CanvasRenderingContext2D, pos:Vec2, rad:number, radius:number, col:string, start = 0, end = TAU, cc = false) => {
  ctx.lineCap = 'round';
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = rad * 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, start, end, cc);
  ctx.stroke();
}

export const shortArcAt = (ctx:CanvasRenderingContext2D, pos:Vec2, rad:number, col:string, start = 0, end = TAU) => {
  arcAt(ctx, pos, rad, col, start, end, (end - start) < 0);
}

export const capsuleAt = (ctx:CanvasRenderingContext2D, a:Vec2, b:Vec2, rad:number, col:string, normal?:Vec2) => {
  ctx.lineCap = 'round';
  ctx.lineWidth = max(1, rad * 2);
  ctx.strokeStyle = col;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  if (normal) {
    const m = a.lerp(b, 0.5);
    lineAt(ctx, m, m.add(normal.scale(10)), col, 3, 'butt');
  }
}

export const textAt = (ctx:CanvasRenderingContext2D, text:string, x:number, y:number, col:string, align = "center") => {
  ctx.fillStyle    = col;
  ctx.font         = '10px monospace';
  ctx.textAlign    = align as CanvasTextAlign;
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, -1);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

