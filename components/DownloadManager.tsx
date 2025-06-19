
import React, { useState, useRef, useEffect } from 'react';
import { StudentData } from '../types';
import * as XLSX from 'xlsx'; 

interface DownloadManagerProps {
  data: StudentData[] | null; 
  filenamePrefix?: string;
  disabled?: boolean;
}

// Icons (assuming these are already defined correctly from previous steps)
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
const UserGroupIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => ( // For HTML Report
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.75.75 0 01-.312-.992 7.5 7.5 0 0111.644 0 .75.75 0 01-.312.992A18.003 18.003 0 0110 16.5c-2.784 0-5.429-.618-7.876-1.724a.75.75 0 01-.634-.45zM14 8a2 2 0 11-4 0 2 2 0 014 0zM18.51 15.326a.75.75 0 01-.946-.45 18.003 18.003 0 00-15.128 0 .75.75 0 01-.946.45A20.502 20.502 0 0010 18.5c3.097 0 6.012-.808 8.51-2.226a.75.75 0 00.438-.648c0-.28-.158-.53-.394-.658a7.502 7.502 0 00-4.032-1.222 9.002 9.002 0 003.546-1.996.75.75 0 00-.284-1.38A9.001 9.001 0 0013 7.5c0 .341.036.674.103.996a.75.75 0 00.909.689 7.502 7.502 0 013.986 1.48.75.75 0 00.75-.088c.205-.13.313-.362.313-.606a9.003 9.003 0 00-1.76-4.52.75.75 0 00-1.127-.248A7.485 7.485 0 0110 6.5a7.5 7.5 0 01-5.053 1.956.75.75 0 00-1.127.248A9.003 9.003 0 002 13.25c0 .244.108.476.313.606a.75.75 0 00.75.088 7.502 7.502 0 013.986-1.48.75.75 0 00.909-.689A9.007 9.007 0 008 7.5c0-1.764.604-3.407 1.624-4.735a.75.75 0 00-.284-1.38A9.001 9.001 0 006 3.5C2.5 3.5 1 5.686 1 8.25c0 1.84.957 3.528 2.456 4.634a.75.75 0 00.438.648A20.502 20.502 0 0110 15.5c1.077 0 2.112.115 3.092.326a.75.75 0 00.8-.622 7.502 7.502 0 000-2.956.75.75 0 00-.8-.622A18.003 18.003 0 0110 12.5c-1.392 0-2.731.213-4 .598a.75.75 0 01-.634-.45z" />
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
    XLSX.writeFile(workbook, `${filenamePrefix}.xlsx`);
    setIsOpen(false);
  };

  const generateEnhancedHtmlContent = (students: StudentData[], title: string): string => {
    // Helper to sanitize content for HTML display
    const escapeHtml = (unsafe: any): string => {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        return String(unsafe).replace(/[&<"'>]/g, (match) => { // Added >
            switch (match) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                default: return match;
            }
        });
    };

    const studentDataJson = JSON.stringify(students.map((s, index) => ({ ...s, id: `student-${index}` }))); // Add a unique ID for JS

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; background-color: #f0f4f8; color: #333; display: flex; flex-direction: column; min-height: 100vh; }
          .app-header { background-color: #2c3e50; color: white; padding: 15px 25px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .app-header h1 { margin: 0; font-size: 1.8em; }
          .main-container { display: flex; flex-grow: 1; max-width: 1400px; margin: 20px auto; width: 95%; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; }
          
          .student-list-panel { width: 300px; min-width: 250px; border-right: 1px solid #d1d9e6; background-color: #f8f9fa; display: flex; flex-direction: column; }
          .student-list-panel h2 { font-size: 1.3em; color: #34495e; padding: 18px 20px; margin: 0; border-bottom: 1px solid #d1d9e6; background-color: #e9ecef; }
          .student-list-ul { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex-grow: 1; }
          .student-list-ul li { padding: 12px 20px; cursor: pointer; border-bottom: 1px solid #e7ebee; transition: background-color 0.2s ease; font-size: 0.95em; }
          .student-list-ul li:hover { background-color: #e9ecef; }
          .student-list-ul li.active { background-color: #3498db; color: white; font-weight: 500; }
          .student-list-ul li .roll-number { font-size: 0.8em; color: #7f8c8d; display: block; }
          .student-list-ul li.active .roll-number { color: #ecf0f1; }

          .student-profile-panel { flex-grow: 1; padding: 25px; overflow-y: auto; background-color: #ffffff; }
          .student-profile-panel h2 { font-size: 1.5em; color: #2c3e50; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .profile-content .placeholder { text-align: center; font-size: 1.1em; color: #7f8c8d; margin-top: 50px; }
          .profile-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
          .profile-item { background-color: #fdfdfe; border: 1px solid #e1e8f0; border-radius: 6px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .profile-item strong { display: block; font-weight: 500; color: #34495e; margin-bottom: 5px; font-size: 0.9em; }
          .profile-item span { font-size: 1em; color: #566573; }
          .profile-photo-container { grid-column: 1 / -1; text-align: center; margin-bottom: 15px; }
          .profile-photo { max-width: 150px; max-height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid #3498db; box-shadow: 0 2px 8px rgba(0,0,0,0.15); margin: 0 auto; }
          .profile-photo-placeholder { width: 120px; height: 120px; border-radius: 50%; background-color: #e0e0e0; display: flex; align-items: center; justify-content: center; text-align: center; color: #757575; font-size: 0.9em; margin: 0 auto; border: 3px solid #bdc3c7; }
          
          .app-footer { text-align: center; padding: 15px; font-size: 0.9em; color: #7f8c8d; background-color: #ecf0f1; border-top: 1px solid #d1d9e6; margin-top: auto; }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .main-container { flex-direction: column; height: auto; margin: 10px; width: auto;}
            .student-list-panel { width: 100%; max-height: 250px; border-right: none; border-bottom: 1px solid #d1d9e6;}
            .student-profile-panel { padding: 15px; }
          }
        </style>
      </head>
      <body>
        <header class="app-header">
          <h1>${escapeHtml(title)}</h1>
        </header>
        <div class="main-container">
          <div class="student-list-panel">
            <h2>Students</h2>
            <ul id="studentListUL"></ul>
          </div>
          <div class="student-profile-panel">
            <div id="profileContent">
              <p class="placeholder">Select a student from the list to view details.</p>
            </div>
          </div>
        </div>
        <footer class="app-footer">
          Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </footer>

        <script id="studentDataStore" type="application/json">${studentDataJson}</script>
        <script>
          const allStudents = JSON.parse(document.getElementById('studentDataStore').textContent);
          const studentListUL = document.getElementById('studentListUL');
          const profileContentDiv = document.getElementById('profileContent');
          let currentActiveListItem = null;

          function displayStudentProfile(studentId) {
            const student = allStudents.find(s => s.id === studentId);
            if (!student) {
              profileContentDiv.innerHTML = '<p class="placeholder">Student data not found.</p>';
              return;
            }

            profileContentDiv.innerHTML = '<h2>' + escapeHtmlJS(student.Name) + ' - Profile</h2>';
            
            let detailsHtml = '<div class="profile-details">';
            if (student.PhotoURL && (student.PhotoURL.startsWith('http') || student.PhotoURL.startsWith('data:image'))) {
              detailsHtml += \`<div class="profile-photo-container"><img src="\${escapeHtmlJS(student.PhotoURL)}" alt="\${escapeHtmlJS(student.Name)}'s Photo" class="profile-photo"></div>\`;
            } else {
              detailsHtml += '<div class="profile-photo-container"><div class="profile-photo-placeholder">No Photo</div></div>';
            }

            const fieldsToShow = [
                {label: 'Roll Number', key: 'RollNumber'}, {label: 'Full Name', key: 'Name'}, {label: 'Mobile', key: 'Mobile'},
                {label: 'Email', key: 'Gmail'}, {label: 'Father\\'s Name', key: 'FatherName'}, {label: 'Mother\\'s Name', key: 'MotherName'},
                {label: 'Class', key: 'Class'}, {label: 'Address', key: 'Address'}, {label: 'Aadhar Number', key: 'Aadhar'},
                {label: 'Gender', key: 'Gender'}, {label: 'Registration Date', key: 'RegistrationDate'}, {label: 'Password', key: 'Password'}
            ];

            fieldsToShow.forEach(field => {
                if (student[field.key]) {
                    detailsHtml += \`<div class="profile-item"><strong>\${escapeHtmlJS(field.label)}:</strong><span>\${escapeHtmlJS(student[field.key])}</span></div>\`;
                }
            });
            detailsHtml += '</div>'; // end profile-details
            profileContentDiv.innerHTML += detailsHtml;
          }

          function escapeHtmlJS(unsafe) {
            if (unsafe === null || typeof unsafe === 'undefined') return '';
            return String(unsafe).replace(/[&<>"']/g, function (match) {
              return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
            });
          }

          allStudents.forEach(student => {
            const listItem = document.createElement('li');
            listItem.dataset.studentId = student.id;
            listItem.innerHTML = \`\${escapeHtmlJS(student.Name)} <span class="roll-number">Roll: \${escapeHtmlJS(student.RollNumber)}</span>\`;
            listItem.addEventListener('click', () => {
              if (currentActiveListItem) {
                currentActiveListItem.classList.remove('active');
              }
              listItem.classList.add('active');
              currentActiveListItem = listItem;
              displayStudentProfile(student.id);
            });
            studentListUL.appendChild(listItem);
          });

          // Optionally, display the first student's profile by default
          if (allStudents.length > 0) {
            const firstListItem = studentListUL.querySelector('li');
            if (firstListItem) {
                firstListItem.click(); // Simulate click to load profile and set active state
            }
          }
        </script>
      </body>
      </html>
    `;
  };
  
  const downloadHtml = () => {
    if (disabled || !data) return;
    const htmlContent = generateEnhancedHtmlContent(data, filenamePrefix.replace(/_/g, ' '));
    downloadFile(htmlContent, `${filenamePrefix}_report.html`, "text/html;charset=utf-8");
  };


  const options = [
    { label: "JSON", icon: <CodeBracketIcon className="w-5 h-5 mr-3 text-sky-400"/>, action: downloadJson, format:".json" },
    { label: "XLSX", icon: <TableCellsIcon className="w-5 h-5 mr-3 text-green-400"/>, action: downloadXlsx, format:".xlsx" },
    { label: "HTML Report", icon: <UserGroupIcon className="w-5 h-5 mr-3 text-orange-400"/>, action: downloadHtml, format:".html" },
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
