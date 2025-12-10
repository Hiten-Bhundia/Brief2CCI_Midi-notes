let MidiData1;
let i = 0;
let increment = 1; 
let loop = 1;

// Convert MIDI number → Note name (C4, G#3, etc.)
function midiToNoteName(midi) {
  const notes = ["C", "C#", "D", "D#", "E", "F", 
                 "F#", "G", "G#", "A", "A#", "B"];
  const note = notes[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return note + octave;
}

async function setup() {
  createCanvas(600, 600);
  textSize(20);

  MidiData1 = await loadJSON("Midi-data1.json");

  console.log("Frames loaded:", MidiData1.length);
  background(220);
}

function draw() {
  if (!MidiData1 || !MidiData1.length) {
    background(200, 0, 0);
    text("NO DATA LOADED", 200, 300);
    return;
  }

  if (frameCount % increment === 0) {

    background(220);

    text(loop + " > " + i, 300, 150);

    const frame = MidiData1[i];

    // Display NOTE NAMES instead of MIDI numbers
    text("Midi1 [" + i + "]: " + midiToNoteName(frame.midi.midi1), 300, 300);
    text("Midi2 [" + i + "]: " + midiToNoteName(frame.midi.midi2), 300, 400);
    text("Midi3 [" + i + "]: " + midiToNoteName(frame.midi.midi3), 300, 500);

    i += increment;

    if (i >= MidiData1.length) {
      i = 0;
      loop++;
    }
  }
}
