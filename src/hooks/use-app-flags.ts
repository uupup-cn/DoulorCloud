import * as React from "react"
import { appApi, type AppFlags } from "@/services/api"

/**
 * 站点公开开关（/api/app-flags）的前端状态。
 *
 * 设计取向：**读失败时按「全开」处理**，而不是把入口全部藏掉 ——
 * 开关接口挂了不该顺带把功能藏没（那是可用性事故），宁可多显示一个
 * 点进去被服务端 403 兜底的入口。真正的访问控制在服务端
 * （index.ts 对 /lab*、/gallery* 统一 403），前端显隐只是体验层。
 *
 * 模块级缓存：全 SPA 生命周期只拉一次，多处消费不重复请求。
 * 管理员改完开关后调 refreshAppFlags() 让外壳立刻收口/放开。
 */
const DEFAULT_FLAGS: AppFlags = { labEnabled: true }

let cache: AppFlags | null = null
let inflight: Promise<AppFlags> | null = null
const listeners = new Set<(flags: AppFlags) => void>()

function fetchFlags(): Promise<AppFlags> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = appApi
      .flags()
      .then((res) => {
        cache = res
        return res
      })
      .catch(() => DEFAULT_FLAGS) // 读不到 = 按全开兜底
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export function refreshAppFlags(): Promise<void> {
  cache = null
  const p = fetchFlags()
  return p.then((flags) => {
    for (const fn of listeners) fn(flags)
  })
}

export function useAppFlags(): AppFlags {
  const [flags, setFlags] = React.useState<AppFlags>(cache ?? DEFAULT_FLAGS)
  React.useEffect(() => {
    let alive = true
    const onChange = (next: AppFlags) => {
      if (alive) setFlags(next)
    }
    listeners.add(onChange)
    void fetchFlags().then((res) => {
      if (alive) setFlags(res)
    })
    return () => {
      alive = false
      listeners.delete(onChange)
    }
  }, [])
  return flags
}
