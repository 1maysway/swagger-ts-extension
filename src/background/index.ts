import { callbacks } from './onMessage';


chrome.runtime.onMessage.addListener(async(message: { action: string, args: any[] }, sender, sendResponse) => {
    try {
        if (!message.action.startsWith('SWGTS_')) return;

        const func = callbacks[message.action.slice(6)];

        if (func) {
            sendResponse(func(...message.args));
        }
    } catch (e) {
        console.error(e);
    }
});