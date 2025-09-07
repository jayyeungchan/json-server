import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * TypeScript接口信息
 */
export interface InterfaceInfo {
  name: string
  properties: PropertyInfo[]
  extends?: string[]
}

/**
 * 属性信息
 */
export interface PropertyInfo {
  name: string
  type: string
  optional: boolean
  description?: string
}

/**
 * TypeScript接口解析器
 * 用于解析TypeScript接口文件并提取接口信息
 */
export class InterfaceParser {
  /**
   * 解析TypeScript接口文件
   * @param filePath 接口文件路径
   * @returns 解析后的接口信息数组
   */
  static parseInterfaceFile(filePath: string): InterfaceInfo[] {
    try {
      const absolutePath = resolve(filePath)
      const content = readFileSync(absolutePath, 'utf-8')
      return this.parseInterfaceContent(content)
    } catch (error) {
      throw new Error(`Failed to parse interface file ${filePath}: ${error}`)
    }
  }

  /**
   * 解析TypeScript接口内容
   * @param content 接口文件内容
   * @returns 解析后的接口信息数组
   */
  static parseInterfaceContent(content: string): InterfaceInfo[] {
    const interfaces: InterfaceInfo[] = []
    
    // 移除注释
    const cleanContent = this.removeComments(content)
    
    // 匹配接口定义
    const interfaceRegex = /interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*{([^}]*)}/g
    let match
    
    while ((match = interfaceRegex.exec(cleanContent)) !== null) {
      const [, name, extendsClause, body] = match
      
      if (!name || !body) continue
      
      const interfaceInfo: InterfaceInfo = {
        name: name.trim(),
        properties: this.parseProperties(body),
      }
      
      if (extendsClause) {
        interfaceInfo.extends = extendsClause
          .split(',')
          .map(ext => ext.trim())
      }
      
      interfaces.push(interfaceInfo)
    }
    
    return interfaces
  }

  /**
   * 解析接口属性
   * @param body 接口体内容
   * @returns 属性信息数组
   */
  private static parseProperties(body: string): PropertyInfo[] {
    const properties: PropertyInfo[] = []
    
    // 分割属性行
    const lines = body.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
    
    for (const line of lines) {
      const property = this.parseProperty(line)
      if (property) {
        properties.push(property)
      }
    }
    
    return properties
  }

  /**
   * 解析单个属性
   * @param line 属性行内容
   * @returns 属性信息或null
   */
  private static parseProperty(line: string): PropertyInfo | null {
    // 匹配属性定义: name?: type; 或 name: type;
    const propertyRegex = /^([\w]+)(\?)?\s*:\s*([^;]+);?$/
    const match = propertyRegex.exec(line.trim())
    
    if (!match) {
      return null
    }
    
    const [, name, optional, type] = match
    
    if (!name || !type) return null
    
    return {
      name: name.trim(),
      type: type.trim(),
      optional: !!optional,
    }
  }

  /**
   * 移除代码中的注释
   * @param content 原始内容
   * @returns 移除注释后的内容
   */
  private static removeComments(content: string): string {
    // 移除单行注释
    content = content.replace(/\/\/.*$/gm, '')
    
    // 移除多行注释
    content = content.replace(/\/\*[\s\S]*?\*\//g, '')
    
    return content
  }

  /**
   * 将接口信息转换为OpenAI提示词
   * @param interfaces 接口信息数组
   * @returns 格式化的提示词
   */
  static generatePrompt(interfaces: InterfaceInfo[]): string {
    if (interfaces.length === 0) {
      throw new Error('No interfaces found to generate prompt')
    }

    let prompt = 'Based on the following TypeScript interfaces, generate realistic JSON data:\n\n'
    
    for (const iface of interfaces) {
      prompt += `interface ${iface.name}`
      
      if (iface.extends && iface.extends.length > 0) {
        prompt += ` extends ${iface.extends.join(', ')}`
      }
      
      prompt += ' {\n'
      
      for (const prop of iface.properties) {
        const optional = prop.optional ? '?' : ''
        prompt += `  ${prop.name}${optional}: ${prop.type};\n`
      }
      
      prompt += '}\n\n'
    }
    
    prompt += 'Requirements:\n'
    prompt += '1. Generate realistic sample data for all properties\n'
    prompt += '2. For arrays, create 3-5 sample items\n'
    prompt += '3. Use appropriate data types (strings, numbers, booleans, dates)\n'
    prompt += '4. Make the data realistic and varied\n'
    prompt += '5. Return only valid JSON, no explanations\n\n'
    prompt += 'Generate the JSON data now:'
    
    return prompt
  }

  /**
   * 验证接口文件是否有效
   * @param filePath 接口文件路径
   * @returns 是否为有效的TypeScript接口文件
   */
  static validateInterfaceFile(filePath: string): boolean {
    try {
      const interfaces = this.parseInterfaceFile(filePath)
      return interfaces.length > 0
    } catch {
      return false
    }
  }
}