export type User = {
  email: string;
  name: string;
  id: string;
  password: string;
  role: string;
  image: string;
  counter: number;
  shift: string;
  status: string;
  shiftStartDate: Date;
  shiftEndDate: Date;
  station: string;
};

export type OnlineUser = {
  userId: string;
};

export type Record = {
  id: string;
  name: string;
  ticket: string;
  recordType: string;
  value: number;
  recordNumber: string;
  recordId: string;
  service: string;
  subService: string;
  shift: string;
  recordCreatedAt: Date;
  createdAt: Date;
  userId: string;
  userName: string;
  userEmail: string;
  userStation: string;
  counter: string;
  invoiceTotal: number;
  receiptTotal: number;
  totalValue: number;
};

export type GroupedRecord = {
  date: string;
  week: string;
  month: string;
  service: string;
  totalValue: number;
  count: number;
  userStation: string;
};

export type EditedRecord = {
  id: string;
  name: string;
  ticket: string;
  recordType: string;
  value: number;
  recordNumber: string;
  recordId: string;
  service: string;
  subService: string;
  shift: string;
  editedRecordCreatedAt: Date;
  editedRecordUpdatedAt: Date;
  attendantId: string;
  supervisorId: string;
  supervisorName: string;
  userName: string;
  userImage: string;
  userEmail: string;
  userStation: string;
  counter: string;
  attendantComment: string;
  supervisorComment: string;
  status: string;
};

export type RecordState = {
  errors?: {
    name?: string[];
    ticketNumber?: string[];
    recordType?: string[];
    value?: string[];
    service?: string[];
    subService?: string[];
    recordNumber?: string[];
    shift?: string[];
    counter?: string[];
    userId?: string[];
  };
  state_error?: string | null;
  message?: string | null;
  response?: string | null;
};

export type EditRecordState = {
  errors?: {
    name?: string[];
    ticketNumber?: string[];
    value?: string[];
    service?: string[];
    subService?: string[];
    shift?: string[];
    userId?: string[];
    recordType?: string[];
    recordNumber?: string[];
    counter?: string[];
    recordId?: string[];
    attendantComment?: string[];
  };
  state_error?: string | null;
  message?: string | null;
  response?: string | null;
};

export type RequestEditRecordState = {
  errors?: {
    supervisorId?: string[];
    supervisorComment?: string[];
    status?: string[];
  };
  state_error?: string | null;
  message?: string | null;
  response?: string | null;
};

export type UserState = {
  errors?: {
    email?: string[];
    password?: string[];
    name?: string[];
    status?: string[];
    role?: string[];
    shift?: string[];
    counter?: string[];
    startDate?: string[];
    endDate?: string[];
  };
  state_error?: string | null;
  message?: string | null;
  success?: boolean | null;
};

export type ShiftAndCounterState = {
  errors?: {
    role?: string[];
    shift?: string[];
    counter?: string[];
  };
  state_error?: string | null;
  message?: string | null;
  response?: string | null;
};

export type ArchiveUserState = {
  errors?: {
    status?: string[];
    role?: string[];
  };
  state_error?: string | null;
  message?: string | null;
  success?: boolean | null;
  response?: string | null;
};

export type EditUserState = {
  errors?: {
    email?: string[];
    password?: string[];
    name?: string[];
    role?: string[];
    station?: string[];
    image?: string[];
    resetPass?: string[];
  };
  state_error?: string | null;
  message?: string | null;
  success?: boolean | null;
};

export type CreateUserState = {
  errors?: {
    email?: string[];
    password?: string[];
    name?: string[];
    role?: string[];
    station?: string[];
  };
  state_error?: string | null;
  message?: string | null;
};

export type Fields = {
  id: string;
  fieldName: string;
  value: string;
  editedValue: string;
};
