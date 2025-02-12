# BAAssistant

## Overview

BAAssistant is a chat-centric application designed to assist users in generating and managing documentation through AI interactions. The web app integrates various AI models for helping businesses with digital transformation documentation tasks.

## Features

- **AI Model Information**: Displays details about various AI model providers like DeepSeek, OpenAI, and more.
- **Project Management**: Create, view, update, and delete projects, each having their generated documents and reports.
- **Document Template Library**: Access and manage a library of document templates with AI-generated content.
- **Interactive Chat**: Engage with an AI-powered chat interface to generate and refine documents real-time.
- **Document Organization**: 
  - Organize documents by projects
  - View document types and creation time
  - Track associated chat messages for each document
  - Quick access to related chat histories
- **Persistent Storage**: Utilizes Supabase for storing and retrieving projects, chats, messages, and templates.

## Technology Stack

- **Frontend**: 
  - React with React Router for navigation
  - Styled Components for styling
  - React Icons for UI elements
  - React Hot Toast for notifications
- **Backend**: 
  - Supabase for database and authentication
  - Custom views for optimized data queries
- **Build Tool**: Vite
- **State Management**: React Context API

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/baassistant.git
   ```
2. Navigate into the directory:
   ```bash
   cd baassistant
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Run the application:
   ```bash
   npm run dev
   ```

## Usage

- Access the app at `http://localhost:3000` after running `npm run dev`
- Navigate through the sidebar to access various features:
  - Library: Browse and manage document templates
  - Chat: Interact with AI to generate content
  - Docs: Organize and manage your documents
  - Projects: Group related documents together

## Database Structure

- **docs_with_message_count**: A view that combines document information with their associated chat message counts
- Tables include projects, documents, chats, and messages with proper relationships

## Contributing

Contributions are welcome! Please fork the repository and use a feature branch for your changes. Please open a Pull Request to merge changes.

## License

This project is licensed under the MIT License.