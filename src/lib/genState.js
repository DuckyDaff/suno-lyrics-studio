import { persisted } from './persist.js';

/** State of the ✨ Create tab — lives outside the component so switching tabs or reloading keeps it. */
export const blankMix = () => ({
  verse: { form: '', voice: '' }, chorus: { form: '', voice: '' }, bridge: { form: '', voice: '' },
  intro: { form: '', voice: '' }, outro: { form: '', voice: '' }, notes: '',
});

/** a fresh Create form (used at start and by the reset button) */
export const genDefaults = () => ({
  idea: '', form: 'pop song', language: 'Hebrew', rhyme: 'auto', persona: '', length: 'normal',
  useStructure: false, useStyle: true, extra: '',
  mixOn: false, mix: blankMix(),
  musicOn: false, music: { bpm: '', sig: '4/4', linesPerBar: 'auto', bars: [] },
  output: '', outMode: '', usage: null,
  fix: null,            // last "prepare for Suno" pass: { before, changes }
});

export const genState = persisted('melodraft_v2_gen', genDefaults());

/** back to an empty Create form (the song itself, its lyrics and Style, are not touched) */
export function resetGen() { genState.set(genDefaults()); }

export function setGen(patch) { genState.update(s => ({ ...s, ...patch })); }

/** abort controller of the generation currently streaming (survives tab switches) */
export const genAbort = { current: null };
