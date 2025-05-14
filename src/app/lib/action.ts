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
import pool from "./db";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import cron from "node-cron";
import { LocalRecords } from "../dashboard/(overview)/page";

cron.schedule("0 * * * *", async () => {
  try {
    // Deleting expired Session records in Postgres
    await pool.query(`
      DELETE FROM "Session"
      WHERE expires <= NOW()
    `);
    console.log("Expired sessions deleted successfully");
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
      // Delete session from the database
      await pool.query(`DELETE FROM "Session" WHERE "userId" = $1`, [userId]);

      // Sign the user out in your auth system
      await signOut();
    } catch (e) {
      console.error("Something went wrong deleting record!", e);
    }
  }

  // Redirect to the login page after signing out
  redirect("/login");
}

export async function fetchUsers(role: string): Promise<User[]> {
  try {
    // Run a parameterized DELETE against Postgres
    const result = await pool.query(
      `SELECT * 
         FROM "User"
        WHERE "role" = $1
        ORDER BY "name" ASC`,
      [role]
    );

    // In pg, rows lives on `result.rows`
    return result.rows;
  } catch (error) {
    console.error("Something went wrong fetching users:", error);
    return [];
  }
}

export async function fetchOnlineUsers(): Promise<OnlineUser[]> {
  try {
    // Query all sessions from Postgres
    const result = await pool.query(`
      SELECT * 
        FROM "Session"
    `);

    // Return the rows (even if empty)
    return result.rows;
  } catch (error) {
    console.error("Something went wrong fetching online users:", error);
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
    // Insert user data into Postgres using parameterized placeholders
    await pool.query(
      `
      INSERT INTO "User"
        ("id", "name", "email", "password", "station", "shift", "counter", "role")
      VALUES
        ($1,    $2,     $3,      $4,         $5,        $6,      $7,        $8)
      `,
      [id, name, email, hashedPass, station, shift, counter, userRole]
    );

    // Invalidate or revalidate the Next.js path for your dashboard
    revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);

    return {
      ...prevState,
      state_error: null,
      message: `Added user successfully.`,
    };
  } catch (error) {
    console.error("Failed to create user:", error);
    return {
      ...prevState,
      state_error: `Something went wrong! Failed to create ${role}.`,
    };
  }
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
    const result = await pool.query(
      `SELECT * 
         FROM "User"
        WHERE "id" = $1`,
      [id]
    );

    // Logic for password

    const existingUser = result.rows[0];

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
         SET "name"     = $1,
             "email"    = $2,
             "password" = $3,
             "role"     = $4,
             "station"  = $5,
             "image"    = $6
       WHERE "id"       = $7
      `,
      [name, email, hashedPass, role, station, imagePath, id]
    );

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
    await pool.query(
      `
      UPDATE "User"
         SET "status" = $1
       WHERE "id"     = $2
      `,
      [userStatus, id]
    );
  } catch (error) {
    console.error("Something went wrong updating user status:", error);
    return {
      ...prevState,
      state_error: "Error processing your request",
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
    // Update counter and shift in Postgres
    await pool.query(
      `
      UPDATE "User"
         SET "counter" = $1,
             "shift"   = $2
       WHERE "id"      = $3
      `,
      [counter, shift, id]
    );

    // Revalidate the Next.js path
    revalidatePath(`/dashboard/${session?.user.role}/${role}s/create`);

    return {
      ...prevState,
      message: "Shift updated successfully",
      response: "ok",
      state_error: null,
    };
  } catch (error) {
    console.error("Something went wrong updating user shift:", error);
    return {
      ...prevState,
      state_error: "Error updating user shift",
      response: "!ok",
    };
  }
}

export async function getUser(email: string): Promise<User | undefined> {
  try {
    // Execute a parameterized SELECT against Postgres
    const result = await pool.query(
      `
      SELECT *
        FROM "User"
       WHERE "email" = $1
    ORDER BY "createdAt" DESC
      `,
      [email]
    );

    // Return the first row (or undefined if none)
    return result.rows[0];
  } catch (error) {
    console.error("Failed to fetch user by email:", error);
    throw new Error("Failed to fetch user.");
  }
}

export async function getUserById(id: string): Promise<User | undefined> {
  try {
    const result = await pool.query(
      `
      SELECT *
        FROM "User"
       WHERE "id" = $1
      `,
      [id]
    );

    return result.rows[0]; // first row or undefined if none
  } catch (error) {
    console.error("Failed to fetch user by id:", error);
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
    // Insert the new record using positional parameters
    await pool.query(
      `
      INSERT INTO "Record"
        ("id", "name", "ticket", "value", "shift", "service",
         "recordNumber", "counter", "userId", "subService", "recordType")
      VALUES
        ($1,    $2,     $3,        $4,     $5,      $6,
         $7,           $8,        $9,      $10,         $11)
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

    // Revalidate the dashboard path
    revalidatePath(`/dashboard/${session?.user.role}/records/create`);

    return {
      ...prevState,
      message: "Record created successfully",
      response: "ok",
      state_error: null,
    };
  } catch (error) {
    console.error("Failed to create record:", error);
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
    // 1. Check if an edit request already exists
    const checkResult = await pool.query(
      `
      SELECT COUNT(*) AS count
        FROM "EditedRecord"
       WHERE "recordId" = $1
      `,
      [recordId]
    );
    const alreadyEdited = parseInt(checkResult.rows[0].count, 10) > 0;

    if (alreadyEdited) {
      return {
        ...prevState,
        state_error: "Cannot edit! The record was already edited.",
      };
    }

    // 2. Insert the new edited record
    await pool.query(
      `
      INSERT INTO "EditedRecord"
        ("id","name","ticket","value","shift","service",
         "recordNumber","counter","attendantId","subService",
         "recordType","recordId","status","attendantComment")
      VALUES
        ($1,   $2,    $3,     $4,    $5,      $6,
         $7,            $8,     $9,           $10,
         $11,          $12,     $13,            $14)
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

    // 3. Revalidate the dashboard route
    revalidatePath(`/dashboard/${session?.user.role}/records/create`);
  } catch (error) {
    console.error("Failed to submit edit request:", error);
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
    await pool.query(
      `
      UPDATE "Record"
         SET "name"        = $1,
             "ticket"      = $2,
             "recordType"  = $3,
             "value"       = $4,
             "shift"       = $5,
             "service"     = $6,
             "recordNumber"= $7,
             "counter"     = $8,
             "userId"      = $9,
             "subService"  = $10
       WHERE "id"          = $11
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
  } catch (error) {
    console.error("Failed to update record:", error);
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
    await pool.query(
      `
      UPDATE "EditedRecord"
         SET "status"            = $1,
             "supervisorId"      = $2,
             "supervisorComment" = $3
       WHERE "id"                = $4
      `,
      [status, supervisorId, supervisorComment, id]
    );
  } catch (error) {
    console.error("Something went wrong updating edited record:", error);
    return {
      state_error: "Something went wrong! Failed to update record.",
    };
  }
  revalidatePath(`/dashboard/${session?.user.role}/notification`);
  redirect(`/dashboard/${session?.user.role}/notification?edit=true`);
}

