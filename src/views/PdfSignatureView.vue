<template>
  <div class="signature-container">
    <h2>PDF Signature with Draggable Image</h2>

    <!-- Signature Image Upload -->
    <div class="upload-section">
      <label for="signature-upload">Upload Signature Image:</label>
      <input id="signature-upload" type="file" @change="handleSignatureUpload" accept="image/*" />
    </div>

    <!-- PDF Upload -->
    <div class="upload-section">
      <label for="pdf-upload">Upload PDF Document:</label>
      <input id="pdf-upload" type="file" @change="handlePdfUpload" accept=".pdf" />
    </div>

    <!-- PDF Preview with Draggable Signature -->
    <div class="preview-container" v-if="pdfDoc">
      <div class="pdf-preview" ref="pdfPreview" @click="placeSignature">
        <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>
        <img
          v-if="signatureUrl && signaturePosition"
          :src="signatureUrl"
          alt="Signature"
          class="signature-image"
          :style="{
            left: `${signaturePosition.x}px`,
            top: `${signaturePosition.y}px`,
            width: `${signatureSize.width}px`,
            height: `${signatureSize.height}px`
          }"
          @mousedown="startDrag"
          draggable="false"
        />
      </div>

      <!-- Signature Size Controls -->
      <div class="size-controls" v-if="signatureUrl">
        <label>Signature Size:</label>
        <input
          type="range"
          min="50"
          max="200"
          v-model.number="signatureSize.width"
          @input="adjustHeight"
        />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons" v-if="pdfDoc && signatureUrl">
      <button @click="clearSignature">Clear Signature</button>
      <button @click="signPdf">Sign PDF</button>
    </div>

    <p v-if="signedPdfUrl" class="success-message">
      PDF signed successfully!
      <a :href="signedPdfUrl" download="signed-document.pdf">Download</a>
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { PDFDocument, rgb } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString()
// Initialize PDF.js worker
// pdfjsLib.GlobalWorkerOptions.workerSrc =
//   '//cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js'

// Refs
const pdfPreview = ref(null)
const pdfCanvas = ref(null)
const pdfDoc = ref(null)
const signatureUrl = ref(null)
const signaturePosition = ref(null)
const signatureSize = ref({ width: 100, height: 50 })
const signedPdfUrl = ref(null)
const originalPdfFile = ref(null) // Changed from originalPdfBytes
const isDragging = ref(false)
const startPos = ref({ x: 0, y: 0 })

// Handle PDF upload - UPDATED
const handlePdfUpload = async (event) => {
  const file = event.target.files[0]
  if (!file || file.type !== 'application/pdf') {
    alert('Please upload a valid PDF file')
    return
  }

  try {
    originalPdfFile.value = file // Store the file object instead of ArrayBuffer
    await renderPdfPreview(file)

    // Reset signature when new PDF is loaded
    signaturePosition.value = null
    signedPdfUrl.value = null
  } catch (error) {
    console.error('Error loading PDF:', error)
    alert('Error loading PDF. Please try again.')
  }
}

// UPDATED: Render PDF preview using file object
const renderPdfPreview = async (pdfFile) => {
  try {
    const pdfUrl = URL.createObjectURL(pdfFile)
    const loadingTask = pdfjsLib.getDocument({ url: pdfUrl })
    const pdfDocument = await loadingTask.promise
    pdfDoc.value = pdfDocument

    const page = await pdfDocument.getPage(1)
    const viewport = page.getViewport({ scale: 1.0 })
    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    URL.revokeObjectURL(pdfUrl)
  } catch (error) {
    console.error('Error rendering PDF:', error)
    throw error
  }
}

// Handle signature image upload - UPDATED
const handleSignatureUpload = (event) => {
  const file = event.target.files[0]
  if (!file || !file.type.startsWith('image/')) {
    alert('Please upload a valid image file (JPEG, PNG, etc.)')
    return
  }

  // Validate the image file
  validateImageFile(file).then((isValid) => {
    if (isValid) {
      signatureUrl.value = URL.createObjectURL(file)
      signaturePosition.value = null
    } else {
      alert('Invalid image file. Please upload a valid JPEG or PNG image.')
    }
  })
}

// NEW: Validate image file
const validateImageFile = (file) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = URL.createObjectURL(file)
  })
}

// Place signature at clicked position
const placeSignature = (event) => {
  if (!signatureUrl.value) return

  const rect = pdfPreview.value.getBoundingClientRect()
  const x = event.clientX - rect.left - signatureSize.value.width / 2
  const y = event.clientY - rect.top - signatureSize.value.height / 2

  signaturePosition.value = { x, y }
}

