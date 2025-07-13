// 群輝NAS照片上傳服務
// 支援 WebDAV、HTTP POST、File Station API 三種上傳方式

export interface NASUploadConfig {
  // 基本配置
  nasUrl: string              // NAS的URL，例如：https://your-nas.com:5001
  uploadMethod: 'webdav' | 'http' | 'filestation'
  
  // WebDAV配置
  webdavPath?: string         // WebDAV路徑，例如：/webdav/photos
  webdavUser?: string         // WebDAV用戶名（如果需要認證）
  webdavPass?: string         // WebDAV密碼（如果需要認證）
  
  // HTTP POST配置
  httpEndpoint?: string       // HTTP上傳端點，例如：/upload
  httpToken?: string          // HTTP認證Token（如果需要）
  
  // File Station API配置
  apiUser?: string            // File Station用戶名
  apiPass?: string            // File Station密碼
  targetFolder?: string       // 目標資料夾，例如：/photos
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  fileName?: string
}

// 生成檔案路徑的函數
export function generateNASFilePath(
  projectName: string,
  recordType: 'personal' | 'coordinator',
  personName?: string,
  date?: string,
  photoType?: string
): string {
  const now = new Date()
  const dateStr = date || now.toISOString().split('T')[0]
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
  
  if (recordType === 'personal' && personName) {
    return `${projectName}_拍攝數據集/👤 個人記錄/${personName}/${dateStr}_${timeStr}_${personName}_${photoType || '照片'}`
  } else if (recordType === 'coordinator') {
    return `${projectName}_拍攝數據集/📊 統整員記錄/📅 ${dateStr}_現場數據記錄/${photoType || '照片'}`
  }
  
  return `${projectName}_拍攝數據集/其他/${dateStr}_${timeStr}_照片`
}

