
import type { Collider } from "$lib/Collider";

import type Rect    from "$lib/Rect";
import type Sink    from "$lib/Sink";
import type Flipper from "$lib/Flipper";



// Table Type

export type Table = {
  bounds: Rect,
  colliders: Collider[],
  sinks: Sink[],
  flippers: {
    left: Flipper,
    right: Flipper,
  }
}

export { default as TattooMystique } from "./tattoo-mystique";

