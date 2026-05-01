#!/usr/bin/env node

import { createServer } from './server'
import { runStdio } from './transport/stdio'


const main = (): void => {
  const server = createServer()
  runStdio(server)
}

main()
