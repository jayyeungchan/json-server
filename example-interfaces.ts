// 用户接口
export interface User {
  id: number
  name: string
  email: string
  age?: number
  isActive: boolean
  createdAt: string
}

// 文章接口
export interface Post {
  id: number
  title: string
  content: string
  authorId: number
  tags: string[]
  publishedAt?: string
  isPublished: boolean
}

// 评论接口
export interface Comment {
  id: number
  content: string
  postId: number
  authorId: number
  createdAt: string
}

export interface Author {
  id: number
  name: string
  email: string
}
