
import type Vec2 from './Vec2';


export const { random, min, max, abs, sqrt, floor, pow, PI } = Math;
export const TAU = PI * 2;

export const clamp = (n:number, a = 0, b = 1) => min(max(n, a), b);
export const lerp = (a:number, b:number, t:number) => a + (b - a) * t;
export const last = <T>(arr:T[]) => arr[arr.length - 1];

export const rand = (...args:number[]) => {
  if (args.length === 0) return random();
  if (args.length === 1) return random() * args[0];
  return random() * (args[1] - args[0]) + args[0];
}

export const randFrom = <T>(arr:T[]):T =>
  arr[floor(random() * arr.length)];

export const shortestAngle = (a:number, b:number) => {
  let d = (b - a) % TAU;
  if (d < -PI) d += TAU;
  if (d > PI) d -= TAU;
  return abs(d);
}

export const nearestPointOn = (a:Vec2, b:Vec2, p:Vec2) => {
  const ab = b.sub(a);
  let t = p.sub(a).dot(ab) / ab.dot(ab);
  return a.lerp(b, clamp(t));
}

