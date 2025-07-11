'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, BarChart3, Camera, QrCode, Folder } from 'lucide-react'
import QRCodeGenerator from '../components/QRCodeGenerator'

export default function HomePage() {
  const [showQR, setShowQR] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <div className="flex justify-center mb-4">
          <Camera className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          拍攝數據收集系統
        </h1>
        <p className="text-gray-600">
          簡易高效的現場數據記錄平台
        </p>
      </div>

      {/* QR Code Section */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            快速分享
          </h2>
          <button
            onClick={() => setShowQR(!showQR)}
            className="btn-secondary text-sm py-2 px-4"
          >
            {showQR ? '隱藏' : '顯示'} QR Code
          </button>
        </div>
        
        {showQR && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <QRCodeGenerator 
              value={currentUrl} 
              size={200}
              className="mb-2"
            />
            <p className="text-sm text-gray-600">掃描此 QR Code 進入系統</p>
            <p className="text-xs text-gray-500 mt-1 break-all">{currentUrl}</p>
          </div>
        )}
      </div>

      {/* Role Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-center mb-6">請選擇您的角色</h2>
        
        {/* 一般拍攝人員 */}
        <Link href="/personal" className="block">
          <div className="card hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-primary">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">拍攝人員</h3>
                <p className="text-sm text-gray-600">記錄個人里程數據</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              ✓ 填寫今日里程數<br />
              ✓ 上傳去程/回程照片證明
            </div>
          </div>
        </Link>

        {/* 統整人員 */}
        <Link href="/coordinator" className="block">
          <div className="card hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-primary">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">統整人員</h3>
                <p className="text-sm text-gray-600">記錄現場整體數據</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              ✓ 用電度數記錄<br />
              ✓ 飲水、餐點、回收重量
            </div>
          </div>
        </Link>

        {/* 專案管理 */}
        <Link href="/projects" className="block">
          <div className="card hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <Folder className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">專案管理</h3>
                <p className="text-sm text-gray-600">管理拍攝專案</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              ✓ 創建和編輯專案<br />
              ✓ 設定當前工作專案
            </div>
          </div>
        </Link>

        {/* 數據管理 */}
        <Link href="/dashboard" className="block">
          <div className="card hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-500">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">數據管理</h3>
                <p className="text-sm text-gray-600">查看和管理所有數據</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              ✓ 統計分析報表<br />
              ✓ 數據匯出功能
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>© 2024 拍攝數據收集系統</p>
      </div>
    </div>
  )
} 