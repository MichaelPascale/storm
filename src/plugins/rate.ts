/* rate.ts
 * Modification of the slider plugin. Initially the stimulus is hidden, until the
 * participant responds. Then the stimulus is displayed for an interval or until
 * they click to continue.
 * 
 * Copyright (c) 2026, Michael P. Pascale <mpascale@bu.edu>
 * SPDX-License-Identifier: MIT
 * 
 * Derived from jsPsych/packages/plugin-html-slider-response/src/index.ts
 * Copyright (c) 2014-2022 Joshua R. de Leeuw 
 * SPDX-License-Identifier: MIT
 * 
 * Last modified: 2026-11-12
 */

import { JsPsych, type JsPsychPlugin, ParameterType, type TrialType } from "jspsych";

const info = <const>{
  name: "plugin-rate",
  version: VERSION,
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

  constructor(private jsPsych: JsPsych) { }

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    // half of the thumb width value from jspsych.css, used to adjust the label positions
    var half_thumb_width = 7.5;

    const wrapper = document.createElement("div");
    wrapper.id = "jspsych-html-slider-response-wrapper";
    wrapper.style = "margin: 3em 0px;";

    const stimulus = document.createElement("div");
    stimulus.id = "jspsych-html-slider-response-stimulus";
    stimulus.innerHTML = "<div class=\"storm_box\"><span>?</span></div>"
    stimulus.style = "margin: 3em;"

    const container = document.createElement("div");
    container.classList.add("jspsych-html-slider-response-container");
    container.style = "position:relative; margin: 0 auto 3em auto; width: 100mm";

    const slider = document.createElement("input");
    slider.id = "jspsych-html-slider-response-response";
    slider.classList.add("jspsych-slider");
    slider.type = "range";
    slider.value = trial.slider_start?.toString() || "0";
    slider.min = trial.min?.toString() || "0";
    slider.max = trial.max?.toString() || "100";
    slider.step = trial.step?.toString() || "1";

    const labels = document.createElement("div");
    if (trial.labels) {
      for (let i = 0; i < trial.labels.length; i++) {
        const label_width_perc = 100 / (trial.labels.length - 1);
        const percent_of_range = i * (100 / (trial.labels.length - 1));
        const percent_dist_from_center = ((percent_of_range - 50) / 50) * 100;
        const offset = (percent_dist_from_center * half_thumb_width) / 100;

        const el = document.createElement("div");
        el.style = "border: 1px solid transparent; display: inline-block; position: absolute; " +
          `left:calc(${percent_of_range}% - (${label_width_perc}% / 2) - ${offset}px);` +
          `text-align: center; width: ${label_width_perc}%;`;


        el.innerHTML = "<span style=\"text-align: center; font-size: 80%;\">" + trial.labels[i] + "</span>";
        labels.appendChild(el);
      }
    }

    if (trial.prompt) {
      const prompt = document.createElement("div");
      prompt.innerHTML = trial.prompt
      wrapper.appendChild(prompt);
    }

    wrapper.appendChild(container);
    container.appendChild(slider);
    container.appendChild(labels);
    wrapper.appendChild(stimulus);

    const button = document.createElement("button");
    button.id = "jspsych-html-slider-response-next";
    button.classList.add("jspsych-btn");
    if (trial.require_movement)
      button.disabled = true;
    button.innerHTML = trial.button_label || "";

    display_element.appendChild(wrapper);
    display_element.appendChild(button);

    const response = {
      rt: NaN,
      response: NaN,
    };

    if (trial.require_movement) {
      const enable_button = () => { button.disabled = false; };
      slider.addEventListener("mousedown", enable_button);
      slider.addEventListener("touchstart", enable_button);
      slider.addEventListener("change", enable_button);
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

    button.addEventListener("click", () => {
      // measure response time
      var endTime = performance.now();
      response.rt = Math.round(endTime - startTime);
      slider.valueAsNumber;

      if (trial.response_ends_trial) {
        end_trial();
      } else {
        button.disabled = true;
      }
    });

    if (typeof trial.stimulus_duration === "number") {
      this.jsPsych.pluginAPI.setTimeout(() => {
        stimulus.style.visibility = "hidden";
      }, trial.stimulus_duration);
    }

    // end trial if trial_duration is set
    if (typeof trial.trial_duration === "number") {
      this.jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
    }

    var startTime = performance.now();
  }

}

export default jsp_plugin_rate;