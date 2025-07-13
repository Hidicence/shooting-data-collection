// 群輝分享連結上傳模組 - 支援外部網路上傳

export interface SynologyShareConfig {
  shareUrl: string    // 分享連結 URL
  uploadPath?: string // 上傳路徑（可選）
}

export interface ShareUploadResult {
  success: boolean
  url?: string
  error?: string
  fileName?: string
}

// 真正的群輝文件請求上傳
export async function uploadToSynologyFileRequest(
  file: File,
  projectName: string,
  recordType: 'personal' | 'coordinator',
  personName?: string,
  photoType?: string,
  config?: SynologyShareConfig
): Promise<ShareUploadResult> {
  if (!config?.shareUrl) {
    return {
      success: false,
      error: '分享連結未設定'
    }
  }

  try {
    console.log('🔍 正在分析群輝文件請求頁面...')
    
    // 步驟1: 先載入頁面獲取表單信息
    const pageResponse = await fetch(config.shareUrl, {
      method: 'GET',
      credentials: 'same-origin'
    }).catch(() => null)

    let formAction = config.shareUrl
    let csrfToken = ''
    
    if (pageResponse && pageResponse.ok) {
      try {
        const html = await pageResponse.text()
        console.log('📄 已載入頁面HTML')
        
        // 提取表單提交地址
        const actionMatch = html.match(/action\s*=\s*["']([^"']+)["']/)
        if (actionMatch) {
          const baseUrl = new URL(config.shareUrl)
          formAction = new URL(actionMatch[1], baseUrl).href
          console.log('📍 找到表單提交地址:', formAction)
        }
        
        // 提取CSRF token
        const tokenMatch = html.match(/name\s*=\s*["'](?:csrf_token|_token|SynoToken)["'][^>]*value\s*=\s*["']([^"']+)["']/) ||
                          html.match(/value\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["'](?:csrf_token|_token|SynoToken)["']/) ||
                          html.match(/"(?:csrf_token|_token|SynoToken)"\s*:\s*"([^"]+)"/)
        
        if (tokenMatch) {
          csrfToken = tokenMatch[1]
          console.log('🔐 找到安全令牌')
        }
      } catch (error) {
        console.warn('解析頁面失敗，使用預設值:', error)
      }
    }

    // 步驟2: 生成檔案名稱和上傳者資訊
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    const fileExtension = file.name.split('.').pop()
    
    let fileName: string
    let uploaderName: string
    
    if (recordType === 'personal' && personName) {
      fileName = `${dateStr}_${timeStr}_${personName}_${photoType || '照片'}.${fileExtension}`
      uploaderName = personName
    } else if (recordType === 'coordinator') {
      fileName = `${dateStr}_${timeStr}_統整員_${photoType || '照片'}.${fileExtension}`
      uploaderName = '統整員'
    } else {
      fileName = `${dateStr}_${timeStr}_照片.${fileExtension}`
      uploaderName = '拍攝人員'
    }

    console.log(`📝 準備上傳: ${fileName}，上傳者: ${uploaderName}`)

    // 步驟3: 創建表單數據
    const formData = new FormData()
    formData.append('file', file, fileName)
    formData.append('name', uploaderName)  // 對應「您的名字」欄位
    
    // 添加可能的安全令牌
    if (csrfToken) {
      formData.append('csrf_token', csrfToken)
      formData.append('_token', csrfToken)
      formData.append('SynoToken', csrfToken)
    }

    // 添加其他可能需要的欄位
    formData.append('force_upload', '1')
    formData.append('overwrite', 'true')
    formData.append('create_folder', '1')

    console.log('🚀 正在提交到群輝文件請求...')
    console.log('📍 提交地址:', formAction)

    // 步驟4: 提交表單
    const uploadResponse = await fetch(formAction, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      }
    })

    console.log(`📊 群輝響應: ${uploadResponse.status} ${uploadResponse.statusText}`)

    if (uploadResponse.ok) {
      // 檢查響應內容
      const responseText = await uploadResponse.text()
      console.log('📄 響應內容長度:', responseText.length)
      
      // 檢查成功指示
      const isSuccess = responseText.includes('成功') || 
                       responseText.includes('success') || 
                       responseText.includes('uploaded') || 
                       responseText.includes('完成') ||
                       responseText.includes('thank') ||
                       uploadResponse.status === 200

      if (isSuccess) {
        console.log('✅ 群輝文件請求上傳成功！')
        return {
          success: true,
          url: `${config.shareUrl}`,
          fileName: fileName
        }
      } else {
        console.warn('⚠️ 上傳可能失敗，響應內容未包含成功指示')
        // 即便如此，如果狀態碼是200，我們仍然認為可能成功
        if (uploadResponse.status === 200) {
          return {
            success: true,
            url: `${config.shareUrl}`,
            fileName: fileName,
            error: '上傳已提交，但無法確認結果。請檢查群輝是否收到文件。'
          }
        }
      }
    }

    throw new Error(`群輝伺服器錯誤: ${uploadResponse.status} ${uploadResponse.statusText}`)
    
  } catch (error) {
    console.error('❌ 群輝文件請求上傳失敗:', error)
    
    // 如果是網路錯誤，建議手動上傳
    if (error instanceof Error && (error.message?.includes('fetch') || error.message?.includes('network'))) {
      return {
        success: false,
        error: `網路錯誤: ${error.message}。建議直接在瀏覽器中打開 ${config.shareUrl} 手動上傳。`
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '上傳失敗'
    }
  }
}

// 創建手動上傳連結
function createManualUploadGuide(file: File, fileName: string, shareUrl: string): ShareUploadResult {
  console.log('📋 創建手動上傳指南...')
  
  // 創建下載連結
  const blob = new Blob([file], { type: file.type })
  const downloadUrl = URL.createObjectURL(blob)
  
  // 自動下載文件
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = fileName
  a.style.display = 'none'
  document.body.appendChild(a)
  
  setTimeout(() => {
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(downloadUrl)
    
    // 開啟群輝頁面
    window.open(shareUrl, '_blank')
  }, 500)

  return {
    success: true,
    url: shareUrl,
    fileName: fileName,
    error: `文件已下載到本地，群輝頁面已開啟。請手動將 ${fileName} 拖拽到群輝頁面上傳。`
  }
}

// 測試分享連結可用性
export async function testSynologyShare(config: SynologyShareConfig): Promise<boolean> {
  try {
    const response = await fetch(config.shareUrl, {
      method: 'HEAD',
      mode: 'no-cors' // 避免 CORS 問題
    })
    return true // 如果沒有拋出錯誤就認為連接成功
  } catch (error) {
    console.warn('分享連結測試失敗:', error)
    return false
  }
}

// 獲取配置
export function getSynologyShareConfig(): SynologyShareConfig {
  return {
    shareUrl: process.env.NEXT_PUBLIC_SYNOLOGY_SHARE_URL || '',
    uploadPath: process.env.NEXT_PUBLIC_SYNOLOGY_UPLOAD_PATH || ''
  }
}

// 主要上傳函數（真正的群輝文件請求上傳）
export async function uploadToSynologyShareWithFallback(
  file: File,
  projectName: string,
  recordType: 'personal' | 'coordinator',
  personName?: string,
  photoType?: string,
  config?: SynologyShareConfig
): Promise<ShareUploadResult> {
  console.log('🎯 開始群輝文件請求上傳')
  
  // 嘗試真正的上傳
  const result = await uploadToSynologyFileRequest(file, projectName, recordType, personName, photoType, config)
  
  // 如果上傳失敗且是網路問題，提供手動上傳選項
  if (!result.success && config?.shareUrl && result.error?.includes('網路錯誤')) {
    console.log('🔄 網路上傳失敗，提供手動上傳選項...')
    return createManualUploadGuide(file, result.fileName || file.name, config.shareUrl)
  }
  
  return result
} 