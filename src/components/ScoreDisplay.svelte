<script lang="ts">
  import Color from "$lib/Color";

  export let balls = 0;
  export let score = 0;
  export let leftColor  = Color.fromTw('green-500').toString();
  export let rightColor = Color.fromTw('red-500').toString();
</script>


<div class="ScoreDisplay">
  <span class="left" style="--color: {leftColor}">
    <span class="back"> 8 </span>
    <span class="front"> {balls} </span>
  </span>

  <span class="right" style="--color: {rightColor}">
    <span class="back"> 88888888 </span>
    <span class="front"> {score} </span>
  </span>
</div>


<style>
  .ScoreDisplay {
    pointer-events: none;
    user-select: none;
    font-family: 'dseg7', monospace;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    min-height: 1vw;
    aspect-ratio: 6.5;
    background: black;
    display: flex;
    align-items: center;
    justify-content: space-between;
    container-type: size;
    z-index: 2;
  }

  @container (min-width:1px) {
    .left, .right {
      position: relative;
      font-size: 10cqi;
      margin: 1cqi 2.5cqi;
      text-shadow: 0 0 1cqi color-mix(in srgb, var(--color) 90%, yellow);
    }

    .right {
      text-align: right;
      min-width: 4cqi;
      flex: 1;
    }

    .front {
      color: var(--color);
    }

    .back {
      display: block;
      width: 100%;
      height: 0.5cqi;
      position: absolute;
      top :0;
      left: 0;
      opacity: 1.0;
      mix-blend-mode: screen;
      text-shadow: none;
      color: color-mix(in srgb, var(--color) 20%, #000022);
      z-index: 2;
    }
  }
</style>
