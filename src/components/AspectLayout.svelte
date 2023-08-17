<script lang="ts">
  export let aspect  = 1;
  export let bgColor = 'black';
  export let width:number;
  export let height:number;
</script>


<div class="AspectLayout" style="--bg: {bgColor};">
  <div class="inner"
    bind:clientWidth={width}
    bind:clientHeight={height}
    style="aspect-ratio: {aspect};">
    <slot></slot>
  </div>
</div>

<style>
  .AspectLayout {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: var(--bg);
    container-type: size;
    display: grid;
    box-shadow: 0 0 20px #000204 inset;
  }

  .inner {
    display: grid;
    position: relative;
    margin: auto;
    overflow: hidden;
  }


  /* Aspect Scaling */

  .inner {
    width: auto;
    height: 100cqh;
  }

  @container (max-aspect-ratio: 0.57) {
    .inner {
      height: auto;
      width: 100cqw;
    }
  }
</style>


