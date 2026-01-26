import { expect, type Page, type APIResponse } from '@playwright/test'

type ApiExpectation = {
  url: string | RegExp
  method?: string
}

type RealFeedbackStep = {
  action: () => Promise<void>
  ui: () => Promise<void>
  api: ApiExpectation
  persist: () => Promise<void>
  reload?: boolean
}

const matchesUrl = (url: string, matcher: string | RegExp) => {
  if (matcher instanceof RegExp) return matcher.test(url)
  return url.includes(matcher)
}

export const waitForApi = (page: Page, api: ApiExpectation): Promise<APIResponse> => {
  return page.waitForResponse((response) => {
    if (!matchesUrl(response.url(), api.url)) return false
    if (api.method && response.request().method() !== api.method) return false
    return true
  })
}

export const withRealFeedback = async (page: Page, step: RealFeedbackStep) => {
  const responsePromise = waitForApi(page, step.api)
  await step.action()
  const response = await responsePromise
  expect(response.ok()).toBeTruthy()
  await step.ui()
  if (step.reload ?? true) {
    await page.reload()
  }
  await step.persist()
}
