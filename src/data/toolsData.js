export const TOOL_CATEGORIES = [
  {
    id: 'organize',
    title: 'Organize PDF',
    description: 'Combine, split, extract, and arrange PDF pages effortlessly.',
    tools: [
      {
        id: 'merge-pdf',
        name: 'Merge PDF',
        description: 'Combine multiple PDFs into a single unified document in seconds.',
        icon: 'Files',
        isWorking: true,
        accept: '.pdf',
        badge: 'Popular'
      },
      {
        id: 'split-pdf',
        name: 'Split PDF',
        description: 'Separate one page or a whole set for easy conversion into independent PDF files.',
        icon: 'Scissors',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'remove-pages',
        name: 'Remove Pages',
        description: 'Delete selected pages from your PDF document.',
        icon: 'FileX',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'extract-pages',
        name: 'Extract Pages',
        description: 'Extract specific pages into a new PDF document.',
        icon: 'FileSpreadsheet',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'organize-pdf',
        name: 'Organize PDF',
        description: 'Sort, add, delete, and rotate PDF pages with drag and drop.',
        icon: 'LayoutGrid',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'scan-to-pdf',
        name: 'Scan to PDF',
        description: 'Capture document scans directly from your camera into PDF format.',
        icon: 'Scan',
        isWorking: true,
        accept: 'image/*'
      }
    ]
  },
  {
    id: 'optimize',
    title: 'Optimize PDF',
    description: 'Reduce file size, repair broken documents, or extract searchable text.',
    tools: [
      {
        id: 'compress-pdf',
        name: 'Compress PDF',
        description: 'Reduce PDF file size while keeping maximum quality.',
        icon: 'Minimize2',
        isWorking: true,
        accept: '.pdf',
        badge: 'Recommended'
      },
      {
        id: 'repair-pdf',
        name: 'Repair PDF',
        description: 'Recover data from damaged or corrupted PDF files.',
        icon: 'Wrench',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'ocr-pdf',
        name: 'OCR PDF',
        description: 'Convert scanned PDFs into searchable and selectable text.',
        icon: 'FileText',
        isWorking: true,
        accept: '.pdf'
      }
    ]
  },
  {
    id: 'convert-to',
    title: 'Convert to PDF',
    description: 'Transform office documents, images, and HTML into PDFs.',
    tools: [
      {
        id: 'jpg-to-pdf',
        name: 'JPG to PDF',
        description: 'Convert JPG, PNG, and WebP images to PDF with custom orientation, margin, and layout.',
        icon: 'Image',
        isWorking: true,
        accept: '.jpg,.jpeg,.png,.webp',
        badge: 'Updated'
      },
      {
        id: 'word-to-pdf',
        name: 'Word to PDF',
        description: 'Make DOC and DOCX files easy to read by converting them to PDF.',
        icon: 'FileCode',
        isWorking: true,
        accept: '.doc,.docx'
      },
      {
        id: 'powerpoint-to-pdf',
        name: 'PowerPoint to PDF',
        description: 'Make PPT and PPTX slideshows easy to view by converting to PDF.',
        icon: 'Presentation',
        isWorking: true,
        accept: '.ppt,.pptx'
      },
      {
        id: 'excel-to-pdf',
        name: 'Excel to PDF',
        description: 'Make EXCEL spreadsheets easy to read by converting them to PDF.',
        icon: 'Table',
        isWorking: true,
        accept: '.xls,.xlsx'
      },
      {
        id: 'html-to-pdf',
        name: 'HTML to PDF',
        description: 'Convert web pages or HTML code directly into PDF documents.',
        icon: 'Globe',
        isWorking: true,
        accept: '.html,.htm'
      }
    ]
  },
  {
    id: 'convert-from',
    title: 'Convert from PDF',
    description: 'Export PDF content into editable formats and images.',
    tools: [
      {
        id: 'pdf-to-jpg',
        name: 'PDF to JPG',
        description: 'Extract all images or convert each page into a high-quality JPG.',
        icon: 'FileImage',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'pdf-to-word',
        name: 'PDF to Word',
        description: 'Convert your PDF to editable Word documents with high accuracy.',
        icon: 'FileType',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'pdf-to-powerpoint',
        name: 'PDF to PowerPoint',
        description: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.',
        icon: 'MonitorPlay',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'pdf-to-excel',
        name: 'PDF to Excel',
        description: 'Pull data straight from PDFs into Excel spreadsheets in seconds.',
        icon: 'Grid',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'pdf-to-pdfa',
        name: 'PDF to PDF/A',
        description: 'Transform your PDF into ISO-standardized PDF/A for long-term archiving.',
        icon: 'Archive',
        isWorking: true,
        accept: '.pdf'
      }
    ]
  },
  {
    id: 'edit',
    title: 'Edit PDF',
    description: 'Annotate, rotate, watermark, crop, and fill out PDF forms.',
    tools: [
      {
        id: 'rotate-pdf',
        name: 'Rotate PDF',
        description: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once.',
        icon: 'RotateCw',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'add-page-numbers',
        name: 'Add page numbers',
        description: 'Add page numbers into PDFs with custom formatting and position.',
        icon: 'Hash',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'add-watermark',
        name: 'Add watermark',
        description: 'Stamp an image or text over your PDF in seconds.',
        icon: 'Stamp',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'crop-pdf',
        name: 'Crop PDF',
        description: 'Trim margins and crop specific areas of your PDF pages.',
        icon: 'Crop',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'edit-pdf',
        name: 'Edit PDF',
        description: 'Add text, shapes, comments, and annotations directly to your PDF.',
        icon: 'Edit3',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'pdf-forms',
        name: 'PDF Forms',
        description: 'Fill out interactive PDF forms and sign text fields.',
        icon: 'CheckSquare',
        isWorking: true,
        accept: '.pdf'
      }
    ]
  },
  {
    id: 'security',
    title: 'PDF Security',
    description: 'Protect, unlock, redact, compare, and digitally sign documents.',
    tools: [
      {
        id: 'unlock-pdf',
        name: 'Unlock PDF',
        description: 'Remove PDF password security, giving you the freedom to use your PDFs.',
        icon: 'Unlock',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'protect-pdf',
        name: 'Protect PDF',
        description: 'Add password protection to PDF files. Uses qpdf AES-256 encryption when available. See tool notes for encryption details.',
        icon: 'Lock',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'sign-pdf',
        name: 'Sign PDF',
        description: 'Sign a document and request signatures. Draw your electronic signature.',
        icon: 'PenTool',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'redact-pdf',
        name: 'Redact PDF',
        description: 'Block out sensitive areas in PDFs with black overlays. Note: this is visual overlay only — underlying text is not removed from the file\'s content stream.',
        icon: 'EyeOff',
        isWorking: true,
        accept: '.pdf'
      },
      {
        id: 'compare-pdf',
        name: 'Compare PDF',
        description: 'Compare two PDFs side by side to highlight visual and text differences.',
        icon: 'Columns',
        isWorking: true,
        accept: '.pdf'
      }
    ]
  },
  {
    id: 'intelligence',
    title: 'PDF Intelligence (AI)',
    description: 'AI powered document understanding, translation, and extraction.',
    tools: [
      {
        id: 'ai-summarizer',
        name: 'AI Summarizer',
        description: 'Generate concise summaries, key points, and Q&A from long PDFs.',
        icon: 'Sparkles',
        isWorking: false,
        accept: '.pdf',
        badge: 'Coming Soon'
      },
      {
        id: 'translate-pdf',
        name: 'Translate PDF',
        description: 'Translate full PDF documents into multiple languages offline instantly.',
        icon: 'Languages',
        isWorking: false,
        accept: '.pdf',
        badge: 'Coming Soon'
      },
      {
        id: 'pdf-to-markdown',
        name: 'PDF to Markdown',
        description: 'Convert PDF content into clean Markdown format for developers & LLMs.',
        icon: 'FileCode2',
        isWorking: false,
        accept: '.pdf',
        badge: 'Coming Soon'
      }
    ]
  },
  {
    id: 'image',
    title: 'Image Tools',
    description: 'AI background removal and image optimization suite.',
    tools: [
      {
        id: 'background-remover',
        name: 'Background Remover',
        description: 'Automatically remove image background with AI. Replace with colors or images.',
        icon: 'Sparkles',
        isWorking: true,
        accept: '.jpg,.jpeg,.png',
        badge: 'AI Active'
      }
    ]
  }
];
