export interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  amount: number;
}

// adicionado
export interface ProductFormatted extends Product {
  priceFormatted: string;
  subTotal: string;
}

export interface UpdateProductAmount {
  productId: number;
  amount: number;
}

export interface Stock {
  id: number;
  amount: number;
}
