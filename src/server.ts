import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import eventRoutes from "./routes/event.routes";
import userRoutes from "./routes/user.routes";
import registrationRoutes from "./routes/registration.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use("/events", eventRoutes);
app.use("/users", userRoutes);
app.use("/registrations", registrationRoutes);
app.use("/register", registrationRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});