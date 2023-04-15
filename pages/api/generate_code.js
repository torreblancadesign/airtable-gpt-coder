import Airtable from "airtable";
import axios from "axios";
import FormData from "form-data";
import { Readable } from "stream";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function get_code_from_chatgpt(prompt) {
  const response = await axios.post(
    "https://api.openai.com/v1/engines/davinci-codex/completions",
    {
      prompt: prompt,
      max_tokens: 100,
      n: 1,
      stop: null,
      temperature: 0.5,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  const generated_code = response.data.choices[0].text.trim();
  return generated_code;
}

async function upload_to_fileio(fileContent, fileName) {
  const formData = new FormData();
  formData.append('file', fileContent, fileName);

  const response = await axios.post('https://file.io/', formData, {
    headers: {
      ...formData.getHeaders(),
    },
  });

  if (response.status !== 200) {
    throw new Error(`Failed to upload file to File.io: ${response.statusText}`);
  }

  return response.data.link;
}


export default async function handler(req, res) {
  try {
    const records = await airtable(AIRTABLE_TABLE_NAME).select({ view: "Pending" }).all();

    for (const record of records) {
      const prompt = record.get("Prompt");

      try {
        const generated_code = await get_code_from_chatgpt(prompt);

        // Save code as plain text
        await airtable(AIRTABLE_TABLE_NAME).update(record.id, { Code: generated_code });

        // Save code as attachment
        const file_name = `${record.id}_generated_code.txt`;
        const file_url = await upload_to_fileio(generated_code, file_name);
        await airtable(AIRTABLE_TABLE_NAME).update(record.id, { Attachment: [{ url: file_url }] });

        // Update status
        await airtable(AIRTABLE_TABLE_NAME).update(record.id, { Status: "Completed" });
      } catch (error) {
        console.error(`Error processing record ${record.id}: ${error.message}`);
        await airtable(AIRTABLE_TABLE_NAME).update(record.id, { Status: "Error" });
      }
    }

    res.status(200).json({ message: "Function executed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
