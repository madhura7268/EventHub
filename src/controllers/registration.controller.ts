import { Request, Response } from "express";
import prisma from "../config/db";

export const getRegistrations = async (req: Request, res: Response) => {
  try {
    const registrations = await prisma.registration.findMany({
      include: {
        user: true,
        event: true,
      },
    });
    return res.status(200).json(registrations);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getRegistrationsByEmail = async (req: Request, res: Response) => {
  try {
    const email = req.params["email"] as string;

    // 1. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required",
      });
    }

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email address",
      });
    }

    // 3. Fetch all registrations for this user including event details
    const registrations = await prisma.registration.findMany({
      where: { userId: user.id },
      include: {
        event: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(registrations);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const createRegistration = async (req: Request, res: Response) => {
  try {
    const { userId, eventId } = req.body;

    // 1. Required fields validation
    if (userId === undefined || eventId === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId and eventId are required",
      });
    }

    const parsedUserId = Number(userId);
    const parsedEventId = Number(eventId);

    if (isNaN(parsedUserId) || isNaN(parsedEventId)) {
      return res.status(400).json({
        success: false,
        message: "userId and eventId must be valid integers",
      });
    }

    // 2. Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parsedUserId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: parsedEventId },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // 4. Prevent duplicate registrations
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId: parsedUserId,
          eventId: parsedEventId,
        },
      },
    });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: "User is already registered for this event",
      });
    }

    // 5. Check event capacity
    const registrationCount = await prisma.registration.count({
      where: { eventId: parsedEventId },
    });

    if (registrationCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: "Event is full. Capacity has been reached.",
      });
    }

    // 6. Create registration
    const registration = await prisma.registration.create({
      data: {
        userId: parsedUserId,
        eventId: parsedEventId,
      },
      include: {
        user: true,
        event: true,
      },
    });

    return res.status(201).json(registration);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
