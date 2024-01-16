import {
    Entity__Type,
    EntityString_Formats,
    EntityTypes,
    EntityTypesToTypescript,
    Field,
    TypeObj,
    TypeObj__Type
} from "./types";
import {STRS as S} from "./constants";


export interface JsonData {
    [key: string]: any;
}
export const resolveJSONReference = (data: JsonData, rootData: JsonData): JsonData => {
    if (typeof data === 'object' && data !== null) {
        if (data['$ref']) {
            const referencePath = data['$ref'].split('#');
            const definitions = referencePath[1].split('/').filter(Boolean).reduce((obj: any, key: string) => {
                if (obj && obj[key]) {
                    return {
                        ...obj[key],
                        title: key,
                    };
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

const getArrayBrackets = (number: number) => Array(number).fill('[]').join('');
export const leftHtml = (str: string) => str.replace(/<[^>]*>/g, '');

const areArraysEqual = <T>(arr1: T[], arr2: T[]) => {
    if (arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}

const generateRandomString = (length: number, uppercase = false) => {
    const upChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const downChars = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const characters = [digits, uppercase === undefined
        ? [upChars,downChars].join('')
        : uppercase ? upChars : downChars].join('');

    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        result += characters.charAt(randomIndex);
    }

    return result;
}

const getEnumFieldString = (str: string | number) => `${S.T}${typeof str === 'number' ? '_' + str : str} = '${str}',${S.N}`;

const getObjectFieldString = (f: Field) => {
    const content = f.code || `${f.typeName},${S.N}`;
    return `${S.T}${f.name}${S.С}${content}`;
};
const toCamelCase = (str: string) => {
    return str.replace(/_(\w)|\[(\d+)\]/g, function (match, group1, group2) {
        if (group1) {
            return group1.toUpperCase();
        } else if (group2) {
            return `[${group2}]`;
        }
        return '';
    });
}

export interface getTsStringOptions {
    export?: boolean,
    camelCase?: boolean,
    init?: boolean,
}

export const getTypescript = (schema: Entity__Type, formatOptions?: getTsStringOptions) => {
    const getTsString = (typeObj: TypeObj__Type, options?: getTsStringOptions) => {
        const exp = `${formatOptions?.export ? S.EXP : ''}`;

        if (typeObj.type === EntityTypes.STRING) {
            if (typeObj.enum) {
                const init = `${exp}enum ${typeObj.name} `;
                const str = `${options?.init ? init : ''}{${S.N}${typeObj.enum.map(getEnumFieldString).join('')}}${options?.init ? '' : `,${S.N}`}`;
                return str;
            }
        }

        if (typeObj.type === EntityTypes.OBJECT) {
            const init = `${exp}interface ${typeObj.name} `;
            const str = `${options?.init ? init : ''}{${typeObj.fields.length ? S.N : ''}${typeObj.fields.map(getObjectFieldString).join('')}}${options?.init ? '' : `,${S.N}`}`;
            return str;
        }

        if (typeObj.type === EntityTypes.ARRAY) {
            const init = `${exp}type ${typeObj.name} = `;
            const str = `${options?.init ? init : ''}${typeObj.typeName}${options?.init ? ';' : `,${S.N}`}`;
            return str;
        }

        return null;
    }
    const getTypeName = (entity: Entity__Type, count: number = 0): string | null => {
        let name;

       if (entity.type === EntityTypes.OBJECT || entity.properties) {
           name = entity.title ? entity.title + getArrayBrackets(count) : null;
       } else if (entity.type === EntityTypes.ARRAY) {
           name = getTypeName(entity.items, count + 1);
       } else {
           const enityType = EntityTypesToTypescript[entity.type];
           name = enityType ? enityType + getArrayBrackets(count) : null;
       }

        return name ? prettifyName(name) : name;
    }
    const typeObjsToString = (typeObjs: TypeObj__Type[]) => {
        return typeObjs.map(to => getTsString(to, formatOptions)).join('\n\n');
    }
    const prettifyName = (name: string) => {
        let str = name.split(/[.]/).join('_');

        if (formatOptions.camelCase) {
            str = toCamelCase(str);
        }
        return str;
    };

    /////////////////

    const typeObjs:TypeObj__Type[] = [];

    const pushToTypesObjs = (typeObj: TypeObj__Type | null) => {
        typeObj && !typeObjs.some(to => to.name === typeObj.name) && typeObjs.push(typeObj);
    }

    const doesTbExist = (entity: Entity__Type): TypeObj__Type | null => {
        switch (entity.type) {
            case EntityTypes.OBJECT: {
                return typeObjs.find(to => to.name === entity.title) || null
            }
            case EntityTypes.STRING: {
                if (entity.enum) {
                    return (typeObjs
                        .filter(to => to.type === EntityTypes.STRING) as TypeObj<EntityTypes.STRING>[])
                        .find(to => to.enum && entity.enum && areArraysEqual(to.enum, entity.enum)) || null
                }
                return null;
            }
            default: return null;
        }
    };

    const toTypeObj = (entity: Entity__Type, autoPush = true, count = 0): TypeObj__Type | null => {
        if ((entity.type === EntityTypes.OBJECT || entity.properties || entity.additionalProperties) && count === 0) {
            const tbExists = doesTbExist(entity)

            if (tbExists) {
                return tbExists;
            }

            const additionalField: Field = entity.additionalProperties && {
                name: `[key: string]`,
                type: entity.additionalProperties.type,
                typeName: (entity.additionalProperties ? getTypeName(entity.additionalProperties) : entity.additionalProperties.type) || entity.additionalProperties.type,
            }

            const typeObj: TypeObj<EntityTypes.OBJECT> = {
                type: EntityTypes.OBJECT,
                fields: additionalField ? [additionalField] : [],
                name: entity.title ? prettifyName(entity.title) : undefined,
            }

            Object.entries(entity.properties || {}).forEach(([key, val]) => {
                const tto = toTypeObj(val)
                const typeName = tto?.name || tto?.typeName || getTypeName(val);
                const field: Field = {
                    name: prettifyName(key),
                    type: val.type,
                    typeName: typeName || val.type,
                    code: typeName ? undefined : tto ? getTsString(tto) : val.type
                }

                typeObj.fields.unshift(field);

                autoPush && typeName && pushToTypesObjs(typeObj);

                return field;
            });

            return typeObj;
        } else if (entity.type === EntityTypes.STRING && entity.enum && count === 0) {
            const tbExists = doesTbExist(entity)

            if (tbExists) {
                return tbExists;
            }

            const typeObj: TypeObj<EntityTypes.STRING> = {
                type: entity.type,
                name: "ENUM_"+generateRandomString(10,true),
                enum: entity.enum,
            }

            autoPush && pushToTypesObjs(typeObj);

            return typeObj;
        } else if (entity.type === EntityTypes.STRING && entity.format === EntityString_Formats.DATE) {
            const typeObj: TypeObj<EntityTypes.STRING> = {
                type: entity.type,
                typeName: 'number[]',
            }
            return typeObj;
        } else if (entity.allOf) {
            const tbExists = doesTbExist(entity)

            if (tbExists) {
                return tbExists;
            }

            const typeObj: TypeObj<EntityTypes.OBJECT> = {
                type: EntityTypes.OBJECT,
                fields: [],
                name: prettifyName(entity.title),
            }

            const fields: Field[] = entity.allOf.reduce<Field[]>((pv, cv) => {
                const tpbj = toTypeObj(cv) as TypeObj<EntityTypes.OBJECT>;
                pv.push(...tpbj.fields);
                return pv;
            }, [])

            typeObj.fields = fields;
            autoPush && pushToTypesObjs(typeObj);

            return typeObj;
        } else if (entity.type === EntityTypes.ARRAY) {
            return toTypeObj(entity.items, true,count + 1);
        } else if (count > 0) {
            const ent = toTypeObj(entity);

            const entType = ent?.name || ent?.type || entity.type;
            const typeName = getTypeName(entity, count) || (entType + getArrayBrackets(count));

            const typeObj: TypeObj__Type = {
                type: EntityTypes.ARRAY,
                typeName,
                arrayType: entType,
            }

            return typeObj;
        }
        return null;
    };

    const res = toTypeObj(schema, false);
    pushToTypesObjs({ ...res, name: 'root' } as TypeObj__Type);

    const typeObjsString = typeObjsToString(typeObjs);

    return typeObjsString;
}