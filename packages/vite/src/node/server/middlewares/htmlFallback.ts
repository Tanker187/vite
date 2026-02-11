import path from 'node:path'
import fs from 'node:fs'
import type { Connect } from '#dep-types/connect'
import { createDebugger, joinUrlSegments } from '../../utils'
import { cleanUrl } from '../../../shared/utils'
import type { DevEnvironment } from '../environment'
import { FullBundleDevEnvironment } from '../environments/fullBundleEnvironment'

const debug = createDebugger('vite:html-fallback')

export function htmlFallbackMiddleware(
  root: string,
  spaFallback: boolean,
  clientEnvironment?: DevEnvironment,
): Connect.NextHandleFunction {
  const normalizedRoot = path.resolve(root)
  const realRoot =
    fs.realpathSync.native?.(normalizedRoot) ?? fs.realpathSync(normalizedRoot)
  const realRootWithSep = realRoot + path.sep
  const memoryFiles =
    clientEnvironment instanceof FullBundleDevEnvironment
      ? clientEnvironment.memoryFiles
      : undefined

  function checkFileExists(relativePath: string) {
    // Ensure the path stays within the configured root directory
    const candidatePath = path.resolve(
      normalizedRoot,
      '.' + relativePath,
    )

    let realCandidatePath: string
    try {
      realCandidatePath =
        fs.realpathSync.native?.(candidatePath) ??
        fs.realpathSync(candidatePath)
    } catch {
      // If the path does not exist yet or cannot be resolved, treat it as missing
      return false
    }

    if (
      realCandidatePath !== realRoot &&
      !realCandidatePath.startsWith(realRootWithSep)
    ) {
      return false
    }

    return (
      memoryFiles?.has(
        relativePath.slice(1), // remove first /
      ) ?? fs.existsSync(realCandidatePath)
    )
  }

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteHtmlFallbackMiddleware(req, _res, next) {
    if (
      // Only accept GET or HEAD
      (req.method !== 'GET' && req.method !== 'HEAD') ||
      // Exclude default favicon requests
      req.url === '/favicon.ico' ||
      // Require Accept: text/html or */*
      !(
        req.headers.accept === undefined || // equivalent to `Accept: */*`
        req.headers.accept === '' || // equivalent to `Accept: */*`
        req.headers.accept.includes('text/html') ||
        req.headers.accept.includes('*/*')
      )
    ) {
      return next()
    }

    const url = cleanUrl(req.url!)
    let pathname
    try {
      pathname = decodeURIComponent(url)
    } catch {
      // ignore malformed URI
      return next()
    }

    // .html files are not handled by serveStaticMiddleware
    // so we need to check if the file exists
    if (pathname.endsWith('.html')) {
      if (checkFileExists(pathname)) {
        debug?.(`Rewriting ${req.method} ${req.url} to ${url}`)
        req.url = url
        return next()
      }
    }
    // trailing slash should check for fallback index.html
    else if (pathname.endsWith('/')) {
      if (checkFileExists(joinUrlSegments(pathname, 'index.html'))) {
        const newUrl = url + 'index.html'
        debug?.(`Rewriting ${req.method} ${req.url} to ${newUrl}`)
        req.url = newUrl
        return next()
      }
    }
    // non-trailing slash should check for fallback .html
    else {
      if (checkFileExists(pathname + '.html')) {
        const newUrl = url + '.html'
        debug?.(`Rewriting ${req.method} ${req.url} to ${newUrl}`)
        req.url = newUrl
        return next()
      }
    }

    if (spaFallback) {
      debug?.(`Rewriting ${req.method} ${req.url} to /index.html`)
      req.url = '/index.html'
    }

    next()
  }
}
