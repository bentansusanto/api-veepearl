export class JewelRequest {
    name_type: string;
    type: string;
}

export class JewelResponse {
    id: string;
    name_type: string;
    type: string;
}

export class UpdateJewelRequest {
    name_type?: string;
    type?: string;
}