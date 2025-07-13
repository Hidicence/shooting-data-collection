// WebDAV 上傳功能
export interface WebDAVConfig {
  url: string;          // WebDAV 服務器 URL
  username: string;     // 用戶名
  password: string;     // 密碼
  basePath?: string;    // 基礎路徑
}

export interface WebDAVUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  path?: string;
}

// 將文件轉換為 ArrayBuffer
function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// 創建基本認證標頭
function createAuthHeader(username: string, password: string): string {
  const credentials = btoa(`${username}:${password}`);
  return `Basic ${credentials}`;
}

// 確保路徑格式正確
function normalizePath(path: string): string {
  // 移除開頭的斜線，確保路徑格式一致
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

// 檢查 WebDAV 連接
export async function testWebDAVConnection(config: WebDAVConfig): Promise<boolean> {
  try {
    console.log('🔍 測試 WebDAV 連接:', config.url);
    
    const response = await fetch(config.url, {
      method: 'PROPFIND',
      headers: {
        'Authorization': createAuthHeader(config.username, config.password),
        'Depth': '0',
        'Content-Type': 'application/xml',
      },
      body: '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop></prop></propfind>'
    });
    
    console.log('WebDAV 測試響應:', response.status);
    return response.status === 207 || response.status === 200; // 207 Multi-Status 是 WebDAV 的標準響應
  } catch (error) {
    console.error('WebDAV 連接測試失敗:', error);
    return false;
  }
}

// 創建目錄（如果不存在）
export async function createWebDAVDirectory(config: WebDAVConfig, dirPath: string): Promise<boolean> {
  try {
    const normalizedPath = normalizePath(dirPath);
    const fullUrl = `${config.url}/${normalizedPath}`;
    
    console.log('📁 創建 WebDAV 目錄:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'MKCOL',
      headers: {
        'Authorization': createAuthHeader(config.username, config.password),
      }
    });
    
    // 201 Created 或 405 Method Not Allowed (目錄已存在) 都算成功
    return response.status === 201 || response.status === 405;
  } catch (error) {
    console.error('創建 WebDAV 目錄失敗:', error);
    return false;
  }
}

// 上傳文件到 WebDAV
export async function uploadToWebDAV(
  file: File,
  config: WebDAVConfig,
  remotePath: string
): Promise<WebDAVUploadResult> {
  try {
    console.log('🌐 開始 WebDAV 上傳');
    console.log('📁 目標路徑:', remotePath);
    
    // 轉換文件為 ArrayBuffer
    const arrayBuffer = await fileToArrayBuffer(file);
    
    // 構建完整的上傳 URL
    const normalizedPath = normalizePath(remotePath);
    const uploadUrl = `${config.url}/${normalizedPath}`;
    
    console.log('🚀 上傳到:', uploadUrl);
    
    // 執行 WebDAV PUT 請求
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': createAuthHeader(config.username, config.password),
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
      body: arrayBuffer
    });
    
    console.log('📊 WebDAV 響應:', response.status, response.statusText);
    
    if (response.status === 201 || response.status === 204) {
      // 201 Created 或 204 No Content 表示成功
      console.log('✅ WebDAV 上傳成功!');
      return {
        success: true,
        url: uploadUrl,
        fileName: file.name,
        path: remotePath
      };
    } else {
      const errorText = await response.text();
      console.error('❌ WebDAV 上傳失敗:', response.status, errorText);
      return {
        success: false,
        error: `WebDAV 上傳失敗: ${response.status} ${response.statusText}`,
        fileName: file.name
      };
    }
    
  } catch (error) {
    console.error('❌ WebDAV 上傳異常:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
      fileName: file.name
    };
  }
}

// 智能 WebDAV 上傳（包含目錄創建和路徑管理）
export async function smartWebDAVUpload(
  file: File,
  config: WebDAVConfig,
  options: {
    projectName: string;
    recordType: 'personal' | 'coordinator';
    userName?: string;
    photoType?: string;
    category?: string;
  }
): Promise<WebDAVUploadResult> {
  try {
    // 生成檔案名稱
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileExtension = file.name.split('.').pop();
    
    let fileName: string;
    let subFolder: string;
    
    if (options.recordType === 'personal' && options.userName) {
      fileName = `${dateStr}_${timeStr}_${options.userName}_${options.photoType || '照片'}.${fileExtension}`;
      subFolder = `個人記錄/${options.userName}`;
    } else if (options.recordType === 'coordinator') {
      fileName = `${dateStr}_${timeStr}_統整員_${options.photoType || options.category || '照片'}.${fileExtension}`;
      subFolder = `統整員記錄`;
    } else {
      fileName = `${dateStr}_${timeStr}_照片.${fileExtension}`;
      subFolder = `其他記錄`;
    }
    
    // 構建完整路徑
    const basePath = config.basePath || '拍攝照片';
    const fullPath = `${basePath}/${options.projectName}/${subFolder}/${fileName}`;
    
    console.log('📁 計劃上傳路徑:', fullPath);
    
    // 嘗試創建目錄結構
    const projectDir = `${basePath}/${options.projectName}`;
    const subDir = `${basePath}/${options.projectName}/${subFolder}`;
    
    await createWebDAVDirectory(config, basePath);
    await createWebDAVDirectory(config, projectDir);
    await createWebDAVDirectory(config, subDir);
    
    // 執行上傳
    return await uploadToWebDAV(file, config, fullPath);
    
  } catch (error) {
    console.error('❌ 智能 WebDAV 上傳失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '智能上傳失敗',
      fileName: file.name
    };
  }
}

// 獲取 WebDAV 配置
export function getWebDAVConfig(): WebDAVConfig | null {
  const url = process.env.NEXT_PUBLIC_WEBDAV_URL;
  const username = process.env.NEXT_PUBLIC_WEBDAV_USERNAME;
  const password = process.env.NEXT_PUBLIC_WEBDAV_PASSWORD;
  const basePath = process.env.NEXT_PUBLIC_WEBDAV_BASE_PATH;
  
  if (!url || !username || !password) {
    console.warn('WebDAV 配置不完整');
    return null;
  }
  
  return {
    url,
    username,
    password,
    basePath
  };
} 