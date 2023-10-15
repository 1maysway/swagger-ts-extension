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


interface JsonData {
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

const getEnumFieldString = (str: string) => `${S.T}${str} = '${str}',${S.N}`;

const getObjectFieldString = (f: Field) => `${S.T}${f.name}${S.С}${f.typeName},${S.N}`;
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
}

export const getTypescript = (schema: Entity__Type, formatOptions: getTsStringOptions = {}) => {
    const getTsString = (typeObj: TypeObj__Type) => {
        const exp = `${formatOptions?.export ? S.EXP : ''}`;

        if (typeObj.type === EntityTypes.STRING) {
            if (typeObj.enum) {
                const str = `${exp}enum ${typeObj.name} {${S.N}${typeObj.enum.map(getEnumFieldString).join('')}}`;
                return str;
            }
        }

        if (typeObj.type === EntityTypes.OBJECT) {
            const str = `${exp}interface ${typeObj.name} {${S.N}${typeObj.fields.map(getObjectFieldString).join('')}}`;
            return str;
        }

        if (typeObj.type === EntityTypes.ARRAY) {
            const str = `${exp}type ${typeObj.name} = ${typeObj.typeName};`;
            return str;
        }

        console.log(typeObj)

        return null;
    }
    const getTypeName = (entity: Entity__Type, count: number = 0): string => {
        let name;

        switch (entity.type) {
            case EntityTypes.OBJECT: {
                name = entity.title + getArrayBrackets(count);
                break;
            }
            case EntityTypes.ARRAY: {
                name = getTypeName(entity.items, count + 1);
                break;
            }
            default: {
                name = EntityTypesToTypescript[entity.type] + getArrayBrackets(count);
            }
        }

        return prettifyName(name);
    }
    const typeObjsToString = (typeObjs: TypeObj__Type[]) => {
        return typeObjs.map(to => getTsString(to)).join('\n\n');
    }
    const prettifyName = (name: string) => {
        let str = name.split(/[.]/).join('_');

        if (formatOptions.camelCase) {
            str = toCamelCase(str);
            console.log(str)
        }
        return str;
    };

    /////////////////

    const typeObjs:TypeObj__Type[] = [];

    const pushToTypesObjs = (typeObj: TypeObj__Type | null) => {
        typeObj && !typeObjs.some(to => to.name === typeObj.name) && typeObjs.push(typeObj);
    }

    const doesTbExist = (entity: Entity__Type): TypeObj | null => {
        switch (entity.type) {
            case EntityTypes.OBJECT: {
                return typeObjs.find(to => to.name === entity.title) || null
            }
            case EntityTypes.STRING: {
                console.log(entity.type)
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

    const toTypeObj = (entity: Entity__Type, autoPush = true, count = 0): TypeObj | null => {
        if (entity.type === EntityTypes.OBJECT && count === 0) {

            const tbExists = doesTbExist(entity)

            if (tbExists) {
                return tbExists;
            }

            if (!entity.properties) {
                return null;
            }

            const typeObj: TypeObj<EntityTypes.OBJECT> = {
                type: entity.type,
                fields: [],
                name: prettifyName(entity.title),
            }

            const fields: Field[] = Object.entries(entity.properties).map(([key, val]) => {
                const tto = toTypeObj(val)
                const typeName = tto?.name || tto?.typeName || getTypeName(val);

                const field: Field = {
                    name: prettifyName(key),
                    type: val.type,
                    typeName: typeName,
                }

                return field;
            });

            typeObj.fields = fields;
            autoPush && pushToTypesObjs(typeObj);

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
        } else if (entity.type === EntityTypes.ARRAY) {
            return toTypeObj(entity.items, true,count + 1);
        } else if (count > 0) {
            const ent = toTypeObj(entity);

            const typeObj: TypeObj__Type = {
                type: EntityTypes.ARRAY,
                typeName: getTypeName(entity, count),
                arrayType: ent?.name || ent?.type || entity.type,
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