// Custom QR Code service with advanced styling capabilities
export interface CustomQROptions {
  text: string
  size?: number
  
  // Color options
  foregroundColor?: string
  backgroundColor?: string
  gradientType?: 'none' | 'linear' | 'radial'
  gradientColors?: string[]
  
  // Shape options
  dotType?: 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded'
  cornerSquareType?: 'square' | 'dot' | 'extra-rounded'
  cornerDotType?: 'square' | 'dot'
  
  // Logo options
  logoUrl?: string
  logoSize?: number
  logoBackgroundColor?: string
  logoMargin?: number
  
  // Advanced options
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  margin?: number
  
  // Style presets
  preset?: 'default' | 'modern' | 'rounded' | 'dots' | 'gradient'
}

export interface CustomGeneratedQRCode {
  dataUrl: string
  svgDataUrl?: string
  size: number
  text: string
  timestamp: Date
  options: CustomQROptions
}

export class CustomQRService {
  
  static async generateCustomQR(options: CustomQROptions): Promise<CustomGeneratedQRCode> {
    const {
      text,
      size = 300,
      preset = 'default'
    } = options

    if (!text || text.trim().length === 0) {
      throw new Error('Text content is required to generate QR code')
    }

    if (text.length > 2000) {
      throw new Error('Text content is too long (max 2000 characters)')
    }

    try {
      // Apply preset styles
      const finalOptions = this.applyPreset(options, preset)
      
      // Generate QR code using QRCodeStyling library
      const dataUrl = await this.generateWithQRCodeStyling(text, finalOptions)
      
      return {
        dataUrl,
        size,
        text,
        timestamp: new Date(),
        options: finalOptions
      }
    } catch (error) {
      console.error('Custom QR Code generation failed:', error)
      throw new Error('Failed to generate custom QR code. Please check your settings.')
    }
  }

  private static applyPreset(options: CustomQROptions, preset: string): CustomQROptions {
    const baseOptions = { ...options }
    
    switch (preset) {
      case 'modern':
        return {
          ...baseOptions,
          dotType: 'rounded',
          cornerSquareType: 'extra-rounded',
          cornerDotType: 'dot',
          gradientType: 'linear',
          gradientColors: ['#667eea', '#764ba2']
        }
      
      case 'rounded':
        return {
          ...baseOptions,
          dotType: 'extra-rounded',
          cornerSquareType: 'extra-rounded',
          cornerDotType: 'dot',
          foregroundColor: '#4F46E5'
        }
      
      case 'dots':
        return {
          ...baseOptions,
          dotType: 'dots',
          cornerSquareType: 'dot',
          cornerDotType: 'dot',
          foregroundColor: '#059669'
        }
      
      case 'gradient':
        return {
          ...baseOptions,
          dotType: 'classy-rounded',
          cornerSquareType: 'extra-rounded',
          gradientType: 'radial',
          gradientColors: ['#f093fb', '#f5576c']
        }
      
      default:
        return baseOptions
    }
  }

  private static async generateWithQRCodeStyling(text: string, options: CustomQROptions): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Import QRCodeStyling dynamically
        const QRCodeStyling = (await import('qr-code-styling')).default
        
        // Map our options to QRCodeStyling format
        const qrCodeOptions = {
          width: options.size || 300,
          height: options.size || 300,
          type: 'canvas' as const,
          data: text,
          margin: options.margin || 10,
          qrOptions: {
            typeNumber: 0,
            mode: 'Byte' as const,
            errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const
          },
          imageOptions: {
            hideBackgroundDots: true,
            imageSize: (options.logoSize || 60) / (options.size || 300), // Convert to ratio
            margin: options.logoMargin || 10,
            crossOrigin: 'anonymous' as const,
          },
          dotsOptions: {
            color: this.getDotColor(options),
            type: this.mapDotType(options.dotType || 'square')
          },
          cornersSquareOptions: {
            color: this.getDotColor(options),
            type: this.mapCornerSquareType(options.cornerSquareType || 'square')
          },
          cornersDotOptions: {
            color: this.getDotColor(options),
            type: this.mapCornerDotType(options.cornerDotType || 'square')
          },
          backgroundOptions: {
            color: options.backgroundColor || '#FFFFFF'
          }
        }

