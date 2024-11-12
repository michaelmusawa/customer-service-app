'use server';
 
import { redirect } from 'next/navigation';
import { auth, signIn, signOut } from '../../../auth';
import { AuthError } from 'next-auth';
import { EditedRecord, OnlineUser, Record, RecordState, User, UserState } from './definitions';
import {  z } from 'zod';
import pool from './db';
import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises'
import cron from 'node-cron'

cron.schedule('0 * * * *', async () => {
  try {
    await pool.query('DELETE FROM "ShiftNotification" WHERE "expires" <= NOW()');
    await pool.query('DELETE FROM "Session" WHERE "expires" <= NOW()');
    console.log('Expired records deleted');
  } catch (err) {
    console.error('Error deleting expired records:', err);
  }
});

export async function authenticate(
  _currentState: unknown,
  formData: FormData,
) {
   try {
  
     const res = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
    })

    if (!res.error) {
      redirect("/dashboard")
    }


  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return "Invalid credentials.";
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function signUserOut (){
  const session = await auth();
  const userId = session?.user.id;

  if (userId) {
    try {
      await pool.query(`
        DELETE FROM "Session"
        WHERE "userId" = $1
        `,[userId]);

    await signOut();

    }catch (e) {
      console.error("Something went wrong deleting record!", 
        e);
    }
  
  }

  redirect('/login');
}

export async function fetchUsers(user:string){
  try {
    const res = await pool.query<User>(`
      SELECT * FROM "User"
      WHERE role = $1
      ORDER BY "createdAt" DESC
      `,[user]);

      const users = res.rows
      if (users.length > 0){
        return users
      }
    
  } catch (error) {
    console.error("Something went wrong fetching supervisors",error)
    
  }
}

export async function fetchOnlineUsers(){
  try {
    const res = await pool.query<OnlineUser>(`
      SELECT * FROM "Session"
      `,)
      const users = res.rows
      if (users.length > 0){
        return users
      } else [];
    
  } catch (error) {
    console.error("Something went wrong fetching online users",error)
    
  }
}


const FormSchema = z.object({
  name: z.string(),
  email: z.string({
      invalid_type_error: 'Please enter a valid email'
  }),
  password: z.string(),
  role: z.string(),
  image: z.any().optional()
});

export async function createUser( prevState: UserState, formData: FormData ) {
  
  const validatedFields = FormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),  
    role: formData.get('role')
  });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create user.'
      
        };     
    }

    const { name, email,password, role } = validatedFields.data;
    let userPassword = '';
    if (password === ''){
      userPassword = email
    } else { 
      userPassword = password;
    }
    const salt = bcrypt.genSaltSync(10);
    const pass = userPassword;
    const hashedPass = bcrypt.hashSync(pass, salt);
    const id = crypto.randomUUID();
    const session = await auth();
  

    try {
        await pool.query(`
            INSERT INTO "User" (id, name, email, password, role)
            VALUES ($1, $2, $3, $4, $5)
            `,[id, name, email, hashedPass, role]);

            revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);

          return (
            { 
              message: `Added ${role} successfully`,
              response:'ok'
            }
          );  

    } catch (error) {
      console.error(error);
        return (
           { 
            state_error: `Something went wrong! Failed to create ${role}.`,
            response: '!ok'
          }
          );      
    }
    
};


