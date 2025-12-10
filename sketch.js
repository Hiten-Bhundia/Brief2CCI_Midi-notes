let MidiData1;
let i = 0;
let increment = 1; 
let loop =1;

async function setup() {
  createCanvas(600, 600);
  //noLoop();
 textSize(20);
 
  MidiData1 = await loadJSON("Midi-data1.json");
  
  console.log(MidiData1);
  background(220);
}

function draw() {
   
  // This code runs every N frames (60 frames is approx. every 1 second)
  if (frameCount % increment == 0) {
    // Only print midi  values every N frames
         background(220);
         //Counter
         text(loop + " > " + i, 100,150);
         //Midi1
         text("Midi Note " + i +":" + MidiData1[i].midi.midi1, 300, 300);
         if(i != 0 && MidiData1[i].midi.midi1 != MidiData1[i-increment].midi.midi1){text("ALELUYA",300,600)};
         //Midi2
         text("Midi Note " + i +":" + MidiData1[i].midi.midi2, 300, 400);
         if(i != 0 && MidiData1[i].midi.midi2 != MidiData1[i-increment].midi.midi2){text("ALELUYA",300,600)};
         //Midi3
         text("Midi Note  " + i +":" + MidiData1[i].midi.midi3, 300, 500);
         if(i != 0 && MidiData1[i].midi.midi3 != MidiData1[i-increment].midi.midi3){text("ALELUYA",300,600)};
         // Next JSOM reading
         i = i + increment;
         // Next Cycle reading 
         if(i > MidiData1.length) {
            i=0;
            loop = loop +1;
        }
  }
   
// noLoop();
}
