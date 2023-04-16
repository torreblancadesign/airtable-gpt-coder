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

function getFileNameFromPath(path) {
  return path.split('/').pop();
}

async function get_code_from_chatgpt(prompt) {
  try {
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

    if (response.data && response.data.choices && response.data.choices[0]) {
      const output = response.data.choices[0].text.trim();
      const [fileName, ...codeLines] = output.split('\n');
      const code = codeLines.join('\n');

      return { fileName, code };
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return { fileName: '', code: '' };
  }
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

    // Process records one by one
    const processRecord = async (index) => {
      if (index >= records.length) {
        res.status(200).json({ message: "Function executed successfully" });
        return;
      }

      const record = records[index];
      const prompt = record.get("Prompt");

      try {
        const { fileName, code } = await get_code_from_chatgpt(prompt);

        if (fileName && code) {
          // Save code as plain text
          await airtable(AIRTABLE_TABLE_NAME).update(record.id, { Code: code });
          await airtable(AIRTABLE_TABLE_NAME).update(record.id, { File_Name: fileName });

          // Update status
          await airtable(AIRTABLE_TABLE_NAME).update(record.id, { Status: "Completed" });
        } else {
          throw new Error('Empty file name or code');
        }
      } catch (error) {
        console.error(`Error processing record ${record.id}:`, error);
        await airtable(AIRTABLE_TABLE_NAME).update(record.id, { Status: "Error" });
      }

      // Process the next record
      processRecord(index + 1);
    };

    // Start processing records
    processRecord(0);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