export async function editUser( id: string, prevState: UserState, formData: FormData) {

  const validatedFields = FormSchema.safeParse({
    name:formData.get('name'),
    email:formData.get('email'),
    password:formData.get('password'),
    role: formData.get('role'),
     image: formData.get('image')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Edit user.',
    };
  }

  const { name, email, password, role, image } = validatedFields.data;

 
  let hashedPass;
  
  let imagePath=null;
  const session = await auth();

  function generateHash (userPassword:string){

    const salt = bcrypt.genSaltSync(10);
    hashedPass = bcrypt.hashSync(userPassword, salt);

    return hashedPass
  }
  
  


  try {
    const res = await pool.query<User>(`
      SELECT * FROM "User" 
      WHERE id = $1
      `,[id]);

      // Logic for password

      if (res.rows[0].id === session?.user.id) {
        if (password === '' && res.rows[0].password){
          hashedPass = res.rows[0].password;
        } else  
          hashedPass = generateHash(password);
      } else if (password === ''){
        hashedPass = generateHash(email)
      } else { 
        console.log("The password", password) 
        hashedPass = generateHash(password);
      } 
    

      // Logic for user image

      if (res.rows[0].image && image.size > 0) {
        imagePath = res.rows[0].image;
        // Delete the existing image file if it exists
        await fs.unlink(`public${imagePath}`).catch(err => {
          if (err.code !== 'ENOENT') {
            // Ignore file not found error but log other errors
            console.error('Error deleting image:', err);
            throw new Error('Failed to delete existing image.');
          }
        });
      }
    
      // If a new image is uploaded (size > 0)
      if (image && image.size > 0) {
        await fs.mkdir("public/profile", { recursive: true });
        imagePath = `/profile/${crypto.randomUUID()}-${image.name}`;
        await fs.writeFile(`public${imagePath}`, Buffer.from(await image.arrayBuffer())as Uint8Array);
      } else if (res.rows[0].image) {
        // If no new image is uploaded, keep the existing image
        imagePath = res.rows[0].image;
      }
    
  } catch (error) {
     console.error('Failed to fetch user:', error);
     throw new Error('Failed to fetch user.');
  }


  try {
    await pool.query(`
      UPDATE "User"
      SET
        name = $1,
        email = $2,
        password = $3,
        role = $4,
        image = $5
        WHERE id = $6
        `,[name, email, hashedPass, role, imagePath, id]);     
  
    
  } catch (error) {
    console.error("Something went wrong updating supervisor",error);
    return(
      {
      state_error: `Error updating ${role}`,
      response: '!ok'
    }
  );
    
  };

  if (session?.user.role === role){
    revalidatePath(`/dashboard/${session?.user.role}/profile`);
    redirect(`/dashboard/${session?.user.role}/profile?success=true`)
  }
  
  revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);
  redirect(`/dashboard/${session?.user.role}/${role}s/create?success=true`)
} 

const ArchiveUserSchema = z.object ({
  status: z.string(),
  role: z.string()
})

export async function archiveUser( id: string, prevState: UserState, formData: FormData) {

  const validatedFields = ArchiveUserSchema.safeParse({
    status:formData.get('status'),
    role:formData.get('role')
  });
  

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to archive user.',
    };
  }

  const { status, role } = validatedFields.data;
  const session = await auth();

  let userStatus;

  if (status === 'activate'){
    userStatus = null
  } else if (status === 'archive'){
    userStatus = status
  }


  try {
    await pool.query(`
      UPDATE "User"
      SET
        status = $1
        WHERE id = $2
        `,[userStatus, id]);  
         
  } catch (error) {
    console.error("Something went wrong achieving user",error);
    return({
      state_error: 'Error archiving user',
      response: '!ok'
    });
    
  };
  
  redirect(`/dashboard/${session?.user.role}/${role}s/create?archived=true`);
} 

const ShiftAndCounterUserSchema = z.object ({
  counter: z.coerce.number(),
  shift: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  role: z.string(),
})

export async function assignShiftAndCounter( id: string, prevState: UserState, formData: FormData) {

  const validatedFields = ShiftAndCounterUserSchema.safeParse({
    counter:formData.get('counter'),
    shift:formData.get('shift'),
    startDate:formData.get('startDate'),
    endDate:formData.get('endDate'),
    role: formData.get('role'),
  });

  

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to archive user.',
    };
  }

  const { counter,shift,startDate, endDate, role} = validatedFields.data;

  const shiftStartDate = new Date(startDate);
  const shiftEndDate = new Date(endDate);

  const session = await auth();


  try {
    await pool.query(`
      UPDATE "User"
      SET
        counter = $1,
        shift = $2,
        "shiftStartDate" = $3,
        "shiftEndDate" = $4
        WHERE id = $5
        `,[counter, shift, shiftStartDate, shiftEndDate, id]);  

               
        revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);
        return(
          {
          message: 'Shift updated successfully',
          response: 'ok'
          }
          )
 
  } catch (error) {
    console.error("Something went wrong updating user shift",error);
    return(
      {
      state_error: 'Error updating user shift',
      response: '!ok'
    }
  );
    
  };
  
  
} 

const ShiftWarningActionSchema = z.object ({
  attendantId: z.string(),
  dismiss: z.string()
})

