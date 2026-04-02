import { logForDebugging } from '../debug.js'

export type FetchCustomApiModelsInput = {
  baseURL: string
  apiKey: string
  provider?: 'anthropic' | 'openai'
}

export type FetchCustomApiModelsResult =
  | { ok: true; models: string[] }
  | { ok: false; error: string }

function joinBaseUrl(baseURL: string, path: string): string {
  const b = baseURL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

function parseModelsJson(json: unknown): string[] | null {
  if (!json || typeof json !== 'object') {
    return null
  }
  const data = (json as { data?: unknown }).data
  if (!Array.isArray(data)) {
    return null
  }
  const ids: string[] = []
  for (const item of data) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as { id?: unknown }).id === 'string'
    ) {
      ids.push((item as { id: string }).id)
    }
  }
  return ids.length ? [...new Set(ids)].sort((a, b) => a.localeCompare(b)) : null
}

async function tryFetch(
  url: string,
  headers: Record<string, string>,
  ms: number,
): Promise<Response | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: ctrl.signal,
    })
    return res
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

/**
 * 使用用户配置的 baseURL + API Key 拉取模型列表。
 * - OpenAI 兼容：Authorization: Bearer，GET /v1/models
 * - Anthropic 风格：x-api-key + anthropic-version，GET /v1/models
 * 若首选失败，会尝试另一种鉴权方式（适配国内常见聚合网关）。
 */
export async function fetchCustomApiModelList(
  input: FetchCustomApiModelsInput,
): Promise<FetchCustomApiModelsResult> {
  const baseURL = input.baseURL.trim()
  const apiKey = input.apiKey.trim()
  if (!baseURL || !apiKey) {
    return { ok: false, error: '未配置 API 地址或密钥' }
  }

  const url = joinBaseUrl(baseURL, '/v1/models')
  const timeout = 15000
  const provider = input.provider ?? 'anthropic'

  const openaiHeaders = { Authorization: `Bearer ${apiKey}` }
  const anthropicHeaders = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  }

  const attempts: Array<{ name: string; headers: Record<string, string> }> =
    provider === 'openai'
      ? [
          { name: 'openai', headers: openaiHeaders },
          { name: 'anthropic', headers: anthropicHeaders },
        ]
      : [
          { name: 'anthropic', headers: anthropicHeaders },
          { name: 'openai', headers: openaiHeaders },
        ]

  for (const { name, headers } of attempts) {
    const res = await tryFetch(url, headers, timeout)
    if (!res) {
      logForDebugging(`[fetchCustomApiModelList] ${name}: network/timeout`)
      continue
    }
    if (!res.ok) {
      logForDebugging(
        `[fetchCustomApiModelList] ${name}: HTTP ${res.status}`,
      )
      continue
    }
    let json: unknown
    try {
      json = await res.json()
    } catch {
      continue
    }
    const models = parseModelsJson(json)
    if (models) {
      logForDebugging(
        `[fetchCustomApiModelList] ${name}: ok, ${models.length} models`,
      )
      return { ok: true, models }
    }
  }

  return {
    ok: false,
    error:
      '无法从当前地址拉取模型列表（需支持 GET /v1/models）。请检查地址、密钥或兼容模式（OpenAI / Anthropic）。',
  }
}
