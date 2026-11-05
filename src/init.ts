/* init.ts
 * Defines a jspsych experiment, loads plugins, etc.
 *
 * Copyright (c) 2026, Michael P. Pascale <mpascale@bu.edu>
 * SPDX-License-Identifier: MIT
 * 
 * Last modified: 2026-11-05
 */

import {initJsPsych} from 'jspsych';
import jsp_browser from '@jspsych/plugin-browser-check';
import jsp_preload from '@jspsych/plugin-preload';
import jsp_fullscr from '@jspsych/plugin-fullscreen';
import jsp_ins from '@jspsych/plugin-instructions';
import jsp_txt from '@jspsych/plugin-survey-text';
import jsp_img from '@jspsych/plugin-html-keyboard-response';
import jsp_key from '@jspsych/plugin-html-keyboard-response';
import jsp_vas from '@jspsych/plugin-html-slider-response';

import storm_config from "./config.json" with {type: "json"};
import storm_stimuli from "./stimuli.json" with {type: "json"};
import experiment from './experiment';

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
    type: jsp_browser,
    inclusion_function: (detected: any) => {
        return ['chrome', 'firefox'].includes(detected.browser) && !detected.mobile;
    },
    exclusion_message: (detected: any) => {
        if (detected.mobile)
            return storm_config.messages.exclude_device;
        
        return storm_config.messages.exclude_browser;
    }
});

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

timeline.push(experiment(jsPsych));

if (PRODUCTION)
    timeline.push({type: jsp_fullscr, fullscreen_mode: false});

jsPsych.run(timeline);
