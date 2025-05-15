const general_intro = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>This study consists of three parts:</p>
<ol>
  <li>A brief survey about your language background.</li>
  <li>An English vocabulary test.</li>
  <li>A main task in which you will hear and see words, and decide whether the written word is a real English word.</li>
</ol>
<p>Each part will be introduced before it begins. Please make sure you are in a quiet environment and can hear audio clearly for the final task.</p>
<p>Press any key to begin.</p>

  `
};

function generateLatinSquareList(stimulusList, listIndex) {
  const conditions = ['literal', 'metaphor', 'unrelated'];
  const shuffled = jsPsych.randomization.shuffle(stimulusList.slice());

  const blocks = [
    shuffled.slice(0, 16),
    shuffled.slice(16, 32),
    shuffled.slice(32, 48)
  ];

  const trials = blocks.flatMap((block, i) => {
    const condition = conditions[(i + listIndex) % 3];
    return block.map(stim => ({
      audio: `audio/${stim.primes[condition]}.wav`,
      target: stim.target,
      prime: stim.primes[condition],
      prime_type: condition
    }));
  });

  return trials;
}
// Initialize jsPsych
const jsPsych = initJsPsych({
  use_webaudio: false,
  show_progress_bar: true,
  auto_update_progress_bar: true, 
  on_finish: function() {
    jsPsych.data.displayData();
  }
});

const subject_id = jsPsych.randomization.randomID(10);

// Define my trials
const listIndex = Math.floor(Math.random() * 3); // assigns participant to one of 3 lists
const trialData = generateLatinSquareList(stimulusList, listIndex);

jsPsych.data.addProperties({
  subject_id: subject_id,
  list_index: listIndex 
});


// Combine with filler and pseudoword trials
const allTrials = jsPsych.randomization.shuffle([
  ...trialData,
  ...fillerStimuli,
  ...pseudowordStimuli
]);

const mainBlocks = [];
for (let i = 0; i < 8; i++) {
  mainBlocks.push(allTrials.slice(i * 16, (i + 1) * 16));
}

// Sample 24 total trials for practice
const practiceTrials = jsPsych.randomization.sampleWithoutReplacement([
  ...trialData,
  ...fillerStimuli,
  ...pseudowordStimuli
], 24);

// Split into 2 blocks of 12
const practiceBlocks = [];
for (let i = 0; i < 2; i++) {
  practiceBlocks.push(practiceTrials.slice(i * 12, (i + 1) * 12));
}

function buildBlockTimeline(block, totalTrialsSoFar, totalTrials) {
  return block.map((t, idx) => {
    const progress = (totalTrialsSoFar + idx + 1) / totalTrials;
    return [
      {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `<p style="font-size: 50px;">+</p>`,
        choices: "NO_KEYS",
        trial_duration: 300
      },
      {
        type: jsPsychAudioKeyboardResponse,
        stimulus: 'audio/beep-125033.mp3',
        choices: "NO_KEYS",
        trial_ends_after_audio: true
      },
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
        trial_duration: 1500,
        stimulus_duration: 300,
        data: {
          target: t.target,
          prime: t.prime,
          prime_type: t.prime_type,
          correct_response: (t.prime_type === 'unrelated') ? 'j' : 'f'
        },
        on_start: () => {
          jsPsych.setProgressBar(progress);
        },
        on_finish: function(data){
          data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
        }
      }
    ];
  }).flat();
}

const practiceTimeline = practiceBlocks.map((block, i) => [
  {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p>Starting practice block ${i + 1} of 2. Press any key to continue.</p>`
  },
  ...buildBlockTimeline(block, i * 12, 24)
]).flat();


const trialTimeline = [
  {
    type: jsPsychCallFunction, 
    func: () => jsPsych.setProgressBar(0)
  },
  ...mainBlocks.flatMap((block, i) => {
    const blockStart = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<p>Starting main block ${i + 1} of 8. Press any key to continue.</p>`
    };

    const trials = buildBlockTimeline(block, i * 16, 128);

    const breakScreen = (i < mainBlocks.length - 1)
      ? [{
          type: jsPsychHtmlKeyboardResponse,
          stimulus: `<p>Excellent! You have finished block ${i + 1} of 8.</p>
                     <p>Feel free to take a 30 second break.</p>
                     <p>Press any key when you're ready to continue.</p>`
        }]
      : [];

    return [blockStart, ...trials, ...breakScreen];
  })
];


