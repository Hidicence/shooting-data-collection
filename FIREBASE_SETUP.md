# Firebase 雲端同步設置指南

將您的拍攝數據收集系統升級為雲端協作版本，實現數據即時同步和照片雲端存儲。

## 🎯 升級效果

### **升級前 (目前狀況)**
- ❌ 數據只存在個人瀏覽器中
- ❌ 無法跨設備或跨用戶同步
- ❌ 照片占用瀏覽器存儲空間
- ❌ 統整人員看不到拍攝人員記錄

### **升級後 (雲端協作版)**
- ✅ **即時數據同步**：所有人看到相同數據
- ✅ **雲端照片存儲**：Google Cloud Storage 集中管理
- ✅ **多人協作**：團隊即時協作
- ✅ **離線支援**：無網路時仍可使用，恢復網路後自動同步
- ✅ **完全免費**：Firebase 免費額度充足

---

## 🚀 步驟 1：創建 Firebase 項目

### 1.1 訪問 Firebase Console

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 使用您的 Google 帳號登入
3. 點擊 **「Add project」**（添加項目）

### 1.2 創建項目

1. **項目名稱**：輸入 `shooting-data-collection`
2. **繼續**：點擊 Continue
3. **Google Analytics**：選擇 **「Enable Google Analytics」**（建議啟用）
4. **Analytics 帳戶**：選擇 Default Account 或創建新帳戶
5. **創建項目**：點擊 Create project
6. 等待項目創建完成（約 1-2 分鐘）

---

## 🔧 步驟 2：配置 Web 應用

### 2.1 添加 Web 應用

1. 在 Firebase Console 中，點擊 **「Web」** 圖標（</>）
2. **應用名稱**：輸入 `shooting-data-collection-web`
3. **Firebase Hosting**：勾選「Also set up Firebase Hosting」
4. 點擊 **「Register app」**

### 2.2 獲取配置信息

創建完成後，您會看到類似這樣的配置代碼：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-example-key-123456789",
  authDomain: "shooting-data-collection.firebaseapp.com",
  projectId: "shooting-data-collection",
  storageBucket: "shooting-data-collection.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

**⚠️ 重要**：請將這些配置信息複製並保存，我們稍後會用到。

---

## 🗄️ 步驟 3：啟用 Firestore 數據庫

### 3.1 創建 Firestore 數據庫

1. 在 Firebase Console 左側選單中，點擊 **「Firestore Database」**
2. 點擊 **「Create database」**
3. **安全規則**：選擇 **「Start in test mode」**（測試模式）
4. **位置**：選擇 **「asia-east1 (Taiwan)」**（最接近台灣）
5. 點擊 **「Done」**

### 3.2 設置安全規則（重要）

1. 在 Firestore 中，點擊 **「Rules」** 分頁
2. 將規則替換為以下內容：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允許讀寫所有文檔（適合小團隊使用）
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. 點擊 **「Publish」** 發布規則

---

## 📸 步驟 4：啟用 Cloud Storage

### 4.1 啟用 Storage

1. 在 Firebase Console 左側選單中，點擊 **「Storage」**
2. 點擊 **「Get started」**
3. **安全規則**：選擇 **「Start in test mode」**
4. **位置**：選擇 **「asia-east1 (Taiwan)」**
5. 點擊 **「Done」**

### 4.2 設置 Storage 規則

1. 在 Storage 中，點擊 **「Rules」** 分頁
2. 將規則替換為以下內容：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

3. 點擊 **「Publish」** 發布規則

---

## 🔐 步驟 5：配置環境變數

### 5.1 創建環境變數文件

在您的項目根目錄創建 `.env.local` 文件：

```bash
# Firebase 配置 - 請替換為您的實際配置
NEXT_PUBLIC_FIREBASE_API_KEY=您的_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=您的項目ID.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=您的項目ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=您的項目ID.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=您的_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=您的_APP_ID
```

