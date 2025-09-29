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
 * 验证OpenAI API密钥格式
 * @param apiKey API密钥
 * @throws 如果密钥格式无效则抛出错误
 */
function validateApiKey(apiKey: string): void {
  // 检查密钥是否为空或是示例值
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OPENAI_API_KEY cannot be empty')
  }

  if (apiKey === 'your_openai_api_key_here') {
    throw new Error('OPENAI_API_KEY is still set to the example value. Please set a valid API key.')
  }

  // 验证OpenAI API密钥格式（通常以sk-开头）
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. Key should start with "sk-"')
  }

  // 检查密钥长度（OpenAI密钥通常有特定长度）
  if (apiKey.length < 40) {
    throw new Error('OpenAI API key appears to be too short')
  }

  // 检查密钥是否包含无效字符
  const validKeyPattern = /^sk-[A-Za-z0-9]+$/
  if (!validKeyPattern.test(apiKey)) {
    throw new Error('OpenAI API key contains invalid characters')
  }
}

/**
 * 验证数值配置参数
 * @param value 要验证的值
 * @param min 最小值
 * @param max 最大值
 * @param name 参数名称
 * @returns 验证后的数值
 */
function validateNumericConfig(value: string | undefined, min: number, max: number, name: string, defaultValue: number): number {
  if (!value) return defaultValue

  const numValue = name.includes('temperature') ? parseFloat(value) : parseInt(value, 10)

  if (isNaN(numValue)) {
    throw new Error(`Invalid ${name}: must be a valid number`)
  }

  if (numValue < min || numValue > max) {
    throw new Error(`Invalid ${name}: must be between ${min} and ${max}`)
  }

  return numValue
}

/**
 * 从环境变量加载OpenAI配置
 * @returns OpenAI配置对象
 * @throws 如果必需的环境变量未设置或无效则抛出错误
 */
export function loadOpenAIConfig(): OpenAIConfig {
  const apiKey = process.env['OPENAI_API_KEY']

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  // 验证API密钥
  validateApiKey(apiKey)

  // 验证baseURL格式
  const baseURL = process.env['OPENAI_BASE_URL'] || 'https://api.openai.com/v1'
  try {
    new URL(baseURL)
  } catch {
    throw new Error(`Invalid OPENAI_BASE_URL: ${baseURL} is not a valid URL`)
  }

  // 验证模型名称
  const model = process.env['OPENAI_MODEL'] || 'gpt-3.5-turbo'
  const validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini']
  if (!validModels.includes(model)) {
    console.warn(`Warning: Model '${model}' is not in the list of known models. Proceeding anyway.`)
  }

  return {
    apiKey,
    baseURL,
    model,
    maxTokens: validateNumericConfig(process.env['OPENAI_MAX_TOKENS'], 1, 16000, 'maxTokens', 2000),
    temperature: validateNumericConfig(process.env['OPENAI_TEMPERATURE'], 0, 2, 'temperature', 0.7)
  }
}