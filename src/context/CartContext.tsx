"use client";

import { createContext, useContext, useReducer, useEffect, useCallback, useState } from "react";
import toast from "react-hot-toast";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  brand: string | null;
  stock: number;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  coupon: { code: string; discount: number } | null;
}

type CartAction =
  | { type: "ADD"; product: CartProduct; qty: number }
  | { type: "REMOVE"; productId: string }
  | { type: "SET_QTY"; productId: string; qty: number }
  | { type: "CLEAR" }
  | { type: "SET_COUPON"; coupon: CartState["coupon"] }
  | { type: "HYDRATE"; state: CartState };

const STORAGE_KEY = "insufarma-cart";

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "ADD": {
      const idx = state.items.findIndex((i) => i.product.id === action.product.id);
      if (idx >= 0) {
        const qty = Math.min(state.items[idx].quantity + action.qty, action.product.stock);
        return { ...state, items: state.items.map((i, n) => (n === idx ? { ...i, quantity: qty } : i)) };
      }
      return {
        ...state,
        items: [...state.items, { product: action.product, quantity: Math.min(action.qty, action.product.stock) }],
      };
    }
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) };
    case "SET_QTY":
      if (action.qty <= 0) return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) };
      return {
        ...state,
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: Math.min(action.qty, i.product.stock) } : i
        ),
      };
    case "CLEAR":
      return { items: [], coupon: null };
    case "SET_COUPON":
      return { ...state, coupon: action.coupon };
    default:
      return state;
  }
}

function calcTotals(state: CartState) {
  const subtotal = state.items.reduce((s, i) => s + (i.product.salePrice ?? i.product.price) * i.quantity, 0);
  const couponDiscount = state.coupon?.discount ?? 0;
  const shipping = subtotal > 0 && subtotal < 199 ? 25 : 0;
  const total = Math.max(0, subtotal - couponDiscount + shipping);
  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0);
  return { subtotal, couponDiscount, shipping, total, itemCount };
}

interface CartCtx {
  items: CartItem[];
  coupon: CartState["coupon"];
  subtotal: number;
  couponDiscount: number;
  shipping: number;
  total: number;
  itemCount: number;
  addItem: (product: CartProduct, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  setCoupon: (coupon: CartState["coupon"]) => void;
}

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], coupon: null });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", state: JSON.parse(raw) });
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const addItem = useCallback((product: CartProduct, qty = 1) => {
    dispatch({ type: "ADD", product, qty });
    toast.success(`${product.name} adicionado ao carrinho`);
  }, []);
  const removeItem = useCallback((id: string) => dispatch({ type: "REMOVE", productId: id }), []);
  const setQty = useCallback((id: string, qty: number) => dispatch({ type: "SET_QTY", productId: id, qty }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const setCoupon = useCallback((c: CartState["coupon"]) => dispatch({ type: "SET_COUPON", coupon: c }), []);

  return (
    <CartContext.Provider
      value={{ items: state.items, coupon: state.coupon, ...calcTotals(state), addItem, removeItem, setQty, clearCart, setCoupon }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
