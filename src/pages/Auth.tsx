import React from 'react'
import AuthModal from '../components/AuthModal'
import { useNavigate } from 'react-router-dom'

export default function Auth() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
      <AuthModal 
        isOpen={true} 
        onClose={() => navigate('/')} 
      />
    </div>
  )
}