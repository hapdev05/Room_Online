import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import RoomPage from './pages/RoomPage';
import DebugEnv from './components/DebugEnv';

function App() {
  return (
   <BrowserRouter>
    <DebugEnv />
    <Routes>
     <Route path="/" element={<Login />} />
     <Route path="/room/:roomCode" element={<RoomPage />} />
    </Routes>
   </BrowserRouter>
  )
}

export default App
