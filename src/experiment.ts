/* experiment.ts
 * Define the jsPsych experiment timeline.
 *
 * Copyright (c) 2026, Michael P. Pascale <mpascale@bu.edu>
 * SPDX-License-Identifier: MIT
 * 
 * Last modified: 2026-11-11
 */

import {JsPsych, type TrialType} from "jspsych";
import jsp_ins from '@jspsych/plugin-instructions';
import jsp_txt from '@jspsych/plugin-survey-text';
import jsp_img from '@jspsych/plugin-html-keyboard-response';
import jsp_key from '@jspsych/plugin-html-keyboard-response';
import jsp_vas from '@jspsych/plugin-html-slider-response';
import storm_config from "./config.json" with {type: "json"};
import storm_stimuli from "./stimuli.json" with {type: "json"};
import storm_order from "./order.json" with {type: "json"};

export default function (jsPsych: JsPsych, params: URLSearchParams) {

    const order_index = Number.parseInt(params.get("ord") || "0");
    if (order_index < 0 || order_index >= storm_order.length)
        throw Error("Invalid participant.");

    const order = storm_order[order_index]?.map((i)=>storm_config.random.blur[i-1]);
    if (order == undefined || order.length != storm_stimuli.length)
        throw Error("Invalid orderfile.");

    // Assign trial variables according to randomization table.
    let trial_variables: Array<{image_uri: string | undefined, blur: number | undefined}> = [];

    for (let i = 0; i < storm_stimuli.length; i++) {
            trial_variables.push({image_uri: storm_stimuli[i], blur: order[i]})
    }

    // Fully randomize the trial order.
    trial_variables = jsPsych.randomization.shuffle(trial_variables);

    // Limit the number of trials to that defined in the configuration file.
    // FIXME: This does not respect the randomization table.
    trial_variables = trial_variables.slice(0,storm_config.trials);

    // Insert attention checks at the 1/3 and 2/3 completion marks.
    trial_variables.splice(Math.floor(storm_config.trials/3), 0, {image_uri: storm_config.url_stimuli.special[0], blur: 56})
    trial_variables.splice(Math.floor(storm_config.trials*2/3), 0, {image_uri: storm_config.url_stimuli.special[0], blur: 0})

    if (!PRODUCTION)
        console.log(trial_variables);

return [
    /**************************************************************************
     * Instructions
     */
    {
        timeline: [
        {
            type: jsp_ins,
            pages: storm_config.messages.instructions,
            button_label_next: "Continue",
            show_clickable_nav: true
        },
        {
            type: jsp_key,
            stimulus: ()=>`<img src=\"${storm_config.url_stimuli.location + storm_config.url_stimuli.special[0]}\" style="width: 100mm; height: 100mm; filter: blur(5px);">`,
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
            stimulus: ()=>`<img src=\"${storm_config.url_stimuli.location + storm_config.url_stimuli.special[1]}\" style="width: 100mm; height: 100mm;">`,
            choices: "NO_KEYS",
            trial_duration: 3000
        }
        ]
    },
    /**************************************************************************
     * Main Experiment Trials
     */
    {
        timeline: [
            {
                type: jsp_key,
                // TODO: Randomize blur levels.                
                stimulus: ()=>{
                    const id: string = jsPsych.evaluateTimelineVariable("image_uri");
                    const blur: number = jsPsych.evaluateTimelineVariable("blur");
                    const url = storm_config.url_stimuli.location +
                        (id.indexOf("/") < 0 ? storm_config.url_stimuli.directories[0] + "/" + id : id);

                    if (!PRODUCTION)
                        console.log("image: " + id + ", blur: " + blur);

                    return `<img src=\"${url}\" style="width: 100mm; height: 100mm; filter: blur(${blur}px);">`;
                },
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
                stimulus: ()=>{
                    let id: string = jsPsych.evaluateTimelineVariable("image_uri");
                    if (id.indexOf("demo") == 0)
                        id = id.replace("shine", "desat");
                    const url = storm_config.url_stimuli.location +
                        (id.indexOf("/") < 0 ? storm_config.url_stimuli.directories[1] + "/" + id : id);
                    return `<img src=\"${url}\" style="width: 100mm; height: 100mm;">`;
                },
                choices: "NO_KEYS",
                trial_duration: 3000
            },
        ],
        timeline_variables: trial_variables
    }
]
};