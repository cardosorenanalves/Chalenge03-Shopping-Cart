import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<any>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');


    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
   
    try {
      const product = [...cart]
      const idProduct = product.find(Value => Value.id === productId)
      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount
      const idAmount = idProduct ? idProduct.amount : 0
      const amount = idAmount + 1;
     
    if(amount > stockAmount){
        return toast.error('Quantidade solicitada fora de estoque');
    }

    if(idProduct){
      idProduct.amount = amount
      
      }else{
        const addProduct = await api.get(`/products/${productId}`)
        const newProduct = {...addProduct.data, amount : 1}
        product.push(newProduct)
      }
    
      setCart(product)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(product))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = [...cart]
      const idProduct = product.find(Value => Value.id === productId)
     
      if(idProduct){
        const newProduct = product.filter(Value => Value.id !== productId)
        setCart(newProduct)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProduct))
      }
      if(!idProduct)
      {
       return toast.error('Erro na remoção do produto')   
      }      
    } catch {
      toast.error('Erro na remoção do produto')   
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const product = [...cart]
      const idProduct = product.find(Value => Value.id === productId)
      const responseAmount = await api.get(`/stock/${productId}`)
      const stockAmount = responseAmount.data.amount
   
        if(amount  > stockAmount){
         return toast.error('Quantidade solicitada fora de estoque');
        }

      if(amount <= 0){
        return toast.error('Erro na alteração de quantidade do produto');  
       }

       if(idProduct){
        idProduct.amount = amount
         setCart(product) 
         localStorage.setItem('@RocketShoes:cart', JSON.stringify(product))
      } 
     
    } catch {
      toast.error('Erro na alteração de quantidade do produto');  
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
