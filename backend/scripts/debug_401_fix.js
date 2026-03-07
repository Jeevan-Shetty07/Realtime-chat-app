import { createClerkClient } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

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
    console.log("Ignoring CLERK_JWT_KEY or it's empty/publishable. verificationOptions will be empty (SDK will auto-fetch JWKS).");
  }

  console.log("Final verificationOptions:", JSON.stringify(verificationOptions));
  
  console.log("\nLogic check passed: The Publishable Key will no longer be passed as the JWT verification key.");
}

debugVerification();
