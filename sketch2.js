let MidiData1;
let i = 0;
let increment = 1; 
let loop = 1;


async function setup() {
  createCanvas(600, 600);
  //noLoop();
 textSize(20);
 
  MidiData1 = await loadJSON("Midi-data1.json");
  
  console.log(MidiData1);
  background(220);
}


function draw() {
  if (!MidiData1 || !MidiData1.length) {
    background(200, 0, 0);
    text("NO DATA LOADED", 200, 300);
    return;
  }

  if (frameCount % increment === 0) {

    background(220);

    text(loop + " > " + i, 300, 150);

    const frame = MidiData1[i];

    text("Midi1 [" + i + "]: " + frame.midi.midi1, 300, 300);
    text("Midi2 [" + i + "]: " + frame.midi.midi2, 300, 400);
    text("Midi3 [" + i + "]: " + frame.midi.midi3, 300, 500);

    i += increment;

    if (i >= MidiData1.length) {
      i = 0;
      loop++;
    }
  }
}
