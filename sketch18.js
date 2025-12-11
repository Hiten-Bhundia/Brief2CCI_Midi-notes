// ------------------------------------------------------------
// 6-Dataset Harmony Visualiser + Stacked Timelines (Configurable UI)
// ------------------------------------------------------------

// ---------------- CONFIG ----------------
const TIMELINE_X = 600;           // X position of all timeline bars
const TIMELINE_WIDTH = 600;      // Width of timeline bars
const TIMELINE_HEIGHT = 22;      // Height of each timeline bar
const TIMELINE_Y_START = 250;    // Starting Y position for first timeline
const TIMELINE_Y_GAP = 70;       // Vertical gap between stacked timelines

const COLOR_GREEN = "rgb(100, 160, 2)";
const COLOR_YELLOW = "rgb(255, 185, 116)";

// ---------------- DATA ----------------
let Detached1=null, Detached2=null, Detached3=null;
let Joint1=null, Joint2=null, Joint3=null;
let currentData=null;
let activeDataset=null;

// Playback
let i=0, increment=1, loopCount=1;
let isPlaying=true, userScrubbing=false;

// UI
let toggleButton, scrubSlider;
let button1detached, button2detached, button3detached;
let button1joint, button2joint, button3joint;

// Harmony stats
let statsD1=null, statsD2=null, statsD3=null;
let statsJ1=null, statsJ2=null, statsJ3=null;

// Timeline arrays
let timelineD1=null, timelineD2=null, timelineD3=null;
let timelineJ1=null, timelineJ2=null, timelineJ3=null;

// MIDI → note name
function midiToNoteName(midi){
  const notes=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  return notes[midi%12] + (Math.floor(midi/12)-1);
}

// Note → MIDI map
const NOTE_TO_MIDI={ "C4":60,"C5":72,"D4":62,"E4":64,"F4":65,"G4":67,"A4":69,"B4":71 };

// Harmony groups
const harmonyGroups=[
  {name:"Triads", groups:[["C4","E4","G4"],["D4","F4","A4"],["E4","G4","B4"],["F4","A4","C5"],["G4","B4","D4"],["A4","C4","E4"],["B4","D4","F4"]]},
  {name:"Stepwise Triplets", groups:[["C4","D4","E4"],["D4","E4","F4"],["E4","F4","G4"],["F4","G4","A4"],["G4","A4","B4"],["A4","B4","C5"],["B4","C5","C4"]]},
  {name:"Octave+Fifth", groups:[["C4","G4","C5"],["D4","A4","D4"],["E4","B4","E4"],["F4","C5","F4"],["G4","D4","G4"],["A4","E4","A4"],["B4","F4","B4"]]},
  {name:"Unisons", groups:[["C4","C4","C4"],["D4","D4","D4"],["E4","E4","E4"],["F4","F4","F4"],["G4","G4","G3"],["A4","A4","A4"],["B4","B4","B4"]]}
];
harmonyGroups.forEach(g=>g.groups=g.groups.map(gr=>gr.map(n=>NOTE_TO_MIDI[n])));

// Determine harmony
function getHarmonyGroup(n1,n2,n3){
  const sorted=[n1,n2,n3].sort((a,b)=>a-b);
  for(let g of harmonyGroups){
    for(let grp of g.groups){
      if(sorted.join("") === [...grp].sort((a,b)=>a-b).join("")) return g.name;
    }
  }
  return "Not in Harmony";
}

