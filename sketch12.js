
//memika was here
let MidiData1 = null; // detached1.json
let MidiData2 = null; // joint1.json
let currentData = null;

let i = 0;
let increment = 1;
let loopCount = 1;

let toggleButton;
let isPlaying = true;

let scrubSlider;
let userScrubbing = false;

let button1detached, button2detched, button1joint, button2joint;

// Harmony stats
let statsIndividual = null;
let statsJoint = null;

// MIDI → Note name converter
function midiToNoteName(midi) {
  const notes = ["C", "C#", "D", "D#", "E", "F",
                 "F#", "G", "G#", "A", "A#", "B"];
  return notes[midi % 12] + (Math.floor(midi / 12) - 1);
}

// Map note names to MIDI
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
  createCanvas(windowWidth, windowHeight - 100);
  textSize(20);

  // Slider
  scrubSlider = createSlider(0,1,0,1);
  scrubSlider.size(700);
  scrubSlider.position(300, 7);
  scrubSlider.input(()=>{ if(currentData){ userScrubbing=true; i=int(scrubSlider.value()); } });
  scrubSlider.mouseReleased(()=> userScrubbing=false);

  // Buttons
  button1detached = createButton("1D");
  button1detached.size(40,40);
  button1detached.position(750,850);
  button1detached.mousePressed(()=> switchDataset(1));

  button2detched = createButton("2D");
  button2detched.size(40,40);
  button2detched.position(750,850);
  button2detched.mousePressed(()=> switchDataset(1));


  button1joint = createButton("1");
  button1joint.size(40,40);
  button1joint.position(750,850);
  button1joint.mousePressed(()=> switchDataset(2));

  button2joint = createButton("2");
  button2joint.size(40,40);
  button2joint.position(750,850);
  button2joint.mousePressed(()=> switchDataset(2));

  // Play/pause
  toggleButton = createButton("⏸");
  toggleButton.size(100,40);
  toggleButton.mousePressed(togglePlay);

  positionUI();

  // Load both JSONs
  loadJSON("detached1.json", data=>{
    MidiData1=data;
    statsIndividual = computeHarmonyStats(MidiData1); // compute harmony stats
    console.log("deatched1 loaded");
    if(!currentData){ currentData=MidiData1; resetPlayback(); highlightActiveButton(); }
  });

    loadJSON("detached2.json", data=>{
    MidiData1=data;
    statsIndividual = computeHarmonyStats(MidiData1); // compute harmony stats
    console.log("deatched1 loaded");
    if(!currentData){ currentData=MidiData1; resetPlayback(); highlightActiveButton(); }
  });



  loadJSON("joint1.json", data=>{
    MidiData2=data;
    statsJoint = computeHarmonyStats(MidiData2); // compute harmony stats
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
  highlightActiveButton();
}

// --------------------
// HIGHLIGHT ACTIVE BUTTON
// --------------------
function highlightActiveButton(){
  if(currentData === MidiData1){
    button1detached.style("background-color","gold");
    button1detached.style("color","white");
    button1joint.style("background-color","lightgray");
    button1joint.style("color","black");
  } else {
    button1joint.style("background-color","gold");
    button1joint.style("color","white");
    button1detached.style("background-color","lightgray");
    button1detached.style("color","black");
  }
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
  toggleButton.position(width/2, height - 50);
  scrubSlider.position((windowWidth-scrubSlider.width)/2 + 40,height+20);
  button1detached.position(width/2- 175, height - 50);
  button1joint.position(width/2 + 150, height - 50);
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
  let textColor = (harmonyName === "Not in Harmony") ? 'red' : 'green';
  fill(textColor);
  textSize(20);
  text("P: "+midiToNoteName(n1), 800, 300);
  text("G: "+midiToNoteName(n2), 800, 350);
  text("R: "+midiToNoteName(n3), 800, 400);
  textSize(30);
  text("Harmony: "+harmonyName, 800, 450);

  // Left-side harmony circle
  fill(harmonyName==="Not in Harmony"?"red":"green");
  noStroke();
  circle(width/4,height/2,300);

  // Info box
  fill(255);
  textSize(20);
  rect(width/2-150,20,300,140);
  fill(harmonyName==="Not in Harmony"?"red":"green");
  textAlign(CENTER);
  text("Loop: "+loopCount,width/2,50);
  text("Frame: "+i,width/2,80);
  text("Timestamp:",width/2,110);
  text(frame.timestamp,width/2,135);

  // Draw pie chart of harmony stats
  if(currentData === MidiData1) drawHarmonyPie(width*0.8, height*0.5, 40, statsIndividual);
  else drawHarmonyPie(width*0.8, height*0.5, 40, statsJoint);
}

// --------------------
// COMPUTE HARMONY STATS
// --------------------
function computeHarmonyStats(data){
  if(!data) return {inHarmony:0, notInHarmony:0};
  let inHarmony=0;
  let notInHarmony=0;
  for(let frame of data){
    const n1=frame.midi.midi1;
    const n2=frame.midi.midi2;
    const n3=frame.midi.midi3;
    const harmony=getHarmonyGroup(n1,n2,n3);
    if(harmony === "Not in Harmony") notInHarmony++;
    else inHarmony++;
  }
  const total=inHarmony+notInHarmony;
  return {inHarmony: inHarmony/total, notInHarmony: notInHarmony/total};
}

// --------------------
// DRAW PIE CHART
// --------------------
function drawHarmonyPie(x, y, radius, stats){
  if(!stats) return;
  let startAngle = 0;

  // In Harmony slice
  fill('green');
  let inArc = stats.inHarmony * TWO_PI;
  arc(x, y, radius*2, radius*2, startAngle, startAngle+inArc);
  startAngle += inArc;

  // Not in Harmony slice
  fill('red');
  let notArc = stats.notInHarmony * TWO_PI;
  arc(x, y, radius*2, radius*2, startAngle, startAngle+notArc);

  // // Results label
  // fill(0);
  // textSize(14);
  // fill(0);
  // text("RESULTS:", 1435, 350);


  // label for smaller pie chart to show the harmoy percentages
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(14);
  fill('green');
  text(Math.round(stats.inHarmony*100) + "% In harmony", x, y+55);
  fill('red');
  text(Math.round(stats.notInHarmony*100) + "% Not in Harmony", x, y-55);
}




// Now need 6 buttons for 6 data sets of JSON. 
// button1detached liked to "detached1.json" 
// button2detached linked to "detached2.json" 
// button3detached linked to "detached3.json" 
// button1joint linked to "joint1.json"
// button2joint linked to "joint2.json"
// button3joint linked to "joint3.json"

// the switch data set needs to be updated to swap between all 6 jsons. 
// The hilight active button needs to be uopdated. All 6 buttons should line up above the scroll bar.
// Also there should be six TIMELINE BARs that display over eachother