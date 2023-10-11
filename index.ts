interface JsonData {
    [key: string]: any;
}

const jsonData: JsonData = {
    items: { "$ref": "#/definitions/CalendarLessonResponse" },
    definitions: {
        CalendarLessonResponse: { a:'Aa' }
    }
};

// Функция для разрешения JSON Reference
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


const resolvedData = resolveJSONReference(jsonData, jsonData);

console.log(resolvedData);
