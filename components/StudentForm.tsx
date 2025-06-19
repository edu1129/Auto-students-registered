
import React, { useState, ChangeEvent, useEffect } from 'react';
import { StudentData } from '../types';

interface StudentFormProps {
  studentData: StudentData;
  index: number;
  onUpdateStudent: (index: number, updatedData: StudentData) => void;
  isInitiallyOpen?: boolean;
}

const InputField: React.FC<{
  label: string;
  id: keyof StudentData;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}> = ({ label, id, value, onChange, type = "text", required = false, placeholder, disabled = false }) => (
  <div className="col-span-1">
    <label htmlFor={id} className="block text-sm font-medium text-sky-200 mb-1.5">
      {label}
      {required && <span className="text-red-400 font-semibold ml-1">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      disabled={disabled}
      className={`mt-1 block w-full px-4 py-2.5 bg-slate-700/80 border border-slate-600 rounded-lg shadow-sm placeholder-slate-400 
                 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 
                 sm:text-sm text-gray-100 transition-all duration-150 ease-in-out
                 ${disabled ? 'opacity-70 cursor-not-allowed bg-slate-600/50' : 'hover:border-slate-500'}`}
    />
  </div>
);


const StudentForm: React.FC<StudentFormProps> = ({ studentData, index, onUpdateStudent, isInitiallyOpen = false }) => {
  const [formData, setFormData] = useState<StudentData>(studentData);
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);

  useEffect(() => {
    setFormData(studentData);
  }, [studentData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);
    onUpdateStudent(index, updatedFormData);
  };
  
  const toggleOpen = () => setIsOpen(!isOpen);

  // RollNumber should be non-editable if it's a core identifier populated by AI/system
  const isRollNumberDisabled = !!studentData.RollNumber; // Disable if RollNumber has an initial value

  return (
    <div className="bg-slate-800 shadow-xl rounded-lg mb-6 transition-all duration-300 ease-in-out border border-slate-700 hover:border-slate-600/70">
      <button 
        onClick={toggleOpen}
        className="w-full text-left p-4 bg-slate-700/70 hover:bg-slate-700/90 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-inset transition-colors duration-150"
        aria-expanded={isOpen}
        aria-controls={`student-form-content-${index}`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
             {formData.PhotoURL && (formData.PhotoURL.startsWith('http') || formData.PhotoURL.startsWith('data:image')) && (
                <img src={formData.PhotoURL} alt={formData.Name} className="w-10 h-10 rounded-full object-cover border-2 border-slate-500"/>
             )}
            <div>
                 <h3 className="text-lg font-semibold text-sky-300">
                    {formData.Name || `Student Record ${index + 1}`}
                </h3>
                <p className="text-xs text-slate-400">
                    Roll No: <span className="font-medium text-sky-400">{formData.RollNumber || 'N/A'}</span>
                </p>
            </div>
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2.5} 
            stroke="currentColor" 
            className={`w-6 h-6 text-sky-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="border-t border-slate-700">
          <form className="p-5 sm:p-6 space-y-6 bg-slate-800 rounded-b-lg" id={`student-form-content-${index}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <InputField label="Roll Number" id="RollNumber" value={formData.RollNumber} onChange={handleChange} required disabled={isRollNumberDisabled} placeholder="Unique Student ID"/>
              <InputField label="Full Name" id="Name" value={formData.Name} onChange={handleChange} required placeholder="e.g., Priya Sharma"/>
              <InputField label="Mobile Number" id="Mobile" value={formData.Mobile} onChange={handleChange} type="tel" placeholder="e.g., 9876543210"/>
              <InputField label="Gmail / Email" id="Gmail" value={formData.Gmail} onChange={handleChange} type="email" placeholder="e.g., student@example.com"/>
              <InputField label="Generated Password" id="Password" value={formData.Password || ''} onChange={handleChange} type="text" placeholder="Auto-generated or custom"/>
              <InputField label="Father's Name" id="FatherName" value={formData.FatherName} onChange={handleChange} placeholder="e.g., Mr. Suresh Sharma"/>
              <InputField label="Mother's Name" id="MotherName" value={formData.MotherName} onChange={handleChange} placeholder="e.g., Mrs. Anita Sharma"/>
              <InputField label="Class / Course" id="Class" value={formData.Class} onChange={handleChange} placeholder="e.g., 10th A, B.Sc Physics"/>
              <InputField label="Full Address" id="Address" value={formData.Address} onChange={handleChange} placeholder="e.g., 123 Park Avenue, New Delhi"/>
              <InputField label="Aadhar Number" id="Aadhar" value={formData.Aadhar} onChange={handleChange} placeholder="12-digit number (e.g., 1234 5678 9012)"/>
              
              <div className="col-span-1">
                <label htmlFor="Gender" className="block text-sm font-medium text-sky-200 mb-1.5">Gender</label>
                <select
                  id="Gender"
                  name="Gender"
                  value={formData.Gender}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2.5 bg-slate-700/80 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100 transition-colors hover:border-slate-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Not Specified">Not Specified</option>
                </select>
              </div>
              <InputField label="Registration Date" id="RegistrationDate" value={formData.RegistrationDate} onChange={handleChange} type="date" />
             <InputField label="Photo URL" id="PhotoURL" value={formData.PhotoURL} onChange={handleChange} type="url" placeholder="https://example.com/photo.jpg"/>
            </div>
            
            {formData.PhotoURL && (formData.PhotoURL.startsWith('http://') || formData.PhotoURL.startsWith('https://') || formData.PhotoURL.startsWith('data:image')) && (
              <div className="mt-5 pt-5 border-t border-slate-700 col-span-1 md:col-span-2 lg:col-span-3">
                <p className="block text-sm font-medium text-sky-200 mb-2">Photo Preview:</p>
                <img 
                    src={formData.PhotoURL} 
                    alt={`${formData.Name}'s photo`} 
                    className="w-28 h-28 object-cover rounded-lg border-2 border-slate-600 shadow-lg" 
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; /* Hide if image fails to load */ }}
                />
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default StudentForm;