// ---------------- SETUP ----------------
function setup(){
  createCanvas(windowWidth, windowHeight-100);
  textSize(20);

  // Slider
  scrubSlider=createSlider(0,1,0,1);
  scrubSlider.size(900);
  scrubSlider.input(()=>{ if(currentData){ userScrubbing=true; i=int(scrubSlider.value()); } });
  scrubSlider.mouseReleased(()=>userScrubbing=false);

  // Buttons
  button1detached=createButton("1D"); button2detached=createButton("2D"); button3detached=createButton("3D");
  button1joint=createButton("1J"); button2joint=createButton("2J"); button3joint=createButton("3J");
  [button1detached, button2detached, button3detached].forEach((b,idx)=>b.mousePressed(()=>activateDataset("d"+(idx+1))));
  [button1joint, button2joint, button3joint].forEach((b,idx)=>b.mousePressed(()=>activateDataset("j"+(idx+1))));
  button1detached.size(50,50); button2detached.size(50,50); button3detached.size(50,50);
  button1joint.size(50,50); button2joint.size(50,50); button3joint.size(50,50);

  // Play / Pause
  toggleButton=createButton("⏸"); toggleButton.size(80,40); toggleButton.mousePressed(togglePlay);

  positionUI();

  // Load JSONs
  loadJSON("detached1.json",d=>{ Detached1=d; statsD1=computeHarmonyStats(d); timelineD1=computeTimeline(d); if(!currentData){ currentData=Detached1; activeDataset="d1"; resetPlayback(); highlightActiveButton(); } });
  loadJSON("detached2.json",d=>{ Detached2=d; statsD2=computeHarmonyStats(d); timelineD2=computeTimeline(d); });
  loadJSON("detached3.json",d=>{ Detached3=d; statsD3=computeHarmonyStats(d); timelineD3=computeTimeline(d); });
  loadJSON("joint1.json",d=>{ Joint1=d; statsJ1=computeHarmonyStats(d); timelineJ1=computeTimeline(d); });
  loadJSON("joint2.json",d=>{ Joint2=d; statsJ2=computeHarmonyStats(d); timelineJ2=computeTimeline(d); });
  loadJSON("joint3.json",d=>{ Joint3=d; statsJ3=computeHarmonyStats(d); timelineJ3=computeTimeline(d); });
}

// ---------------- ACTIVATE DATASET ----------------
function activateDataset(which){
  if(which==="d1"){ currentData=Detached1; activeDataset="d1"; }
  if(which==="d2"){ currentData=Detached2; activeDataset="d2"; }
  if(which==="d3"){ currentData=Detached3; activeDataset="d3"; }
  if(which==="j1"){ currentData=Joint1; activeDataset="j1"; }
  if(which==="j2"){ currentData=Joint2; activeDataset="j2"; }
  if(which==="j3"){ currentData=Joint3; activeDataset="j3"; }
  resetPlayback(); highlightActiveButton();
}

// ---------------- UI POSITIONING ----------------
function positionUI(){
  scrubSlider.position(width/2 - scrubSlider.width/2, height - 110);
  let bx=width/2-250; let by=height-160;
  button1detached.position(bx,by); button2detached.position(bx+60,by); button3detached.position(bx+120,by);
  button1joint.position(bx+180,by); button2joint.position(bx+240,by); button3joint.position(bx+300,by);
  toggleButton.position(width/2-40,height-60);
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight-100);
  scrubSlider.size(windowWidth*0.7); positionUI();
}

// ---------------- PLAY / PAUSE ----------------
function togglePlay(){
  if(isPlaying){ noLoop(); toggleButton.html("▶"); isPlaying=false; }
  else{ loop(); toggleButton.html("⏸"); isPlaying=true; }
}

function resetPlayback(){
  i=0; loopCount=1;
  if(currentData){ scrubSlider.elt.max=currentData.length-1; scrubSlider.value(0); }
}

