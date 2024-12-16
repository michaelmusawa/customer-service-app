"use server";

import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "../../../auth";
import { AuthError } from "next-auth";
import {
  EditedRecord,
  GroupedRecord,
  OnlineUser,
  Record,
  RecordState,
  User,
  UserState,
} from "./definitions";
import { z } from "zod";
import pool from "./db";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import cron from "node-cron";

cron.schedule("0 * * * *", async () => {
  try {
    await pool.query(
      'DELETE FROM "ShiftNotification" WHERE "expires" <= NOW()'
    );
    await pool.query('DELETE FROM "Session" WHERE "expires" <= NOW()');
    console.log("Expired records deleted");
  } catch (err) {
    console.error("Error deleting expired records:", err);
  }
});

export async function authenticate(_currentState: unknown, formData: FormData) {
  try {
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

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
  const session = await auth();
  const userId = session?.user.id;

  if (userId) {
    try {
      await pool.query(
        `
        DELETE FROM "Session"
        WHERE "userId" = $1
        `,
        [userId]
      );

      await signOut();
    } catch (e) {
      console.error("Something went wrong deleting record!", e);
    }
  }

  redirect("/login");
}

export async function fetchUsers(user: string) {
  try {
    const res = await pool.query<User>(
      `
      SELECT * FROM "User"
      WHERE role = $1
      ORDER BY "createdAt" DESC
      `,
      [user]
    );

    const users = res.rows;
    if (users.length > 0) {
      return users;
    }
  } catch (error) {
    console.error("Something went wrong fetching supervisors", error);
  }
}

export async function fetchOnlineUsers() {
  try {
    const res = await pool.query<OnlineUser>(`
      SELECT * FROM "Session"
      `);
    const users = res.rows;
    if (users.length > 0) {
      return users;
    } else [];
  } catch (error) {
    console.error("Something went wrong fetching online users", error);
  }
}

const FormSchema = z.object({
  name: z.string(),
  email: z.string({
    invalid_type_error: "Please enter a valid email",
  }),
  password: z.string(),
  role: z.string(),
  image: z.any().optional(),
  resetPass: z.string().nullable().optional(),
});

export async function createUser(prevState: UserState, formData: FormData) {
  const validatedFields = FormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create user.",
    };
  }

  const { name, email, password, role } = validatedFields.data;
  let userPassword = "";
  if (password === "") {
    userPassword = email;
  } else {
    userPassword = password;
  }
  const salt = bcrypt.genSaltSync(10);
  const pass = userPassword;
  const hashedPass = bcrypt.hashSync(pass, salt);
  const id = crypto.randomUUID();
  const session = await auth();

  let userRole;

  if (email === "supersupervisor@gmail.com") {
    userRole = "supersupervisor";
  } else {
    userRole = role;
  }

  try {
    await pool.query(
      `
            INSERT INTO "User" (id, name, email, password, role)
            VALUES ($1, $2, $3, $4, $5)
            `,
      [id, name, email, hashedPass, userRole]
    );

    revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);

    return {
      message: `Added ${role} successfully`,
      response: "ok",
    };
  } catch (error) {
    console.error(error);
    return {
      state_error: `Something went wrong! Failed to create ${role}.`,
      response: "!ok",
    };
  }
}

