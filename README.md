# WhatsApp Clone

A full-stack real-time messaging application built with React Native and Node.js, featuring modern UI/UX and real-time communication capabilities.

## 📱 Download APK

**[Download Android APK](https://github.com/Mani-dev8/whatsapp-clone/blob/main/frontend/app/app-release.apk)**

## ✨ Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Secure password handling with bcrypt

### 💬 Real-time Messaging
- Instant message delivery using Socket.IO
- Message status indicators (sent, delivered, read)
- Typing indicators
- Message persistence and history

### 👥 User Management
- User search functionality
- Profile management (name, about, profile picture)
- Online/offline status tracking

### 🎯 Chat Features
- Private chat creation
- Chat list with last message preview
- Unread message counts
- Message pagination for performance
- Optimistic UI updates

### 📱 Mobile Experience
- Native React Native UI components
- Responsive design with Tailwind CSS
- Smooth animations and transitions
- Cross-platform compatibility (Android/iOS)

## 🛠️ Tech Stack

### Frontend (React Native)
- **React Native 0.79.2** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **Redux Toolkit** - State management
- **React Navigation** - Navigation system
- **Socket.IO Client** - Real-time communication
- **React Hook Form + Zod** - Form handling and validation
- **Tailwind CSS (twrnc)** - Styling
- **React Native Vector Icons** - Icon system
- **MMKV** - Fast local storage

### Backend (Node.js)
- **Express.js** - Web framework
- **TypeScript** - Type-safe server development
- **MongoDB + Mongoose** - Database and ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **TSOA** - TypeScript OpenAPI generator
- **Winston** - Logging
- **Helmet** - Security middleware

## 📋 Prerequisites

- Node.js (>= 18.0.0)
- npm or yarn
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- MongoDB instance

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Mani-dev8/whatsapp-clone.git
cd whatsapp-clone
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Configure your environment variables in .env

# Build and start the server
npm run build
npm start

# For development
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# For Android
npm run android

# For iOS
npm run ios

# Start Metro bundler
npm start
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/whatsapp-clone
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
```

### Frontend
Configure your backend URL in the API configuration files.

## 📚 API Documentation

The backend provides a comprehensive REST API with OpenAPI/Swagger documentation. Key endpoints include:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `GET /users/{userId}` - Get user by ID
- `GET /users/search/{query}` - Search users

### Chats
- `GET /chats` - Get user's chats
- `POST /chats/private` - Create private chat
- `GET /chats/{chatId}` - Get chat details
- `DELETE /chats/{chatId}` - Delete chat

### Messages
- `POST /messages` - Send message
- `GET /messages/chat/{chatId}` - Get chat messages
- `PUT /messages/{messageId}/status` - Update message status
- `DELETE /messages/{messageId}` - Delete message

## 🏗️ Project Structure

```
whatsapp-clone/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.ts
│   ├── dist/
│   │   └── api/routes/swagger.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── store/
│   │   ├── utils/
│   │   └── assets/
│   ├── app/
│   │   └── app-release.apk
│   └── package.json
│
└── README.md
```

## 🔄 Real-time Features

The application uses Socket.IO for real-time communication:

- **Message Broadcasting**: Instant message delivery to chat participants
- **Typing Indicators**: Real-time typing status updates
- **Message Status Updates**: Live delivery and read receipt updates
- **Online Status**: Real-time user presence tracking

## 📱 Screenshots & Demo

*Add screenshots of your app here*

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment
- Deploy to services like Heroku, Railway, or DigitalOcean
- Configure production environment variables
- Ensure MongoDB connection is properly configured

### Frontend Deployment
- Build APK for Android: `cd android && ./gradlew assembleRelease`
- Build for iOS: Use Xcode or `react-native run-ios --configuration Release`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mani-dev8**
- GitHub: [@Mani-dev8](https://github.com/Mani-dev8)

## 🙏 Acknowledgments

- Inspired by WhatsApp's user interface and functionality
- Built with modern React Native and Node.js best practices
- Thanks to the open-source community for the amazing tools and libraries

---

⭐ If you found this project helpful, please give it a star on GitHub!
