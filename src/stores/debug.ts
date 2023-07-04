
import { writable } from 'svelte/store';

const debugLogs: string[] = [];

const store = writable(debugLogs);

export const debug = (...strs:string[]) =>
  store.update(logs => logs.concat(strs).flat());

export const reset = () =>
  store.set([]);
  
export default store;
