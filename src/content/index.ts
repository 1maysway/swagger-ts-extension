import './style.scss';
import {getTypescript, resolveJSONReference} from "../shared/utils";
import {Entity__Type} from "../shared/types";
import {leftHtml} from "./utils";

import {callbacks} from "./onMessage";

chrome.runtime.onMessage.addListener(async(message: { action: string, args: any[] }) => {
    try {
        if (!message.action.includes('SWGTS')) return;

        const func = callbacks[message.action.slice(6)];

        if (func) {
            func(...message.args)
        }
    } catch (e) {
        console.error(e);
    }
});

// chrome.runtime.onMessage.addListener(async (message) => {
//     console.log("MESSAGE")
//     // @ts-ignore
//     start(...message.args)
// })
