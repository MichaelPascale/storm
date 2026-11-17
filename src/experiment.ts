/* experiment.ts
 * Define the jsPsych experiment timeline.
 *
 * Copyright (c) 2026, Michael P. Pascale <mpascale@bu.edu>
 * SPDX-License-Identifier: MIT
 * 
 * Last modified: 2026-11-17
 */

import {JsPsych, type TrialType} from "jspsych";
import jsp_ins from '@jspsych/plugin-instructions';
import jsp_txt from '@jspsych/plugin-survey-text';
import jsp_key from '@jspsych/plugin-html-keyboard-response';
import jsp_vas from '@jspsych/plugin-html-slider-response';
import jsp_plugin_rate from "./plugins/rate";
import jsp_plugin_guess from "./plugins/guess";

import storm_config from "./config.json" with {type: "json"};
import storm_stimuli from "./stimuli.json" with {type: "json"};
import storm_order from "./order.json" with {type: "json"};

export default function (jsPsych: JsPsych, params: URLSearchParams, stimuli: string[]) {

    const order_index = Number.parseInt(params.get("ord") || "0");
    if (Number.isNaN(order_index) || order_index < 0 || order_index >= storm_order.length)
        throw Error("Invalid order parameter.");

    const order = storm_order[order_index]?.map((i)=>storm_config.random.blur[i-1]);
    if (order == undefined || order.length != stimuli.length)
        throw Error("Invalid orderfile.");

    // Assign trial variables according to randomization table.
    let trial_variables: any[] = [];

    for (let i = 0; i < stimuli.length; i++) {
            trial_variables.push({image_uri: stimuli[i], blur: order[i]})
    }

    // Fully randomize the trial order.
    trial_variables = jsPsych.randomization.shuffle(trial_variables);

    // Limit the number of trials to that defined in the configuration file.
    // FIXME: This does not respect the randomization table.
    trial_variables = trial_variables.slice(0,storm_config.trials);
    trial_variables = trial_variables.map((tvar, i)=>({...tvar, trialGroup: i}));

    // Insert attention checks at the 1/3 and 2/3 completion marks.
    trial_variables.splice(Math.floor(storm_config.trials/3), 0, {image_uri: storm_config.url_stimuli.special[0], blur: 25, trialGroup: "attchk1"})
    trial_variables.splice(Math.floor(storm_config.trials*2/3), 0, {image_uri: storm_config.url_stimuli.special[0], blur: 0, trialGroup: "attchk2"})

    if (!PRODUCTION)
        console.log(trial_variables);

    const fixation = {
        type: jsp_key,
        stimulus: '<div style="font-size:10mm">+</div>',
        choices: 'NO_KEYS',
        trial_duration: storm_config.timing.fixation,
        on_load: ()=>{document.body.style.cursor = "none"},
        data: {
            eventname: "fixation"
        }
    };

    const onset_fixation = {
        ...fixation,
        on_finish: (data: any)=>{
            data.stimfile = jsPsych.evaluateTimelineVariable("image_uri");
            data.blur = jsPsych.evaluateTimelineVariable("blur");
            data.trialGroup = jsPsych.evaluateTimelineVariable("trialGroup");
        }
    }


    // NOTE: This section is handling various limitations of jsPsych by adding to
    // the HTML elements when the on_load event is called. Might consider rewrite
    // in a more flexible framework or plain JS.

    // Modify the instruction screens with a delay before the next button becomes available.
    function modInstrDelay() {
        if (!PRODUCTION)
            return;

        const button = document.getElementById("jspsych-instructions-next") as HTMLButtonElement;
        button.disabled = true;
        jsPsych.pluginAPI.setTimeout(()=>{button.disabled = false;}, storm_config.timing.instr);
    }

return [
    /**************************************************************************
     * Instructions
     */
    {
        timeline: [
            {
                type: jsp_ins,
                pages: storm_config.messages.instructions[0],
                button_label_next: "Continue",
                show_clickable_nav: true,
                allow_keys: false,
                on_page_change: ()=>{modInstrDelay()},
                on_load: ()=>{modInstrDelay()}
            },
            {
                type: jsp_plugin_guess,
                stimulus: ()=>`${storm_config.url_stimuli.location + storm_config.url_stimuli.special[0]}`,
                style: "filter: blur(2px);",
                prompt_response: storm_config.messages.guess,
                placeholder_response: "duck",
                prompt_rating: storm_config.messages.confidence,
                labels: storm_config.messages.confidence_labels,
                fixation_duration: storm_config.timing.fixation,
                stimulus_duration: storm_config.timing.stim,
                require_movement: true,
                data: {
                    eventname: "guess_confidence"
                }
            },
            {
                type: jsp_plugin_rate,
                stimulus: ()=>[
                    `${storm_config.url_stimuli.location + storm_config.url_stimuli.special[0]}`,
                    `${storm_config.url_stimuli.location + storm_config.url_stimuli.special[1]}`
                ],
                style: ["filter: blur(2px);", ""],
                prompt: storm_config.messages.curiosity,
                labels: storm_config.messages.curiosity_labels,
                slider_start: 50,
                stimulus_duration: storm_config.timing.clear,
                data: {
                    eventname: "rate_curiosity"
                }
            },
            fixation,
            {
                type: jsp_ins,
                pages: storm_config.messages.instructions[1],
                button_label_next: "Continue",
                show_clickable_nav: true,
                allow_keys: false,
                on_page_change: ()=>{modInstrDelay()},
                on_load: ()=>{document.body.style.cursor = "auto"; modInstrDelay();}
            }
        ]
    },
    /**************************************************************************
     * Main Experiment Trials
     */
    {
        timeline: [
            {
                type: jsp_plugin_guess,
                stimulus: ()=>{
                    const id: string = jsPsych.evaluateTimelineVariable("image_uri");
                    const blur: number = jsPsych.evaluateTimelineVariable("blur");
                    const url = storm_config.url_stimuli.location +
                        (id.indexOf("/") < 0 ? storm_config.url_stimuli.directories[0] + "/" + id : id);

                    if (!PRODUCTION)
                        console.log("image: " + id + ", blur: " + blur);

                    return url;
                },
                style: ()=>`filter: blur(${jsPsych.evaluateTimelineVariable("blur")}px);`,
                prompt_response: storm_config.messages.guess,
                prompt_rating: storm_config.messages.confidence,
                labels: storm_config.messages.confidence_labels,
                fixation_duration: storm_config.timing.fixation,
                stimulus_duration: storm_config.timing.stim,
                require_movement: true,
                data: {
                    eventname: "guess_confidence"
                },
                on_finish: (data: any)=>{
                    data.stimfile = jsPsych.evaluateTimelineVariable("image_uri");
                    data.blur = jsPsych.evaluateTimelineVariable("blur");
                    data.trialGroup = jsPsych.evaluateTimelineVariable("trialGroup");
                }
            },
            {
                type: jsp_plugin_rate,
                stimulus: ()=>{
                    let id: string = jsPsych.evaluateTimelineVariable("image_uri");

                    // Standard ID or path?
                    if (id.indexOf("/") < 0)
                        return storm_config.url_stimuli.directories.map((dir)=>storm_config.url_stimuli.location + dir + "/" + id);

                    // If path, then assume it's a demo image.
                    if (id.indexOf("demo") != 0)
                        throw Error("Custom image path not implemented other than for demo image.");
                    
                    id = storm_config.url_stimuli.location + id;

                    return [id, id.replace("shine", "desat")];
                },
                style: ()=>[`filter: blur(${jsPsych.evaluateTimelineVariable("blur")}px);`, ""],
                prompt: storm_config.messages.curiosity,
                labels: storm_config.messages.curiosity_labels,
                slider_start: 50,
                stimulus_duration: storm_config.timing.clear,
                data: {
                    eventname: "rate_curiosity"
                },
                on_finish: (data: any)=>{
                    data.stimfile = jsPsych.evaluateTimelineVariable("image_uri");
                    data.blur = jsPsych.evaluateTimelineVariable("blur");
                    data.trialGroup = jsPsych.evaluateTimelineVariable("trialGroup");
                }
            }
        ],
        timeline_variables: trial_variables
    }
]
};