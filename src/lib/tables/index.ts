
import type Rect  from "$lib/Rect";
import type Thing from "$lib/Thing";

import type { InputState } from "$types";



// Table Type

export default class Table {
  name:       string;
  bounds:     Rect;
  ballRad:    number;
  things:     Record<string,Thing>;
  process:    (input:InputState) => void;
  template:   null | HTMLImageElement;
  templateSrc: string;
}

