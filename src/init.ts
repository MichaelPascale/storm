/* init.ts
 * Defines a jspsych experiment, loads plugins, etc.
 *
 * Copyright (c) 2026, Michael P. Pascale <mpascale@bu.edu>
 * SPDX-License-Identifier: MIT
 * 
 * Last modified: 2026-11-03
 */

import {initJsPsych} from 'jspsych';
import jsp_preload from '@jspsych/plugin-preload';
import jsp_fullscr from '@jspsych/plugin-fullscreen';
import jsp_ins from '@jspsych/plugin-instructions';
import jsp_txt from '@jspsych/plugin-survey-text';
import jsp_img from '@jspsych/plugin-html-keyboard-response';
import jsp_key from '@jspsych/plugin-html-keyboard-response';
import jsp_vas from '@jspsych/plugin-html-slider-response';

import storm_config from "./config.json" with {type: "json"};
import storm_stimuli from "./stimuli.json" with {type: "json"};

console.log(BUILD);
document.title = storm_config.webtitle ?? storm_config.name;

if (PRODUCTION) {
    // Prevent access on non-HTTPS connections, and ensure crypto is available.
    if (!window.isSecureContext)
        throw Error("Application not secure.");

    // Prevent accidental reloading.
    window.addEventListener("beforeunload", (event) => {
        event.preventDefault();
    });
}

const jsPsych = initJsPsych({
    on_trial_finish: function(data: any) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:8000/save_file.php');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            if(xhr.status != 200){
                data.displayData();
            }
        };
        xhr.send(JSON.stringify({item: "trials", filedata: jsPsych.data.get().csv()}));
        //xhr.send(JSON.stringify({item: "interactions", filedata: jsPsych.data.getInteractionData().csv()}));
    },
    on_finish: function() {
        if (storm_config.url_redirect)
            window.location.replace(storm_config.url_redirect + window.location.search)
    },
    }
});

const timeline: any[] = [];

timeline.push({ 
    type: jsp_preload, 
    // auto_preload: true,
    images: storm_stimuli.map((x) => storm_config.url_stimuli + x),
    message: storm_config.messages.loading,
    show_progress_bar: true ,
    continue_after_error: false,
    show_detailed_errors: !PRODUCTION,
    error_message: storm_config.messages.error
} )

if (PRODUCTION) {
    timeline.push({
        type: jsp_fullscr,
        fullscreen_mode: true,
        message: storm_config.messages.fullscreen,
        button_label: "Begin Experiment",
        delay_after: 1500
    });
}

for (let i = 0; i < 10; i++) {
    // TODO: For now these are hard-coded, but it would be nice if there was
    // flexibility to read common types from a study configuration file.
    timeline.push([
        {
            type: jsp_key,
            stimulus:  `<img src=\"${storm_config.url_stimuli}${storm_stimuli[i+1]}\">`,
            choices: "NO_KEYS",
            trial_duration: storm_config.timing.stim
        },
        {
            type: jsp_txt,
            questions: [
                {prompt: "What is your <b>best guess</b> for the name of the object?"},
            ]
        },
        {
            type: jsp_vas,
            stimulus: "How confident are you in your guess?",
            slider_width: 300,
            labels: ["0% Certain", "100% Certain"],
            prompt: null,
            slider_start: 50,
            stimulus_duration: null,
            trial_duration: storm_config.timing.resp2
        }
    ]);
}

if (PRODUCTION)
    timeline.push({type: jsp_fullscr, fullscreen_mode: false});

jsPsych.run(timeline);
