'use server';
 
import { redirect } from 'next/navigation';
import { auth, signIn } from '../../../auth';
import { AuthError } from 'next-auth';
import { Record, RecordState, User, UserState } from './definitions';
import { z } from 'zod';
import pool from './db';
import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises'

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

    if (res.error) {
    }
      redirect("/dashboard")
   

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

export async function fetchUsers(user:string){
  try {
    const res = await pool.query<User>(`
      SELECT * FROM "User"
      WHERE role = $1
      `,[user])
      const users = res.rows
      if (users.length > 0){
        return users
      }
    
  } catch (error) {
    console.error("Something went wrong fetching supervisors",error)
    
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
    role: formData.get('role'),
   
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
            revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`)

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
            response: null,
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

  let userPassword = '';
  if (password === ''){
    userPassword = email
  } else { 
    userPassword = password;
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPass = bcrypt.hashSync(userPassword, salt); 
  
  let imagePath='';

  try {
    const res = await pool.query<User>(`
      SELECT * FROM "User" 
      WHERE id='${id}'
      `);

      if (res.rows[0].image) {
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

  const session = await auth();

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
        `,[name,email,hashedPass, role, imagePath, id]);     
  
    
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
    redirect(`/dashboard/${session?.user.role}/profile`)
  }
  
  revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);
  redirect(`/dashboard/${session?.user.role}/${role}s/create`)
} 

export async function getUser(email: string): Promise<User | undefined> {
  try {
    const res = await pool.query<User>(`
      SELECT * FROM "User" 
      WHERE email='${email}'
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
  service: z.string(),
  subService: z.string(),
  value: z.coerce.number(),
  invoice: z.string(),
  counter: z.string(),
  shift: z.string(),
  userId: z.string(),
});

export async function createRecord( prevState: RecordState, formData: FormData ) {
   
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

    const id = crypto.randomUUID();
    const session = await auth();

    try {
        await pool.query(`
            INSERT INTO "Record" (id, name, "ticket", value, shift, service, invoice, counter, "userId", "subService")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,[id, name, ticketNumber, value, shift, service,invoice, counter, userId, subService]); 

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
        r.name,
        r.service,
        r."subService",
        r.invoice,
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
        u."createdAt" AS "userCreatedAt"
      FROM "Record" r
      JOIN "User" u ON r."userId" = u.id
      WHERE r."userId" = $1
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
        r.name,
        r.service,
        r."subService",
        r.invoice,
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
        SUM(r.value) OVER() AS "totalValue"
      FROM "Record" r
      JOIN "User" u ON r."userId" = u.id
      `);
      
      const records = res.rows;

      if (records.length > 0) {
          return records;
      }
    
  } catch (error) {
    console.error("Something went wrong fetching records", error);
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
      console.log("the fucking res",res.rows);
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
      console.log("the fucking res by att",res.rows);
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





export async function fetchRevenue(){}
export async function fetchLatestInvoices(){}
export async function fetchCardData(){
  const numberOfInvoices = 78;
  const  numberOfCustomers = 4;
  const totalPaidInvoices = 8;
  const totalPendingInvoices = 9;

  return {numberOfInvoices, numberOfCustomers, totalPaidInvoices, totalPendingInvoices};
}

