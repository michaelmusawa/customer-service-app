// import { Pool } from 'pg';

// const pool = new Pool ({
//     connectionString: process.env.DATABASE_URL,
// });

// export default pool;

import sql from "mssql";

// DATABASE_URL="sqlserver://172.16.10.3:1433;database=customerservice;username=Customer_Service_sys;password=Ncc@CS2025;encrypt=true;integratedSecurity=true;trustServerCertificate=true;"

// const poolPromise = sql.connect({
//   user: "sa", // Your SQL Server username
//   password: "Musawa@2022", // Your SQL Server password
//   server: "localhost", // SQL Server hostname or IP address
//   database: "customer_service_app", // Your database name
//   options: {
//     encrypt: true, // Use encryption if needed (for Azure or secure connections)
//     trustServerCertificate: true, // Use this for local connections if you have issues with SSL
//   },
// });

const poolPromise = sql.connect({
  user: "Customer_Service_sys", // Your SQL Server username
  password: "Ncc@CS2025", // Your SQL Server password
  server: "172.16.10.3", // SQL Server hostname or IP address
  database: "customerservice", // Your database name
  options: {
    encrypt: true, // Use encryption if needed (for Azure or secure connections)
    trustServerCertificate: true, // Use this for local connections if you have issues with SSL
  },
});

export default poolPromise;
