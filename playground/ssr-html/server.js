import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import rateLimit from 'express-rate-limit'

const isTest = process.env.VITEST

const DYNAMIC_SCRIPTS = `
  <script type="module">
    const p = document.createElement('p');
    p.innerHTML = '✅ Dynamically injected inline script';
    document.body.appendChild(p);
  </script>
  <script type="module" src="/src/app.js"></script>
`

const DYNAMIC_STYLES = `
  <style>
  h1 {
    background-color: blue;
  }
  </style>
`

export async function createServer(root = process.cwd(), hmrPort) {
  const resolve = (p) => path.resolve(import.meta.dirname, p)
  const HTML_ROOT = resolve('.')

  const app = express()

  const htmlRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })

  /**
   * @type {import('vite').ViteDevServer}
   */
  const vite = await (
    await import('vite')
  ).createServer({
    root,
    logLevel: isTest ? 'error' : 'info',
    server: {
      middlewareMode: true,
      watch: {
        // During tests we edit the files too fast and sometimes chokidar
        // misses change events, so enforce polling for consistency
        usePolling: true,
        interval: 100,
      },
      hmr: {
        port: hmrPort,
      },
    },
    appType: 'custom',
    plugins: [
      {
        name: 'virtual-file',
        resolveId(id) {
          if (id === 'virtual:file') {
            return '\0virtual:file'
          }
        },
        load(id) {
          if (id === '\0virtual:file') {
            return 'import { virtual } from "/src/importedVirtual.js"; export { virtual };'
          }
        },
      },
    ],
  })
  // use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*all', htmlRequestLimiter, async (req, res, next) => {
    try {
      let [url] = req.originalUrl.split('?')
      if (url.endsWith('/')) url += 'index.html'

      if (url.startsWith('/favicon.ico')) {
        return res.status(404).end('404')
      }
      if (url.startsWith('/@id/__x00__')) {
        return next()
      }

      // Resolve the requested HTML file relative to a fixed root and
      // ensure that the final path stays within that root.
      const candidatePath = path.resolve(HTML_ROOT, `.${url}`)
      let htmlLoc
      try {
        htmlLoc = fs.realpathSync(candidatePath)
      } catch {
        return res.status(404).end('404')
      }
      if (!htmlLoc.startsWith(HTML_ROOT + path.sep) && htmlLoc !== HTML_ROOT) {
        return res.status(403).end('403')
      }

      let template = fs.readFileSync(htmlLoc, 'utf-8')

      template = template.replace(
        '</body>',
        `${DYNAMIC_SCRIPTS}${DYNAMIC_STYLES}</body>`,
      )

      // Force calling transformIndexHtml with url === '/', to simulate
      // usage by ecosystem that was recommended in the SSR documentation
      // as `const url = req.originalUrl`
      const html = await vite.transformIndexHtml('/', template)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite && vite.ssrFixStacktrace(e)
      console.log(e.stack)
      res.status(500).end('Internal Server Error')
    }
  })

  return { app, vite }
}

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(5173, () => {
      console.log('http://localhost:5173')
    }),
  )
}
