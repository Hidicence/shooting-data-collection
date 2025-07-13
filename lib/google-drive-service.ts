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

// 創建完整的資料夾結構 - 優化版
const createFolderStructure = async (
  projectName: string,
  recordType: 'personal' | 'coordinator',
  userName?: string,
  date?: string,
  category?: string,
  photoType?: 'departure' | 'return' | 'site'
): Promise<string> => {
  try {
    console.log('🔄 正在創建資料夾結構...')
    
    // 1. 創建專案主資料夾
    const projectFolderName = `📁 ${projectName}_拍攝數據集`
    const projectFolderId = await createFolderIfNotExists(projectFolderName, GOOGLE_DRIVE_CONFIG.rootFolderId)
    console.log(`✅ 專案資料夾創建成功: ${projectFolderName}`)
    
    // 2. 創建記錄類型主分類
    const recordTypeFolderName = recordType === 'personal' ? '👤 個人記錄' : '📊 統整員記錄'
    const recordTypeFolderId = await createFolderIfNotExists(recordTypeFolderName, projectFolderId)
    console.log(`✅ 記錄類型資料夾創建成功: ${recordTypeFolderName}`)
    
    if (recordType === 'personal' && userName) {
      // 個人記錄邏輯：簡潔結構 - 直接在個人資料夾內放照片
      const userFolderName = userName
      const userFolderId = await createFolderIfNotExists(userFolderName, recordTypeFolderId)
      console.log(`✅ 個人資料夾創建成功: ${userFolderName}`)
      
      // 直接返回個人資料夾，去程和回程照片都放在這裡
      return userFolderId
      
    } else if (recordType === 'coordinator' && date) {
      // 統整員記錄邏輯：按日期和分類
      const formattedDate = new Date(date).toISOString().split('T')[0]
      const dateFolderName = `📅 ${formattedDate}_現場數據記錄`
      const dateFolderId = await createFolderIfNotExists(dateFolderName, recordTypeFolderId)
      console.log(`✅ 日期資料夾創建成功: ${dateFolderName}`)
      
      // 創建分類子資料夾
      if (category) {
        const categoryMap: Record<string, string> = {
          'electricity': '⚡ 用電數據',
          'water': '💧 飲水數據', 
          'meal': '🍽️ 餐飲數據',
          'recycle': '♻️ 回收數據'
        }
        const categoryFolderName = categoryMap[category] || `📋 ${category}`
        const categoryFolderId = await createFolderIfNotExists(categoryFolderName, dateFolderId)
        console.log(`✅ 分類資料夾創建成功: ${categoryFolderName}`)
        
        return categoryFolderId
      }
      
      return dateFolderId
    }
    
    return recordTypeFolderId
  } catch (error) {
    console.error('❌ 創建資料夾結構失敗:', error)
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
    category?: string // 新增：用於統整員照片分類
    onProgress?: (progress: number) => void // 新增：上傳進度回調
  }
): Promise<string> => {
  if (!isGoogleDriveConfigured()) {
    throw new Error('Google Drive 未配置，請設定 NEXT_PUBLIC_GOOGLE_CLIENT_ID')
  }
  
  try {
    console.log('🔄 正在上傳照片到 Google Drive...')
    
    // 進度：10% - 開始處理
    if (options.onProgress) {
      options.onProgress(10)
    }
    
    // 1. 創建資料夾結構
    const targetFolderId = await createFolderStructure(
      projectName,
      recordType,
      options.userName,
      options.date,
      options.category,
      options.photoType // 傳遞照片類型參數
    )
    
    // 進度：30% - 資料夾結構建立完成
    if (options.onProgress) {
      options.onProgress(30)
    }
    
    // 2. 生成有邏輯性的檔案名稱
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
    
    let fileName = ''
    
    if (recordType === 'personal') {
      // 個人記錄：日期_時間_人員_類型.副檔名
      const photoTypeText = options.photoType === 'departure' ? '去程里程' 
                          : options.photoType === 'return' ? '回程里程' 
                          : '現場記錄'
      const userName = options.userName || '未知人員'
      fileName = `${dateStr}_${timeStr}_${userName}_${photoTypeText}.${file.name.split('.').pop()}`
    } else if (recordType === 'coordinator') {
      // 統整員記錄：日期_時間_分類_現場照片.副檔名
      const categoryText = options.category === 'electricity' ? '用電記錄'
                        : options.category === 'water' ? '飲水記錄'
                        : options.category === 'meal' ? '餐飲記錄'
                        : options.category === 'recycle' ? '回收記錄'
                        : '現場記錄'
      fileName = `${dateStr}_${timeStr}_${categoryText}_現場照片.${file.name.split('.').pop()}`
    } else {
      // 通用命名
      fileName = `${dateStr}_${timeStr}_拍攝記錄.${file.name.split('.').pop()}`
    }
    
    console.log(`📄 生成檔案名稱: ${fileName}`)
    
    // 3. 準備上傳
    const metadata = {
      name: fileName,
      parents: [targetFolderId]
    }
    
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)
    
    // 進度：40% - 開始上傳
    if (options.onProgress) {
      options.onProgress(40)
    }
    
    // 4. 上傳檔案 (使用 XMLHttpRequest 來支持進度監控)
    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
    const token = await getAccessToken()
    
    const fileUrl = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // 監控上傳進度
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && options.onProgress) {
          // 將上傳進度映射到 40%-90% 區間
          const uploadPercent = (event.loaded / event.total) * 50 // 50% 的進度空間
          options.onProgress(40 + uploadPercent)
        }
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText)
            const fileUrl = `https://drive.google.com/file/d/${result.id}/view`
            
            // 進度：100% - 完成
            if (options.onProgress) {
              options.onProgress(100)
            }
            
            resolve(fileUrl)
          } catch (error) {
            reject(new Error('解析回應失敗'))
          }
        } else {
          reject(new Error(`Google Drive 上傳失敗: ${xhr.status} ${xhr.responseText}`))
        }
      }
      
      xhr.onerror = () => {
        reject(new Error('網路錯誤'))
      }
      
      xhr.open('POST', uploadUrl)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(form)
    })
    
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

