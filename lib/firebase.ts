import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  // 這些配置需要從 Firebase Console 獲取
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// 調試輸出
console.log('🔥 Firebase 配置檢查:')
console.log('API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ 已載入' : '❌ 未載入')
console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ 已載入' : '❌ 未載入')
console.log('Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ 已載入' : '❌ 未載入')

// 檢查所有必要配置是否存在
const isConfigComplete = Object.values(firebaseConfig).every(value => value !== undefined)
console.log('配置完整性:', isConfigComplete ? '✅ 完整' : '❌ 不完整')

// 初始化 Firebase（確保總是成功，即使配置不完整）
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

try {
  // 初始化 Firebase
  app = initializeApp(firebaseConfig)
  console.log('✅ Firebase 應用初始化成功')

  // 初始化 Firestore 數據庫
  db = getFirestore(app)
  console.log('✅ Firestore 初始化成功')

  // 初始化 Storage（用於照片存儲）
  storage = getStorage(app)
  console.log('✅ Storage 初始化成功')

} catch (error) {
  console.error('❌ Firebase 初始化失敗:', error)
  // 創建一個假的 app 避免編譯錯誤，實際使用時會拋出錯誤
  throw error
}

export { db, storage }
export default app 