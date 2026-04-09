import express from "express";
import { authMiddleware } from "./middleware.js";
import { JWT_SECRET } from '@repo/backend-common';
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";
import { CreateUserSchema, SigninSchema } from '@repo/common';
import "dotenv/config";

const app = express();
const port = 3000;

app.use(express.json());

app.post("/signup", async (req, res) => {
  try {

    
    const result = CreateUserSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const { username, password, name, email, avatar } = result.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        avatar
      }
    });

    res.json({
      message: "User created successfully",
      data: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        avatar: createdUser.avatar
      }
    });

  } catch (err) {
   
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/signin", async (req, res) => {

  try {

    const result = SigninSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const { username, password } = result.data;

    const user = await prisma.user.findUnique({ where: { username: username } });

    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

    res.json({ token });  
   

    
    
  } catch (error) {
    
    return res.status(500).json({ error: "Internal server error" });

  }
  
});

app.post('/room', authMiddleware, (req, res) => {

  res.json({ roomId: "1234" });

});


app.listen(port, () => {
  console.log(`HTTP backend is running at http://localhost:${port}`);
});