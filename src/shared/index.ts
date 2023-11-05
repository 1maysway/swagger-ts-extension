import axios from "axios";
import {getTypescript, resolveJSONReference} from "./utils";
import {Entity__Type} from "./types";


axios.get('https://dnevnik-dev-k8s.mos.ru/sw/plan/v2/api-docs').then(async (res) => {
    const prs = resolveJSONReference(res.data, res.data).paths['/jersey/api/parallel_curricula'].get.responses['200'].schema as Entity__Type;
    const a = getTypescript(prs, {
        camelCase: true,
        export: true,
    });
})