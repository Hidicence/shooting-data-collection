// Google Drive 服務 - 自動上傳照片到指定的 Google Drive 資料夾
// 支援智能資料夾結構和自動檔案命名

// Google Drive 配置
const GOOGLE_DRIVE_CONFIG = {
  // 您的共享資料夾 ID
  rootFolderId: '1ZAJwPDShYNhGRUCM5VIrbqGk8edYmFZl',
  // Google Drive API 端點
  apiUrl: 'https://www.googleapis.com/drive/v3/files',
  uploadUrl: 'https://www.googleapis.com/upload/drive/v3/files'
}

// 檢查是否配置了 Google Drive
const isGoogleDriveConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY &&
    GOOGLE_DRIVE_CONFIG.rootFolderId
  )
}

// 生成檔案路徑
const generateFilePath = (
  projectName: string,
  recordType: 'personal' | 'coordinator',
  userName: string,
  fileName: string,
  date: string
) => {
  const formattedDate = new Date(date).toISOString().split('T')[0]
  
  if (recordType === 'personal') {
    return `${projectName}_拍攝數據/個人記錄/${userName}_里程記錄/${formattedDate}_${fileName}`
  } else {
    return `${projectName}_拍攝數據/統整員記錄/${formattedDate}_現場數據/${fileName}`
  }
}

// 創建資料夾（如果不存在）
const createFolderIfNotExists = async (folderName: string, parentId: string): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY
  
  try {
    // 檢查資料夾是否已存在
    const checkUrl = `${GOOGLE_DRIVE_CONFIG.apiUrl}?q=name='${folderName}' and parents='${parentId}' and mimeType='application/vnd.google-apps.folder'&key=${apiKey}`
    
    const checkResponse = await fetch(checkUrl)
    const checkData = await checkResponse.json()
    
    if (checkData.files && checkData.files.length > 0) {
      // 資料夾已存在
      return checkData.files[0].id
    }
    
    // 創建新資料夾
    const createUrl = `${GOOGLE_DRIVE_CONFIG.apiUrl}?key=${apiKey}`
    const folderMetadata = {
      name: folderName,
      parents: [parentId],
      mimeType: 'application/vnd.google-apps.folder'
    }
    
    const createResponse = await fetch(createUrl, {
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
    throw new Error('Google Drive 未配置')
  }
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY
  
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
    const uploadUrl = `${GOOGLE_DRIVE_CONFIG.uploadUrl}?uploadType=multipart&key=${apiKey}`
    
    const response = await fetch(uploadUrl, {
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
      description: '照片自動上傳到 Google Drive 並智能分類組織'
    }
  }
  return {
    mode: 'local',
    configured: false,
    description: '需要配置 Google Drive API Key'
  }
}

export default {
  uploadPhotoToGoogleDrive,
  getGoogleDriveInfo,
  isGoogleDriveConfigured
} 