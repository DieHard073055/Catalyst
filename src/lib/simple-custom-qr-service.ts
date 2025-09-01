import QRCode from 'qrcode'

// Custom QR Code service with advanced styling capabilities (simplified approach)
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
  size: number
  text: string
  timestamp: Date
  options: CustomQROptions
}

export class SimpleCustomQRService {
  
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
      
      // Generate QR code using canvas-based approach
      const dataUrl = await this.generateWithCustomCanvas(text, finalOptions)
      
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

  private static async generateWithCustomCanvas(text: string, options: CustomQROptions): Promise<string> {
    // If we need custom dot styling, generate from scratch with shapes
    if (options.dotType && options.dotType !== 'square') {
      return await this.generateWithCustomModules(text, options)
    }
    
    // Step 1: Generate base QR code
    const baseQR = await this.generateBaseQR(text, options)
    
    // Step 2: Apply other styling (gradients, logo)
    if (this.needsNonDotStyling(options)) {
      return await this.applyCustomStyling(baseQR, options)
    }
    
    return baseQR
  }

  private static needsNonDotStyling(options: CustomQROptions): boolean {
    return !!(
      options.logoUrl ||
      (options.gradientType && options.gradientType !== 'none')
    )
  }

  private static async generateWithCustomModules(text: string, options: CustomQROptions): Promise<string> {
    // Use a hidden canvas to get QR data without rendering
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    
    // Generate base QR to get the pattern data
    const QRCode = (await import('qrcode')).default
    
    // Get QR code matrix data directly
    const qrData = QRCode.create(text, {
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      margin: 0,
      width: options.size || 300
    })
    
    const modules = qrData.modules
    const size = options.size || 300
    const moduleCount = modules.size
    const moduleSize = Math.floor(size / moduleCount)
    const actualSize = moduleSize * moduleCount
    
    // Create main canvas
    const canvas = document.createElement('canvas')
    canvas.width = actualSize
    canvas.height = actualSize
    const ctx = canvas.getContext('2d')!
    
    // Fill background
    ctx.fillStyle = options.backgroundColor || '#FFFFFF'
    ctx.fillRect(0, 0, actualSize, actualSize)
    
    // Draw modules with custom shapes
    const foregroundColor = options.foregroundColor || '#000000'
    
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules.get(row, col)) {
          const x = col * moduleSize
          const y = row * moduleSize
          this.drawCustomModule(ctx, x, y, moduleSize, options.dotType!, foregroundColor)
        }
      }
    }
    
    // Apply gradients if specified
    if (options.gradientType && options.gradientType !== 'none' && options.gradientColors && options.gradientColors.length >= 2) {
      await this.applyGradientOverlay(ctx, canvas, options)
    }
    
    // Add logo if specified
    if (options.logoUrl) {
      await this.addLogoToCenter(ctx, canvas, options)
    }
    
    return canvas.toDataURL('image/png', 1.0)
  }

  private static drawCustomModule(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    dotType: string,
    color: string
  ): void {
    ctx.fillStyle = color
    const centerX = x + size / 2
    const centerY = y + size / 2
    const radius = size / 2
    
    switch (dotType) {
      case 'dots':
        // Perfect circles
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.85, 0, 2 * Math.PI)
        ctx.fill()
        break
        
      case 'rounded':
        // Rounded squares
        this.drawRoundedRect(ctx, x + size * 0.05, y + size * 0.05, size * 0.9, size * 0.9, size * 0.15)
        break
        
      case 'extra-rounded':
        // Extra rounded squares (almost circles)
        this.drawRoundedRect(ctx, x + size * 0.05, y + size * 0.05, size * 0.9, size * 0.9, size * 0.35)
        break
        
      case 'classy':
        // Diamond/rhombus shape
        ctx.beginPath()
        ctx.moveTo(centerX, y + size * 0.05)
        ctx.lineTo(x + size * 0.95, centerY)
        ctx.lineTo(centerX, y + size * 0.95)
        ctx.lineTo(x + size * 0.05, centerY)
        ctx.closePath()
        ctx.fill()
        break
        
      case 'classy-rounded':
        // Hexagon shape
        const hexRadius = radius * 0.85
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3
          const hx = centerX + hexRadius * Math.cos(angle)
          const hy = centerY + hexRadius * Math.sin(angle)
          if (i === 0) ctx.moveTo(hx, hy)
          else ctx.lineTo(hx, hy)
        }
        ctx.closePath()
        ctx.fill()
        break
        
      default:
        // Regular square
        ctx.fillRect(x, y, size, size)
        break
    }
  }

  private static async generateBaseQR(text: string, options: CustomQROptions): Promise<string> {
    const qrOptions = {
      width: options.size || 300,
      margin: options.margin || 4,
      color: {
        dark: options.foregroundColor || '#000000',
        light: options.backgroundColor || '#FFFFFF'
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const
    }

    return await QRCode.toDataURL(text, qrOptions)
  }

  private static needsCustomStyling(options: CustomQROptions): boolean {
    return !!(
      options.logoUrl ||
      (options.gradientType && options.gradientType !== 'none') ||
      (options.dotType && options.dotType !== 'square')
    )
  }

  private static async applyCustomStyling(baseDataUrl: string, options: CustomQROptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      const img = new Image()
      
      img.onload = async () => {
        canvas.width = img.width
        canvas.height = img.height
        
        // Draw base QR code
        ctx.drawImage(img, 0, 0)
        
        // Apply styling modifications
        try {
          await this.applyAdvancedStyling(ctx, canvas, options)
          resolve(canvas.toDataURL('image/png', 1.0))
        } catch (error) {
          console.error('Error applying styling:', error)
          // Return base QR if styling fails
          resolve(baseDataUrl)
        }
      }
      
      img.onerror = () => {
        console.error('Failed to load base QR image')
        reject(new Error('Failed to process QR code image'))
      }
      
      img.src = baseDataUrl
    })
  }

  private static async applyAdvancedStyling(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    options: CustomQROptions
  ): Promise<void> {
    
    // Apply gradient overlay
    if (options.gradientType && options.gradientType !== 'none' && options.gradientColors && options.gradientColors.length >= 2) {
      await this.applyGradientOverlay(ctx, canvas, options)
    }
    
    // Add logo
    if (options.logoUrl) {
      await this.addLogoToCenter(ctx, canvas, options)
    }
  }

  private static async applyGradientOverlay(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    options: CustomQROptions
  ): Promise<void> {
    if (!options.gradientColors || options.gradientColors.length < 2) return
    
    // Get image data to identify QR code pixels
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Create gradient
    const gradient = options.gradientType === 'linear' 
      ? ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      : ctx.createRadialGradient(
          canvas.width/2, canvas.height/2, 0, 
          canvas.width/2, canvas.height/2, Math.min(canvas.width, canvas.height)/2
        )
    
    options.gradientColors.forEach((color, index) => {
      gradient.addColorStop(index / (options.gradientColors!.length - 1), color)
    })
    
    // Create a new canvas for gradient application
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')!
    
    // Draw gradient on temp canvas
    tempCtx.fillStyle = gradient
    tempCtx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Get gradient data
    const gradientImageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height)
    const gradientData = gradientImageData.data
    
    // Apply gradient only to dark pixels (QR code data)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Check if pixel is dark (part of QR code)
      const isDark = (r + g + b) / 3 < 128
      
      if (isDark) {
        // Replace with gradient color
        data[i] = gradientData[i]         // R
        data[i + 1] = gradientData[i + 1] // G
        data[i + 2] = gradientData[i + 2] // B
        // Keep original alpha
      }
    }
    
    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0)
  }

  private static async applyDotStyling(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    options: CustomQROptions
  ): Promise<void> {
    if (!options.dotType || options.dotType === 'square') return
    
    // Get the image data to analyze pixel patterns
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Clear the canvas to redraw with new dot style
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set colors
    const foregroundColor = options.foregroundColor || '#000000'
    const backgroundColor = options.backgroundColor || '#FFFFFF'
    
    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Set foreground color for dots
    ctx.fillStyle = foregroundColor
    
    // Analyze the image to find QR modules (squares)
    const moduleSize = this.detectModuleSize(imageData)
    if (moduleSize < 2) {
      // If we can't detect module size, fall back to original image
      ctx.putImageData(imageData, 0, 0)
      return
    }
    
    // Draw custom dot style based on detected modules
    for (let y = 0; y < canvas.height; y += moduleSize) {
      for (let x = 0; x < canvas.width; x += moduleSize) {
        if (this.isModuleDark(imageData, x, y, moduleSize)) {
          this.drawCustomDot(ctx, x, y, moduleSize, options.dotType!, foregroundColor)
        }
      }
    }
  }

  private static detectModuleSize(imageData: ImageData): number {
    // Simple module detection by finding the first transition
    const data = imageData.data
    let lastPixelDark = false
    let transitionCount = 0
    let moduleSize = 1
    
    for (let x = 0; x < imageData.width && transitionCount < 2; x++) {
      const pixelIndex = (0 * imageData.width + x) * 4
      const r = data[pixelIndex]
      const g = data[pixelIndex + 1]
      const b = data[pixelIndex + 2]
      const isDark = (r + g + b) / 3 < 128
      
      if (x > 0 && isDark !== lastPixelDark) {
        if (transitionCount === 0) {
          moduleSize = x
        }
        transitionCount++
      }
      lastPixelDark = isDark
    }
    
    return Math.max(moduleSize, 2)
  }

  private static isModuleDark(imageData: ImageData, x: number, y: number, moduleSize: number): boolean {
    const data = imageData.data
    const centerX = Math.min(x + Math.floor(moduleSize / 2), imageData.width - 1)
    const centerY = Math.min(y + Math.floor(moduleSize / 2), imageData.height - 1)
    const pixelIndex = (centerY * imageData.width + centerX) * 4
    
    const r = data[pixelIndex]
    const g = data[pixelIndex + 1]
    const b = data[pixelIndex + 2]
    
    return (r + g + b) / 3 < 128
  }

  private static drawCustomDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    dotType: string,
    color: string
  ): void {
    ctx.fillStyle = color
    const centerX = x + size / 2
    const centerY = y + size / 2
    const radius = size / 2
    
    switch (dotType) {
      case 'dots':
        // Perfect circles
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.8, 0, 2 * Math.PI)
        ctx.fill()
        break
        
      case 'rounded':
        // Rounded squares
        this.drawRoundedRect(ctx, x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8, size * 0.2)
        break
        
      case 'extra-rounded':
        // Extra rounded squares (almost circles)
        this.drawRoundedRect(ctx, x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8, size * 0.4)
        break
        
      case 'classy':
        // Diamond/rhombus shape
        ctx.beginPath()
        ctx.moveTo(centerX, y + size * 0.1)
        ctx.lineTo(x + size * 0.9, centerY)
        ctx.lineTo(centerX, y + size * 0.9)
        ctx.lineTo(x + size * 0.1, centerY)
        ctx.closePath()
        ctx.fill()
        break
        
      case 'classy-rounded':
        // Hexagon shape
        const hexRadius = radius * 0.8
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3
          const hx = centerX + hexRadius * Math.cos(angle)
          const hy = centerY + hexRadius * Math.sin(angle)
          if (i === 0) ctx.moveTo(hx, hy)
          else ctx.lineTo(hx, hy)
        }
        ctx.closePath()
        ctx.fill()
        break
        
      default:
        // Regular square
        ctx.fillRect(x, y, size, size)
        break
    }
  }

  private static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()
  }

  private static async addLogoToCenter(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    options: CustomQROptions
  ): Promise<void> {
    if (!options.logoUrl) return
    
    return new Promise<void>((resolve) => {
      const logo = new Image()
      logo.crossOrigin = 'anonymous'
      
      logo.onload = () => {
        const logoSize = options.logoSize || Math.min(canvas.width, canvas.height) * 0.2
        const logoX = (canvas.width - logoSize) / 2
        const logoY = (canvas.height - logoSize) / 2
        const margin = options.logoMargin || 8
        const centerX = logoX + logoSize / 2
        const centerY = logoY + logoSize / 2
        const backgroundRadius = (logoSize + margin * 2) / 2
        
        // Save the current context state
        ctx.save()
        
        // Create circular clipping path for the background
        ctx.beginPath()
        ctx.arc(centerX, centerY, backgroundRadius, 0, 2 * Math.PI)
        ctx.clip()
        
        // Draw white background
        ctx.fillStyle = options.logoBackgroundColor || '#FFFFFF'
        ctx.fillRect(centerX - backgroundRadius, centerY - backgroundRadius, backgroundRadius * 2, backgroundRadius * 2)
        
        // Restore context to remove clipping
        ctx.restore()
        
        // Create circular clipping path for the logo
        ctx.save()
        ctx.beginPath()
        ctx.arc(centerX, centerY, logoSize / 2 - 2, 0, 2 * Math.PI) // Slightly smaller than background
        ctx.clip()
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // Draw logo with proper scaling
        ctx.drawImage(logo, logoX + 2, logoY + 2, logoSize - 4, logoSize - 4)
        
        // Restore context
        ctx.restore()
        
        // Add a subtle border around the logo area
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(centerX, centerY, backgroundRadius - 0.5, 0, 2 * Math.PI)
        ctx.stroke()
        
        resolve()
      }
      
      logo.onerror = () => {
        console.warn('Failed to load logo, continuing without it')
        resolve()
      }
      
      logo.src = options.logoUrl
    })
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
      { id: 'square', name: 'Square', description: 'Traditional square modules' },
      { id: 'dots', name: 'Circles', description: 'Perfect circular dots' },
      { id: 'rounded', name: 'Rounded', description: 'Rounded corner squares' },
      { id: 'extra-rounded', name: 'Extra Rounded', description: 'Heavily rounded squares' },
      { id: 'classy', name: 'Diamond', description: 'Diamond/rhombus shapes' },
      { id: 'classy-rounded', name: 'Hexagon', description: 'Six-sided hexagonal dots' }
    ]
  }
}