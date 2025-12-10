let MidiData1 = null; // individualgroup.json
let MidiData2 = null; // jointtogether.json
let currentData = null;

let i = 0;
let increment = 1;
let loopCount = 1;

let toggleButton;
let isPlaying = true;

let scrubSlider;
let userScrubbing = false;

let buttonIndividual, buttonJoint;

// MIDI → Note name converter
function midiToNoteName(midi) {
  const notes = ["C", "C#", "D", "D#", "E", "F",
                 "F#", "G", "G#", "A", "A#", "B"];
  return notes[midi % 12] + (Math.floor(midi / 12) - 1);
}

// Map note names to MIDI for harmony groups
const NOTE_TO_MIDI = { "C4":60,"C5":72,"D4":62,"E4":64,"F4":65,
                       "G4":67,"A4":69,"B4":71 };

// Harmony groups
const harmonyGroups = [
  { name: "Triads", groups: [["C4","E4","G4"], ["D4","F4","A4"], ["E4","G4","B4"], ["F4","A4","C5"], ["G4","B4","D4"], ["A4","C4","E4"], ["B4","D4","F4"]] },
  { name: "Stepwise Triplets", groups: [["C4","D4","E4"], ["D4","E4","F4"], ["E4","F4","G4"], ["F4","G4","A4"], ["G4","A4","B4"], ["A4","B4","C5"], ["B4","C5","C4"]] },
  { name: "Octave + Fifth", groups: [["C4","G4","C5"], ["D4","A4","D4"], ["E4","B4","E4"], ["F4","C5","F4"], ["G4","D4","G4"], ["A4","E4","A4"], ["B4","F4","B4"]] },
  { name: "Unisons", groups: [["C4","C4","C4"], ["D4","D4","D4"], ["E4","E4","E4"], ["F4","F4","F4"], ["G4","G4","G4"], ["A4","A4","A4"], ["B4","B4","B4"]] }
];

// Convert names to MIDI
harmonyGroups.forEach(g => g.groups = g.groups.map(gr => gr.map(n => NOTE_TO_MIDI[n])));

// Get harmony group for three notes
function getHarmonyGroup(n1,n2,n3){
  const sorted=[n1,n2,n3].sort((a,b)=>a-b);
  for(let g of harmonyGroups){
    for(let grp of g.groups){
      if(sorted.join("")===[...grp].sort((a,b)=>a-b).join("")) return g.name;
    }
  }
  return "Not in Harmony";
}

// --------------------
// SETUP
// --------------------
function setup() {
  createCanvas(windowWidth, windowHeight - 150);
  textSize(20);

  // Slider
  scrubSlider = createSlider(0,1,0,1);
  scrubSlider.size(windowWidth*0.8);
  scrubSlider.input(()=>{ if(currentData){ userScrubbing=true; i=int(scrubSlider.value()); } });
  scrubSlider.mouseReleased(()=> userScrubbing=false);

  // Buttons
  buttonIndividual = createButton("DETACHED");
  buttonJoint = createButton("CONJOINT");
  buttonIndividual.size(120,40);
  buttonJoint.size(120,40);
  buttonIndividual.mousePressed(()=> switchDataset(1));
  buttonJoint.mousePressed(()=> switchDataset(2));

  // Play/pause
  toggleButton = createButton("⏸");
  toggleButton.size(100,40);
  toggleButton.mousePressed(togglePlay);

  positionUI();

  // Load both JSONs
  loadJSON("individualgroup.json", data=>{
    MidiData1=data;
    console.log("Individual loaded");
    if(!currentData){ currentData=MidiData1; resetPlayback(); }
  });
  loadJSON("jointtogether.json", data=>{
    MidiData2=data;
    console.log("Joint loaded");
  });
}

// --------------------
// SWITCH DATASET
// --------------------
function switchDataset(which){
  if(which===1 && MidiData1) currentData=MidiData1;
  else if(which===2 && MidiData2) currentData=MidiData2;
  else { console.log("Dataset not loaded yet"); return; }

  resetPlayback();
  console.log("Switched dataset →", which===1?"Individual":"Joint");
}

// --------------------
// RESET PLAYBACK
// --------------------
function resetPlayback(){
  i=0;
  loopCount=1;
  if(currentData){ scrubSlider.elt.max=currentData.length-1; scrubSlider.value(0); }
}

// --------------------
// POSITION UI
// --------------------
function positionUI(){
  toggleButton.position((windowWidth-toggleButton.width)/2,height+90);
  scrubSlider.position((windowWidth-scrubSlider.width)/2,height+20);
  buttonIndividual.position(width/2-200,height+90);
  buttonJoint.position(width/2+85,height+90);
}

//making the button light up when pressed so we know which json is being read

function switchDataset(which){
  if(which === 1 && MidiData1) currentData = MidiData1;
  else if(which === 2 && MidiData2) currentData = MidiData2;
  else { console.log("Dataset not loaded yet"); return; }

  resetPlayback();
  console.log("Switched dataset →", which === 1 ? "Individual" : "Joint");

  // Highlight the active button
  if(currentData === MidiData1){
    buttonIndividual.style("background-color","gold");
    buttonIndividual.style("color","white");
    buttonJoint.style("background-color","lightgray");
    buttonJoint.style("color","black");
  } else {
    buttonJoint.style("background-color","gold");
    buttonJoint.style("color","white");
    buttonIndividual.style("background-color","lightgray");
    buttonIndividual.style("color","black");
  }
}


function windowResized(){
  resizeCanvas(windowWidth, windowHeight-150);
  scrubSlider.size(windowWidth*0.8);
  positionUI();
}

// --------------------
// PLAY/PAUSE
// --------------------
function togglePlay(){
  if(isPlaying){ noLoop(); toggleButton.html("▶"); isPlaying=false; }
  else { loop(); toggleButton.html("⏸"); isPlaying=true; }
}

// --------------------
// DRAW LOOP
// --------------------
function draw(){
  background(220);

  if(!currentData){ textAlign(CENTER,CENTER); text("Loading JSON...",width/2,height/2); return; }

  if(isPlaying && !userScrubbing){
    i+=increment;
    if(i>=currentData.length){ i=0; loopCount++; }
    scrubSlider.value(i);
  }

  const frame=currentData[i];
  const n1=frame.midi.midi1;
  const n2=frame.midi.midi2;
  const n3=frame.midi.midi3;

  const harmonyName=getHarmonyGroup(n1,n2,n3);

  // Right-side text
  textAlign(LEFT);
  text("P: "+midiToNoteName(n1), width/2, height/3);
  text("G: "+midiToNoteName(n2), width/2, height/3+50);
  text("R: "+midiToNoteName(n3), width/2, height/3+100);
  text("Harmony: "+harmonyName, width/2, height/3+150);

  // Left-side harmony circle
  fill(harmonyName==="Not in Harmony"?"red":"green");
  noStroke();
  circle(width/4,height/2,300);

  // Info box
  fill(255);
  rect(width/2-150,20,300,140);
  fill(harmonyName==="Not in Harmony"?"red":"green");
  textAlign(CENTER);
  text("Loop: "+loopCount,width/2,50);
  text("Frame: "+i,width/2,80);
  text("Timestamp:",width/2,110);
  text(frame.timestamp,width/2,135);
}
