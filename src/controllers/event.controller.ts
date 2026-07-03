import { Request, Response } from "express";
import prisma from "../config/db";

export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany();

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, venue, date, capacity } = req.body;

    // 1. Required fields validation
    if (!title || !description || !venue || !date || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields (title, description, venue, date, capacity) are required",
      });
    }

    // 2. Capacity validation
    const parsedCapacity = Number(capacity);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Event capacity must be a positive number greater than 0",
      });
    }

    // 3. Date validation
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid event date format",
      });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        venue,
        date: parsedDate,
        capacity: parsedCapacity,
      },
    });

    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};