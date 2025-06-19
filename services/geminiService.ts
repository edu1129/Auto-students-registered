
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { StudentData } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set. Please ensure it is available.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); 

const getDefaultPrompt = (baseStudentCount: number = 0): string => {
  const currentDate = new Date().toISOString().split('T')[0];
  // Ensure placeholders are unique even across multiple AI calls if needed in future
  // For now, baseStudentCount helps make placeholders in a single call unique.
  // The AI should derive its own unique sequence if it generates multiple students.

  return `
Analyze the provided image, which could be a student register, a single student's form, or a list.
Identify each student and extract the following information. If a piece of information is missing or unclear from the image, YOU MUST GENERATE HIGHLY REALISTIC DATA for that field. The generated data should look authentic and not like obvious placeholders (e.g., avoid "Example Street", "Placeholder Name").

Mandatory fields for each student object:
- RollNumber: (string) CRITICAL: This MUST be a simple numerical string (e.g., "1", "25", "101").
    - If the image shows "Roll No: 5, Class: 10A", extract ONLY "5".
    - If the image shows "S.No: 3", use "3".
    - If the image contains "ID: 123", use "123".
    - This field MUST NOT contain any class, section, prefixes like "Roll No:", or other descriptive text. It must be ONLY numerals.
    - If no clear numerical roll number is found or it's unclear, generate a unique, simple, sequential numerical placeholder starting from "001" (e.g., "001", "002", "003", etc., for multiple students if you generate them). For instance, if processing three students where roll numbers are missing, assign "001", "002", "003" respectively.
- Name: (string) Full name. If missing, generate a common, realistic full name (e.g., "Riya Sharma", "Arjun Patel").
- Mobile: (string) 10-digit mobile number. If missing, generate a realistic Indian mobile number (e.g., "9876543210", "7012345678").
- Gmail: (string) Email address. If missing, generate based on the Name and RollNumber (e.g., "riya.sharma.023@example.com").
- Password: (string) Generate a realistic password combining parts of their name, roll, and year (e.g., "${currentDate.substring(0,4)}[LASTNAMELOWER][ROLLNUMBER]"). Make it look like a user might set it.
- FatherName: (string) Full name. If missing, generate a common, realistic full name for a father (e.g., "Mr. Suresh Kumar Sharma", "Anil K. Mehta").
- MotherName: (string) Full name. If missing, generate a common, realistic full name for a mother (e.g., "Mrs. Lakshmi Devi Patel", "Priya S. Singh").
- Class: (string) Class and section (e.g., "10th A", "XII Commerce", "B.Tech CSE 1st Year"). If missing, generate a common class name.
- Address: (string) Full address. If missing, generate a realistic-sounding address (e.g., "12B, Park View Apartments, MG Road, Bangalore, 560001").
- PhotoURL: (string) URL of a photo. If missing or not an image URL, generate using "https://picsum.photos/seed/[NUMERIC_ROLLNUMBER]/120/120" (replace [NUMERIC_ROLLNUMBER] with the student's actual or generated simple numeric RollNumber like "001", "25", etc.).
- Aadhar: (string) 12-digit Aadhar number. If missing, generate a realistic-looking 12-digit number (e.g., "234567890123").
- Gender: (string) Options: "Male", "Female", "Other", "Not Specified". Infer if possible. If missing or unclear, generate one, or use "Not Specified".
- RegistrationDate: (string, format YYYY-MM-DD) If missing, use a plausible recent date like "${currentDate}" or a date from the previous year.

Return the data as a JSON array of objects. Each object MUST represent a student and have keys EXACTLY matching the field names above.
Ensure all fields are present and populated for every student, using generated realistic data where necessary.
The response MUST be ONLY the JSON array, without any other text, comments, or markdown.

Example of a single student object with some generated fields:
{
  "RollNumber": "001",
  "Name": "Aisha Khan",
  "Mobile": "9821012345",
  "Gmail": "aisha.khan.001@example.com",
  "Password": "${currentDate.substring(0,4)}khan001",
  "FatherName": "Mr. Sameer S. Khan",
  "MotherName": "Mrs. Fatima R. Khan",
  "Class": "11th Science",
  "Address": "Flat 5C, Diamond Apartments, Turner Road, Mumbai, 400050",
  "PhotoURL": "https://picsum.photos/seed/001/120/120",
  "Aadhar": "345678901234",
  "Gender": "Female",
  "RegistrationDate": "${currentDate}"
}
If the image contains no discernible student data, return an empty JSON array [].
`;
};

