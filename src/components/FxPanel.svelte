<script lang="ts">
  import type { FxConfig } from "$types";
  import Color from '$lib/Color';

  export let fx:FxConfig;

  const GREEN = Color.fromTw('emerald-500').toString();
</script>


<div class="FxPanel" style="--green:{GREEN}">
  {#each Object.keys(fx) as key}
    <span>{key}</span>
    <input bind:value={fx[key]} type="range" min="0" max="1" step="0.01" />
  {/each}
</div>


<style>

  .FxPanel {
    user-select: none;
    margin-top: -0.5rem;
  }

  span {
    display: block;
    text-align: right;
    transform: translateY(0.5rem);
    text-transform: uppercase;
    position: relative;
    z-index: 0;
  }

  input {
    display: block;
    width: 100%;
    margin-bottom: -0.5em;
    accent-color: var(--green);
    position: relative;
    z-index: 1;
  }

</style>
