import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const Home: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setIsLoading(true);
    setExtractedText('');
    setError('');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setExtractedText(data.text);
    } catch (err) {
      setError(err.message || 'Error extracting text from PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>PDF Text Extractor</title>
        <meta name="description" content="Extract text from PDF files" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>PDF Text Extractor</h1>
        <p className={styles.description}>Upload a PDF file to extract its text</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className={styles.input}
          />
          <button type="submit" disabled={isLoading || !file} className={styles.button}>
            {isLoading ? 'Extracting...' : 'Extract Text'}
          </button>
        </form>

        {error && <div className={styles.errorContainer}><p className={styles.errorText}>{error}</p></div>}

        {extractedText && (
          <div className={styles.textContainer}>
            <h2>Extracted Text:</h2>
            <pre className={styles.extractedText}>{extractedText}</pre>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;