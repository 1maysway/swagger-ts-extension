import {resolveJSONReference} from "../shared/utils";
import {getCurrentTab} from "./utils";


const handleResponse = async (details: chrome.webRequest.WebResponseCacheDetails) => {
    const url = new URL(details.url);
    console.log(url.toString())
    if (details.statusCode === 200 && url.searchParams.get('swg-ts-skip') !== 'true') {
        url.searchParams.set('swg-ts-skip', 'true');
        fetch(url)
            .then(response => response.text())
            .then(async responseData => {
                const data = await JSON.parse(responseData);
                const tab = await getCurrentTab();
                const docs_data = resolveJSONReference(data, data);

                const other = {
                    kittenSrc: chrome.runtime.getURL("images/kitten.jpeg"),
                }

                chrome.tabs.sendMessage(tab.id, {
                    args: [data, other],
                });

                // chrome.scripting.executeScript({
                //     target: {tabId: tab.id, allFrames: true},
                //     func: docs,
                //     world: 'MAIN',
                //     args: [docs_data, other],
                // });
            })
            .catch(error => {
                console.error(error);
            });
        const other = {
            kittenSrc: chrome.runtime.getURL("images/kitten.jpeg"),
        }
        const tab = await getCurrentTab();
        chrome.tabs.sendMessage(tab.id, {
            args: [url, other],
            action: 'SWGTS_start'
        });
    }
}

chrome.webRequest.onCompleted.addListener(handleResponse, {
    urls: ["*://*/*/api-docs", "*://*/*/swagger.json"]
})