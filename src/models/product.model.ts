export class ProductRequest {
    name_product: string;
    price: number;
    description: string;    
    grade: string;
    size?: string;
    thumbnail: string;
    stock_ready?: boolean;
    images: string[];
    video: string[];
    popular?: boolean;
    jeweltypeId: string;
}

export class UpdateProductRequest {
    name_product?: string;
    price?: number;
    description?: string;    
    grade?: string;
    size?: string;
    thumbnail?: string;
    stock_ready?: boolean;
    images?: string[];
    video?: string[];
    popular?: boolean;
    jeweltypeId?: string;
}