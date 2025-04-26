// Initialize jsPsych
const jsPsych = initJsPsych({
    on_finish: function() {
      jsPsych.data.displayData();
    }
  });

// Define my trials
const demoTrials = [
  { target: "invest", prime: "cash1", prime_type: "literal" },
  { target: "invest", prime: "effort", prime_type: "metaphor" },
  { target: "invest", prime: "garden1", prime_type: "unrelated" }
];
// Shuffle and preload
const trialData = jsPsych.randomization.shuffle(
  demoTrials.map(t => ({
    audio: `audio/${t.prime}.wav`,
    target: t.target,
    prime: t.prime,
    prime_type: t.prime_type
  }))
);

const preload = {
  type: jsPsychPreload,
  audio: trialData.map(t => t.audio)
};

const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>You'll hear a word. Then a visual word will appear.</p>
    <p>Press <strong>F</strong> if it is a real English collocation, or <strong>J</strong> if it is not.</p>
    <p>Press any key to begin.</p>`
};

const trials = trialData.map(t => [
  {
    type: jsPsychAudioKeyboardResponse,
    stimulus: t.audio,
    choices: "NO_KEYS",
    trial_ends_after_audio: true
  },
  {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p style="font-size: 40px;">${t.target}</p>`,
    choices: ['f', 'j'],
    data: {
      target: t.target,
      prime: t.prime,
      prime_type: t.prime_type
    }
  }
]).flat();

// Run the timeline
jsPsych.run([preload, instructions, ...trials]);
