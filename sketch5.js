let MidiData1;
let i = 0;
let increment = 1; 
let loopCount = 1;

let toggleButton;
let isPlaying = true; // start in playing state

// MIDI → Note name converter
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

// Load JSON
async function setup() {
  createCanvas(windowWidth, windowHeight); // leave space for button
  textSize(20);
  MidiData1 = await loadJSON("Midi-data1.json");
  console.log("Frames loaded:", MidiData1.length);
  background(220);

  // Create toggle button below canvas and center it
  toggleButton = createButton('⏸');
  toggleButton.size(100, 40);
  positionToggleButton();
  toggleButton.mousePressed(togglePlay);
}

function togglePlay() {
  if (isPlaying) {
    noLoop();
    toggleButton.html('▶'); // show play icon
    isPlaying = false;
  } else {
    loop();
    toggleButton.html('⏸'); // show pause icon
    isPlaying = true;
  }
}

// Helper to center the toggle button horizontally below canvas
function positionToggleButton() {
  toggleButton.position((windowWidth - toggleButton.width)/2, height + 20);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight - 100);
  positionToggleButton();
}

function draw() {
  if (!MidiData1 || !MidiData1.length) {
    background(200,0,0);
    text("NO DATA LOADED", width/2 - 80, height/2);
    return;
  }

  if (frameCount % increment === 0) {
    background(220);

    const frame = MidiData1[i];
    const notes = [frame.midi.midi1, frame.midi.midi2, frame.midi.midi3];

    // Display MIDI note names on the right
    textAlign(LEFT);
    text("Midi1 ["+i+"]: "+midiToNoteName(notes[0]), width/2, height/3);
    text("Midi2 ["+i+"]: "+midiToNoteName(notes[1]), width/2, height/3 + 50);
    text("Midi3 ["+i+"]: "+midiToNoteName(notes[2]), width/2, height/3 + 100);

    // Harmony circle on the left
    const circleX = width/4;
    const circleY = height/2;
    fill(inHarmony(notes[0], notes[1], notes[2]) ? 'green' : 'red');
    noStroke();
    circle(circleX, circleY, 100);

    // Next frame
    i += increment;
    if (i >= MidiData1.length) {
      i = 0;
      loopCount++;
    }

    // Loop counter display
    textAlign(CENTER);
    text("Loop: " + loopCount, width/2, 50);
  }
}
