/**
 * 用户接口定义
 */
export interface User {
  id: number
  name: string
  email: string
  age?: number
  isActive: boolean
  createdAt: string
}

/**
 * 产品接口定义
 */
export interface Product {
  id: number
  title: string
  description: string
  price: number
  category: string
  inStock: boolean
  tags: string[]
}

/**
 * 订单接口定义
 */
export interface Order {
  id: number
  userId: number
  products: Product[]
  totalAmount: number
  status: 'pending' | 'completed' | 'cancelled'
  orderDate: string
}

/**
 * 数据库结构
 */
export interface Database {
  users: User[]
  products: Product[]
  orders: Order[]
}