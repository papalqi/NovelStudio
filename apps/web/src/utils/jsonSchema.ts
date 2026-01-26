export type JsonSchema = {
  type?: string | string[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  enum?: unknown[]
}

const normalizeTypes = (type?: string | string[]) => {
  if (!type) return []
  return Array.isArray(type) ? type : [type]
}

const matchesType = (value: unknown, type: string) => {
  switch (type) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && !Number.isNaN(value)
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'null':
      return value === null
    case 'array':
      return Array.isArray(value)
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    default:
      return true
  }
}

export const validateJsonSchema = (schema: JsonSchema, value: unknown) => {
  const errors: string[] = []

  const visit = (currentSchema: JsonSchema, currentValue: unknown, path: string) => {
    if (currentSchema.enum && !currentSchema.enum.includes(currentValue)) {
      errors.push(`${path} 不在枚举范围内`)
      return
    }

    const types = normalizeTypes(currentSchema.type)
    if (types.length > 0 && !types.some((type) => matchesType(currentValue, type))) {
      errors.push(`${path} 类型应为 ${types.join(' | ')}`)
      return
    }

    const inferredObjectSchema = !currentSchema.type && currentSchema.properties
    if (currentSchema.type === 'object' || inferredObjectSchema) {
      if (!matchesType(currentValue, 'object')) {
        errors.push(`${path} 应为对象`)
        return
      }
      const record = currentValue as Record<string, unknown>
      if (currentSchema.required) {
        currentSchema.required.forEach((key) => {
          if (!(key in record)) {
            errors.push(`${path}.${key} 为必填字段`)
          }
        })
      }
      if (currentSchema.properties) {
        Object.entries(currentSchema.properties).forEach(([key, subSchema]) => {
          if (key in record) {
            visit(subSchema, record[key], `${path}.${key}`)
          }
        })
      }
      return
    }

    if (currentSchema.type === 'array' && currentSchema.items) {
      if (!Array.isArray(currentValue)) {
        errors.push(`${path} 应为数组`)
        return
      }
      currentValue.forEach((item, index) => visit(currentSchema.items as JsonSchema, item, `${path}[${index}]`))
    }
  }

  visit(schema, value, '$')

  return {
    valid: errors.length === 0,
    errors
  }
}
