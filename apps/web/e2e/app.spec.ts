import { test, expect } from '@playwright/test'

test('basic navigation and chapter creation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('资源管理器')).toBeVisible()
  await page.getByRole('button', { name: '+ 新卷' }).click()
  await expect(page.getByText('新卷 1')).toBeVisible()

  const addChapterButton = page.getByRole('button', { name: '+ 章' }).first()
  await addChapterButton.click()
  await expect(page.getByRole('heading', { name: '第1章 新章节' })).toBeVisible()
})
