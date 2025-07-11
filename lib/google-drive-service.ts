// Google Drive 服務 - 使用 OAuth2 認證自動上傳照片到指定的 Google Drive 資料夾
// 支援智能資料夾結構和自動檔案命名

// 擴展 Window 介面以支援 gapi 和 Google Identity Services
declare global {
  interface Window {
    gapi: any
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any
        }
      }
    }
  }
}

// Google Drive 配置
const GOOGLE_DRIVE_CONFIG = {
  // 您的共享資料夾 ID
  rootFolderId: '1ZAJwPDShYNhGRUCM5VIrbqGk8edYmFZl',
  // OAuth2 配置
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  scope: 'https://www.googleapis.com/auth/drive.file',
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
}

// 全域變數來儲存 OAuth2 token 和 gapi 實例
let accessToken: string | null = null
let gapi: any = null
let isInitialized = false

// 檢查是否配置了 Google Drive
const isGoogleDriveConfigured = () => {
  return !!(
    GOOGLE_DRIVE_CONFIG.clientId &&
    GOOGLE_DRIVE_CONFIG.rootFolderId
  )
}

// 初始化 Google API 客戶端（使用新的 Google Identity Services）
const initializeGoogleAPI = async (): Promise<void> => {
  if (typeof window === 'undefined') return
  if (isInitialized) return
  
  return new Promise((resolve, reject) => {
    // 載入新的 Google Identity Services 腳本
    const gsiScript = document.createElement('script')
    gsiScript.src = 'https://accounts.google.com/gsi/client'
    gsiScript.onload = () => {
      // 載入 Google API 客戶端
      const gapiScript = document.createElement('script')
      gapiScript.src = 'https://apis.google.com/js/api.js'
      gapiScript.onload = () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              discoveryDocs: [GOOGLE_DRIVE_CONFIG.discoveryDoc]
            })
            gapi = window.gapi
            isInitialized = true
            console.log('✅ Google API 初始化成功')
            resolve()
          } catch (error) {
            console.error('❌ Google API 初始化失敗:', error)
            reject(error)
          }
        })
      }
      gapiScript.onerror = reject
      document.head.appendChild(gapiScript)
    }
    gsiScript.onerror = reject
    document.head.appendChild(gsiScript)
  })
}

// 獲取 OAuth2 token（使用新的 Google Identity Services）
const getAccessToken = async (): Promise<string> => {
  if (!gapi) {
    await initializeGoogleAPI()
  }
  
  if (!accessToken) {
    console.log('🔐 需要用戶授權 Google Drive 存取權限...')
    
    accessToken = await new Promise((resolve, reject) => {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_DRIVE_CONFIG.clientId,
          scope: GOOGLE_DRIVE_CONFIG.scope,
          callback: (response: any) => {
            if (response.error) {
              console.error('❌ 用戶授權失敗:', response.error)
              reject(new Error('用戶拒絕授權或授權失敗'))
              return
            }
            
            console.log('✅ 獲取 OAuth2 token 成功')
            resolve(response.access_token)
          },
        })
        
        tokenClient.requestAccessToken()
      } catch (error) {
        console.error('❌ Token 客戶端初始化失敗:', error)
        reject(error)
      }
    })
  }
  
  if (!accessToken) {
    throw new Error('無法獲取 OAuth2 token')
  }
  
  return accessToken
}

// 使用 OAuth2 token 進行 API 呼叫
const apiCall = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = await getAccessToken()
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...options.headers
  }
  
  return fetch(url, {
    ...options,
    headers
  })
}

// 創建資料夾（如果不存在）
const createFolderIfNotExists = async (folderName: string, parentId: string): Promise<string> => {
  try {
    // 檢查資料夾是否已存在
    const checkUrl = `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and parents='${parentId}' and mimeType='application/vnd.google-apps.folder'`
    
    const checkResponse = await apiCall(checkUrl)
    const checkData = await checkResponse.json()
    
    if (checkData.files && checkData.files.length > 0) {
      // 資料夾已存在
      return checkData.files[0].id
    }
    
    // 創建新資料夾
    const createUrl = 'https://www.googleapis.com/drive/v3/files'
    const folderMetadata = {
      name: folderName,
      parents: [parentId],
      mimeType: 'application/vnd.google-apps.folder'
    }
    
    const createResponse = await apiCall(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folderMetadata)
    })
    
    const createData = await createResponse.json()
    return createData.id
    
  } catch (error) {
    console.error('創建資料夾失敗:', error)
    throw error
  }
}

