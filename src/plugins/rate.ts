/* rate.ts
 * Modification of the slider plugin to change the stimulus after responding.
 * 
 * Derived from jsPsych/packages/plugin-html-slider-response/src/index.ts
 * Copyright (c) 2014-2022 Joshua R. de Leeuw 
 * SPDX-License-Identifier: MIT
 * 
 * Last modified: 2026-11-12
 */

import { JsPsych, type JsPsychPlugin, ParameterType, type TrialType } from "jspsych";

import { version } from "../../package.json";

const info = <const>{
  name: "plugin-rate",
  version: version,
  parameters: {
    stimulus: {
      type: ParameterType.HTML_STRING,
      default: undefined,
    },
    min: {
      type: ParameterType.INT,
      default: 0,
    },
    max: {
      type: ParameterType.INT,
      default: 100,
    },
    slider_start: {
      type: ParameterType.INT,
      default: 50,
    },
    step: {
      type: ParameterType.INT,
      default: 1,
    },
    labels: {
      type: ParameterType.HTML_STRING,
      default: [],
      array: true,
    },
    slider_width: {
      type: ParameterType.INT,
      default: null,
    },
    button_label: {
      type: ParameterType.STRING,
      default: "Continue",
      array: false,
    },
    require_movement: {
      type: ParameterType.BOOL,
      default: false,
    },
    prompt: {
      type: ParameterType.HTML_STRING,
      default: null,
    },
    stimulus_duration: {
      type: ParameterType.INT,
      default: null,
    },
    trial_duration: {
      type: ParameterType.INT,
      default: null,
    },
    response_ends_trial: {
      type: ParameterType.BOOL,
      default: true,
    },
  },
  data: {
    rt: {
      type: ParameterType.INT,
    },
    response: {
      type: ParameterType.INT,
    },
    stimulus: {
      type: ParameterType.HTML_STRING,
    },
    slider_start: {
      type: ParameterType.INT,
    },
  }
};

type Info = typeof info;

class jsp_plugin_rate implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    // half of the thumb width value from jspsych.css, used to adjust the label positions
    var half_thumb_width = 7.5;

    var html = '<div id="jspsych-html-slider-response-wrapper" style="margin: 100px 0px;">';
    html += '<div id="jspsych-html-slider-response-stimulus">' + trial.stimulus + "</div>";
    html +=
      '<div class="jspsych-html-slider-response-container" style="position:relative; margin: 0 auto 3em auto; ';
    if (trial.slider_width !== null) {
      html += "width:" + trial.slider_width + "px;";
    } else {
      html += "width:auto;";
    }
    html += '">';
    html +=
      '<input type="range" class="jspsych-slider" value="' +
      trial.slider_start +
      '" min="' +
      trial.min +
      '" max="' +
      trial.max +
      '" step="' +
      trial.step +
      '" id="jspsych-html-slider-response-response"></input>';
    html += "<div>";
    for (var j = 0; j < trial.labels.length; j++) {
      var label_width_perc = 100 / (trial.labels.length - 1);
      var percent_of_range = j * (100 / (trial.labels.length - 1));
      var percent_dist_from_center = ((percent_of_range - 50) / 50) * 100;
      var offset = (percent_dist_from_center * half_thumb_width) / 100;
      html +=
        '<div style="border: 1px solid transparent; display: inline-block; position: absolute; ' +
        "left:calc(" +
        percent_of_range +
        "% - (" +
        label_width_perc +
        "% / 2) - " +
        offset +
        "px); text-align: center; width: " +
        label_width_perc +
        '%;">';
      html += '<span style="text-align: center; font-size: 80%;">' + trial.labels[j] + "</span>";
      html += "</div>";
    }
    html += "</div>";
    html += "</div>";
    html += "</div>";

    if (trial.prompt !== null) {
      html += trial.prompt;
    }

    add submit button
    html +=
      '<button id="jspsych-html-slider-response-next" class="jspsych-btn" ' +
      (trial.require_movement ? "disabled" : "") +
      ">" +
      trial.button_label +
      "</button>";

    display_element.innerHTML = html;

    var response = {
      rt: null,
      response: null,
    };

    if (trial.require_movement) {
      const enable_button = () => {
        display_element.querySelector<HTMLInputElement>(
          "#jspsych-html-slider-response-next"
        ).disabled = false;
      };

      display_element
        .querySelector("#jspsych-html-slider-response-response")
        .addEventListener("mousedown", enable_button);

      display_element
        .querySelector("#jspsych-html-slider-response-response")
        .addEventListener("touchstart", enable_button);

      display_element
        .querySelector("#jspsych-html-slider-response-response")
        .addEventListener("change", enable_button);
    }
    
    const end_trial = () => {
      // save data
      var trialdata = {
        rt: response.rt,
        stimulus: trial.stimulus,
        slider_start: trial.slider_start,
        response: response.response,
      };

      // next trial
      this.jsPsych.finishTrial(trialdata);
    };

    display_element
      .querySelector("#jspsych-html-slider-response-next")
      .addEventListener("click", () => {
        // measure response time
        var endTime = performance.now();
        response.rt = Math.round(endTime - startTime);
        response.response = display_element.querySelector<HTMLInputElement>(
          "#jspsych-html-slider-response-response"
        ).valueAsNumber;

        if (trial.response_ends_trial) {
          end_trial();
        } else {
          display_element.querySelector<HTMLButtonElement>(
            "#jspsych-html-slider-response-next"
          ).disabled = true;
        }
      });

    if (trial.stimulus_duration !== null) {
      this.jsPsych.pluginAPI.setTimeout(() => {
        display_element.querySelector<HTMLElement>(
          "#jspsych-html-slider-response-stimulus"
        ).style.visibility = "hidden";
      }, trial.stimulus_duration);
    }

    // end trial if trial_duration is set
    if (trial.trial_duration !== null) {
      this.jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
    }

    var startTime = performance.now();
  }

}

export default jsp_plugin_rate;