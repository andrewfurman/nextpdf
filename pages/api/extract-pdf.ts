import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    console.log('Received fields:', fields);
    console.log('Received files:', files);

    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ success: false, error: 'Error parsing form data' });
    }

    const file = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;
    if (!file || !file.filepath) {
      console.error('No valid PDF file uploaded');
      return res.status(400).json({ success: false, error: 'No valid PDF file uploaded' });
    }

    console.log('File received:', file.originalFilename, 'Size:', file.size, 'bytes');

    try {
      const buffer = fs.readFileSync(file.filepath);
      console.log('File read successfully, parsing PDF...');
      const data = await pdf(buffer);
      console.log('PDF parsed successfully, extracted text length:', data.text.length);

      // Insert page markers
      let modifiedText = '';
      for (let i = 0; i < data.numpages; i++) {
        const pageText = data.text.split('\n').slice(i * data.numpages, (i + 1) * data.numpages).join('\n');
        modifiedText += `🅿️ Start of Page ${i + 1} of ${data.numpages}\n\n${pageText}\n\n`;
      }

      res.status(200).json({ success: true, text: modifiedText });
    } catch (error) {
      console.error('Error parsing PDF:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error parsing PDF: ' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      // Clean up the temporary file
      if (file.filepath) {
        try {
          fs.unlinkSync(file.filepath);
          console.log('Temporary file deleted:', file.filepath);
        } catch (unlinkError) {
          console.error('Error deleting temporary file:', unlinkError);
        }
      }
    }
  });
}