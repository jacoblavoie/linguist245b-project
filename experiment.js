const general_intro = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 800px; margin: auto; text-align: left;">
      <h2>Welcome!</h2>
      <p>Thank you for participating in this study. The experiment consists of three parts:</p>
      <ol>
        <li>An English vocabulary test</li>
        <li>A main task in which you will hear and see words, and decide whether the written word is a real English word</li>
        <li>A brief survey about your background</li>
      </ol>
      <p>Each part will be introduced before it begins.</p>
      <p>Please make sure you are in a quiet environment and can hear audio clearly for the final task.</p>
      <p style="margin-top: 2em;">Press any key to begin.</p>
    </div>
  `
};

const practice_intro = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 800px; margin: auto; text-align: left;">
      <h2>Part 2: Practice Trials</h2>
      <p>You will now complete a few <strong>practice trials</strong> to get familiar with the task.</p>
      <p>These trials are <strong>not scored</strong> and are only to help you get used to the format.</p>
      <p style="margin-top: 2em;">Press any key to begin.</p>
    </div>
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

const keyMapping = Math.random() < 0.5
  ? { yesKey: 'f', noKey: 'j', yesLabel: 'F', noLabel: 'J' }
  : { yesKey: 'j', noKey: 'f', yesLabel: 'J', noLabel: 'F' };

jsPsych.data.addProperties({
  response_mapping: `${keyMapping.yesLabel}=YES, ${keyMapping.noLabel}=NO`
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
  ...trialData.map(t => ({ ...t, trial_type: 'stimulus', stimulus_type: 'experimental' })),
  ...fillerStimuli.map(t => ({ ...t, trial_type: 'stimulus', stimulus_type: 'filler' })),
  ...pseudowordStimuli.map(t => ({ ...t, trial_type: 'stimulus', stimulus_type: 'pseudoword' }))
]);



const pseudowordTargets = pseudowordStimuli.map(item => item.target);

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
        stimulus: 'audio/beep-329314.mp3',
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
        stimulus: `
          <p id="word" style="font-size: 40px;">${t.target}</p>
          <p style="font-size: 16px;">${keyMapping.yesLabel} = YES &nbsp;&nbsp;&nbsp; ${keyMapping.noLabel} = NO</p>
        `,
        choices: [keyMapping.yesKey, keyMapping.noKey],
        trial_duration: 1500,
        on_start: () => {
          setTimeout(() => {
            const wordEl = document.getElementById("word");
            if (wordEl) wordEl.style.visibility = "hidden";
          }, 300);
        },
        data: {
          target: t.target,
          prime: t.prime,
          prime_type: t.prime_type,       // e.g., literal/metaphor/unrelated
          stimulus_type: t.stimulus_type, // experimental, filler, pseudoword
          trial_type: t.trial_type,
          correct_response: t.stimulus_type === 'pseudoword' ? keyMapping.noKey : keyMapping.yesKey
        },
        on_finish: function(data) {
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
    'audio/beep-329314.mp3',
  ...allTrials.map(t => t.audio)
]
};

const transition_to_lextale = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 800px; margin: auto; text-align: left;">
      <h2>Part 1: Vocabulary Test</h2>
      <p>You will now complete the first part of the study: a short English vocabulary test.</p>
      <p>This test is called <strong>LexTALE</strong> and helps us get a general sense of your English proficiency.</p>
      <p style="margin-top: 2em;">Press any key to continue.</p>
    </div>
  `
};

const lextale_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 800px; margin: auto; text-align: left;">
      <h2>LexTALE Vocabulary Test</h2>
      <p>In this test, you will see a series of letter strings—one at a time.</p>
      <p>Your task is to decide whether each string is a real English word.</p>
      <p><strong>Key responses:</strong></p>
      <ul>
        <li><strong>${keyMapping.yesLabel}</strong> = YES (real English word)</li>
        <li><strong>${keyMapping.noLabel}</strong> = NO (not a real English word)</li>
      </ul>
      <p>There is no time limit, but please try to be accurate.</p>
      <p style="margin-top: 2em;">Press any key to begin.</p>
    </div>
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
  stimulus: `
  <p style="font-size: 40px;">${stim.word}</p>
  <p style="font-size: 16px;">${keyMapping.yesLabel} = YES &nbsp;&nbsp;&nbsp; ${keyMapping.noLabel} = NO</p>
`,
  choices: [keyMapping.yesKey, keyMapping.noKey],
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
      const correct = jsPsych.pluginAPI.compareKeys(trial.response, trial.isWord ? keyMapping.yesKey : keyMapping.noKey);
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

    jsPsych.data.addProperties({
      lextale_score: Math.round(lextale_score),
      lextale_word_score: Math.round(word_score),
      lextale_nonword_score: Math.round(nonword_score)
    });

    return `
      <h2>LexTALE Test Completed</h2>
      <p>Your LexTALE vocabulary score is: <strong>${Math.round(lextale_score)}%</strong></p>
      <p>Press any key to continue.</p>
    `;
  }
};

