/* experiment.ts
 * Define the jsPsych experiment timeline.
 *
 * Copyright (c) 2026, Michael P. Pascale <mpascale@bu.edu>
 * SPDX-License-Identifier: MIT
 * 
 * Last modified: 2026-11-05
 */

import {JsPsych, type TrialType} from "jspsych";
import jsp_ins from '@jspsych/plugin-instructions';
import jsp_txt from '@jspsych/plugin-survey-text';
import jsp_img from '@jspsych/plugin-html-keyboard-response';
import jsp_key from '@jspsych/plugin-html-keyboard-response';
import jsp_vas from '@jspsych/plugin-html-slider-response';
import storm_config from "./config.json" with {type: "json"};
import storm_stimuli from "./stimuli.json" with {type: "json"};


export default function (jsPsych: JsPsych) {
return [
    /**************************************************************************
     * Instructions
     */
    {
        type: jsp_ins,
        pages: storm_config.messages.instructions,
        button_label_next: "Continue",
        show_clickable_nav: true
    },
    {
        type: jsp_key,
        stimulus: ()=>`<img src=\"${storm_config.url_stim_demo[0]}\" style="width: 100mm; height: 100mm; filter: blur(5px);">`,
        choices: "NO_KEYS",
        trial_duration: storm_config.timing.stim
    },
    {
        type: jsp_txt,
        questions: [{
            prompt: storm_config.messages.guess,
            placeholder: "duck"
        }]
    },
    {
        type: jsp_vas,
        stimulus: storm_config.messages.confidence,
        slider_width: 300,
        labels: ["0% Certain", "100% Certain"],
        prompt: null,
        slider_start: 50,
        stimulus_duration: null,
        trial_duration: storm_config.timing.resp2
    },
    {
        type: jsp_key,
        stimulus: ()=>`<img src=\"${storm_config.url_stim_demo[1]}\" style="width: 100mm; height: 100mm;">`,
        choices: "NO_KEYS",
        trial_duration: 3000
    },

    /**************************************************************************
     * Main Experiment Trials
     */
    {
        timeline: [
            {
                type: jsp_key,
                // TODO: Randomize blur levels.
                stimulus: ()=>`<img src=\"${storm_config.url_stimuli}${jsPsych.evaluateTimelineVariable("image_id")}\" style="width: 100mm; height: 100mm; filter: blur(5px);">`,
                choices: "NO_KEYS",
                trial_duration: storm_config.timing.stim
            },
            {
                type: jsp_txt,
                questions: [{prompt: storm_config.messages.guess}]
            },
            {
                type: jsp_vas,
                stimulus: storm_config.messages.confidence,
                slider_width: 300,
                labels: ["0% Certain", "100% Certain"],
                prompt: null,
                slider_start: 50,
                stimulus_duration: null,
                trial_duration: storm_config.timing.resp2
            },
            // TODO: Commit this section to another branch.
            {
                type: jsp_key,
                // TODO: Decide whether to show the clarified image.
                // The advantage of this is that norming partipants have the
                // opportunity to experience curiosity relief; potentially boosted
                // engagement. We may also observe drift in confidence ratings if
                // participants calibrate to this feedback.
                stimulus: ()=>`<img src=\"${storm_config.url_stimuli2}${jsPsych.evaluateTimelineVariable("image_id")}\" style="width: 100mm; height: 100mm;">`,
                choices: "NO_KEYS",
                trial_duration: 3000
            },
        ],
        timeline_variables: storm_stimuli.map((x)=>({image_id: x})),
        sample: {
            type: "with-replacement",
            size: storm_config.trials
        }
    }
]
};