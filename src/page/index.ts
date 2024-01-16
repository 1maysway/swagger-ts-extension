import {getTypescript, JsonData, leftHtml, resolveJSONReference} from "../shared/utils";
import {Entity__Type} from "../shared/types";
import {BlockInfo, ElementInfo, OpblockInfo, Other, ResponseInfo} from "./types";
import 'timers-browserify';


window['swagger_ts'] = {};


const start = async (other: Other) => {
    // const docsAPI = await fetch(url)
    //     .then(response => response.text())
    //     .then(async responseData => {
    //         const data = await JSON.parse(responseData);
    //         return data;
    //     })
    //     .catch(error => {
    //         console.error(error);
    //     });
    // const docs = resolveJSONReference(docsAPI, docsAPI);

    const isSwagger = await new Promise((r) => {
        const maxTries = 30;
        const delay = 100;
        let count = 0;
        const intervalId = setInterval(() => {
            const json = window?.['ui']?.spec().toJSON();
            if (json?.loadingStatus === "success") {
                clearInterval(intervalId);
                return r(true);
            }
            if (count >= maxTries) {
                clearInterval(intervalId);
                return r(false);
            }
            count++;
        }, delay);
    })

    // @ts-ignore
    if (!isSwagger) {
        return;
    }

    const docsAPI: JsonData = window['ui'].spec().toJSON().json;
    const docs = resolveJSONReference(docsAPI, docsAPI);

    const getSchema = (info: ResponseInfo) => {
        try {
            return docs.paths[info.path.replace(/\u200B/g,'')][info.method].responses[info.status].schema
                // @ts-ignore
                || Object.values(docs.paths[info.path][info.method]?.responses[info.status]?.content)[0].schema;
        } catch (e) {
            return null;
        }
    }

    const waitForSelector = (selector: string, timeout = 30000,
                             container: Element | Document = document) => {
        return new Promise<Element>((resolve, reject) => {
            const startTime = Date.now();

            const checkSelector = () => {
                const element = container.querySelector(selector) as HTMLElement | null;
                if (element) {
                    resolve(element);
                } else if (Date.now() - startTime >= timeout) {
                    reject(new Error(`Timeout exceeded for selector: ${selector}`));
                }
            };

            const intervalId = setInterval(checkSelector, 100);

            checkSelector();

            const clear = () => {
                clearInterval(intervalId);
            };
            window.addEventListener('beforeunload', clear);
            Promise.resolve().then(clear);
        });
    }
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const BLOCKS: Record<string, ElementInfo> = {};
    const OP_BLOCKS: Record<string, ElementInfo> = {};
    const HIGHLIGHTS: Record<string, ElementInfo> = {};

    const buttonOnClick = (event: Event, info: ResponseInfo) => {
        if (!HIGHLIGHTS[info.id]) {
            const highlight: ElementInfo = {
                open: false,
            }
            HIGHLIGHTS[info.id] = highlight;
        }

        HIGHLIGHTS[info.id].open = !HIGHLIGHTS[info.id].open;

        const targetElement = event.target as HTMLElement;
        if (HIGHLIGHTS[info.id].open) {
            targetElement.classList.add('kitten-pressed');
        } else {
            targetElement.classList.remove('kitten-pressed');
        }

        const example = document.querySelector(`.response div#${info.id}`);

        if (!HIGHLIGHTS[info.id].open) {
            const swgCodeArea = example.querySelector('div.kitten-hide');
            swgCodeArea.classList.remove('kitten-hide');

            const highlight = example.querySelector('.kitten-highlight');
            highlight.classList.add('kitten-hide');
            return;
        }

        const currentHighlight = example.querySelector('.kitten-highlight.kitten-hide');
        const swgCodeArea = example.querySelector('div:not([class]), div.highlight');

        if (currentHighlight) {
            currentHighlight.classList.remove('kitten-hide');
            swgCodeArea.classList.add('kitten-hide');
            return;
        }

        swgCodeArea.classList.add('kitten-hide', 'highlight');

        const highlight = getHighLight(info);
        example.appendChild(highlight);
    }

    const getHighLight = (info: ResponseInfo) => {
        const root = document.createElement('div');
        const pre = document.createElement('pre');
        const code = document.createElement('code');

        const schema = getSchema(info);
        const ts = schema ? getTypescript(schema as Entity__Type, {
            init: true,
            export: true,
        }) : 'NO SCHEMA';
        code.innerHTML = ts;

        pre.classList.add('microlight');

        pre.appendChild(code);
        root.appendChild(pre);
        root.className = 'kitten-highlight';

        return root;
    }

    const getButton = (info: ResponseInfo) => {
        const image = document.createElement('img');
        image.src = other.kittenSrc;

        const buttonLi = document.createElement('li');
        buttonLi.className = 'tabitem kitten-button_li';

        const button = document.createElement('div');
        button.appendChild(image);
        button.className = 'kitten-button';
        button.id = info.id;
        button.addEventListener('click', e => buttonOnClick(e, info));

        buttonLi.appendChild(button);

        return buttonLi;
    }

    const opblockOnClick = async (event: Event, info: OpblockInfo, element: Element) => {
        await delay(100);
        OP_BLOCKS[info.id].open = Array.from(element.classList).includes('is-open');
        if (!OP_BLOCKS[info.id].open) {
            for (const key in HIGHLIGHTS) {
                if (key.includes(info.id)) {
                    delete HIGHLIGHTS[key];
                }
            }
            return;
        }

        await delay(100);
        const responses = element.querySelectorAll('tr.response');

        for (let i = 0; i < responses.length; i++) {
            try {
                const response = responses[i];
                const id = info.id + `_${i}`;
                const responseInfo: ResponseInfo = {
                    ...info,
                    status: response.querySelector('.response-col_status').innerHTML,
                    id,
                };

                const schema = getSchema(responseInfo);
                const ts = schema ? getTypescript(schema as Entity__Type, {
                    init: true,
                    export: true,
                }) : null;

                if (!ts) {
                    continue;
                }

                const example = await waitForSelector('.response-col_description div:not([class]), div.highlight, div.model-example', 2000, response);
                example.id = id;

                const exampleTab = example.querySelector('.tab');

                if (!exampleTab.querySelector('.kitten-button')) {
                    const button = getButton(responseInfo);
                    exampleTab.appendChild(button);
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
    const blockOnClick = async (event: Event, info: BlockInfo, element: Element) => {
        await delay(100);
        BLOCKS[info.id].open = Array.from(element.classList).includes('is-open');
        if (!BLOCKS[info.id].open) {
            return;
        }

        await delay(100);

        const opblocks = element.querySelectorAll('.opblock');

        for (let i = 0; i < opblocks.length; i++) {
            try {
                const opblock = opblocks[i];
                const id = info.id + `_${i}`;
                const classList = Array.from(opblock.classList);
                const isOpen = classList.includes('is-open');
                const opblockInfo: OpblockInfo = {
                    ...info,
                    method: opblock.querySelector('.opblock-summary .opblock-summary-method').innerHTML.toLowerCase(),
                    path: leftHtml(opblock.querySelector('.opblock-summary .opblock-summary-path a span').innerHTML),
                    id,
                };

                if (!OP_BLOCKS[id]) {
                    const elementInfo: ElementInfo = {
                        open: isOpen,
                    }
                    OP_BLOCKS[id] = elementInfo;
                }

                const blockSummary: HTMLElement = opblock.querySelector('.opblock-summary-control, .opblock-summary');

                blockSummary.addEventListener('click', e => opblockOnClick(e, opblockInfo, opblock));

                if (isOpen) {
                    blockSummary.click();
                    await delay(200);
                    blockSummary.click();
                }
            } catch (e) {
                console.error(e)
            }
        }
    }

    /////////////////////

    const blocks = document.querySelectorAll('.opblock-tag-section');

    for (let i = 0; i < blocks.length; i++) {
        try {
            const block = blocks[i];
            const id = `__${i}`;
            const classList = Array.from(block.classList);
            const isOpen = classList.includes('is-open');
            const info: BlockInfo = {
                name: block.querySelector('.opblock-tag a span').innerHTML,
                id
            }

            if (!BLOCKS[id]) {
                const elementInfo: ElementInfo = {
                    open: isOpen,
                }
                BLOCKS[id] = elementInfo;
            }

            const blockTag: HTMLElement = block.querySelector('.opblock-tag');

            blockTag.addEventListener('click', e => blockOnClick(e, info, block));

            if (isOpen) {
                blockTag.click();
                await delay(200);
                blockTag.click();
            }
        } catch (e) {
            console.error(e)
        }
    }
}

window['swagger_ts'].start = start;