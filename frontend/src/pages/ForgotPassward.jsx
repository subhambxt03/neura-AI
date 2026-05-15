import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiSend, FiCheckCircle, FiArrowLeft } from 'react-icons/fi'
import api from '../services/api'
import Toast from '../components/Toast'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: Reset Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!email) {
      setToast({ type: 'error', message: 'Please enter your email' })
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setToast({ type: 'success', message: 'OTP sent to your email!' })
      setStep(2)
    } catch (error) {
      setToast({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Failed to send OTP. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setToast({ type: 'error', message: 'Please enter valid 6-digit OTP' })
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/verify-otp', { email, otp })
      setToast({ type: 'success', message: 'OTP verified! Create new password.' })
      setStep(3)
    } catch (error) {
      setToast({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Invalid OTP. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email, otp, new_password: newPassword })
      setToast({ type: 'success', message: 'Password reset successful! Please login.' })
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error) {
      setToast({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Failed to reset password. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setToast({ type: 'success', message: 'New OTP sent to your email!' })
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to resend OTP' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="bg-sidebar-bg rounded-2xl p-8 w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => step === 1 ? navigate('/login') : setStep(step - 1)}
          className="mb-4 text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
        >
          <FiArrowLeft /> Back
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-accent to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLock className="text-2xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Reset Password'}
          </h1>
          <p className="text-text-secondary mt-2">
            {step === 1 && 'Enter your email to receive OTP'}
            {step === 2 && `Enter OTP sent to ${email}`}
            {step === 3 && 'Create your new password'}
          </p>
        </div>

        {/* Step 1: Email Form */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-text-secondary mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                  placeholder="Enter your registered email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent to-blue-600 text-white py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? 'Sending...' : (
                <>
                  <FiSend /> Send OTP
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-text-secondary mb-2">Enter OTP</label>
              <div className="relative">
                <FiCheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent text-center text-2xl tracking-widest"
                  placeholder="••••••"
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-text-secondary text-sm mt-2">Enter 6-digit OTP</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent to-blue-600 text-white py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : (
                <>
                  <FiCheckCircle /> Verify OTP
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              className="w-full text-accent hover:underline text-sm"
            >
              Resend OTP
            </button>
          </form>
        )}

        {/* Step 3: Reset Password Form */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-text-secondary mb-2">New Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-text-secondary text-xs mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-text-secondary mb-2">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent to-blue-600 text-white py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? 'Resetting...' : (
                <>
                  <FiLock /> Reset Password
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-text-secondary mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Back to Login
          </Link>
        </p>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export default ForgotPassword