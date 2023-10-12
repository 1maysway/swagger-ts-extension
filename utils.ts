import {Entity, Entity__Type, EntityTypes, EntityTypesToTypescript, Field, TypeObj} from "./types";


const insertElement = <T extends any> (arr: T[], index: number, element: T) => {
    return arr.splice(index, 0, element);
}

const getArrayBrackets = (number: number) => Array(number).fill('[]').join('');

const getTypeName = (entity: Entity__Type, count: number = 0): string => {
    switch (entity.type) {
        case EntityTypes.OBJECT: {
            return entity.title + getArrayBrackets(count);
        }
        case EntityTypes.ARRAY: {
            return getTypeName(entity.items, count + 1);
        }
        default: {
            return EntityTypesToTypescript[entity.type] + getArrayBrackets(count);
        }
    }
}

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

export const getTypescript = (schema: Entity__Type) => {
    const typeObjs:TypeObj[] = [];

    const pushToTypesObjs = (typeObj: TypeObj | null) => {
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

    const toTypeObj = (entity: Entity__Type, autoPush = true, count = 0): TypeObj | null => {
        if (entity.type === EntityTypes.OBJECT && count === 0) {

            const tbExists = doesTbExist(entity)

            if (tbExists) {
                return tbExists;
            }

            const typeObj: TypeObj<EntityTypes.OBJECT> = {
                type: entity.type,
                fields: [],
                name: entity.title,
            }

            const fields: Field[] = Object.entries(entity.properties).map(([key, val]) => {
                const typeName = toTypeObj(val)?.name || getTypeName(val);

                const field: Field = {
                    name: key,
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
        } else if (entity.type === EntityTypes.ARRAY) {
            return toTypeObj(entity.items, true,count + 1);
        } else if (count > 0) {
            const tbExists = doesTbExist(entity)

            if (tbExists) {
                return tbExists;
            }

            const ent = toTypeObj(entity);

            const typeObj: TypeObj = {
                type: EntityTypes.ARRAY,
                typeName: getTypeName(entity, count),
                arrayType: ent?.name || ent?.type || entity.type,
            }

            autoPush && pushToTypesObjs(typeObj);
            return typeObj;
        }
        return null;
    };

    const res = toTypeObj(schema, false);
    pushToTypesObjs({ ...res, name: 'root' } as TypeObj);

    // console.log(res);

    return typeObjs;
}