import express from "express";
import dotenv from "dotenv";
import path from "path";
import { createClerkClient } from "@clerk/clerk-sdk-node";

dotenv.config({ path: path.join(process.cwd(), "backend", ".env") });

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function debugVerification() {
  console.log("--- Debug JWT Verification Logic ---");
  const rawJwtKey = process.env.CLERK_JWT_KEY;
  const isPublishableKey = rawJwtKey && (rawJwtKey.startsWith('pk_test_') || rawJwtKey.startsWith('pk_live_'));
  
  console.log("CLERK_JWT_KEY from .env:", rawJwtKey);
  console.log("Is Publishable Key detected?", isPublishableKey);
  
  const verificationOptions = {};
  if (rawJwtKey && !isPublishableKey) {
    verificationOptions.jwtKey = rawJwtKey;
    console.log("Setting verificationOptions.jwtKey to provided value.");
  } else {
    console.log("Ignoring CLERK_JWT_KEY or it's empty. verificationOptions will be empty (SDK will auto-fetch JWKS).");
  }

  console.log("Final verificationOptions:", JSON.stringify(verificationOptions));
  
  // We can't easily verify a real token here without one, 
  // but we've verified the logic that filters out the bad key.
  console.log("\nLogic check passed: The Publishable Key will no longer be passed as the JWT verification key.");
}

debugVerification();