const preload = {
  type: jsPsychPreload,
  audio: [
    'audio/beep-125033.mp3',
  ...allTrials.map(t => t.audio)
]
};


const lextale_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>LexTALE English Vocabulary Test</h2>
    <p>In this part, you will see a series of letter strings, one at a time.</p>
    <p>Your task is to decide whether each string is a real English word or not.</p>
    <p>Press <strong>F</strong> for YES (real English word)</p>
    <p>Press <strong>J</strong> for NO (not a real English word)</p>
    <p>Please answer as accurately as possible. There is no time limit.</p>
    <p>This test gives us a quick sense of your vocabulary knowledge.</p>
    <p>Press any key to begin.</p>
  `
};

// LexTALE stimuli
const lextaleStimuli = [
  { word: "platery", isWord: false }, // dummy 1
  { word: "denial", isWord: true },   // dummy 2
  { word: "marrit", isWord: false },  // dummy 3
  // Real 60 trials start here
  { word: "bottle", isWord: true },
  { word: "birst", isWord: false },
  { word: "envy", isWord: true },
  { word: "brang", isWord: false },
  { word: "huge", isWord: true },
  { word: "plove", isWord: false },
  { word: "border", isWord: true },
  { word: "flimsy", isWord: true },
  { word: "drain", isWord: true },
  { word: "twindle", isWord: false },
  { word: "propose", isWord: true },
  { word: "forlay", isWord: false },
  { word: "tenant", isWord: true },
  { word: "strain", isWord: true },
  { word: "holster", isWord: true },
  { word: "hinder", isWord: true },
  { word: "swindle", isWord: true },
  { word: "nuder", isWord: false },
  { word: "pillow", isWord: true },
  { word: "shumble", isWord: false },
  { word: "thirst", isWord: true },
  { word: "unsail", isWord: false },
  { word: "rifle", isWord: true },
  { word: "mush", isWord: false },
  { word: "drench", isWord: true },
  { word: "snirt", isWord: false },
  { word: "bitter", isWord: true },
  { word: "pliff", isWord: false },
  { word: "tablet", isWord: true },
  { word: "glimmer", isWord: true },
  { word: "slink", isWord: true },
  { word: "clever", isWord: true },
  { word: "grum", isWord: false },
  { word: "string", isWord: true },
  { word: "plim", isWord: false },
  { word: "cable", isWord: true },
  { word: "shrivel", isWord: true },
  { word: "tarnish", isWord: true },
  { word: "blim", isWord: false },
  { word: "stifle", isWord: true },
  { word: "bint", isWord: false },
  { word: "purple", isWord: true },
  { word: "wriggle", isWord: true },
  { word: "mangle", isWord: true },
  { word: "shramp", isWord: false },
  { word: "flirt", isWord: true },
  { word: "frip", isWord: false },
  { word: "tangle", isWord: true },
  { word: "crumble", isWord: true },
  { word: "wrinkle", isWord: true },
  { word: "slumb", isWord: false },
  { word: "jungle", isWord: true },
  { word: "frolick", isWord: false }
];

// LexTALE trial generation
const lextale_trials = lextaleStimuli.map((stim, index) => ({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<p style="font-size: 40px;">${stim.word}</p>`,
  choices: ['f', 'j'],
  data: {
    task: 'lextale',
    isWord: stim.isWord,
    isDummy: index < 3 // first 3 are dummies
  }
}));

// Scoring LexTALE
const score_lextale = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    const lextale_data = jsPsych.data.get().filter({ task: 'lextale' }).values();

    let correct_words = 0;
    let correct_nonwords = 0;
    let total_words = 0;
    let total_nonwords = 0;

    lextale_data.forEach(trial => {
      if (trial.isDummy) {
        return; // to skip dummies
      }
      const correct = (trial.isWord && trial.response === 'f') || (!trial.isWord && trial.response === 'j');
      if (trial.isWord) {
        total_words++;
        if (correct) correct_words++;
      } else {
        total_nonwords++;
        if (correct) correct_nonwords++;
      }
    });

    const word_score = (correct_words / 40) * 100;
    const nonword_score = (correct_nonwords / 20) * 100;
    const lextale_score = (word_score + nonword_score) / 2;

    return `
      <h2>LexTALE Test Completed</h2>
      <p>Your LexTALE vocabulary score is: <strong>${Math.round(lextale_score)}%</strong></p>
      <p>Press any key to continue.</p>
    `;
  }
};

