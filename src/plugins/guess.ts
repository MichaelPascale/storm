/* guess.ts
 * Prompt the pariticpant for their confidence in a text response to a stimulus.
 * 
 * Copyright (c) 2026, Michael P. Pascale <mpascale@bu.edu>
 * SPDX-License-Identifier: MIT
 * 
 * Derived from jsPsych/packages/plugin-html-slider-response/src/index.ts
 * Copyright (c) 2014-2022 Joshua R. de Leeuw 
 * SPDX-License-Identifier: MIT
 * 
 * Last modified: 2026-11-17
 */

import { JsPsych, type JsPsychPlugin, ParameterType, type TrialType } from "jspsych";

const info = <const>{
  name: "plugin-guess",
  version: VERSION,
  parameters: {
    stimulus: {
      type: ParameterType.HTML_STRING,
      default: ""
    },
    style: {
      type: ParameterType.STRING,
      default: null
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
      default: 0,
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
    button_label: {
      type: ParameterType.STRING,
      default: "Continue",
    },
    require_movement: {
      type: ParameterType.BOOL,
      default: false,
    },
    prompt_response: {
      type: ParameterType.HTML_STRING,
      default: null,
    },
    prompt_rating: {
      type: ParameterType.HTML_STRING,
      default: null
    },
    placeholder_response: {
      type: ParameterType.STRING,
      default: null
    },
    show_value: {
      type: ParameterType.BOOL,
      default: true
    },
    fixation_duration: {
      type: ParameterType.INT,
      default: 0
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
      type: ParameterType.STRING,
    },
    rating: {
      type: ParameterType.INT
    },
    stimulus: {
      type: ParameterType.HTML_STRING,
    },
    slider_start: {
      type: ParameterType.INT,
    },
    detail: {
      type: ParameterType.STRING
    }
  }
};

type Info = typeof info;

class jsp_plugin_guess implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) { }

  trial(display_element: HTMLElement, trial: TrialType<Info>) {

    const presentation = document.createElement("div");
    presentation.classList.add("storm-presentation");

    const fixation = document.createElement("span");
    fixation.innerText = "+";
    fixation.style.fontSize = "10mm";
    fixation.hidden = true;
    presentation.appendChild(fixation);

    console.log(trial.style);
    const stim = document.createElement("img");
    if (trial.stimulus) {
      stim.src = trial.stimulus;
      stim.classList.add("storm-image");
      if (trial.style)
        stim.style = trial.style || "";
      stim.hidden = true;
      presentation.appendChild(stim);
    }

    /* Response Form ************************************************/
    const responseform = document.createElement("form");
    responseform.autocomplete = "off";
    responseform.hidden = true;

    // Response (text)
    const q1block = document.createElement("div");
    q1block.style.margin = "0 auto 3em auto";
    const q1input = document.createElement("input");
    q1input.type = "text";
    q1input.name = "q1input";
    q1input.autofocus = true;
    if (trial.placeholder_response)
      q1input.placeholder = trial.placeholder_response || "";

    let q1rt: number = NaN;
    q1input.addEventListener("input", ()=>{q1rt = Math.round(performance.now() - startTime)}); 

    q1block.innerHTML = trial.prompt_response || "";
    q1block.appendChild(q1input);

    // Rating (VAS)
    const q2block = document.createElement("div");
    q2block.style.marginBottom = "3em";
    const q2resp = document.createElement("div");
    q2resp.style = "position: relative; margin: 0 auto 3em auto; width: 100mm";
    const q2input = document.createElement("input");
    q2input.classList.add("jspsych-slider");
    q2input.type = "range";
    q2input.value = trial.slider_start?.toString() || "0";
    q2input.min = trial.min?.toString() || "0";
    q2input.max = trial.max?.toString() || "100";
    q2input.step = trial.step?.toString() || "1";

    const labels = document.createElement("div");
    const half_thumb_width = 7.5;
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
    q2resp.appendChild(q2input);
    q2resp.appendChild(labels);

    if (trial.show_value) {
      const label = document.createElement("span");
      label.innerText = `${trial.slider_start || 0}%`;
      q2resp.appendChild(label);
      q2input.addEventListener("input", () => { label.innerText = `${q2input.value}%` });
    }

    let q2rt: number = NaN;
    q2input.addEventListener("change", ()=>{q2rt = Math.round(performance.now() - startTime)}); 

    q2block.innerHTML = trial.prompt_rating || "";
    q2block.appendChild(q2resp);

    // Submit
    const button = document.createElement("button");
    button.classList.add("jspsych-btn");
    button.type = "submit";
    if (trial.require_movement)
      button.disabled = true;
    button.innerHTML = trial.button_label || "";

    responseform.appendChild(q1block);
    responseform.appendChild(q2block);
    responseform.appendChild(button);

    responseform.addEventListener("submit", (evt) => {
      evt.preventDefault();
      const rt = Math.round(performance.now() - startTime);

      this.jsPsych.finishTrial({
        rt: rt,
        response: q1input.value,
        rating: q2input.valueAsNumber,
        slider_start: trial.slider_start,
        detail: JSON.stringify({
          response_final_mod_rt: q1rt,
          rating_final_mod_rt: q2rt 
        })
      });
    });

    /* Event Timing *************************************************/
    document.body.style.cursor = "none";
    display_element.appendChild(presentation);
    display_element.appendChild(responseform);

    const timeout = this.jsPsych.pluginAPI.setTimeout;

    function onfixation(){

      if (trial.fixation_duration) {
        fixation.hidden = false;
        timeout(onstimulus, trial.fixation_duration);
        return;
      }

      onstimulus();
    }

    function onstimulus(){
      fixation.hidden = true;

      if (trial.stimulus_duration) {
        stim.hidden = false;
        timeout(onresponse, trial.stimulus_duration);
        return;
      }

      onresponse();
    }

    function onresponse(){
      presentation.hidden = true;
      responseform.hidden = false;
      document.body.style.cursor = "auto";
      startTime = performance.now();
    }

    onfixation();

    if (trial.require_movement) {
      const enable_button = () => { button.disabled = false; };
      q1input.addEventListener("mousedown", enable_button);
      q1input.addEventListener("touchstart", enable_button);
      q1input.addEventListener("change", enable_button);
    }

    if (typeof trial.trial_duration === "number") {
      this.jsPsych.pluginAPI.setTimeout(()=>{
        this.jsPsych.pluginAPI.clearAllTimeouts();
        this.jsPsych.finishTrial({
          rt: NaN,
          response: q1rt ? q1input.value || "" : "",
          rating: q2rt ? q2input.valueAsNumber || NaN : NaN,
          slider_start: trial.slider_start,
          detail: JSON.stringify({
            response_final_mod_rt: q1rt,
            rating_final_mod_rt: q2rt
          })
        });
      }, trial.trial_duration);
    }

    var startTime = NaN;
  }

}

export default jsp_plugin_guess;