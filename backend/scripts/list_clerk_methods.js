import { createClerkClient } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";
dotenv.config();

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

console.log("ClerkClient keys:", Object.keys(clerkClient));
// Also check if verifyJwt is on the prototype or something
console.log("ClerkClient methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(clerkClient)));
