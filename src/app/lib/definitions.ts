export type User = {
    email: string;
    name: string;
    id: string;
    password: string;
    role: string;
    image: string;
};

export type Record = {
    id:string
    name: string;
    ticket: string;
    value: string;
    invoice: string;
    recordId: string;
    service: string;
    shift: string;
    recordCreatedAt: Date;
    createdAt: Date;
    userId: string;
    userName: string;
    userEmail: string;
    counter: string;
    totalValue: number;

};

export type RecordState = {
    errors?: {
        name?: string[];
        ticketNumber?: string[];
        value?: string[];
        invoice?: string[];
        service?: string[];
        shift?: string[];
        date?: string[];
        userId?: string[];
        
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
        
    };
    state_error?: string | null;
    message?: string | null;
    response?: string | null;
};

