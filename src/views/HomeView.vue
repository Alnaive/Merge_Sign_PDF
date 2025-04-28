<template>
  <section class="text-gray-600 body-font">
    <div class="container px-5 py-24 mx-auto">
      <div class="flex flex-wrap w-full mb-20 flex-col items-center text-center">
        <h1 class="sm:text-3xl text-2xl font-medium title-font text-gray-900">
          Merge PDF ({{ files.length }} files)
        </h1>
        <p class="lg:w-1/2 w-full leading-relaxed text-gray-500 mb-4">Drag to reorder PDF files</p>

        <!-- File input for adding PDFs -->
        <input
          type="file"
          multiple
          @change="handleFileUpload"
          accept="application/pdf"
          ref="fileInput"
          class="hidden"
        />
        <!-- Button to trigger file input -->
        <button
          @click="triggerFileInput"
          class="flex mx-auto mb-5 text-white bg-green-500 border-0 py-2 px-8 focus:outline-none hover:bg-green-600 rounded text-lg"
        >
          Add PDFs
        </button>
      </div>
      <div class="flex flex-wrap -m-4" v-if="files.length">
        <div
          class="xl:w-1/3 md:w-1/2 p-4 pdf-preview"
          v-for="(file, index) in files"
          :key="index"
          @dragstart="dragStart($event, index)"
          @dragover.prevent
          @drop="dropFile($event, index)"
          draggable="true"
        >
          <div class="border border-gray-200 p-6 rounded-lg">
            <div class="flex items-center mb-2">
              <span class="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                {{ index + 1 }}
              </span>
              <p class="truncate">{{ file.file.name }}</p>
            </div>
            <iframe :src="`${file.preview}#toolbar=0`" class="w-full aspect-video mb-4"></iframe>
          </div>
        </div>
      </div>
      <div class="flex justify-center flex-col">
        <button
          v-if="files.length"
          @click="mergePDFs"
          class="flex mx-auto mb-5 mt-5 text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg"
        >
          Merge PDF
        </button>
        <span
          ><p v-if="error">{{ error }}</p></span
        >
        <a
          @click="mergePDFs"
          v-if="mergedPDF"
          :href="mergedPDF"
          download="merged.pdf"
          class="flex mx-auto justify-center text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg"
          >Download</a
        >
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { PDFDocument } from 'pdf-lib'

const files = ref([])
const mergedPDF = ref(null)
const error = ref(null)
const fileInput = ref(null) // Reference to the file input element

// Trigger file input click
function triggerFileInput() {
  fileInput.value.click()
}

// Handle file upload for PDFs
function handleFileUpload(event) {
  const newFiles = Array.from(event.target.files).map((file) => ({
    file: file,
    preview: URL.createObjectURL(file)
  }))
  files.value = [...files.value, ...newFiles] // Append new files to the existing list
}

// Drag start event
function dragStart(event, index) {
  event.dataTransfer.setData('text/plain', index)
}

// Drop event to reorder files
function dropFile(event, index) {
  const draggedIndex = event.dataTransfer.getData('text/plain')
  const draggedFile = files.value.splice(draggedIndex, 1)[0]
  files.value.splice(index, 0, draggedFile)
}

// Merge PDFs
async function mergePDFs() {
  if (files.value.length < 2) {
    error.value = 'Please upload at least two PDF files to merge.'
    return
  }

  error.value = null

  try {
    const mergedPdf = await PDFDocument.create()

    for (const fileObj of files.value) {
      const arrayBuffer = await fileObj.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
      pages.forEach((page) => mergedPdf.addPage(page))
    }

    const mergedPdfBytes = await mergedPdf.save()
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
    mergedPDF.value = URL.createObjectURL(blob)
  } catch (err) {
    error.value = 'An error occurred while merging PDFs.'
  }
}
</script>

<style scoped>
#app {
  text-align: center;
  margin: 2rem;
}

.pdf-preview {
  margin: 1rem 0;
  position: relative;
  border: 1px solid #ccc;
  padding: 1rem;
}

.pdf-preview:hover {
  background-color: #f0f0f0;
}
</style>
