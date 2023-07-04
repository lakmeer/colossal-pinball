
import type Color from "$lib/Color";

const { max, floor, PI } = Math;



// Drawing helpers

export const lineAt = (ctx: CanvasRenderingContext2D, a:Vec2, b:Vec2, col:string, width:number) => {
  ctx.lineCap = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = col;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

export const rectAt = (ctx: CanvasRenderingContext2D, r:Rect, col:string) => {
  ctx.fillStyle = col;
  ctx.fillRect(...r.toBounds());
}

export const circleAt = (ctx: CanvasRenderingContext2D, pos:Vec2, rad:number, col:string, invert:boolean) => {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, rad, 0, 2 * Math.PI);
  if (invert) ctx.stroke(); else ctx.fill();
}

export const arcAt = (ctx: CanvasRenderingContext2D, pos:Vec2, rad:number, col:string, start = 0, end = PI*2, cc = false) => {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, rad, start, end, cc);
  ctx.stroke();
}

export const shortArcAt = (ctx: CanvasRenderingContext2D, pos:Vec2, rad:number, col:string, start = 0, end = PI*2) => {
  arcAt(pos, rad, col, start, end, (end - start) < 0);
}

export const capsuleAt = (ctx: CanvasRenderingContext2D, a:Vec2, b:Vec2, rad:number, col:string, normal?:Vec2) => {
  ctx.lineCap = 'round';
  ctx.lineWidth = max(1, rad * 2);
  ctx.strokeStyle = col;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  if (normal) {
    const m = a.lerp(b, 0.5);
    lineAt(ctx, m, m.add(normal.scale(5)), col, 1);
  }
}

