import http from 'node:http'
import { handleApiRequest } from './api-handler.mjs'

const port = Number(process.env.INFRA_LENS_API_PORT || 8787)
const server = http.createServer(handleApiRequest)

server.listen(port, () => {
  console.log(`Infra-Lens API listening on http://localhost:${port}`)
})
