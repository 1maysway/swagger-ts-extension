export enum EntityType {
    OBJECT="object", ARRAY="array"
}

export interface EntityObject_Properties extends Record<string,Entity> {}
export type Entity_Description = string;
export interface EntityObject {
    required: keyof EntityObject_Properties,
    properties: EntityObject_Properties,
}

export interface EntityArray {

}

export type EntityTypeMap = {
    [EntityType.OBJECT]: EntityObject,
    [EntityType.ARRAY]: EntityArray,
}

export type Entity <T = keyof typeof EntityType> = {
    type: T,
} & (T extends keyof EntityTypeMap ? EntityTypeMap[T] : never);

