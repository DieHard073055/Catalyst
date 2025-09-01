'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SimpleCustomQRService as CustomQRService, CustomGeneratedQRCode, CustomQROptions } from '@/lib/simple-custom-qr-service'
// import { useFeatureAction } from '@/lib/feature-actions' // Removed: Studio is already unlocked
import { uploadLogoAction, deleteLogoAction } from '@/lib/logo-upload-actions'
import { UserProfile } from '@/lib/types'
import { Download, Copy, Check, ExternalLink, Palette, Image, Settings } from 'lucide-react'

interface CustomQRGeneratorFormProps {
  userProfile: UserProfile
}

export default function CustomQRGeneratorForm({ userProfile }: CustomQRGeneratorFormProps) {
  const [text, setText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQR, setGeneratedQR] = useState<CustomGeneratedQRCode | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  // const [showConfirmation, setShowConfirmation] = useState(false) // Removed: No credit confirmation needed

  // Style options state
  const [selectedPreset, setSelectedPreset] = useState('default')
  const [foregroundColor, setForegroundColor] = useState('#000000')
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [dotType, setDotType] = useState<CustomQROptions['dotType']>('square')
  const [logoUrl, setLogoUrl] = useState('')
  const [gradientType, setGradientType] = useState<CustomQROptions['gradientType']>('none')
  const [gradientColors, setGradientColors] = useState(['#667eea', '#764ba2'])
  const [uploadedLogoFile, setUploadedLogoFile] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [previewQR, setPreviewQR] = useState<CustomGeneratedQRCode | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  // const [generatedCombinations, setGeneratedCombinations] = useState<Set<string>>(new Set()) // Removed: No need to track combinations for credits

  // Removed createCombinationHash function - no longer needed for credit tracking

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some text or URL')
      return
    }

    // Build options object
    const options: CustomQROptions = {
      text: text.trim(),
      size: 400,
      foregroundColor,
      backgroundColor,
      dotType,
      logoUrl: logoUrl.trim() || undefined,
      gradientType,
      gradientColors: gradientType !== 'none' ? gradientColors : undefined,
      preset: selectedPreset as CustomQROptions['preset'],
      errorCorrectionLevel: logoUrl ? 'H' : 'M'
    }

    // No credit checking needed - studio is already unlocked

    setIsGenerating(true)
    setError('')

    try {
      const qrCode = await CustomQRService.generateCustomQR(options)
      setGeneratedQR(qrCode)

      // No credit deduction needed - unlimited generations after unlock

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate custom QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  // Removed confirmation handlers - no credit deduction needed

  // Removed combination tracking functions - no longer needed

  const handleDownload = () => {
    if (!generatedQR) return

    const link = document.createElement('a')
    link.href = generatedQR.dataUrl
    link.download = `custom-qrcode-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyImage = async () => {
    if (!generatedQR) return

    try {
      // Check if Clipboard API is available
      if (navigator.clipboard && navigator.clipboard.write) {
        const response = await fetch(generatedQR.dataUrl)
        const blob = await response.blob()
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        // Fallback: Copy data URL to clipboard as text
        await copyToClipboardFallback(generatedQR.dataUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy image:', err)
      // Try fallback method
      try {
        await copyToClipboardFallback(generatedQR.dataUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr)
        setError('Unable to copy image. Please try downloading instead.')
      }
    }
  }

  const copyToClipboardFallback = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // Use modern clipboard API for text
      await navigator.clipboard.writeText(text)
    } else {
      // Legacy fallback
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
      } finally {
        document.body.removeChild(textArea)
      }
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('logo', file)
      
      const result = await uploadLogoAction(formData)
      
      if (result.success && result.url) {
        setLogoUrl(result.url)
        setUploadedLogoFile(result.fileName)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo')
    } finally {
      setIsUploadingLogo(false)
      // Clear the input
      event.target.value = ''
    }
  }

  const handleRemoveUploadedLogo = async () => {
    if (!uploadedLogoFile) return

    try {
      await deleteLogoAction(uploadedLogoFile)
      setLogoUrl('')
      setUploadedLogoFile(null)
    } catch (err) {
      console.error('Failed to delete logo:', err)
    }
  }

  const generatePreview = useCallback(async () => {
    setIsGeneratingPreview(true)
    
    try {
      // Use actual user text if available, otherwise fall back to sample data
      const previewText = text.trim() || 'SAMPLE QR CODE - PREVIEW ONLY'
      
      const options: CustomQROptions = {
        text: previewText,
        size: 300,
        foregroundColor,
        backgroundColor,
        dotType,
        logoUrl: logoUrl.trim() || undefined,
        gradientType,
        gradientColors: gradientType !== 'none' ? gradientColors : undefined,
        preset: selectedPreset as CustomQROptions['preset'],
        errorCorrectionLevel: logoUrl ? 'H' : 'M'
      }

      const qrCode = await CustomQRService.generateCustomQR(options)
      setPreviewQR(qrCode)
    } catch (err) {
      console.error('Failed to generate preview:', err)
      setPreviewQR(null)
    } finally {
      setIsGeneratingPreview(false)
    }
  }, [text, selectedPreset, foregroundColor, backgroundColor, dotType, logoUrl, gradientType, gradientColors])

  // Generate preview when settings change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      generatePreview()
    }, 300) // 300ms debounce

    return () => clearTimeout(debounceTimer)
  }, [generatePreview])

  const presets = CustomQRService.getAvailablePresets()
  const dotTypes = CustomQRService.getAvailableDotTypes()

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {/* Configuration Panel */}
      <div className="xl:col-span-2 space-y-6">
        {/* Content Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={20} />
              Content & Basic Settings
            </CardTitle>
            <CardDescription>
              Enter the content for your QR code and basic settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Enter text, URL, email, or phone number..."
                maxLength={2000}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{text.length}/2000 characters</span>
              </div>
            </div>

            {/* Style Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style Preset
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-3 text-left border rounded-md hover:border-blue-500 transition-colors ${
                      selectedPreset === preset.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm">{preset.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color & Style Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette size={20} />
              Colors & Styling
            </CardTitle>
            <CardDescription>
              Customize colors and dot styles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foreground Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>

            {/* Dot Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dot Style
              </label>
              <select
                value={dotType}
                onChange={(e) => setDotType(e.target.value as CustomQROptions['dotType'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {dotTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Gradient Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gradient Type
              </label>
              <select
                value={gradientType}
                onChange={(e) => setGradientType(e.target.value as CustomQROptions['gradientType'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="none">No Gradient</option>
                <option value="linear">Linear Gradient</option>
                <option value="radial">Radial Gradient</option>
              </select>
            </div>

            {gradientType !== 'none' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gradient Start
                  </label>
                  <input
                    type="color"
                    value={gradientColors[0]}
                    onChange={(e) => setGradientColors([e.target.value, gradientColors[1]])}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gradient End
                  </label>
                  <input
                    type="color"
                    value={gradientColors[1]}
                    onChange={(e) => setGradientColors([gradientColors[0], e.target.value])}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logo Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image size={20} />
              Logo & Branding
            </CardTitle>
            <CardDescription>
              Add your logo to the center of the QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                placeholder="https://example.com/logo.png"
              />
              
              {/* PNG Upload Option */}
              <div className="space-y-3">
                {!uploadedLogoFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                      disabled={isUploadingLogo}
                    />
                    <label
                      htmlFor="logo-upload"
                      className={`cursor-pointer block text-center ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="space-y-2">
                        <div className="text-gray-600">
                          <Image className="mx-auto h-8 w-8" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            {isUploadingLogo ? 'Uploading...' : 'Upload your logo'}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF, SVG, WebP up to 5MB
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-white rounded border overflow-hidden">
                          <img 
                            src={logoUrl} 
                            alt="Uploaded logo" 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">Logo uploaded successfully</p>
                          <p className="text-xs text-green-600">Ready to use in QR code</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleRemoveUploadedLogo}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Sample Logo URLs */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Or try these sample logos:</p>
                  {[
                    { name: 'GitHub', url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' },
                    { name: 'Next.js', url: 'https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_light_background.png' }
                  ].map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => setLogoUrl(sample.url)}
                      className="block text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      {sample.name} Logo
                    </button>
                  ))}
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                For best results, use a square logo (PNG with transparency recommended)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="sticky bottom-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Button 
            onClick={handleGenerate}
            className="w-full" 
            disabled={isGenerating || !text.trim()}
            size="lg"
          >
            {isGenerating ? 'Generating...' : 'Generate Custom QR Code'}
          </Button>
        </div>
      </div>

      {/* Preview Panel */}
      <div>
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              {generatedQR ? 'Your final QR code is ready!' : 'Live preview - generate unlimited QR codes'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Show live preview first */}
            {!generatedQR && previewQR && (
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">📖 Live Preview Mode</p>
                  <p className="text-xs text-blue-500">{text.trim() ? 'Showing your text with current settings' : 'Enter text above to see live preview with your content'}</p>
                </div>
                
                {/* Preview QR Code Display */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white border-2 border-blue-200 rounded-lg shadow-sm">
                    <img 
                      src={previewQR.dataUrl} 
                      alt="QR Code Preview"
                      className="max-w-full h-auto"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                </div>

                {/* Preview Info */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                  <p><span className="font-medium">Style:</span> {previewQR.options.preset}</p>
                  <p><span className="font-medium">Dots:</span> {previewQR.options.dotType}</p>
                  <p><span className="font-medium">Size:</span> {previewQR.size}×{previewQR.size}px</p>
                  <p className="text-blue-600"><span className="font-medium">{text.trim() ? 'Your text:' : 'Sample data:'}</span> {previewQR.text}</p>
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 text-center">
                    {text.trim() ? 'Click "Generate" to create the final high-resolution QR code' : 'Enter your text above to see live preview with your content'}
                  </p>
                </div>
              </div>
            )}

            {/* Loading state for preview */}
            {!generatedQR && isGeneratingPreview && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4 animate-pulse">
                  <Palette className="w-8 h-8" />
                </div>
                <p className="text-center text-sm">
                  Generating preview...
                </p>
              </div>
            )}

            {/* Final generated QR code */}
            {generatedQR ? (
              <div className="space-y-4">
                {/* QR Code Display */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                    <img 
                      src={generatedQR.dataUrl} 
                      alt="Generated Custom QR Code"
                      className="max-w-full h-auto"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button onClick={handleDownload} className="w-full flex items-center gap-2">
                    <Download size={16} />
                    Download PNG
                  </Button>
                  <Button 
                    onClick={handleCopyImage} 
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                    disabled={copied}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                </div>

                {/* QR Info */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                  <p><span className="font-medium">Style:</span> {generatedQR.options.preset}</p>
                  <p><span className="font-medium">Dots:</span> {generatedQR.options.dotType}</p>
                  <p><span className="font-medium">Size:</span> {generatedQR.size}×{generatedQR.size}px</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Palette className="w-8 h-8" />
                </div>
                <p className="text-center text-sm">
                  Configure your settings and generate a custom QR code
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Removed confirmation dialog - no credit deduction needed */}
    </div>
  )
}