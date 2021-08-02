import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // get local storage
      const localCart = localStorage.getItem("@RocketShoes:cart");

      // get clicked product max stock
      api.get("/stock/" + productId).then((data) => {
        const { amount } = data.data as Stock;

        // if Local Storage cart is set
        if (localCart) {
          // parse cart data
          let localCartjson = JSON.parse(localCart) as Product[];

          // get clicked product index from cart data
          const foundProductIndex = localCartjson.findIndex(
            (p) => p.id === productId
          ) as number;

          // if exists, the returned index should be bigger than -1
          if (foundProductIndex > -1) {
            let updatedProduct = localCartjson[foundProductIndex];
            // since product exists, first check if the new amount doesn't exceed the product stock amount
            if (updatedProduct.amount < amount) {
              // update product
              updatedProduct.amount++;
              localCartjson[foundProductIndex] = updatedProduct;
              const newCart = [...localCartjson] as Product[];
              localStorage.setItem(
                "@RocketShoes:cart",
                JSON.stringify(newCart)
              );
              setCart(newCart);
            } else {
              // out of stock error
              toast.error("Quantidade solicitada fora de estoque");
            }
            // Since the product doesn't exist, add new product data to cart
          } else {
            // add new product to existent cart
            api.get("/products/" + productId).then((product) => {
              const newProduct = {
                ...product.data,
                amount: 1,
              } as Product;

              // define new Cart Array with the new product data and existent data
              const newCart = [...localCartjson, newProduct] as Product[];

              // stringify new cart data to JSON and set Local Storage Data
              localStorage.setItem(
                "@RocketShoes:cart",
                JSON.stringify(newCart)
              );

              // set State Cart to update UI
              setCart(newCart);
            });
          }
        } else {
          // if Local Storage cart is not set
          // add new product to cart
          api.get("/products/" + productId).then((product) => {
            const newProduct = {
              ...product.data,
              amount: 1,
            } as Product;

            // define new Cart Array with the new product data
            const newCart = [newProduct] as Product[];

            // stringify product data to JSON and set Local Storage Data
            localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));

            // set State Cart to update UI
            setCart(newCart);
          });
        }
      });
    } catch (ex) {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // get local storage
      const localCart = localStorage.getItem("@RocketShoes:cart");

      // if Local Storage cart is set
      if (localCart) {
        // parse cart data
        let localCartjson = JSON.parse(localCart) as Product[];

        // get clicked product index from cart data
        const foundProductIndex = localCartjson.findIndex(
          (p) => p.id === productId
        ) as number;

        // if exists, the returned index should be bigger than -1
        if (foundProductIndex > -1) {
          // delete clicked product from the JSON
          localCartjson.splice(foundProductIndex, 1);

          // define new Cart Array with the updated data
          const newCart = [...localCartjson] as Product[];

          // stringify as JSON and set Local Storage Data
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));

          // set State Cart to update UI
          setCart(newCart);
        } else {
          // product does not exist
          toast.error("Erro na remoção do produto");
        }
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // get local storage
      const localCart = localStorage.getItem("@RocketShoes:cart");

      // get clicked product max stock
      api.get("/stock/" + productId).then((data) => {
        const productdata = data.data as Stock;
        const productMaxStock = productdata.amount;
        
        // if Local Storage cart is set
        if (localCart) {
          let localCartjson = JSON.parse(localCart) as Product[];

          // get clicked product index from cart data
          const foundProductIndex = localCartjson.findIndex(
            (p) => p.id === productId
          ) as number;

          // if exists, the returned index should be bigger than -1
          if (foundProductIndex > -1) {
            let updatedProduct = localCartjson[foundProductIndex];

            // since product exists, first check if the new amount doesn't exceed the product stock amount
            if (amount > productMaxStock) {
              toast.error("Quantidade solicitada fora de estoque");
            } else {
              // update cart
              updatedProduct.amount = amount;
              localCartjson[foundProductIndex] = updatedProduct;

              const newCart = [...localCartjson] as Product[];
              localStorage.setItem(
                "@RocketShoes:cart",
                JSON.stringify(newCart)
              );

              // set State Cart to update UI
              setCart(newCart);
            }
          } else {
            toast.error("Erro na alteração de quantidade do produto");
          }
        }
      });
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);
  return context;
}
