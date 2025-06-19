import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import RoomPage from './pages/RoomPage';

function App() {
  return (
   <BrowserRouter>
   <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/room/:roomCode" element={<RoomPage />} />
   </Routes>
   </BrowserRouter>
  )
}

export default App
