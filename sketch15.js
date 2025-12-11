// ------------------------------------------------------------
// 4-Dataset Harmony Visualiser + Stacked Timelines
// ------------------------------------------------------------

// Data sets
let Detached1 = null, Detached2 = null, Joint1 = null, Joint2 = null;
let currentData = null;
let activeDataset = null; // controls which timeline marker moves

// Playback state
let i = 0;
let increment = 1;
let loopCount = 1;
let isPlaying = true;
let userScrubbing = false;

// UI elements
let toggleButton;
let scrubSlider;
let button1detached, button2detached, button1joint, button2joint;

// Harmony stats
let statsD1 = null, statsD2 = null, statsJ1 = null, statsJ2 = null;

// Timeline arrays
let timelineD1 = null, timelineD2 = null, timelineJ1 = null, timelineJ2 = null;

// Timeline vertical positions
let timelineY = {
  d1: 150,
  d2: 200,
  j1: 250,
  j2: 300
};

// MIDI → note name
function midiToNoteName(midi) {
  const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  return notes[midi % 12] + (Math.floor(midi / 12) - 1);
}

// Note → MIDI map
const NOTE_TO_MIDI = { "C4":60,"C5":72,"D4":62,"E4":64,"F4":65,"G4":67,"A4":69,"B4":71 };

// Harmony groups
const harmonyGroups = [
  { name:"Triads", groups: [["C4","E4","G4"],["D4","F4","A4"],["E4","G4","B4"],["F4","A4","C5"],["G4","B4","D4"],["A4","C4","E4"],["B4","D4","F4"]] },
  { name:"Stepwise Triplets", groups: [["C4","D4","E4"],["D4","E4","F4"],["E4","F4","G4"],["F4","G4","A4"],["G4","A4","B4"],["A4","B4","C5"],["B4","C5","C4"]] },
  { name:"Octave+Fifth", groups: [["C4","G4","C5"],["D4","A4","D4"],["E4","B4","E4"],["F4","C5","F4"],["G4","D4","G4"],["A4","E4","A4"],["B4","F4","B4"]] },
  { name:"Unisons", groups: [["C4","C4","C4"],["D4","D4","D4"],["E4","E4","E4"],["F4","F4","F4"],["G4","G4","G4"],["A4","A4","A4"],["B4","B4","B4"]] }
];

// Convert names to MIDI
harmonyGroups.forEach(g => g.groups = g.groups.map(gr => gr.map(n => NOTE_TO_MIDI[n])));

// Determine harmony group
function getHarmonyGroup(n1,n2,n3) {
  const sorted=[n1,n2,n3].sort((a,b)=>a-b);
  for (let g of harmonyGroups) {
    for (let grp of g.groups) {
      if (sorted.join("") === [...grp].sort((a,b)=>a-b).join("")) return g.name;
    }
  }
  return "Not in Harmony";
}

// ------------------------------------------------------------
// SETUP
// ------------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight - 100);
  textSize(20);

  // Slider
  scrubSlider = createSlider(0,1,0,1);
  scrubSlider.size(800);
  scrubSlider.input(()=>{ if(currentData){ userScrubbing=true; i=int(scrubSlider.value()); } });
  scrubSlider.mouseReleased(()=> userScrubbing=false);

  // Buttons
  button1detached = createButton("1D"); button1detached.size(50,50);
  button2detached = createButton("2D"); button2detached.size(50,50);
  button1joint = createButton("1J"); button1joint.size(50,50);
  button2joint = createButton("2J"); button2joint.size(50,50);

  button1detached.mousePressed(()=> activateDataset("d1"));
  button2detached.mousePressed(()=> activateDataset("d2"));
  button1joint.mousePressed(()=> activateDataset("j1"));
  button2joint.mousePressed(()=> activateDataset("j2"));

  // Play / Pause
  toggleButton = createButton("⏸");
  toggleButton.size(80,40);
  toggleButton.mousePressed(togglePlay);

  positionUI();

  // Load JSONs
  loadJSON("detached1.json", d => {
    Detached1 = d; statsD1 = computeHarmonyStats(d); timelineD1 = computeTimeline(d);
    if(!currentData){ currentData=Detached1; activeDataset="d1"; resetPlayback(); highlightActiveButton(); }
  });
  loadJSON("detached2.json", d => { Detached2=d; statsD2=computeHarmonyStats(d); timelineD2=computeTimeline(d); });
  loadJSON("joint1.json", d => { Joint1=d; statsJ1=computeHarmonyStats(d); timelineJ1=computeTimeline(d); });
  loadJSON("joint2.json", d => { Joint2=d; statsJ2=computeHarmonyStats(d); timelineJ2=computeTimeline(d); });
}

// ------------------------------------------------------------
// ACTIVATE DATASET (button switches active marker only)
// ------------------------------------------------------------
function activateDataset(which){
  if(which==="d1") { currentData=Detached1; activeDataset="d1"; }
  if(which==="d2") { currentData=Detached2; activeDataset="d2"; }
  if(which==="j1") { currentData=Joint1; activeDataset="j1"; }
  if(which==="j2") { currentData=Joint2; activeDataset="j2"; }

  resetPlayback();
  highlightActiveButton();
}

// ------------------------------------------------------------
// UI POSITIONING
// ------------------------------------------------------------
function positionUI(){
  scrubSlider.position(width/2 - scrubSlider.width/2, height - 110);
  let bx = width/2 - 200; let by = height - 160;
  button1detached.position(bx,by); button2detached.position(bx+60,by);
  button1joint.position(bx+120,by); button2joint.position(bx+180,by);
  toggleButton.position(width/2 - 40, height - 60);
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight - 100);
  scrubSlider.size(windowWidth*0.7);
  positionUI();
}

