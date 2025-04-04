export class PemesanRequest {
   name: string;
   email: string;
   phone: string;
   address: string;
   city: string;
   country: string;
   zip_code: string;
}

export class UpdatePemesanRequest {
   name?: string;
   email?: string;
   phone?: string;
   address?: string;
   city?: string;
   country?: string;
   zip_code?: string;
}