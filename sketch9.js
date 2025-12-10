let MidiData1;
let jsonIndividual = null;
let jsonJoint = null;

let i = 0;
let increment = 1;
let loopCount = 1;

let toggleButton;
let isPlaying = true;

let scrubSlider;
let userScrubbing = false;

let sourceButton1, sourceButton2;

// MIDI → Note name
function midiToNoteName(midi) {
  const notes = ["C", "C#", "D", "D#", "E", "F",
                 "F#", "G", "G#", "A", "A#", "B"];
  return notes[midi % 12] + (Math.floor(midi / 12) - 1);
}

// Note names to MIDI map
const NOTE_TO_MIDI = {
  "C4":60,"C5":72,"D4":62,"E4":64,"F4":65,
  "G4":67,"A4":69,"B4":71
};

// Harmony groups
const harmonyGroups = [
  { name: "Triads", groups: [["C4","E4","G4"], ["D4","F4","A4"], ["E4","G4","B4"], ["F4","A4","C5"], ["G4","B4","D4"], ["A4","C4","E4"], ["B4","D4","F4"]] },
  { name: "Stepwise Triplets", groups: [["C4","D4","E4"], ["D4","E4","F4"], ["E4","F4","G4"], ["F4","G4","A4"], ["G4","A4","B4"], ["A4","B4","C5"], ["B4","C5","C4"]] },
  { name: "Octave + Fifth", groups: [["C4","G4","C5"], ["D4","A4","D4"], ["E4","B4","E4"], ["F4","C5","F4"], ["G4","D4","G4"], ["A4","E4","A4"], ["B4","F4","B4"]] },
  { name: "Unisons", groups: [["C4","C4","C4"], ["D4","D4","D4"], ["E4","E4","E4"], ["F4","F4","F4"], ["G4","G4","G4"], ["A4","A4","A4"], ["B4","B4","B4"]] }
];

// Convert group names to MIDI
harmonyGroups.forEach(groupObj => {
  groupObj.groups = groupObj.groups.map(g => g.map(n => NOTE_TO_MIDI[n]));
});

// Identify harmony type
function getHarmonyGroup(n1, n2, n3) {
  const sorted = [n1,n2,n3].sort((a,b)=>a-b);
  for (let obj of harmonyGroups) {
    for (let g of obj.groups) {
      const sortedGroup = [...g].sort((a,b)=>a-b);
      if (sorted.join("") === sortedGroup.join("")) return obj.name;
    }
  }
  return "Not in Harmony";
}






// ------------------------------
// SETUP
// ------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight - 150);
  textSize(20);

  // Slider
  scrubSlider = createSlider(0, 1, 0, 1);
  scrubSlider.size(windowWidth * 0.8);
  scrubSlider.input(() => {
    if (MidiData1) {
      userScrubbing = true;
      i = int(scrubSlider.value());
    }
  });
  scrubSlider.mouseReleased(() => userScrubbing = false);

  // Dataset buttons
  sourceButton1 = createButton("Individual");
  sourceButton2 = createButton("Joint");
  sourceButton1.size(120, 40);
  sourceButton2.size(120, 40);
  sourceButton1.mousePressed(() => switchJSON(1));
  sourceButton2.mousePressed(() => switchJSON(2));

  // Play/Pause button
  toggleButton = createButton("⏸");
  toggleButton.size(250, 40);
  toggleButton.mousePressed(togglePlay);

  positionUI();

  // Load both JSONs first
  loadJSON("individualgroup.json", data => {
    jsonIndividual = data;
    console.log("Individual JSON loaded");

    // Once both are loaded, set default
    if (jsonJoint) initDefaultDataset();
  });

  loadJSON("jointtogether.json", data => {
    jsonJoint = data;
    console.log("Joint JSON loaded");

    // Once both are loaded, set default
    if (jsonIndividual) initDefaultDataset();
  });
}

// Set default dataset after both JSONs are loaded
function initDefaultDataset() {
  MidiData1 = jsonIndividual;
  i = 0;
  loopCount = 1;
  scrubSlider.elt.max = MidiData1.length - 1;
  scrubSlider.value(0);
  console.log("Default dataset: Individual loaded");
}

// ------------------------------
// SWITCH BETWEEN JSON DATASETS
// ------------------------------
function switchJSON(which) {
  if (which === 1 && jsonIndividual) {
    MidiData1 = jsonIndividual;
  }
  if (which === 2 && jsonJoint) {
    MidiData1 = jsonJoint;
  }

  // Reset playback
  i = 0;
  loopCount = 1;

  if (MidiData1) {
    scrubSlider.elt.max = MidiData1.length - 1;
    scrubSlider.value(0);
  }

  console.log("Switched dataset →", which === 1 ? "Individual" : "Joint");
}

// ------------------------------
// UI POSITIONING
// ------------------------------
function positionUI() {
  toggleButton.position((windowWidth - toggleButton.width) / 2, height + 20);
  scrubSlider.position((windowWidth - scrubSlider.width) / 2, height + 70);
  sourceButton1.position(width/2 - 130, height + 120);
  sourceButton2.position(width/2 + 10, height + 120);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight - 150);
  scrubSlider.size(windowWidth * 0.8);
  positionUI();
}

// ------------------------------
// PLAY/PAUSE
// ------------------------------
function togglePlay() {
  if (isPlaying) {
    noLoop();
    toggleButton.html("▶");
    isPlaying = false;
  } else {
    loop();
    toggleButton.html("⏸");
    isPlaying = true;
  }
}

// ------------------------------
// DRAW LOOP
// ------------------------------
function draw() {
  background(220);

  if (!MidiData1) {
    textAlign(CENTER, CENTER);
    text("Loading JSON...", width / 2, height / 2);
    return;
  }

  // Auto-play
  if (isPlaying && !userScrubbing) {
    i += increment;
    if (i >= MidiData1.length) {
      i = 0;
      loopCount++;
    }
    scrubSlider.value(i);
  }

  const frame = MidiData1[i];
  const n1 = frame.midi.midi1;
  const n2 = frame.midi.midi2;
  const n3 = frame.midi.midi3;

  const harmonyName = getHarmonyGroup(n1, n2, n3);

  // Right-side text
  textAlign(LEFT);
  text("P: " + midiToNoteName(n1), width/2, height/3);
  text("G: " + midiToNoteName(n2), width/2, height/3 + 50);
  text("R: " + midiToNoteName(n3), width/2, height/3 + 100);
  text("Harmony: " + harmonyName, width/2, height/3 + 150);

  // Left-side harmony circle
  fill(harmonyName === "Not in Harmony" ? "red" : "green");
  noStroke();
  circle(width/4, height/2, 300);

  // Info box
  fill(255);
  rect(width/2 - 150, 20, 300, 140);

  fill(harmonyName === "Not in Harmony" ? "red" : "green");
  textAlign(CENTER);
  text("Loop: " + loopCount, width/2, 50);
  text("Frame: " + i, width/2, 80);
  text("Timestamp:", width/2, 110);
  text(frame.timestamp, width/2, 135);
}
