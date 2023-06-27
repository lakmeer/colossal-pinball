
export const { random, min, max, abs, sqrt, floor } = Math;

export const rand = (...args:number[]) => {
  if (args.length === 0) return random();
  if (args.length === 1) return random() * args[0];
  return random() * (args[1] - args[0]) + args[0];
}

export const randFrom = <T>(arr:T[]):T =>
  arr[floor(random() * arr.length)];