export async function editUser(
  id: string,
  prevState: UserState,
  formData: FormData
) {
  const validatedFields = FormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    image: formData.get("image"),
    resetPass: formData.get("resetPass"),
  });

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Edit user.",
      state_error: null,
      success: false,
    };
  }

  const { name, email, password, role, image, resetPass } =
    validatedFields.data;

  let hashedPass;
  let imagePath = null;
  const session = await auth();

  function generateHash(userPassword: string) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(userPassword, salt);
  }

  try {
    const res = await pool.query<User>(
      `
      SELECT * FROM "User" WHERE id = $1`,
      [id]
    );

    // Logic for password

    const existingUser = res.rows[0];

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

    await pool.query(
      `
      UPDATE "User"
      SET
        name = $1,
        email = $2,
        password = $3,
        role = $4,
        image = $5
        WHERE id = $6
        `,
      [name, email, hashedPass, role, imagePath, id]
    );

    if (session?.user.role === role) {
      if (resetPass === "true") {
        redirect("/dashboard");
      }
      revalidatePath(`/dashboard/${session?.user.role}/profile`);
    }
    revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      errors: null,
      state_error: "Error updating user.",
      success: false,
    };
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
  prevState: UserState,
  formData: FormData
) {
  const validatedFields = ArchiveUserSchema.safeParse({
    status: formData.get("status"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    return {
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
    await pool.query(
      `
      UPDATE "User"
      SET
        status = $1
        WHERE id = $2
        `,
      [userStatus, id]
    );
  } catch (error) {
    console.error("Something went wrong", error);
    return {
      state_error: "Error in the processing your request",
      response: "!ok",
    };
  }

  redirect(`/dashboard/${session?.user.role}/${role}s/create?${status}=true`);
}

const ShiftAndCounterUserSchema = z.object({
  counter: z.coerce.number(),
  shift: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  role: z.string(),
});

export async function assignShiftAndCounter(
  id: string,
  prevState: UserState,
  formData: FormData
) {
  const validatedFields = ShiftAndCounterUserSchema.safeParse({
    counter: formData.get("counter"),
    shift: formData.get("shift"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to archive user.",
    };
  }

  const { counter, shift, startDate, endDate, role } = validatedFields.data;

  const shiftStartDate = new Date(startDate);
  const shiftEndDate = new Date(endDate);

  const session = await auth();

  try {
    await pool.query(
      `
      UPDATE "User"
      SET
        counter = $1,
        shift = $2,
        "shiftStartDate" = $3,
        "shiftEndDate" = $4
        WHERE id = $5
        `,
      [counter, shift, shiftStartDate, shiftEndDate, id]
    );

    revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);
    return {
      message: "Shift updated successfully",
      response: "ok",
    };
  } catch (error) {
    console.error("Something went wrong updating user shift", error);
    return {
      state_error: "Error updating user shift",
      response: "!ok",
    };
  }
}

const ShiftWarningActionSchema = z.object({
  attendantId: z.string(),
  dismiss: z.string(),
});

export async function shiftWarningAction(
  prevState: UserState,
  formData: FormData
) {
  const validatedFields = ShiftWarningActionSchema.safeParse({
    attendantId: formData.get("attendantId"),
    dismiss: formData.get("dismiss"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to archive user.",
    };
  }

  const { attendantId, dismiss } = validatedFields.data;

  const session = await auth();
  const supervisorId = session?.user.id;
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    await pool.query(
      `
      INSERT INTO "ShiftNotification"
      ("id", "attendantId", "supervisorId", "dismiss", "expires" )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [id, attendantId, supervisorId, dismiss, expires]
    );
  } catch (error) {
    console.error("Something went wrong creating shift action", error);
    return {
      state_error: "Error creating shift action",
      response: "!ok",
    };
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
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
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
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export async function deleteUser(id: string) {
  try {
    await pool.query(
      `
      DELETE FROM "User"
      WHERE "id" = $1
      `,
      [id]
    );
    revalidatePath("/admin");
  } catch (e) {
    console.error("Something went wrong deleting user!", e);
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

export async function createRecord(prevState: RecordState, formData: FormData) {
  const validatedFields = RecordSchema.safeParse({
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
    await pool.query(
      `
            INSERT INTO "Record" (id, name, "ticket", value, shift, service, "recordNumber", counter, "userId", "subService", "recordType")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `,
      [
        id,
        name,
        ticketNumber,
        value,
        shift,
        service,
        recordNumber,
        counter,
        userId,
        subService,
        recordType,
      ]
    );

    revalidatePath(`/dashboard/${session?.user.role}/records/create`);
    return {
      message: "Record created successfully",
      response: "ok",
    };
  } catch (e) {
    console.log(e);
    return { state_error: "Something went wrong! Failed to create record." };
  }
}

export async function requestEditRecord(
  prevState: RecordState,
  formData: FormData
) {
  const validatedFields = RecordSchema.safeParse({
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
    await pool.query(
      `
            INSERT INTO "EditedRecord" (id, name, "ticket", value, shift, service, "recordNumber", counter, "attendantId", "subService", "recordType", "recordId", status, "attendantComment")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `,
      [
        id,
        name,
        ticketNumber,
        value,
        shift,
        service,
        recordNumber,
        counter,
        userId,
        subService,
        recordType,
        recordId,
        "pending",
        attendantComment,
      ]
    );

    revalidatePath(`/dashboard/${session?.user.role}/records/create`);
  } catch (e) {
    console.log(e);
    return { state_error: "Something went wrong! Failed to send request." };
  }
  redirect(`/dashboard/${session?.user.role}/records?edit=true`);
}

export async function editRecord(
  id: string,
  prevState: RecordState,
  formData: FormData
) {
  const validatedFields = RecordSchema.safeParse({
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
    await pool.query(
      `
      UPDATE "Record"
      SET
        name = $1,
        ticket = $2,
        "recordType" = $4,
        value = $5,
        shift = $6,
        service = $7,
        "recordNumber" = $8,
        counter = $9,
        "userId" = $10,
        "subService" = $11
      WHERE id = $12
        `,
      [
        name,
        ticketNumber,
        recordType,
        value,
        shift,
        service,
        recordNumber,
        counter,
        userId,
        subService,
        id,
      ]
    );
  } catch (e) {
    console.log(e);
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
  prevState: RecordState,
  formData: FormData
) {
  const validatedFields = RequestEditRecordSchema.safeParse({
    supervisorId: formData.get("supervisorId"),
    supervisorComment: formData.get("supervisorComment"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    console.log("The validated file", validatedFields.error);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Edit Record.",
    };
  }

  const { supervisorComment, supervisorId, status } = validatedFields.data;

  const session = await auth();

  try {
    await pool.query(
      `
      UPDATE "EditedRecord"
      SET
        status = $1,
        "supervisorId" = $2,
        "supervisorComment" = $3
      WHERE id = $4
        `,
      [status, supervisorId, supervisorComment, id]
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

export async function deleteRecord(id: string) {
  try {
    await pool.query(
      `
      DELETE FROM "Record"
      WHERE "id" = $1
      `,
      [id]
    );
    revalidatePath("/admin");
  } catch (e) {
    console.error("Something went wrong deleting record!", e);
  }
}

export async function fetchRecordsByAttendant(userId: string) {
  try {
    const res = await pool.query<Record>(
      `
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
        SUM(CASE WHEN r."recordType" = 'receipt' THEN r.value ELSE 0 END) OVER () AS "receiptTotal",
        u."createdAt" AS "userCreatedAt"
      FROM "Record" r
      JOIN "User" u ON r."userId" = u.id
      WHERE r."userId" = $1
      ORDER BY "recordCreatedAt" DESC
    `,
      [userId]
    );
    const records = res.rows;
    if (records.length > 0) {
      return records;
    }
  } catch (error) {
    console.error("Something went wrong fetching records", error);
  }
}

export async function fetchRecords() {
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
      ORDER BY "recordCreatedAt" DESC
      `);

    const records = res.rows;

    if (records.length > 0) {
      return records;
    }
  } catch (error) {
    console.error("Something went wrong fetching records", error);
  }
}

export async function fetchRequestEditRecords() {
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
      WHERE r.status = 'pending'
      
      `);

    const records = res.rows;

    if (records.length > 0) {
      return records;
    }
  } catch (error) {
    console.error(
      "Something went wrong fetching requested edit records",
      error
    );
  }
}

export async function fetchRequestEditRecordsByUser(id: string) {
  try {
    const res = await pool.query<EditedRecord>(
      `
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
      ORDER BY "editedRecordCreatedAt" DESC
      `,
      [id]
    );

    const records = res.rows;

    if (records.length > 0) {
      return records;
    }
  } catch (error) {
    console.error(
      "Something went wrong fetching requested edit records",
      error
    );
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

export async function fetchDailyRevenueByAttendant(id: string) {
  try {
    const res = await pool.query<Record>(
      `
      SELECT 
        DATE("createdAt") AS "createdAt",
        SUM(value) AS "totalValue"
      FROM "Record"
      WHERE "userId" = $1
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") DESC
      
    `,
      [id]
    );
    return res.rows;
  } catch (error) {
    console.error("Error fetching daily revenue", error);
    throw error;
  }
}

export async function getRecord(id: string) {
  const res = await pool.query<Record>(
    `
    SELECT * FROM "Record" WHERE id = $1`,
    [id]
  );
  const records = res.rows;
  if (records.length > 0) {
    return records[0];
  }
}

export async function fetchGroupedRecordsByDateRange(
  startDate: string,
  endDate: string
): Promise<GroupedRecord[] | undefined> {
  try {
    const res = await pool.query<GroupedRecord>(
      `
      WITH Edited AS (
        SELECT 
          e."recordId", 
          e.service, 
          e."subService", 
          e.value, 
          e.counter, 
          e.shift, 
          e."recordType",
          e.name,
          e."createdAt"
        FROM "EditedRecord" e
        WHERE e.status = 'accepted'
      ),
      MergedRecords AS (
        SELECT 
          COALESCE(e."recordId", r.id) AS id,
          COALESCE(e.service, r.service) AS service,
          COALESCE(e."subService", r."subService") AS "subService",
          COALESCE(e.value, r.value) AS value,
          COALESCE(e.counter, r.counter) AS counter,
          COALESCE(e.shift, r.shift) AS shift,
          COALESCE(e."recordType", r."recordType") AS "recordType",
          COALESCE(e.name, r.name) AS name,
          COALESCE(e."createdAt", r."createdAt") AS "createdAt"
        FROM "Record" r
        LEFT JOIN Edited e ON r.id = e."recordId"
      )
      SELECT 
        TO_CHAR(m."createdAt", 'YYYY-MM-DD') AS "date",
        TO_CHAR(m."createdAt", 'WW') AS "week",
        TO_CHAR(m."createdAt", 'Month') AS "month",
        m.service,
        SUM(m.value) AS "totalValue",
        COUNT(*) AS count
      FROM MergedRecords m
      WHERE m."createdAt" BETWEEN $1 AND $2
      GROUP BY "date", "week", "month", m.service
      ORDER BY "date" DESC
      `,
      [startDate, endDate]
    );

    // Process the results to ensure correct numeric conversions for `totalValue` and `count`
    const records = res.rows.map((row) => ({
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
export async function fetchDailyGroupedRecords() {
  const today = new Date().toISOString().split("T")[0]; // Get today's date in 'YYYY-MM-DD' format
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;
  return fetchGroupedRecordsByDateRange(startOfDay, endOfDay);
}

export async function fetchWeeklyGroupedRecords(): Promise<GroupedRecord[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // Current month (0-indexed)

  const startOfMonth = new Date(year, month, 1); // First day of the month
  const endOfMonth = new Date(year, month + 1, 0); // Last day of the month

  const groupedRecords: GroupedRecord[] = [];
  let currentWeek = 1;
  let startOfWeek = new Date(startOfMonth);

  while (startOfWeek <= endOfMonth) {
    // Calculate the end of the current week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + (6 - startOfWeek.getDay()));

    // Adjust the endOfWeek if it exceeds the month's end
    if (endOfWeek > endOfMonth) {
      endOfWeek.setDate(endOfMonth.getDate());
    }

    // Fetch records for this week
    const weeklyRecords = await fetchGroupedRecordsByDateRange(
      startOfWeek.toISOString(),
      new Date(endOfWeek.getTime() + 86399999).toISOString() // Include endOfWeek full day
    );

    // Map weeklyRecords to include the custom week numbering
    if (weeklyRecords && weeklyRecords.length > 0) {
      weeklyRecords.forEach((record) => {
        groupedRecords.push({
          ...record,
          week: currentWeek.toString(), // Replace week property with custom numbering
        });
      });
    }

    // Move to the next week
    startOfWeek = new Date(endOfWeek);
    startOfWeek.setDate(startOfWeek.getDate() + 1);
    currentWeek++;
  }
  return groupedRecords;
}

export async function fetchMonthlyGroupedRecords(): Promise<
  GroupedRecord[] | undefined
> {
  const now = new Date();
  const year = now.getFullYear();

  const allMonthlyRecords = [];

  for (let month = 0; month < 12; month++) {
    const startOfMonth = new Date(year, month, 1).toISOString().split("T")[0]; // Get the start of the current month
    const endOfMonth = new Date(year, month + 1, 0).toISOString().split("T")[0]; // Get the end of the current month

    const monthlyRecords = await fetchGroupedRecordsByDateRange(
      `${startOfMonth}T00:00:00.000Z`,
      `${endOfMonth}T23:59:59.999Z`
    );

    if (monthlyRecords) {
      allMonthlyRecords.push(...monthlyRecords);
    }
  }
  return allMonthlyRecords;
}