const save_lextale = {
  type: jsPsychPipe,
  action: "save",
  experiment_id: "V0uzmGtsMm82",
  filename: `${subject_id}_lextale.csv`,
  data_string: ()=>jsPsych.data.get().filter({ task: 'lextale' }).csv()
};

const break_before_priming = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>You have completed the first part of the study.</p>
    <p>Please take a short 30-second break if you wish.</p>
    <p>When you are ready, press any key to continue to the second part.</p>
  `
};

const instructions_page1 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
     <p>In the following task, you will complete a <strong>lexical decision task</strong>.</p>
    <p>Each trial will proceed as follows:</p>
    <ol>
      <li>You will see a cross in the center of the screen.</li>
      <li>You will hear a short beep, followed by a spoken word.</li>
      <li>Then, a written word will appear on the screen.</li>
    </ol>
    <p>Your task is to decide whether the <strong>written word</strong> is a real English word or not.</p>
    <p>Press <strong>F</strong> if it <strong>is</strong> a real word.</p>
    <p>Press <strong>J</strong> if it <strong>is not</strong> a real word.</p>
    <p>Respond as quickly and accurately as you can.</p>
    <p>Press any key to continue.</p>
  `
};

const instructions_page2 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Please make sure your sound is on, as each trial includes an audio recording.</p>
    <p>Only the written word matters for your decision — the audio is part of the trial but not something you respond to.</p>
    <p>Press any key when you're ready to begin.</p>
  `
};


const save_data = {
  type: jsPsychPipe,
  action: "save",
  experiment_id: "V0uzmGtsMm82",
  filename: `${subject_id}.csv`,
  data_string: ()=>jsPsych.data.get().csv()
};

const thank_you = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Thank you so much for participating!</p>
    <p>Your participant ID is: <strong>${subject_id}</strong></p>
    <p>Please save this ID for payment and/or if you need it for your records.</p>
    <p>Press any key to finish.</p>
  `
};

var language_background_survey = {
  type: jsPsychSurveyText,
  preamble: '<h3>Language Background Survey</h3><p>Please answer the following questions:</p>',
  questions: [
    {prompt: 'What is your age?:', name: 'age', required: true},
    {prompt: 'What is your gender?:', name: 'gender', required: true},
    {prompt: 'What is your native language(s) (L1)?:', name: 'native_language', required: true},
    {prompt: 'What is your country of birth:', name: 'country_birth', required: true},
    {prompt: 'Please list any countries you have lived in and at what age you lived there.:', name: 'countries_lived', required: true},
    {prompt: 'What is your second language (L2)?:', name: 'second_language', required: true},
    {prompt: 'At what age were you first exposed to your L2?:', name: 'age_exposed_l2', required: true},
    {prompt: 'At what age did you begin formal instruction in your L2?:', name: 'age_formal_l2', required: true},
    {prompt: 'If you have lived in a country where your L2 is spoken, at what age did you live there?:', name: 'age_immersed_l2', required: true},
    {prompt: 'On a 1–5 scale, what would you say your overall proficiency in your L2 is? 1 is not proficient at all and 5 is extremely proficient.:', name: 'current_l2_proficiency', required: true},
    {prompt: 'What is the highest L2 proficiency you have ever achieved on a 1–5 scale?:', name: 'highest_l2_proficiency', required: true},
    {prompt: 'Which language do you use MOST often now? (L1/L2/Equal):', name: 'language_use_most', required: true},
    {prompt: 'Which language do you consider STRONGER? (L1/L2/Equal):', name: 'language_stronger', required: true},
    {prompt: 'Have you studied any other languages beyond L1/L2? (Y/N):', name: 'other_languages_studied', required: true},
    {prompt: 'If yes, list languages and proficiency levels:', name: 'other_languages_details', required: false}
  ],
  button_label: 'Continue'
};

// Run the timeline
jsPsych.run([
  general_intro,
  language_background_survey,  
  preload,                     
  lextale_instructions,        
  ...lextale_trials,
  score_lextale,
  save_lextale,
  break_before_priming,        
  instructions_page1,          
  instructions_page2,
  {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <p>You will now complete a few <strong>practice trials</strong> to get familiar with the task.</p>
      <p>These are not scored and are only to help you get used to the format.</p>
      <p>Press any key to begin the practice trials.</p>
    `
  },
  ...practiceTimeline,
  ...trialTimeline,
  save_data,
  thank_you
]);