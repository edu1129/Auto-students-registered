import React, { useState, useRef, useEffect } from 'react';
import { StudentData } from '../types';
import * as XLSX from 'xlsx'; // Import all of XLSX

interface DownloadManagerProps {
  data: StudentData[] | null; // Allow null
  filenamePrefix?: string;
  disabled?: boolean;
}

// Solid Heroicons for Download Options
const DocumentArrowDownIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.7a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" />
  </svg>
);
const TableCellsIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
  <path d="M17 3H3C1.89543 3 1 3.89543 1 5V15C1 16.1046 1.89543 17 3 17H17C18.1046 17 19 16.1046 19 15V5C19 3.89543 18.1046 3 17 3ZM3 4.5H7.5V9H3V4.5ZM3 10.5H7.5V15H3V10.5ZM9 4.5H17V9H9V4.5ZM9 10.5H17V15H9V10.5Z" />
</svg>
);
const CodeBracketIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
  <path fillRule="evenodd" d="M6.28 5.22a.75.75 0 010 1.06L3.56 9.25l2.72 2.97a.75.75 0 01-1.06 1.06L1.97 10.28a.75.75 0 010-1.06l3.25-3.54a.75.75 0 011.06 0zm7.44 0a.75.75 0 011.06 0l3.25 3.54a.75.75 0 010 1.06l-3.25 3.54a.75.75 0 11-1.06-1.06L16.44 9.25l-2.72-2.97a.75.75 0 010-1.06zM10.75 4.75a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
</svg>
);


const DownloadManager: React.FC<DownloadManagerProps> = ({ data, filenamePrefix = "student_data", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!data || data.length === 0) {
    disabled = true;
  }

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const downloadJson = () => {
    if (disabled || !data) return;
    const jsonString = JSON.stringify(data, null, 2);
    downloadFile(jsonString, `${filenamePrefix}.json`, "application/json");
  };

  const downloadXlsx = () => {
    if (disabled || !data) return;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    // XLSX.write will try to write to a file in Node.js, we need XLSX.writeFile for browser download
    XLSX.writeFile(workbook, `${filenamePrefix}.xlsx`);
    setIsOpen(false);
  };

  const downloadHtml = () => {
    if (disabled || !data) return;
    
    let tableHtml = `<style>
      body { font-family: sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #fff; box-shadow: 0 2px 3px rgba(0,0,0,0.1); }
      th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
      th { background-color: #e9e9e9; font-weight: bold; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      caption { font-size: 1.5em; margin-bottom: 10px; font-weight: bold; color: #555; }
      img { max-width: 50px; max-height: 50px; border-radius: 4px; }
    </style>
    <table>
      <caption>${filenamePrefix.replace(/_/g, ' ')}</caption>
      <thead><tr>`;

    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    headers.forEach(header => tableHtml += `<th>${header}</th>`);
    tableHtml += `</tr></thead><tbody>`;

    data.forEach(student => {
      tableHtml += `<tr>`;
      headers.forEach(header => {
        let value = (student as any)[header];
        if (header.toLowerCase() === 'photourl' && (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image')))) {
          value = `<img src="${value}" alt="Photo">`;
        }
        tableHtml += `<td>${value !== undefined && value !== null ? value : ''}</td>`;
      });
      tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table>`;
    downloadFile(tableHtml, `${filenamePrefix}.html`, "text/html");
  };

  const options = [
    { label: "JSON", icon: <CodeBracketIcon className="w-5 h-5 mr-3 text-sky-400"/>, action: downloadJson, format:".json" },
    { label: "XLSX", icon: <TableCellsIcon className="w-5 h-5 mr-3 text-green-400"/>, action: downloadXlsx, format:".xlsx" },
    { label: "HTML", icon: <DocumentArrowDownIcon className="w-5 h-5 mr-3 text-orange-400"/>, action: downloadHtml, format:".html" },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled}
          className="inline-flex justify-center w-full rounded-lg border border-slate-600 shadow-sm px-4 py-2.5 bg-sky-600 text-sm font-medium text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <DocumentArrowDownIcon className="w-5 h-5 mr-2 -ml-1 hero-solid" />
          Download Data
          <svg className={`-mr-1 ml-2 h-5 w-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-2xl bg-slate-700 ring-1 ring-black ring-opacity-5 ring-offset-2 ring-offset-slate-800 focus:outline-none z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {options.map((option) => (
              <button
                key={option.label}
                onClick={option.action}
                disabled={disabled}
                className="w-full text-left text-slate-200 hover:bg-slate-600 hover:text-white group flex items-center px-4 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                role="menuitem"
              >
                {option.icon}
                {option.label}
                <span className="ml-auto text-xs text-slate-400 group-hover:text-slate-300">{option.format}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadManager;