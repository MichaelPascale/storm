/* ident.ts
 * JsPsych plugin to record a data header including information
 * about the browser, participant, parameters, etc.
 *
 * Copyright (c) 2026, Michael P. Pascale <mpascale@bu.edu>
 * SPDX-License-Identifier: MIT
 * 
 * Last modified: 2026-11-12
 */

import { JsPsych, type JsPsychPlugin, ParameterType, type TrialType } from "jspsych";

const info = <const>{
  name: "plugin-ident",
  version: VERSION,
  parameters: {
    session: {
        type: ParameterType.STRING,
        default: null
    },
    date: {
        type: ParameterType.STRING,
        default: (new Date()).toISOString()
    },
    params: {
        type: ParameterType.STRING,
        default: window.location.search
    },
    experiment: {
        type: ParameterType.OBJECT,
        default: null
    },
    stimuli: {
        type: ParameterType.OBJECT,
        default: null
    }
  },
  data: {
    build: {
      type: ParameterType.STRING
    },
    version: {
        type: ParameterType.STRING
    },
    jsPsych: {
        type: ParameterType.STRING
    },
    session: {
        type: ParameterType.STRING
    },
    date: {
        type: ParameterType.STRING
    },
    params: {
      type: ParameterType.STRING
    },
    userAgent: {
        type: ParameterType.STRING
    },
    timeZone: {
        type: ParameterType.STRING
    },
    language: {
        type: ParameterType.STRING
    },
    performance: {
        type: ParameterType.OBJECT
    },
    devicePixelRatio: {
        type: ParameterType.FLOAT
    },
    screenWidthPx: {
        type: ParameterType.INT
    },
    screenHeightPx: {
        type: ParameterType.INT
    },
    windowInnerWidthPx: {
        type: ParameterType.INT
    },
    windowInnerHeightPx: {
        type: ParameterType.INT
    },
    colorDepth: {
        type: ParameterType.FLOAT
    },
    screenOrientation: {
        type: ParameterType.STRING
    },
    experiment: {
        type: ParameterType.OBJECT
    },
    stimuli: {
        type: ParameterType.OBJECT
    }
  }
};

type Info = typeof info;

class jsp_plugin_ident implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {

    const data = {
        build: BUILD,
        version: VERSION,
        jsPsych: this.jsPsych.version(),
        session: trial.session,
        date: trial.date,
        params: trial.params,
        userAgent: navigator.userAgent,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        performance: window.performance.getEntriesByType("navigation").map(nav => nav.toJSON()),
        devicePixelRatio: window.devicePixelRatio,
        screenWidthPx: window.screen.width,
        screenHeightPx: window.screen.height,
        windowInnerWidthPx: window.innerWidth,
        windowInnerHeightPx: window.innerHeight,
        colorDepth: window.screen.colorDepth,
        screenOrientation: window.screen.orientation.type,
        experiment: trial.experiment,
        stimuli: trial.stimuli
    };

    this.jsPsych.finishTrial(data);
  }
}

export default jsp_plugin_ident;