// 獲取完整的資料夾結構邏輯說明
export const getFolderStructureLogic = () => {
  return {
    description: '拍攝數據收集系統 - Google Drive 智能分類結構',
    structure: {
      root: 'Google Drive 根目錄',
      levels: [
        {
          level: 1,
          name: '📁 專案名稱_拍攝數據集',
          description: '每個專案的主資料夾',
          example: '📁 電影ABC_拍攝數據集'
        },
        {
          level: 2,
          name: '記錄類型分類',
          description: '按記錄類型分為兩大類',
          options: [
            '👤 個人記錄',
            '📊 統整員記錄'
          ]
        },
        {
          level: 3,
          name: '個人記錄子結構',
          description: '個人記錄按人員姓名分類，直接存放去程回程照片',
          structure: [
            {
              folder: '張三',
              description: '去程和回程照片直接放在此資料夾內'
            }
          ]
        },
        {
          level: 3,
          name: '統整員記錄子結構',
          description: '統整員記錄按日期和數據分類',
          structure: [
            {
              folder: '📅 2024-01-15_現場數據記錄',
              subFolders: [
                '⚡ 用電數據',
                '💧 飲水數據',
                '🍽️ 餐飲數據',
                '♻️ 回收數據'
              ]
            }
          ]
        }
      ]
    },
    fileNaming: {
      personal: {
        format: '日期_時間_人員_類型.副檔名',
        examples: [
          '2024-01-15_10-30-00_張三_去程里程.jpg',
          '2024-01-15_18-45-30_李四_回程里程.jpg'
        ]
      },
      coordinator: {
        format: '日期_時間_分類_說明.副檔名', 
        examples: [
          '2024-01-15_14-20-15_用電記錄_現場照片.jpg',
          '2024-01-15_16-35-42_餐飲記錄_現場照片.jpg'
        ]
      }
    },
         fullExample: {
       title: '完整資料夾結構範例',
       tree: `
📁 電影ABC_拍攝數據集/
├── 👤 個人記錄/
│   ├── 張三/
│   │   ├── 2024-01-15_08-30-00_張三_去程里程.jpg
│   │   └── 2024-01-15_20-15-30_張三_回程里程.jpg
│   └── 李四/
│       ├── 2024-01-15_09-00-00_李四_去程里程.jpg
│       └── 2024-01-15_19-30-00_李四_回程里程.jpg
└── 📊 統整員記錄/
    └── 📅 2024-01-15_現場數據記錄/
        ├── ⚡ 用電數據/
        │   ├── 2024-01-15_09-00-00_用電記錄_現場照片.jpg
        │   └── 2024-01-15_18-00-00_用電記錄_現場照片.jpg
        ├── 💧 飲水數據/
        │   └── 2024-01-15_12-30-00_飲水記錄_現場照片.jpg
        ├── 🍽️ 餐飲數據/
        │   └── 2024-01-15_13-00-00_餐飲記錄_現場照片.jpg
        └── ♻️ 回收數據/
            └── 2024-01-15_17-30-00_回收記錄_現場照片.jpg`
     },
         benefits: [
       '🎯 簡潔的層級結構，個人記錄一目了然',
       '📊 自動按人員和數據類型分類',
       '🔍 統一的文件命名規則，支援搜索',
       '📱 Emoji 圖標增強視覺識別度',
       '⚡ 智能進度顯示，實時上傳狀態',
       '🔒 只使用 Google Drive，安全可靠'
     ]
  }
}

export default {
  uploadPhotoToGoogleDrive,
  getGoogleDriveInfo,
  getFolderStructureLogic,
  isGoogleDriveConfigured
} 