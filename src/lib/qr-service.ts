import QRCode from 'qrcode'

export interface QRCodeOptions {
  text: string
  size?: number
  foregroundColor?: string
  backgroundColor?: string
  logoUrl?: string
}

export interface GeneratedQRCode {
  dataUrl: string
  size: number
  text: string
  timestamp: Date
}

export class QRCodeService {
  static async generateQRCode(options: QRCodeOptions): Promise<GeneratedQRCode> {
    const {
      text,
      size = 256,
      foregroundColor = '#000000',
      backgroundColor = '#FFFFFF'
    } = options

    if (!text || text.trim().length === 0) {
      throw new Error('Text content is required to generate QR code')
    }

    if (text.length > 2000) {
      throw new Error('Text content is too long (max 2000 characters)')
    }

    try {
      const qrOptions = {
        width: size,
        color: {
          dark: foregroundColor,
          light: backgroundColor
        },
        margin: 2,
        errorCorrectionLevel: 'M' as const
      }

      const dataUrl = await QRCode.toDataURL(text, qrOptions)

      return {
        dataUrl,
        size,
        text,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('QR Code generation failed:', error)
      throw new Error('Failed to generate QR code. Please check your input.')
    }
  }

  static async generateBulkQRCodes(texts: string[]): Promise<GeneratedQRCode[]> {
    if (!texts || texts.length === 0) {
      throw new Error('At least one text is required')
    }

    if (texts.length > 10) {
      throw new Error('Maximum 10 QR codes can be generated at once')
    }

    const results: GeneratedQRCode[] = []
    
    for (const text of texts) {
      if (text.trim().length > 0) {
        const qrCode = await this.generateQRCode({ text: text.trim() })
        results.push(qrCode)
      }
    }

    return results
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  static getQRCodeInfo(text: string) {
    const isUrl = this.validateUrl(text)
    const length = text.length
    let category = 'Text'
    
    if (isUrl) {
      category = 'URL'
    } else if (text.includes('@') && text.includes('.')) {
      category = 'Email'
    } else if (text.match(/^\+?[\d\s\-\(\)]+$/)) {
      category = 'Phone'
    }

    return {
      category,
      length,
      isUrl,
      preview: length > 100 ? text.substring(0, 100) + '...' : text
    }
  }
}