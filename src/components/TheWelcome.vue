<template>
  <section class="text-gray-400 bg-gray-900 body-font">
    <div class="container mx-auto flex flex-col px-5 py-24 justify-center items-center">
      <div class="w-full md:w-2/3 flex flex-col mb-16 items-center text-center">
        <h1 class="title-font sm:text-4xl text-3xl mb-4 font-medium text-white">
          PDF Viewer with Blob Display
        </h1>

        <!-- Upload PDF Input -->
        <div class="flex w-full justify-center items-end mb-4">
          <div class="relative mr-4 lg:w-full xl:w-1/2 w-2/4 md:w-full text-left">
            <label for="pdf-upload" class="leading-7 text-sm text-gray-400">Upload PDF</label>
            <input id="pdf-upload" type="file" accept="application/pdf" @change="handleFileUpload" />
          </div>
        </div>

        <!-- Upload Signature Input -->
        <div class="flex w-full justify-center items-end mb-4">
          <div class="relative mr-4 lg:w-full xl:w-1/2 w-2/4 md:w-full text-left">
            <label for="signature-upload" class="leading-7 text-sm text-gray-400">Upload Signature</label>
            <input id="signature-upload" type="file" accept="image/*" @change="handleSignatureUpload" />
          </div>
        </div>

        <!-- Page Selection -->
        <div v-if="pdfBlobUrl">
          <label for="page-select" class="leading-7 text-sm text-gray-400">Select Page for Signature</label>
          <select v-model="selectedPage" id="page-select">
            <option v-for="page in totalPages" :key="page" :value="page">{{ page }}</option>
          </select>
        </div>

        <!-- PDF Blob Display -->
        <div v-if="pdfBlobUrl" class="relative mt-4">
          <h2 class="text-white">PDF Blob Display</h2>
          <iframe :src="pdfBlobUrl" 
                  :style="{ width: pdfWidth + 'px', height: pdfHeight + 'px' }" 
                  frameborder="0"></iframe>

          <!-- Draggable Signature Image -->
          <img v-if="signatureSrc" 
               :src="signatureSrc" 
               class="signature" 
               ref="signature" 
               style="position: absolute; top: 100px; left: 100px; width: 150px; height: auto; cursor: move;" 
               data-x="0" 
               data-y="0" />
        </div>

        <!-- Download Button -->
        <button v-if="pdfBlobUrl && signatureSrc" @click="downloadPDF" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          Download PDF with Signature
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { PDFDocument } from 'pdf-lib';
import interact from 'interactjs';

const pdfBlobUrl = ref(null);
const pdfWidth = ref(0); // Store PDF width
const pdfHeight = ref(0); // Store PDF height
const signatureSrc = ref(null); // To store the uploaded signature image
const totalPages = ref(0); // Total number of pages in the PDF
const selectedPage = ref(1); // The page selected for the signature

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== 'application/pdf') {
    alert('Please upload a valid PDF file.');
    return;
  }

  // Create a blob URL for the uploaded PDF
  pdfBlobUrl.value = URL.createObjectURL(file);
  
  // Load the PDF to get its dimensions and page count
  const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
  const pages = pdfDoc.getPages();
  
  // Store the total number of pages
  totalPages.value = pages.length;

  // Assuming you want the dimensions of the first page
  const { width, height } = pages[0].getSize();
  pdfWidth.value = width;
  pdfHeight.value = height;
}

async function handleSignatureUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Ensure the uploaded file is an image
  if (!file.type.startsWith('image/')) {
    alert('Please upload a valid image file for the signature.');
    return;
  }

  // Create a blob URL for the uploaded signature image
  signatureSrc.value = URL.createObjectURL(file);
}

// Enable dragging of the signature
onMounted(() => {
  interact('.signature')
    .draggable({
      listeners: {
        move(event) {
          const target = event.target;
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

          // Translate the element
          target.style.transform = `translate(${x}px, ${y}px)`;

          // Update the position attributes
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);
        },
      },
      modifiers: [
        interact.modifiers.restrict({
          restriction: 'parent', // Restrict dragging to the parent container
          endOnly: true,
        }),
      ],
    });
});

// Function to download the PDF with the signature
async function downloadPDF() {
  const pdfResponse = await fetch(pdfBlobUrl.value);
  const pdfBytes = await pdfResponse.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  // Load the signature image
  const signatureImgResponse = await fetch(signatureSrc.value);
  const signatureImgBytes = await signatureImgResponse.arrayBuffer();
  const signatureImage = await pdfDoc.embedPng(signatureImgBytes);

  // Get the selected page from dropdown
  const pageIndex = selectedPage.value - 1; // Convert to zero-based index
  const page = pdfDoc.getPage(pageIndex);

  // Get dimensions of the signature image
  const { width, height } = signatureImage.scale(0.5); // Scale as needed

  // Get the current position of the signature
  const xPos = parseFloat(document.querySelector('.signature').getAttribute('data-x'));
  const yPos = parseFloat(document.querySelector('.signature').getAttribute('data-y'));

  // Convert the iframe position to PDF coordinates
  const iframe = document.querySelector('iframe');
  const iframeRect = iframe.getBoundingClientRect();
  
  // Calculate the position for the signature image in the PDF
  const x = (xPos / iframeRect.width) * pdfWidth.value;
  const y = pdfHeight.value - ((yPos / iframeRect.height) * pdfHeight.value + height); // Flip y for PDF coordinates

  // Draw the signature image on the selected PDF page
  page.drawImage(signatureImage, {
    x,
    y,
    width,
    height,
  });

  // Serialize the PDF document to bytes
  const pdfBytesWithSignature = await pdfDoc.save();

  // Create a blob URL for the new PDF
  const blob = new Blob([pdfBytesWithSignature], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  // Create a download link and trigger it
  const a = document.createElement('a');
  a.href = url;
  a.download = 'signed_document.pdf'; // Set the filename
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // Clean up the URL
}
</script>

<style>
iframe {
  border: none; /* Remove border for better aesthetics */
}

.signature {
  transition: transform 0.1s ease; /* Optional smooth transition */
}
</style>
