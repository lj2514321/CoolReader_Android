import type { WebDAVConfig, SyncProgressEvent } from '../types'
import { loadBookData, saveBook, saveBookData } from './db'
import ePub from 'epubjs'

function authHeader(config: WebDAVConfig): string {
  return 'Basic ' + btoa(`${config.username}:${config.password}`)
}

function baseUrl(config: WebDAVConfig): string {
  return config.url.replace(/\/+$/, '') + config.path
}

export async function testConnection(config: WebDAVConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(baseUrl(config), {
      method: 'PROPFIND',
      headers: {
        Authorization: authHeader(config),
        Depth: '0',
      },
    })
    if (res.status === 401 || res.status === 403) {
      return { success: false, error: '认证失败，请检查用户名和密码' }
    }
    if (!res.ok) {
      return { success: false, error: `连接失败 (${res.status})` }
    }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || '连接失败' }
  }
}

export async function listRemoteFiles(config: WebDAVConfig): Promise<{ filename: string; updatedAt: number }[]> {
  const res = await fetch(baseUrl(config), {
    method: 'PROPFIND',
    headers: {
      Authorization: authHeader(config),
      Depth: '1',
    },
  })
  if (!res.ok) throw new Error(`列表获取失败 (${res.status})`)
  const text = await res.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(text, 'text/xml')
  const responses = xml.querySelectorAll('d\\:response, response')
  const files: { filename: string; updatedAt: number }[] = []
  for (const resp of responses) {
    const href = resp.querySelector('d\\:href, href')?.textContent || ''
    if (href.endsWith('/')) continue
    const displayName = decodeURIComponent(href.split('/').pop() || href)
    const propstat = resp.querySelector('d\\:propstat, propstat')
    const modified = propstat?.querySelector('d\\:getlastmodified, getlastmodified')?.textContent || ''
    const displayNameEl = propstat?.querySelector('d\\:displayname, displayname')?.textContent || ''
    const filename = displayNameEl || displayName
    const updatedAt = modified ? new Date(modified).getTime() : 0
    files.push({ filename, updatedAt: isNaN(updatedAt) ? 0 : updatedAt })
  }
  return files
}

export async function uploadFile(config: WebDAVConfig, filename: string, data: ArrayBuffer): Promise<void> {
  const res = await fetch(`${baseUrl(config)}/${encodeURIComponent(filename)}`, {
    method: 'PUT',
    headers: {
      Authorization: authHeader(config),
      'Content-Type': 'application/octet-stream',
    },
    body: data,
  })
  if (!res.ok) throw new Error(`上传失败 (${res.status})`)
}

export async function downloadFile(config: WebDAVConfig, filename: string): Promise<ArrayBuffer> {
  const res = await fetch(`${baseUrl(config)}/${encodeURIComponent(filename)}`, {
    headers: { Authorization: authHeader(config) },
  })
  if (!res.ok) throw new Error(`下载失败 (${res.status})`)
  return res.arrayBuffer()
}

