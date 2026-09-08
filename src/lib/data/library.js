import base from './library.json';
import { EXTRA } from './library-extra.js';

/** Legacy library (generated) + hand-written additions, merged once at load. */
export const LIB = {
  tags:   base.tags,
  style:  [...base.style,  ...EXTRA.style],
  lyrics: [...base.lyrics, ...EXTRA.lyrics],
  studio: [...base.studio, ...EXTRA.studio],
  studioGenres: { ...base.studioGenres, ...EXTRA.studioGenres },
  studioGenreLabels: EXTRA.studioGenreLabels,
};

export const countItems = groups => groups.reduce((n, g) => n + g.items.length, 0);