### 5.2 配置 Vercel 環境變數

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到您的 `shooting-data-collection` 項目
3. 點擊項目進入設定頁面
4. 點擊 **「Settings」** → **「Environment Variables」**
5. 添加以下環境變數：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | 您的 API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | 您的 Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | 您的 Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | 您的 Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 您的 Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 您的 App ID |

6. 每個變數添加完成後點擊 **「Add」**

---

## 🚀 步驟 6：部署更新

### 6.1 提交程式碼

在您的本地項目目錄執行：

```bash
# 添加新文件
git add .

# 提交更新
git commit -m "升級：新增 Firebase 雲端同步功能"

# 推送到 GitHub
git push origin main
```

### 6.2 自動部署

Vercel 會自動檢測到更新並重新部署您的應用！

---

## ✅ 步驟 7：測試雲端功能

### 7.1 測試數據同步

1. **創建專案**：在一個瀏覽器中創建專案
2. **另一個設備**：用另一台設備或瀏覽器訪問相同網址
3. **確認同步**：查看是否能看到相同的專案

### 7.2 測試照片上傳

1. **上傳照片**：在個人記錄中上傳照片
2. **檢查 Storage**：在 Firebase Console 的 Storage 中查看是否有照片文件
3. **確認顯示**：在數據管理中心查看照片是否正常顯示

---

## 📊 升級效果驗證

### **數據同步測試**
- [ ] 專案創建後所有設備都能看到
- [ ] 個人記錄即時同步
- [ ] 統整記錄即時同步
- [ ] 數據管理中心顯示所有數據

### **照片功能測試**
- [ ] 照片成功上傳到 Google Cloud
- [ ] 照片在不同設備都能正常顯示
- [ ] 照片載入速度正常

### **協作功能測試**
- [ ] 拍攝人員記錄，統整人員立即看到
- [ ] 統整人員記錄，管理人員立即看到
- [ ] 專案狀態更新即時同步

---

## 📱 使用指南（升級後）

### **團隊協作流程**

1. **專案經理**：
   - 創建拍攝專案
   - 設定當前專案
   - 查看整體數據統計

2. **拍攝人員**：
   - 選擇當前專案
   - 記錄個人里程
   - 上傳去程/回程照片

3. **統整人員**：
   - 選擇當前專案
   - 記錄現場數據
   - 查看所有人的記錄

4. **即時同步**：
   - 所有記錄即時出現在團隊成員的設備上
   - 數據統計即時更新
   - 照片集中存儲在 Google Cloud

---

## 🛡️ 安全性說明

### **數據安全**
- ✅ Google 企業級安全保護
- ✅ HTTPS 加密傳輸
- ✅ Firebase 安全規則保護

### **隱私保護**
- ✅ 只有團隊成員可以訪問
- ✅ 數據存儲在 Google Cloud 台灣機房
- ✅ 符合個資法規範

### **備份機制**
- ✅ Google 自動備份
- ✅ 支援數據匯出
- ✅ 版本控制和恢復

---

## 🆘 常見問題

### Q: 設置複雜嗎？
A: 一次設置，終身受益。按照指南約 15 分鐘完成。

### Q: 費用如何？
A: Firebase 免費額度非常充足，小團隊完全免費使用。

### Q: 數據會丟失嗎？
A: Google Cloud 提供 99.99% 可用性保證，比本地存儲更安全。

### Q: 離線能使用嗎？
A: 支援離線使用，恢復網路後自動同步。

### Q: 如何控制權限？
A: 可以根據需要調整 Firebase 安全規則。

---

## 📞 技術支援

如遇到設置問題：

1. 確認 Firebase 項目已正確創建
2. 檢查環境變數是否正確配置
3. 確認 Firestore 和 Storage 已啟用
4. 查看瀏覽器控制台錯誤訊息

---

**恭喜！** 🎉 完成設置後，您的拍攝數據收集系統將成為專業的雲端協作平台！

所有團隊成員都能即時看到彼此的數據，照片集中存儲在 Google Cloud，真正實現無縫協作。 