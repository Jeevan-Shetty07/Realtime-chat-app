import axios from "axios";
import FormData from "form-data";
import fs from "fs";

async function test() {
    try {
        const formData = new FormData();
        // Create a dummy file
        fs.writeFileSync("test.txt", "hello world");
        formData.append("file", fs.createReadStream("test.txt"));

        console.log("Attempting upload to http://localhost:5001/api/upload ...");
        const res = await axios.post("http://localhost:5001/api/upload", formData, {
            headers: {
                ...formData.getHeaders(),
                // We need a token here, but let's see if it even reaches the server
                "Authorization": "Bearer TEST_TOKEN"
            }
        });
        console.log("Res:", res.data);
    } catch (err) {
        console.error("❌ Link failed:", err.response?.data || err.message);
    } finally {
        if (fs.existsSync("test.txt")) fs.unlinkSync("test.txt");
    }
}

test();
