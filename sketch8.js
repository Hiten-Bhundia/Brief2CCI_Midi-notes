let MidiData1;
let i = 0;
let increment = 1;
let loopCount = 1;

let toggleButton;
let isPlaying = true;

let scrubSlider;
let userScrubbing = false;

let nextButton, backButton;

// MIDI → Note name converter
function midiToNoteName(midi) {
  const notes = ["C", "C#", "D", "D#", "E", "F",
                 "F#", "G", "G#", "A", "A#", "B"];
  const note = notes[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return note + octave;
}

// Map note names to MIDI
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

// Convert groups to MIDI
harmonyGroups.forEach(groupObj => {
  groupObj.groups = groupObj.groups.map(g => g.map(n => NOTE_TO_MIDI[n]));
});

// Harmony checker
function getHarmonyGroup(n1, n2, n3) {
  const sortedNotes = [n1,n2,n3].sort((a,b)=>a-b);
  for (let groupObj of harmonyGroups) {
    for (let group of groupObj.groups) {
      const sortedGroup = [...group].sort((a,b)=>a-b);
      if (sortedNotes[0]===sortedGroup[0] &&
          sortedNotes[1]===sortedGroup[1] &&
          sortedNotes[2]===sortedGroup[2]) {
        return groupObj.name;
      }
    }
  }
  return "Not in Harmony";
}

function setup() {
  createCanvas(windowWidth, windowHeight - 150);
  textSize(20);

  // Load JSON properly
   //loadJSON("indvidualgroup.json", data => {
    loadJSON("jointtogether.json", data => {
    MidiData1 = data;
    scrubSlider.elt.max = MidiData1.length - 1;
    scrubSlider.elt.value = 0;
  });

  // Play / Pause button
  toggleButton = createButton("⏸");
  toggleButton.size(100, 40);
  toggleButton.mousePressed(togglePlay);

  // Scrub slider
  scrubSlider = createSlider(0, 1, 0, 1);
  scrubSlider.size(windowWidth * 0.8);

  scrubSlider.input(() => {
    if (MidiData1) {
      userScrubbing = true;
      i = int(scrubSlider.value());
    }
  });

  scrubSlider.mouseReleased(() => {
    userScrubbing = false;
  });

  // Frame Back & Forward
  backButton = createButton("◀");
  nextButton = createButton("▶");

  backButton.size(60, 40);
  nextButton.size(60, 40);

  backButton.mousePressed(() => {
    if (!MidiData1) return;
    i = max(0, i - 1);
    scrubSlider.value(i);
    userScrubbing = true;
  });

  nextButton.mousePressed(() => {
    if (!MidiData1) return;
    i = min(MidiData1.length - 1, i + 1);
    scrubSlider.value(i);
    userScrubbing = true;
  });

  positionUI();
}

function positionUI() {
  toggleButton.position((windowWidth - toggleButton.width) / 2, height + 20);

  scrubSlider.position((windowWidth - scrubSlider.width) / 2, height + 70);

  backButton.position(scrubSlider.x, height + 120);
  nextButton.position(scrubSlider.x + scrubSlider.width - nextButton.width, height + 120);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight - 150);
  scrubSlider.size(windowWidth * 0.8);
  positionUI();
}

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

function draw() {
  background(220);

  if (!MidiData1) {
    text("Loading JSON...", width/2 - 80, height/2);
    return;
  }

  // Auto-play scrolling
  if (isPlaying && !userScrubbing) {
    i += increment;
    if (i >= MidiData1.length) {
      i = 0;
      loopCount++;
    }
    scrubSlider.value(i);
  }

  const frame = MidiData1[i];
  const notes = [frame.midi.midi1, frame.midi.midi2, frame.midi.midi3];

  // Right side text
  textAlign(LEFT);
  text("P Note: " + midiToNoteName(notes[0]), width/2, height/3);
  text("G Note: " + midiToNoteName(notes[1]), width/2, height/3 + 50);
  text("R Note: " + midiToNoteName(notes[2]), width/2, height/3 + 100);

  const harmonyName = getHarmonyGroup(notes[0], notes[1], notes[2]);
  text("Harmony: " + harmonyName, width/2, height/3 + 150);

  // Left-side harmony circle
  fill(harmonyName === "Not in Harmony" ? 'red' : 'green');
  noStroke();
  circle(width/4, height/2, 300);

  // Info box (top center)
  const harmonyColor = (harmonyName === "Not in Harmony") ? 'red' : 'green';

  fill(255);
  rect(width/2 - 150, 20, 300, 140);

  fill(harmonyColor);
  textAlign(CENTER);
  text("Loop: " + loopCount, width/2, 50);
  text("Frame: " + i, width/2, 80);
  text("Timestamp:", width/2, 110);
  text(frame.timestamp, width/2, 135);
}
