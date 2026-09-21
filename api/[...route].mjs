import { handleApiRequest } from '../server/api-handler.mjs'

export default function handler(request, response) {
  return handleApiRequest(request, response)
}
