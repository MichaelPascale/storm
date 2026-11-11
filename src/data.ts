/* data.ts
 * Handle data logging, either saving to server or to local file. Note that the
 * jsPsych library itself records most information. This file then handles I/O.
 *
 * Copyright (c) 2026, Michael P. Pascale <mpascale@bu.edu>
 * SPDX-License-Identifier: MIT
 * 
 * Last modified: 2026-11-11
 */

import type { DataCollection } from "jspsych";
import storm_config from "./config.json" with {type: "json"};

function storm_save(data: DataCollection, name: string, type: "csv" | "json" = "csv", local: boolean = false, callback: Function | null) {

    if (local || !storm_config.url_post) {
        data.localSave(type, name + "." + type);
        if (callback)
            callback();
        return;
    }

    http(
        PRODUCTION ? storm_config.url_post : 'http://localhost:8000/save_file.php', 
        {item: name, type: type, filedata: data},
        undefined,
        callback
    );
}

function http(url: URL|string, content: any, method: "GET"|"POST" = "POST", callback: Function | null = null) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            if(xhr.status != 200){
                throw Error("Data could not be saved.");
            }
            if (callback)
                callback()
        };
        xhr.onerror = function() {
            throw Error("Data could not be saved.");
        }
        xhr.send(JSON.stringify(content));
}

export { storm_save };

