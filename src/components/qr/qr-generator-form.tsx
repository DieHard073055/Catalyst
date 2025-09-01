'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QRCodeService, GeneratedQRCode } from '@/lib/qr-service'
import { trackQRGenerationAction } from '@/lib/qr-actions'
import { UserProfile } from '@/lib/types'
import { Download, Copy, Check, ExternalLink } from 'lucide-react'

interface QRGeneratorFormProps {
  userProfile: UserProfile
}

export default function QRGeneratorForm({ userProfile }: QRGeneratorFormProps) {
  const [text, setText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQR, setGeneratedQR] = useState<GeneratedQRCode | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) {
      setError('Please enter some text or URL')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const qrCode = await QRCodeService.generateQRCode({
        text: text.trim(),
        size: 300
      })
      setGeneratedQR(qrCode)

      // Track usage for analytics
      const qrInfo = QRCodeService.getQRCodeInfo(text.trim())
      const formData = new FormData()
      formData.append('content_length', text.trim().length.toString())
      formData.append('qr_type', qrInfo.category.toLowerCase())
      trackQRGenerationAction(formData).catch(err => 
        console.warn('Failed to track QR generation:', err)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedQR) return

    const link = document.createElement('a')
    link.href = generatedQR.dataUrl
    link.download = `qrcode-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyImage = async () => {
    if (!generatedQR) return

    try {
      const response = await fetch(generatedQR.dataUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy image:', err)
    }
  }

  const qrInfo = text ? QRCodeService.getQRCodeInfo(text) : null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate QR Code</CardTitle>
          <CardDescription>
            Enter any text, URL, email, or phone number to generate a QR code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Enter text, URL, email, or phone number..."
                maxLength={2000}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{text.length}/2000 characters</span>
                {qrInfo && (
                  <span className="font-medium">Type: {qrInfo.category}</span>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isGenerating || !text.trim()}
            >
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </Button>
          </form>

          {/* Quick Examples */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Examples:</h3>
            <div className="space-y-2">
              {[
                { label: 'Website', value: 'https://example.com' },
                { label: 'Email', value: 'hello@example.com' },
                { label: 'Phone', value: '+1-555-123-4567' },
                { label: 'WiFi', value: 'WIFI:T:WPA;S:MyNetwork;P:mypassword;;' }
              ].map((example) => (
                <button
                  key={example.label}
                  onClick={() => setText(example.value)}
                  className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                >
                  <span className="font-medium">{example.label}:</span> {example.value}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated QR Code */}
      <Card>
        <CardHeader>
          <CardTitle>Generated QR Code</CardTitle>
          <CardDescription>
            {generatedQR ? 'Your QR code is ready!' : 'QR code will appear here after generation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedQR ? (
            <div className="space-y-4">
              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                  <img 
                    src={generatedQR.dataUrl} 
                    alt="Generated QR Code"
                    className="max-w-full h-auto"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              </div>

              {/* QR Code Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">QR Code Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Content:</span> {qrInfo?.preview}</p>
                  <p><span className="font-medium">Type:</span> {qrInfo?.category}</p>
                  <p><span className="font-medium">Size:</span> {generatedQR.size}×{generatedQR.size}px</p>
                  <p><span className="font-medium">Generated:</span> {generatedQR.timestamp.toLocaleString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
                  <Download size={16} />
                  Download PNG
                </Button>
                <Button 
                  onClick={handleCopyImage} 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={copied}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Image'}
                </Button>
              </div>

              {/* Test QR Code */}
              {qrInfo?.isUrl && (
                <div className="pt-2">
                  <a 
                    href={generatedQR.text} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={14} />
                    Test this URL
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <div className="text-4xl">📱</div>
              </div>
              <p className="text-center">Enter content and click "Generate QR Code" to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}