// ------------------------------------------------------------
// PLAY / PAUSE
// ------------------------------------------------------------
function togglePlay(){
  if(isPlaying){ noLoop(); toggleButton.html("▶"); isPlaying=false; }
  else { loop(); toggleButton.html("⏸"); isPlaying=true; }
}

// Reset playback
function resetPlayback(){
  i=0; loopCount=1;
  if(currentData){ scrubSlider.elt.max = currentData.length-1; scrubSlider.value(0); }
}

// ------------------------------------------------------------
// DRAW
// ------------------------------------------------------------
function draw(){
  background(220);

  if(!currentData){
    textAlign(CENTER,CENTER); text("Loading JSON...",width/2,height/2); return;
  }

  if(isPlaying && !userScrubbing){
    i+=increment;
    if(i>=currentData.length){ i=currentData.length-1; }
    scrubSlider.value(i);
  }

  const frame=currentData[i];
  const {midi1,midi2,midi3}=frame.midi;
  const harmonyName=getHarmonyGroup(midi1,midi2,midi3);

  // Notes
  fill(harmonyName==="Not in Harmony"?"red":"green");
  textAlign(LEFT);
  text("P: "+midiToNoteName(midi1),800,300);
  text("G: "+midiToNoteName(midi2),800,350);
  text("R: "+midiToNoteName(midi3),800,400);
  textSize(30); text("Harmony: "+harmonyName,800,450);

  // Circle
  fill(harmonyName==="Not in Harmony"?"red":"green");
  noStroke(); circle(width/4,height/2,300);

  // Info box
  fill(255); rect(width/2-150,20,300,140);
  fill(harmonyName==="Not in Harmony"?"red":"green");
  textAlign(CENTER); textSize(20);
  text("Loop: "+loopCount,width/2,50);
  text("Frame: "+i,width/2,80);
  text("Timestamp:",width/2,110);
  text(frame.timestamp,width/2,135);

  // Pie chart
  let stats =
    currentData===Detached1?statsD1:
    currentData===Detached2?statsD2:
    currentData===Joint1?statsJ1:
    currentData===Joint2?statsJ2:null;
  drawHarmonyPie(width*0.82,height*0.5,40,stats);

  // Draw all timelines stacked
  drawTimeline(timelineD1,50,timelineY.d1,width-100,20, activeDataset==="d1"?i:null);
  drawTimeline(timelineD2,50,timelineY.d2,width-100,20, activeDataset==="d2"?i:null);
  drawTimeline(timelineJ1,50,timelineY.j1,width-100,20, activeDataset==="j1"?i:null);
  drawTimeline(timelineJ2,50,timelineY.j2,width-100,20, activeDataset==="j2"?i:null);
}

// ------------------------------------------------------------
// HARMONY STATS
// ------------------------------------------------------------
function computeHarmonyStats(data){
  if(!data) return null;
  let inHarmony=0, notHarmony=0;
  for(let f of data){
    const h=getHarmonyGroup(f.midi.midi1,f.midi.midi2,f.midi.midi3);
    if(h==="Not in Harmony") notHarmony++; else inHarmony++;
  }
  let total=inHarmony+notHarmony;
  return {inHarmony: inHarmony/total, notInHarmony: notHarmony/total};
}

// ------------------------------------------------------------
// PIE CHART
// ------------------------------------------------------------
function drawHarmonyPie(x,y,radius,stats){
  if(!stats) return;
  let start=0;
  fill("green"); let inArc=stats.inHarmony*TWO_PI; arc(x,y,radius*2,radius*2,start,start+inArc); start+=inArc;
  fill("red"); let notArc=stats.notInHarmony*TWO_PI; arc(x,y,radius*2,radius*2,start,start+notArc);

  fill("green"); textSize(14); textAlign(CENTER); text(Math.round(stats.inHarmony*100)+"% In Harmony",x,y+55);
  fill("red"); text(Math.round(stats.notInHarmony*100)+"% Not in Harmony",x,y-55);
}

// ------------------------------------------------------------
// TIMELINE BAR
// ------------------------------------------------------------
function computeTimeline(data){
  if(!data) return null;
  return data.map(f=>{
    const h=getHarmonyGroup(f.midi.midi1,f.midi.midi2,f.midi.midi3);
    return h==="Not in Harmony"?0:1;
  });
}

function drawTimeline(arr,x,y,w,h,index){
  if(!arr) return;
  let step=w/arr.length;
  noStroke();
  for(let j=0;j<arr.length;j++){
    fill(arr[j]===1?"green":"red");
    rect(x+j*step,y,step,h);
  }
  if(index!==null){
    stroke(0); strokeWeight(2);
    let markerX=x+index*step;
    line(markerX,y-5,markerX,y+h+5);
  }
}

// ------------------------------------------------------------
// HIGHLIGHT BUTTONS
// ------------------------------------------------------------
function highlightActiveButton(){
  const allButtons=[button1detached,button2detached,button1joint,button2joint];
  allButtons.forEach(b=>{ b.style("background-color","lightgray"); b.style("color","black"); });

  if(activeDataset==="d1") button1detached.style("background-color","gold").style("color","white");
  if(activeDataset==="d2") button2detached.style("background-color","gold").style("color","white");
  if(activeDataset==="j1") button1joint.style("background-color","gold").style("color","white");
  if(activeDataset==="j2") button2joint.style("background-color","gold").style("color","white");
}
