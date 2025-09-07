/**
 * OpenAI API配置接口
 */
export interface OpenAIConfig {
  /** OpenAI API密钥 */
  apiKey: string
  /** OpenAI API基础URL，默认为官方API地址 */
  baseURL?: string
  /** 使用的模型名称，默认为gpt-3.5-turbo */
  model?: string
  /** 最大token数量，默认为2000 */
  maxTokens?: number
  /** 温度参数，控制生成文本的随机性，默认为0.7 */
  temperature?: number
}

/**
 * 从环境变量加载OpenAI配置
 * @returns OpenAI配置对象
 * @throws 如果必需的环境变量未设置则抛出错误
 */
export function loadOpenAIConfig(): OpenAIConfig {
  const apiKey = process.env['OPENAI_API_KEY']
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }
  
  return {
    apiKey,
    baseURL: process.env['OPENAI_BASE_URL'] || 'https://api.openai.com/v1',
    model: process.env['OPENAI_MODEL'] || 'gpt-3.5-turbo',
    maxTokens: process.env['OPENAI_MAX_TOKENS'] ? parseInt(process.env['OPENAI_MAX_TOKENS'], 10) : 2000,
    temperature: process.env['OPENAI_TEMPERATURE'] ? parseFloat(process.env['OPENAI_TEMPERATURE']) : 0.7
  }
}