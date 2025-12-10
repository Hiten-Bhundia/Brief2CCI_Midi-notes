let MidiData1;
let i = 0;
let increment = 1; 
let loop = 1;

// MIDI → Note name converter (optional, for display)
function midiToNoteName(midi) {
  const notes = ["C", "C#", "D", "D#", "E", "F", 
                 "F#", "G", "G#", "A", "A#", "B"];
  const note = notes[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return note + octave;
}

// Map note names to MIDI for harmony groups
const NOTE_TO_MIDI = {
  "C4":60,"C5":72,"D4":62,"E4":64,"F4":65,
  "G4":67,"A4":69,"B4":71
};

// Harmony groups (all as MIDI numbers)
const harmonyGroups = [
  // Triads
  ["C4","E4","G4"], ["D4","F4","A4"], ["E4","G4","B4"],
  ["F4","A4","C5"], ["G4","B4","D4"], ["A4","C4","E4"], ["B4","D4","F4"],
  // Stepwise Triplets
  ["C4","D4","E4"], ["D4","E4","F4"], ["E4","F4","G4"],
  ["F4","G4","A4"], ["G4","A4","B4"], ["A4","B4","C5"], ["B4","C5","C4"],
  // Octave + Fifth
  ["C4","G4","C5"], ["D4","A4","D4"], ["E4","B4","E4"],
  ["F4","C5","F4"], ["G4","D4","G4"], ["A4","E4","A4"], ["B4","F4","B4"],
  // Unisons
  ["C4","C4","C4"], ["D4","D4","D4"], ["E4","E4","E4"],
  ["F4","F4","F4"], ["G4","G4","G4"], ["A4","A4","A4"], ["B4","B4","B4"]
].map(group => group.map(n => NOTE_TO_MIDI[n]));

// Check if three MIDI notes are in harmony
function inHarmony(n1, n2, n3) {
  const sorted = [n1,n2,n3].sort((a,b)=>a-b);
  return harmonyGroups.some(group => {
    const g = [...group].sort((a,b)=>a-b);
    return g[0]===sorted[0] && g[1]===sorted[1] && g[2]===sorted[2];
  });
}

// Load JSON (works in your setup)
async function setup() {
  createCanvas(600, 600);
  textSize(20);
  MidiData1 = await loadJSON("Midi-data1.json");
  console.log("Frames loaded:", MidiData1.length);
  background(220);
}

function draw() {
  if (!MidiData1 || !MidiData1.length) {
    background(200,0,0);
    text("NO DATA LOADED", 200,300);
    return;
  }

  if (frameCount % increment === 0) {
    background(220);

    const frame = MidiData1[i];
    const notes = [frame.midi.midi1, frame.midi.midi2, frame.midi.midi3];

    // Display MIDI note names
    text("Midi1 ["+i+"]: "+midiToNoteName(notes[0]), 300, 300);
    text("Midi2 ["+i+"]: "+midiToNoteName(notes[1]), 300, 400);
    text("Midi3 ["+i+"]: "+midiToNoteName(notes[2]), 300, 500);

    // Harmony circle
    if (inHarmony(notes[0], notes[1], notes[2])) {
      fill('green');
    } else {
      fill('red');
    }
    noStroke();
    circle(150, 150, 80);

    // Next frame
    i += increment;
    if (i >= MidiData1.length) {
      i = 0;
      loop++;
    }

    // Loop counter
    text("Loop: " + loop, 300, 150);
  }
}