const break_before_priming = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 800px; margin: auto; text-align: left;">
      <h2>Break Time</h2>
      <p>You have completed the first part of the study.</p>
      <p>You may take a short <strong>30-second break</strong> before continuing.</p>
      <p>When you’re ready, press any key to continue to the final task.</p>
    </div>
  `
};

const instructions_page1 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 800px; margin: auto; text-align: left;">
      <h2>Part 2: Lexical Decision Task</h2>
      <p>You will now begin the second part of the study.</p>
      <p>Each trial will follow this sequence:</p>
      <ul>
        <li>A fixation cross (+) appears at the center of the screen.</li>
        <li>You will hear a short beep followed by a spoken word.</li>
        <li>A written word will appear briefly on the screen.</li>
      </ul>
      <p>Your task is to judge whether the <strong>written word</strong> is a real English word.</p>
      <p style="margin-top: 1em;"><strong>Key responses:</strong></p>
      <ul>
        <li><strong>${keyMapping.yesLabel}</strong> = YES (real English word)</li>
        <li><strong>${keyMapping.noLabel}</strong> = NO (not a real English word)</li>
      </ul>
      <p>Please respond as quickly and accurately as you can.</p>
      <p style="margin-top: 2em;">Press any key to continue.</p>
    </div>
  `
};

const instructions_page2 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 800px; margin: auto; text-align: left;">
      <h2>Before You Begin</h2>
      <p>Make sure your sound is turned on.</p>
      <p>You will hear audio during each trial, but your decision should be based only on the <strong>written word</strong> you see on the screen.</p>
      <p><strong>Reminder:</strong></p>
      <ul>
        <li><strong>${keyMapping.yesLabel}</strong> = YES (real English word)</li>
        <li><strong>${keyMapping.noLabel}</strong> = NO (not a real English word)</li>
      </ul>
      <p style="margin-top: 2em;">Press any key when you are ready to begin.</p>
    </div>
  `
};

const transition_to_main_trials = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 800px; margin: auto; text-align: left;">
      <h2>Part 2: Main Trials</h2>
      <p>Great job on the practice trials!</p>
      <p>You will now begin the <strong>main set of trials</strong>.</p>
      <p>Remember your key assignments:</p>
      <ul>
        <li><strong>${keyMapping.yesLabel}</strong> = YES (real English word)</li>
        <li><strong>${keyMapping.noLabel}</strong> = NO (not a real English word)</li>
      </ul>
      <p>Try to respond as <strong>quickly and accurately</strong> as possible.</p>
      <p style="margin-top: 2em;">Press any key to begin the main trials.</p>
    </div>
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
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="max-width: 800px; margin: auto; text-align: left;">
      <h2>Thank You!</h2>
      <p>We sincerely appreciate your participation in this study.</p>
      <p>Your unique participant ID is:</p>
      <p style="font-size: 1.5em; font-weight: bold; margin: 1em 0;">${subject_id}</p>
      <p>Please save this ID for payment and/or your personal records.</p>
      <p style="margin-top: 2em;">Click below to confirm your participation and complete the study on Prolific.</p>
    </div>
  `,
  choices: ['Complete Study'],
  on_finish: () => {
    window.location.href = "https://app.prolific.com/submissions/complete?cc=C17CSC97";
  }
};

