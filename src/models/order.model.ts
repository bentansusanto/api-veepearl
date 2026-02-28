export class OrderRequest {
    pemesanId: string;
    shipping_method?: any
}

export class OrderByCardRequest{
    pemesanId: string;
}

export class CapturePaymentRequest{
    paymentIntentId: string;
}