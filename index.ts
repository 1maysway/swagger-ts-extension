import axios from "axios";
import {getTypescript} from "./utils";
import {Entity__Type} from "./types";

interface JsonData {
    [key: string]: any;
}

function resolveJSONReference(data: JsonData, rootData: JsonData): JsonData {
    if (typeof data === 'object' && data !== null) {
        if (data['$ref']) {
            const referencePath = data['$ref'].split('#');
            const definitions = referencePath[1].split('/').filter(Boolean).reduce((obj: any, key: string) => {
                if (obj && obj[key]) {
                    return obj[key];
                } else {
                    return undefined;
                }
            }, rootData);

            if (definitions !== undefined) {
                return definitions;
            }
        } else {
            for (const key in data) {
                data[key] = resolveJSONReference(data[key], rootData);
            }
        }
    }
    return data;
}

axios.get('https://dnevnik-dev-k8s.mos.ru/sw/plan/v2/api-docs').then(async (res) => {
    const a = getTypescript(resolveJSONReference(res.data, res.data).paths['/jersey/api/lesson_plans/{plan_id}'].put.responses['200'].schema as Entity__Type);

    // @ts-ignore
    // console.log(a.find(a => a.name === "ChangeLog"));
    console.log(a);
})