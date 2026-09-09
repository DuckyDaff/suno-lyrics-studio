/** Musical-structure presets: sections with bar counts. kind: lyrics | instrumental | backing */
const L = (name, bars) => ({ name, bars, kind: 'lyrics' });
const I = (name, bars) => ({ name, bars, kind: 'instrumental' });

export const STRUCTURE_PRESETS = [
  { id: 'pop', label: 'Pop standard', sig: '4/4', linesPerBar: '1', rows: [
    I('Intro', 4), L('Verse 1', 8), L('Pre-Chorus', 4), L('Chorus', 8), L('Verse 2', 8), L('Pre-Chorus', 4), L('Chorus', 8),
    L('Bridge', 8), L('Final Chorus', 8), I('Outro', 4) ] },
  { id: 'rap', label: 'Rap / Hip-Hop', sig: '4/4', linesPerBar: '1', rows: [
    I('Intro', 4), L('Hook', 8), L('Verse 1', 16), L('Hook', 8), L('Verse 2', 16), L('Hook', 8), L('Bridge', 8), L('Hook', 8), I('Outro', 4) ] },
  { id: 'ballad', label: 'Ballad 3/4 (waltz)', sig: '3/4', linesPerBar: '0.5', rows: [
    I('Intro', 8), L('Verse 1', 16), L('Chorus', 16), L('Verse 2', 16), L('Chorus', 16), I('Instrumental', 8), L('Bridge', 8), L('Final Chorus', 16), I('Outro', 8) ] },
  { id: 'edm', label: 'EDM / Dance', sig: '4/4', linesPerBar: '1', rows: [
    I('Intro', 8), L('Verse 1', 8), L('Build Up', 8), I('Drop', 16), L('Verse 2', 8), L('Build Up', 8), I('Drop', 16), L('Breakdown', 8), I('Drop', 16), I('Outro', 8) ] },
  { id: 'mizrahi', label: 'Mizrahi', sig: '4/4', linesPerBar: '1', rows: [
    I('Intro', 8), L('Verse 1', 8), L('Chorus', 8), I('Instrumental', 4), L('Verse 2', 8), L('Chorus', 8), I('Solo', 8), L('Chorus', 8), I('Outro', 4) ] },
  { id: 'rock', label: 'Rock', sig: '4/4', linesPerBar: '1', rows: [
    I('Intro', 8), L('Verse 1', 8), L('Chorus', 8), L('Verse 2', 8), L('Chorus', 8), I('Guitar Solo', 8), L('Bridge', 8), L('Chorus', 8), L('Final Chorus', 8), I('Outro', 4) ] },
  { id: 'children', label: "Children's song", sig: '2/4', linesPerBar: '1', rows: [
    I('Intro', 4), L('Verse 1', 8), L('Chorus', 8), L('Verse 2', 8), L('Chorus', 8), L('Chorus', 8) ] },
  { id: 'opera', label: 'Opera scene', sig: '4/4', linesPerBar: '0.5', rows: [
    I('Overture', 8), L('Recitative', 8), L('Aria', 16), L('Recitative', 8), L('Aria', 16), L('Finale', 16) ] },
  { id: 'trap', label: 'Trap', sig: '4/4', linesPerBar: '1', rows: [
    I('Intro', 4), L('Hook', 8), L('Verse 1', 12), L('Hook', 8), L('Verse 2', 12), L('Hook', 8), I('Outro', 4) ] },
  { id: 'reggaeton', label: 'Reggaeton', sig: '4/4', linesPerBar: '1', rows: [
    I('Intro', 4), L('Chorus', 8), L('Verse 1', 8), L('Pre-Chorus', 4), L('Chorus', 8), L('Verse 2', 8), L('Pre-Chorus', 4), L('Chorus', 8), L('Bridge', 4), L('Chorus', 8), I('Outro', 4) ] },
];

export const TIME_SIGS = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8'];
export const SECTION_NAMES = ['Intro', 'Verse 1', 'Verse 2', 'Verse 3', 'Pre-Chorus', 'Chorus', 'Final Chorus', 'Hook', 'Bridge',
  'Instrumental', 'Solo', 'Guitar Solo', 'Drop', 'Build Up', 'Breakdown', 'Interlude', 'Recitative', 'Aria', 'Outro'];

export const beatsPerBar = sig => parseInt(String(sig).split('/')[0], 10) || 4;

/** rough duration in seconds */
export function estimateSeconds(rows, sig, bpm) {
  const bars = rows.reduce((n, r) => n + (parseInt(r.bars, 10) || 0), 0);
  const b = parseInt(bpm, 10);
  if (!b) return null;
  return Math.round(bars * beatsPerBar(sig) * 60 / b);
}
