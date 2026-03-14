export type SareeStatus = "available" | "sold_out";

export interface SareeImage {
  url: string;
  status: SareeStatus;
}

export interface SareeColor {
  color: string;
  images: SareeImage[];
}

export interface SareeItem {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  imageText?: string;
  price: number;
  status: SareeStatus;
  tileImage: string;
  colors: SareeColor[];
  description?: string;
}
