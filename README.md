# Next.js Code Generation App

This is a Next.js app that uses OpenAI's GPT-4 to automatically generate code files from prompts stored in an Airtable base. The app consists of a serverless function that fetches prompts from Airtable, generates code using OpenAI's GPT-4, and saves the code as plain text and as an attachment in Airtable.

## Table of Contents

- [Requirements](#requirements)
- [Setup](#setup)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Usage](#usage)

## Requirements

- Node.js v12 or later
- An Airtable account with API access
- An OpenAI API key (GPT-4 access)

## Setup

1. Clone the repository:

git clone https://github.com/your-username/your-repository.git
cd your-repository


2. Install the dependencies:

npm install

or

yarn


3. Create a `.env.local` file in the root directory of the project with your API keys and Airtable configuration:

OPENAI_API_KEY=your_openai_api_key_here
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
AIRTABLE_TABLE_NAME=your_airtable_table_name_here


## Configuration

Create an Airtable base with the following fields:

1. `Prompt` (Single line text) - Contains the prompt to send to ChatGPT for code generation.
2. `Code` (Long text) - Stores the generated code as plain text.
3. `Attachment` (Attachment) - Stores the generated code file as an attachment.
4. `Status` (Single select) - Tracks the status of the code generation process. Use options like "Pending", "Completed", and "Error".

## Deployment

This app is ready for deployment on [Vercel](https://vercel.com/). Follow the [deployment instructions](https://vercel.com/docs/platform/deployments) in the Vercel documentation.

1. Sign up or log in to your Vercel account.
2. Click on the "Import Project" button.
3. Choose the "From Git Repository" option and connect your Git provider (GitHub, GitLab, or Bitbucket).
4. Select the repository containing your Next.js project.
5. Vercel will automatically detect that it's a Next.js project and pre-fill the build settings. Click "Deploy" to proceed.

## Usage

1. Add prompts to your Airtable base, with each record containing a unique and descriptive prompt. Set the status to "Pending" for records you want the serverless function to process.
2. The serverless function will fetch records with "Pending" status, generate code using ChatGPT, and save the code as plain text and as an attachment in Airtable.
3. Once the code is generated, the record's status will be updated to "Completed" or "Error" based on the outcome of the code generation process.
