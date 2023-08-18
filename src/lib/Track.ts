
import { lerp, floor, loadAudio } from '$lib/utils';

import type { FxConfig } from "$types";

type FxSpec = {
  key: string // TODO: keyof typeof globalFx
  target: number
  from?: number
  type: 'set' | 'in' | 'out'
}

type TrackSpec = {
  fx?: Array<FxSpec>
}


//
// Track Class
//
// Contains it's own gain node
//

export default class Track {
  ctx: AudioContext
  name: string
  buffer: AudioBuffer
  source: AudioBufferSourceNode
  gain: GainNode
  detune: AudioParam
  volume: AudioParam
  length: number
  spec: TrackSpec
  loaded: boolean

  static PHRASE_SAMPLES = 377704;
  static BEATS_PER_PHRASE = 16;

  constructor (ctx: AudioContext, dest: AudioNode, label:string, src:string, spec:TrackSpec = {}, callback = () => {}) {
    this.ctx = ctx;
    this.name = label;
    this.gain = ctx.createGain();
    this.gain.connect(dest);
    this.volume = this.gain.gain;
    this.spec = spec;
    this.length = 0;
    this.loaded = false;

    loadAudio(ctx, src).then((buffer) => {
      this.buffer = buffer;
      this.length = this.buffer.length/Track.PHRASE_SAMPLES;
      this.loaded = true;
      this.refresh();
      callback();
    });
  }

  refresh () {
    if (this.source) this.source.disconnect();
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.detune = this.source.detune;
    this.source.connect(this.gain);
  }

  progress (p = 0, fx:FxConfig) {
    if (this.spec.fx) {
      for (let { key, target, type, from } of this.spec.fx) {
        from ??= 0;

        fx[key] =
          type === 'set' ? target :
          type === 'in'  ? lerp(from, target, p) :
          type === 'out' ? lerp(from, target, (1.0 - p)) :
          0;
      }
    }
  }

  start (t = 0) {
    this.refresh();
    this.source.start(t);
  }

  haltAt (t = 0) {
    console.log("Halting track", this.name);
    this.detune.linearRampToValueAtTime(-2000, t);
    this.source.stop(t + 0.1);
  }

}
