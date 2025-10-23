import { useState, useEffect } from 'react'

interface UseFaviconColorOptions {
  enabled?: boolean
  fallbackColor?: string
}

interface FaviconColorResult {
  color: string
  isLoading: boolean
  error: Error | null
}

// Cache global để lưu màu đã trích xuất
const colorCache = new Map<string, string>()

// Hàm helper để lấy favicon URL với multiple fallbacks
const getFaviconUrls = (serviceUrl: string): string[] => {
  try {
    const url = new URL(serviceUrl)
    const hostname = url.hostname
    const origin = url.origin

    return [
      // 1. Direct favicon from origin
      `${origin}/favicon.ico`,
      // 2. Common favicon paths
      `${origin}/favicon.png`,
      `${origin}/apple-touch-icon.png`,
      // 3. DuckDuckGo favicon service (better CORS support)
      `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
      // 4. Favicon Kit
      `https://favicone.com/${hostname}?s=128`,
      // 5. Google as last resort
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
    ]
  } catch (err) {
    console.error('[FaviconColor] Invalid URL:', serviceUrl)
    return []
  }
}

// Hàm trích xuất dominant color từ image bằng Canvas API
const extractDominantColor = (img: HTMLImageElement): string => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Cannot get canvas context')
    }

    // Resize nhỏ lại để tăng tốc xử lý
    const size = 64
    canvas.width = size
    canvas.height = size

    // Vẽ image lên canvas
    ctx.drawImage(img, 0, 0, size, size)

    // Lấy pixel data
    const imageData = ctx.getImageData(0, 0, size, size)
    const data = imageData.data

    // Đếm tần suất xuất hiện của mỗi màu
    const colorCount: { [key: string]: number } = {}
    let maxCount = 0
    let dominantColor = { r: 0, g: 0, b: 0 }

    // Lặp qua từng pixel (skip alpha channel và chỉ lấy sample)
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      // Skip transparent pixels
      if (a < 125) continue

      // Skip quá trắng hoặc quá đen
      if ((r > 250 && g > 250 && b > 250) || (r < 10 && g < 10 && b < 10)) continue

      // Làm tròn màu để giảm số lượng màu khác nhau
      const roundedR = Math.round(r / 10) * 10
      const roundedG = Math.round(g / 10) * 10
      const roundedB = Math.round(b / 10) * 10

      const colorKey = `${roundedR},${roundedG},${roundedB}`
      colorCount[colorKey] = (colorCount[colorKey] || 0) + 1

      if (colorCount[colorKey] > maxCount) {
        maxCount = colorCount[colorKey]
        dominantColor = { r: roundedR, g: roundedG, b: roundedB }
      }
    }

    // Convert to hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(dominantColor.r)}${toHex(dominantColor.g)}${toHex(dominantColor.b)}`
  } catch (err) {
    console.error('[FaviconColor] Error extracting color:', err)
    throw err
  }
}

// Hàm load image với fallback URLs
const loadImageWithFallback = async (urls: string[]): Promise<HTMLImageElement> => {
  for (const url of urls) {
    try {
      console.log('[FaviconColor] Trying URL:', url)

      const img = new Image()
      img.crossOrigin = 'anonymous'

      const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout'))
        }, 3000)

        img.onload = () => {
          clearTimeout(timeout)
          resolve(img)
        }

        img.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('Failed to load'))
        }
      })

      img.src = url
      const loadedImg = await loadPromise

      console.log('[FaviconColor] Successfully loaded from:', url)
      return loadedImg
    } catch (err) {
      console.log('[FaviconColor] Failed:', url, err)
      continue
    }
  }

  throw new Error('All favicon URLs failed to load')
}

export const useFaviconColor = (
  serviceUrl: string | undefined,
  options: UseFaviconColorOptions = {}
): FaviconColorResult => {
  const { enabled = true, fallbackColor = 'var(--primary)' } = options

  const [color, setColor] = useState<string>(fallbackColor)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || !serviceUrl) {
      setColor(fallbackColor)
      return
    }

    // Kiểm tra cache trước
    const cachedColor = colorCache.get(serviceUrl)
    if (cachedColor) {
      console.log('[FaviconColor] Using cached color for:', serviceUrl)
      setColor(cachedColor)
      return
    }

    let mounted = true

    const extractColor = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const faviconUrls = getFaviconUrls(serviceUrl)

        if (faviconUrls.length === 0) {
          throw new Error('Cannot generate favicon URLs')
        }

        // Load image với fallback
        const img = await loadImageWithFallback(faviconUrls)

        if (!mounted) return

        // Extract dominant color
        const hexColor = extractDominantColor(img)

        console.log('[FaviconColor] Extracted color:', hexColor, 'for', serviceUrl)

        // Lưu vào cache
        colorCache.set(serviceUrl, hexColor)
        setColor(hexColor)
      } catch (err) {
        if (!mounted) return

        console.error('[FaviconColor] Final error for', serviceUrl, ':', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setColor(fallbackColor)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    // Delay nhỏ để tránh chạy quá nhiều request cùng lúc
    const timeoutId = setTimeout(extractColor, Math.random() * 300)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [serviceUrl, enabled, fallbackColor])

  return { color, isLoading, error }
}
