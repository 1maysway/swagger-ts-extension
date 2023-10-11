export enum EntityTypes {
    OBJECT="object",
    ARRAY="array",
    INTEGER="integer",
    BOOLEAN="boolean",
    STRING="string",
}

export const EntityTypesToTypescript = {
    integer: "number",
    boolean: "boolean",
    string: "string",
}

export enum EntityInteger_Formats {
    INT64="int64",
    INT32="int32",
}

export interface EntityObject_Properties extends Record<string, Entity__Type> {}
export interface EntityObject {
    // required: keyof EntityObject_Properties,
    properties: EntityObject_Properties,
    title: string,
}

export interface EntityArray {
    items: Entity__Type,
    description?: string,
}

export interface EntityInteger {
    format: EntityInteger_Formats,
}

export interface EntityString {}

export interface EntityBoolean {}

export type EntityTypeMap = {
    [EntityTypes.OBJECT]: EntityObject,
    [EntityTypes.ARRAY]: EntityArray,
    [EntityTypes.INTEGER]: EntityInteger,
    [EntityTypes.STRING]: EntityString,
    [EntityTypes.BOOLEAN]: EntityBoolean,
}

export type Entity <T = EntityTypes> = {
    type: T,
} & (T extends keyof EntityTypeMap ? EntityTypeMap[T] : {})

export type Entity__Type = Entity<EntityTypes.OBJECT>
| Entity<EntityTypes.ARRAY>
| Entity<EntityTypes.INTEGER>
| Entity<EntityTypes.STRING>
| Entity<EntityTypes.BOOLEAN>


export interface Field {
    name: string,
    type: string,
    typeName: string,
}

export interface TypeObjObject {
    fields: Field[],
}
export interface TypeObjArray {
    arrayType: string,
}
export interface TypeObjInteger {}
export interface TypeObjString {}
export interface TypeObjBoolean {}

export type TypeObjectMap = {
    [EntityTypes.OBJECT]: TypeObjObject,
    [EntityTypes.ARRAY]: TypeObjArray,
    [EntityTypes.INTEGER]: TypeObjInteger,
    [EntityTypes.STRING]: TypeObjString,
    [EntityTypes.BOOLEAN]: TypeObjBoolean,
}

export type TypeObj <T = EntityTypes> = {
    type: T,
    name?: string,
    typeName?: string,
} & (T extends keyof TypeObjectMap ? TypeObjectMap[T] : {})
