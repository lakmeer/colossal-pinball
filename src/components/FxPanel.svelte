<script lang="ts">
  import type { FxConfig } from "$types";
  export let fx:FxConfig;
</script>


<div class="FxPanel">
  {#each Object.keys(fx) as key}
    <span>{key}</span>
    <input bind:value={fx[key]} type="range" min="0" max="1" step="0.01" />
  {/each}
</div>


<style>

  span {
    display: block;
    text-align: right;
    transform: translateY(0.5rem);
    text-transform: uppercase;
  }

  input {
    display: block;
    width: 100%;
  }

</style>
