export interface BlockInfo {
    name: string,
    id: string,
}

export interface OpblockInfo extends BlockInfo {
    method: string,
    path: string,
}

export interface ResponseInfo extends OpblockInfo {
    status: string,
}

export interface ElementInfo {
    open: boolean,
}

export interface Other {
    kittenSrc: string,
}