
export const { random, min, max, abs, sqrt, floor, PI } = Math;
export const TAU = PI * 2;

export const rand = (...args:number[]) => {
  if (args.length === 0) return random();
  if (args.length === 1) return random() * args[0];
  return random() * (args[1] - args[0]) + args[0];
}

export const randFrom = <T>(arr:T[]):T =>
  arr[floor(random() * arr.length)];

export const clamp = (n:number, a = 0, b = 1) => min(max(n, a), b);

export const shortestAngle = (a:number, b:number) => {
  let d = (b - a) % TAU;
  if (d < -PI) d += TAU;
  if (d > PI) d -= TAU;
  return d;
}