// 創建完整的資料夾結構
const createFolderStructure = async (
  projectName: string,
  recordType: 'personal' | 'coordinator',
  userName?: string,
  date?: string
): Promise<string> => {
  try {
    // 1. 創建專案資料夾
    const projectFolderName = `${projectName}_拍攝數據`
    const projectFolderId = await createFolderIfNotExists(projectFolderName, GOOGLE_DRIVE_CONFIG.rootFolderId)
    
    // 2. 創建記錄類型資料夾
    const recordTypeFolderName = recordType === 'personal' ? '個人記錄' : '統整員記錄'
    const recordTypeFolderId = await createFolderIfNotExists(recordTypeFolderName, projectFolderId)
    
    if (recordType === 'personal' && userName) {
      // 3. 創建個人用戶資料夾
      const userFolderName = `${userName}_里程記錄`
      return await createFolderIfNotExists(userFolderName, recordTypeFolderId)
    } else if (recordType === 'coordinator' && date) {
      // 3. 創建日期資料夾
      const formattedDate = new Date(date).toISOString().split('T')[0]
      const dateFolderName = `${formattedDate}_現場數據`
      return await createFolderIfNotExists(dateFolderName, recordTypeFolderId)
    }
    
    return recordTypeFolderId
  } catch (error) {
    console.error('創建資料夾結構失敗:', error)
    throw error
  }
}

// 上傳照片到 Google Drive
export const uploadPhotoToGoogleDrive = async (
  file: File,
  projectName: string,
  recordType: 'personal' | 'coordinator',
  options: {
    userName?: string
    date?: string
    photoType?: 'departure' | 'return' | 'site'
  }
): Promise<string> => {
  if (!isGoogleDriveConfigured()) {
    throw new Error('Google Drive 未配置，請設定 NEXT_PUBLIC_GOOGLE_CLIENT_ID')
  }
  
  try {
    console.log('🔄 正在上傳照片到 Google Drive...')
    
    // 1. 創建資料夾結構
    const targetFolderId = await createFolderStructure(
      projectName,
      recordType,
      options.userName,
      options.date
    )
    
    // 2. 生成檔案名稱
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const photoTypeText = options.photoType === 'departure' ? '去程照片' 
                        : options.photoType === 'return' ? '回程照片' 
                        : '現場照片'
    const fileName = `${timestamp}_${photoTypeText}.${file.name.split('.').pop()}`
    
    // 3. 準備上傳
    const metadata = {
      name: fileName,
      parents: [targetFolderId]
    }
    
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)
    
    // 4. 上傳檔案
    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
    
    const response = await apiCall(uploadUrl, {
      method: 'POST',
      body: form
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Google Drive 上傳失敗: ${response.status} ${errorData}`)
    }
    
    const result = await response.json()
    const fileUrl = `https://drive.google.com/file/d/${result.id}/view`
    
    console.log('✅ 照片上傳成功到 Google Drive:', fileName)
    
    return fileUrl
    
  } catch (error) {
    console.error('❌ Google Drive 上傳失敗:', error)
    throw error
  }
}

// 檢查 Google Drive 配置狀態
export const getGoogleDriveInfo = () => {
  if (isGoogleDriveConfigured()) {
    return {
      mode: 'google-drive',
      configured: true,
      rootFolderId: GOOGLE_DRIVE_CONFIG.rootFolderId,
      description: '照片自動上傳到 Google Drive 並智能分類組織（需要用戶授權）'
    }
  }
  return {
    mode: 'local',
    configured: false,
    description: '需要配置 Google OAuth2 Client ID'
  }
}

export default {
  uploadPhotoToGoogleDrive,
  getGoogleDriveInfo,
  isGoogleDriveConfigured
} 