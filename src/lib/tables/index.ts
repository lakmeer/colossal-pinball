
import type Collider from "$lib/Collider";
import type Rect     from "$lib/Rect";
import type Zone     from "$lib/Zone";
import type Flipper  from "$lib/Flipper";


// Table Type

export default class Table {
  bounds:     Rect;
  zones:      Record<string,Zone>;
  colliders:  Record<string,Collider>;
  template:   null | HTMLImageElement;
  templateSrc: string;
  flippers: {
    left:  Flipper;
    right: Flipper;
  }
}
