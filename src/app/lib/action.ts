"use server";

import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "../../../auth";
import { AuthError } from "next-auth";
import {
  ArchiveUserState,
  CreateUserState,
  EditRecordState,
  EditUserState,
  OnlineUser,
  RecordState,
  RequestEditRecordState,
  ShiftAndCounterState,
  User,
} from "./definitions";
import { z } from "zod";
import poolPromise from "./db";
import sql from "mssql";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import cron from "node-cron";
import { LocalRecords } from "../dashboard/(overview)/page";

cron.schedule("0 * * * *", async () => {
  try {
    const pool = await poolPromise; // Await the pool connection

    // Deleting expired Session records
    await pool.request().query(`
      DELETE FROM [Session] WHERE [expires] <= GETDATE()
    `);
  } catch (err) {
    console.error("Error deleting expired records:", err);
  }
});

export async function authenticate(_currentState: unknown, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    const user = await getUser(email);

    if (user?.status === "archive") {
      return "Sorry,your account is inactive.";
    }

    if (!res.error) {
      redirect("/dashboard");
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function signUserOut() {
  const session = await auth(); // Retrieve user session
  const userId = session?.user.id;

  if (userId) {
    try {
      const pool = await poolPromise; // Await the pool connection

      // Delete session from the database
      await pool.request().input("userId", sql.VarChar, userId) // Use parameterized query to prevent SQL injection
        .query(`
          DELETE FROM [Session]
          WHERE [userId] = @userId
        `);

      // Sign the user out
      await signOut();
    } catch (e) {
      console.error("Something went wrong deleting record!", e);
    }
  }

  // Redirect to the login page after signing out
  redirect("/login");
}

export async function fetchUsers(user: string): Promise<User[]> {
  try {
    const pool = await poolPromise; // Ensure the pool is connected
    const result = await pool.request().input("role", sql.VarChar, user) // Sanitize the user input and avoid SQL injection
      .query(`
        SELECT * FROM [User]
        WHERE role = @role
        ORDER BY [name] ASC
      `);

    const users = result.recordset; // The result is stored in `recordset`
    if (users.length > 0) {
      return users;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Something went wrong fetching supervisors", error);
    return [];
  }
}

export async function fetchOnlineUsers(): Promise<OnlineUser[] | undefined> {
  try {
    // Await the pool connection
    const pool = await poolPromise;

    // Execute query to fetch online users from the "Session" table
    const result = await pool.request().query(`
      SELECT * FROM [Session]
    `);

    // Access users from the result's recordset
    const users = result.recordset;

    if (users.length > 0) {
      return users; // Return the list of online users
    } else {
      return []; // Return an empty array if no users found
    }
  } catch (error) {
    console.error("Something went wrong fetching online users", error);
    throw new Error("Failed to fetch online users.");
  }
}

const CreateUserFormSchema = z.object({
  name: z.string(),
  email: z.string({
    invalid_type_error: "Please enter a valid email",
  }),
  password: z.string(),
  role: z.string(),
  station: z.string(),
  shift: z.string().nullable().optional(),
  counter: z.string().nullable().optional(),
});

export async function createUser(
  prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const validatedFields = CreateUserFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    station: formData.get("station"),
    shift: formData.get("shift"),
    counter: formData.get("counter"),
  });

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create user.",
    };
  }

  const { name, email, password, role, station, shift, counter } =
    validatedFields.data;
  const hashedPass = bcrypt.hashSync(password || email, bcrypt.genSaltSync(10));
  const id = crypto.randomUUID();
  const session = await auth();
  const userRole =
    email === "supersupervisor@gmail.com" ? "supersupervisor" : role;

  const checkEmail = await getUser(email);

  if (checkEmail) {
    return {
      state_error: `Email already exist! Failed to create user.`,
    };
  }

  try {
    const pool = await poolPromise; // Await the pool connection

    // Insert user data into the database using parameterized queries
    await pool
      .request()
      .input("id", sql.VarChar, id) // Input parameters
      .input("name", sql.VarChar, name)
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, hashedPass)
      .input("station", sql.VarChar, station)
      .input("shift", sql.VarChar, shift)
      .input("counter", sql.VarChar, counter)
      .input("role", sql.VarChar, userRole).query(`
        INSERT INTO [User] (id, name, email, password, station, shift, counter, role)
        VALUES (@id, @name, @email, @password, @station, @shift, @counter, @role)
      `);
    revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);
    return {
      ...prevState,
      state_error: null,
      message: `Added user successfully.`,
    };
  } catch (error) {
    console.error(error);
    return {
      ...prevState,
      state_error: `Something went wrong! Failed to create ${role}.`,
    };
  }

  // Revalidate the path after successful insertion
}

