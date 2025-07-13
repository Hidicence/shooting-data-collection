# 群輝NAS照片上傳設置指南

## 🏠 為什麼選擇群輝NAS？

- ✅ **完全免費**：無需任何雲端服務費用
- ✅ **無認證限制**：避免Google Drive OAuth問題
- ✅ **私人控制**：照片存儲在您自己的NAS上
- ✅ **高速上傳**：區域網路傳輸速度快
- ✅ **自動分類**：維持原有的資料夾結構

## 📋 前置需求

1. **群輝NAS設備**（任何型號都可以）
2. **固定IP或DDNS**（讓外部可以訪問）
3. **網路連接**（NAS需要與拍攝現場在同一網路或可外部訪問）

## 🚀 設置步驟

### 步驟1：準備群輝NAS

#### 1.1 開啟必要服務
1. 登入群輝DSM管理介面
2. 前往 **控制台 → 檔案服務**
3. 確保以下服務已啟用：
   - ✅ **WebDAV**（推薦）
   - ✅ **File Station**
   - ✅ **HTTP服務**

#### 1.2 創建照片存儲資料夾
1. 開啟 **File Station**
2. 在共享資料夾中創建 `shooting-photos` 資料夾
3. 設定權限：
   - 如果要完全免認證：設為 **Everyone** 可讀寫
   - 如果要基本認證：創建專用用戶帳號

### 步驟2：選擇上傳方式

#### 方式1：WebDAV（推薦）🌟

**優點**：標準協議，穩定可靠，支援資料夾自動創建

**設置步驟**：
1. 在DSM中前往 **控制台 → 檔案服務 → WebDAV**
2. 啟用 **WebDAV** 和 **WebDAV HTTPS**
3. 設定端口（預設5005/5006）
4. 記錄訪問地址：`https://your-nas-ip:5006/webdav/shooting-photos`

#### 方式2：File Station API

**優點**：官方API，功能完整，支援進度監控

**設置步驟**：
1. 已預設啟用，無需額外設置
2. 訪問地址：`https://your-nas-ip:5001/webapi/entry.cgi`
3. 需要用戶名和密碼

#### 方式3：HTTP POST（自定義）

**優點**：最靈活，可自定義接收規則

**設置步驟**：
1. 需要自己在NAS上架設接收照片的腳本
2. 較複雜，適合有技術背景的用戶

### 步驟3：配置環境變量

在專案根目錄創建或編輯 `.env.local` 文件：

```env
# Firebase 配置（數據存儲）
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# 群輝NAS配置（照片上傳）
NEXT_PUBLIC_NAS_URL=https://your-nas-domain.com:5001
NEXT_PUBLIC_NAS_UPLOAD_METHOD=webdav

# WebDAV設置（如果選擇WebDAV方式）
NEXT_PUBLIC_NAS_WEBDAV_PATH=/webdav/shooting-photos
NEXT_PUBLIC_NAS_WEBDAV_USER=your_username
NEXT_PUBLIC_NAS_WEBDAV_PASS=your_password

# File Station API設置（如果選擇API方式）
NEXT_PUBLIC_NAS_API_USER=your_username
NEXT_PUBLIC_NAS_API_PASS=your_password
NEXT_PUBLIC_NAS_TARGET_FOLDER=/shooting-photos

# HTTP POST設置（如果選擇HTTP方式）
NEXT_PUBLIC_NAS_HTTP_ENDPOINT=/upload
NEXT_PUBLIC_NAS_HTTP_TOKEN=your_token
```

### 步驟4：測試連接

1. 重新啟動開發服務器：`npm run dev`
2. 進入任何照片上傳頁面
3. 查看控制台輸出，應該會看到：
   - 🏠 使用群輝NAS上傳照片...
   - ✅ NAS上傳成功: 檔案名稱

## 🛠️ 常見問題解決

### Q1: 連接NAS失敗
**可能原因**：
- NAS URL不正確
- 防火牆阻擋
- 服務未啟用

**解決方法**：
1. 確認NAS的IP地址和端口
2. 檢查防火牆設置
3. 確認WebDAV或API服務已啟用

### Q2: 上傳失敗但連接正常
**可能原因**：
- 權限不足
- 資料夾不存在
- 磁碟空間不足

**解決方法**：
1. 檢查用戶權限
2. 手動創建目標資料夾
3. 確認NAS磁碟空間充足

### Q3: 無法訪問已上傳的照片
**可能原因**：
- 共享設定不正確
- 網路設定問題

**解決方法**：
1. 設定共享資料夾的公開訪問
2. 確認網路連接正常

## 📁 照片儲存結構

系統會自動在NAS上創建以下資料夾結構：

```
shooting-photos/
├── 專案A_拍攝數據集/
│   ├── 👤 個人記錄/
│   │   ├── 張三/
│   │   │   ├── 2024-01-15_08-30-00_張三_去程里程.jpg
│   │   │   └── 2024-01-15_20-15-30_張三_回程里程.jpg
│   │   └── 李四/
│   └── 📊 統整員記錄/
│       └── 📅 2024-01-15_現場數據記錄/
│           ├── ⚡ 用電數據/
│           ├── 💧 飲水數據/
│           ├── 🍽️ 餐飲數據/
│           └── ♻️ 回收數據/
└── 專案B_拍攝數據集/
    └── ...
```

## 🎯 推薦設置

### 小型團隊（<10人）
- **推薦方式**：WebDAV
- **認證設置**：創建專用用戶
- **網路設置**：內網使用

### 中型團隊（10-50人）
- **推薦方式**：File Station API
- **認證設置**：統一管理帳號
- **網路設置**：DDNS外網訪問

### 大型團隊（>50人）
- **推薦方式**：HTTP POST + 自定義腳本
- **認證設置**：Token認證
- **網路設置**：專用域名

## 🔒 安全建議

1. **啟用HTTPS**：確保數據傳輸加密
2. **設定防火牆**：只開放必要端口
3. **定期備份**：避免數據遺失
4. **監控存取**：記錄上傳活動

## 📞 技術支援

如果您在設置過程中遇到問題，可以：

1. 查看瀏覽器控制台的錯誤訊息
2. 檢查NAS的系統日誌
3. 測試網路連接性
4. 確認權限設置

---

## 🎉 完成！

設置完成後，您的拍攝數據收集系統將：
- 📝 **專案和記錄數據** → 存儲在Firebase（免費）
- 📸 **照片文件** → 存儲在您的群輝NAS（免費）
- 🔄 **自動回退** → 如果NAS不可用，會自動使用Google Drive或本地存儲

這樣既避免了雲端存儲費用，又保持了系統的穩定性！ 