import {getCurrentTab} from "./utils";


const start = async () => {
    const other = {
        kittenSrc: chrome.runtime.getURL("images/kitten.jpeg"),
    }

    const tab = await getCurrentTab();

    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: (other) => {
            window['swagger_ts'].start(other);
        },
        world: 'MAIN',
        args: [other]
    });
}

export const callbacks = {
    start,
}