const transition_to_survey = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 800px; margin: auto; text-align: left;">
      <h2>Part 3: Background Survey</h2>
      <p>Thank you for completing the main tasks of the study.</p>
      <p>We now ask you to complete a brief <strong>language background questionnaire</strong>. This will help us interpret your results.</p>
      <p>Your responses are anonymous and will only be used for research purposes.</p>
      <p style="margin-top: 2em;">Press any key to continue to the survey.</p>
    </div>
  `
};

const survey_age_gender = {
  type: jsPsychSurveyMultiChoice,
  questions: [
    {
      prompt: 'What is your gender?',
      name: 'gender',
      options: ['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other'],
      required: true
    }
  ],
  data: { section: 'demographics_gender' }
};

const survey_age = {
  type: jsPsychSurveyText,
  questions: [
    {prompt: 'What is your age?', name: 'age', required: true}
  ],
  data: { section: 'demographics_age' }
};

const survey_languages_birth = {
  type: jsPsychSurveyText,
  questions: [
    {prompt: 'What is your native language(s) (L1)?', name: 'native_language', required: true},
    {prompt: 'What is your country of birth?', name: 'country_birth', required: true}
  ],
  data: { section: 'languages_birth' }
};

const survey_residency_check = {
  type: jsPsychSurveyMultiChoice,
  questions: [
    {
      prompt: 'Have you ever lived in a country other than your country of birth?',
      name: 'has_lived_abroad',
      options: ['Yes', 'No'],
      required: true
    }
  ],
  data: { section: 'residency_check' }
};

const survey_residency_details = {
  type: jsPsychSurveyText,
  questions: [
    {
      prompt: 'If you have lived in other countries than where you were born, please list the countries and the ages you lived there.',
      name: 'countries_lived',
      required: false
    }
  ],
  data: { section: 'residency_details' }
};

// Basic L2 information
const survey_L2_basic = {
  type: jsPsychSurveyText,
  questions: [
    {
      prompt: 'What is your second language (L2)?',
      name: 'second_language',
      required: true
    },
    {
      prompt: 'At what age were you first exposed to your L2 (e.g., through family, school, media, etc.)?',
      name: 'age_exposed_l2',
      required: true
    }
  ],
  data: { section: 'L2_basic' }
};

// Formal instruction check
const survey_L2_formal_instruction_check = {
  type: jsPsychSurveyMultiChoice,
  questions: [
    {
      prompt: 'Have you ever received formal instruction in your L2 (e.g., through school or private courses)?',
      name: 'has_L2_formal_instruction',
      options: ['Yes', 'No'],
      required: true
    }
  ],
  data: { section: 'L2_formal_instruction_check' }
};

// If yes, ask for age
const survey_L2_formal_instruction_details = {
  type: jsPsychSurveyText,
  questions: [
    {
      prompt: 'If yes, at what age did you begin formal instruction in your L2?',
      name: 'age_formal_l2',
      required: false
    }
  ],
  data: { section: 'L2_formal_instruction_details' }
};

// Immersion check
const survey_L2_immersion_check = {
  type: jsPsychSurveyMultiChoice,
  questions: [
    {
      prompt: 'Have you ever lived in a country where your L2 is spoken as a primary language?',
      name: 'has_L2_immersion',
      options: ['Yes', 'No'],
      required: true
    }
  ],
  data: { section: 'L2_immersion_check' }
};

// If yes, ask for age of immersion
const survey_L2_immersion_details = {
  type: jsPsychSurveyText,
  questions: [
    {
      prompt: 'If you have lived in a country where your L2 is spoken, which country and at what age did you live there?',
      name: 'age_immersed_l2',
      required: false
    }
  ],
  data: { section: 'L2_immersion_details' }
};

const survey_L2_proficiency = {
  type: jsPsychSurveyLikert,
  questions: [
    {
      prompt: 'On a scale from 1 to 5, how would you rate your current overall proficiency in your L2?',
      name: 'current_l2_proficiency',
      labels: ['1 (Not proficient)', '2', '3', '4', '5 (Extremely proficient)'],
      required: true
    },
    {
      prompt: 'What is the highest L2 proficiency you have ever achieved?',
      name: 'highest_l2_proficiency',
      labels: ['1 (Not proficient)', '2', '3', '4', '5 (Extremely proficient)'],
      required: true
    }
  ],
  data: { section: 'L2_proficiency' }
};

const survey_dominance = {
  type: jsPsychSurveyMultiChoice,
  questions: [
    {
      prompt: 'Which language do you use MOST often now?',
      name: 'language_use_most',
      options: ['L1', 'L2', 'Equal'],
      required: true
    },
    {
      prompt: 'Which language do you consider STRONGER?',
      name: 'language_stronger',
      options: ['L1', 'L2', 'Equal'],
      required: true
    }
  ],
  data: { section: 'language_dominance' }
};

const survey_other_langs = {
  type: jsPsychSurveyMultiChoice,
  questions: [
    {
      prompt: 'Have you studied any other languages beyond L1/L2?',
      name: 'other_languages_studied',
      options: ['Yes', 'No'],
      required: true
    }
  ],
  data: { section: 'other_languages' }
};

const survey_other_langs_detail = {
  type: jsPsychSurveyText,
  questions: [
    {
      prompt: 'If yes, list languages and proficiency levels:',
      name: 'other_languages_details',
      required: false
    }
  ],
  data: { section: 'other_languages_detail' }
};

// Run the timeline
jsPsych.run([
  general_intro,  
  preload,    
  transition_to_lextale,                 
  lextale_instructions,        
  ...lextale_trials,
  score_lextale,
  break_before_priming,        
  instructions_page1,          
  instructions_page2,
  practice_intro,
  ...practiceTimeline,
  transition_to_main_trials,
  ...trialTimeline,
  transition_to_survey,
  survey_age_gender,
  survey_age,
  survey_languages_birth,
  survey_residency_check,
  survey_residency_details,
  survey_L2_basic,
  survey_L2_formal_instruction_check,
  survey_L2_formal_instruction_details,
  survey_L2_immersion_check,
  survey_L2_immersion_details,
  survey_L2_proficiency,
  survey_dominance,
  survey_other_langs,
  survey_other_langs_detail,
  save_data,
  thank_you
]);