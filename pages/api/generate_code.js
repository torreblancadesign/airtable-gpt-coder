import Airtable from "airtable";
import axios from "axios";
import FormData from "form-data";
import { Readable } from "stream";
import cloudinary from 'cloudinary';


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function get_code_from_chatgpt(prompt) {
  const response = await axios.post(
    "https://api.openai.com/v1/engines/text-davinci-003/completions",
    {
      prompt: `Please provide the file name and the code for the following requirement:\n\n${prompt}\n\nFile name: `,
      max_tokens: 200,
      n: 1,
      stop: null,
      temperature: 0.7,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const output = response.data.choices[0].text.trim();
  const [fileName, ...codeLines] = output.split('\n');
  const code = codeLines.join('\n');

  return { fileName, code };
}

/*
async function uploadToCloudinary(fileContent, fileName) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const base64EncodedContent = Buffer.from(fileContent).toString('base64');
  const response = await cloudinary.v2.uploader.upload(`data:text/plain;base64,${base64EncodedContent}`, {
    resource_type: 'raw',
    public_id: fileName,
  });

  return response.secure_url;
}

*/



export default async function handler(req, res) {
  try {
    const records = await airtable(AIRTABLE_TABLE_NAME).select({ view: "Pending" }).all();

   for (const record of records) {
  const prompt = record.get("Prompt");

  try {
    const { fileName, code } = await get_code_from_chatgpt(prompt);

    // Save code as plain text
    await airtable(AIRTABLE_TABLE_NAME).update(record.id, { Code: code });
    await airtable(AIRTABLE_TABLE_NAME).update(record.id, { File_Name: fileName });

    // Save code as attachment
  //  const file_url = await uploadToCloudinary(code, fileName);
  // await airtable(AIRTABLE_TABLE_NAME).update(record.id, { Attachment: [{ url: file_url }], Url: file_url });

    // Update status
    await airtable(AIRTABLE_TABLE_NAME).update(record.id, { Status: "Completed" });
  } catch (error) {
    console.error(`Error processing record ${record.id}:`, error);
    await airtable(AIRTABLE_TABLE_NAME).update(record.id, { Status: "Error" });
  }
}



    res.status(200).json({ message: "Function executed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
