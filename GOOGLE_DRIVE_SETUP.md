# Google Drive 照片存儲設定指南

本指南幫助您配置 Google Drive API，讓拍攝數據收集系統自動將照片上傳到您的 Google Drive 並智能分類組織。

## 🎯 功能特色

- **自動資料夾創建**：根據專案和人員自動創建分類資料夾
- **智能檔案命名**：包含時間戳和照片類型的清晰命名
- **即時上傳**：照片選擇後立即上傳到雲端
- **備用機制**：如果 Google Drive 失敗，會自動回退到 Firebase 或本地存儲

## 📁 資料夾結構

照片會自動組織成以下結構：
```
您的共享資料夾/
├── 專案A_拍攝數據/
│   ├── 個人記錄/
│   │   ├── 張三_里程記錄/
│   │   │   ├── 2024-07-11T10-30-00_去程照片.jpg
│   │   │   ├── 2024-07-11T18-45-00_回程照片.jpg
│   │   │   └── 2024-07-12T09-15-00_去程照片.jpg
│   │   └── 李四_里程記錄/
│   └── 統整員記錄/
│       ├── 2024-07-11_現場數據/
│       └── 2024-07-12_現場數據/
└── 專案B_拍攝數據/
```

## 🔧 設定步驟

### 步驟 1：獲取 Google Drive API Key

1. **進入 Google Cloud Console**
   - 訪問 [Google Cloud Console](https://console.cloud.google.com/)
   - 登入您的 Google 帳號

2. **創建或選擇專案**
   - 點擊頂部的專案選擇器
   - 選擇現有專案或點擊「新增專案」

3. **啟用 Google Drive API**
   - 在左側選單選擇「API 和服務」→「程式庫」
   - 搜尋「Google Drive API」
   - 點擊並啟用該 API

4. **創建 API 金鑰**
   - 在左側選單選擇「API 和服務」→「憑證」
   - 點擊「建立憑證」→「API 金鑰」
   - 複製生成的 API 金鑰

5. **限制 API 金鑰（建議）**
   - 點擊剛創建的 API 金鑰
   - 在「API 限制」中選擇「限制金鑰」
   - 選擇「Google Drive API」
   - 點擊「儲存」

### 步驟 2：配置環境變數

1. **在專案根目錄的 `.env.local` 文件中添加**：
```bash
# Google Drive API 配置
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your_api_key_here
```

2. **如果是 Vercel 部署，在 Vercel 控制台添加環境變數**：
   - 變數名稱：`NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY`
   - 值：您的 API 金鑰

### 步驟 3：確認 Google Drive 資料夾設定

確保您的 Google Drive 資料夾設定為：
- **分享設定**：「知道連結的使用者」
- **權限**：「編輯者」

目前配置的資料夾 ID：`1ZAJwPDShYNhGRUCM5VIrbqGk8edYmFZl`

## 🧪 測試設定

配置完成後：

1. **重新啟動開發服務器**
2. **打開瀏覽器控制台**（F12）
3. **上傳一張照片**
4. **檢查控制台輸出**，應該會看到：
```
🔄 正在上傳去程照片...
🔄 使用 Google Drive 上傳照片...
✅ 照片上傳成功到 Google Drive: 2024-07-11T10-30-00_去程照片.jpg
✅ 去程照片上傳成功
```

5. **檢查您的 Google Drive 資料夾**，應該會看到自動創建的專案資料夾和照片

## 🔍 故障排除

### 問題 1：API 金鑰無效
- 確認 API 金鑰正確複製
- 檢查 Google Drive API 是否已啟用
- 確認環境變數名稱正確

### 問題 2：權限被拒絕
- 確認 Google Drive 資料夾權限設定正確
- 檢查 API 金鑰的限制設定

### 問題 3：上傳失敗
- 檢查網路連接
- 查看瀏覽器控制台的詳細錯誤訊息
- 系統會自動回退到 Firebase 或本地存儲

## ⚙️ 進階配置

如果您想使用不同的 Google Drive 資料夾，請修改 `lib/google-drive-service.ts` 中的：
```typescript
const GOOGLE_DRIVE_CONFIG = {
  rootFolderId: 'your_folder_id_here',
  // ...
}
```

## 💡 最佳實踐

1. **定期備份**：雖然 Google Drive 很可靠，但建議定期備份重要照片
2. **容量管理**：監控 Google Drive 的容量使用情況
3. **權限管理**：定期檢查資料夾的分享權限設定
4. **組織整理**：利用自動分類功能保持資料夾整潔

## 🎉 完成！

設定完成後，您的拍攝團隊就可以享受：
- 📸 **即時照片上傳**到 Google Drive
- 🗂️ **自動分類組織**，無需手動整理
- 👥 **團隊協作**，所有成員都能訪問照片
- 🔄 **多重備份**，數據安全有保障

如有任何問題，請檢查瀏覽器控制台的詳細日誌訊息。 