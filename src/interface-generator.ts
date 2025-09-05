import { readFileSync } from 'node:fs'
import * as ts from 'typescript'

interface InterfaceProperty {
  name: string
  type: string
  optional: boolean
}

interface ParsedInterface {
  name: string
  properties: InterfaceProperty[]
}

type GeneratedValue = string | number | boolean | GeneratedValue[] | Record<string, unknown>

/**
 * 解析TypeScript接口文件，提取接口定义
 */
export function parseInterfaceFile(filePath: string): ParsedInterface[] {
  const sourceCode = readFileSync(filePath, 'utf-8')
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  )

  const interfaces: ParsedInterface[] = []

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceName = node.name.text
      const properties: InterfaceProperty[] = []

      node.members.forEach(member => {
        if (ts.isPropertySignature(member) && member.name) {
          const propertyName = member.name.getText(sourceFile)
          const optional = !!member.questionToken
          const typeNode = member.type
          let typeString = 'any'

          if (typeNode) {
            typeString = typeNode.getText(sourceFile)
          }

          properties.push({
            name: propertyName,
            type: typeString,
            optional
          })
        }
      })

      interfaces.push({
        name: interfaceName,
        properties
      })
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return interfaces
}

/**
 * 根据属性名和类型生成示例值
 */
function generateValueForPropertyAndType(propertyName: string, type: string): GeneratedValue {
  const normalizedType = type.toLowerCase().trim()
  const normalizedName = propertyName.toLowerCase()

  // 根据属性名生成更合适的值
  if (normalizedType === 'string') {
    if (normalizedName.includes('email')) return 'user@example.com'
    if (normalizedName.includes('name')) return 'John Doe'
    if (normalizedName.includes('title')) return 'Sample Title'
    if (normalizedName.includes('content')) return 'This is sample content for the property.'
    if (normalizedName.includes('url') || normalizedName.includes('link')) return 'https://example.com'
    if (normalizedName.includes('phone')) return '(555) 123-4567'
    if (normalizedName.includes('address')) return '123 Main St, City, State 12345'
    if (normalizedName.includes('createdat') || normalizedName.includes('updatedat')) return new Date().toISOString()
    return 'Sample Text'
  }
  
  if (normalizedType === 'number') {
    if (normalizedName.includes('age')) return Math.floor(Math.random() * 50) + 18
    if (normalizedName.includes('price') || normalizedName.includes('cost')) return Math.floor(Math.random() * 100) + 10
    if (normalizedName.includes('id')) return Math.floor(Math.random() * 1000) + 1
    return Math.floor(Math.random() * 100) + 1
  }
  
  if (normalizedType === 'boolean') {
    if (normalizedName.includes('active') || normalizedName.includes('enabled')) return Math.random() > 0.3
    if (normalizedName.includes('published') || normalizedName.includes('visible')) return Math.random() > 0.4
    return Math.random() > 0.5
  }
  
  if (normalizedType === 'date') return new Date().toISOString()
  
  // 数组类型
  if (normalizedType.includes('[]')) {
    const elementType = normalizedType.replace('[]', '').trim()
    const arrayLength = Math.floor(Math.random() * 3) + 1
    return Array.from({ length: arrayLength }, () => generateValueForPropertyAndType('item', elementType))
  }
  
  // 联合类型 (例: string | number)
  if (normalizedType.includes('|')) {
    const types = normalizedType.split('|').map(t => t.trim())
    return generateValueForPropertyAndType(propertyName, types[0]!)
  }

  // 字面量类型 (例: 'active' | 'inactive')
  if (normalizedType.includes("'") || normalizedType.includes('"')) {
    const match = normalizedType.match(/['"]([^'"]+)['"]/)
    if (match && match[1]) return match[1]
  }

  return {}
}

/**
 * 从接口定义生成示例JSON对象
 */
export function generateSampleData(parsedInterface: ParsedInterface): Record<string, GeneratedValue> {
  const sample: Record<string, GeneratedValue> = {}

  parsedInterface.properties.forEach(prop => {
    // 可选属性有30%的概率被跳过
    if (prop.optional && Math.random() < 0.3) {
      return
    }

    sample[prop.name] = generateValueForPropertyAndType(prop.name, prop.type)
  })

  return sample
}

/**
 * 为每个接口生成多个示例数据项
 */
export function generateMultipleSamples(
  parsedInterface: ParsedInterface, 
  count: number = 3
): Record<string, GeneratedValue>[] {
  const samples: Record<string, GeneratedValue>[] = []
  
  for (let i = 0; i < count; i++) {
    const sample = generateSampleData(parsedInterface)
    // 添加唯一ID
    sample['id'] = i + 1
    samples.push(sample)
  }
  
  return samples
}

/**
 * 从TypeScript接口文件生成完整的JSON Server数据库结构
 */
export function generateDatabaseFromInterface(filePath: string): Record<string, GeneratedValue> {
  const interfaces = parseInterfaceFile(filePath)
  const database: Record<string, GeneratedValue> = {}

  interfaces.forEach(interfaceDecl => {
    // 使用接口名的复数形式或小写作为端点名
    const endpointName = interfaceDecl.name.toLowerCase() + 's'
    database[endpointName] = generateMultipleSamples(interfaceDecl, 3)
  })

  return database
}