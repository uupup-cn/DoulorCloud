/**
 * 站点级公开开关（无需登录）。
 *
 * 只放「与登录态无关、且不敏感」的模块开关，供前端外壳决定入口是否展示。
 * 目前只有 AI 实验室 / 造物集的总开关（`lab_enabled`）：关掉时侧边栏隐藏
 * 「AI实验室」「造物集」，直接访问其路由也会被前端门禁拦下；服务端另有
 * 403 兜底（见 index.ts 的 dispatch，`/lab*`、`/gallery*` 前缀统一挡下）。
 *
 * 为什么不并进 `/api/me`：/me 需要登录，而游客态同样要按开关决定入口显隐；
 * 且这是个「改一次、下次请求即生效」的轻量读，独立端点便于前端做模块级缓存。
 */
import { getSettingBool } from "../settings"
import { json } from "../http"
import type { Env } from "../env"

/** GET /api/app-flags —— 前端外壳用的公开开关集合 */
export async function getAppFlags(env: Env): Promise<Response> {
  return json({
    /** AI 实验室 / 造物集是否开放（侧边栏显隐 + 路由门禁依据） */
    labEnabled: await getSettingBool(env, "lab_enabled"),
  })
}
