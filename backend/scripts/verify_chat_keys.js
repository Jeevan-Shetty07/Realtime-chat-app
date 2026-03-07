import { createClerkClient } from "@clerk/clerk-sdk-node";

// Keys provided by the user in chat
const SECRET_KEY = "sk_test_QdXjQqqmjeQ3Nikj1K6HT4zIctF7nOosJPkxS4R9fO";

const clerkClient = createClerkClient({ secretKey: SECRET_KEY });

async function verifyKeys() {
  console.log("--- Verifying Clerk Keys ---");
  console.log("Secret Key:", SECRET_KEY.substring(0, 10) + "...");
  
  try {
    const users = await clerkClient.users.getUserList({ limit: 1 });
    console.log("✅ SUCCESS: Secret Key is valid. Found", users.length, "users.");
  } catch (err) {
    console.error("❌ ERROR: Secret Key is invalid.");
    console.error("Reason:", err.message);
  }
}

verifyKeys();
