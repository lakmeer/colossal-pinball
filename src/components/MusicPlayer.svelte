<script lang="ts">
  import type { FxConfig } from "$types";

  import { onMount } from 'svelte';
  import { floor } from '$lib/utils';

  import Track from '$lib/Track';
  import Color from '$lib/Color';

  const PHRASE_SAMPLES = 377704;
  const BEATS_PER_PHRASE = 16;
  const DEBUG_START_AT_TRACK = 0;

  export let globalFx:FxConfig;


  // Audio Graph

  let ctx:AudioContext;
  let globalGain:GainNode;
  let globalLPF:BiquadFilterNode;

  export const start = () => {
    if (!loaded || !track || !track.loaded) return;
    if (playing) return;
    track.start(ctx.currentTime);
    startTime = ctx.currentTime;
    playing = true;
    scheduler();
  }

  export const stop = () => {
    if (!playing) return;
    track.haltAt(ctx.currentTime + 0.5);
    playing = false;
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

  const tracks:Record<string, Track> = {};


  // State

  let startTime = 0;
  let playing = false;
  let current = 0;
  let loopTime = 0;
  let loopProgress = 0;
  let nextLoopScheduled = false;
  let beat = 0;

  let loaded = false;
  let track:Track;
  let loadMonitor = 0; // keeps loaders updated even though they're not reactive

  export let beatPhase = 0;

  const SCHEDULE_THRESHOLD = 0.05;


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

    // Beat sync
    beat = floor(loopTime * BEATS_PER_PHRASE / phraseLength);
    beatPhase = 1.0 - (loopTime % (phraseLength / BEATS_PER_PHRASE)) / (phraseLength / BEATS_PER_PHRASE);

    // Start of fresh loop
    if (loopTime < SCHEDULE_THRESHOLD && nextLoopScheduled) {
      nextLoopScheduled = false;
      current += 1;
      track = tracks[order[current]];
    }

    // Update FX lerps
    track.progress(loopProgress, globalFx);

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
      startTime -= loopLength; // Dont start part way thru next one if length is different
    }

    if (playing) {
      requestAnimationFrame(scheduler);
    }
  }


  //
  // Lifecycle
  //

  // TODO: Audio engine object?

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
      tracks[i] = new Track(ctx, globalLPF, `Track ${i}`, `music/${i}.mp3`, trackSpec[i],
        () => { loaded = ++loadMonitor >= order.length } // haaaaax
      );
    }

    track = tracks[order[current]];

    return () => {
      track?.stop();
      playing = false;
      globalGain.disconnect();
      ctx.close();
      ctx = null;
    }
  });

  const GREEN  = Color.fromTw('emerald-500').toString();
  const RED    = Color.fromTw('rose-500').toString();
</script>


<div style="--phase: {beatPhase}; --red: {RED}; --green:{GREEN};">
  {#if loaded}
    <div class="track">
      <span>{ track.name }</span>
      <progress max="100" value={ floor(loopProgress * 100) } />
    </div>
  {:else}
    <h3>Load {loadMonitor}/{order.length}</h3>
  {/if}

  <div class="status">
    {#each Object.values(tracks) as track, ix}
      <span class="pulse" class:active={ix==current}
        style="--bg: {(track.loaded ? GREEN : RED) || loadMonitor}"
      >
        {#if ix===current} {beat.toString(16)} {/if}
      </span>
    {/each}
  </div>
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
