/* init.ts
 * Defines a jspsych experiment, loads plugins, etc.
 *
 * Copyright (c) 2026, Michael P. Pascale <mpascale@bu.edu>
 * SPDX-License-Identifier: MIT
 * 
 * Last modified: 2026-11-11
 */

import {initJsPsych} from 'jspsych';
import jsp_browser from '@jspsych/plugin-browser-check';
import jsp_preload from '@jspsych/plugin-preload';
import jsp_fullscr from '@jspsych/plugin-fullscreen';
import jsp_callfn  from '@jspsych/plugin-call-function';

import storm_config from "./config.json" with {type: "json"};
import storm_stimuli from "./stimuli.json" with {type: "json"};
import {storm_save} from "./data";
import storm_experiment from './experiment';
import jsp_plugin_ident from './plugins/ident';

console.log(BUILD);
document.title = storm_config.webtitle ?? storm_config.name;
const params = new URLSearchParams(window.location.search);

if (PRODUCTION) {
    // Prevent access on non-HTTPS connections, and ensure crypto is available.
    if (!window.isSecureContext)
        throw Error("Application not secure.");

    // Prevent accidental reloading.
    window.addEventListener("beforeunload", (event) => {
        event.preventDefault();
    });
}

const session_id = crypto.randomUUID();

const jsPsych = initJsPsych({
    on_trial_start: (data: any)=>{
        data.time_trial_start=Date.now();
    },
    on_trial_finish: (data: any)=>{
        data.time_trial_finish=Date.now();
    },
    on_finish: function() {
        if (storm_config.url_redirect)
            window.location.replace(storm_config.url_redirect + window.location.search)
    },
    }
});


const timeline: any[] = [];

// Record session information.
timeline.push({
    type: jsp_plugin_ident,
    session: session_id,
    date: () => jsPsych.getStartTime().toISOString(),
    experiment: storm_config
});

// Verify that the participant is using a compatible device and browser.
timeline.push({
    type: jsp_browser,
    inclusion_function: (detected: any) => {
        if (params.has("ignorechecks"))
            return true;
        return ['chrome', 'firefox'].includes(detected.browser) && !detected.mobile;
    },
    exclusion_message: (detected: any) => {
        if (detected.mobile)
            return storm_config.messages.exclude_device;
        
        return storm_config.messages.exclude_browser;
    }
});

// Load the stimuli.
timeline.push({ 
    type: jsp_preload, 
    // auto_preload: true,
    images: [
        storm_config.url_stimuli.directories.flat().map(dir=>storm_stimuli.map(
            stim => storm_config.url_stimuli.location + dir + "/" + stim
        )),
        storm_config.url_stimuli.special.map(uri=>storm_config.url_stimuli.location + uri)
    ].flat(),
    message: storm_config.messages.loading,
    show_progress_bar: true ,
    continue_after_error: false,
    show_detailed_errors: !PRODUCTION,
    error_message: storm_config.messages.error
} )

// Enter fullscreen.
if (PRODUCTION) {
    timeline.push({
        type: jsp_fullscr,
        fullscreen_mode: true,
        message: storm_config.messages.fullscreen,
        button_label: "Begin Experiment",
        delay_after: 1500
    });
}

// All checks have passed. Save the data collected in the initialization trails.
timeline.push({
    type: jsp_callfn,
    async: true,
    func: (done: Function) => {
        storm_save(jsPsych.data.get(), `${session_id}-session`, "json", params.has("local"), done)
    }
});

const experiment_timeline: any[] = storm_experiment(jsPsych, params);
experiment_timeline.push({
    type: jsp_callfn,
    async: true,
    func: (done: Function) => {
        storm_save(jsPsych.data.getLastTimelineData(), `${session_id}-data`, "csv", params.has("local"), done)
    }
})

timeline.push(experiment_timeline);

if (PRODUCTION)
    timeline.push({type: jsp_fullscr, fullscreen_mode: false});

timeline.push({
    type: jsp_callfn,
    async: true,
    func: (done: Function) => {
        storm_save(jsPsych.data.getInteractionData(), `${session_id}-interactions`, "csv", params.has("local"), done)
    }
});

jsPsych.run(timeline);
