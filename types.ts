
export interface StudentData {
  RollNumber: string;
  Name: string;
  Mobile: string;
  Gmail: string;
  Password?: string; // Optional as it will be generated
  FatherName: string;
  MotherName: string;
  Class: string;
  Address: string;
  PhotoURL: string;
  Aadhar: string;
  Gender: string;
  RegistrationDate: string;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  retrievedContext?: {
    uri: string;
    title: string;
  };
}
