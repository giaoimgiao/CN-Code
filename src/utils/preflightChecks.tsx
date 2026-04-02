import axios from 'axios'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { logEvent } from 'src/services/analytics/index.js'
import { Spinner } from '../components/Spinner.js'
import { getOauthConfig } from '../constants/oauth.js'
import { useTimeout } from '../hooks/useTimeout.js'
import { Box, Text, useInput } from '../ink.js'
import { getSSLErrorHint } from '../services/api/errorUtils.js'
import { getGlobalConfig } from './config.js'
import { isEnvTruthy } from './envUtils.js'
import { getUserAgent } from './http.js'
import { logError } from './log.js'

export interface PreflightCheckResult {
  success: boolean
  error?: string
  sslHint?: string
}

function shouldSkipAnthropicPreflightChecks(): boolean {
  if (isEnvTruthy(process.env.CLOUD_CODE_SKIP_ANTHROPIC_PREFLIGHT)) return true
  if (isEnvTruthy(process.env.DOGECODE_SKIP_ANTHROPIC_PREFLIGHT)) return true
  if (process.env.ANTHROPIC_BASE_URL?.trim()) return true
  const custom = getGlobalConfig().customApiEndpoint?.baseURL?.trim()
  if (custom) return true
  return false
}

async function checkEndpoints(): Promise<PreflightCheckResult> {
  try {
    if (shouldSkipAnthropicPreflightChecks()) {
      return { success: true }
    }

    const oauthConfig = getOauthConfig()
    const tokenUrl = new URL(oauthConfig.TOKEN_URL)
    const endpoints = [
      `${oauthConfig.BASE_API_URL}/api/hello`,
      `${tokenUrl.origin}/v1/oauth/hello`,
    ]

    const checkEndpoint = async (url: string): Promise<PreflightCheckResult> => {
      try {
        const response = await axios.get(url, {
          headers: { 'User-Agent': getUserAgent() },
        })
        if (response.status !== 200) {
          const hostname = new URL(url).hostname
          return {
            success: false,
            error: `无法连接 ${hostname}：HTTP ${response.status}`,
          }
        }
        return { success: true }
      } catch (error) {
        const hostname = new URL(url).hostname
        const sslHint = getSSLErrorHint(error)
        return {
          success: false,
          error: `无法连接 ${hostname}：${
            error instanceof Error
              ? (error as NodeJS.ErrnoException).code || error.message
              : String(error)
          }`,
          sslHint: sslHint ?? undefined,
        }
      }
    }

    const results = await Promise.all(endpoints.map(checkEndpoint))
    const failedResult = results.find(r => !r.success)

    if (failedResult) {
      logEvent('tengu_preflight_check_failed', {
        isConnectivityError: false,
        hasErrorMessage: !!failedResult.error,
        isSSLError: !!failedResult.sslHint,
      })
    }

    return failedResult || { success: true }
  } catch (error) {
    logError(error as Error)
    logEvent('tengu_preflight_check_failed', {
      isConnectivityError: true,
    })
    return {
      success: false,
      error: `连通性检查异常：${
        error instanceof Error
          ? (error as NodeJS.ErrnoException).code || error.message
          : String(error)
      }`,
    }
  }
}

interface PreflightStepProps {
  onSuccess: () => void
}

export function PreflightStep({ onSuccess }: PreflightStepProps): React.ReactNode {
  const [result, setResult] = useState<PreflightCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const continuedRef = useRef(false)
  const showSpinner = useTimeout(1000) && isChecking

  const advanceOnce = useCallback(() => {
    if (continuedRef.current) return
    continuedRef.current = true
    onSuccess()
  }, [onSuccess])

  useEffect(() => {
    void (async () => {
      const checkResult = await checkEndpoints()
      setResult(checkResult)
      setIsChecking(false)
    })()
  }, [])

  useEffect(() => {
    if (result?.success) {
      advanceOnce()
    }
  }, [result, advanceOnce])

  const failureActive = Boolean(result && !result.success && !isChecking)

  useInput(
    (_input, key) => {
      if (key.return && failureActive) {
        advanceOnce()
      }
    },
    { isActive: failureActive },
  )

  return (
    <Box flexDirection="column" gap={1} paddingLeft={1}>
      {isChecking && showSpinner ? (
        <Box paddingLeft={1}>
          <Spinner />
          <Text>Checking connectivity… · 正在检测网络连通性…</Text>
        </Box>
      ) : null}
      {!result?.success && !isChecking ? (
        <Box flexDirection="column" gap={1}>
          <Text color="error">
            无法连接到 Anthropic 官方鉴权相关服务（若您只用第三方兼容网关可忽略）
          </Text>
          <Text color="error">{result?.error}</Text>
          {result?.sslHint ? (
            <Box flexDirection="column" gap={1}>
              <Text>{result.sslHint}</Text>
              <Text color="suggestion">
                网络与代理说明见：https://code.claude.com/docs/en/network-config
              </Text>
            </Box>
          ) : (
            <Box flexDirection="column" gap={1}>
              <Text>
                请检查本机网络、代理或防火墙。使用华为云、自建或其它兼容接口时，进入主界面后执行
                /config 填写自定义 Base URL 与 API Key。
              </Text>
            </Box>
          )}
          <Text color="permission">
            Press <Text bold>Enter</Text> to continue · 按{' '}
            <Text bold>Enter</Text> 继续下一步（之后可用 /config 配置网关）
          </Text>
        </Box>
      ) : null}
    </Box>
  )
}