        // Add image if logo URL is provided
        if (options.logoUrl && options.logoUrl.trim()) {
          qrCodeOptions.image = options.logoUrl.trim()
        }

        console.log('QR Code options:', qrCodeOptions)

        const qrCode = new QRCodeStyling(qrCodeOptions)
        
        // Use the built-in download method to get blob, then convert to data URL
        qrCode.download({ extension: 'png' }).then(() => {
          // This approach doesn't work well, let's try the direct canvas approach
        }).catch(() => {
          // Fallback approach
        })

        // Alternative approach: render to DOM temporarily
        const container = document.createElement('div')
        container.style.position = 'absolute'
        container.style.left = '-9999px'
        document.body.appendChild(container)

        qrCode.append(container)

        // Wait for rendering
        setTimeout(() => {
          try {
            const canvas = container.querySelector('canvas')
            if (canvas) {
              const dataUrl = canvas.toDataURL('image/png', 1.0)
              document.body.removeChild(container)
              resolve(dataUrl)
            } else {
              document.body.removeChild(container)
              reject(new Error('Canvas not found in rendered QR code'))
            }
          } catch (err) {
            document.body.removeChild(container)
            console.error('Error getting canvas data URL:', err)
            reject(new Error('Failed to generate QR code image'))
          }
        }, 500) // Increased timeout for complex styling
        
      } catch (err) {
        console.error('Error creating QR code:', err)
        reject(new Error('Failed to create QR code: ' + (err as Error).message))
      }
    })
  }

  private static getDotColor(options: CustomQROptions): string | { type: string; rotation: number; colorStops: Array<{ offset: number; color: string }> } {
    if (options.gradientType && options.gradientType !== 'none' && options.gradientColors && options.gradientColors.length >= 2) {
      return {
        type: options.gradientType,
        rotation: options.gradientType === 'linear' ? 0 : 0,
        colorStops: options.gradientColors.map((color, index) => ({
          offset: index / (options.gradientColors!.length - 1),
          color: color
        }))
      }
    }
    return options.foregroundColor || '#000000'
  }

  private static mapDotType(dotType: string): string {
    const mapping: Record<string, string> = {
      'square': 'square',
      'dots': 'dots',
      'rounded': 'rounded',
      'extra-rounded': 'extra-rounded',
      'classy': 'classy',
      'classy-rounded': 'classy-rounded'
    }
    return mapping[dotType] || 'square'
  }

  private static mapCornerSquareType(cornerType: string): string {
    const mapping: Record<string, string> = {
      'square': 'square',
      'dot': 'dot',
      'extra-rounded': 'extra-rounded'
    }
    return mapping[cornerType] || 'square'
  }

  private static mapCornerDotType(cornerDotType: string): string {
    const mapping: Record<string, string> = {
      'square': 'square',
      'dot': 'dot'
    }
    return mapping[cornerDotType] || 'square'
  }

  static getAvailablePresets() {
    return [
      { id: 'default', name: 'Default', description: 'Classic black and white QR code' },
      { id: 'modern', name: 'Modern', description: 'Rounded corners with blue gradient' },
      { id: 'rounded', name: 'Rounded', description: 'Soft rounded dots in purple' },
      { id: 'dots', name: 'Dots', description: 'Circular dots in green' },
      { id: 'gradient', name: 'Gradient', description: 'Pink to red radial gradient' }
    ]
  }

  static getAvailableDotTypes() {
    return [
      { id: 'square', name: 'Square', description: 'Traditional square dots' },
      { id: 'dots', name: 'Dots', description: 'Circular dots' },
      { id: 'rounded', name: 'Rounded', description: 'Rounded square corners' },
      { id: 'extra-rounded', name: 'Extra Rounded', description: 'Very rounded corners' },
      { id: 'classy', name: 'Classy', description: 'Elegant classic style' },
      { id: 'classy-rounded', name: 'Classy Rounded', description: 'Elegant with rounded corners' }
    ]
  }
}