// WebDAV上傳
async function uploadViaWebDAV(
  file: File,
  filePath: string,
  config: NASUploadConfig
): Promise<UploadResult> {
  try {
    const webdavUrl = `${config.nasUrl}${config.webdavPath}/${filePath}.${file.name.split('.').pop()}`
    
    const headers: Record<string, string> = {
      'Content-Type': file.type || 'application/octet-stream'
    }
    
    // 如果需要認證
    if (config.webdavUser && config.webdavPass) {
      const auth = btoa(`${config.webdavUser}:${config.webdavPass}`)
      headers['Authorization'] = `Basic ${auth}`
    }
    
    const response = await fetch(webdavUrl, {
      method: 'PUT',
      headers,
      body: file
    })
    
    if (response.ok) {
      return {
        success: true,
        url: webdavUrl,
        fileName: `${filePath}.${file.name.split('.').pop()}`
      }
    } else {
      throw new Error(`WebDAV上傳失敗: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }
  }
}

// HTTP POST上傳
async function uploadViaHTTP(
  file: File,
  filePath: string,
  config: NASUploadConfig
): Promise<UploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', filePath)
    formData.append('filename', `${filePath}.${file.name.split('.').pop()}`)
    
    const headers: Record<string, string> = {}
    
    // 如果需要認證Token
    if (config.httpToken) {
      headers['Authorization'] = `Bearer ${config.httpToken}`
    }
    
    const response = await fetch(`${config.nasUrl}${config.httpEndpoint}`, {
      method: 'POST',
      headers,
      body: formData
    })
    
    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        url: result.url || `${config.nasUrl}/photos/${filePath}.${file.name.split('.').pop()}`,
        fileName: `${filePath}.${file.name.split('.').pop()}`
      }
    } else {
      throw new Error(`HTTP上傳失敗: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }
  }
}

// File Station API上傳
async function uploadViaFileStation(
  file: File,
  filePath: string,
  config: NASUploadConfig
): Promise<UploadResult> {
  try {
    // 1. 登入獲取SID
    const loginData = new FormData()
    loginData.append('api', 'SYNO.API.Auth')
    loginData.append('version', '3')
    loginData.append('method', 'login')
    loginData.append('account', config.apiUser || '')
    loginData.append('passwd', config.apiPass || '')
    loginData.append('session', 'FileStation')
    loginData.append('format', 'sid')
    
    const loginResponse = await fetch(`${config.nasUrl}/webapi/auth.cgi`, {
      method: 'POST',
      body: loginData
    })
    
    const loginResult = await loginResponse.json()
    if (!loginResult.success) {
      throw new Error(`登入失敗: ${loginResult.error?.code}`)
    }
    
    const sid = loginResult.data.sid
    
    // 2. 上傳檔案
    const uploadData = new FormData()
    uploadData.append('api', 'SYNO.FileStation.Upload')
    uploadData.append('version', '2')
    uploadData.append('method', 'upload')
    uploadData.append('_sid', sid)
    uploadData.append('path', config.targetFolder || '/photos')
    uploadData.append('create_parents', 'true')
    uploadData.append('overwrite', 'true')
    uploadData.append('file', file, `${filePath}.${file.name.split('.').pop()}`)
    
    const uploadResponse = await fetch(`${config.nasUrl}/webapi/entry.cgi`, {
      method: 'POST',
      body: uploadData
    })
    
    const uploadResult = await uploadResponse.json()
    if (uploadResult.success) {
      return {
        success: true,
        url: `${config.nasUrl}/photos/${filePath}.${file.name.split('.').pop()}`,
        fileName: `${filePath}.${file.name.split('.').pop()}`
      }
    } else {
      throw new Error(`File Station上傳失敗: ${uploadResult.error?.code}`)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }
  }
}

// 主要上傳函數
export async function uploadPhotoToNAS(
  file: File,
  projectName: string,
  recordType: 'personal' | 'coordinator',
  personName?: string,
  photoType?: string,
  config?: NASUploadConfig
): Promise<UploadResult> {
  // 檢查配置
  if (!config) {
    return {
      success: false,
      error: 'NAS配置未設定'
    }
  }
  
  if (!config.nasUrl) {
    return {
      success: false,
      error: 'NAS URL未設定'
    }
  }
  
  // 生成檔案路徑
  const filePath = generateNASFilePath(projectName, recordType, personName, undefined, photoType)
  
  // 根據配置選擇上傳方式
  switch (config.uploadMethod) {
    case 'webdav':
      return await uploadViaWebDAV(file, filePath, config)
    case 'http':
      return await uploadViaHTTP(file, filePath, config)
    case 'filestation':
      return await uploadViaFileStation(file, filePath, config)
    default:
      return {
        success: false,
        error: '不支援的上傳方式'
      }
  }
}

// 檢查NAS連接
export async function checkNASConnection(config: NASUploadConfig): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${config.nasUrl}/webapi/query.cgi?api=SYNO.API.Info&version=1&method=query&query=SYNO.API.Auth`, {
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

// 獲取預設配置
export function getDefaultNASConfig(): NASUploadConfig {
  return {
    nasUrl: process.env.NEXT_PUBLIC_NAS_URL || '',
    uploadMethod: (process.env.NEXT_PUBLIC_NAS_UPLOAD_METHOD as any) || 'webdav',
    webdavPath: process.env.NEXT_PUBLIC_NAS_WEBDAV_PATH || '/webdav/photos',
    webdavUser: process.env.NEXT_PUBLIC_NAS_WEBDAV_USER || '',
    webdavPass: process.env.NEXT_PUBLIC_NAS_WEBDAV_PASS || '',
    httpEndpoint: process.env.NEXT_PUBLIC_NAS_HTTP_ENDPOINT || '/upload',
    httpToken: process.env.NEXT_PUBLIC_NAS_HTTP_TOKEN || '',
    apiUser: process.env.NEXT_PUBLIC_NAS_API_USER || '',
    apiPass: process.env.NEXT_PUBLIC_NAS_API_PASS || '',
    targetFolder: process.env.NEXT_PUBLIC_NAS_TARGET_FOLDER || '/photos'
  }
} 