// ---------------- DRAW ----------------
function draw(){
  background(240);
  if(!currentData){ textAlign(CENTER,CENTER); text("Loading JSON...",width/2,height/2); return; }

  if(isPlaying && !userScrubbing){
    i+=increment; if(i>=currentData.length) i=currentData.length-1;
    scrubSlider.value(i);
  }

  const frame=currentData[i]; const {midi1,midi2,midi3}=frame.midi;
  const harmonyName=getHarmonyGroup(midi1,midi2,midi3);

  // Notes (moved right)
  fill(harmonyName==="Not in Harmony"?COLOR_YELLOW:COLOR_GREEN);
  textAlign(LEFT); textSize(20);
  text("P: "+midiToNoteName(midi1), width-250, 100);
  text("G: "+midiToNoteName(midi2), width-250, 140);
  text("R: "+midiToNoteName(midi3), width-250, 180);
  textSize(26); text("Harmony: "+harmonyName, width-250, 220);

  // Info box
  fill(255); rect(width/2-150,20,300,120);
  fill(harmonyName=== "Not in Harmony"?COLOR_YELLOW:COLOR_GREEN);
  textAlign(CENTER); textSize(18);
  text("Loop:"+loopCount,width/2,50); text("Frame:"+i,width/2,80);
  text("Timestamp:",width/2,105); text(frame.timestamp,width/2,130);

  // Pie chart
  let stats=currentData===Detached1?statsD1:
            currentData===Detached2?statsD2:
            currentData===Detached3?statsD3:
            currentData===Joint1?statsJ1:
            currentData===Joint2?statsJ2:
            currentData===Joint3?statsJ3:null;
  drawHarmonyPie(width*0.82,height*0.5,50,stats);

  // Draw all timelines stacked
  drawTimeline(timelineD1,TIMELINE_X,TIMELINE_Y_START,TIMELINE_WIDTH,TIMELINE_HEIGHT,activeDataset==="d1"?i:null);
  drawTimeline(timelineD2,TIMELINE_X,TIMELINE_Y_START+TIMELINE_Y_GAP,TIMELINE_WIDTH,TIMELINE_HEIGHT,activeDataset==="d2"?i:null);
  drawTimeline(timelineD3,TIMELINE_X,TIMELINE_Y_START+TIMELINE_Y_GAP*2,TIMELINE_WIDTH,TIMELINE_HEIGHT,activeDataset==="d3"?i:null);
  drawTimeline(timelineJ1,TIMELINE_X,TIMELINE_Y_START+TIMELINE_Y_GAP*3,TIMELINE_WIDTH,TIMELINE_HEIGHT,activeDataset==="j1"?i:null);
  drawTimeline(timelineJ2,TIMELINE_X,TIMELINE_Y_START+TIMELINE_Y_GAP*4,TIMELINE_WIDTH,TIMELINE_HEIGHT,activeDataset==="j2"?i:null);
  drawTimeline(timelineJ3,TIMELINE_X,TIMELINE_Y_START+TIMELINE_Y_GAP*5,TIMELINE_WIDTH,TIMELINE_HEIGHT,activeDataset==="j3"?i:null);
}

// ---------------- HARMONY STATS ----------------
function computeHarmonyStats(data){
  if(!data) return null;
  let inHarmony=0, notHarmony=0;
  for(let f of data){
    const h=getHarmonyGroup(f.midi.midi1,f.midi.midi2,f.midi.midi3);
    if(h==="Not in Harmony") notHarmony++; else inHarmony++;
  }
  let total=inHarmony+notHarmony;
  return {inHarmony:inHarmony/total, notInHarmony:notHarmony/total};
}

// ---------------- PIE CHART ----------------
function drawHarmonyPie(x,y,radius,stats){
  if(!stats) return;
  let start=0;
  fill(COLOR_GREEN); let inArc=stats.inHarmony*TWO_PI; arc(x,y,radius*2,radius*2,start,start+inArc); start+=inArc;
  fill(COLOR_YELLOW); let notArc=stats.notInHarmony*TWO_PI; arc(x,y,radius*2,radius*2,start,start+notArc);
  fill(COLOR_GREEN); textSize(14); textAlign(CENTER); text(Math.round(stats.inHarmony*100)+"% In Harmony",x,y+60);
  fill(COLOR_YELLOW); text(Math.round(stats.notInHarmony*100)+"% Not in Harmony",x,y-60);
}

// ---------------- TIMELINE ----------------
function computeTimeline(data){ if(!data) return null; return data.map(f=>getHarmonyGroup(f.midi.midi1,f.midi.midi2,f.midi.midi3)==="Not in Harmony"?0:1); }
function drawTimeline(arr,x,y,w,h,index){
  if(!arr) return;
  let step=w/arr.length; noStroke();
  for(let j=0;j<arr.length;j++){ fill(arr[j]===1?COLOR_GREEN:COLOR_YELLOW); rect(x+j*step,y,step,h); }
  if(index!==null){ stroke(0); strokeWeight(2); let markerX=x+index*step; line(markerX,y-2,markerX,y+h+2); }
}

// ---------------- BUTTON HIGHLIGHT ----------------
function highlightActiveButton(){
  const allButtons=[button1detached,button2detached,button3detached,button1joint,button2joint,button3joint];
  allButtons.forEach(b=>{ b.style("background-color","lightgray"); b.style("color","black"); });
  if(activeDataset==="d1") button1detached.style("background-color","gold").style("color","white");
  if(activeDataset==="d2") button2detached.style("background-color","gold").style("color","white");
  if(activeDataset==="d3") button3detached.style("background-color","gold").style("color","white");
  if(activeDataset==="j1") button1joint.style("background-color","gold").style("color","white");
  if(activeDataset==="j2") button2joint.style("background-color","gold").style("color","white");
  if(activeDataset==="j3") button3joint.style("background-color","gold").style("color","white");
}
