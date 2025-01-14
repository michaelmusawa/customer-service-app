BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [emailVerified] DATETIME2,
    [role] NVARCHAR(1000),
    [status] NVARCHAR(1000),
    [image] NVARCHAR(1000),
    [counter] INT,
    [shift] NVARCHAR(1000),
    [shiftStartDate] DATETIME2,
    [shiftEndDate] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Record] (
    [id] NVARCHAR(1000) NOT NULL,
    [ticket] NVARCHAR(1000) NOT NULL,
    [recordType] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [service] NVARCHAR(1000) NOT NULL,
    [subService] NVARCHAR(1000),
    [recordNumber] NVARCHAR(1000),
    [value] INT NOT NULL,
    [counter] NVARCHAR(1000) NOT NULL,
    [shift] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Record_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2,
    CONSTRAINT [Record_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[EditedRecord] (
    [id] NVARCHAR(1000) NOT NULL,
    [recordId] NVARCHAR(1000) NOT NULL,
    [ticket] NVARCHAR(1000) NOT NULL,
    [recordType] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [service] NVARCHAR(1000) NOT NULL,
    [subService] NVARCHAR(1000),
    [recordNumber] NVARCHAR(1000) NOT NULL,
    [value] INT NOT NULL,
    [counter] NVARCHAR(1000) NOT NULL,
    [shift] NVARCHAR(1000) NOT NULL,
    [attendantComment] NVARCHAR(1000),
    [supervisorComment] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL,
    [attendantId] NVARCHAR(1000) NOT NULL,
    [supervisorId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [EditedRecord_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2,
    CONSTRAINT [EditedRecord_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Account] (
    [userId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [provider] NVARCHAR(1000) NOT NULL,
    [providerAccountId] NVARCHAR(1000) NOT NULL,
    [refresh_token] NVARCHAR(1000),
    [access_token] NVARCHAR(1000),
    [expires_at] INT,
    [token_type] NVARCHAR(1000),
    [scope] NVARCHAR(1000),
    [id_token] NVARCHAR(1000),
    [session_state] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Account_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Account_pkey] PRIMARY KEY CLUSTERED ([provider],[providerAccountId])
);

-- CreateTable
CREATE TABLE [dbo].[Session] (
    [sessionToken] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Session_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Session_sessionToken_key] UNIQUE NONCLUSTERED ([sessionToken])
);

-- CreateTable
CREATE TABLE [dbo].[ShiftNotification] (
    [id] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    [attendantId] NVARCHAR(1000) NOT NULL,
    [supervisorId] NVARCHAR(1000),
    [dismiss] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ShiftNotification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2,
    CONSTRAINT [ShiftNotification_id_key] UNIQUE NONCLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[VerificationToken] (
    [identifier] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [VerificationToken_pkey] PRIMARY KEY CLUSTERED ([identifier],[token])
);

-- AddForeignKey
ALTER TABLE [dbo].[Record] ADD CONSTRAINT [Record_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EditedRecord] ADD CONSTRAINT [EditedRecord_recordId_fkey] FOREIGN KEY ([recordId]) REFERENCES [dbo].[Record]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EditedRecord] ADD CONSTRAINT [EditedRecord_attendantId_fkey] FOREIGN KEY ([attendantId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EditedRecord] ADD CONSTRAINT [EditedRecord_supervisorId_fkey] FOREIGN KEY ([supervisorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Account] ADD CONSTRAINT [Account_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Session] ADD CONSTRAINT [Session_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ShiftNotification] ADD CONSTRAINT [ShiftNotification_attendantId_fkey] FOREIGN KEY ([attendantId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ShiftNotification] ADD CONSTRAINT [ShiftNotification_supervisorId_fkey] FOREIGN KEY ([supervisorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
