import {Entity__Type, EntityTypes, EntityTypesToTypescript, Field, TypeObj} from "./types";


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

export const getTypescript = (schema: Entity__Type) => {
    const typeObjs:TypeObj[] = [];

    const pushToTypesObjs = (typeObj: TypeObj) => {
        !typeObjs.some(to => to.name === typeObj.name) && typeObjs.push(typeObj);
    }

    const doesTbExist = (name: string) => typeObjs.some(to => to.name === name);

    const toTypeObj = (entity: Entity__Type, autoPush = true, count = 0): TypeObj | null => {
        if (entity.type === EntityTypes.OBJECT) {

            const tbExists = doesTbExist(entity.title)

            if (tbExists) {
                return typeObjs.find(tb => tb.name === entity.title) || null;
            }

            const typeObj: TypeObj<EntityTypes.OBJECT> = {
                type: entity.type,
                fields: [],
                name: entity.title,
            }

            const fields: Field[] = Object.entries(entity.properties).map(([key, val]) => {
                console.log(key)
                const typeName = val.type === EntityTypes.OBJECT || val.type === EntityTypes.ARRAY ? toTypeObj(val)?.name || getTypeName(val) : getTypeName(val);

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
        } else if (entity.type === EntityTypes.ARRAY) {
            return toTypeObj(entity.items, true,count + 1);
        } else if (count > 0) {
            const typeObj: TypeObj = {
                type: entity.type,
                name: 'root',
                typeName: getTypeName(entity, count),
            }
            autoPush && pushToTypesObjs(typeObj);
            return typeObj;
        }
        return null;
    };

    const res = toTypeObj(schema, false);

    console.log(res)

    // return typeObjs;
}