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

// Harmony groups with names
const harmonyGroups = [
  { name: "Triads", groups: [["C4","E4","G4"], ["D4","F4","A4"], ["E4","G4","B4"], ["F4","A4","C5"], ["G4","B4","D4"], ["A4","C4","E4"], ["B4","D4","F4"]] },
  { name: "Stepwise Triplets", groups: [["C4","D4","E4"], ["D4","E4","F4"], ["E4","F4","G4"], ["F4","G4","A4"], ["G4","A4","B4"], ["A4","B4","C5"], ["B4","C5","C4"]] },
  { name: "Octave + Fifth", groups: [["C4","G4","C5"], ["D4","A4","D4"], ["E4","B4","E4"], ["F4","C5","F4"], ["G4","D4","G4"], ["A4","E4","A4"], ["B4","F4","B4"]] },
  { name: "Unisons", groups: [["C4","C4","C4"], ["D4","D4","D4"], ["E4","E4","E4"], ["F4","F4","F4"], ["G4","G4","G4"], ["A4","A4","A4"], ["B4","B4","B4"]] }
];

// Convert group note names to MIDI
harmonyGroups.forEach(groupObj => {
  groupObj.groups = groupObj.groups.map(g => g.map(n => NOTE_TO_MIDI[n]));
});

// Check which harmony group the notes belong to
function getHarmonyGroup(n1, n2, n3) {
  const sortedNotes = [n1,n2,n3].sort((a,b)=>a-b);
  for (let groupObj of harmonyGroups) {
    for (let group of groupObj.groups) {
      const sortedGroup = [...group].sort((a,b)=>a-b);
      if (sortedNotes[0]===sortedGroup[0] && sortedNotes[1]===sortedGroup[1] && sortedNotes[2]===sortedGroup[2]) {
        return groupObj.name;
      }
    }
  }
  return "Not in Harmony";
}

// Load JSON
async function setup() {
  createCanvas(windowWidth, windowHeight - 100);
  textSize(20);
  MidiData1 = await loadJSON("Midi-data1.json");
  console.log("Frames loaded:", MidiData1);
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
    text("P Note: "+midiToNoteName(notes[0]), width/2, height/3);
    text("G Note: "+midiToNoteName(notes[1]), width/2, height/3 + 50);
    text("R Note: "+midiToNoteName(notes[2]), width/2, height/3 + 100);

    // Display Harmony group under MIDI3
    const harmonyName = getHarmonyGroup(notes[0], notes[1], notes[2]);
    text("Harmony: " + harmonyName, width/2, height/3 + 150);

    // Harmony circle on the left
    const circleX = width/4;
    const circleY = height/2;
    fill(harmonyName === "Not in Harmony" ? 'red' : 'green');
    noStroke();
    circle(circleX, circleY, 300);

    // Next frame
    i += increment;
    if (i >= MidiData1.length) {
      i = 0;
      loopCount++;
    }

// Determine harmony color
const harmonyColor = (harmonyName === "Not in Harmony") ? 'red' : 'green';

// Loop counter and timestamp display
textAlign(CENTER);
textSize(22);

// Background box for better readability
fill(255);
noStroke();
rect(width/2 - 150, 20, 300, 140); // slightly taller for harmony name

// Draw text with harmony color
fill(harmonyColor);
textSize(20);
text("Loop: " + loopCount, width/2, 50);
text("Frame: " + i, width/2, 80);
text("Timestamp:", width/2, 110);
text(MidiData1[i].timestamp, width/2, 135);

  }
}
