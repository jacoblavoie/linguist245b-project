// Initialize jsPsych
const jsPsych = initJsPsych({
    use_webaudio: false,
    on_finish: function() {
      jsPsych.data.displayData();
    }
  });

const subject_id = jsPsych.randomization.randomID(10);

jsPsych.data.addProperties({
  subject_id: subject_id
});
// Define my trials
const conditions = ['literal', 'metaphor', 'unrelated'];

const trialData = jsPsych.randomization.shuffle(
  stimulusList.flatMap(stim => 
    conditions.map(cond => ({
      audio: `audio/${stim.primes[cond]}.wav`,
      target: stim.target,
      prime: stim.primes[cond],
      prime_type: cond
    }))
  )
);

const preload = {
  type: jsPsychPreload,
  audio: [
    'audio/beep-125033.mp3',
  ...trialData.map(t => t.audio)
]
};

const instructions_page1 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Welcome to the study!</p>
    <p>In this task, you will first see a cross, hear a beep, then hear a spoken word.</p>
    <p>After the audio, a visual word will appear on the screen.</p>
    <p>You will be making a decision about whether the two words are closely related to one another in English.</p>
    <p>For example, the words "book" and "write" are closely related because you can write a book. The words "snow" and "write" are not related because you cannot write snow</p>
    <p>To make a decision about whether each word pair is acceptable in English, press <strong>F</strong> for YES, <strong>J</strong> for NO.</p>
    <p>Please use your best judgement. In some cases, you may think of some distant connection (e.g., you can write a poem about snow)</p>
    <p>However, you may think of distant connections between words. For example, you might think "someone can write about snow," but you should agree that this is a stretch and they are not related to each other in general</p>
    <p>Press any key to continue.</p>
  `
};

const instructions_page2 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Important:</p>
    <p>The audio you hear is the <strong>second word</strong> of a possible collocation.</p>
    <p>For example, if you see "invest" and hear "cash", you should think about whether "invest cash" is an appropriate combination of words in English.</p>
    <p>Please respond as quickly and accurately as possible.</p>
    <p>Press any key when you are ready to begin.</p>
  `
};

const trialTimeline = trialData.map(t => [
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
    on_finish: function(data){
      data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
    }
  }
]).flat();

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

// Run the timeline
jsPsych.run([preload, instructions_page1, instructions_page2, ...trialTimeline, save_data, thank_you]);