export async function shiftWarningAction(prevState: UserState, formData: FormData){
  const validatedFields = ShiftWarningActionSchema.safeParse({
    attendantId:formData.get('attendantId'),
    dismiss:formData.get('dismiss'),
    
  });

  console.log("the shift warning form data",formData)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to archive user.',
    };
  }

  const { attendantId, dismiss } = validatedFields.data;

  const session = await auth();
  const supervisorId = session?.user.id;
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    await pool.query(`
      INSERT INTO "ShiftNotification"
      ("id", "attendantId", "supervisorId", "dismiss", "expires" )
      VALUES ($1, $2, $3, $4, $5)
      `,[id, attendantId, supervisorId, dismiss, expires])
    
  } catch (error) {
    console.error("Something went wrong creating shift action",error);
    return(
      {
      state_error: 'Error creating shift action',
      response: '!ok'
    }
  );
    
  }


}

export async function getUser(email: string): Promise<User | undefined> {
  try {
    const res = await pool.query<User>(`
      SELECT * FROM "User" 
      WHERE email='${email}'
      ORDER BY "createdAt" DESC
      `);
    return res.rows[0];

    
  } catch (error) {
     console.error('Failed to fetch user:', error);
     throw new Error('Failed to fetch user.');
    }
}

export async function getUserById(id: string): Promise<User | undefined> {
  try {
    const res = await pool.query<User>(`
      SELECT * FROM "User" 
      WHERE id='${id}'
      `);
    return res.rows[0];

    
  } catch (error) {
     console.error('Failed to fetch user:', error);
     throw new Error('Failed to fetch user.');
    }
}

export async function deleteUser(id: string){
  try {
    await pool.query(`
      DELETE FROM "User"
      WHERE "id" = $1
      `,[id]);
      revalidatePath('/admin')
  }catch (e) {
    console.error("Something went wrong deleting user!", 
      e);

  }

}

const RecordSchema = z.object({
  name: z.string(),
  ticketNumber: z.string(),
  recordNumber: z.string(),
  recordType: z.string(),
  service: z.string(),
  subService: z.string(),
  value: z.coerce.number(),
  counter: z.string(),
  shift: z.string(),
  userId: z.string(),
  recordId: z.string().optional(),
  attendantComment: z.string().optional(),
  supervisorComment: z.string().optional(),
});

export async function createRecord( prevState: RecordState, formData: FormData ) {
   
  const validatedFields = RecordSchema.safeParse({
    ticketNumber: formData.get('ticketNumber'),
    recordType: formData.get('recordType'),
    name: formData.get('name'),
    service: formData.get('service'),  
    subService: formData.get('subService'), 
    recordNumber: formData.get('recordNumber'),
    value: formData.get('value'),
    counter: formData.get('counter'),
    shift: formData.get('shift'),
    userId: formData.get('userId')
  });


  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Edit Record.',
    };
  }

  const { name, ticketNumber, recordType, value, recordNumber, counter, shift, service, subService, userId } = validatedFields.data;

    const id = crypto.randomUUID();
    const session = await auth();

    try {
        await pool.query(`
            INSERT INTO "Record" (id, name, "ticket", value, shift, service, "recordNumber", counter, "userId", "subService", "recordType")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `,[id, name, ticketNumber, value, shift, service, recordNumber, counter, userId, subService, recordType]); 

            revalidatePath(`/dashboard/${session?.user.role}/records/create`); 
            return(
              {
                message: 'Record created successfully',
                response: 'ok'
              }
            );

    } catch (e) {
      console.log(e);
        return (
           { state_error: "Something went wrong! Failed to create record." }
          );      
    }  
};

export async function requestEditRecord( prevState: RecordState, formData: FormData ) {
   
  const validatedFields = RecordSchema.safeParse({
    ticketNumber: formData.get('ticketNumber'),
    recordType: formData.get('recordType'),
    name: formData.get('name'),
    service: formData.get('service'),  
    subService: formData.get('subService'), 
    recordNumber: formData.get('recordNumber'),
    value: formData.get('value'),
    counter: formData.get('counter'),
    shift: formData.get('shift'),
    userId: formData.get('userId'),
    recordId: formData.get('recordId'),
    attendantComment: formData.get('attendantComment'),
  });

 

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to validate record values.',
    };
  }

  const { name, ticketNumber, recordType, value, recordNumber, counter, shift, service, subService, userId, recordId, attendantComment } = validatedFields.data;

    const id = crypto.randomUUID();
    const session = await auth();

    try {
        await pool.query(`
            INSERT INTO "EditedRecord" (id, name, "ticket", value, shift, service, "recordNumber", counter, "attendantId", "subService", "recordType", "recordId", status, "attendantComment")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `,[id, name, ticketNumber, value, shift, service, recordNumber, counter, userId, subService, recordType, recordId, 'pending', attendantComment]); 

            revalidatePath(`/dashboard/${session?.user.role}/records/create`); 
            return(
              {
                message: 'Request send successfully',
                response: 'ok'
              }
            );

    } catch (e) {
      console.log(e);
        return (
           { state_error: "Something went wrong! Failed to send request." }
          );      
    }  
};


