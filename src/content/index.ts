import './style.scss';

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

const start = () => {
    chrome.runtime.sendMessage({ action: 'SWGTS_start', args: [] });
}

start();