import axios from 'axios';
import { airtable } from '../../utils/airtable';
// Import any other helper functions you need

async function createRepoAndUploadFiles(repoName, files, githubToken) {
  // Create the GitHub repository
  const response = await axios.post(
    'https://api.github.com/user/repos',
    { name: repoName },
    {
      headers: {
        'Authorization': `token ${githubToken}`,
      },
    }
  );

  const repoUrl = response.data.html_url;
  console.log(`Repository created: ${repoUrl}`);

  // Upload files to the repository
  for (const file of files) {
    const { fileName, fileContent } = file;

    await axios.put(
      `https://api.github.com/repos/${response.data.full_name}/contents/${fileName}`,
      {
        message: `Add ${fileName}`,
        content: Buffer.from(fileContent).toString('base64'),
      },
      {
        headers: {
          'Authorization': `token ${githubToken}`,
        },
      }
    );
  }

  console.log('Files uploaded to the repository');
}

async function getFilesFromAirtable() {
  // Fetch files from Airtable
  const airtableRecords = await airtable('Code Files').select().all();

  // Extract file names and content from Airtable records
  const files = airtableRecords.map(record => {
    const fileName = record.get('File Name');
    const fileSubfolder = record.get('Subfolder');

    return {
      fileName: fileSubfolder ? `${fileSubfolder}/${fileName}` : fileName,
      fileContent: record.get('Code'),
    };
  });

  return files;
}

async function handler(req, res) {
  const repoName = 'my-nextjs-app';
  const githubToken = process.env.GITHUB_TOKEN; // Store your GitHub PAT in an environment variable
  const files = await getFilesFromAirtable();

  try {
    await createRepoAndUploadFiles(repoName, files, githubToken);
    res.status(200).json({ message: 'Repository created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

export default handler;