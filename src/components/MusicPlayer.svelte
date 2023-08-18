<script lang="ts">

  import { onMount } from 'svelte';

  import { lerp, floor } from '$lib/utils';

  import Color from '$lib/Color';

  const PHRASE_SAMPLES = 377704;
  const BEATS_PER_PHRASE = 16;

  const DEBUG_START_AT_TRACK = 10;

  export let globalFx;


  // Audio

  let ctx:AudioContext;
  let globalGain:GainNode;
  let globalLPF:BiquadFilterNode;

  type FxSpec = {
    key: string // TODO: keyof typeof globalFx
    target: number
    from?: number
    type: 'set' | 'in' | 'out'
  }

  type TrackSpec = {
    fx?: Array<FxSpec>
  }

  class Track {
    name: string
    buffer: AudioBuffer
    source: AudioBufferSourceNode
    gain: GainNode
    detune: AudioParam
    volume: AudioParam
    length: number
    spec: TrackSpec
    loaded: boolean

    constructor (label:string, src:string, spec:TrackSpec = {}) {
      this.name = label;
      this.gain = ctx.createGain();
      this.gain.connect(globalLPF);
      this.volume = this.gain.gain;
      this.spec = spec;
      this.length = 0;
      this.loaded = false;

      loadAudioBuffer(src).then((buffer) => {
        this.buffer = buffer;
        this.length = this.buffer.length/PHRASE_SAMPLES;
        this.loaded = true;
        this.refresh();
        loadMonitor += 1;
      });
    }

    refresh () {
      if (this.source) this.source.disconnect();
      this.source = ctx.createBufferSource();
      this.source.buffer = this.buffer;
      this.detune = this.source.detune;
      this.source.connect(this.gain);
    }

    progress (p = 0) {
      if (this.spec.fx) {
        for (let fxSpec of this.spec.fx) {
          let from = fxSpec.from ?? 0;
          // TODO: Replace with p-function
          switch (fxSpec.type) {
            case 'set':
              globalFx[fxSpec.key] = fxSpec.target;
              break;
            case 'in':
              globalFx[fxSpec.key] = lerp(from, fxSpec.target, p);
              break;
            case 'out':
              globalFx[fxSpec.key] = lerp(from, fxSpec.target, (1.0 - p));
              break;
            default:
              console.warn("Unsupported fxSpec type:", fxSpec.type);
          }
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

  const loadAudioBuffer = async (src:string):Promise<AudioBuffer> => {
    let file = await fetch(src);
    let arrayBuffer = await file.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  }

  const toggle = () => {
    if (!track || !track.loaded) return;
    if (!playing) {
      track.start(ctx.currentTime);
      startTime = ctx.currentTime;
      globalGain.gain.cancelScheduledValues(ctx.currentTime);
      globalGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
      playing = true;
      scheduler();
    } else {
      track.haltAt(ctx.currentTime + 0.5);
      //globalGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      playing = false;
    }
  }


  // Tracks

  const order = "0123456789ABCDEFX".split('');

  const trackSpec = {
    '3': { fx: [ { key: 'light',   target: 0.5, type: 'in' } ] },
    '4': { fx: [ { key: 'light',   target: 1, type: 'in', from: 0.5 } ] },
    '5': { fx: [ { key: 'beat',    target: 1, type: 'set' } ] },
    '7': { fx: [ { key: 'face',    target: 1, type: 'in' } ] },
    '8': { fx: [ { key: 'swim',    target: 1, type: 'in' } ] },
    'A': { fx: [ { key: 'prelude', target: 1, type: 'in' } ] },
    'B': { fx: [ { key: 'hyper',   target: 1, type: 'set' } ] },
    'C': { fx: [ { key: 'tears',   target: 1, type: 'set' } ] },
    'D': { fx: [ { key: 'hyper',   target: 0, type: 'set' },
                 { key: 'tears',   target: 0, type: 'set' } ] },
    'F': { fx: [ { key: 'hyper',   target: 0, type: 'set' } ] },
  };

  const tracks = { };


  // State

  let startTime = 0;
  let playing = false;
  let current = 0;

  let loopTime = 0;
  let loopProgress = 0;
  let nextLoopScheduled = false;
  let beat = 0;

  let track;
  let loadMonitor = 0; // filthy

  export let beatPhase = 0;

  const SCHEDULE_THRESHOLD = 0.05;

  let filter:number;


  //
  // Scheduling Loop
  //

  function scheduler () {
    const t = ctx.currentTime - startTime;
    const phraseLength = PHRASE_SAMPLES / ctx.sampleRate;
    const loopLength = track.length * phraseLength;

    loopTime = t % loopLength;
    loopProgress = loopTime / loopLength;

    const timeLeft = loopLength - loopTime;

    beat = floor(loopTime * BEATS_PER_PHRASE / phraseLength);
    beatPhase = 1.0 - (loopTime % (phraseLength / BEATS_PER_PHRASE)) / (phraseLength / BEATS_PER_PHRASE);

    // Start of fresh loop
    if (loopTime < SCHEDULE_THRESHOLD && nextLoopScheduled) {
      nextLoopScheduled = false;
      current += 1;
      track = tracks[order[current]];
    }

    track.progress(loopProgress);


    // End of current loop
    if (!nextLoopScheduled && (timeLeft) < SCHEDULE_THRESHOLD) {

      // No next track
      if (current + 1 >= order.length) {
        current = 0;
        playing = false;
        return
      }

      // Next track
      tracks[order[current + 1]].start(ctx.currentTime + timeLeft);
      nextLoopScheduled = true;
      startTime -= loopLength;
    }

    if (playing) {
      requestAnimationFrame(scheduler);
    }
  }


  //
  // Lifecycle
  //

  // @ts-ignore shut up pls
  onMount(async () => {
    current = DEBUG_START_AT_TRACK;

    ctx = new AudioContext();
    globalGain = ctx.createGain();
    globalLPF = ctx.createBiquadFilter();
    globalLPF.connect(globalGain);
    globalGain.connect(ctx.destination);
    globalLPF.type = 'lowpass';
    globalLPF.frequency.value = 20000;
    globalLPF.Q.value = 0;

    for (let i of order) {
      if (tracks[i]) continue;
      tracks[i] = new Track(i, `music/${i}.mp3`, trackSpec[i]);
    }

    track = tracks[order[current]];

    document.addEventListener('click', toggle);

    return () => {
      track.stop();
      playing = false;
      globalGain.disconnect();
      ctx.close();
      ctx = null;
      document.removeEventListener('click', toggle);
    }
  });


  const GREEN  = Color.fromTw('emerald-500').toString();
  const YELLOW = Color.fromTw('gold-500').toString();
  const RED    = Color.fromTw('rose-500').toString();
</script>


<div style="--phase: {beatPhase}; --red: {RED}; --green:{GREEN}; --yellow:{YELLOW}">
  {#if track}
    <div class="track">
      <span>{ track.name }</span>
      <progress max="100" value={ floor(loopProgress * 100) } />
    </div>

    <div class="status">
      {#each Object.values(tracks) as track, ix}
        <span class="pulse" class:active={ix==current}
          style="--bg: {(track.loaded ? GREEN : RED) || loadMonitor}"
        >
          {#if ix===current} {beat.toString(16)} {/if}
        </span>
      {/each}
    </div>
  {/if}
</div>


<style>

  .status {
    display: grid;
    text-align: center;
    grid-template-columns: repeat(6, 1fr);
  }

  .track {
    display: flex;
    align-items: center;
    margin-bottom: 0.7rem;
  }

  .pulse {
    display: block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 0.9rem;
    padding: 0.05rem;
    text-align: center;
    border: 1px solid black;
    background-color: var(--bg);
  }

  .pulse.active {
    color: black;
    background-color: color-mix(in srgb, white calc(var(--phase) * 100%), var(--bg));
  }

  input, progress {
    display: block;
    width: 100%;
    accent-color: var(--green);
  }

  .track progress {
    margin: 0 10px;
    flex: 1;
  }

</style>
