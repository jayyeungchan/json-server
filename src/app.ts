import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { App, type Request } from '@tinyhttp/app'
import { cors } from '@tinyhttp/cors'
import { Eta } from 'eta'
import { Low } from 'lowdb'
import { json } from 'milliparsec'
import sirv from 'sirv'

import { Data, isItem, Service } from './service.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isProduction = process.env['NODE_ENV'] === 'production'

type QueryValue = Request['query'][string] | number
type Query = Record<string, QueryValue>

export type AppOptions = {
  logger?: boolean
  static?: string[]
}

const eta = new Eta({
  views: join(__dirname, '../views'),
  cache: isProduction,
})

export function createApp(db: Low<Data>, options: AppOptions = {}) {
  // Create service
  const service = new Service(db)

  // Create app
  const app = new App()

  // Static files
  app.use(sirv('public', { dev: !isProduction }))
  options.static
    ?.map((path) => (isAbsolute(path) ? path : join(process.cwd(), path)))
    .forEach((dir) => app.use(sirv(dir, { dev: !isProduction })))

  // CORS - 安全配置
  const corsOptions = {
    // 允许的来源（生产环境应该明确指定）
    origin: isProduction
      ? process.env['ALLOWED_ORIGINS']?.split(',') || false
      : true, // 开发环境允许所有来源
    // 允许的HTTP方法
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // 允许的请求头
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    // 允许发送凭据
    credentials: false,
    // 预检请求缓存时间（秒）
    maxAge: 86400, // 24小时
    // 暴露的响应头
    exposedHeaders: ['X-Total-Count'],
  }

  app
    .use((req, res, next) => {
      // 动态处理请求头
      const requestedHeaders = req.headers['access-control-request-headers']
      if (requestedHeaders) {
        const headers = requestedHeaders.split(',').map((h) => h.trim())
        // 只允许安全的请求头
        const safeHeaders = headers.filter(header =>
          corsOptions.allowedHeaders.includes(header) ||
          header.toLowerCase().startsWith('x-custom-')
        )
        return cors({
          ...corsOptions,
          allowedHeaders: [...corsOptions.allowedHeaders, ...safeHeaders]
        })(req, res, next)
      }
      return cors(corsOptions)(req, res, next)
    })
    .options('*', cors(corsOptions))

  // 请求大小限制和安全中间件
  app.use((req, res, next) => {
    // 请求大小限制 (5MB)
    const contentLength = req.headers['content-length']
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      res.status(413).json({ error: 'Request entity too large' })
      return
    }

    // 基本的请求头验证
    const userAgent = req.headers['user-agent']
    if (!userAgent || userAgent.length > 1000) {
      res.status(400).json({ error: 'Invalid or missing User-Agent header' })
      return
    }

    next?.()
  })

  // Body parser with size limit
  // @ts-expect-error expected
  app.use(json({ limit: '5mb' }))

  app.get('/', (_req, res) =>
    res.send(eta.render('index.html', { data: db.data })),
  )

  app.get('/:name', (req, res, next) => {
    const { name = '' } = req.params
    const query: Query = {}

    Object.keys(req.query).forEach((key) => {
      let value: QueryValue = req.query[key]

      if (
        ['_start', '_end', '_limit', '_page', '_per_page'].includes(key) &&
        typeof value === 'string'
      ) {
        value = parseInt(value);
      }
  
      if (!Number.isNaN(value)) {
        query[key] = value;
      }
    })
    res.locals['data'] = service.find(name, query)
    next?.()
  })

  app.get('/:name/:id', (req, res, next) => {
    const { name = '', id = '' } = req.params
    res.locals['data'] = service.findById(name, id, req.query)
    next?.()
  })

  app.post('/:name', async (req, res, next) => {
    const { name = '' } = req.params
    if (isItem(req.body)) {
      res.locals['data'] = await service.create(name, req.body)
    }
    next?.()
  })

  app.put('/:name', async (req, res, next) => {
    const { name = '' } = req.params
    if (isItem(req.body)) {
      res.locals['data'] = await service.update(name, req.body)
    }
    next?.()
  })

  app.put('/:name/:id', async (req, res, next) => {
    const { name = '', id = '' } = req.params
    if (isItem(req.body)) {
      res.locals['data'] = await service.updateById(name, id, req.body)
    }
    next?.()
  })

  app.patch('/:name', async (req, res, next) => {
    const { name = '' } = req.params
    if (isItem(req.body)) {
      res.locals['data'] = await service.patch(name, req.body)
    }
    next?.()
  })

  app.patch('/:name/:id', async (req, res, next) => {
    const { name = '', id = '' } = req.params
    if (isItem(req.body)) {
      res.locals['data'] = await service.patchById(name, id, req.body)
    }
    next?.()
  })

  app.delete('/:name/:id', async (req, res, next) => {
    const { name = '', id = '' } = req.params
    res.locals['data'] = await service.destroyById(
      name,
      id,
      req.query['_dependent'],
    )
    next?.()
  })

  app.use('/:name', (req, res) => {
    const { data } = res.locals
    if (data === undefined) {
      res.sendStatus(404)
    } else {
      if (req.method === 'POST') res.status(201)
      res.json(data)
    }
  })

  return app
}
