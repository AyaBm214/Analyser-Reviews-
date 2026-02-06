'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Review } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CSVUploaderProps {
    onDataLoaded: (data: any[]) => void;
}

export function CSVUploader({ onDataLoaded }: CSVUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const processFile = (file: File) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            return;
        }

        setFileName(file.name);
        setError(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (results) => {
                try {
                    // Pass raw data to parent for smart mapping
                    // The parent component (page.tsx) handles all the fuzzy matching and type conversion
                    if (results.data && results.data.length > 0) {
                        onDataLoaded(results.data as any[]);
                    } else {
                        setError("No data found in CSV.");
                    }
                } catch (err) {
                    setError('Error processing CSV. Please checks your file.');
                    console.error(err);
                }
            },
            error: (err) => {
                setError(`Error reading file: ${err.message}`);
            }
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const clearFile = () => {
        setFileName(null);
        setError(null);
    };

    return (
        <div className="w-full">
            {!fileName ? (
                <div
                    className={cn(
                        "border-2 border-dashed rounded-xl p-8 transition-all text-center cursor-pointer",
                        isDragging ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                    )}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload')?.click()}
                >
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".csv"
                        onChange={handleChange}
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-white/5 rounded-full">
                            <UploadCloud className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                CSV files only (Max 10MB)
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <FileText className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{fileName}</p>
                            <p className="text-xs text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Upload successful
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={clearFile}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            )}

            {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
}
