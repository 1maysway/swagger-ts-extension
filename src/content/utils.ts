import {urlsForInterception} from "./constants";

export const interceptFetch = () => {
    async function copyRequest(request: Request, url: string) {
        const headers = new Headers(request.headers);
        const contentType = headers.get('content-type');
        let body: BodyInit;

        if (contentType && contentType.includes('application/json')) {
            body = JSON.stringify(await request.clone().json());
        } else {
            body = await request.clone().text();
        }

        const copy = new Request(url, {
            method: request.method,
            headers: headers,
            body: body,
            mode: request.mode,
            credentials: request.credentials,
            cache: request.cache,
            redirect: request.redirect,
            referrer: request.referrer,
            integrity: request.integrity,
        });

        return copy;
    }

    const originalFetch = window.fetch;

    window.fetch = async function(input:  Request | string, init) {
        console.log(input, init);

        let url = typeof input === 'string' ? input : input.url;

        const ufi = urlsForInterception.find(ufi => url.includes(ufi.urlIncludes));
        const res = await originalFetch.call(this, input, init);

        return res
    };
}

export const leftHtml = (str: string) => str.replace(/<[^>]*>/g, '');