export async function deleteRemote(config: WebDAVConfig, filename: string): Promise<void> {
  const res = await fetch(`${baseUrl(config)}/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader(config) },
  })
  if (!res.ok) throw new Error(`删除失败 (${res.status})`)
}

async function uploadProgressData(config: WebDAVConfig, filename: string, data: any): Promise<void> {
  const json = JSON.stringify(data)
  const res = await fetch(`${baseUrl(config)}/${filename}`, {
    method: 'PUT',
    headers: {
      Authorization: authHeader(config),
      'Content-Type': 'application/json',
    },
    body: json,
  })
  if (!res.ok) throw new Error(`上传进度失败 (${res.status})`)
}

async function downloadProgressData(config: WebDAVConfig, filename: string): Promise<any> {
  const res = await fetch(`${baseUrl(config)}/${filename}`, {
    headers: { Authorization: authHeader(config) },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`下载进度失败 (${res.status})`)
  return res.json()
}

export async function syncAll(
  config: WebDAVConfig,
  localBooks: any[],
  localProgress: any[],
  localReadingTime: any,
  onProgress: (evt: SyncProgressEvent) => void,
): Promise<{ success: boolean; uploaded: number; downloaded: number; errors: string[] }> {
  const errors: string[] = []
  let uploaded = 0
  let downloaded = 0

  try {
    onProgress({ phase: 'connect', message: '正在连接...' })
    const conn = await testConnection(config)
    if (!conn.success) {
      return { success: false, uploaded: 0, downloaded: 0, errors: [conn.error || '连接失败'] }
    }

    onProgress({ phase: 'list', message: '正在扫描远程文件列表...' })
    const remoteFiles = await listRemoteFiles(config)
    const remoteBookNames = new Set(remoteFiles.map(f => f.filename))

    // Upload local books that don't exist remotely
    for (let i = 0; i < localBooks.length; i++) {
      const book = localBooks[i]
      const epubName = (book.filePath?.split('/')?.pop() || book.filePath?.split('\\')?.pop() || 'book.epub').replace(/[<>:"/\\|?*]/g, '_')
      if (!remoteBookNames.has(epubName)) {
        onProgress({ phase: 'upload', message: `上传: ${book.title || epubName}`, current: i + 1, total: localBooks.length })
        try {
          const data = await loadBookData(book.filePath)
          if (data) {
            await uploadFile(config, epubName, data)
            uploaded++
          }
        } catch (e: any) {
          errors.push(`上传 ${epubName} 失败: ${e.message}`)
        }
      }
    }

    onProgress({ phase: 'download', message: '正在同步远程书籍...' })
    // Download remote books not in local
    for (let i = 0; i < remoteFiles.length; i++) {
      const rf = remoteFiles[i]
      if (!rf.filename.endsWith('.epub')) continue
      const localMatch = localBooks.find((b: any) =>
        (b.filePath?.split('/')?.pop() || b.filePath?.split('\\')?.pop()) === rf.filename ||
        (b.filePath?.split('/')?.pop() || b.filePath?.split('\\')?.pop())?.replace(/[<>:"/\\|?*]/g, '_') === rf.filename
      )
      if (!localMatch) {
        onProgress({ phase: 'download', message: `下载: ${rf.filename}`, current: i + 1, total: remoteFiles.length })
        try {
          const data = await downloadFile(config, rf.filename)
          // Save to IndexedDB
          const filePath = `webdav:/${rf.filename}`
          await saveBookData(filePath, data)
          // Extract metadata
          const book = ePub(data)
          await book.ready
          const { title, creator } = book.packaging.metadata
          let cover: string | undefined
          try {
            const coverUrl = await book.coverUrl()
            if (coverUrl) {
              const resp = await fetch(coverUrl)
              const blob = await resp.blob()
              cover = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.readAsDataURL(blob)
              })
            }
          } catch {}
          book.destroy()
          await saveBook({ filePath, title: title || rf.filename, author: creator || '', cover })
          downloaded++
        } catch (e: any) {
          errors.push(`下载 ${rf.filename} 失败: ${e.message}`)
        }
      }
    }

    // Sync progress data
    onProgress({ phase: 'progress', message: '正在同步阅读进度...' })
    try {
      const localProgressData = localProgress.map((p: any) => ({ filePath: p.filePath, progress: p.progress, cfi: p.cfi, index: p.index, updatedAt: p.updatedAt }))
      const remoteProgress = await downloadProgressData(config, 'reading_progress.json')
      if (remoteProgress) {
        // Merge: take newer
        for (const rp of remoteProgress) {
          const lp = localProgressData.find((p: any) => p.filePath === rp.filePath)
          if (!lp || rp.updatedAt > lp.updatedAt) {
            localProgressData.push(rp)
          }
        }
      }
      await uploadProgressData(config, 'reading_progress.json', localProgressData)
    } catch (e: any) {
      errors.push(`同步阅读进度失败: ${e.message}`)
    }

    onProgress({ phase: 'readingTime', message: '正在同步阅读时间...' })
    try {
      const remoteTime = await downloadProgressData(config, 'reading_time.json')
      if (remoteTime && typeof remoteTime === 'object') {
        // Merge: sum per date
        const merged = { ...remoteTime }
        for (const [date, secs] of Object.entries(localReadingTime)) {
          merged[date] = (merged[date] || 0) + (secs as number)
        }
        await uploadProgressData(config, 'reading_time.json', merged)
      } else {
        await uploadProgressData(config, 'reading_time.json', localReadingTime)
      }
    } catch (e: any) {
      errors.push(`同步阅读时间失败: ${e.message}`)
    }

    onProgress({ phase: 'done', message: `同步完成 (上传 ${uploaded}, 下载 ${downloaded})` })
    return { success: true, uploaded, downloaded, errors }
  } catch (e: any) {
    onProgress({ phase: 'done', message: `同步失败: ${e.message}` })
    return { success: false, uploaded, downloaded, errors: [e.message] }
  }
}