// Start dragging signature
const startDrag = (event) => {
  if (!signaturePosition.value) return

  isDragging.value = true
  startPos.value = {
    x: event.clientX - signaturePosition.value.x,
    y: event.clientY - signaturePosition.value.y
  }

  event.preventDefault()
}

// Handle mouse move for dragging
const handleMouseMove = (event) => {
  if (!isDragging.value || !signaturePosition.value) return

  const rect = pdfPreview.value.getBoundingClientRect()
  let x = event.clientX - startPos.value.x
  let y = event.clientY - startPos.value.y

  // Constrain to preview area
  x = Math.max(0, Math.min(x, rect.width - signatureSize.value.width))
  y = Math.max(0, Math.min(y, rect.height - signatureSize.value.height))

  signaturePosition.value = { x, y }
}

// Stop dragging
const handleMouseUp = () => {
  isDragging.value = false
}

// Adjust height proportionally when width changes
const adjustHeight = () => {
  if (!signatureUrl.value) return

  const img = new Image()
  img.onload = () => {
    const aspectRatio = img.height / img.width
    signatureSize.value.height = signatureSize.value.width * aspectRatio
  }
  img.src = signatureUrl.value
}

// Clear signature
const clearSignature = () => {
  signaturePosition.value = null
}

// UPDATED: Sign PDF with fresh ArrayBuffer
const signPdf = async () => {
  if (!originalPdfFile.value || !signatureUrl.value || !signaturePosition.value) {
    alert('Please upload both PDF and signature, and position the signature')
    return
  }

  try {
    // Get fresh ArrayBuffer each time
    const pdfBytes = await originalPdfFile.value.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]

    const previewRect = pdfPreview.value.getBoundingClientRect()
    const pdfWidth = firstPage.getWidth()
    const pdfHeight = firstPage.getHeight()

    const scaleX = pdfWidth / previewRect.width
    const scaleY = pdfHeight / previewRect.height
    const pdfX = signaturePosition.value.x * scaleX
    const pdfY =
      pdfHeight - signaturePosition.value.y * scaleY - signatureSize.value.height * scaleY

    const signatureResponse = await fetch(signatureUrl.value)
    const signatureBytes = await signatureResponse.arrayBuffer()

    let signatureImage
    try {
      signatureImage = await pdfDoc.embedPng(signatureBytes)
    } catch (pngError) {
      try {
        signatureImage = await pdfDoc.embedJpg(signatureBytes)
      } catch (jpegError) {
        throw new Error('Unsupported image format. Please use JPEG or PNG.')
      }
    }

    firstPage.drawImage(signatureImage, {
      x: pdfX,
      y: pdfY,
      width: signatureSize.value.width * scaleX,
      height: signatureSize.value.height * scaleY
    })

    const modifiedPdfBytes = await pdfDoc.save()
    signedPdfUrl.value = URL.createObjectURL(
      new Blob([modifiedPdfBytes], { type: 'application/pdf' })
    )
  } catch (error) {
    console.error('Error signing PDF:', error)
    alert(error.message || 'Error signing PDF. Please try again.')
  }
}

// Set up event listeners for dragging
onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)

  // Clean up object URLs
  if ((pdfPreview.value = null)) {
    pdfPreviewUrl.value
    URL.revokeObjectURL(pdfPreviewUrl.value)
  }
  if (signatureUrl.value) URL.revokeObjectURL(signatureUrl.value)
  if (signedPdfUrl.value) URL.revokeObjectURL(signedPdfUrl.value)
})
</script>

<style scoped>
.signature-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.upload-section {
  margin-bottom: 15px;
}

.upload-section label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.preview-container {
  margin-top: 20px;
  border: 1px solid #ddd;
  padding: 10px;
  background-color: #f9f9f9;
}

.pdf-preview {
  position: relative;
  width: 100%;
  border: 1px solid #ccc;
  background-color: white;
  overflow: hidden;
  cursor: crosshair;
}

.pdf-canvas {
  width: 100%;
  height: auto;
  display: block;
}

.signature-image {
  position: absolute;
  pointer-events: auto;
  cursor: move;
  user-select: none;
}

.size-controls {
  margin-top: 10px;
}

.size-controls label {
  margin-right: 10px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

button {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #3aa876;
}

.success-message {
  margin-top: 15px;
  padding: 10px;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
}

.success-message a {
  color: #1b5e20;
  text-decoration: underline;
}
</style>