const FormSchema = z.object({
  name: z.string(),
  email: z.string({
    invalid_type_error: "Please enter a valid email",
  }),
  password: z.string(),
  role: z.string(),
  station: z.string(),
  image: z.any().optional(),
  resetPass: z.string().nullable().optional(),
});

export async function editUser(
  id: string,
  prevState: EditUserState,
  formData: FormData
) {
  const validatedFields = FormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    station: formData.get("station"),
    image: formData.get("image"),
    resetPass: formData.get("resetPass"),
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Edit user.",
    };
  }

  const { name, email, password, role, station, image, resetPass } =
    validatedFields.data;

  let hashedPass;
  let imagePath = null;
  const session = await auth();

  function generateHash(userPassword: string) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(userPassword, salt);
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request().input("id", sql.VarChar, id) // Bind the 'id' parameter
      .query(`
      SELECT * FROM [User] WHERE id = @id
    `);

    // Logic for password

    const existingUser = result.recordset[0];

    if (existingUser.id === session?.user.id) {
      hashedPass = password ? generateHash(password) : existingUser.password;
    } else {
      hashedPass = password ? generateHash(password) : generateHash(email);
    }

    // Logic for user image

    if (existingUser.image && image.size > 0) {
      imagePath = existingUser.image;
      await fs.unlink(`public${imagePath}`).catch((err) => {
        if (err.code !== "ENOENT") {
          throw new Error("Failed to delete existing image.");
        }
      });
    }

    // If a new image is uploaded (size > 0)
    if (image && image.size > 0) {
      await fs.mkdir("public/profile", { recursive: true });
      imagePath = `/profile/${crypto.randomUUID()}-${image.name}`;
      await fs.writeFile(
        `public${imagePath}`,
        Buffer.from(await image.arrayBuffer()) as Uint8Array
      );
    } else if (existingUser.image) {
      imagePath = existingUser.image;
    }

    await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, hashedPass)
      .input("role", sql.VarChar, role)
      .input("station", sql.VarChar, station)
      .input("image", sql.VarChar, imagePath)
      .input("id", sql.VarChar, id).query(`
      UPDATE [User]
      SET
        name = @name,
        email = @email,
        password = @password,
        role = @role,
        station = @station,
        image = @image
      WHERE id = @id
    `);

    revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      ...prevState,
      state_error: "Error updating user.",
      success: false,
    };
  }

  if (session?.user.role === role) {
    if (resetPass === "true") {
      await signOut();
    }

    revalidatePath(`/dashboard/${session?.user.role}/profile`);
  }

  if (session?.user.role === role) {
    redirect(`/dashboard/${session?.user.role}/profile?success=true`);
  }

  redirect(`/dashboard/${session?.user.role}/${role}s/create?success=true`);
}

const ArchiveUserSchema = z.object({
  status: z.string(),
  role: z.string(),
});

export async function archiveUser(
  id: string,
  prevState: ArchiveUserState,
  formData: FormData
) {
  const validatedFields = ArchiveUserSchema.safeParse({
    status: formData.get("status"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to archive user.",
    };
  }

  const { status, role } = validatedFields.data;
  const session = await auth();

  let userStatus;

  if (status === "activate") {
    userStatus = null;
  } else if (status === "archive") {
    userStatus = status;
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.VarChar, id)
      .input("status", sql.VarChar, userStatus)
      .query(
        `
      UPDATE [User]
      SET
        status = @status
        WHERE id = @id
        `
      );
  } catch (error) {
    console.error("Something went wrong", error);
    return {
      ...prevState,
      state_error: "Error in the processing your request",
      response: "!ok",
    };
  }

  redirect(`/dashboard/${session?.user.role}/${role}s/create?${status}=true`);
}

const ShiftAndCounterUserSchema = z.object({
  counter: z.string(),
  shift: z.string(),
  role: z.string(),
});

