/**
 * Genre families for the Style randomizer.
 * Each family is internally coherent: any combination of one genre tag, two moods,
 * two instruments, one vocal, one production tag and one BPM reads like a real prompt.
 */
const f = (id, label, group, d) => ({ id, label, group, ...d });

export const GENRE_GROUPS = ['Pop', 'Electronic', 'Urban', 'Rock', 'Soul & Funk', 'Jazz & Blues',
  'Acoustic', 'Cinematic', 'Chill', 'Israeli & Mediterranean', 'Latin & Caribbean', 'World'];

export const GENRES = [
  // ── Pop ──────────────────────────────────────────────────────────
  f('pop', 'Pop', 'Pop', {
    genre: ['Pop', 'Radio Pop', 'Modern Pop', 'Electropop', 'Pop Anthem'],
    mood:  ['Upbeat', 'Catchy', 'Bright', 'Feel-good', 'Confident', 'Playful'],
    instr: ['Synthesizer', 'Clean guitar', 'Piano', 'Punchy drums', 'Synth bass', 'Handclaps'],
    vox:   ['Female vocals', 'Male vocals', 'Layered vocal harmonies', 'Catchy vocal hook'],
    prod:  ['Polished production', 'Radio-ready mix', 'Big chorus', 'Wide stereo'],
    bpm:   ['100 BPM', '108 BPM', '116 BPM', '120 BPM', '124 BPM'] }),
  f('dancepop', 'Dance Pop', 'Pop', {
    genre: ['Dance Pop', 'Club Pop', 'Eurodance', 'Nu-Disco Pop'],
    mood:  ['Euphoric', 'Energetic', 'Club vibe', 'Glamorous', 'Uplifting'],
    instr: ['Four-on-the-floor kick', 'Synth stabs', 'Sidechained pads', 'Synth bass', 'Arpeggiator', 'Claps'],
    vox:   ['Female vocals', 'Diva vocals', 'Vocal chops', 'Processed vocals'],
    prod:  ['Big drop', 'Sidechain compression', 'Festival mix', 'Layered synths'],
    bpm:   ['120 BPM', '124 BPM', '126 BPM', '128 BPM'] }),
  f('synthwave', 'Synthwave / Retro', 'Pop', {
    genre: ['Synthwave', 'Retrowave', '80s Pop', 'Outrun', 'Synth-pop'],
    mood:  ['Nostalgic', 'Neon', 'Dreamy', 'Cinematic', 'Melancholic', 'Driving'],
    instr: ['Analog synth', 'Gated reverb drums', 'Synth bass', 'Arpeggiator', 'Electric guitar', 'DX7 keys'],
    vox:   ['Male vocals', 'Female vocals', 'Reverb-drenched vocals', 'Vocoder'],
    prod:  ['80s production', 'Tape saturation', 'Retro mix', 'Chorus effect'],
    bpm:   ['85 BPM', '100 BPM', '110 BPM', '118 BPM'] }),
  f('kpop', 'K-Pop', 'Pop', {
    genre: ['K-Pop', 'Korean Pop', 'Idol Pop', 'K-Pop Dance'],
    mood:  ['Energetic', 'Sleek', 'Playful', 'Powerful', 'Glossy', 'Bold'],
    instr: ['Trap hi-hats', 'Synth bass', 'Brass stabs', 'Piano', 'Electronic drums', 'Synth lead'],
    vox:   ['Group vocals', 'Rap verse', 'Female vocals', 'Male vocals', 'Vocal harmonies'],
    prod:  ['Genre-switching structure', 'Hyper-polished', 'Big hook', 'Dynamic drops'],
    bpm:   ['100 BPM', '110 BPM', '120 BPM', '128 BPM'] }),
  f('indiepop', 'Indie Pop', 'Pop', {
    genre: ['Indie Pop', 'Bedroom Pop', 'Dream Pop', 'Jangle Pop', 'Alt Pop'],
    mood:  ['Dreamy', 'Wistful', 'Quirky', 'Warm', 'Bittersweet', 'Laid-back'],
    instr: ['Jangly guitar', 'Vintage synth', 'Soft drums', 'Bass guitar', 'Glockenspiel', 'Ukulele'],
    vox:   ['Soft female vocals', 'Breathy male vocals', 'Doubled vocals', 'Whispered vocals'],
    prod:  ['Lo-fi warmth', 'Reverb-soaked', 'DIY production', 'Tape hiss'],
    bpm:   ['90 BPM', '100 BPM', '110 BPM', '118 BPM'] }),

  // ── Electronic ───────────────────────────────────────────────────
  f('edm', 'EDM / Festival', 'Electronic', {
    genre: ['EDM', 'Big Room', 'Progressive House', 'Future Bass', 'Festival EDM'],
    mood:  ['Euphoric', 'Massive', 'Uplifting', 'High energy', 'Anthemic'],
    instr: ['Supersaw lead', 'Sub bass', 'Four-on-the-floor kick', 'Risers', 'Pluck synth', 'White noise sweeps'],
    vox:   ['Female vocals', 'Vocal chops', 'Anthemic vocal hook', 'No vocals'],
    prod:  ['Big drop', 'Sidechain compression', 'Build-up and release', 'Festival mix'],
    bpm:   ['126 BPM', '128 BPM', '130 BPM', '150 BPM'] }),
  f('house', 'House', 'Electronic', {
    genre: ['House', 'Deep House', 'Tech House', 'Disco House', 'Afro House'],
    mood:  ['Groovy', 'Warm', 'Hypnotic', 'Late-night', 'Sexy', 'Uplifting'],
    instr: ['Four-on-the-floor kick', 'Piano chords', 'Deep bass', 'Shakers', 'Filtered disco sample', 'Organ stabs'],
    vox:   ['Soulful vocals', 'Vocal chops', 'Spoken vocal', 'No vocals'],
    prod:  ['Filtered build', 'Sidechain pump', 'Warm analog mix', 'Loop-based'],
    bpm:   ['120 BPM', '122 BPM', '124 BPM', '126 BPM'] }),
  f('techno', 'Techno', 'Electronic', {
    genre: ['Techno', 'Melodic Techno', 'Industrial Techno', 'Minimal Techno', 'Peak-time Techno'],
    mood:  ['Dark', 'Hypnotic', 'Relentless', 'Cold', 'Driving', 'Tense'],
    instr: ['Pounding kick', 'Acid bass', 'Modular synth', 'Metallic percussion', 'Rumble bass', 'Arpeggiator'],
    vox:   ['No vocals', 'Robotic vocal', 'Sparse spoken vocal', 'Vocoder'],
    prod:  ['Warehouse reverb', 'Distorted kick', 'Long build', 'Analog grit'],
    bpm:   ['128 BPM', '132 BPM', '135 BPM', '140 BPM'] }),
  f('trance', 'Trance', 'Electronic', {
    genre: ['Trance', 'Uplifting Trance', 'Psytrance', 'Progressive Trance', 'Vocal Trance'],
    mood:  ['Euphoric', 'Emotional', 'Soaring', 'Hypnotic', 'Dreamy'],
    instr: ['Supersaw lead', 'Trance arpeggio', 'Rolling bass', 'Pad strings', 'Gated synth', 'Kick drum'],
    vox:   ['Female vocals', 'Ethereal vocals', 'No vocals', 'Vocal hook'],
    prod:  ['Long breakdown', 'Epic build', 'Wide stereo', 'Sidechain compression'],
    bpm:   ['136 BPM', '138 BPM', '140 BPM', '142 BPM'] }),
  f('dnb', 'Drum & Bass', 'Electronic', {
    genre: ['Drum and Bass', 'Liquid DnB', 'Jungle', 'Neurofunk', 'Jump-up'],
    mood:  ['Energetic', 'Dark', 'Rolling', 'Atmospheric', 'Intense'],
    instr: ['Breakbeat drums', 'Reese bass', 'Sub bass', 'Pads', 'Amen break', 'Piano stabs'],
    vox:   ['Female vocals', 'MC vocals', 'Vocal samples', 'No vocals'],
    prod:  ['Heavy bass', 'Fast breaks', 'Atmospheric intro', 'Punchy mix'],
    bpm:   ['170 BPM', '172 BPM', '174 BPM', '176 BPM'] }),
  f('dubstep', 'Dubstep / Bass', 'Electronic', {
    genre: ['Dubstep', 'Riddim', 'Brostep', 'Melodic Dubstep', 'Bass Music'],
    mood:  ['Aggressive', 'Heavy', 'Dark', 'Epic', 'Menacing'],
    instr: ['Wobble bass', 'Growl bass', 'Half-time drums', 'Sub bass', 'Snare hits', 'Synth lead'],
    vox:   ['Vocal chops', 'Female vocals', 'Screamed vocal sample', 'No vocals'],
    prod:  ['Massive drop', 'Bass-heavy mix', 'Build-up', 'Distortion'],
    bpm:   ['140 BPM', '145 BPM', '150 BPM'] }),

  // ── Urban ────────────────────────────────────────────────────────
  f('hiphop', 'Hip-Hop', 'Urban', {
    genre: ['Hip-Hop', 'Boom Bap', 'Conscious Hip-Hop', 'East Coast Hip-Hop', 'Old School Hip-Hop'],
    mood:  ['Confident', 'Gritty', 'Laid-back', 'Nostalgic', 'Reflective', 'Raw'],
    instr: ['Boom bap drums', 'Sample chops', 'Vinyl crackle', 'Upright bass', 'Rhodes piano', 'Scratches'],
    vox:   ['Rap vocals', 'Male rap', 'Female rap', 'Ad-libs', 'Sung hook'],
    prod:  ['Sample-based', 'Dusty drums', 'Lo-fi texture', 'Head-nod groove'],
    bpm:   ['85 BPM', '88 BPM', '90 BPM', '92 BPM', '95 BPM'] }),
  f('trap', 'Trap', 'Urban', {
    genre: ['Trap', 'Dark Trap', 'Melodic Trap', 'Trap Soul', 'Cloud Rap'],
    mood:  ['Dark', 'Menacing', 'Hypnotic', 'Moody', 'Aggressive', 'Icy'],
    instr: ['808 bass', 'Rapid hi-hats', 'Snare rolls', 'Dark piano', 'Bell melody', 'Synth pad'],
    vox:   ['Auto-tuned vocals', 'Rap vocals', 'Melodic rap', 'Ad-libs', 'Whispered rap'],
    prod:  ['Hard-hitting 808s', 'Sparse beat', 'Heavy bass', 'Atmospheric'],
    bpm:   ['130 BPM', '135 BPM', '140 BPM', '145 BPM', '150 BPM'] }),
  f('drill', 'Drill', 'Urban', {
    genre: ['Drill', 'UK Drill', 'NY Drill', 'Melodic Drill'],
    mood:  ['Menacing', 'Cold', 'Tense', 'Dark', 'Aggressive'],
    instr: ['Sliding 808s', 'Drill hi-hats', 'Dark strings', 'Piano melody', 'Snare crack', 'Bell melody'],
    vox:   ['Rap vocals', 'UK accent rap', 'Ad-libs', 'Deep male vocals'],
    prod:  ['Gliding bass', 'Sparse arrangement', 'Hard drums', 'Cinematic samples'],
    bpm:   ['138 BPM', '140 BPM', '142 BPM', '144 BPM'] }),
  f('phonk', 'Phonk', 'Urban', {
    genre: ['Phonk', 'Drift Phonk', 'Memphis Rap', 'Brazilian Phonk'],
    mood:  ['Dark', 'Aggressive', 'Hypnotic', 'Gritty', 'Night drive'],
    instr: ['Cowbell melody', 'Distorted 808', 'Memphis vocal sample', 'Lo-fi drums', 'Chopped bass', 'Synth lead'],
    vox:   ['Chopped vocal sample', 'Distorted rap', 'No vocals', 'Whispered vocals'],
    prod:  ['Heavy distortion', 'Lo-fi texture', 'Bass-boosted', 'Tape saturation'],
    bpm:   ['130 BPM', '140 BPM', '150 BPM', '160 BPM'] }),

  // ── Rock ─────────────────────────────────────────────────────────
  f('rock', 'Rock', 'Rock', {
    genre: ['Rock', 'Alternative Rock', 'Classic Rock', 'Indie Rock', 'Blues Rock', 'Arena Rock'],
    mood:  ['Energetic', 'Powerful', 'Raw', 'Rebellious', 'Anthemic', 'Driving'],
    instr: ['Electric guitar', 'Distorted guitar', 'Bass guitar', 'Live drums', 'Power chords', 'Guitar riff'],
    vox:   ['Male vocals', 'Raspy vocals', 'Powerful vocals', 'Female rock vocals', 'Gang vocals'],
    prod:  ['Raw production', 'Live band feel', 'Wall of sound', 'Big drums'],
    bpm:   ['100 BPM', '115 BPM', '125 BPM', '135 BPM', '145 BPM'] }),
  f('metal', 'Metal', 'Rock', {
    genre: ['Heavy Metal', 'Metalcore', 'Nu Metal', 'Thrash Metal', 'Melodic Metal', 'Power Metal'],
    mood:  ['Aggressive', 'Intense', 'Dark', 'Epic', 'Brutal', 'Furious'],
    instr: ['Down-tuned guitar', 'Double kick drums', 'Palm-muted riff', 'Guitar solo', 'Heavy bass', 'Blast beats'],
    vox:   ['Screamed vocals', 'Growled vocals', 'Clean and harsh vocals', 'Powerful male vocals'],
    prod:  ['Heavy distortion', 'Tight production', 'Wall of guitars', 'Punchy drums'],
    bpm:   ['120 BPM', '140 BPM', '160 BPM', '180 BPM', '200 BPM'] }),
  f('punk', 'Punk', 'Rock', {
    genre: ['Punk Rock', 'Pop Punk', 'Garage Rock', 'Skate Punk', 'Post-Punk'],
    mood:  ['Rebellious', 'Fast', 'Raw', 'Angry', 'Fun', 'Restless'],
    instr: ['Distorted guitar', 'Fast drums', 'Power chords', 'Bass guitar', 'Gang shouts', 'Palm-muted guitar'],
    vox:   ['Shouted vocals', 'Male vocals', 'Snotty vocals', 'Gang vocals'],
    prod:  ['Raw garage sound', 'Lo-fi punch', 'Live energy', 'Minimal production'],
    bpm:   ['150 BPM', '160 BPM', '170 BPM', '180 BPM'] }),

  // ── Soul & Funk ──────────────────────────────────────────────────
  f('rnb', 'R&B / Neo-Soul', 'Soul & Funk', {
    genre: ['R&B', 'Neo-Soul', 'Contemporary R&B', 'Alt R&B', 'Soul'],
    mood:  ['Soulful', 'Smooth', 'Sensual', 'Warm', 'Intimate', 'Passionate'],
    instr: ['Rhodes piano', 'Smooth bass', 'Wah guitar', 'Soft drums', 'Strings', 'Clavinet'],
    vox:   ['Soulful female vocals', 'Melismatic vocals', 'Vocal runs', 'Smooth male vocals', 'Stacked harmonies'],
    prod:  ['Warm analog mix', 'Silky production', 'Tight groove', 'Lush harmonies'],
    bpm:   ['68 BPM', '75 BPM', '85 BPM', '92 BPM', '100 BPM'] }),
  f('funk', 'Funk / Disco', 'Soul & Funk', {
    genre: ['Funk', 'Disco', 'Nu-Disco', 'Boogie', 'Funk Rock'],
    mood:  ['Groovy', 'Fun', 'Danceable', 'Glamorous', 'Playful', 'Feel-good'],
    instr: ['Slap bass', 'Funk guitar', 'Brass section', 'Clavinet', 'Disco strings', 'Tight drums'],
    vox:   ['Male vocals', 'Female vocals', 'Group vocals', 'Falsetto', 'Call and response'],
    prod:  ['Live band feel', 'Tight groove', 'Vintage mix', 'Horn hits'],
    bpm:   ['100 BPM', '108 BPM', '112 BPM', '118 BPM', '122 BPM'] }),
  f('gospel', 'Gospel', 'Soul & Funk', {
    genre: ['Gospel', 'Contemporary Gospel', 'Gospel Soul', 'Worship'],
    mood:  ['Uplifting', 'Spiritual', 'Joyful', 'Powerful', 'Hopeful', 'Triumphant'],
    instr: ['Hammond organ', 'Grand piano', 'Gospel choir', 'Live drums', 'Bass guitar', 'Handclaps'],
    vox:   ['Gospel choir', 'Powerful female lead', 'Call and response', 'Soulful male vocals'],
    prod:  ['Live church feel', 'Big choir', 'Dynamic build', 'Warm mix'],
    bpm:   ['70 BPM', '85 BPM', '100 BPM', '120 BPM'] }),

  // ── Jazz & Blues ─────────────────────────────────────────────────
  f('jazz', 'Jazz', 'Jazz & Blues', {
    genre: ['Jazz', 'Swing', 'Bebop', 'Smooth Jazz', 'Jazz Fusion', 'Cool Jazz'],
    mood:  ['Sophisticated', 'Smooth', 'Laid-back', 'Playful', 'Late-night', 'Elegant'],
    instr: ['Jazz piano', 'Double bass', 'Saxophone', 'Trumpet', 'Brushed drums', 'Vibraphone'],
    vox:   ['Jazz vocals', 'Scatting', 'Breathy female vocals', 'Crooner vocals', 'No vocals'],
    prod:  ['Live sound', 'Warm mix', 'Natural reverb', 'Small club feel'],
    bpm:   ['80 BPM', '100 BPM', '120 BPM', '140 BPM', '160 BPM'] }),
  f('blues', 'Blues', 'Jazz & Blues', {
    genre: ['Blues', 'Delta Blues', 'Chicago Blues', 'Blues Rock', 'Soul Blues'],
    mood:  ['Melancholic', 'Gritty', 'Soulful', 'Raw', 'Heartfelt', 'Slow-burning'],
    instr: ['Slide guitar', 'Harmonica', 'Electric guitar', 'Upright bass', 'Shuffle drums', 'Piano'],
    vox:   ['Raspy male vocals', 'Soulful female vocals', 'Growling vocals', 'Call and response'],
    prod:  ['Raw live sound', 'Vintage mix', 'Room reverb', 'Minimal production'],
    bpm:   ['60 BPM', '72 BPM', '85 BPM', '100 BPM'] }),

  // ── Acoustic ─────────────────────────────────────────────────────
  f('folk', 'Folk / Acoustic', 'Acoustic', {
    genre: ['Folk', 'Indie Folk', 'Acoustic', 'Folk Pop', 'Americana'],
    mood:  ['Warm', 'Intimate', 'Nostalgic', 'Storytelling', 'Heartfelt', 'Gentle'],
    instr: ['Acoustic guitar', 'Fingerpicking', 'Harmonica', 'Upright bass', 'Banjo', 'Mandolin'],
    vox:   ['Warm male vocals', 'Intimate female vocals', 'Gentle harmonies', 'Breathy vocals'],
    prod:  ['Natural sound', 'Minimal production', 'Room ambience', 'Sparse arrangement'],
    bpm:   ['70 BPM', '80 BPM', '90 BPM', '100 BPM'] }),
  f('country', 'Country', 'Acoustic', {
    genre: ['Country', 'Modern Country', 'Country Pop', 'Outlaw Country', 'Bluegrass'],
    mood:  ['Heartfelt', 'Nostalgic', 'Upbeat', 'Rowdy', 'Wistful', 'Honest'],
    instr: ['Acoustic guitar', 'Pedal steel', 'Fiddle', 'Banjo', 'Telecaster twang', 'Brushed drums'],
    vox:   ['Male vocals with twang', 'Female country vocals', 'Harmony vocals', 'Storytelling vocals'],
    prod:  ['Nashville production', 'Live band feel', 'Clean mix', 'Big chorus'],
    bpm:   ['80 BPM', '95 BPM', '110 BPM', '125 BPM'] }),
  f('singersongwriter', 'Singer-Songwriter', 'Acoustic', {
    genre: ['Singer-Songwriter', 'Acoustic Pop', 'Indie Acoustic', 'Coffeehouse'],
    mood:  ['Intimate', 'Vulnerable', 'Reflective', 'Tender', 'Honest', 'Bittersweet'],
    instr: ['Acoustic guitar', 'Piano', 'Light percussion', 'Cello', 'Soft strings', 'Ukulele'],
    vox:   ['Intimate male vocals', 'Soft female vocals', 'Whispered vocals', 'Close-mic vocals'],
    prod:  ['Minimal production', 'Bedroom recording', 'Natural reverb', 'Sparse'],
    bpm:   ['65 BPM', '72 BPM', '80 BPM', '90 BPM'] }),
  f('ballad', 'Ballad', 'Acoustic', {
    genre: ['Ballad', 'Power Ballad', 'Piano Ballad', 'Emotional Pop', 'Soft Rock'],
    mood:  ['Emotional', 'Heartfelt', 'Melancholic', 'Romantic', 'Vulnerable', 'Uplifting'],
    instr: ['Grand piano', 'String quartet', 'Cello', 'Acoustic guitar', 'Soft drums', 'Orchestral swell'],
    vox:   ['Powerful female vocals', 'Soulful male vocals', 'Falsetto', 'Belting vocals', 'Intimate vocals'],
    prod:  ['Slow build', 'Lush reverb', 'Cinematic swell', 'Dynamic range'],
    bpm:   ['60 BPM', '66 BPM', '72 BPM', '78 BPM', '85 BPM'] }),

  // ── Cinematic ────────────────────────────────────────────────────
  f('cinematic', 'Cinematic / Epic', 'Cinematic', {
    genre: ['Cinematic', 'Epic Orchestral', 'Film Score', 'Trailer Music', 'Neoclassical'],
    mood:  ['Epic', 'Dramatic', 'Triumphant', 'Mysterious', 'Haunting', 'Emotional'],
    instr: ['String section', 'Brass section', 'Choir', 'Timpani', 'Grand piano', 'Taiko drums'],
    vox:   ['No vocals', 'Choir', 'Soprano soloist', 'Wordless vocals'],
    prod:  ['Lush reverb', 'Big dynamics', 'Orchestral layering', 'Cinematic sound'],
    bpm:   ['60 BPM', '70 BPM', '80 BPM', '90 BPM', '110 BPM'] }),
  f('ambient', 'Ambient', 'Cinematic', {
    genre: ['Ambient', 'Drone', 'Ambient Electronic', 'Space Ambient', 'Meditation'],
    mood:  ['Calm', 'Ethereal', 'Meditative', 'Spacious', 'Peaceful', 'Otherworldly'],
    instr: ['Synth pads', 'Piano', 'Field recordings', 'Singing bowls', 'Soft strings', 'Granular textures'],
    vox:   ['No vocals', 'Wordless vocals', 'Whispered vocals', 'Ethereal female vocals'],
    prod:  ['Long reverb tails', 'Slow evolution', 'Wide stereo', 'Minimal'],
    bpm:   ['50 BPM', '60 BPM', '70 BPM'] }),

  // ── Chill ────────────────────────────────────────────────────────
  f('lofi', 'Lo-Fi / Chillhop', 'Chill', {
    genre: ['Lo-Fi Hip-Hop', 'Chillhop', 'Study Beats', 'Jazzhop', 'Downtempo'],
    mood:  ['Chill', 'Relaxed', 'Dreamy', 'Nostalgic', 'Mellow', 'Hazy'],
    instr: ['Rhodes piano', 'Vinyl crackle', 'Lazy drums', 'Jazz guitar', 'Warm bass', 'Muted trumpet'],
    vox:   ['No vocals', 'Vocal samples', 'Distant vocals', 'Whispered vocals'],
    prod:  ['Lo-fi texture', 'Tape saturation', 'Dusty sound', 'Sidechained pads'],
    bpm:   ['65 BPM', '70 BPM', '75 BPM', '80 BPM', '85 BPM'] }),
  f('chillwave', 'Chillwave / Tropical', 'Chill', {
    genre: ['Chillwave', 'Tropical House', 'Chill Pop', 'Summer Pop', 'Yacht Rock'],
    mood:  ['Sunny', 'Relaxed', 'Breezy', 'Dreamy', 'Feel-good', 'Warm'],
    instr: ['Marimba', 'Steel drums', 'Soft synth', 'Clean guitar', 'Flute lead', 'Light percussion'],
    vox:   ['Soft female vocals', 'Breathy male vocals', 'Vocal chops', 'Doubled vocals'],
    prod:  ['Summery mix', 'Warm reverb', 'Light sidechain', 'Airy production'],
    bpm:   ['95 BPM', '100 BPM', '105 BPM', '110 BPM'] }),

  // ── Israeli & Mediterranean ──────────────────────────────────────
  f('mizrahi', 'Mizrahi', 'Israeli & Mediterranean', {
    genre: ['Mizrahi', 'Israeli Mizrahi Pop', 'Mediterranean Pop', 'Mizrahi Ballad', 'Modern Mizrahi'],
    mood:  ['Emotional', 'Passionate', 'Festive', 'Nostalgic', 'Heartbroken', 'Celebratory'],
    instr: ['Oud', 'Darbuka', 'Buzuq', 'Violin', 'Qanun', 'Synth strings'],
    vox:   ['Soulful male vocals', 'Melismatic vocals', 'Emotional female vocals', 'Maqam singing', 'Vocal ornaments'],
    prod:  ['Ethnic fusion', 'Live ensemble', 'Modern Mizrahi production', 'Natural reverb'],
    bpm:   ['90 BPM', '100 BPM', '108 BPM', '118 BPM', '125 BPM'] }),
  f('israelirock', 'Israeli Rock', 'Israeli & Mediterranean', {
    genre: ['Israeli Rock', 'Israeli Pop Rock', 'Israeli Indie', 'Israeli Folk Rock'],
    mood:  ['Nostalgic', 'Heartfelt', 'Melancholic', 'Warm', 'Reflective', 'Anthemic'],
    instr: ['Acoustic guitar', 'Electric guitar', 'Piano', 'Live drums', 'Bass guitar', 'Strings'],
    vox:   ['Male vocals', 'Female vocals', 'Warm vocals', 'Harmony vocals', 'Storytelling vocals'],
    prod:  ['Live band feel', 'Warm mix', 'Classic Israeli production', 'Big chorus'],
    bpm:   ['85 BPM', '95 BPM', '110 BPM', '120 BPM'] }),
  f('jewish', 'Hasidic / Jewish', 'Israeli & Mediterranean', {
    genre: ['Hasidic Pop', 'Jewish Music', 'Klezmer', 'Israeli Religious Pop', 'Niggun'],
    mood:  ['Joyful', 'Spiritual', 'Uplifting', 'Celebratory', 'Soulful', 'Prayerful'],
    instr: ['Clarinet', 'Accordion', 'Violin', 'Keyboard', 'Brass section', 'Live drums'],
    vox:   ['Male vocals', 'Choir', 'Cantorial vocals', 'Group singing', 'Call and response'],
    prod:  ['Live wedding band', 'Big arrangement', 'Modern Hasidic production', 'Energetic mix'],
    bpm:   ['100 BPM', '115 BPM', '125 BPM', '135 BPM'] }),
  f('greek', 'Greek / Laika', 'Israeli & Mediterranean', {
    genre: ['Greek Pop', 'Laika', 'Rebetiko', 'Greek Folk', 'Modern Laika'],
    mood:  ['Passionate', 'Melancholic', 'Festive', 'Nostalgic', 'Dramatic'],
    instr: ['Bouzouki', 'Baglamas', 'Accordion', 'Violin', 'Guitar', 'Darbuka'],
    vox:   ['Soulful male vocals', 'Dramatic female vocals', 'Group vocals', 'Melismatic vocals'],
    prod:  ['Live ensemble', 'Taverna feel', 'Modern Greek production', 'Natural reverb'],
    bpm:   ['90 BPM', '100 BPM', '110 BPM', '120 BPM'] }),
  f('arabic', 'Arabic Pop', 'Israeli & Mediterranean', {
    genre: ['Arabic Pop', 'Khaliji', 'Egyptian Pop', 'Lebanese Pop', 'Arabic Dance'],
    mood:  ['Passionate', 'Festive', 'Romantic', 'Dramatic', 'Energetic'],
    instr: ['Oud', 'Qanun', 'Ney', 'Darbuka', 'Riq', 'String orchestra'],
    vox:   ['Melismatic female vocals', 'Powerful male vocals', 'Maqam singing', 'Vocal ornaments'],
    prod:  ['Orchestral Arabic arrangement', 'Modern Arabic pop production', 'Percussion-driven', 'Lush strings'],
    bpm:   ['95 BPM', '105 BPM', '115 BPM', '125 BPM'] }),
  f('turkish', 'Turkish Pop', 'Israeli & Mediterranean', {
    genre: ['Turkish Pop', 'Arabesk', 'Anatolian Rock', 'Turkish Folk Pop'],
    mood:  ['Melancholic', 'Passionate', 'Dramatic', 'Festive', 'Longing'],
    instr: ['Saz', 'Kanun', 'Darbuka', 'Clarinet', 'Strings', 'Electric guitar'],
    vox:   ['Emotional male vocals', 'Powerful female vocals', 'Melismatic vocals', 'Vocal ornaments'],
    prod:  ['Modern Turkish production', 'Lush strings', 'Percussion-driven', 'Warm mix'],
    bpm:   ['85 BPM', '95 BPM', '110 BPM', '120 BPM'] }),
  f('balkan', 'Balkan', 'Israeli & Mediterranean', {
    genre: ['Balkan Brass', 'Balkan Pop', 'Gypsy Brass', 'Balkan Folk', 'Turbo-folk'],
    mood:  ['Festive', 'Wild', 'Joyful', 'Frantic', 'Celebratory'],
    instr: ['Brass band', 'Tuba', 'Accordion', 'Clarinet', 'Snare drum', 'Violin'],
    vox:   ['Group vocals', 'Shouted vocals', 'Male vocals', 'Female vocals'],
    prod:  ['Live brass band', 'Raw energy', 'Fast tempo changes', 'Festival feel'],
    bpm:   ['120 BPM', '135 BPM', '150 BPM', '165 BPM'] }),

  // ── Latin & Caribbean ────────────────────────────────────────────
  f('reggaeton', 'Reggaeton', 'Latin & Caribbean', {
    genre: ['Reggaeton', 'Latin Trap', 'Urbano', 'Perreo', 'Dembow'],
    mood:  ['Sexy', 'Party', 'Confident', 'Sultry', 'Energetic'],
    instr: ['Dembow rhythm', '808 bass', 'Reggaeton hi-hats', 'Piano riff', 'Synth lead', 'Brass loops'],
    vox:   ['Spanish male vocals', 'Female vocals', 'Auto-tuned vocals', 'Rap flow', 'Ad-libs'],
    prod:  ['Dembow groove', 'Heavy bass', 'Club mix', 'Modern urbano production'],
    bpm:   ['88 BPM', '92 BPM', '95 BPM', '98 BPM'] }),
  f('latinpop', 'Latin Pop', 'Latin & Caribbean', {
    genre: ['Latin Pop', 'Bachata', 'Salsa', 'Cumbia', 'Latin Ballad'],
    mood:  ['Romantic', 'Passionate', 'Danceable', 'Festive', 'Sensual', 'Joyful'],
    instr: ['Nylon guitar', 'Congas', 'Brass section', 'Piano montuno', 'Bongos', 'Accordion'],
    vox:   ['Spanish male vocals', 'Passionate female vocals', 'Harmony vocals', 'Call and response'],
    prod:  ['Live Latin band', 'Percussion-rich', 'Warm mix', 'Big horns'],
    bpm:   ['95 BPM', '105 BPM', '120 BPM', '130 BPM'] }),
  f('reggae', 'Reggae / Dancehall', 'Latin & Caribbean', {
    genre: ['Reggae', 'Roots Reggae', 'Dancehall', 'Dub', 'Lovers Rock'],
    mood:  ['Laid-back', 'Sunny', 'Positive', 'Groovy', 'Conscious', 'Party'],
    instr: ['Skank guitar', 'One-drop drums', 'Dub bass', 'Organ bubble', 'Horn section', 'Melodica'],
    vox:   ['Patois vocals', 'Deejay toasting', 'Male vocals', 'Harmony vocals', 'Singjay'],
    prod:  ['Dub delay', 'Spring reverb', 'Riddim production', 'Sound system bass'],
    bpm:   ['70 BPM', '75 BPM', '85 BPM', '95 BPM'] }),
  f('bossa', 'Bossa Nova / Brazil', 'Latin & Caribbean', {
    genre: ['Bossa Nova', 'MPB', 'Samba', 'Brazilian Jazz', 'Tropicália'],
    mood:  ['Smooth', 'Romantic', 'Breezy', 'Sophisticated', 'Wistful', 'Sunny'],
    instr: ['Nylon guitar', 'Soft percussion', 'Piano', 'Flute', 'Upright bass', 'Cavaquinho'],
    vox:   ['Soft male vocals', 'Breathy female vocals', 'Portuguese vocals', 'Whispered vocals'],
    prod:  ['Intimate recording', 'Warm mix', 'Natural reverb', 'Minimal production'],
    bpm:   ['75 BPM', '85 BPM', '95 BPM', '110 BPM'] }),

  // ── World ────────────────────────────────────────────────────────
  f('afrobeats', 'Afrobeats', 'World', {
    genre: ['Afrobeats', 'Afropop', 'Afro-fusion', 'Alté', 'Afroswing'],
    mood:  ['Groovy', 'Sunny', 'Sensual', 'Feel-good', 'Danceable', 'Romantic'],
    instr: ['Log drum', 'Shakers', 'Afro percussion', 'Clean guitar', 'Synth chords', 'Talking drum'],
    vox:   ['Male vocals', 'Female vocals', 'Pidgin vocals', 'Layered harmonies', 'Ad-libs'],
    prod:  ['Bouncy groove', 'Warm mix', 'Percussion-rich', 'Laid-back production'],
    bpm:   ['98 BPM', '102 BPM', '105 BPM', '110 BPM'] }),
  f('amapiano', 'Amapiano', 'World', {
    genre: ['Amapiano', 'Private School Amapiano', 'Afro House', 'Gqom'],
    mood:  ['Groovy', 'Hypnotic', 'Late-night', 'Soulful', 'Laid-back'],
    instr: ['Log drum bass', 'Piano chords', 'Shakers', 'Soft pads', 'Percussion loops', 'Saxophone'],
    vox:   ['Soft female vocals', 'Chanted vocals', 'Vocal chops', 'No vocals'],
    prod:  ['Long groove', 'Deep bass', 'Spacious mix', 'Minimal production'],
    bpm:   ['110 BPM', '112 BPM', '114 BPM', '116 BPM'] }),
  f('flamenco', 'Flamenco / Spanish', 'World', {
    genre: ['Flamenco', 'Flamenco Pop', 'Rumba Flamenca', 'Spanish Guitar', 'Nuevo Flamenco'],
    mood:  ['Passionate', 'Fiery', 'Dramatic', 'Sensual', 'Melancholic'],
    instr: ['Flamenco guitar', 'Palmas handclaps', 'Cajón', 'Castanets', 'Nylon guitar', 'Violin'],
    vox:   ['Passionate male vocals', 'Cante flamenco', 'Female vocals', 'Group shouts'],
    prod:  ['Live acoustic', 'Natural reverb', 'Intimate recording', 'Percussive'],
    bpm:   ['90 BPM', '100 BPM', '115 BPM', '130 BPM'] }),
  f('bollywood', 'Bollywood / Indian', 'World', {
    genre: ['Bollywood', 'Indian Pop', 'Bhangra', 'Indian Fusion', 'Sufi Pop'],
    mood:  ['Festive', 'Romantic', 'Colorful', 'Dramatic', 'Energetic', 'Spiritual'],
    instr: ['Sitar', 'Tabla', 'Dhol', 'Bansuri flute', 'Harmonium', 'String orchestra'],
    vox:   ['Female Bollywood vocals', 'Male playback vocals', 'Melismatic vocals', 'Group chorus'],
    prod:  ['Big Bollywood production', 'Percussion-driven', 'Lush strings', 'Modern fusion'],
    bpm:   ['90 BPM', '105 BPM', '120 BPM', '135 BPM'] }),
  f('jpop', 'J-Pop / Anime', 'World', {
    genre: ['J-Pop', 'Anime Opening', 'J-Rock', 'City Pop', 'Japanese Pop'],
    mood:  ['Energetic', 'Bright', 'Emotional', 'Dramatic', 'Cute', 'Soaring'],
    instr: ['Bright synth', 'Electric guitar', 'Piano', 'Fast drums', 'Strings', 'Synth bass'],
    vox:   ['Female vocals', 'Male vocals', 'Group vocals', 'High-energy vocals'],
    prod:  ['Polished production', 'Key change', 'Big chorus', 'Dense arrangement'],
    bpm:   ['128 BPM', '140 BPM', '150 BPM', '165 BPM'] }),
];

export const genreById = id => GENRES.find(g => g.id === id) || null;
