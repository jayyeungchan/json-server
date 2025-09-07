import { readFileSync } from 'node:fs'
import { config } from 'dotenv'
import OpenAI from 'openai'
import { OpenAIConfig, loadOpenAIConfig } from './types/openai-config.js'

// 加载环境变量
config()

/**
 * OpenAI服务类，用于处理AI生成JSON数据的功能
 */
export class OpenAIService {
  private openai: OpenAI
  private config: OpenAIConfig

  /**
   * 构造函数，初始化OpenAI客户端
   */
  constructor() {
    this.config = loadOpenAIConfig()
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    })
  }

  /**
   * 从TypeScript接口文件生成JSON数据
   * @param interfaceFilePath TypeScript接口文件路径
   * @returns 生成的JSON数据
   */
  async generateJSONFromInterface(
    interfaceFilePath: string
  ): Promise<Record<string, unknown>> {
    try {
      // 读取TypeScript接口文件内容
      const interfaceContent = readFileSync(interfaceFilePath, 'utf-8')
      
      // 构建提示词
      const prompt = this.buildPrompt(interfaceContent)
      
      // 调用OpenAI API
      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates realistic JSON data based on TypeScript interfaces. Always respond with valid JSON only, no explanations or markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000, // 增加token限制以获取完整JSON
        temperature: this.config.temperature || 0.7,
      })

      const generatedContent = response.choices[0]?.message?.content
      if (!generatedContent) {
        throw new Error('No content generated from OpenAI API')
      }

      // 解析生成的JSON
      const jsonData = this.parseGeneratedJSON(generatedContent)
      
      return jsonData
    } catch (error) {
      throw new Error(`Failed to generate JSON from interface: ${error}`)
    }
  }

  /**
   * 构建发送给OpenAI的提示词
   * @param interfaceContent TypeScript接口内容
   * @returns 构建的提示词
   */
  private buildPrompt(interfaceContent: string): string {
    return `Based on the following TypeScript interfaces, generate realistic JSON data that matches the structure. Create multiple entries for arrays and use realistic sample data:

\`\`\`typescript
${interfaceContent}
\`\`\`

Generate JSON data that:
1. Matches all the interface structures
2. Uses realistic sample data (names, emails, dates, etc.)
3. Creates arrays with 3-5 sample items
4. Follows proper JSON format
5. Uses appropriate data types for each field

Return only the JSON data, no explanations.`
  }

  /**
   * 解析OpenAI生成的JSON内容
   * @param content OpenAI返回的内容
   * @returns 解析后的JSON对象
   */
  private parseGeneratedJSON(content: string): Record<string, unknown> {
    try {
      // 移除可能的markdown代码块标记
      let cleanContent = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()
      
      // 如果内容被截断，尝试修复JSON结构
      if (!cleanContent.endsWith('}') && !cleanContent.endsWith(']')) {
        // 查找最后一个完整的对象或数组
        const lastCompleteObject = this.findLastCompleteJSON(cleanContent)
        if (lastCompleteObject) {
          cleanContent = lastCompleteObject
        }
      }
      
      return JSON.parse(cleanContent)
    } catch (error) {
      throw new Error(`Failed to parse generated JSON: ${error}\nContent: ${content}`)
    }
  }

  /**
   * 查找最后一个完整的JSON结构
   * @param content 不完整的JSON内容
   * @returns 修复后的JSON字符串或null
   */
  private findLastCompleteJSON(content: string): string | null {
    // 尝试找到最后一个完整的对象结构
    let braceCount = 0
    let lastValidIndex = -1
    
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++
      } else if (content[i] === '}') {
        braceCount--
        if (braceCount === 0) {
          lastValidIndex = i
        }
      }
    }
    
    if (lastValidIndex > -1) {
      return content.substring(0, lastValidIndex + 1)
    }
    
    return null
  }


}