'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Users, 
  BarChart3, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  MapPin,
  Camera,
  Zap,
  Droplets,
  UtensilsCrossed,
  Recycle
} from 'lucide-react'

interface PersonalRecord {
  id: number
  name: string
  date: string
  mileage: string
  startLocation: string
  endLocation: string
  departurePhoto: string | null
  returnPhoto: string | null
  notes: string
  timestamp: string
}

interface CoordinatorRecord {
  id: number
  date: string
  coordinatorName: string
  location: string
  electricityUsage: string
  electricityStartReading: string
  electricityEndReading: string
  waterWeight: string
  waterBottleCount: string
  foodWasteWeight: string
  mealCount: string
  recycleWeight: string
  recycleTypes: string[]
  notes: string
  timestamp: string
}

export default function DashboardPage() {
  const [personalData, setPersonalData] = useState<PersonalRecord[]>([])
  const [coordinatorData, setCoordinatorData] = useState<CoordinatorRecord[]>([])
  const [activeTab, setActiveTab] = useState<'personal' | 'coordinator'>('personal')
  const [selectedRecord, setSelectedRecord] = useState<PersonalRecord | CoordinatorRecord | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)

  useEffect(() => {
    // Load data from localStorage
    const personal = JSON.parse(localStorage.getItem('personalData') || '[]')
    const coordinator = JSON.parse(localStorage.getItem('coordinatorData') || '[]')
    const projectsData = JSON.parse(localStorage.getItem('projects') || '[]')
    
    setPersonalData(personal)
    setCoordinatorData(coordinator)
    setProjects(projectsData)
  }, [])

  const deletePersonalRecord = (id: number) => {
    const updatedData = personalData.filter(record => record.id !== id)
    setPersonalData(updatedData)
    localStorage.setItem('personalData', JSON.stringify(updatedData))
  }

  const deleteCoordinatorRecord = (id: number) => {
    const updatedData = coordinatorData.filter(record => record.id !== id)
    setCoordinatorData(updatedData)
    localStorage.setItem('coordinatorData', JSON.stringify(updatedData))
  }

  const exportData = () => {
    const allData = {
      personalRecords: personalData,
      coordinatorRecords: coordinatorData,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(allData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `拍攝數據收集_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const clearAllData = () => {
    if (confirm('確定要清除所有數據嗎？此操作無法復原。')) {
      localStorage.removeItem('personalData')
      localStorage.removeItem('coordinatorData')
      setPersonalData([])
      setCoordinatorData([])
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW')
  }

  // Filter data by selected project
  const filteredPersonalData = selectedProject 
    ? personalData.filter(record => (record as any).projectId === selectedProject)
    : personalData
  
  const filteredCoordinatorData = selectedProject
    ? coordinatorData.filter(record => (record as any).projectId === selectedProject)
    : coordinatorData

  // Statistics
  const totalPersonalRecords = filteredPersonalData.length
  const totalCoordinatorRecords = filteredCoordinatorData.length
  const totalMileage = filteredPersonalData.reduce((sum, record) => sum + parseFloat(record.mileage || '0'), 0)
  const totalElectricity = filteredCoordinatorData.reduce((sum, record) => sum + parseFloat(record.electricityUsage || '0'), 0)

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center">
          <Link href="/" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">數據管理中心</h1>
            <p className="text-sm text-gray-600">查看和管理所有收集數據</p>
          </div>
        </div>
        <button
          onClick={exportData}
          className="btn-secondary text-sm py-2 px-4 flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          匯出
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">個人記錄</p>
              <p className="text-xl font-bold">{totalPersonalRecords}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">統整記錄</p>
              <p className="text-xl font-bold">{totalCoordinatorRecords}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <MapPin className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">總里程</p>
              <p className="text-xl font-bold">{totalMileage.toFixed(1)} km</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">總用電</p>
              <p className="text-xl font-bold">{totalElectricity.toFixed(1)} kWh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Filter */}
      {projects.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">專案篩選</label>
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">所有專案</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          {selectedProject && (
            <div className="mt-2 text-sm text-gray-600">
              當前篩選：{projects.find(p => p.id === selectedProject)?.name}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex mb-6">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-3 px-4 text-center rounded-l-lg border ${
            activeTab === 'personal' 
              ? 'bg-primary text-white border-primary' 
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          個人記錄 ({totalPersonalRecords})
        </button>
        <button
          onClick={() => setActiveTab('coordinator')}
          className={`flex-1 py-3 px-4 text-center rounded-r-lg border ${
            activeTab === 'coordinator' 
              ? 'bg-primary text-white border-primary' 
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          <BarChart3 className="w-5 h-5 inline mr-2" />
          統整記錄 ({totalCoordinatorRecords})
        </button>
      </div>

      {/* Personal Records */}
      {activeTab === 'personal' && (
        <div className="space-y-4">
          {filteredPersonalData.length === 0 ? (
            <div className="card text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">尚無個人里程記錄</p>
              <Link href="/personal" className="btn-primary mt-4 inline-block">
                開始記錄
              </Link>
            </div>
          ) : (
            filteredPersonalData.map((record) => (
              <div key={record.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{record.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(record.date)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePersonalRecord(record.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">里程數</p>
                    <p className="font-medium">{record.mileage} km</p>
                  </div>
                  <div>
                    <p className="text-gray-600">路線</p>
                    <p className="font-medium">{record.startLocation} → {record.endLocation}</p>
                  </div>
                </div>
                
                {(record.departurePhoto || record.returnPhoto) && (
                  <div className="mt-3 flex items-center text-sm text-gray-600">
                    <Camera className="w-4 h-4 mr-1" />
                    已上傳 {[record.departurePhoto, record.returnPhoto].filter(Boolean).length} 張照片
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Coordinator Records */}
      {activeTab === 'coordinator' && (
        <div className="space-y-4">
          {filteredCoordinatorData.length === 0 ? (
            <div className="card text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">尚無統整數據記錄</p>
              <Link href="/coordinator" className="btn-primary mt-4 inline-block">
                開始記錄
              </Link>
            </div>
          ) : (
            filteredCoordinatorData.map((record) => (
              <div key={record.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{record.coordinatorName}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(record.date)}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {record.location}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCoordinatorRecord(record.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {record.electricityUsage && (
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 text-yellow-600 mr-2" />
                      <span>{record.electricityUsage} kWh</span>
                    </div>
                  )}
                  {record.waterWeight && (
                    <div className="flex items-center">
                      <Droplets className="w-4 h-4 text-blue-600 mr-2" />
                      <span>{record.waterWeight} kg</span>
                    </div>
                  )}
                  {record.foodWasteWeight && (
                    <div className="flex items-center">
                      <UtensilsCrossed className="w-4 h-4 text-orange-600 mr-2" />
                      <span>{record.foodWasteWeight} kg</span>
                    </div>
                  )}
                  {record.recycleWeight && (
                    <div className="flex items-center">
                      <Recycle className="w-4 h-4 text-green-600 mr-2" />
                      <span>{record.recycleWeight} kg</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">詳細資料</h2>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {'name' in selectedRecord ? (
                // Personal Record
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">姓名</label>
                    <p className="mt-1">{selectedRecord.name}</p>
                  </div>
                  {(selectedRecord as any).projectName && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">所屬專案</label>
                      <p className="mt-1">{(selectedRecord as any).projectName}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700">日期</label>
                    <p className="mt-1">{formatDate(selectedRecord.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">里程數</label>
                    <p className="mt-1">{selectedRecord.mileage} km</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">出發地</label>
                    <p className="mt-1">{selectedRecord.startLocation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">目的地</label>
                    <p className="mt-1">{selectedRecord.endLocation}</p>
                  </div>
                  
                  {selectedRecord.departurePhoto && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">去程照片</label>
                      <img
                        src={selectedRecord.departurePhoto}
                        alt="去程照片"
                        className="mt-2 w-full h-48 object-cover rounded border"
                      />
                    </div>
                  )}
                  
                  {selectedRecord.returnPhoto && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">回程照片</label>
                      <img
                        src={selectedRecord.returnPhoto}
                        alt="回程照片"
                        className="mt-2 w-full h-48 object-cover rounded border"
                      />
                    </div>
                  )}
                  
                  {selectedRecord.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">備註</label>
                      <p className="mt-1">{selectedRecord.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                // Coordinator Record
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">統整人員</label>
                    <p className="mt-1">{selectedRecord.coordinatorName}</p>
                  </div>
                  {(selectedRecord as any).projectName && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">所屬專案</label>
                      <p className="mt-1">{(selectedRecord as any).projectName}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700">日期</label>
                    <p className="mt-1">{formatDate(selectedRecord.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">地點</label>
                    <p className="mt-1">{selectedRecord.location}</p>
                  </div>
                  
                  {/* 電力數據 */}
                  {selectedRecord.electricityUsage && (
                    <div className="bg-yellow-50 p-3 rounded">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        用電數據
                      </h4>
                      <p>總用電：{selectedRecord.electricityUsage} kWh</p>
                      {selectedRecord.electricityStartReading && (
                        <p>開始讀數：{selectedRecord.electricityStartReading}</p>
                      )}
                      {selectedRecord.electricityEndReading && (
                        <p>結束讀數：{selectedRecord.electricityEndReading}</p>
                      )}
                    </div>
                  )}
                  
                  {/* 飲水數據 */}
                  {(selectedRecord.waterWeight || selectedRecord.waterBottleCount) && (
                    <div className="bg-blue-50 p-3 rounded">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Droplets className="w-4 h-4 mr-2" />
                        飲水數據
                      </h4>
                      {selectedRecord.waterWeight && <p>重量：{selectedRecord.waterWeight} kg</p>}
                      {selectedRecord.waterBottleCount && <p>瓶數：{selectedRecord.waterBottleCount} 瓶</p>}
                    </div>
                  )}
                  
                  {/* 餐點數據 */}
                  {(selectedRecord.foodWasteWeight || selectedRecord.mealCount) && (
                    <div className="bg-orange-50 p-3 rounded">
                      <h4 className="font-medium text-orange-800 mb-2 flex items-center">
                        <UtensilsCrossed className="w-4 h-4 mr-2" />
                        餐點數據
                      </h4>
                      {selectedRecord.foodWasteWeight && <p>廚餘：{selectedRecord.foodWasteWeight} kg</p>}
                      {selectedRecord.mealCount && <p>用餐人次：{selectedRecord.mealCount}</p>}
                    </div>
                  )}
                  
                  {/* 回收數據 */}
                  {(selectedRecord.recycleWeight || selectedRecord.recycleTypes.length > 0) && (
                    <div className="bg-green-50 p-3 rounded">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center">
                        <Recycle className="w-4 h-4 mr-2" />
                        回收數據
                      </h4>
                      {selectedRecord.recycleWeight && <p>重量：{selectedRecord.recycleWeight} kg</p>}
                      {selectedRecord.recycleTypes.length > 0 && (
                        <p>類型：{selectedRecord.recycleTypes.join('、')}</p>
                      )}
                    </div>
                  )}
                  
                  {selectedRecord.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">備註</label>
                      <p className="mt-1">{selectedRecord.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Button */}
      {(personalData.length > 0 || coordinatorData.length > 0) && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={clearAllData}
            className="w-full py-3 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
          >
            清除所有數據
          </button>
        </div>
      )}
    </div>
  )
} 