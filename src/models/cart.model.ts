export class CartRequest{
    productId: string;
    quantity: number;
}

export class UpdateCartRequest{
    quantity?: number;
}