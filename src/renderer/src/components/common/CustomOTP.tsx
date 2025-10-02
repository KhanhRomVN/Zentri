import React, { useEffect, useState } from 'react'
import CryptoJS from 'crypto-js'
import { Copy, RefreshCw, Eye, EyeOff, Shield } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../shared/lib/utils'

// Base32 decode implementation (browser-compatible)
const base32Decode = (encoded: string): Uint8Array => {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  encoded = encoded.toUpperCase().replace(/=+$/, '')

  let bits = 0
  let value = 0
  let index = 0
  const output = new Uint8Array(Math.floor((encoded.length * 5) / 8))

  for (let i = 0; i < encoded.length; i++) {
    const idx = base32Chars.indexOf(encoded[i])
    if (idx === -1) continue

    value = (value << 5) | idx
    bits += 5

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff
      bits -= 8
    }
  }

  return output
}

// TOTP generation (browser-compatible, no Buffer needed)
const generateTOTP = (secret: string, timeStep: number = 30): string => {
  try {
    // Decode base32 secret
    const keyBytes = base32Decode(secret.replace(/\s/g, ''))

    // Get current time counter
    const epoch = Math.floor(Date.now() / 1000)
    let counter = Math.floor(epoch / timeStep)

    // Convert counter to 8-byte array (big-endian)
    const timeBytes = new Uint8Array(8)
    for (let i = 7; i >= 0; i--) {
      timeBytes[i] = counter & 0xff
      counter = Math.floor(counter / 256)
    }

    // Convert bytes to WordArray for CryptoJS
    const keyHex = Array.from(keyBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const timeHex = Array.from(timeBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const key = CryptoJS.enc.Hex.parse(keyHex)
    const message = CryptoJS.enc.Hex.parse(timeHex)

    // Generate HMAC-SHA1
    const hmac = CryptoJS.HmacSHA1(message, key)
    const hmacHex = hmac.toString(CryptoJS.enc.Hex)

    // Convert to bytes
    const hmacBytes = new Uint8Array(hmacHex.length / 2)
    for (let i = 0; i < hmacHex.length; i += 2) {
      hmacBytes[i / 2] = parseInt(hmacHex.substr(i, 2), 16)
    }

    // Dynamic truncation
    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f
    const code =
      (((hmacBytes[offset] & 0x7f) << 24) |
        ((hmacBytes[offset + 1] & 0xff) << 16) |
        ((hmacBytes[offset + 2] & 0xff) << 8) |
        (hmacBytes[offset + 3] & 0xff)) %
      1000000

    return code.toString().padStart(6, '0')
  } catch (err) {
    console.error('TOTP generation error:', err)
    throw new Error('Failed to generate TOTP')
  }
}

interface CustomOTPProps {
  secret: string
  issuer?: string
  accountName?: string
  className?: string
  showQRCode?: boolean
  onCopy?: (code: string) => void
}

const CustomOTP: React.FC<CustomOTPProps> = ({
  secret,
  issuer = 'App',
  accountName = 'user@example.com',
  className,
  showQRCode = false,
  onCopy
}) => {
  const [token, setToken] = useState<string>('')
  const [timeRemaining, setTimeRemaining] = useState<number>(30)
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string>('')

  // Generate OTP token
  const generateToken = () => {
    try {
      if (!secret || secret.trim() === '') {
        setError('Invalid secret key')
        return
      }

      const newToken = generateTOTP(secret, 30)
      setToken(newToken)
      setError('')
    } catch (err) {
      console.error('Error generating token:', err)
      setError('Failed to generate token')
      setToken('------')
    }
  }

  // Calculate time remaining
  const calculateTimeRemaining = () => {
    const now = Math.floor(Date.now() / 1000)
    const step = 30
    const remaining = step - (now % step)
    setTimeRemaining(remaining)
  }

  // Initialize and update token
  useEffect(() => {
    generateToken()
    calculateTimeRemaining()

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const step = 30
      const remaining = step - (now % step)

      setTimeRemaining(remaining)

      // Regenerate token when time expires
      if (remaining === 30) {
        generateToken()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [secret])

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      onCopy?.(token)

      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Copy secret to clipboard
  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
    } catch (err) {
      console.error('Failed to copy secret:', err)
    }
  }

  // Format token for display (XXX XXX)
  const formatToken = (token: string) => {
    if (token.length !== 6) return token
    return `${token.slice(0, 3)} ${token.slice(3)}`
  }

  // Progress bar percentage
  const progress = (timeRemaining / 30) * 100

  // Generate otpauth URL for QR code
  const getOtpAuthUrl = () => {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* OTP Token Display */}
      <div className="relative">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          {error ? (
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          ) : (
            <>
              {/* Token */}
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Current Code
                  </span>
                </div>

                <div className="font-mono text-4xl font-bold text-blue-600 dark:text-blue-400 tracking-wider mb-3">
                  {formatToken(token)}
                </div>

                {/* Time Remaining */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <RefreshCw
                    className={cn('h-4 w-4', timeRemaining <= 5 && 'animate-spin text-orange-600')}
                  />
                  <span>
                    Expires in{' '}
                    <span
                      className={cn(
                        'font-semibold',
                        timeRemaining <= 5 && 'text-orange-600 dark:text-orange-400'
                      )}
                    >
                      {timeRemaining}s
                    </span>
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                <div
                  className={cn(
                    'absolute left-0 top-0 h-full transition-all duration-1000 ease-linear rounded-full',
                    timeRemaining <= 5
                      ? 'bg-orange-500 dark:bg-orange-600'
                      : 'bg-blue-600 dark:bg-blue-500'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Copy Button */}
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="w-full bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-300 dark:border-blue-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Secret Key Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Secret Key</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSecret(!showSecret)}
            className="text-xs h-7 px-2"
          >
            {showSecret ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Show
              </>
            )}
          </Button>
        </div>

        <div className="relative">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-sm break-all">
            {showSecret ? secret : '•'.repeat(32)}
          </div>

          {showSecret && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopySecret}
              className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* QR Code Section (Optional) */}
      {showQRCode && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Setup URL</span>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <code className="text-xs break-all text-gray-600 dark:text-gray-400">
              {getOtpAuthUrl()}
            </code>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Scan this URL with your authenticator app to add this account
          </p>
        </div>
      )}
    </div>
  )
}

export default CustomOTP
