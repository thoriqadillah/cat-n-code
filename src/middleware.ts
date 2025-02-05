import { defineMiddleware } from 'astro/middleware'
import {  } from 'astro'

export const onRequest = defineMiddleware((ctx) => {
  const path = ctx.originPathname
  return ctx.redirect(`https://thoriqadillah.github.io${path}`)
})