<template>
  <div>
    <!-- File Input -->
    <input type="file" @change="handleFileChange" accept="application/pdf" />

    <!-- PDF Preview with Signature Overlay -->
    <div v-if="fileUrl" class="pdf-preview-container">
      <!-- <iframe :src="fileUrl" width="100%" height="500px"></iframe> -->
      <img
        v-if="signatureUrl"
        ref="signatureElement"
        :src="signatureUrl"
        alt="Signature"
        class="signature-overlay"
        :style="signatureStyle"
      />
    </div>

    <!-- Signature Upload -->
    <div v-if="!fileUrl" class="signature-upload">
      <label for="signature-upload">Upload Signature:</label>
      <input id="signature-upload" type="file" @change="handleSignatureChange" accept="image/*" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDraggable } from '@vueuse/core'

const fileUrl = ref(null)
const signatureUrl = ref(null)
const signatureElement = ref(null)

// Handle PDF file upload
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'application/pdf') {
    fileUrl.value = URL.createObjectURL(file)
  } else {
    alert('Please upload a valid PDF file.')
    fileUrl.value = null
  }
}

// Handle signature image upload
const handleSignatureChange = (event) => {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    signatureUrl.value = URL.createObjectURL(file)
  } else {
    alert('Please upload a valid image file for the signature.')
    signatureUrl.value = null
  }
}

// Use useDraggable from @vueuse/core
const {
  x,
  y,
  style: draggableStyle
} = useDraggable(signatureElement, {
  initialValue: { x: 50, y: 50 } // Initial position
})

// Compute signature style
const signatureStyle = computed(() => ({
  position: 'absolute',
  left: `${x.value}px`,
  top: `${y.value}px`,
  width: '100px', // Default width
  height: 'auto', // Maintain aspect ratio
  cursor: 'grab'
}))
</script>

<style scoped>
.pdf-preview-container {
  position: relative;
  margin-top: 20px;
}

.signature-overlay {
  pointer-events: all; /* Allow dragging */
}

.signature-upload {
  margin-top: 20px;
}

.signature-upload label {
  margin-right: 10px;
}
</style>
