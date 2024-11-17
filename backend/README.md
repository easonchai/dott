# Serverless API Starter

This repository provides a basic starter setup for deploying serverless functions on Vercel. It includes an `/api` directory with a sample endpoint (`hello.js`) that returns a simple JSON message.

## Getting Started

### Step-by-Step Setup

1. **Sign Up or Log In** to [Vercel](https://vercel.com/) for hosting.
2. **Fork this Repository**:

   - Clone the [Serverless API Starter repository](https://github.com/divyaran7an/serverless-api-starter).
   - Push it to your GitHub account.

3. **Create a New Project on Vercel**:

   - Go to your Vercel dashboard, click on "New Project," and connect it to your forked GitHub repo.
   - Deploy the repo on Vercel.

4. **Access Your API**:

   - Once deployed, your API will be live at:
     ```
     https://<your-project-name>.vercel.app/api/hello
     ```
   - This endpoint returns a basic JSON response:
     ```json
     { "message": "Hello from Vercel!" }
     ```

5. **Modify the API as Needed**:
   - Navigate to the `/api` directory.
   - Add or modify files based on your functionality requirements. Each file in `/api` becomes a separate endpoint.

### Dependencies

The project includes the following dependencies:

- `axios`
- `express`

### Example Endpoint Code

Here’s the code from `api/hello.js`:

```javascript
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello from Vercel!' });
```