export async function fetchRecordsByAttendant(userId: string) {
  try {
    const result = await pool.query(
      `
      SELECT
        r."id"             AS "recordId",
        r."ticket"         AS "ticket",
        r."recordType"     AS "recordType",
        r."name"           AS "name",
        r."service"        AS "service",
        r."subService"     AS "subService",
        r."recordNumber"   AS "recordNumber",
        r."value"          AS "value",
        r."counter"        AS "counter",
        r."shift"          AS "shift",
        r."userId"         AS "userId",
        r."createdAt"      AS "recordCreatedAt",
        r."updatedAt"      AS "recordUpdatedAt",
        u."id"             AS "userId",
        u."name"           AS "userName",
        u."email"          AS "userEmail",
        u."station"        AS "userStation",
        u."createdAt"      AS "userCreatedAt",
        SUM(r."value")                 OVER () AS "totalValue",
        SUM(CASE WHEN r."recordType" = 'invoice' THEN r."value" ELSE 0 END) OVER () AS "invoiceTotal",
        SUM(CASE WHEN r."recordType" = 'receipt' THEN r."value" ELSE 0 END) OVER () AS "receiptTotal"
      FROM "Record" r
      JOIN "User" u
        ON r."userId" = u."id"
      WHERE r."userId" = $1
      ORDER BY r."createdAt" DESC
      `,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error("Something went wrong fetching records:", error);
    return [];
  }
}

export async function fetchRecords() {
  try {
    const result = await pool.query(`
      SELECT 
        r."id"               AS "recordId",
        r."ticket",
        r."recordType",
        r."name",
        r."service",
        r."subService",
        r."recordNumber",
        r."value",
        r."userId"           AS "recordUserId",
        r."createdAt"        AS "recordCreatedAt",
        r."updatedAt"        AS "recordUpdatedAt",
        u."counter",
        u."shift",
        u."id"               AS "userId",
        u."name"             AS "userName",
        u."email"            AS "userEmail",
        u."counter"          AS "userCounter",
        u."station"          AS "userStation",
        u."createdAt"        AS "userCreatedAt",
        SUM(r."value")                   OVER () AS "totalValue",
        SUM(CASE WHEN r."recordType" = 'invoice' THEN r."value" ELSE 0 END) OVER () AS "invoiceTotal",
        SUM(CASE WHEN r."recordType" = 'receipt' THEN r."value" ELSE 0 END) OVER () AS "receiptTotal"
      FROM "Record" r
      JOIN "User" u
        ON r."userId" = u."id"
      ORDER BY r."createdAt" DESC
    `);

    return result.rows;
  } catch (error) {
    console.error("Something went wrong fetching records:", error);
    return [];
  }
}

export async function fetchRequestEditRecords() {
  try {
    const result = await pool.query(`
      SELECT 
        r."id"                       AS "id",
        r."recordId"                 AS "recordId",
        r."ticket",
        r."recordType",
        r."name",
        r."service",
        r."subService",
        r."recordNumber",
        r."value",
        r."attendantId",
        r."status",
        r."attendantComment",
        r."createdAt"                AS "editedRecordCreatedAt",
        r."updatedAt"                AS "editedRecordUpdatedAt",
        u."id"                       AS "userId",
        u."counter",
        u."shift",
        u."name"                     AS "userName",
        u."email"                    AS "userEmail",
        u."station"                  AS "userStation",
        u."image"                    AS "userImage"
      FROM "EditedRecord" r
      JOIN "User" u
        ON r."attendantId" = u."id"
      ORDER BY r."createdAt" DESC
    `);

    return result.rows;
  } catch (error) {
    console.error("Something went wrong fetching edit requests:", error);
    return [];
  }
}

export async function fetchRequestEditRecordsByUser(id: string) {
  try {
    const query = `
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
        u.station AS "userStation",
        u."createdAt" AS "userCreatedAt",
        SUM(r.value) OVER() AS "totalValue",
        SUM(CASE WHEN r."recordType" = 'invoice' THEN r.value ELSE 0 END) OVER () AS "invoiceTotal",
        SUM(CASE WHEN r."recordType" = 'receipt' THEN r.value ELSE 0 END) OVER () AS "receiptTotal"
      FROM "Record" r
      JOIN "User" u ON r."userId" = u.id
      WHERE r."userId" = $1
      ORDER BY r."createdAt" DESC
    `;

    const res = await pool.query(query, [id]);
    return res.rows || [];
  } catch (error) {
    console.error("Something went wrong fetching records:", error);
    return [];
  }
}

export async function getRecord(id: string) {
  try {
    const query = `SELECT * FROM "Record" WHERE id = $1`;
    const res = await pool.query(query, [id]);

    if (res.rows.length > 0) {
      return res.rows[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching record:", error);
    return null;
  }
}

export async function getEditedRecord(id: string) {
  try {
    const query = `
      SELECT * 
      FROM "EditedRecord" 
      WHERE "recordId" = $1 AND status = $2
    `;
    const values = [id, "accepted"];

    const res = await pool.query(query, values);

    if (res.rows.length > 0) {
      return res.rows[0];
    } else {
      return null;
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
    const session = await auth();
    if (!session || !session.user) {
      throw new Error("User session not found.");
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    const params: string[] = [startDate, endDate];
    let userFilterClause = "";

    if (userRole === "attendant") {
      userFilterClause = `AND r."userId" = $3`;
      params.push(userId);
    }

    const query = `
      WITH Edited AS (
        SELECT 
            e."recordId",
            e."attendantId", 
            e."service", 
            e."subService", 
            e."value", 
            u."counter", 
            u."shift", 
            e."recordType",
            e."name",
            e."createdAt",
            u."station" AS "userStation"
        FROM "EditedRecord" e
        JOIN "User" u ON e."attendantId" = u.id
        WHERE e."status" = 'accepted'
      ),
      MergedRecords AS (
        SELECT 
            COALESCE(e."recordId", r.id) AS id,
            COALESCE(e."service", r."service") AS service,
            COALESCE(e."subService", r."subService") AS "subService",
            COALESCE(e."value", r."value") AS value,
            COALESCE(u."counter", u."counter") AS counter,
            COALESCE(u."shift", u."shift") AS shift,
            COALESCE(e."recordType", r."recordType") AS "recordType",
            COALESCE(e."name", r."name") AS name,
            COALESCE(e."createdAt", r."createdAt") AS "createdAt",
            u."station" AS "userStation"
        FROM "Record" r
        LEFT JOIN Edited e ON r.id = e."recordId"
        LEFT JOIN "User" u ON r."userId" = u.id
        WHERE r."recordType" = 'invoice'
        ${userFilterClause}
      )
      SELECT 
        TO_CHAR(m."createdAt", 'YYYY-MM-DD') AS date,
        TO_CHAR(m."createdAt", 'HH24:MI:SS') AS time,
        TO_CHAR(m."createdAt", 'Day') AS "dayName",
        EXTRACT(WEEK FROM m."createdAt")::INT AS week,
        TO_CHAR(m."createdAt", 'Month') AS month,
        m.service,
        m."userStation",
        SUM(m.value)::FLOAT AS "totalValue",
        COUNT(*)::INT AS count
      FROM MergedRecords m
      WHERE m."createdAt" BETWEEN $1 AND $2
      GROUP BY 
        date, time, "dayName", week, month, m.service, m."userStation"
      ORDER BY 
        date DESC, time DESC
    `;

    const result = await pool.query(query, params);

    return result.rows.length > 0
      ? result.rows.map((row) => ({
          ...row,
          totalValue: row.totalValue || 0,
          count: row.count || 0,
        }))
      : undefined;
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
