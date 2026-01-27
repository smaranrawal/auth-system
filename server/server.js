import { app } from "./app.js";
import { connectDB } from "./src/database/dbConnection.js";

connectDB();

app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});