export async function assignShiftAndCounter(
  id: string,
  prevState: ShiftAndCounterState,
  formData: FormData
) {
  const validatedFields = ShiftAndCounterUserSchema.safeParse({
    counter: formData.get("counter"),
    shift: formData.get("shift"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to archive user.",
    };
  }

  const { counter, shift, role } = validatedFields.data;

  const session = await auth();

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.VarChar, id)
      .input("counter", sql.VarChar, counter)
      .input("shift", sql.VarChar, shift)
      .query(
        `
      UPDATE [User]
      SET
        counter = @counter,
        shift = @shift
        WHERE id = @id
        `
      );

    revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);
    return {
      ...prevState,
      message: "Shift updated successfully",
      response: "ok",
    };
  } catch (error) {
    console.error("Something went wrong updating user shift", error);
    return {
      ...prevState,
      state_error: "Error updating user shift",
      response: "!ok",
    };
  }
}

export async function getUser(email: string): Promise<User | undefined> {
  try {
    // Await the pool connection
    const pool = await poolPromise;

    // Execute the query to fetch the user by email
    const result = await pool.request().input("email", sql.VarChar, email) // Use parameterized query to prevent SQL injection
      .query(`
        SELECT * FROM [User]
        WHERE email = @email
        ORDER BY [createdAt] DESC
      `);

    // Access the first user from the result's recordset
    const user = result.recordset[0];

    return user; // Return the user or undefined if not found
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export async function getUserById(id: string): Promise<User | undefined> {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("id", sql.VarChar, id).query(`
        SELECT * FROM [User] 
        WHERE id = @id
      `);
    const user = result.recordset[0];

    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

const CreateRecordSchema = z.object({
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
});

export async function createRecord(prevState: RecordState, formData: FormData) {
  const validatedFields = CreateRecordSchema.safeParse({
    ticketNumber: formData.get("ticketNumber"),
    recordType: formData.get("recordType"),
    name: formData.get("name"),
    service: formData.get("service"),
    subService: formData.get("subService"),
    recordNumber: formData.get("recordNumber"),
    value: formData.get("value"),
    counter: formData.get("counter"),
    shift: formData.get("shift"),
    userId: formData.get("userId"),
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Edit Record.",
    };
  }

  const {
    name,
    ticketNumber,
    recordType,
    value,
    recordNumber,
    counter,
    shift,
    service,
    subService,
    userId,
  } = validatedFields.data;

  const id = crypto.randomUUID();
  const session = await auth();

  try {
    const pool = await poolPromise; // Await the pool connection

    // Use parameterized query to insert the record
    await pool
      .request()
      .input("id", sql.NVarChar, id)
      .input("name", sql.NVarChar, name)
      .input("ticketNumber", sql.NVarChar, ticketNumber)
      .input("value", sql.Float, value)
      .input("shift", sql.NVarChar, shift)
      .input("service", sql.NVarChar, service)
      .input("recordNumber", sql.NVarChar, recordNumber)
      .input("counter", sql.VarChar, counter)
      .input("userId", sql.NVarChar, userId)
      .input("subService", sql.NVarChar, subService)
      .input("recordType", sql.NVarChar, recordType)
      .query(
        `
          INSERT INTO Record (id, name, ticket, value, shift, service, recordNumber, counter, userId, subService, recordType)
          VALUES (@id, @name, @ticketNumber, @value, @shift, @service, @recordNumber, @counter, @userId, @subService, @recordType)
        `
      );

    // Assuming `revalidatePath` is a function for revalidating the path for the dashboard
    revalidatePath(`/dashboard/${session?.user.role}/records/create`);

    return {
      ...prevState,
      message: "Record created successfully",
      response: "ok",
    };
  } catch (e) {
    console.error(e);
    return {
      ...prevState,
      state_error: "Something went wrong! Failed to create record.",
    };
  }
}

const EditRecordSchema = z.object({
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
});

export async function requestEditRecord(
  prevState: EditRecordState,
  formData: FormData
) {
  const validatedFields = EditRecordSchema.safeParse({
    ticketNumber: formData.get("ticketNumber"),
    recordType: formData.get("recordType"),
    name: formData.get("name"),
    service: formData.get("service"),
    subService: formData.get("subService"),
    recordNumber: formData.get("recordNumber"),
    value: formData.get("value"),
    counter: formData.get("counter"),
    shift: formData.get("shift"),
    userId: formData.get("userId"),
    recordId: formData.get("recordId"),
    attendantComment: formData.get("attendantComment"),
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to validate record values.",
    };
  }

  const {
    name,
    ticketNumber,
    recordType,
    value,
    recordNumber,
    counter,
    shift,
    service,
    subService,
    userId,
    recordId,
    attendantComment,
  } = validatedFields.data;

  const id = crypto.randomUUID();
  const session = await auth();

  try {
    const pool = await poolPromise; // Await the pool connection

    //check if the record had previously been requested for edit

    const result = await pool
      .request()
      .input("recordId", sql.VarChar, recordId) // Define the input parameter type and value
      .query(`SELECT COUNT(*) AS count FROM EditedRecord WHERE id = @recordId`);

    const recordExists = result.recordset[0].count > 0;

    if (recordExists) {
      return { state_error: "Can not edit! The record was already edited" };
    } else {
      // Use parameterized query to insert the edited record
      await pool
        .request()
        .input("id", sql.NVarChar, id)
        .input("name", sql.NVarChar, name)
        .input("ticketNumber", sql.NVarChar, ticketNumber)
        .input("value", sql.Float, value)
        .input("shift", sql.NVarChar, shift)
        .input("service", sql.NVarChar, service)
        .input("recordNumber", sql.NVarChar, recordNumber)
        .input("counter", sql.VarChar, counter)
        .input("userId", sql.NVarChar, userId)
        .input("subService", sql.NVarChar, subService)
        .input("recordType", sql.NVarChar, recordType)
        .input("recordId", sql.NVarChar, recordId)
        .input("status", sql.NVarChar, "pending")
        .input("attendantComment", sql.NVarChar, attendantComment)
        .query(
          `
          INSERT INTO EditedRecord (id, name, ticket, value, shift, service, recordNumber, counter, attendantId, subService, recordType, recordId, status, attendantComment)
          VALUES (@id, @name, @ticketNumber, @value, @shift, @service, @recordNumber, @counter, @userId, @subService, @recordType, @recordId, @status, @attendantComment)
        `
        );
    }

    // Assuming `revalidatePath` is a function for revalidating the path for the dashboard
    revalidatePath(`/dashboard/${session?.user.role}/records/create`);
  } catch (e) {
    console.error(e);
    return {
      ...prevState,
      state_error: "Something went wrong! Failed to send request.",
    };
  }
  redirect(`/dashboard/${session?.user.role}/records?edit=true`);
}

const EditRecord = z.object({
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
});

export async function editRecord(
  id: string,
  prevState: RecordState,
  formData: FormData
) {
  const validatedFields = EditRecord.safeParse({
    ticketNumber: formData.get("ticketNumber"),
    name: formData.get("name"),
    service: formData.get("service"),
    subService: formData.get("subService"),
    recordType: formData.get("recordType"),
    recordNumber: formData.get("recordNumber"),
    value: formData.get("value"),
    counter: formData.get("counter"),
    shift: formData.get("shift"),
    userId: formData.get("userId"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Edit Record.",
    };
  }

  const {
    name,
    recordType,
    ticketNumber,
    value,
    recordNumber,
    counter,
    shift,
    service,
    subService,
    userId,
  } = validatedFields.data;

  const session = await auth();

  try {
    const pool = await poolPromise; // Await the pool connection

    // Use parameterized query to update the record
    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("ticketNumber", sql.NVarChar, ticketNumber)
      .input("recordType", sql.NVarChar, recordType)
      .input("value", sql.Float, value)
      .input("shift", sql.NVarChar, shift)
      .input("service", sql.NVarChar, service)
      .input("recordNumber", sql.NVarChar, recordNumber)
      .input("counter", sql.VarChar, counter)
      .input("userId", sql.NVarChar, userId)
      .input("subService", sql.NVarChar, subService)
      .input("id", sql.NVarChar, id)
      .query(
        `
          UPDATE Record
          SET
            name = @name,
            ticket = @ticketNumber,
            recordType = @recordType,
            value = @value,
            shift = @shift,
            service = @service,
            recordNumber = @recordNumber,
            counter = @counter,
            userId = @userId,
            subService = @subService
          WHERE id = @id
        `
      );
  } catch (e) {
    console.error(e);
    return {
      state_error: "Something went wrong! Failed to update record.",
      response: null,
    };
  }
  revalidatePath(`/dashboard/${session?.user.role}/records`);
  // redirect(`/dashboard/${session?.user.role}/records`);
}

const RequestEditRecordSchema = z.object({
  supervisorId: z.string(),
  status: z.string(),
  supervisorComment: z.string(),
});

export async function editRequestEditRecord(
  id: string,
  prevState: RequestEditRecordState,
  formData: FormData
) {
  const validatedFields = RequestEditRecordSchema.safeParse({
    supervisorId: formData.get("supervisorId"),
    supervisorComment: formData.get("supervisorComment"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Edit Record.",
    };
  }

  const { supervisorComment, supervisorId, status } = validatedFields.data;

  const session = await auth();

  try {
    const pool = await poolPromise; // Await the pool connection

    // Use parameterized query to update the record
    await pool
      .request()
      .input("status", sql.NVarChar, status)
      .input("supervisorId", sql.NVarChar, supervisorId)
      .input("supervisorComment", sql.NVarChar, supervisorComment)
      .input("id", sql.NVarChar, id)
      .query(
        `
          UPDATE EditedRecord
          SET
            status = @status,
            supervisorId = @supervisorId,
            supervisorComment = @supervisorComment
          WHERE id = @id
        `
      );
  } catch (error) {
    console.error("Something went wrong updating edited record", error);
    return {
      state_error: "Something went wrong! Failed to update record.",
      response: null,
    };
  }
  revalidatePath(`/dashboard/${session?.user.role}/notification`);
  redirect(`/dashboard/${session?.user.role}/notification?edit=true`);
}

export async function fetchRecordsByAttendant(userId: string) {
  try {
    const pool = await poolPromise;

    const res = await pool
      .request()
      .input("userId", sql.NVarChar, userId)
      .query(
        `
        SELECT 
          r.id AS recordId,
          r.ticket,
          r.recordType,
          r.name,
          r.service,
          r.subService,
          r.recordNumber,
          r.value,
          r.counter,
          r.shift,
          r.userId,
          r.createdAt AS recordCreatedAt,
          r.updatedAt AS recordUpdatedAt,
          u.id AS userId,
          u.name AS userName,
          u.email AS userEmail,
          u.station As userStation,
          u.createdAt AS userCreatedAt,
          SUM(r.value) OVER() AS totalValue,
          SUM(CASE WHEN r.recordType = 'invoice' THEN r.value ELSE 0 END) OVER () AS invoiceTotal,
          SUM(CASE WHEN r.recordType = 'receipt' THEN r.value ELSE 0 END) OVER () AS receiptTotal,
          u.createdAt AS userCreatedAt
        FROM Record r
        JOIN [User] u ON r.userId = u.id
        WHERE r.userId = @userId
        ORDER BY r.createdAt DESC
        `
      );

    const records = res.recordset;

    if (records.length > 0) {
      return records;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Something went wrong fetching records", error);
    return [];
  }
}

export async function fetchRecords() {
  try {
    const pool = await poolPromise;

    const res = await pool.request().query(`
        SELECT 
          r.id AS recordId,
          r.ticket,
          r.recordType,
          r.name,
          r.service,
          r.subService,
          r.recordNumber,
          r.value,
          r.userId AS recordUserId,
          r.createdAt AS recordCreatedAt,
          r.updatedAt AS recordUpdatedAt,
          u.counter,
          u.shift,
          u.id AS userId,
          u.name AS userName,
          u.email AS userEmail,
          u.counter AS userCounter,
          u.station AS userStation,
          u.createdAt AS userCreatedAt,
          SUM(r.value) OVER() AS totalValue,
          SUM(CASE WHEN r.recordType = 'invoice' THEN r.value ELSE 0 END) OVER () AS invoiceTotal,
          SUM(CASE WHEN r.recordType = 'receipt' THEN r.value ELSE 0 END) OVER () AS receiptTotal
        FROM Record r
        JOIN [User] u ON r.userId = u.id
        ORDER BY r.createdAt DESC
      `);

    const records = res.recordset;

    if (records.length > 0) {
      return records;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Something went wrong fetching records", error);
    return [];
  }
}

export async function fetchRequestEditRecords() {
  try {
    const pool = await poolPromise;

    const res = await pool.request().query(`
        SELECT 
          r.id AS id,
          r.recordId AS recordId,
          r.ticket,
          r.recordType,
          r.name,
          r.service,
          r.subService,
          r.recordNumber,
          r.value,
          r.attendantId,
          r.status,
          r.attendantComment,
          r.createdAt AS editedRecordCreatedAt,
          r.updatedAt AS editedRecordUpdatedAt,
          u.id AS userId,
          u.counter,
          u.shift,
          u.name AS userName,
          u.email AS userEmail,
          u.station AS userStation,
          u.image AS userImage
        FROM EditedRecord r
        JOIN [User] u ON r.attendantId = u.id
      `);

    const records = res.recordset;

    if (records.length > 0) {
      return records;
    } else {
      return [];
    }
  } catch (error) {
    console.error(
      "Something went wrong fetching requested edit records",
      error
    );
    return [];
  }
}

export async function fetchRequestEditRecordsByUser(id: string) {
  try {
    const pool = await poolPromise;

    const res = await pool.request().input("attendantId", sql.VarChar, id)
      .query(`
        SELECT 
          r.id AS id,
          r.recordId AS recordId,
          r.ticket,
          r.recordType,
          r.name,
          r.service,
          r.subService,
          r.recordNumber,
          r.value,
          r.counter,
          r.shift,
          r.attendantId,
          r.status,
          r.attendantComment,
          r.supervisorComment,
          r.createdAt AS editedRecordCreatedAt,
          r.updatedAt AS editedRecordUpdatedAt,
          u.id AS userId,
          u.name AS userName,
          u.email AS userEmail,
          u.image AS userImage,
          s.id AS supervisorId,
          s.name AS supervisorName
        FROM EditedRecord r
        JOIN [User] u ON r.attendantId = u.id
        LEFT JOIN [User] s ON r.supervisorId = s.id
        WHERE u.id = @attendantId
        ORDER BY r.createdAt DESC
      `);

    const records = res.recordset;

    if (records.length > 0) {
      return records;
    } else {
      return [];
    }
  } catch (error) {
    console.error(
      "Something went wrong fetching requested edit records",
      error
    );
    return [];
  }
}

export async function getRecord(id: string) {
  try {
    const pool = await poolPromise;

    const res = await pool
      .request()
      .input("id", sql.VarChar, id)
      .query("SELECT * FROM [Record] WHERE id = @id");

    const records = res.recordset;

    if (records.length > 0) {
      return records[0];
    }
  } catch (error) {
    console.error("Error fetching record:", error);
    return null;
  }
}

export async function getEditedRecord(id: string) {
  try {
    const pool = await poolPromise;

    const res = await pool
      .request()
      .input("recordId", sql.VarChar, id)
      .input("status", sql.VarChar, "accepted")
      .query(
        "SELECT * FROM [EditedRecord] WHERE [recordId] = @recordId AND status = @status"
      );

    const records = res.recordset;

    if (records.length > 0) {
      return records[0];
    }
  } catch (error) {
    console.error("Error fetching edited record:", error);
    return null;
  }
}

export async function fetchGroupedRecordsByDateRange(
  startDate: string,
  endDate: string
): Promise<LocalRecords[] | undefined> {
  try {
    // Authenticate and get the user session
    const session = await auth();
    if (!session || !session.user) {
      throw new Error("User session not found.");
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Construct the query dynamically based on the user's role and user's station
    const query = `
    WITH Edited AS (
      SELECT 
          e.recordId,
          e.attendantId, 
          e.service, 
          e.subService, 
          e.value, 
          u.counter, 
          u.shift, 
          e.recordType,
          e.name,
          e.createdAt,
          u.station AS userStation
      FROM EditedRecord e
      JOIN [User] u ON e.attendantId = u.id
      WHERE e.status = 'accepted'
    ),
    MergedRecords AS (
      SELECT 
          COALESCE(e.recordId, r.id) AS id,
          COALESCE(e.service, r.service) AS service,
          COALESCE(e.subService, r.subService) AS subService,
          COALESCE(e.value, r.value) AS value,
          COALESCE(u.counter, u.counter) AS counter,
          COALESCE(u.shift, u.shift) AS shift,
          COALESCE(e.recordType, r.recordType) AS recordType,
          COALESCE(e.name, r.name) AS name,
          COALESCE(e.createdAt, r.createdAt) AS createdAt,
          u.station AS userStation
      FROM Record r
      LEFT JOIN Edited e ON r.id = e.recordId
      LEFT JOIN [User] u ON r.userId = u.id
      WHERE r.recordType = 'invoice'
      ${userRole === "attendant" ? `AND r.userId = @userId` : ""}
    )
    SELECT 
    CONVERT(VARCHAR, m.createdAt, 23) AS date,   -- 'YYYY-MM-DD'
    CONVERT(VARCHAR, m.createdAt, 108) AS time,  -- Extract time 'HH:mm' (Daily Analysis)
    DATENAME(WEEKDAY, m.createdAt) AS dayName,   -- Extract day name (Weekly Analysis)
    DATEPART(WW, m.createdAt) AS week,           -- Extract week number (Monthly Analysis)
    DATENAME(MONTH, m.createdAt) AS month,       -- Extract month name (Yearly Analysis)
    m.service,
    m.userStation,
    SUM(m.value) AS totalValue,
    COUNT(*) AS count
FROM MergedRecords m
WHERE m.createdAt BETWEEN @startDate AND @endDate
GROUP BY 
    CONVERT(VARCHAR, m.createdAt, 23), 
    CONVERT(VARCHAR, m.createdAt, 108),
    DATENAME(WEEKDAY, m.createdAt),
    DATEPART(WW, m.createdAt), 
    DATENAME(MONTH, m.createdAt),
    m.service,
    m.userStation
ORDER BY 
    CONVERT(VARCHAR, m.createdAt, 23) DESC, time DESC;
    `;

    // Prepare the query parameters
    userRole === "attendant"
      ? [startDate, endDate, userId]
      : [startDate, endDate];

    // Execute the query using mssql's parameterized queries

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("startDate", sql.DateTime, startDate)
      .input("endDate", sql.DateTime, endDate)
      .input("userId", sql.VarChar, userId) // Only used for 'attendant' role
      .query(query);

    // Process the results
    const records = result.recordset.map((row) => ({
      ...row,
      totalValue: row.totalValue ? Number(row.totalValue) : 0,
      count: row.count ? Number(row.count) : 0,
    }));

    return records.length > 0 ? records : undefined;
  } catch (error) {
    console.error(
      "Something went wrong fetching grouped records by date range",
      error
    );
    return undefined;
  }
}

// Fetch daily records grouped by day of the week
export async function fetchDailyGroupedRecords(): Promise<
  LocalRecords[] | undefined
> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999); // End of today

  const formatDateTime = (date: Date): string =>
    date.toISOString().replace("T", " ").substring(0, 23);

  const records = await fetchGroupedRecordsByDateRange(
    formatDateTime(startOfDay),
    formatDateTime(endOfDay)
  );
  return records;
}

// Utility function to format date-time as "YYYY-MM-DD HH:MM:SS.sss"
const formatDateTime = (date: Date): string =>
  date.toISOString().replace("T", " ").substring(0, 23);

// Fetch weekly records grouped by week
export async function fetchWeeklyGroupedRecords(): Promise<
  LocalRecords[] | undefined
> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Start of the week (Monday)
  startOfWeek.setHours(0, 0, 0, 0); // Reset to start of the day

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the week (Sunday)
  endOfWeek.setHours(23, 59, 59, 999); // Reset to end of the day

  return fetchGroupedRecordsByDateRange(
    formatDateTime(startOfWeek),
    formatDateTime(endOfWeek)
  );
}

// Fetch monthly records grouped by month
export async function fetchMonthlyGroupedRecords(): Promise<
  LocalRecords[] | undefined
> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Start of the month
  startOfMonth.setHours(0, 0, 0, 0); // Reset to start of the day

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of the month
  endOfMonth.setHours(23, 59, 59, 999); // Reset to end of the day
  return fetchGroupedRecordsByDateRange(
    formatDateTime(startOfMonth),
    formatDateTime(endOfMonth)
  );
}

// Fetch yearly records grouped by year
export async function fetchYearlyGroupedRecords(): Promise<
  LocalRecords[] | undefined
> {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st
  startOfYear.setHours(0, 0, 0, 0); // Reset to start of the day

  const endOfYear = new Date(now.getFullYear(), 11, 31); // December 31st
  endOfYear.setHours(23, 59, 59, 999); // Reset to end of the day

  return fetchGroupedRecordsByDateRange(
    formatDateTime(startOfYear),
    formatDateTime(endOfYear)
  );
}
