import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { GENRES } from '../types'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, register, completeProfile } = useAuth()

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await login(email, password)
        if (error) throw new Error(error)
        onClose()
        navigate('/profile')
      } else {
        const { error } = await register(email, password)
        if (error) throw new Error(error)
        setStep(2)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (selectedGenres.length === 0) {
        throw new Error('Please select at least one genre')
      }

      if (selectedGenres.length > 3) {
        throw new Error('Please select up to 3 genres')
      }

      const { error } = await completeProfile({
        username,
        age: parseInt(age),
        interestGenres: selectedGenres,
        bio,
        profilePicture,
      })

      if (error) throw new Error(error)

      onClose()
      navigate('/profile')
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setUsername('')
    setAge('')
    setBio('')
    setProfilePicture(null)
    setSelectedGenres([])
    setError('')
    setStep(1)
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">
          {isLogin ? 'Login' : (step === 1 ? 'Create Account' : 'Complete Your Profile')}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4" role="alert">
            {error}
          </div>
        )}

        {(step === 1 || isLogin) ? (
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Continue')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                resetForm()
              }}
              className="w-full text-sm text-orange-600 hover:text-orange-700"
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Profile Picture</label>
              <input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
              <input
                id="age"
                type="number"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interested Genres (max 3)</label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => {
                      setSelectedGenres((prev) =>
                        prev.includes(genre)
                          ? prev.filter((g) => g !== genre)
                          : prev.length < 3
                            ? [...prev, genre]
                            : prev
                      )
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedGenres.includes(genre)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Complete Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}