export const extractStudentDataFromImage = async (imageBase64: string, customPrompt?: string): Promise<StudentData[]> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }

  const imagePart: Part = {
    inlineData: {
      mimeType: 'image/jpeg', 
      data: imageBase64,
    },
  };

  const textPart: Part = {
    text: customPrompt && customPrompt.trim() !== '' ? customPrompt : getDefaultPrompt(),
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        temperature: 0.5, // Slightly higher for more creative "realistic" data
      },
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr);

    if (Array.isArray(parsedData)) {
      const currentDate = new Date().toISOString().split('T')[0];
      return parsedData.map((item: any, index: number) => {
        let rollNumberInput = item.RollNumber;
        let rollNumber: string;

        // AI is now expected to return a clean numeric string or a simple numeric placeholder like "001"
        if (typeof rollNumberInput === 'string' && rollNumberInput.trim() !== '') {
            rollNumber = rollNumberInput.trim().replace(/^0+/, '') || '0'; // Remove leading zeros for consistency unless it's just "0"
            if (!/^\d+$/.test(rollNumber)) { // If after trim it's still not purely numeric
                 console.warn(`AI returned non-numeric RollNumber: "${rollNumberInput}". Using fallback placeholder.`);
                 rollNumber = String(index + 1).padStart(3, '0'); // Fallback placeholder
            }
        } else if (typeof rollNumberInput === 'number') {
            rollNumber = String(rollNumberInput);
        } else {
             console.warn(`AI returned invalid RollNumber type: "${rollNumberInput}". Using fallback placeholder.`);
             rollNumber = String(index + 1).padStart(3, '0'); // Fallback placeholder for missing/invalid type
        }
        
        // Ensure rollNumber is at least "1" if it became "0" from "000" etc. unless it was explicitly "0"
        if (rollNumber === "0" && rollNumberInput !== "0") rollNumber = String(index + 1).padStart(3, '0');


        const photoSeed = encodeURIComponent(rollNumber || `student_${String(index + 1).padStart(3, '0')}`);
        const studentName = item.Name || `Student ${rollNumber}`;
        const lastNameForPassword = studentName.split(' ').pop()?.toLowerCase().replace(/[^a-z]/g, '') || 'stud';


        return {
          RollNumber: rollNumber,
          Name: studentName,
          Mobile: item.Mobile || `9${String(Math.floor(Math.random() * 1000000000)).padStart(9,'0')}`,
          Gmail: item.Gmail || `${studentName.toLowerCase().replace(/[^a-z0-9]/gi, '.').substring(0,15)}.${rollNumber}@example.com`,
          Password: item.Password || `${currentDate.substring(0,4)}${lastNameForPassword}${rollNumber}`,
          FatherName: item.FatherName || `Mr. ${studentName.split(' ')[0]}'s Father`, // Generic but slightly more real
          MotherName: item.MotherName || `Mrs. ${studentName.split(' ')[0]}'s Mother`,
          Class: item.Class || `Standard ${ String(Math.floor(Math.random() * 5) + 8)}th ${['A','B','C'][Math.floor(Math.random()*3)] }`, // e.g. 8th to 12th
          Address: item.Address || `${rollNumber} Real Street, Plausible City, 12345${index}`,
          PhotoURL: item.PhotoURL || `https://picsum.photos/seed/${photoSeed}/120/120`,
          Aadhar: item.Aadhar || `${String(Math.floor(Math.random() * 1000000000000)).padStart(12,'0')}`,
          Gender: item.Gender || ["Male", "Female", "Not Specified"][Math.floor(Math.random()*3)],
          RegistrationDate: item.RegistrationDate || currentDate,
        };
      });
    } else {
      console.error("Parsed data is not an array:", parsedData);
      throw new Error("AI did not return a valid list of students. The response was not an array.");
    }

  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    if (error instanceof Error) {
        if (error.message.includes("quota") || error.message.includes("API key")) {
             throw new Error(`API Error: ${error.message}. Please check your API key and quota.`);
        }
        throw new Error(`Failed to process image with AI: ${error.message}`);
    }
    throw new Error("An unknown error occurred while processing the image with AI.");
  }
};