export async function editRecord(id: string, prevState: RecordState, formData: FormData){
  const validatedFields = RecordSchema.safeParse({
    ticketNumber: formData.get('ticketNumber'),
    name: formData.get('name'),
    service: formData.get('service'),  
    subService: formData.get('subService'), 
    invoice: formData.get('invoice'),
    value: formData.get('value'),
    counter: formData.get('counter'),
    shift: formData.get('shift'),
    userId: formData.get('userId')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Edit Record.',
    };
  }

  const { name, ticketNumber, value, invoice, counter, shift, service, subService, userId } = validatedFields.data;

  const session = await auth();

  try {
    await pool.query(`
      UPDATE "Record"
      SET
        name = $1,
        ticket = $2,
        value = $3,
        shift = $4,
        service = $5,
        invoice = $6,
        counter = $7,
        "userId" = $8,
        "subService" = $9
      WHERE id = $10
        `,[name, ticketNumber, value, shift, service, invoice, counter, userId, subService, id])
  } catch (e) {
    console.log(e);
      return (
          { state_error: "Something went wrong! Failed to update record." ,
            response: null
          }
        );      
  }
  revalidatePath(`/dashboard/${session?.user.role}/records`);
  redirect(`/dashboard/${session?.user.role}/records`);
}

const RequestEditRecordSchema = z.object({
  supervisorId: z.string(),
  status: z.string(),
  supervisorComment: z.string()
});

export async function editRequestEditRecord(id: string, prevState: RecordState, formData: FormData){
  const validatedFields = RequestEditRecordSchema.safeParse({
    supervisorId: formData.get('supervisorId'),
    supervisorComment: formData.get('supervisorComment'),
    status: formData.get('status')
  });

  if (!validatedFields.success) {
    console.log("The validated file",validatedFields.error);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Edit Record.',
    };
  }


  const { supervisorComment, supervisorId, status } = validatedFields.data;
  console.log("The validated file",validatedFields.data);
 
  const session = await auth();

  try {
    await pool.query(`
      UPDATE "EditedRecord"
      SET
        status = $1,
        "supervisorId" = $2,
        "supervisorComment" = $3
      WHERE id = $4
        `,[status, supervisorId, supervisorComment, id ])
  } catch (error) {
    console.error("Something went wrong updating edited record",error);
      return (
          { state_error: "Something went wrong! Failed to update record." ,
            response: null
          }
        );      
  }
  revalidatePath(`/dashboard/${session?.user.role}/notification`);
  redirect(`/dashboard/${session?.user.role}/notification`);
} 

export async function deleteRecord(id: string){
  try {
    await pool.query(`
      DELETE FROM "Record"
      WHERE "id" = $1
      `,[id]);
      revalidatePath('/admin')
  }catch (e) {
    console.error("Something went wrong deleting record!", 
      e);

  }

}

export async function fetchRecordsByAttendant(userId:string){
  try {
    const res = await pool.query<Record>(`
      SELECT 
        r.id AS "recordId",
        r.ticket,
        r."recordType",
        r.name,
        r.service,
        r."subService",
        r."recordNumber",
        r.value,
        r.counter,
        r.shift,
        r."userId",
        r."createdAt" AS "recordCreatedAt",
        r."updatedAt" AS "recordUpdatedAt",
        u.id AS "userId",
        u.name AS "userName",
        u.email AS "userEmail",
        u."createdAt" AS "userCreatedAt",
        SUM(r.value) OVER() AS "totalValue",
        SUM(CASE WHEN r."recordType" = 'invoice' THEN r.value ELSE 0 END) OVER () AS "invoiceTotal",
        SUM(CASE WHEN r."recordType" = 'receipt' THEN r.value ELSE 0 END) OVER () AS "receiptTotal"
        u."createdAt" AS "userCreatedAt"
      FROM "Record" r
      JOIN "User" u ON r."userId" = u.id
      WHERE r."userId" = $1
      ORDER BY "createdAt" DESC
    `, [userId]);
      const records = res.rows
      if (records.length > 0){
        return records
      }
    
  } catch (error) {
    console.error("Something went wrong fetching records",error)
    
  }
}

