// src/renderer/src/services/GeminiService.tsx
interface GeminiAPIKey {
  id: string
  key: string
  name: string
  isActive: boolean
  usageCount: number
  lastUsed: string | null
  createdAt: string
}

interface GeminiResponse {
  text: string
  success: boolean
  error?: string
  usedKeyId?: string
}

interface GeminiRequestOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
}

class GeminiService {
  private static instance: GeminiService
  private apiKeys: GeminiAPIKey[] = []
  private currentKeyIndex: number = 0
  private readonly STORAGE_KEY = 'gemini_api_keys'
  private readonly DEFAULT_MODEL = 'gemini-2.0-flash-lite'
  private readonly API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

  private constructor() {
    this.loadAPIKeys()
  }

  // Singleton pattern
  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService()
    }
    return GeminiService.instance
  }

  // Load API keys từ localStorage
  private loadAPIKeys(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.apiKeys = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load Gemini API keys:', error)
      this.apiKeys = []
    }
  }

  // Save API keys vào localStorage
  private saveAPIKeys(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.apiKeys))
    } catch (error) {
      console.error('Failed to save Gemini API keys:', error)
    }
  }

  // Get all API keys
  public getAPIKeys(): GeminiAPIKey[] {
    return [...this.apiKeys]
  }

  // Get active API keys only
  public getActiveAPIKeys(): GeminiAPIKey[] {
    return this.apiKeys.filter((key) => key.isActive)
  }

  // Add new API key
  public addAPIKey(key: string, name: string): GeminiAPIKey {
    const newKey: GeminiAPIKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: key.trim(),
      name: name.trim(),
      isActive: true,
      usageCount: 0,
      lastUsed: null,
      createdAt: new Date().toISOString()
    }

    this.apiKeys.push(newKey)
    this.saveAPIKeys()
    return newKey
  }

  // Update API key
  public updateAPIKey(
    id: string,
    updates: Partial<Pick<GeminiAPIKey, 'key' | 'name' | 'isActive'>>
  ): boolean {
    const index = this.apiKeys.findIndex((k) => k.id === id)
    if (index === -1) return false

    this.apiKeys[index] = {
      ...this.apiKeys[index],
      ...updates
    }

    this.saveAPIKeys()
    return true
  }

  // Delete API key
  public deleteAPIKey(id: string): boolean {
    const index = this.apiKeys.findIndex((k) => k.id === id)
    if (index === -1) return false

    this.apiKeys.splice(index, 1)
    this.saveAPIKeys()
    return true
  }

  // Get next active API key (rotation)
  private getNextAPIKey(): GeminiAPIKey | null {
    const activeKeys = this.getActiveAPIKeys()
    if (activeKeys.length === 0) return null

    // Rotate through active keys
    this.currentKeyIndex = (this.currentKeyIndex + 1) % activeKeys.length
    return activeKeys[this.currentKeyIndex]
  }

  // Update key usage statistics
  private updateKeyUsage(keyId: string): void {
    const key = this.apiKeys.find((k) => k.id === keyId)
    if (key) {
      key.usageCount++
      key.lastUsed = new Date().toISOString()
      this.saveAPIKeys()
    }
  }

  // Build request body for Gemini API
  private buildRequestBody(prompt: string, options: GeminiRequestOptions = {}) {
    return {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 8192,
        topP: options.topP ?? 0.95,
        topK: options.topK ?? 40
      }
    }
  }

  // Validate API key by making a test request
  public async validateAPIKey(apiKey: string): Promise<boolean> {
    try {
      const url = `${this.API_BASE_URL}/models/${this.DEFAULT_MODEL}:generateContent?key=${apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.buildRequestBody('Hello'))
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.candidates && data.candidates.length > 0
    } catch (error) {
      console.error('API key validation failed:', error)
      return false
    }
  }

  // Main method: Generate content with automatic key rotation
  public async generateContent(
    prompt: string,
    options: GeminiRequestOptions = {}
  ): Promise<GeminiResponse> {
    const activeKeys = this.getActiveAPIKeys()

    if (activeKeys.length === 0) {
      return {
        text: '',
        success: false,
        error: 'No active API keys available. Please add and activate at least one API key.'
      }
    }

    // Try with each active key until success
    let lastError: Error | null = null

    for (let attempt = 0; attempt < activeKeys.length; attempt++) {
      const apiKeyObj = this.getNextAPIKey()
      if (!apiKeyObj) continue

      try {
        const model = options.model || this.DEFAULT_MODEL
        const url = `${this.API_BASE_URL}/models/${model}:generateContent?key=${apiKeyObj.key}`

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.buildRequestBody(prompt, options))
        })

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`

          try {
            const errorData = await response.json()
            console.error('[Gemini API Error]', errorData)

            if (errorData.error?.message) {
              errorMessage = errorData.error.message
            }

            // Chi tiết hóa lỗi thường gặp
            if (response.status === 500) {
              errorMessage =
                'Gemini API Internal Error. Kiểm tra:\n1. API key còn quota?\n2. Prompt có hợp lệ?\n3. Network connection?'
            } else if (response.status === 429) {
              errorMessage = 'API rate limit exceeded. Vui lòng thêm API key khác.'
            } else if (response.status === 400) {
              errorMessage = 'Invalid request. Prompt có thể quá dài hoặc chứa ký tự không hợp lệ.'
            }
          } catch (e) {
            console.error('[Error parsing error response]', e)
          }

          throw new Error(errorMessage)
        }

        const data = await response.json()

        // Extract text from response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

        // Update usage statistics
        this.updateKeyUsage(apiKeyObj.id)

        return {
          text,
          success: true,
          usedKeyId: apiKeyObj.id
        }
      } catch (error) {
        console.error(`Failed with API key ${apiKeyObj.name}:`, error)
        lastError = error as Error

        // If rate limit or quota exceeded, deactivate the key temporarily
        if (
          error instanceof Error &&
          (error.message.includes('quota') ||
            error.message.includes('rate limit') ||
            error.message.includes('429'))
        ) {
          console.warn(`Deactivating API key ${apiKeyObj.name} due to rate limit/quota`)
          this.updateAPIKey(apiKeyObj.id, { isActive: false })
        }

        // Continue to next key
        continue
      }
    }

    // All keys failed
    return {
      text: '',
      success: false,
      error: lastError?.message || 'All API keys failed to generate content'
    }
  }

  // Stream content generation (for real-time responses)
  public async streamContent(
    prompt: string,
    onChunk: (text: string) => void,
    options: GeminiRequestOptions = {}
  ): Promise<GeminiResponse> {
    const activeKeys = this.getActiveAPIKeys()

    if (activeKeys.length === 0) {
      return {
        text: '',
        success: false,
        error: 'No active API keys available'
      }
    }

    const apiKeyObj = this.getNextAPIKey()
    if (!apiKeyObj) {
      return {
        text: '',
        success: false,
        error: 'Failed to get API key'
      }
    }

    try {
      const model = options.model || this.DEFAULT_MODEL
      const url = `${this.API_BASE_URL}/models/${model}:streamGenerateContent?key=${apiKeyObj.key}&alt=sse`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.buildRequestBody(prompt, options))
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (!reader) {
        throw new Error('Response body is not readable')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6) // Remove 'data: ' prefix
              if (jsonStr.trim() === '[DONE]') continue

              const data = JSON.parse(jsonStr)
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

              if (text) {
                fullText += text
                onChunk(text)
              }
            } catch (e) {
              // Skip invalid JSON lines
              continue
            }
          }
        }
      }

      this.updateKeyUsage(apiKeyObj.id)

      return {
        text: fullText,
        success: true,
        usedKeyId: apiKeyObj.id
      }
    } catch (error) {
      console.error('Stream generation failed:', error)
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Stream generation failed'
      }
    }
  }

  // Get statistics
  public getStatistics() {
    const activeKeys = this.getActiveAPIKeys()
    const totalUsage = this.apiKeys.reduce((sum, key) => sum + key.usageCount, 0)

    return {
      totalKeys: this.apiKeys.length,
      activeKeys: activeKeys.length,
      inactiveKeys: this.apiKeys.length - activeKeys.length,
      totalUsage,
      mostUsedKey:
        this.apiKeys.length > 0
          ? this.apiKeys.reduce((prev, current) =>
              prev.usageCount > current.usageCount ? prev : current
            )
          : null
    }
  }

  // Clear all API keys (for testing or reset)
  public clearAllAPIKeys(): void {
    this.apiKeys = []
    this.currentKeyIndex = 0
    this.saveAPIKeys()
  }
}

// Export singleton instance
export const geminiService = GeminiService.getInstance()

// Export types
export type { GeminiAPIKey, GeminiResponse, GeminiRequestOptions }
