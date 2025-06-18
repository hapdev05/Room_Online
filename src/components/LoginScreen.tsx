
import { Card, CardContent } from "@/components/ui/card"
import { Video } from "lucide-react"
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface GoogleUser {
  email: string
  name: string
  picture: string
  sub: string
}

interface User {
  email: string
  name: string
  picture?: string
  id: string
}

interface LoginScreenProps {
  onLogin: (user: User) => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const handleGoogleSuccess = (credentialResponse: any) => {
    try {
      const decoded = jwtDecode<GoogleUser>(credentialResponse.credential!);
      const user: User = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        id: decoded.sub
      };
      console.log(user);
      
      onLogin(user);
    } catch (error) {
      console.error("Error decoding JWT:", error);
    }
  };

  const handleGoogleError = () => {
    console.log('Google Login Failed');
  };
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Video className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-normal text-gray-700">Meet</span>
          </div>
          <h1 className="text-2xl font-normal text-gray-900 mb-2">Đăng nhập để tham gia cuộc họp</h1>
          <p className="text-gray-600">Bạn cần đăng nhập trước khi có thể tham gia cuộc họp video</p>
        </div>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Tìm hiểu thêm về{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Google Meet
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 