# ScriptFlow

## Getting Started

Follow these steps to set up and run the project:

### 1. Environment Setup

Create a `.env.local` file in the root directory with the following content:

```
MONGODB_URI=
OPENAI_API_KEY=your_api_key
GOOGLE_API_KEY=your_api_key
```

### 2. API Key Configuration

#### Google API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key" and create a new API key
3. Copy the generated key and replace `your_api_key` in the `.env.local` file


### 3. Running the Application

To start the development server:

```bash
npm run dev
```
