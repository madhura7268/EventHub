import { Request, Response } from "express";
import prisma from "../config/db";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    // 1. Required fields validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 3. Find user by email first (Create user or get existing)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(200).json(existingUser);
    }

    // 4. Create new user if not exists
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
