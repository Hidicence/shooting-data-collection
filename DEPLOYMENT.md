# 拍攝數據收集系統 - 部署指南

將您的拍攝數據收集系統部署到網路上，讓團隊成員可以通過 QR Code 或網址隨時存取。

## 🚀 推薦部署方式：Vercel（免費）

### 為什麼選擇 Vercel？
- ✅ **專為 Next.js 設計**：完美支援所有功能
- ✅ **完全免費**：個人使用無需付費
- ✅ **自動 HTTPS**：提供安全連線
- ✅ **全球 CDN**：快速載入
- ✅ **自動部署**：Git 推送後自動更新

---

## 📋 部署前準備

### 1. 創建 Git 儲存庫

在當前專案目錄執行：

```bash
# 初始化 Git 儲存庫
git init

# 創建 .gitignore 文件
echo "node_modules/
.next/
.env*
*.log" > .gitignore

# 添加所有文件
git add .

# 提交初始版本
git commit -m "初始版本：拍攝數據收集系統"
```

### 2. 推送到 GitHub

1. 登入 [GitHub](https://github.com)
2. 點擊右上角「+」→「New repository」
3. 輸入儲存庫名稱：`shooting-data-collection`
4. 設為 Public（公開）
5. 點擊「Create repository」

然後在本地執行：

```bash
# 添加遠端儲存庫（替換成您的 GitHub 用戶名）
git remote add origin https://github.com/您的用戶名/shooting-data-collection.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 🌐 Vercel 部署步驟

### 步驟 1：註冊 Vercel 帳號

1. 前往 [Vercel](https://vercel.com)
2. 點擊「Sign Up」
3. 選擇「Continue with GitHub」
4. 授權 Vercel 存取您的 GitHub

### 步驟 2：匯入專案

1. 登入 Vercel 後，點擊「New Project」
2. 從 GitHub 找到您的 `shooting-data-collection` 儲存庫
3. 點擊「Import」

### 步驟 3：配置設定

Vercel 會自動檢測到這是 Next.js 專案：

- **Framework Preset**: Next.js（自動檢測）
- **Build Command**: `npm run build`（自動設定）
- **Output Directory**: `.next`（自動設定）
- **Install Command**: `npm install`（自動設定）

### 步驟 4：部署

1. 確認設定無誤後，點擊「Deploy」
2. 等待 2-3 分鐘完成部署
3. 部署成功後會顯示您的網站網址

### 步驟 5：獲取網址

部署完成後，您會得到類似這樣的網址：
```
https://shooting-data-collection-abc123.vercel.app
```

---

## 📱 部署後使用指南

### 1. 測試功能

在您的手機上開啟部署的網址：
1. 測試 QR Code 生成功能
2. 創建測試專案
3. 測試個人記錄和統整記錄功能
4. 確認數據管理功能正常

### 2. 分享給團隊

**方式一：QR Code**
1. 開啟網站首頁
2. 點擊「顯示 QR Code」
3. 截圖分享給團隊成員掃描

**方式二：直接分享網址**
- 複製 Vercel 提供的網址
- 透過通訊軟體分享給團隊

### 3. 設定書籤

建議團隊成員將網站加入手機書籤：
- iPhone：Safari → 分享 → 加入主畫面
- Android：Chrome → 選單 → 加入主畫面

---

## 🔄 更新部署

### 自動更新（推薦）

當您對程式碼進行修改後：

```bash
# 提交變更
git add .
git commit -m "功能更新：描述您的變更"

# 推送到 GitHub
git push origin main
```

Vercel 會自動檢測到變更並重新部署！

### 手動重新部署

1. 登入 Vercel Dashboard
2. 找到您的專案
3. 點擊「Redeploy」

---

## 🏷️ 自定義域名（選用）

### 免費子域名

Vercel 允許您設定自定義子域名：

1. 進入專案設定
2. 前往「Domains」頁面
3. 添加自定義域名，例如：
   ```
   your-project-name.vercel.app
   ```

### 自有域名

如果您有自己的域名：

1. 在 Vercel 專案設定中添加您的域名
2. 按照指示設定 DNS 記錄
3. 等待 DNS 生效（通常 24 小時內）

---

## 🔧 其他部署選項

### Netlify（替代選擇）

如果您想嘗試其他平台：

1. 前往 [Netlify](https://netlify.com)
2. 連接 GitHub 帳號
3. 選擇您的儲存庫
4. 設定建置指令：
   ```
   Build command: npm run build
   Publish directory: .next
   ```

### GitHub Pages（靜態部署）

適合完全靜態的版本：

1. 修改 `next.config.js`：
   ```javascript
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true
     }
   }
   ```

2. 建置並部署：
   ```bash
   npm run build
   # 將 out 資料夾內容上傳到 GitHub Pages
   ```

---

## 📊 監控和分析

### Vercel Analytics

免費啟用網站分析：

1. 進入 Vercel 專案設定
2. 前往「Analytics」
3. 啟用 Analytics
4. 查看訪問統計和效能數據

### 使用統計

追蹤系統使用情況：
- 每日活躍用戶數
- 頁面訪問次數
- 功能使用頻率

---

## 🛡️ 安全性考量

### 數據隱私

- ✅ 所有數據存儲在用戶瀏覽器本地
- ✅ 不會上傳到任何伺服器
- ✅ HTTPS 加密連線

### 存取控制

如需限制存取：

1. **密碼保護**：可考慮在應用中添加簡單密碼驗證
2. **內部網路**：在公司內部網路部署
3. **VPN 存取**：透過 VPN 限制存取範圍

---

## 🆘 常見問題

### Q: 部署後 QR Code 顯示錯誤的網址？
A: QR Code 會自動使用當前網址，確保在線上環境測試

### Q: 數據會遺失嗎？
A: 數據存儲在瀏覽器本地，建議定期使用「匯出」功能備份

### Q: 可以多人同時使用嗎？
A: 可以，每個人的數據獨立存儲在各自的瀏覽器中

### Q: 部署失敗怎麼辦？
A: 檢查 Vercel 部署日誌，常見問題：
- Node.js 版本不相容
- 依賴安裝失敗
- 建置錯誤

### Q: 如何更新系統？
A: 修改程式碼後推送到 GitHub，Vercel 會自動重新部署

---

## 📞 技術支援

如果遇到部署問題：

1. 檢查 Vercel 部署日誌
2. 確認 GitHub 儲存庫設定正確
3. 驗證 Next.js 版本相容性
4. 查看瀏覽器控制台錯誤訊息

---

**恭喜！** 🎉 您的拍攝數據收集系統現在已經部署到網路上，團隊成員可以隨時隨地使用了！

記得將最終的網址分享給所有需要使用系統的團隊成員。 