export async function fetchRecords(){
  try {
    const res = await pool.query<Record>(`
      SELECT 
        r.id AS "recordId",
        r.ticket,
        r."recordType",
        r.name,
        r.service,
        r."subService",
        r."recordNumber",
        r.value,
        r.counter,
        r.shift,
        r."userId",
        r."createdAt" AS "recordCreatedAt",
        r."updatedAt" AS "recordUpdatedAt",
        u.id AS "userId",
        u.name AS "userName",
        u.email AS "userEmail",
        u."createdAt" AS "userCreatedAt",
        SUM(r.value) OVER() AS "totalValue",
        SUM(CASE WHEN r."recordType" = 'invoice' THEN r.value ELSE 0 END) OVER () AS "invoiceTotal",
        SUM(CASE WHEN r."recordType" = 'receipt' THEN r.value ELSE 0 END) OVER () AS "receiptTotal"
      FROM "Record" r
      JOIN "User" u ON r."userId" = u.id
      ORDER BY "createdAt" DESC
      `);
      
      const records = res.rows;

      if (records.length > 0) {
          return records;
      }
    
  } catch (error) {
    console.error("Something went wrong fetching records", error);
  }
}

export async function fetchRequestEditRecords(){
  try {
    const res = await pool.query<EditedRecord>(`
      SELECT 
        r.id AS "id",
        r."recordId" AS "recordId",
        r.ticket,
        r."recordType",
        r.name,
        r.service,
        r."subService",
        r."recordNumber",
        r.value,
        r.counter,
        r.shift,
        r."attendantId",
        r.status,
        r."attendantComment",
        r."createdAt" AS "editedRecordCreatedAt",
        r."updatedAt" AS "editedRecordUpdatedAt",
        u.id AS "userId",
        u.name AS "userName",
        u.email AS "userEmail",
        u.image AS "userImage"
      FROM "EditedRecord" r
      JOIN "User" u ON r."attendantId" = u.id
      `);
      
      const records = res.rows;

      if (records.length > 0) {
          return records;
      }
    
  } catch (error) {
    console.error("Something went wrong fetching requested edit records", error);
  }
}

export async function fetchRequestEditRecordsByUser( id:string ){
  try {
    const res = await pool.query<EditedRecord>(`
      SELECT 
        r.id AS "id",
        r."recordId" AS "recordId",
        r.ticket,
        r."recordType",
        r.name,
        r.service,
        r."subService",
        r."recordNumber",
        r.value,
        r.counter,
        r.shift,
        r."attendantId",
        r.status,
        r."attendantComment",
        r."createdAt" AS "editedRecordCreatedAt",
        r."updatedAt" AS "editedRecordUpdatedAt",
        u.id AS "userId",
        u.name AS "userName",
        u.email AS "userEmail",
        u.image AS "userImage",
        s.id AS "supervisorId",
        s.name AS "supervisorName"
      FROM "EditedRecord" r
      JOIN "User" u ON r."attendantId" = u.id
      LEFT JOIN "User" s ON r."supervisorId" = s.id
      WHERE u.id = $1
      ORDER BY "createdAt" DESC
      `,[id]);
      
      const records = res.rows;

      if (records.length > 0) {
          return records;
      }
    
  } catch (error) {
    console.error("Something went wrong fetching requested edit records", error);
  }
}

export async function fetchDailyRevenue() {
  try {
    const res = await pool.query<Record>(`
      SELECT 
        DATE("createdAt") AS "createdAt",
        SUM(value) AS "totalValue"
      FROM "Record"
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") DESC;
    `);
    return res.rows;
  } catch (error) {
    console.error("Error fetching daily revenue", error);
    throw error;
  }
}

export async function fetchDailyRevenueByAttendant(id:string) {
  try {
    const res = await pool.query<Record>(`
      SELECT 
        DATE("createdAt") AS "createdAt",
        SUM(value) AS "totalValue"
      FROM "Record"
      WHERE "userId" = $1
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") DESC
      
    `,[id]);
    return res.rows;
  } catch (error) {
    console.error("Error fetching daily revenue", error);
    throw error;
  }
}

export async function getRecord(id: string){
  const res = await pool.query<Record>(`
    SELECT * FROM "Record" WHERE id = $1`,[id]);
    const records = res.rows
    if (records.length > 0){
      return records[0];
    }
}

