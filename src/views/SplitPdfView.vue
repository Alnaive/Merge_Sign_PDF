<template>
  <section class="text-gray-600 body-font">
    <div class="container px-5 py-24 mx-auto">
      <div class="flex flex-wrap w-full mb-20 flex-col items-center text-center">
        <h1 class="sm:text-3xl text-2xl font-medium title-font text-gray-900">
          Split & Merge PDF
        </h1>
        <p class="lg:w-1/2 w-full leading-relaxed text-gray-500 mb-4">
          Upload a PDF to split into pages. Drag to reorder before merging.
        </p>

        <!-- File input -->
        <input
          type="file"
          @change="handleFileUpload"
          accept="application/pdf"
          ref="fileInput"
          class="hidden"
        />
        <button
          @click="triggerFileInput"
          class="flex mx-auto mb-5 text-white bg-green-500 border-0 py-2 px-8 focus:outline-none hover:bg-green-600 rounded text-lg"
        >
          Upload PDF
        </button>
      </div>

      <!-- Split pages grid -->
      <div v-if="splitPages.length > 0" class="mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium">
            Pages ({{ splitPages.length }} total)
          </h2>
          <div class="flex gap-2">
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span class="px-3 py-1">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div class="flex flex-wrap -m-4">
          <div
            class="xl:w-1/3 md:w-1/2 p-4 pdf-preview"
            v-for="page in paginatedPages"
            :key="page.id"
            @dragstart="dragStart($event, page.id)"
            @dragover.prevent
            @drop="dropPage($event, page.id)"
            draggable="true"
          >
            <div class="border border-gray-200 p-6 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                  <span class="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                    {{ getPagePosition(page.id) + 1 }}
                  </span>
                  <p>Page {{ page.pageNumber }}</p>
                </div>
                <button
                  @click.stop="removePage(page.id)"
                  class="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
              <!-- Fixed size preview container -->
              <div class="preview-wrapper">
                <iframe 
                  :src="`${page.url}#toolbar=0`" 
                  class="pdf-preview-iframe"
                ></iframe>
              </div>
            </div>
          </div>
        </div>

        <!-- Merge controls -->
        <div class="flex justify-center mt-8 gap-4">
          <button
            v-if="!mergedPDF"
            @click="mergePages"
            :disabled="splitPages.length === 0"
            class="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg disabled:opacity-50"
          >
            Merge PDF
          </button>
          
          <a
            v-if="mergedPDF"
            :href="mergedPDF"
            download="merged.pdf"
            class="text-white bg-green-500 border-0 py-2 px-8 focus:outline-none hover:bg-green-600 rounded text-lg"
          >
            Download Merged PDF
          </a>
        </div>
      </div>

      <div class="flex justify-center">
        <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
        <p v-if="isLoading" class="text-blue-500 mt-4">Processing...</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { PDFDocument } from 'pdf-lib'

const pdfFile = ref(null)
const splitPages = ref([])
const mergedPDF = ref(null)
const error = ref(null)
const fileInput = ref(null)
const isLoading = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

// Computed properties
const totalPages = computed(() => Math.ceil(splitPages.value.length / itemsPerPage))
const paginatedPages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return splitPages.value.slice(start, end)
})

// Trigger file input
function triggerFileInput() {
  fileInput.value.click()
}

// Handle file upload and auto-split
async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    isLoading.value = true
    error.value = null
    mergedPDF.value = null
    pdfFile.value = file

    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pageCount = pdfDoc.getPageCount()

    // Split all pages
    const newSplitPages = []
    for (let i = 0; i < pageCount; i++) {
      const newPdf = await PDFDocument.create()
      const [page] = await newPdf.copyPages(pdfDoc, [i])
      newPdf.addPage(page)
      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      
      newSplitPages.push({
        id: Date.now() + i, // Unique ID for each page
        pageNumber: i + 1,
        originalIndex: i,
        url: URL.createObjectURL(blob),
        pdfBytes // Store for later merging
      })
    }

    splitPages.value = newSplitPages
    currentPage.value = 1
  } catch (err) {
    error.value = 'Failed to process PDF: ' + err.message
  } finally {
    isLoading.value = false
  }
}

// Pagination controls
function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

// Drag and drop reordering
function dragStart(event, pageId) {
  event.dataTransfer.setData('text/plain', pageId)
}

function dropPage(event, targetPageId) {
  const draggedPageId = event.dataTransfer.getData('text/plain')
  if (draggedPageId === targetPageId) return

  const draggedIndex = splitPages.value.findIndex(p => p.id === Number(draggedPageId))
  const targetIndex = splitPages.value.findIndex(p => p.id === targetPageId)

  if (draggedIndex !== -1 && targetIndex !== -1) {
    const movedPage = splitPages.value.splice(draggedIndex, 1)[0]
    splitPages.value.splice(targetIndex, 0, movedPage)
  }
}

// Get current position in array (after reordering)
function getPagePosition(pageId) {
  return splitPages.value.findIndex(p => p.id === pageId)
}

// Remove a page
function removePage(pageId) {
  const index = splitPages.value.findIndex(p => p.id === pageId)
  if (index !== -1) {
    URL.revokeObjectURL(splitPages.value[index].url)
    splitPages.value.splice(index, 1)
  }
}

// Merge reordered pages
async function mergePages() {
  if (splitPages.value.length === 0) {
    error.value = 'No pages to merge'
    return
  }

  try {
    isLoading.value = true
    error.value = null

    const mergedPdf = await PDFDocument.create()
    
    // Merge in current order
    for (const page of splitPages.value) {
      const pdfDoc = await PDFDocument.load(page.pdfBytes)
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
      pages.forEach(p => mergedPdf.addPage(p))
    }

    const mergedPdfBytes = await mergedPdf.save()
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
    mergedPDF.value = URL.createObjectURL(blob)
  } catch (err) {
    error.value = 'Failed to merge PDF: ' + err.message
  } finally {
    isLoading.value = false
  }
}

// Clean up
onUnmounted(() => {
  splitPages.value.forEach(page => URL.revokeObjectURL(page.url))
  if (mergedPDF.value) URL.revokeObjectURL(mergedPDF.value)
})
</script>

<style scoped>
.pdf-preview {
  cursor: move;
  transition: transform 0.2s;
}

.pdf-preview:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.preview-wrapper {
  position: relative;
  width: 100%;
  height: 400px; /* Fixed height for all previews */
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  overflow: hidden;
}

.pdf-preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background-color: white;
}

/* Maintain aspect ratio while fitting in container */
.pdf-preview-iframe {
  object-fit: contain;
  object-position: center;
}
</style>