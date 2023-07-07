
import type Collider from "$lib/Collider";
import type Rect     from "$lib/Rect";
import type Sink     from "$lib/Sink";
import type Flipper  from "$lib/Flipper";


// Table Type

export default class Table {
  bounds: Rect;
  colliders: Collider[];
  sinks: Sink[];
  flippers: {
    left:  Flipper;
    right: Flipper;
  }
}


// Supported tables

export { default as TattooMystique } from "./tattoo-mystique";

