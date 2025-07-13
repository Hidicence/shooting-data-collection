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
console.log('🔥 Firebase 配置檢查 (v4):')
console.log('API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ 已載入' : '❌ 未載入')
console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ 已載入' : '❌ 未載入')
console.log('Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ 已載入' : '❌ 未載入')
console.log('Storage Bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ 已載入' : '❌ 未載入')

// 檢查所有必要配置是否存在且不是占位符
const isValidConfig = Object.values(firebaseConfig).every(value => 
  value !== undefined && 
  value !== null && 
  !value.toString().includes('your_') && 
  !value.toString().includes('your_project')
)

console.log('配置有效性:', isValidConfig ? '✅ 有效' : '❌ 無效（包含占位符）')

// 初始化 Firebase（如果配置有效）
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isValidConfig) {
  try {
    // 初始化 Firebase
    app = initializeApp(firebaseConfig)
    console.log('✅ Firebase 應用初始化成功')

    // 初始化 Firestore 數據庫
    db = getFirestore(app)
    console.log('✅ Firestore 初始化成功')

    // 初始化 Firebase Storage
    storage = getStorage(app)
    console.log('✅ Firebase Storage 初始化成功')
    console.log('📊 使用 Firebase 雲端存儲')
    console.log('📝 照片上傳使用 Firebase Storage')

  } catch (error) {
    console.error('❌ Firebase 初始化失敗:', error)
    console.log('🔄 回退至本地存儲模式')
  }
} else {
  console.log('⚠️  Firebase 配置無效，使用本地存儲模式')
  console.log('💡 如需雲端同步，請參考 FIREBASE_SETUP.md 設置 Firebase')
}

export { db, storage }
export default app 